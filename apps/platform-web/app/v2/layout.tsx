import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./v2.css";
import { TalentPopupProvider } from "../../components/talent/feedback/TalentPopupProvider";

// 리뉴얼 v2 — 기존 talent 화면(app/talent, components/talent)과 완전히 따로 만든다.
// 열리는 곳: 스테이징·로컬만(middleware 에서 프로덕션은 404). 검색엔진에는 노출하지 않는다.
// 화면이 준비되면 기존 경로를 하나씩 이쪽으로 바꾸고, 마지막에 옛 파일을 지운다.
export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

// 기존 팝업(모의 면접·지원 현황 등)을 그대로 쓰므로 talent 와 같은 확인 팝업 공급자를 둔다.
export default function V2Layout({ children }: { children: ReactNode }) {
  return <TalentPopupProvider>{children}</TalentPopupProvider>;
}
