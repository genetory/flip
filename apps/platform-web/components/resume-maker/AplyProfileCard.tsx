"use client";

import type { ReactNode } from "react";
import { Briefcase, CalendarCheck, GlobeHemisphereEast, IdentificationCard, MapPin, Sparkle, Translate } from "@phosphor-icons/react/dist/ssr";
import { paperlogy } from "../../lib/fonts";
import type { ResumeContent, ResumeCoachData, ResumeReadinessLevel } from "../../lib/member-profile-client";
import { RESUME_VISA_OPTIONS } from "../../lib/resume-maker-types";

// APLY Profile — 이력서 데이터로 자동 생성되는 "기업에게 보여줄" 카드형 커리어 프로필.
// 학생은 자기 이력서가 기업 눈에 어떻게 정리되는지 미리 보고, 운영자는 이 카드를
// 후보자 카드로 그대로 활용한다. content + coach(매치점수·레벨) + 추천직무를 재사용한다.

const visaLabel = (v?: string | null): string => (v ? RESUME_VISA_OPTIONS.find((o) => o.value === v)?.label ?? v : "");

// 어학 배열에서 특정 언어의 수준을 뽑는다(언어명 부분 일치).
function levelOf(languages: ResumeContent["languages"], match: RegExp): string {
  const hit = (languages ?? []).find((l) => l.language && match.test(l.language));
  return hit?.level ?? "";
}

// coach 레벨 → 기업 추천 관점의 후보 상태 배지.
const STATUS_BADGE: Record<ResumeReadinessLevel, { label: string; cls: string }> = {
  submittable: { label: "기업 추천 가능", cls: "bg-emerald-100 text-emerald-800" },
  needs_polish: { label: "보완 후 추천 가능", cls: "bg-amber-100 text-amber-800" },
  not_submittable: { label: "작성 보완 필요", cls: "bg-rose-100 text-rose-800" }
};

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-[#0B46E8]">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className="block text-[13.5px] font-semibold text-[#0B1227]">{value}</span>
      </span>
    </div>
  );
}

export function AplyProfileCard({
  content,
  coach,
  recommendedRoles,
  completeness
}: {
  content: ResumeContent;
  coach?: ResumeCoachData | null;
  recommendedRoles?: string[];
  completeness?: number;
}) {
  const name = (content.basicName || "").trim() || "익명 후보";
  const nationality = (content as { nationality?: string | null }).nationality?.trim() || "";
  const visa = visaLabel(content.basicVisa);
  const koreanLevel = levelOf(content.languages, /한국|korean/i);
  const englishLevel = levelOf(content.languages, /영어|english/i);
  const major = (content.educations ?? []).find((e) => e.major)?.major ?? "";
  const desiredJob = (content.desiredJobRole || "").trim();
  const availableFrom = (content.availableFrom || "").trim();
  const desiredLocation = (content.desiredLocation || "").trim();

  const skills = (content.skills ?? []).slice(0, 6);
  const roles = (recommendedRoles ?? []).slice(0, 3);
  const experiences = [
    ...(content.careers ?? []).map((c) => [c.companyName, c.position].filter(Boolean).join(" · ")),
    ...(content.activities ?? []).map((a) => [a.title, a.organization].filter(Boolean).join(" · "))
  ]
    .filter(Boolean)
    .slice(0, 3);

  const matchScore = coach ? Math.round(coach.score.readiness.total) : null;
  const status = coach ? STATUS_BADGE[coach.score.level] : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {/* 헤더 — 이름 + 후보 상태 + 점수 */}
      <div className="flex items-start justify-between gap-3 border-b border-border/60 bg-gradient-to-br from-[#0B46E8]/5 to-transparent px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0B46E8]">
            <Sparkle weight="fill" className="h-3.5 w-3.5" aria-hidden /> APLY Profile
          </div>
          <h3 className={`${paperlogy.className} mt-1 truncate text-xl font-black tracking-[-0.02em] text-[#0B1227]`}>{name}</h3>
          {desiredJob ? <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{desiredJob}</p> : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {status ? <span className={`inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-bold ${status.cls}`}>{status.label}</span> : null}
          {matchScore !== null ? (
            <span className="text-[11px] text-muted-foreground">
              APLY Match <span className="font-bold text-[#0B1227]">{matchScore}</span>
            </span>
          ) : null}
          {typeof completeness === "number" ? (
            <span className="text-[11px] text-muted-foreground">
              완성도 <span className="font-bold text-[#0B1227]">{completeness}%</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* 핵심 정보 그리드 */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 px-5 py-4">
        <Row icon={<GlobeHemisphereEast weight="bold" className="h-4 w-4" />} label="국적" value={nationality} />
        <Row icon={<IdentificationCard weight="bold" className="h-4 w-4" />} label="비자" value={visa} />
        <Row icon={<Translate weight="bold" className="h-4 w-4" />} label="한국어" value={koreanLevel} />
        <Row icon={<Translate weight="bold" className="h-4 w-4" />} label="영어" value={englishLevel} />
        <Row icon={<Briefcase weight="bold" className="h-4 w-4" />} label="전공" value={major} />
        <Row icon={<MapPin weight="bold" className="h-4 w-4" />} label="희망 근무지" value={desiredLocation} />
        <Row icon={<CalendarCheck weight="bold" className="h-4 w-4" />} label="근무 가능 시점" value={availableFrom} />
      </div>

      {/* 주요 경험 */}
      {experiences.length > 0 ? (
        <div className="border-t border-border/60 px-5 py-4">
          <p className="text-[11px] font-bold text-muted-foreground">주요 경험</p>
          <ul className="mt-2 space-y-1">
            {experiences.map((e, i) => (
              <li key={i} className="truncate text-[13px] font-medium text-[#0B1227]">• {e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* 핵심 역량 */}
      {skills.length > 0 ? (
        <div className="border-t border-border/60 px-5 py-4">
          <p className="text-[11px] font-bold text-muted-foreground">핵심 역량</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {skills.map((s, i) => (
              <span key={i} className="rounded-full border border-border bg-background px-2.5 py-1 text-[12px] font-medium text-foreground/80">
                {s}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* 추천 직무 */}
      {roles.length > 0 ? (
        <div className="border-t border-border/60 px-5 py-4">
          <p className="text-[11px] font-bold text-muted-foreground">추천 직무</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {roles.map((r, i) => (
              <span key={i} className="rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-semibold text-[#0B46E8]">
                {r}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
