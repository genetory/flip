"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, GraduationCap, Users, MessageSquare, BarChart3, SlidersHorizontal, ExternalLink, type LucideIcon } from "lucide-react";
import { fetchOpsStudents } from "../../lib/launch/ops-client";
import { useLaunchT } from "../../lib/launch/i18n";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; badge?: number };
type NavGroup = { title: string | null; items: NavItem[] };

// 운영 콘솔 네비게이션 — 데스크탑 사이드바 + 모바일 가로 탭.
// '피드백 필요'(제출했으나 피드백 0건) 건수를 배지로 띄워 할 일이 바로 보이게 한다.
function useOpsNav(): { groups: NavGroup[]; isActive: (i: NavItem) => boolean } {
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
        // 배지는 실패 시 그냥 숨김(네비는 계속 동작)
      }
    })();
    return () => {
      alive = false;
    };
  }, [pathname]); // 페이지 이동 시 갱신 — 피드백을 남기면 배지가 바로 줄어든다.

  const groups: NavGroup[] = [
    {
      title: null,
      items: [{ href: "/career-launch/ops", label: t("홈", "Home", "首页", "Trang chủ", "ホーム", "Beranda"), icon: Home, exact: true }]
    },
    {
      title: t("운영", "Operations", "运营", "Vận hành", "運営", "Operasi"),
      items: [
        { href: "/career-launch/ops/cohorts", label: t("기수 관리", "Cohorts", "期次管理", "Quản lý khóa", "期の管理", "Angkatan"), icon: GraduationCap },
        { href: "/career-launch/ops/students", label: t("학생 관리", "Students", "学生管理", "Quản lý sinh viên", "学生管理", "Siswa"), icon: Users },
        { href: "/career-launch/ops/submissions", label: t("피드백", "Feedback", "反馈", "Phản hồi", "フィードバック", "Umpan balik"), icon: MessageSquare, badge: needFeedback }
      ]
    },
    {
      title: t("분석", "Analytics", "分析", "Phân tích", "分析", "Analitik"),
      items: [{ href: "/career-launch/ops/report", label: t("리포트", "Report", "报告", "Báo cáo", "レポート", "Laporan"), icon: BarChart3 }]
    },
    {
      title: t("설정", "Settings", "设置", "Cài đặt", "設定", "Pengaturan"),
      items: [{ href: "/career-launch/ops/prompts", label: t("프롬프트", "Prompts", "提示词", "Prompt", "プロンプト", "Prompt"), icon: SlidersHorizontal }]
    }
  ];

  const isActive = (i: NavItem) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`));
  return { groups, isActive };
}

// 데스크탑 사이드바
export function OpsSidebar() {
  const t = useLaunchT();
  const { groups, isActive } = useOpsNav();

  return (
    <aside className="hidden w-56 flex-none lg:block">
      <div className="sticky top-6 py-8">
        <Link href="/career-launch/ops" className="block px-3 text-[15px] font-black tracking-[-0.01em] text-[#0B1227] transition hover:text-[#0B46E8]">
          {t("Launch 운영", "Launch admin", "Launch 运营", "Quản trị Launch", "Launch 運営", "Admin Launch")}
        </Link>
        <p className="mt-0.5 px-3 text-[11.5px] text-[#B0B8C1]">{t("운영 콘솔", "Admin console", "运营控制台", "Bảng quản trị", "運営コンソール", "Konsol admin")}</p>

        <nav className="mt-5 space-y-5">
          {groups.map((g, gi) => (
            <div key={gi}>
              {g.title ? <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wide text-[#C9CDD2]">{g.title}</p> : null}
              <div className="space-y-0.5">
                {g.items.map((i) => {
                  const Icon = i.icon;
                  const active = isActive(i);
                  return (
                    <Link
                      key={i.href}
                      href={i.href}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-bold transition ${
                        active ? "bg-[#0B46E8] text-white" : "text-[#4E5968] hover:bg-[#F2F4F6]"
                      }`}
                    >
                      <Icon className={`h-4 w-4 flex-none ${active ? "text-white" : "text-[#8B95A1]"}`} />
                      <span className="min-w-0 flex-1 truncate">{i.label}</span>
                      {i.badge && i.badge > 0 ? (
                        <span
                          className={`flex-none rounded-full px-1.5 py-0.5 text-[10.5px] font-black ${
                            active ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {i.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-6 border-t border-[#EEF1F5] pt-4">
          <Link
            href="/career-launch/dashboard"
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
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

// 모바일 가로 탭
export function OpsMobileNav() {
  const { groups, isActive } = useOpsNav();
  const items = groups.flatMap((g) => g.items);

  return (
    <nav className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 pt-5 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((i) => {
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
            <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : "text-[#8B95A1]"}`} />
            {i.label}
            {i.badge && i.badge > 0 ? (
              <span className={`rounded-full px-1.5 text-[10.5px] font-black ${active ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700"}`}>
                {i.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
