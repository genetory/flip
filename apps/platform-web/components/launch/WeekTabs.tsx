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
  const r = (data.resume ?? {}) as { basic?: Record<string, unknown>; educations?: unknown[]; experiences?: { kind?: string }[]; skills?: unknown[]; languages?: { language?: string }[] };
  const c = (data.cover ?? {}) as { company?: string | null; items?: { answer?: string }[] };
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  // 이름 리스트를 "A, B 외 N" 형태로.
  const listSummary = (names: string[]) =>
    names.length ? `${names.slice(0, 2).join(", ")}${names.length > 2 ? t(` 외 ${names.length - 2}`, ` +${names.length - 2}`, ` 等${names.length - 2}`, ` +${names.length - 2}`, ` 他${names.length - 2}`, ` +${names.length - 2}`) : ""}` : null;
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
    case "w2-basic": {
      const b = (r.basic ?? {}) as Record<string, unknown>;
      const name = typeof b.name === "string" ? b.name.trim() : "";
      const filled = ["name", "email", "phone", "summary"].filter((k) => typeof b[k] === "string" && (b[k] as string).trim()).length;
      if (name) return t(`${name} · 기본정보 작성`, `${name} · basics`, `${name} · 基本信息`, `${name} · thông tin cơ bản`, `${name} · 基本情報`, `${name} · info dasar`);
      return filled ? t(`기본정보 ${filled}개 작성`, `${filled} basic fields`, `基本信息 ${filled} 项`, `${filled} mục cơ bản`, `基本情報 ${filled}項目`, `${filled} info dasar`) : null;
    }
    case "w2-edu": {
      const n = (r.educations ?? []).length;
      return n ? t(`학력 ${n}건`, `${n} schools`, `学历 ${n} 项`, `${n} học vấn`, `学歴 ${n}件`, `${n} pendidikan`) : null;
    }
    case "w2-exp": {
      const n = (r.experiences ?? []).filter((e) => (e.kind ?? "work") === "work").length;
      return n ? t(`경력 ${n}건`, `${n} work items`, `工作经历 ${n} 项`, `${n} kinh nghiệm`, `職歴 ${n}件`, `${n} pengalaman`) : null;
    }
    case "w2-exp-other": {
      const n = (r.experiences ?? []).filter((e) => e.kind === "other").length;
      return n ? t(`활동·프로젝트 ${n}개`, `${n} activities`, `活动·项目 ${n} 个`, `${n} hoạt động`, `活動・プロジェクト ${n}件`, `${n} aktivitas`) : null;
    }
    case "w2-skill": {
      const sk = (r.skills ?? []).filter((x): x is string => typeof x === "string" && x.trim().length > 0);
      return listSummary(sk);
    }
    case "w2-lang": {
      const names = (r.languages ?? []).map((l) => (l.language ?? "").trim()).filter(Boolean);
      return listSummary(names);
    }
    case "w3-cover": {
      const items = c.items ?? [];
      const answered = items.filter((x) => (x.answer ?? "").trim().length > 0).length;
      if (!answered) return null;
      const company = typeof c.company === "string" ? c.company.trim() : "";
      const secs = t(`${answered}문항 작성`, `${answered} sections`, `${answered} 个文项`, `${answered} mục`, `${answered}項目`, `${answered} bagian`);
      return company ? `${company} · ${secs}` : secs;
    }
    case "w4-self":
    case "w4-job":
    case "w4-fit":
    case "w4-pressure": {
      const focus = stepId.replace("w4-", "") as "self" | "job" | "fit" | "pressure";
      const logs = (Array.isArray(p.basicInterviews) ? p.basicInterviews : []) as { focus?: string; items?: { score?: number }[] }[];
      const log = logs.find((l) => l.focus === focus);
      const items = log?.items ?? [];
      if (!items.length) return null;
      const avg = Math.round(items.reduce((s, it) => s + (typeof it.score === "number" ? it.score : 0), 0) / items.length);
      return t(`평균 ${avg}점 · ${items.length}문항`, `Avg ${avg} · ${items.length} Qs`, `平均 ${avg}分 · ${items.length} 题`, `TB ${avg} · ${items.length} câu`, `平均 ${avg}点 · ${items.length}問`, `Rata ${avg} · ${items.length} soal`);
    }
    default:
      return null;
  }
}

