"use client";

import Image from "next/image";
import type { PlatformLocale } from "../../lib/auth-messages";

// /events/visa 의 랜딩/결과 공용 푸터. saju 가 SajuLandingPage 내부에 inline
// 으로 갖고 있는 footer 와 동일한 정보(법인/대표/사업자/주소/이메일/약관) 를
// 라이트 톤으로 옮긴 컴포넌트. visa 두 페이지에서 그대로 import 해 사용.
//
// 추후 saju 도 같은 컴포넌트로 통합하려면 theme prop 을 추가해 light/dark 만
// 분기하면 됨. 지금은 visa 만 쓰기에 light 고정.

type FooterCopy = {
  ceo: string;
  bizNo: string;
  address: string;
  email: string;
  terms: string;
  privacy: string;
};

const COPY: Record<PlatformLocale, FooterCopy> = {
  ko: {
    ceo: "주식회사 플리퍼스 · 대표: 김남구",
    bizNo: "사업자등록번호: 657-81-02986",
    address: "서울특별시 중구 다동 140 10층",
    email: "이메일: info@flip-ers.com",
    terms: "이용약관",
    privacy: "개인정보처리방침"
  },
  en: {
    ceo: "FLIPERS Co., Ltd. · CEO: Namgu Kim",
    bizNo: "Business Reg. No.: 657-81-02986",
    address: "10F, 140 Dadong, Jung-gu, Seoul, Korea",
    email: "Email: info@flip-ers.com",
    terms: "Terms",
    privacy: "Privacy"
  },
  "zh-CN": {
    ceo: "FLIPERS 株式会社 · 代表: 金南求",
    bizNo: "营业执照号: 657-81-02986",
    address: "韩国首尔市中区茶洞 140 号 10 层",
    email: "邮箱: info@flip-ers.com",
    terms: "服务条款",
    privacy: "隐私政策"
  },
  vi: {
    ceo: "Công ty FLIPERS · CEO: Namgu Kim",
    bizNo: "Mã ĐKKD: 657-81-02986",
    address: "Tầng 10, 140 Dadong, Jung-gu, Seoul, Hàn Quốc",
    email: "Email: info@flip-ers.com",
    terms: "Điều khoản",
    privacy: "Quyền riêng tư"
  },
  ja: {
    ceo: "FLIPERS株式会社 · 代表: キム・ナムグ",
    bizNo: "事業者登録番号: 657-81-02986",
    address: "大韓民国 ソウル特別市 中区 茶洞140 10階",
    email: "メール: info@flip-ers.com",
    terms: "利用規約",
    privacy: "プライバシー"
  },
  id: {
    ceo: "FLIPERS Co., Ltd. · CEO: Namgu Kim",
    bizNo: "Nomor Registrasi: 657-81-02986",
    address: "Lantai 10, 140 Dadong, Jung-gu, Seoul, Republik Korea",
    email: "Email: info@flip-ers.com",
    terms: "Syarat",
    privacy: "Privasi"
  }
};

export function VisaEventFooter({ locale }: { locale: PlatformLocale }) {
  const t = COPY[locale] ?? COPY.ko;
  return (
    <footer className="mt-10 border-t border-border/40 px-1 py-6 text-[11px] leading-relaxed text-muted-foreground">
      <a
        href="https://aply.global"
        target="_blank"
        rel="noopener noreferrer"
        className="mb-4 inline-block"
        aria-label="Aply"
      >
        <Image
          src="/img_logo.webp"
          alt="Aply"
          width={160}
          height={42}
          className="h-7 w-auto opacity-80"
        />
      </a>
      <div className="space-y-0.5">
        <p>{t.ceo}</p>
        <p>{t.bizNo}</p>
        <p>{t.address}</p>
        <p>{t.email}</p>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span>© {new Date().getUTCFullYear()} Aply.</span>
        <div className="flex items-center gap-3">
          <a href="/legal/terms" className="active:text-foreground/80">{t.terms}</a>
          <a href="/legal/privacy" className="text-muted-foreground/80 active:text-foreground/80">{t.privacy}</a>
        </div>
      </div>
    </footer>
  );
}
