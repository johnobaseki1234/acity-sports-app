"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ToastContext, ToastItem } from "../../contexts/ToastContext";
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
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg px-4 py-3 animate-[slideIn_0.2s_ease-out]">
      <span className="text-xl leading-none mt-0.5">{toast.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-gray-900 dark:text-zinc-50 truncate">{toast.title}</p>
        {toast.body && <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{toast.body}</p>}
        {toast.shareText && (
          <a
            href={whatsAppShareUrl(toast.shareText)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-green-600 hover:text-green-700"
          >
            💬 Share to WhatsApp
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
        className="text-gray-300 hover:text-gray-500 dark:text-zinc-600 dark:hover:text-zinc-400 text-lg leading-none shrink-0"
      >
        ×
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
