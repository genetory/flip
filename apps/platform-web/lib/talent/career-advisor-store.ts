// AI 커리어 상담 대화 기록 — 로컬에 저장해 다시 열어도 이어볼 수 있게 한다.
// 기기 공유 시 다른 사람에게 새지 않도록 userId 별로 키를 분리한다.
export type AdvisorChatMsg = { role: "bot" | "user"; text: string; roles?: string[] };

const PREFIX = "aply_career_advisor_chat_v1:";

function keyFor(userId: string): string {
  return `${PREFIX}${userId || "anon"}`;
}

export function loadAdvisorChat(userId: string): AdvisorChatMsg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((m) => m && (m.role === "bot" || m.role === "user") && typeof m.text === "string");
  } catch {
    return [];
  }
}

export function saveAdvisorChat(userId: string, msgs: AdvisorChatMsg[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(msgs.slice(-40)));
  } catch {
    // 저장 실패는 조용히 무시
  }
}

export function clearAdvisorChat(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(keyFor(userId));
  } catch {
    // 무시
  }
}

// 로그아웃 등에서 이 기기의 모든 상담 기록 제거(유저 키 전부).
export function clearAllAdvisorChats(): void {
  if (typeof window === "undefined") return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) toRemove.push(k);
    }
    for (const k of toRemove) window.localStorage.removeItem(k);
  } catch {
    // 무시
  }
}
