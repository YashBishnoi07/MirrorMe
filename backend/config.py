import os
from dotenv import load_dotenv

load_dotenv()

# Ollama Config
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "tinyllama")
OLLAMA_VISION_MODEL = os.getenv("OLLAMA_VISION_MODEL", "moondream")

# API Keys (Optional if using Ollama)
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM") # Default Rachel voice

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data", "local")
CHROMA_DIR = os.path.join(DATA_DIR, "chroma")
PERSONA_PATH = os.path.join(DATA_DIR, "persona.json")
VOICE_DIR = os.path.join(DATA_DIR, "voice")

# Ensure directories exist
os.makedirs(CHROMA_DIR, exist_ok=True)
os.makedirs(VOICE_DIR, exist_ok=True)

# Voice Config
EDGE_VOICE = "en-US-AvaNeural"  # High-quality female voice

# Persona Config
DEFAULT_MIRROR_NAME = "Yash"
DEFAULT_SYSTEM_PROMPT = """You are an AI mirroring {name}. 
Your goal is to represent {name}'s facts, beliefs, and speaking style based on the provided context.
Use the first-person "I" when responding. 
If you don't know something about {name}, state that you aren't sure yet.
Keep responses concise and helpful."""
