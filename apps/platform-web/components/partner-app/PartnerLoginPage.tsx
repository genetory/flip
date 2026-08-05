"use client";

// 파트너(기업) 로그인 — Toss 톤, 로직은 공용(loginWithEmail / next / 이메일 인증).
// 로그인 성공 시 역할별 기본으로(파트너→/partner/home). 가입은 기업 계정 가입으로.
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { AuthApiError, getPostLoginUrl, loginWithEmail } from "../../lib/auth-client";
import { getAuthPageMessages } from "../../lib/auth-messages";
import { TalentButton } from "../talent/TalentButton";
import { TalentAuthLayout, TalentField, talentInputClass } from "../talent/auth/TalentAuthLayout";
import { TalentSocialButtons, TalentOrDivider } from "../talent/auth/TalentSocialButtons";

function sanitizeNextParam(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  return trimmed;
}

export function PartnerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = sanitizeNextParam(searchParams.get("next"));
  const { setAuthenticatedUser } = useAuthSession();
  const { locale } = useLanguage();
  const copy = useMemo(() => getAuthPageMessages(locale).login, [locale]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signupHref = nextParam ? `/signup?type=business&next=${encodeURIComponent(nextParam)}` : "/signup?type=business";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { user } = await loginWithEmail({ email, password });
      setAuthenticatedUser(user);

      if (nextParam) {
        router.push(nextParam);
        router.refresh();
        return;
      }
      const nextUrl = getPostLoginUrl(user.role);
      if (nextUrl.startsWith("http")) {
        window.location.href = nextUrl;
        return;
      }
      router.push(nextUrl);
      router.refresh();
    } catch (error) {
      if (error instanceof AuthApiError && error.code === "EMAIL_VERIFICATION_REQUIRED") {
        const params = new URLSearchParams();
        if (email.trim()) params.set("email", email.trim());
        router.push(`/signup/verify-email?${params.toString()}`);
        router.refresh();
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : copy.submitFallbackError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <TalentAuthLayout
      badge="파트너"
      backHref="/partner"
      title="다시 오셨네요"
      subtitle="로그인하고 채용을 이어가요."
      footer={
        <p className="text-[14px] text-[#8B95A1]">
          {copy.signupPrompt}{" "}
          <Link href={signupHref} className="font-bold text-[#0B46E8]">
            기업 계정 만들기
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TalentField label={copy.emailLabel}>
          <input
            type="email"
            placeholder={copy.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={talentInputClass}
            required
            autoComplete="email"
          />
        </TalentField>
        <TalentField label={copy.passwordLabel}>
          <input
            type="password"
            placeholder={copy.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={talentInputClass}
            required
            autoComplete="current-password"
          />
        </TalentField>
        {errorMessage ? <p className="text-[13.5px] font-medium text-[#F04452]">{errorMessage}</p> : null}
        <TalentButton type="submit" disabled={isSubmitting} variant="primary" size="lg" fullWidth aria-label={copy.submitIdle}>
          {isSubmitting ? copy.submitPending : copy.submitIdle}
        </TalentButton>
      </form>

      <TalentOrDivider />
      <TalentSocialButtons />
    </TalentAuthLayout>
  );
}
