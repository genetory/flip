"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { storeAccessToken, type SocialProvider } from "../../lib/auth-client";
import { usePlatformT } from "../../lib/i18n";

const PROVIDER_LABELS: Record<SocialProvider, { ko: string; en: string; zh: string; vi: string; ja: string; id: string }> = {
  naver: { ko: "네이버", en: "Naver", zh: "Naver", vi: "Naver", ja: "Naver", id: "Naver" },
  google: { ko: "구글", en: "Google", zh: "Google", vi: "Google", ja: "Google", id: "Google" },
  kakao: { ko: "카카오", en: "Kakao", zh: "Kakao", vi: "Kakao", ja: "Kakao", id: "Kakao" }
};

export function SocialOAuthReturnPage({ provider }: { provider: SocialProvider }) {
  const router = useRouter();
  const { refreshSession } = useAuthSession();
  const { locale } = useLanguage();
  const t = usePlatformT();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const providerLabel = PROVIDER_LABELS[provider];
  const providerName = t(providerLabel.ko, providerLabel.en, providerLabel.zh, providerLabel.vi, providerLabel.ja, providerLabel.id);

  useEffect(() => {
    const fragment = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    const params = new URLSearchParams(fragment);
    const accessToken = params.get("accessToken");
    const next = params.get("next") || "/";

    if (!accessToken) {
      setErrorMessage(
        t(
          "로그인 토큰을 받지 못했습니다.",
          "Could not retrieve login token.",
          "未能获取登录令牌。",
          "Không nhận được mã đăng nhập.",
          "ログイントークンを受け取れませんでした。",
          "Tidak dapat memperoleh token login."
        )
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
          t(
            "세션 동기화에 실패했습니다.",
            "Failed to synchronize session.",
            "会话同步失败。",
            "Đồng bộ phiên thất bại.",
            "セッションの同期に失敗しました。",
            "Gagal menyinkronkan sesi."
          )
        );
      }
    })();
  }, [locale, refreshSession, router]);

  const message = errorMessage
    ? errorMessage
    : t(
        `${providerName} 로그인 처리 중입니다...`,
        `Processing ${providerName} login...`,
        `正在处理 ${providerName} 登录...`,
        `Đang xử lý đăng nhập ${providerName}...`,
        `${providerName}ログインを処理中です...`,
        `Memproses login ${providerName}...`
      );

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <section className="mx-auto max-w-md rounded-2xl border border-border/60 bg-card p-6 md:p-8">
          <p className={`text-sm ${errorMessage ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>
          {errorMessage ? (
            <div className="mt-4">
              <a href="/login" className="text-sm font-semibold text-foreground underline">
                {t("로그인 페이지로", "Back to login", "返回登录页", "Quay về trang đăng nhập", "ログインページへ", "Kembali ke halaman masuk")}
              </a>
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
}
