"use client";

import "../../dashboard/dashboard.css"; // 운영콘솔과 동일한 ops-* 디자인 시스템(전역 셀렉터 없음)
import "./ops-spacing.css"; // 카드 내부 간격 보정(.launch-ops 로 스코프)
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { OpsSidebar, OpsMobileNav } from "../../../components/launch/ops-nav";
import { OpsTopbar } from "../../../components/launch/ops-shell";

// Career Launch 운영 콘솔 셸.
// 사이트 헤더/푸터/채팅 위젯은 쓰지 않는다 — 어드민 화면에선 순수 노이즈이고
// (GNB·회사정보 푸터·쿠키 배너) 본문 폭까지 좁힌다. 대신 필요한 것만 담은
// 얇은 상단 바 + 사이드바 + 넓은 본문의 전용 셸을 쓴다(운영콘솔과 같은 사고방식).
//
// Phase 16 — 클라측 역할 가드(운영콘솔 layout 과 동일 패턴). 서버는 이미 각 ops API 를
// requireRoles([OPERATOR]) 로 403 하지만, 비운영자가 직접 URL 진입 시 빈/오류 셸이
//렌더되지 않도록 로딩 후 역할을 확인하고 아니면 로그인으로 보낸다.
export default function LaunchOpsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuthSession();
  const allowed = user?.role === "OPERATOR";

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || !allowed) router.replace("/login");
  }, [isReady, isAuthenticated, allowed, router]);

  if (!isReady) {
    return (
      <div className="launch-ops flex h-[100dvh] items-center justify-center bg-[var(--ground)]">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--line)]" />
      </div>
    );
  }
  if (!isAuthenticated || !allowed) return null;

  return (
    <div className="launch-ops flex h-[100dvh] overflow-hidden bg-[var(--ground)]">
      {/* 사이드바 — 화면 높이 고정. 페이지가 아니라 메인 영역만 내부 스크롤한다(운영콘솔과 동일). */}
      <div className="hidden flex-none border-r border-[var(--line)] bg-[var(--surface)] lg:block">
        <OpsSidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 상단바는 데스크톱에선 제거(운영콘솔처럼 사이드바로 통일). 모바일에선 사이드바가
            숨겨지므로 언어·로그아웃 접근을 위해 상단바를 유지한다. */}
        <div className="lg:hidden">
          <OpsTopbar />
        </div>
        <div className="min-w-0 flex-1 overflow-y-auto px-5 pb-16 md:px-8">
          <OpsMobileNav />
          {/* 운영 콘솔은 데스크톱 설계(.ops-content-section min-width:960px). 좁은 화면에선
              콘텐츠를 찌그러뜨리지 않고 가로 스크롤로 접근하게 한다(콘텐츠가 잘리지 않도록). */}
          <div className="mx-auto w-full max-w-[1400px] overflow-x-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
