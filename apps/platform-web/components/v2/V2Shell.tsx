"use client";

// 리뉴얼 v2 셸 — 상단 메뉴(글자 탭) + 본문 + 바닥글. 기존 TalentHeader 와 따로 간다.
// 메뉴는 PC 에선 로고 옆 한 줄, 모바일에선 로고 아래 가로로 넘기는 한 줄(햄버거 없이 바로 보이게).
// 로그인이 필요한 화면은 requireAuth — 게스트에겐 같은 톤의 안내만 보여 준다.
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Bell } from "@phosphor-icons/react";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { getStoredProfilePhoto, PROFILE_PHOTO_CHANGED_EVENT } from "../../lib/profile-media";
import { useUnreadNotificationCount } from "../../lib/talent/notifications";
import { useServerNotificationSync } from "../../lib/talent/server-notification-sync";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { AnnouncementBanner } from "../announcements/AnnouncementBanner";
import { InterviewPaywallHost } from "./interview-paywall";
import { AplyFooter } from "../AplyFooter";
import { usePlatformT } from "../../lib/i18n";
import { Actions, Button, Masthead, Page, PageSkeleton, PrimaryButton, SecondaryButton } from "./ui";

export const V2_ROUTES = {
  home: "/talent/home",
  career: "/talent/career",
  jobs: "/talent/jobs",
  interviews: "/talent/career/interviews",
  applications: "/talent/applications",
  guide: "/talent/insights"
} as const;

function useNav() {
  const t = usePlatformT();
  const { isAuthenticated } = useAuthSession();
  return [
    { href: V2_ROUTES.home, label: t("홈", "Home", "首页", "Trang chủ", "ホーム", "Beranda") },
    { href: V2_ROUTES.career, label: t("내 커리어", "Career", "我的职业", "Sự nghiệp", "キャリア", "Karier") },
    { href: V2_ROUTES.jobs, label: t("포지션 탐색", "Jobs", "职位", "Việc làm", "求人", "Lowongan") },
    { href: V2_ROUTES.interviews, label: t("모의 면접", "Interview", "模拟面试", "Phỏng vấn", "模擬面接", "Wawancara") },
    // 지원 현황은 내 지원만 보여 주는 곳 — 로그인 전엔 메뉴에서 뺀다(주소로 들어오면 '로그인이 필요해요').
    ...(isAuthenticated ? [{ href: V2_ROUTES.applications, label: t("지원 현황", "Applied", "申请", "Ứng tuyển", "応募", "Lamaran") }] : []),
    { href: V2_ROUTES.guide, label: t("취업 가이드", "Guide", "指南", "Hướng dẫn", "ガイド", "Panduan") }
  ];
}

/** 프로필 사진 — 계정 사진(profileImageUrl) → 이 기기에 올린 사진 순. 바뀌면 바로 반영. */
export function useProfilePhoto(user: { id: string; profileImageUrl?: string | null } | null): string | null {
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setPhoto(user ? (user.profileImageUrl ?? getStoredProfilePhoto(user.id)) : null);
    read();
    window.addEventListener(PROFILE_PHOTO_CHANGED_EVENT, read);
    return () => window.removeEventListener(PROFILE_PHOTO_CHANGED_EVENT, read);
  }, [user]);
  return photo;
}

