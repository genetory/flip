import "../../dashboard/dashboard.css"; // 운영콘솔과 동일한 ops-* 디자인 시스템(전역 셀렉터 없음 — 사이트 셸과 충돌 X)
import { OpsSidebar, OpsMobileNav } from "../../../components/launch/ops-nav";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";

// 운영자 영역 공통 셸 — 사이트 헤더/푸터 + 사이드바 네비(데스크탑) / 가로 탭(모바일).
// 컨테이너를 레이아웃이 소유하므로 각 페이지는 자체 컨테이너 없이 콘텐츠만 렌더한다.
export default function LaunchOpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="lg:flex lg:gap-8">
            <OpsSidebar />
            <div className="min-w-0 flex-1">
              <OpsMobileNav />
              {children}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
