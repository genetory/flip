"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { AuthApiError, finalizeSocialSignup, type SocialProvider } from "../../lib/auth-client";

export function SocialAccountTypePage() {
  const router = useRouter();
  const { setAuthenticatedUser } = useAuthSession();
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const isZh = locale === "zh-CN";
  const isVi = locale === "vi";
  const t = (ko: string, en: string, zh: string = en, vi: string = en) =>
    isKo ? ko : isZh ? zh : isVi ? vi : en;

  const [ctx, setCtx] = useState<string | null>(null);
  const [provider, setProvider] = useState<SocialProvider | null>(null);
  const [accountType, setAccountType] = useState<"GENERAL" | "BUSINESS">("GENERAL");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fragment = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    const params = new URLSearchParams(fragment);
    const ctxValue = params.get("ctx");
    const providerValue = params.get("provider");
    if (!ctxValue || (providerValue !== "naver" && providerValue !== "google" && providerValue !== "kakao")) {
      setErrorMessage(t("가입 정보가 만료되었습니다. 다시 시도해주세요.", "Signup session expired. Please try again.", "注册信息已过期，请重新尝试。", "Phiên đăng ký đã hết hạn. Vui lòng thử lại."));
      return;
    }
    setCtx(ctxValue);
    setProvider(providerValue);
  }, [isKo, isZh, isVi]);

  async function handleSubmit() {
    if (!ctx || !provider || isSubmitting) return;
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { user } = await finalizeSocialSignup({ provider, ctx, accountType });
      setAuthenticatedUser(user);
      if (typeof window !== "undefined") {
        window.location.replace("/profile");
        return;
      }
      router.replace("/profile");
    } catch (error) {
      if (error instanceof AuthApiError && error.code === "EXPIRED_SIGNUP_CONTEXT") {
        setErrorMessage(t("가입 세션이 만료되었습니다. 다시 시도해주세요.", "Signup session expired. Please try again.", "注册会话已过期，请重新尝试。", "Phiên đăng ký đã hết hạn. Vui lòng thử lại."));
      } else if (error instanceof AuthApiError && error.code === "INVALID_SIGNUP_CONTEXT") {
        setErrorMessage(t("유효하지 않은 가입 세션입니다.", "Invalid signup session.", "注册会话无效。", "Phiên đăng ký không hợp lệ."));
      } else {
        setErrorMessage(error instanceof Error ? error.message : t("가입에 실패했습니다.", "Signup failed.", "注册失败。", "Đăng ký thất bại."));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const accountTypeOptions: Array<{
    value: "GENERAL" | "BUSINESS";
    label: string;
    description: string;
  }> = [
    {
      value: "GENERAL",
      label: t("일반회원", "General", "普通会员", "Thành viên cá nhân"),
      description: t("포지션 탐색, 지원, 커뮤니티 참여", "Browse positions, apply, and join the community", "浏览职位、申请、参与社区", "Tìm vị trí, ứng tuyển, tham gia cộng đồng")
    },
    {
      value: "BUSINESS",
      label: t("파트너회원", "Partner", "合作企业会员", "Thành viên đối tác"),
      description: t("포지션 등록, 후보자 매칭", "Post positions and match with candidates", "发布职位、匹配候选人", "Đăng vị trí, kết nối ứng viên")
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <section>
          <div className="mx-auto max-w-md rounded-2xl border border-border/60 bg-card p-6 md:p-8">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {t("회원 유형을 선택해주세요", "Choose your account type", "请选择会员类型", "Vui lòng chọn loại tài khoản")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(
                "가입 마지막 단계입니다. 사용하실 유형을 선택해주세요.",
                "This is the final step. Pick the type that fits you best.",
                "这是注册的最后一步，请选择适合您的会员类型。",
                "Đây là bước cuối cùng. Hãy chọn loại tài khoản phù hợp với bạn."
              )}
            </p>

            <div className="mt-6 space-y-2">
              {accountTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setAccountType(option.value);
                    setErrorMessage(null);
                  }}
                  disabled={!ctx || !provider || isSubmitting}
                  className={
                    accountType === option.value
                      ? "block w-full rounded-md border-2 border-foreground bg-card p-4 text-left transition"
                      : "block w-full rounded-md border border-input/60 bg-card p-4 text-left transition hover:border-foreground/40"
                  }
                >
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                </button>
              ))}
            </div>

            {errorMessage ? (
              <p className="mt-4 text-sm font-medium text-destructive">{errorMessage}</p>
            ) : null}

            <div className="mt-6">
              <Button
                variant="dark"
                size="lg"
                className="h-11 w-full"
                onClick={() => void handleSubmit()}
                disabled={!ctx || !provider || isSubmitting}
              >
                {isSubmitting
                  ? t("가입 중...", "Signing up...", "注册中...", "Đang đăng ký...")
                  : t("계속하기", "Continue", "继续", "Tiếp tục")}
              </Button>
            </div>

            {!ctx && !errorMessage ? (
              <p className="mt-4 text-xs text-muted-foreground">
                {t("가입 정보를 확인하는 중입니다...", "Checking signup info...", "正在确认注册信息...", "Đang kiểm tra thông tin đăng ký...")}
              </p>
            ) : null}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
