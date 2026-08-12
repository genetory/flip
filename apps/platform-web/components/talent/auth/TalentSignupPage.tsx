"use client";

// 리뉴얼된 Talent 회원가입 — 학생(일반) 계정 중심. UI 는 Toss 톤, 로직은 기존과 동일
// (signupWithEmail / 이메일 인증 / 에러 코드 처리). 파트너(기업) 가입은 기존 /signup 경로 유지.
import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { useLanguage } from "../../i18n/LanguageProvider";
import { AuthApiError, signupWithEmail } from "../../../lib/auth-client";
import { getAuthPageMessages } from "../../../lib/auth-messages";
import { TalentButton } from "../TalentButton";
import { TalentAuthLayout, TalentField, talentInputClass } from "./TalentAuthLayout";
import { TalentSocialButtons, TalentOrDivider } from "./TalentSocialButtons";
import { usePlatformT } from "../../../lib/i18n";

function sanitizeNextParam(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.length > 500) return null;
  return trimmed;
}

const emailExistsMessage = {
  ko: "이미 가입된 이메일입니다. 로그인해주세요.",
  en: "This email is already registered. Please sign in.",
  "zh-CN": "该邮箱已注册，请登录。",
  vi: "Email này đã được đăng ký. Vui lòng đăng nhập.",
  ja: "このメールアドレスは既に登録されています。ログインしてください。",
  id: "Email ini sudah terdaftar. Silakan masuk."
} as const;

const emailUndeliverableMessage = {
  ko: "이 이메일 도메인은 메일을 받을 수 없습니다. Gmail, 네이버 같은 다른 이메일로 가입해 주세요.",
  en: "This email domain cannot receive mail. Please try a different provider (Gmail, Naver, etc.).",
  "zh-CN": "该邮箱所属域名无法接收邮件，请改用 Gmail、Naver 等其他邮箱。",
  vi: "Tên miền email này không thể nhận thư. Vui lòng dùng email khác (Gmail, Naver, ...).",
  ja: "このメールドメインはメールを受信できません。Gmail や Naver など他のメールでお試しください。",
  id: "Domain email ini tidak dapat menerima email. Gunakan layanan lain seperti Gmail atau Naver."
} as const;

export function TalentSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = sanitizeNextParam(searchParams.get("next"));
  const { locale } = useLanguage();
  const { setAuthenticatedUser } = useAuthSession();
  const t = usePlatformT();
  const copy = getAuthPageMessages(locale).signup;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginHref = nextParam ? `/talent/login?next=${encodeURIComponent(nextParam)}` : "/talent/login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (password !== passwordConfirm) {
      setErrorMessage(copy.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      const emailLocale = locale === "ko" ? "ko" : "en";
      const result = await signupWithEmail({
        name: name.trim(),
        email: email.trim(),
        password,
        accountType: "GENERAL",
        locale: emailLocale
      });
      if (!result.requiresEmailVerification) {
        if (result.user) setAuthenticatedUser(result.user);
        router.push(nextParam ?? "/talent");
        router.refresh();
        return;
      }
      const params = new URLSearchParams({ email: result.email });
      if (result.verifyUrl) params.set("verifyUrl", result.verifyUrl);
      if (nextParam) params.set("next", nextParam);
      router.push(`/signup/verify-email?${params.toString()}`);
      router.refresh();
    } catch (error) {
      if (error instanceof AuthApiError && error.code === "EMAIL_REGISTERED_DIFFERENT_ROLE") {
        setErrorMessage(copy.emailRegisteredAsGeneral);
        return;
      }
      if (error instanceof AuthApiError && error.code === "EMAIL_ALREADY_EXISTS") {
        setErrorMessage(emailExistsMessage[locale] ?? emailExistsMessage.en);
        return;
      }
      if (error instanceof AuthApiError && error.code === "EMAIL_DOMAIN_UNDELIVERABLE") {
        setErrorMessage(emailUndeliverableMessage[locale] ?? emailUndeliverableMessage.en);
        return;
      }
      if (error instanceof AuthApiError && error.code === "REGISTRATION_FAILED") {
        setErrorMessage(error.message);
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : copy.submitFallbackError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <TalentAuthLayout
      title={t("첫 취업 준비, 여기서 시작해요", "Start your first job search here", "在这里开启你的首次求职", "Bắt đầu hành trình xin việc đầu tiên", "初めての就活はここから", "Mulai pencarian kerja pertama di sini")}
      subtitle={t("이메일로 간단히 가입하고 나만의 취업 준비를 시작해보세요.", "Sign up with your email and start preparing for your career.", "用邮箱轻松注册，开始你的求职准备。", "Đăng ký bằng email và bắt đầu chuẩn bị xin việc.", "メールで簡単に登録して就活準備を始めましょう。", "Daftar dengan email dan mulai persiapan karier Anda.")}
      footer={
        <div className="space-y-3">
          <p className="text-[14px] text-[#8B95A1]">
            {copy.loginPrompt}{" "}
            <Link href={loginHref} className="font-bold text-[#0B46E8]">
              {copy.loginLink}
            </Link>
          </p>
          {/* 회원가입은 유형별로 구분 — 기업·대학·기관은 별도 파트너 가입 경로. */}
          <p className="text-[13px] text-[#B0B8C1]">
            {t("기업·대학·기관이신가요?", "A company, university, or institution?", "是企业、大学或机构吗？", "Là doanh nghiệp, trường học hay tổ chức?", "企業・大学・機関の方ですか？", "Perusahaan, universitas, atau lembaga?")}{" "}
            <Link href="/partner/signup" className="font-semibold text-[#8B95A1] underline underline-offset-2 hover:text-[#4E5968]">
              {t("파트너로 가입하기", "Sign up as a partner", "注册为合作伙伴", "Đăng ký làm đối tác", "パートナー登録", "Daftar sebagai mitra")}
            </Link>
          </p>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
        <TalentField label={copy.nameLabel}>
          <input
            type="text"
            placeholder={copy.namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={talentInputClass}
            required
          />
        </TalentField>
        <TalentField label={copy.emailLabel}>
          <input
            type="email"
            placeholder={copy.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={talentInputClass}
            required
          />
        </TalentField>
        <TalentField label={copy.passwordLabel}>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={copy.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${talentInputClass} pr-12`}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-4 text-[#8B95A1] transition hover:text-[#4E5968]"
              aria-label={showPassword ? copy.hidePassword : copy.showPassword}
              aria-pressed={showPassword}
              tabIndex={-1}
            >
              {showPassword ? <EyeSlash className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </TalentField>
        <TalentField label={copy.passwordConfirmLabel}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder={copy.passwordConfirmPlaceholder}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className={talentInputClass}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </TalentField>
        <p className="text-[13px] leading-relaxed text-[#8B95A1]">{copy.generalHelperText}</p>
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
