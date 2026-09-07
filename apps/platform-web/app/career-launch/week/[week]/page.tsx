"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { logActivity } from "../../../../lib/launch/pilot-client";
import Link from "next/link";
import { CaretRight, ArrowRight, Check } from "@phosphor-icons/react";
import { WEEKS } from "../../../../lib/launch/data";
import { SectionTitle } from "../../../../components/launch/ui";
import { WeekStepper } from "../../../../components/launch/week-stepper";
import { WeekDocs } from "../../../../components/launch/week-docs";
import { WeekGate } from "../../../../components/launch/week-gate";
import { WeekAutoFeedback } from "../../../../components/launch/week-auto-feedback";
import { InterviewPrepChecklist } from "../../../../components/launch/InterviewPrepChecklist";
import { ResumeScoreCard } from "../../../../components/launch/ResumeScoreCard";
import { CoverScoreCard } from "../../../../components/launch/CoverScoreCard";
import { PostingInterviewCard } from "../../../../components/launch/PostingInterviewCard";
import { WeekHero, WeekCompletionCriteria, NextWeekPreview, type WeekFrameStatus } from "../../../../components/launch/week/week-frame";
import { WeekLearn } from "../../../../components/launch/week-learn";
import { WeekPacing } from "../../../../components/launch/week-pacing";
import { WEEK_CONFIG } from "../../../../lib/launch/week-config";
import { fetchProgress } from "../../../../lib/launch/progress-client";
import { fetchResumeData } from "../../../../lib/launch/resume-data";
import { fetchCoverData } from "../../../../lib/launch/cover-data";
import { weekDoneCount, weekUnlocked, isWeekComplete, isStepDone, type LaunchData } from "../../../../lib/launch/step-status";
import { trackCareerFunnel } from "../../../../lib/analytics";
import { CareerChatModal } from "../../../../components/launch/CareerChatModal";
import { ExperienceChat } from "../../../../components/launch/ExperienceChat";
import { StrengthStoryChat } from "../../../../components/launch/StrengthStoryChat";
import { TargetCompanyExplorer } from "../../../../components/launch/TargetCompanyExplorer";
import { DiagnosisChat } from "../../../../components/launch/DiagnosisChat";
import { JobsChat } from "../../../../components/launch/JobsChat";
import { MaterialsChat } from "../../../../components/launch/MaterialsChat";
import { InterviewChat } from "../../../../components/launch/InterviewChat";
import { BasicInterviewSession } from "../../../../components/launch/BasicInterviewSession";
import { WeekSeminar } from "../../../../components/launch/week-seminar";
import { CareerLaunchHeader } from "../../../../components/launch/CareerLaunchHeader";
import { LaunchAmbientBackground } from "../../../../components/launch/LaunchAmbientBackground";
import { AplyFooter } from "../../../../components/AplyFooter";
import { useLaunchT } from "../../../../lib/launch/i18n";
import { useWeekText } from "../../../../lib/launch/data-i18n";

