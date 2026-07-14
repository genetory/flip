// Career Launch 프로그램 콘텐츠 오버라이드 — 운영자가 편집한 주차/스텝 문구.
// 기본값은 data.ts / data-i18n.ts 에 있고, 여기서 받아온 값만 그 위에 얹힌다.
import type { LT } from "./i18n";

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

async function req(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, init);
  const d = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string }) | null;
  if (!res.ok || d?.ok !== true) throw new Error((d?.message as string) ?? "요청을 처리하지 못했어요.");
  return d;
}

export type WeekOverride = { title?: LT; subtitle?: LT; goal?: LT };
export type StepOverride = { title?: LT; desc?: LT };
export type CareerContent = {
  weeks?: Record<string, WeekOverride>; // key = 주차 번호("1"~"4")
  steps?: Record<string, StepOverride>; // key = 스텝 id("w1s1"…)
};

// 학생·운영자 공용 조회.
export async function fetchCareerContent(): Promise<CareerContent> {
  const d = await req("/career-launch/content", { headers: authHeaders() });
  return (d.content as CareerContent) ?? {};
}

// 운영자 편집용 조회/저장.
export async function fetchOpsCareerContent(): Promise<CareerContent> {
  const d = await req("/career-launch/ops/content", { headers: authHeaders() });
  return (d.content as CareerContent) ?? {};
}

export async function saveOpsCareerContent(content: CareerContent): Promise<void> {
  await req("/career-launch/ops/content", { method: "PUT", headers: authHeaders(true), body: JSON.stringify({ content }) });
}
