"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CaretLeft as ChevronLeft } from "@phosphor-icons/react";
import { Header } from "../../site/Header";
import { Footer } from "../../site/Footer";
import { useLanguage } from "../../i18n/LanguageProvider";
import { paperlogy } from "../../../lib/fonts";

type Props = {
  titleKo: string;
  titleEn: string;
  titleZh?: string;
  titleVi?: string;
  titleJa?: string;
  titleId?: string;
  descKo: string;
  descEn: string;
  descZh?: string;
  descVi?: string;
  descJa?: string;
  descId?: string;
  hideHero?: boolean;
  /**
   * 레거시 사이트 Header/Footer 를 렌더하지 않는다. 리뉴얼 셸(TalentAppShell) 안에서
   * 재사용할 때 쓴다 — 레거시 헤더의 내비게이션은 전부 308 로 리다이렉트되는 옛 경로를
   * 가리켜서, 리뉴얼 화면에 그대로 끼우면 막다른 링크만 보여 준다.
   */
  chromeless?: boolean;
  backHref?: string;
  backKo?: string;
  backEn?: string;
  backZh?: string;
  backVi?: string;
  backJa?: string;
  backId?: string;
  children: ReactNode;
};

export function ResourceSubPageLayout({
  titleKo,
  titleEn,
  titleZh,
  titleVi,
  titleJa,
  titleId,
  descKo,
  descEn,
  descZh,
  descVi,
  descJa,
  descId,
  hideHero = false,
  chromeless = false,
  backHref = "/resources",
  backKo = "자료실로 돌아가기",
  backEn = "Back to Resources",
  backZh,
  backVi,
  backJa,
  backId,
  children
}: Props) {
  const { locale } = useLanguage();
  const t = (ko: string, en: string, zh: string = en, vi: string = en, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;

  return (
    <div className={chromeless ? "" : "min-h-screen flex flex-col bg-[#F8FAFC] font-sans text-foreground antialiased"}>
      {chromeless ? null : <Header />}
      <main className={chromeless ? "" : "flex-1 pb-16 pt-12 md:pt-16"}>
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-[#111111]"
            >
              <ChevronLeft className="h-4 w-4" />
              {t(backKo, backEn, backZh ?? "返回资料页", backVi ?? "Quay lại trang tài liệu", backJa ?? "資料ページに戻る", backId ?? "Kembali ke Sumber Daya")}
            </Link>

            {hideHero ? null : (
              <section className="mt-4 rounded-3xl bg-[#0B1227] px-6 py-8 text-white md:px-8 md:py-10">
                <h1 className={`${paperlogy.className} text-3xl font-black tracking-[-0.03em] md:text-5xl`}>
                  {t(titleKo, titleEn, titleZh ?? titleEn, titleVi ?? titleEn, titleJa ?? titleEn, titleId ?? titleEn)}
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-white/85 md:text-base">
                  {t(descKo, descEn, descZh ?? descEn, descVi ?? descEn, descJa ?? descEn, descId ?? descEn)}
                </p>
              </section>
            )}

            <div className="mt-6 space-y-4 md:space-y-5">{children}</div>
          </div>
        </div>
      </main>
      {chromeless ? null : <Footer />}
    </div>
  );
}
