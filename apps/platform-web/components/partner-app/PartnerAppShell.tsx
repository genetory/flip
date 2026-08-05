"use client";

// 파트너 앱 공용 셸 — 가드 + 헤더 + 콘텐츠.
import { useEffect, type ReactNode } from "react";
import { PartnerGuard } from "./PartnerGuard";
import { PartnerHeader } from "./PartnerHeader";

export function PartnerAppShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.backgroundColor;
    html.style.backgroundColor = "#ffffff";
    return () => {
      html.style.backgroundColor = prev;
    };
  }, []);
  return (
    <PartnerGuard>
      <div className="flex min-h-screen flex-col bg-[#FAFBFC]">
        <PartnerHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-5 md:px-6 md:pb-12 md:pt-7">{children}</main>
      </div>
    </PartnerGuard>
  );
}
