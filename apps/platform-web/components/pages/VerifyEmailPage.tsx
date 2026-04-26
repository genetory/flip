"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { verifyEmailToken } from "../../lib/auth-client";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";

export function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const { setAuthenticatedUser } = useAuthSession();
  const { locale } = useLanguage();
  const [state, setState] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const copy = {
    title: locale === "ko" ? "이메일 인증" : "Email verification",
    missingToken: locale === "ko" ? "인증 토큰이 없습니다." : "Missing verification token.",
    verifying: locale === "ko" ? "인증을 진행하고 있습니다..." : "Verifying your email...",
    success: locale === "ko" ? "인증이 완료되었습니다. 잠시 후 이동합니다." : "Email verified. Redirecting shortly.",
    failed: locale === "ko" ? "이메일 인증에 실패했습니다." : "Email verification failed.",
    login: locale === "ko" ? "로그인" : "Sign in",
    helpPage: locale === "ko" ? "인증 안내 페이지" : "Verification help page"
  } as const;

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMessage(copy.missingToken);
      return;
    }

    let mounted = true;
    void (async () => {
      try {
        const { user } = await verifyEmailToken(token);
        if (!mounted) return;
        setAuthenticatedUser(user);
        setState("success");

        setTimeout(() => {
          router.push("/signup/completed");
          router.refresh();
        }, 800);
      } catch (e) {
        if (!mounted) return;
        setState("error");
        setErrorMessage(e instanceof Error ? e.message : copy.failed);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, router, setAuthenticatedUser, copy.missingToken, copy.failed]);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <section className="mx-auto max-w-xl space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card md:p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight">{copy.title}</h1>
          {state === "verifying" ? <p className="text-sm text-muted-foreground">{copy.verifying}</p> : null}
          {state === "success" ? <p className="text-sm text-foreground">{copy.success}</p> : null}
          {state === "error" ? (
            <>
              <p className="text-sm font-medium text-destructive">{errorMessage ?? copy.failed}</p>
              <div className="flex items-center gap-2">
                <Button variant="dark" asChild>
                  <Link href="/login">{copy.login}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/signup/verify-email">{copy.helpPage}</Link>
                </Button>
              </div>
            </>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
}
