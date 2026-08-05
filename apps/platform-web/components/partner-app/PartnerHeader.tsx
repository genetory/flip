"use client";

// 파트너 앱 통합 헤더 — GNB(홈/공고 관리/지원자/회사 프로필) + 로그아웃.
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { List, X, SignOut } from "@phosphor-icons/react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { partnerMainNav, partnerRoutes, isPartnerTabActive } from "../../lib/partner/app-nav";

export function PartnerHeader() {
  const pathname = usePathname() ?? "";
  const { user, logout } = useAuthSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const name = user?.realName || user?.name || "파트너";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#EEF1F5] bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="메뉴"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-2xl text-[#4E5968] transition hover:bg-[#F6F8FB] md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
          </button>
          <Link href={partnerRoutes.home} aria-label="파트너 홈" className="flex items-center gap-2">
            <Image src="/img_logo.webp" alt="" width={72} height={24} className="h-5 w-auto" priority />
            <span className="rounded-md bg-[#EDF1FD] px-1.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">파트너</span>
          </Link>
        </div>

        <nav aria-label="주요 메뉴" className="hidden items-center gap-2.5 md:flex">
          {partnerMainNav.map((item) => {
            const active = isPartnerTabActive(pathname, item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                  active ? "bg-[#EDF1FD] text-[#0B46E8]" : "text-[#4E5968] hover:bg-[#F6F8FB] hover:text-[#191F28]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link href={partnerRoutes.company} className="hidden max-w-[160px] items-center rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] sm:inline-flex">
            <span className="truncate">{name}</span>
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="로그아웃"
            className="flex h-9 w-9 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F6F8FB] hover:text-[#F04452]"
          >
            <SignOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav aria-label="주요 메뉴" className="border-t border-[#EEF1F5] bg-white px-3 py-2 md:hidden">
          <ul className="flex flex-col">
            {partnerMainNav.map((item) => {
              const active = isPartnerTabActive(pathname, item.href);
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center rounded-xl px-3 py-3 text-[15px] font-semibold transition ${
                      active ? "bg-[#EDF1FD] text-[#0B46E8]" : "text-[#4E5968] hover:bg-[#F6F8FB]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
