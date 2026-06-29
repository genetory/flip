"use client";

import { type ReactNode } from "react";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { AiTicketCost } from "./AiTicketCost";

// 자기소개·경험의 AI 추천/다듬기 액션 공통 칩.
// 왼쪽 아이콘 없음(로딩 중에만 스피너), 라벨 뒤에 소모 티켓 칩(feature 기준).
export function AiChipButton({
  loading = false,
  disabled,
  onClick,
  feature,
  children
}: {
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  feature: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled ?? loading}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition disabled:opacity-60 ${
        loading ? "border-[#0B46E8] bg-[#EDF1FD] text-[#0B46E8]" : "border-border bg-card text-foreground/80 hover:border-[#0B46E8]/40"
      }`}
    >
      {loading ? <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" /> : null}
      {children}
      {loading ? null : <AiTicketCost feature={feature} tone="muted" />}
    </button>
  );
}
