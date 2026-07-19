// Career Launch 기수(Cohort)·등록 클라이언트. 학생 등록 상태 조회/자가등록 + 운영자 기수 관리.
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
    // 익명 시도
  }
  return headers;
}

async function req(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, init);
  const d = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string }) | null;
  if (!res.ok || d?.ok !== true) throw new Error((d?.message as string) ?? "요청을 처리하지 못했어요.");
  return d;
}

export type EnrollmentCohort = { university: string; name: string; status: string };
export type MyEnrollment = { enrolled: boolean; isOperator: boolean; cohorts: EnrollmentCohort[] };

// 학생: 내 등록 상태
export async function fetchMyEnrollment(): Promise<MyEnrollment> {
  const d = await req("/career-launch/my-enrollment", { headers: authHeaders() });
  return {
    enrolled: d.enrolled === true,
    isOperator: d.isOperator === true,
    cohorts: Array.isArray(d.cohorts) ? (d.cohorts as EnrollmentCohort[]) : []
  };
}

// 학생: 초대코드로 자가등록
export async function enrollByCode(code: string): Promise<{ university: string; name: string }> {
  const d = await req("/career-launch/enroll-by-code", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ code }) });
  const c = (d.cohort ?? {}) as { university?: string; name?: string };
  return { university: c.university ?? "", name: c.name ?? "" };
}

// ── 운영자: 기수 관리 ──
export type OpsCohort = {
  id: string;
  university: string;
  name: string;
  inviteCode: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  enrolledCount: number;
  createdAt?: string;
};
export type OpsCohortStudent = { studentUserId: string; name: string | null; email: string; enrolledAt: string };
export type CohortSeminar = { week: number; title: string | null; startsAt: string; location: string | null; online: boolean; url: string | null };
export type OpsCohortDetail = Omit<OpsCohort, "enrolledCount" | "createdAt"> & { students: OpsCohortStudent[]; seminars: CohortSeminar[] };

export async function fetchCohorts(): Promise<OpsCohort[]> {
  const d = await req("/career-launch/ops/cohorts", { headers: authHeaders() });
  return (d.items as OpsCohort[]) ?? [];
}

export async function createCohort(input: { university: string; name: string; startsAt?: string; endsAt?: string }): Promise<OpsCohort> {
  const d = await req("/career-launch/ops/cohorts", { method: "POST", headers: authHeaders(true), body: JSON.stringify(input) });
  return d.item as OpsCohort;
}

export async function updateCohort(id: string, input: Partial<{ university: string; name: string; status: "active" | "ended"; startsAt: string | null; endsAt: string | null }>): Promise<void> {
  await req(`/career-launch/ops/cohorts/${encodeURIComponent(id)}`, { method: "PATCH", headers: authHeaders(true), body: JSON.stringify(input) });
}

export async function deleteCohort(id: string): Promise<void> {
  await req(`/career-launch/ops/cohorts/${encodeURIComponent(id)}`, { method: "DELETE", headers: authHeaders() });
}

export async function fetchCohort(id: string): Promise<OpsCohortDetail> {
  const d = await req(`/career-launch/ops/cohorts/${encodeURIComponent(id)}`, { headers: authHeaders() });
  return d.item as OpsCohortDetail;
}

export async function enrollStudent(cohortId: string, email: string): Promise<OpsCohortStudent> {
  const d = await req(`/career-launch/ops/cohorts/${encodeURIComponent(cohortId)}/enroll`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ email }) });
  const it = d.item as { studentUserId: string; name: string | null; email: string };
  return { ...it, enrolledAt: new Date().toISOString() };
}

export async function unenrollStudent(cohortId: string, studentUserId: string): Promise<void> {
  await req(`/career-launch/ops/cohorts/${encodeURIComponent(cohortId)}/enroll/${encodeURIComponent(studentUserId)}`, { method: "DELETE", headers: authHeaders() });
}

// ── 세미나 일정 ──
export async function saveSeminar(
  cohortId: string,
  week: number,
  input: { title?: string | null; startsAt: string; location?: string | null; online?: boolean; url?: string | null }
): Promise<void> {
  await req(`/career-launch/ops/cohorts/${encodeURIComponent(cohortId)}/seminars/${week}`, { method: "PUT", headers: authHeaders(true), body: JSON.stringify(input) });
}

export async function deleteSeminar(cohortId: string, week: number): Promise<void> {
  await req(`/career-launch/ops/cohorts/${encodeURIComponent(cohortId)}/seminars/${week}`, { method: "DELETE", headers: authHeaders() });
}

// 학생: 내 기수 세미나 일정
export async function fetchMySeminars(): Promise<CohortSeminar[]> {
  const d = await req("/career-launch/seminars", { headers: authHeaders() });
  return (d.seminars as CohortSeminar[]) ?? [];
}
