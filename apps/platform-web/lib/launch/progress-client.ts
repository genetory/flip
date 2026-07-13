// Career Launch 진행 상태(진단·선정직무·정리한 직무정보·완료스텝) 클라이언트.
// 계정 기준으로 백엔드에 저장 → 다른 기기·브라우저에서도 그대로 이어간다.
// (기존 localStorage 대체)
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

export type CareerDiagnosis = { percent: number; level: string; strengths: string[]; improvements: string[] };
export type CareerInterview = { practiced?: string[] }; // 완료한 면접 유형(self|job|fit)
export type CareerProgress = {
  diagnosis?: CareerDiagnosis | null;
  selectedJobs?: string[];
  materials?: string[];
  doneSteps?: string[];
  interview?: CareerInterview | null;
  finalFeedback?: { v?: number; sig?: string; text?: string } | null;
};

async function req(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, init);
  const d = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string }) | null;
  if (!res.ok || d?.ok !== true) throw new Error((d?.message as string) ?? "요청을 처리하지 못했어요.");
  return d;
}

// 전체 진행 상태 조회.
export async function fetchProgress(): Promise<CareerProgress> {
  const d = await req("/career-launch/progress", { headers: authHeaders() });
  return (d.state as CareerProgress) ?? {};
}

// 일부 키만 갱신(얕은 병합). 갱신된 전체 상태를 반환.
export async function patchProgress(partial: Partial<CareerProgress>): Promise<CareerProgress> {
  const d = await req("/career-launch/progress", {
    method: "PATCH",
    headers: authHeaders(true),
    body: JSON.stringify(partial)
  });
  return (d.state as CareerProgress) ?? {};
}
