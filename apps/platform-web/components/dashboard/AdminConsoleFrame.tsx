"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { List } from "@phosphor-icons/react";

// 운영콘솔·파트너 어드민 공용 셸.
// 데스크톱: 기존 .ops-console-shell(사이드바 + 본문) 그대로.
// 모바일(<=1024px): 사이드바는 슬라이드 드로어가 되고, 본문 상단바의 햄버거로 연다.
export function AdminConsoleFrame({
  title,
  mainClassName,
  renderSidebar,
  children
}: {
  title: string;
  mainClassName: string;
  // open 상태를 사이드바에 전달해 .is-open 클래스를 붙인다.
  renderSidebar: (open: boolean) => ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 경로가 바뀌면(메뉴 이동) 드로어를 닫는다.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <main className="ops-console-shell">
      {renderSidebar(open)}
      <div
        className={`ops-console-scrim${open ? " is-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div className={mainClassName}>
        <div className="ops-mobile-topbar">
          <button
            type="button"
            className="ops-mobile-topbar-btn"
            onClick={() => setOpen(true)}
            aria-label="메뉴 열기"
          >
            <List size={20} weight="bold" aria-hidden />
          </button>
          <span className="ops-mobile-topbar-title">{title}</span>
        </div>
        {children}
      </div>
    </main>
  );
}
