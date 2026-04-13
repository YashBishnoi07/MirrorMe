"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, RefreshCw, Image as ImageIcon, X } from "lucide-react";
import MessageBubble, { Message } from "./MessageBubble";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "mirror", content: "Hi there. I'm your digital twin. I've been learning from your data. What would you like to talk about?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    
    // Create FormData for multipart request
    const formData = new FormData();
    formData.append("message", input);
    formData.append("session_id", "demo-user");
    if (attachedImage) {
      formData.append("image", attachedImage);
    }

    setInput("");
    removeImage();
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to chat");

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "mirror", content: data.answer }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "mirror", content: "Sorry, I had trouble connecting to my brain. Is the backend running?" }]);
    } finally {
      setIsLoading(false);
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
            {attachedImage ? "Mirror is visualizing the image..." : "Mirror is thinking..."}
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
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "p-3 hover:bg-[#eae7d6] rounded-xl transition-colors",
              attachedImage ? "text-terracotta" : "text-near-black opacity-60"
            )}
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Talk to your Mirror..."
            className="flex-1 bg-transparent border-none outline-none px-2 py-3 text-lg"
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
          Claude Systems Inspired Design
        </p>
      </div>
    </div>
  );
}
