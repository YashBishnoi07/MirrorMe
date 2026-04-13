from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain.chains import create_history_aware_retriever
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
import os
import sys

# Add parent to path for config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import OLLAMA_BASE_URL, OLLAMA_MODEL, DEFAULT_MIRROR_NAME, DEFAULT_SYSTEM_PROMPT
from data.load.load import get_retriever
from agent.sessions import get_file_history, update_session_metadata

def build_mirror_agent(name=DEFAULT_MIRROR_NAME, bio=""):
    """Builds a local RAG-based mirror agent using Ollama."""
    
    llm = ChatOllama(
        base_url=OLLAMA_BASE_URL,
        model=OLLAMA_MODEL,
        temperature=0.7
    )
    
    retriever = get_retriever()
    
    # Contextualize questions for RAG
    contextualize_q_system_prompt = """Given a chat history and the latest user question \
    which might reference context in the chat history, formulate a standalone question \
    which can be understood without the chat history. Do NOT answer the question, \
    just reformulate it if needed and otherwise return it as is."""
    
    contextualize_q_prompt = ChatPromptTemplate.from_messages([
        ("system", contextualize_q_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    
    history_aware_retriever = create_history_aware_retriever(
        llm, retriever, contextualize_q_prompt
    )
    
    # Main QA chain
    style_guide = f"\nSpeak in the following style: {bio}" if bio else ""
    qa_system_prompt = (DEFAULT_SYSTEM_PROMPT + style_guide + """
    
    Context about {name}:
    {context}
    """).format(name=name, context="{context}")
    
    qa_prompt = ChatPromptTemplate.from_messages([
        ("system", qa_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    
    question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
    rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)
    
    return rag_chain

# File-based history store
def get_session_history(session_id: str) -> BaseChatMessageHistory:
    return get_file_history(session_id)

def get_mirror_executor(session_id: str, name=DEFAULT_MIRROR_NAME, bio=""):
    rag_chain = build_mirror_agent(name, bio)
    
    conversational_rag_chain = RunnableWithMessageHistory(
        rag_chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history",
        output_messages_key="answer",
    )
    
    return conversational_rag_chain
