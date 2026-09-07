"use client";

// 보딩패스 아래 — "오늘의 탑승 수속"(포커스 CTA) + 연속 접속(스트릭) + 서류 완성도 게이지.
// 대표 CTA 는 여기서만(보딩패스 스텁의 버튼은 제거). 점수는 캐시된 값이 있을 때만 표시하고,
// 없으면 링만 비운 채 평가 페이지로 유도(허위 수치 없음). 스트릭은 로컬 저장 기반 "연속 접속".
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowRight, Airplane } from "@phosphor-icons/react";
import type { DashboardVM } from "../../lib/launch/dashboard-client";
import { fetchResumeScore, fetchCoverScore } from "../../lib/launch/feedback-client";
import { useLaunchT } from "../../lib/launch/i18n";
import { trackCareerFunnel } from "../../lib/analytics";
import { logActivity } from "../../lib/launch/pilot-client";

function Ring({ value, color, label, href }: { value: number | null; color: string; label: string; href: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (value == null) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setV(value); return; }
    let raf = 0;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (t0 == null) t0 = ts;
      const p = Math.min((ts - t0) / 1000, 1);
      setV(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <Link href={href} className="cl-gauge">
      <span className="cl-ring" style={{ "--val": value == null ? 0 : v, "--col": color } as CSSProperties}>
        <b className={value == null ? "empty" : undefined}>{value == null ? "–" : v}</b>
      </span>
      <span className="lab">{label}</span>
    </Link>
  );
}

export function CheckInPanel({ vm }: { vm: DashboardVM }) {
  const t = useLaunchT();
  const c = vm.coach;
  const streak = vm.activityStreak ?? 1; // 서버 계산 연속 활동일(교차 기기)
  const [resume, setResume] = useState<number | null>(null);
  const [cover, setCover] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    // 캐시된 점수만(generate:false). 없으면 null → 링 비움.
    void Promise.all([
      fetchResumeScore({ generate: false }).catch(() => null),
      fetchCoverScore({ generate: false }).catch(() => null)
    ]).then(([r, cv]) => {
      if (!alive) return;
      setResume(r?.score?.total ?? null);
      setCover(cv?.score?.total ?? null);
    });
    return () => { alive = false; };
  }, []);

  const dotsOn = Math.min(streak, 7);

  return (
    <div className="cl-checkin">
      <div className="cl-focus">
        <span className="tag"><Airplane size={13} weight="fill" aria-hidden /> {t("오늘의 탑승 수속", "Today's check-in", "今日登机手续", "Thủ tục hôm nay", "本日の搭乗手続き", "Check-in hari ini")}</span>
        <h2>{c.todayFocus}</h2>
        {c.purpose ? <p>{c.purpose}</p> : <p>{t("오늘 한 걸음이면 다음 관문이 열려요.", "One step today opens the next gate.", "今天迈出一步，就能开启下一关。", "Một bước hôm nay mở cửa tiếp theo.", "今日の一歩で次のゲートが開きます。", "Satu langkah hari ini membuka gerbang berikutnya.")}</p>}
        <Link
          href={vm.nextAction.destination}
          onClick={() => {
            void logActivity("next_action_click", { week: vm.currentWeek });
            trackCareerFunnel("career_primary_action_clicked", { actionType: vm.nextAction.actionType, destination: vm.nextAction.destination, currentWeek: vm.currentWeek });
          }}
          className="cl-cta"
        >
          {c.cta} <ArrowRight size={16} weight="bold" aria-hidden />
        </Link>
      </div>

      <div className="cl-side">
        <div className="cl-mini">
          <p className="cl-eyebrow" style={{ color: "var(--cl-faint)" }}>{t("연속 활동", "Activity streak", "连续活动", "Chuỗi hoạt động", "連続活動", "Rentetan aktivitas")}</p>
          <div className="cl-streak">
            <span className="flame" aria-hidden>🔥</span>
            <div>
              <div><span className="n">{streak}</span><span className="d">{t("일 연속", "days", "天连续", "ngày", "日連続", "hari")}</span></div>
              <div className="cl-dots" aria-hidden>
                {Array.from({ length: 7 }).map((_, i) => <span key={i} className={i < dotsOn ? "on" : undefined} />)}
              </div>
            </div>
          </div>
        </div>

        <div className="cl-mini">
          <p className="cl-eyebrow" style={{ color: "var(--cl-faint)" }}>{t("서류 완성도", "Document score", "材料完成度", "Độ hoàn thiện hồ sơ", "書類の完成度", "Kelengkapan dokumen")}</p>
          <div className="cl-gauges">
            <Ring value={resume} color="var(--cl-accent)" label={t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")} href="/career-launch/resume-collect" />
            <Ring value={cover} color="var(--cl-accent-2)" label={t("자기소개서", "Cover", "自我介绍", "Thư GT", "自己紹介書", "Surat")} href="/career-launch/cover-collect" />
          </div>
        </div>
      </div>
    </div>
  );
}
