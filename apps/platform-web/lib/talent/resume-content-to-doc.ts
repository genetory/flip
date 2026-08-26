// resume-maker ResumeContent(Career Launch 미러 / 구형 이력서)를 리뉴얼 ResumeDoc + BasicInfo 로
// 변환한다. 모든 이력서를 talent/partner 와 동일한 ResumeA4 로 통일 렌더하기 위한 읽기용 변환
// (저장 데이터는 건드리지 않는다). renewalToResumeContent 의 역방향.
import type { ResumeContent } from "../member-profile-client";
import type { ResumeDoc, ResumeItem } from "./resume-doc";
import type { CareerSection } from "./career-chat";
import type { BasicInfo } from "./basic-info";

let seq = 0;
function nextId(): string {
  seq += 1;
  return `cv-${seq.toString(36)}`;
}

const s = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

export function resumeContentToRenewalDoc(content: ResumeContent | null | undefined): { doc: ResumeDoc; info: BasicInfo } {
  const c = (content ?? {}) as ResumeContent;
  const items: ResumeItem[] = [];
  const push = (section: CareerSection, company: string, text: string, startDate = "", endDate = "") => {
    if (!company && !text) return;
    items.push({ id: nextId(), section, text, ...(company ? { company } : {}), startDate, endDate });
  };

  for (const e of c.educations ?? []) push("education", s(e.schoolName), s(e.major), s(e.startDate), s(e.endDate));
  for (const cr of c.careers ?? []) {
    const body = [s(cr.position), s(cr.description)].filter(Boolean).join("\n");
    push("experience", s(cr.companyName), body, s(cr.startDate), s(cr.endDate));
  }
  for (const a of c.activities ?? []) {
    const body = [s(a.organization), s(a.description)].filter(Boolean).join("\n");
    push("activity", s(a.title), body, s(a.startDate), s(a.endDate));
  }
  for (const sk of c.skills ?? []) push("skill", s(sk), "");
  for (const l of c.languages ?? []) push("language", s(l.language), s(l.level));
  for (const ct of c.certifications ?? []) push("certificate", s(ct.name), [s(ct.issuer), s(ct.date)].filter(Boolean).join(" · "));

  const links = (c.links ?? []).map((l) => ({ label: s(l.label), url: s(l.url) })).filter((l) => l.url.length > 0);
  const summary = s(c.summary) || s(c.selfIntroduction);

  const doc: ResumeDoc = {
    targetRole: s(c.desiredJobRole),
    items,
    ...(links.length ? { links } : {}),
    ...(summary ? { summary } : {}),
    showPhoto: Boolean(s(c.basicPhotoUrl)),
    createdAt: 0,
    updatedAt: 0
  };
  const info: BasicInfo = {
    realName: s(c.basicName),
    email: s(c.basicEmail),
    phone: s(c.basicPhone),
    address: s(c.basicResidence),
    photoUrl: s(c.basicPhotoUrl)
  };
  return { doc, info };
}
