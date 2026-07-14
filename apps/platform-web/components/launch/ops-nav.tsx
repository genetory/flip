"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  GraduationCap,
  SlidersHorizontal,
  BarChart3,
  ChevronDown,
  ExternalLink,
  type LucideIcon
} from "lucide-react";
import { fetchOpsStudents } from "../../lib/launch/ops-client";
import { useLaunchT } from "../../lib/launch/i18n";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; badge?: number };
// 대분류(그룹) → 소분류(항목). single=true 인 그룹은 제목 없이 한 줄 링크로 렌더한다.
type NavGroup = { key: string; title: string; items: NavItem[]; single?: boolean };

// 운영 콘솔 네비게이션 — 대분류/소분류 + 접기·펼치기(운영콘솔과 동일한 구조).
// '피드백 필요'(제출했으나 피드백 0건) 건수를 배지로 띄워 할 일이 바로 보이게 한다.
function useOpsNav() {
  const t = useLaunchT();
  const pathname = usePathname();
  const [needFeedback, setNeedFeedback] = useState(0);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const list = await fetchOpsStudents();
        if (!alive) return;
        setNeedFeedback(
          list.filter((s) => (s.hasResume || s.coverItems > 0 || s.interviewPracticed > 0) && s.feedbackTotal === 0).length
        );
      } catch {
        // 배지는 실패 시 숨김(네비는 계속 동작)
      }
    })();
    return () => {
      alive = false;
    };
  }, [pathname]); // 페이지 이동 시 갱신 — 피드백을 남기면 배지가 바로 줄어든다.

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
        },
        {
          href: "/career-launch/ops/submissions",
          label: t("피드백", "Feedback", "反馈", "Phản hồi", "フィードバック", "Umpan balik"),
          icon: MessageSquare,
          badge: needFeedback
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
        active ? "bg-[#0B46E8] text-white" : "text-[#4E5968] hover:bg-[#F2F4F6]"
      }`}
    >
      <Icon className={`h-4 w-4 flex-none ${active ? "text-white" : "text-[#8B95A1]"}`} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge && item.badge > 0 ? (
        <span
          className={`flex-none rounded-full px-1.5 py-0.5 text-[10.5px] font-black ${
            active ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700"
          }`}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

// 데스크탑 사이드바 — 대분류 그룹은 접을 수 있다(기본 펼침).
export function OpsSidebar() {
  const t = useLaunchT();
  const { groups, isActive } = useOpsNav();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <aside className="hidden w-56 flex-none lg:block">
      {/* 상단 여백은 콘텐츠(main pt-6 md:pt-10)와 맞춰 제목선이 나란히 오게 한다. */}
      <div className="sticky top-6 pb-8 pt-6 md:pt-10">
        <Link href="/career-launch/ops" className="block px-3 text-[15px] font-black tracking-[-0.01em] text-[#0B1227] transition hover:text-[#0B46E8]">
          {t("Launch 운영", "Launch admin", "Launch 运营", "Quản trị Launch", "Launch 運営", "Admin Launch")}
        </Link>
        <p className="mt-0.5 px-3 text-[11.5px] text-[#B0B8C1]">{t("운영 콘솔", "Admin console", "运营控制台", "Bảng quản trị", "運営コンソール", "Konsol admin")}</p>

        <nav className="mt-5 flex flex-col gap-1">
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
              <section key={g.key} className="border-t border-[#EEF1F5] pt-2.5">
                <button
                  type="button"
                  onClick={() => setCollapsed((prev) => ({ ...prev, [g.key]: !prev[g.key] }))}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#C9CDD2] transition hover:text-[#8B95A1]"
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

        <div className="mt-5 border-t border-[#EEF1F5] pt-4">
          <Link
            href="/career-launch/dashboard"
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {t("학생 화면 체험", "Try student view", "体验学生界面", "Xem giao diện sinh viên", "学生画面を体験", "Coba tampilan siswa")}
          </Link>
          <Link href="/career-launch" className="mt-0.5 block px-3 py-2 text-[12.5px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            ← {t("프로그램", "Program", "项目", "Chương trình", "プログラム", "Program")}
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
              {gi > 0 ? <span className="mx-0.5 h-3.5 w-px flex-none bg-[#E5E8EB]" aria-hidden /> : null}
              <span className="flex-none text-[10.5px] font-bold uppercase tracking-wide text-[#C9CDD2]">{g.title}</span>
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
                  active ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#4E5968]"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : "text-[#8B95A1]"}`} aria-hidden />
                {i.label}
                {i.badge && i.badge > 0 ? (
                  <span className={`rounded-full px-1.5 text-[10.5px] font-black ${active ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700"}`}>
                    {i.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
