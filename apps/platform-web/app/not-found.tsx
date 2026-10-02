import type { Metadata } from "next";
import Link from "next/link";
import { pageSeo } from "../lib/seo";

// 404 — 없는 공고(notFound())와 잘못된 주소가 모두 여기로 온다.
// 색인하지 않고, 다음 행동을 하나만 준다.
export const metadata: Metadata = pageSeo({
  path: "/404",
  title: "페이지를 찾을 수 없어요",
  description: "요청한 페이지가 없거나 주소가 바뀌었어요.",
  noindex: true
});

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-[560px] flex-col justify-center px-5 py-16">
      <h1 className="text-[22px] font-black tracking-[-0.02em] text-[#191F28]">페이지를 찾을 수 없어요</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-[#4E5968]">
        주소가 바뀌었거나 공고가 내려갔을 수 있어요. 지금 모집 중인 공고를 바로 볼 수 있어요.
      </p>
      <Link
        href="/talent/jobs"
        className="mt-5 inline-flex h-11 w-fit items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white"
      >
        채용 공고 보기
      </Link>
    </main>
  );
}
