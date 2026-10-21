"use client";

// 파트너 앱 통합 헤더 — 탤런트 v2 헤더와 같은 모양(흰 바탕 · 16px 글자 탭 · 휴대폰은 가로로 넘기는 한 줄).
// 메뉴: 홈 / 인재 검색 / 공고 관리 / 지원자 관리 / 채용 진행 / 회사 프로필. 게스트는 잠금 탭 + 로그인.
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bell, Lock } from "@phosphor-icons/react";
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
  const { user, isAuthenticated, isReady } = useAuthSession();
  // 게스트(마스킹 인재검색 열람 등)는 로그인 버튼 + 잠금 탭. 로그인 파트너는 알림·프로필.
  const isPartnerUser = isAuthenticated && (user?.role === "PARTNER" || user?.role === "OPERATOR");
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
    if (!isPartnerUser) return; // 게스트는 알림 조회 안 함
    // 경로가 바뀔 때마다 안 읽음 카운트 갱신(알림함 방문 후 읽음 반영).
    void getMyNotifications(1)
      .then(({ unreadCount }) => setUnread(unreadCount))
      .catch(() => {});
  }, [pathname, isPartnerUser]);

  const navLinks = (mobile: boolean) =>
    partnerMainNav.map((item) => {
      const active = isPartnerTabActive(pathname, item.href);
      const gated = !isPartnerUser && !item.guest;
      const tone = gated
        ? "font-medium text-[color:var(--v2-disabled)]"
        : active
          ? "font-bold text-[color:var(--v2-ink)]"
          : `font-medium text-[color:var(--v2-faint)] ${mobile ? "" : "hover:bg-[color:var(--v2-band)] hover:text-[color:var(--v2-ink-3)]"}`;
      return (
        <Link
          key={item.key}
          href={gated ? `/partner/login?next=${encodeURIComponent(item.href)}` : item.href}
          aria-current={active ? "page" : undefined}
          title={gated ? t("로그인이 필요해요", "Login required", "需要登录", "Cần đăng nhập", "ログインが必要です", "Perlu masuk") : undefined}
          className={`inline-flex shrink-0 items-center gap-1 text-[16px] transition ${mobile ? "py-3" : "rounded-xl px-3.5 py-2"} ${tone}`}
        >
          {navLabel(item.key)}
          {gated ? <Lock className="h-3 w-3" weight="fill" aria-hidden /> : null}
        </Link>
      );
    });

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--v2-band)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1080px] items-center gap-4 px-5 lg:gap-6">
        <Link href={isPartnerUser ? partnerRoutes.home : "/partner"} aria-label={t("파트너 홈", "Partner home", "合作伙伴主页", "Trang chủ đối tác", "パートナーホーム", "Beranda partner")} className="flex shrink-0 items-center gap-2">
          <Image src="/img_logo.webp" alt="Aply" width={96} height={30} className="h-6 w-auto md:h-7" priority />
          <span className="rounded-full bg-[color:var(--v2-accent-weak)] px-2.5 py-1 text-[12px] font-bold leading-none text-[color:var(--v2-accent)]">{t("파트너", "Partner", "合作伙伴", "Đối tác", "パートナー", "Partner")}</span>
        </Link>
        <nav aria-label={t("주요 메뉴", "Main menu", "主菜单", "Menu chính", "メインメニュー", "Menu utama")} className="hidden flex-1 items-center gap-1 lg:flex">
          {navLinks(false)}
        </nav>

        {/* 오른쪽 — 알림 · 프로필 사진 · 언어(맨 끝). 탤런트 v2 와 같은 40px 칸. */}
        <div className="ml-auto flex items-center gap-1">
          {!isReady ? (
            <>
              <span aria-hidden className="mx-2 block h-6 w-6 animate-pulse rounded-full bg-[color:var(--v2-band)]" />
              <span aria-hidden className="mx-2 block h-7 w-7 animate-pulse rounded-full bg-[color:var(--v2-band)]" />
            </>
          ) : isPartnerUser ? (
            <>
              <Link
                href={partnerRoutes.notifications}
                aria-label={unread > 0 ? t(`알림 ${unread}개`, `${unread} notifications`, `${unread} 条通知`, `${unread} thông báo`, `通知 ${unread}件`, `${unread} notifikasi`) : t("알림", "Notifications", "通知", "Thông báo", "通知", "Notifikasi")}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-band)]"
              >
                <Bell className="h-6 w-6" />
                {unread > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--v2-attention)] px-1 text-[10px] font-bold leading-none text-white">{unread > 9 ? "9+" : unread}</span>
                ) : null}
              </Link>
              <Link
                href={partnerRoutes.settings}
                aria-label={t("내 프로필", "My profile", "我的资料", "Hồ sơ của tôi", "マイプロフィール", "Profil saya")}
                title={name || undefined}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-[color:var(--v2-band)]"
              >
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[color:var(--v2-band)] text-[12px] font-bold text-[color:var(--v2-ink-3)]">
                  {profilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 계정 사진은 data URL·외부 주소가 섞여 next/image 로 못 받는다.
                    <img src={profilePhoto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span aria-hidden>{name.charAt(0).toUpperCase()}</span>
                  )}
                </span>
              </Link>
            </>
          ) : (
            <Link href="/partner/login" className="mr-1 inline-flex h-9 items-center justify-center rounded-lg bg-[color:var(--v2-accent)] px-3.5 text-[14px] font-semibold text-white transition hover:opacity-90">
              {t("로그인", "Sign in", "登录", "Đăng nhập", "ログイン", "Masuk")}
            </Link>
          )}
          <LanguageSwitcher size="lg" />
        </div>
      </div>
      {/* 휴대폰·좁은 화면 — 메뉴를 숨기지 않고 가로로 넘기는 한 줄 */}
      <nav aria-label={t("주요 메뉴", "Main menu", "主菜单", "Menu chính", "メインメニュー", "Menu utama")} className="flex gap-6 overflow-x-auto px-5 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
        {navLinks(true)}
      </nav>
    </header>
  );
}
