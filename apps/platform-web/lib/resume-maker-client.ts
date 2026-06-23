// resume-maker 빌더 client. 별도 백엔드 도메인을 만들지 않고 기존 Resume CRUD
// (/members/me/resumes)에 allowIncomplete 플래그를 실어 초안을 저장한다.
// 빌더 상태는 Resume.content.builder 네임스페이스에 보관 — 마이그레이션 없음.

import { authedJsonFetch } from "./member-profile-client";
import { getBrowserLocale } from "./auth-messages";
import type { Resume, ResumeContent } from "./member-profile-client";
import { EMPTY_BUILDER_STATE, type ExperienceGeneration, type InterviewQuestion, type ResumeBuilderState } from "./resume-maker-types";

export type ExperienceContextInput = {
  type?: string;
  title: string;
  org?: string;
  period?: string;
  rawInput?: string;
};
export type QaPair = { question: string; answer: string };

type ContentWithBuilder = ResumeContent & { builder?: ResumeBuilderState };

// content 에서 빌더 상태를 안전하게 추출(없으면 빈 상태).
export function getBuilderState(resume: Pick<Resume, "content">): ResumeBuilderState {
  const builder = (resume.content as ContentWithBuilder | undefined)?.builder;
  if (!builder || builder.version !== 1) return { ...EMPTY_BUILDER_STATE };
  return {
    ...EMPTY_BUILDER_STATE,
    ...builder,
    onboarding: { ...EMPTY_BUILDER_STATE.onboarding, ...builder.onboarding },
    experiences: Array.isArray(builder.experiences) ? builder.experiences : []
  };
}

// 새 빌더 초안 생성. 완성 전이라 allowIncomplete: true.
export async function createDraftResume(title: string): Promise<Resume> {
  const payload = await authedJsonFetch<Resume>("/members/me/resumes", {
    method: "POST",
    body: JSON.stringify({ title, content: { builder: EMPTY_BUILDER_STATE }, allowIncomplete: true })
  });
  if (!payload.item) throw new Error("이력서 초안 생성에 실패했습니다.");
  return payload.item;
}

// 이력서 이름(title)만 수정. content 미포함이라 allowIncomplete 로 미완성도 허용.
export async function updateResumeTitle(resumeId: string, title: string): Promise<void> {
  await authedJsonFetch<Resume>(`/members/me/resumes/${encodeURIComponent(resumeId)}`, {
    method: "PATCH",
    body: JSON.stringify({ title: title.trim() || "내 이력서", allowIncomplete: true })
  });
}

export async function getDraftResume(resumeId: string): Promise<Resume> {
  const payload = await authedJsonFetch<Resume>(`/members/me/resumes/${encodeURIComponent(resumeId)}`, {
    method: "GET"
  });
  if (!payload.item) throw new Error("이력서를 찾을 수 없습니다.");
  return payload.item;
}

// 빌더 상태 저장. 기존 content(표준 필드)는 보존하고 builder 만 갱신한다.
// nowIso 는 호출부에서 주입(테스트/SSR 안전).
export async function saveBuilderState(
  resumeId: string,
  currentContent: ResumeContent,
  builder: ResumeBuilderState,
  nowIso: string
): Promise<Resume> {
  const nextContent: ContentWithBuilder = {
    ...(currentContent as ContentWithBuilder),
    builder: { ...builder, updatedAt: nowIso }
  };
  const payload = await authedJsonFetch<Resume>(`/members/me/resumes/${encodeURIComponent(resumeId)}`, {
    method: "PATCH",
    body: JSON.stringify({ content: nextContent, allowIncomplete: true })
  });
  if (!payload.item) throw new Error("자동 저장에 실패했습니다.");
  return payload.item;
}

// AI 경험 인터뷰 질문 생성 (POST /members/me/ai/experience-interview).
export async function generateExperienceInterview(input: {
  experience: ExperienceContextInput;
  jobCategories?: string[];
  priorQa?: QaPair[];
}): Promise<{ coachNote: string; questions: InterviewQuestion[] }> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/experience-interview", {
    method: "POST",
    body: JSON.stringify({ ...input, locale: getBrowserLocale() })
  })) as unknown as { interview?: { coachNote?: string; questions?: InterviewQuestion[] } };
  const questions = payload.interview?.questions ?? [];
  if (questions.length === 0) throw new Error("질문을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
  return { coachNote: payload.interview?.coachNote ?? "", questions };
}

