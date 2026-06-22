"use client";

import { type ReactNode, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { paperlogy } from "../../lib/fonts";

// 커리어 도구 공용 경량 셸. aply.global GNB에 노출되지 않는 독립 도구 묶음이라
// 표준 사이트 Header 대신 간결한 상단 바를 쓴다(로고 + 도구 네비 + 우측 슬롯).
// STUDENT 로그인 게이트는 기존 ResumeCoachListPage 패턴과 동일.

// 상단 큰 메뉴(도구 전환). 1:1 코칭은 아직 메인 사이트 헤더를 쓰는 /resume 로,
// AI 진단은 가장 최근 이력서의 진단 탭으로 보내는 /resume-maker/diagnosis 로 연결한다.
const TOOLS: { label: string; href: string; match: (p: string) => boolean }[] = [
  {
    label: "이력서 만들기",
    href: "/resume-maker",
    match: (p) => p === "/resume-maker" || (p.startsWith("/resume-maker/") && p !== "/resume-maker/diagnosis")
  },
  { label: "1:1 코칭", href: "/resume", match: (p) => p === "/resume" || p.startsWith("/resume/") },
  { label: "AI 진단", href: "/resume-maker/diagnosis", match: (p) => p === "/resume-maker/diagnosis" }
];

function FullState({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans text-muted-foreground">
      <span className="inline-flex items-center gap-2 text-sm">
        <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden />
        {label}
      </span>
    </div>
  );
}

export function ResumeMakerShell({
  children,
  right,
  title
}: {
  children: ReactNode;
  right?: ReactNode;
  title?: string;
}) {
  const { isReady, isAuthenticated, user } = useAuthSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      const target = pathname || "/resume-maker";
      router.replace(`/login?redirect=${encodeURIComponent(target)}`);
    }
  }, [isReady, isAuthenticated, pathname, router]);

  if (!isReady) return <FullState label="불러오는 중..." />;
  if (!isAuthenticated) return <FullState label="로그인 페이지로 이동 중..." />;

  // 이력서 API 는 STUDENT(구직 회원) 전용이라, 다른 역할은 클릭 후 403 을 맞기 전에
  // 미리 안내한다.
  if (user && user.role !== "STUDENT") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center font-sans">
        <p className={`${paperlogy.className} text-xl font-black text-[#0B1227]`}>구직 회원 전용 기능이에요</p>
        <p className="max-w-sm text-[14px] leading-relaxed text-muted-foreground">
          AI 이력서 만들기는 구직 회원(학생) 계정에서 사용할 수 있어요. 구직 회원으로 로그인한 뒤 다시 시도해 주세요.
        </p>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          홈으로
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="container flex h-14 max-w-6xl items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/resume-maker" className="shrink-0">
              <Image src="/img_logo.webp" alt="aply" width={180} height={48} className="h-6 w-auto md:h-7" priority />
            </Link>
            {title ? (
              <>
                <span className="shrink-0 text-muted-foreground/40">/</span>
                <span className="truncate text-[13px] font-semibold text-foreground">{title}</span>
              </>
            ) : null}
          </div>
          {/* 상단 도구 네비 (데스크탑) — aply.global 처럼 가운데 정렬 텍스트 */}
          <nav className="hidden flex-1 items-center justify-center gap-6 md:flex xl:gap-8">
            {TOOLS.map((t) => {
              const active = t.match(pathname ?? "");
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`text-xs transition-colors ${
                    active ? "font-semibold text-foreground" : "font-medium text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex shrink-0 items-center gap-3">{right}</div>
        </div>
        {/* 상단 도구 네비 (모바일) — 가운데 정렬, 넘치면 가로 스크롤 */}
        <nav className="flex items-center justify-center gap-6 overflow-x-auto border-t border-border/60 px-4 py-2.5 md:hidden">
          {TOOLS.map((t) => {
            const active = t.match(pathname ?? "");
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`shrink-0 text-xs transition-colors ${
                  active ? "font-semibold text-foreground" : "font-medium text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
