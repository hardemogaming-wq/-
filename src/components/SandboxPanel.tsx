import React, { useState, useEffect } from "react";
import { 
  File, 
  Folder, 
  Download, 
  Copy, 
  Check, 
  ChevronRight, 
  X, 
  FileCode, 
  Terminal, 
  FolderOpen,
  ArrowRightLeft,
  Maximize2,
  Minimize2,
  Zap
} from "lucide-react";
import { SandboxFile, downloadZip } from "../lib/sandbox";
import { motion, AnimatePresence } from "motion/react";

interface SandboxPanelProps {
  files: SandboxFile[];
  isOpen: boolean;
  onClose: () => void;
  chatTitle?: string;
}

export default function SandboxPanel({ files, isOpen, onClose, chatTitle }: SandboxPanelProps) {
  const [selectedFile, setSelectedFile] = useState<SandboxFile | null>(null);
  const [copied, setCopied] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Automatically select the first file when files load or change
  useEffect(() => {
    if (files.length > 0) {
      if (!selectedFile || !files.some(f => f.path === selectedFile.path)) {
        setSelectedFile(files[0]);
      } else {
        // Keep the selected file but update its content if it changed
        const updated = files.find(f => f.path === selectedFile.path);
        if (updated) {
          setSelectedFile(updated);
        }
      }
    } else {
      setSelectedFile(null);
    }
  }, [files]);

  if (!isOpen || files.length === 0) return null;

  const handleCopyCode = async () => {
    if (!selectedFile) return;
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleDownloadZip = () => {
    downloadZip(files, chatTitle || "aura-workspace-project");
  };

  return (
    <>
      {/* Sandbox Mobile Toggle Overlay */}
      <div
        className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, x: 400 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 400 }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }}
        className={`fixed inset-y-0 right-0 z-40 flex h-full flex-col border-l border-neutral-900/60 bg-neutral-950/95 backdrop-blur-md transition-all duration-300 md:static md:inset-auto md:z-20 md:h-full ${
          isMaximized ? "w-full md:w-[85vw] lg:w-[75vw]" : "w-full md:w-[450px] lg:w-[580px]"
        }`}
      >
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-teal-500/5 blur-[80px] pointer-events-none" />

      {/* Panel Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-neutral-900/60 select-none">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500/10 to-indigo-500/10 border border-teal-500/20">
            <Zap className="h-4 w-4 text-teal-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-200">Aura Code Workspace</h3>
            <p className="text-[10px] text-neutral-500 font-mono">
              {files.length} {files.length === 1 ? "file" : "files"} detected
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Maximize/Minimize Toggle */}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 rounded-lg hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer"
            title={isMaximized ? "Minimize panel" : "Maximize panel"}
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Download ZIP */}
          <button
            onClick={handleDownloadZip}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 hover:text-teal-300 transition-all cursor-pointer"
            title="Download Project as ZIP / تحميل المشروع كامل"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline font-mono">ZIP</span>
          </button>

          {/* Close Panel */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Files sidebar */}
        <div className="w-1/3 border-r border-neutral-900/40 flex flex-col bg-neutral-950/40 select-none">
          <div className="p-3 border-b border-neutral-900/20">
            <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase flex items-center space-x-1.5">
              <FolderOpen className="h-3 w-3 text-teal-500/70" />
              <span>Project Explorer</span>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {files.map((file) => {
              const isSelected = selectedFile?.path === file.path;
              // Guess icon color based on extension
              const isHtml = file.path.endsWith(".html");
              const isCss = file.path.endsWith(".css");
              const isJs = file.path.endsWith(".js") || file.path.endsWith(".ts") || file.path.endsWith(".tsx") || file.path.endsWith(".jsx");
              
              let iconColor = "text-neutral-400";
              if (isHtml) iconColor = "text-orange-400";
              else if (isCss) iconColor = "text-blue-400";
              else if (isJs) iconColor = "text-yellow-400";

              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all text-xs cursor-pointer ${
                    isSelected
                      ? "bg-neutral-900 text-teal-400 font-medium border-l-2 border-teal-500"
                      : "text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200"
                  }`}
                >
                  <FileCode className={`h-4 w-4 shrink-0 ${isSelected ? "text-teal-400" : iconColor}`} />
                  <span className="truncate font-mono text-[11px]" title={file.path}>
                    {file.path.split("/").pop()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code editor / viewer */}
        <div className="w-2/3 flex flex-col bg-neutral-950/80 overflow-hidden relative">
          {selectedFile ? (
            <>
              {/* File Meta Header */}
              <div className="h-10 border-b border-neutral-900/40 flex items-center justify-between px-4 select-none">
                <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[70%]">
                  {selectedFile.path}
                </span>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center space-x-1 px-2 py-1 text-[10px] font-semibold text-neutral-400 hover:text-neutral-200 transition-colors rounded hover:bg-neutral-900 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-teal-400" />
                      <span className="text-teal-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code text container */}
              <div className="flex-1 overflow-auto p-4 font-mono text-xs text-neutral-300 leading-relaxed bg-neutral-950/90 select-text">
                <table className="w-full border-collapse">
                  <tbody>
                    {selectedFile.content.split("\n").map((line, idx) => (
                      <tr key={idx} className="hover:bg-neutral-900/40">
                        <td className="w-8 select-none text-neutral-600 text-right pr-4 align-top font-mono text-[10px]">
                          {idx + 1}
                        </td>
                        <td className="whitespace-pre-wrap break-all pl-1 text-neutral-200 font-mono">
                          {line || " "}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-neutral-500">
              <Terminal className="h-8 w-8 text-neutral-700 mb-2 animate-pulse" />
              <p className="text-xs font-mono">Select a file to inspect code</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  </>
  );
}
