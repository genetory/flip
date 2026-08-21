"use client";

// 주차 LLM 채팅을 페이지 이동 대신 전체화면 모달로 띄우는 셸.
// 내부 채팅(embedded)이 자체 상단바(제목·X)와 h-[100dvh] 레이아웃을 가지므로, 여기선 오버레이만 담당.
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLockBodyScroll } from "../../lib/talent/useLockBodyScroll";

export function CareerChatModal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useLockBodyScroll();
  // ESC 로 닫기.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return <div className="fixed inset-0 z-[60] bg-white">{children}</div>;
}
