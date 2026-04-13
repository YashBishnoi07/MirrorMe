"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-parchment text-near-black">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-terracotta rounded-lg rotate-12 flex items-center justify-center text-ivory font-bold">
            M
          </div>
          <span className="serif text-xl font-bold tracking-tight">MirrorMe</span>
        </div>
        <div className="flex items-center gap-8 text-sm font-medium">
          <Link href="#features" className="hover:text-terracotta transition-colors">Features</Link>
          <Link href="/chat" className="hover:text-terracotta transition-colors">Chat</Link>
          <Link href="/setup" className="bg-near-black text-ivory px-5 py-2.5 rounded-full hover:bg-opacity-90 transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-8 pt-20 pb-32 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="serif text-6xl md:text-8xl font-medium tracking-tight mb-8">
            An AI that <span className="italic text-terracotta">knows</span> you.
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto opacity-70 mb-12">
            MirrorMe creates a digital twin that thinks, speaks, and acts based on your unique facts and personality.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/setup" className="bg-terracotta text-ivory px-8 py-4 rounded-full text-lg font-medium flex items-center gap-2 hover:scale-105 transition-transform group">
              Build Your Mirror
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/chat" className="px-8 py-4 rounded-full text-lg font-medium border border-[#ddd9c1] hover:bg-[#eae7d6] transition-colors">
              Try Demo
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-ivory py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-parchment rounded-xl flex items-center justify-center text-terracotta claude-shadow">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="serif text-2xl font-bold">Total Alignment</h3>
              <p className="opacity-60 leading-relaxed">
                Using advanced RAG technology, MirrorMe stays perfectly aligned with your facts, professional history, and values.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-parchment rounded-xl flex items-center justify-center text-terracotta claude-shadow">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="serif text-2xl font-bold">Privacy First</h3>
              <p className="opacity-60 leading-relaxed">
                Your data stays private. We process your information securely to ensure your digital mirror is yours alone.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-parchment rounded-xl flex items-center justify-center text-terracotta claude-shadow">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="serif text-2xl font-bold">Instant Integration</h3>
              <p className="opacity-60 leading-relaxed">
                Upload your resume, social feeds, or personal notes to create a functional agent in minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 text-center opacity-40 text-sm">
        <p>© 2026 MirrorMe — Built for Yash</p>
      </footer>
    </main>
  );
}
