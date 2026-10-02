import type { Metadata } from "next";
import { pageSeo } from "../../../lib/seo";

// 로그인·초대코드 화면 — 검색 색인 대상이 아니다(공개 소개는 /career-launch).
export const metadata: Metadata = pageSeo({
  path: "/career-launch/start",
  title: "Career Launch 시작하기",
  description: "로그인하거나 초대코드를 입력해 Career Launch 를 시작하세요.",
  noindex: true
});

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
