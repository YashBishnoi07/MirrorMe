from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
import uvicorn
import json
from typing import Optional, List
from fastapi.staticfiles import StaticFiles

from config import DATA_DIR, DEFAULT_MIRROR_NAME, PERSONA_PATH
from data.extract.extract import extract_from_file, extract_from_url
from data.transform.transform import transform_to_facts
from data.load.load import load_to_chroma, get_retriever
from agent.mirror_agent import get_mirror_executor
from agent.analyzer import analyze_persona_style
from agent.voice import get_speech_url
from agent.vision_model import analyze_image
from agent.reflector import generate_reflection
from agent.search import web_search, is_search_needed
from agent.sessions import get_sessions_index, get_file_history, update_session_metadata, delete_session, rename_session

app = FastAPI(title="MirrorMe API")

from config import DATA_DIR, DEFAULT_MIRROR_NAME, PERSONA_PATH, VOICE_DIR

# Mount static files for audio
app.mount("/audio", StaticFiles(directory=VOICE_DIR), name="audio")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    mirror_name: str = DEFAULT_MIRROR_NAME

class ChatResponse(BaseModel):
    answer: str
    searching: bool = False

class IngestRequest(BaseModel):
    url: Optional[str] = None
    text: Optional[str] = None

class FactUpdate(BaseModel):
    content: str

class Persona(BaseModel):
    name: str
    bio: str

class RenameRequest(BaseModel):
    title: str