function Header() {
  const t = usePlatformT();
  const pathname = usePathname() ?? "";
  const { user, isAuthenticated, isReady } = useAuthSession();
  const nav = useNav();
  const name = user?.realName || user?.name || "";
  const photo = useProfilePhoto(user ?? null);
  const unread = useUnreadNotificationCount();
  useServerNotificationSync();

  // 가장 길게 맞는 메뉴 하나만 켠다 — /talent/career/interviews 는 '내 커리어'가 아니라 '모의 면접'.
  const activeHref = nav
    .map((n) => n.href)
    .filter((h) => pathname === h || pathname.startsWith(`${h}/`))
    .sort((a, b) => b.length - a.length)[0];
  const navLinks = (mobile: boolean) =>
    nav.map((n) => {
      const active = n.href === activeHref;
      return (
        <Link
          key={n.href}
          href={n.href}
          aria-current={active ? "page" : undefined}
          className={
            mobile
              ? `shrink-0 py-3 text-[16px] transition ${active ? "font-bold text-[color:var(--v2-ink)]" : "font-medium text-[color:var(--v2-faint)]"}`
              : `shrink-0 rounded-xl px-3.5 py-2 text-[16px] transition ${active ? "font-bold text-[color:var(--v2-ink)]" : "font-medium text-[color:var(--v2-faint)] hover:bg-[color:var(--v2-band)] hover:text-[color:var(--v2-ink-3)]"}`
          }
        >
          {n.label}
        </Link>
      );
    });

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--v2-band)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1080px] items-center gap-6 px-5">
        <Link href={V2_ROUTES.home} aria-label="Aply" className="flex shrink-0 items-center">
          <Image src="/img_logo.webp" alt="Aply" width={96} height={30} className="h-6 w-auto md:h-7" priority />
        </Link>
        <nav aria-label={t("주요 메뉴", "Main menu", "主菜单", "Menu chính", "メインメニュー", "Menu utama")} className="hidden flex-1 items-center gap-1 md:flex">
          {navLinks(false)}
        </nav>

        {/* 오른쪽 — 알림 · 프로필 사진 · 언어(맨 끝). 셋 다 40px 칸에 비슷한 크기로. */}
        <div className="ml-auto flex items-center gap-1">
          {!isReady ? (
            // 로그인 확인 중 — '로그인' 버튼이 잠깐 떴다 사라지지 않게 자리만.
            <>
              <span aria-hidden className="mx-2 block h-6 w-6 animate-pulse rounded-full bg-[color:var(--v2-band)]" />
              <span aria-hidden className="mx-2 block h-7 w-7 animate-pulse rounded-full bg-[color:var(--v2-band)]" />
            </>
          ) : isAuthenticated ? (
            <>
              <Link
                href="/talent/notifications"
                aria-label={unread > 0 ? t(`알림 ${unread}개`, `${unread} notifications`, `${unread} 条通知`, `${unread} thông báo`, `通知 ${unread}件`, `${unread} notifikasi`) : t("알림", "Notifications", "通知", "Thông báo", "通知", "Notifikasi")}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-band)]"
              >
                <Bell className="h-6 w-6" />
                {unread > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--v2-attention)] px-1 text-[10px] font-bold leading-none text-white">{unread > 9 ? "9+" : unread}</span>
                ) : null}
              </Link>
              <Link
                href="/talent/settings"
                aria-label={t("내 프로필", "My profile", "我的资料", "Hồ sơ của tôi", "マイプロフィール", "Profil saya")}
                title={name || undefined}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-[color:var(--v2-band)]"
              >
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[color:var(--v2-band)] text-[12px] font-bold text-[color:var(--v2-ink-3)]">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 계정 사진은 data URL·외부 주소가 섞여 next/image 로 못 받는다.
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span aria-hidden>{(name || "?").charAt(0).toUpperCase()}</span>
                  )}
                </span>
              </Link>
            </>
          ) : (
            <span className="mr-1">
              <Button size="sm" href={`/talent/login?next=${encodeURIComponent(pathname)}`}>
                {t("로그인", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk")}
              </Button>
            </span>
          )}
          <LanguageSwitcher size="lg" />
        </div>
      </div>
      {/* 모바일 — 메뉴를 숨기지 않고 가로로 넘기는 한 줄 */}
      <nav aria-label={t("주요 메뉴", "Main menu", "主菜单", "Menu chính", "メインメニュー", "Menu utama")} className="flex gap-6 overflow-x-auto px-5 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
        {navLinks(true)}
      </nav>
    </header>
  );
}

export function V2Shell({ children, requireAuth = false }: { children: ReactNode; requireAuth?: boolean }) {
  const t = usePlatformT();
  const pathname = usePathname() ?? "";
  const { isReady, isAuthenticated } = useAuthSession();
  let body: ReactNode = children;
  if (requireAuth && !isReady) body = <PageSkeleton />;
  else if (requireAuth && !isAuthenticated) {
    body = (
      <Page>
        <Masthead
          eyebrow={t("로그인이 필요해요", "Log in required", "需要登录", "Cần đăng nhập", "ログインが必要です", "Perlu masuk")}
          title={t("내 정보로 채워지는 화면이에요", "This page is filled with your own information", "此页面会显示你的个人信息", "Trang này hiển thị thông tin của bạn", "あなたの情報で埋まる画面です", "Halaman ini berisi datamu")}
          lede={t("로그인하면 이어서 볼 수 있어요.", "Log in to continue.", "登录后即可继续查看。", "Đăng nhập để tiếp tục.", "ログインすると続きが見られます。", "Masuk untuk melanjutkan.")}
          action={
            <Actions>
              <PrimaryButton href={`/talent/login?next=${encodeURIComponent(pathname)}`}>{t("로그인", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk")}</PrimaryButton>
              <SecondaryButton href={`/talent/signup?next=${encodeURIComponent(pathname)}`}>{t("가입하기", "Sign up", "注册", "Đăng ký", "登録する", "Daftar")}</SecondaryButton>
            </Actions>
          }
        />
      </Page>
    );
  }
  return (
    <div className="v2">
      <Header />
      {/* 운영 공지(약관·방침 변경 고지 등) — 예전 사이트 헤더에만 있던 것을 v2 에도. 셸 안, 본문 폭에 맞춰. */}
      <div className="mx-auto w-full max-w-[880px] px-1">
        <AnnouncementBanner />
      </div>
      {body}
      {/* 모의 면접 이용권 결제 창 — 어디서든 이용권이 모자라면 열린다 */}
      <InterviewPaywallHost />
      <AplyFooter />
    </div>
  );
}
