"use client";

// Career Launch 전용 GNB — partner/talent 헤더와 동일한 결(흰 배경·로고+배지 좌측,
// 중앙 주차/결과물 네비, 우측 알림·프로필). 모바일은 햄버거 메뉴.
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLaunchT } from "../../lib/launch/i18n";
import { LaunchNotificationBell } from "./LaunchNotificationBell";

export function CareerLaunchHeader() {
  const t = useLaunchT();
  const { user } = useAuthSession();
  const pathname = usePathname() ?? "";
  const [menuOpen, setMenuOpen] = useState(false);

  // 경로 바뀌면 모바일 메뉴 닫기.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const name = user?.name?.trim() || user?.email || t("학생", "Student", "学生", "Sinh viên", "学生", "Siswa");

  const nav = [
    { key: "home", href: "/career-launch/dashboard", label: t("홈", "Home", "首页", "Trang chủ", "ホーム", "Beranda") },
    { key: "w1", href: "/career-launch/week/1", label: t("1주차", "Week 1", "第1周", "Tuần 1", "1週目", "Minggu 1") },
    { key: "w2", href: "/career-launch/week/2", label: t("2주차", "Week 2", "第2周", "Tuần 2", "2週目", "Minggu 2") },
    { key: "w3", href: "/career-launch/week/3", label: t("3주차", "Week 3", "第3周", "Tuần 3", "3週目", "Minggu 3") },
    { key: "w4", href: "/career-launch/week/4", label: t("4주차", "Week 4", "第4周", "Tuần 4", "4週目", "Minggu 4") },
    { key: "deliverables", href: "/career-launch/dashboard#deliverables", label: t("결과물", "Deliverables", "成果", "Kết quả", "成果物", "Hasil") }
  ];
  const isActive = (href: string) => !href.includes("#") && pathname === href;

  return (
    <header className="sticky top-0 z-40 border-b border-[#EEF1F5] bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <div className="flex items-center gap-1.5">
          {/* 모바일 햄버거 */}
          {user ? (
            <button
              type="button"
              aria-label={t("메뉴", "Menu", "菜单", "Menu", "メニュー", "Menu")}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-2xl text-[#4E5968] transition hover:bg-[#F6F8FB] md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
            </button>
          ) : null}
          <Link href="/career-launch/dashboard" aria-label="Career Launch" className="flex items-center gap-2">
            <Image src="/img_logo.webp" alt="" width={72} height={24} className="h-5 w-auto" priority />
            <span className="hidden rounded-md bg-[#EDF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8] sm:inline">Career Launch</span>
          </Link>
        </div>

        {/* 중앙 네비(데스크톱) — 주차 + 결과물 */}
        {user ? (
          <nav aria-label={t("주요 메뉴", "Main menu", "主菜单", "Menu chính", "メインメニュー", "Menu utama")} className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const active = isActive(item.href);
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
        ) : null}

        {user ? (
          <div className="flex items-center gap-1.5">
            <LaunchNotificationBell />
            <Link
              href="/career-launch/settings"
              aria-label={t("내 설정", "My settings", "我的设置", "Cài đặt của tôi", "設定", "Pengaturan")}
              className="inline-flex max-w-[128px] items-center rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]"
            >
              <span className="truncate">{name}</span>
            </Link>
          </div>
        ) : null}
      </div>

      {/* 모바일 메뉴(햄버거) */}
      {user && menuOpen ? (
        <nav aria-label={t("주요 메뉴", "Main menu", "主菜单", "Menu chính", "メインメニュー", "Menu utama")} className="border-t border-[#EEF1F5] bg-white px-3 py-2 md:hidden">
          <ul className="flex flex-col">
            {nav.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
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
