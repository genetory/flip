"use client";

import { useEffect, useState } from "react";
import { Card, SectionTitle } from "./ui";
import { fetchMySeminars, type CohortSeminar } from "../../lib/launch/enrollment-client";
import { useLaunchT } from "../../lib/launch/i18n";

// 학생 주차 화면의 세미나 정보 — 운영자가 기수에 입력한 일정을 표시한다(없으면 아무것도 렌더하지 않음).
export function WeekSeminar({ week }: { week: number }) {
  const t = useLaunchT();
  const [sem, setSem] = useState<CohortSeminar | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchMySeminars()
      .then((list) => {
        if (alive) setSem(list.find((s) => s.week === week) ?? null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [week]);

  if (!sem) return null;

  const d = new Date(sem.startsAt);
  const date = Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" });
  const time = Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <SectionTitle>{t("세미나 정보", "Seminar info", "研讨会信息", "Thông tin hội thảo", "セミナー情報", "Info seminar")}</SectionTitle>
      <Card className="flex items-start gap-3">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[#EDF1FD] text-[20px]">{sem.online ? "💻" : "📍"}</span>
        <div className="min-w-0">
          {sem.title ? <p className="text-[13px] font-bold text-[#0B46E8]">{sem.title}</p> : null}
          <p className="text-[14px] font-bold text-[#191F28]">{date}</p>
          <p className="mt-0.5 text-[13px] text-[#4E5968]">{time}</p>
          {sem.location ? <p className="text-[12.5px] text-[#8B95A1]">{sem.location}</p> : null}
          {sem.online && sem.url ? (
            <a href={sem.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[12.5px] font-semibold text-[#0B46E8] underline">
              {t("접속 링크 열기", "Open join link", "打开链接", "Mở liên kết tham gia", "参加リンクを開く", "Buka tautan")}
            </a>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
