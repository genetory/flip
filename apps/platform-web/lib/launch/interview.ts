// Week4 면접 준비 대화 클라이언트 — 예상 질문 준비(prep) / 모의면접(mock).
// 결과(예상 질문·연습 여부)는 백엔드 progress.interview 에 저장된다.
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

export type InterviewFocus = "self" | "job" | "fit";
export type InterviewChatMsg = { role: "bot" | "user"; text: string };
// 준비도 리포트 — 점수 없이 정성 피드백(마무리 시에만).
export type InterviewReport = { strengths: string[]; improvements: string[]; modelAnswer: string };
export type InterviewChatResult = { reply: string; done: boolean; report: InterviewReport | null };

async function req(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, init);
  const d = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string }) | null;
  if (!res.ok || d?.ok !== true) throw new Error((d?.message as string) ?? "요청을 처리하지 못했어요.");
  if (typeof window !== "undefined") window.dispatchEvent(new Event("aply:ai-usage-changed"));
  return d;
}

export async function requestInterviewChat(messages: InterviewChatMsg[], focus: InterviewFocus): Promise<InterviewChatResult> {
  const d = await req("/career-launch/interview-chat", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ messages, focus, locale: "ko" })
  });
  const r = d.report && typeof d.report === "object" ? (d.report as Record<string, unknown>) : null;
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  const report: InterviewReport | null = r
    ? { strengths: list(r.strengths), improvements: list(r.improvements), modelAnswer: typeof r.modelAnswer === "string" ? r.modelAnswer : "" }
    : null;
  return {
    reply: typeof d.reply === "string" ? d.reply : "",
    done: d.done === true,
    report
  };
}
