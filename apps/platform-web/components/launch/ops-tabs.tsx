"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LaunchContainer } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

export function OpsTabs() {
  const t = useLaunchT();
  const pathname = usePathname();
  const TABS = [
    { href: "/career-launch/ops/cohorts", label: t("기수 관리", "Cohorts", "期次管理", "Quản lý khóa", "期の管理", "Manajemen angkatan") },
    { href: "/career-launch/ops/students", label: t("학생 관리", "Students", "学生管理", "Quản lý sinh viên", "学生管理", "Manajemen siswa") },
    { href: "/career-launch/ops/submissions", label: t("피드백", "Feedback", "反馈", "Phản hồi", "フィードバック", "Umpan balik") },
    { href: "/career-launch/ops/prompts", label: t("프롬프트", "Prompts", "提示词", "Prompt", "プロンプト", "Prompt") },
    { href: "/career-launch/ops/report", label: t("리포트", "Report", "报告", "Báo cáo", "レポート", "Laporan") }
  ];
  return (
    <div className="border-b border-[#EEF1F5] bg-white/90 backdrop-blur">
      <LaunchContainer className="!max-w-6xl">
        <div className="flex h-12 items-center justify-between">
          <span className="text-[13px] font-extrabold text-[#0B1227]">{t("Launch 운영", "Launch admin", "Launch 运营", "Quản trị Launch", "Launch 運営", "Admin Launch")}</span>
          <Link href="/career-launch" className="text-[12px] font-semibold text-[#8B95A1]">← {t("프로그램", "Program", "项目", "Chương trình", "プログラム", "Program")}</Link>
        </div>
        <nav className="flex gap-1 pb-2">
          {TABS.map((t) => {
            const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold transition ${active ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#4E5968]"}`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </LaunchContainer>
    </div>
  );
}
