"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { List as Menu } from "@phosphor-icons/react";
import { CaretDown, ArrowsLeftRight } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { getHeaderMessages, PLATFORM_LOCALES, type PlatformLocale } from "../../lib/auth-messages";
import { usePlatformT } from "../../lib/i18n";
import { getStoredProfilePhoto } from "../../lib/profile-media";
import { NotificationBell } from "../notifications/NotificationBell";
import { AnnouncementBanner } from "../announcements/AnnouncementBanner";
import { ContactVerificationBanner } from "../auth/ContactVerificationBanner";

const HEADER_SQUIRCLE_CLIP_ID = "header-avatar-squircle-clip";
const HEADER_SQUIRCLE_PATH = "M50,0 C74,0 86,3 93,10 C97,14 100,26 100,50 C100,74 97,86 93,90 C86,97 74,100 50,100 C26,100 14,97 7,90 C3,86 0,74 0,50 C0,26 3,14 7,10 C14,3 26,0 50,0 Z";
const HEADER_SQUIRCLE_STYLE = {
  clipPath: `url(#${HEADER_SQUIRCLE_CLIP_ID})`,
  WebkitClipPath: `url(#${HEADER_SQUIRCLE_CLIP_ID})`
} as const;

// 비즈니스 GNB — /business 랜딩의 섹션 앵커. 순서는 페이지 섹션 등장 순서와
// 동일하게 유지(도입 사례 → 서비스 → 검증 → 인재풀 → 요금).
const BUSINESS_NAV: { key: keyof typeof BUSINESS_NAV_LABELS; href: string }[] = [
  { key: "talentSearch", href: "/business/talent" },
  { key: "cases", href: "/business#trust" },
  { key: "service", href: "/business#problem" },
  { key: "verify", href: "/business#verify" },
  { key: "talent", href: "/business#talent" },
  { key: "pricing", href: "/business#pricing" }
];
const BUSINESS_NAV_LABELS: Record<string, Record<PlatformLocale, string>> = {
  talentSearch: { ko: "인재 탐색", en: "Find talent", "zh-CN": "人才探索", vi: "Tìm nhân tài", ja: "人材探索", id: "Cari talenta" },
  cases: { ko: "도입 사례", en: "Customers", "zh-CN": "合作案例", vi: "Khách hàng", ja: "導入事例", id: "Studi Kasus" },
  service: { ko: "서비스", en: "Service", "zh-CN": "服务", vi: "Dịch vụ", ja: "サービス", id: "Layanan" },
  verify: { ko: "검증", en: "Verification", "zh-CN": "验证", vi: "Xác minh", ja: "検証", id: "Verifikasi" },
  talent: { ko: "인재풀", en: "Talent", "zh-CN": "人才库", vi: "Nhân tài", ja: "人材プール", id: "Talenta" },
  pricing: { ko: "요금", en: "Pricing", "zh-CN": "价格", vi: "Phí", ja: "料金", id: "Biaya" }
};
// 서비스(aply.global) ↔ 비즈니스(/business) 컨텍스트 전환 링크 라벨.
const CONTEXT_SWITCH_LABELS: Record<"toBusiness" | "toPersonal", Record<PlatformLocale, string>> = {
  toBusiness: { ko: "파트너스", en: "Partners", "zh-CN": "合作伙伴", vi: "Đối tác", ja: "パートナー", id: "Mitra" },
  toPersonal: { ko: "서비스", en: "Service", "zh-CN": "服务", vi: "Dịch vụ", ja: "サービス", id: "Layanan" }
};

type HeaderProps = {
  // "business" → /business 랜딩 전용 변형: GNB 를 비즈니스 섹션 앵커로 교체하고
  // 로고 우측에 작은 "business" 라벨을 노출. 그 외 스타일/우측 컨트롤은 기본과 동일.
  variant?: "default" | "business";
};

