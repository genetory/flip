import { CareerContentProvider } from "../../components/launch/content-provider";
import { ProgramGate } from "../../components/launch/program-gate";
import { LaunchHtmlBg } from "../../components/launch/LaunchHtmlBg";

// ⚠️ 여기에 metadata 를 두면 canonical 이 하위 전체(/career-launch/dashboard 등)로 상속된다.
// 공개 랜딩의 metadata 는 app/career-launch/page.tsx 가 직접 선언한다.

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
