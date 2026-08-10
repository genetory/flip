"use client";

// Career Launch 전용 GNB — partner/talent 헤더와 동일한 결(흰 배경·로고+배지 좌측,
// 우측 프로필 pill). 언어 전환·로그아웃은 프로필 pill 드롭다운 안에 둔다
// (career-launch는 별도 설정 페이지가 없어 partner/talent의 '설정' 역할을 대신).
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname() ?? "";
  const { user, logout } = useAuthSession();
  const { locale, setLocale } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOperator = user?.role === "OPERATOR";
  const name = user?.name?.trim() || user?.email || t("학생", "Student", "学生", "Sinh viên", "学生", "Siswa");

  // 경로 이동 시 메뉴 닫기.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#EEF1F5] bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <div className="flex items-center gap-1.5">
          <Link href="/career-launch/dashboard" aria-label="Career Launch" className="flex items-center gap-2">
            <Image src="/img_logo.webp" alt="" width={72} height={24} className="h-5 w-auto" priority />
            <span className="rounded-md bg-[#EDF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">Career Launch</span>
          </Link>
        </div>

        {/* 우측 — 프로필 pill(파트너/탤런트와 동일). 클릭 시 언어·로그아웃 드롭다운 */}
        {user ? (
          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex max-w-[160px] items-center rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]"
            >
              <span className="truncate">{name}</span>
            </button>

            {menuOpen ? (
              <>
                <button type="button" aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white p-1.5 shadow-[0_12px_32px_rgba(11,18,39,0.14)]">
                  {isOperator ? (
                    <Link href="/career-launch/ops/students" className="flex items-center rounded-lg px-3 py-2.5 text-[13.5px] font-semibold text-[#B7791F] transition hover:bg-[#FFF9EC]">
                      {t("운영 콘솔", "Ops console", "运营控制台", "Bảng vận hành", "運営コンソール", "Konsol operasi")}
                    </Link>
                  ) : null}
                  <div className="px-3 pb-1 pt-2">
                    <p className="mb-1.5 text-[11px] font-bold text-[#B0B8C1]">{t("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa")}</p>
                    <select
                      value={locale}
                      onChange={(e) => setLocale(e.target.value as PlatformLocale)}
                      aria-label={t("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa")}
                      className="w-full rounded-lg border border-[#E5E8EB] bg-white px-2.5 py-2 text-[13px] font-semibold text-[#191F28] outline-none [color-scheme:light] focus:border-[#0B46E8]"
                    >
                      {PLATFORM_LOCALES.map((l) => (
                        <option key={l} value={l}>
                          {LOCALE_LABELS[l]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="my-1 border-t border-[#F2F4F6]" />
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="flex w-full items-center rounded-lg px-3 py-2.5 text-[13.5px] font-semibold text-[#F04452] transition hover:bg-[#FDECEE]"
                  >
                    {t("로그아웃", "Log out", "退出", "Đăng xuất", "ログアウト", "Keluar")}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
