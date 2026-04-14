"use client";

import { useState, useEffect } from "react";
import ChatWindow from "@/components/ChatWindow";
import KnowledgeBase from "@/components/KnowledgeBase";
import JournalView from "@/components/JournalView";
import PersonaSettings from "@/components/PersonaSettings";
import LivingMirror from "@/components/LivingMirror";
import Link from "next/link";
import { LayoutDashboard, Settings, UserCircle, LogOut, Brain, BookOpen, Plus, MessageSquare, Trash2, Clock, Camera, CameraOff, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ChatPage() {
  const [isKbOpen, setIsKbOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAutoMirror, setIsAutoMirror] = useState(false);
  const [moodComment, setMoodComment] = useState<string | null>(null);
  const [personaName, setPersonaName] = useState("Yash");
  const [activeSessionId, setActiveSessionId] = useState<string>("default-session");
  const [sessions, setSessions] = useState<any[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleMoodChange = (mood: string) => {
    // Generate helpful commentary based on mood shift
    const normalized = mood.toLowerCase();
    let comment = "";
    if (normalized.includes("happy")) comment = `${personaName} noticed you're in a great mood!`;
    else if (normalized.includes("focus")) comment = `${personaName} is matching your focus.`;
    else if (normalized.includes("tired")) comment = `Take it easy, ${personaName} is here if you need to vent.`;
    else if (normalized.includes("stress")) comment = `${personaName} is sensing some tension. Calm mode active.`;
    else comment = `${personaName} sees you're in a calm state.`;
    
    if (comment) {
      setMoodComment(comment);
      setTimeout(() => setMoodComment(null), 5000);
    }
  };

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
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] transition-colors duration-[3000ms]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-ivory border-r border-border p-6 justify-between">
        <div className="space-y-8">
          <div className="flex items-center justify-between mb-10">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-terracotta rounded-lg rotate-12 flex items-center justify-center text-ivory font-bold text-xs">
                M
              </div>
              <span className="serif text-lg font-bold tracking-tight">MirrorMe</span>
            </Link>
            
            {/* Status Pulse */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-2 py-1 bg-[#fcfbf7] rounded-full border border-[#eee] text-[10px] font-bold uppercase tracking-widest">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sage"></span>
                </span>
                Alive
              </div>
              
              <button 
                onClick={() => setIsAutoMirror(!isAutoMirror)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-full border transition-all text-[10px] font-bold uppercase tracking-widest",
                  isAutoMirror 
                    ? "bg-terracotta/10 border-terracotta text-terracotta" 
                    : "bg-[#fcfbf7] border-[#eee] text-fg opacity-40 hover:opacity-100"
                )}
              >
                {isAutoMirror ? <Camera className="w-3 h-3" /> : <CameraOff className="w-3 h-3" />}
                Auto-Mirror {isAutoMirror ? "On" : "Off"}
              </button>
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

            <Link href="/chat" className="flex items-center gap-3 px-4 py-3 bg-[#eae7d6] rounded-xl text-near-black font-medium transition-all">
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
                      ? "bg-[#eae7d6] text-near-black font-bold" 
                      : "text-near-black opacity-50 hover:opacity-100 hover:bg-[#eae7d6]/50"
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
                className="flex items-center gap-3 px-4 py-3 w-full hover:bg-[#eae7d6] rounded-xl text-near-black opacity-60 transition-all font-medium"
              >
                <BookOpen className="w-5 h-5 opacity-70" />
                Reflections
              </button>
              <button 
                onClick={() => setIsKbOpen(true)}
                className="flex items-center gap-3 px-4 py-3 w-full hover:bg-[#eae7d6] rounded-xl text-near-black opacity-60 transition-all font-medium"
              >
                <Brain className="w-5 h-5 opacity-70" />
                Memory
              </button>
            </div>
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
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        <nav className="flex items-center justify-between px-8 py-4 border-b border-border bg-ivory/50 backdrop-blur-md z-20">
           <Link href="/" className="md:hidden flex items-center gap-2">
            <div className="w-6 h-6 bg-terracotta rounded-lg rotate-12 flex items-center justify-center text-ivory font-bold text-[10px]">
              M
            </div>
          </Link>
          <div className="hidden md:flex flex-col">
            <h1 className="serif font-bold text-xl">Dashboard</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-30">Mirroring {personaName}</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 hover:bg-[#eae7d6] rounded-xl text-near-black opacity-60 hover:opacity-100 transition-all"
              title="Persona Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={() => setIsKbOpen(true)} className="p-2 text-terracotta hover:scale-110 transition-transform">
              <Brain className="w-6 h-6" />
            </button>
          </div>
        </nav>
        
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-bg to-transparent z-10 pointer-events-none" />
          <ChatWindow sessionId={activeSessionId} onNewMessage={fetchSessions} />
          
          {/* Mood Commentary Toast */}
          <AnimatePresence>
            {moodComment && (
              <motion.div 
                initial={{ opacity: 0, y: 20, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: 20, x: "-50%" }}
                className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-ivory shadow-2xl border border-terracotta/20 px-6 py-3 rounded-2xl flex items-center gap-3 claude-shadow"
              >
                <div className="w-8 h-8 bg-terracotta/10 rounded-xl flex items-center justify-center text-terracotta">
                  <Sparkles className="w-4 h-4" />
                </div>
                <p className="text-sm font-medium serif italic text-fg/80">{moodComment}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <LivingMirror isActive={isAutoMirror} onMoodChange={handleMoodChange} />
        <KnowledgeBase isOpen={isKbOpen} onClose={() => setIsKbOpen(false)} />
        <JournalView isOpen={isJournalOpen} onClose={() => setIsJournalOpen(false)} />
        <PersonaSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onUpdate={(name) => setPersonaName(name)} />
      </main>
    </div>
  );
}
