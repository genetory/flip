"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useLanguage } from "../i18n/LanguageProvider";
import { resendVerificationEmail } from "../../lib/auth-client";

export function SignupVerifyEmailPage() {
  const { locale } = useLanguage();
  const params = useSearchParams();
  const email = useMemo(() => params.get("email")?.trim() ?? "", [params]);
  const initialVerifyUrl = useMemo(() => params.get("verifyUrl")?.trim() ?? "", [params]);
  const [devVerifyUrl, setDevVerifyUrl] = useState(initialVerifyUrl);
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copy = {
    title: locale === "ko" ? "이메일 인증이 필요합니다" : "Email verification required",
    description:
      locale === "ko"
        ? "가입이 완료되었습니다. 인증 메일의 링크를 클릭하면 로그인할 수 있습니다."
        : "Signup is complete. Click the link in your verification email to sign in.",
    targetEmailLabel: locale === "ko" ? "인증 대상 이메일" : "Verification email",
    targetEmailFallback: locale === "ko" ? "가입한 이메일 주소를 확인해주세요." : "Please check your signup email address.",
    alreadyVerified: locale === "ko" ? "이미 인증 완료된 계정입니다. 바로 로그인해주세요." : "This account is already verified. Please sign in.",
    resendSent: locale === "ko" ? "인증 메일을 다시 보냈습니다. 받은 편지함을 확인해주세요." : "Verification email resent. Please check your inbox.",
    resendUnavailable:
      locale === "ko"
        ? "인증 메일을 보낼 수 없는 상태입니다. 잠시 후 다시 시도해주세요."
        : "Unable to send verification email right now. Please try again later.",
    resendFailed: locale === "ko" ? "인증 메일 재발송에 실패했습니다." : "Failed to resend verification email.",
    resendLoading: locale === "ko" ? "재발송 중..." : "Resending...",
    resendButton: locale === "ko" ? "인증 메일 다시 보내기" : "Resend verification email",
    goLogin: locale === "ko" ? "로그인으로 이동" : "Go to login",
    devLinkLabel: locale === "ko" ? "개발 환경 링크" : "Dev environment link"
  } as const;

  async function handleResend() {
    if (!email) return;
    setIsSending(true);
    setError(null);
    setNotice(null);

    try {
      const result = await resendVerificationEmail(email, locale);
      if (result.verifyUrl) setDevVerifyUrl(result.verifyUrl);

      if (result.alreadyVerified) {
        setNotice(copy.alreadyVerified);
        return;
      }
      if (result.sent) {
        setNotice(copy.resendSent);
        return;
      }
      setNotice(copy.resendUnavailable);
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.resendFailed);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <section className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-border/60 bg-card p-6 md:p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.description}</p>
          <p className="text-sm text-muted-foreground">
            {email ? `${copy.targetEmailLabel}: ${email}` : copy.targetEmailFallback}
          </p>

          {notice ? <p className="text-sm text-foreground">{notice}</p> : null}
          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="dark" onClick={() => void handleResend()} disabled={!email || isSending}>
              {isSending ? copy.resendLoading : copy.resendButton}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">{copy.goLogin}</Link>
            </Button>
          </div>

          {devVerifyUrl ? (
            <div className="rounded-md border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
              {copy.devLinkLabel}:{" "}
              <a className="underline" href={devVerifyUrl}>
                {devVerifyUrl}
              </a>
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
}
