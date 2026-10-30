import type { ReactNode } from "react";
import "../v2/v2.css";
import { TalentPopupProvider } from "../../components/talent/feedback/TalentPopupProvider";

// /premium 은 v2(aply.global) 셸·글꼴·색을 그대로 쓴다 — v2 레이아웃과 같은 팝업 공급자만 둔다.
export default function PremiumLayout({ children }: { children: ReactNode }) {
  return <TalentPopupProvider>{children}</TalentPopupProvider>;
}
