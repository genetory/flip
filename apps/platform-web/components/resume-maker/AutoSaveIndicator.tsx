"use client";

import { ArrowsClockwise, Check, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import type { AutosaveStatus } from "./useResumeMakerAutosave";

// 상단 저장 상태 표시 — 저장 중 / 저장됨 / 저장 실패. idle 은 노출하지 않음.
export function AutoSaveIndicator({ status, onRetry }: { status: AutosaveStatus; onRetry?: () => void }) {
  if (status === "idle") return null;
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground">
        <ArrowsClockwise className="h-3.5 w-3.5 animate-spin" weight="bold" aria-hidden />
        저장 중...
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-emerald-600">
        <Check className="h-3.5 w-3.5" weight="bold" aria-hidden />
        저장됨
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-destructive">
      <WarningCircle className="h-3.5 w-3.5" weight="fill" aria-hidden />
      저장 실패
      {onRetry ? (
        <button type="button" onClick={onRetry} className="underline underline-offset-2 hover:text-destructive/80">
          다시 시도
        </button>
      ) : null}
    </span>
  );
}
