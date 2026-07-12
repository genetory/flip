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
export type InterviewChatResult = { reply: string; done: boolean };

async function req(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, init);
  const d = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string }) | null;
  if (!res.ok || d?.ok !== true) throw new Error((d?.message as string) ?? "요청을 처리하지 못했어요.");
  return d;
}

export async function requestInterviewChat(messages: InterviewChatMsg[], focus: InterviewFocus): Promise<InterviewChatResult> {
  const d = await req("/career-launch/interview-chat", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ messages, focus, locale: "ko" })
  });
  return {
    reply: typeof d.reply === "string" ? d.reply : "",
    done: d.done === true
  };
}
