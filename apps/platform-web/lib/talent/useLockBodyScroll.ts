"use client";

// 모달/팝업이 열려 있는 동안 배경(body) 스크롤을 잠근다.
//
// iOS Safari 는 `body { overflow: hidden }` 만으로는 배경 스크롤이 잠기지 않는다
// (터치로 뒤 페이지가 그대로 스크롤되는 "스크롤 블리드" — 모바일 웹 티가 확 나는 현상).
// 확실히 잠그려면 body 를 position:fixed 로 고정하고 현재 스크롤 위치를 top 오프셋으로
// 밀어두었다가, 풀릴 때 그 위치로 복원해야 한다.
//
// - 여러 팝업이 겹쳐도 안전하도록 카운터로 관리 — 첫 팝업이 잠그고 '마지막' 팝업이 풀 때만 복원.
// - 데스크톱에선 상시 스크롤바(globals: body overflow-y:scroll)가 사라지며 생기는 15px 가로
//   점프를 padding-right 보정으로 막는다. 모바일(오버레이 스크롤바)에선 보정폭 0.
import { useEffect } from "react";

let lockCount = 0;
let saved: {
  overflow: string;
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  paddingRight: string;
  scrollY: number;
} | null = null;

function lock(): void {
  const body = document.body;
  const scrollY = window.scrollY || window.pageYOffset || 0;
  // 스크롤바 폭 — 이 너비만큼 padding 으로 채워 콘텐츠가 가로로 튀지 않게.
  // 이 앱은 상시 스크롤바가 body 에 있어(globals: body overflow-y:scroll) body.clientWidth
  // 로 재야 정확하다. html 기준(documentElement)으로만 재면 0 이 나와 보정이 안 된다.
  // 두 방식 중 큰 값을 취해 어느 구성이든 안전하게.
  const scrollBarW = Math.max(
    window.innerWidth - document.body.clientWidth,
    window.innerWidth - document.documentElement.clientWidth,
    0
  );
  saved = {
    overflow: body.style.overflow,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    paddingRight: body.style.paddingRight,
    scrollY
  };
  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  if (scrollBarW > 0) body.style.paddingRight = `${scrollBarW}px`;
}

function unlock(): void {
  if (!saved) return;
  const body = document.body;
  const { overflow, position, top, left, right, width, paddingRight, scrollY } = saved;
  body.style.overflow = overflow;
  body.style.position = position;
  body.style.top = top;
  body.style.left = left;
  body.style.right = right;
  body.style.width = width;
  body.style.paddingRight = paddingRight;
  saved = null;
  // position:fixed 를 풀면 스크롤이 0 으로 튀므로, 잠그기 직전 위치로 즉시 복원.
  window.scrollTo(0, scrollY);
}

export function useLockBodyScroll(enabled = true): void {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;
    if (lockCount === 0) lock();
    lockCount += 1;
    return () => {
      lockCount -= 1;
      if (lockCount <= 0) {
        lockCount = 0;
        unlock();
      }
    };
  }, [enabled]);
}
