"use client";

// 뒤로가기 — 리뉴얼(talent·partner) 전 페이지 공용.
// 앱 내 히스토리가 있으면 router.back(), 없으면(딥링크·알림·새로고침으로 직접 진입) 안전한
// 폴백으로 이동한다. 폴백: 명시 prop > 현재 경로의 부모(상세→목록) > 앱 홈.
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

export function TalentBackButton({ className = "", fallback }: { className?: string; fallback?: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";

  function resolveFallback(): string {
    if (fallback) return fallback;
    const parts = pathname.split("/").filter(Boolean); // 예: ["talent","jobs","abc"]
    // 상세 페이지(세그먼트 3개 이상)면 부모 목록으로.
    if (parts.length > 2) return `/${parts.slice(0, -1).join("/")}`;
    return pathname.startsWith("/partner") ? "/partner/home" : "/talent/home";
  }

  function goBack() {
    // history.length > 1 이면 앱 내에서 넘어온 것으로 보고 back, 아니면 폴백.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(resolveFallback());
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="뒤로가기"
      className={`inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#8B95A1] transition hover:text-[#4E5968] ${className}`}
    >
      <ArrowLeft className="h-4 w-4" /> 뒤로
    </button>
  );
}
