// AI 무료화 가드레일에 걸렸을 때(403 인증필요 / 429 레이트·일일한도) 전역 UI 로 알린다.
// 각 AI 클라이언트는 이 함수만 호출하고, <AiBlockedHandler/> 가 모달·토스트로 안내한다.
export type AiBlockedDetail = { kind: "verify" | "limit"; message: string };
export const AI_BLOCKED_EVENT = "aply:ai-blocked";

export function notifyAiBlocked(status: number, code: string | undefined, message?: string): void {
  if (typeof window === "undefined") return;
  let kind: "verify" | "limit" | null = null;
  if (status === 403 && code === "AI_VERIFY_REQUIRED") kind = "verify";
  else if (status === 429) kind = "limit";
  if (!kind) return;
  const detail: AiBlockedDetail = {
    kind,
    message: message || (kind === "verify" ? "이메일 인증 후 이용할 수 있어요." : "잠시 후 다시 시도해 주세요.")
  };
  window.dispatchEvent(new CustomEvent<AiBlockedDetail>(AI_BLOCKED_EVENT, { detail }));
}
