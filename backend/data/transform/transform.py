from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os
import sys

# Add parent to path for config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import OLLAMA_BASE_URL, OLLAMA_MODEL

def transform_to_facts(raw_text: str) -> str:
    """Transforms raw text into a series of one-sentence facts using local Ollama, with chunking for large files."""
    if not raw_text or len(raw_text.strip()) < 10:
        return ""
    
    # Initialize Ollama LLM
    llm = OllamaLLM(
        base_url=OLLAMA_BASE_URL,
        model=OLLAMA_MODEL
    )
    
    prompt = ChatPromptTemplate.from_template("""
    The purpose of this model is to take raw text about a person (like a resume, bio, or social media feed)
    and turn it into a high-density list of single-sentence facts about them. 
    Each fact should be a complete sentence and stand on its own.
    
    Examples:
    - Yash is a computer science student based in Mumbai.
    - He has experience building AI agents using LangChain.
    - He recently completed a project in real estate analytics.
    
    Input: {text}
    
    Output (Facts):
    """)
    
    chain = prompt | llm | StrOutputParser()
    
    all_facts = []
    
    # Chunking parameters
    CHUNK_SIZE = 4000
    OVERLAP = 200
    
    # Process text in chunks
    start = 0
    total_len = len(raw_text)
    
    print(f"Starting transformation for document of length {total_len}")
    
    while start < total_len:
        end = min(start + CHUNK_SIZE, total_len)
        chunk = raw_text[start:end]
        
        try:
            print(f"Processing chunk {start} to {end}...")
            facts = chain.invoke({"text": chunk})
            if facts:
                # Add only new facts
                all_facts.append(facts.strip())
        except Exception as e:
            print(f"Error in transformation for chunk {start}-{end}: {e}")
            
        if end == total_len:
            break
        start = end - OVERLAP
        
    return "\n".join(all_facts)
