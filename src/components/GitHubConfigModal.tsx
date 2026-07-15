import React, { useState, useRef } from "react";
import { X, Github, Shield, CheckCircle2, AlertCircle, Upload, Image as ImageIcon } from "lucide-react";
import { AppSettings } from "../types";

interface GitHubConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export default function GitHubConfigModal({ isOpen, onClose, settings, onUpdateSettings }: GitHubConfigModalProps) {
  const [username, setUsername] = useState(settings.githubUsername || "");
  const [repo, setRepo] = useState(settings.githubRepo || "");
  const [token, setToken] = useState(settings.githubToken || "");
  const [isSaved, setIsSaved] = useState(false);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(settings.appIcon || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "image/png" || file.type === "image/jpeg") {
        setIconFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setIconPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert("Please upload a .png or .jpeg file.");
      }
    }
  };

  const handleSave = async () => {
    // If we have a new icon file, we need to upload it
    let finalIconUrl = iconPreview;

    if (iconFile) {
      const formData = new FormData();
      formData.append("icon", iconFile);
      try {
        const res = await fetch("/api/upload-icon", {
          method: "POST",
          body: formData,
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Upload failed with status:", res.status, errorText);
          throw new Error(`Server returned ${res.status}: ${errorText.substring(0, 100)}`);
        }

        const data = await res.json();
        if (data.url) {
          finalIconUrl = data.url;
        }
      } catch (err) {
        console.error("Failed to upload icon:", err);
        // We can show an alert or a toast here if we had one
      }
    }

    onUpdateSettings({
      ...settings,
      githubUsername: username,
      githubRepo: repo,
      githubToken: token,
      appIcon: finalIconUrl || undefined,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1500);
  };

  const isConfigured = username && repo && token && iconPreview;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md p-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">GitHub Configuration</h3>
              <p className="text-[10px] text-neutral-500 font-mono">Setup Android Build Pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider ${
            isConfigured 
            ? "bg-teal-500/10 border-teal-500/20 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]" 
            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}>
            {isConfigured ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                <span>GitHub Status: Ready for Build</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                <span>GitHub Status: Incomplete Setup</span>
              </>
            )}
          </div>

          {/* Section 1: App Icon Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Android App Icon</label>
              {!iconPreview && (
                <span className="flex items-center space-x-1 text-[9px] text-rose-400 font-bold animate-pulse">
                  <AlertCircle className="h-2.5 w-2.5" />
                  <span>⚠️ Custom App Icon Required</span>
                </span>
              )}
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-500/50', 'bg-indigo-500/5'); }}
              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-indigo-500/50', 'bg-indigo-500/5'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-indigo-500/50', 'bg-indigo-500/5');
                const file = e.dataTransfer.files[0];
                if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
                  setIconFile(file);
                  const reader = new FileReader();
                  reader.onloadend = () => setIconPreview(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
              className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-6 transition-all cursor-pointer ${
                iconPreview 
                ? "border-teal-500/30 bg-teal-500/5" 
                : "border-neutral-800 hover:border-indigo-500/50 hover:bg-indigo-500/5"
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".png,.jpeg,.jpg" 
                className="hidden" 
              />
              
              {iconPreview ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full" />
                  <img 
                    src={iconPreview} 
                    alt="App Icon Preview" 
                    className="relative h-20 w-20 rounded-2xl object-cover shadow-2xl border-2 border-teal-500/50" 
                  />
                  <div className="absolute -bottom-1 -right-1 bg-teal-500 rounded-full p-1 shadow-lg">
                    <CheckCircle2 className="h-3 w-3 text-neutral-950" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <div className="h-12 w-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-neutral-400">Drag & Drop Icon</p>
                    <p className="text-[10px] text-neutral-600">Supports PNG, JPEG (1:1 recommended)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-neutral-800/50">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">GitHub Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., hardemogaming-wq"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-xs text-white placeholder:text-neutral-700 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Repository Name</label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="e.g., aura-android-app"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-xs text-white placeholder:text-neutral-700 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Personal Access Token</label>
                <div className="flex items-center space-x-1 text-[9px] text-amber-500/80 font-mono">
                  <Shield className="h-2.5 w-2.5" />
                  <span>Encrypted locally</span>
                </div>
              </div>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-xs text-white placeholder:text-neutral-700 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              className={`w-full flex items-center justify-center space-x-2 rounded-xl py-3 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                isSaved 
                ? "bg-teal-500 text-neutral-950 shadow-[0_0_20px_rgba(20,184,166,0.3)]" 
                : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20"
              }`}
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Config Saved!</span>
                </>
              ) : (
                <span>Save Configuration</span>
              )}
            </button>
          </div>
          
          <p className="text-[10px] text-neutral-600 text-center px-4 leading-relaxed italic">
            Your token and assets are processed securely. The icon will be injected into Android resources before build.
          </p>
        </div>
      </div>
    </div>
  );
}
