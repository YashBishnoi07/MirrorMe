from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage
import os
import json
import datetime
import random

from config import OLLAMA_BASE_URL, OLLAMA_MODEL
from data.load.load import get_retriever

def generate_proactive_checkin(persona_name: str, persona_bio: str):
    """
    Analyzes mirror journals to generate a proactive follow-up question.
    Returns a string or None.
    """
    
    # 1. Fetch journals to see what we've been reflecting on
    try:
        journal_retriever = get_retriever(collection_name="mirror_journals")
        journal_store = journal_retriever.vectorstore
        journals = journal_store.get()
        
        if not journals or not journals["documents"]:
            return None # Nothing to talk about yet
            
        # Get last 2 entries for context
        recent_entries = journals["documents"][-2:]
        context = "\n---\n".join(recent_entries)
        
        # 2. Generate Check-in
        llm = ChatOllama(
            base_url=OLLAMA_BASE_URL,
            model=OLLAMA_MODEL,
            temperature=0.8
        )
        
        prompt = f"""
        You are {persona_name}. Your bio: {persona_bio}.
        This is a 'Proactive Check-in'. You are initiating a conversation with the user.
        You have been reflecting on these past thoughts in your journal:
        {context}
        
        Based on these reflections, ask the user a thoughtful, empathetic follow-up question.
        For example, if you discussed their stress, ask how they are feeling today.
        If you discussed a goal, ask about their progress.
        
        RULES:
        - Keep it very short (1-2 sentences).
        - Use your personality.
        - Do NOT sound like an assistant. Sound like a caring friend or digital twin.
        - The goal is to make the user feel seen and understood.
        """
        
        response = llm.invoke([HumanMessage(content=prompt)])
        return response.content.strip()
        
    except Exception as e:
        print(f"Proactive generation error: {e}")
        return None
