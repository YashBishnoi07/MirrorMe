import os
import json
import datetime
from typing import List, Dict
from langchain_community.chat_message_histories import FileChatMessageHistory

CHATS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "local", "chats")
SESSIONS_FILE = os.path.join(CHATS_DIR, "sessions_index.json")

def ensure_chats_dir():
    if not os.path.exists(CHATS_DIR):
        os.makedirs(CHATS_DIR)

def get_sessions_index() -> List[Dict]:
    ensure_chats_dir()
    if not os.path.exists(SESSIONS_FILE):
        return []
    try:
        with open(SESSIONS_FILE, "r") as f:
            return json.load(f)
    except:
        return []

def save_sessions_index(sessions: List[Dict]):
    ensure_chats_dir()
    with open(SESSIONS_FILE, "w") as f:
        json.dump(sessions, f, indent=2)

def update_session_metadata(session_id: str, title: str = None):
    sessions = get_sessions_index()
    now = datetime.datetime.now().isoformat()
    
    found = False
    for s in sessions:
        if s["id"] == session_id:
            s["last_active"] = now
            if title:
                s["title"] = title
            found = True
            break
    
    if not found:
        sessions.append({
            "id": session_id,
            "title": title or "New Conversation",
            "created_at": now,
            "last_active": now
        })
    
    # Sort by last_active (newest first)
    sessions.sort(key=lambda x: x["last_active"], reverse=True)
    save_sessions_index(sessions)

def get_file_history(session_id: str):
    ensure_chats_dir()
    file_path = os.path.join(CHATS_DIR, f"{session_id}.json")
    return FileChatMessageHistory(file_path)

def delete_session(session_id: str):
    sessions = get_sessions_index()
    sessions = [s for s in sessions if s["id"] != session_id]
    save_sessions_index(sessions)
    
    file_path = os.path.join(CHATS_DIR, f"{session_id}.json")
    if os.path.exists(file_path):
        os.remove(file_path)


def rename_session(session_id: str, new_title: str):
    sessions = get_sessions_index()
    for s in sessions:
        if s['id'] == session_id:
            s['title'] = new_title
            break
    save_sessions_index(sessions)
