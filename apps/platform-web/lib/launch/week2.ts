// Week 2 '실제 지원 가능한 서류 완성'(Phase 5) 백엔드 클라이언트.
// 기준 공고 → 분석 → 이력서/자소서 버전(문장별 근거) → 일관성 → 점수/Readiness → 최종 확정 → 예상 질문.
import { notifyAiBlocked } from "../ai-blocked";

// KI-9(부분) — 서버 응답 배열 필드 무가드 캐스트 방지(비배열→[] 안전 폴백, 하위 .map 크래시 차단).
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

export type VerificationStatus = "verified" | "needs_confirmation" | "unsupported" | "conflicted" | "user_edited" | "rejected";
export type SourceLink = { id: string; field?: string; text: string; sourceExperienceId?: string | null; sourceProfileField?: string | null; confidence?: number; needsConfirmation?: boolean; status: VerificationStatus };
export type ApplicationTarget = {
  id: string;
  sourceType: string;
  companyName?: string | null;
  jobTitle?: string | null;
  rawContent?: string | null;
  structuredData?: Record<string, unknown>;
  analysisData?: JdAnalysis | null;
  status: string;
};
export type JdAnalysis = {
  coreResponsibilities?: string[];
  requiredCompetencies?: string[];
  preferredCompetencies?: string[];
  emphasizedKeywords?: string[];
  matched?: { requirement: string; evidence: string; sourceExperienceId?: string | null }[];
  missing?: string[];
  needsCheck?: string[];
  emphasizeInResume?: string[];
  emphasizeInCover?: string[];
  avoidOverclaiming?: string[];
  likelyInterview?: string[];
};
export type DocumentVersion = {
  id: string;
  documentType: "resume" | "cover";
  variant: "master" | "targeted";
  applicationTargetId?: string | null;
  version: number;
  content: Record<string, unknown>;
  sourceLinks: SourceLink[];
  validationData?: { counts?: Record<string, number> } | null;
};
export type ConsistencyFinding = { id: string; severity: "critical" | "warning" | "suggestion" | "passed"; category: string; message: string; refs?: string[]; resolved?: boolean; userAcknowledged?: boolean };
export type ReadinessResult = { score: number; version: string; breakdown: { resume: number; cover: number; jdMatch: number; verification: number }; topImprovements: string[]; criticalBlockers: string[]; ready: boolean };
export type ScoreData = {
  resume?: { total: number; breakdown: Record<string, number>; strong: string[]; improvements: string[] } | null;
  cover?: { total: number; breakdown: Record<string, number>; strong: string[]; improvements: string[] } | null;
  jdMatch?: { total: number; breakdown: Record<string, number>; matched: string[]; missing: string[] } | null;
  readiness: ReadinessResult;
};
export type ApplicationPackage = { id: string; applicationTargetId: string; status: string; readinessScore?: number | null; scoreData?: ScoreData | null; validationData?: { findings?: ConsistencyFinding[]; criticalUnresolved?: number } | null; resumeVersionId?: string | null; coverVersionId?: string | null };
export type InterviewQuestion = { question: string; type: string; source: string; sourceReference?: string; difficulty?: string; evaluationCriteria?: string[]; followUpCandidates?: string[]; riskLevel?: string };
export type Week2Check = { key: string; label: string; done: boolean };
export type Week2Status = {
  targets: ApplicationTarget[];
  versions: DocumentVersion[];
  package: ApplicationPackage | null;
  interviewQuestionSet: { questions: InterviewQuestion[] } | null;
  completion: { complete: boolean; checks: Week2Check[]; doneCount: number };
};

