import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./v2.css";
import { TalentPopupProvider } from "../../components/talent/feedback/TalentPopupProvider";
import { PointsConfirmHost, PointsPaywallHost } from "../../components/v2/ai-points";

// 리뉴얼 v2 — 기존 talent 화면(app/talent, components/talent)과 완전히 따로 만든다.
// 2026-10-25 부터 프로덕션에서도 /talent/* 주소로 이 화면이 나간다(middleware rewrite).
// 기본은 noindex — 공개 페이지(공고 목록·상세, 가이드)는 각 page 의 metadata(pageSeo)가 index 로 덮는다.
export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

// 기존 팝업(모의 면접·지원 현황 등)을 그대로 쓰므로 talent 와 같은 확인 팝업 공급자를 둔다.
export default function V2Layout({ children }: { children: ReactNode }) {
  // AI 포인트 충전 시트 — 셸이 없는 전체 화면(이력서·자소서 에디터)에서도 열리도록 레이아웃에 하나.
  return (
    <TalentPopupProvider>
      {children}
      <PointsPaywallHost />
      <PointsConfirmHost />
    </TalentPopupProvider>
  );
}
