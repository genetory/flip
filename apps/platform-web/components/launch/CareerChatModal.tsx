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
  // cleanup 에서 history.back() 을 호출하면 StrictMode(dev) 이중 실행 시 자기 popstate 로
  // 팝업이 열리자마자 닫히므로, back() 은 호출하지 않는다(엔트리 하나 남는 정도는 무해).
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.history.pushState({ careerChatModal: true }, "");
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="fixed inset-0 z-[60] bg-[#F1F1F4]">{children}</div>;
}
