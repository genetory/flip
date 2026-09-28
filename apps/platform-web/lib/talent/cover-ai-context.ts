// 자소서 AI(/members/me/ai/cover-letter) 에 넘길 컨텍스트 변환.
//
// 백엔드 프롬프트는 "제공된 이력서 정보에 없는 사실을 지어내지 말 것"을 1번 규칙으로 두고,
// experiences/education/skills/languages 를 구조화해서 받는다. 리뉴얼 이력서(ResumeDoc)는
// 섹션 구분만 있는 평평한 항목 목록이라, 여기서 엔진이 기대하는 모양으로 접어 넘긴다.
// 평문 한 덩어리로 넘기면 프롬프트가 경험/학력을 구분하지 못해 STAR 서술 품질이 떨어진다.
import { SECTION_META, type CareerSection } from "./career-chat";
import type { ResumeDoc, ResumeItem } from "./resume-doc";

export type CoverAiResumeContext = {
  experiences: { type?: string; title?: string; org?: string; period?: string; summary?: string }[];
  education: { school?: string; major?: string; status?: string }[];
  skills: string[];
  languages: { language?: string; level?: string }[];
};

// 날짜 두 개를 프롬프트가 읽는 기간 문자열로. 둘 다 없으면 undefined.
function periodOf(it: ResumeItem): string | undefined {
  const s = (it.startDate ?? "").trim();
  const e = (it.endDate ?? "").trim();
  if (!s && !e) return undefined;
  return [s, e].filter(Boolean).join(" ~ ");
}

// 항목 텍스트의 첫 줄을 제목으로, 나머지를 설명으로 쓴다(에디터가 제목/본문을 분리 저장하지 않음).
function splitTitle(text: string): { title?: string; summary?: string } {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return {};
  if (lines.length === 1) return { title: lines[0].slice(0, 120) };
  return { title: lines[0].slice(0, 120), summary: lines.slice(1).join(" ").slice(0, 1000) };
}

// 경험으로 접을 섹션 — 학력·스킬·어학은 전용 필드가 있으니 제외.
const EXPERIENCE_SECTIONS: CareerSection[] = ["experience", "project", "activity", "award", "certificate"];

export function buildCoverAiResumeContext(resume: ResumeDoc | null | undefined): CoverAiResumeContext {
  const items = resume?.items ?? [];
  const experiences: CoverAiResumeContext["experiences"] = [];
  const education: CoverAiResumeContext["education"] = [];
  const skills: string[] = [];
  const languages: CoverAiResumeContext["languages"] = [];

  for (const it of items) {
    const text = (it.text ?? "").trim();
    if (!text) continue;
    if (it.section === "education") {
      const { title } = splitTitle(text);
      education.push({ school: it.company?.trim() || title, major: it.company?.trim() ? title : undefined });
      continue;
    }
    if (it.section === "skill") {
      skills.push(text.slice(0, 60));
      continue;
    }
    if (it.section === "language") {
      const { title, summary } = splitTitle(text);
      languages.push({ language: title, level: summary });
      continue;
    }
    if (EXPERIENCE_SECTIONS.includes(it.section)) {
      const { title, summary } = splitTitle(text);
      experiences.push({
        type: SECTION_META[it.section].label,
        title,
        org: it.company?.trim() || undefined,
        period: periodOf(it),
        summary
      });
    }
  }

  // 백엔드 스키마 상한(experiences 20 · education 10 · skills 40 · languages 10)에 맞춰 자른다.
  return {
    experiences: experiences.slice(0, 20),
    education: education.slice(0, 10),
    skills: skills.slice(0, 40),
    languages: languages.slice(0, 10)
  };
}
