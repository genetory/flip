"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { GlobeHemisphereWest } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { getHeaderMessages, type PlatformLocale } from "../../lib/auth-messages";

export const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { locale, setLocale } = useLanguage();
  const { user, isReady, isAuthenticated, logout, getAccountUrl } = useAuthSession();
  const copy = getHeaderMessages(locale);
  const roleBadgeLabel =
    user?.role === "PARTNER" ? copy.auth.rolePartner : user?.role === "OPERATOR" ? copy.auth.roleOperator : null;
  const homeLabel = locale === "ko" ? "홈" : "Home";
  const navItems = [
    { label: homeLabel, href: "/" },
    { label: copy.nav.positions, href: "/positions" },
    { label: copy.nav.community, href: "/community" },
    { label: copy.nav.pricing, href: "/pricing" }
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

  async function handleLogout() {
    setOpen(false);
    await logout();
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

  function toggleLocale() {
    handleLocaleChange(locale === "ko" ? "en" : "ko");
  }

  return (
    <header
      className={`sticky top-0 z-50 ${isHydrated ? "transition-all duration-500 ease-smooth" : ""} ${
        isScrolled
          ? "top-3 mx-auto w-[min(96%,1200px)] translate-y-0 rounded-2xl border border-border/70 bg-white shadow-elevated backdrop-blur-xl"
          : "top-0 border-b border-border/60 bg-background/80 backdrop-blur-xl"
      }`}
    >
      <div
        className={`container flex items-center justify-between ${isHydrated ? "transition-all duration-500 ease-smooth" : ""} ${
          isScrolled ? "h-14 scale-[0.985]" : "h-16 scale-100"
        }`}
      >
        <Link href="/" className="flex items-center">
          <Image
            src="/img_logo.webp"
            alt={`${copy.brand} logo`}
            width={180}
            height={48}
            className="h-8 w-auto md:h-9"
            priority
          />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`text-base transition-colors ${
                isNavActive(item.href) ? "font-extrabold text-foreground" : "font-medium text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {isReady && isAuthenticated ? (
            <>
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
              <Button variant="dark" size="sm" onClick={() => void handleLogout()}>
                {copy.auth.logout}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{copy.auth.login}</Link>
              </Button>
              <Button variant="dark" size="sm" asChild>
                <Link href="/signup">{copy.auth.signup}</Link>
              </Button>
            </>
          )}
          <button
            type="button"
            onClick={toggleLocale}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-base transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={copy.languageLabel}
            title={copy.languageLabel}
          >
            <GlobeHemisphereWest className="h-4 w-4 text-muted-foreground" weight="duotone" aria-hidden />
            <span aria-hidden>{locale === "ko" ? "🇰🇷" : "🇺🇸"}</span>
          </button>
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
              <button
                type="button"
                onClick={toggleLocale}
                className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-base transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={copy.languageLabel}
                title={copy.languageLabel}
              >
                <GlobeHemisphereWest className="h-4 w-4 text-muted-foreground" weight="duotone" aria-hidden />
                <span aria-hidden>{locale === "ko" ? "🇰🇷" : "🇺🇸"}</span>
              </button>
            </div>
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-base ${
                  isNavActive(item.href) ? "font-extrabold text-foreground" : "font-medium text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isReady && isAuthenticated ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={handleAccountClick}>
                  {user?.name ? copy.auth.myAccount : copy.auth.account}
                </Button>
                <Button variant="dark" size="sm" onClick={() => void handleLogout()}>
                  {copy.auth.logout}
                </Button>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">{copy.auth.login}</Link>
                </Button>
                <Button variant="dark" size="sm" asChild>
                  <Link href="/signup">{copy.auth.signup}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
