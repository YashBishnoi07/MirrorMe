"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, RefreshCw, Image as ImageIcon, X, Camera } from "lucide-react";
import MessageBubble, { Message } from "./MessageBubble";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ChatWindow({ 
  sessionId, 
  onNewMessage 
}: { 
  sessionId: string;
  onNewMessage?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Immediate clear for optimistic switching feel
    setMessages([]);
    
    // Load history when session changes
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/sessions/${sessionId}/history`);
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          // Check for proactive message first if it's a brand new session
          try {
            const proRes = await fetch(`http://127.0.0.1:8000/chat/proactive?session_id=${sessionId}`);
            const proData = await proRes.json();
            if (proData.message) {
               setMessages([{ role: "mirror", content: proData.message, isProactive: true }]);
            } else {
               setMessages([{ role: "mirror", content: "Hi there. This is a new conversation. What's on your mind?" }]);
            }
          } catch (e) {
            setMessages([{ role: "mirror", content: "Hi there. This is a new conversation. What's on your mind?" }]);
          }
        }
      } catch (e) {
        console.error("History load error", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setAttachedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const checkNeedsSearch = (text: string) => {
    const searchTriggers = [
      "current", "latest", "today", "news", "weather", "score", 
      "price of", "stock", "who is", "what happened", "now",
      "search", "google", "look up", "tell me about"
    ];
    const msgLower = text.toLowerCase();
    return searchTriggers.some(trigger => msgLower.includes(trigger));
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    
    const needsSearch = checkNeedsSearch(input);
    
    // Create FormData for multipart request
    const formData = new FormData();
    formData.append("message", input);
    formData.append("session_id", sessionId);
    if (attachedImage) {
      formData.append("image", attachedImage);
    }

    setInput("");
    removeImage();
    setIsLoading(true);
    setIsSearching(needsSearch);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to chat");

      const data = await response.json();
      setMessages((prev) => [...prev, { 
        role: "mirror", 
        content: data.answer,
        mood: data.mood 
      }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "mirror", content: "Sorry, I had trouble connecting to my brain. Is the backend running?" }]);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
      if (onNewMessage) onNewMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-4">
      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-8 pb-32 no-scrollbar"
      >
        <AnimatePresence>
          {messages.map((m, i) => (
            <MessageBubble key={i} {...m} />
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm opacity-40 serif italic mb-8"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            {isSearching 
              ? "Give me 2 minutes, i will comeback in 2 hours (Searching the web...)" 
              : attachedImage 
                ? "Mirror is visualizing the image..." 
                : "Mirror is thinking..."
            }
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="fixed bottom-8 left-4 right-4 md:left-auto md:right-auto md:w-full md:max-w-3xl">
        {imagePreview && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 relative inline-block"
          >
            <img 
              src={imagePreview} 
              className="w-20 h-20 object-cover rounded-lg border-2 border-terracotta" 
              alt="Preview" 
            />
            <button 
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-near-black text-ivory rounded-full p-1 shadow-lg"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
        
        <div className="claude-card p-2 flex items-center gap-2 claude-shadow">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={onImageChange}
            accept="image/*"
            capture="user"
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "p-3 hover:bg-[#eae7d6] rounded-xl transition-colors",
              attachedImage ? "text-terracotta" : "text-near-black opacity-60"
            )}
            title="Upload Image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute("capture", "user");
                fileInputRef.current.click();
              }
            }}
            className={cn(
              "p-3 hover:bg-[#eae7d6] rounded-xl transition-colors flex items-center gap-2",
              attachedImage ? "text-terracotta" : "text-near-black opacity-60"
            )}
            title="Mirror Me (Camera)"
          >
            <Camera className="w-5 h-5" />
          </button>
          
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-expand height
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Talk to your Mirror..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none px-2 py-3 text-lg text-[#141413] font-medium placeholder:opacity-40 resize-none max-h-[200px] overflow-y-auto"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-terracotta text-ivory p-3 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-center mt-3 opacity-30 uppercase tracking-widest font-bold">
          MirrorMe: Personalized Agentic Digital Twin
        </p>
      </div>
    </div>
  );
}
