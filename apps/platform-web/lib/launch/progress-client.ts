// Career Launch 진행 상태(진단·선정직무·정리한 직무정보·완료스텝) 클라이언트.
// 계정 기준으로 백엔드에 저장 → 다른 기기·브라우저에서도 그대로 이어간다.
// (기존 localStorage 대체)
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

export type CareerDiagnosis = { percent: number; level: string; strengths: string[]; improvements: string[] };
export type CareerInterview = {
  practiced?: string[]; // 완료한 면접 유형(self|job|fit)
  results?: Record<string, string>; // 유형별 AI 총평(면접 종료 시 저장)
};
// Experience Bank — 4주 내내 재사용되는 중심 데이터. Week1에서 채굴하고 이후 이력서·자소서·면접이 참조.
export type ExperienceEntry = {
  id: string;
  experience: string; // 무엇 (예: "카페 아르바이트")
  period: string; // 기간
  role: string; // 역할
  actions: string[]; // 한 일
  results: string[]; // 성과
  skills: string[]; // 사용 기술
  competencies: string[]; // 역량
};
export type CareerProgress = {
  diagnosis?: CareerDiagnosis | null;
  experienceBank?: ExperienceEntry[];
  // 사전(1주차)·사후(4주차 수료) 진단 점수 — 향상도 산출용.
  diagnosisInitial?: { percent?: number } | null;
  diagnosisFinal?: { percent?: number } | null;
  selectedJobs?: string[];
  materials?: string[];
  doneSteps?: string[];
  interview?: CareerInterview | null;
  finalFeedback?: { v?: number; sig?: string; text?: string } | null;
  // 점수화 리뉴얼 — 홈 스냅샷·완주 캡스톤에서 참조(각 카드가 저장한 래퍼 구조).
  careerReport?: { data?: { total?: number } } | null;
  careerScoreBefore?: number | null;
  jobRecommendation?: { data?: { jobs?: { role: string; fit: number }[] } } | null;
  scores?: {
    resume?: { data?: { total?: number } };
    cover?: { data?: { total?: number } };
    interview?: { data?: { total?: number } };
  } | null;
  storyBank?: { data?: { stories?: unknown[] } } | null;
  answerBank?: { data?: { answers?: { question: string; answer: string }[] } } | null;
  jdMatch?: { data?: { matchPercent?: number } } | null;
};

async function req(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, init);
  const d = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string }) | null;
  if (!res.ok || d?.ok !== true) throw new Error((d?.message as string) ?? "요청을 처리하지 못했어요.");
  return d;
}

// 전체 진행 상태 조회.
export async function fetchProgress(): Promise<CareerProgress> {
  const d = await req("/career-launch/progress", { headers: authHeaders() });
  return (d.state as CareerProgress) ?? {};
}

// 내 기수 익명 진행률 요약 — 함께 달리는 동기부여용(개인 식별정보 없음).
export type CohortStats = { peerCount: number; avgWeeks: number; myWeeks: number; aheadOfPct: number };
export async function fetchCohortStats(): Promise<CohortStats | null> {
  try {
    const d = await req("/career-launch/cohort-stats", { headers: authHeaders() });
    return (d.stats ?? null) as CohortStats | null;
  } catch {
    return null;
  }
}

// 기수 주차 오픈 일정(본인 기수) — 주차 게이팅에 사용.
export type WeekScheduleEntry = { week: number; opensAt: string | null; forceOpen: boolean };
export async function fetchWeekSchedule(): Promise<{ weekSchedule: WeekScheduleEntry[]; serverNow: string }> {
  try {
    const d = await req("/career-launch/week-schedule", { headers: authHeaders() });
    return {
      weekSchedule: (d.weekSchedule as WeekScheduleEntry[]) ?? [],
      serverNow: (d.serverNow as string) ?? new Date().toISOString()
    };
  } catch {
    return { weekSchedule: [], serverNow: new Date().toISOString() };
  }
}

// 일부 키만 갱신(얕은 병합). 갱신된 전체 상태를 반환.
export async function patchProgress(partial: Partial<CareerProgress>): Promise<CareerProgress> {
  const d = await req("/career-launch/progress", {
    method: "PATCH",
    headers: authHeaders(true),
    body: JSON.stringify(partial)
  });
  return (d.state as CareerProgress) ?? {};
}

// ── Talent Passport — 검증된 Talent 프로필(Readiness·Verified 등급·다음 액션) ──
export type PassportTier = "preparing" | "bronze" | "silver" | "gold";
export type TalentPassport = {
  readiness: number;
  tier: PassportTier;
  verified: boolean;
  verifiedAt: string | null;
  breakdown: { direction: number; resume: number; cover: number; interview: number; experience: number; competency: number | null };
  scores: { career: number | null; resume: number | null; cover: number | null; interview: number | null };
  target: { role: string | null; recommended: { role: string; fit: number }[] };
  documents: { resumeReady: boolean; coverReady: boolean };
  experienceCount: number;
  languages: { language?: string; level?: string }[];
  jdMatch: number | null;
  activity: { applications: number; interviewsInvited: number; mockInterviews: number };
  gate: { diagnosisDone: boolean; resumeReady: boolean; experience3plus: boolean };
  nextActions: { key: string; label: string; reason: string; href: string }[];
};

export async function fetchTalentPassport(): Promise<TalentPassport | null> {
  try {
    const d = await req("/career-launch/passport", { headers: authHeaders() });
    return (d.passport as TalentPassport) ?? null;
  } catch {
    return null;
  }
}

// 공유 토큰 발급(멱등) — 기업 제출용 공개 링크.
export async function sharePassport(): Promise<string | null> {
  try {
    const d = await req("/career-launch/passport/share", { method: "POST", headers: authHeaders() });
    return (d.token as string) ?? null;
  } catch {
    return null;
  }
}

export type SharedPassport = {
  name: string | null;
  readiness: number;
  tier: PassportTier;
  verified: boolean;
  verifiedAt: string | null;
  breakdown: TalentPassport["breakdown"];
  scores: TalentPassport["scores"];
  target: TalentPassport["target"];
  experienceCount: number;
  languages: { language?: string; level?: string }[];
};

// 공개(무인증) 공유 뷰 조회.
export async function fetchSharedPassport(token: string): Promise<SharedPassport | null> {
  try {
    const res = await fetch(`${apiBase()}/career-launch/passport/shared/${encodeURIComponent(token)}`);
    const d = (await res.json().catch(() => null)) as { ok?: boolean; passport?: SharedPassport } | null;
    if (!res.ok || d?.ok !== true) return null;
    return d.passport ?? null;
  } catch {
    return null;
  }
}
