// 가져온 이력서·자소서(레거시 구조)를 **지금 쓰는 에디터 폼**으로 옮긴다.
//
// 서버의 /members/me/ai/import-resume · import-cover-letter 는 이미 PDF 에서 텍스트를 뽑아
// 구조화까지 해 준다. 다만 돌려주는 모양이 레거시 resume-maker 폼(educations/careers/...)이라
// 리뉴얼 에디터(renewalResume.items[])에서는 보이지 않는다. 그 사이를 메우는 순수 변환기다.
//
// 원칙:
//  - **없는 것을 만들지 않는다.** 빈 항목은 아예 만들지 않는다(빈 줄이 늘어나면 점검만 시끄러워진다).
//  - 날짜는 에디터 저장 포맷("YYYY-MM" 또는 "현재")으로 정규화한다. 못 읽으면 비워 둔다.
//  - 어학·스킬은 한 항목에 모은다 — 이력서에서 한 줄로 읽는 게 자연스럽고, 기존 문서도 그렇다.
import type { ImportedResume } from "../resume-maker-client";
import type { CareerSection } from "./career-chat";
import { normalizeMonth, type ResumeItem } from "./resume-doc";
import type { CoverItem } from "./cover-doc";

let seq = 0;
const uid = (p: string) => `imp-${p}-${Date.now()}-${seq++}`;
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** 가져온 경험의 type → 에디터 섹션. 모르는 값은 활동으로 둔다(버리지 않는다). */
const EXPERIENCE_SECTION: Record<string, CareerSection> = {
  career: "experience",
  intern: "experience",
  part_time: "experience",
  school_project: "project",
  personal_project: "project",
  side_project: "project",
  competition: "award",
  club: "activity",
  external_activity: "activity",
  volunteer: "activity",
  education: "education",
  etc: "activity"
};

// 학력 상태·학위는 서버가 enum 코드로 준다. 그대로 넣으면 사용자 이력서에 "GRADUATED" 가 찍힌다.
// 모르는 코드는 버린다 — 원문에 없던 말을 지어내는 것보다 비우는 쪽이 낫다.
const EDU_STATUS_LABEL: Record<string, string> = {
  ENROLLED: "재학",
  GRADUATED: "졸업",
  LEAVE_OF_ABSENCE: "휴학",
  DROPPED_OUT: "중퇴",
  OTHER: ""
};
const EDU_TYPE_LABEL: Record<string, string> = {
  HIGH_SCHOOL: "고등학교",
  ASSOCIATE: "전문학사",
  BACHELOR: "학사",
  MASTER: "석사",
  DOCTOR: "박사",
  BOOTCAMP: "부트캠프",
  CERTIFICATE: "수료",
  OTHER: ""
};

const period = (start?: string, end?: string) => ({
  startDate: normalizeMonth(str(start)),
  endDate: normalizeMonth(str(end))
});

export type ImportPreview = {
  items: ResumeItem[];
  /** 문서 단위 값 — 비어 있으면 기존 값을 건드리지 않는다. */
  targetRole: string;
  summary: string;
  links: { label: string; url: string }[];
  /** 섹션별 개수 — 사용자에게 "무엇이 들어오는지" 먼저 보여 주기 위한 것. */
  countsBySection: { section: CareerSection; count: number }[];
};

export function importedResumeToPreview(imported: ImportedResume): ImportPreview {
  const items: ResumeItem[] = [];
  const push = (section: CareerSection, text: string, company?: string, dates?: { startDate: string; endDate: string }) => {
    if (!text.trim() && !(company ?? "").trim()) return;
    items.push({ id: uid(section), section, text: text.trim(), company: (company ?? "").trim() || undefined, ...(dates ?? { startDate: "", endDate: "" }) });
  };

  for (const e of imported.educations ?? []) {
    const school = str(e.schoolName);
    // 전공 · 학위 · 상태 순으로 — 사람이 이력서에 쓰는 순서다.
    const detail = [str(e.major), EDU_TYPE_LABEL[str(e.educationType)] ?? "", EDU_STATUS_LABEL[str(e.status)] ?? ""].filter(Boolean).join(" · ");
    if (!school && !detail) continue;
    push("education", detail, school, period(e.startDate, e.endDate));
  }

  for (const x of imported.experiences ?? []) {
    const section = EXPERIENCE_SECTION[str(x.type)] ?? "activity";
    const org = str(x.org);
    const title = str(x.title);
    const desc = str(x.description);
    // 소속과 제목이 모두 있으면 제목은 본문 앞에 붙인다(에디터는 소속 한 칸만 가진다).
    const text = [title && org ? title : "", desc].filter(Boolean).join("\n");
    if (!text && !org && !title) continue;
    push(section, text || title, org || title, period(x.startDate, x.endDate));
  }

  for (const c of imported.certifications ?? []) {
    const name = str(c.name);
    if (!name) continue;
    const d = normalizeMonth(str(c.date));
    push("certificate", name, str(c.issuer) || undefined, { startDate: d, endDate: d });
  }

  const langs = (imported.languages ?? []).map((l) => [str(l.language), str(l.level)].filter(Boolean).join(" ")).filter(Boolean);
  if (langs.length) push("language", langs.join(" / "));

  const skills = (imported.skills ?? []).map(str).filter(Boolean);
  if (skills.length) push("skill", skills.join(", "));

  const bySection = new Map<CareerSection, number>();
  for (const it of items) bySection.set(it.section, (bySection.get(it.section) ?? 0) + 1);

  return {
    items,
    targetRole: str(imported.desiredJobRole),
    summary: str(imported.summary) || str(imported.selfIntroduction),
    links: (imported.links ?? []).map((l) => ({ label: str(l.label), url: str(l.url) })).filter((l) => l.url),
    countsBySection: [...bySection].map(([section, count]) => ({ section, count }))
  };
}

/** 가져온 자소서 문항·답변 → 에디터 에피소드. 답변이 빈 문항은 만들지 않는다. */
export function importedCoverToItems(imported: { prompt: string; answer: string }[]): CoverItem[] {
  return imported
    .map((x) => ({ question: str(x.prompt), text: str(x.answer) }))
    .filter((x) => x.text)
    .map((x) => ({ id: uid("cov"), question: x.question || "가져온 답변", text: x.text }));
}
