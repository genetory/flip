"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useLanguage } from "../i18n/LanguageProvider";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { ProgramDetailView } from "../programs/ProgramDetailView";

export function MyProgramDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params?.id[0] : "";
  const { isReady, isAuthenticated } = useAuthSession();
  const { locale } = useLanguage();
  const tr = (ko: string, en: string, zh: string = en, vi: string = en, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;

  if (isReady && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-4xl px-4 py-16">
          <h1 className="text-2xl font-bold">{tr("로그인이 필요합니다", "Sign in required", "需要登录", "Cần đăng nhập", "ログインが必要です", "Diperlukan masuk")}</h1>
          <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            {tr("로그인하기", "Sign in", "登录", "Đăng nhập", "ログイン", "Masuk")}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <Link href="/profile/programs" className="text-xs text-muted-foreground hover:underline">
          ← {tr("프로그램 목록", "Programs", "项目列表", "Danh sách chương trình", "プログラム一覧", "Daftar program")}
        </Link>
        <header className="mt-2 mb-4">
          <h1 className="text-2xl font-bold text-foreground">
            {tr("프로그램 상세", "Program details", "项目详情", "Chi tiết chương trình", "プログラム詳細", "Detail program")}
          </h1>
        </header>
        {id ? <ProgramDetailView programId={id} viewer="student" /> : null}
      </main>
      <Footer />
    </div>
  );
}
