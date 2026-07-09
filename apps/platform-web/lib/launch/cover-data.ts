// Career Launch 자기소개서 데이터(대화로 수집) 타입 + 클라이언트. 이력서와 동일 구조.
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

export type CoverItem = { question: string; answer: string };
export type CoverData = { company?: string | null; items?: CoverItem[] };

export type CoverChatMsg = { role: "bot" | "user"; text: string };
export type CoverChatResult = { reply: string; data: CoverData; done: boolean };

async function req(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, init);
  const d = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string }) | null;
  if (!res.ok || d?.ok !== true) throw new Error((d?.message as string) ?? "요청을 처리하지 못했어요.");
  return d;
}

export type CoverSection = "motive" | "growth" | "strength" | "aspiration" | "polish";
export async function requestCoverChat(messages: CoverChatMsg[], data: CoverData, focus?: CoverSection): Promise<CoverChatResult> {
  const d = await req("/career-launch/cover-chat", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ messages, data, focus, locale: "ko" })
  });
  return { reply: typeof d.reply === "string" ? d.reply : "", data: (d.data as CoverData) ?? {}, done: d.done === true };
}

export async function fetchCoverData(): Promise<{ data: CoverData; updatedAt: string | null }> {
  const d = await req("/career-launch/cover-data", { headers: authHeaders() });
  return { data: (d.data as CoverData) ?? {}, updatedAt: (d.updatedAt as string) ?? null };
}

// '다시하기' — scope(motive|growth|strength|aspiration) 면 그 문항부터 이후만, 없으면 전체 초기화.
export async function resetCoverData(scope?: Exclude<CoverSection, "polish">): Promise<void> {
  const q = scope ? `?scope=${scope}` : "";
  await req(`/career-launch/cover-data${q}`, { method: "DELETE", headers: authHeaders() });
}

export function hasCoverContent(data: CoverData | null | undefined): boolean {
  return Boolean(data?.items?.some((x) => (x.answer ?? "").trim().length > 0));
}
