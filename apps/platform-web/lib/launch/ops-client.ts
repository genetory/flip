// Career Launch 운영자(어드민) 클라이언트 — 프롬프트 편집 + 학생 진행 현황.
import type { CareerProgress } from "./progress-client";
import type { ResumeData } from "./resume-data";
import type { CoverData } from "./cover-data";

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

// ── 프롬프트 ──
export type OpsPrompt = { key: string; label: string; week: number; step: string; default: string; value: string; isOverridden: boolean };

export async function fetchOpsPrompts(): Promise<OpsPrompt[]> {
  const d = await req("/career-launch/ops/prompts", { headers: authHeaders() });
  return (d.items as OpsPrompt[]) ?? [];
}

export async function saveOpsPrompt(key: string, value: string): Promise<void> {
  await req(`/career-launch/ops/prompts/${encodeURIComponent(key)}`, { method: "PUT", headers: authHeaders(true), body: JSON.stringify({ value }) });
}

export async function resetOpsPrompt(key: string): Promise<string> {
  const d = await req(`/career-launch/ops/prompts/${encodeURIComponent(key)}`, { method: "DELETE", headers: authHeaders() });
  return (d.default as string) ?? "";
}

// ── 학생 ──
export type OpsStudentCohort = { id: string; university: string; name: string };
export type OpsStudent = {
  userId: string;
  name: string | null;
  email: string;
  cohort: OpsStudentCohort | null;
  diagnosisPercent: number | null;
  selectedJobs: number;
  materials: number;
  doneSteps: number;
  hasResume: boolean;
  coverItems: number;
  interviewPracticed: number;
  feedbackTotal: number;
  feedbackUnread: number;
  feedbackLastAt: string | null;
  updatedAt: string | null;
};

export type OpsStudentDetail = {
  user: { id: string; name: string | null; realName: string | null; email: string; phoneNumber: string | null };
  cohort: OpsStudentCohort | null;
  state: CareerProgress;
  resume: ResumeData;
  resumeUpdatedAt: string | null;
  cover: CoverData;
  coverUpdatedAt: string | null;
};

export type OpsResetTarget = "diagnosis" | "jobs" | "materials" | "interview" | "final_feedback" | "resume" | "cover";

export async function fetchOpsStudents(): Promise<OpsStudent[]> {
  const d = await req("/career-launch/ops/students", { headers: authHeaders() });
  return (d.items as OpsStudent[]) ?? [];
}

export async function fetchOpsStudentDetail(id: string): Promise<OpsStudentDetail> {
  const d = await req(`/career-launch/ops/students/${encodeURIComponent(id)}`, { headers: authHeaders() });
  return {
    user: d.user as OpsStudentDetail["user"],
    cohort: (d.cohort as OpsStudentCohort | null) ?? null,
    state: (d.state as CareerProgress) ?? {},
    resume: (d.resume as ResumeData) ?? {},
    resumeUpdatedAt: (d.resumeUpdatedAt as string) ?? null,
    cover: (d.cover as CoverData) ?? {},
    coverUpdatedAt: (d.coverUpdatedAt as string) ?? null
  };
}

// 운영자 개입 — 학생의 특정 단계 데이터 초기화.
export async function resetStudentStep(id: string, target: OpsResetTarget): Promise<void> {
  await req(`/career-launch/ops/students/${encodeURIComponent(id)}/reset`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ target }) });
}
