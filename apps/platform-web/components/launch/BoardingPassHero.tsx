"use client";

// 홈 대시보드 히어로 — "커리어 보딩패스". 정적 마스트헤드를 대체한다.
// 기능 추가 없이 기존 vm(현재 주차·진행·목표 직무·오늘의 관문·다음 행동)만 표현.
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { DashboardVM } from "../../lib/launch/dashboard-client";
import { useLaunchT } from "../../lib/launch/i18n";

export function BoardingPassHero({ vm, displayName, overall }: { vm: DashboardVM; displayName: string; overall: number }) {
  const t = useLaunchT();
  const week = Math.min(Math.max(vm.currentWeek || 1, 1), 4);
  const targetJob = vm.profileSummary.targetJob?.trim();
  const affiliation = vm.cohort?.university?.trim() || vm.cohort?.name?.trim() || "Career Launch";
  const peers = Math.max((vm.cohortActivity.activeThisWeek ?? 0) - 1, 0); // 본인 제외 동료 수

  // 티켓 QR — 커리어 런치 홈으로 연결(스캔 가능한 실제 QR).
  const [qr, setQr] = useState<string>("");
  useEffect(() => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/career-launch/dashboard` : "https://aply.global/career-launch/dashboard";
    QRCode.toDataURL(url, { margin: 0, width: 160, errorCorrectionLevel: "M", color: { dark: "#191F28", light: "#ffffff" } }).then(setQr).catch(() => {});
  }, []);

  // 비행기 위치를 진입 후 진행률로 슬라이드(감속 모션 존중).
  const [planePos, setPlanePos] = useState(0);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setPlanePos(overall); return; }
    const id = window.setTimeout(() => setPlanePos(overall), 120);
    return () => window.clearTimeout(id);
  }, [overall]);

  return (
    <section className="grid overflow-hidden rounded-3xl bg-[color:var(--v2-band)] md:grid-cols-[1fr_240px]" aria-label={t("나의 커리어 보딩패스", "My career boarding pass", "我的求职登机牌", "Thẻ lên máy bay sự nghiệp", "私のキャリア搭乗券", "Boarding pass karier saya")}>
      <div className="flex min-w-0 flex-col justify-center p-6 md:p-8">
        <p className="text-[13px] font-semibold text-[color:var(--v2-muted)]">Boarding Pass · {t("커리어 탑승권", "Career pass", "求职登机牌", "Vé sự nghiệp", "キャリア搭乗券", "Tiket karier")}</p>

        <div className="mb-6 mt-4 flex items-center gap-4">
          <div className="min-w-0">
            <div className="text-[23px] font-bold leading-none tracking-[-0.02em] text-[color:var(--v2-ink)] sm:text-[28px]">{t("지금", "Now", "现在", "Bây giờ", "現在", "Sekarang")}</div>
            <div className="mt-2 break-keep text-[13px] font-medium text-[color:var(--v2-muted)]">{t("취업 준비 중", "Getting job-ready", "求职准备中", "Đang chuẩn bị xin việc", "就活準備中", "Sedang bersiap")}</div>
          </div>
          <div className="relative h-0.5 flex-1 bg-[repeating-linear-gradient(90deg,var(--v2-faint)_0_6px,transparent_6px_12px)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ left: `${planePos}%` }} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 text-[color:var(--v2-accent)] animate-[cl-plane-travel_5s_ease-in-out_infinite] motion-reduce:animate-none" aria-hidden>
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L11 19v-5.5z" />
            </svg>
          </div>
          <div className="min-w-0" style={{ textAlign: "right" }}>
            <div className="text-[23px] font-bold leading-none tracking-[-0.02em] text-[color:var(--v2-accent)] sm:text-[28px]">{t("취업", "Hired", "就业", "Trúng tuyển", "内定", "Kerja")}</div>
            <div className="mt-2 break-keep text-[13px] font-medium text-[color:var(--v2-muted)]">{targetJob ? t(`목표 · ${targetJob}`, `Goal · ${targetJob}`, `目标 · ${targetJob}`, `Mục tiêu · ${targetJob}`, `目標 · ${targetJob}`, `Target · ${targetJob}`) : t("목표 직무 탐색 중", "Exploring target roles", "探索目标职务中", "Đang tìm công việc mục tiêu", "目標職種を探索中", "Menjelajahi peran target")}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-2xl bg-white p-4 sm:grid-cols-3 sm:gap-x-5 sm:p-5">
          <div className="flex min-w-0 flex-col">
            <div className="text-[12px] font-medium text-[color:var(--v2-faint)]">{t("탑승자", "Passenger", "乘客", "Hành khách", "搭乗者", "Penumpang")}</div>
            <div className="mt-1.5 flex min-h-[28px] items-center break-keep text-[15px] font-bold tracking-[-0.01em] text-[color:var(--v2-ink)]" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="text-[12px] font-medium text-[color:var(--v2-faint)]">{t("현재 단계", "Boarding", "当前步骤", "Bước hiện tại", "現在のステップ", "Langkah")}</div>
            <div className="mt-1.5 flex min-h-[28px] items-center break-keep text-[15px] font-bold tracking-[-0.01em] text-[color:var(--v2-ink)]">
              <span className="inline-flex gap-1"><span className="inline-flex h-7 w-6 items-center justify-center rounded-md bg-[color:var(--v2-band)] text-[15px] font-bold tabular-nums">0</span><span className="inline-flex h-7 w-6 items-center justify-center rounded-md bg-[color:var(--v2-band)] text-[15px] font-bold tabular-nums">{week}</span></span>
              <span style={{ fontSize: 12.5, color: "var(--v2-faint)", fontWeight: 600, marginLeft: 6 }}>{t("단계 진행 중", "in progress", "步骤 进行中", "đang học", "ステップ 進行中", "berjalan")}</span>
            </div>
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="text-[12px] font-medium text-[color:var(--v2-faint)]">{t("진행률", "Progress", "进度", "Tiến độ", "進捗", "Progres")}</div>
            <div className="mt-1.5 flex min-h-[28px] items-center text-[15px] font-bold tracking-[-0.01em] text-[color:var(--v2-accent)]">{overall}%</div>
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="text-[12px] font-medium text-[color:var(--v2-faint)]">{t("클래스", "Class", "舱位", "Hạng", "クラス", "Kelas")}</div>
            <div className="mt-1.5 flex min-h-[28px] items-center break-keep text-[15px] font-bold tracking-[-0.01em] text-[color:var(--v2-ink)]">{t("4단계 집중 · AI 코치", "4-step · AI coach", "4个步骤 · AI教练", "4 bước · AI coach", "4ステップ集中 · AIコーチ", "4 langkah · AI coach")}</div>
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="text-[12px] font-medium text-[color:var(--v2-faint)]">{t("소속", "Cohort", "所属", "Thuộc về", "所属", "Kohort")}</div>
            <div className="mt-1.5 flex min-h-[28px] items-center break-keep text-[15px] font-bold tracking-[-0.01em] text-[color:var(--v2-ink)]" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{affiliation}</div>
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="text-[12px] font-medium text-[color:var(--v2-faint)]">{t("함께", "Peers", "同伴", "Đồng đội", "仲間", "Rekan")}</div>
            <div className="mt-1.5 flex min-h-[28px] items-center break-keep text-[15px] font-bold tracking-[-0.01em] text-[color:var(--v2-ink)]">{peers >= 1 ? t(`${peers}명 함께`, `${peers} peers`, `${peers} 人`, `${peers} bạn`, `${peers}人`, `${peers} rekan`) : "–"}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-row flex-wrap items-center gap-x-6 gap-y-4 bg-[color:var(--v2-accent)] p-6 text-white md:flex-col md:flex-nowrap md:items-stretch md:gap-5 md:p-7">
        <div>
          <div className="text-[12px] font-semibold opacity-75">{t("오늘의 관문", "Today's gate", "今日关卡", "Cửa hôm nay", "今日のゲート", "Gate hari ini")}</div>
          <div className="mt-1 break-keep text-[19px] font-bold leading-[1.3] tracking-[-0.01em]">{vm.coach.todayFocus}</div>
        </div>
        <div className="h-[76px] w-[76px] self-start rounded-xl bg-white p-1.5 md:mt-auto md:self-center" aria-hidden>{qr ? <img src={qr} alt="" className="block h-full w-full" /> : null}</div>
        <div className="w-full text-center text-[11px] tracking-[0.28em] opacity-70" style={{ fontFamily: "ui-monospace, SF Mono, monospace" }}>CAREER · LAUNCH</div>
      </div>
    </section>
  );
}
