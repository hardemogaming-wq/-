import React from "react";
import { Bot, Sparkles } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex w-full space-x-4 px-4 py-6 md:px-6 bg-neutral-900/10 border-b border-neutral-900/10">
      {/* Avatar */}
      <div className="shrink-0">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-teal-400 shadow-md">
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          <Bot className="h-5 w-5" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 min-w-0 font-sans">
        {/* Header */}
        <div className="flex items-center space-x-2.5">
          <span className="text-xs font-bold text-neutral-200">Aura-AI Bot</span>
          <span className="inline-flex items-center text-[9px] font-mono font-medium text-teal-400/90 bg-teal-500/5 border border-teal-500/10 px-1.5 py-0.5 rounded-md animate-pulse">
            Thinking...
          </span>
        </div>

        {/* Fluid Loading Indicator */}
        <div className="flex items-center space-x-2 py-3">
          {/* Glowing pulse ripples */}
          <div className="flex items-center space-x-1.5 bg-neutral-950/60 border border-neutral-900 px-3.5 py-2.5 rounded-2xl shadow-inner relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-indigo-500/5 to-purple-500/5 animate-pulse" />
            
            {/* Dots */}
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.3s]"></span>
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.15s]"></span>
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce"></span>
            
            <span className="text-[11px] font-medium text-neutral-400/80 font-mono ml-2 tracking-wide">
              Aura-AI is synthesizing...
            </span>
          </div>

          <Sparkles className="h-4 w-4 text-teal-400/60 animate-pulse ml-1" />
        </div>
      </div>
    </div>
  );
}
