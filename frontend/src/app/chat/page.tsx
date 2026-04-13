"use client";

import { useState, useEffect } from "react";
import ChatWindow from "@/components/ChatWindow";
import KnowledgeBase from "@/components/KnowledgeBase";
import JournalView from "@/components/JournalView";
import Link from "next/link";
import { LayoutDashboard, Settings, UserCircle, LogOut, Brain, BookOpen, Plus, MessageSquare, Trash2, Clock } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ChatPage() {
  const [isKbOpen, setIsKbOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [personaName, setPersonaName] = useState("Yash");
  const [activeSessionId, setActiveSessionId] = useState<string>("default-session");
  const [sessions, setSessions] = useState<any[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Load sessions
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/sessions");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data = await res.json();
      const sessionsList = data.sessions || [];
      setSessions(sessionsList);
      
      // If no session is active or current session is not in list, pick the first one
      if (sessionsList.length > 0 && activeSessionId === "default-session") {
        setActiveSessionId(sessionsList[0].id);
      }
    } catch (e) {
      console.error("Sessions fetch error", e);
    }
  };

  const createNewChat = () => {
    const newId = `session_${Date.now()}`;
    setActiveSessionId(newId);
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`http://127.0.0.1:8000/sessions/${id}`, { method: "DELETE" });
      fetchSessions();
      if (activeSessionId === id) {
        setActiveSessionId("default-session");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startEditing = (s: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(s.id);
    setEditTitle(s.title);
  };

  const saveRename = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    try {
      const res = await fetch(`http://127.0.0.1:8000/sessions/${id}`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle })
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      } else {
        fetchSessions(); // Fallback
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEditingSessionId(null);
    }
  };

  useEffect(() => {
    fetch("http://127.0.0.1:8000/persona")
      .then(res => res.json())
      .then(data => setPersonaName(data.name || "Yash"))
      .catch(err => console.error("Error fetching persona:", err));
  }, []);

  return (
    <div className="flex h-screen bg-parchment overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-ivory border-r border-[#e8e6db] p-6 justify-between">
        <div className="space-y-8">
          <div className="flex items-center justify-between mb-10">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-terracotta rounded-lg rotate-12 flex items-center justify-center text-ivory font-bold text-xs">
                M
              </div>
              <span className="serif text-lg font-bold tracking-tight">MirrorMe</span>
            </Link>
            
            {/* Status Pulse */}
            <div className="flex items-center gap-2 px-2 py-1 bg-[#fcfbf7] rounded-full border border-[#eee] text-[10px] font-bold uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sage"></span>
              </span>
              Alive
            </div>
          </div>
          
          <nav className="space-y-1">
            <button 
              onClick={createNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-6 bg-terracotta text-ivory rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
              New Conversation
            </button>

            <Link href="/chat" className="flex items-center gap-3 px-4 py-3 bg-[#eae7d6] dark:bg-[#33312c] rounded-xl text-near-black dark:text-ivory font-medium transition-all">
              <LayoutDashboard className="w-5 h-5 opacity-70" />
              Dashboard
            </Link>
            
            <div className="pt-6 pb-2 px-4">
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-30 text-fg">History</p>
            </div>
            
            <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSessionId(s.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                    activeSessionId === s.id 
                      ? "bg-[#eae7d6] dark:bg-[#33312c] text-near-black dark:text-ivory font-bold" 
                      : "text-near-black dark:text-ivory opacity-50 hover:opacity-100 hover:bg-[#eae7d6]/50 dark:hover:bg-[#33312c]/50"
                  )}
                >
                  <MessageSquare className={cn("w-4 h-4", activeSessionId === s.id ? "text-terracotta" : "opacity-40")} />
                  {editingSessionId === s.id ? (
                    <input 
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveRename(s.id)}
                      className="bg-ivory border border-accent rounded px-1 py-0.5 w-[80%] text-sm font-normal outline-none"
                    />
                  ) : (
                    <>
                      <span className="text-sm truncate pr-12">{s.title}</span>
                      <div className="absolute right-3 flex items-center gap-2 opacity-0 group-hover:opacity-40 transition-opacity">
                        <Settings 
                          onClick={(e) => startEditing(s, e)}
                          className="w-3.5 h-3.5 hover:opacity-100 hover:text-accent cursor-pointer" 
                        />
                        <Trash2 
                          onClick={(e) => deleteSession(s.id, e)}
                          className="w-3.5 h-3.5 hover:opacity-100 hover:text-terracotta cursor-pointer"
                        />
                      </div>
                    </>
                  )}
                </button>
              ))}
              {sessions.length === 0 && (
                <div className="px-4 py-3 text-[10px] italic opacity-30">No history yet</div>
              )}
            </div>

            <div className="pt-6 border-t border-border mt-6">
              <button 
                onClick={() => setIsJournalOpen(true)}
                className="flex items-center gap-3 px-4 py-3 w-full hover:bg-[#eae7d6] dark:hover:bg-[#33312c] rounded-xl text-near-black dark:text-ivory opacity-60 transition-all font-medium"
              >
                <BookOpen className="w-5 h-5 opacity-70" />
                Reflections
              </button>
              <button 
                onClick={() => setIsKbOpen(true)}
                className="flex items-center gap-3 px-4 py-3 w-full hover:bg-[#eae7d6] dark:hover:bg-[#33312c] rounded-xl text-near-black dark:text-ivory opacity-60 transition-all font-medium"
              >
                <Brain className="w-5 h-5 opacity-70" />
                Memory
              </button>
            </div>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-[#eae7d6] dark:hover:bg-[#33312c] rounded-xl text-near-black dark:text-ivory opacity-60 transition-all font-medium">
              <Settings className="w-5 h-5 opacity-70" />
              Settings
            </Link>
          </nav>
        </div>

        <div className="space-y-4">
          <button className="flex items-center gap-3 px-4 py-3 w-full hover:bg-[#eae7d6] rounded-xl text-near-black opacity-40 hover:opacity-100 transition-all font-medium text-sm">
            <LogOut className="w-5 h-5 opacity-70" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full relative">
        <nav className="flex items-center justify-between px-8 py-4 border-bottom border-black overflow-none md:hidden pt-8">
           <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-terracotta rounded-lg rotate-12 flex items-center justify-center text-ivory font-bold text-[10px]">
              M
            </div>
          </Link>
          <span className="serif font-bold italic">Mirroring {personaName}</span>
          <button onClick={() => setIsKbOpen(true)} className="md:hidden p-2 text-terracotta">
            <Brain className="w-5 h-5" />
          </button>
        </nav>
        
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-bg to-transparent z-10 pointer-events-none" />
          <ChatWindow sessionId={activeSessionId} onNewMessage={fetchSessions} />
        </div>
        
        <KnowledgeBase isOpen={isKbOpen} onClose={() => setIsKbOpen(false)} />
        <JournalView isOpen={isJournalOpen} onClose={() => setIsJournalOpen(false)} />
      </main>
    </div>
  );
}
