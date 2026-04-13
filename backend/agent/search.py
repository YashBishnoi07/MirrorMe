from duckduckgo_search import DDGS
import json

def web_search(query: str, max_results: int = 3):
    """Performs a web search using DuckDuckGo and returns a summary string."""
    try:
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append(f"Title: {r['title']}\nSnippet: {r['body']}\nSource: {r['href']}")
        
        if not results:
            return "No search results found."
            
        return "\n\n---\n\n".join(results)
    except Exception as e:
        print(f"Search error: {e}")
        return f"Error performing web search: {str(e)}"

def is_search_needed(message: str) -> bool:
    """A lightweight heuristic to decide if we should search the web."""
    # List of keywords that strongly imply we need fresh data
    search_triggers = [
        "current", "latest", "today", "news", "weather", "score", 
        "price of", "stock", "who is", "what happened", "now",
        "search", "google", "look up", "tell me about"
    ]
    
    msg_lower = message.lower()
    return any(trigger in msg_lower for trigger in search_triggers)
