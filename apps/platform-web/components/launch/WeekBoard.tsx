"use client";

// 4주 프로그램 칸반 보드 — 1~4주를 가로 스크롤 칼럼으로. 각 칼럼에 주차 헤더 +
// 미션(WeekStepper) + 주차별 카드. 미션(채팅형)은 그 자리에서 모달로 연다.
// 기존 주차 페이지의 미션·모달 로직을 그대로 재사용(중복 UI 없이 표현만 칸반화).
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { WEEKS } from "../../lib/launch/data";
import { WeekStepper } from "./week-stepper";
import { WeekPacing } from "./week-pacing";
import { ResumeScoreCard } from "./ResumeScoreCard";
import { CoverScoreCard } from "./CoverScoreCard";
import { PostingInterviewCard } from "./PostingInterviewCard";
import { InterviewPrepChecklist } from "./InterviewPrepChecklist";
import { fetchProgress } from "../../lib/launch/progress-client";
import { fetchResumeData } from "../../lib/launch/resume-data";
import { fetchCoverData } from "../../lib/launch/cover-data";
import { weekDoneCount, isWeekComplete, type LaunchData } from "../../lib/launch/step-status";
import { CareerChatModal } from "./CareerChatModal";
import { DiagnosisChat } from "./DiagnosisChat";
import { ExperienceChat } from "./ExperienceChat";
import { StrengthStoryChat } from "./StrengthStoryChat";
import { TargetCompanyExplorer } from "./TargetCompanyExplorer";
import { JobsChat } from "./JobsChat";
import { MaterialsChat } from "./MaterialsChat";
import { InterviewChat } from "./InterviewChat";
import { BasicInterviewSession } from "./BasicInterviewSession";
import { useLaunchT } from "../../lib/launch/i18n";
import { useWeekText } from "../../lib/launch/data-i18n";

export function WeekBoard() {
  const t = useLaunchT();
  const weekText = useWeekText();
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState<LaunchData>({ progress: {}, resume: {}, cover: {} });
  useEffect(() => {
    let alive = true;
    void (async () => {
      const [p, r, c] = await Promise.all([
        fetchProgress().catch(() => ({}) as LaunchData["progress"]),
        fetchResumeData().catch(() => ({ data: {} })),
        fetchCoverData().catch(() => ({ data: {} }))
      ]);
      if (alive) setData({ progress: p, resume: r.data ?? {}, cover: c.data ?? {} });
    })();
    return () => { alive = false; };
  }, [refreshKey]);

  // 채팅형 미션은 href 기준으로 그 자리에서 모달 오픈(주차 페이지와 동일 배선).
  const [chatHref, setChatHref] = useState<string | null>(null);
  const renderChatModal = () => {
    if (!chatHref) return null;
    const path = chatHref.split("?")[0];
    const query = chatHref.includes("?") ? new URLSearchParams(chatHref.split("?")[1]) : new URLSearchParams();
    const section = query.get("section") ?? undefined;
    const focus = query.get("focus") ?? undefined;
    const close = () => {
      setChatHref(null);
      setRefreshKey((k) => k + 1);
    };
    let body: React.ReactNode = null;
    if (path.endsWith("/diagnosis")) body = <DiagnosisChat embedded onClose={close} />;
    else if (path.endsWith("/experience")) body = <ExperienceChat embedded onClose={close} />;
    else if (path.endsWith("/story")) body = <StrengthStoryChat embedded onClose={close} />;
    else if (path.endsWith("/company")) body = <TargetCompanyExplorer embedded onClose={close} />;
    else if (path.endsWith("/jobs")) body = <JobsChat embedded onClose={close} />;
    else if (path.endsWith("/materials")) body = <MaterialsChat embedded onClose={close} />;
    else if (path.endsWith("/basic-interview")) body = <BasicInterviewSession embedded onClose={close} focus={focus === "job" ? "job" : focus === "fit" ? "fit" : focus === "pressure" ? "pressure" : "self"} />;
    else if (path.endsWith("/interview")) body = <InterviewChat embedded onClose={close} section={section} />;
    return body ? <CareerChatModal onClose={close}>{body}</CareerChatModal> : null;
  };

  const currentWeek = WEEKS.find((w) => !isWeekComplete(w.week, data))?.week ?? 4;

  return (
    <>
      <div className="cl-board">
        {WEEKS.map((w) => {
          const done = isWeekComplete(w.week, data);
          const isCurrent = w.week === currentWeek && !done;
          const doneCount = weekDoneCount(w.steps, data);
          const total = w.steps.length;
          const pct = total ? Math.round((doneCount / total) * 100) : 0;
          const badge = done ? "done" : isCurrent ? "current" : "todo";
          return (
            <section key={w.week} className="cl-col" aria-label={t(`${w.week}주차`, `Week ${w.week}`, `第${w.week}周`, `Tuần ${w.week}`, `${w.week}週目`, `Minggu ${w.week}`)}>
              <div className="cl-col-head">
                <div className="top">
                  <span className="cl-eyebrow" style={{ color: "var(--cl-faint)" }}>Week {w.week}</span>
                  <span className={`cl-col-badge ${badge}`}>
                    {done ? t("완료", "Done", "完成", "Xong", "完了", "Selesai") : isCurrent ? t("진행 중", "In progress", "进行中", "Đang làm", "進行中", "Berjalan") : t("예정", "Upcoming", "待开始", "Sắp tới", "予定", "Akan datang")}
                  </span>
                </div>
                <h3>{weekText(w.week, "title")}</h3>
                <p className="sub">{weekText(w.week, "subtitle")}</p>
                <div className={`cl-col-prog ${done ? "done" : ""}`}>
                  <div className="n">{t(`${doneCount} / ${total} 완료`, `${doneCount} / ${total} done`, `${doneCount} / ${total} 完成`, `${doneCount} / ${total} xong`, `${doneCount} / ${total} 完了`, `${doneCount} / ${total} selesai`)}</div>
                  <div className="track"><div className="fill" style={{ width: `${pct}%` }} /></div>
                </div>
              </div>

              <WeekPacing week={w.week} />

              <div className="rounded-2xl bg-white p-5">
                <WeekStepper steps={w.steps} sequential={w.week !== 3 && w.week !== 4} onOpenChat={setChatHref} refreshKey={refreshKey} />
              </div>

              {w.week === 2 ? (
                <>
                  <ResumeScoreCard />
                  <CoverScoreCard />
                </>
              ) : null}
              {w.week === 3 ? <InterviewPrepChecklist /> : null}
              {w.week === 4 ? (
                <>
                  <PostingInterviewCard />
                  <Link href="/career-launch/corrections" className="group flex items-center justify-between gap-3 rounded-2xl bg-white p-4 transition">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-bold text-[#0B1227]">{t("면접 오답노트 복습", "Review interview notes", "复习面试错题本", "Ôn sổ lỗi phỏng vấn", "面接復習ノートを見直す", "Tinjau catatan wawancara")}</p>
                      <p className="mt-0.5 break-keep text-[12px] text-[#8B95A1]">{t("점수가 낮았던 문항을 다시 풀어봐요.", "Retry the questions you scored low on.", "重做低分题。", "Làm lại câu điểm thấp.", "点数の低かった問題を解き直します。", "Ulangi soal berskor rendah.")}</p>
                    </div>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EDF1FD] text-[#0B46E8]"><ArrowRight className="h-4 w-4" weight="bold" aria-hidden /></span>
                  </Link>
                </>
              ) : null}
            </section>
          );
        })}
      </div>
      {renderChatModal()}
    </>
  );
}