// AI 이력서 문장(구조화 JSON) 생성 (POST /members/me/ai/experience-bullets).
export async function generateExperienceBullets(input: {
  experience: ExperienceContextInput;
  jobCategories?: string[];
  qa: QaPair[];
}): Promise<Omit<ExperienceGeneration, "generatedAt">> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/experience-bullets", {
    method: "POST",
    body: JSON.stringify({ ...input, locale: getBrowserLocale() })
  })) as unknown as { generation?: Omit<ExperienceGeneration, "generatedAt"> };
  if (!payload.generation) throw new Error("문장을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
  return {
    summary: payload.generation.summary ?? "",
    resumeBullets: payload.generation.resumeBullets ?? [],
    skills: payload.generation.skills ?? [],
    followUpQuestions: payload.generation.followUpQuestions ?? [],
    warnings: payload.generation.warnings ?? []
  };
}

// 편집 화면 전용 — 표준 필드까지 포함한 전체 content 저장(allowIncomplete).
export async function saveResumeContent(resumeId: string, content: ResumeContent): Promise<Resume> {
  const payload = await authedJsonFetch<Resume>(`/members/me/resumes/${encodeURIComponent(resumeId)}`, {
    method: "PATCH",
    body: JSON.stringify({ content, allowIncomplete: true })
  });
  if (!payload.item) throw new Error("저장에 실패했습니다.");
  return payload.item;
}

// 자기소개 다듬기/첨삭 (POST /members/me/ai/polish-intro). style 별로 형식을 달리.
export type PolishStyle = "natural" | "concise" | "professional" | "impact" | "expand" | "achievement";
// 자기소개·경험 다듬기 공용 형식 목록.
// 서로 확실히 다른 결과가 나오는 4가지만 노출(톤만 다른 것들은 뺌).
export const POLISH_STYLES: { value: PolishStyle; label: string }[] = [
  { value: "natural", label: "자연스럽게" },
  { value: "expand", label: "자세히 풀어쓰기" },
  { value: "concise", label: "간결하게" },
  { value: "achievement", label: "성과 강조" }
];
export const polishStyleLabel = (s: PolishStyle) => POLISH_STYLES.find((x) => x.value === s)?.label ?? "";
export async function polishSelfIntro(input: {
  text: string;
  style?: PolishStyle;
  desiredJobRole?: string;
  jobCategories?: string[];
}): Promise<string> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/polish-intro", {
    method: "POST",
    body: JSON.stringify({ ...input, locale: getBrowserLocale() })
  })) as unknown as { polished?: string };
  const polished = (payload.polished ?? "").trim();
  if (!polished) throw new Error("자기소개를 다듬지 못했어요. 잠시 후 다시 시도해 주세요.");
  return polished;
}

// 경험·희망 직무 기반 자기소개 초안 생성 (POST /members/me/ai/draft-intro).
export async function draftSelfIntro(input: {
  desiredJobRole?: string;
  jobCategories?: string[];
  experiences?: { type?: string; title?: string; org?: string; period?: string; summary?: string; bullets?: string[] }[];
  education?: { school?: string; major?: string; status?: string }[];
  skills?: string[];
  languages?: { language?: string; level?: string }[];
}): Promise<string> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/draft-intro", {
    method: "POST",
    body: JSON.stringify({ ...input, locale: getBrowserLocale() })
  })) as unknown as { draft?: string };
  const draft = (payload.draft ?? "").trim();
  if (!draft) throw new Error("초안을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
  return draft;
}

export type TranslateTarget = "ko" | "en";

// 여러 문자열을 타깃 언어로 일괄 번역 (POST /members/me/ai/translate-texts).
// 원문 언어 자동 감지 — 외국어로 쓴 이력서를 한국어로도 번역 가능. 순서·개수 보존.
export async function translateTexts(texts: string[], target: TranslateTarget = "en"): Promise<string[]> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/translate-texts", {
    method: "POST",
    body: JSON.stringify({ texts, target })
  })) as unknown as { texts?: string[] };
  return Array.isArray(payload.texts) ? payload.texts : texts;
}

