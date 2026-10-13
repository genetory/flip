"use client";

// Talent 인증(로그인/회원가입) 공용 레이아웃 — v2 테마(흰 바탕·굵은 큰 제목·채운 입력칸·48px 버튼)로 중앙 정렬.
// 파트너·Career Launch 로그인도 이 레이아웃을 같이 쓴다.
// 로고를 누르면 랜딩(/talent, "그전 페이지")으로 돌아간다.
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { TalentBackButton } from "../TalentBackButton";
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
      <header className="h-14 border-b border-[#F2F4F6]">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <Link href={backHref} aria-label={t(`${talentBrand.name} 홈으로`, `Go to ${talentBrand.name} home`, `前往 ${talentBrand.name} 首页`, `Về trang chủ ${talentBrand.name}`, `${talentBrand.name} ホームへ`, `Ke beranda ${talentBrand.name}`)} className="flex items-center">
              <Image src="/img_logo.webp" alt={talentBrand.name} width={72} height={24} className="h-5 w-auto" priority />
            </Link>
            {badge ? <span className="rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[12px] font-bold text-[#0B46E8]">{badge}</span> : null}
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-8 md:pb-24 md:pt-16">
        <div className="w-full max-w-[400px]">
          {/* 뒤로가기 — /talent/career/resume 등과 동일: 콘텐츠 상단 TalentBackButton */}
          <TalentBackButton className="mb-3" fallback={backHref} />
          <h1 className="text-[26px] font-bold leading-[1.38] tracking-[-0.02em] text-[#191F28] md:text-[30px]">{title}</h1>
          {subtitle ? <p className="mt-2.5 break-keep text-[17px] leading-[1.6] text-[#4E5968]">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-7 text-center">{footer}</div> : null}
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}

// 공용 입력 필드 — v2 입력칸(테두리 없이 회색으로 채우고, 누르면 흰 바탕 + 파란 테).
export function TalentField({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-semibold text-[#4E5968]">{label}</span>
      {children}
    </label>
  );
}

export const talentInputClass =
  "h-12 w-full rounded-2xl bg-[#F2F4F6] px-4 text-[16px] text-[#191F28] outline-none ring-[#0B46E8] transition placeholder:text-[#8B95A1] focus:bg-white focus:ring-2";

// 인증 화면 제출 버튼 — v2 주 버튼(48px·16px)에 맞춘다(TalentButton lg 위에 덧씌움).
export const authSubmitClass = "!h-12 !text-[16px] !font-semibold";
