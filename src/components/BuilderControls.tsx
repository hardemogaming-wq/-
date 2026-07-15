import React from "react";
import { Layers, Rocket, Github, Loader2, ChevronDown, Maximize2, Minimize2, CheckCircle2, XCircle, ExternalLink, Download, Clock, AlertCircle, RefreshCcw } from "lucide-react";
import { AppSettings, BuildStatus } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface BuilderControlsProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onGitPush: () => void;
  isPushing: boolean;
  onOpenGithubConfig: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  buildStatus: BuildStatus | null;
  onResetBuild: () => void;
}

export default function BuilderControls({ 
  settings, 
  onUpdateSettings, 
  onGitPush, 
  isPushing,
  onOpenGithubConfig,
  isCollapsed,
  onToggleCollapse,
  buildStatus,
  onResetBuild
}: BuilderControlsProps) {
  
  const isConfigured = settings.githubUsername && settings.githubRepo && settings.githubToken && settings.appIcon;

  const getStatusStep = () => {
    if (isPushing || buildStatus?.status === "pushing") return 1;
    if (buildStatus?.status === "queued") return 2;
    if (buildStatus?.status === "in_progress") return 3;
    if (buildStatus?.status === "completed") return 4;
    return 0;
  };

  const step = getStatusStep();

  return (
    <div className={`mt-4 rounded-3xl bg-neutral-900/50 border border-neutral-800/60 backdrop-blur-sm transition-all duration-300 overflow-hidden ${isCollapsed ? 'p-2' : 'p-4'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 transition-all ${isCollapsed ? 'h-6 w-6' : 'h-8 w-8'}`}>
            <Layers className={isCollapsed ? "h-3 w-3" : "h-4 w-4"} />
          </div>
          {!isCollapsed && <h3 className="text-xs font-bold text-white tracking-tight uppercase">Android Builder Dashboard</h3>}
          {isCollapsed && <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight">Android Builder</span>}
        </div>
        
        <div className="flex items-center space-x-2">
          {buildStatus && !isCollapsed && (
            <button 
              onClick={onResetBuild}
              className="flex items-center space-x-1 text-[10px] font-bold text-neutral-500 hover:text-white transition-colors mr-2"
            >
              <RefreshCcw className="h-2.5 w-2.5" />
              <span>Rebuild Application</span>
            </button>
          )}
          <button 
            onClick={onOpenGithubConfig}
            className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-lg border text-[9px] font-bold transition-all cursor-pointer ${
              isConfigured 
              ? "bg-teal-500/10 border-teal-500/20 text-teal-400" 
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}
          >
            <Github className="h-2.5 w-2.5" />
            <span>{isConfigured ? "Configured" : "Missing Config"}</span>
          </button>
          
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
            title={isCollapsed ? "Expand Dashboard" : "Collapse Dashboard"}
          >
            {isCollapsed ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <AnimatePresence mode="wait">
          {(!buildStatus && !isPushing) ? (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Select Build Framework</label>
                  <div className="relative">
                    <select
                      value={settings.buildFramework || "flutter"}
                      onChange={(e) => onUpdateSettings({ ...settings, buildFramework: e.target.value as any })}
                      className="w-full appearance-none rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-xs text-white focus:border-indigo-500/50 focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="flutter">Flutter App</option>
                      <option value="gradle">Native Android (Gradle)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    onClick={onGitPush}
                    disabled={isPushing}
                    className={`w-full flex items-center justify-center space-x-2 rounded-xl py-2 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                      isPushing 
                      ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" 
                      : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20"
                    }`}
                  >
                    <Rocket className="h-3.5 w-3.5" />
                    <span>Build & Push to GitHub</span>
                  </button>
                </div>
              </div>
              
              {!isConfigured && (
                <p className="text-[9px] text-rose-400/80 font-medium text-center bg-rose-500/5 py-1 rounded-lg border border-rose-500/10">
                  ⚠️ Please configure your GitHub credentials before pushing.
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="monitor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-5"
            >
              {/* Progress Steps */}
              <div className="relative flex justify-between items-center px-4">
                <div className="absolute left-8 right-8 top-4 h-[2px] bg-neutral-800 -z-10">
                  <motion.div 
                    className="h-full bg-indigo-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${Math.max(0, (step - 1) * 33.33)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                {[
                  { label: "Pushing", icon: Github },
                  { label: "Queued", icon: Clock },
                  { label: "Building", icon: Rocket },
                  { label: "Result", icon: CheckCircle2 }
                ].map((s, i) => {
                  const isActive = step >= i + 1;
                  const isCurrent = step === i + 1;
                  const isFailed = buildStatus?.conclusion === "failure" && i === 3;
                  const Icon = i === 3 && buildStatus?.conclusion === "failure" ? XCircle : s.icon;

                  return (
                    <div key={i} className="flex flex-col items-center space-y-2">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isActive 
                        ? isFailed ? "bg-rose-500 text-white" : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                        : "bg-neutral-800 text-neutral-500"
                      } ${isCurrent && !isFailed ? "animate-pulse" : ""}`}>
                        {isCurrent && !isFailed && i < 3 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-tight ${isActive ? "text-white" : "text-neutral-500"}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Status Message */}
              <div className="bg-neutral-950/50 rounded-2xl border border-neutral-800/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {buildStatus?.status === "completed" ? (
                      buildStatus.conclusion === "success" ? (
                        <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                      )
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                    <span className="text-xs font-bold text-neutral-300">
                      {buildStatus?.status === "completed" 
                        ? buildStatus.conclusion === "success" ? "Build Successful!" : "Build Failed"
                        : buildStatus?.status === "pushing" || isPushing ? "Pushing to GitHub..." : "Building Android APK..."}
                    </span>
                  </div>
                  {buildStatus?.run_html_url && (
                    <a 
                      href={buildStatus.run_html_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                    >
                      <span>View Run</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Success State */}
                {buildStatus?.conclusion === "success" && buildStatus.artifact_url && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="pt-2"
                  >
                    <a 
                      href={buildStatus.artifact_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-lg shadow-teal-900/20"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Generated APK</span>
                    </a>
                    <button 
                      onClick={onResetBuild}
                      className="w-full flex items-center justify-center space-x-2 bg-neutral-800/40 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl py-2 text-[10px] font-bold transition-all border border-neutral-800/60 mt-2"
                    >
                      <RefreshCcw className="h-3 w-3" />
                      <span>Start New Build</span>
                    </button>
                  </motion.div>
                )}

                {/* Failure State */}
                {buildStatus?.conclusion === "failure" && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2 text-rose-400">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">Status:</span>
                    </div>
                    <div className="bg-neutral-950 rounded-xl border border-rose-500/20 p-3 font-mono text-[10px] text-rose-300/80 leading-relaxed">
                      {buildStatus.failure_reason || "GitHub Action Failed. Check logs for details."}
                    </div>
                    <button 
                      onClick={onResetBuild}
                      className="w-full flex items-center justify-center space-x-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl py-2 text-xs font-bold transition-all border border-neutral-700/30 mt-2"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                      <span>Retry Build Process</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
