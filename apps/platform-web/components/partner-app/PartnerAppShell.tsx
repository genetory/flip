"use client";

// 파트너 앱 공용 셸 — 가드 + 헤더 + 콘텐츠. 탤런트 v2 와 같은 흰 바탕(색 토큰은 app/partner/layout 의 .v2).
import { useEffect, type ReactNode } from "react";
import { PartnerGuard } from "./PartnerGuard";
import { PartnerHeader } from "./PartnerHeader";
import { AplyFooter } from "../AplyFooter";

export function PartnerAppShell({ children, allowGuest = false }: { children: ReactNode; allowGuest?: boolean }) {
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.backgroundColor;
    html.style.backgroundColor = "#ffffff";
    return () => {
      html.style.backgroundColor = prev;
    };
  }, []);
  return (
    <PartnerGuard allowGuest={allowGuest}>
      <div className="flex min-h-screen flex-col bg-[color:var(--v2-bg)]">
        <PartnerHeader />
        <main className="mx-auto w-full max-w-[1080px] flex-1 px-5 pb-20 pt-6 md:pt-10">{children}</main>
        <AplyFooter />
      </div>
    </PartnerGuard>
  );
}
