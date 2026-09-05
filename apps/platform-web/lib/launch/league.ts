// Phase 7 경쟁·리그·운영자 개입 클라이언트.
import { notifyAiBlocked } from "../ai-blocked";

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
  const d = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string; code?: string }) | null;
  if (!res.ok || d?.ok !== true) {
    notifyAiBlocked(res.status, d?.code, d?.message);
    throw new Error(d?.message ?? "요청을 처리하지 못했어요.");
  }
  return d;
}

// ── 학생 ──
export type ScoreBreakdown = { mission: number; artifact: number; growth: number; practice: number; correction: number; contribution: number };
export type MyScore = { total: number; breakdown: ScoreBreakdown; version: string; rankDelta: number | null };
export type LeagueInfo = { id: string; name: string; memberCount: number; rank: number | null; percentile: number | null; bucket: string | null; rankHidden: boolean };
export type NextAction = { key: string; label: string; projectedDelta: number; category: string };
export type Badge = { id: string; badgeKey: string; earnedAt: string; title?: string; description?: string };
export type CohortGoal = { id: string; goalType: string; targetValue: number; currentValue: number };
export type LeagueData = { score: MyScore | null; league: LeagueInfo | null; nextActions: NextAction[]; badges: Badge[]; cohortGoals: CohortGoal[]; activityFeed: string[]; contributionDisabled: boolean };

export async function fetchLeague(): Promise<LeagueData> {
  const d = await req("/career-launch/league", { method: "GET", headers: authHeaders() });
  return {
    score: (d.score as MyScore) ?? null,
    league: (d.league as LeagueInfo) ?? null,
    nextActions: (d.nextActions as NextAction[]) ?? [],
    badges: (d.badges as Badge[]) ?? [],
    cohortGoals: (d.cohortGoals as CohortGoal[]) ?? [],
    activityFeed: (d.activityFeed as string[]) ?? [],
    contributionDisabled: d.contributionDisabled === true
  };
}
export async function recalculateScore(): Promise<number> {
  const d = await req("/career-launch/league/recalculate", { method: "POST", headers: authHeaders(true), body: "{}" });
  return (d.total as number) ?? 0;
}

// ── 운영자 ──
export type Intervention = { id: string; studentUserId: string; priority: string; status: string; reasonCodes: string[]; assignedAdminId?: string | null; nextReviewAt?: string | null; aiSummary?: { facts?: string[]; ai?: { interpretation?: string; recommendedAction?: string; dataToCheck?: string[]; nextCheck?: string } } | null; student?: { id: string; name?: string | null; email?: string | null } };
export type CohortSummary = { totalEnrolled: number; packagesFinalized: number; initialMocksCompleted: number; correctionResolveRate: number; avgGrowthRate: number; interventionsOpen: number };

export async function fetchCohortSummary(cohortId: string): Promise<CohortSummary> {
  const d = await req(`/career-launch/ops/cohort-summary/${cohortId}`, { method: "GET", headers: authHeaders() });
  return d.summary as CohortSummary;
}
export async function scanInterventions(cohortId: string): Promise<{ created: number; scanned: number }> {
  const d = await req(`/career-launch/ops/interventions/scan/${cohortId}`, { method: "POST", headers: authHeaders(true), body: "{}" });
  return { created: (d.created as number) ?? 0, scanned: (d.scanned as number) ?? 0 };
}
export async function fetchInterventions(opts?: { cohortId?: string; priority?: string }): Promise<Intervention[]> {
  const q = new URLSearchParams();
  if (opts?.cohortId) q.set("cohortId", opts.cohortId);
  if (opts?.priority) q.set("priority", opts.priority);
  const d = await req(`/career-launch/ops/interventions${q.toString() ? `?${q}` : ""}`, { method: "GET", headers: authHeaders() });
  return (d.interventions as Intervention[]) ?? [];
}
export async function updateIntervention(id: string, patch: { status?: string; assignedAdminId?: string; note?: string; nextReviewAt?: string; dismissReason?: string }): Promise<Intervention> {
  const d = await req(`/career-launch/ops/interventions/${id}`, { method: "PATCH", headers: authHeaders(true), body: JSON.stringify(patch) });
  return d.intervention as Intervention;
}
export async function generateInterventionSummary(id: string): Promise<{ interpretation?: string; recommendedAction?: string; dataToCheck?: string[]; nextCheck?: string }> {
  const d = await req(`/career-launch/ops/interventions/${id}/ai-summary`, { method: "POST", headers: authHeaders(true), body: "{}" });
  return d.aiSummary as { interpretation?: string; recommendedAction?: string; dataToCheck?: string[]; nextCheck?: string };
}
