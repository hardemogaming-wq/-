import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
  ChevronLeft,
  Menu,
  Sparkles,
  Bot,
  Github,
} from "lucide-react";
import { Chat } from "../types";

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelectChat: (id: string) => void;
  onCreateNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onClearAllChats: () => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  onOpenGithubConfig: () => void;
  userName: string;
}

export default function Sidebar({
  chats,
  currentChatId,
  isOpen,
  onToggleOpen,
  onSelectChat,
  onCreateNewChat,
  onDeleteChat,
  onClearAllChats,
  onRenameChat,
  onOpenSettings,
  onOpenGithubConfig,
  userName,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus editing input on mount
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartRename = (e: React.MouseEvent, chat: Chat) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      handleSaveRename(id);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  return (
    <>
      {/* Sidebar Mobile Toggle Overlay (blur & shadow background when sidebar is open on mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onToggleOpen}
        />
      )}

      {/* Actual Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-neutral-900/80 bg-neutral-950/95 shadow-2xl transition-all duration-300 ${
          isOpen
            ? "translate-x-0 w-72 opacity-100 lg:static"
            : "-translate-x-full lg:w-0 lg:opacity-0 lg:pointer-events-none lg:static"
        }`}
      >
        {/* Header Branding */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-900/60 px-5">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center justify-center h-8.5 w-8.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
              <Bot className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-white tracking-wider font-sans">
                AURA-AI
              </span>
              <span className="ml-1 text-[10px] font-mono font-medium text-teal-400 px-1 py-0.5 rounded bg-teal-500/5 border border-teal-500/10">
                CLIENT
              </span>
            </div>
          </div>

          <button
            onClick={onToggleOpen}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white lg:hidden cursor-pointer"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Action Button: Create New Chat */}
        <div className="p-4 space-y-2">
          <button
            onClick={onCreateNewChat}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/5 hover:shadow-teal-500/15 transition-all duration-200 active:scale-98 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
            <span>New Session</span>
          </button>

          {chats.length > 0 && (
            <button
              onClick={onClearAllChats}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-neutral-900/50 hover:bg-rose-500/10 border border-neutral-800 hover:border-rose-500/30 px-4 py-2 text-xs font-bold text-neutral-400 hover:text-rose-400 transition-all duration-200 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All Sessions</span>
            </button>
          )}
        </div>

        {/* Navigation / Chat Logs List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 font-sans">
            Conversations ({chats.length})
          </div>

          {chats.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-600 font-sans italic">
              No chats yet. Start a new session.
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = chat.id === currentChatId;
              const isEditing = chat.id === editingId;

              return (
                <div
                  key={chat.id}
                  onClick={() => !isEditing && onSelectChat(chat.id)}
                  className={`group relative flex items-center justify-between rounded-xl px-3.5 py-3 text-sm transition-all duration-150 font-sans cursor-pointer ${
                    isActive
                      ? "bg-neutral-900/90 text-white border border-neutral-800/80 shadow-md"
                      : "text-neutral-400 hover:bg-neutral-900/30 hover:text-neutral-200 border border-transparent"
                  }`}
                >
                  <div className="flex flex-1 items-center space-x-3 min-w-0">
                    <MessageSquare
                      className={`h-4.5 w-4.5 shrink-0 ${
                        isActive ? "text-teal-400" : "text-neutral-500 group-hover:text-neutral-400"
                      }`}
                    />

                    {isEditing ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleSaveRename(chat.id)}
                        onKeyDown={(e) => handleKeyDown(e, chat.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-neutral-950 border border-teal-500/50 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                      />
                    ) : (
                      <span className="truncate font-medium leading-none text-xs">
                        {chat.title}
                      </span>
                    )}
                  </div>

                  {/* Hover Actions: Edit and Delete */}
                  {!isEditing && (
                    <div className="flex items-center space-x-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-within:opacity-100 transition-opacity ml-2 shrink-0">
                      <button
                        onClick={(e) => handleStartRename(e, chat)}
                        className="rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200 transition-colors cursor-pointer"
                        title="Rename conversation"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                        className="rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex items-center space-x-1 ml-2 shrink-0">
                      <button
                        onMouseDown={() => handleSaveRename(chat.id)}
                        className="rounded p-1 text-emerald-400 hover:bg-neutral-800 cursor-pointer"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer: User Details & Settings Option */}
        <div className="border-t border-neutral-900/60 bg-neutral-950/40 p-4">
          <div className="flex items-center justify-between rounded-xl bg-neutral-900/30 border border-neutral-900/40 p-2.5">
            <div className="flex items-center space-x-2.5 min-w-0">
              {/* User Avatar Circle */}
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/20 font-mono text-xs font-bold text-teal-400">
                {userName.substring(0, 2).toUpperCase() || "DV"}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-neutral-950" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white font-sans leading-none mb-0.5">
                  {userName || "Developer"}
                </p>
                <p className="text-[9px] font-mono text-neutral-500 leading-none">
                  Online Client
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={onOpenGithubConfig}
                className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800/80 hover:text-indigo-400 transition-all cursor-pointer"
                title="GitHub Builder Config"
              >
                <Github className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={onOpenSettings}
                className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800/80 hover:text-white transition-all cursor-pointer"
                title="Open settings panel"
              >
                <Settings className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
