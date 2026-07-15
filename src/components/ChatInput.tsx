import React, { useRef, useEffect, useState } from "react";
import { Send, CornerDownLeft, Sparkles, Loader2, Paperclip, X, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (files?: File[]) => void;
  isLoading: boolean;
  placeholder?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  isLoading,
  placeholder = "Ask Aura-AI a question or paste code...",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const maxChars = 8000;

  // Auto-resize the textarea height based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || selectedFiles.length > 0) && !isLoading) {
        onSend(selectedFiles.length > 0 ? selectedFiles : undefined);
        setSelectedFiles([]);
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxChars) {
      onChange(text);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => {
        const combined = [...prev, ...files];
        // Limit to say, max 10 files
        return combined.slice(0, 10);
      });
    }
    // Clear the input so the same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSendClick = () => {
    if ((value.trim() || selectedFiles.length > 0) && !isLoading) {
      onSend(selectedFiles.length > 0 ? selectedFiles : undefined);
      setSelectedFiles([]);
    }
  };

  return (
    <div className="relative font-sans w-full">
      {/* Background glow when typing */}
      <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-purple-500/10 opacity-0 blur-xl transition-opacity duration-300 pointer-events-none ${value || selectedFiles.length > 0 ? "opacity-100" : ""}`} />

      {/* File Preview Area */}
      <div className="absolute bottom-full mb-3 left-0 flex flex-wrap gap-2 z-20 max-w-full">
        <AnimatePresence>
          {selectedFiles.map((file, idx) => (
            <motion.div
              key={`${file.name}-${idx}`}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="flex items-center space-x-2 p-1.5 bg-neutral-900/95 border border-teal-500/30 rounded-xl backdrop-blur-md shadow-xl max-w-xs"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-[11px] font-bold text-neutral-200 truncate max-w-[120px]">{file.name}</p>
                <p className="text-[9px] text-neutral-500 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={() => removeFile(idx)}
                className="p-1 hover:bg-neutral-800 rounded-md transition-colors text-neutral-400 hover:text-rose-400"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main container: Fully rounded compact pill like ChatGPT */}
      <div className="relative flex items-end rounded-2xl md:rounded-3xl border border-neutral-800 bg-neutral-900/60 pl-3 md:pl-4 pr-1.5 py-1.5 shadow-2xl backdrop-blur-md focus-within:border-teal-500/40 focus-within:bg-neutral-900/80 transition-all duration-300">
        
        {/* File Upload Hidden Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
        />

        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="p-2.5 text-neutral-500 hover:text-teal-400 hover:bg-neutral-800/50 rounded-xl transition-all mb-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Attach files (you can select multiple)"
        >
          <Paperclip className="h-4.5 w-4.5 stroke-[2.5]" />
        </button>

        {/* Text Input area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className="min-h-[2.5rem] max-h-[160px] flex-1 resize-none bg-transparent py-2.5 pr-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 font-sans leading-relaxed"
        />

        {/* Action Controls Inline */}
        <div className="flex items-center space-x-2 pb-1 select-none shrink-0">
          {/* Subtle characters count on desktop when typing */}
          {value.length > 100 && (
            <span className="hidden md:inline-block text-[10px] text-neutral-500 font-mono pr-1">
              {value.length}/{maxChars}
            </span>
          )}

          {/* Glowing Send/Loading Button */}
          <motion.button
            onClick={handleSendClick}
            disabled={(!value.trim() && selectedFiles.length === 0 && !isLoading) || isLoading}
            whileHover={(value.trim() || selectedFiles.length > 0) && !isLoading ? { scale: 1.06, y: -0.5 } : {}}
            whileTap={(value.trim() || selectedFiles.length > 0) && !isLoading ? { scale: 0.95 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={`relative flex h-9.5 w-9.5 items-center justify-center rounded-xl md:rounded-2xl transition-all ${
              isLoading
                ? "bg-gradient-to-r from-teal-500/10 via-indigo-600/10 to-purple-500/10 text-teal-400 border border-teal-500/30 animate-pulse cursor-wait"
                : (value.trim() || selectedFiles.length > 0)
                ? "bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-lg shadow-teal-500/20 cursor-pointer"
                : "bg-neutral-800/80 text-neutral-500 cursor-not-allowed"
            }`}
          >
            {/* Floating inner gradient for glow effect */}
            <AnimatePresence>
              {(value.trim() || selectedFiles.length > 0) && !isLoading && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.2, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute -inset-1 rounded-xl md:rounded-2xl bg-gradient-to-r from-teal-400 to-indigo-500 blur-xs pointer-events-none"
                />
              )}
            </AnimatePresence>
            <motion.div
              animate={(value.trim() || selectedFiles.length > 0) && !isLoading ? { rotate: [0, -5, 0], scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {isLoading ? (
                <Loader2 className="relative h-4 w-4 stroke-[2.5] animate-spin" />
              ) : (
                <Send className="relative h-4 w-4 stroke-[2.5]" />
              )}
            </motion.div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
