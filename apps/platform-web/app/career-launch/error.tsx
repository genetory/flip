"use client";

// Career Launch 라우트 에러 바운더리 — 렌더 예외 시 맨 화면 대신 친절한 폴백.
// 에러 페이지 자체가 다시 깨지지 않게 i18n 훅 없이 정적 문구(KO+EN)만 사용.
import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5">
      <div className="w-full max-w-sm rounded-3xl bg-[color:var(--v2-band,#f2f4f6)] px-5 py-10 text-center">
        <p className="text-[20px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink,#191f28)]">잠시 문제가 발생했어요</p>
        <p className="mt-2 text-[15px] leading-[1.6] text-[color:var(--v2-ink-3,#4e5968)]">Something went wrong. 잠시 후 다시 시도해 주세요.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={reset} className="inline-flex h-12 items-center justify-center rounded-xl bg-[color:var(--v2-accent,#0b46e8)] px-5 text-[16px] font-semibold text-white transition hover:opacity-90 active:scale-[0.98]">
            다시 시도 · Retry
          </button>
          <Link href="/career-launch" className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-5 text-[16px] font-semibold text-[color:var(--v2-ink-3,#4e5968)] transition hover:bg-[color:var(--v2-fill,#f9fafb)]">
            대시보드
          </Link>
        </div>
      </div>
    </main>
  );
}
