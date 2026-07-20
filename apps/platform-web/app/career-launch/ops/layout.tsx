import "../../dashboard/dashboard.css"; // 운영콘솔과 동일한 ops-* 디자인 시스템(전역 셀렉터 없음)
import "./ops-spacing.css"; // 카드 내부 간격 보정(.launch-ops 로 스코프)
import { OpsSidebar, OpsMobileNav } from "../../../components/launch/ops-nav";
import { OpsTopbar } from "../../../components/launch/ops-shell";

// Career Launch 운영 콘솔 셸.
// 사이트 헤더/푸터/채팅 위젯은 쓰지 않는다 — 어드민 화면에선 순수 노이즈이고
// (GNB·회사정보 푸터·쿠키 배너) 본문 폭까지 좁힌다. 대신 필요한 것만 담은
// 얇은 상단 바 + 사이드바 + 넓은 본문의 전용 셸을 쓴다(운영콘솔과 같은 사고방식).
export default function LaunchOpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="launch-ops flex min-h-screen bg-[var(--ground)]">
      {/* 사이드바 — 자체 스크롤, 화면 높이 고정 */}
      <div className="hidden flex-none border-r border-[var(--line)] bg-[var(--surface)] lg:block">
        <OpsSidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <OpsTopbar />
        <div className="min-w-0 flex-1 px-5 pb-16 md:px-8">
          <OpsMobileNav />
          {/* 운영 콘솔은 데스크톱 설계(.ops-content-section min-width:960px). 좁은 화면에선
              콘텐츠를 찌그러뜨리지 않고 가로 스크롤로 접근하게 한다(콘텐츠가 잘리지 않도록). */}
          <div className="mx-auto w-full max-w-[1400px] overflow-x-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
