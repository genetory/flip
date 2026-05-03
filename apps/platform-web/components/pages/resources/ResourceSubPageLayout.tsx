"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Header } from "../../site/Header";
import { Footer } from "../../site/Footer";
import { useLanguage } from "../../i18n/LanguageProvider";
import { paperlogy } from "../../../lib/fonts";

type Props = {
  titleKo: string;
  titleEn: string;
  descKo: string;
  descEn: string;
  hideHero?: boolean;
  backHref?: string;
  backKo?: string;
  backEn?: string;
  children: ReactNode;
};

export function ResourceSubPageLayout({
  titleKo,
  titleEn,
  descKo,
  descEn,
  hideHero = false,
  backHref = "/resources",
  backKo = "자료실로 돌아가기",
  backEn = "Back to Resources",
  children
}: Props) {
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const t = (ko: string, en: string) => (isKo ? ko : en);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans text-foreground antialiased">
      <Header />
      <main className="flex-1 pb-16 pt-12 md:pt-16">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-[#111111]"
            >
              <ChevronLeft className="h-4 w-4" />
              {t(backKo, backEn)}
            </Link>

            {hideHero ? null : (
              <section className="mt-4 rounded-3xl bg-[#0B1227] px-6 py-8 text-white md:px-8 md:py-10">
                <h1 className={`${paperlogy.className} text-3xl font-black tracking-[-0.03em] md:text-5xl`}>
                  {isKo ? titleKo : titleEn}
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-white/85 md:text-base">
                  {isKo ? descKo : descEn}
                </p>
              </section>
            )}

            <div className="mt-6 space-y-4 md:space-y-5">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
