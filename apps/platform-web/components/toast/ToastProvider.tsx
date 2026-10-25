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
  // v2 알림 — 화면 아래 가운데에 진한 둥근 알림. 하단 고정 바·피드백 버튼(--fab-bottom-offset) 위로 띄운다.
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-[200] flex flex-col items-center gap-2 px-4"
      style={{ bottom: "calc(max(24px, env(safe-area-inset-bottom)) + 72px + var(--fab-bottom-offset, 0px))" }}
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

  // 종류는 왼쪽 동그라미 색으로만 — 바탕은 늘 같은 먹색(v2)
  const dot = { success: "bg-[#12b76a]", error: "bg-[#f04452]", info: "bg-white/25" }[item.kind];
  const icon = item.kind === "success" ? "✓" : item.kind === "error" ? "!" : "i";

  return (
    <div
      role="status"
      className="pointer-events-auto flex w-full max-w-[420px] items-center gap-3 rounded-2xl bg-[#191f28]/95 py-3.5 pl-4 pr-2 text-[15px] font-semibold text-white shadow-[0_12px_32px_-12px_rgba(0,0,0,0.5)] backdrop-blur animate-in fade-in slide-in-from-bottom-2"
    >
      <span aria-hidden="true" className={`inline-flex h-6 w-6 flex-none items-center justify-center rounded-full text-[13px] font-bold leading-none text-white ${dot}`}>
        {icon}
      </span>
      <p className="min-w-0 flex-1 leading-[1.45]">{item.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-xl text-[13px] text-white/60 transition hover:bg-white/10 hover:text-white"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}
