import type { ReactNode } from "react";
import { TalentPopupProvider } from "../../components/talent/feedback/TalentPopupProvider";

// Talent 영역 공용 레이아웃 — 얇은 패스스루 + Talent 전용 확인 팝업(CIP 스타일).
// 랜딩(/talent, /talent/start)은 각 페이지가 TalentHeader/Footer 를 직접 렌더하고,
// 로그인 후 화면은 각 화면이 TalentAppShell 을 렌더한다. 루트 layout(providers)은 그대로 상속.

export default function TalentLayout({ children }: { children: ReactNode }) {
  return <TalentPopupProvider>{children}</TalentPopupProvider>;
}
