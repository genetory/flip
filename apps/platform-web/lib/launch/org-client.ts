// Career Launch Phase 11 — 기관(B2B) 클라이언트. 권한은 서버가 강제한다(여기선 호출만).
const TOKEN_KEY = "platform_access_token";
function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}
function authHeaders(json = false): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  try {
    const t = window.localStorage.getItem(TOKEN_KEY);
    if (t) h.Authorization = `Bearer ${t}`;
  } catch {
    /* 익명 */
  }
  return h;
}
async function req(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, init);
  const d = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string }) | null;
  if (!res.ok || d?.ok !== true) throw new Error((d?.message as string) ?? "요청을 처리하지 못했어요.");
  return d;
}

export type Organization = { id: string; name: string; type: string; status: string; primaryContact?: string | null; contactEmail?: string | null };
export type OrgDashboard = {
  organization: { id: string; name: string; type: string; status: string };
  summary: { cohortsActive: number; cohortsTotal: number; contractedSeats: number | null; allocatedSeats: number; activatedSeats: number; totalParticipants: number; completed: number; completionRatePct: number; packagesFinalized: number; growthReports: number };
  cohorts: { id: string; name: string; enrolled: number; active: number; completed: number; startsAt: string | null; endsAt: string | null; status: string }[];
  myRoles: string[];
};
export type OrgMember = { id: string; userId: string; name: string | null; email: string | null; role: string; status: string };
export type OrgLicense = { license: (Record<string, unknown> & { derivedStatus?: string }) | null; usage: { allocated: number; activated: number; completed: number; contracted: number | null; remaining: number | null; overCommitted: boolean }; orgStatus: string | null };
export type OrgReportRow = { id: string; cohortId: string | null; reportType: string; metricVersion: string; generatedAt: string };
export type OrgAuditLog = { id: string; actorId: string | null; actorRole: string | null; action: string; targetType: string | null; targetId: string | null; createdAt: string };

export async function fetchOrgs(): Promise<{ organizations: Organization[]; scope: string }> {
  const d = await req(`/career-launch/orgs`, { headers: authHeaders() });
  return { organizations: (d.organizations as Organization[]) ?? [], scope: String(d.scope ?? "") };
}
export async function createOrg(input: { name: string; type: string; primaryContact?: string; contactEmail?: string }): Promise<Organization> {
  const d = await req(`/career-launch/orgs`, { method: "POST", headers: authHeaders(true), body: JSON.stringify(input) });
  return d.organization as Organization;
}
export async function fetchOrgDashboard(orgId: string): Promise<OrgDashboard> {
  const d = await req(`/career-launch/orgs/${encodeURIComponent(orgId)}/dashboard`, { headers: authHeaders() });
  return d as unknown as OrgDashboard;
}
export async function fetchOrgMembers(orgId: string): Promise<OrgMember[]> {
  const d = await req(`/career-launch/orgs/${encodeURIComponent(orgId)}/members`, { headers: authHeaders() });
  return (d.members as OrgMember[]) ?? [];
}
export async function addOrgMember(orgId: string, email: string, role: string): Promise<void> {
  await req(`/career-launch/orgs/${encodeURIComponent(orgId)}/members`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ email, role }) });
}
export async function fetchOrgLicense(orgId: string): Promise<OrgLicense> {
  const d = await req(`/career-launch/orgs/${encodeURIComponent(orgId)}/license`, { headers: authHeaders() });
  return d as unknown as OrgLicense;
}
export async function fetchOrgReports(orgId: string): Promise<OrgReportRow[]> {
  const d = await req(`/career-launch/orgs/${encodeURIComponent(orgId)}/reports`, { headers: authHeaders() });
  return (d.reports as OrgReportRow[]) ?? [];
}
export async function generateOrgReport(orgId: string, reportType: "organization_summary" | "cohort_performance", cohortId?: string | null): Promise<void> {
  await req(`/career-launch/orgs/${encodeURIComponent(orgId)}/reports`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ reportType, cohortId: cohortId ?? null }) });
}
export async function fetchOrgAudit(orgId: string): Promise<OrgAuditLog[]> {
  const d = await req(`/career-launch/orgs/${encodeURIComponent(orgId)}/audit`, { headers: authHeaders() });
  return (d.logs as OrgAuditLog[]) ?? [];
}
export async function validateCsv(orgId: string, rows: Record<string, unknown>[]): Promise<Record<string, unknown>> {
  const d = await req(`/career-launch/orgs/${encodeURIComponent(orgId)}/students/csv/validate`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ rows }) });
  return d.result as Record<string, unknown>;
}
