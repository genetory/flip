"use client";

// My Career Passport — Career Launch 데이터를 조립한 "검증된 Talent" 프로필.
// Readiness(원형 게이지) + Verified 등급 배지 + 영역별 준비도 + 요약 스탯 +
// 성장 스토리(시작→현재) + 기업 피드백 + 잘 맞는 직무(추천 적합도).
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, SealCheck, TrendUp, FileText, PencilSimpleLine } from "@phosphor-icons/react";
import { fetchTalentPassport, fetchProgress, sharePassport, type TalentPassport, type PassportTier, type CareerProgress } from "../../lib/launch/progress-client";
import { useLaunchT } from "../../lib/launch/i18n";
import { useJobName } from "../../lib/launch/data-i18n";

const TIER_META: Record<PassportTier, { label: string; ring: string; chipBg: string; chipInk: string }> = {
  preparing: { label: "준비 중", ring: "#C9CDD2", chipBg: "#F2F4F6", chipInk: "#8B95A1" },
  bronze: { label: "Verified Bronze", ring: "#C08457", chipBg: "#F6ECE3", chipInk: "#A96A3E" },
  silver: { label: "Verified Silver", ring: "#8B95A1", chipBg: "#EEF1F5", chipInk: "#5A6472" },
  gold: { label: "Verified Gold", ring: "#E0A500", chipBg: "#FBF2D6", chipInk: "#A97B00" }
};

function ReadinessRing({ value, color }: { value: number; color: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div className="relative h-[116px] w-[116px] shrink-0">
      <svg viewBox="0 0 116 116" className="h-full w-full -rotate-90">
        <circle cx="58" cy="58" r={r} fill="none" stroke="#EEF1F5" strokeWidth="10" />
        <circle cx="58" cy="58" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[30px] font-black leading-none tracking-[-0.02em] text-[#0B1227]">{value}</span>
        <span className="mt-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#8B95A1]">Readiness</span>
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2.5 text-[12.5px]">
      <span className="w-14 shrink-0 text-[#8B95A1]">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F2F4F6]">
        <div className="h-full rounded-full" style={{ width: `${v}%`, background: "linear-gradient(90deg,#0B46E8,#3A6BFF)" }} />
      </div>
      <span className="w-7 shrink-0 text-right font-bold tabular-nums text-[#0B1227]">{v}</span>
    </div>
  );
}

