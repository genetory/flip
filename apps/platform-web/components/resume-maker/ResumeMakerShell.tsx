"use client";

import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { CircleNotch, House, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { paperlogy } from "../../lib/fonts";
import { useShellCopy } from "../../lib/resume-maker-i18n/shell";
import { useQuotaCopy } from "../../lib/resume-maker-i18n/quota";
import { useAiUsage } from "../../lib/resume-maker-ai-usage";
import { useResumePresence } from "../../lib/resume-maker-resumes";
import { AiTicketStatusModal } from "./AiTicketStatusModal";
import { ResumeMakerLanguageSwitch } from "./ResumeMakerLanguageSwitch";
import { Footer } from "../site/Footer";
import { getActiveResumeId, setActiveResumeId } from "../../lib/resume-maker-active";
import { RESUME_TOOLS_WIP } from "../../lib/resume-maker-flags";

// 커리어 도구 공용 경량 셸. aply.global GNB에 노출되지 않는 독립 도구 묶음이라
// 표준 사이트 Header 대신 간결한 상단 바를 쓴다(로고 + 도구 네비 + 우측 슬롯).
// STUDENT 로그인 게이트는 기존 ResumeCoachListPage 패턴과 동일.

// GNB 우측 — 공용 AI 티켓 잔량(전 화면 공통). 잔량을 모르면(비STUDENT 등) 숨김.
function GnbTicket() {
  const { remaining, resetAt, dailyGrant } = useAiUsage();
  const q = useQuotaCopy();
  const [open, setOpen] = useState(false);
  if (remaining === null) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={q.remaining(remaining)}
        className="inline-flex items-center gap-1 rounded-full bg-[#0B46E8]/[0.06] px-2.5 py-1 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#0B46E8]/[0.12] active:scale-95"
      >
        <Sparkle weight="fill" className="h-4 w-4" aria-hidden />
        {remaining.toLocaleString()}
      </button>
      {open ? <AiTicketStatusModal remaining={remaining} resetAt={resetAt} dailyGrant={dailyGrant} onClose={() => setOpen(false)} /> : null}
    </>
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
  const { hasResume } = useResumePresence(); // 이력서가 없으면(=false) 도구 메뉴를 잠근다.

  // 현재 이력서(세 도구 공유) — 이력서 화면에 들어가면 그 id 를 활성으로 기억하고,
  // 메인 등 id 가 없는 화면에선 마지막 활성 id 를 쓴다.
  // 첫 세그먼트가 자소서 정적 경로면 이력서 id 로 오인하지 않는다.
  const rawSeg = pathname?.match(/^\/resume-maker\/([^/]+)\//)?.[1];
  const pathResumeId = rawSeg && rawSeg !== "cover-letters" && rawSeg !== "resumes" ? rawSeg : undefined;
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
  const isCoverLetters = pathname?.startsWith("/resume-maker/cover-letters") ?? false;
  const isResumes = pathname?.startsWith("/resume-maker/resumes") ?? false;
  const isTailor = pathname?.includes("/tailor") ?? false;
  const isInterview = pathname?.includes("/interview") ?? false;
  const isHome = pathname === "/resume-maker";
  // 편집 계열(편집·경험·온보딩·대화·미리보기·진단) — 홈/목록/도구가 아닌 이력서 작업 화면.
  const isEditor = !isHome && !isResumes && !isCoverLetters && !isTailor && !isInterview;
  // 이력서·자기소개서 탭은 '목록 화면'으로(선택된 이력서 편집기로 직행하지 않음). 홈은 전체 개요.
  const tools: { labelKey: "home" | "toolResumeMaker" | "toolCoverLetter" | "toolTailor" | "toolInterview"; href: string; active: boolean; wip?: boolean; home?: boolean; requiresResume?: boolean }[] = [
    { labelKey: "home", href: "/resume-maker", active: isHome, home: true },
    { labelKey: "toolResumeMaker", href: "/resume-maker/resumes", active: isResumes || isEditor },
    { labelKey: "toolCoverLetter", href: "/resume-maker/cover-letters", active: isCoverLetters },
    { labelKey: "toolTailor", href: "/resume-maker/tailor", active: isTailor, wip: RESUME_TOOLS_WIP, requiresResume: true },
    { labelKey: "toolInterview", href: "/resume-maker/interview", active: isInterview, wip: RESUME_TOOLS_WIP, requiresResume: true }
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
    // resume-maker 전 화면의 primary/accent(버튼·링크 등 공용 Button 포함)를 홈 브랜드
    // 블루(#0B46E8 = hsl(224 91% 48%))로 통일. 전역 테마는 건드리지 않는 스코프 오버라이드.
    <div
      className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased"
      style={{ ["--primary"]: "224 91% 48%", ["--accent"]: "224 91% 48%" } as CSSProperties}
    >
      <header className="sticky top-0 z-40 border-b border-[#F2F4F6] bg-white print:hidden">
        <div className="container relative flex h-14 max-w-6xl items-center gap-3">
          {left ? <div className="flex shrink-0 items-center">{left}</div> : null}
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/" className="shrink-0">
              <Image src="/img_logo.webp" alt="aply" width={180} height={48} className="h-6 w-auto md:h-7" priority />
            </Link>
          </div>
          {/* 상단 도구 네비 (데스크탑) — 세그먼트형 pill, 컨테이너 정중앙 고정 */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full bg-[#F2F4F6] p-1 md:flex">
            {tools.map((tool) => {
              const locked = Boolean(tool.requiresResume) && hasResume === false;
              const inner = (
                <>
                  {tool.home ? <House weight={tool.active ? "fill" : "bold"} className="h-4 w-4" aria-hidden /> : null}
                  {t[tool.labelKey]}
                  {tool.wip ? <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">{t.wipBadge}</span> : null}
                </>
              );
              return locked ? (
                <span
                  key={tool.labelKey}
                  aria-disabled="true"
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-[#C9CDD2]"
                >
                  {inner}
                </span>
              ) : (
                <Link
                  key={tool.labelKey}
                  href={tool.href}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] transition ${
                    tool.active ? "bg-white font-bold text-[#0B46E8] shadow-sm" : "font-semibold text-[#4E5968] hover:text-[#191F28]"
                  }`}
                >
                  {inner}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <GnbTicket />
            {right}
            <ResumeMakerLanguageSwitch />
          </div>
        </div>
        {/* 상단 도구 네비 (모바일) — pill, 가운데 정렬, 넘치면 가로 스크롤 */}
        <nav className="flex items-center justify-center gap-1.5 overflow-x-auto border-t border-[#F2F4F6] px-4 py-2 md:hidden">
          {tools.map((tool) => {
            const locked = Boolean(tool.requiresResume) && hasResume === false;
            const inner = (
              <>
                {tool.home ? <House weight={tool.active ? "fill" : "bold"} className="h-4 w-4" aria-hidden /> : null}
                {t[tool.labelKey]}
                {tool.wip ? <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">{t.wipBadge}</span> : null}
              </>
            );
            return locked ? (
              <span
                key={tool.labelKey}
                aria-disabled="true"
                className="inline-flex shrink-0 cursor-not-allowed items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-[#C9CDD2]"
              >
                {inner}
              </span>
            ) : (
              <Link
                key={tool.labelKey}
                href={tool.href}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] transition ${
                  tool.active ? "bg-[#EDF1FD] font-bold text-[#0B46E8]" : "font-semibold text-[#4E5968] hover:text-[#191F28]"
                }`}
              >
                {inner}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      {/* 푸터 위 디바이더(상단 보더) 제거 — resume-maker 화면에서만. 인쇄(PDF)엔 안 나오게 print:hidden */}
      <div className="[&>footer]:border-t-0 print:hidden">
        <Footer />
      </div>
    </div>
  );
}
