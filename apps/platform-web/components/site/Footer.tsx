"use client";

import Image from "next/image";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";
import { usePlatformT } from "../../lib/i18n";

export const Footer = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).footer;
  const t = usePlatformT();
  const currentYear = new Date().getUTCFullYear();

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="container grid gap-10 py-14">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <Image
              src="/img_logo.webp"
              alt="Aply logo"
              width={160}
              height={42}
              className="h-8 w-auto"
            />
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">{copy.brandDescription}</p>
          <div className="max-w-sm space-y-0.5 text-xs leading-relaxed text-muted-foreground">
            <p>{t("주식회사 플리퍼스", "FLIPERS Co., Ltd.", "FLIPERS 株式会社", "Công ty FLIPERS", "FLIPERS株式会社", "FLIPERS Co., Ltd.")}</p>
            <p>{t("대표: 김남구", "CEO: Namgu Kim", "代表: 金南求", "CEO: Namgu Kim", "代表: キム・ナムグ", "CEO: Namgu Kim")}</p>
            <p>{t("개인정보책임관리자: 김남구", "Privacy Officer: Namgu Kim", "隐私负责人: 金南求", "Người phụ trách bảo mật: Namgu Kim", "個人情報保護責任者: キム・ナムグ", "Petugas Privasi: Namgu Kim")}</p>
            <p>{t("사업자등록번호: 657-81-02986", "Business Registration No.: 657-81-02986", "营业执照号码: 657-81-02986", "Mã số đăng ký kinh doanh: 657-81-02986", "事業者登録番号: 657-81-02986", "Nomor Registrasi Bisnis: 657-81-02986")}</p>
            <p>{t("서울특별시 중구 다동 140 10층", "10F, 140 Dadong, Jung-gu, Seoul, Republic of Korea", "韩国首尔市中区茶洞140号10层", "Tầng 10, 140 Dadong, Jung-gu, Seoul, Hàn Quốc", "大韓民国 ソウル特別市 中区 茶洞140 10階", "Lantai 10, 140 Dadong, Jung-gu, Seoul, Republik Korea")}</p>
            <p>{t("이메일: info@flip-ers.com", "Email: info@flip-ers.com", "邮箱: info@flip-ers.com", "Email: info@flip-ers.com", "メール: info@flip-ers.com", "Email: info@flip-ers.com")}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container flex flex-col items-start justify-between gap-2 py-5 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>
            © {currentYear} Aply. {copy.rights}
          </p>
          <div className="flex items-center gap-4">
            <a href="/legal/terms" className="hover:text-foreground hover:underline">
              {t("이용약관", "Terms", "用户协议", "Điều khoản", "利用規約", "Syarat & Ketentuan")}
            </a>
            <a href="/legal/privacy" className="font-semibold hover:text-foreground hover:underline">
              {t("개인정보처리방침", "Privacy Policy", "隐私政策", "Chính sách bảo mật", "プライバシーポリシー", "Kebijakan Privasi")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
