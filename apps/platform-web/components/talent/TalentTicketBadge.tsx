"use client";

// GNB에 노출하는 AI 티켓 잔액 뱃지 — resume-maker와 동일한 지갑(AiWallet).
// 탤런트(학생)만 사용하며, 클릭 시 보유 현황·자동충전·코드 충전 모달을 연다.
import { useEffect, useState } from "react";
import { Sparkle } from "@phosphor-icons/react";
import { getAiUsage, type AiUsage } from "../../lib/resume-maker-client";
import { AiTicketStatusModal } from "../resume-maker/AiTicketStatusModal";

export function TalentTicketBadge() {
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => {
      getAiUsage().then(setUsage).catch(() => {});
    };
    refresh();
    // 모의 면접·이력서메이커 등 어디서 티켓을 쓰거나 충전해도 동기화.
    if (typeof window !== "undefined") window.addEventListener("aply:ai-usage-changed", refresh);
    return () => {
      if (typeof window !== "undefined") window.removeEventListener("aply:ai-usage-changed", refresh);
    };
  }, []);

  if (!usage) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`AI 티켓 ${usage.remaining}개`}
        className="flex items-center gap-1 rounded-full bg-[#EDF1FD] px-2.5 py-1.5 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#DFE7FB]"
      >
        <Sparkle className="h-3.5 w-3.5" weight="fill" />
        <span className="tabular-nums">{usage.remaining.toLocaleString()}</span>
      </button>
      {open ? (
        <AiTicketStatusModal
          remaining={usage.remaining}
          resetAt={usage.resetAt || null}
          dailyGrant={usage.dailyGrant}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
