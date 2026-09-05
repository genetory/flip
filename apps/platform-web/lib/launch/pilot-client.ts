// Career Launch Phase 9 — 파일럿 운영/측정 클라이언트(운영자) + 학생 설문·피드백.
// 원문/민감정보 미전송. 운영자 화면은 학생 식별 정당(관리 목적).

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
async function req(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, init);
  const d = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string }) | null;
  if (!res.ok || d?.ok !== true) throw new Error((d?.message as string) ?? "요청을 처리하지 못했어요.");
  return d;
}

// ── 타입 ──
export type ReadinessItem = { key: string; label: string; required: boolean; ok: boolean; auto: boolean; note?: string };
export type PilotReadiness = { cohort: { id: string; name: string; university: string; isPilot: boolean }; readiness: { items: ReadinessItem[]; requiredMissing: ReadinessItem[]; ready: boolean } };

export type PilotStudent = {
  userId: string;
  name: string | null;
  status: string;
  statusSource: "operator" | "auto";
  statusReasons: string[];
  needsConfirm: boolean;
  weeksCompleted: number;
  lastActivityDaysAgo: number | null;
  targetConfirmed: boolean;
  packageFinalized: boolean;
  initialMockDone: boolean;
  finalMockDone: boolean;
  transferPassed: boolean;
  openInterventionPriority: string | null;
};
export type PilotIntervention = { id: string; studentName: string | null; priority: string; status: string; reasonCodes: string[]; sla: { slaKey: string; label: string; breached: boolean; hoursOverdue: number } };
export type StopCondition = { key: string; label: string; severity: string; detail: string };
export type PilotMonitor = {
  cohort: { id: string; name: string; university: string; isPilot: boolean; pilotStartAt: string | null; pilotEndAt: string | null };
  overview: { enrolled: number; active: number; atRisk: number; interventionRequired: number; completed: number; activeToday: number; stalled3d: number; weekCompletion: { week: number; count: number }[] };
  students: PilotStudent[];
  interventions: PilotIntervention[];
  problems: { slaBreaches: number; qualCritical: number; qualHigh: number };
  stopConditions: { triggered: StopCondition[]; anyCritical: boolean };
};

export type FunnelStep = { key: string; label: string; count: number; conversionFromPrev: number | null; conversionFromStart: number | null; medianHoursFromStart: number | null };
export type Engagement = {
  byWeek: { week: number; enters: number; activeMinutes: number; reEntries: number }[];
  suggestion: { accept: number; modify: number; reject: number; acceptRatePct: number | null };
  signals: { skip: number; unsure: number; askAi: number; nextActionClicks: number; leagueViews: number; rankDetailViews: number; privacyChanges: number };
};
export type PilotFunnel = { funnel: { total: number; steps: FunnelStep[] }; kpiTargets: Record<string, number>; smallSample: boolean; engagement?: Engagement; engagementNote?: string };

export type CostByFeature = { feature: string; calls: number; inputTokens: number; outputTokens: number; retries: number; cacheHits: number; failures: number; estCostUsd: number };
export type CostByPromptVersion = { key: string; calls: number; failures: number; retries: number; estCostUsd: number; failRatePct: number };
export type PilotCost = {
  totals: { estCostUsd: number; calls: number; failures: number; failRatePct: number; perEnrolledUsd: number | null; perCompleterUsd: number | null };
  byFeature: CostByFeature[];
  byPromptVersion?: CostByPromptVersion[];
  byDate: { date: string; estCostUsd: number }[];
  today: { dateKey: string; costUsd: number; baselineDailyUsd: number; spike: boolean };
};

export type QualFeedback = { id: string; userId: string; name: string | null; category: string; severity: string; currentWeek: number | null; currentStep: string | null; sessionId: string | null; resolvedAt: string | null; createdAt: string };

