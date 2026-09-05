// Week 3~4 '실전 모의면접 & 오답노트'(Phase 6) 백엔드 클라이언트.
import { notifyAiBlocked } from "../ai-blocked";

// KI-9(부분) — 서버 응답 배열 필드의 무가드 캐스트 방지. 배열이 아니면 빈 배열로 안전 폴백해
// 하위 .map 크래시를 막는다(계약 드리프트 방어, 신규 의존성 없음).
const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

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
    /* 익명 */
  }
  return headers;
}
async function req(path: string, init: RequestInit, ai = false): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, init);
  const d = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string; code?: string }) | null;
  if (!res.ok || d?.ok !== true) {
    notifyAiBlocked(res.status, d?.code, d?.message);
    const err = new Error(d?.message ?? "요청을 처리하지 못했어요.") as Error & { code?: string; status?: number };
    err.code = d?.code;
    err.status = res.status;
    throw err;
  }
  if (ai && typeof window !== "undefined") window.dispatchEvent(new Event("aply:ai-usage-changed"));
  return d;
}

export type InterviewQuestion = { id: string; question: string; type: string; order: number; parentQuestionId?: string | null; difficulty?: string };
export type InterviewSession = { id: string; sessionType: string; status: string; cursor: number; reportData?: { total?: number } | null };
export type Weakness = { id: string; weaknessType: string; label: string; title: string; severity: string; occurrenceCount: number; status: string };
export type Correction = { id: string; question: string; questionType?: string | null; status: string; attemptCount: number; transferAttemptCount: number; initialScore?: number | null; latestScore?: number | null; coachingData?: CorrectionCoaching | null };
export type CorrectionCoaching = { keyIssue: string; whyWeak: string; recommendedStructure: string; useExperience?: string; hint?: string };
export type Week3Report = { totalScore: number; strongCompetencies?: string[]; bestAnswer?: string; topWeaknesses?: string[]; interviewerWillCheck?: string[]; week4Order?: string[]; coachSummary?: string; humanReviewRequired?: boolean };
export type GrowthData = { initialScore: number; finalScore: number; scoreDelta: number; scoreGrowthRate: number; correctionPassRate: number; transferPassRate: number; weaknessResolvedCount: number; remainingWeaknessCount: number };
export type GrowthReport = { growthData?: GrowthData; remainingWeaknesses?: string[]; nextActions?: { mostImproved?: string[]; interviewDayTips?: string[]; next7Days?: string[]; next30Days?: string[]; coachMessage?: string }; humanReviewRequired?: boolean };
export type Week3Check = { key: string; label: string; done: boolean };
export type Week3Status = { sessions: InterviewSession[]; weaknesses: Weakness[]; corrections: Correction[]; report: Week3Report | null; trainingPlan: { steps?: { title: string; why: string }[] } | null; completion: { complete: boolean; checks: Week3Check[]; doneCount: number } };
export type Week4Status = { corrections: Correction[]; resolvedCount: number; remainingCount: number; transferPassRate: number; growthReport: GrowthReport | null; completion: { complete: boolean; checks: Week3Check[]; doneCount: number } };

