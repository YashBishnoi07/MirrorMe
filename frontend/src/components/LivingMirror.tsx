"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, CameraOff, Loader2, RefreshCw, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LivingMirror({ 
  isActive, 
  onMoodChange 
}: { 
  isActive: boolean;
  onMoodChange?: (mood: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [lastCaptureUrl, setLastCaptureUrl] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState("Neutral");
  const [isCapturing, setIsCapturing] = useState(false);

  // Handle Camera Stream Lifecycle (The "Blink")
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isStreamActive) {
      navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            // More reliable trigger: Wait for stream to be ready then capture
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              setTimeout(() => performCapture(), 1200); // Slightly longer for stability
            };
          }
        })
        .catch(err => {
          console.error("Camera access denied", err);
          setIsStreamActive(false);
          setIsCapturing(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isStreamActive]);

  const handleManualCapture = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setIsStreamActive(true); // This starts the "Blink"
  };

  const performCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Draw frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
      setLastCaptureUrl(dataUrl);
      
      // STOP STREAM IMMEDIATELY (The Blink completes)
      setIsStreamActive(false);
      
      // Convert to blob for backend
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append("image", blob, "snapshot.jpg");

        try {
          const res = await fetch("http://127.0.0.1:8000/chat/mood", {
            method: "POST",
            body: formData
          });
          const data = await res.json();
          const detectedMood = data.mood || "Neutral";
          processMoodChange(detectedMood);
        } catch (e) {
          console.error("Mood analysis failed", e);
        } finally {
          setIsCapturing(false);
        }
      }, "image/jpeg", 0.7);
    } else {
      setIsCapturing(false);
      setIsStreamActive(false);
    }
  };

  const processMoodChange = (mood: string) => {
    const normalized = mood.toLowerCase();
    let themeClass = "";
    
    if (normalized.includes("happy") || normalized.includes("excited") || normalized.includes("smile") || normalized.includes("cheerful")) themeClass = "mood-happy";
    else if (normalized.includes("tired") || normalized.includes("sad") || normalized.includes("sleepy") || normalized.includes("bored")) themeClass = "mood-tired";
    else if (normalized.includes("focused") || normalized.includes("productive") || normalized.includes("working") || normalized.includes("intent")) themeClass = "mood-focused";
    else if (normalized.includes("calm") || normalized.includes("relaxed") || normalized.includes("peaceful") || normalized.includes("neutral")) themeClass = "mood-calm";
    else if (normalized.includes("stressed") || normalized.includes("anxious") || normalized.includes("angry") || normalized.includes("frown")) themeClass = "mood-stressed";

    document.documentElement.className = themeClass;
    setCurrentMood(mood);
    if (onMoodChange) onMoodChange(mood);
  };

  // Reset theme if disabled
  useEffect(() => {
    if (!isActive) {
      document.documentElement.className = "";
      setLastCaptureUrl(null);
      setIsStreamActive(false);
    } else {
      handleManualCapture(); // Initial blink on activation
    }
  }, [isActive]);

  return (
    <div className="fixed bottom-24 right-8 z-30 pointer-events-none">
      {/* Hidden processing area */}
      <video ref={videoRef} autoPlay muted playsInline width="1" height="1" className="opacity-0 absolute" />
      <canvas ref={canvasRef} className="hidden" />
      
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="pointer-events-auto flex flex-col items-end gap-3"
          >
            {/* The "Theme Seed" Preview (User requested to see the photo it works on) */}
            {lastCaptureUrl && (
              <motion.div 
                layoutId="mirror-preview"
                className="w-24 h-24 rounded-2xl border-2 border-accent shadow-2xl overflow-hidden bg-near-black relative group claude-shadow"
              >
                <img src={lastCaptureUrl} className="w-full h-full object-cover grayscale sepia-[0.2]" alt="Theme Seed" />
                <div className="absolute inset-0 bg-accent/10 mix-blend-overlay" />
                
                <AnimatePresence>
                  {isCapturing && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-near-black/60 backdrop-blur-sm"
                    >
                      <Loader2 className="w-6 h-6 animate-spin text-ivory" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Manual Trigger Overlay */}
                <button 
                  onClick={handleManualCapture}
                  disabled={isCapturing}
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-accent/80 text-ivory flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
                >
                  <RefreshCw className={cn("w-6 h-6", isCapturing && "animate-spin")} />
                </button>
              </motion.div>
            )}

            {/* Status Pill */}
            <div 
              onClick={handleManualCapture}
              className="bg-ivory/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-border shadow-2xl flex items-center gap-4 claude-shadow cursor-pointer hover:border-accent group transition-all"
            >
              <div className="relative">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  isCapturing ? "bg-accent/20" : "bg-accent/10 group-hover:bg-accent/20"
                )}>
                  {isCapturing ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : <Eye className="w-4 h-4 text-accent" />}
                </div>
                {isCapturing && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full animate-ping" />}
              </div>
              
              <div className="flex flex-col pr-4 border-r border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-40">Mirror Reflection</span>
                <span className="text-sm font-bold serif italic text-fg/90">{currentMood}</span>
              </div>
              
              <button 
                className="p-1.5 hover:bg-accent/10 rounded-xl text-accent transition-colors"
                title="Refresh Mirror"
              >
                <RefreshCw className={cn("w-4 h-4", isCapturing && "animate-spin")} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