export const Header = ({ variant = "default" }: HeaderProps = {}) => {
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
  const t = usePlatformT();
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
  const loginButtonLabel = t("로그인하기", "Sign in", "去登录", "Đăng nhập", "ログイン", "Masuk");
  const partnerDashLabel = t("관리 콘솔", "Admin console", "管理控制台", "Bảng quản trị", "管理コンソール", "Konsol Manajemen");
  const opsDashLabel = t("운영 콘솔", "Ops console", "运营控制台", "Bảng điều khiển vận hành", "運営コンソール", "Konsol Operasional");
  // Career Launch 운영 콘솔 — 운영자에게만, '운영 콘솔' 바로 오른쪽에 노출.
  const careerOpsLabel = t("커리어 콘솔", "Career console", "职业控制台", "Bảng điều khiển Career", "キャリアコンソール", "Konsol Karier");
  const eventLabel = t("이벤트", "Events", "活动", "Sự kiện", "イベント", "Acara");
  // 이력서 — STUDENT / 비로그인 사용자에게만 노출. 누르면 AI 이력서(/resume-maker)를 새 탭으로 연다.
  // (기존 '이력서 코칭'(/resume)은 잠시 가려둠 — 라벨/링크를 이력서로 교체.)
  const resumeLabel = t("이력서", "Resume", "简历", "Hồ sơ", "履歴書", "Resume");
  // 데스크탑 GNB: 이벤트 · 포지션 탐색 · 이력서 · 커뮤니티 를 "더보기" 왼쪽에 노출(primary).
  // 맞춤 지원(/pricing) · 자료실(/resources) 은 "더보기" 드롭다운으로. 모바일은 전부 펼침.
  const defaultNavItems: { label: string; href: string; external?: boolean; promoted?: boolean; primary?: boolean }[] = [
    { label: eventLabel, href: "/events", primary: true },
    { label: copy.nav.positions, href: "/positions", primary: true },
    ...(user?.role === "STUDENT" || !isAuthenticated
      ? [{ label: resumeLabel, href: "/resume-maker", primary: true, external: true }]
      : []),
    // secondary — 더보기 드롭다운으로.
    { label: copy.nav.community, href: "/community" },  // 커뮤니티
    { label: copy.nav.pricing, href: "/pricing" },     // 맞춤 지원
    { label: copy.nav.resources, href: "/resources" }, // 자료실
    ...(user?.role === "PARTNER" ? [{ label: partnerDashLabel, href: "/dashboard/partner", primary: true }] : []),
    ...(user?.role === "OPERATOR"
      ? [
          { label: opsDashLabel, href: "/dashboard/ops", primary: true },
          { label: careerOpsLabel, href: "/career-launch/ops", primary: true }
        ]
      : [])
  ];
  // 비즈니스 변형 GNB — 페이지 섹션 순서대로, 로케일별 라벨 적용.
  // '인재 탐색'은 파트너/운영자에게만 노출(그 외엔 숨김).
  const canSeeTalentSearch = user?.role === "PARTNER" || user?.role === "OPERATOR";
  const businessNavItems: typeof defaultNavItems = BUSINESS_NAV.filter((n) => n.key !== "talentSearch" || canSeeTalentSearch).map((n) => ({
    label: BUSINESS_NAV_LABELS[n.key][locale],
    href: n.href
  }));
  const navItems = variant === "business" ? businessNavItems : defaultNavItems;
  // 서비스 ↔ 비즈니스 컨텍스트 전환 — 비즈니스 페이지에선 서비스(/)로, 그 외엔 비즈니스(/business)로.
  const contextSwitch =
    variant === "business"
      ? { label: CONTEXT_SWITCH_LABELS.toPersonal[locale], href: "/" }
      : { label: CONTEXT_SWITCH_LABELS.toBusiness[locale], href: "/business" };

  // 데스크탑 GNB 과밀 해소 — 기본 변형만 primary/secondary 로 분할하고 secondary 는
  // "더보기" 드롭다운으로. business 변형(5개)은 분할 없이 전부 노출. 모바일은 전부 펼침.
  const [moreOpen, setMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [moreOpen]);
  const moreLabel = t("더보기", "More", "更多", "Thêm", "その他", "Lainnya");
  const useMoreMenu = variant !== "business";
  const primaryItems = useMoreMenu ? navItems.filter((i) => i.primary) : navItems;
  const moreItems = useMoreMenu ? navItems.filter((i) => !i.primary) : [];

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

  // 같은 페이지 내 해시 링크(#section)는 기본 점프 대신 부드럽게 스크롤.
  // 다른 페이지로의 해시 이동은 기본 Link 동작에 맡긴다(해당 페이지 로드 후 점프).
  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    const [base, hash] = href.split("#");
    if (!hash) {
      setOpen(false);
      return;
    }
    if ((base || "/") !== pathname) return;
    const el = document.getElementById(hash);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.pushState(null, "", `#${hash}`);
    setActiveHash(`#${hash}`);
    setOpen(false);
  }

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
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className="container flex h-14 items-center justify-between">
        <Link href={variant === "business" ? "/business" : "/"} className="flex items-center gap-1.5">
          <Image
            src="/img_logo.webp"
            alt={`${copy.brand} logo`}
            width={180}
            height={48}
            className="h-6 w-auto md:h-7"
            priority
          />
          {variant === "business" ? (
            <span className="text-[12px] font-semibold lowercase tracking-tight text-muted-foreground md:text-[13px]">
              for partners
            </span>
          ) : null}
        </Link>
        <nav className="hidden items-center gap-4 lg:flex xl:gap-8">
          {primaryItems.map((item) => {
            // promoted 항목은 라임 배지. 배지 자체가 glow-pulse 로 잔잔하게
            // 반짝거려 평범한 텍스트 nav 들 사이에서 자연스럽게 시선이 감.
            const cls = item.promoted
              ? "inline-flex items-center rounded-full bg-[#b7ff5a] px-3 py-1 text-[11px] font-bold text-[#111111] transition hover:bg-[#a3eb43] animate-glow-pulse"
              : `text-[13px] transition-colors ${
                  isNavActive(item.href) ? "font-semibold text-[#0B46E8]" : "font-medium text-muted-foreground hover:text-foreground"
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
              <Link key={item.label} href={item.href} className={cls} onClick={(e) => handleNavClick(e, item.href)}>
                {item.label}
              </Link>
            );
          })}
          {moreItems.length > 0 ? (
            <div className="relative flex items-center" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {moreLabel}
                <CaretDown className={`h-3 w-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {moreOpen ? (
                <div className="absolute right-0 top-full z-50 mt-3 min-w-[168px] rounded-2xl border border-border bg-background p-1.5 shadow-elevated">
                  {moreItems.map((item) => {
                    const itemCls = `block rounded-xl px-3 py-2 text-xs transition-colors ${
                      isNavActive(item.href) ? "font-semibold text-foreground" : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`;
                    if (item.external) {
                      return (
                        <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={itemCls} onClick={() => setMoreOpen(false)}>
                          {item.label}
                        </a>
                      );
                    }
                    return (
                      <Link key={item.label} href={item.href} className={itemCls} onClick={() => setMoreOpen(false)}>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>
        <div className="hidden items-center lg:flex">
          <Link
            href={contextSwitch.href}
            className="mr-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
          >
            <ArrowsLeftRight className="h-3.5 w-3.5" weight="bold" aria-hidden />
            {contextSwitch.label}
          </Link>
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
                    isNavActive(item.href) ? "font-semibold text-[#0B46E8]" : "font-medium text-muted-foreground"
                  }`;
              if (item.external) {
                return (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={mobileCls}>
                    {item.label}
                  </a>
                );
              }
              return (
                <Link key={item.label} href={item.href} className={mobileCls} onClick={(e) => handleNavClick(e, item.href)}>
                  {item.label}
                </Link>
              );
            })}
            <Link
              href={contextSwitch.href}
              onClick={() => setOpen(false)}
              className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-muted-foreground"
            >
              <ArrowsLeftRight className="h-4 w-4" weight="bold" aria-hidden />
              {contextSwitch.label}
            </Link>
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
    <ContactVerificationBanner />
    </>
  );
};
