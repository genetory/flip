"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { Button } from "../ui/button";
import { AuthApiError, getPostLoginUrl, loginWithEmail } from "../../lib/auth-client";
import { getAuthPageMessages } from "../../lib/auth-messages";

// `?next=` 만 신뢰. open-redirect 방지를 위해 same-origin 내부 경로(`/...`)만
// 허용 — `//evil.com` 같은 protocol-relative 입력도 거른다.
function sanitizeNextParam(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  return trimmed;
}

// defaultNext: ?next= 가 없을 때 로그인 후 이동할 기본 경로(예: /career-launch 는
// /career-launch/dashboard). chromeless: 사이트 헤더/푸터 없이 폼만.
// brandTitle/brandSubtitle: 로그인 카드 위 중앙 브랜드 헤더(예: Career Launch Bootcamp).
export function LoginPage({
  defaultNext,
  chromeless,
  brandTitle,
  brandSubtitle,
  showRoleToggle
}: { defaultNext?: string; chromeless?: boolean; brandTitle?: string; brandSubtitle?: string; showRoleToggle?: boolean } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 신청 페이지 등에서 `?next=/events/...` 로 들어오면 로그인 후 그 경로로 복귀.
  const nextParam = sanitizeNextParam(searchParams.get("next"));
  const effectiveNext = nextParam ?? (defaultNext ? sanitizeNextParam(defaultNext) : null);
  const { setAuthenticatedUser } = useAuthSession();
  const { locale } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const copy = useMemo(() => getAuthPageMessages(locale).login, [locale]);
  // 학생/파트너 안내용 토글(UI·카피·가입 링크만 바꾼다 — 로그인 동작·역할은 계정이 결정).
  const [role, setRole] = useState<"student" | "partner">("student");
  const L = (ko: string, en: string, zh: string, vi: string, ja: string, id: string) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;
  const signupHref = (() => {
    const params = new URLSearchParams();
    if (role === "partner") params.set("type", "business");
    if (effectiveNext) params.set("next", effectiveNext);
    const qs = params.toString();
    return qs ? `/signup?${qs}` : "/signup";
  })();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { user } = await loginWithEmail({ email, password });
      setAuthenticatedUser(user);

      // 우선순위: ?next= (signup 과 동일 패턴) → referrer (same-origin) →
      // role 기반 기본 (getPostLoginUrl). next 는 같은 origin 의 절대 경로만
      // 허용 — open-redirect 방지.
      if (effectiveNext) {
        router.push(effectiveNext);
        router.refresh();
        return;
      }

      const referrer = typeof window !== "undefined" ? document.referrer : "";
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
      try {
        if (referrer) {
          const parsed = new URL(referrer);
          if (parsed.origin === currentOrigin) {
            window.location.href = referrer;
            return;
          }
        }
      } catch {
        // Ignore invalid referrer and fallback to default path.
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
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      {!chromeless && <Header />}
      <main className="container py-12 md:py-16">
        <section>
          {brandTitle ? (
            <div className="mx-auto mb-8 text-center">
              <Image
                src="/img_logo.webp"
                alt="aply logo"
                width={180}
                height={48}
                className="mx-auto mb-5 h-8 w-auto md:h-9"
                priority
              />
              <h1 className="whitespace-nowrap text-[22px] font-black leading-[1.15] tracking-[-0.02em] text-[#0B1227] sm:text-[30px] md:text-[38px]">
                {brandTitle}
              </h1>
              {brandSubtitle ? (
                <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-[#8B95A1] md:text-[15.5px]">{brandSubtitle}</p>
              ) : null}
            </div>
          ) : null}
          <div className="mx-auto max-w-md rounded-2xl border border-border/60 bg-card p-6 md:p-8">
            {showRoleToggle ? (
              <div className="mb-5">
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="tablist" aria-label={L("로그인 유형", "Login type", "登录类型", "Loại đăng nhập", "ログイン種別", "Tipe login")}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={role === "student"}
                    onClick={() => setRole("student")}
                    className={`h-9 rounded-lg text-sm font-bold transition ${role === "student" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                  >
                    {L("학생", "Student", "学生", "Sinh viên", "学生", "Siswa")}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={role === "partner"}
                    onClick={() => setRole("partner")}
                    className={`h-9 rounded-lg text-sm font-bold transition ${role === "partner" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                  >
                    {L("파트너(기업)", "Partner (company)", "合作伙伴（企业）", "Đối tác (doanh nghiệp)", "パートナー（企業）", "Mitra (perusahaan)")}
                  </button>
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {role === "student"
                    ? L(
                        "구직·커리어런치는 학생 계정으로 로그인하세요.",
                        "Log in with your student account for jobs & Career Launch.",
                        "求职·Career Launch 请使用学生账号登录。",
                        "Đăng nhập bằng tài khoản sinh viên cho việc làm & Career Launch.",
                        "求職・Career Launchは学生アカウントでログインしてください。",
                        "Masuk dengan akun siswa untuk lowongan & Career Launch."
                      )
                    : L(
                        "채용·기업 관리는 파트너(기업) 계정으로 로그인하세요.",
                        "Log in with your partner account to manage hiring.",
                        "招聘·企业管理请使用合作伙伴账号登录。",
                        "Đăng nhập bằng tài khoản đối tác để quản lý tuyển dụng.",
                        "採用・企業管理はパートナーアカウントでログインしてください。",
                        "Masuk dengan akun mitra untuk mengelola rekrutmen."
                      )}
                </p>
              </div>
            ) : null}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium">
                {copy.emailLabel}
                <input
                  type="email"
                  placeholder={copy.emailPlaceholder}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-input/60 bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
              </label>
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
              <p className="text-sm text-muted-foreground">{copy.helperText}</p>
              {errorMessage ? <p className="text-sm font-medium text-destructive">{errorMessage}</p> : null}
              <Button variant="dark" size="lg" className="mt-2 w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? copy.submitPending : copy.submitIdle}
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">
                {locale === "ko" ? "또는" : locale === "zh-CN" ? "或" : locale === "vi" ? "hoặc" : locale === "ja" ? "または" : locale === "id" ? "atau" : "or"}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="mt-4 space-y-2">
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/naver/start`}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#03C75A] text-sm font-semibold text-white transition hover:bg-[#02b551]"
              >
                <span aria-hidden className="font-black">N</span>
                {locale === "ko"
                  ? "네이버로 로그인"
                  : locale === "zh-CN"
                    ? "使用 Naver 登录"
                    : locale === "vi"
                      ? "Đăng nhập với Naver"
                      : locale === "ja"
                        ? "Naverでログイン"
                        : locale === "id"
                          ? "Masuk dengan Naver"
                          : "Continue with Naver"}
              </a>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/kakao/start`}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#FEE500] text-sm font-semibold text-[#191919] transition hover:bg-[#f5dd00]"
              >
                <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.86 5.36 4.66 6.78L5.5 21.5c-.1.34.27.62.57.43L10.5 19c.5.05 1 .08 1.5.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                </svg>
                {locale === "ko"
                  ? "카카오로 로그인"
                  : locale === "zh-CN"
                    ? "使用 Kakao 登录"
                    : locale === "vi"
                      ? "Đăng nhập với Kakao"
                      : locale === "ja"
                        ? "Kakaoでログイン"
                        : locale === "id"
                          ? "Masuk dengan Kakao"
                          : "Continue with Kakao"}
              </a>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/google/start`}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-input/60 bg-background text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                <svg aria-hidden className="h-4 w-4" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
                {locale === "ko"
                  ? "구글로 로그인"
                  : locale === "zh-CN"
                    ? "使用 Google 登录"
                    : locale === "vi"
                      ? "Đăng nhập với Google"
                      : locale === "ja"
                        ? "Googleでログイン"
                        : locale === "id"
                          ? "Masuk dengan Google"
                          : "Continue with Google"}
              </a>
            </div>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {copy.signupPrompt}{" "}
              {/* 파트너 토글이면 기업 가입으로, 아니면 일반 가입으로. next 는 유지. */}
              <Link href={signupHref} className="font-semibold text-foreground">
                {showRoleToggle && role === "partner"
                  ? L("기업 계정 만들기", "Create a company account", "创建企业账号", "Tạo tài khoản doanh nghiệp", "企業アカウントを作成", "Buat akun perusahaan")
                  : copy.signupLink}
              </Link>
            </p>
          </div>
        </section>
      </main>
      {!chromeless && <Footer />}
    </div>
  );
}
