// Experience Bank 채굴 — AI Career Coach 와 대화하며 경험 하나를 구조화한다.
import type { ExperienceEntry } from "./progress-client";

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
  if (!res.ok || d?.ok !== true) throw new Error((d?.message as string) ?? "요청을 처리하지 못했어요.");
  if (typeof window !== "undefined") window.dispatchEvent(new Event("aply:ai-usage-changed"));
  return d;
}

export type ExpMiningMsg = { role: "bot" | "user"; text: string };
export type ExpMiningResult = { reply: string; done: boolean; extracted: ExperienceEntry | null; experienceBank: ExperienceEntry[] };

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
    experienceBank: bank
  };
}
