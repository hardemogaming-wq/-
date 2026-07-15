import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  variant?: "danger" | "warning";
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  variant = "danger",
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl shadow-black/50"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
            <div className="flex items-center space-x-2.5">
              <div className={`p-1.5 rounded-lg ${variant === "danger" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"}`}>
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-tight">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            <p className="text-sm text-neutral-400 leading-relaxed">{message}</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 border-t border-neutral-800 bg-neutral-950/50 px-6 py-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-white transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-lg transition-all active:scale-95 ${
                variant === "danger"
                  ? "bg-rose-600 hover:bg-rose-500 shadow-rose-500/10"
                  : "bg-amber-600 hover:bg-amber-500 shadow-amber-500/10"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
