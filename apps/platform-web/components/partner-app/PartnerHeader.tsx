"use client";

// 파트너 앱 통합 헤더 — GNB(홈/공고 관리/지원자/회사 프로필) + 로그아웃.
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { List, X, Bell } from "@phosphor-icons/react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { partnerMainNav, partnerRoutes, isPartnerTabActive, usePartnerNavLabel } from "../../lib/partner/app-nav";
import { getMyNotifications } from "../../lib/member-profile-client";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { usePlatformT } from "../../lib/i18n";
import { getStoredProfilePhoto, PROFILE_PHOTO_CHANGED_EVENT } from "../../lib/profile-media";

export function PartnerHeader() {
  const t = usePlatformT();
  const navLabel = usePartnerNavLabel();
  const pathname = usePathname() ?? "";
  const { user } = useAuthSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const name = user?.realName || user?.name || t("파트너", "Partner", "合作伙伴", "Đối tác", "パートナー", "Partner");

  // 계정 프로필 사진 — 프로필 편집/기본정보와 동일 소스. 이력서 사진과는 별개.
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setProfilePhoto(user ? (user.profileImageUrl ?? getStoredProfilePhoto(user.id)) : null);
    read();
    if (typeof window === "undefined") return;
    window.addEventListener(PROFILE_PHOTO_CHANGED_EVENT, read);
    return () => window.removeEventListener(PROFILE_PHOTO_CHANGED_EVENT, read);
  }, [user?.id, user?.profileImageUrl]);

  useEffect(() => {
    setMenuOpen(false);
    // 경로가 바뀔 때마다 안 읽음 카운트 갱신(알림함 방문 후 읽음 반영).
    void getMyNotifications(1)
      .then(({ unreadCount }) => setUnread(unreadCount))
      .catch(() => {});
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#EEF1F5] bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={t("메뉴", "Menu", "菜单", "Menu", "メニュー", "Menu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-2xl text-[#4E5968] transition hover:bg-[#F6F8FB] md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
          </button>
          <Link href={partnerRoutes.home} aria-label={t("파트너 홈", "Partner home", "合作伙伴主页", "Trang chủ đối tác", "パートナーホーム", "Beranda partner")} className="flex items-center gap-2">
            <Image src="/img_logo.webp" alt="" width={72} height={24} className="h-5 w-auto" priority />
            <span className="rounded-md bg-[#EDF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">{t("파트너", "Partner", "合作伙伴", "Đối tác", "パートナー", "Partner")}</span>
          </Link>
        </div>

        <nav aria-label={t("주요 메뉴", "Main menu", "主菜单", "Menu chính", "メインメニュー", "Menu utama")} className="hidden items-center gap-2.5 md:flex">
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
                {navLabel(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href={partnerRoutes.notifications}
            aria-label={unread > 0 ? t(`알림 ${unread}개`, `${unread} notifications`, `${unread} 条通知`, `${unread} thông báo`, `通知 ${unread}件`, `${unread} notifikasi`) : t("알림", "Notifications", "通知", "Thông báo", "通知", "Notifikasi")}
            className="relative flex h-9 w-9 items-center justify-center rounded-2xl text-[#4E5968] transition hover:bg-[#F6F8FB]"
          >
            <Bell className="h-[22px] w-[22px]" weight="regular" />
            {unread > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F04452] px-1 text-[10px] font-bold leading-none text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Link>
          {/* 프로필 — 정방형 아바타(사진 없으면 이름 첫 글자). 닉네임 길이와 무관하게 GNB 간격 유지 */}
          <Link href={partnerRoutes.settings} aria-label={t("내 프로필", "My profile", "我的资料", "Hồ sơ của tôi", "マイプロフィール", "Profil saya")} className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#F2F4F6] text-[13.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">
            {profilePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profilePhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden>{name.charAt(0).toUpperCase()}</span>
            )}
          </Link>
          <LanguageSwitcher />
        </div>
      </div>

      {menuOpen ? (
        <nav aria-label={t("주요 메뉴", "Main menu", "主菜单", "Menu chính", "メインメニュー", "Menu utama")} className="border-t border-[#EEF1F5] bg-white px-3 py-2 md:hidden">
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
                    {navLabel(item.key)}
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
