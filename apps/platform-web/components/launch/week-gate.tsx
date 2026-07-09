"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProgress } from "../../lib/launch/progress-client";
import { fetchResumeData } from "../../lib/launch/resume-data";
import { fetchCoverData } from "../../lib/launch/cover-data";
import { weekUnlocked, type LaunchData } from "../../lib/launch/step-status";
import { Card } from "./ui";

// 주차 순차 잠금 가드 — 직전 주차를 완료해야 열린다. 잠겨 있으면 안내를 보여준다.
export function WeekGate({ week, children }: { week: number; children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "open" | "locked">("loading");

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [p, r, c] = await Promise.all([
          fetchProgress(),
          fetchResumeData().catch(() => ({ data: {} })),
          fetchCoverData().catch(() => ({ data: {} }))
        ]);
        const d: LaunchData = { progress: p, resume: r.data ?? {}, cover: c.data ?? {} };
        if (alive) setState(weekUnlocked(week, d) ? "open" : "locked");
      } catch {
        // 조회 실패 시 막지 않는다(잠금 오작동 방지).
        if (alive) setState("open");
      }
    })();
    return () => {
      alive = false;
    };
  }, [week]);

  if (state === "loading") return <Card className="!p-8 text-center text-[13px] text-[#8B95A1]">불러오는 중…</Card>;
  if (state === "locked") {
    return (
      <Card className="!p-8 text-center">
        <p className="text-[26px]">🔒</p>
        <p className="mt-2 text-[15px] font-black text-[#191F28]">아직 잠겨 있어요</p>
        <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">Week {week - 1}를 모두 완료하면 이 주차가 열려요.</p>
        <Link href={`/career-launch/week/${week - 1}`} className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]">
          Week {week - 1} 이어서 하기 →
        </Link>
      </Card>
    );
  }
  return <>{children}</>;
}
