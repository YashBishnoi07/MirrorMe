"use client";

import { useState, useEffect } from "react";
import { Sparkles, X, Loader2, Calendar, BookOpen, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface JournalEntry {
  id: string;
  content: string;
  date_label: string;
  timestamp: string;
}

export default function JournalView({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJournals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://127.0.0.1:8000/journals");
      if (!response.ok) throw new Error("Failed to load reflections");
      const data = await response.json();
      setJournals(data.journals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection error");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerReflection = async () => {
    setIsReflecting(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/journals/reflect", {
        method: "POST"
      });
      if (!response.ok) throw new Error("Reflection failed");
      const newEntry = await response.json();
      setJournals((prev) => [newEntry, ...prev]);
    } catch (err) {
      alert("Error generating reflection: " + err);
    } finally {
      setIsReflecting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchJournals();
    }
  }, [isOpen]);

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
            className="fixed top-0 right-0 h-full w-full max-w-md bg-card shadow-2xl z-50 flex flex-col border-l border-border"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#e8e6db] flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-2 text-terracotta">
                <BookOpen className="w-6 h-6" />
                <h2 className="serif text-2xl font-bold">Mirror Journal</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[#eae7d6] rounded-full transition-colors">
                <X className="w-5 h-5 opacity-40" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative">
              {/* Timeline line */}
              <div className="absolute left-10 top-0 bottom-0 w-[1px] bg-terracotta/10 pointer-events-none" />

              {journals.length === 0 && !isLoading ? (
                <div className="text-center py-20 px-8">
                  <div className="w-16 h-16 bg-terracotta/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-terracotta opacity-20" />
                  </div>
                  <p className="serif italic opacity-40">The Mirror hasn't reflected yet.</p>
                  <p className="text-xs mt-2 uppercase tracking-widest font-bold opacity-30 px-4">
                    Trigger a reflection to see the twin's perspective
                  </p>
                </div>
              ) : (
                journals.map((entry, idx) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative pl-12"
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-[37px] top-1.5 w-2 h-2 rounded-full bg-terracotta shadow-[0_0_8px_rgba(166,74,53,0.4)]" />
                    
                    <div className="claude-card p-5 hover:scale-[1.01] transition-transform">
                      <div className="flex items-center gap-2 mb-3 text-[10px] uppercase font-bold tracking-widest text-terracotta">
                        <Calendar className="w-3 h-3" />
                        {entry.date_label}
                        <span className="opacity-20 ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="serif leading-relaxed text-near-black italic opacity-90">
                        "{entry.content}"
                      </p>
                    </div>
                  </motion.div>
                ))
              )}

              {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 opacity-30 italic">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  Reading inner thoughts...
                </div>
              )}
            </div>

            {/* Footer / Trigger */}
            <div className="p-6 bg-white/50 border-t border-[#e8e6db] backdrop-blur-md">
              <button 
                onClick={triggerReflection}
                disabled={isReflecting}
                className="w-full bg-terracotta text-ivory py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-terracotta/90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isReflecting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    The Mirror is reflecting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Trigger New Reflection
                  </>
                )}
              </button>
              <p className="text-[10px] text-center opacity-30 mt-4 uppercase tracking-widest font-bold">
                The twin will philosophize about what it has learned
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
