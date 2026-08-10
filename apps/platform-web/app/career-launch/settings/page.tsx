"use client";

// Career Launch 설정 — partner/talent 설정과 동일한 역할(프로필·언어·계정·로그아웃).
// 헤더 프로필 pill 클릭 시 이곳으로 이동.
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretLeft, SignOut, CaretRight } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../components/AplyFooter";
import { Card, SectionTitle } from "../../../components/launch/ui";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLanguage } from "../../../components/i18n/LanguageProvider";
import { PLATFORM_LOCALES, type PlatformLocale } from "../../../lib/auth-messages";
import { useLaunchT } from "../../../lib/launch/i18n";

const LOCALE_LABELS: Record<PlatformLocale, string> = {
  ko: "한국어",
  en: "English",
  "zh-CN": "中文",
  vi: "Tiếng Việt",
  ja: "日本語",
  id: "Bahasa"
};

export default function CareerLaunchSettingsPage() {
  const t = useLaunchT();
  const router = useRouter();
  const { user, isReady, isAuthenticated, logout, getAccountUrl } = useAuthSession();
  const { locale, setLocale } = useLanguage();

  useEffect(() => {
    if (isReady && !isAuthenticated) router.replace("/career-launch");
  }, [isReady, isAuthenticated, router]);

  if (!isReady || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F8FB]">
        <span className="text-[13px] text-[#8B95A1]">{t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}</span>
      </main>
    );
  }

  const name = user?.name?.trim() || user?.email || t("학생", "Student", "学生", "Sinh viên", "学生", "Siswa");

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FB]">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          <Link href="/career-launch/dashboard" className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#4E5968]">
            <CaretLeft className="h-4 w-4" /> {t("대시보드", "Dashboard", "仪表板", "Bảng điều khiển", "ダッシュボード", "Dasbor")}
          </Link>
          <h1 className="text-[22px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[26px]">{t("설정", "Settings", "设置", "Cài đặt", "設定", "Pengaturan")}</h1>

          <div className="mt-6 flex flex-col gap-7">
            {/* 프로필 */}
            <Card className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px] font-black text-[#0B46E8]">{name.slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0">
                <p className="truncate text-[17px] font-black tracking-[-0.02em] text-[#0B1227]">{name}</p>
                {user?.email ? <p className="mt-0.5 truncate text-[13px] text-[#8B95A1]">{user.email}</p> : null}
              </div>
            </Card>

            {/* 언어 */}
            <div>
              <SectionTitle>{t("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa")}</SectionTitle>
              <Card className="flex items-center gap-3 !py-4">
                <span className="flex-1 text-[14.5px] text-[#191F28]">{t("표시 언어", "Display language", "显示语言", "Ngôn ngữ hiển thị", "表示言語", "Bahasa tampilan")}</span>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as PlatformLocale)}
                  aria-label={t("표시 언어", "Display language", "显示语言", "Ngôn ngữ hiển thị", "表示言語", "Bahasa tampilan")}
                  className="rounded-xl border border-[#E5E8EB] bg-white px-3 py-2 text-[13.5px] font-semibold text-[#191F28] outline-none [color-scheme:light] focus:border-[#0B46E8]"
                >
                  {PLATFORM_LOCALES.map((l) => (
                    <option key={l} value={l}>
                      {LOCALE_LABELS[l]}
                    </option>
                  ))}
                </select>
              </Card>
            </div>

            {/* 계정 */}
            <div>
              <SectionTitle>{t("계정", "Account", "账户", "Tài khoản", "アカウント", "Akun")}</SectionTitle>
              <Card className="divide-y divide-[#F2F4F6] !p-0">
                <Item label={t("계정 정보 관리", "Manage account", "管理账户", "Quản lý tài khoản", "アカウント管理", "Kelola akun")} href={getAccountUrl()} />
                <Item label={t("이용약관", "Terms", "用户协议", "Điều khoản", "利用規約", "Ketentuan")} href="/legal/terms" />
                <Item label={t("개인정보처리방침", "Privacy Policy", "隐私政策", "Chính sách bảo mật", "プライバシーポリシー", "Kebijakan Privasi")} href="/legal/privacy" />
              </Card>
            </div>

            <button
              type="button"
              onClick={() => void logout()}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#EEF1F5] bg-white py-4 text-[14px] font-semibold text-[#F04452] transition hover:bg-[#FFF5F5]"
            >
              <SignOut className="h-[18px] w-[18px]" /> {t("로그아웃", "Log out", "退出登录", "Đăng xuất", "ログアウト", "Keluar")}
            </button>
          </div>
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}

function Item({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-5 py-4 transition hover:bg-[#F6F8FB]">
      <span className="flex-1 text-[14.5px] text-[#191F28]">{label}</span>
      <CaretRight className="h-4 w-4 text-[#C4CAD2]" />
    </Link>
  );
}