export async function fetchWeek2Status(): Promise<Week2Status> {
  const d = await req("/career-launch/week2", { method: "GET", headers: authHeaders() });
  return {
    targets: asArray<ApplicationTarget>(d.targets),
    versions: asArray<DocumentVersion>(d.versions),
    package: (d.package as ApplicationPackage | null) ?? null,
    interviewQuestionSet: (d.interviewQuestionSet as { questions: InterviewQuestion[] } | null) ?? null,
    completion: (d.completion as Week2Status["completion"]) ?? { complete: false, checks: [], doneCount: 0 }
  };
}
export async function createApplicationTarget(input: { sourceType?: string; positionId?: string; sourceUrl?: string; companyName?: string; jobTitle?: string; rawContent?: string }): Promise<ApplicationTarget> {
  const d = await req("/career-launch/week2/application-target", { method: "POST", headers: authHeaders(true), body: JSON.stringify(input) });
  return d.target as ApplicationTarget;
}
export async function structureTarget(id: string): Promise<ApplicationTarget> {
  const d = await req(`/career-launch/week2/application-target/${id}/structure`, { method: "POST", headers: authHeaders(true), body: "{}" }, true);
  return d.target as ApplicationTarget;
}
export async function analyzeTarget(id: string, force = false): Promise<JdAnalysis> {
  const d = await req(`/career-launch/week2/application-target/${id}/analyze`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ force }) }, true);
  return d.analysis as JdAnalysis;
}
export async function generateResumeVersion(variant: "master" | "targeted", applicationTargetId?: string): Promise<DocumentVersion> {
  const d = await req("/career-launch/week2/resume-version", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ variant, applicationTargetId }) }, true);
  return d.version as DocumentVersion;
}
export async function fetchCoverPrompts(applicationTargetId?: string): Promise<{ prompt: string; intent: string; fromJd: boolean; recommendedExperience: string }[]> {
  const d = await req("/career-launch/week2/cover-prompts", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ applicationTargetId }) }, true);
  return (d.prompts as { prompt: string; intent: string; fromJd: boolean; recommendedExperience: string }[]) ?? [];
}
export async function generateCoverVersion(prompts: string[], applicationTargetId?: string): Promise<DocumentVersion> {
  const d = await req("/career-launch/week2/cover-version", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ prompts, applicationTargetId }) }, true);
  return d.version as DocumentVersion;
}
export async function patchDocumentVersion(id: string, patch: { content?: Record<string, unknown>; sourceLinks?: SourceLink[] }): Promise<DocumentVersion> {
  const d = await req(`/career-launch/week2/document-version/${id}`, { method: "PATCH", headers: authHeaders(true), body: JSON.stringify(patch) });
  return d.version as DocumentVersion;
}
export async function runConsistencyCheck(applicationTargetId: string): Promise<{ findings: ConsistencyFinding[]; criticalUnresolved: number }> {
  const d = await req("/career-launch/week2/consistency", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ applicationTargetId }) }, true);
  return { findings: asArray<ConsistencyFinding>(d.findings), criticalUnresolved: (d.criticalUnresolved as number) ?? 0 };
}
export async function resolveConsistency(applicationTargetId: string, findingId: string, opts: { resolved?: boolean; userAcknowledged?: boolean }): Promise<number> {
  const d = await req("/career-launch/week2/consistency/resolve", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ applicationTargetId, findingId, ...opts }) });
  return (d.criticalUnresolved as number) ?? 0;
}
export async function computeScores(applicationTargetId: string): Promise<ScoreData> {
  const d = await req("/career-launch/week2/scores", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ applicationTargetId }) }, true);
  return d.scores as ScoreData;
}
export async function finalizePackage(applicationTargetId: string, acknowledgeWarnings = false): Promise<ApplicationPackage> {
  const d = await req("/career-launch/week2/finalize", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ applicationTargetId, acknowledgeWarnings }) });
  return d.package as ApplicationPackage;
}
export async function generateInterviewQuestions(applicationTargetId?: string, force = false): Promise<{ questions: InterviewQuestion[] }> {
  const d = await req("/career-launch/week2/interview-questions", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ applicationTargetId, force }) }, true);
  return d.questionSet as { questions: InterviewQuestion[] };
}
