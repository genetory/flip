import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { PartnerAdminTwoColumn } from "../../../components/partner/PartnerAdminTwoColumn";

export default function PartnerSettingsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="container py-10 md:py-14">
        <PartnerAdminTwoColumn>
          <div className="space-y-4">
            <h1 className="font-display text-2xl font-black tracking-[-0.02em] text-foreground md:text-3xl">설정</h1>
            <p className="text-sm text-muted-foreground">담당자/알림 설정 페이지입니다. (추가 구현 예정)</p>
          </div>
        </PartnerAdminTwoColumn>
      </main>
      <Footer />
    </div>
  );
}
