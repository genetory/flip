// 빌더(승인된 경험 문장)를 표준 ResumeContent 의 careers/activities/skills 로
// 매핑한다. 기본정보·요약·자기소개 등은 base 에서 보존. 편집 화면(P3)과 코칭
// 진단이 모두 표준 content 를 읽으므로, 이 한 곳에서만 변환한다.

import type { ResumeActivityEntry, ResumeCareerEntry, ResumeContent } from "./member-profile-client";
import type { BuilderExperience, ResumeBuilderState } from "./resume-maker-types";

const CAREER_TYPES = new Set(["career", "intern", "part_time"]);

// 기간(최소 시작월)이 있어야 이력서 항목으로 의미가 있다 — 언제 했는지가 중요.
export function hasPeriod(exp: BuilderExperience): boolean {
  return Boolean(exp.startDate);
}

export function isExperienceIncluded(builder: ResumeBuilderState, exp: BuilderExperience): boolean {
  // 내용이 조금이라도 있으면(제목/한 일/체크한 업무/승인 문장) 바로 이력서에 노출한다.
  // 기간(startDate)은 선택 — 활동·프로젝트는 정확한 날짜가 없는 경우가 많다.
  const hasContent = Boolean(exp.title?.trim() || experienceDescription(exp));
  if (!hasContent) return false;
  if (!builder.includedExperienceIds) return true; // 미설정 → 내용 있는 경험 전부 포함
  return builder.includedExperienceIds.includes(exp.id);
}

// 이력서에 들어갈 설명 — 승인된 문장이 있으면 그걸, 없으면 체크한 업무, 그것도 없으면
// 사용자가 적은 원문을 그대로 쓴다(입력 즉시 이력서에 반영되도록).
export function experienceDescription(exp: BuilderExperience): string {
  if (exp.approvedBullets && exp.approvedBullets.length) return exp.approvedBullets.map((b) => b.text).join("\n");
  if (exp.confirmedTasks && exp.confirmedTasks.length) return exp.confirmedTasks.join("\n");
  return (exp.rawInput ?? "").trim();
}

export function compileResumeContent(builder: ResumeBuilderState, base: ResumeContent): ResumeContent {
  const careers: ResumeCareerEntry[] = [];
  const activities: ResumeActivityEntry[] = [];
  const skillSet = new Set<string>([...(base.skills ?? [])]);

  // 이력서는 최신순(역연대기) — 시작월 내림차순. 같은 시작월이면 종료월 내림차순.
  // hasPeriod 로 이미 startDate 보장되므로 안전하게 정렬 가능.
  const included = builder.experiences
    .filter((exp) => isExperienceIncluded(builder, exp))
    .sort((a, b) => {
      if (a.startDate !== b.startDate) return (a.startDate ?? "") < (b.startDate ?? "") ? 1 : -1;
      return (a.endDate ?? "") < (b.endDate ?? "") ? 1 : -1;
    });

  for (const exp of included) {
    const description = experienceDescription(exp);
    (exp.approvedSkills ?? []).forEach((s) => skillSet.add(s));
    if (CAREER_TYPES.has(exp.type)) {
      careers.push({
        companyName: exp.org || exp.title,
        position: exp.title,
        description,
        startDate: exp.startDate,
        endDate: exp.endDate
      });
    } else {
      activities.push({
        title: exp.title,
        organization: exp.org,
        description,
        startDate: exp.startDate,
        endDate: exp.endDate
      });
    }
  }

  return {
    ...base,
    careers,
    activities,
    skills: Array.from(skillSet).slice(0, 30)
  };
}
