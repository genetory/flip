"use client";

// 4주 프로그램 세로 여정 경로 — 모든 미션을 위→아래 하나의 길 위에 순서대로.
// 완료=체크, 지금 할 것=강조+펄스, 다음=잠금. 채팅형 미션은 그 자리 모달로.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Lock, ArrowRight, Star, CaretDown } from "@phosphor-icons/react";
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
const isChatHref = (href: string) => {
  const path = href.split("?")[0];
  return CHAT_ENDS.some((s) => path.endsWith(s));
};

function Row({ node, children }: { node: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="cl-jrow">
      <div className="cl-jrail">{node}</div>
      <div>{children}</div>
    </div>
  );
}

export function WeekJourney() {
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

  // 지금 할 미션 하나 — 도달 가능한 첫 주차의 첫 미완료 스텝.
  let currentStepId = "";
  for (const w of WEEKS) {
    const reachable = w.week === 1 || isWeekComplete(w.week - 1, data);
    if (!reachable) continue;
    const first = w.steps.find((s) => !isStepDone(s.id, data));
    if (first) { currentStepId = first.id; break; }
  }
  const currentWeek = WEEKS.find((w) => w.steps.some((s) => s.id === currentStepId))?.week ?? 4;
  // 지금 주차만 펼침(나머지는 접힌 정거장). 사용자가 직접 펼치면 그 값을 따른다.
  const [open, setOpen] = useState<number | null>(null);
  const activeOpen = open ?? currentWeek;

  const openMission = (step: Step) => {
    const href = step.action?.href;
    if (!href) return;
    if (isChatHref(href)) setChatHref(href);
  };

  const missionCard = (step: Step, weekN: number, seq: boolean) => {
    const done = isStepDone(step.id, data);
    const reachable = weekN === 1 || isWeekComplete(weekN - 1, data);
    const current = step.id === currentStepId;
    const locked = !reachable || (seq && !done && !current);
    const href = step.action?.href;
    const cls = `cl-jcard ${done ? "done" : current ? "current" : locked ? "locked" : ""}`;
    const node = (
      <span className={`cl-jnode ${done ? "done" : current ? "current" : ""}`}>
        {done ? <Check className="h-3.5 w-3.5" weight="bold" /> : locked ? <Lock className="h-3 w-3" weight="fill" /> : null}
      </span>
    );
    const inner = (
      <>
        <div className="ttl">{step.title}</div>
        {step.desc ? <div className="desc">{step.desc}</div> : null}
        {current ? <div className="go">{step.action?.label ?? t("지금 하기", "Do it now", "现在开始", "Làm ngay", "今すぐ", "Lakukan")} <ArrowRight className="h-3.5 w-3.5" weight="bold" /></div> : null}
      </>
    );
    if (done || locked || !href) {
      return <Row key={step.id} node={node}><div className={cls} style={{ cursor: "default" }}>{inner}</div></Row>;
    }
    if (isChatHref(href)) {
      return <Row key={step.id} node={node}><button type="button" className={cls} onClick={() => openMission(step)}>{inner}</button></Row>;
    }
    return <Row key={step.id} node={node}><Link href={href} className={cls}>{inner}</Link></Row>;
  };

  return (
    <>
      <div className="cl-journey">
        {WEEKS.map((w) => {
          const done = isWeekComplete(w.week, data);
          const reachable = w.week === 1 || isWeekComplete(w.week - 1, data);
          const hasCurrent = w.steps.some((s) => s.id === currentStepId);
          const stationState = done ? "done" : hasCurrent ? "current" : "todo";
          const seq = w.week !== 3 && w.week !== 4;
          const dc = weekDoneCount(w.steps, data);
          const isOpen = activeOpen === w.week;
          const toggle = () => { if (reachable) setOpen(isOpen ? -1 : w.week); };
          return (
            <div key={w.week}>
              <Row node={<span className={`cl-jnode station ${stationState}`}>{done ? <Check className="h-4 w-4" weight="bold" /> : w.week}</span>}>
                <div className={`cl-jstation ${isOpen ? "open" : ""} ${!reachable ? "locked" : ""}`} onClick={toggle} role="button" tabIndex={reachable ? 0 : -1} onKeyDown={(e) => { if (reachable && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(); } }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="thumb" src={WEEK_IMAGE[w.week]} alt="" loading="lazy" />
                  <div className="body">
                    <span className="cl-eyebrow" style={{ color: "var(--cl-faint)" }}>Week {w.week}</span>
                    <h3>{weekText(w.week, "title")}</h3>
                    <div className="meta">
                      <span className={`cl-jbadge ${stationState}`}>{done ? t("완료", "Done", "完成", "Xong", "完了", "Selesai") : hasCurrent ? t("진행 중", "In progress", "进行中", "Đang làm", "進行中", "Berjalan") : reachable ? t("시작 가능", "Ready", "可开始", "Sẵn sàng", "開始可", "Siap") : t("이전 주차 완료 시 열림", "Opens after previous week", "完成上一周后开放", "Mở sau tuần trước", "前の週の完了後に開く", "Terbuka setelah minggu sebelumnya")}</span>
                      {reachable ? <span className="prog">{t(`${dc} / ${w.steps.length} 완료`, `${dc} / ${w.steps.length} done`, `${dc} / ${w.steps.length} 完成`, `${dc} / ${w.steps.length} xong`, `${dc} / ${w.steps.length} 完了`, `${dc} / ${w.steps.length} selesai`)}</span> : null}
                    </div>
                  </div>
                  {reachable ? <CaretDown className="chev h-5 w-5" weight="bold" aria-hidden /> : <Lock className="chev h-4 w-4" weight="fill" aria-hidden />}
                </div>
              </Row>

              {isOpen ? (
                <div className="cl-jmissions">
                  {w.steps.map((s) => missionCard(s, w.week, seq))}

                  {w.week === 2 ? (
                    <Row node={<span className="cl-jnode" />}>
                      <div className="cl-jwrap flex flex-col gap-3"><ResumeScoreCard /><CoverScoreCard /></div>
                    </Row>
                  ) : null}
                  {w.week === 4 ? (
                    <>
                      <Row node={<span className="cl-jnode" />}>
                        <div className="cl-jwrap"><PostingInterviewCard /></div>
                      </Row>
                      <Row node={<span className="cl-jnode" />}>
                        <Link href="/career-launch/corrections" className="cl-jcard">
                          <div className="ttl">{t("면접 오답노트 복습", "Review interview notes", "复习面试错题本", "Ôn sổ lỗi phỏng vấn", "面接復習ノート", "Tinjau catatan")}</div>
                          <div className="desc">{t("점수가 낮았던 문항을 다시 풀어봐요.", "Retry the questions you scored low on.", "重做低分题。", "Làm lại câu điểm thấp.", "点数の低かった問題を解き直します。", "Ulangi soal berskor rendah.")}</div>
                        </Link>
                      </Row>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}

        <Row node={<span className="cl-jnode dest"><Star className="h-3.5 w-3.5" weight="fill" /></span>}>
          <div className="cl-jstation" style={{ marginBottom: 0 }}>
            <span className="cl-eyebrow" style={{ color: "var(--cl-accent)" }}>Arrival</span>
            <h3 className="!mt-1">{t("첫 취업 🎉", "First job 🎉", "首次就业 🎉", "Việc đầu tiên 🎉", "初就職 🎉", "Kerja pertama 🎉")}</h3>
            <p className="sub">{t("4주를 마치면 완성한 서류로 실제 공고에 지원해요.", "Finish the 4 weeks, then apply to real jobs with your package.", "完成4周后用成果投递真实职位。", "Hoàn thành 4 tuần rồi ứng tuyển việc thật.", "4週間を終えたら完成した書類で実際に応募します。", "Selesai 4 minggu, lalu lamar kerja nyata.")}</p>
          </div>
        </Row>
      </div>
      {renderChatModal()}
    </>
  );
}
