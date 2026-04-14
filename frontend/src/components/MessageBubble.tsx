"use client";

import { motion } from "framer-motion";
import { User, UserRound, Volume2, Loader2 } from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Message {
  role: "user" | "mirror";
  content: string;
  mood?: string;
  isProactive?: boolean;
}

export default function MessageBubble({ role, content, mood, isProactive }: Message) {
  const isUser = role === "user";
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/chat/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content })
      });
      if (!response.ok) throw new Error("Voice failed");
      const data = await response.json();
      const audio = new Audio(data.url);
      audio.onended = () => setIsSpeaking(false);
      audio.play();
    } catch (err) {
      console.error(err);
      setIsSpeaking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full mb-6 gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
        isUser ? "bg-terracotta text-ivory" : "bg-scrollbar text-fg"
      )}>
        {isUser ? <User className="w-5 h-5" /> : <UserRound className="w-5 h-5 transition-transform" />}
      </div>

      {/* Bubble */}
      <div className={cn(
        "max-w-[80%] px-6 py-4 rounded-2xl claude-shadow transition-colors duration-300",
        isUser 
          ? "bg-terracotta text-ivory rounded-tr-none shadow-md" 
          : "bg-card text-fg border border-border rounded-tl-none"
      )}>
        <p className={cn(
          "leading-relaxed",
          !isUser && "serif font-medium italic opacity-95"
        )}>
          {content}
        </p>
        
        {!isUser && (
          <div className="mt-3 flex items-center justify-between">
            <button 
              onClick={handleSpeak}
              disabled={isSpeaking}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-fg opacity-30 hover:opacity-100 transition-opacity disabled:opacity-30"
            >
              {isSpeaking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
              {isSpeaking ? "Speaking..." : "Listen to style"}
            </button>

            {mood && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-accent/10 rounded-full border border-accent/20 text-[9px] font-bold uppercase tracking-tighter text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Feeling: {mood}
              </div>
            )}

            {isProactive && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-terracotta/10 rounded-full border border-terracotta/20 text-[9px] font-bold uppercase tracking-tighter text-terracotta ml-auto">
                <span className="animate-bounce">✨</span> Reflection
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
