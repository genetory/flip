"use client";

// 리뉴얼된 Talent 로그인 — UI 는 Toss 톤, 로직은 기존과 동일(loginWithEmail / next / 이메일 인증 / 소셜).
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { useLanguage } from "../../i18n/LanguageProvider";
import { AuthApiError, getPostLoginUrl, loginWithEmail } from "../../../lib/auth-client";
import { getAuthPageMessages } from "../../../lib/auth-messages";
import { TalentButton } from "../TalentButton";
import { TalentAuthLayout, TalentField, talentInputClass } from "./TalentAuthLayout";
import { TalentSocialButtons, TalentOrDivider } from "./TalentSocialButtons";
import { usePlatformT } from "../../../lib/i18n";

// `?next=` 만 신뢰(open-redirect 방지). same-origin 내부 경로만 허용.
function sanitizeNextParam(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  return trimmed;
}

export function TalentLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = sanitizeNextParam(searchParams.get("next"));
  // 기본 복귀 경로는 Talent 홈.
  const { setAuthenticatedUser } = useAuthSession();
  const { locale } = useLanguage();
  const t = usePlatformT();
  const copy = useMemo(() => getAuthPageMessages(locale).login, [locale]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signupHref = nextParam ? `/talent/signup?next=${encodeURIComponent(nextParam)}` : "/talent/signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { user } = await loginWithEmail({ email, password });
      setAuthenticatedUser(user);

      // 명시적 next 가 있으면 그곳으로, 없으면 역할별 기본(학생→탤런트, 파트너→파트너).
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
      title={t("첫 커리어, 여기서 시작해요", "Your career starts here", "你的职业，从这里开始", "Sự nghiệp bắt đầu từ đây", "はじめてのキャリアはここから", "Karier Anda dimulai di sini")}
      subtitle={t("로그인하고 이력서부터 첫 지원까지 이어가세요.", "Sign in and go from resume to your first application.", "登录，从简历到首次投递一气呵成。", "Đăng nhập và đi từ hồ sơ đến lần ứng tuyển đầu tiên.", "ログインして履歴書から初応募まで進めましょう。", "Masuk dan lanjutkan dari resume hingga lamaran pertama.")}
      footer={
        <p className="text-[14px] text-[#8B95A1]">
          {copy.signupPrompt}{" "}
          <Link href={signupHref} className="font-bold text-[#0B46E8]">
            {copy.signupLink}
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
