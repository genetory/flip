import { TalentPopupProvider } from "../../components/talent/feedback/TalentPopupProvider";

// 파트너 앱 공용 레이아웃 — 확인 팝업 provider(탤런트와 동일 UI) 제공.
export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <TalentPopupProvider>{children}</TalentPopupProvider>;
}
