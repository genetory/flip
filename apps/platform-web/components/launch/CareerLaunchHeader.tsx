"use client";

// Career Launch 전용 GNB — 리뉴얼 톤(흰 배경·얇은 보더). 마케팅 nav 없이
// 로고 + Career Launch 배지 + 언어 스위치 + (운영자) 콘솔 + 로그아웃만.
import Link from "next/link";
import Image from "next/image";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { PLATFORM_LOCALES, type PlatformLocale } from "../../lib/auth-messages";
import { useLaunchT } from "../../lib/launch/i18n";

const LOCALE_LABELS: Record<PlatformLocale, string> = {
  ko: "한국어",
  en: "English",
  "zh-CN": "中文",
  vi: "Tiếng Việt",
  ja: "日本語",
  id: "Bahasa"
};

export function CareerLaunchHeader() {
  const t = useLaunchT();
  const { user, logout } = useAuthSession();
  const { locale, setLocale } = useLanguage();
  const isOperator = user?.role === "OPERATOR";

  return (
    <header className="sticky top-0 z-40 border-b border-[#EEF1F5] bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <Link href="/career-launch/dashboard" aria-label="Career Launch" className="flex items-center">
            <Image src="/img_logo.webp" alt="APLY" width={72} height={24} className="h-5 w-auto" priority />
          </Link>
          <span className="rounded-md bg-[#EDF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">Career Launch</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isOperator ? (
            <Link
              href="/career-launch/ops/students"
              className="hidden rounded-lg px-3 py-2 text-[13px] font-semibold text-[#B7791F] transition hover:bg-[#FFF9EC] sm:inline-flex"
            >
              {t("운영 콘솔", "Ops console", "运营控制台", "Bảng vận hành", "運営コンソール", "Konsol operasi")}
            </Link>
          ) : null}
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as PlatformLocale)}
            aria-label={t("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa")}
            className="rounded-lg border border-[#E5E8EB] bg-white px-2.5 py-1.5 text-[12.5px] font-semibold text-[#191F28] outline-none [color-scheme:light] focus:border-[#0B46E8]"
          >
            {PLATFORM_LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_LABELS[l]}
              </option>
            ))}
          </select>
          {user ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg px-2.5 py-2 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#4E5968]"
            >
              {t("로그아웃", "Log out", "退出", "Đăng xuất", "ログアウト", "Keluar")}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
