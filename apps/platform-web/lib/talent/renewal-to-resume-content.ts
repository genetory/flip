// 리뉴얼(내 커리어) 이력서 문서(ResumeDoc)를 공유/미리보기가 기대하는 resume-maker
// ResumeContent 로 매핑한다. 계정 Resume.content 는 리뉴얼 사용자의 경우 최상위에
// renewalResume/renewalBasicInfo/renewalCover 로만 저장되어(ResumeContent 필드 없음),
// 공유뷰(/resume/share)·운영콘솔 미리보기(?view=preview)에서 그대로는 빈 화면이 된다.
// 이 매퍼로 섹션별 항목을 ResumeContent 구조로 변환해 정상 렌더되게 한다.
import type {
  ResumeContent,
  ResumeCareerEntry,
  ResumeActivityEntry,
  ResumeEducationEntry,
  ResumeCertificationEntry,
  ResumeLanguageEntry,
  ResumeLinkEntry
} from "../member-profile-client";
import type { ResumeDoc, ResumeItem } from "./resume-doc";
import type { BasicInfo } from "./basic-info";
import type { CoverDoc } from "./cover-doc";

// content 가 리뉴얼 형태인지 — renewalResume 를 가진 경우.
export function isRenewalContent(content: Record<string, unknown> | null | undefined): boolean {
  return !!content && typeof content === "object" && !!(content as Record<string, unknown>).renewalResume;
}

const clean = (s?: string | null): string | undefined => {
  const t = (s ?? "").trim();
  return t.length ? t : undefined;
};

// 리뉴얼 Resume.content → ResumeContent.
export function renewalToResumeContent(content: Record<string, unknown>): ResumeContent {
  const doc = (content.renewalResume as ResumeDoc | undefined) ?? null;
  const info = (content.renewalBasicInfo as BasicInfo | undefined) ?? null;
  const cover = (content.renewalCover as CoverDoc | undefined) ?? null;
  const items: ResumeItem[] = doc?.items ?? [];
  const of = (section: string) => items.filter((it) => it.section === section);

  // 학력 — 회사=학교명, 텍스트=전공·학위.
  const educations: ResumeEducationEntry[] = of("education").map((it) => ({
    schoolName: clean(it.company) ?? clean(it.text),
    major: it.company ? clean(it.text) : undefined,
    startDate: clean(it.startDate),
    endDate: clean(it.endDate)
  }));

  // 경력(experience) — 회사=소속(헤드라인), 텍스트=한 일·성과. 리뉴얼은 직함을 별도로
  // 두지 않으므로 학생 본인 미리보기와 동일하게 소속을 헤드라인(position)으로 노출.
  const careers: ResumeCareerEntry[] = of("experience").map((it) => ({
    position: clean(it.company) ?? clean(it.text),
    description: it.company ? clean(it.text) : undefined,
    startDate: clean(it.startDate),
    endDate: clean(it.endDate)
  }));

  // 프로젝트 + 대외활동 → 활동·프로젝트.
  const activities: ResumeActivityEntry[] = [...of("project"), ...of("activity")].map((it) => ({
    title: clean(it.company) ?? clean(it.text),
    description: it.company ? clean(it.text) : undefined,
    startDate: clean(it.startDate),
    endDate: clean(it.endDate)
  }));

  // 스킬 — 이름(회사) · 숙련도(텍스트) 를 한 줄 문자열로.
  const skills: string[] = of("skill")
    .map((it) => [clean(it.company), clean(it.text)].filter(Boolean).join(" · "))
    .filter((s) => s.length > 0);

  // 어학 — 언어(회사) · 수준(텍스트).
  const languages: ResumeLanguageEntry[] = of("language")
    .map((it) => ({ language: clean(it.company), level: clean(it.text) }))
    .filter((l) => l.language || l.level);

  // 자격증 + 수상 → 자격 · 수상.
  const certifications: ResumeCertificationEntry[] = [...of("certificate"), ...of("award")]
    .map((it) => ({ name: clean(it.company) ?? clean(it.text), issuer: it.company ? clean(it.text) : undefined, date: clean(it.startDate) }))
    .filter((c) => c.name);

  const links: ResumeLinkEntry[] = (doc?.links ?? [])
    .map((l) => ({ label: clean(l.label), url: clean(l.url) }))
    .filter((l) => l.url);

  return {
    basicName: clean(info?.realName),
    basicEmail: clean(info?.email),
    basicPhone: clean(info?.phone),
    basicResidence: clean(info?.address),
    basicPhotoUrl: doc?.showPhoto === true ? clean(info?.photoUrl) : undefined,
    desiredJobRole: clean(doc?.targetRole),
    educations,
    careers,
    activities,
    skills,
    languages,
    certifications,
    links,
    coverLetterItems: (cover?.items ?? []).map((c) => ({ id: c.id, prompt: c.question, answer: c.text }))
  };
}
