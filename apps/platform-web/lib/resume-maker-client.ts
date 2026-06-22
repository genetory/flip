// resume-maker 빌더 client. 별도 백엔드 도메인을 만들지 않고 기존 Resume CRUD
// (/members/me/resumes)에 allowIncomplete 플래그를 실어 초안을 저장한다.
// 빌더 상태는 Resume.content.builder 네임스페이스에 보관 — 마이그레이션 없음.

import { authedJsonFetch } from "./member-profile-client";
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
    body: JSON.stringify(input)
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
    body: JSON.stringify(input)
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
export type PolishStyle = "natural" | "concise" | "professional" | "impact";
// 자기소개·경험 다듬기 공용 형식 목록.
export const POLISH_STYLES: { value: PolishStyle; label: string }[] = [
  { value: "natural", label: "자연스럽게" },
  { value: "concise", label: "간결하게" },
  { value: "professional", label: "전문적으로" },
  { value: "impact", label: "강점 강조" }
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
    body: JSON.stringify(input)
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
}): Promise<string> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/draft-intro", {
    method: "POST",
    body: JSON.stringify(input)
  })) as unknown as { draft?: string };
  const draft = (payload.draft ?? "").trim();
  if (!draft) throw new Error("초안을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
  return draft;
}

// 한국어 자기소개 → 영문 자기소개 생성 (POST /members/me/ai/generate-english-intro).
export async function generateEnglishIntro(input: { text: string; desiredJobRole?: string; jobCategories?: string[] }): Promise<string> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/generate-english-intro", {
    method: "POST",
    body: JSON.stringify(input)
  })) as unknown as { english?: string };
  const english = (payload.english ?? "").trim();
  if (!english) throw new Error("영문 자기소개를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
  return english;
}

// 여러 문자열 일괄 영문 번역 (POST /members/me/ai/translate-texts). 순서·개수 보존.
export async function translateTexts(texts: string[]): Promise<string[]> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/translate-texts", {
    method: "POST",
    body: JSON.stringify({ texts, target: "en" })
  })) as unknown as { texts?: string[] };
  return Array.isArray(payload.texts) ? payload.texts : texts;
}

// 이력서 content 를 영문 이력서용으로 변환 — 장문/직무 등 번역 가능한 텍스트만
// 모아 한 번에 번역하고 제자리에 채운다(이름·날짜·학교명 등 구조 필드는 유지).
export async function buildEnglishResumeContent(content: ResumeContent): Promise<ResumeContent> {
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
  const translated = await translateTexts(texts.slice(0, 60));
  translated.forEach((v, i) => slots[i]?.(v));
  return out;
}

// 자기소개 → 한 줄 요약 추천 (POST /members/me/ai/summarize-intro).
export async function summarizeSelfIntro(input: { text: string; desiredJobRole?: string }): Promise<string> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/summarize-intro", {
    method: "POST",
    body: JSON.stringify(input)
  })) as unknown as { summary?: string };
  const summary = (payload.summary ?? "").trim();
  if (!summary) throw new Error("요약을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
  return summary;
}

// 경험 설명(한 일) 다듬기 (POST /members/me/ai/polish-experience). style 별로 형식을 달리.
export async function polishExperienceText(input: { text: string; style?: PolishStyle; type?: string }): Promise<string> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/polish-experience", {
    method: "POST",
    body: JSON.stringify(input)
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
    body: JSON.stringify(input)
  })) as unknown as { tasks?: string[]; note?: string };
  const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
  if (tasks.length === 0) throw new Error("추천 항목을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
  return { tasks, note: payload.note ?? "" };
}

// 경험 설명 → 짧은 경험명 추천 (POST /members/me/ai/experience-title).
export async function suggestExperienceTitle(input: { rawInput: string; type?: string }): Promise<string> {
  const payload = (await authedJsonFetch<unknown>("/members/me/ai/experience-title", {
    method: "POST",
    body: JSON.stringify(input)
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
export function builderContinuePath(resumeId: string, resume: Pick<Resume, "content">): string {
  const b = getBuilderState(resume);
  const onward = Boolean(b.onboarding.completedAt) || b.experiences.length > 0;
  return onward ? `/resume-maker/${resumeId}/experiences` : `/resume-maker/${resumeId}/onboarding`;
}
