"use client";

// Talent 인증(로그인/회원가입) 공용 레이아웃 — Toss 톤의 깔끔한 중앙 정렬.
// 로고를 누르면 랜딩(/talent, "그전 페이지")으로 돌아간다.
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "@phosphor-icons/react";
import { talentBrand } from "../../../lib/talent/landing-content";
import { AplyFooter } from "../../AplyFooter";
import { LanguageSwitcher } from "../../i18n/LanguageSwitcher";
import { usePlatformT } from "../../../lib/i18n";

export function TalentAuthLayout({
  title,
  subtitle,
  children,
  footer,
  backHref = "/talent",
  badge
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  backHref?: string;
  badge?: string;
}) {
  const t = usePlatformT();
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="h-14 border-b border-[#EEF1F5]">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <Link href={backHref} aria-label={t(`${talentBrand.name} 홈으로`, `Go to ${talentBrand.name} home`, `前往 ${talentBrand.name} 首页`, `Về trang chủ ${talentBrand.name}`, `${talentBrand.name} ホームへ`, `Ke beranda ${talentBrand.name}`)} className="flex items-center">
              <Image src="/img_logo.webp" alt={talentBrand.name} width={72} height={24} className="h-5 w-auto" priority />
            </Link>
            {badge ? <span className="rounded-md bg-[#EDF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">{badge}</span> : null}
          </div>
          <div className="flex items-center gap-1">
            <Link href={backHref} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#4E5968]">
              <ArrowLeft className="h-4 w-4" /> {t("랜딩으로", "Home", "首页", "Trang chủ", "トップへ", "Beranda")}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 py-14 md:py-20">
        <div className="w-full max-w-[400px]">
          <Image src="/img_logo.webp" alt={talentBrand.name} width={96} height={32} className="mb-6 h-7 w-auto" priority />
          <h1 className="text-[28px] font-black leading-[1.2] tracking-[-0.03em] text-[#0B1227] md:text-[32px]">{title}</h1>
          {subtitle ? <p className="mt-3 break-keep text-[15px] leading-[1.6] text-[#4E5968]">{subtitle}</p> : null}
          <div className="mt-9">{children}</div>
          {footer ? <div className="mt-7 text-center">{footer}</div> : null}
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}

// 공용 입력 필드(Toss 톤: 큰 라운드, 넉넉한 높이).
export function TalentField({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13.5px] font-semibold text-[#4E5968]">{label}</span>
      {children}
    </label>
  );
}

export const talentInputClass =
  "h-[52px] w-full rounded-xl border border-[#E5E8EB] bg-white px-4 text-[15px] text-[#191F28] outline-none transition placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]";
