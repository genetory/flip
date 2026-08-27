"use client";

// 내 포인트 잔액 카드 — 설정 '내 포인트' 섹션과 포인트 내역 페이지 공용.
// 잔액 + 내역(페이지 이동) + 충전(코드 팝업).
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkle } from "@phosphor-icons/react";
import { getAiUsage, type AiUsage } from "../../lib/resume-maker-client";
import { AiTicketStatusModal } from "../resume-maker/AiTicketStatusModal";
import { usePlatformT } from "../../lib/i18n";

export function PointsBalanceCard() {
  // AI 포인트 전면 무료 전환 — 잔액 카드 비노출.
  return null;
}

function PointsBalanceCardLegacy() {
  const t = usePlatformT();
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [chargeOpen, setChargeOpen] = useState(false);
  useEffect(() => {
    const refresh = () => {
      getAiUsage().then(setUsage).catch(() => {});
    };
    refresh();
    if (typeof window !== "undefined") window.addEventListener("aply:ai-usage-changed", refresh);
    return () => {
      if (typeof window !== "undefined") window.removeEventListener("aply:ai-usage-changed", refresh);
    };
  }, []);
  return (
    <>
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B46E8] to-[#4C7BF5] p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[12.5px] font-bold text-white/80">{t("보유 AI 포인트", "AI points", "AI 积分", "Điểm AI", "AIポイント", "Poin AI")}</p>
            <p className="mt-1 text-[34px] font-black leading-none tracking-[-0.03em] tabular-nums">{usage ? usage.remaining.toLocaleString() : "—"}</p>
            <p className="mt-2 text-[12px] font-medium text-white/75">{usage && usage.dailyGrant > 0 ? t(`매일 ${usage.dailyGrant}P 자동 적립`, `+${usage.dailyGrant}P daily`, `每日 +${usage.dailyGrant}P`, `+${usage.dailyGrant}P mỗi ngày`, `毎日 +${usage.dailyGrant}P`, `+${usage.dailyGrant}P harian`) : ""}</p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Sparkle className="h-6 w-6" weight="fill" />
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <Link href="/talent/settings/points" className="rounded-xl bg-white/15 py-2.5 text-center text-[13.5px] font-bold text-white transition hover:bg-white/25">
            {t("내역", "History", "记录", "Lịch sử", "履歴", "Riwayat")}
          </Link>
          <button type="button" onClick={() => setChargeOpen(true)} className="rounded-xl bg-white py-2.5 text-[13.5px] font-bold text-[#0B46E8] transition hover:bg-white/90">
            {t("충전", "Charge", "充值", "Nạp", "チャージ", "Isi")}
          </button>
        </div>
      </div>
      {chargeOpen && usage ? (
        <AiTicketStatusModal remaining={usage.remaining} resetAt={usage.resetAt || null} dailyGrant={usage.dailyGrant} onClose={() => setChargeOpen(false)} />
      ) : null}
    </>
  );
}
