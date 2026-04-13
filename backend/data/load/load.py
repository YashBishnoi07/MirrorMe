from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
import os
import sys

# Add parent to path for config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import CHROMA_DIR

def load_to_chroma(facts_text: str):
    """Loads facts into ChromaDB with local embeddings."""
    if not facts_text or len(facts_text.strip()) < 5:
        return None
    
    # Using local embeddings (no API key needed)
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    # Split text by lines (each line is a fact)
    facts = [f.strip() for f in facts_text.split('\n') if f.strip()]
    
    vector_store = Chroma.from_texts(
        texts=facts,
        embedding=embeddings,
        persist_directory=CHROMA_DIR,
        collection_name="mirror_facts"
    )
    
    return vector_store

def get_retriever(collection_name: str = "mirror_facts"):
    """Returns a retriever for the specified Chroma collection."""
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vector_store = Chroma(
        persist_directory=CHROMA_DIR,
        embedding_function=embeddings,
        collection_name=collection_name
    )
    return vector_store.as_retriever(search_kwargs={"k": 5})

def load_to_chroma_collection(texts: list, collection_name: str, metadata: list = None):
    """Generic loader for any Chroma collection."""
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vector_store = Chroma.from_texts(
        texts=texts,
        embedding=embeddings,
        persist_directory=CHROMA_DIR,
        collection_name=collection_name,
        metadatas=metadata
    )
    return vector_store
