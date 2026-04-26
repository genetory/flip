"use client";

import Link from "next/link";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";

export function SignupCompletedPage() {
  const { isReady, isAuthenticated } = useAuthSession();
  const { locale } = useLanguage();
  const startHref = "/";

  const copy = {
    title: locale === "ko" ? "회원가입이 완료되었습니다" : "Signup complete",
    description:
      locale === "ko"
        ? "환영합니다. 준비가 끝났어요. 바로 시작해볼까요?"
        : "Welcome aboard. You're all set, let's get started.",
    checkingSession: locale === "ko" ? "세션을 확인하고 있습니다..." : "Checking your session...",
    start: locale === "ko" ? "시작하기" : "Get started",
    goLogin: locale === "ko" ? "로그인하러 가기" : "Go to login",
    goHome: locale === "ko" ? "홈으로 가기" : "Go home"
  } as const;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <section className="mx-auto max-w-xl space-y-4 rounded-2xl border border-border/60 bg-card p-6 md:p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.description}</p>

          {!isReady ? <p className="text-sm text-muted-foreground">{copy.checkingSession}</p> : null}

          <div className="flex flex-wrap items-center gap-2">
            {isReady && isAuthenticated ? (
              <Button variant="dark" asChild>
                <Link href={startHref}>{copy.start}</Link>
              </Button>
            ) : (
              <>
                <Button variant="dark" asChild>
                  <Link href="/login">{copy.goLogin}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">{copy.goHome}</Link>
                </Button>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
