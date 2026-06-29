"use client";

import { Sparkle } from "@phosphor-icons/react/dist/ssr";
import { ticketCost } from "../../lib/resume-maker-ticket-cost";

// 버튼/라벨 안에 "이 동작은 티켓 N개 소모"를 표시하는 공통 뱃지.
// feature 를 주면 공통 비용표에서 비용을 읽는다(권장). cost 로 직접 지정도 가능.
// tone: "onPrimary"(파란 버튼 위 흰 반투명) | "muted"(밝은/고스트 버튼·라벨용).
export function AiTicketCost({
  feature,
  cost,
  tone = "onPrimary"
}: {
  feature?: string;
  cost?: number;
  tone?: "onPrimary" | "muted" | "plain";
}) {
  const value = feature ? ticketCost(feature) : cost ?? 1;
  if (value <= 0) return null;
  const cls =
    tone === "muted"
      ? "bg-[#0B46E8]/[0.08] text-[#0B46E8] px-1.5 py-0.5"
      : tone === "plain"
        ? "text-current"
        : "bg-white/20 text-current px-1.5 py-0.5";
  return (
    <span className={`ml-1.5 inline-flex items-center gap-0.5 rounded-full text-[11px] font-bold leading-none ${cls}`}>
      <Sparkle weight="fill" className="h-3 w-3" aria-hidden />
      {value}
    </span>
  );
}
