// Week3 기본 모의면접(카드형) 클라이언트 — 내 이력서·자소서 기반, 유형별(self/job/fit/pressure)
// 질문 생성 + 답변별 채점(점수·모범답안·피드백). 공고별과 동일한 카드·채점 구조.
import { notifyAiBlocked } from "../ai-blocked";
import type { PostingScore } from "./posting-interview";

export type BasicFocus = "self" | "job" | "fit" | "pressure";

const TOKEN_KEY = "platform_access_token";
function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}
function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const t = window.localStorage.getItem(TOKEN_KEY);
    if (t) headers.Authorization = `Bearer ${t}`;
  } catch {
    /* 익명 */
  }
  return headers;
}
async function req(path: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
  const d = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string; code?: string }) | null;
  if (!res.ok || d?.ok !== true) {
    notifyAiBlocked(res.status, d?.code, d?.message);
    throw new Error((d?.message as string) ?? "요청을 처리하지 못했어요.");
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("aply:ai-usage-changed"));
  return d;
}

export async function requestBasicQuestions(focus: BasicFocus, count = 5): Promise<string[]> {
  const d = await req("/career-launch/basic-interview/questions", { focus, count, locale: "ko" });
  return Array.isArray(d.questions) ? (d.questions as unknown[]).filter((q): q is string => typeof q === "string" && q.trim().length > 0) : [];
}

export async function scoreBasicAnswer(focus: BasicFocus, question: string, answer: string): Promise<PostingScore> {
  const d = await req("/career-launch/basic-interview/score", { focus, question, answer, locale: "ko" });
  const list = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === "string") : []);
  return {
    score: typeof d.score === "number" ? d.score : 0,
    modelAnswer: typeof d.modelAnswer === "string" ? d.modelAnswer : "",
    feedback: typeof d.feedback === "string" ? d.feedback : "",
    strengths: list(d.strengths),
    improvements: list(d.improvements)
  };
}
