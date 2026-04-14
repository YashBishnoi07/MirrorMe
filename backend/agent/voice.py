import edge_tts
import os
import requests
import json
import asyncio
import uuid
import sys

# Add parent to path for config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, VOICE_DIR, EDGE_VOICE

async def generate_speech_edge(text: str, output_path: str, voice_id: str = None):
    """Generates speech using Microsoft Edge TTS (Free)."""
    voice = voice_id or EDGE_VOICE
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)

def generate_speech_elevenlabs(text: str, output_path: str, voice_id: str = None):
    """Generates speech using ElevenLabs (Premium)."""
    target_voice = voice_id or ELEVENLABS_VOICE_ID
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{target_voice}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        }
    }
    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 200:
        with open(output_path, "wb") as f:
            f.write(response.content)
        return True
    else:
        print(f"ElevenLabs error: {response.text}")
        return False

async def get_speech_url(text: str, voice_id: str = None) -> str:
    """Entry point for speech generation. Returns the filename of the generated MP3."""
    if not text:
        return ""
    
    filename = f"{uuid.uuid4()}.mp3"
    filepath = os.path.join(VOICE_DIR, filename)
    
    # Check if ElevenLabs key is present and useful
    if ELEVENLABS_API_KEY and len(ELEVENLABS_API_KEY) > 10:
        print(f"Using ElevenLabs ({voice_id or ELEVENLABS_VOICE_ID}) for speech generation...")
        success = generate_speech_elevenlabs(text, filepath, voice_id)
        if success:
            return filename
    
    # Fallback to Edge TTS
    actual_voice = voice_id or EDGE_VOICE
    print(f"Using Edge TTS ({actual_voice}) for speech generation...")
    try:
        await generate_speech_edge(text, filepath, actual_voice)
        return filename
    except Exception as e:
        print(f"Speech generation error: {e}")
        return ""
