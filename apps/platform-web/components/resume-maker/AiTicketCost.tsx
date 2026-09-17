"use client";

// AI 포인트/티켓 전면 무료 전환 — 소모 비용 칩을 어디에서도 표시하지 않는다.
// (호출부 호환을 위해 컴포넌트 시그니처는 유지하되 항상 아무것도 렌더하지 않음)
export function AiTicketCost(_props: {
  feature?: string;
  cost?: number;
  tone?: "onPrimary" | "muted" | "plain";
  size?: "sm" | "md";
}) {
  return null;
}