// ── 운영자 API ──
export async function fetchPilotReadiness(cohortId: string): Promise<PilotReadiness> {
  const d = await req(`/career-launch/ops/pilot/${encodeURIComponent(cohortId)}/readiness`, { headers: authHeaders() });
  return { cohort: d.cohort as PilotReadiness["cohort"], readiness: d.readiness as PilotReadiness["readiness"] };
}
export async function fetchPilotMonitor(cohortId: string): Promise<PilotMonitor> {
  const d = await req(`/career-launch/ops/pilot/${encodeURIComponent(cohortId)}/monitor`, { headers: authHeaders() });
  return d as unknown as PilotMonitor;
}
export async function fetchPilotFunnel(cohortId: string): Promise<PilotFunnel> {
  const d = await req(`/career-launch/ops/pilot/${encodeURIComponent(cohortId)}/funnel`, { headers: authHeaders() });
  return d as unknown as PilotFunnel;
}
export async function fetchPilotCost(cohortId: string): Promise<PilotCost> {
  const d = await req(`/career-launch/ops/pilot/${encodeURIComponent(cohortId)}/cost`, { headers: authHeaders() });
  return d as unknown as PilotCost;
}
export async function fetchPilotFeedback(cohortId: string): Promise<{ categories: { key: string; label: string; severity: string }[]; feedback: QualFeedback[] }> {
  const d = await req(`/career-launch/ops/pilot/${encodeURIComponent(cohortId)}/feedback`, { headers: authHeaders() });
  return { categories: d.categories as { key: string; label: string; severity: string }[], feedback: d.feedback as QualFeedback[] };
}
export async function fetchPilotDailyReport(cohortId: string): Promise<Record<string, unknown>> {
  return req(`/career-launch/ops/pilot/${encodeURIComponent(cohortId)}/daily-report`, { headers: authHeaders() });
}
export async function fetchPilotFinalReport(cohortId: string): Promise<Record<string, unknown>> {
  return req(`/career-launch/ops/pilot/${encodeURIComponent(cohortId)}/final-report`, { headers: authHeaders() });
}
export async function setPilotStudentStatus(userId: string, status: string | null): Promise<void> {
  await req(`/career-launch/ops/pilot/students/${encodeURIComponent(userId)}/status`, { method: "PATCH", headers: authHeaders(true), body: JSON.stringify({ status }) });
}
export async function resolvePilotFeedback(id: string): Promise<void> {
  await req(`/career-launch/ops/pilot/feedback/${encodeURIComponent(id)}/resolve`, { method: "PATCH", headers: authHeaders() });
}

// ── 학생 설문/피드백 API ──
export type PendingSurvey = { surveyKey: string; label: string; questions: { key: string; text: string; scale5: boolean }[] };
export async function fetchPendingSurveys(): Promise<PendingSurvey[]> {
  const d = await req(`/career-launch/survey/pending`, { headers: authHeaders() });
  return (d.pending as PendingSurvey[]) ?? [];
}
export async function submitSurvey(surveyKey: string, answers: Record<string, number>, comment?: string): Promise<void> {
  await req(`/career-launch/survey`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ surveyKey, answers, comment }) });
}
export async function submitQualitativeFeedback(category: string, ctx?: { currentWeek?: number; currentStep?: string; sessionId?: string }): Promise<void> {
  await req(`/career-launch/feedback`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ category, ...ctx }) });
}

// ── 학생 행동 이벤트(계기) — 다음 파일럿 분석용. 실패해도 조용히 무시(진행 방해 금지). ──
export type ActivityKind =
  | "week_enter"
  | "next_action_click"
  | "league_view"
  | "rank_detail_view"
  | "privacy_change"
  | "suggestion_accept"
  | "suggestion_modify"
  | "suggestion_reject"
  | "skip"
  | "unsure"
  | "ask_ai"
  | "dashboard_view";
export async function logActivity(kind: ActivityKind, ctx?: { week?: number; step?: string; sessionId?: string }): Promise<void> {
  try {
    await fetch(`${apiBase()}/career-launch/activity`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ kind, ...ctx }) });
  } catch {
    /* 계기 실패는 무시 */
  }
}
