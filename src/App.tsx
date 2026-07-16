import React, { useState, useEffect, useRef } from "react";
import { Menu, Bot, Trash2, Sliders, Sparkles, Wifi, MessageSquare, ChevronRight, CornerDownRight, Brain, Globe, Search, Zap, Cpu, Terminal as TerminalIcon } from "lucide-react";
import Sidebar from "./components/Sidebar";
import WelcomeLanding from "./components/WelcomeLanding";
import MessageItem from "./components/MessageItem";
import TypingIndicator from "./components/TypingIndicator";
import ChatInput from "./components/ChatInput";
import SettingsModal from "./components/SettingsModal";
import SandboxPanel from "./components/SandboxPanel";
import TerminalPanel from "./components/TerminalPanel";
import GitHubConfigModal from "./components/GitHubConfigModal";
import BuilderControls from "./components/BuilderControls";
import ConfirmationModal from "./components/ConfirmationModal";
import { aggregateChatFiles } from "./lib/sandbox";
import { Chat, Message, AppSettings, BuildStatus } from "./types";

export default function App() {
  // 1. Core States
  const [chats, setChats] = useState<Chat[]>(() => {
    try {
      const saved = localStorage.getItem("aura_ai_chats");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentChatId, setCurrentChatId] = useState<string | null>(() => {
    const saved = localStorage.getItem("aura_ai_chats");
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.length > 0 ? parsed[0].id : null;
    } catch {
      return null;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem("aura_ai_settings");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      userName: "Developer",
      temperature: 0.7,
      maxTokens: 2048,
      apiEndpoint: "https://hardemo-aura-ai.hf.space/v1",
      modelName: "Gemini 3.5 Flash",
      buildFramework: "flutter",
    };
  });

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [buildStatus, setBuildStatus] = useState<BuildStatus | null>(null);
  const [isBuilderCollapsed, setIsBuilderCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("builder_collapsed") === "true";
    }
    return false;
  });
  
  // Sandbox & Deep Thinking & Agent States
  const [deepThinking, setDeepThinking] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [deepSearch, setDeepSearch] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [sandboxFiles, setSandboxFiles] = useState<any[]>([]);
  const [terminalOutputs, setTerminalOutputs] = useState<string[]>([]);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Scroll anchor ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 2. Synchronize to localStorage
  useEffect(() => {
    localStorage.setItem("aura_ai_chats", JSON.stringify(chats));
  }, [chats]);

  // Build Status Polling Logic
  useEffect(() => {
    let interval: any;
    
    if (buildStatus && (buildStatus.status === "queued" || buildStatus.status === "in_progress" || buildStatus.status === "pushing")) {
      interval = setInterval(async () => {
        try {
          const response = await fetch("/api/build-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: settings.githubUsername,
              repo: settings.githubRepo,
              token: settings.githubToken
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            setBuildStatus(data);
            
            // If completed, clear interval
            if (data.status === "completed") {
              clearInterval(interval);
            }
          }
        } catch (err) {
          console.error("Failed to poll build status:", err);
        }
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [buildStatus, settings.githubUsername, settings.githubRepo, settings.githubToken]);

  useEffect(() => {
    localStorage.removeItem("aura_ai_current_chat_id");
  }, []);

  useEffect(() => {
    localStorage.setItem("aura_ai_settings", JSON.stringify(settings));
  }, [settings]);

  // Handle responsive sidebar based on window size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize(); // trigger on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-scroll on loading, stream updates, or message length changes
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    // If we are streaming or just received messages, scroll down
    scrollToBottom("smooth");
  }, [isLoading, chats]);

  const activeChat = chats.find((c) => c.id === currentChatId) || null;

  // Synchronize sandbox files whenever activeChat messages change
  useEffect(() => {
    if (activeChat) {
      const files = aggregateChatFiles(activeChat.messages);
      setSandboxFiles(files);
      // Auto open workspace panel when files are detected
      if (files.length > 0 && !isSandboxOpen) {
        setIsSandboxOpen(true);
      }
    } else {
      setSandboxFiles([]);
      setIsSandboxOpen(false);
    }
  }, [activeChat?.messages, currentChatId]);

  // 3. Conversation Actions
  const handleCreateNewChat = () => {
    const newChatId = crypto.randomUUID();
    const newChat: Chat = {
      id: newChatId,
      title: "New Session",
      messages: [],
      createdAt: Date.now(),
    };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    
    // Reset build and agent states for new session
    setBuildStatus(null);
    setAgentMode(false);
    setIsTerminalOpen(false);
    setIsSandboxOpen(false);
    setTerminalOutputs([]);

    if (window.innerWidth < 1024) {
      setSidebarOpen(false); // Auto close sidebar on mobile to view chat
    }
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false); // Auto close sidebar on mobile
    }
  };

  const handleDeleteChat = (id: string) => {
    const chatToDelete = chats.find(c => c.id === id);
    setConfirmModal({
      isOpen: true,
      title: "Delete Session",
      message: `Are you sure you want to delete "${chatToDelete?.title || "this session"}"? This action cannot be undone.`,
      onConfirm: () => {
        setChats((prev) => {
          const updated = prev.filter((c) => c.id !== id);
          if (currentChatId === id) {
            if (updated.length > 0) {
              setCurrentChatId(updated[0].id);
            } else {
              setCurrentChatId(null);
            }
          }
          return updated;
        });
      },
    });
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const handleGitPush = async () => {
    if (isPushing) return;
    
    // Check credentials first
    if (!settings.githubUsername || !settings.githubRepo || !settings.githubToken) {
      setIsGithubModalOpen(true);
      return;
    }

    // NEW: Check for App Icon presence
    if (!settings.appIcon) {
      setConfirmModal({
        isOpen: true,
        title: "⚠️ App Icon Required",
        message: "Please upload your App Icon (.png/.jpg) in the GitHub Configuration panel before starting the build! A custom icon is required for the Android build process.",
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setIsGithubModalOpen(true); // Direct user to the config modal where the upload is
        },
      });
      return;
    }

    setIsPushing(true);
    setBuildStatus({ status: "pushing" });

    try {
      const response = await fetch("/api/git-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          framework: settings.buildFramework,
          username: settings.githubUsername,
          repo: settings.githubRepo,
          token: settings.githubToken,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to push to GitHub.");

      // Start polling by setting status to queued
      setBuildStatus({ status: "queued" });
    } catch (err: any) {
      console.error("Git Push Error:", err);
      alert("Error: " + err.message);
      setBuildStatus(null);
    } finally {
      setIsPushing(false);
    }
  };

  const handleClearAllHistory = () => {
    setConfirmModal({
      isOpen: true,
      title: "Clear All Sessions",
      message: "Are you sure you want to clear your entire chat history? This will permanently delete all conversations.",
      onConfirm: () => {
        setChats([]);
        setCurrentChatId(null);
        setTerminalOutputs([]);
        setIsLoading(false);
        setIsTerminalOpen(false);
        setIsSandboxOpen(false);
        localStorage.removeItem("aura_ai_chats");
        setIsSettingsOpen(false);
      },
    });
  };

  const handleSelectSuggestion = (promptText: string) => {
    setInputValue(promptText);
    // Auto trigger sending suggestion
    setTimeout(() => {
      handleSendMessage(promptText);
    }, 100);
  };

  // 4. API Core Submission Handler (Streaming Support)
  const handleSendMessage = async (forcedText?: any, files?: File | File[]) => {
    // Handle case where files is passed or forcedText is a File or File[]
    let finalFiles: File[] = [];
    let textArg = forcedText;

    if (forcedText instanceof File) {
      finalFiles = [forcedText];
      textArg = undefined;
    } else if (Array.isArray(forcedText) && forcedText.every(item => item instanceof File)) {
      finalFiles = forcedText;
      textArg = undefined;
    }

    if (files) {
      if (Array.isArray(files)) {
        finalFiles = files;
      } else if (files instanceof File) {
        finalFiles = [files];
      }
    }

    const textToSend = typeof textArg === "string" ? textArg : (typeof inputValue === "string" ? inputValue : "");
    if (((!textToSend || typeof textToSend.trim !== "function" || !textToSend.trim()) && finalFiles.length === 0) || isLoading) return;

    let chatId = currentChatId;
    let currentChatsList = [...chats];

    // Create a chat automatically if none active
    if (!chatId) {
      const newChatId = crypto.randomUUID();
      const newChat: Chat = {
        id: newChatId,
        title: "New Session",
        messages: [],
        createdAt: Date.now(),
      };
      currentChatsList = [newChat, ...currentChatsList];
      chatId = newChatId;
    }

    const chatIndex = currentChatsList.findIndex((c) => c.id === chatId);
    if (chatIndex === -1) return;

    const targetChat = currentChatsList[chatIndex];

    // Create User Message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: textToSend.trim(),
      timestamp: Date.now(),
    };

    let updatedMessages = [...targetChat.messages, userMessage];

    // Handle File Upload if present
    if (finalFiles.length > 0) {
      setIsLoading(true);
      for (let i = 0; i < finalFiles.length; i++) {
        const file = finalFiles[i];
        try {
          const formData = new FormData();
          formData.append("file", file);
          
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          
          const contentType = uploadRes.headers.get("content-type");
          if (!uploadRes.ok) {
            let errorInfo = "Upload failed";
            if (contentType && contentType.includes("application/json")) {
              const errData = await uploadRes.json();
              errorInfo = errData.error || errorInfo;
            } else {
              const text = await uploadRes.text();
              console.error("Non-JSON error response from server:", text.substring(0, 500));
              errorInfo = `Server Error (${uploadRes.status}: ${uploadRes.statusText})`;
            }
            throw new Error(errorInfo);
          }
          
          if (!contentType || !contentType.includes("application/json")) {
            const text = await uploadRes.text();
            console.error("Expected JSON but got:", text.substring(0, 200));
            throw new Error("Invalid server response format (Expected JSON)");
          }
          
          const fileData = await uploadRes.json();
          
          // Inject system message about the file
          const systemContent = `[System: User uploaded a file named '${fileData.name}' to '${fileData.path}'. You can now use your terminal tools (like cat, ls, etc.) to read, modify, or interact with this file if needed.]`;

          const systemFileMessage: Message = {
            id: `sys-${Date.now()}-${i}-${Math.random()}`,
            role: "system",
            content: systemContent,
            timestamp: Date.now(),
          };
          
          updatedMessages.push(systemFileMessage);
          
          // Also update the user's message content to show the file was attached
          userMessage.content = (userMessage.content ? userMessage.content + "\n\n" : "") + `📎 Attached file: ${fileData.name}`;
        } catch (err: any) {
          console.error(`File upload error for ${file.name}:`, err);
        }
      }
    }

    // Dynamic automatic chat naming based on first message
    let updatedTitle = targetChat.title;
    if (targetChat.title === "New Session" && textToSend.trim()) {
      updatedTitle = textToSend.trim().length > 28
        ? textToSend.trim().substring(0, 25) + "..."
        : textToSend.trim();
    }

    const updatedChat: Chat = {
      ...targetChat,
      title: updatedTitle,
      messages: updatedMessages,
    };

    // Replace and set chat state
    const nextChats = currentChatsList.map((c) =>
      c.id === chatId ? updatedChat : c
    );
    setChats(nextChats);
    setCurrentChatId(chatId);
    setInputValue("");
    setIsLoading(true);

    // Append standard placeholder bot response for streaming text
    const botMessageId = crypto.randomUUID();
    const initialBotMessage: Message = {
      id: botMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      agentData: agentMode ? { thought: "Initializing agent reasoning...", terminalOutput: [] } : undefined
    };

    const chatWithPlaceholder: Chat = {
      ...updatedChat,
      messages: [...updatedMessages, initialBotMessage],
    };

    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? chatWithPlaceholder : c))
    );

    if (agentMode) {
      setIsTerminalOpen(true);
      setTerminalOutputs([]);
    }

    try {
      // Map complete message list history into roles schema
      const payloadHistory = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const endpoint = agentMode ? "/api/agent" : "/api/chat";

      // Call our secure backend server route
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: payloadHistory,
          stream: true,
          deepThinking,
          webSearch,
          deepSearch,
        }),
      });

      if (!response.ok) {
        const errorText = await response.json().catch(() => ({}));
        throw new Error(
          errorText.error || `Server connection failed: ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error("No readable event stream body returned.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let botAccumulatedText = "";
      let sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        // Keep potential incomplete line at the very end
        sseBuffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === "data: [DONE]") continue;

          if (trimmed.startsWith("data: ")) {
            let parsed: any = null;
            try {
              const jsonStr = trimmed.substring(6);
              if (jsonStr) {
                parsed = JSON.parse(jsonStr);
              }
            } catch (err) {
              // JSON partition edge case
              continue;
            }

            if (!parsed) continue;

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (agentMode && parsed.type === "agent_update") {
              // Agent Update Case
              const thought = parsed.thought || "";
              const responseToUser = parsed.response_to_user || "";
              const downloadUrl = parsed.download_url || null;
              botAccumulatedText = responseToUser;

              setChats((prevChats) =>
                prevChats.map((c) => {
                  if (c.id === chatId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) => {
                        if (m.id === botMessageId) {
                          return { 
                            ...m, 
                            content: responseToUser,
                            agentData: {
                              ...m.agentData,
                              thought: thought,
                              tool: parsed.tool,
                              command: parsed.command,
                              downloadUrl: downloadUrl
                            }
                          };
                        }
                        return m;
                      }),
                    };
                  }
                  return c;
                })
              );
            } else if (agentMode && parsed.type === "terminal_output") {
              // Terminal Output Case
              setTerminalOutputs(prev => [...prev, parsed.output]);
              setChats((prevChats) =>
                prevChats.map((c) => {
                  if (c.id === chatId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) => {
                        if (m.id === botMessageId) {
                          const newTerminalOutput = [...(m.agentData?.terminalOutput || []), parsed.output];
                          return { 
                            ...m, 
                            agentData: {
                              ...m.agentData,
                              terminalOutput: newTerminalOutput
                            }
                          };
                        }
                        return m;
                      }),
                    };
                  }
                  return c;
                })
              );
            } else {
              // Standard Chat Completion Case
              const chunkText = parsed.choices?.[0]?.delta?.content || "";
              if (chunkText) {
                botAccumulatedText += chunkText;

                setChats((prevChats) =>
                  prevChats.map((c) => {
                    if (c.id === chatId) {
                      return {
                        ...c,
                        messages: c.messages.map((m) => {
                          if (m.id === botMessageId) {
                            return { ...m, content: botAccumulatedText };
                          }
                          return m;
                        }),
                      };
                    }
                    return c;
                  })
                );
              }
            }
          }
        }
      }

      if (!botAccumulatedText) {
        throw new Error("The model did not synthesize any text content.");
      }
    } catch (error: any) {
      console.error("AI Generation error: ", error);
      const errorMsg = `⚠️ **Connection Error**: ${
        error.message || "Could not generate answer."
      }\n\n*Verify your local network connection, or try again. The custom space container might be sleeping.*`;

      // Render error alert in bot block
      setChats((prevChats) =>
        prevChats.map((c) => {
          if (c.id === chatId) {
            return {
              ...c,
              messages: c.messages.map((m) => {
                if (m.id === botMessageId) {
                  return { ...m, content: errorMsg };
                }
                return m;
              }),
            };
          }
          return c;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (isLoading || !newContent.trim()) return;

    let chatId = currentChatId;
    if (!chatId) return;

    const chatIndex = chats.findIndex((c) => c.id === chatId);
    if (chatIndex === -1) return;

    const targetChat = chats[chatIndex];
    const messageIndex = targetChat.messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    // Truncate messages after edited message
    const messagesBefore = targetChat.messages.slice(0, messageIndex);
    
    const updatedUserMessage: Message = {
      ...targetChat.messages[messageIndex],
      content: newContent.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messagesBefore, updatedUserMessage];

    const updatedChat: Chat = {
      ...targetChat,
      messages: updatedMessages,
    };

    // Replace and set chats
    setChats((prev) => prev.map((c) => (c.id === chatId ? updatedChat : c)));
    setIsLoading(true);

    const botMessageId = crypto.randomUUID();
    const initialBotMessage: Message = {
      id: botMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    const chatWithPlaceholder: Chat = {
      ...updatedChat,
      messages: [...updatedMessages, initialBotMessage],
    };

    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? chatWithPlaceholder : c))
    );

    try {
      const payloadHistory = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: payloadHistory,
          stream: true,
          deepThinking,
        }),
      });

      if (!response.ok) {
        const errorText = await response.json().catch(() => ({}));
        throw new Error(
          errorText.error || `Server connection failed: ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error("No readable event stream body returned.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let botAccumulatedText = "";
      let sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === "data: [DONE]") continue;

          if (trimmed.startsWith("data: ")) {
            let parsed: any = null;
            try {
              const jsonStr = trimmed.substring(6);
              parsed = JSON.parse(jsonStr);
            } catch (err) {
              // Ignore
              continue;
            }

            if (!parsed) continue;

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            const chunkText = parsed.choices?.[0]?.delta?.content || "";
            if (chunkText) {
              botAccumulatedText += chunkText;

              setChats((prevChats) =>
                prevChats.map((c) => {
                  if (c.id === chatId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) => {
                        if (m.id === botMessageId) {
                          return { ...m, content: botAccumulatedText };
                        }
                        return m;
                      }),
                    };
                  }
                  return c;
                })
              );
            }
          }
        }
      }

      if (!botAccumulatedText) {
        throw new Error("The model did not synthesize any text content.");
      }
    } catch (error: any) {
      console.error("AI Generation error: ", error);
      const errorMsg = `⚠️ **Connection Error**: ${
        error.message || "Could not generate answer."
      }\n\n*Verify your local network connection, or try again. The custom space container might be sleeping.*`;

      setChats((prevChats) =>
        prevChats.map((c) => {
          if (c.id === chatId) {
            return {
              ...c,
              messages: c.messages.map((m) => {
                if (m.id === botMessageId) {
                  return { ...m, content: errorMsg };
                }
                return m;
              }),
            };
          }
          return c;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-dvh w-screen bg-neutral-950 text-neutral-200 overflow-hidden font-sans">
      
      {/* 1. Sidebar Container */}
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        isOpen={sidebarOpen}
        onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
        onSelectChat={handleSelectChat}
        onCreateNewChat={handleCreateNewChat}
        onDeleteChat={handleDeleteChat}
        onClearAllChats={handleClearAllHistory}
        onRenameChat={handleRenameChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGithubConfig={() => setIsGithubModalOpen(true)}
        userName={settings.userName}
      />

      {/* 2. Main Workstation Area */}
      <div className="flex flex-1 flex-col h-full min-h-0 overflow-hidden bg-radial from-neutral-900/40 to-neutral-950/80 relative">
        {/* Glow grid elements behind */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none select-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none select-none" />

        {/* Header Ribbon bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-900/60 bg-neutral-950/90 px-5 backdrop-blur-md shrink-0">
          {/* Left corner */}
          <div className="flex items-center space-x-3.5">
            {/* Collapse sidebar trigger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-900/90 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
              title="Toggle collapsible sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Title / Info */}
            <div className="flex items-center space-x-2">
              <span className="hidden sm:inline-block text-xs font-semibold text-neutral-400">Workspace</span>
              <ChevronRight className="hidden sm:inline-block h-3 w-3 text-neutral-600" />
              <h2 className="text-xs font-bold text-white tracking-wide truncate max-w-[120px] xs:max-w-[160px] sm:max-w-xs">
                {activeChat ? activeChat.title : "New Session"}
              </h2>
            </div>

            {/* Quick New Session trigger */}
            {activeChat && (
              <button
                onClick={() => setCurrentChatId(null)}
                className="rounded-xl px-2.5 py-1 text-xs font-bold text-teal-400 hover:text-white bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition-all duration-200 active:scale-95 cursor-pointer ml-1.5 shrink-0"
                title="Start a new conversation"
              >
                <span>+ جديد</span>
              </button>
            )}
          </div>

          {/* Right corner indicators */}
          <div className="flex items-center space-x-4 font-mono text-[10px] text-neutral-400">
            {/* Active Server Health indicator */}
            <div className="flex items-center space-x-2 bg-neutral-900/80 border border-neutral-800/80 px-3 py-1.5 rounded-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 glow-active inline-block"></span>
              <span className="hidden sm:inline-block font-semibold text-neutral-300">Aura-Server</span>
              <span className="text-teal-400 font-bold">ONLINE</span>
            </div>

            {/* Quick delete active session */}
            {activeChat && activeChat.messages.length > 0 && (
              <button
                onClick={() => handleDeleteChat(activeChat.id)}
                className="flex items-center space-x-1 hover:text-rose-400 transition-colors p-2 rounded-lg hover:bg-neutral-900 cursor-pointer"
                title="Wipe session"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </header>

        {/* Main Body Message Display Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto"
        >
          {!activeChat || activeChat.messages.length === 0 ? (
            <WelcomeLanding onSelectSuggestion={handleSelectSuggestion} />
          ) : (
            <div className="w-full">
              {/* Message List */}
              {activeChat.messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  userName={settings.userName}
                  onEditMessage={(newContent) => handleEditMessage(message.id, newContent)}
                />
              ))}

              {/* Show generic typing indicator if backend has not sent first chunk */}
              {isLoading &&
                activeChat.messages[activeChat.messages.length - 1]?.role === "user" && (
                  <TypingIndicator />
                )}

              {/* Anchor block for scrolling */}
              <div ref={bottomRef} className="h-12" />
            </div>
          )}
        </div>

        {/* Fixed Sticky Bottom Inputs panel */}
        <footer className="border-t border-neutral-900/60 bg-neutral-950/40 p-4 backdrop-blur-md shrink-0">
          <div className="mx-auto max-w-3xl">
            {/* Builder Dashboard (Shows when Agent Mode is on) */}
            {agentMode && (
              <BuilderControls
                settings={settings}
                onUpdateSettings={setSettings}
                onGitPush={handleGitPush}
                isPushing={isPushing}
                onOpenGithubConfig={() => setIsGithubModalOpen(true)}
                isCollapsed={isBuilderCollapsed}
                onToggleCollapse={() => {
                  const newState = !isBuilderCollapsed;
                  setIsBuilderCollapsed(newState);
                  localStorage.setItem("builder_collapsed", String(newState));
                }}
                buildStatus={buildStatus}
                onResetBuild={() => setBuildStatus(null)}
              />
            )}

            {/* Quick Actions (Deep Thinking + Web Search + Deep Search + Workspace Link) */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between mb-3 px-1 select-none">
              <div className="flex flex-wrap gap-2 items-center">
                {/* Deep thinking toggle */}
                <button
                  onClick={() => {
                    setDeepThinking(!deepThinking);
                    if (deepSearch) setDeepSearch(false);
                  }}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-200 active:scale-95 ${
                    deepThinking
                      ? "bg-teal-500/10 border-teal-500/30 text-teal-400 font-bold"
                      : "bg-neutral-900/60 border-neutral-800/40 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                  }`}
                  title="Toggle deep step-by-step reasoning process"
                >
                  <Brain className={`h-3.5 w-3.5 ${deepThinking ? "text-teal-400 animate-pulse" : "text-neutral-500"}`} />
                  <span className="font-sans hidden md:inline">التفكير العميق / Deep Thinking</span>
                  <span className="font-sans md:hidden">تفكير عميق</span>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${deepThinking ? "bg-teal-400 animate-pulse" : "bg-neutral-600"}`} />
                </button>

                {/* Web Search toggle */}
                <button
                  onClick={() => {
                    setWebSearch(!webSearch);
                    if (deepSearch) setDeepSearch(false);
                  }}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-200 active:scale-95 ${
                    webSearch
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-400 font-bold"
                      : "bg-neutral-900/60 border-neutral-800/40 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                  }`}
                  title="Search the web with Google Search"
                >
                  <Globe className={`h-3.5 w-3.5 ${webSearch ? "text-blue-400 animate-pulse" : "text-neutral-500"}`} />
                  <span className="font-sans hidden md:inline">البحث في الويب / Web Search</span>
                  <span className="font-sans md:hidden">بحث الويب</span>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${webSearch ? "bg-blue-400 animate-pulse" : "bg-neutral-600"}`} />
                </button>

                {/* Deep Search toggle */}
                <button
                  onClick={() => {
                    const nextVal = !deepSearch;
                    setDeepSearch(nextVal);
                    if (nextVal) {
                      setWebSearch(false);
                      setDeepThinking(false);
                      setAgentMode(false);
                    }
                  }}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-200 active:scale-95 ${
                    deepSearch
                      ? "bg-purple-500/15 border-purple-500/40 text-purple-400 font-bold shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                      : "bg-neutral-900/60 border-neutral-800/40 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                  }`}
                  title="Enable rigorous multi-step deep reasoning with web search integration"
                >
                  <Search className={`h-3.5 w-3.5 ${deepSearch ? "text-purple-400 animate-pulse" : "text-neutral-500"}`} />
                  <span className="font-sans hidden md:inline">البحث العميق / Deep Search</span>
                  <span className="font-sans md:hidden">بحث عميق</span>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${deepSearch ? "bg-purple-400 animate-pulse" : "bg-neutral-600"}`} />
                </button>

                {/* Agent Mode toggle */}
                <button
                  onClick={() => {
                    const nextVal = !agentMode;
                    setAgentMode(nextVal);
                    if (nextVal) {
                      setWebSearch(false);
                      setDeepThinking(false);
                      setDeepSearch(false);
                      setIsTerminalOpen(true);
                    } else {
                      setIsTerminalOpen(false);
                    }
                  }}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-200 active:scale-95 ${
                    agentMode
                      ? "bg-rose-500/15 border-rose-500/40 text-rose-400 font-bold shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                      : "bg-neutral-900/60 border-neutral-800/40 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                  }`}
                  title="Activate Agent Mode: AI can execute bash commands and perform complex tasks"
                >
                  <Cpu className={`h-3.5 w-3.5 ${agentMode ? "text-rose-400 animate-pulse" : "text-neutral-500"}`} />
                  <span className="font-sans hidden md:inline">وضع العميل / Agent Mode</span>
                  <span className="font-sans md:hidden">العميل</span>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${agentMode ? "bg-rose-400 animate-pulse" : "bg-neutral-600"}`} />
                </button>
              </div>

              <div className="flex gap-2">
                {/* Terminal Toggle (only visible if agentMode is active or outputs exist) */}
                {(agentMode || terminalOutputs.length > 0) && (
                  <button
                    onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-200 active:scale-95 ${
                      isTerminalOpen
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                        : "bg-neutral-900/60 border-neutral-800/40 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                    }`}
                    title="Toggle terminal view"
                  >
                    <TerminalIcon className={`h-3.5 w-3.5 ${isTerminalOpen ? "text-amber-400" : "text-neutral-500"}`} />
                    <span className="font-sans hidden sm:inline">Terminal</span>
                    <span className="font-sans sm:hidden">Terminal</span>
                  </button>
                )}

                {/* Workspace Indicator Button */}
              {sandboxFiles.length > 0 && (
                <button
                  onClick={() => setIsSandboxOpen(!isSandboxOpen)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-200 active:scale-95 self-start sm:self-center ${
                    isSandboxOpen
                      ? "bg-teal-500/15 border-teal-500/30 text-teal-400"
                      : "bg-neutral-900/60 border-neutral-800/40 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                  }`}
                  title="Toggle sandbox view"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400 inline-block animate-pulse"></span>
                  <span className="font-sans hidden sm:inline">Code Workspace ({sandboxFiles.length} files)</span>
                  <span className="font-sans sm:hidden">الملفات ({sandboxFiles.length})</span>
                </button>
              )}
            </div>
          </div>

          <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSendMessage}
              isLoading={isLoading}
            />
            <p className="mt-2 text-center text-[10px] text-neutral-600 font-mono select-none">
              🔒 Connected securely to Aura-AI Engine • All data cached locally.
            </p>
          </div>
        </footer>
      </div>

      {/* 3. Terminal Panel Area */}
      <TerminalPanel
        outputs={terminalOutputs}
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
      />

      {/* 4. Sandbox Workstation Codebase Panel */}
      <SandboxPanel
        files={sandboxFiles}
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        chatTitle={activeChat?.title}
      />

      <GitHubConfigModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      {/* 5. Settings Configuration Dialog Overlay */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onClearHistory={handleClearAllHistory}
      />

      {/* 6. Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}
