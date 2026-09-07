"use client";

// 4주 프로그램 — 주차 탭 전환. 상단 Week 1~4 탭(진행 표시) + 아래 선택 주차 미션만.
// 채팅형 미션은 그 자리 모달(기존 배선 재사용). 리포트 탭과 동일한 톤(cl-role-chip).
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Lock, ArrowRight } from "@phosphor-icons/react";
import { WEEKS } from "../../lib/launch/data";
import type { Step } from "../../lib/launch/data";
import { ResumeScoreCard } from "./ResumeScoreCard";
import { CoverScoreCard } from "./CoverScoreCard";
import { PostingInterviewCard } from "./PostingInterviewCard";
import { fetchProgress } from "../../lib/launch/progress-client";
import { fetchResumeData } from "../../lib/launch/resume-data";
import { fetchCoverData } from "../../lib/launch/cover-data";
import { isStepDone, isWeekComplete, weekDoneCount, type LaunchData } from "../../lib/launch/step-status";
import { WeekHero, type WeekFrameStatus } from "./week/week-frame";
import { WEEK_CONFIG } from "../../lib/launch/week-config";
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

const WEEK_IMAGE: Record<number, string> = { 1: "/img_ai_analyze.webp", 2: "/img_resume.webp", 3: "/img_fake_interview.webp", 4: "/img_fake_interview.webp" };
const CHAT_ENDS = ["/diagnosis", "/experience", "/story", "/company", "/jobs", "/materials", "/basic-interview", "/interview"];
const isChatHref = (href: string) => { const p = href.split("?")[0]; return CHAT_ENDS.some((s) => p.endsWith(s)); };

export function WeekTabs() {
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

  const [chatHref, setChatHref] = useState<string | null>(null);
  const renderChatModal = () => {
    if (!chatHref) return null;
    const path = chatHref.split("?")[0];
    const query = chatHref.includes("?") ? new URLSearchParams(chatHref.split("?")[1]) : new URLSearchParams();
    const section = query.get("section") ?? undefined;
    const focus = query.get("focus") ?? undefined;
    const close = () => { setChatHref(null); setRefreshKey((k) => k + 1); };
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

  let currentStepId = "";
  for (const w of WEEKS) {
    const reachable = w.week === 1 || isWeekComplete(w.week - 1, data);
    if (!reachable) continue;
    const first = w.steps.find((s) => !isStepDone(s.id, data));
    if (first) { currentStepId = first.id; break; }
  }
  const currentWeek = WEEKS.find((w) => w.steps.some((s) => s.id === currentStepId))?.week ?? 4;
  const [selected, setSelected] = useState<number | null>(null);
  const selWeek = selected ?? currentWeek;
  const sel = WEEKS.find((w) => w.week === selWeek)!;

  const openMission = (step: Step) => { const h = step.action?.href; if (h && isChatHref(h)) setChatHref(h); };
  const missionCard = (step: Step, weekN: number, seq: boolean) => {
    const done = isStepDone(step.id, data);
    const reachable = weekN === 1 || isWeekComplete(weekN - 1, data);
    const current = step.id === currentStepId;
    const locked = !reachable || (seq && !done && !current);
    const href = step.action?.href;
    const cls = `cl-jcard ${done ? "done" : current ? "current" : locked ? "locked" : ""}`;
    const inner = (
      <>
        <div className="ttl">{step.title}</div>
        {step.desc ? <div className="desc">{step.desc}</div> : null}
        {current ? <div className="go">{step.action?.label ?? t("지금 하기", "Do it now", "现在开始", "Làm ngay", "今すぐ", "Lakukan")} <ArrowRight className="h-3.5 w-3.5" weight="bold" /></div> : null}
      </>
    );
    if (done || locked || !href) return <div key={step.id} className={cls} style={{ cursor: "default" }}>{inner}</div>;
    if (isChatHref(href)) return <button key={step.id} type="button" className={cls} onClick={() => openMission(step)}>{inner}</button>;
    return <Link key={step.id} href={href} className={cls}>{inner}</Link>;
  };

  const selDone = isWeekComplete(selWeek, data);
  const selDc = weekDoneCount(sel.steps, data);
  const seq = selWeek !== 3 && selWeek !== 4;

  return (
    <>
      {/* 주차 탭 */}
      <div className="cl-role-tabs" style={{ overflowX: "auto", paddingBottom: 2 }}>
        {WEEKS.map((w) => {
          const done = isWeekComplete(w.week, data);
          const reachable = w.week === 1 || isWeekComplete(w.week - 1, data);
          const locked = !reachable && !done;
          const active = selWeek === w.week;
          const isCur = w.week === currentWeek && !done;
          return (
            <button key={w.week} type="button" onClick={() => setSelected(w.week)} className={`cl-role-chip ${active ? "on" : ""}`} style={{ position: "relative" }}>
              {done ? <Check className="h-3.5 w-3.5" weight="bold" /> : locked ? <Lock className="h-3 w-3" weight="fill" /> : null}
              {t(`${w.week}주차`, `Week ${w.week}`, `第${w.week}周`, `Tuần ${w.week}`, `${w.week}週目`, `Minggu ${w.week}`)}
              {isCur && !active ? <span style={{ position: "absolute", top: 4, right: 6, width: 6, height: 6, borderRadius: 999, background: "var(--cl-accent)" }} /> : null}
            </button>
          );
        })}
      </div>

      {/* 선택 주차 히어로 — 일러스트 + 핵심 질문 + 결과물 + 진행 */}
      {(() => {
        const cfg = WEEK_CONFIG[selWeek];
        const reachable = selWeek === 1 || isWeekComplete(selWeek - 1, data);
        const status: WeekFrameStatus = selDone ? "completed" : selDc > 0 ? "in_progress" : reachable ? "available" : "locked";
        return (
          <div className="mt-6">
            <WeekHero
              week={selWeek}
              title={weekText(selWeek, "title")}
              subtitle={weekText(selWeek, "subtitle")}
              question={cfg?.question ?? weekText(selWeek, "goal")}
              status={status}
              doneCount={selDc}
              totalCount={sel.steps.length}
              resultLabels={cfg?.resultLabels ?? []}
              ctaLabel=""
              image={WEEK_IMAGE[selWeek]}
            />
          </div>
        );
      })()}

      {/* 미션 — 스텝은 2열 그리드, 넓은 컴포넌트(점수·모의면접)는 전체 폭 */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {sel.steps.map((s) => missionCard(s, selWeek, seq))}
      </div>
      {selWeek === 2 ? <div className="mt-3 flex flex-col gap-3"><ResumeScoreCard /><CoverScoreCard /></div> : null}
      {selWeek === 4 ? (
        <div className="mt-3 flex flex-col gap-3">
          <PostingInterviewCard />
          <Link href="/career-launch/corrections" className="cl-jcard">
            <div className="ttl">{t("면접 오답노트 복습", "Review interview notes", "复习面试错题本", "Ôn sổ lỗi phỏng vấn", "面接復習ノート", "Tinjau catatan")}</div>
            <div className="desc">{t("점수가 낮았던 문항을 다시 풀어봐요.", "Retry the questions you scored low on.", "重做低分题。", "Làm lại câu điểm thấp.", "点数の低かった問題を解き直します。", "Ulangi soal berskor rendah.")}</div>
          </Link>
        </div>
      ) : null}
      {renderChatModal()}
    </>
  );
}
