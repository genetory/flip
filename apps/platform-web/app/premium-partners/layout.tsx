import type { ReactNode } from "react";
import "../v2/v2.css";
import "../premium/premium.css";
import { TalentPopupProvider } from "../../components/talent/feedback/TalentPopupProvider";

// /premium-partners — /premium 과 같은 어두운 한 장 페이지(상단 메뉴·광고 없음, SidebarAds 제외 목록).
export default function PremiumPartnersLayout({ children }: { children: ReactNode }) {
  return <TalentPopupProvider>{children}</TalentPopupProvider>;
}
