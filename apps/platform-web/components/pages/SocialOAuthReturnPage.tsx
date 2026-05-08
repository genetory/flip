"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { storeAccessToken, type SocialProvider } from "../../lib/auth-client";

const PROVIDER_LABELS: Record<SocialProvider, { ko: string; en: string; zh: string; vi: string }> = {
  naver: { ko: "네이버", en: "Naver", zh: "Naver", vi: "Naver" },
  google: { ko: "구글", en: "Google", zh: "Google", vi: "Google" },
  kakao: { ko: "카카오", en: "Kakao", zh: "Kakao", vi: "Kakao" }
};

export function SocialOAuthReturnPage({ provider }: { provider: SocialProvider }) {
  const router = useRouter();
  const { refreshSession } = useAuthSession();
  const { locale } = useLanguage();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const providerLabel = PROVIDER_LABELS[provider];
  const providerName =
    locale === "ko" ? providerLabel.ko : locale === "zh-CN" ? providerLabel.zh : locale === "vi" ? providerLabel.vi : providerLabel.en;

  useEffect(() => {
    const fragment = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    const params = new URLSearchParams(fragment);
    const accessToken = params.get("accessToken");
    const next = params.get("next") || "/";

    if (!accessToken) {
      setErrorMessage(
        locale === "ko"
          ? "로그인 토큰을 받지 못했습니다."
          : locale === "zh-CN"
            ? "未能获取登录令牌。"
            : locale === "vi"
              ? "Không nhận được mã đăng nhập."
              : "Could not retrieve login token."
      );
      return;
    }

    storeAccessToken(accessToken);
    if (typeof window !== "undefined" && window.history.replaceState) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    void (async () => {
      try {
        await refreshSession();
        const safeNext = next.startsWith("/") ? next : "/";
        router.replace(safeNext);
        router.refresh();
      } catch {
        setErrorMessage(
          locale === "ko"
            ? "세션 동기화에 실패했습니다."
            : locale === "zh-CN"
              ? "会话同步失败。"
              : locale === "vi"
                ? "Đồng bộ phiên thất bại."
                : "Failed to synchronize session."
        );
      }
    })();
  }, [locale, refreshSession, router]);

  const message = errorMessage
    ? errorMessage
    : locale === "ko"
      ? `${providerName} 로그인 처리 중입니다...`
      : locale === "zh-CN"
        ? `正在处理 ${providerName} 登录...`
        : locale === "vi"
          ? `Đang xử lý đăng nhập ${providerName}...`
          : `Processing ${providerName} login...`;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <section className="mx-auto max-w-md rounded-2xl border border-border/60 bg-card p-6 md:p-8">
          <p className={`text-sm ${errorMessage ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>
          {errorMessage ? (
            <div className="mt-4">
              <a href="/login" className="text-sm font-semibold text-foreground underline">
                {locale === "ko"
                  ? "로그인 페이지로"
                  : locale === "zh-CN"
                    ? "返回登录页"
                    : locale === "vi"
                      ? "Quay về trang đăng nhập"
                      : "Back to login"}
              </a>
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
}
