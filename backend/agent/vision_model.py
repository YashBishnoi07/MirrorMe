from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage
import base64
import os
import sys

# Add parent to path for config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import OLLAMA_BASE_URL, OLLAMA_VISION_MODEL

def analyze_image(image_path: str, mode: str = "describe") -> str:
    """Uses Moondream (Lightweight) to describe or critique an image."""
    
    if not os.path.exists(image_path):
        return f"Error: Image not found at {image_path}"

    try:
        with open(image_path, "rb") as image_file:
            encoded_image = base64.b64encode(image_file.read()).decode("utf-8")

        # Moondream is ultra-lightweight and fits in limited RAM
        llm = ChatOllama(
            base_url=OLLAMA_BASE_URL,
            model=OLLAMA_VISION_MODEL,
            temperature=0.2 # Lower temperature for better grounding
        )

        if mode == "describe":
            prompt = "What is in this image? Provide a brief description and mention key details like colors and objects."
        elif mode == "critique":
            prompt = "Analyze this image. What is the subject? Is there anything interesting about the composition or style?"
        else:
            prompt = "Describe the main subjects of this image."

        message = HumanMessage(
            content=[
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": f"data:image/jpeg;base64,{encoded_image}",
                },
            ]
        )

        response = llm.invoke([message])
        return response.content
    except Exception as e:
        print(f"Vision error (Moondream): {e}")
        return f"I can see that there's an image here, but I'm having a little trouble identifying the specifics right now."
