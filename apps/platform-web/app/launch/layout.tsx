import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "APLY Global Career Launch — 4주 취업 준비 프로그램",
  description: "외국인 유학생을 위한 4주 한국 취업 준비 프로그램. 매주 미션을 수행하고 기업 제출용 Global Talent Profile을 완성하세요."
};

// 런치 서브도메인 전용 셸 — 모바일 우선, 밝은 배경.
export default function LaunchLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#F6F8FB] text-[#191F28]">{children}</div>;
}
