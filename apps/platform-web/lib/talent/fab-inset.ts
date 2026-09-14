"use client";

// 전역 피드백 FAB(FeedbackWidget, 우하단)이 하단 고정 바에 덮이지 않도록 위로 비켜서게 하는
// 공용 레지스트리. 하단 고정/스티키 바를 가진 화면이 자기 키로 필요한 높이(px)를 등록하면,
// 등록된 값들의 최댓값을 :root 의 --fab-bottom-offset 에 반영한다(FeedbackWidget 이 이를 읽음).
//
// 단일 변수를 여러 소비자가 직접 set/remove 하면 서로 덮어써 버그가 나므로(예: 쿠키 배너가
// 사라지며 변수를 지우면 채용 상세의 값까지 사라짐) 반드시 이 레지스트리를 통해 조정한다.
const insets = new Map<string, number>();

function recompute(): void {
  if (typeof document === "undefined") return;
  let max = 0;
  for (const v of insets.values()) if (v > max) max = v;
  const root = document.documentElement;
  if (max > 0) root.style.setProperty("--fab-bottom-offset", `${max}px`);
  else root.style.removeProperty("--fab-bottom-offset");
}

export function setFabInset(key: string, px: number): void {
  insets.set(key, Math.max(0, Math.round(px)));
  recompute();
}

export function clearFabInset(key: string): void {
  if (insets.delete(key)) recompute();
}
