"use client";

// 리뉴얼 v2 셸 — 상단 메뉴(글자 탭) + 본문 + 바닥글. 기존 TalentHeader 와 따로 간다.
// 메뉴는 PC 에선 로고 옆 한 줄, 모바일에선 로고 아래 가로로 넘기는 한 줄(햄버거 없이 바로 보이게).
// 로그인이 필요한 화면은 requireAuth — 게스트에겐 같은 톤의 안내만 보여 준다.
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { AplyFooter } from "../AplyFooter";
import { usePlatformT } from "../../lib/i18n";
import { Masthead, Page, PrimaryButton, SecondaryButton } from "./ui";

export const V2_ROUTES = {
  home: "/v2/home",
  career: "/v2/career",
  jobs: "/v2/jobs",
  interviews: "/v2/interviews",
  applications: "/v2/applications",
  guide: "/v2/guide"
} as const;

function useNav() {
  const t = usePlatformT();
  return [
    { href: V2_ROUTES.home, label: t("홈", "Home", "首页", "Trang chủ", "ホーム", "Beranda") },
    { href: V2_ROUTES.career, label: t("내 커리어", "Career", "我的职业", "Sự nghiệp", "キャリア", "Karier") },
    { href: V2_ROUTES.jobs, label: t("포지션 탐색", "Jobs", "职位", "Việc làm", "求人", "Lowongan") },
    { href: V2_ROUTES.interviews, label: t("모의 면접", "Interview", "模拟面试", "Phỏng vấn", "模擬面接", "Wawancara") },
    { href: V2_ROUTES.applications, label: t("지원 현황", "Applied", "申请", "Ứng tuyển", "応募", "Lamaran") },
    { href: V2_ROUTES.guide, label: t("취업 가이드", "Guide", "指南", "Hướng dẫn", "ガイド", "Panduan") }
  ];
}

function Header() {
  const t = usePlatformT();
  const pathname = usePathname() ?? "";
  const { user, isAuthenticated } = useAuthSession();
  const nav = useNav();
  const name = user?.realName || user?.name || "";
  const navLinks = nav.map((n) => {
    const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
    return (
      <Link
        key={n.href}
        href={n.href}
        aria-current={active ? "page" : undefined}
        className={`shrink-0 py-3 text-[16px] transition md:py-5 ${
          active ? "font-bold text-[color:var(--v2-ink)]" : "font-medium text-[color:var(--v2-faint)] hover:text-[color:var(--v2-ink-3)]"
        }`}
      >
        {n.label}
      </Link>
    );
  });
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1040px] items-center gap-8 px-5">
        <Link href={V2_ROUTES.home} aria-label="Aply" className="flex h-14 shrink-0 items-center md:h-auto">
          <Image src="/img_logo.webp" alt="Aply" width={64} height={20} className="h-[18px] w-auto" priority />
        </Link>
        <nav aria-label={t("주요 메뉴", "Main menu", "主菜单", "Menu chính", "メインメニュー", "Menu utama")} className="hidden flex-1 items-center gap-7 md:flex">
          {navLinks}
        </nav>
        <div className="ml-auto flex items-center gap-4 text-[14px]">
          {isAuthenticated ? (
            <Link href="/talent/settings" className="font-semibold text-[color:var(--v2-ink-2)] hover:text-[color:var(--v2-ink)]">
              {name || t("내 계정", "My account", "我的账户", "Tài khoản", "マイアカウント", "Akun saya")}
            </Link>
          ) : (
            <Link href={`/talent/login?next=${encodeURIComponent(pathname)}`} className="font-semibold text-[color:var(--v2-ink)]">
              {t("로그인", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk")}
            </Link>
          )}
        </div>
      </div>
      {/* 모바일 — 메뉴를 숨기지 않고 가로로 넘기는 한 줄 */}
      <nav aria-label={t("주요 메뉴", "Main menu", "主菜单", "Menu chính", "メインメニュー", "Menu utama")} className="flex gap-6 overflow-x-auto px-5 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
        {navLinks}
      </nav>
    </header>
  );
}

export function V2Shell({ children, requireAuth = false }: { children: ReactNode; requireAuth?: boolean }) {
  const t = usePlatformT();
  const pathname = usePathname() ?? "";
  const { isReady, isAuthenticated } = useAuthSession();
  let body: ReactNode = children;
  if (requireAuth && !isReady) body = <Page><p className="px-5 pt-10 text-[15px] text-[color:var(--v2-muted)]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p></Page>;
  else if (requireAuth && !isAuthenticated) {
    body = (
      <Page>
        <Masthead
          eyebrow={t("로그인이 필요해요", "Log in required", "需要登录", "Cần đăng nhập", "ログインが必要です", "Perlu masuk")}
          title={t("내 정보로 채워지는 화면이에요", "This page is filled with your own information", "此页面会显示你的个人信息", "Trang này hiển thị thông tin của bạn", "あなたの情報で埋まる画面です", "Halaman ini berisi datamu")}
          lede={t("로그인하면 이어서 볼 수 있어요. 가입은 무료예요.", "Log in to continue. Signing up is free.", "登录后即可继续查看。注册免费。", "Đăng nhập để tiếp tục. Đăng ký miễn phí.", "ログインすると続きが見られます。登録は無料です。", "Masuk untuk melanjutkan. Daftar gratis.")}
          action={
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <PrimaryButton href={`/talent/login?next=${encodeURIComponent(pathname)}`}>{t("로그인", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk")}</PrimaryButton>
              <SecondaryButton href={`/talent/signup?next=${encodeURIComponent(pathname)}`}>{t("무료로 가입하기", "Sign up free", "免费注册", "Đăng ký miễn phí", "無料で登録", "Daftar gratis")}</SecondaryButton>
            </div>
          }
        />
      </Page>
    );
  }
  return (
    <div className="v2">
      <Header />
      {body}
      <AplyFooter />
    </div>
  );
}
