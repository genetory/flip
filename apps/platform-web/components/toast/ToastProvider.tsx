"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type ToastKind = "success" | "error" | "info";

type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
  /** ms until auto-dismiss. 0 = sticky (user must dismiss). */
  duration: number;
};

type ShowToastInput = {
  message: string;
  kind?: ToastKind;
  duration?: number;
};

type ToastContextValue = {
  show: (input: ShowToastInput) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 1800;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const show = useCallback((input: ShowToastInput) => {
    counterRef.current += 1;
    const id = `t-${Date.now()}-${counterRef.current}`;
    const item: ToastItem = {
      id,
      kind: input.kind ?? "info",
      message: input.message,
      duration: input.duration ?? DEFAULT_DURATION
    };
    setItems((prev) => [...prev, item]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message, duration) => show({ message, kind: "success", duration }),
      error: (message, duration) => show({ message, kind: "error", duration }),
      info: (message, duration) => show({ message, kind: "info", duration }),
      dismiss
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

function ToastViewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[60%] z-[200] flex -translate-y-1/2 flex-col items-center gap-3 px-4"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    if (item.duration <= 0) return;
    const timer = window.setTimeout(() => onDismiss(item.id), item.duration);
    return () => window.clearTimeout(timer);
  }, [item.id, item.duration, onDismiss]);

  const kindStyles = {
    success: "border-emerald-300 bg-emerald-50 text-emerald-900",
    error: "border-rose-300 bg-rose-50 text-rose-900",
    info: "border-zinc-300 bg-white text-foreground"
  }[item.kind];

  const icon = item.kind === "success" ? "✓" : item.kind === "error" ? "✗" : "i";

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-md items-center gap-4 rounded-xl border-2 px-6 py-5 text-base font-medium shadow-2xl animate-in fade-in zoom-in-95 ${kindStyles}`}
    >
      <span
        aria-hidden="true"
        className={`inline-flex h-8 w-8 flex-none items-center justify-center rounded-full text-base font-bold leading-none ${
          item.kind === "success"
            ? "bg-emerald-600 text-white"
            : item.kind === "error"
              ? "bg-rose-600 text-white"
              : "bg-zinc-600 text-white"
        }`}
      >
        {icon}
      </span>
      <p className="flex-1 leading-relaxed">{item.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-md text-sm text-current/70 transition hover:bg-black/10"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}
