import { TalentPopupProvider } from "../../components/talent/feedback/TalentPopupProvider";
// 파트너 앱도 탤런트 v2 와 같은 색·글자 체계 — .v2 아래에서 --v2-* 토큰이 풀린다(로그인·가입·초대 화면 포함).
import "../v2/v2.css";

// 파트너 앱 공용 레이아웃 — 확인 팝업 provider(탤런트와 동일 UI) + v2 테마 범위.
export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <TalentPopupProvider>
      <div className="v2">{children}</div>
    </TalentPopupProvider>
  );
}
