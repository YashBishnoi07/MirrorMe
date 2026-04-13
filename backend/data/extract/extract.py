import requests
from bs4 import BeautifulSoup
from langchain_community.document_loaders import PyPDFLoader, UnstructuredFileLoader, TextLoader
import os
from agent.vision_model import analyze_image

def extract_from_url(url: str) -> str:
    """Extracts text from a given URL."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'lxml')
        
        # Remove script and style elements
        for s in soup(["script", "style"]):
            s.decompose()
            
        text = soup.get_text()
        # Break into lines and remove leading/trailing space
        lines = (line.strip() for line in text.splitlines())
        # Break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        # Drop blank lines
        return '\n'.join(chunk for chunk in chunks if chunk)
    except Exception as e:
        return f"Error extracting from URL: {str(e)}"

def extract_from_file(file_path: str) -> str:
    """Extracts text from local files (PDF, TXT, DOCX), with safety checks."""
    if not os.path.exists(file_path):
        return f"Error: File {file_path} not found."
    
    # Check file size (e.g., limit to 50MB for local RAM health)
    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if file_size_mb > 50:
        return f"Error: File is too large ({file_size_mb:.2f}MB). Limit is 50MB."

    print(f"Extracting text from {file_path} ({file_size_mb:.2f}MB)...")
    ext = os.path.splitext(file_path)[1].lower()
    
    try:
        if ext == ".pdf":
            loader = PyPDFLoader(file_path)
            docs = loader.load()
            text = "\n".join([doc.page_content for doc in docs])
        elif ext == ".txt":
            loader = TextLoader(file_path)
            docs = loader.load()
            text = "\n".join([doc.page_content for doc in docs])
        elif ext in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]:
            # Process as an image using the vision model
            print(f"Analyzing image content for memory: {file_path}")
            text = analyze_image(file_path, mode="describe")
        else:
            loader = UnstructuredFileLoader(file_path)
            docs = loader.load()
            text = "\n".join([doc.page_content for doc in docs])
            
        print(f"Successfully extracted {len(text)} characters.")
        return text
    except Exception as e:
        print(f"Extraction error: {str(e)}")
        return f"Error extracting from file: {str(e)}"
