"use client";

import { Sparkle } from "@phosphor-icons/react/dist/ssr";
import { Button } from "../ui/button";
import { useLanguage } from "../i18n/LanguageProvider";
import { useQuotaCopy } from "../../lib/resume-maker-i18n/quota";

// AI 무료 월 한도 초과 시 띄우는 업셀 모달. 결제 연동 전 단계 — 안내 + 닫기만.
export function AiQuotaModal({ resetAt, onClose }: { resetAt: string | null; onClose: () => void }) {
  const q = useQuotaCopy();
  const { locale } = useLanguage();
  const dateStr = (() => {
    if (!resetAt) return "";
    try {
      return new Date(resetAt).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return new Date(resetAt).toLocaleDateString();
    }
  })();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 text-center shadow-elevated" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Sparkle weight="fill" className="h-6 w-6 text-[#0B46E8]" aria-hidden />
        </div>
        <p className="mt-4 text-[16px] font-bold text-[#0B1227]">{q.limitTitle}</p>
        {dateStr ? <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{q.limitDesc(dateStr)}</p> : null}
        <p className="mt-2 text-[12.5px] font-medium text-[#0B46E8]">{q.comingSoon}</p>
        <Button variant="default" size="lg" className="mt-5 w-full" onClick={onClose}>
          {q.ok}
        </Button>
      </div>
    </div>
  );
}
