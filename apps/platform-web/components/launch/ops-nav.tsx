"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
// 아이콘은 Phosphor 로 통일(기존 lucide 이름으로 alias).
import {
  SquaresFour as LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  SlidersHorizontal,
  ChartBar as BarChart3,
  CaretDown as ChevronDown,
  ArrowSquareOut as ExternalLink,
  Globe,
  SignOut,
  type Icon as LucideIcon
} from "@phosphor-icons/react";
import { useLaunchT } from "../../lib/launch/i18n";
import { useLanguage } from "../i18n/LanguageProvider";
import { useAuthSession } from "../auth/AuthSessionProvider";

// 상단바를 없앤 데스크톱 사이드바에서 쓰는 언어 목록(상단바와 동일).
const OPS_LOCALES = [
  { key: "ko", label: "한국어" },
  { key: "en", label: "English" },
  { key: "zh-CN", label: "中文" },
  { key: "vi", label: "Tiếng Việt" },
  { key: "ja", label: "日本語" },
  { key: "id", label: "Indonesia" }
] as const;

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };
// 대분류(그룹) → 소분류(항목). single=true 인 그룹은 제목 없이 한 줄 링크로 렌더한다.
type NavGroup = { key: string; title: string; items: NavItem[]; single?: boolean };

// 운영 콘솔 네비게이션 — 대분류/소분류 + 접기·펼치기(운영콘솔과 동일한 구조).
function useOpsNav() {
  const t = useLaunchT();
  const pathname = usePathname();

  const groups: NavGroup[] = [
    {
      key: "home",
      title: t("홈", "Home", "首页", "Trang chủ", "ホーム", "Beranda"),
      single: true,
      items: [
        {
          href: "/career-launch/ops",
          label: t("대시보드", "Dashboard", "仪表板", "Bảng điều khiển", "ダッシュボード", "Dasbor"),
          icon: LayoutDashboard,
          exact: true
        }
      ]
    },
    {
      key: "students",
      title: t("학생 관리", "Student management", "学生管理", "Quản lý sinh viên", "学生管理", "Manajemen siswa"),
      items: [
        {
          href: "/career-launch/ops/students",
          label: t("학생 현황", "Student status", "学生状态", "Tình trạng sinh viên", "学生の状況", "Status siswa"),
          icon: Users
        }
      ]
    },
    {
      key: "program",
      title: t("프로그램 운영", "Program operations", "项目运营", "Vận hành chương trình", "プログラム運営", "Operasi program"),
      items: [
        {
          href: "/career-launch/ops/cohorts",
          label: t("기수 관리", "Cohorts", "期次管理", "Quản lý khóa", "期の管理", "Angkatan"),
          icon: GraduationCap
        },
        {
          href: "/career-launch/ops/content",
          label: t("프로그램 콘텐츠", "Program content", "项目内容", "Nội dung chương trình", "プログラム内容", "Konten program"),
          icon: FileText
        },
        {
          href: "/career-launch/ops/prompts",
          label: t("AI 프롬프트", "AI prompts", "AI 提示词", "Prompt AI", "AIプロンプト", "Prompt AI"),
          icon: SlidersHorizontal
        }
      ]
    },
    {
      key: "analytics",
      title: t("분석", "Analytics", "分析", "Phân tích", "分析", "Analitik"),
      items: [
        {
          href: "/career-launch/ops/report",
          label: t("리포트", "Report", "报告", "Báo cáo", "レポート", "Laporan"),
          icon: BarChart3
        }
      ]
    }
  ];

  // "/career-launch/ops"는 모든 하위 경로의 접두사라 정확 일치로만 활성 처리한다.
  const isActive = (i: NavItem) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`));
  return { groups, isActive };
}

function NavRow({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-bold transition ${
        active ? "bg-[var(--accent)] text-white" : "text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
      }`}
    >
      <Icon className={`h-4 w-4 flex-none ${active ? "text-white" : "text-[var(--ink-faint)]"}`} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </Link>
  );
}

