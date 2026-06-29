"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowsClockwise, Check, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import type { AutosaveStatus } from "./useResumeMakerAutosave";
import { useAutoSaveCopy } from "../../lib/resume-maker-i18n/auto-save";

// 저장 상태 토스트 — 우측 상단에서 슬라이드되어 들어오는 검은 토스트.
// 저장 중 / 저장됨 / 실패. '저장됨'은 작은 컨페티를 터뜨린 뒤 잠시 후 사라진다.
// position: fixed 라 페이지 상단 바(GNB)에서 자리를 차지하지 않는다.

const BURST_COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#c084fc", "#22d3ee"];

function MiniBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * 360 + Math.random() * 20;
        const dist = 18 + Math.random() * 22;
        const rad = (angle * Math.PI) / 180;
        return {
          dx: Math.cos(rad) * dist,
          dy: Math.sin(rad) * dist - 6,
          color: BURST_COLORS[i % BURST_COLORS.length],
          delay: Math.random() * 0.06,
          size: 4 + Math.random() * 3
        };
      }),
    []
  );
  return (
    <span className="pointer-events-none absolute left-1/2 top-1/2 z-50" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={
            {
              position: "absolute",
              width: p.size,
              height: p.size,
              borderRadius: 1,
              background: p.color,
              ["--dx" as string]: `${p.dx}px`,
              ["--dy" as string]: `${p.dy}px`,
              animation: `rm-save-burst 0.85s ${p.delay}s ease-out forwards`
            } as React.CSSProperties
          }
        />
      ))}
      <style>{`@keyframes rm-save-burst {
        0% { transform: translate(0,0) scale(1); opacity: 1; }
        100% { transform: translate(var(--dx), var(--dy)) scale(0.3); opacity: 0; }
      }`}</style>
    </span>
  );
}

export function AutoSaveIndicator({ status, onRetry }: { status: AutosaveStatus; onRetry?: () => void }) {
  const prev = useRef<AutosaveStatus>(status);
  const [burst, setBurst] = useState(0);
  const [visible, setVisible] = useState(false);
  const t = useAutoSaveCopy();

  useEffect(() => {
    if (status === "idle") {
      setVisible(false);
      prev.current = status;
      return;
    }
    setVisible(true);
    if (prev.current === "saving" && status === "saved") setBurst((b) => b + 1);
    prev.current = status;
    // '저장됨'은 잠시 보여준 뒤 슬라이드로 사라진다(저장 중·실패는 유지).
    if (status === "saved") {
      const id = setTimeout(() => setVisible(false), 1700);
      return () => clearTimeout(id);
    }
  }, [status]);

  return (
    <div
      className={`pointer-events-none fixed right-4 top-[70px] z-[60] transition-all duration-300 ease-out ${
        visible ? "translate-x-0 opacity-100" : "translate-x-[130%] opacity-0"
      }`}
      aria-live="polite"
    >
      <div className="pointer-events-auto relative inline-flex items-center gap-2 rounded-full bg-[#0B1227] px-4 py-2 text-[12.5px] font-semibold text-white shadow-[0_8px_24px_rgba(11,18,39,0.28)] ring-1 ring-white/10">
        {status === "saving" ? (
          <>
            <ArrowsClockwise className="h-3.5 w-3.5 animate-spin text-white/80" weight="bold" aria-hidden />
            {t.saving}
          </>
        ) : status === "saved" ? (
          <>
            {burst > 0 ? <MiniBurst key={burst} /> : null}
            <Check className="h-4 w-4 text-[#15C47E]" weight="bold" aria-hidden />
            {t.saved}
          </>
        ) : status === "error" ? (
          <>
            <WarningCircle className="h-4 w-4 text-rose-400" weight="fill" aria-hidden />
            {t.failed}
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="ml-0.5 rounded-full bg-white/15 px-2 py-0.5 text-[11.5px] font-bold text-white transition hover:bg-white/25"
              >
                {t.retry}
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
