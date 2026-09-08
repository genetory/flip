"use client";

// 4주 프로그램 — 주차 탭 전환. 상단 Week 1~4 탭(진행 표시) + 아래 선택 주차 미션만.
// 채팅형 미션은 그 자리 모달(기존 배선 재사용). 리포트 탭과 동일한 톤(cl-role-chip).
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Lock, ArrowRight, Compass, Sparkle, Target, BookOpen, Buildings, GlobeHemisphereEast, FileText, PencilSimpleLine, Microphone, Clock, WarningCircle } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { WEEKS } from "../../lib/launch/data";
import type { Step } from "../../lib/launch/data";
import { ResumeScoreCard } from "./ResumeScoreCard";
import { CoverScoreCard } from "./CoverScoreCard";
import { PostingInterviewCard } from "./PostingInterviewCard";
import { WeekAutoFeedback } from "./week-auto-feedback";
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

// 미션별 아이콘 — 카드가 획일화되지 않게 각 스텝에 어울리는 아이콘.
function iconFor(href?: string): Icon {
  const p = (href ?? "").split("?")[0];
  if (p.endsWith("/diagnosis")) return Compass;
  if (p.endsWith("/experience")) return Sparkle;
  if (p.endsWith("/jobs")) return Target;
  if (p.endsWith("/materials")) return BookOpen;
  if (p.endsWith("/company")) return Buildings;
  if (p.includes("/culture/")) return GlobeHemisphereEast;
  if (p.includes("/resume-collect")) return FileText;
  if (p.includes("/cover-collect")) return PencilSimpleLine;
  if (p.includes("/basic-interview") || p.endsWith("/interview")) return Microphone;
  if (p.includes("/week/")) return FileText;
  return Sparkle;
}

type LaunchT = ReturnType<typeof useLaunchT>;
// 완료 미션의 결과치 요약(저장된 progress 기준). 없으면 null.
function stepSummary(stepId: string, data: LaunchData, t: LaunchT): string | null {
  const p = data.progress as Record<string, unknown>;
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  switch (stepId) {
    case "w1s1": {
      const pct = (p.diagnosis as { percent?: number } | null | undefined)?.percent;
      return typeof pct === "number" ? t(`준비도 ${pct}%`, `Readiness ${pct}%`, `准备度 ${pct}%`, `Sẵn sàng ${pct}%`, `準備度 ${pct}%`, `Kesiapan ${pct}%`) : null;
    }
    case "w1exp": {
      const n = arr(p.experienceBank).length;
      return n ? t(`경험 ${n}개 정리`, `${n} experiences`, `整理经验 ${n} 个`, `${n} kinh nghiệm`, `経験 ${n}件`, `${n} pengalaman`) : null;
    }
    case "w1s2": {
      const j = arr(p.selectedJobs).filter((x): x is string => typeof x === "string" && x.trim().length > 0);
      return j.length ? `${j.slice(0, 2).join(", ")}${j.length > 2 ? t(` 외 ${j.length - 2}`, ` +${j.length - 2}`, ` 等${j.length - 2}`, ` +${j.length - 2}`, ` 他${j.length - 2}`, ` +${j.length - 2}`) : ""}` : null;
    }
    case "w1story": {
      const n = ((p.storyBank as { data?: { stories?: unknown[] } } | null | undefined)?.data?.stories ?? []).length;
      return n ? t(`강점 스토리 ${n}개`, `${n} stories`, `优势故事 ${n} 个`, `${n} câu chuyện`, `強みストーリー ${n}件`, `${n} cerita`) : null;
    }
    case "w1company": {
      const n = arr(p.targetCompanies).length;
      return n ? t(`목표 기업 ${n}곳`, `${n} companies`, `目标企业 ${n} 家`, `${n} công ty`, `目標企業 ${n}社`, `${n} perusahaan`) : null;
    }
    default:
      return null;
  }
}

