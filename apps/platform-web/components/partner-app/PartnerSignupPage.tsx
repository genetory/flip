"use client";

// 리뉴얼된 파트너(기업) 회원가입 — 이메일로 간단히 가입(accountType: BUSINESS).
// 회사 정보는 가입 후 앱에서 등록(회사 생성 폼) → 여기선 이름·이메일·비밀번호만.
// UI 는 Talent 회원가입과 동일한 리뉴얼 톤/컴포넌트를 재사용.
import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { usePlatformT } from "../../lib/i18n";
import { AuthApiError, signupWithEmail } from "../../lib/auth-client";
import { getAuthPageMessages } from "../../lib/auth-messages";
import { TalentButton } from "../talent/TalentButton";
import { TalentAuthLayout, TalentField, talentInputClass } from "../talent/auth/TalentAuthLayout";

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

export function PartnerSignupPage() {
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

  const loginHref = nextParam ? `/partner/login?next=${encodeURIComponent(nextParam)}` : "/partner/login";

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
        accountType: "BUSINESS",
        locale: emailLocale
      });
      if (!result.requiresEmailVerification) {
        if (result.user) setAuthenticatedUser(result.user);
        router.push(nextParam ?? "/partner/home");
        router.refresh();
        return;
      }
      const params = new URLSearchParams({ email: result.email });
      if (result.verifyUrl) params.set("verifyUrl", result.verifyUrl);
      params.set("next", nextParam ?? "/partner/home");
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
      title={t("APLY에서 채용을 시작하세요", "Start hiring on APLY", "在 APLY 上开始招聘", "Bắt đầu tuyển dụng trên APLY", "APLYで採用を始めましょう", "Mulai merekrut di APLY")}
      subtitle={t("이메일로 간단히 가입하고, 공고 등록·지원자 관리를 시작해보세요. 회사 정보는 가입 후 등록해요.", "Sign up quickly with your email and start posting jobs and managing applicants. Add company details after signing up.", "用邮箱快速注册，即可发布职位、管理应聘者。公司信息注册后再填写。", "Đăng ký nhanh bằng email và bắt đầu đăng tin, quản lý ứng viên. Thông tin công ty điền sau khi đăng ký.", "メールで簡単に登録し、求人掲載や応募者管理を始めましょう。会社情報は登録後に入力します。", "Daftar cepat dengan email dan mulai pasang lowongan serta kelola pelamar. Data perusahaan diisi setelah daftar.")}
      footer={
        <div className="space-y-3">
          <p className="text-[14px] text-[#8B95A1]">
            {t("이미 계정이 있으신가요?", "Already have an account?", "已有账户？", "Đã có tài khoản?", "すでにアカウントをお持ちですか？", "Sudah punya akun?")}{" "}
            <Link href={loginHref} className="font-bold text-[#0B46E8]">
              {t("로그인", "Sign in", "登录", "Đăng nhập", "ログイン", "Masuk")}
            </Link>
          </p>
          <p className="text-[13px] text-[#B0B8C1]">
            {t("구직자이신가요?", "Are you a job seeker?", "您是求职者？", "Bạn là người tìm việc?", "求職者の方ですか？", "Pencari kerja?")}{" "}
            <Link href="/talent/signup" className="font-semibold text-[#8B95A1] underline underline-offset-2 hover:text-[#4E5968]">
              {t("구직자로 가입하기", "Sign up as a job seeker", "以求职者身份注册", "Đăng ký với tư cách người tìm việc", "求職者として登録", "Daftar sebagai pencari kerja")}
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
        {errorMessage ? <p className="text-[13.5px] font-medium text-[#F04452]">{errorMessage}</p> : null}
        <TalentButton type="submit" disabled={isSubmitting} variant="primary" size="lg" fullWidth aria-label={copy.submitIdle}>
          {isSubmitting ? copy.submitPending : copy.submitIdle}
        </TalentButton>
      </form>
    </TalentAuthLayout>
  );
}
