"use client";

// 홈 대시보드 — 내 커리어 스냅샷(매거진 데이터 스타일). 주차에서 만든 점수·경험을 홈에서 한눈에.
// 생성된 항목만 노출하고, 아무것도 없으면 스스로 숨는다.
import { useEffect, useState } from "react";
import { fetchProgress } from "../../lib/launch/progress-client";
import { SectionTitle } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

type Snap = {
  career: number | null;
  before: number | null;
  expCount: number;
  resume: number | null;
  cover: number | null;
  interview: number | null;
  topRole: string | null;
};

function Stat({ label, value, suffix }: { label: string; value: number | null; suffix?: string }) {
  return (
    <div>
      <p className="text-[12px] font-semibold text-[color:var(--v2-faint)]">{label}</p>
      <p className="mt-1 text-[24px] font-bold leading-none tracking-[-0.02em] text-[color:var(--v2-ink)]">
        {value == null ? <span className="text-[color:var(--v2-line)]">—</span> : value}
        {value != null && suffix ? <span className="text-[13px] font-bold text-[color:var(--v2-faint)]"> {suffix}</span> : null}
      </p>
    </div>
  );
}

export function CareerSnapshot() {
  const t = useLaunchT();
  const [snap, setSnap] = useState<Snap | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchProgress()
      .then((p) => {
        if (!alive) return;
        const career = p.careerReport?.data?.total ?? null;
        const expCount = Array.isArray(p.experienceBank) ? p.experienceBank.length : 0;
        const resume = p.scores?.resume?.data?.total ?? null;
        const cover = p.scores?.cover?.data?.total ?? null;
        const interview = p.scores?.interview?.data?.total ?? null;
        const topRole = p.jobRecommendation?.data?.jobs?.[0]?.role ?? null;
        if (career == null && expCount === 0 && resume == null && cover == null && interview == null) return;
        setSnap({ career, before: p.careerScoreBefore ?? null, expCount, resume, cover, interview, topRole });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!snap) return null;

  return (
    <div>
      <SectionTitle sub={t("각 주차에서 만든 점수와 경험을 한눈에 모았어요", "Your scores and experiences from each week, at a glance", "汇总各周生成的分数与经验，一目了然", "Tổng hợp điểm và kinh nghiệm từ mỗi tuần", "各週で作ったスコアと経験を一目で", "Skor dan pengalaman tiap minggu dalam sekilas")}>{t("내 커리어 스냅샷", "My career snapshot", "我的职业快照", "Ảnh chụp nghề của tôi", "私のキャリアスナップショット", "Snapshot karierku")}</SectionTitle>
      <div className="rounded-3xl bg-[color:var(--v2-band)] p-6 md:p-7">
        {snap.career != null ? (
          <div className="flex items-end justify-between gap-4 border-b border-[color:var(--v2-line)] pb-5">
            <div>
              <p className="text-[13px] font-semibold text-[color:var(--v2-accent)]">Career Score</p>
              <p className="mt-1.5 text-[46px] font-bold leading-none tracking-[-0.03em] text-[color:var(--v2-ink)]">
                {snap.career}
                <span className="text-[18px] font-bold text-[color:var(--v2-faint)]"> / 100</span>
              </p>
            </div>
            {snap.before != null && snap.before !== snap.career ? (
              <div className="text-right">
                <p className="text-[12px] font-semibold text-[color:var(--v2-faint)]">{t("시작 대비", "Since start", "较起点", "So với đầu", "開始比", "Sejak awal")}</p>
                <p className="mt-1 text-[18px] font-bold tabular-nums text-[color:var(--v2-faint)]">
                  {snap.before} → <span className="text-[color:var(--v2-good)]">{snap.career}</span>
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={`grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 ${snap.career != null ? "mt-5" : ""}`}>
          <Stat label="Experience Bank" value={snap.expCount} suffix={t("개", "", "个", "", "件", "")} />
          <Stat label="Resume" value={snap.resume} />
          <Stat label="Cover Letter" value={snap.cover} />
          <Stat label="Interview" value={snap.interview} />
        </div>

        {snap.topRole ? (
          <p className="mt-5 border-t border-[color:var(--v2-line)] pt-4 text-[14px] text-[color:var(--v2-ink-3)]">
            {t("추천 직무", "Top role", "推荐职务", "Nghề gợi ý", "おすすめ職種", "Peran teratas")} · <span className="font-bold text-[color:var(--v2-ink)]">{snap.topRole}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
