import React from "react";
import { Terminal, Code, Cpu, Bug, Sparkles, MessageSquare } from "lucide-react";

interface WelcomeLandingProps {
  onSelectSuggestion: (prompt: string) => void;
}

export default function WelcomeLanding({ onSelectSuggestion }: WelcomeLandingProps) {
  const features = [
    {
      icon: <Code className="h-5 w-5 text-teal-400" />,
      title: "Synthesize Code",
      desc: "Produces flawless, well-commented code blocks in TypeScript, Python, C++, Go, and Rust.",
    },
    {
      icon: <Bug className="h-5 w-5 text-indigo-400" />,
      title: "Diagnostic Debugger",
      desc: "Paste stack traces, core dumps, or complex code blocks to diagnose logic bugs instantly.",
    },
    {
      icon: <Cpu className="h-5 w-5 text-purple-400" />,
      title: "Systems Architect",
      desc: "Design robust, scalable database designs, API contracts, and microservice topologies.",
    },
  ];

  const suggestions = [
    "Build an interactive task dashboard in React with Tailwind CSS",
    "Explain the security difference between JWTs and HttpOnly Cookie sessions",
    "Write an optimized Python script to parse HTML tables into a formatted CSV",
    "Analyze and debug a Node.js memory leak with async hook traces",
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-16 text-center space-y-12 select-none">
      {/* Visual Accent */}
      <div className="relative inline-flex items-center justify-center">
        {/* Pulsing neon radial glow */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-600 opacity-30 blur-2xl animate-pulse"></div>
        <div className="relative rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-2xl backdrop-blur-xl">
          <Terminal className="h-10 w-10 text-teal-400" />
        </div>
      </div>

      {/* Hero Typography */}
      <div className="space-y-4">
        <h1 className="bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl md:text-6xl font-sans">
          AURA-AI <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 bg-clip-text text-transparent">CLIENT</span>
        </h1>
        <p className="mx-auto max-w-xl text-sm md:text-base text-neutral-400/90 leading-relaxed font-sans">
          Welcome to your advanced software engineering assistant. Powered by{" "}
          <span className="text-teal-400 font-mono font-medium">Codestral Engine</span>. Optimized for extreme reasoning, rapid scripting, and logical analysis.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 text-left font-sans">
        {features.map((item, idx) => (
          <div
            key={idx}
            className="group relative rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-neutral-700 hover:bg-neutral-900/60 hover:-translate-y-0.5"
          >
            {/* Subtle corner glow */}
            <div className="absolute top-0 right-0 h-10 w-10 bg-radial-glow opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none rounded-tr-2xl"></div>
            
            <div className="mb-3.5 inline-block rounded-xl bg-neutral-950/60 p-2.5 border border-neutral-800/50 group-hover:border-neutral-700/50 transition-colors">
              {item.icon}
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-teal-300 transition-colors">
              {item.title}
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Prompt Accelerators */}
      <div className="space-y-4 pt-4 text-left font-sans">
        <div className="flex items-center space-x-2 text-neutral-300">
          <Sparkles className="h-4 w-4 text-teal-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Select a starter blueprint
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSuggestion(prompt)}
              className="flex items-start text-left space-x-3 rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-4.5 text-xs text-neutral-400 hover:border-neutral-700/80 hover:bg-neutral-900/50 hover:text-white transition-all active:scale-[0.98] cursor-pointer group"
            >
              <MessageSquare className="h-4 w-4 text-neutral-500 group-hover:text-teal-400 shrink-0 mt-0.5 transition-colors" />
              <span className="leading-relaxed font-medium">{prompt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
