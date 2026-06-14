"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { getHeaderMessages, PLATFORM_LOCALES, type PlatformLocale } from "../../lib/auth-messages";
import { getStoredProfilePhoto } from "../../lib/profile-media";
import { NotificationBell } from "../notifications/NotificationBell";
import { AnnouncementBanner } from "../announcements/AnnouncementBanner";

const HEADER_SQUIRCLE_CLIP_ID = "header-avatar-squircle-clip";
const HEADER_SQUIRCLE_PATH = "M50,0 C74,0 86,3 93,10 C97,14 100,26 100,50 C100,74 97,86 93,90 C86,97 74,100 50,100 C26,100 14,97 7,90 C3,86 0,74 0,50 C0,26 3,14 7,10 C14,3 26,0 50,0 Z";
const HEADER_SQUIRCLE_STYLE = {
  clipPath: `url(#${HEADER_SQUIRCLE_CLIP_ID})`,
  WebkitClipPath: `url(#${HEADER_SQUIRCLE_CLIP_ID})`
} as const;

export const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  // 데스크탑 GNB 가 lg(1024) 부터 노출되는데, lg~xl(1024–1279) 구간은
  // 메뉴 항목 + 우측 컨트롤이 한 줄에 빠듯하다. xl 미만에서는 언어 셀렉터를
  // 풀네임 → "🇰🇷 KO" 같은 코드 형태로 축약해서 nav 폭을 확보.
  const [isXlViewport, setIsXlViewport] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const sync = () => setIsXlViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const { locale, setLocale } = useLanguage();
  const { user, isReady, isAuthenticated, getAccountUrl } = useAuthSession();
  const avatarFallback = user?.name?.trim()?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U";

  useEffect(() => {
    if (!user) {
      setProfileImage(null);
      return;
    }
    setProfileImage(user.profileImageUrl ?? getStoredProfilePhoto(user.id));
  }, [user]);
  const copy = getHeaderMessages(locale);
  const roleBadgeLabel =
    user?.role === "PARTNER" ? copy.auth.rolePartner : user?.role === "OPERATOR" ? copy.auth.roleOperator : null;
  const loginButtonLabel = locale === "ko" ? "로그인하기" : locale === "zh-CN" ? "去登录" : locale === "vi" ? "Đăng nhập" : locale === "ja" ? "ログイン" : locale === "id" ? "Masuk" : "Sign in";
  const homeLabel = locale === "ko" ? "홈" : locale === "zh-CN" ? "首页" : locale === "vi" ? "Trang chủ" : locale === "ja" ? "ホーム" : locale === "id" ? "Beranda" : "Home";
  const eventLabel = locale === "ko" ? "이벤트" : locale === "zh-CN" ? "活动" : locale === "vi" ? "Sự kiện" : locale === "ja" ? "イベント" : locale === "id" ? "Acara" : "Events";
  const partnerDashLabel = locale === "ko" ? "관리 콘솔" : locale === "zh-CN" ? "管理控制台" : locale === "vi" ? "Bảng quản trị" : locale === "ja" ? "管理コンソール" : locale === "id" ? "Konsol Manajemen" : "Admin console";
  const opsDashLabel = locale === "ko" ? "운영 콘솔" : locale === "zh-CN" ? "运营控制台" : locale === "vi" ? "Bảng điều khiển vận hành" : locale === "ja" ? "運営コンソール" : locale === "id" ? "Konsol Operasional" : "Ops console";
  // 이력서 코칭 — STUDENT 와 비로그인 사용자에게만 노출. 매칭 확률 메뉴를
  // 흡수했기 때문에 같은 자리(/matching-probability 가 있던 자리) 에 둠.
  // 비로그인 사용자가 클릭하면 /resume 진입 시 자동으로 로그인 게이트가 작동.
  const resumeCoachLabel = locale === "ko"
    ? "이력서 코칭"
    : locale === "zh-CN" ? "简历辅导"
    : locale === "vi" ? "Tư vấn hồ sơ"
    : locale === "ja" ? "履歴書コーチング"
    : locale === "id" ? "Bimbingan Resume"
    : "Resume Coaching";
  const navItems: { label: string; href: string; external?: boolean; promoted?: boolean }[] = [
    // 이벤트 — saju/visa 리스팅 허브. 다른 메뉴(홈/포지션 탐색)와 동일하게
    // 같은 창 내부 네비게이션 + 평범한 텍스트 스타일.
    { label: eventLabel, href: "/events" },
    { label: homeLabel, href: "/" },
    { label: copy.nav.positions, href: "/positions" },
    ...(user?.role === "STUDENT" || !isAuthenticated
      ? [{ label: resumeCoachLabel, href: "/resume" }]
      : []),
    { label: copy.nav.community, href: "/community" },
    { label: copy.nav.pricing, href: "/pricing" },
    { label: copy.nav.resources, href: "/resources" },
    ...(user?.role === "PARTNER" ? [{ label: partnerDashLabel, href: "/dashboard/partner" }] : []),
    ...(user?.role === "OPERATOR" ? [{ label: opsDashLabel, href: "/dashboard/ops" }] : [])
  ];

  useEffect(() => {
    const syncHash = () => {
      setActiveHash(window.location.hash || "");
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, [pathname]);

  function isNavActive(href: string) {
    const [basePath, hash] = href.split("#");
    const targetPath = basePath || "/";

    if (hash) {
      return pathname === targetPath && activeHash === `#${hash}`;
    }
    if (targetPath === "/") {
      return pathname === "/";
    }
    return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
  }

  function handleAccountClick() {
    setOpen(false);
    const targetUrl = getAccountUrl();
    if (targetUrl.startsWith("http")) {
      window.location.href = targetUrl;
      return;
    }
    router.push(targetUrl);
  }

  function handleLocaleChange(nextLocale: PlatformLocale) {
    setLocale(nextLocale);
  }

  const localeEmoji: Record<PlatformLocale, string> = {
    ko: "🇰🇷",
    en: "🇺🇸",
    "zh-CN": "🇨🇳",
    vi: "🇻🇳",
    ja: "🇯🇵",
    id: "🇮🇩"
  };
  const localeLabel: Record<PlatformLocale, string> = {
    ko: "한국어",
    en: "English",
    "zh-CN": "简体中文",
    vi: "Tiếng Việt",
    ja: "日本語",
    id: "Bahasa Indonesia"
  };
  const localeDisplayLabel: Record<PlatformLocale, string> = {
    ko: `${localeEmoji.ko} ${localeLabel.ko}`,
    en: `${localeEmoji.en} ${localeLabel.en}`,
    "zh-CN": `${localeEmoji["zh-CN"]} ${localeLabel["zh-CN"]}`,
    vi: `${localeEmoji.vi} ${localeLabel.vi}`,
    ja: `${localeEmoji.ja} ${localeLabel.ja}`,
    id: `${localeEmoji.id} ${localeLabel.id}`
  };
  // 압축 라벨: lg(1024)~xl(1279) 구간 데스크탑 GNB 에서만 사용.
  // 햄버거 메뉴 안쪽(<lg) 과 xl+ 데스크탑은 풀네임을 유지.
  const localeCompactLabel: Record<PlatformLocale, string> = {
    ko: `${localeEmoji.ko} KO`,
    en: `${localeEmoji.en} EN`,
    "zh-CN": `${localeEmoji["zh-CN"]} ZH`,
    vi: `${localeEmoji.vi} VI`,
    ja: `${localeEmoji.ja} JA`,
    id: `${localeEmoji.id} ID`
  };
  const maxLocaleTextUnits = Object.values(localeLabel).reduce((max, text) => {
    const units = Array.from(text).reduce((sum, ch) => {
      const code = ch.charCodeAt(0);
      const isWide = code >= 0x2e80;
      return sum + (isWide ? 1.75 : 1);
    }, 0);
    return Math.max(max, units);
  }, 0);
  const localeButtonWidthPx = Math.max(112, Math.ceil(maxLocaleTextUnits * 9) + 40);
  // 데스크탑 셀렉터 폭: xl+ 면 풀네임 기반(≈200px), 그 아래면 축약본 기반(≈92px).
  const desktopLocaleWidthPx = isXlViewport ? localeButtonWidthPx : 92;

  return (
    <>
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <clipPath id={HEADER_SQUIRCLE_CLIP_ID} clipPathUnits="objectBoundingBox">
            <path d={HEADER_SQUIRCLE_PATH} transform="scale(0.01)" />
          </clipPath>
        </defs>
      </svg>
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background">
        <div className="container flex h-[52px] items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/img_logo.webp"
            alt={`${copy.brand} logo`}
            width={180}
            height={48}
            className="h-6 w-auto md:h-7"
            priority
          />
        </Link>
        <nav className="hidden items-center gap-4 lg:flex xl:gap-8">
          {navItems.map((item) => {
            // promoted 항목은 라임 배지. 배지 자체가 glow-pulse 로 잔잔하게
            // 반짝거려 평범한 텍스트 nav 들 사이에서 자연스럽게 시선이 감.
            const cls = item.promoted
              ? "inline-flex items-center rounded-full bg-[#b7ff5a] px-3 py-1 text-[11px] font-bold text-[#111111] transition hover:bg-[#a3eb43] animate-glow-pulse"
              : `text-xs transition-colors ${
                  isNavActive(item.href) ? "font-semibold text-foreground" : "font-medium text-muted-foreground hover:text-foreground"
                }`;
            if (item.external) {
              // 새창으로 열기 — Next의 Link 대신 평범한 <a target="_blank">.
              return (
                <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
                  {item.label}
                </a>
              );
            }
            return (
              <Link key={item.label} href={item.href} className={cls}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center lg:flex">
          {!isReady ? (
            <div className="h-8 w-24" aria-hidden />
          ) : isAuthenticated ? (
            <div className="inline-flex items-center gap-1">
              <NotificationBell />
              <Button variant="ghost" size="sm" onClick={handleAccountClick}>
                {profileImage ? (
                  <img src={profileImage} alt="" className="h-6 w-6 object-cover" style={HEADER_SQUIRCLE_STYLE} />
                ) : (
                  <span className="grid h-6 w-6 place-items-center bg-muted text-[11px] font-semibold text-muted-foreground" style={HEADER_SQUIRCLE_STYLE}>
                    {avatarFallback}
                  </span>
                )}
                {user?.name ? (
                  <>
                    {roleBadgeLabel ? (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {roleBadgeLabel}
                      </span>
                    ) : null}
                    <span>{`${user.name}${copy.auth.greetingSuffix ? ` ${copy.auth.greetingSuffix}` : ""}`}</span>
                  </>
                ) : (
                  copy.auth.myAccount
                )}
              </Button>
            </div>
          ) : (
            <Button variant="dark" size="sm" className="text-xs font-semibold" asChild>
              <Link href="/login">{loginButtonLabel}</Link>
            </Button>
          )}
          <div className="relative ml-1">
            <CaretDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <select
              value={locale}
              onChange={(e) => handleLocaleChange(e.target.value as PlatformLocale)}
              aria-label={copy.languageLabel}
              className="h-9 appearance-none bg-transparent pl-2 pr-7 text-right text-xs font-medium text-foreground focus-visible:outline-none"
              style={{ width: `${desktopLocaleWidthPx}px` }}
            >
              {PLATFORM_LOCALES.map((value) => (
                <option key={value} value={value}>
                  {isXlViewport ? localeDisplayLabel[value] : localeCompactLabel[value]}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* 모바일 우측 액션 — 알림 벨(로그인 시)은 데스크탑(lg)에만 있던 것을
            모바일 헤더에도 노출. 그 옆에 햄버거 메뉴. */}
        <div className="flex items-center gap-1 lg:hidden">
          {isReady && isAuthenticated ? <NotificationBell /> : null}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={copy.menuOpenLabel}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="container flex flex-col gap-3 py-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">{copy.languageLabel}</span>
              <div className="relative">
                <CaretDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <select
                  value={locale}
                  onChange={(e) => handleLocaleChange(e.target.value as PlatformLocale)}
                  aria-label={copy.languageLabel}
                  className="h-9 appearance-none bg-transparent pl-2 pr-7 text-right text-xs font-medium text-foreground focus-visible:outline-none"
                  style={{ width: `${localeButtonWidthPx}px` }}
                >
                  {PLATFORM_LOCALES.map((value) => (
                    <option key={value} value={value}>
                      {localeDisplayLabel[value]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {navItems.map((item) => {
              const mobileCls = item.promoted
                ? "inline-flex w-fit items-center rounded-full bg-[#b7ff5a] px-3.5 py-1.5 text-sm font-bold text-[#111111] animate-glow-pulse"
                : `text-base ${
                    isNavActive(item.href) ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                  }`;
              if (item.external) {
                return (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={mobileCls}>
                    {item.label}
                  </a>
                );
              }
              return (
                <Link key={item.label} href={item.href} className={mobileCls}>
                  {item.label}
                </Link>
              );
            })}
            {!isReady ? (
              <div className="mt-2 h-9" aria-hidden />
            ) : isAuthenticated ? (
              <div className="mt-2">
                <Button variant="outline" size="sm" className="border-0" onClick={handleAccountClick}>
                  {user?.name ? copy.auth.myAccount : copy.auth.account}
                </Button>
              </div>
            ) : (
              <div className="mt-2">
                <Button variant="dark" size="sm" className="w-full text-xs font-semibold" asChild>
                  <Link href="/login">{loginButtonLabel}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
    <AnnouncementBanner />
    </>
  );
};
