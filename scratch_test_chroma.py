import os
import sys

# Move to the backend directory to match the structure
os.chdir("backend") 
sys.path.append(os.getcwd())

from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from config import CHROMA_DIR

def test_get_facts():
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    if not os.path.exists(CHROMA_DIR):
        print(f"Chroma dir {CHROMA_DIR} does not exist.")
        return
        
    vector_store = Chroma(
        persist_directory=CHROMA_DIR,
        embedding_function=embeddings,
        collection_name="mirror_facts"
    )
    
    results = vector_store.get()
    print(f"Found {len(results['documents'])} facts.")
    for doc in results['documents'][:5]:
        print(f"- {doc}")

if __name__ == "__main__":
    test_get_facts()
