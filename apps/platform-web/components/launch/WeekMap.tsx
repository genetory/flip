"use client";

// 4주 프로그램 게임 월드맵 — SVG 구불구불 길 + 스테이지 노드(4주 + 취업).
// 현재 위치 비행기 글로우. 스테이지 탭 → 아래 시트에 그 주차 미션(그 자리 모달로).
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Lock, ArrowRight, Star, Airplane } from "@phosphor-icons/react";
import { WEEKS } from "../../lib/launch/data";
import type { Step } from "../../lib/launch/data";
import { ResumeScoreCard } from "./ResumeScoreCard";
import { CoverScoreCard } from "./CoverScoreCard";
import { PostingInterviewCard } from "./PostingInterviewCard";
import { fetchProgress } from "../../lib/launch/progress-client";
import { fetchResumeData } from "../../lib/launch/resume-data";
import { fetchCoverData } from "../../lib/launch/cover-data";
import { isStepDone, isWeekComplete, weekDoneCount, type LaunchData } from "../../lib/launch/step-status";
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

const TOP = 50;
const GAP = 128;
const XS = [18, 82, 18, 82, 50]; // 지그재그 x(%) — 4주 + 취업
const STOP_COUNT = 5;
const MAP_H = TOP + (STOP_COUNT - 1) * GAP + 50;

export function WeekMap() {
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

  // 지금 할 미션 + 현재 주차.
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

  // 스톱 상태.
  const stopState = (i: number): "done" | "current" | "locked" | "todo" | "dest" | "dest-done" => {
    if (i === 4) return isWeekComplete(4, data) ? "dest-done" : "dest";
    const w = WEEKS[i];
    const reachable = w.week === 1 || isWeekComplete(w.week - 1, data);
    if (isWeekComplete(w.week, data)) return "done";
    if (w.week === currentWeek) return "current";
    return reachable ? "todo" : "locked";
  };

  // 길 세그먼트(스톱 i → i+1) — done 이면 accent, 아니면 옅게.
  const segPath = (i: number) => {
    const x0 = XS[i], y0 = TOP + i * GAP, x1 = XS[i + 1], y1 = TOP + (i + 1) * GAP;
    return `M ${x0} ${y0} C ${x0} ${y0 + GAP / 2}, ${x1} ${y1 - GAP / 2}, ${x1} ${y1}`;
  };
  const segDone = (i: number) => (i < 4 ? isWeekComplete(WEEKS[i].week, data) : isWeekComplete(4, data));

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
      <div className="cl-map" style={{ height: MAP_H }}>
        <svg viewBox={`0 0 100 ${MAP_H}`} preserveAspectRatio="none" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={segPath(i)}
              fill="none"
              stroke={segDone(i) ? "var(--cl-accent)" : "var(--cl-line-strong)"}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={segDone(i) ? undefined : "1 9"}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {[0, 1, 2, 3, 4].map((i) => {
          const st = stopState(i);
          const isDest = i === 4;
          const w = isDest ? null : WEEKS[i];
          const reachable = isDest ? isWeekComplete(4, data) : (w!.week === 1 || isWeekComplete(w!.week - 1, data));
          const nodeCls = `cl-mapnode ${isDest ? "dest" : ""} ${st === "done" || st === "dest-done" ? "done" : ""} ${st === "current" ? "current" : ""} ${st === "locked" ? "locked" : ""} ${!isDest && selWeek === w!.week ? "selected" : ""}`;
          const label = isDest ? t("취업 🎉", "Hired 🎉", "就业 🎉", "Trúng tuyển 🎉", "内定 🎉", "Kerja 🎉") : weekText(w!.week, "title");
          return (
            <button
              key={i}
              type="button"
              className={nodeCls}
              style={{ left: `${XS[i]}%`, top: `${TOP + i * GAP}px` }}
              disabled={isDest || !reachable}
              onClick={() => { if (!isDest && reachable) setSelected(w!.week); }}
              aria-label={isDest ? "취업" : `Week ${w!.week}`}
            >
              <span className="cl-mapdot">
                {isDest ? <Star className="h-5 w-5" weight="fill" /> : st === "done" ? <Check className="h-5 w-5" weight="bold" /> : st === "locked" ? <Lock className="h-4 w-4" weight="fill" /> : w!.week}
                {st === "current" ? <Airplane className="cl-mapplane h-6 w-6" weight="fill" aria-hidden /> : null}
              </span>
              <span className="cl-maplbl">{label}</span>
            </button>
          );
        })}
      </div>

      {/* 선택 주차 미션 시트 */}
      <div className="cl-mapsheet">
        <div className="cl-mapsheet-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="thumb" src={WEEK_IMAGE[selWeek]} alt="" loading="lazy" />
          <div className="min-w-0">
            <span className="cl-eyebrow" style={{ color: "var(--cl-faint)" }}>Week {selWeek} · {selDone ? t("완료", "Done", "完成", "Xong", "完了", "Selesai") : t(`${selDc} / ${sel.steps.length} 완료`, `${selDc} / ${sel.steps.length} done`, `${selDc} / ${sel.steps.length} 完成`, `${selDc} / ${sel.steps.length} xong`, `${selDc} / ${sel.steps.length} 完了`, `${selDc} / ${sel.steps.length} selesai`)}</span>
            <h3>{weekText(selWeek, "title")}</h3>
          </div>
        </div>

        {sel.steps.map((s) => missionCard(s, selWeek, seq))}

        {selWeek === 2 ? <div className="flex flex-col gap-3"><ResumeScoreCard /><CoverScoreCard /></div> : null}
        {selWeek === 4 ? (
          <>
            <PostingInterviewCard />
            <Link href="/career-launch/corrections" className="cl-jcard">
              <div className="ttl">{t("면접 오답노트 복습", "Review interview notes", "复习面试错题本", "Ôn sổ lỗi phỏng vấn", "面接復習ノート", "Tinjau catatan")}</div>
              <div className="desc">{t("점수가 낮았던 문항을 다시 풀어봐요.", "Retry the questions you scored low on.", "重做低分题。", "Làm lại câu điểm thấp.", "点数の低かった問題を解き直します。", "Ulangi soal berskor rendah.")}</div>
            </Link>
          </>
        ) : null}
      </div>
      {renderChatModal()}
    </>
  );
}
