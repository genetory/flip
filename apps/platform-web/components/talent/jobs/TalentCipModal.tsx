"use client";

// Talent 전용 CIP 안내 모달 — wiyb.golf 톤(라이트/화이트, 블루 액센트, 넉넉한 여백, 부드러운 그림자).
// 프로그램 참여혜택 카드는 노출하지 않는다. 카피는 기존 CIP_COPY 재사용(6개 로케일).
import { useEffect } from "react";
import { X, Star } from "@phosphor-icons/react";
import { CIP_COPY } from "../../positions/AplyCipBadge";
import type { PlatformLocale } from "../../../lib/auth-messages";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";

export function TalentCipModal({ locale, onClose }: { locale: PlatformLocale; onClose: () => void }) {
  useLockBodyScroll();
  const copy = CIP_COPY[locale] ?? CIP_COPY.en;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1227]/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[440px] overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(11,18,39,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between px-7 pt-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF1FD] px-3 py-1 text-[12px] font-bold text-[#0B46E8]">
            <Star className="h-3.5 w-3.5" weight="fill" /> APLY CIP
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="-mr-1.5 -mt-1 inline-flex h-9 w-9 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6] hover:text-[#4E5968]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-7 pb-2 pt-5">
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-[#0B1227]">{copy.title}</h2>
          <p className="mt-4 break-keep text-[14.5px] leading-[1.7] text-[#4E5968]">{copy.body}</p>
        </div>

        {/* 액션 */}
        <div className="px-7 pb-7 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#0B46E8] px-5 text-[15px] font-bold text-white transition hover:bg-[#0A3ECB]"
          >
            {copy.close}
          </button>
        </div>
      </div>
    </div>
  );
}
