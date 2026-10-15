"use client";

// Career Launch 설정 — partner/talent 설정과 동일한 역할(프로필·계정·로그아웃).
// 언어 변경은 GNB 우측 언어 선택기에서 제공(설정 내 언어 섹션은 제거).
// 헤더 프로필 pill 클릭 시 이곳으로 이동.
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretLeft, SignOut, CaretRight, CircleNotch } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { LaunchAmbientBackground } from "../../../components/launch/LaunchAmbientBackground";
import { AplyFooter } from "../../../components/AplyFooter";
import { SectionTitle } from "../../../components/launch/ui";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../lib/launch/i18n";

export default function CareerLaunchSettingsPage() {
  const t = useLaunchT();
  const router = useRouter();
  const { user, isReady, isAuthenticated, logout, getAccountUrl } = useAuthSession();

  useEffect(() => {
    if (isReady && !isAuthenticated) router.replace("/career-launch");
  }, [isReady, isAuthenticated, router]);

  if (!isReady || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[color:var(--v2-bg,#fff)]">
        <span className="inline-flex items-center gap-2 text-[13px] text-[color:var(--v2-faint)]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}</span>
      </main>
    );
  }

  const name = user?.name?.trim() || user?.email || t("학생", "Student", "学生", "Sinh viên", "学生", "Siswa");

  return (
    <div className="isolate flex min-h-screen flex-col bg-[color:var(--v2-bg,#fff)]">
      <LaunchAmbientBackground />
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          <Link href="/career-launch/dashboard" className="mb-4 inline-flex items-center gap-1 text-[15px] font-medium text-[color:var(--v2-faint)] transition hover:text-[color:var(--v2-ink-3)]">
            <CaretLeft className="h-4 w-4" /> {t("대시보드", "Dashboard", "仪表板", "Bảng điều khiển", "ダッシュボード", "Dasbor")}
          </Link>
          <h1 className="text-[26px] font-bold leading-[1.38] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[30px]">{t("설정", "Settings", "设置", "Cài đặt", "設定", "Pengaturan")}</h1>

          <div className="mt-6 flex flex-col gap-7">
            {/* 프로필 */}
            <div className="flex items-center gap-4 rounded-3xl bg-[color:var(--v2-band)] p-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[22px] font-bold text-[color:var(--v2-accent)]">{name.slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0">
                <p className="truncate text-[17px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{name}</p>
                {user?.email ? <p className="mt-0.5 truncate text-[13px] text-[color:var(--v2-faint)]">{user.email}</p> : null}
              </div>
            </div>

            {/* 계정 */}
            <div>
              <SectionTitle>{t("계정", "Account", "账户", "Tài khoản", "アカウント", "Akun")}</SectionTitle>
              <div className="divide-y divide-[color:var(--v2-line)] overflow-hidden rounded-3xl bg-[color:var(--v2-band)]">
                <Item label={t("계정 정보 관리", "Manage account", "管理账户", "Quản lý tài khoản", "アカウント管理", "Kelola akun")} href={getAccountUrl()} />
                <Item label={t("이용약관", "Terms", "用户协议", "Điều khoản", "利用規約", "Ketentuan")} href="/legal/terms" />
                <Item label={t("개인정보처리방침", "Privacy Policy", "隐私政策", "Chính sách bảo mật", "プライバシーポリシー", "Kebijakan Privasi")} href="/legal/privacy" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => void logout()}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[color:var(--v2-band)] text-[16px] font-semibold text-[color:var(--v2-attention)] transition hover:bg-[color:var(--v2-line)]"
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
    <Link href={href} className="flex items-center gap-3 px-5 py-4 transition hover:bg-[color:var(--v2-line)]">
      <span className="flex-1 text-[16px] font-medium text-[color:var(--v2-ink)]">{label}</span>
      <CaretRight className="h-4 w-4 text-[color:var(--v2-faint)]" />
    </Link>
  );
}