// 5~8. Week 1~4 미션 페이지 (동적 라우트)
export default function LaunchWeekPage({ params }: { params: Promise<{ week: string }> }) {
  const t = useLaunchT();
  const weekText = useWeekText();
  const { week } = use(params);
  const n = Number(week);
  const plan = WEEKS.find((w) => w.week === n);
  if (!plan) notFound();

  const weekLabel = (wk: number) => t(`${wk}주차`, `Week ${wk}`, `第${wk}周`, `Tuần ${wk}`, `${wk}週目`, `Minggu ${wk}`);
  // 주차 테마 일러스트(기존 자산) — 직무 탐험 / 지원 패키지 / 실전 모의면접 / 오답노트·최종 검증.
  const WEEK_IMAGE: Record<number, string> = {
    1: "/img_ai_analyze.webp",
    2: "/img_resume.webp",
    3: "/img_fake_interview.webp",
    4: "/img_fake_interview.webp"
  };
  // Phase 10 계기 — 주차 진입 기록(체류시간·재진입 분석용). 실패해도 무시.
  useEffect(() => {
    if (Number.isFinite(n)) void logActivity("week_enter", { week: n });
  }, [n]);
  // 대화(모달)에서 나오면 이 값을 올려 진행 데이터를 다시 불러온다(완료 상태·결과 즉시 반영).
  const [refreshKey, setRefreshKey] = useState(0);
  // UX Phase 4 — 공통 주차 프레임용 진행/완료 데이터(기존 완료 로직 step-status 재사용).
  const [data, setData] = useState<LaunchData>({ progress: {}, resume: {}, cover: {} });
  useEffect(() => {
    let alive = true;
    void (async () => {
      const [p, r, c] = await Promise.all([fetchProgress().catch(() => ({}) as LaunchData["progress"]), fetchResumeData().catch(() => ({ data: {} })), fetchCoverData().catch(() => ({ data: {} }))]);
      if (alive) setData({ progress: p, resume: r.data ?? {}, cover: c.data ?? {} });
    })();
    return () => {
      alive = false;
    };
  }, [n, refreshKey]);
  useEffect(() => {
    if (Number.isFinite(n)) trackCareerFunnel("career_week_viewed", { week: n });
  }, [n]);
  // 스텝 채팅(진단·경험·직무·자료·면접)을 href 기준으로 모달 오픈.
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

  return (
    <div className="cl-surface isolate flex min-h-screen flex-col bg-[#F1F1F4]">
      <LaunchAmbientBackground />
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          {/* 뒤로 */}
          <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            {t("← 대시보드", "← Dashboard", "← 仪表板", "← Bảng điều khiển", "← ダッシュボード", "← Dasbor")}
          </Link>

          {/* 주차 네비게이션(스텝바) — 단계별 진행을 한눈에, 주차 이동을 상단에서 바로. */}
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {WEEKS.map((w) => {
              const done = isWeekComplete(w.week, data);
              const current = w.week === plan.week;
              return (
                <Link
                  key={w.week}
                  href={`/career-launch/week/${w.week}`}
                  aria-current={current ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-bold transition ${current ? "bg-[#0B46E8] text-white" : done ? "border border-[#CFE0FF] bg-white text-[#0B46E8] hover:bg-[#F5F8FF]" : "border border-[#EEF1F5] bg-white text-[#8B95A1] hover:text-[#4E5968]"}`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${current ? "bg-white/20 text-white" : done ? "bg-[#EDF1FD] text-[#0B46E8]" : "bg-[#F2F4F6] text-[#8B95A1]"}`}>
                    {done && !current ? <Check className="h-3 w-3" weight="bold" /> : w.week}
                  </span>
                  {weekLabel(w.week)}
                </Link>
              );
            })}
          </div>

          {/* ── UX Phase 4 공통 주차 프레임 — Week Hero(핵심질문·결과물·진행·CTA) ── */}
          {(() => {
            const cfg = WEEK_CONFIG[plan.week];
            const doneCount = weekDoneCount(plan.steps, data);
            const total = plan.steps.length;
            const complete = isWeekComplete(plan.week, data);
            const status: WeekFrameStatus = complete ? "completed" : doneCount > 0 ? "in_progress" : "available";
            const nextStep = plan.steps.find((s) => !isStepDone(s.id, data)) ?? null;
            return (
              <div className="mt-3.5 flex flex-col gap-4">
                <WeekHero
                  week={plan.week}
                  title={weekText(plan.week, "title")}
                  subtitle={weekText(plan.week, "subtitle")}
                  question={cfg?.question ?? weekText(plan.week, "goal")}
                  status={status}
                  doneCount={doneCount}
                  totalCount={total}
                  resultLabels={cfg?.resultLabels ?? []}
                  ctaLabel={nextStep?.action?.label ?? cfg?.ctaLabel ?? "이어서 하기"}
                  ctaHref={nextStep?.action?.href}
                  onCta={() => trackCareerFunnel("career_week_primary_action_clicked", { week: plan.week, missionKey: nextStep?.id })}
                  image={WEEK_IMAGE[plan.week]}
                />
                {/* 코치 안내 카드 제거 — WeekHero CTA·WeekStepper와 같은 다음 스텝을 가리키는 중복이었음 */}
              </div>
            );
          })()}

          {/* ── 단일 컬럼 매거진 본문 ── */}
          <div className="mt-8 flex flex-col gap-10 md:mt-9">
            {/* 이번 주 배우기 — 활동 전에 읽는 짧은 학습(맥락). 해당 주차 콘텐츠 없으면 스스로 숨음 */}
            <WeekLearn week={plan.week} />

            {/* 이번 주 해야 할 일 */}
            <div>
              <SectionTitle sub={t("끝낸 단계는 번호를 콕 눌러 체크해요", "Tap the number to check off a step you've finished", "点击序号即可勾选已完成的步骤", "Nhấn vào số để đánh dấu bước đã hoàn thành", "終えたステップは番号をタップしてチェック", "Ketuk nomor untuk menandai langkah yang selesai")}>{t("이번 주 해야 할 일", "This week's to-dos", "本周待办", "Việc cần làm tuần này", "今週やること", "Yang harus dilakukan minggu ini")}</SectionTitle>
              {/* 페이싱 — 하루에 다 몰지 말고 며칠에 나눠서 */}
              <div className="mb-3"><WeekPacing week={plan.week} /></div>
              <WeekGate week={plan.week}>
                <div className="rounded-3xl border border-[#EEF1F5] bg-white p-5 md:p-6">
                  {/* 3·4주차는 스텝(면접 유형·오답노트)이 독립적이라 순서 잠금 없이 자유롭게 진행. 채팅 스텝은 모달로 연다 */}
                  <WeekStepper steps={plan.steps} sequential={plan.week !== 3 && plan.week !== 4} onOpenChat={setChatHref} refreshKey={refreshKey} />
                </div>
              </WeekGate>
            </div>

            {/* 경험 채굴(내 경험 찾아보기)은 이제 '이번 주 해야 할 일' 정식 스텝(w1exp)으로 편입 — 별도 붕 뜬 카드 제거.
                스텝 클릭 시 아래 renderChatModal 이 /experience 를 감지해 그 자리에서 ExperienceChat 모달을 연다. */}

            {/* 스텝 채팅 모달(진단·경험·직무·자료·면접) */}
            {renderChatModal()}

            {/* Week 1 직무 결정 — '관심 직무 선정' 스텝(③)에서 고르고, 그 결과 패널에서 1순위를 목표로 확정한다.
                (구 ExploreCard 추천→체험→결정 흐름은 스텝과 중복이라 제거, 목표 확정을 스텝 ③ 결과로 통합) */}

            {/* Week 2의 이력서·자소서 심층 평가(Score) 카드는 아래 '피드백' 섹션에 배치. */}

            {/* Week 3 — 유형별 기본 면접(카드·채점형)은 '이번 주 해야 할 일' 스텝으로 진행. 별도 카드 없음. */}

            {/* Week 4 — 공고별 모의면접(핵심) + 면접 오답노트 복습 링크 */}
            {plan.week === 4 ? (
              <>
                <PostingInterviewCard />
                <Link href="/career-launch/corrections" className="group flex items-center justify-between gap-3 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#0B46E8]/40">
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#0B1227]">{t("면접 오답노트 복습", "Review interview notes", "复习面试错题本", "Ôn sổ lỗi phỏng vấn", "面接復習ノートを見直す", "Tinjau catatan wawancara")}</p>
                    <p className="mt-0.5 break-keep text-[12.5px] text-[#8B95A1]">{t("기본·공고별 면접에서 점수가 낮았던 문항을 다시 풀어봐요.", "Retry the questions you scored low on in your basic and posting interviews.", "重做基础与公告面试中的低分题。", "Làm lại câu điểm thấp trong phỏng vấn cơ bản và theo tin.", "基本・求人別面接で点数の低かった問題を解き直します。", "Ulangi soal berskor rendah dari wawancara dasar dan lowongan.")}</p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDF1FD] text-[#0B46E8] transition group-hover:bg-[#DDE7FC]"><ArrowRight className="h-[18px] w-[18px]" weight="bold" aria-hidden /></span>
                </Link>
              </>
            ) : null}

            {/* 세미나 정보 — 운영자가 기수에 입력한 일정 */}
            {/* UX Phase 4 — 이번 주 완료 조건(각 미션 상태, 미완료는 행동으로 연결) */}
            <WeekCompletionCriteria steps={plan.steps} data={data} onView={() => trackCareerFunnel("career_completion_criteria_viewed", { week: plan.week })} />

            <WeekSeminar week={plan.week} />

            {/* UX Phase 4 — 다음 주 연결/예고 */}
            <NextWeekPreview
              week={plan.week}
              teaser={WEEK_CONFIG[plan.week]?.nextWeekTeaser ?? ""}
              unlocked={plan.week < 4 ? weekUnlocked(plan.week + 1, data) : false}
              onClick={() => trackCareerFunnel("career_next_week_preview_clicked", { week: plan.week, destination: `week-${plan.week + 1}` })}
            />

            {/* 피드백 — 결과물 기반 자동 코치 피드백. W1(직무)·W2(이력서+자소서). W3·4는 면접 점수 카드로 대체 */}
            {plan.week === 1 ? (
              <div>
                <SectionTitle>{t("피드백", "Feedback", "反馈", "Phản hồi", "フィードバック", "Umpan balik")}</SectionTitle>
                <WeekAutoFeedback week={1} />
              </div>
            ) : plan.week === 2 ? (
              <div>
                <SectionTitle sub={t("이력서·자기소개서를 심층 평가하고, 고쳐서 다시 받아요", "Deep-evaluate your resume and cover letter, then fix and re-check", "深度评估简历与自我介绍书，修改后再评估", "Đánh giá sâu CV và thư, sửa rồi nhận lại", "履歴書・自己紹介書を深く評価し、直して再評価", "Nilai mendalam resume & surat, perbaiki lalu nilai ulang")}>{t("피드백", "Feedback", "反馈", "Phản hồi", "フィードバック", "Umpan balik")}</SectionTitle>
                <div className="mt-3 flex flex-col gap-4">
                  <ResumeScoreCard />
                  <CoverScoreCard />
                </div>
              </div>
            ) : null}

            {/* 3주차(실전 모의면접) — 면접 준비 체크리스트(점수 대신 준비도로 자신감) */}
            {plan.week === 3 ? (
              <div>
                <SectionTitle sub={t("실전 전에 하나씩 체크하며 준비해요", "Check off each item before the real thing", "在实战前逐项准备", "Đánh dấu từng mục trước khi thực chiến", "本番前に一つずつ準備", "Centang tiap item sebelum wawancara asli")}>{t("면접 준비", "Interview prep", "面试准备", "Chuẩn bị phỏng vấn", "面接準備", "Persiapan wawancara")}</SectionTitle>
                <InterviewPrepChecklist />
              </div>
            ) : null}

            {/* 내 이력서·자기소개서 — 2주차부터 미리보기 */}
            {plan.week >= 2 ? <WeekDocs week={plan.week} /> : null}

            {/* 4주 전체 진행 — 디바이더 리스트(대시보드 4주 여정과 동일한 결) */}
            <div>
              <SectionTitle>{t("4주 전체 진행", "Full 4-week progress", "4周整体进度", "Tiến độ toàn bộ 4 tuần", "4週間全体の進捗", "Progres 4 minggu penuh")}</SectionTitle>
              <ol className="divide-y divide-[#EEF1F5] border-y border-[#EEF1F5]">
                {WEEKS.map((w) => {
                  const isCurrent = w.week === plan.week;
                  const row = (
                    <div className="flex items-center gap-4 py-4">
                      <span className={`w-14 shrink-0 text-[13px] font-black ${isCurrent ? "text-[#0B46E8]" : "text-[#191F28]"}`}>{weekLabel(w.week)}</span>
                      <p className={`min-w-0 flex-1 truncate text-[15px] font-bold tracking-[-0.01em] ${isCurrent ? "text-[#0B46E8]" : "text-[#191F28]"}`}>{weekText(w.week, "title")}</p>
                      {isCurrent ? (
                        <span className="shrink-0 text-[12px] font-bold text-[#0B46E8]">{t("보는 중", "Viewing", "查看中", "Đang xem", "表示中", "Sedang dilihat")}</span>
                      ) : (
                        <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2] transition" weight="bold" aria-hidden />
                      )}
                    </div>
                  );
                  return isCurrent ? (
                    <li key={w.week} className="-mx-2 rounded-xl bg-[#F5F8FF] px-2">{row}</li>
                  ) : (
                    <li key={w.week}>
                      <Link href={`/career-launch/week/${w.week}`} className="group -mx-2 block rounded-xl px-2 transition hover:bg-[#FAFBFC]">
                        {row}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Career Report(6영역 점수·강점·로드맵)는 홈(대시보드)으로 이동 — 여기선 제거. */}
          </div>

          {/* 최종 주차 CTA — 흑백 다크 카드(대시보드 '다음 할 일'과 동일한 결) */}
          {plan.week === 4 ? (
            <Link
              href="/career-launch/dashboard"
              className="group mt-10 flex items-center justify-between gap-4 rounded-2xl bg-[#191F28] p-5 transition hover:bg-[#0B1227] md:p-6"
            >
              <span className="text-[15px] font-bold text-white md:text-[16.5px]">{t("완성한 내 결과물 보러 가기", "See my finished deliverables", "去查看我完成的成果", "Xem kết quả đã hoàn thành của tôi", "完成した私の成果物を見に行く", "Lihat hasil saya yang sudah selesai")}</span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:bg-white/20"><ArrowRight className="h-[18px] w-[18px]" weight="bold" aria-hidden /></span>
            </Link>
          ) : null}
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
