// 이력서 완성도(게임화) 계산 — 섹션별 채움 여부 + 가중치로 % 와 레벨을 낸다.
// content(표준 필드) + builder(경험) 만으로 계산하므로 편집/경험 화면 양쪽에서 재사용.

import type { ResumeContent } from "./member-profile-client";
import type { ResumeBuilderState } from "./resume-maker-types";

export type ProgressSection = "basic" | "intro" | "experiences" | "education" | "awards" | "skills" | "languages" | "links";

export type ResumeProgress = {
  percent: number; // 0–100
  level: { key: "seed" | "growing" | "strong" | "done"; label: string; emoji: string };
  done: Record<ProgressSection, boolean>;
  filledCount: number;
  totalCount: number;
};

// 가중치 — 기업 매칭에 핵심인 항목일수록 높게. PRD 의도(기본·비자·언어·학력·직무·
// 경험 각 ~15%, 자기소개 ~10%)를 반영한다. basic 섹션이 이제 연락처뿐 아니라 국적·
// 비자·희망직무·희망근무지·근무가능시점까지 담으므로 경험과 함께 최상위 비중을 둔다.
// (섹션 키는 ResumeSectionNav 호환을 위해 그대로 유지하고 가중치만 재조정)
const WEIGHTS: Record<ProgressSection, number> = {
  basic: 3,
  intro: 2,
  experiences: 3,
  education: 2,
  languages: 2,
  skills: 1,
  awards: 1,
  links: 0.5
};

function filled(v?: string | null): boolean {
  return Boolean(v && String(v).trim());
}

export function computeResumeProgress(content: ResumeContent, builder: ResumeBuilderState): ResumeProgress {
  const done: Record<ProgressSection, boolean> = {
    basic: filled(content.basicName) && (filled(content.basicEmail) || filled(content.basicPhone)),
    intro: filled(content.selfIntroduction),
    experiences: (builder.experiences ?? []).some((e) => (e.approvedBullets?.length ?? 0) > 0 || filled(e.rawInput)),
    education: (content.educations ?? []).some((e) => filled(e.schoolName)),
    awards: (content.certifications ?? []).some((c) => filled(c.name)),
    skills: (content.skills ?? []).some((s) => filled(s)),
    languages: (content.languages ?? []).some((l) => filled(l.language)),
    links: (content.links ?? []).some((l) => filled(l.url))
  };

  const keys = Object.keys(WEIGHTS) as ProgressSection[];
  const total = keys.reduce((sum, k) => sum + WEIGHTS[k], 0);
  const got = keys.reduce((sum, k) => sum + (done[k] ? WEIGHTS[k] : 0), 0);
  const percent = Math.round((got / total) * 100);

  const level: ResumeProgress["level"] =
    percent >= 100
      ? { key: "done", label: "완성", emoji: "🎉" }
      : percent >= 70
        ? { key: "strong", label: "거의 다 됐어요", emoji: "🔥" }
        : percent >= 40
          ? { key: "growing", label: "성장 중", emoji: "🌿" }
          : { key: "seed", label: "시작 단계", emoji: "🌱" };

  return {
    percent,
    level,
    done,
    filledCount: keys.filter((k) => done[k]).length,
    totalCount: keys.length
  };
}
