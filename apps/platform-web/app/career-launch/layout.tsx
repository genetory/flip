import type { Metadata } from "next";
import { pageSeo } from "../../lib/seo";
import { CareerContentProvider } from "../../components/launch/content-provider";
import { ProgramGate } from "../../components/launch/program-gate";
import { LaunchHtmlBg } from "../../components/launch/LaunchHtmlBg";

// 공개 랜딩(/career-launch)의 canonical·OG 를 여기서 선언한다. 하위 프로그램 화면은
// 로그인·수강 등록이 필요한 개인화 화면이라 각자 noindex 를 선언한다(app/career-launch/*).
export const metadata: Metadata = pageSeo({
  path: "/career-launch",
  title: "Career Launch — 4주 취업 준비 프로그램",
  description:
    "4주 동안 강점 발견부터 이력서·자기소개서·모의면접까지. 매주 미션을 끝내고 기업 제출용 프로필을 완성하세요."
});

// 런치 서브도메인 전용 셸 — 모바일 우선, 밝은 배경.
export default function LaunchLayout({ children }: { children: React.ReactNode }) {
  return (
    <CareerContentProvider>
      <LaunchHtmlBg />
      <div className="min-h-screen bg-[#F6F8FB] text-[#191F28]">
        <ProgramGate>{children}</ProgramGate>
      </div>
    </CareerContentProvider>
  );
}