// 이력서 content 를 타깃 언어로 번역 — 장문/직무 등 번역 가능한 텍스트만 모아 한 번에
// 번역하고 제자리에 채운다(이름·날짜·학교명 등 구조 필드는 유지).
export async function buildTranslatedResumeContent(content: ResumeContent, target: TranslateTarget): Promise<ResumeContent> {
  const out: ResumeContent = JSON.parse(JSON.stringify(content));
  const texts: string[] = [];
  const slots: ((v: string) => void)[] = [];
  const add = (val: string | null | undefined, set: (v: string) => void) => {
    if (val && val.trim()) {
      texts.push(val);
      slots.push(set);
    }
  };
  add(out.summary, (v) => { out.summary = v; });
  add(out.selfIntroduction, (v) => { out.selfIntroduction = v; });
  add(out.desiredJobRole, (v) => { out.desiredJobRole = v; });
  add(out.desiredLocation, (v) => { out.desiredLocation = v; });
  (out.careers ?? []).forEach((c) => add(c.description, (v) => { c.description = v; }));
  (out.activities ?? []).forEach((a) => add(a.description, (v) => { a.description = v; }));
  (out.educations ?? []).forEach((e) => add(e.major, (v) => { e.major = v; }));
  (out.certifications ?? []).forEach((c) => add(c.name, (v) => { c.name = v; }));
  (out.skills ?? []).forEach((_, i) => add(out.skills?.[i], (v) => { (out.skills as string[])[i] = v; }));
  if (texts.length === 0) return out;
  // 한 번에 최대 60개만 번역(초과분은 원문 유지).
  const translated = await translateTexts(texts.slice(0, 60), target);
  translated.forEach((v, i) => slots[i]?.(v));
  return out;
}

// 희망직무·전공·경험 기반 스킬 추천 (POST /members/me/ai/suggest-skills).
export async function suggestSkills(input: {
  desiredJobRole?: string;
  jobCategories?: string[];
  major?: string;
  experiences?: string[];
  have?: string[];
}): Promise<string[]> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/suggest-skills", {
    method: "POST",
    body: JSON.stringify({ ...input, locale: getBrowserLocale() })
  })) as unknown as { skills?: string[] };
  return Array.isArray(payload.skills) ? payload.skills : [];
}

// 자기소개 → 한 줄 요약 추천 (POST /members/me/ai/summarize-intro).
export async function summarizeSelfIntro(input: { text: string; desiredJobRole?: string }): Promise<string> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/summarize-intro", {
    method: "POST",
    body: JSON.stringify({ ...input, locale: getBrowserLocale() })
  })) as unknown as { summary?: string };
  const summary = (payload.summary ?? "").trim();
  if (!summary) throw new Error("요약을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
  return summary;
}

// ── 공고 맞춤 최적화 (POST /members/me/ai/tailor-resume) ──
export type TailorSuggestion = { title: string; text: string };
export type TailorResult = {
  score: number;
  matched: string[];
  missing: string[];
  summary: string;
  suggestions: TailorSuggestion[];
};

// 표준 ResumeContent 를 AI 비교용 평문으로 직렬화(요약·자기소개·경력·활동·학력·스킬·어학).
// 이름은 일부러 제외한다 — 요약/제안/면접 답안이 본인 이름을 3인칭으로 쓰는 걸 막기 위함.
export function resumeToPlainText(content: ResumeContent): string {
  const lines: string[] = [];
  const push = (label: string, v?: string | null) => {
    if (v && v.trim()) lines.push(`${label}: ${v.trim()}`);
  };
  push("희망 직무", content.desiredJobRole);
  push("한 줄 요약", content.summary);
  push("자기소개", content.selfIntroduction);
  for (const e of content.educations ?? []) {
    const parts = [e.schoolName, e.major, e.status].filter(Boolean).join(" · ");
    if (parts) lines.push(`학력: ${parts}`);
  }
  for (const c of content.careers ?? []) {
    const head = [c.companyName, c.position].filter(Boolean).join(" · ");
    lines.push(`경력: ${head}${c.description ? `\n  ${c.description.replace(/\n/g, "\n  ")}` : ""}`);
  }
  for (const a of content.activities ?? []) {
    const head = [a.title, a.organization].filter(Boolean).join(" · ");
    lines.push(`활동: ${head}${a.description ? `\n  ${a.description.replace(/\n/g, "\n  ")}` : ""}`);
  }
  if (content.skills?.length) lines.push(`스킬: ${content.skills.join(", ")}`);
  for (const l of content.languages ?? []) {
    if (l.language) lines.push(`어학: ${[l.language, l.level].filter(Boolean).join(" - ")}`);
  }
  return lines.join("\n").slice(0, 8000);
}

