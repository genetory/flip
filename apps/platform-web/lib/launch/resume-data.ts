// Career Launch 이력서 데이터(대화로 수집) 타입 + 클라이언트.
// 학생은 빌더로 가지 않고 AI와 대화하며 아래 구조를 채운다. 백엔드에 학생당 1행 저장.
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
    // 익명 시도(엔드포인트가 인증 요구)
  }
  return headers;
}

export type ResumeBasic = { name?: string | null; email?: string | null; phone?: string | null; summary?: string | null };
export type ResumeEducation = { school?: string | null; major?: string | null; degree?: string | null; period?: string | null; note?: string | null };
export type ResumeExperience = { title?: string | null; org?: string | null; period?: string | null; bullets?: string[] };
export type ResumeLanguage = { language?: string | null; level?: string | null };
export type ResumeData = {
  basic?: ResumeBasic;
  educations?: ResumeEducation[];
  experiences?: ResumeExperience[];
  skills?: string[];
  languages?: ResumeLanguage[];
};

export type ResumeChatMsg = { role: "bot" | "user"; text: string };
export type ResumeChatResult = { reply: string; data: ResumeData; done: boolean };

async function req(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, init);
  const d = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string }) | null;
  if (!res.ok || d?.ok !== true) throw new Error((d?.message as string) ?? "요청을 처리하지 못했어요.");
  return d;
}

// 채팅으로 이력서 데이터 수집 — 누적 data 를 함께 보내고, 갱신된 전체 data 를 받는다.
export async function requestResumeChat(messages: ResumeChatMsg[], data: ResumeData): Promise<ResumeChatResult> {
  const d = await req("/career-launch/resume-chat", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ messages, data, locale: "ko" })
  });
  return {
    reply: typeof d.reply === "string" ? d.reply : "",
    data: (d.data as ResumeData) ?? {},
    done: d.done === true
  };
}

// 저장된 이력서 데이터 조회(미리보기·복원용).
export async function fetchResumeData(): Promise<{ data: ResumeData; updatedAt: string | null }> {
  const d = await req("/career-launch/resume-data", { headers: authHeaders() });
  return { data: (d.data as ResumeData) ?? {}, updatedAt: (d.updatedAt as string) ?? null };
}

// 데이터가 실제로 채워졌는지(빈 데이터 판별).
export function hasResumeContent(data: ResumeData | null | undefined): boolean {
  if (!data) return false;
  const b = data.basic;
  const basicFilled = Boolean(b && (b.name || b.email || b.phone || b.summary));
  return (
    basicFilled ||
    (data.educations?.length ?? 0) > 0 ||
    (data.experiences?.length ?? 0) > 0 ||
    (data.skills?.length ?? 0) > 0 ||
    (data.languages?.length ?? 0) > 0
  );
}
