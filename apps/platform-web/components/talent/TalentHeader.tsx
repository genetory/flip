"use client";

// Talent 통합 헤더.
// 로그인 Talent: GNB 4탭(홈/내 커리어/채용공고/지원) + 프로필 메뉴. (모바일은 하단 내비로 탭 제공)
// 비로그인(랜딩): 로그인 + 무료로 시작하기. Admin 링크는 노출하지 않는다.
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, List, X } from "@phosphor-icons/react";
import { talentBrand, talentRoutes } from "../../lib/talent/landing-content";
import { talentMainNav, isTabActive, talentAppRoutes } from "../../lib/talent/app-nav";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { TalentTicketBadge } from "./TalentTicketBadge";
import { useFollowFeedNotifications, useFollowCompanyPositionNotifications, type FeedAuthor } from "../../lib/talent/social-graph";
import { useUnreadNotificationCount } from "../../lib/talent/notifications";
import { useSavedDeadlineNotifications } from "../../lib/talent/deadline-notify";

export function TalentHeader() {
  const pathname = usePathname() ?? "";
  const { user, isAuthenticated } = useAuthSession();
  const isTalentUser = isAuthenticated && (user?.role === "STUDENT" || user?.role === "OPERATOR");

  const [menuOpen, setMenuOpen] = useState(false);

  // 경로가 바뀌면 모바일 메뉴 닫기.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const name = user?.realName || user?.name || "나";
  const homeHref = isTalentUser ? talentAppRoutes.home : "/talent";

  // 팔로잉한 사람의 새 글을 알림으로 적재(백그라운드 감시) + 벨 배지 카운트.
  const meAuthor: FeedAuthor | null = isTalentUser ? { name, role: user?.role === "OPERATOR" ? "OPERATOR" : "STUDENT" } : null;
  useFollowFeedNotifications(meAuthor);
  useFollowCompanyPositionNotifications();
  useSavedDeadlineNotifications();
  const unreadCount = useUnreadNotificationCount();

  return (
    <header className="sticky top-0 z-40 border-b border-[#EEF1F5] bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <div className="flex items-center gap-1.5">
          {/* 모바일 햄버거 */}
          {isTalentUser ? (
            <button
              type="button"
              aria-label="메뉴"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-2xl text-[#4E5968] transition hover:bg-[#F6F8FB] md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
            </button>
          ) : null}
          <Link href={homeHref} aria-label={`${talentBrand.name} 홈`} className="flex items-center">
            <Image src="/img_logo.webp" alt={talentBrand.name} width={72} height={24} className="h-5 w-auto" priority />
          </Link>
        </div>

        {/* 로그인 Talent: GNB 4탭(데스크톱) */}
        {isTalentUser ? (
          <nav aria-label="주요 메뉴" className="hidden items-center gap-2.5 md:flex">
            {talentMainNav.map((item) => {
              const active = isTabActive(pathname, item.href);
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

        {/* 우측 */}
        {isTalentUser ? (
          <div className="flex items-center gap-1.5">
            {/* AI 티켓 잔액 — 학생만(포인트는 탤런트 전용) */}
            {user?.role === "STUDENT" ? <TalentTicketBadge /> : null}
            {/* 알림 */}
            <Link
              href={talentAppRoutes.notifications}
              aria-label={unreadCount > 0 ? `알림 ${unreadCount}개` : "알림"}
              className="relative flex h-9 w-9 items-center justify-center rounded-2xl text-[#4E5968] transition hover:bg-[#F6F8FB]"
            >
              <Bell className="h-[22px] w-[22px]" weight="regular" />
              {unreadCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F04452] px-1 text-[10px] font-bold leading-none text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>

            {/* 프로필 — 클릭 시 팝업 없이 내 프로필(계정 설정)로 이동 */}
            <Link
              href={talentAppRoutes.settings}
              aria-label="내 프로필"
              className="inline-flex max-w-[140px] items-center rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]"
            >
              <span className="truncate">{name}</span>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Link href={talentRoutes.login} className="rounded-lg px-3 py-2 text-[13.5px] font-semibold text-[#4E5968] transition hover:text-[#191F28]">
              {talentBrand.cta.login}
            </Link>
          </div>
        )}
      </div>

      {/* 모바일 메뉴(햄버거) */}
      {isTalentUser && menuOpen ? (
        <nav aria-label="주요 메뉴" className="border-t border-[#EEF1F5] bg-white px-3 py-2 md:hidden">
          <ul className="flex flex-col">
            {talentMainNav.map((item) => {
              const active = isTabActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition ${
                      active ? "bg-[#EDF1FD] text-[#0B46E8]" : "text-[#4E5968] hover:bg-[#F6F8FB]"
                    }`}
                  >
                    <Icon className="h-5 w-5" weight={active ? "fill" : "regular"} />
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
