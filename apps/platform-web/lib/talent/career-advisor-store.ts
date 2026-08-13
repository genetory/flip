// AI 커리어 상담 대화 기록 — 로컬에 저장해 다시 열어도 이어볼 수 있게 한다.
export type AdvisorChatMsg = { role: "bot" | "user"; text: string; roles?: string[] };

const KEY = "aply_career_advisor_chat_v1";

export function loadAdvisorChat(): AdvisorChatMsg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((m) => m && (m.role === "bot" || m.role === "user") && typeof m.text === "string");
  } catch {
    return [];
  }
}

export function saveAdvisorChat(msgs: AdvisorChatMsg[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(msgs.slice(-40)));
  } catch {
    // 저장 실패는 조용히 무시
  }
}

export function clearAdvisorChat(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // 무시
  }
}
