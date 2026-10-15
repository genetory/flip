import { CareerContentProvider } from "../../components/launch/content-provider";
import { ProgramGate } from "../../components/launch/program-gate";
import { LaunchHtmlBg } from "../../components/launch/LaunchHtmlBg";
// v2(흰 바탕 토스 스타일) 공통 색 — .v2 아래에서만 풀린다(ProgramGate 가 학생 화면을 .v2 로 감싼다).
import "../v2/v2.css";
// globals.css 의 cl-* 학생 화면 디자인을 .v2 아래에서 v2 톤으로 덮는다(운영 콘솔 영향 없음).
import "./launch-v2.css";

// ⚠️ 여기에 metadata 를 두면 canonical 이 하위 전체(/career-launch/dashboard 등)로 상속된다.
// 공개 랜딩의 metadata 는 app/career-launch/page.tsx 가 직접 선언한다.

// 런치 서브도메인 전용 셸 — 모바일 우선. 학생 화면은 ProgramGate 의 .v2 가 흰 바탕을 덮고,
// 운영 콘솔은 기존 배경 그대로(자체 디자인 시스템).
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
