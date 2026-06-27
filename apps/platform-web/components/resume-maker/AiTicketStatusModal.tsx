"use client";

import { useEffect, useState } from "react";
import { ArrowsClockwise, Sparkle, Target, Timer } from "@phosphor-icons/react/dist/ssr";
import { Button } from "../ui/button";
import { useQuotaCopy } from "../../lib/resume-maker-i18n/quota";

// resetAt 까지 남은 시간을 HH:MM:SS 로 1초마다 갱신.
function useCountdown(resetAt: string | null): string {
  const compute = () => {
    if (!resetAt) return "";
    const ms = new Date(resetAt).getTime() - Date.now();
    if (!Number.isFinite(ms) || ms <= 0) return "00:00:00";
    const s = Math.floor(ms / 1000);
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };
  const [t, setT] = useState("");
  useEffect(() => {
    setT(compute());
    const id = setInterval(() => setT(compute()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetAt]);
  return t;
}

// GNB 티켓 뱃지를 누르면 뜨는 보유 현황 + 얻는 방법(매일 N장 충전 + 다음 충전 타이머).
export function AiTicketStatusModal({
  remaining,
  resetAt,
  dailyGrant,
  onClose
}: {
  remaining: number;
  resetAt: string | null;
  dailyGrant: number | null;
  onClose: () => void;
}) {
  const q = useQuotaCopy();
  const countdown = useCountdown(resetAt);
  const perDay = dailyGrant && dailyGrant > 0 ? dailyGrant : 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-elevated" onClick={(e) => e.stopPropagation()}>
        {/* 보유 현황 */}
        <p className="text-[13px] font-bold text-[#8B95A1]">{q.statusTitle}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <Sparkle weight="fill" className="h-7 w-7 shrink-0 text-[#0B46E8]" aria-hidden />
          <span className="text-[34px] font-extrabold leading-none tabular-nums text-[#191F28]">{remaining.toLocaleString()}</span>
          <span className="text-[14px] font-bold text-[#8B95A1]">{q.balanceLabel}</span>
        </div>

        {/* 얻는 방법 — 매일 N장 자동 충전 + 타이머 */}
        <div className="mt-5 rounded-2xl bg-[#F7F9FB] p-4">
          <p className="text-[12.5px] font-bold text-[#191F28]">{q.earnTitle}</p>
          <div className="mt-2.5 flex items-start gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EDF1FD]">
              <ArrowsClockwise weight="bold" className="h-4 w-4 text-[#0B46E8]" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-[#191F28]">{q.earnDaily(perDay)}</p>
              {countdown ? (
                <p className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-[#0B46E8]">
                  <Timer weight="bold" className="h-3.5 w-3.5" aria-hidden />
                  <span className="tabular-nums">{q.nextChargeIn(countdown)}</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* 사용처 */}
        <p className="mt-4 flex items-start gap-1.5 text-[12px] leading-relaxed text-[#8B95A1]">
          <Target weight="fill" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C9CDD2]" aria-hidden />
          {q.usedForNote}
        </p>

        <Button variant="default" size="lg" className="mt-5 w-full" onClick={onClose}>
          {q.ok}
        </Button>
      </div>
    </div>
  );
}