@app.post("/chat", response_model=ChatResponse)
async def chat(
    message: str = Form(...),
    session_id: str = Form("default"),
    mirror_name: str = Form(DEFAULT_MIRROR_NAME),
    image: Optional[UploadFile] = File(None)
):
    try:
        # Load persona if it exists to get the actual name for the agent
        persona_name = mirror_name
        persona_bio = ""
        if os.path.exists(PERSONA_PATH):
            with open(PERSONA_PATH, "r") as f:
                data = json.load(f)
                persona_name = data.get("name", persona_name)
                persona_bio = data.get("bio", "")

        # If there's an image, we handle it as a vision request (Eyes + Brain)
        final_message = message
        
        # Check if we should automatically search the web for fresh info
        is_searching = False
        if is_search_needed(message):
            print(f"Automatic search triggered for: {message}")
            search_results = web_search(message)
            final_message = f"[System: External Web Search Results:\n{search_results}]\n\nUser Question: {message}"
            is_searching = True

        if image:
            # Save image for processing
            image_path = os.path.join(DATA_DIR, f"chat_{image.filename}")
            with open(image_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            
            print(f"Vision detection (Moondream) for: {image.filename}...")
            vision_analysis = analyze_image(image_path, mode="critique")
            final_message = f"[System: The user attached an image. Here is your visual analysis of it: {vision_analysis}]\n\nUser Question: {final_message if is_searching else message}"

        # Standard Text Chat (RAG + TinyLlama)
        executor = get_mirror_executor(session_id, persona_name, persona_bio)
        result = executor.invoke(
            {"input": final_message},
            config={"configurable": {"session_id": session_id}}
        )
        
        # Update session metadata (Last Active)
        # If it's a very short history, generate a title
        history = get_file_history(session_id)
        messages_in_history = history.messages
        if len(messages_in_history) <= 2: # User + AI
            title = message[:30] + "..." if len(message) > 30 else message
            update_session_metadata(session_id, title=title)
        else:
            update_session_metadata(session_id)

        return ChatResponse(answer=result["answer"], searching=is_searching)
    except Exception as e:
        print(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

def run_ingestion(file_path: Optional[str] = None, url: Optional[str] = None):
    """Background task for ETL processing."""
    try:
        if file_path:
            raw_text = extract_from_file(file_path)
            source = os.path.basename(file_path)
        elif url:
            raw_text = extract_from_url(url)
            source = url
        else:
            return

        facts = transform_to_facts(raw_text)
        if facts:
            load_to_chroma(facts)
            print(f"Successfully ingested {source}")
        else:
            print(f"No facts generated for {source}")
    except Exception as e:
        print(f"Background ingestion error for {file_path or url}: {str(e)}")

@app.post("/ingest/file")
def ingest_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # Save file
    file_path = os.path.join(DATA_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Run ETL in background
    background_tasks.add_task(run_ingestion, file_path=file_path)
    return {"message": "Ingestion started in background", "filename": file.filename}

@app.post("/ingest/url")
def ingest_url(background_tasks: BackgroundTasks, request: IngestRequest):
    if not request.url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    # Run ETL in background
    background_tasks.add_task(run_ingestion, url=request.url)
    return {"message": "URL ingestion started in background", "url": request.url}

@app.get("/persona")
async def get_persona():
    if os.path.exists(PERSONA_PATH):
        with open(PERSONA_PATH, "r") as f:
            return json.load(f)
    return {"name": DEFAULT_MIRROR_NAME, "bio": ""}

@app.post("/persona")
def save_persona(persona: Persona):
    with open(PERSONA_PATH, "w") as f:
        json.dump(persona.dict(), f)
    return {"message": "Persona saved successfully"}

@app.post("/persona/analyze")
def analyze_persona():
    """Analyzes the current knowledge base to suggest a persona bio."""
    suggestion = analyze_persona_style()
    return {"suggestion": suggestion}

@app.post("/speak")
async def speak(request: FactUpdate):
    """Converts text to speech and returns the audio URL."""
    filename = await get_speech_url(request.content)
    if filename:
        return {"url": f"http://127.0.0.1:8000/audio/{filename}"}
    raise HTTPException(status_code=500, detail="Speech generation failed")

@app.get("/facts")
async def get_facts():
    try:
        retriever = get_retriever()
        vector_store = retriever.vectorstore
        results = vector_store.get()
        
        # Format for frontend
        facts = []
        if results and "documents" in results:
            for i in range(len(results["documents"])):
                facts.append({
                    "id": results["ids"][i],
                    "content": results["documents"][i]
                })
        return {"facts": facts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching facts: {str(e)}")

@app.delete("/facts/{fact_id}")
async def delete_fact(fact_id: str):
    try:
        retriever = get_retriever()
        vector_store = retriever.vectorstore
        vector_store.delete(ids=[fact_id])
        return {"message": "Fact deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting fact: {str(e)}")

@app.patch("/facts/{fact_id}")
async def update_fact(fact_id: str, fact_update: FactUpdate):
    try:
        retriever = get_retriever()
        vector_store = retriever.vectorstore
        # Chroma update requires IDs and documents
        vector_store.update_documents(ids=[fact_id], documents=[fact_update.content])
        return {"message": "Fact updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating fact: {str(e)}")

@app.get("/health")
def health():
    return {"status": "MirrorMe Backend Alive"}

@app.get("/journals")
async def get_journals():
    try:
        retriever = get_retriever(collection_name="mirror_journals")
        vector_store = retriever.vectorstore
        results = vector_store.get()
        
        journals = []
        if results and "documents" in results:
            for i in range(len(results["documents"])):
                meta = results["metadatas"][i]
                journals.append({
                    "id": results["ids"][i],
                    "content": results["documents"][i],
                    "date_label": meta.get("date_label", "Reflection"),
                    "timestamp": meta.get("timestamp", "")
                })
        
        # Sort by timestamp (newest first)
        journals.sort(key=lambda x: x["timestamp"], reverse=False) # Oldest first for timeline? No, newest for list.
        return {"journals": journals}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/journals/reflect")
async def trigger_reflection():
    try:
        # Load persona
        persona_name = DEFAULT_MIRROR_NAME
        persona_bio = ""
        if os.path.exists(PERSONA_PATH):
            with open(PERSONA_PATH, "r") as f:
                data = json.load(f)
                persona_name = data.get("name", persona_name)
                persona_bio = data.get("bio", "")
        
        reflection = generate_reflection(persona_name, persona_bio)
        if reflection:
            return reflection
        raise HTTPException(status_code=500, detail="Failed to generate reflection")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sessions")
async def list_sessions():
    return {"sessions": get_sessions_index()}

@app.get("/sessions/{session_id}/history")
async def get_history(session_id: str):
    history = get_file_history(session_id)
    messages = []
    for m in history.messages:
        role = "user" if m.type == "human" else "mirror"
        messages.append({"role": role, "content": m.content})
    return {"messages": messages}

@app.delete("/sessions/{session_id}")
async def remove_session(session_id: str):
    delete_session(session_id)
    return {"status": "deleted"}

@app.patch("/sessions/{session_id}")
async def rename_chat(session_id: str, request: RenameRequest):
    new_title = request.title
    if not new_title:
        raise HTTPException(status_code=400, detail="Title is required")
    rename_session(session_id, new_title)
    # Return fresh sessions immediately
    return {"sessions": get_sessions_index()}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
