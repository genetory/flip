// Career Launch 제출물 단위 코치 피드백 클라이언트.
// 운영자는 학생별로 피드백을 작성/조회하고, 학생은 자신에게 온 피드백을 조회한다.
const TOKEN_KEY = "platform_access_token";

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(json = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  try {
    const t = window.localStorage.getItem(TOKEN_KEY);
    if (t) headers.Authorization = `Bearer ${t}`;
  } catch {
    // 토큰 접근 실패 시 익명으로 시도(엔드포인트가 인증 요구 → 실패 처리)
  }
  return headers;
}

async function req(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, init);
  const data = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string }) | null;
  if (!res.ok || data?.ok !== true) throw new Error((data?.message as string) ?? "요청을 처리하지 못했어요.");
  return data;
}

// 학생: 주차(1~3) 코치 피드백. generate=false 면 캐시만 조회(생성·과금 없음, 없으면 needsGenerate).
// generate=true 면 실제 생성(AI 포인트 차감). 결과물 없으면 text=null.
export async function fetchWeekFeedback(week: number, generate = false): Promise<{ text: string | null; needsGenerate: boolean }> {
  const data = await req("/career-launch/week-feedback", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ week, generate })
  });
  if (generate && typeof window !== "undefined") window.dispatchEvent(new Event("aply:ai-usage-changed"));
  return { text: typeof data.feedback === "string" ? data.feedback : null, needsGenerate: data.needsGenerate === true };
}

// 학생: 이력서·자소서 '내용' AI 요약(최종 점검 섹션) — 각각 따로. 무료(포인트 없음).
export async function fetchDocsSummary(opts: { force?: boolean; generate?: boolean; locale?: string } = {}): Promise<{ resume: string | null; cover: string | null; stale: boolean; needsGenerate: boolean }> {
  const generate = opts.generate ?? true;
  const data = await req("/career-launch/docs-summary", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ force: opts.force ?? false, generate, locale: opts.locale }) });
  return {
    resume: typeof data.resumeSummary === "string" ? data.resumeSummary : null,
    cover: typeof data.coverSummary === "string" ? data.coverSummary : null,
    stale: data.stale === true,
    needsGenerate: data.needsGenerate === true
  };
}

// Week 1 Career Report — Career Score(6영역) + 강점/부족역량 + Career Roadmap.
export type CareerReport = {
  total: number;
  areas: { direction: number; experience: number; competency: number; resume: number; cover: number; interview: number };
  why: string;
  strengths: string[];
  gaps: string[];
  roadmap: { targetRole: string; targetCompanies: string[]; recommendedExperience: string[]; toImprove: string[] };
};
// generate=false 면 캐시만 조회(없으면 needsGenerate/needsDiagnosis). generate=true 면 생성.
export async function fetchCareerReport(opts: { force?: boolean; generate?: boolean } = {}): Promise<{
  report: CareerReport | null;
  stale: boolean;
  needsGenerate: boolean;
  needsDiagnosis: boolean;
}> {
  const generate = opts.generate ?? true;
  const data = await req("/career-launch/career-report", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ force: opts.force ?? false, generate }) });
  const r = data.report && typeof data.report === "object" ? (data.report as CareerReport) : null;
  return {
    report: r,
    stale: data.stale === true,
    needsGenerate: data.needsGenerate === true,
    needsDiagnosis: data.needsDiagnosis === true
  };
}

// Week 2 Resume Score — 구체성/성과표현/직무연관성/가독성 + why + 개선 팁.
export type ResumeScore = {
  total: number;
  breakdown: { specificity: number; achievement: number; relevance: number; readability: number };
  why: string;
  tips: string[];
};
export async function fetchResumeScore(opts: { force?: boolean; generate?: boolean } = {}): Promise<{
  score: ResumeScore | null;
  stale: boolean;
  needsGenerate: boolean;
  unavailable: boolean;
}> {
  const generate = opts.generate ?? true;
  const data = await req("/career-launch/resume-score", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ force: opts.force ?? false, generate }) });
  const s = data.score && typeof data.score === "object" ? (data.score as ResumeScore) : null;
  return { score: s, stale: data.stale === true, needsGenerate: data.needsGenerate === true, unavailable: data.needsResume === true };
}

// Week 3 Cover Letter Score — 논리성/구체성/직무연관성/기업이해도/진정성 + why + AI티/개선.
export type CoverScore = {
  total: number;
  breakdown: { logic: number; specificity: number; relevance: number; companyUnderstanding: number; authenticity: number };
  why: string;
  aiFlags: string[];
  tips: string[];
};
export async function fetchCoverScore(opts: { force?: boolean; generate?: boolean } = {}): Promise<{
  score: CoverScore | null;
  stale: boolean;
  needsGenerate: boolean;
  unavailable: boolean;
}> {
  const generate = opts.generate ?? true;
  const data = await req("/career-launch/cover-score", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ force: opts.force ?? false, generate }) });
  const s = data.score && typeof data.score === "object" ? (data.score as CoverScore) : null;
  return { score: s, stale: data.stale === true, needsGenerate: data.needsGenerate === true, unavailable: data.needsCover === true };
}

// 학생: 완주 최종 피드백 — 이력서+자소서+면접 종합. generate=false 면 캐시만(없으면 needsGenerate).
// generate=true 면 생성(AI 포인트 차감). 결과물이 바뀌면 stale=true. force=true면 강제 재생성.
export async function fetchFinalFeedback(opts: { force?: boolean; generate?: boolean } = {}): Promise<{ text: string | null; stale: boolean; needsGenerate: boolean }> {
  const generate = opts.generate ?? true;
  const data = await req("/career-launch/final-feedback", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ force: opts.force ?? false, generate }) });
  if (generate && typeof window !== "undefined") window.dispatchEvent(new Event("aply:ai-usage-changed"));
  return { text: typeof data.feedback === "string" ? data.feedback : null, stale: data.stale === true, needsGenerate: data.needsGenerate === true };
}

// 학생: 내게 온 피드백 조회
