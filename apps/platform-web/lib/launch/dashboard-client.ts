// UX Phase 2 — 학생 대시보드 view model 클라이언트. 서버가 결정적으로 조합(LLM 미호출).
const TOKEN_KEY = "platform_access_token";
function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}
function authHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  try {
    const t = window.localStorage.getItem(TOKEN_KEY);
    if (t) h.Authorization = `Bearer ${t}`;
  } catch {
    /* 익명 */
  }
  return h;
}

export type EnrollmentStatus = "new" | "active" | "stalled" | "completed";
export type DashCoach = { remembered: string | null; recentlyCompleted: string | null; todayFocus: string; purpose: string; estimatedMinutes: number; expectedResult: string; cta: string };
export type DashNextAction = { key: string; label: string; reason: string; projectedDelta: number; destination: string; estimatedMinutes: number; expectedResult: string; cta: string; actionType: string; blockedReason?: string };
export type DashArtifact = { type: string; label: string; status: string; detail?: string | null; updatedAt?: string | null; destination: string; remaining: number | null };
export type DashGrowth = { available: boolean; scoreGrowthRate?: number; correctionResolved?: number; correctionTotal?: number };
export type DashSeminar = { week: number; title: string | null; startsAt: string; online: boolean } | null;
export type DashboardVM = {
  ok: boolean;
  enrollmentStatus: EnrollmentStatus;
  cohort: { id: string; name: string; university: string } | null;
  currentWeek: number;
  weeksDoneCount: number;
  weekComplete: boolean[];
  lastActivityDaysAgo: number | null;
  coach: DashCoach;
  nextAction: DashNextAction;
  profileSummary: { targetJob: string | null; confirmedCount: number; knownFacts: string[] };
  artifacts: DashArtifact[];
  growthSummary: DashGrowth;
  leagueSummary: { bucket: string | null; nextActionPreview: string | null };
  cohortActivity: { activeThisWeek: number | null };
  nextSeminar: DashSeminar;
};

export async function fetchDashboard(lang?: string): Promise<DashboardVM> {
  // KI-10 — 서버가 코치/다음행동 문자열을 사용자 언어로 생성하도록 locale 전달.
  const q = lang ? `?lang=${encodeURIComponent(lang)}` : "";
  const res = await fetch(`${apiBase()}/career-launch/dashboard${q}`, { headers: authHeaders() });
  const d = (await res.json().catch(() => null)) as (DashboardVM & { message?: string }) | null;
  if (!res.ok || d?.ok !== true) throw new Error(d?.message ?? "대시보드를 불러오지 못했어요.");
  return d;
}
