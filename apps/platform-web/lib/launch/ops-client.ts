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
  name: string | null; // 실명 우선(없으면 닉네임)
  realName: string | null; // 실명 — 없으면 운영자가 연락/서류 작성에 어려움
  email: string;
  phone: string | null;
  cohort: OpsStudentCohort | null;
  diagnosisPercent: number | null;
  selectedJobs: number;
  materials: number;
  doneSteps: number;
  hasResume: boolean;
  coverItems: number;
  interviewPracticed: number;
  updatedAt: string | null;
};

// 학생 진행 체크포인트 — 목록/상세에서 진행률과 미완료 항목을 공통으로 계산.
// 면접은 3종(self/job/fit)이라 3칸으로 세분화한다.
export type ProgressStepKey = "diagnosis" | "jobs" | "resume" | "cover" | "interview1" | "interview2" | "interview3";

export function studentProgress(
  s: Pick<OpsStudent, "diagnosisPercent" | "selectedJobs" | "hasResume" | "coverItems" | "interviewPracticed">
): { steps: { key: ProgressStepKey; done: boolean }[]; done: number; total: number; percent: number } {
  const steps: { key: ProgressStepKey; done: boolean }[] = [
    { key: "diagnosis", done: s.diagnosisPercent !== null },
    { key: "jobs", done: s.selectedJobs > 0 },
    { key: "resume", done: s.hasResume },
    { key: "cover", done: s.coverItems > 0 },
    { key: "interview1", done: s.interviewPracticed >= 1 },
    { key: "interview2", done: s.interviewPracticed >= 2 },
    { key: "interview3", done: s.interviewPracticed >= 3 }
  ];
  const done = steps.filter((x) => x.done).length;
  return { steps, done, total: steps.length, percent: Math.round((done / steps.length) * 100) };
}

export type OpsStudentDetail = {
  user: { id: string; name: string | null; realName: string | null; email: string; phoneNumber: string | null };
  cohort: OpsStudentCohort | null;
  state: CareerProgress;
  opsMemo: string; // 운영자 내부 메모(학생 비공개)
  lastNudgedAt: string | null; // 마지막 독려 메일 발송 시각
  nudgeCount: number;
  resume: ResumeData;
  resumeUpdatedAt: string | null;
  cover: CoverData;
  coverUpdatedAt: string | null;
  updatedAt: string | null;
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
    opsMemo: (d.opsMemo as string) ?? "",
    lastNudgedAt: (d.lastNudgedAt as string) ?? null,
    nudgeCount: (d.nudgeCount as number) ?? 0,
    resume: (d.resume as ResumeData) ?? {},
    resumeUpdatedAt: (d.resumeUpdatedAt as string) ?? null,
    cover: (d.cover as CoverData) ?? {},
    coverUpdatedAt: (d.coverUpdatedAt as string) ?? null,
    updatedAt: (d.updatedAt as string) ?? null
  };
}

// 운영자 내부 메모 저장.
export async function saveStudentMemo(id: string, memo: string): Promise<void> {
  await req(`/career-launch/ops/students/${encodeURIComponent(id)}/memo`, { method: "PUT", headers: authHeaders(true), body: JSON.stringify({ memo }) });
}

// ── 일괄 작업 ──
export async function bulkResetStudents(studentIds: string[], target: OpsResetTarget): Promise<number> {
  const d = await req("/career-launch/ops/students/bulk/reset", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ studentIds, target })
  });
  return (d.count as number) ?? studentIds.length;
}

export async function bulkMoveCohort(studentIds: string[], cohortId: string): Promise<number> {
  const d = await req("/career-launch/ops/students/bulk/cohort", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ studentIds, cohortId })
  });
  return (d.count as number) ?? studentIds.length;
}

// 독려(리마인더) 메일 — 남은 단계를 짚어 학생을 다시 불러온다.
// delivery: "smtp"면 실제 발송, "log"면 서버 로그만(SMTP 미설정 환경).
export async function nudgeStudents(
  studentIds: string[],
  message?: string
): Promise<{ sent: number; skipped: number; delivery: "smtp" | "log" }> {
  const d = await req("/career-launch/ops/students/nudge", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ studentIds, message: message?.trim() || undefined })
  });
  return {
    sent: (d.sent as number) ?? 0,
    skipped: (d.skipped as number) ?? 0,
    delivery: (d.delivery as "smtp" | "log") ?? "log"
  };
}

// 운영자 개입 — 학생의 특정 단계 데이터 초기화.
export async function resetStudentStep(id: string, target: OpsResetTarget): Promise<void> {
  await req(`/career-launch/ops/students/${encodeURIComponent(id)}/reset`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ target }) });
}

