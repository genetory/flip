"use client";

// 운영자/파트너 콘솔(/dashboard)은 표·상세 등 PC 화면에 맞춰져 있어, 모바일 접속 시 상단에
// 닫을 수 있는 안내 배너로 'PC 사용 권장'을 알린다. 데스크톱(md 이상)에선 숨김. 한 번 닫으면
// 이후 다시 뜨지 않도록 localStorage 에 기억(실패해도 기본 동작 유지).
import { useEffect, useState } from "react";
import { X } from "@phosphor-icons/react";

const DISMISS_KEY = "ops_pc_recommend_dismissed";

export function DesktopRecommendBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(DISMISS_KEY) !== "1") setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* 저장 실패 무시 */
    }
  };

  return (
    <div
      className="sticky top-0 z-50 flex items-center gap-2 bg-[#0B1227] px-4 py-2.5 text-white md:hidden"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.6rem)" }}
    >
      <span aria-hidden>💻</span>
      <p className="min-w-0 flex-1 break-keep text-[12.5px] leading-snug">
        이 화면은 PC에 최적화돼 있어요. 원활한 사용을 위해 PC에서 접속하시길 권장합니다.
      </p>
      <button type="button" onClick={dismiss} aria-label="닫기" className="shrink-0 rounded-lg p-1 text-white/60 transition hover:text-white">
        <X className="h-4 w-4" weight="bold" aria-hidden />
      </button>
    </div>
  );
}
