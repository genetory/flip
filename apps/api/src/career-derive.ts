// 리뉴얼 모듈형 에디터(Resume.content 의 renewal* 키)에서 Career Launch 수집 데이터 모양으로 파생.
//
// 왜 필요한가: Career Launch 는 CareerResumeData / CareerCoverLetterData 를 읽어 진행률·완주·
// AI 채점·운영자 콘솔을 계산한다(읽는 곳이 40곳 넘는다). 리뉴얼 에디터는 Resume 행에만 쓰기
// 때문에, 학생이 /talent/career/resume/editor 에서 이력서를 다 만들어도 프로그램 쪽에서는
// "이력서 없음"으로 보였다. 읽는 곳을 모두 고치는 대신 저장 시점에 한 번 파생해 둔다.
//
// 원칙: 손실이 있는 변환이므로 **사람이 프로그램 안에서 모은 데이터는 절대 덮지 않는다**.
// 비어 있거나 과거에 이 함수가 파생해 둔 행만 갱신한다(DERIVED_MARK 로 구분).

/** 파생된 행임을 표시하는 키 — 이 키가 있으면 다시 파생해 덮어써도 안전하다. */
export const DERIVED_MARK = "__derivedFromResumeId";

const asObj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const asArr = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.filter((x) => x && typeof x === "object").map((x) => x as Record<string, unknown>) : [];
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** "2023-03" + "현재" → "2023.03 ~ 현재". 둘 다 없으면 빈 문자열. */
function periodOf(item: Record<string, unknown>): string {
  const fmt = (s: string) => (s === "현재" ? "현재" : s.replace(/^(\d{4})-(\d{2})$/, "$1.$2"));
  const a = fmt(str(item.startDate));
  const b = fmt(str(item.endDate));
  if (a && b) return `${a} ~ ${b}`;
  return a || b;
}

/** 첫 줄은 제목, 나머지 줄은 불릿으로 본다(모듈 text 는 자유 서술이다). */
function splitLines(text: string): { head: string; rest: string[] } {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/^[-•·*]\s*/, "").trim()).filter(Boolean);
  return { head: lines[0] ?? "", rest: lines.slice(1) };
}

/**
 * renewal* 콘텐츠 → Career Launch 이력서 데이터(정규화 전 느슨한 모양).
 * 호출부에서 normalizeResumeData 를 통과시켜 기존 저장 경로와 모양을 일치시킨다.
 * 자격증·수상은 Career Launch 수집 모양에 대응 항목이 없어 담지 않는다(그쪽 진행률에 안 쓰인다).
 */
export function renewalToCareerResume(content: unknown): Record<string, unknown> {
  const c = asObj(content);
  const doc = asObj(c.renewalResume);
  const info = asObj(c.renewalBasicInfo);
  const items = asArr(doc.items);

  const bySection = (s: string) => items.filter((i) => str(i.section) === s);

  const educations = bySection("education").map((i) => {
    const { head, rest } = splitLines(str(i.text));
    // 학교명은 모듈의 소속(company) 칸이 1순위, 없으면 본문 첫 줄.
    return { school: str(i.company) || head, major: str(i.company) ? head : "", period: periodOf(i), note: rest.join(" / ") };
  });

  const expFrom = (section: string, kind: "work" | "other") =>
    bySection(section).map((i) => {
      const { head, rest } = splitLines(str(i.text));
      return { kind, title: head, org: str(i.company), period: periodOf(i), bullets: rest };
    });
  const experiences = [...expFrom("experience", "work"), ...expFrom("project", "other"), ...expFrom("activity", "other")];

  // 스킬 모듈 한 칸에 "React, TypeScript" 처럼 여러 개를 적는 경우가 많아 쉼표·줄바꿈으로 쪼갠다.
  const skills = bySection("skill")
    .flatMap((i) => str(i.text).split(/[,\n·]/))
    .map((s) => s.trim())
    .filter(Boolean);

  const languages = bySection("language").map((i) => {
    const { head, rest } = splitLines(str(i.text));
    return { language: str(i.company) || head, level: str(i.company) ? head : rest.join(" ") };
  });

  return {
    basic: { name: str(info.realName), email: str(info.email), phone: str(info.phone), summary: str(doc.summary) || str(doc.targetRole) },
    educations,
    experiences,
    skills,
    languages
  };
}

/** renewal* 콘텐츠 → Career Launch 자소서 데이터. 같은 문항의 여러 모듈은 줄바꿈으로 합친다. */
export function renewalToCareerCover(content: unknown): Record<string, unknown> {
  const doc = asObj(asObj(content).renewalCover);
  const merged = new Map<string, string[]>();
  for (const i of asArr(doc.items)) {
    const q = str(i.question);
    const text = str(i.text);
    if (!q || !text) continue;
    const cur = merged.get(q) ?? [];
    cur.push(text);
    merged.set(q, cur);
  }
  return { items: [...merged.entries()].map(([question, parts]) => ({ question, answer: parts.join("\n\n") })) };
}

/** 내용이 하나라도 있나 — 빈 파생으로 기존 행을 덮지 않기 위한 확인. */
export function hasDerivedResumeContent(d: Record<string, unknown>): boolean {
  const b = asObj(d.basic);
  return (
    Boolean(str(b.name) || str(b.summary)) ||
    (Array.isArray(d.educations) && d.educations.length > 0) ||
    (Array.isArray(d.experiences) && d.experiences.length > 0) ||
    (Array.isArray(d.skills) && d.skills.length > 0) ||
    (Array.isArray(d.languages) && d.languages.length > 0)
  );
}

/** 프로그램 안에서 사람이 모은 데이터인가(파생 표시가 없고 내용이 있으면 그렇다) → 덮으면 안 된다. */
export function isHumanCollected(saved: unknown): boolean {
  const s = asObj(saved);
  if (Object.keys(s).length === 0) return false;
  if (s[DERIVED_MARK]) return false;
  // basic 만 서버가 채워둔 경우(이름만 있음)는 사람 수집으로 보지 않으면 위험하므로 보수적으로 사람 것으로 본다.
  return true;
}

/**
 * 키 순서에 무관한 비교용 직렬화. Postgres jsonb 는 저장할 때 키 순서를 바꾸므로
 * JSON.stringify 끼리 비교하면 내용이 같아도 항상 다르게 나온다(자동저장마다 재기록됨).
 */
export function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}
