import { notifyAiBlocked } from "../ai-blocked";
import { RECOMMENDED_JOBS } from "./data";

// Career Launch '관심 직무 찾기' AI 대화 클라이언트. 백엔드(/career-launch/job-chat)가
// 대화를 이어받아 다음 질문과 추천 직무(후보 풀에서 선택)를 돌려준다.
const TOKEN_KEY = "platform_access_token";

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export type JobChatMsg = { role: "bot" | "user"; text: string };
export type JobChatResult = { reply: string; recommend: string[]; done: boolean };

// 공용 POST — 토큰 첨부 + JSON. 실패 시 throw.
async function postCareerChat(path: string, body: unknown): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const t = window.localStorage.getItem(TOKEN_KEY);
    if (t) headers.Authorization = `Bearer ${t}`;
  } catch {
    // 토큰 접근 실패 시 익명으로 시도(엔드포인트가 인증 요구 → 실패 처리)
  }
  const res = await fetch(`${apiBase()}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string }) | null;
  if (!res.ok || data?.ok !== true) {
    notifyAiBlocked(res.status, (data as { code?: string } | null)?.code, data?.message as string);
    throw new Error((data?.message as string) ?? "대화를 이어가지 못했어요.");
  }
  // AI 티켓 소모 → GNB 잔량 뱃지 갱신.
  if (typeof window !== "undefined") window.dispatchEvent(new Event("aply:ai-usage-changed"));
  return data;
}

const asStringArray = (v: unknown): string[] => (Array.isArray(v) ? (v.filter((x) => typeof x === "string") as string[]) : []);

export async function requestJobChat(messages: JobChatMsg[], selected: string[], exclude: string[] = []): Promise<JobChatResult> {
  const pool = RECOMMENDED_JOBS.map((j) => ({ role: j.role, keywords: [...j.tags, ...j.skills] }));
  const data = await postCareerChat("/career-launch/job-chat", { messages, selected, exclude, pool, locale: "ko" });
  return {
    reply: typeof data.reply === "string" ? data.reply : "",
    recommend: asStringArray(data.recommend),
    done: data.done === true
  };
}

export type MaterialChatResult = { reply: string; materials: string[]; done: boolean };
export async function requestMaterialChat(messages: JobChatMsg[], selected: string[], materials: string[] = []): Promise<MaterialChatResult> {
  const data = await postCareerChat("/career-launch/material-chat", { messages, selected, materials, locale: "ko" });
  return {
    reply: typeof data.reply === "string" ? data.reply : "",
    materials: asStringArray(data.materials),
    done: data.done === true
  };
}

export type DiagnosisResult = { percent: number; level: string; strengths: string[]; improvements: string[] };
export type DiagnosisChatResult = { reply: string; done: boolean; result: DiagnosisResult | null };
export async function requestDiagnosisChat(messages: JobChatMsg[]): Promise<DiagnosisChatResult> {
  const data = await postCareerChat("/career-launch/diagnosis-chat", { messages, locale: "ko" });
  const r = data.result as Record<string, unknown> | null | undefined;
  const result: DiagnosisResult | null =
    r && typeof r === "object"
      ? {
          percent: Math.max(0, Math.min(100, Math.round(Number(r.percent)) || 0)),
          level: typeof r.level === "string" ? r.level : "",
          strengths: asStringArray(r.strengths),
          improvements: asStringArray(r.improvements)
        }
      : null;
  return { reply: typeof data.reply === "string" ? data.reply : "", done: data.done === true, result };
}
