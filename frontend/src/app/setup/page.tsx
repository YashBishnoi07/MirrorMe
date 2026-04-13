"use client";

import { useState, useEffect } from "react";
import { Upload, Link as LinkIcon, CheckCircle, ArrowLeft, Loader2, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ingestData, setIngestData] = useState({ name: "Yash", bio: "", url: "" });

  useEffect(() => {
    // Fetch current persona on mount
    const fetchPersona = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/persona");
        if (response.ok) {
          const data = await response.json();
          setIngestData(prev => ({ ...prev, name: data.name, bio: data.bio }));
        }
      } catch (err) {
        console.error("Failed to fetch persona:", err);
      }
    };
    fetchPersona();
  }, []);

  const savePersona = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: ingestData.name, bio: ingestData.bio }),
      });
      if (!response.ok) throw new Error("Failed to save persona");
      setStep(2);
    } catch (err) {
      alert("Error saving persona: " + err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIngest = async (type: "url" | "file", payload: any) => {
    setIsProcessing(true);
    try {
      const endpoint = type === "url" ? "/ingest/url" : "/ingest/file";
      
      const options: RequestInit = {
        method: "POST",
      };

      if (type === "url") {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify({ url: payload });
      } else {
        // payload is already FormData
        options.body = payload;
      }
      
      const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        ...options,
        mode: "cors"
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Ingestion failed");
      }
      setStep(3);
    } catch (err) {
      alert("Error ingestion: " + err);
    } finally {
      setIsProcessing(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    handleIngest("file", formData);
  };

  const analyzeStyle = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/persona/analyze", {
        method: "POST"
      });
      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();
      setIngestData(prev => ({ ...prev, bio: data.suggestion }));
    } catch (err) {
      alert("Error analyzing style: " + err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-parchment py-20 px-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 mb-12 opacity-60 hover:opacity-100 transition-opacity">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Step Indicator */}
        <div className="flex gap-4 mb-12">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? "bg-terracotta" : "bg-[#ddd9c1]"}`} 
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="claude-card p-12 claude-shadow"
        >
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="serif text-3xl font-bold mb-4">Mirror Identity</h2>
                <p className="opacity-60">Give your digital twin a name and a brief description of who it should represent.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider opacity-60">Your Name</label>
                  <input 
                    type="text" 
                    value={ingestData.name}
                    onChange={(e) => setIngestData({...ingestData, name: e.target.value})}
                    className="w-full bg-[#fcfbf7] border border-[#e8e6db] p-4 rounded-xl focus:outline-none focus:border-terracotta transition-colors text-xl serif"
                    placeholder="e.g. Yash"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold uppercase tracking-wider opacity-60">Brief Bio (Style Reference)</label>
                    <button 
                      onClick={analyzeStyle}
                      disabled={isProcessing}
                      className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-near-black text-ivory hover:scale-105 transition-all disabled:opacity-20"
                    >
                      {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Auto-Analyze Style
                    </button>
                  </div>
                  <textarea 
                    value={ingestData.bio}
                    onChange={(e) => setIngestData({...ingestData, bio: e.target.value})}
                    className="w-full bg-[#fcfbf7] border border-[#e8e6db] p-4 rounded-xl focus:outline-none focus:border-terracotta transition-colors min-h-[120px]"
                    placeholder="How do you usually talk? Professional? Casual? Direct?"
                  />
                </div>
              </div>
              <button 
                onClick={savePersona}
                disabled={isProcessing}
                className="w-full bg-near-black text-ivory py-4 rounded-xl font-medium text-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save & Next Step"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div>
                <h2 className="serif text-3xl font-bold mb-4">Feed Your Mirror</h2>
                <p className="opacity-60">Upload documents or provide links to your social profiles/blogs to align the AI with your facts.</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <input 
                  type="file" 
                  className="hidden" 
                  id="fileInput"
                  onChange={onFileChange} 
                />
                <div 
                  onClick={() => document.getElementById("fileInput")?.click()}
                  className="p-8 border-2 border-dashed border-[#ddd9c1] rounded-2xl text-center hover:border-terracotta transition-colors group cursor-pointer"
                >
                  <Upload className="w-10 h-10 mx-auto mb-4 text-[#ddd9c1] group-hover:text-terracotta transition-colors" />
                  <p className="font-medium text-near-black opacity-60">
                    {isProcessing ? "Processing..." : "Upload PDF, Text, or Photo"}
                  </p>
                  <p className="text-sm opacity-30 mt-1">Resumes, notes, or meaningful images.</p>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <LinkIcon className="w-5 h-5 opacity-30" />
                  </div>
                  <input 
                    type="text" 
                    value={ingestData.url}
                    onChange={(e) => setIngestData({...ingestData, url: e.target.value})}
                    placeholder="https://..."
                    className="w-full bg-[#fcfbf7] border border-[#e8e6db] pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:border-terracotta transition-colors"
                  />
                  <button 
                    disabled={isProcessing || !ingestData.url}
                    onClick={() => handleIngest("url", ingestData.url)}
                    className="absolute right-2 top-2 bottom-2 bg-near-black text-ivory px-4 rounded-lg flex items-center gap-2 hover:bg-opacity-80 transition-all disabled:opacity-20"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add URL"}
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setStep(3)}
                className="w-full text-near-black opacity-30 py-4 rounded-xl font-medium text-sm hover:opacity-100 transition-all"
              >
                Skip Ingestion (Use Sample)
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8 space-y-6">
              <CheckCircle className="w-20 h-20 text-terracotta mx-auto" />
              <div>
                <h2 className="serif text-4xl font-bold mb-4">Mirror Manifested</h2>
                <p className="opacity-60 max-w-sm mx-auto">Your digital twin is now initialized with your persona and data. Ready to chat?</p>
              </div>
              <Link href="/chat" className="inline-block bg-terracotta text-ivory px-12 py-5 rounded-full text-xl font-medium hover:scale-105 transition-transform shadow-xl shadow-terracotta/20">
                Start Conversing
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
