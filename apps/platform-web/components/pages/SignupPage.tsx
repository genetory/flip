"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
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

export function SignupPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const { setAuthenticatedUser } = useAuthSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"GENERAL" | "BUSINESS">("GENERAL");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const copy = getAuthPageMessages(locale).signup;
  const phoneLabelByLocale = {
    ko: "휴대폰 번호",
    en: "Phone number",
    "zh-CN": "手机号",
    vi: "Số điện thoại"
  } as const;
  const phonePlaceholderByLocale = {
    ko: "010-1234-5678",
    en: "+82-10-1234-5678",
    "zh-CN": "010-1234-5678",
    vi: "010-1234-5678"
  } as const;
  const phoneRequiredMessageByLocale = {
    ko: "휴대폰 번호를 입력해주세요.",
    en: "Please enter phone number.",
    "zh-CN": "请输入手机号。",
    vi: "Vui lòng nhập số điện thoại."
  } as const;
  const emailExistsMessageByLocale = {
    ko: "이미 가입된 이메일입니다. 로그인해주세요.",
    en: "This email is already registered. Please sign in.",
    "zh-CN": "该邮箱已注册，请登录。",
    vi: "Email này đã được đăng ký. Vui lòng đăng nhập."
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

    setIsSubmitting(true);

    try {
      const emailLocale = locale === "ko" ? "ko" : "en";
      const result = await signupWithEmail({
        name: name.trim(),
        email: email.trim(),
        password,
        accountType,
        phoneNumber: phoneNumber.trim() || undefined,
        locale: emailLocale
      });
      if (!result.requiresEmailVerification) {
        if (result.user) {
          setAuthenticatedUser(result.user);
        }
        router.push("/signup/completed");
        router.refresh();
        return;
      }
      const params = new URLSearchParams({
        email: result.email
      });
      if (result.verifyUrl) {
        params.set("verifyUrl", result.verifyUrl);
      }
      router.push(`/signup/verify-email?${params.toString()}`);
      router.refresh();
    } catch (error) {
      if (error instanceof AuthApiError && error.code === "EMAIL_ALREADY_EXISTS") {
        setErrorMessage(emailExistsMessageByLocale[locale] ?? emailExistsMessageByLocale.en);
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
              ) : null}
              <label className="block text-sm font-medium">
                {copy.passwordLabel}
                <input
                  type="password"
                  placeholder={copy.passwordPlaceholder}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-input/60 bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
              </label>
              <p className="text-sm text-muted-foreground">
                {accountType === "BUSINESS"
                  ? copy.businessHelperText
                  : copy.generalHelperText}
              </p>
              {errorMessage ? <p className="text-sm font-medium text-destructive">{errorMessage}</p> : null}
              <div className="flex items-center gap-2">
                <Button variant="dark" size="lg" className="h-11 w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? copy.submitPending : <>{submitLabel} <ArrowRight /></>}
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
