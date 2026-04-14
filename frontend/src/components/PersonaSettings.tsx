"use client";

import { useState, useEffect } from "react";
import { X, UserCircle, Save, Loader2, Info, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PersonaSettings({ 
  isOpen, 
  onClose,
  onUpdate
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onUpdate: (newName: string) => void;
}) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Fetch Persona
      fetch("http://127.0.0.1:8000/persona")
        .then(res => res.json())
        .then(data => {
          setName(data.name || "");
          setBio(data.bio || "");
          setVoiceId(data.voice_id || null);
        });
      
      // Fetch Voices
      fetch("http://127.0.0.1:8000/persona/voices")
        .then(res => res.json())
        .then(data => setAvailableVoices(data.voices || []));
    }
  }, [isOpen]);

  const previewVoice = async (id: string, name: string) => {
    if (isPreviewing) return;
    setIsPreviewing(id);
    try {
      const res = await fetch("http://127.0.0.1:8000/chat/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `Hi there! I am your Mirror, speaking as ${name}. Do you like my voice?`, voice_id: id })
      });
      const data = await res.json();
      const audio = new Audio(data.url);
      audio.onended = () => setIsPreviewing(null);
      audio.play();
    } catch (e) {
      console.error(e);
      setIsPreviewing(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    const selectedVoice = availableVoices.find(v => v.id === voiceId);
    try {
      const res = await fetch("http://127.0.0.1:8000/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          bio, 
          voice_id: voiceId, 
          voice_name: selectedVoice?.name || null 
        })
      });
      if (res.ok) {
        setMessage("Persona updated! The Mirror will now reflect your new identity.");
        onUpdate(name);
        setTimeout(onClose, 2000);
      }
    } catch (e) {
      console.error(e);
      setMessage("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-near-black/20 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-ivory border-l border-[#e8e6db] shadow-2xl z-50 p-8 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="serif text-2xl font-bold flex items-center gap-3">
                <UserCircle className="w-7 h-7 text-terracotta" />
                Persona Settings
              </h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-[#eae7d6] rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar pb-20">
              <div className="bg-[#fcfbf7] p-4 rounded-xl border border-border flex gap-3 text-xs opacity-70">
                <Info className="w-4 h-4 shrink-0 text-terracotta" />
                <p>Changing your persona updates how the Mirror speaks and identifies itself. This updates the underlying digital twin profile instantly.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Your Name</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-parchment border border-border rounded-xl px-4 py-3 focus:border-accent outline-none transition-all"
                  placeholder="e.g. Yash"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Voice Identity</label>
                <div className="grid grid-cols-1 gap-2">
                  {availableVoices.map((v) => (
                    <div 
                      key={v.id}
                      onClick={() => setVoiceId(v.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                        voiceId === v.id ? "bg-terracotta/5 border-terracotta shadow-sm" : "bg-parchment border-border opacity-60 hover:opacity-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          voiceId === v.id ? "bg-terracotta animate-pulse" : "bg-bg-accent"
                        )} />
                        <span className="text-sm font-medium">{v.name}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); previewVoice(v.id, v.name); }}
                        className="p-1.5 hover:bg-terracotta/10 rounded-lg text-terracotta transition-colors"
                      >
                        {isPreviewing === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Persona Bio / Facts</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full h-48 bg-parchment border border-border rounded-xl px-4 py-3 focus:border-accent outline-none transition-all resize-none"
                  placeholder="Describe your background, speaking style, and key life facts..."
                />
              </div>

              {message && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-medium text-sage text-center bg-sage/10 p-3 rounded-lg"
                >
                  {message}
                </motion.p>
              )}
            </div>

            <div className="pt-6 border-t border-border mt-auto bg-ivory z-10">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-terracotta text-ivory py-4 rounded-xl font-bold font-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSaving ? "Updating Twin..." : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
