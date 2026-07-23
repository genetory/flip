"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowsClockwise, CircleNotch, Sparkle, Target, Ticket, Timer } from "@phosphor-icons/react/dist/ssr";
import { Button } from "../ui/button";
import { redeemTicketCode } from "../../lib/resume-maker-client";
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
  // 이 모달은 backdrop-blur 가 걸린 GNB 헤더 안에서 렌더된다. 조상에 filter 가 있으면
  // position:fixed 가 뷰포트가 아니라 그 조상 기준이 되어 모달이 헤더 안에 갇혀 잘린다.
  // 그래서 portal 로 document.body 에 렌더해 헤더의 containing block 에서 빼낸다.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  async function redeem() {
    const c = code.trim();
    if (!c || redeeming) return;
    setRedeeming(true);
    setFeedback(null);
    try {
      const r = await redeemTicketCode(c);
      setFeedback({ ok: true, text: q.redeemSuccess(r.tickets) });
      setCode("");
      if (typeof window !== "undefined") window.dispatchEvent(new Event("aply:ai-usage-changed")); // 잔량 갱신
    } catch (e) {
      const ec = (e as { code?: string }).code;
      const msg =
        ec === "COUPON_INVALID" ? q.codeInvalid
        : ec === "COUPON_EXPIRED" ? q.codeExpired
        : ec === "COUPON_ALREADY" ? q.codeAlready
        : ec === "COUPON_GROUP_USED" ? q.codeGroupUsed
        : ec === "COUPON_EXHAUSTED" ? q.codeExhausted
        : q.redeemFailed;
      setFeedback({ ok: false, text: msg });
    } finally {
      setRedeeming(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-5" onClick={onClose}>
      <div className="my-auto w-full max-w-sm rounded-3xl bg-white p-6 shadow-elevated" onClick={(e) => e.stopPropagation()}>
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

        {/* 코드로 충전 — 1회성 쿠폰 */}
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#191F28]">
            <Ticket weight="fill" className="h-4 w-4 text-[#0B46E8]" aria-hidden />
            {q.codeTitle}
          </p>
          <div className="mt-2 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void redeem();
              }}
              placeholder={q.codePlaceholder}
              maxLength={40}
              className="h-11 min-w-0 flex-1 rounded-xl border border-[#E5E8EB] bg-white px-3 text-[13.5px] uppercase tracking-wide text-[#191F28] placeholder:normal-case placeholder:tracking-normal placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:outline-none"
            />
            <Button size="lg" className="shrink-0 px-4" disabled={redeeming || !code.trim()} onClick={() => void redeem()}>
              {redeeming ? <CircleNotch className="animate-spin" weight="bold" /> : null}
              {q.redeemBtn}
            </Button>
          </div>
          {feedback ? (
            <p className={`mt-1.5 text-[12px] font-semibold ${feedback.ok ? "text-[#15C47E]" : "text-rose-500"}`}>{feedback.text}</p>
          ) : null}
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
    </div>,
    document.body
  );
}
