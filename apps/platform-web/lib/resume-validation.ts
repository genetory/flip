// 이력서 저장 시 강제하는 최소 필수 필드. 백엔드(apps/api 의
// findMissingResumeFields) 와 1:1 동일한 룰을 두어 우회를 막는다.
//
// 폼이 `*` 로 마킹한 5개:
//   - basicName (이름)
//   - basicEmail (이메일)
//   - basicPhone (휴대폰)
//   - summary (한 줄 요약)
//   - selfIntroduction (자기소개)
// 학력/경력/활동/스킬/어학/자격/포트폴리오 등 섹션은 모두 선택.

import type { ResumeContent } from "./member-profile-client";

export type RequiredResumeField =
  | "basicName"
  | "basicEmail"
  | "basicPhone"
  | "summary"
  | "selfIntroduction";

export function findMissingResumeFields(content: ResumeContent | null | undefined): RequiredResumeField[] {
  const c = content ?? {};
  const trim = (v: string | null | undefined): string => (typeof v === "string" ? v.trim() : "");
  const missing: RequiredResumeField[] = [];
  if (!trim(c.basicName))        missing.push("basicName");
  if (!trim(c.basicEmail))       missing.push("basicEmail");
  if (!trim(c.basicPhone))       missing.push("basicPhone");
  if (!trim(c.summary))          missing.push("summary");
  if (!trim(c.selfIntroduction)) missing.push("selfIntroduction");
  return missing;
}
