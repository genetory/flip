"use client";

// 뒤로가기 — 모든 Talent 페이지에서 통일해 쓰는 히스토리 back 버튼.
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

export function TalentBackButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="뒤로가기"
      className={`inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#8B95A1] transition hover:text-[#4E5968] ${className}`}
    >
      <ArrowLeft className="h-4 w-4" /> 뒤로
    </button>
  );
}
