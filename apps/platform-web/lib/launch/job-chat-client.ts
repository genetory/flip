import { RECOMMENDED_JOBS } from "./data";

// Career Launch '관심 직무 찾기' AI 대화 클라이언트. 백엔드(/career-launch/job-chat)가
// 대화를 이어받아 다음 질문과 추천 직무(후보 풀에서 선택)를 돌려준다.
const TOKEN_KEY = "platform_access_token";

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export type JobChatMsg = { role: "bot" | "user"; text: string };
export type JobChatResult = { reply: string; recommend: string[]; done: boolean };

export async function requestJobChat(messages: JobChatMsg[], selected: string[]): Promise<JobChatResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const t = window.localStorage.getItem(TOKEN_KEY);
    if (t) headers.Authorization = `Bearer ${t}`;
  } catch {
    // 토큰 접근 실패 시 익명으로 시도(엔드포인트가 인증 요구 → 실패 처리)
  }
  const pool = RECOMMENDED_JOBS.map((j) => ({ role: j.role, keywords: [...j.tags, ...j.skills] }));
  const res = await fetch(`${apiBase()}/career-launch/job-chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ messages, selected, pool, locale: "ko" })
  });
  const data = (await res.json().catch(() => null)) as
    | { ok?: boolean; reply?: unknown; recommend?: unknown; done?: unknown; message?: string }
    | null;
  if (!res.ok || data?.ok !== true) {
    throw new Error(data?.message ?? "대화를 이어가지 못했어요.");
  }
  return {
    reply: typeof data.reply === "string" ? data.reply : "",
    recommend: Array.isArray(data.recommend) ? (data.recommend.filter((r) => typeof r === "string") as string[]) : [],
    done: data.done === true
  };
}
