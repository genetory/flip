import type { ReactNode } from "react";
import "../v2/v2.css";
import "./premium.css";
import { TalentPopupProvider } from "../../components/talent/feedback/TalentPopupProvider";

// /premium 은 v2(aply.global) 글꼴·조각을 쓰되 상단 메뉴 없이 어두운 바탕(premium.css). 광고도 띄우지 않는다(SidebarAds 제외 목록).
export default function PremiumLayout({ children }: { children: ReactNode }) {
  return <TalentPopupProvider>{children}</TalentPopupProvider>;
}
