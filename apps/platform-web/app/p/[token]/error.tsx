"use client";

// 공개 공유 프로필(/p/[token]) 에러 바운더리 — 렌더 예외 시 맨 화면 대신 친절한 폴백.
// 에러 페이지 자체가 다시 깨지지 않게 i18n 훅 없이 정적 문구(KO+EN)만 사용.
import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F6F8FB] px-6">
      <div className="w-full max-w-sm rounded-3xl border border-[#EEF1F5] bg-white p-8 text-center shadow-[0_16px_40px_-20px_rgba(11,18,39,0.3)]">
        <p className="text-[15px] font-bold text-[#191F28]">잠시 문제가 발생했어요</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#8B95A1]">Something went wrong. 잠시 후 다시 시도해 주세요.</p>
        <div className="mt-5 flex justify-center gap-2">
          <button type="button" onClick={reset} className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
            다시 시도 · Retry
          </button>
          <Link href="/career-launch" className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E5E8EC] bg-white px-5 text-[14px] font-bold text-[#4E5968] transition hover:text-[#191F28]">
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}
