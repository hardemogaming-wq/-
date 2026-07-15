import React from "react";
import Markdown from "react-markdown";
import { Bot, User, Cpu, Code, Calendar, Copy, Check, Edit3, Brain, ChevronDown, ChevronUp, Download } from "lucide-react";
import { Message } from "../types";
import CodeBlock from "./CodeBlock";

interface MessageItemProps {
  message: Message;
  userName: string;
  onEditMessage?: (newContent: string) => void;
}

export default function MessageItem({ message, userName, onEditMessage }: MessageItemProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(message.content);
  const [isThoughtsExpanded, setIsThoughtsExpanded] = React.useState(true);

  const handleDownload = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    // Extract filename from URL or path
    const fileName = url.split("/").pop() || "download";
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  // Helper to parse streamed thoughts inside <thought>...</thought>
  const parseThoughts = (text: string | null | undefined) => {
    const safeText = text || "";
    if (safeText.includes("<thought>")) {
      const parts = safeText.split("<thought>");
      const before = parts[0];
      const thoughtAndRest = parts[1];
      if (thoughtAndRest.includes("</thought>")) {
        const subparts = thoughtAndRest.split("</thought>");
        return {
          before,
          thoughts: subparts[0].trim(),
          content: subparts.slice(1).join("</thought>").trim(),
          isThinking: false
        };
      } else {
        return {
          before,
          thoughts: thoughtAndRest.trim(),
          content: "",
          isThinking: true
        };
      }
    }
    return {
      before: safeText,
      thoughts: null,
      content: safeText,
      isThinking: false
    };
  };

  const parsed = parseThoughts(message.content);
  const agentData = message.agentData;

  return (
    <div
      className={`group flex w-full space-x-4 px-4 py-6 md:px-6 transition-colors border-b border-neutral-900/10 ${
        isUser ? "bg-neutral-950/20" : "bg-neutral-900/10"
      }`}
    >
      {/* Avatar Container */}
      <div className="shrink-0">
        {isUser ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 font-mono text-xs font-bold text-white shadow-md shadow-indigo-500/10 select-none">
            {userName.substring(0, 2).toUpperCase() || "DV"}
          </div>
        ) : (
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-teal-400 shadow-md select-none">
            {/* Glowing active indicator */}
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <Bot className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Message Body */}
      <div className="flex-1 space-y-2 min-w-0 font-sans select-text">
        {/* Name and Timestamp Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-bold text-neutral-200 select-none">
              {isUser ? userName : "Aura-AI Bot"}
            </span>
            <span className="text-[10px] text-neutral-500 select-none font-mono">
              {formatTime(message.timestamp)}
            </span>
            {!isUser && (
              <span className="inline-flex items-center text-[9px] font-mono font-medium text-teal-400/90 bg-teal-500/5 border border-teal-500/10 px-1.5 py-0.5 rounded-md select-none">
                Aura-AI
              </span>
            )}
          </div>

          {/* Quick Actions (Copy & Edit) */}
          <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center space-x-1 select-none">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer flex items-center space-x-1"
              title="Copy message / نسخ"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-teal-400 animate-in zoom-in duration-150" />
                  <span className="text-[9px] text-teal-400 font-mono">Copied</span>
                </>
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Edit button (User message only) */}
            {isUser && onEditMessage && (
              <button
                onClick={() => {
                  setEditText(message.content);
                  setIsEditing(true);
                }}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer"
                title="Edit message / تعديل"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Formatted Text Content */}
        <div className="text-neutral-300 leading-relaxed text-sm md:text-[15px] prose prose-invert max-w-none break-words">
          {isEditing ? (
            <div className="mt-2 space-y-2 select-none">
              <textarea
                className="w-full rounded-xl bg-neutral-950 border border-neutral-800 p-3.5 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-sans select-text"
                rows={Math.max(2, editText.split("\n").length)}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
              <div className="flex items-center space-x-2 justify-end text-xs">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all cursor-pointer"
                >
                  Cancel / إلغاء
                </button>
                <button
                  onClick={() => {
                    if (onEditMessage && editText.trim() && editText.trim() !== message.content) {
                      onEditMessage(editText.trim());
                    }
                    setIsEditing(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 transition-all cursor-pointer font-medium"
                >
                  Save & Send / حفظ وإرسال
                </button>
              </div>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed select-text">{message.content}</p>
          ) : (
            <div className="space-y-4">
              {/* Agent Mode Reasoning & Tool Use */}
              {agentData && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 overflow-hidden font-sans mb-3">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-rose-500/10 text-rose-400 text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Cpu className="h-4 w-4 animate-pulse" />
                      <span>Agent Reasoning & Logic</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Thought Process */}
                    {agentData.thought && (
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2 text-[10px] text-rose-300/80 font-bold uppercase">
                          <Brain className="h-3 w-3" />
                          <span>Thinking Process</span>
                        </div>
                        <div className="text-xs text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap bg-neutral-950/40 p-3 rounded-lg border border-neutral-800/50">
                          {agentData.thought}
                        </div>
                      </div>
                    )}

                    {/* Tool Execution */}
                    {agentData.tool === "run_command" && agentData.command && (
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2 text-[10px] text-amber-300/80 font-bold uppercase">
                          <Code className="h-3 w-3" />
                          <span>Executing Tool: run_command</span>
                        </div>
                        <div className="text-xs text-amber-400 font-mono bg-neutral-950 p-3 rounded-lg border border-amber-900/30">
                          <span className="text-emerald-500 mr-2">$</span>
                          {agentData.command}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Deep Thinking Collapsible Panel */}
              {parsed.thoughts && (
                <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/10 overflow-hidden font-sans select-none">
                  <button
                    onClick={() => setIsThoughtsExpanded(!isThoughtsExpanded)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-neutral-900/20 hover:bg-neutral-900/40 text-neutral-400 hover:text-neutral-200 text-xs font-medium font-sans cursor-pointer transition-all"
                  >
                    <div className="flex items-center space-x-2">
                      <Brain className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
                      <span className="font-sans">Thinking Process / عملية التفكير العميق</span>
                      {parsed.isThinking && (
                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
                      )}
                    </div>
                    {isThoughtsExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {isThoughtsExpanded && (
                    <div className="px-4 py-3 text-xs leading-relaxed text-neutral-400/90 border-t border-neutral-900/30 font-mono whitespace-pre-wrap select-text bg-neutral-950/20 max-h-52 overflow-y-auto">
                      {parsed.thoughts}
                      {parsed.isThinking && (
                        <span className="inline-block h-3.5 w-1 ml-0.5 bg-teal-500 animate-pulse" />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Main Bot Message Body */}
              {parsed.content ? (
                <div className="markdown-body select-text">
                  <Markdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        const isInline = !match && !String(children).includes("\n");
                        return !isInline ? (
                          <CodeBlock
                            language={match ? match[1] : "code"}
                            value={String(children).replace(/\n$/, "")}
                          />
                        ) : (
                          <code
                            className="rounded bg-neutral-950 px-1.5 py-0.5 text-xs font-mono font-bold text-teal-400 border border-neutral-900/50"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => (
                        <p className="mb-4 last:mb-0 leading-relaxed font-sans text-neutral-300/95 font-normal">
                          {children}
                        </p>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-lg md:text-xl font-bold text-white mt-6 mb-3 tracking-tight border-b border-neutral-900/55 pb-1">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base md:text-lg font-bold text-white mt-5 mb-2.5 tracking-tight">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm md:text-base font-bold text-white mt-4 mb-2 tracking-tight">
                          {children}
                        </h3>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 mb-4 space-y-1.5 text-neutral-300">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-neutral-300">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="leading-relaxed pl-0.5 text-sm md:text-[14.5px]">
                          {children}
                        </li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-teal-500/40 bg-neutral-950/35 rounded-r-xl px-4 py-3 my-4 italic text-neutral-400/90 text-sm">
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-5 rounded-xl border border-neutral-800 bg-neutral-950/20 shadow-inner">
                          <table className="w-full text-left text-xs border-collapse">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-neutral-950/80 border-b border-neutral-800 font-semibold text-neutral-400">
                          {children}
                        </thead>
                      ),
                      tbody: ({ children }) => (
                        <tbody className="divide-y divide-neutral-900/80">
                          {children}
                        </tbody>
                      ),
                      tr: ({ children }) => (
                        <tr className="hover:bg-neutral-900/20 transition-colors">
                          {children}
                        </tr>
                      ),
                      th: ({ children }) => (
                        <th className="px-4 py-2.5 font-medium">{children}</th>
                      ),
                      td: ({ children }) => (
                        <td className="px-4 py-2.5 text-neutral-300 font-normal">
                          {children}
                        </td>
                      ),
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-400 hover:text-teal-300 hover:underline font-medium transition-colors"
                        >
                          {children}
                        </a>
                      ),
                      img: ({ node, src, alt, ...props }: any) => {
                        if (!src || src.trim() === "") return null;
                        return (
                          <img
                            src={src}
                            alt={alt || ""}
                            className="max-w-full rounded-xl border border-neutral-850/80 my-4 shadow-lg select-text"
                            referrerPolicy="no-referrer"
                            {...props}
                          />
                        );
                      },
                    }}
                  >
                    {parsed.content}
                  </Markdown>

                  {/* Glowing Download Button for Agent Mode */}
                  {agentData?.downloadUrl && (
                    <div className="mt-6 p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400">
                          <Download className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-teal-400">تحميل الملف المعدل / Download Fixed File</p>
                          <p className="text-[10px] text-neutral-500 font-mono">{agentData.downloadUrl.split('/').pop()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(agentData.downloadUrl!)}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-500 text-neutral-950 font-bold text-xs hover:bg-teal-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(20,184,166,0.3)] cursor-pointer flex items-center justify-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download Now / تحميل الآن</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                parsed.isThinking && (
                  <div className="flex items-center space-x-2 text-xs text-neutral-500 font-sans italic animate-pulse py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400 inline-block"></span>
                    <span>Aura-AI is thinking / جاري التفكير بعمق...</span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
