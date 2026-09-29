// Career Launch 질문하기 — 학생이 운영진에게 묻고 답을 받는 1:1 창구.
// 코치 피드백(feedback-client)은 운영자 → 학생 방향이고, 이쪽은 학생이 먼저 묻는다.
// 질문이 들어오면 서버가 Discord 로 알려 답변이 빨라진다.
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
    // 토큰 접근 실패 시 익명으로 시도(엔드포인트가 인증을 요구 → 실패 처리)
  }
  return headers;
}

async function req(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, init);
  const data = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string }) | null;
  if (!res.ok || data?.ok !== true) throw new Error((data?.message as string) ?? "요청을 처리하지 못했어요.");
  return data;
}

/** 서버가 답변 없는 질문은 answer=null 로 준다 — answered 로 대기중 여부를 판단한다. */
export type LaunchQuestion = {
  id: string;
  body: string;
  stepNo: number | null;
  answer: string | null;
  answeredAt: string | null;
  readAt: string | null;
  createdAt: string;
  answered: boolean;
};

export const QUESTION_MAX_CHARS = 2000;

function toQuestion(raw: unknown): LaunchQuestion {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ""),
    body: typeof r.body === "string" ? r.body : "",
    stepNo: typeof r.stepNo === "number" ? r.stepNo : null,
    answer: typeof r.answer === "string" ? r.answer : null,
    answeredAt: typeof r.answeredAt === "string" ? r.answeredAt : null,
    readAt: typeof r.readAt === "string" ? r.readAt : null,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : "",
    answered: r.answered === true
  };
}

// 학생: 내가 남긴 질문과 받은 답변(최신순) + 아직 안 읽은 답변 수.
export async function fetchMyQuestions(): Promise<{ items: LaunchQuestion[]; unread: number }> {
  const d = await req("/career-launch/questions", { method: "GET", headers: authHeaders() });
  return {
    items: Array.isArray(d.items) ? d.items.map(toQuestion) : [],
    unread: typeof d.unread === "number" ? d.unread : 0
  };
}

// 학생: 질문 등록. stepNo 는 어느 주차에 대한 질문인지(선택).
export async function askQuestion(body: string, stepNo?: number | null): Promise<LaunchQuestion> {
  const d = await req("/career-launch/questions", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ body, ...(stepNo ? { stepNo } : {}) })
  });
  return toQuestion(d.item);
}

// 학생: 답변 확인 표시(안 읽은 답변 배지를 내린다). 실패해도 화면은 그대로 둔다.
export async function markQuestionRead(id: string): Promise<void> {
  await req(`/career-launch/questions/${encodeURIComponent(id)}/read`, { method: "POST", headers: authHeaders() });
}

export type OpsQuestion = LaunchQuestion & {
  student: { id: string; name: string | null; email: string } | null;
  answeredByName: string | null;
};

// 운영자: 질문 목록. 기본은 미답변만.
export async function fetchOpsQuestions(status: "pending" | "answered" | "all" = "pending"): Promise<{ items: OpsQuestion[]; pending: number }> {
  const d = await req(`/ops/career-launch/questions?status=${status}`, { method: "GET", headers: authHeaders() });
  const items = Array.isArray(d.items)
    ? d.items.map((raw) => {
        const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
        const s = (r.student && typeof r.student === "object" ? r.student : null) as { id?: string; name?: string | null; email?: string } | null;
        return {
          ...toQuestion(raw),
          student: s?.email ? { id: String(s.id ?? ""), name: s.name ?? null, email: s.email } : null,
          answeredByName: typeof r.answeredByName === "string" ? r.answeredByName : null
        };
      })
    : [];
  return { items, pending: typeof d.pending === "number" ? d.pending : 0 };
}

// 운영자: 답변 등록(다시 보내면 덮어쓰기). 학생에게 인앱·이메일 알림이 간다.
export async function answerQuestion(id: string, answer: string): Promise<OpsQuestion> {
  const d = await req(`/ops/career-launch/questions/${encodeURIComponent(id)}/answer`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ answer })
  });
  return { ...toQuestion(d.item), student: null, answeredByName: null };
}
