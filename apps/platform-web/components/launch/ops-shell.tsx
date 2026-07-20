"use client";

import Link from "next/link";
import { Globe, LogOut, ExternalLink } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLaunchT } from "../../lib/launch/i18n";

const LOCALES = [
  { key: "ko", label: "한국어" },
  { key: "en", label: "English" },
  { key: "zh-CN", label: "中文" },
  { key: "vi", label: "Tiếng Việt" },
  { key: "ja", label: "日本語" },
  { key: "id", label: "Indonesia" }
] as const;

// 어드민 상단 바 — 마케팅 사이트 헤더 대신, 운영에 필요한 것만 둔다.
// (사이트 헤더/푸터/채팅 위젯은 어드민 화면에선 순수 노이즈라 셸에서 제외했다.)
export function OpsTopbar() {
  const t = useLaunchT();
  const { locale, setLocale } = useLanguage();
  const { user, logout } = useAuthSession();
  const who = user?.name?.trim() || user?.email || "";

  return (
    <header className="sticky top-0 z-20 flex h-14 flex-none items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-5 backdrop-blur md:px-8">
      <Link href="/" className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-faint)] transition hover:text-[var(--ink)]">
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        {t("aply.global로", "Back to aply.global", "返回 aply.global", "Về aply.global", "aply.global へ", "Ke aply.global")}
      </Link>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-2 py-1.5">
          <Globe className="h-3.5 w-3.5 text-[var(--ink-faint)]" aria-hidden />
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as typeof locale)}
            className="bg-transparent text-[12.5px] font-semibold text-[var(--ink-soft)] outline-none"
            aria-label={t("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa")}
          >
            {LOCALES.map((l) => (
              <option key={l.key} value={l.key}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        {who ? <span className="hidden text-[12.5px] font-semibold text-[var(--ink-soft)] sm:inline">{who}</span> : null}
        <button
          type="button"
          onClick={() => void logout()}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-[12.5px] font-semibold text-[var(--ink-faint)] transition hover:bg-[var(--surface-2)]"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden />
          {t("로그아웃", "Sign out", "退出", "Đăng xuất", "ログアウト", "Keluar")}
        </button>
      </div>
    </header>
  );
}
