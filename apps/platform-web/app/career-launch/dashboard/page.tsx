"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COMPLETION_CRITERIA, STUDENT, WEEKS } from "../../../lib/launch/data";
import { Card, Pill, ProgressBar, SectionTitle } from "../../../components/launch/ui";
import { CoachFeedback } from "../../../components/launch/coach-feedback";
import { EnrollmentGate } from "../../../components/launch/enrollment-gate";
import { FinalFeedbackCard } from "../../../components/launch/final-feedback";
import { ResumeRender } from "../../../components/launch/resume-render";
import { CoverRender } from "../../../components/launch/cover-render";
import { fetchProgress } from "../../../lib/launch/progress-client";
import { fetchResumeData, hasResumeContent } from "../../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent } from "../../../lib/launch/cover-data";
import { weekDoneCount, weekUnlocked, type LaunchData } from "../../../lib/launch/step-status";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";

// 주차별 최종 결과물(이 주에 나오는 것).
const WEEK_DELIVERABLE: Record<number, string> = {
  1: "취업 진단 · 직무 방향",
  2: "대표 이력서",
  3: "자기소개서",
  4: "면접 준비"
};

// 4. 학생 로그인 후 대시보드 — 4주 여정 퍼널 + 진행 + 결과물 + 피드백 개요.
export default function LaunchDashboardPage() {
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuthSession();
  useEffect(() => {
    if (isReady && !isAuthenticated) router.replace("/career-launch");
  }, [isReady, isAuthenticated, router]);

  const [data, setData] = useState<LaunchData>({ progress: {}, resume: {}, cover: {} });
  useEffect(() => {
    if (!isReady) return;
    let alive = true;
    void (async () => {
      try {
        const [p, r, c] = await Promise.all([
          fetchProgress(),
          fetchResumeData().catch(() => ({ data: {} })),
          fetchCoverData().catch(() => ({ data: {} }))
        ]);
        if (alive) setData({ progress: p, resume: r.data ?? {}, cover: c.data ?? {} });
      } catch {
        // 조회 실패 시 빈 상태
      }
    })();
    return () => {
      alive = false;
    };
  }, [isReady]);

  const displayName = user?.name?.trim() || user?.email || STUDENT.name;
  const totalSteps = WEEKS.reduce((n, w) => n + w.steps.length, 0);
  const doneSteps = WEEKS.reduce((n, w) => n + weekDoneCount(w.steps, data), 0);
  const overall = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const resumeReady = hasResumeContent(data.resume);
  const coverReady = hasCoverContent(data.cover);

  if (!isReady || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="text-[13px] text-[#8B95A1]">불러오는 중...</span>
      </main>
    );
  }

  return (
    <EnrollmentGate>
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-6xl px-5 pt-6 md:pt-10">
          {/* 운영자는 학생 화면을 본인 계정으로 전부 체험할 수 있음 — 콘솔 복귀 링크 */}
          {user?.role === "OPERATOR" ? (
            <Link href="/career-launch/ops/students" className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-[#F0B429]/40 bg-[#FFF9EC] px-3 py-1.5 text-[12.5px] font-bold text-[#B7791F] transition hover:bg-[#FEF3D6]">
              ← 운영자 콘솔 · 지금은 학생 화면 체험 중
            </Link>
          ) : null}
          {/* 인사 + 전체 진행률 (완주 시 축하 히어로로 전환) */}
          {overall === 100 ? (
            <Card className="!border-[#A6EF3F] !bg-[#B7FF5A] md:!p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-bold text-[#3A6B00]">🎉 4주 프로그램 완주</p>
                  <h1 className="mt-1 text-[22px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[27px]">{displayName}님, 완주를 축하해요! 🎉</h1>
                  <p className="mt-1.5 break-keep text-[14px] leading-relaxed text-[#4E5968]">이력서·자기소개서를 완성하고 면접 준비까지 마쳤어요. 이제 자신 있게 지원해봐요!</p>
                </div>
                <Pill tone="green">수료 완료</Pill>
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-4 md:mt-6 md:p-5">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[#EAFFD1] text-[22px]">🏁</span>
                <div>
                  <p className="text-[14px] font-black text-[#0B1227]">전체 진행률 100% · 모든 스텝 완료</p>
                  <p className="mt-0.5 text-[12px] text-[#8B95A1]">완료한 스텝 {doneSteps}/{totalSteps}</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="md:!p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-[#8B95A1]">{STUDENT.cohort}</p>
                  <h1 className="mt-1 text-[22px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[27px]">{displayName}님, 반가워요 👋</h1>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[#4E5968]">4주 동안 이력서·자기소개서를 완성하고 면접까지 준비해요.</p>
                </div>
                <Pill tone="blue">{doneSteps}/{totalSteps} 스텝</Pill>
              </div>
              <div className="mt-5 rounded-2xl bg-[#F6F8FB] p-4 md:mt-6 md:p-5">
                <div className="mb-2.5 flex items-end justify-between">
                  <div>
                    <p className="text-[13px] font-bold text-[#333D4B]">전체 진행률</p>
                    <p className="mt-0.5 text-[12px] text-[#8B95A1]">완료한 스텝 {doneSteps}/{totalSteps}</p>
                  </div>
                  <span className="text-[26px] font-black leading-none text-[#0B46E8] md:text-[30px]">
                    {overall}<span className="text-[16px]">%</span>
                  </span>
                </div>
                <ProgressBar value={overall} height={12} />
              </div>
            </Card>
          )}

          {/* 완주 시 — 이력서·자소서·면접 종합 최종 피드백(프로그램 소개처럼 섹션) */}
          {overall === 100 ? (
            <div className="mt-7">
              <SectionTitle sub="이력서·자기소개서·면접을 종합한 코치 피드백">최종 피드백</SectionTitle>
              <FinalFeedbackCard />
            </div>
          ) : null}

          <div className="mt-7 grid gap-7 md:mt-9 lg:grid-cols-[1.55fr_1fr] lg:gap-8">
            {/* ── 메인: 프로그램 소개 + 4주 여정 퍼널 ── */}
            <div className="min-w-0 space-y-7 md:space-y-8">
              {/* 프로그램 소개 */}
              <div>
                <SectionTitle>프로그램 소개</SectionTitle>
                <Card className="md:!p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img_global_career_launch.webp" alt="Global Career Launch" className="mb-4 h-auto w-full rounded-xl" />
                  <p className="text-[15px] font-black text-[#0B1227] md:text-[16px]">AI 코치와 함께하는 4주 취업 완성 부트캠프</p>
                  <p className="mt-1.5 break-keep text-[13.5px] leading-relaxed text-[#4E5968]">
                    한국 취업을 준비하는 외국인 유학생을 위한 프로그램이에요. 혼자서는 막막한 취업 준비를 AI 코치가 옆에서 이끌어줘요. 취업 준비 상태 진단부터 직무 방향 설정, 대화만으로 완성하는 이력서·자기소개서, 그리고 유형별 모의면접까지 — 4주 동안 하나씩 밟아가며 완주해요.
                  </p>
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    {[
                      { e: "💬", t: "대화로 만드는 이력서·자기소개서" },
                      { e: "🎓", t: "주간 세미나" },
                      { e: "✍️", t: "코치 1:1 피드백" }
                    ].map((f) => (
                      <span key={f.t} className="inline-flex items-center gap-1.5 rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12px] font-semibold text-[#4E5968]">
                        <span>{f.e}</span>
                        {f.t}
                      </span>
                    ))}
                  </div>

                  {/* 4주 후 얻는 것 */}
                  <div className="mt-5 border-t border-[#EEF1F5] pt-5">
                    <p className="text-[12.5px] font-bold text-[#0B46E8]">🎯 4주 후, 이런 걸 완성해요</p>
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      {[
                        { e: "🧭", t: "취업 준비도 진단 · 직무 방향" },
                        { e: "📄", t: "기업에 낼 대표 이력서" },
                        { e: "📝", t: "회사 맞춤 자기소개서" },
                        { e: "🎤", t: "유형별 모의면접 · 실전 준비" }
                      ].map((o) => (
                        <div key={o.t} className="flex items-center gap-2 rounded-xl bg-[#F8FAFC] px-3 py-2.5">
                          <span className="text-[16px]">{o.e}</span>
                          <span className="break-keep text-[12.5px] font-semibold text-[#333D4B]">{o.t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 수료 조건 */}
                  <div className="mt-5 border-t border-[#EEF1F5] pt-5">
                    <p className="text-[12.5px] font-bold text-[#3A6B00]">✅ 수료 조건</p>
                    <ul className="mt-2 space-y-1.5 text-[13px] text-[#333D4B]">
                      {COMPLETION_CRITERIA.map((c, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[#B7FF5A] text-[10px] font-black text-[#111]">{i + 1}</span>
                          <span className="break-keep">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </div>

              <div>
                <SectionTitle sub="각 주차를 눌러 진행하세요 · 완료할수록 결과물이 완성돼요">4주 여정</SectionTitle>
                <ol className="space-y-3">
                  {WEEKS.map((w) => {
                    const done = weekDoneCount(w.steps, data);
                    const total = w.steps.length;
                    const unlocked = weekUnlocked(w.week, data);
                    const status = !unlocked ? "잠김" : done === total ? "완료" : done > 0 ? "진행 중" : "시작 전";
                    const tone = !unlocked ? "grey" : done === total ? "green" : done > 0 ? "blue" : "grey";
                    const card = (
                      <Card className={`!p-4 md:!p-5 ${unlocked ? "transition hover:border-[#0B46E8]/40" : "opacity-60"}`}>
                        <div className="flex items-start gap-3.5">
                          <span
                            className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-[12.5px] font-black leading-none ${
                              !unlocked ? "bg-[#F2F4F6] text-[#B0B8C1]" : done === total ? "bg-emerald-500 text-white" : done > 0 ? "bg-[#0B46E8] text-white" : "border-2 border-[#D7DCE3] bg-white text-[#8B95A1]"
                            }`}
                          >
                            {unlocked ? `W${w.week}` : "🔒"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                              <p className={`text-[15.5px] font-black tracking-[-0.01em] md:text-[16.5px] ${unlocked ? "text-[#191F28]" : "text-[#8B95A1]"}`}>{w.title}</p>
                              <Pill tone={tone}>{status}</Pill>
                            </div>
                            <p className="mt-0.5 text-[12.5px] text-[#8B95A1]">{w.subtitle}</p>
                            {unlocked ? (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="rounded-full bg-[#EDF1FD] px-2 py-0.5 text-[11px] font-bold text-[#0B46E8]">📦 {WEEK_DELIVERABLE[w.week]}</span>
                                <span className="text-[11.5px] font-semibold text-[#8B95A1]">스텝 {done}/{total}</span>
                              </div>
                            ) : (
                              <p className="mt-2 text-[11.5px] font-medium text-[#B0B8C1]">🔒 Week {w.week - 1}를 완료하면 열려요</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                    return <li key={w.week}>{unlocked ? <Link href={`/career-launch/week/${w.week}`} className="block">{card}</Link> : card}</li>;
                  })}
                </ol>
              </div>
            </div>

            {/* ── 사이드바 ── */}
            <div className="min-w-0 space-y-7 md:space-y-8">
              {/* 코치 피드백 */}
              <CoachFeedback />

              {/* 다가오는 세미나 */}
              <div>
                <SectionTitle>세미나 일정</SectionTitle>
                <div className="space-y-2.5">
                  {WEEKS.map((w) => (
                    <Card key={w.week} className="flex items-start gap-3 !p-4">
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#EDF1FD] text-[18px]">{w.seminar.online ? "💻" : "📍"}</span>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-bold text-[#191F28]">Week {w.week} 세미나</p>
                        <p className="mt-0.5 text-[12.5px] text-[#4E5968]">{w.seminar.date} · {w.seminar.time}</p>
                        <p className="text-[12px] text-[#8B95A1]">{w.seminar.place}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* 내 결과물 — 이력서·자기소개서 미리보기(없으면 점선 placeholder) */}
              <div className="space-y-4">
                <SectionTitle sub="대화로 만드는 이력서와 자기소개서">내 결과물</SectionTitle>
                <DocPreview title="내 이력서" ready={resumeReady} previewHref="/career-launch/resume-preview" emptyTitle="아직 이력서가 없어요" emptySub="2주차에 대화로 만들어요">
                  {resumeReady ? <ResumeRender data={data.resume} /> : null}
                </DocPreview>
                <DocPreview title="내 자기소개서" ready={coverReady} previewHref="/career-launch/cover-preview" emptyTitle="아직 자기소개서가 없어요" emptySub="3주차에 대화로 만들어요">
                  {coverReady ? <CoverRender data={data.cover} /> : null}
                </DocPreview>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
    </EnrollmentGate>
  );
}

// 결과물 미리보기 — 있으면 실제 문서 렌더 + 크게보기, 없으면 점선 placeholder(안내만, 버튼 없음).
function DocPreview({
  title,
  ready,
  previewHref,
  emptyTitle,
  emptySub,
  children
}: {
  title: string;
  ready: boolean;
  previewHref: string;
  emptyTitle: string;
  emptySub: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[13.5px] font-bold text-[#191F28]">{title}</p>
        {ready ? (
          <Link href={previewHref} target="_blank" rel="noopener noreferrer" className="text-[12px] font-bold text-[#0B46E8] transition hover:underline">
            열기 · PDF ↗
          </Link>
        ) : null}
      </div>
      {ready ? (
        children
      ) : (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D7DCE3] bg-[#FAFBFC] p-6 text-center">
          <span className="text-[22px] opacity-40">📄</span>
          <p className="mt-2 text-[13px] font-semibold text-[#8B95A1]">{emptyTitle}</p>
          <p className="mt-0.5 text-[12px] text-[#B0B8C1]">{emptySub}</p>
        </div>
      )}
    </div>
  );
}
