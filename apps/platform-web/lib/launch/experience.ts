// Experience Bank 채굴 — AI Career Coach 와 대화하며 경험 하나를 구조화한다.
import { notifyAiBlocked } from "../ai-blocked";
import type { ExperienceEntry, StrengthStory } from "./progress-client";

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
    /* 익명 시도 */
  }
  return headers;
}
async function req(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, init);
  const d = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string }) | null;
  if (!res.ok || d?.ok !== true) { notifyAiBlocked(res.status, (d as { code?: string } | null)?.code, d?.message as string); throw new Error((d?.message as string) ?? "요청을 처리하지 못했어요."); }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("aply:ai-usage-changed"));
  return d;
}

export type ExpMiningMsg = { role: "bot" | "user"; text: string };
export type ExpMiningResult = { reply: string; done: boolean; extracted: ExperienceEntry | null; experienceBank: ExperienceEntry[]; choices: string[] };

export async function requestExperienceMining(messages: ExpMiningMsg[], locale = "ko"): Promise<ExpMiningResult> {
  const d = await req("/career-launch/experience-mining", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ messages, locale })
  });
  const bank = Array.isArray(d.experienceBank) ? (d.experienceBank as ExperienceEntry[]) : [];
  return {
    reply: typeof d.reply === "string" ? d.reply : "",
    done: d.done === true,
    extracted: d.extracted && typeof d.extracted === "object" ? (d.extracted as ExperienceEntry) : null,
    experienceBank: bank,
    choices: Array.isArray(d.choices) ? (d.choices.filter((c) => typeof c === "string") as string[]) : []
  };
}

// Week 1 강점 스토리 — 경험을 면접·자소서용 짧은 이야기로 만든다(대화형).
export type StrengthStoryResult = { reply: string; done: boolean; extracted: StrengthStory | null; strengthStories: StrengthStory[]; choices: string[] };
export async function requestStrengthStory(messages: ExpMiningMsg[], locale = "ko"): Promise<StrengthStoryResult> {
  const d = await req("/career-launch/strength-story", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ messages, locale }) });
  return {
    reply: typeof d.reply === "string" ? d.reply : "",
    done: d.done === true,
    extracted: d.extracted && typeof d.extracted === "object" ? (d.extracted as StrengthStory) : null,
    strengthStories: Array.isArray(d.strengthStories) ? (d.strengthStories as StrengthStory[]) : [],
    choices: Array.isArray(d.choices) ? (d.choices.filter((c) => typeof c === "string") as string[]) : []
  };
}

// Week 4 면접 Retry — 특정 질문 재답변 채점(점수·힌트·잘한점·개선점).
export type RetryResult = { score: number; feedback: string; hint: string; good: string[]; improve: string[] };
export async function requestInterviewRetry(question: string, answer: string, locale = "ko"): Promise<RetryResult> {
  const d = await req("/career-launch/interview-retry", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ question, answer, locale })
  });
  const r = (d.result ?? {}) as Record<string, unknown>;
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  return {
    score: typeof r.score === "number" ? r.score : 0,
    feedback: typeof r.feedback === "string" ? r.feedback : "",
    hint: typeof r.hint === "string" ? r.hint : "",
    good: list(r.good),
    improve: list(r.improve)
  };
}
