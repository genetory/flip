"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LaunchContainer } from "./ui";

const TABS = [
  { href: "/career-launch/ops/students", label: "학생 관리" },
  { href: "/career-launch/ops/prompts", label: "프롬프트" },
  { href: "/career-launch/ops/report", label: "리포트" }
];

export function OpsTabs() {
  const pathname = usePathname();
  return (
    <div className="border-b border-[#EEF1F5] bg-white/90 backdrop-blur">
      <LaunchContainer className="!max-w-[640px]">
        <div className="flex h-12 items-center justify-between">
          <span className="text-[13px] font-extrabold text-[#0B1227]">Launch 운영</span>
          <Link href="/career-launch" className="text-[12px] font-semibold text-[#8B95A1]">← 프로그램</Link>
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
