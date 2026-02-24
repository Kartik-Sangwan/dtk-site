"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import AuthPanel from "@/components/AuthPanel";
type AuthMode = "signin" | "signup";

export default function AuthModal({
  open,
  onClose,
  initialMode = "signin",
  syncKey = 0,
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  syncKey?: number;
}) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/35 px-4 py-6"
      onClick={onClose}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-white"
            aria-label="Close sign in dialog"
          >
            Close
          </button>
        </div>
        <div className="max-h-[90vh] overflow-y-auto rounded-2xl">
          <AuthPanel key={`${initialMode}-${syncKey}`} onAuthSuccess={onClose} initialMode={initialMode} />
        </div>
      </div>
    </div>,
    document.body
  );
}
