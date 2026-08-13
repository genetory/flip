"use client";

// 포인트 내역 — 여태까지 받은(웰컴/매일 적립/쿠폰 충전) 내역 리스트.
import { useEffect, useState } from "react";
import { Sparkle } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { PointsBalanceCard } from "../PointsBalanceCard";
import { getAiPointHistory, type AiPointLogEntry } from "../../../lib/resume-maker-client";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";

function reasonLabel(t: PlatformT, reason: string): string {
  switch (reason) {
    case "welcome":
      return t("가입 축하 포인트", "Welcome bonus", "注册奖励", "Thưởng chào mừng", "登録ボーナス", "Bonus daftar");
    case "daily":
      return t("매일 적립", "Daily grant", "每日发放", "Cấp hàng ngày", "毎日付与", "Pemberian harian");
    case "coupon":
      return t("코드 충전", "Code charge", "兑换码充值", "Nạp bằng mã", "コードチャージ", "Isi via kode");
    default:
      return t("포인트 지급", "Points granted", "积分发放", "Cấp điểm", "ポイント付与", "Poin diberikan");
  }
}

export function PointHistoryScreen() {
  const t = usePlatformT();
  const [history, setHistory] = useState<AiPointLogEntry[] | null>(null);

  useEffect(() => {
    getAiPointHistory()
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-5">
        <div>
          <TalentBackButton className="mb-3" fallback="/talent/settings" />
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t("포인트 내역", "Point history", "积分记录", "Lịch sử điểm", "ポイント履歴", "Riwayat poin")}</h1>
        </div>

        {/* 잔액 카드 — 설정 '내 포인트'와 동일 */}
        <PointsBalanceCard />

        {/* 받은 내역 리스트 */}
        <div>
          <p className="mb-3 text-[13px] font-bold text-[#8B95A1]">{t("받은 내역", "Received", "获得记录", "Đã nhận", "受け取り履歴", "Diterima")}</p>
          {history === null ? (
            <p className="rounded-2xl border border-[#EEF1F5] bg-white py-10 text-center text-[13px] text-[#B0B8C1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p>
          ) : history.length === 0 ? (
            <p className="rounded-2xl border border-[#EEF1F5] bg-white py-10 text-center text-[13px] text-[#B0B8C1]">{t("아직 받은 내역이 없어요.", "No history yet.", "暂无记录。", "Chưa có lịch sử.", "まだ履歴がありません。", "Belum ada riwayat.")}</p>
          ) : (
            <ul className="divide-y divide-[#F2F4F6] overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
              {history.map((h) => (
                <li key={h.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EDF1FD] text-[#0B46E8]">
                    <Sparkle className="h-4 w-4" weight="fill" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-[#191F28]">{reasonLabel(t, h.reason)}</p>
                    <p className="mt-0.5 text-[12px] text-[#8B95A1]">{new Date(h.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="shrink-0 text-[15px] font-black tabular-nums text-[#0A9B59]">+{h.amount.toLocaleString()}P</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </TalentAppShell>
  );
}
