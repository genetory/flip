import { OpsTabs } from "../../../components/launch/ops-tabs";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";

// 운영자 영역 공통 셸 — aply.global 사이트 헤더/푸터 + 상단 탭(학생 관리 / 제출물 / 리포트).
export default function LaunchOpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <OpsTabs />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
