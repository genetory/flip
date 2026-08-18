"use client";

// 모달/팝업이 열려 있는 동안 배경(body) 스크롤을 잠근다.
// 여러 팝업이 겹쳐도 안전하도록 카운터로 관리 — 마지막 팝업이 닫힐 때만 해제.
import { useEffect } from "react";

let lockCount = 0;
let prevOverflow = "";

export function useLockBodyScroll(enabled = true): void {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;
    if (lockCount === 0) {
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount += 1;
    return () => {
      lockCount -= 1;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.style.overflow = prevOverflow;
      }
    };
  }, [enabled]);
}
