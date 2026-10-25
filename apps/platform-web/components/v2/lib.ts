// v2 화면들이 같이 쓰는 작은 계산.
import type { PublicPositionListItem } from "../../lib/member-profile-client";
import type { ResumeDoc } from "../../lib/talent/resume-doc";
import type { CoverDoc } from "../../lib/talent/cover-doc";

/** 오늘(로컬)부터 그 날까지 남은 날. 지났으면 null. */
export function daysUntil(iso: string): number | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(iso);
  day.setHours(0, 0, 0, 0);
  const d = Math.round((day.getTime() - today.getTime()) / 86400000);
  return d >= 0 ? d : null;
}

export const companyOf = (p: PublicPositionListItem): string => p.partnerOrganization?.name?.trim() || p.sourceCompanyName?.trim() || "";

/** 공고 대표 사진 — 썸네일 → 회사 사무실 사진 → 로고. */
export const jobPhotoOf = (p: PublicPositionListItem): string | null =>
  p.thumbnailImages?.[0] || p.partnerOrganization?.officePhotoImageData || p.partnerOrganization?.companyLogoImageData || null;

/** 근무지 앞 두 마디(시·구)만. */
export const shortPlace = (s?: string | null): string => (s || "").split(" ").slice(0, 2).join(" ");

/** 모의 면접 가능 — 기존 목록과 같은 규칙: 회사가 등록한 내부 공고이거나, JD(주요 업무·자격 요건)가 있으면. */
export function hasMockInterview(p: PublicPositionListItem): boolean {
  const internal = p.sourceProvider === "INTERNAL" && p.sourceKind !== "EXTERNAL";
  return (internal && (!!p.mockInterviewIntent?.trim() || (p.mockInterviewQuestions?.length ?? 0) > 0)) || !!p.mainResponsibilities?.trim() || !!p.requiredQualifications?.trim();
}

/** 지원·모의 면접 서류 준비 — 이력서: 학력·경력/프로젝트·스킬·어학·한 줄 소개 / 자기소개서: 20자 이상 쓴 문항 1개 이상(내 커리어와 같은 기준). */
export function docsReady(resume: ResumeDoc | null, cover: CoverDoc | null): { resume: boolean; cover: boolean } {
  const has = (secs: string[]) => !!resume?.items.some((i) => secs.includes(i.section) && (i.text.trim() || (i.company ?? "").trim()));
  const resumeOk = !!resume && has(["education"]) && has(["experience", "project"]) && has(["skill"]) && has(["language"]) && !!resume.summary?.trim();
  const byQ = new Map<string, number>();
  for (const it of cover?.items ?? []) byQ.set(it.question, (byQ.get(it.question) ?? 0) + it.text.trim().length);
  return { resume: resumeOk, cover: [...byQ.values()].some((n) => n >= 20) };
}
