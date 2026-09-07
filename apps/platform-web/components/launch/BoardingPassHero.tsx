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
    QRCode.toDataURL(url, { margin: 0, width: 160, errorCorrectionLevel: "M", color: { dark: "#0E1526", light: "#ffffff" } }).then(setQr).catch(() => {});
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
    <section className="cl-pass" aria-label={t("나의 커리어 보딩패스", "My career boarding pass", "我的求职登机牌", "Thẻ lên máy bay sự nghiệp", "私のキャリア搭乗券", "Boarding pass karier saya")}>
      <div className="cl-pass-main">
        <p className="cl-eyebrow" style={{ color: "var(--cl-faint)" }}>Boarding Pass · {t("커리어 탑승권", "Career pass", "求职登机牌", "Vé sự nghiệp", "キャリア搭乗券", "Tiket karier")}</p>

        <div className="cl-route">
          <div className="cl-port">
            <div className="code">{t("지금", "Now", "现在", "Bây giờ", "現在", "Sekarang")}</div>
            <div className="label">{t("취업 준비 중", "Getting job-ready", "求职准备中", "Đang chuẩn bị xin việc", "就活準備中", "Sedang bersiap")}</div>
          </div>
          <div className="cl-planeline">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ left: `${planePos}%` }} aria-hidden>
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L11 19v-5.5z" />
            </svg>
          </div>
          <div className="cl-port" style={{ textAlign: "right" }}>
            <div className="code accent" style={{ color: "var(--cl-accent)" }}>{t("취업", "Hired", "就业", "Trúng tuyển", "内定", "Kerja")}</div>
            <div className="label">{targetJob ? t(`목표 · ${targetJob}`, `Goal · ${targetJob}`, `目标 · ${targetJob}`, `Mục tiêu · ${targetJob}`, `目標 · ${targetJob}`, `Target · ${targetJob}`) : t("목표 직무 탐색 중", "Exploring target roles", "探索目标职务中", "Đang tìm công việc mục tiêu", "目標職種を探索中", "Menjelajahi peran target")}</div>
          </div>
        </div>

        <div className="cl-pass-meta">
          <div className="cl-meta">
            <div className="k">{t("탑승자", "Passenger", "乘客", "Hành khách", "搭乗者", "Penumpang")}</div>
            <div className="v" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
          </div>
          <div className="cl-meta">
            <div className="k">{t("현재 주차", "Boarding", "当前周", "Tuần hiện tại", "現在の週", "Minggu")}</div>
            <div className="v">
              <span className="cl-flap"><span className="cell">0</span><span className="cell">{week}</span></span>
              <span style={{ fontSize: 12.5, color: "var(--cl-faint)", fontWeight: 800, marginLeft: 6 }}>{t("주차 진행 중", "in progress", "周 进行中", "đang học", "週目 進行中", "berjalan")}</span>
            </div>
          </div>
          <div className="cl-meta">
            <div className="k">{t("진행률", "Progress", "进度", "Tiến độ", "進捗", "Progres")}</div>
            <div className="v accent">{overall}%</div>
          </div>
          <div className="cl-meta">
            <div className="k">{t("클래스", "Class", "舱位", "Hạng", "クラス", "Kelas")}</div>
            <div className="v">{t("4주 집중 · AI 코치", "4-week · AI coach", "4周集中 · AI教练", "4 tuần · AI coach", "4週集中 · AIコーチ", "4 minggu · AI coach")}</div>
          </div>
          <div className="cl-meta">
            <div className="k">{t("소속", "Cohort", "所属", "Thuộc về", "所属", "Kohort")}</div>
            <div className="v" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{affiliation}</div>
          </div>
          <div className="cl-meta">
            <div className="k">{t("함께", "Peers", "同伴", "Đồng đội", "仲間", "Rekan")}</div>
            <div className="v">{peers >= 1 ? t(`${peers}명 함께`, `${peers} peers`, `${peers} 人`, `${peers} bạn`, `${peers}人`, `${peers} rekan`) : "–"}</div>
          </div>
        </div>
      </div>

      <div className="cl-pass-stub">
        <div>
          <div className="k">{t("오늘의 관문", "Today's gate", "今日关卡", "Cửa hôm nay", "今日のゲート", "Gate hari ini")}</div>
          <div className="gate">{vm.coach.todayFocus}</div>
        </div>
        <div className="cl-qr" aria-hidden>{qr ? <img src={qr} alt="" /> : null}</div>
        <div className="cl-stub-no" style={{ fontFamily: "ui-monospace, SF Mono, monospace" }}>CAREER · LAUNCH</div>
      </div>
    </section>
  );
}
