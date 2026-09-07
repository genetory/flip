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
    <div className="cl-path">
      <div className="cl-path-line"><div className="cl-path-fill" style={{ width: `${fill}%` }} /></div>
      <div className="cl-path-track">
        {[1, 2, 3, 4].map((week) => {
          const i = week - 1;
          const done = vm.weekComplete[i];
          const isCurrent = week === vm.currentWeek && !done;
          const prevDone = i === 0 || vm.weekComplete[i - 1];
          const locked = !done && !isCurrent && !prevDone;
          const cls = done ? "cl-stop done" : isCurrent ? "cl-stop current" : "cl-stop";
          return (
            <Link
              key={week}
              href={locked ? "#" : `/career-launch/week/${week}`}
              onClick={(e) => {
                if (locked) { e.preventDefault(); return; }
                trackCareerFunnel("career_week_card_clicked", { currentWeek: week });
              }}
              aria-disabled={locked}
              className={cls}
              style={locked ? { opacity: 0.5, cursor: "default" } : undefined}
            >
              <div className="node">{done ? <Check size={15} weight="bold" /> : week}</div>
              <div className="wk">Week {week}</div>
              <div className="nm">{legName(t, week)}</div>
            </Link>
          );
        })}
        <div className="cl-stop dest">
          <div className="node">★</div>
          <div className="wk">Arrival</div>
          <div className="nm">{t("첫 취업", "First job", "首次就业", "Việc đầu tiên", "初就職", "Kerja pertama")}</div>
        </div>
      </div>
    </div>
  );
}
