"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, X } from "lucide-react";
import { ToastContext, ToastItem } from "../../contexts/ToastContext";
import { EventIcon } from "../ui/EventIcon";
import { whatsAppShareUrl } from "../../lib/notifications/formatter";

const AUTO_DISMISS_MS = 6000;
const MAX_VISIBLE = 4;

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timers.current[id];
    }
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { ...toast, id }].slice(-MAX_VISIBLE));
      timers.current[id] = setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}

      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const inner = (
    <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl px-4 py-3 animate-[slideIn_0.2s_ease-out]">
      <span className="grid place-items-center h-9 w-9 shrink-0 rounded-xl bg-vanguard-volt/10 dark:bg-vanguard-volt/20 text-vanguard-volt dark:text-vanguard-volt">
        <EventIcon type={toast.eventType ?? ""} className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 truncate">{toast.title}</p>
        {toast.body && <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{toast.body}</p>}
        {toast.shareText && (
          <a
            href={whatsAppShareUrl(toast.shareText)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-green-600 hover:text-green-700"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Share to WhatsApp
          </a>
        )}
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss();
        }}
        aria-label="Dismiss"
        className="grid place-items-center h-6 w-6 shrink-0 rounded-lg text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400 transition"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="pointer-events-auto">
      {toast.href ? (
        <Link href={toast.href} className="block">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  );
}
