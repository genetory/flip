"use client";

// /talent 세그먼트 에러 바운더리 — 렌더 예외(예: 일부 iOS WebKit에서의 스택 초과) 시
// 화면 전체가 깨지지 않도록 우아한 폴백을 주고, 동시에 "누가·어떤 데이터에서" 터졌는지
// 진단 컨텍스트를 에러 채널로 보내 근본 원인(특정 사용자 데이터)을 특정한다.
import Link from "next/link";
import { useEffect } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { snapshotJobInterests, snapshotResume, snapshotCover, snapshotBasicInfo } from "../../lib/talent/renewal-docs-store";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { user } = useAuthSession();

  useEffect(() => {
    try {
      const api = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
      if (!api) return;
      // 렌더 크래시 시점의 데이터 형태 — 재현·특정용(연락 PII 원문은 넣지 않고 길이/개수만).
      const ji = snapshotJobInterests();
      const rd = snapshotResume();
      const cd = snapshotCover();
      const bi = snapshotBasicInfo();
      const diag = [
        `uid=${user?.id ?? "-"}`,
        `email=${user?.email ?? "-"}`,
        `path=${typeof window !== "undefined" ? window.location.pathname : "-"}`,
        `jobInterests=${Array.isArray(ji) ? JSON.stringify(ji).slice(0, 300) : "-"}`,
        `resumeItems=${rd?.items?.length ?? "-"}`,
        `coverItems=${cd?.items?.length ?? "-"}`,
        `realNameLen=${bi?.realName?.length ?? "-"}`,
        `digest=${error?.digest ?? "-"}`
      ].join(" | ");
      const body = JSON.stringify({
        message: `talent-boundary: ${(error?.message ?? "unknown").slice(0, 200)}`,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        // 진단 컨텍스트를 stack 필드에 실어 Discord로 함께 전달(스키마상 forward 되는 필드).
        stack: `DIAG ${diag}\n---\n${(error?.stack ?? "").slice(0, 3500)}`
      });
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(`${api}/errors/client`, new Blob([body], { type: "application/json" }));
      } else {
        void fetch(`${api}/errors/client`, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
      }
    } catch {
      /* 진단 리포트 실패는 무시 */
    }
  }, [error, user]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F6F8FB] px-6">
      <div className="w-full max-w-sm rounded-3xl border border-[#EEF1F5] bg-white p-8 text-center shadow-[0_16px_40px_-20px_rgba(11,18,39,0.3)]">
        <p className="text-[15px] font-bold text-[#191F28]">잠시 문제가 발생했어요</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#8B95A1]">Something went wrong. 잠시 후 다시 시도해 주세요.</p>
        <div className="mt-5 flex justify-center gap-2">
          <button type="button" onClick={reset} className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
            다시 시도 · Retry
          </button>
          <Link href="/talent/home" className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E5E8EB] bg-white px-5 text-[14px] font-bold text-[#4E5968] transition hover:text-[#191F28]">
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}
