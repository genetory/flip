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

  // 브라우저 뒤로가기로 팝업 닫기 — 열릴 때 히스토리 엔트리를 하나 넣고, 뒤로가기(popstate)에서 닫는다.
  // X/ESC 로 닫으면 넣어둔 엔트리를 정리(뒤로가기로 닫힌 경우엔 이미 소비됨).
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.history.pushState({ careerChatModal: true }, "");
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (window.history.state?.careerChatModal) window.history.back();
    };
    // onClose 는 마운트 시점 기준으로 충분(닫기 동작은 동일). 한 번만 설치.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="fixed inset-0 z-[60] bg-[#F1F1F4]">{children}</div>;
}
