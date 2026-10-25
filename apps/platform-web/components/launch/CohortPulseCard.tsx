"use client";

// 내 기수와 함께 달리는 익명 진행률 카드 — 동기부여용. 인원수·평균 완료 주차·내 위치.
import { useEffect, useState } from "react";
import { UsersThree } from "@phosphor-icons/react";
import { fetchCohortStats, type CohortStats } from "../../lib/launch/progress-client";
import { useLaunchT } from "../../lib/launch/i18n";

export function CohortPulseCard() {
  const t = useLaunchT();
  const [stats, setStats] = useState<CohortStats | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchCohortStats().then((s) => { if (alive) setStats(s); });
    return () => { alive = false; };
  }, []);

  // 동기가 2명 이상일 때만 의미 있음.
  if (!stats || stats.peerCount < 2) return null;

  return (
    <div className="rounded-3xl bg-[color:var(--v2-band)] p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[color:var(--v2-accent)]"><UsersThree className="h-5 w-5" weight="fill" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-[color:var(--v2-ink)]">{t(`우리 기수 ${stats.peerCount}명이 함께 달려요`, `${stats.peerCount} peers running with you`, `本期 ${stats.peerCount} 人一起冲刺`, `${stats.peerCount} bạn cùng khóa đang cùng tiến`, `同期${stats.peerCount}名が一緒に走っています`, `${stats.peerCount} rekan seangkatan berjuang bersama`)}</p>
          <p className="mt-0.5 break-keep text-[13px] leading-relaxed text-[color:var(--v2-faint)]">
            {t(`평균 ${stats.avgWeeks}/4단계 완료`, `Avg ${stats.avgWeeks}/4 steps done`, `平均完成 ${stats.avgWeeks}/4 个步骤`, `Trung bình ${stats.avgWeeks}/4 bước`, `平均${stats.avgWeeks}/4ステップ完了`, `Rata² ${stats.avgWeeks}/4 langkah`)}
            {stats.aheadOfPct > 0 ? ` · ${t(`나는 상위 ${100 - stats.aheadOfPct}%`, `You're ahead of ${stats.aheadOfPct}%`, `你领先 ${stats.aheadOfPct}%`, `Bạn dẫn trước ${stats.aheadOfPct}%`, `あなたは上位${100 - stats.aheadOfPct}%`, `Kamu unggul dari ${stats.aheadOfPct}%`)}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
