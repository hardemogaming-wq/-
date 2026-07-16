import React from "react";
import { X, Settings, User, Bot, Sliders, AlertTriangle, RefreshCw } from "lucide-react";
import { AppSettings } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onClearHistory: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearHistory,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const handleChange = (key: keyof AppSettings, value: any) => {
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
  };

  const handleResetDefaults = () => {
    onUpdateSettings({
      userName: "Developer",
      temperature: 0.7,
      maxTokens: 2048,
      apiEndpoint: "https://hardemo-aura-ai.hf.space/v1",
      modelName: "Codestral",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all duration-300">
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/90 text-neutral-200 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing border accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 px-6 py-5">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-neutral-800/60 p-2 border border-neutral-700/50">
              <Settings className="h-5 w-5 text-teal-400 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">Client Settings</h3>
              <p className="text-xs text-neutral-400">Configure Aura-AI Client preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6 space-y-6 font-sans">
          {/* Section 1: User Profile */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-teal-400 flex items-center space-x-1.5">
              <User className="h-3.5 w-3.5" />
              <span>User Profile</span>
            </h4>
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-medium">Your Name (Display Name)</label>
              <input
                type="text"
                value={settings.userName}
                onChange={(e) => handleChange("userName", e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-neutral-600"
                placeholder="Developer"
              />
            </div>
          </div>

          {/* Section 2: Model Configuration (Locked as per requirements) */}
          <div className="space-y-3 border-t border-neutral-800/60 pt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
              <Bot className="h-3.5 w-3.5" />
              <span>Aura-AI API Backend (Secure)</span>
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-medium">API Base URL</label>
                <input
                  type="text"
                  disabled
                  value={settings.apiEndpoint}
                  className="w-full rounded-xl border border-neutral-800/50 bg-neutral-950/30 px-4 py-2.5 text-xs text-neutral-500 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-medium">Target Model</label>
                <input
                  type="text"
                  disabled
                  value={settings.modelName}
                  className="w-full rounded-xl border border-neutral-800/50 bg-neutral-950/30 px-4 py-2.5 text-xs text-neutral-500 cursor-not-allowed"
                />
              </div>
            </div>
            <p className="text-[10px] text-neutral-500 italic mt-1 leading-normal">
              🔒 API endpoint and target model parameters are strictly configured for your secure space instance.
            </p>
          </div>

          {/* Section 3: Parameters */}
          <div className="space-y-4 border-t border-neutral-800/60 pt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center space-x-1.5">
              <Sliders className="h-3.5 w-3.5" />
              <span>Inference Parameters</span>
            </h4>
            
            {/* Temperature Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="text-neutral-400 font-medium">Temperature (Creativity)</label>
                <span className="font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">{settings.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => handleChange("temperature", parseFloat(e.target.value))}
                className="w-full accent-teal-500 bg-neutral-950 rounded-lg appearance-none h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-sans">
                <span>0.0 (Precise/Code)</span>
                <span>1.0 (Balanced)</span>
                <span>2.0 (Creative)</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-medium">Max Tokens to Generate</label>
              <input
                type="number"
                min="1"
                max="8192"
                value={settings.maxTokens}
                onChange={(e) => handleChange("maxTokens", parseInt(e.target.value) || 2048)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all font-mono"
              />
            </div>
          </div>

          {/* Section 4: Storage Maintenance */}
          <div className="space-y-3 border-t border-neutral-800/60 pt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center space-x-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Data & Maintenance</span>
            </h4>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-rose-500/5 rounded-xl border border-rose-500/10 p-3.5">
              <div>
                <p className="text-xs font-semibold text-rose-300">Clear Saved Chats</p>
                <p className="text-[11px] text-neutral-400">Wipe all conversation logs from your local cache</p>
              </div>
              <button
                onClick={onClearHistory}
                className="self-start sm:self-center bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-800/80 bg-neutral-950/40 px-6 py-4.5">
          <button
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>
          
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-semibold rounded-xl px-5 py-2 text-sm shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
}