// ── 기수별 성과 리포트(학교 제출용) ──
export type CohortReportStudent = {
  userId: string;
  name: string | null;
  email: string;
  enrolledAt: string;
  diagnosisBefore: number | null;
  diagnosisAfter: number | null;
  gain: number | null;
  // 진단 근거 — AI 자가진단 정성 평가
  diagLevel: string | null;
  diagStrengths: string[];
  diagImprovements: string[];
  prepCompletion: number;
  successBefore: number | null;
  successAfter: number | null;
  successGain: number | null;
  selectedJobs: number;
  selectedJobTitles: string[];
  hasResume: boolean;
  coverItems: number;
  interviewPracticed: number;
  interviewRounds: string[];
  completed: boolean;
  // 산출물 정량화(학생별 상세 근거)
  resumeEducations: number;
  resumeExperiences: number;
  resumeSkills: number;
  resumeLanguages: number;
  coverChars: number;
  coverItemChars: number[];
  // 주차 타임라인·활동 기간·생성 자료
  weekDone: boolean[];
  weeksCompleted: number;
  doneStepsCount: number;
  materialsCount: number;
  activityDays: number | null;
  // 취업 성과(모든 포지션)
  applications: number;
  reachedInterview: boolean;
  reachedOffer: boolean;
  hired: boolean;
  placementCompany: string | null;
  placementTitle: string | null;
  placementSource: string | null;
  outcomes: { id: string; companyName: string; positionTitle: string | null; status: EmploymentOutcomeStatus; source: string | null }[];
  // 만족도·수료증
  satisfactionRating: number | null;
  npsScore: number | null;
  comment: string | null;
  certificateNo: string | null;
};
export type CohortReportPlacement = { name: string | null; company: string | null; positionTitle: string | null; source: string | null; hired: boolean };
export type CohortReportTestimonial = { name: string | null; rating: number | null; npsScore: number | null; comment: string | null };
export type CohortReport = {
  cohort: { id: string; university: string; name: string; startsAt: string | null; endsAt: string | null; status: string };
  summary: {
    enrolled: number;
    diagnosed: number;
    jobsSelected: number;
    resumes: number;
    coverLetters: number;
    interviewAny: number;
    interviewAll: number;
    completed: number;
    measured: number;
    avgBefore: number;
    avgAfter: number;
    avgGain: number;
    improved: number;
    avgSuccessBefore: number;
    avgSuccessAfter: number;
    avgSuccessGain: number;
    avgPrepCompletion: number;
    // 취업 성과
    tracked: number;
    totalApplications: number;
    interviewedCount: number;
    offerCount: number;
    hiredCount: number;
    hireRate: number;
    // 만족도/추천
    satisfactionCount: number;
    avgSatisfaction: number;
    npsCount: number;
    nps: number | null;
    // 수료증
    certificatesIssued: number;
  };
  students: CohortReportStudent[];
  placements: CohortReportPlacement[];
  testimonials: CohortReportTestimonial[];
};

export async function fetchCohortReport(cohortId: string): Promise<CohortReport> {
  const d = await req(`/career-launch/ops/report/cohort/${encodeURIComponent(cohortId)}`, { headers: authHeaders() });
  return {
    cohort: d.cohort as CohortReport["cohort"],
    summary: d.summary as CohortReport["summary"],
    students: (d.students as CohortReportStudent[]) ?? [],
    placements: (d.placements as CohortReportPlacement[]) ?? [],
    testimonials: (d.testimonials as CohortReportTestimonial[]) ?? []
  };
}

// ── 취업 성과 · 만족도 · 수료증 (운영자 입력) ──
export type EmploymentOutcomeStatus = "APPLIED" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED";
export async function createEmploymentOutcome(input: {
  studentUserId: string;
  cohortId?: string;
  status?: EmploymentOutcomeStatus;
  companyName: string;
  positionTitle?: string;
  source?: string;
  note?: string;
}): Promise<void> {
  await req("/career-launch/ops/outcomes", { method: "POST", headers: authHeaders(true), body: JSON.stringify(input) });
}
export async function updateEmploymentOutcome(id: string, input: { status?: EmploymentOutcomeStatus; companyName?: string; positionTitle?: string | null; note?: string | null }): Promise<void> {
  await req(`/career-launch/ops/outcomes/${encodeURIComponent(id)}`, { method: "PATCH", headers: authHeaders(true), body: JSON.stringify(input) });
}
export async function deleteEmploymentOutcome(id: string): Promise<void> {
  await req(`/career-launch/ops/outcomes/${encodeURIComponent(id)}`, { method: "DELETE", headers: authHeaders() });
}
export async function saveSatisfaction(input: { studentUserId: string; cohortId: string; rating: number; npsScore?: number | null; comment?: string | null }): Promise<void> {
  await req("/career-launch/ops/satisfaction", { method: "PUT", headers: authHeaders(true), body: JSON.stringify(input) });
}
export async function issueCertificate(cohortId: string, studentUserId: string): Promise<void> {
  await req(`/career-launch/ops/cohorts/${encodeURIComponent(cohortId)}/certificates/${encodeURIComponent(studentUserId)}`, { method: "POST", headers: authHeaders() });
}
export async function revokeCertificate(cohortId: string, studentUserId: string): Promise<void> {
  await req(`/career-launch/ops/cohorts/${encodeURIComponent(cohortId)}/certificates/${encodeURIComponent(studentUserId)}`, { method: "DELETE", headers: authHeaders() });
}
