// Week 1 직무 결정 — 목표 직무 확정 클라이언트.
// (구 추천직무·미니체험·결정 리포트·경험 CRUD 흐름은 스텝 통합으로 제거. 남은 건 목표 직무 확정뿐.)
import { notifyAiBlocked } from "../ai-blocked";

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
  const d = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string; code?: string }) | null;
  if (!res.ok || d?.ok !== true) {
    notifyAiBlocked(res.status, d?.code, d?.message);
    throw new Error(d?.message ?? "요청을 처리하지 못했어요.");
  }
  return d;
}

export type TargetJob = { id: string; jobKey: string; label?: string | null; targetType: "primary" | "challenge" | "alternative"; status: "provisional" | "exploring" | "confirmed" | "rejected"; reason?: string | null };

// 관심 직무 중 1순위를 목표로 확정 — 2주차 지원 서류의 기준. 서버가 jobKey(라벨 가능)를 직무군으로 해석, reason 에 원문 보존.
export async function confirmTargetJob(jobKey: string, targetType: "primary" | "challenge" | "alternative" = "primary", status: "provisional" | "exploring" | "confirmed" | "rejected" = "confirmed", reason?: string): Promise<TargetJob> {
  const d = await req("/career-launch/week1/target", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ jobKey, targetType, status, reason }) });
  return d.target as TargetJob;
}
