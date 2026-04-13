"use client";

import { useState, useEffect } from "react";
import ChatWindow from "@/components/ChatWindow";
import KnowledgeBase from "@/components/KnowledgeBase";
import Link from "next/link";
import { LayoutDashboard, Settings, UserCircle, LogOut, Brain } from "lucide-react";

export default function ChatPage() {
  const [isKbOpen, setIsKbOpen] = useState(false);
  const [personaName, setPersonaName] = useState("Yash");

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
            <Link href="/chat" className="flex items-center gap-3 px-4 py-3 bg-[#eae7d6] rounded-xl text-near-black font-medium transition-all">
              <LayoutDashboard className="w-5 h-5 opacity-70" />
              Chat
            </Link>
            <Link href="/setup" className="flex items-center gap-3 px-4 py-3 hover:bg-[#eae7d6] rounded-xl text-near-black opacity-60 transition-all font-medium">
              <UserCircle className="w-5 h-5 opacity-70" />
              Persona
            </Link>
            <button 
              onClick={() => setIsKbOpen(true)}
              className="flex items-center gap-3 px-4 py-3 w-full hover:bg-[#eae7d6] rounded-xl text-near-black opacity-60 transition-all font-medium"
            >
              <Brain className="w-5 h-5 opacity-70" />
              Memory
            </button>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-[#eae7d6] rounded-xl text-near-black opacity-60 transition-all font-medium">
              <Settings className="w-5 h-5 opacity-70" />
              Settings
            </Link>
          </nav>
        </div>

        <button className="flex items-center gap-3 px-4 py-3 hover:bg-[#eae7d6] rounded-xl text-near-black opacity-40 transition-all font-medium text-sm">
          <LogOut className="w-5 h-5 opacity-70" />
          Sign Out
        </button>
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
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-parchment to-transparent z-10 pointer-events-none" />
          <ChatWindow />
        </div>
        
        <KnowledgeBase isOpen={isKbOpen} onClose={() => setIsKbOpen(false)} />
      </main>
    </div>
  );
}
