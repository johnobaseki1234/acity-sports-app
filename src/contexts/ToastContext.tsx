"use client";

import { createContext, useContext } from "react";

export interface ToastItem {
  id: string;
  /** Event type used to pick a lucide icon (replaces emoji). */
  eventType?: string;
  title: string;
  body?: string;
  /** Optional pre-formatted message; when present the toast shows a WhatsApp share button. */
  shareText?: string;
  /** Optional link the toast navigates to when tapped (e.g. /match/[id]). */
  href?: string;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside a <ToastProvider>");
  }
  return ctx;
}
