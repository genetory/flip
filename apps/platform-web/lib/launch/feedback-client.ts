// Career Launch 제출물 단위 코치 피드백 클라이언트.
// 운영자는 학생별로 피드백을 작성/조회하고, 학생은 자신에게 온 피드백을 조회한다.
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
    // 토큰 접근 실패 시 익명으로 시도(엔드포인트가 인증 요구 → 실패 처리)
  }
  return headers;
}

async function req(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, init);
  const data = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string }) | null;
  if (!res.ok || data?.ok !== true) throw new Error((data?.message as string) ?? "요청을 처리하지 못했어요.");
  return data;
}

// 학생: 주차(1~3) 코치 피드백. generate=false 면 캐시만 조회(생성·과금 없음, 없으면 needsGenerate).
// generate=true 면 실제 생성(AI 포인트 차감). 결과물 없으면 text=null.
export async function fetchWeekFeedback(week: number, generate = false): Promise<{ text: string | null; needsGenerate: boolean }> {
  const data = await req("/career-launch/week-feedback", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ week, generate })
  });
  if (generate && typeof window !== "undefined") window.dispatchEvent(new Event("aply:ai-usage-changed"));
  return { text: typeof data.feedback === "string" ? data.feedback : null, needsGenerate: data.needsGenerate === true };
}

// 학생: 완주 최종 피드백 — 이력서+자소서+면접 종합. generate=false 면 캐시만(없으면 needsGenerate).
// generate=true 면 생성(AI 포인트 차감). 결과물이 바뀌면 stale=true. force=true면 강제 재생성.
export async function fetchFinalFeedback(opts: { force?: boolean; generate?: boolean } = {}): Promise<{ text: string | null; stale: boolean; needsGenerate: boolean }> {
  const generate = opts.generate ?? true;
  const data = await req("/career-launch/final-feedback", { method: "POST", headers: authHeaders(true), body: JSON.stringify({ force: opts.force ?? false, generate }) });
  if (generate && typeof window !== "undefined") window.dispatchEvent(new Event("aply:ai-usage-changed"));
  return { text: typeof data.feedback === "string" ? data.feedback : null, stale: data.stale === true, needsGenerate: data.needsGenerate === true };
}

// 학생: 내게 온 피드백 조회
