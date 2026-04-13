from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
import os
import sys

# Add parent to path for config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import OLLAMA_BASE_URL, OLLAMA_MODEL, CHROMA_DIR

def analyze_persona_style() -> str:
    """Analyzes ingested facts to deduce personality and writing style."""
    
    # 1. Fetch facts from Chroma
    try:
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        vector_store = Chroma(
            persist_directory=CHROMA_DIR,
            embedding_function=embeddings,
            collection_name="mirror_facts"
        )
        
        # Get a diverse sample of documents (up to 50)
        results = vector_store.get(limit=50)
        if not results or not results["documents"]:
            return "Professional, clear, and focused. (Add more documents for a personalized analysis!)"
            
        facts_sample = "\n".join(results["documents"])
    except Exception as e:
        print(f"Error accessing vault for analysis: {e}")
        return "Professional and helpful."

    # 2. Setup Analysis LLM
    llm = OllamaLLM(
        base_url=OLLAMA_BASE_URL,
        model=OLLAMA_MODEL
    )
    
    # "Balance" prompt: personality + writing style
    prompt = ChatPromptTemplate.from_template("""
    You are a psychology and linguistics expert. 
    Analyze the following facts about a person to determine their personality traits AND their writing/speaking style.
    
    FACTS:
    {facts}
    
    Based on these facts, create a concise 2-3 sentence "Mirror Persona Guide".
    - Focus on their vibe (e.g., confident, empathetic, technical).
    - Focus on their language (e.g., uses short sentences, formal vocabulary, or casual slang).
    - Output ONLY the 2-3 sentence guide. Do not include labels like "Personality:" or "Style:".
    
    GUIDE:
    """)
    
    chain = prompt | llm | StrOutputParser()
    
    try:
        analysis = chain.invoke({"facts": facts_sample})
        return analysis.strip()
    except Exception as e:
        print(f"Error during style analysis: {e}")
        return "Insightful, professional, and clear."
