"use client";

import { useState, useEffect } from "react";
import { Brain, Trash2, Search, Loader2, X, AlertCircle, Edit2, Check, RotateCcw, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Fact {
  id: string;
  content: string;
}

export default function KnowledgeBase({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const fetchFacts = async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    
    setError(null);
    try {
      const response = await fetch("http://127.0.0.1:8000/facts");
      if (!response.ok) throw new Error("Failed to fetch knowledge base");
      const data = await response.json();
      setFacts(data.facts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFacts();
    }
  }, [isOpen]);

  const deleteFact = async (id: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/facts/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete fact");
      setFacts(facts.filter((f) => f.id !== id));
    } catch (err) {
      alert("Error deleting fact: " + err);
    }
  };

  const startEditing = (fact: Fact) => {
    setEditingId(fact.id);
    setEditContent(fact.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  const updateFact = async (id: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/facts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (!response.ok) throw new Error("Failed to update fact");
      
      setFacts(facts.map(f => f.id === id ? { ...f, content: editContent } : f));
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      alert("Error updating fact: " + err);
    }
  };

  const filteredFacts = facts.filter((f) =>
    f.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-near-black/20 backdrop-blur-sm z-40"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-card shadow-2xl z-50 flex flex-col border-l border-border"
          >
            <div className="p-6 border-b border-[#e8e6db] flex items-center justify-between">
              <div className="flex items-center gap-2 text-terracotta">
                <Brain className="w-6 h-6" />
                <h2 className="serif text-2xl font-bold">Mirror Memory</h2>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => fetchFacts(true)} 
                  disabled={isRefreshing}
                  className="p-2 hover:bg-[#eae7d6] rounded-full transition-colors opacity-40 hover:opacity-100 disabled:opacity-10"
                  title="Refresh Memory"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-[#eae7d6] rounded-full transition-colors">
                  <X className="w-5 h-5 opacity-40" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-[#fcfbf7]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <input
                  type="text"
                  placeholder="Search facts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-parchment border border-[#e8e6db] pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-terracotta transition-colors text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-40 italic">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  Accessing long-term memory...
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-terracotta gap-2">
                  <AlertCircle className="w-8 h-8" />
                  <p className="text-sm font-medium">{error}</p>
                  <button onClick={() => fetchFacts()} className="text-xs underline opacity-60">Try again</button>
                </div>
              ) : filteredFacts.length === 0 ? (
                <div className="text-center py-20 opacity-30">
                  <p className="serif italic">No facts found.</p>
                  <p className="text-xs mt-2 uppercase tracking-widest font-bold">Upload data to teach your mirror</p>
                </div>
              ) : (
                filteredFacts.map((fact) => (
                  <motion.div
                    layout
                    key={fact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 bg-parchment rounded-xl border group relative transition-all ${
                      editingId === fact.id ? "border-terracotta shadow-inner ring-1 ring-terracotta/20" : "border-[#e8e6db] hover:border-terracotta/30"
                    }`}
                  >
                    {editingId === fact.id ? (
                      <div className="space-y-3">
                        <textarea
                          autoFocus
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-transparent text-sm leading-relaxed border-none focus:ring-0 p-0 resize-none min-h-[80px]"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelEditing}
                            className="p-1 px-2 text-[10px] uppercase font-bold tracking-wider opacity-40 hover:opacity-100 flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Cancel
                          </button>
                          <button
                            onClick={() => updateFact(fact.id)}
                            className="p-1 px-3 bg-terracotta text-white rounded text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 hover:bg-terracotta/80 shadow-md"
                          >
                            <Check className="w-3 h-3" /> Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm leading-relaxed pr-12">{fact.content}</p>
                        <div className="absolute top-2 right-2 flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditing(fact)}
                            className="p-1.5 text-near-black opacity-30 hover:opacity-100 hover:text-terracotta transition-all"
                            title="Edit fact"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteFact(fact.id)}
                            className="p-1.5 text-near-black opacity-30 hover:opacity-100 hover:text-terracotta transition-all"
                            title="Delete fact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            <div className="p-6 bg-[#fcfbf7] border-t border-[#e8e6db]">
              <p className="text-[10px] text-center opacity-30 uppercase tracking-widest font-bold">
                These facts ground your AI Mirror in reality
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