export function TalentPassportCard() {
  const t = useLaunchT();
  const jobName = useJobName();
  const [p, setP] = useState<TalentPassport | null>(null);
  const [prog, setProg] = useState<CareerProgress | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    void Promise.all([fetchTalentPassport(), fetchProgress().catch(() => ({} as CareerProgress))]).then(([x, pr]) => {
      if (alive) {
        setP(x);
        setProg(pr);
        setLoading(false);
      }
    });
    void sharePassport().then((tk) => { if (alive) setShareToken(tk); }).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (loading || !p) return null;

  const tier = TIER_META[p.tier];

  // 성장 스토리 — 사전→현재 점수(같은 척도 쌍). 진단 우선, 없으면 커리어 점수.
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const growth = (() => {
    const dStart = prog?.diagnosisInitial?.percent;
    const dNow = prog?.diagnosisFinal?.percent ?? prog?.diagnosis?.percent;
    if (typeof dStart === "number" && typeof dNow === "number") return { start: clamp(dStart), now: clamp(dNow) };
    const cStart = prog?.careerScoreBefore;
    const cNow = prog?.careerReport?.data?.total;
    if (typeof cStart === "number" && typeof cNow === "number") return { start: clamp(cStart), now: clamp(cNow) };
    return null;
  })();
  const recommended = (p.target.recommended ?? []).filter((r) => (r.role ?? "").trim()).slice(0, 3);
  // 목표 직무 — 여러 개(1주차에 고른 관심 직무). 없으면 확정 1순위 하나.
  const targetJobs = (() => {
    const sel = (prog?.selectedJobs ?? []).filter((j) => (j ?? "").trim());
    if (sel.length) return sel.slice(0, 6);
    const one = prog?.targetJob?.trim();
    return one ? [one] : [];
  })();

  return (
    <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-white via-[#F6F9FF] to-[#EAF1FF] p-6 shadow-[0_16px_50px_-18px_rgba(11,70,232,0.24)] ring-1 ring-[#0B46E8]/10 md:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-[240px] w-[240px] rounded-full bg-[#0B46E8]/[0.12] blur-[90px]" />

      <div className="relative flex flex-col gap-6">
        {/* 헤더 — 타이틀 + Verified 배지 */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#0B46E8]">My Career Passport</p>
            <h2 className="mt-1 text-[19px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[22px]">
              {t("검증된 나의 커리어", "My verified career", "我的已验证履历", "Hồ sơ đã xác minh", "検証済みのキャリア", "Karier terverifikasi")}
            </h2>
            {p.verifiedAt ? <p className="mt-1 text-[11.5px] font-semibold text-[#8B95A1]">{t("검증일", "Verified on", "验证日期", "Ngày xác minh", "検証日", "Terverifikasi")} {p.verifiedAt.slice(0, 10)}</p> : null}
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-black"
            style={{ background: tier.chipBg, color: tier.chipInk }}
          >
            {p.verified ? <SealCheck size={15} weight="fill" aria-hidden /> : null}
            {tier.label}
          </span>
        </div>

        {/* 상단 — Readiness 링 + 영역 바 */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ReadinessRing value={p.readiness} color={tier.ring} />
          <div className="flex-1 space-y-1.5">
            <Bar label={t("방향", "Direction", "方向", "Định hướng", "方向", "Arah")} value={p.breakdown.direction} />
            <Bar label={t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")} value={p.breakdown.resume} />
            <Bar label={t("자소서", "Cover", "自我介绍", "Thư", "自己PR", "Cover")} value={p.breakdown.cover} />
            <Bar label={t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara")} value={p.breakdown.interview} />
            <Bar label={t("경험", "Experience", "经历", "Kinh nghiệm", "経験", "Pengalaman")} value={p.breakdown.experience} />
          </div>
        </div>

        {/* 목표 직무 — 여러 개 칩 */}
        {targetJobs.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[12px] font-bold text-[#4E5968]">{t("목표 직무", "Target roles", "目标职务", "Vị trí mục tiêu", "目標職務", "Peran target")}</p>
            <div className="flex flex-wrap gap-1.5">
              {targetJobs.map((j, i) => (
                <span key={i} className="rounded-lg bg-[#EAEFFE] px-2.5 py-1 text-[12.5px] font-bold text-[#0B46E8]">{jobName(j)}</span>
              ))}
            </div>
          </div>
        ) : null}

        {/* 요약 스탯 */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { k: "exp", label: t("경험", "Experience", "经历", "Kinh nghiệm", "経験", "Pengalaman"), value: `${p.experienceCount}${t("건", "", "个", "", "件", "")}` },
            { k: "lang", label: t("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa"), value: String((p.languages ?? []).length) },
            { k: "mock", label: t("모의면접", "Mock", "模拟面试", "PV thử", "模擬面接", "Simulasi"), value: `${p.activity.mockInterviews}/3` }
          ].map((s) => (
            <div key={s.k} className="rounded-2xl border border-[#EDF1F7] bg-white/70 px-3.5 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-semibold text-[#8B95A1]">{s.label}</p>
              <p className="mt-1 break-keep text-[14px] font-bold text-[#0B1227]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* 내 문서 — 이력서 · 자기소개서 보기(공개 링크 새 창) */}
        {shareToken && (p.documents.resumeReady || p.documents.coverReady) ? (
          <div className="space-y-2">
            <p className="text-[12px] font-bold text-[#4E5968]">{t("내 문서", "My documents", "我的文档", "Tài liệu của tôi", "私の書類", "Dokumen saya")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {p.documents.resumeReady ? (
                <Link href={`/p/${shareToken}/resume`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 rounded-xl bg-[#0B46E8] px-3.5 py-2.5 text-[12.5px] font-bold text-white transition hover:bg-[#0A3ECB]">
                  <span className="inline-flex items-center gap-1.5"><FileText className="h-4 w-4" weight="duotone" /> {t("이력서 보기", "Resume", "查看简历", "Xem CV", "履歴書", "Resume")}</span><span aria-hidden>→</span>
                </Link>
              ) : null}
              {p.documents.coverReady ? (
                <Link href={`/p/${shareToken}/cover`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 rounded-xl bg-[#EAEFFE] px-3.5 py-2.5 text-[12.5px] font-bold text-[#0B46E8] transition hover:brightness-95">
                  <span className="inline-flex items-center gap-1.5"><PencilSimpleLine className="h-4 w-4" weight="duotone" /> {t("자기소개서 보기", "Cover letter", "查看自我介绍", "Xem thư", "自己紹介書", "Surat")}</span><span aria-hidden>→</span>
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* 성장 스토리 — 시작 → 현재 점수(노력의 결과) */}
        {growth ? (
          <div className="rounded-2xl border border-[#EDF1F7] bg-white/70 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <TrendUp className="h-4 w-4 text-[#0A9B59]" weight="bold" aria-hidden />
              <p className="text-[12px] font-bold text-[#4E5968]">{t("성장 스토리", "Growth story", "成长故事", "Hành trình phát triển", "成長ストーリー", "Cerita perkembangan")}</p>
            </div>
            <div className="mt-3 flex items-end gap-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[12px] font-semibold text-[#8B95A1]">{t("시작", "Start", "起点", "Bắt đầu", "開始", "Awal")}</span>
                <span className="text-[18px] font-black tabular-nums text-[#8B95A1]">{growth.start}</span>
              </div>
              <ArrowRight className="mb-1 h-4 w-4 shrink-0 text-[#C4CAD2]" weight="bold" aria-hidden />
              <div className="flex items-baseline gap-1.5">
                <span className="text-[12px] font-semibold text-[#0B1227]">{t("현재", "Now", "现在", "Hiện tại", "現在", "Sekarang")}</span>
                <span className="text-[24px] font-black tabular-nums text-[#0B1227]">{growth.now}</span>
              </div>
              {growth.now > growth.start ? (
                <span className="mb-1 ml-auto rounded-full bg-[#E7F8EF] px-2.5 py-1 text-[12px] font-black tabular-nums text-[#0A9B59]">+{growth.now - growth.start}</span>
              ) : null}
            </div>
            <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-[#F2F4F6]">
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#9DBCFF] to-[#0B46E8]" style={{ width: `${growth.now}%` }} />
              {growth.start < growth.now ? <span className="absolute inset-y-0 w-0.5 bg-white/80" style={{ left: `${growth.start}%` }} aria-hidden /> : null}
            </div>
          </div>
        ) : null}

        {/* 기업 피드백 — 인터뷰 후 기업이 남긴 코멘트(비공개) */}
        {p.companyFeedback?.length ? (
          <div className="space-y-2">
            <p className="text-[12px] font-bold text-[#4E5968]">{t("기업 피드백", "Employer feedback", "企业反馈", "Phản hồi từ NTD", "企業フィードバック", "Umpan balik perusahaan")}</p>
            <div className="flex flex-col gap-2">
              {p.companyFeedback.slice(0, 3).map((f, i) => (
                <div key={i} className="rounded-2xl border border-[#EDF1F7] bg-white/70 p-3.5">
                  <p className="break-keep text-[13px] leading-relaxed text-[#4E5968]">{f.comment}</p>
                  <p className="mt-1.5 text-[11px] font-semibold text-[#8B95A1]">{f.org ?? t("기업", "A company", "企业", "Công ty", "企業", "Perusahaan")} · {f.at.slice(0, 10)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* 잘 맞는 직무 — 추천 직무 적합도 */}
        {recommended.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[12px] font-bold text-[#4E5968]">{t("잘 맞는 직무", "Best-fit roles", "匹配职务", "Vị trí phù hợp", "向いている職務", "Peran cocok")}</p>
            <div className="flex flex-col gap-2">
              {recommended.map((r, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl border border-[#EDF1F7] bg-white/70 px-4 py-3 backdrop-blur-sm">
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-[#0B1227]">{r.role}</span>
                  <div className="h-2 w-20 shrink-0 overflow-hidden rounded-full bg-[#F2F4F6] sm:w-24">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#0B46E8] to-[#3A6BFF]" style={{ width: `${clamp(r.fit)}%` }} />
                  </div>
                  <span className="w-9 shrink-0 text-right text-[13px] font-black tabular-nums text-[#0B46E8]">{clamp(r.fit)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
