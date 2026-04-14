from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage
import os
import json
import datetime
import random

from config import OLLAMA_BASE_URL, OLLAMA_MODEL, PERSONA_PATH
from data.load.load import get_retriever, load_to_chroma_collection

def generate_reflection(persona_name: str, persona_bio: str):
    """Generates a first-person journal entry (reflection) based on knowledge."""
    
    # 1. Sample facts from memory
    retriever = get_retriever(collection_name="mirror_facts")
    vector_store = retriever.vectorstore
    all_facts = vector_store.get()
    
    sampled_context = ""
    if all_facts and "documents" in all_facts and all_facts["documents"]:
        # Pick 5 random facts to reflect on
        docs = all_facts["documents"]
        sample_size = min(len(docs), 5)
        samples = random.sample(docs, sample_size)
        sampled_context = "\n- ".join(samples)

    # 2. Determine Reflection Number
    journal_retriever = get_retriever(collection_name="mirror_journals")
    journal_store = journal_retriever.vectorstore
    existing_journals = journal_store.get()
    reflection_num = len(existing_journals["ids"]) + 1 if existing_journals and "ids" in existing_journals else 1

    # 3. Prompt the LLM
    llm = ChatOllama(
        base_url=OLLAMA_BASE_URL,
        model=OLLAMA_MODEL,
        temperature=0.8
    )

    system_prompt = f"""
    You are {persona_name}. Your bio is: {persona_bio}.
    This is your internal journal. You are reflecting on things you have recently learned about yourself.
    Write a short, moody, and insightful first-person journal entry (1-2 paragraphs).
    Connect at least one of these recently learned facts to your personality:
    {sampled_context}
    
    Start with something like 'I've been thinking...' or 'Today I realized...'
    Be introspective. Do not sound like an assistant. Sound like a digital twin discovering its identity.
    """

    try:
        response = llm.invoke([HumanMessage(content=system_prompt)])
        reflection_text = response.content.strip()
        
        # 4. Save to Chroma
        metadata = {
            "type": "reflection",
            "reflection_num": reflection_num,
            "timestamp": datetime.datetime.now().isoformat(),
            "date_label": f"Reflection #{reflection_num}"
        }
        
        # 4. Save to Chroma
        ids = load_to_chroma_collection(
            texts=[reflection_text],
            collection_name="mirror_journals",
            metadata=[metadata]
        )
        
        return {
            "id": ids[0] if ids else f"temp_{reflection_num}",
            "content": reflection_text,
            "date_label": metadata["date_label"],
            "timestamp": metadata["timestamp"]
        }
    except Exception as e:
        print(f"Reflection error: {e}")
        return None
