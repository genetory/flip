"use client";

import Image from "next/image";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";

export const Footer = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).footer;

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="container grid gap-10 py-14">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <Image
              src="/aply-logo-20260428.webp"
              alt="Aply logo"
              width={160}
              height={42}
              className="h-8 w-auto"
            />
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">{copy.brandDescription}</p>
          <div className="max-w-sm space-y-0.5 text-xs leading-relaxed text-muted-foreground">
            <p>주식회사 플리퍼스</p>
            <p>대표: 김남구</p>
            <p>개인정보책임관리자: 김남구</p>
            <p>사업자등록번호: 657-81-02986</p>
            <p>서울특별시 중구 다동 140 10층</p>
            <p>이메일: info@flip-ers.com</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container flex flex-col items-start justify-between gap-2 py-5 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} Aply. {copy.rights}
          </p>
          <p>{copy.tagline}</p>
        </div>
      </div>
    </footer>
  );
};