// 채용 공고 URL → 페이지 본문 텍스트 추출(공고 맞춤 URL 붙여넣기용).
export async function fetchJobPosting(url: string): Promise<string> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/fetch-job-posting", {
    method: "POST",
    body: JSON.stringify({ url })
  })) as unknown as { text?: string };
  return (payload.text ?? "").trim();
}

export async function tailorResume(input: { resumeText: string; jobText: string; desiredJobRole?: string }): Promise<TailorResult> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/tailor-resume", {
    method: "POST",
    body: JSON.stringify({ ...input, locale: getBrowserLocale() })
  })) as unknown as { result?: Partial<TailorResult> };
  const r = payload.result ?? {};
  return {
    score: typeof r.score === "number" ? r.score : 0,
    matched: Array.isArray(r.matched) ? r.matched : [],
    missing: Array.isArray(r.missing) ? r.missing : [],
    summary: typeof r.summary === "string" ? r.summary : "",
    suggestions: Array.isArray(r.suggestions) ? r.suggestions : []
  };
}

// ── AI 모의 면접 ──
export type InterviewQuestionItem = { question: string; intent: string; category: string };
export type InterviewFeedback = { score: number; strengths: string[]; improvements: string[]; sampleAnswer: string };

export async function generateInterviewQuestions(input: { resumeText: string; jobText?: string; desiredJobRole?: string }): Promise<InterviewQuestionItem[]> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/interview-questions", {
    method: "POST",
    body: JSON.stringify({ ...input, locale: getBrowserLocale() })
  })) as unknown as { questions?: InterviewQuestionItem[] };
  const questions = Array.isArray(payload.questions) ? payload.questions : [];
  if (questions.length === 0) throw new Error("면접 질문을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
  return questions;
}

export async function getInterviewFeedback(input: { question: string; answer: string; resumeText?: string; desiredJobRole?: string }): Promise<InterviewFeedback> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/interview-feedback", {
    method: "POST",
    body: JSON.stringify({ ...input, locale: getBrowserLocale() })
  })) as unknown as { feedback?: Partial<InterviewFeedback> };
  const f = payload.feedback ?? {};
  return {
    score: typeof f.score === "number" ? f.score : 0,
    strengths: Array.isArray(f.strengths) ? f.strengths : [],
    improvements: Array.isArray(f.improvements) ? f.improvements : [],
    sampleAnswer: typeof f.sampleAnswer === "string" ? f.sampleAnswer : ""
  };
}

// 경험 설명(한 일) 다듬기 (POST /members/me/ai/polish-experience). style 별로 형식을 달리.
export async function polishExperienceText(input: { text: string; style?: PolishStyle; type?: string }): Promise<string> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/polish-experience", {
    method: "POST",
    body: JSON.stringify({ ...input, locale: getBrowserLocale() })
  })) as unknown as { polished?: string };
  const polished = (payload.polished ?? "").trim();
  if (!polished) throw new Error("내용을 다듬지 못했어요. 잠시 후 다시 시도해 주세요.");
  return polished;
}

// ① 한 줄 → 추론 → 체크: 역할 정보만으로 '흔히 하는 업무' 후보 목록을 받는다
// (POST /members/me/ai/experience-tasks). 사용자가 체크한 항목만 경험 내용으로 확정.
export async function suggestExperienceTasks(input: {
  type?: string;
  title?: string;
  org?: string;
  rawInput?: string;
}): Promise<{ tasks: string[]; note: string }> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/experience-tasks", {
    method: "POST",
    body: JSON.stringify({ ...input, locale: getBrowserLocale() })
  })) as unknown as { tasks?: string[]; note?: string };
  const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
  if (tasks.length === 0) throw new Error("추천 항목을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
  return { tasks, note: payload.note ?? "" };
}

