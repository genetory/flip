"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProgress, fetchWeekSchedule, type WeekScheduleEntry } from "../../lib/launch/progress-client";
import { fetchResumeData } from "../../lib/launch/resume-data";
import { fetchCoverData } from "../../lib/launch/cover-data";
import { weekUnlocked, weekOpensAt, type LaunchData } from "../../lib/launch/step-status";
import { Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

// 주차 잠금 가드 — 기수 오픈 일정(날짜/강제)이 있으면 그 기준, 없으면 직전 주차 완료 기준.
export function WeekGate({ week, children }: { week: number; children: React.ReactNode }) {
  const t = useLaunchT();
  const [state, setState] = useState<"loading" | "open" | "locked">("loading");
  const [opensAt, setOpensAt] = useState<string | null>(null); // 날짜 잠금이면 예정 오픈일

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [p, r, c, sched] = await Promise.all([
          fetchProgress(),
          fetchResumeData().catch(() => ({ data: {} })),
          fetchCoverData().catch(() => ({ data: {} })),
          fetchWeekSchedule().catch(() => ({ weekSchedule: [] as WeekScheduleEntry[], serverNow: new Date().toISOString() }))
        ]);
        const d: LaunchData = { progress: p, resume: r.data ?? {}, cover: c.data ?? {} };
        const now = new Date(sched.serverNow);
        const open = weekUnlocked(week, d, sched.weekSchedule, now);
        if (alive) {
          setOpensAt(weekOpensAt(week, sched.weekSchedule));
          setState(open ? "open" : "locked");
        }
      } catch {
        // 조회 실패 시 막지 않는다(잠금 오작동 방지).
        if (alive) setState("open");
      }
    })();
    return () => {
      alive = false;
    };
  }, [week]);

  if (state === "loading") return <Card className="!p-8 text-center text-[13px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</Card>;
  if (state === "locked") {
    const dateLocked = Boolean(opensAt);
    const opensStr = opensAt ? new Date(opensAt).toLocaleString("ko-KR", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Seoul" }) : "";
    return (
      <Card className="!p-8 text-center">
        <p className="text-[26px]">🔒</p>
        <p className="mt-2 text-[15px] font-black text-[#191F28]">{t("아직 잠겨 있어요", "Still locked", "尚未解锁", "Vẫn đang khóa", "まだロックされています", "Masih terkunci")}</p>
        {dateLocked ? (
          <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">
            {t(`${opensStr}에 열려요.`, `Opens on ${opensStr}.`, `将于 ${opensStr} 开放。`, `Mở vào ${opensStr}.`, `${opensStr} に開きます。`, `Dibuka pada ${opensStr}.`)}
          </p>
        ) : (
          <>
            <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t(`Week ${week - 1}를 모두 완료하면 이 주차가 열려요.`, `Finish everything in Week ${week - 1} to unlock this week.`, `完成 Week ${week - 1} 的全部内容后，本周将会开放。`, `Hoàn thành toàn bộ Week ${week - 1} để mở khóa tuần này.`, `Week ${week - 1} をすべて完了すると、この週が開きます。`, `Selesaikan semua di Week ${week - 1} untuk membuka minggu ini.`)}</p>
            <Link href={`/career-launch/week/${week - 1}`} className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]">
              {t(`Week ${week - 1} 이어서 하기`, `Continue Week ${week - 1}`, `继续 Week ${week - 1}`, `Tiếp tục Week ${week - 1}`, `Week ${week - 1} を続ける`, `Lanjutkan Week ${week - 1}`)} →
            </Link>
          </>
        )}
      </Card>
    );
  }
  return <>{children}</>;
}
