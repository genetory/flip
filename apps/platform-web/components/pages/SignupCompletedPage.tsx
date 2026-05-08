"use client";

import Link from "next/link";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";

export function SignupCompletedPage() {
  const { isReady, isAuthenticated } = useAuthSession();
  const { locale } = useLanguage();
  const startHref = "/";

  const copyByLocale = {
    ko: {
      title: "회원가입이 완료되었습니다",
      description: "환영합니다. 준비가 끝났어요. 바로 시작해볼까요?",
      checkingSession: "세션을 확인하고 있습니다...",
      start: "시작하기",
      goLogin: "로그인하러 가기",
      goHome: "홈으로 가기"
    },
    en: {
      title: "Signup complete",
      description: "Welcome aboard. You're all set, let's get started.",
      checkingSession: "Checking your session...",
      start: "Get started",
      goLogin: "Go to login",
      goHome: "Go home"
    },
    "zh-CN": {
      title: "注册已完成",
      description: "欢迎加入。准备就绪，现在开始吧。",
      checkingSession: "正在检查会话状态...",
      start: "开始使用",
      goLogin: "前往登录",
      goHome: "返回首页"
    },
    vi: {
      title: "Đăng ký hoàn tất",
      description: "Chào mừng bạn. Mọi thứ đã sẵn sàng, hãy bắt đầu nhé.",
      checkingSession: "Đang kiểm tra phiên đăng nhập...",
      start: "Bắt đầu",
      goLogin: "Đi tới đăng nhập",
      goHome: "Về trang chủ"
    }
  } as const;
  const copy = copyByLocale[locale] ?? copyByLocale.en;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <section className="mx-auto max-w-xl space-y-4 rounded-2xl border border-border/60 bg-card p-6 md:p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.description}</p>

          {!isReady ? <p className="text-sm text-muted-foreground">{copy.checkingSession}</p> : null}

          <div className="flex flex-wrap items-center gap-2">
            {isReady && isAuthenticated ? (
              <Button variant="dark" asChild>
                <Link href={startHref}>{copy.start}</Link>
              </Button>
            ) : (
              <>
                <Button variant="dark" asChild>
                  <Link href="/login">{copy.goLogin}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">{copy.goHome}</Link>
                </Button>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