export function WeekTabs({ initialWeek }: { initialWeek?: number }) {
  const t = useLaunchT();
  const weekText = useWeekText();
  const [refreshKey, setRefreshKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<LaunchData>({ progress: {}, resume: {}, cover: {} });
  useEffect(() => {
    let alive = true;
    void (async () => {
      const [p, r, c] = await Promise.all([
        fetchProgress().catch(() => ({}) as LaunchData["progress"]),
        fetchResumeData().catch(() => ({ data: {} })),
        fetchCoverData().catch(() => ({ data: {} }))
      ]);
      if (alive) { setData({ progress: p, resume: r.data ?? {}, cover: c.data ?? {} }); setLoaded(true); }
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
  const [selected, setSelected] = useState<number | null>(initialWeek && initialWeek >= 1 && initialWeek <= 4 ? initialWeek : null);
  const selWeek = selected ?? currentWeek;
  const sel = WEEKS.find((w) => w.week === selWeek)!;

  // 선택 주차를 URL(?week=N)에 반영 → 페이지 이동(예: 문화 학습) 후 뒤로가기해도 그 탭이 복원.
  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    const u = new URL(window.location.href);
    if (u.searchParams.get("week") !== String(selWeek)) {
      u.searchParams.set("week", String(selWeek));
      window.history.replaceState(window.history.state, "", u.toString());
    }
  }, [selWeek, loaded]);

  const openMission = (step: Step) => { const h = step.action?.href; if (h && isChatHref(h)) setChatHref(h); };
  const missionCard = (step: Step, weekN: number, seq: boolean) => {
    const done = isStepDone(step.id, data);
    const reachable = weekN === 1 || isWeekComplete(weekN - 1, data);
    const current = step.id === currentStepId;
    const locked = !reachable || (seq && !done && !current);
    const href = step.action?.href;
    const cls = `cl-jcard ${done ? "done" : current ? "current" : locked ? "locked" : ""}`;
    const summary = done ? stepSummary(step.id, data, t) : null;
    const MIcon = locked ? Lock : iconFor(href);
    const body = done ? (
      <>
        <div className="ttl">{step.title}</div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] font-bold" style={{ color: "var(--cl-mint)" }}>
            <Check className="h-3.5 w-3.5 shrink-0" weight="bold" aria-hidden /> <span className="truncate">{summary ?? t("완료", "Done", "完成", "Xong", "完了", "Selesai")}</span>
          </span>
          {href ? <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-bold" style={{ color: "var(--cl-faint)" }}>{t("자세히", "Details", "详情", "Chi tiết", "詳細", "Detail")} <ArrowRight className="h-3.5 w-3.5" weight="bold" /></span> : null}
        </div>
      </>
    ) : (
      <>
        <div className="ttl">{step.title}</div>
        {step.desc ? <div className="desc">{step.desc}</div> : null}
        {step.minutes || current ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {step.minutes ? <span className="cl-jmin"><Clock className="h-3 w-3" weight="bold" aria-hidden /> ~{step.minutes}{t("분", "m", "分", "p", "分", "m")}</span> : null}
            {current ? <span className="go">{step.action?.label ?? t("지금 하기", "Do it now", "现在开始", "Làm ngay", "今すぐ", "Lakukan")} <ArrowRight className="h-3.5 w-3.5" weight="bold" /></span> : null}
          </div>
        ) : null}
      </>
    );
    const inner = (
      <div className="flex items-start gap-3">
        <span className="cl-jicon"><MIcon className="h-5 w-5" weight={locked ? "fill" : "duotone"} aria-hidden /></span>
        <div className="min-w-0 flex-1">{body}</div>
      </div>
    );
    // 잠금/링크 없음만 비활성. 완료 항목은 클릭 시 그 화면(디테일)이 열려 결과를 보고 수정할 수 있다.
    if (locked || !href) return <div key={step.id} className={cls} style={{ cursor: "default" }}>{inner}</div>;
    if (isChatHref(href)) return <button key={step.id} type="button" className={cls} onClick={() => openMission(step)}>{inner}</button>;
    return <Link key={step.id} href={href} className={cls}>{inner}</Link>;
  };

  const selDone = isWeekComplete(selWeek, data);
  const selDc = weekDoneCount(sel.steps, data);
  const seq = selWeek !== 3 && selWeek !== 4;

  // 로드 전엔 스켈레톤 — 빈 데이터로 렌더돼 현재 주차 탭이 점프하며 깜빡이던 문제 방지.
  if (!loaded) {
    return (
      <>
        <div className="cl-role-tabs">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className="cl-role-chip" style={{ opacity: 0.5 }}>{t(`${i}주차`, `Week ${i}`, `第${i}周`, `Tuần ${i}`, `${i}週目`, `Minggu ${i}`)}</span>
          ))}
        </div>
        <div className="mt-6 h-44 rounded-2xl bg-white" style={{ boxShadow: "var(--cl-shadow-sm)" }} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-white" style={{ boxShadow: "var(--cl-shadow-sm)" }} />)}
        </div>
      </>
    );
  }

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
            <button key={w.week} type="button" onClick={() => setSelected(w.week)} className={`cl-role-chip ${active ? "on" : ""}`}>
              {done ? <Check className="h-3.5 w-3.5" weight="bold" /> : locked ? <Lock className="h-3 w-3" weight="fill" /> : isCur ? <WarningCircle className="h-4 w-4" weight="fill" /> : null}
              {t(`${w.week}주차`, `Week ${w.week}`, `第${w.week}周`, `Tuần ${w.week}`, `${w.week}週目`, `Minggu ${w.week}`)}
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
      {selWeek === 1 ? (
        <div className="mt-8">
          <h2 className="cl-headline">{t("이번 주 피드백", "This week's feedback", "本周反馈", "Phản hồi tuần này", "今週のフィードバック", "Umpan balik minggu ini")}</h2>
          <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: "var(--cl-muted)" }}>{t("이번 주 결과물을 코치가 검토해 피드백을 드려요.", "Your coach reviews this week's work and gives feedback.", "教练审阅本周成果并给出反馈。", "Huấn luyện viên xem kết quả tuần này và đưa phản hồi.", "コーチが今週の成果を確認してフィードバックします。", "Pelatih meninjau hasil minggu ini dan memberi umpan balik.")}</p>
          <div className="mt-3"><WeekAutoFeedback week={1} showNext={false} /></div>
        </div>
      ) : null}
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
