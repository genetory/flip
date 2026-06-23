"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowsClockwise, Check, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import type { AutosaveStatus } from "./useResumeMakerAutosave";
import { useAutoSaveCopy } from "../../lib/resume-maker-i18n/auto-save";

// 상단 저장 상태 표시 — 저장 중 / 저장됨 / 저장 실패. idle 은 노출하지 않음.
// 저장이 막 끝나는 순간(저장 중 → 저장됨)마다 작은 컨페티를 터뜨려 "방금 저장됐다"는
// 느낌을 준다.

const BURST_COLORS = ["#0B46E8", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"];

function MiniBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * 360 + Math.random() * 20;
        const dist = 14 + Math.random() * 16;
        const rad = (angle * Math.PI) / 180;
        return {
          dx: Math.cos(rad) * dist,
          dy: Math.sin(rad) * dist - 6,
          color: BURST_COLORS[i % BURST_COLORS.length],
          delay: Math.random() * 0.05,
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
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: 1,
            background: p.color,
            // CSS 변수로 도착 지점 전달.
            ["--dx" as string]: `${p.dx}px`,
            ["--dy" as string]: `${p.dy}px`,
            animation: `rm-save-burst 0.8s ${p.delay}s ease-out forwards`
          } as React.CSSProperties}
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
  const t = useAutoSaveCopy();

  useEffect(() => {
    if (prev.current === "saving" && status === "saved") setBurst((b) => b + 1);
    prev.current = status;
  }, [status]);

  if (status === "idle") return null;
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground">
        <ArrowsClockwise className="h-3.5 w-3.5 animate-spin" weight="bold" aria-hidden />
        {t.saving}
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="relative inline-flex items-center gap-1.5 text-[12.5px] font-medium text-emerald-600">
        {burst > 0 ? <MiniBurst key={burst} /> : null}
        <Check className="h-3.5 w-3.5" weight="bold" aria-hidden />
        {t.saved}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-destructive">
      <WarningCircle className="h-3.5 w-3.5" weight="fill" aria-hidden />
      {t.failed}
      {onRetry ? (
        <button type="button" onClick={onRetry} className="underline underline-offset-2 hover:text-destructive/80">
          {t.retry}
        </button>
      ) : null}
    </span>
  );
}
