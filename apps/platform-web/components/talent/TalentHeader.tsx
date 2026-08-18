"use client";

// Talent 통합 헤더.
// 로그인 Talent: GNB 4탭(홈/내 커리어/채용공고/지원) + 프로필 메뉴. (모바일은 하단 내비로 탭 제공)
// 비로그인(랜딩): 로그인 + 무료로 시작하기. Admin 링크는 노출하지 않는다.
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, List, X, Lock } from "@phosphor-icons/react";
import { talentBrand, talentRoutes, useTalentBrandCta } from "../../lib/talent/landing-content";
import { talentMainNav, isTabActive, talentAppRoutes, useTalentNavLabel } from "../../lib/talent/app-nav";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { TalentTicketBadge } from "./TalentTicketBadge";
import { useFollowFeedNotifications, useFollowCompanyPositionNotifications, type FeedAuthor } from "../../lib/talent/social-graph";
import { useUnreadNotificationCount } from "../../lib/talent/notifications";
import { useSavedDeadlineNotifications } from "../../lib/talent/deadline-notify";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { usePlatformT } from "../../lib/i18n";
import { getStoredProfilePhoto, PROFILE_PHOTO_CHANGED_EVENT } from "../../lib/profile-media";

export function TalentHeader() {
  const pathname = usePathname() ?? "";
  const { user, isAuthenticated } = useAuthSession();
  const isTalentUser = isAuthenticated && (user?.role === "STUDENT" || user?.role === "OPERATOR");

  const [menuOpen, setMenuOpen] = useState(false);
  const t = usePlatformT();
  const navLabel = useTalentNavLabel();
  const brandCta = useTalentBrandCta();

  // 경로가 바뀌면 모바일 메뉴 닫기.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const name = user?.realName || user?.name || t("나", "Me", "我", "Tôi", "私", "Saya");

  // 계정 프로필 사진 — 프로필 편집/기본정보와 동일 소스(profileImageUrl → localStorage 폴백).
  // 이력서·자소서에 들어가는 사진(BasicInfo.photoUrl)과는 별개.
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setProfilePhoto(user ? (user.profileImageUrl ?? getStoredProfilePhoto(user.id)) : null);
    read();
    if (typeof window === "undefined") return;
    window.addEventListener(PROFILE_PHOTO_CHANGED_EVENT, read);
    return () => window.removeEventListener(PROFILE_PHOTO_CHANGED_EVENT, read);
  }, [user?.id, user?.profileImageUrl]);
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
          {/* 모바일 햄버거 — 로그아웃 시에도 노출(GNB 그대로). */}
          <button
            type="button"
            aria-label={t("메뉴", "Menu", "菜单", "Menu", "メニュー", "Menu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-2xl text-[#4E5968] transition hover:bg-[#F6F8FB] md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
          </button>
          <Link href={homeHref} aria-label={t(`${talentBrand.name} 홈`, `${talentBrand.name} home`, `${talentBrand.name} 主页`, `Trang chủ ${talentBrand.name}`, `${talentBrand.name} ホーム`, `Beranda ${talentBrand.name}`)} className="flex items-center">
            <Image src="/img_logo.webp" alt={talentBrand.name} width={72} height={24} className="h-5 w-auto" priority />
          </Link>
        </div>

        {/* GNB 탭(데스크톱) — 로그아웃 시에도 그대로 노출. 로그인 필요한 탭은 클릭 시
            가드가 /login?next= 로 유도(로그인 필요 표시). */}
        <nav aria-label={t("주요 메뉴", "Main menu", "主菜单", "Menu chính", "メインメニュー", "Menu utama")} className="hidden items-center gap-2.5 md:flex">
          {talentMainNav.map((item) => {
            const active = isTabActive(pathname, item.href);
            const gated = !isTalentUser && !item.guest; // 게스트 공개 탭(포지션·가이드)은 잠금 없음
            return (
              <Link
                key={item.key}
                href={gated ? `${talentRoutes.login}?next=${encodeURIComponent(item.href)}` : item.href}
                aria-current={active ? "page" : undefined}
                title={gated ? t("로그인이 필요해요", "Login required", "需要登录", "Cần đăng nhập", "ログインが必要です", "Perlu masuk") : undefined}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                  gated ? "text-[#B0B8C1] hover:bg-[#F6F8FB]" : active ? "bg-[#EDF1FD] text-[#0B46E8]" : "text-[#4E5968] hover:bg-[#F6F8FB] hover:text-[#191F28]"
                }`}
              >
                {navLabel(item.key)}
                {gated ? <Lock className="h-3 w-3 text-[#B0B8C1]" weight="fill" aria-hidden /> : null}
              </Link>
            );
          })}
        </nav>

        {/* 우측 */}
        {isTalentUser ? (
          <div className="flex items-center gap-1.5">
            {/* AI 티켓 잔액 — 학생만(포인트는 탤런트 전용) */}
            {user?.role === "STUDENT" ? <TalentTicketBadge /> : null}
            {/* 알림 */}
            <Link
              href={talentAppRoutes.notifications}
              aria-label={unreadCount > 0 ? t(`알림 ${unreadCount}개`, `${unreadCount} notifications`, `${unreadCount} 条通知`, `${unreadCount} thông báo`, `通知 ${unreadCount}件`, `${unreadCount} notifikasi`) : t("알림", "Notifications", "通知", "Thông báo", "通知", "Notifikasi")}
              className="relative flex h-9 w-9 items-center justify-center rounded-2xl text-[#4E5968] transition hover:bg-[#F6F8FB]"
            >
              <Bell className="h-[22px] w-[22px]" weight="regular" />
              {unreadCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F04452] px-1 text-[10px] font-bold leading-none text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>

            {/* 프로필 — 정방형 아바타(사진 없으면 이름 첫 글자). 닉네임이 길어도 GNB 간격 유지 */}
            <Link
              href={talentAppRoutes.settings}
              aria-label={t("내 프로필", "My profile", "我的资料", "Hồ sơ của tôi", "マイプロフィール", "Profil saya")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition hover:bg-[#F6F8FB]"
            >
              <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#F2F4F6] text-[12px] font-bold text-[#4E5968]">
                {profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profilePhoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span aria-hidden>{name.charAt(0).toUpperCase()}</span>
                )}
              </span>
            </Link>
            <LanguageSwitcher />
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Link href={talentRoutes.login} className="rounded-lg px-3 py-2 text-[13.5px] font-semibold text-[#4E5968] transition hover:text-[#191F28]">
              {brandCta.login}
            </Link>
            <LanguageSwitcher />
          </div>
        )}
      </div>

      {/* 모바일 메뉴(햄버거) — 로그아웃 시에도 노출, 로그인 필요 탭은 잠금 표시 + 로그인으로 유도 */}
      {menuOpen ? (
        <nav aria-label={t("주요 메뉴", "Main menu", "主菜单", "Menu chính", "メインメニュー", "Menu utama")} className="border-t border-[#EEF1F5] bg-white px-3 py-2 md:hidden">
          <ul className="flex flex-col">
            {talentMainNav.map((item) => {
              const active = isTabActive(pathname, item.href);
              const Icon = item.icon;
              const gated = !isTalentUser && !item.guest;
              return (
                <li key={item.key}>
                  <Link
                    href={gated ? `${talentRoutes.login}?next=${encodeURIComponent(item.href)}` : item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition ${
                      gated ? "text-[#B0B8C1] hover:bg-[#F6F8FB]" : active ? "bg-[#EDF1FD] text-[#0B46E8]" : "text-[#4E5968] hover:bg-[#F6F8FB]"
                    }`}
                  >
                    <Icon className="h-5 w-5" weight={active ? "fill" : "regular"} />
                    <span className="flex-1">{navLabel(item.key)}</span>
                    {gated ? <Lock className="h-3.5 w-3.5 text-[#B0B8C1]" weight="fill" aria-hidden /> : null}
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