// 면접 스텝의 결과(평균 점수·문항 수·강점·보완) — 카드에 배지+피드백으로 노출.
type IvResult = { avg: number; count: number; strengths: string[]; improvements: string[] };
function interviewResult(stepId: string, data: LaunchData): IvResult | null {
  const focus = stepId.replace("w4-", "");
  const logs = (Array.isArray((data.progress as Record<string, unknown>).basicInterviews) ? (data.progress as Record<string, unknown>).basicInterviews : []) as { focus?: string; items?: { score?: number; strengths?: string[]; improvements?: string[]; feedback?: string }[] }[];
  const items = logs.find((l) => l.focus === focus)?.items ?? [];
  if (!items.length) return null;
  const avg = Math.round(items.reduce((s, it) => s + (typeof it.score === "number" ? it.score : 0), 0) / items.length);
  const dedup = (arr: string[]) => Array.from(new Set(arr.map((s) => (s ?? "").trim()).filter(Boolean)));
  const strengths = dedup(items.flatMap((it) => it.strengths ?? [])).slice(0, 3);
  let improvements = dedup(items.flatMap((it) => it.improvements ?? [])).slice(0, 3);
  if (!strengths.length && !improvements.length) improvements = dedup(items.map((it) => it.feedback ?? "")).slice(0, 2);
  return { avg, count: items.length, strengths, improvements };
}
function scoreVar(s: number): string {
  return s >= 75 ? "var(--cl-mint)" : s >= 50 ? "var(--cl-accent)" : "#C77700";
}
const isInterviewHref = (href?: string) => (href ?? "").split("?")[0].endsWith("/basic-interview");

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

  // 면접 아이템 — 결과(점수·문항)와 피드백(강점·보완)을 카드 안에 함께 표시. 연습할 때마다 갱신.
  const interviewCard = (step: Step) => {
    const done = isStepDone(step.id, data);
    const reachable = isWeekComplete(2, data);
    const locked = !reachable && !done;
    const href = step.action?.href;
    const res = done ? interviewResult(step.id, data) : null;
    const MIcon = locked ? Lock : iconFor(href);
    const open = () => { if (href && isChatHref(href)) setChatHref(href); };
    return (
      <div key={step.id} className={`cl-jcard ${done ? "done" : locked ? "locked" : ""}`} style={{ cursor: "default" }}>
        <div className="flex items-start gap-3">
          <span className="cl-jicon"><MIcon className="h-5 w-5" weight={locked ? "fill" : "duotone"} aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="ttl">{step.title}</div>
              {res ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ color: "var(--cl-muted)", background: "var(--cl-card-2)" }}>{t(`${res.count}문항`, `${res.count} Qs`, `${res.count}题`, `${res.count} câu`, `${res.count}問`, `${res.count} soal`)}</span>
                  <span className="inline-flex items-baseline gap-1 rounded-full px-2 py-0.5 text-[12px] font-black tabular-nums" style={{ color: scoreVar(res.avg), background: "var(--cl-card-2)" }}><span className="text-[10px] font-bold" style={{ color: "var(--cl-faint)" }}>{t("평균 점수", "Avg", "平均分", "TB", "平均点", "Rata")}</span>{res.avg}<span className="text-[9px] font-bold" style={{ color: "var(--cl-faint)" }}>점</span></span>
                </div>
              ) : null}
            </div>
            {locked ? (
              <div className="desc">{t("이전 주차를 마치면 열려요.", "Unlocks when you finish the previous week.", "完成上一周后解锁。", "Mở khi bạn hoàn thành tuần trước.", "前の週を終えると開きます。", "Terbuka setelah menyelesaikan minggu sebelumnya.")}</div>
            ) : !done ? (
              step.desc ? <div className="desc">{step.desc}</div> : null
            ) : null}
            {res && (res.strengths.length > 0 || res.improvements.length > 0) ? (
              <div className="mt-3 flex flex-col gap-2">
                {res.strengths.length ? (
                  <div className="rounded-2xl bg-[var(--cl-card-2)] p-3.5">
                    <p className="flex items-center gap-1.5 text-[12px] font-bold" style={{ color: "var(--cl-mint)" }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--cl-mint)" }} aria-hidden />{t("잘한 점", "Strengths", "做得好", "Điểm mạnh", "良い点", "Kelebihan")}</p>
                    <ul className="mt-1.5 space-y-1">{res.strengths.map((it, i) => <li key={i} className="break-keep text-[12.5px] leading-relaxed" style={{ color: "var(--cl-ink)" }}>· {it}</li>)}</ul>
                  </div>
                ) : null}
                {res.improvements.length ? (
                  <div className="rounded-2xl bg-[var(--cl-card-2)] p-3.5">
                    <p className="flex items-center gap-1.5 text-[12px] font-bold" style={{ color: "var(--cl-accent)" }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--cl-accent)" }} aria-hidden />{t("보완할 점", "Improve these", "需改进", "Cần cải thiện", "改善点", "Perbaiki")}</p>
                    <ul className="mt-1.5 space-y-1">{res.improvements.map((it, i) => <li key={i} className="break-keep text-[12.5px] leading-relaxed" style={{ color: "var(--cl-ink)" }}>· {it}</li>)}</ul>
                  </div>
                ) : null}
              </div>
            ) : null}
            {!locked ? (
              <button type="button" onClick={open} className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-bold text-white transition hover:opacity-90" style={{ background: "var(--cl-accent)" }}>
                {done ? t("다시 면접 보기", "Retake interview", "再次面试", "Phỏng vấn lại", "もう一度面接", "Ulangi wawancara") : t("면접 보기", "Start interview", "开始面试", "Bắt đầu phỏng vấn", "面接を始める", "Mulai wawancara")} <ArrowRight className="h-3.5 w-3.5" weight="bold" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
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

      {/* 미션 — 스텝은 2열 그리드. 3주차 면접은 결과·피드백을 담은 전체 폭 카드. */}
      {selWeek === 3 ? (
        <div className="mt-4 flex flex-col gap-3">
          {sel.steps.map((s) => (isInterviewHref(s.action?.href) ? interviewCard(s) : missionCard(s, selWeek, seq)))}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {sel.steps.map((s) => missionCard(s, selWeek, seq))}
        </div>
      )}
      {selWeek === 1 ? (
        <div className="mt-8">
          <h2 className="cl-headline">{t("이번 주 피드백", "This week's feedback", "本周反馈", "Phản hồi tuần này", "今週のフィードバック", "Umpan balik minggu ini")}</h2>
          <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: "var(--cl-muted)" }}>{t("이번 주 결과물을 코치가 검토해 피드백을 드려요.", "Your coach reviews this week's work and gives feedback.", "教练审阅本周成果并给出反馈。", "Huấn luyện viên xem kết quả tuần này và đưa phản hồi.", "コーチが今週の成果を確認してフィードバックします。", "Pelatih meninjau hasil minggu ini dan memberi umpan balik.")}</p>
          <div className="mt-3"><WeekAutoFeedback week={1} showNext={false} /></div>
        </div>
      ) : null}
      {selWeek === 2 ? (
        <>
          <div className="mt-8">
            <h2 className="cl-headline">{t("이력서 피드백", "Resume feedback", "简历反馈", "Phản hồi hồ sơ", "履歴書フィードバック", "Umpan balik resume")}</h2>
            <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: "var(--cl-muted)" }}>{t("대화로 만든 이력서를 코치가 검토해 피드백을 드려요.", "Your coach reviews the resume you built and gives feedback.", "教练审阅你完成的简历并给出反馈。", "Huấn luyện viên xem hồ sơ bạn tạo và đưa phản hồi.", "対話で作った履歴書をコーチが確認してフィードバックします。", "Pelatih meninjau resume yang kamu buat dan memberi umpan balik.")}</p>
            <div className="mt-3 flex flex-col gap-3">
              <ResumeScoreCard />
              <WeekAutoFeedback week={2} showNext={false} />
            </div>
          </div>
          <div className="mt-8">
            <h2 className="cl-headline">{t("자기소개서 피드백", "Cover letter feedback", "自我介绍反馈", "Phản hồi thư giới thiệu", "自己紹介書フィードバック", "Umpan balik surat lamaran")}</h2>
            <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: "var(--cl-muted)" }}>{t("대화로 만든 자기소개서를 코치가 검토해 피드백을 드려요.", "Your coach reviews the cover letter you built and gives feedback.", "教练审阅你完成的自我介绍并给出反馈。", "Huấn luyện viên xem thư giới thiệu bạn tạo và đưa phản hồi.", "対話で作った自己紹介書をコーチが確認してフィードバックします。", "Pelatih meninjau surat lamaran yang kamu buat dan memberi umpan balik.")}</p>
            <div className="mt-3 flex flex-col gap-3">
              <CoverScoreCard />
              <WeekAutoFeedback week={3} showNext={false} />
            </div>
          </div>
        </>
      ) : null}
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
