// AI 가드레일·오류를 전역 UI 로 알린다.
//  - verify: 403 인증필요 → '인증 메일 받기' 모달
//  - limit: 429 레이트·일일한도 → 토스트
//  - unavailable: 503(AI_UNAVAILABLE, OpenAI 크레딧 소진·다운) 또는 500 → 친절한 토스트
// 각 AI 클라이언트는 이 함수만 호출하고, <AiBlockedHandler/> 가 모달·토스트로 안내한다.
export type AiBlockedDetail = { kind: "verify" | "limit" | "unavailable"; message: string };
export const AI_BLOCKED_EVENT = "aply:ai-blocked";

export function notifyAiBlocked(status: number, code: string | undefined, message?: string): void {
  if (typeof window === "undefined") return;
  let kind: "verify" | "limit" | "unavailable" | null = null;
  if (status === 403 && code === "AI_VERIFY_REQUIRED") kind = "verify";
  else if (status === 429) kind = "limit";
  // AI 생성 엔드포인트에서만 호출되므로, 5xx(OpenAI 크레딧 소진·업스트림 다운 포함)는
  // 코드 버그가 아니라 'AI 일시 사용 불가'로 안내한다.
  else if (status === 503 || status === 500 || status === 502 || status === 504) kind = "unavailable";
  if (!kind) return;
  const fallback =
    kind === "verify"
      ? "이메일 인증 후 이용할 수 있어요."
      : kind === "unavailable"
        ? "AI가 일시적으로 사용이 어려워요. 잠시 후 다시 시도해 주세요."
        : "잠시 후 다시 시도해 주세요.";
  const detail: AiBlockedDetail = {
    kind,
    // 서버가 AI_UNAVAILABLE 로 내려준 친절 메시지가 있으면 우선 사용, 없으면 폴백.
    message: (code === "AI_UNAVAILABLE" ? message : undefined) || (kind === "unavailable" ? fallback : message || fallback)
  };
  window.dispatchEvent(new CustomEvent<AiBlockedDetail>(AI_BLOCKED_EVENT, { detail }));
}
