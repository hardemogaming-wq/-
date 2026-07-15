import React, { useEffect, useRef } from "react";
import { Terminal, X, Maximize2, Minimize2, Circle } from "lucide-react";

interface TerminalPanelProps {
  outputs: string[];
  isOpen: boolean;
  onClose: () => void;
}

export default function TerminalPanel({ outputs, isOpen, onClose }: TerminalPanelProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [outputs]);

  if (!isOpen) return null;

  return (
    <div className="w-full lg:w-[40%] h-full bg-neutral-900 border-l border-neutral-800 flex flex-col shadow-2xl relative z-40 overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-950 border-b border-neutral-800 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5 mr-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <Terminal className="h-4 w-4 text-neutral-400" />
          <span className="text-xs font-bold text-neutral-300 font-mono tracking-tight uppercase">Agent Terminal</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-neutral-800 rounded-md transition-colors text-neutral-500 hover:text-neutral-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed selection:bg-teal-500/30">
        <div className="space-y-3">
          {outputs.length === 0 ? (
            <div className="text-neutral-600 italic">
              <span className="text-teal-500 mr-2">aura-agent:~$</span>
              Waiting for agent activity...
            </div>
          ) : (
            outputs.map((output, idx) => (
              <div key={idx} className="animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex items-start space-x-2">
                  <span className="text-teal-500 font-bold shrink-0">aura-agent:~$</span>
                  <pre className="text-neutral-200 whitespace-pre-wrap break-all flex-1">
                    {output}
                  </pre>
                </div>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Terminal Footer */}
      <div className="px-4 py-2 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4 text-[10px] font-mono text-neutral-500">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span>SESSION: ACTIVE</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Circle className="w-2 h-2 fill-neutral-600 text-neutral-600" />
            <span>ENCODING: UTF-8</span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-neutral-600">Aura-OS v2.5.0</span>
      </div>
    </div>
  );
}
