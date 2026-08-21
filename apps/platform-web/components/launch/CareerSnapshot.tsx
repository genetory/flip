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
      <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{label}</p>
      <p className="mt-1 text-[24px] font-black leading-none tracking-[-0.02em] text-[#0B1227]">
        {value == null ? <span className="text-[#D1D6DB]">—</span> : value}
        {value != null && suffix ? <span className="text-[13px] font-bold text-[#B0B8C1]"> {suffix}</span> : null}
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
      <div className="rounded-3xl border border-[#EEF1F5] bg-white p-6 md:p-7">
        {snap.career != null ? (
          <div className="flex items-end justify-between gap-4 border-b border-[#F2F4F6] pb-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">Career Score</p>
              <p className="mt-1.5 text-[46px] font-black leading-none tracking-[-0.03em] text-[#0B1227]">
                {snap.career}
                <span className="text-[18px] font-bold text-[#B0B8C1]"> / 100</span>
              </p>
            </div>
            {snap.before != null && snap.before !== snap.career ? (
              <div className="text-right">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("시작 대비", "Since start", "较起点", "So với đầu", "開始比", "Sejak awal")}</p>
                <p className="mt-1 text-[18px] font-black tabular-nums text-[#B0B8C1]">
                  {snap.before} → <span className="text-[#0A9B59]">{snap.career}</span>
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
          <p className="mt-5 border-t border-[#F2F4F6] pt-4 text-[13px] text-[#4E5968]">
            {t("추천 직무", "Top role", "推荐职务", "Nghề gợi ý", "おすすめ職種", "Peran teratas")} · <span className="font-bold text-[#191F28]">{snap.topRole}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
