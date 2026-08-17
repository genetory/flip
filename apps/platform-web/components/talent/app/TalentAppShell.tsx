"use client";

// 로그인 후 Talent 앱 공용 셸 — 가드 + 헤더(GNB 4탭 · 모바일 햄버거) + 콘텐츠 + 개발 스위처.
import { useEffect, type ReactNode } from "react";
import { TalentGuard } from "./TalentGuard";
import { TalentHeader } from "../TalentHeader";
import { AplyFooter } from "../../AplyFooter";
import { DevPersonaSwitcher } from "./DevPersonaSwitcher";
import { useServerNotificationSync } from "../../../lib/talent/server-notification-sync";

export function TalentAppShell({ children, maxWidth = "5xl", wide = false, allowGuest = false }: { children: ReactNode; maxWidth?: "4xl" | "5xl"; wide?: boolean; allowGuest?: boolean }) {
  // 모든 리뉴얼 앱 화면을 이력서 작성 페이지와 동일한 폭(max-w-5xl)으로 통일.
  void maxWidth;
  void wide;
  const widthCls = "max-w-5xl";

  // 서버 알림(지원상태·면접·메시지·새 포지션)을 알림함으로 하이드레이트.
  useServerNotificationSync();

  // GNB 위(상단 오버스크롤) 영역이 회색으로 보이지 않게 최상단 배경을 흰색으로.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.backgroundColor;
    html.style.backgroundColor = "#ffffff";
    return () => {
      html.style.backgroundColor = prev;
    };
  }, []);
  return (
    <TalentGuard allowGuest={allowGuest}>
      <div className="flex min-h-screen flex-col bg-[#FAFBFC]">
        <TalentHeader />
        <main className={`mx-auto w-full flex-1 px-4 pb-16 pt-5 md:px-6 md:pb-12 md:pt-7 ${widthCls}`}>{children}</main>
        <AplyFooter />
        <DevPersonaSwitcher />
      </div>
    </TalentGuard>
  );
}