// ── 세션 ──
export async function startSession(sessionType: "initial_mock" | "final_mock" | "practice" = "initial_mock"): Promise<{ session: InterviewSession; question: InterviewQuestion | null; total: number }> {
  const d = await req("/career-launch/interview/session/start", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ sessionType }) }, true);
  return { session: d.session as InterviewSession, question: (d.question as InterviewQuestion) ?? null, total: (d.total as number) ?? 0 };
}
export async function submitAnswer(sessionId: string, questionId: string, answerText: string, duration?: number): Promise<{ next: InterviewQuestion | null; done: boolean }> {
  const d = await req(`/career-launch/interview/session/${sessionId}/answer`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ questionId, answerText, duration }) }, true);
  return { next: (d.next as InterviewQuestion) ?? null, done: d.done === true };
}
export async function completeSession(sessionId: string): Promise<{ total: number; report: Week3Report | null; weaknesses: Weakness[]; trainingPlan: unknown }> {
  const d = await req(`/career-launch/interview/session/${sessionId}/complete`, { method: "POST", headers: authHeaders(true), body: "{}" }, true);
  return { total: (d.total as number) ?? 0, report: (d.report as Week3Report) ?? null, weaknesses: asArray<Weakness>(d.weaknesses), trainingPlan: d.trainingPlan };
}
export async function pauseSession(sessionId: string, status: "paused" | "in_progress"): Promise<void> {
  await req(`/career-launch/interview/session/${sessionId}/pause`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ status }) });
}
export async function fetchWeek3(): Promise<Week3Status> {
  const d = await req("/career-launch/week3", { method: "GET", headers: authHeaders() });
  return { sessions: asArray<InterviewSession>(d.sessions), weaknesses: asArray<Weakness>(d.weaknesses), corrections: asArray<Correction>(d.corrections), report: (d.report as Week3Report) ?? null, trainingPlan: (d.trainingPlan as { steps?: { title: string; why: string }[] }) ?? null, completion: (d.completion as Week3Status["completion"]) ?? { complete: false, checks: [], doneCount: 0 } };
}

// ── Week 4 오답 ──
export async function coachCorrection(id: string): Promise<CorrectionCoaching> {
  const d = await req(`/career-launch/week4/correction/${id}/coach`, { method: "POST", headers: authHeaders(true), body: "{}" }, true);
  return d.coaching as CorrectionCoaching;
}
export type AttemptResult = { improved: boolean | null; evaluation: { good?: string[]; keyProblem?: string; recommendedStructure?: string; total?: number } | null; pass: { passed: boolean; reason: string; needsHumanReview: boolean } | null; nextSuggestion: string };
export async function submitAttempt(id: string, attemptType: "same_question" | "similar_question" | "follow_up", answerText: string, questionText?: string): Promise<AttemptResult> {
  const d = await req(`/career-launch/week4/correction/${id}/attempt`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ attemptType, answerText, questionText }) }, true);
  return { improved: (d.improved as boolean | null) ?? null, evaluation: (d.evaluation as AttemptResult["evaluation"]) ?? null, pass: (d.pass as AttemptResult["pass"]) ?? null, nextSuggestion: (d.nextSuggestion as string) ?? "" };
}
export async function generateSimilar(id: string): Promise<{ question: string; competency: string; context?: string }> {
  const d = await req(`/career-launch/week4/correction/${id}/similar`, { method: "POST", headers: authHeaders(true), body: "{}" }, true);
  return d.similar as { question: string; competency: string; context?: string };
}
export async function setCorrectionStatus(id: string, status: string): Promise<void> {
  await req(`/career-launch/week4/correction/${id}/status`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ status }) });
}
export async function generateGrowth(): Promise<{ report: GrowthReport | null; needsFinalMock?: boolean; needsInitialMock?: boolean }> {
  const d = await req("/career-launch/week4/growth", { method: "POST", headers: authHeaders(true), body: "{}" }, true);
  return { report: (d.report as GrowthReport) ?? null, needsFinalMock: d.needsFinalMock === true, needsInitialMock: d.needsInitialMock === true };
}
export async function fetchWeek4(): Promise<Week4Status> {
  const d = await req("/career-launch/week4", { method: "GET", headers: authHeaders() });
  return { corrections: asArray<Correction>(d.corrections), resolvedCount: (d.resolvedCount as number) ?? 0, remainingCount: (d.remainingCount as number) ?? 0, transferPassRate: (d.transferPassRate as number) ?? 0, growthReport: (d.growthReport as GrowthReport) ?? null, completion: (d.completion as Week4Status["completion"]) ?? { complete: false, checks: [], doneCount: 0 } };
}