// 데스크탑 사이드바 — 대분류 그룹은 접을 수 있다(기본 펼침).
export function OpsSidebar() {
  const t = useLaunchT();
  const { groups, isActive } = useOpsNav();
  const { locale, setLocale } = useLanguage();
  const { logout } = useAuthSession();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <aside className="w-60 flex-none">
      {/* 화면 높이에 고정 — 브랜드/버튼은 고정되고, 메뉴(nav)만 스크롤된다(운영콘솔과 동일). */}
      <div className="flex h-[100dvh] flex-col overflow-hidden px-3 py-6">
        <Link href="/career-launch/ops" className="block px-3 text-[15px] font-black tracking-[-0.01em] text-[var(--ink)] transition hover:text-[var(--accent)]">
          {t("Launch 운영", "Launch admin", "Launch 运营", "Quản trị Launch", "Launch 運営", "Admin Launch")}
        </Link>
        <p className="mt-0.5 px-3 text-[11.5px] text-[var(--ink-faint)]">{t("운영 콘솔", "Admin console", "运营控制台", "Bảng quản trị", "運営コンソール", "Konsol admin")}</p>

        <nav className="mt-5 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {groups.map((g) => {
            // 단일 그룹(홈)은 제목/토글 없이 한 줄 링크로 — 시각적 잡음을 줄인다.
            if (g.single) {
              return (
                <div key={g.key} className="pb-1">
                  <NavRow item={g.items[0]} active={isActive(g.items[0])} />
                </div>
              );
            }
            const open = !collapsed[g.key];
            return (
              <section key={g.key} className="border-t border-[var(--line)] pt-2.5">
                <button
                  type="button"
                  onClick={() => setCollapsed((prev) => ({ ...prev, [g.key]: !prev[g.key] }))}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-faint)] transition hover:text-[var(--ink-faint)]"
                >
                  <span>{g.title}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden />
                </button>
                {open ? (
                  <div className="mt-0.5 space-y-0.5">
                    {g.items.map((i) => (
                      <NavRow key={i.href} item={i} active={isActive(i)} />
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </nav>

        {/* 하단 — 운영 콘솔과 동일한 버튼 스택(콘솔 전환·플랫폼·프로필) + 언어·로그아웃(상단바 대체) */}
        <div className="ops-console-logout-wrap mt-auto" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="flex items-center gap-2">
            <label className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl bg-[var(--surface-2)] px-2.5 py-2">
              <Globe className="h-3.5 w-3.5 flex-none text-[var(--ink-faint)]" aria-hidden />
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as typeof locale)}
                className="w-full bg-transparent text-[12.5px] font-semibold text-[var(--ink-soft)] outline-none"
                aria-label={t("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa")}
              >
                {OPS_LOCALES.map((l) => (
                  <option key={l.key} value={l.key}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => void logout()}
              aria-label={t("로그아웃", "Sign out", "退出", "Đăng xuất", "ログアウト", "Keluar")}
              className="flex-none rounded-xl bg-[var(--surface-2)] p-2 text-[var(--ink-faint)] transition hover:bg-[var(--line)] hover:text-[var(--ink)]"
            >
              <SignOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <Link href="/career-launch/dashboard">
            <button type="button" className="ops-console-logout">
              {t("학생 화면 체험", "Try student view", "体验学生界面", "Xem giao diện sinh viên", "学生画面を体験", "Coba tampilan siswa")}
            </button>
          </Link>
          <Link href="/dashboard/ops">
            <button type="button" className="ops-console-logout">
              {t("운영 콘솔", "Ops console", "运营控制台", "Bảng vận hành", "運営コンソール", "Konsol operasi")}
            </button>
          </Link>
          <Link href="/">
            <button type="button" className="ops-console-logout">
              {t("플랫폼으로 이동", "Go to platform", "前往平台", "Đến nền tảng", "プラットフォームへ", "Ke platform")}
            </button>
          </Link>
          <Link href="/profile">
            <button type="button" className="ops-console-logout">
              {t("내 프로필로 이동", "My profile", "我的资料", "Hồ sơ của tôi", "マイプロフィール", "Profil saya")}
            </button>
          </Link>
        </div>
      </div>
    </aside>
  );
}

// 모바일 — 대분류 라벨을 구분자로 두고 소분류를 가로 스크롤 칩으로.
export function OpsMobileNav() {
  const { groups, isActive } = useOpsNav();

  return (
    <nav className="-mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-1 pt-5 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {groups.map((g, gi) => (
        <div key={g.key} className="flex flex-none items-center gap-1.5">
          {!g.single ? (
            <>
              {gi > 0 ? <span className="mx-0.5 h-3.5 w-px flex-none bg-[var(--line)]" aria-hidden /> : null}
              <span className="flex-none text-[10.5px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">{g.title}</span>
            </>
          ) : null}
          {g.items.map((i) => {
            const Icon = i.icon;
            const active = isActive(i);
            return (
              <Link
                key={i.href}
                href={i.href}
                className={`flex flex-none items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold transition ${
                  active ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-2)] text-[var(--ink-soft)]"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : "text-[var(--ink-faint)]"}`} aria-hidden />
                {i.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
