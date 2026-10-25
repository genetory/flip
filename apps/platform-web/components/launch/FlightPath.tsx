"use client";

// 4주 여정 타임라인 — "비행 경로". FourWeekJourney(그리드 카드)를 대체하되
// 완료/현재/잠금 상태·주차 링크 로직은 동일하게 유지한다.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check } from "@phosphor-icons/react";
import type { DashboardVM } from "../../lib/launch/dashboard-client";
import { useLaunchT } from "../../lib/launch/i18n";
import { trackCareerFunnel } from "../../lib/analytics";

type LaunchT = ReturnType<typeof useLaunchT>;

function legName(t: LaunchT, week: number): string {
  switch (week) {
    case 1: return t("진단 · 직무 확정", "Diagnosis · target role", "诊断 · 确定职务", "Chẩn đoán · chọn nghề", "診断 · 職種確定", "Diagnosis · peran");
    case 2: return t("서류 완성", "Documents", "完成材料", "Hoàn thiện hồ sơ", "書類完成", "Dokumen");
    case 3: return t("기본 면접", "Core interview", "基础面试", "PV cơ bản", "基本面接", "Wawancara inti");
    case 4: return t("공고별 실전", "Job-specific", "实战面试", "PV theo tin", "求人別実戦", "Per lowongan");
    default: return `Week ${week}`;
  }
}

export function FlightPath({ vm }: { vm: DashboardVM }) {
  const t = useLaunchT();
  const anyCurrent = vm.currentWeek >= 1 && vm.currentWeek <= 4 && !vm.weekComplete[vm.currentWeek - 1];
  const targetFill = Math.min(100, Math.round(((vm.weeksDoneCount + (anyCurrent ? 0.4 : 0)) / 4) * 100));

  const [fill, setFill] = useState(0);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setFill(targetFill); return; }
    const id = window.setTimeout(() => setFill(targetFill), 150);
    return () => window.clearTimeout(id);
  }, [targetFill]);

  return (
    <div className="relative isolate rounded-3xl bg-[color:var(--v2-band)] px-5 py-7 md:px-8 md:py-8">
      <div className="absolute left-[10%] right-[10%] top-12 z-0 hidden h-1 rounded-full bg-white md:block"><div className="absolute left-0 top-0 h-full rounded-full bg-[color:var(--v2-accent)] transition-[width] delay-200 duration-[1200ms] motion-reduce:transition-none" style={{ width: `${fill}%` }} /></div>
      <div className="relative z-[1] grid grid-cols-2 items-start gap-y-6 md:grid-cols-5 md:gap-y-0">
        {[1, 2, 3, 4].map((week) => {
          const i = week - 1;
          const done = vm.weekComplete[i];
          const isCurrent = week === vm.currentWeek && !done;
          const prevDone = i === 0 || vm.weekComplete[i - 1];
          const locked = !done && !isCurrent && !prevDone;
          const cls = "relative z-[1] px-1 text-center";
          const nodeCls = done
            ? "bg-[color:var(--v2-accent)] text-white"
            : isCurrent
              ? "bg-white text-[color:var(--v2-accent)] ring-2 ring-[color:var(--v2-accent)] ring-offset-4 ring-offset-[color:var(--v2-band)]"
              : "bg-white text-[color:var(--v2-faint)]";
          return (
            <Link
              key={week}
              href={locked ? "#" : `/career-launch/program?week=${week}`}
              onClick={(e) => {
                if (locked) { e.preventDefault(); return; }
                trackCareerFunnel("career_week_card_clicked", { currentWeek: week });
              }}
              aria-disabled={locked}
              className={cls}
              style={locked ? { opacity: 0.5, cursor: "default" } : undefined}
            >
              <div className={`relative z-[3] mx-auto mb-3 grid h-8 w-8 place-items-center rounded-full text-[13px] font-bold ${nodeCls}`}>{done ? <Check size={15} weight="bold" /> : week}</div>
              <div className="text-[12px] font-medium text-[color:var(--v2-faint)]">Week {week}</div>
              <div className={`mt-0.5 break-keep text-[13px] font-semibold ${isCurrent ? "text-[color:var(--v2-accent)]" : "text-[color:var(--v2-ink)]"}`}>{legName(t, week)}</div>
            </Link>
          );
        })}
        <div className="relative z-[1] col-span-2 px-1 text-center md:col-span-1">
          <div className="relative z-[3] mx-auto mb-3 grid h-8 w-8 place-items-center rounded-full border-2 border-dashed border-[color:var(--v2-accent)] bg-white text-[13px] font-bold text-[color:var(--v2-accent)]">★</div>
          <div className="text-[12px] font-medium text-[color:var(--v2-faint)]">Arrival</div>
          <div className="mt-0.5 break-keep text-[13px] font-semibold text-[color:var(--v2-ink)]">{t("첫 취업", "First job", "首次就业", "Việc đầu tiên", "初就職", "Kerja pertama")}</div>
        </div>
      </div>
    </div>
  );
}
