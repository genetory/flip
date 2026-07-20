"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useLanguage } from "../i18n/LanguageProvider";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { Button } from "../ui/button";
import {
  AuthApiError,
  signupWithEmail,
} from "../../lib/auth-client";
import { getAuthPageMessages } from "../../lib/auth-messages";

// Only allow same-origin relative redirects so we never bounce users to
// an arbitrary external URL after signup.
function sanitizeNextParam(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.length > 500) return null;
  return trimmed;
}

export function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = sanitizeNextParam(searchParams.get("next"));
  const { locale } = useLanguage();
  const { setAuthenticatedUser } = useAuthSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [companyName, setCompanyName] = useState("");
  // 로그인 화면의 '파트너(기업)' 토글에서 넘어오면 기업 가입을 미리 선택한다.
  const [accountType, setAccountType] = useState<"GENERAL" | "BUSINESS">(searchParams.get("type") === "business" ? "BUSINESS" : "GENERAL");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const copy = getAuthPageMessages(locale).signup;
  // Event landings (e.g. /events/saju) just want a quick general-account
  // signup — skip the account-type picker entirely so the viral funnel
  // stays one tap. Business signups still need to choose explicitly.
  const isEventFlow = Boolean(nextParam?.startsWith("/events/"));
  const phoneLabelByLocale = {
    ko: "휴대폰 번호",
    en: "Phone number",
    "zh-CN": "手机号",
    vi: "Số điện thoại",
    ja: "携帯電話番号",
    id: "Nomor ponsel"
  } as const;
  const phonePlaceholderByLocale = {
    ko: "010-1234-5678",
    en: "+82-10-1234-5678",
    "zh-CN": "010-1234-5678",
    vi: "010-1234-5678",
    ja: "010-1234-5678",
    id: "010-1234-5678"
  } as const;
  const phoneRequiredMessageByLocale = {
    ko: "휴대폰 번호를 입력해주세요.",
    en: "Please enter phone number.",
    "zh-CN": "请输入手机号。",
    vi: "Vui lòng nhập số điện thoại.",
    ja: "携帯電話番号を入力してください。",
    id: "Silakan masukkan nomor ponsel."
  } as const;
  const emailExistsMessageByLocale = {
    ko: "이미 가입된 이메일입니다. 로그인해주세요.",
    en: "This email is already registered. Please sign in.",
    "zh-CN": "该邮箱已注册，请登录。",
    vi: "Email này đã được đăng ký. Vui lòng đăng nhập.",
    ja: "このメールアドレスは既に登録されています。ログインしてください。",
    id: "Email ini sudah terdaftar. Silakan masuk."
  } as const;
  const emailUndeliverableMessageByLocale = {
    ko: "이 이메일 도메인은 메일을 받을 수 없습니다. 도메인 주소를 확인하거나 Gmail, 네이버 같은 다른 이메일로 가입해 주세요.",
    en: "This email domain cannot receive mail. Please check the domain or try a different provider (Gmail, Naver, etc.).",
    "zh-CN": "该邮箱所属域名无法接收邮件，请检查地址或改用 Gmail、Naver 等其他邮箱。",
    vi: "Tên miền email này không thể nhận thư. Vui lòng kiểm tra lại hoặc dùng email khác (Gmail, Naver, ...).",
    ja: "このメールドメインはメールを受信できません。アドレスをご確認の上、Gmail や Naver など他のメールでお試しください。",
    id: "Domain email ini tidak dapat menerima email. Periksa kembali atau gunakan layanan lain seperti Gmail atau Naver."
  } as const;
  const isBusiness = accountType === "BUSINESS";
  const emailLabel = copy.emailLabel;
  const accountTypeOptions = [
    { value: "GENERAL" as const, label: copy.accountTypeGeneral },
    { value: "BUSINESS" as const, label: copy.accountTypeBusiness }
  ];

  function resetSignupForm() {
    setName("");
    setEmail("");
    setPhoneNumber("");
    setPassword("");
    setPasswordConfirm("");
    setShowPassword(false);
    setShowPasswordConfirm(false);
    setCompanyName("");
    setAccountType("GENERAL");
    setErrorMessage(null);
  }

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Clear stale form state when returning via back/forward cache.
        resetSignupForm();
      }
    };

    const onBeforeUnload = () => {
      resetSignupForm();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pageshow", onPageShow);
      window.addEventListener("beforeunload", onBeforeUnload);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("pageshow", onPageShow);
        window.removeEventListener("beforeunload", onBeforeUnload);
      }
    };
  }, []);

  const submitLabel = useMemo(() => copy.submitIdle, [copy.submitIdle]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (isBusiness && !phoneNumber.trim()) {
      setErrorMessage(phoneRequiredMessageByLocale[locale] ?? phoneRequiredMessageByLocale.en);
      return;
    }

    if (isBusiness && !companyName.trim()) {
      setErrorMessage(copy.companyNameRequired);
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage(copy.passwordMismatch);
      return;
    }

    setIsSubmitting(true);

    try {
      const emailLocale = locale === "ko" ? "ko" : locale === "ja" ? "en" : locale === "id" ? "en" : "en";
      const result = await signupWithEmail({
        name: name.trim(),
        email: email.trim(),
        password,
        accountType,
        phoneNumber: phoneNumber.trim() || undefined,
        partnerOrganizationName: isBusiness ? companyName.trim() : undefined,
        locale: emailLocale
      });
      if (!result.requiresEmailVerification) {
        if (result.user) {
          setAuthenticatedUser(result.user);
        }
        router.push(nextParam ?? "/profile");
        router.refresh();
        return;
      }
      const params = new URLSearchParams({
        email: result.email
      });
      if (result.verifyUrl) {
        params.set("verifyUrl", result.verifyUrl);
      }
      if (nextParam) {
        params.set("next", nextParam);
      }
      router.push(`/signup/verify-email?${params.toString()}`);
      router.refresh();
    } catch (error) {
      if (error instanceof AuthApiError && error.code === "EMAIL_REGISTERED_DIFFERENT_ROLE") {
        setErrorMessage(copy.emailRegisteredAsGeneral);
        return;
      }
      if (error instanceof AuthApiError && error.code === "EMAIL_ALREADY_EXISTS") {
        setErrorMessage(emailExistsMessageByLocale[locale] ?? emailExistsMessageByLocale.en);
        return;
      }
      if (error instanceof AuthApiError && error.code === "EMAIL_DOMAIN_UNDELIVERABLE") {
        setErrorMessage(emailUndeliverableMessageByLocale[locale] ?? emailUndeliverableMessageByLocale.en);
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
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <section>
          <div className="mx-auto max-w-md rounded-2xl border border-border/60 bg-card p-6 md:p-8">
            <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
              {!isEventFlow ? (
                <div className="space-y-2">
                  <span className="block text-sm font-medium">{copy.accountTypeLabel}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {accountTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setAccountType(option.value);
                          setErrorMessage(null);
                        }}
                        className={
                          accountType === option.value
                            ? "h-10 rounded-md border border-foreground bg-foreground px-3 text-sm font-medium text-background"
                            : "h-10 rounded-md border border-input/60 bg-background px-3 text-sm font-medium text-muted-foreground"
                        }
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <label className="block text-sm font-medium">
                {copy.nameLabel}
                <input
                  type="text"
                  placeholder={copy.namePlaceholder}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-input/60 bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                {emailLabel}
                <input
                  type="email"
                  placeholder={copy.emailPlaceholder}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-input/60 bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
              </label>
              {isBusiness ? (
                <>
                  <label className="block text-sm font-medium">
                    {copy.companyNameLabel}
                    <input
                      type="text"
                      placeholder={copy.companyNamePlaceholder}
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      className="mt-2 h-10 w-full rounded-md border border-input/60 bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
                      required
                      maxLength={200}
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    {phoneLabelByLocale[locale] ?? phoneLabelByLocale.en}
                    <input
                      type="tel"
                      placeholder={phonePlaceholderByLocale[locale] ?? phonePlaceholderByLocale.en}
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      className="mt-2 h-10 w-full rounded-md border border-input/60 bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    />
                  </label>
                </>
              ) : null}
              <label className="block text-sm font-medium">
                {copy.passwordLabel}
                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={copy.passwordPlaceholder}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-10 w-full rounded-md border border-input/60 bg-background pl-3 pr-10 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
                    aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                    aria-pressed={showPassword}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
              <label className="block text-sm font-medium">
                {copy.passwordConfirmLabel}
                <div className="relative mt-2">
                  <input
                    type={showPasswordConfirm ? "text" : "password"}
                    placeholder={copy.passwordConfirmPlaceholder}
                    value={passwordConfirm}
                    onChange={(event) => setPasswordConfirm(event.target.value)}
                    className="h-10 w-full rounded-md border border-input/60 bg-background pl-3 pr-10 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
                    aria-label={showPasswordConfirm ? copy.hidePassword : copy.showPassword}
                    aria-pressed={showPasswordConfirm}
                    tabIndex={-1}
                  >
                    {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
              <p className="text-sm text-muted-foreground">
                {accountType === "BUSINESS"
                  ? copy.businessHelperText
                  : copy.generalHelperText}
              </p>
              {errorMessage ? <p className="text-sm font-medium text-destructive">{errorMessage}</p> : null}
              <div className="flex items-center gap-2">
                <Button variant="dark" size="lg" className="h-11 w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? copy.submitPending : submitLabel}
                </Button>
              </div>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {copy.loginPrompt}{" "}
              <Link href="/login" className="font-semibold text-foreground">
                {copy.loginLink}
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
