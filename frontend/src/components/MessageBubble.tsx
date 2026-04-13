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
}

export default function MessageBubble({ role, content }: Message) {
  const isUser = role === "user";
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
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
        isUser ? "bg-terracotta text-ivory" : "bg-[#ddd9c1] text-near-black"
      )}>
        {isUser ? <User className="w-5 h-5" /> : <UserRound className="w-5 h-5 transition-transform" />}
      </div>

      {/* Bubble */}
      <div className={cn(
        "max-w-[80%] px-6 py-4 rounded-2xl claude-shadow",
        isUser 
          ? "bg-terracotta text-ivory rounded-tr-none" 
          : "bg-ivory text-near-black border border-[#e8e6db] rounded-tl-none"
      )}>
        <p className={cn(
          "leading-relaxed",
          !isUser && "serif font-medium italic opacity-90"
        )}>
          {content}
        </p>
        
        {!isUser && (
          <button 
            onClick={handleSpeak}
            disabled={isSpeaking}
            className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity disabled:opacity-30"
          >
            {isSpeaking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
            {isSpeaking ? "Speaking..." : "Listen to style"}
          </button>
        )}
      </div>
    </motion.div>
  );
}
