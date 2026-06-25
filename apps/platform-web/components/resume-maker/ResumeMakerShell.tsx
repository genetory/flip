"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { CircleNotch, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { paperlogy } from "../../lib/fonts";
import { useShellCopy } from "../../lib/resume-maker-i18n/shell";
import { useQuotaCopy } from "../../lib/resume-maker-i18n/quota";
import { useAiUsage } from "../../lib/resume-maker-ai-usage";
import { ResumeMakerLanguageSwitch } from "./ResumeMakerLanguageSwitch";
import { getActiveResumeId, setActiveResumeId } from "../../lib/resume-maker-active";
import { RESUME_TOOLS_WIP } from "../../lib/resume-maker-flags";

// 커리어 도구 공용 경량 셸. aply.global GNB에 노출되지 않는 독립 도구 묶음이라
// 표준 사이트 Header 대신 간결한 상단 바를 쓴다(로고 + 도구 네비 + 우측 슬롯).
// STUDENT 로그인 게이트는 기존 ResumeCoachListPage 패턴과 동일.

// GNB 우측 — 공용 AI 티켓 잔량(전 화면 공통). 잔량을 모르면(비STUDENT 등) 숨김.
function GnbTicket() {
  const { remaining } = useAiUsage();
  const q = useQuotaCopy();
  if (remaining === null) return null;
  return (
    <span
      title={q.remaining(remaining)}
      className="inline-flex items-center gap-1 rounded-full border border-[#0B46E8]/20 bg-[#0B46E8]/[0.06] px-2.5 py-1 text-[12.5px] font-bold text-[#0B46E8]"
    >
      <Sparkle weight="fill" className="h-4 w-4" aria-hidden />
      {remaining}
    </span>
  );
}

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
  left,
  right
}: {
  children: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
}) {
  const { isReady, isAuthenticated, user } = useAuthSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useShellCopy();

  // 현재 이력서(세 도구 공유) — 이력서 화면에 들어가면 그 id 를 활성으로 기억하고,
  // 메인 등 id 가 없는 화면에선 마지막 활성 id 를 쓴다.
  const pathResumeId = pathname?.match(/^\/resume-maker\/([^/]+)\//)?.[1];
  const [storedActive, setStoredActive] = useState<string | null>(null);
  useEffect(() => {
    if (pathResumeId) {
      setActiveResumeId(pathResumeId);
      setStoredActive(pathResumeId);
    } else {
      setStoredActive(getActiveResumeId());
    }
  }, [pathResumeId]);
  const activeId = pathResumeId ?? storedActive;

  // GNB 도구 메뉴 — 이력서 만들기는 메인(목록)으로. 공고 맞춤/모의 면접은 현재 이력서로
  // 바로, 현재 이력서가 없으면 메인으로 보내 고르게 한다.
  const isTailor = pathname?.includes("/tailor") ?? false;
  const isInterview = pathname?.includes("/interview") ?? false;
  const tools: { labelKey: "toolResumeMaker" | "toolTailor" | "toolInterview"; href: string; active: boolean; wip?: boolean }[] = [
    { labelKey: "toolResumeMaker", href: "/resume-maker", active: !isTailor && !isInterview },
    { labelKey: "toolTailor", href: activeId ? `/resume-maker/${activeId}/tailor` : "/resume-maker/tailor", active: isTailor, wip: RESUME_TOOLS_WIP },
    { labelKey: "toolInterview", href: activeId ? `/resume-maker/${activeId}/interview` : "/resume-maker/interview", active: isInterview, wip: RESUME_TOOLS_WIP }
  ];

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      const target = pathname || "/resume-maker";
      router.replace(`/login?redirect=${encodeURIComponent(target)}`);
    }
  }, [isReady, isAuthenticated, pathname, router]);

  if (!isReady) return <FullState label={t.loading} />;
  if (!isAuthenticated) return <FullState label={t.redirectingToLogin} />;

  // 이력서 API 는 STUDENT(구직 회원) 전용이라, 다른 역할은 클릭 후 403 을 맞기 전에
  // 미리 안내한다.
  if (user && user.role !== "STUDENT") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center font-sans">
        <p className={`${paperlogy.className} text-xl font-black text-[#0B1227]`}>{t.studentOnlyTitle}</p>
        <p className="max-w-sm text-[14px] leading-relaxed text-muted-foreground">{t.studentOnlyDesc}</p>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          {t.goHome}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="container relative flex h-14 max-w-6xl items-center gap-3">
          {left ? <div className="flex shrink-0 items-center">{left}</div> : null}
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/resume-maker" className="shrink-0">
              <Image src="/img_logo.webp" alt="aply" width={180} height={48} className="h-6 w-auto md:h-7" priority />
            </Link>
          </div>
          {/* 상단 도구 네비 (데스크탑) — 컨테이너 정중앙 고정(좌/우 슬롯 너비와 무관) */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex xl:gap-8">
            {tools.map((tool) => (
              <Link
                key={tool.labelKey}
                href={tool.href}
                className={`inline-flex items-center gap-1 text-xs transition-colors ${
                  tool.active ? "font-semibold text-foreground" : "font-medium text-muted-foreground hover:text-foreground"
                }`}
              >
                {t[tool.labelKey]}
                {tool.wip ? <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">{t.wipBadge}</span> : null}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <GnbTicket />
            {right}
            <ResumeMakerLanguageSwitch />
          </div>
        </div>
        {/* 상단 도구 네비 (모바일) — 가운데 정렬, 넘치면 가로 스크롤 */}
        <nav className="flex items-center justify-center gap-6 overflow-x-auto border-t border-border/60 px-4 py-2.5 md:hidden">
          {tools.map((tool) => (
            <Link
              key={tool.labelKey}
              href={tool.href}
              className={`inline-flex shrink-0 items-center gap-1 text-xs transition-colors ${
                tool.active ? "font-semibold text-foreground" : "font-medium text-muted-foreground hover:text-foreground"
              }`}
            >
              {t[tool.labelKey]}
              {tool.wip ? <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">{t.wipBadge}</span> : null}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
