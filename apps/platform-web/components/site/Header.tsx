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

export const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { locale, setLocale } = useLanguage();
  const { user, isReady, isAuthenticated, getAccountUrl } = useAuthSession();
  const copy = getHeaderMessages(locale);
  const roleBadgeLabel =
    user?.role === "PARTNER" ? copy.auth.rolePartner : user?.role === "OPERATOR" ? copy.auth.roleOperator : null;
  const loginButtonLabel = locale === "ko" ? "로그인하기" : locale === "zh-CN" ? "去登录" : locale === "vi" ? "Đăng nhập" : "Sign in";
  const homeLabel = locale === "ko" ? "홈" : locale === "zh-CN" ? "首页" : locale === "vi" ? "Trang chủ" : "Home";
  const navItems = [
    { label: homeLabel, href: "/" },
    { label: copy.nav.positions, href: "/positions" },
    { label: copy.nav.community, href: "/community" },
    { label: copy.nav.pricing, href: "/pricing" },
    { label: copy.nav.resources, href: "/resources" }
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

  useEffect(() => {
    setIsHydrated(true);
    const onScroll = () => {
      setIsScrolled(window.scrollY > 18);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

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
    vi: "🇻🇳"
  };
  const localeLabel: Record<PlatformLocale, string> = {
    ko: "한국어",
    en: "English",
    "zh-CN": "简体中文",
    vi: "Tiếng Việt"
  };
  const localeDisplayLabel: Record<PlatformLocale, string> = {
    ko: `${localeEmoji.ko} ${localeLabel.ko}`,
    en: `${localeEmoji.en} ${localeLabel.en}`,
    "zh-CN": `${localeEmoji["zh-CN"]} ${localeLabel["zh-CN"]}`,
    vi: `${localeEmoji.vi} ${localeLabel.vi}`
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

  return (
    <header
        className={`sticky top-0 z-50 ${isHydrated ? "transition-all duration-500 ease-smooth" : ""} ${
        isScrolled
          ? "top-3 mx-auto w-[calc(100%-1rem)] md:top-5 md:w-[min(70%,1200px)] md:min-w-[980px] translate-y-0 rounded-2xl border border-border/70 bg-white shadow-elevated backdrop-blur-xl"
          : "top-0 border-b border-border/60 bg-background/80 backdrop-blur-xl"
      }`}
    >
        <div
        className={`container flex items-center justify-between ${isHydrated ? "transition-all duration-500 ease-smooth" : ""} ${
          isScrolled ? "h-[52px] scale-[0.985]" : "h-[52px] scale-100"
        }`}
      >
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
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`text-xs transition-colors ${
                isNavActive(item.href) ? "font-semibold text-foreground" : "font-medium text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center md:flex">
          {isReady && isAuthenticated ? (
            <div className="inline-flex items-center">
              <Button variant="ghost" size="sm" onClick={handleAccountClick}>
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
          <div className="relative ml-4">
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
        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={copy.menuOpenLabel}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
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
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-base ${
                  isNavActive(item.href) ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isReady && isAuthenticated ? (
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
  );
};
