// Career Launch 제출물 단위 코치 피드백 클라이언트.
// 운영자는 학생별로 피드백을 작성/조회하고, 학생은 자신에게 온 피드백을 조회한다.
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
    // 토큰 접근 실패 시 익명으로 시도(엔드포인트가 인증 요구 → 실패 처리)
  }
  return headers;
}

export type FeedbackDocType = "resume" | "cover_letter" | "general";

export type CareerFeedback = {
  id: string;
  studentUserId: string;
  authorUserId: string;
  week: number | null;
  docType: FeedbackDocType;
  docId: string | null;
  body: string;
  readAt: string | null;
  createdAt: string;
  author?: { id: string; name: string | null; realName: string | null } | null;
};

async function req(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, init);
  const data = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string }) | null;
  if (!res.ok || data?.ok !== true) throw new Error((data?.message as string) ?? "요청을 처리하지 못했어요.");
  return data;
}

// 학생: 주차(1~3) 자동 코치 피드백 — 그 주차 결과물 기반으로 자동 생성/갱신. 결과물 없으면 null.
export async function fetchWeekFeedback(week: number): Promise<string | null> {
  const data = await req("/career-launch/week-feedback", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ week })
  });
  return typeof data.feedback === "string" ? data.feedback : null;
}

// 학생: 완주 최종 피드백 — 이력서+자소서+면접 결과 종합. 완주 전이면 text=null.
// 생성은 1회 후 저장·재사용(토큰 절약). 결과물이 바뀌면 stale=true(다시 받기 버튼). force=true면 강제 재생성.
export async function fetchFinalFeedback(force = false): Promise<{ text: string | null; stale: boolean }> {
  const data = await req("/career-launch/final-feedback", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ force }) });
  return { text: typeof data.feedback === "string" ? data.feedback : null, stale: data.stale === true };
}

// 학생: 내게 온 피드백 조회
export async function fetchMyFeedback(): Promise<{ items: CareerFeedback[]; unreadCount: number }> {
  const data = await req("/career-launch/my-feedback", { headers: authHeaders() });
  return { items: (data.items as CareerFeedback[]) ?? [], unreadCount: Number(data.unreadCount) || 0 };
}

// 학생: 받은 피드백 모두 읽음 처리
export async function markMyFeedbackRead(): Promise<void> {
  await req("/career-launch/my-feedback/read", { method: "POST", headers: authHeaders() });
}

// 운영자: 특정 학생의 피드백 목록
export async function fetchStudentFeedback(studentUserId: string): Promise<CareerFeedback[]> {
  const data = await req(`/career-launch/feedback?studentUserId=${encodeURIComponent(studentUserId)}`, { headers: authHeaders() });
  return (data.items as CareerFeedback[]) ?? [];
}

// 운영자: 피드백 작성
export async function createStudentFeedback(input: {
  studentUserId: string;
  week?: number;
  docType: FeedbackDocType;
  docId?: string;
  body: string;
}): Promise<CareerFeedback> {
  const data = await req("/career-launch/feedback", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(input)
  });
  return data.item as CareerFeedback;
}

// 운영자: 피드백 삭제
export async function deleteStudentFeedback(id: string): Promise<void> {
  await req(`/career-launch/feedback/${encodeURIComponent(id)}`, { method: "DELETE", headers: authHeaders() });
}
