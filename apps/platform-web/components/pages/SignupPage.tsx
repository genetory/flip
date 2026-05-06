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
  createPartnerSignupRequest,
  signupWithEmail,
} from "../../lib/auth-client";
import { getAuthPageMessages } from "../../lib/auth-messages";
import { getMembersMeta } from "../../lib/member-profile-client";
import { partnerIndustryLabel } from "../../lib/partner-industry-labels";

const COMPANY_SIZE_LABELS: Record<string, { ko: string; en: string }> = {
  SIZE_1_10: { ko: "1-10명", en: "1-10" },
  SIZE_UNDER_30: { ko: "30명 미만", en: "Under 30" },
  SIZE_UNDER_50: { ko: "50명 미만", en: "Under 50" },
  SIZE_OVER_100: { ko: "100명 이상", en: "100+" }
};

export function SignupPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const { setAuthenticatedUser } = useAuthSession();
  const [businessStep, setBusinessStep] = useState<1 | 2>(1);
  const [companyName, setCompanyName] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"GENERAL" | "BUSINESS">("GENERAL");
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [companySizeOptions, setCompanySizeOptions] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccessMessage, setRequestSuccessMessage] = useState<string | null>(null);
  const copy = getAuthPageMessages(locale).signup;
  const isBusiness = accountType === "BUSINESS";
  const emailLabel = copy.emailLabel;
  const accountTypeOptions = [
    { value: "GENERAL" as const, label: copy.accountTypeGeneral },
    { value: "BUSINESS" as const, label: copy.accountTypeBusiness }
  ];

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const meta = await getMembersMeta();
        if (!mounted) return;
        setIndustryOptions(meta.partnerIndustries);
        setCompanySizeOptions(meta.partnerCompanySizes);
      } catch {
        if (!mounted) return;
        setIndustryOptions(["IT"]);
        setCompanySizeOptions(["SIZE_1_10", "SIZE_UNDER_30", "SIZE_UNDER_50", "SIZE_OVER_100"]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isBusiness) {
      setBusinessStep(1);
      setCompanyName("");
      setCompanyIndustry("");
      setCompanySize("");
    }
  }, [isBusiness]);

  const submitLabel = useMemo(() => {
    if (!isBusiness) return copy.submitIdle;
    if (businessStep === 1) return locale === "ko" ? "다음 단계" : "Next";
    return copy.submitIdle;
  }, [businessStep, copy.submitIdle, isBusiness, locale]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setRequestSuccessMessage(null);

    if (isBusiness && businessStep === 1) {
      if (!companyName.trim()) {
        setErrorMessage(locale === "ko" ? "파트너명을 입력해주세요." : "Please enter partner company name.");
        return;
      }
      if (!companyIndustry) {
        setErrorMessage(locale === "ko" ? "산업을 선택해주세요." : "Please choose industry.");
        return;
      }
      if (!companySize) {
        setErrorMessage(locale === "ko" ? "파트너 규모를 선택해주세요." : "Please choose company size.");
        return;
      }
      setBusinessStep(2);
      return;
    }

    if (isBusiness && !phoneNumber.trim()) {
      setErrorMessage(locale === "ko" ? "휴대폰 번호를 입력해주세요." : "Please enter phone number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signupWithEmail({
        name: name.trim(),
        email: email.trim(),
        password,
        accountType,
        phoneNumber: phoneNumber.trim() || undefined,
        partnerOrganizationName: isBusiness ? companyName.trim() : undefined,
        partnerOrganizationIndustry: isBusiness ? companyIndustry : undefined,
        partnerOrganizationCompanySize: isBusiness ? companySize : undefined,
        locale
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
        setErrorMessage(locale === "ko" ? "이미 가입된 이메일입니다. 로그인해주세요." : "This email is already registered. Please sign in.");
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

  async function handleSubmitPartnerRequest() {
    setErrorMessage(null);
    setRequestSuccessMessage(null);
    if (!isBusiness) return;
    if (!companyName.trim() || !companyIndustry || !companySize || !name.trim() || !email.trim()) {
      setErrorMessage(locale === "ko" ? "회사 등록 요청에 필요한 정보를 먼저 입력해주세요." : "Please fill in required fields before submitting request.");
      return;
    }

    setIsSubmittingRequest(true);
    try {
      await createPartnerSignupRequest({
        companyName: companyName.trim(),
        companyIndustry: companyIndustry,
        companySize: companySize,
        requesterName: name.trim(),
        requesterEmail: email.trim(),
        requesterPhone: phoneNumber.trim() || undefined
      });
      setRequestSuccessMessage(
        locale === "ko"
          ? "회사 등록 요청이 접수되었습니다. 운영팀 검토 후 안내드릴게요."
          : "Company registration request submitted. Our team will review and contact you."
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : (locale === "ko" ? "요청 접수에 실패했습니다." : "Failed to submit request."));
    } finally {
      setIsSubmittingRequest(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <section>
          <div className="mx-auto max-w-md rounded-2xl border border-border/60 bg-card p-6 md:p-8">
            <form className="space-y-4" onSubmit={handleSubmit}>
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

              {isBusiness ? (
                <div className="rounded-md border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                  {locale === "ko"
                    ? `${businessStep}/2 단계 · 1단계에서 기본 정보를 입력하고, 2단계에서 계정을 생성합니다.`
                    : `Step ${businessStep}/2 · Enter company basics first, then create your account.`}
                </div>
              ) : null}

              {isBusiness && businessStep === 1 ? (
                <>
                  <label className="block text-sm font-medium">
                    {locale === "ko" ? "파트너명" : "Partner name"}
                    <input
                      type="text"
                      placeholder={locale === "ko" ? "예: Aply" : "e.g., Aply"}
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      className="mt-2 h-10 w-full rounded-md border border-input/60 bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    {locale === "ko" ? "산업 선택" : "Industry"}
                    <select
                      value={companyIndustry}
                      onChange={(event) => setCompanyIndustry(event.target.value)}
                      className="mt-2 h-10 w-full rounded-md border border-input/60 bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="">{locale === "ko" ? "선택해주세요" : "Select industry"}</option>
                      {industryOptions.map((option) => (
                        <option key={option} value={option}>
                          {partnerIndustryLabel(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    {locale === "ko" ? "파트너 규모" : "Company size"}
                    <select
                      value={companySize}
                      onChange={(event) => setCompanySize(event.target.value)}
                      className="mt-2 h-10 w-full rounded-md border border-input/60 bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="">{locale === "ko" ? "선택해주세요" : "Select company size"}</option>
                      {companySizeOptions.map((option) => (
                        <option key={option} value={option}>
                          {(COMPANY_SIZE_LABELS[option]?.[locale] ?? option)}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <>
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
                      {locale === "ko" ? "휴대폰 번호" : "Phone number"}
                      <input
                        type="tel"
                        placeholder={locale === "ko" ? "010-1234-5678" : "+82-10-1234-5678"}
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
                </>
              )}
              <p className="text-sm text-muted-foreground">
                {accountType === "BUSINESS"
                  ? copy.businessHelperText
                  : copy.generalHelperText}
              </p>
              {errorMessage ? <p className="text-sm font-medium text-destructive">{errorMessage}</p> : null}
              {requestSuccessMessage ? <p className="text-sm font-medium text-emerald-600">{requestSuccessMessage}</p> : null}
              <div className="flex items-center gap-2">
                {isBusiness && businessStep === 2 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-11 w-32"
                    disabled={isSubmitting}
                    onClick={() => {
                      setBusinessStep(1);
                      setErrorMessage(null);
                    }}
                  >
                    {locale === "ko" ? "이전" : "Back"}
                  </Button>
                ) : null}
                <Button variant="dark" size="lg" className="h-11 w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? copy.submitPending : <>{submitLabel} <ArrowRight /></>}
                </Button>
              </div>
              {isBusiness && businessStep === 2 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-11 w-full"
                  disabled={isSubmittingRequest}
                  onClick={() => void handleSubmitPartnerRequest()}
                >
                  {isSubmittingRequest
                    ? (locale === "ko" ? "요청 접수 중..." : "Submitting request...")
                    : (locale === "ko" ? "회사 등록 요청하기 (공용메일 사용자)" : "Request company registration (public email)")}
                </Button>
              ) : null}
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