// 경험 설명 → 짧은 경험명 추천 (POST /members/me/ai/experience-title).
export async function suggestExperienceTitle(input: { rawInput: string; type?: string }): Promise<string> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/experience-title", {
    method: "POST",
    body: JSON.stringify({ ...input, locale: getBrowserLocale() })
  })) as unknown as { title?: string };
  return (payload.title ?? "").trim();
}

// ── 기존 이력서 가져오기(파일/붙여넣기 → AI 구조화) ──
export type ImportedResume = {
  basicName?: string;
  basicEmail?: string;
  basicPhone?: string;
  basicResidence?: string;
  desiredJobRole?: string;
  summary?: string;
  selfIntroduction?: string;
  educations?: ResumeContent["educations"];
  experiences?: { type?: string; title?: string; org?: string; startDate?: string; endDate?: string; description?: string }[];
  certifications?: ResumeContent["certifications"];
  languages?: ResumeContent["languages"];
  skills?: string[];
  links?: ResumeContent["links"];
};

// PDF(base64) 또는 붙여넣은 텍스트를 보내 구조화된 이력서 내용을 받는다.
export async function importResume(input: { text?: string; pdfBase64?: string }): Promise<ImportedResume> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/import-resume", {
    method: "POST",
    body: JSON.stringify(input)
  })) as unknown as { imported?: ImportedResume };
  if (!payload.imported) throw new Error("이력서 내용을 읽지 못했어요. 잠시 후 다시 시도해 주세요.");
  return payload.imported;
}

// 가져온 내용으로 새 빌더 초안을 만든다. 표준 필드 + builder.experiences 를 함께 저장.
// nowIso 는 호출부에서 주입(SSR 안전).
export async function createResumeFromImport(title: string, imported: ImportedResume, nowIso: string): Promise<Resume> {
  const experiences: ResumeBuilderState["experiences"] = (imported.experiences ?? []).map((e, i) => ({
    id: `imp_${i}_${nowIso.replace(/\D/g, "").slice(-10)}`,
    type: (e.type as ResumeBuilderState["experiences"][number]["type"]) || "etc",
    title: e.title || e.org || "경험",
    org: e.org,
    startDate: e.startDate,
    endDate: e.endDate,
    rawInput: e.description,
    status: "collecting",
    createdAt: nowIso,
    updatedAt: nowIso
  }));
  const builder: ResumeBuilderState = {
    ...EMPTY_BUILDER_STATE,
    onboarding: { ...EMPTY_BUILDER_STATE.onboarding, startMethod: "upload", completedAt: nowIso },
    experiences,
    updatedAt: nowIso
  };
  const content: ContentWithBuilder = {
    basicName: imported.basicName,
    basicEmail: imported.basicEmail,
    basicPhone: imported.basicPhone,
    basicResidence: imported.basicResidence,
    desiredJobRole: imported.desiredJobRole,
    summary: imported.summary,
    selfIntroduction: imported.selfIntroduction,
    educations: imported.educations,
    certifications: imported.certifications,
    languages: imported.languages,
    skills: imported.skills,
    links: imported.links,
    builder
  };
  const payload = await authedJsonFetch<Resume>("/members/me/resumes", {
    method: "POST",
    body: JSON.stringify({ title, content, allowIncomplete: true })
  });
  if (!payload.item) throw new Error("이력서 초안 생성에 실패했습니다.");
  return payload.item;
}

// content.builder 가 있으면 resume-maker 로 만든(작성 중인) 드래프트.
export function isResumeMakerDraft(resume: Pick<Resume, "content">): boolean {
  const b = (resume.content as ContentWithBuilder | undefined)?.builder;
  return Boolean(b && b.version === 1);
}

// 작성 진행도에 맞는 이어쓰기 경로 — 온보딩 전이면 온보딩, 이후면 경험 목록.
export function builderContinuePath(resumeId: string, _resume: Pick<Resume, "content">): string {
  // 2컬럼 편집기(폼 + 실시간 미리보기)가 기본 진입점.
  return `/resume-maker/${resumeId}/edit`;
}
