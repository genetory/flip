"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { COMPLETION_CRITERIA, overallProgress, STUDENT, WEEKS } from "../../../lib/launch/data";
import { Card, Pill, ProgressBar, SectionTitle, Stepper, SubmissionBox } from "../../../components/launch/ui";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";

const SUBMIT_LABEL = { todo: { t: "미제출", tone: "grey" as const }, submitted: { t: "제출 완료", tone: "blue" as const }, reviewed: { t: "피드백 완료", tone: "green" as const } };

// 4. 학생 로그인 후 대시보드 — aply.global 세션 필요.
export default function LaunchDashboardPage() {
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuthSession();
  useEffect(() => {
    if (isReady && !isAuthenticated) router.replace("/career-launch");
  }, [isReady, isAuthenticated, router]);

  const progress = overallProgress();
  const currentWeek = WEEKS.find((w) => w.week === STUDENT.currentWeek)!;
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  if (!isReady || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="text-[13px] text-[#8B95A1]">불러오는 중...</span>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16">
        {/* 포지션 탐색 페이지와 동일한 컨텐츠 폭(max-w-4xl). 모바일 1단 / 데스크탑 2단 */}
        <div className="mx-auto w-full max-w-4xl px-5 pt-6 md:pt-10">
          {/* 인사 + 진행률 (전체 폭) */}
          <Card className="md:!p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] text-[#8B95A1]">{STUDENT.cohort}</p>
                <p className="text-[18px] font-black text-[#0B1227] md:text-[22px]">{displayName}님</p>
              </div>
              <Pill tone="blue">Week {STUDENT.currentWeek} / 4</Pill>
            </div>
            <div className="mt-4 md:mt-5">
              <div className="mb-1.5 flex items-center justify-between text-[12.5px] md:text-[13.5px]">
                <span className="font-semibold text-[#4E5968]">전체 진행률</span>
                <span className="font-black text-[#0B46E8]">{progress}%</span>
              </div>
              <ProgressBar value={progress} />
            </div>
          </Card>

          <div className="mt-6 grid gap-6 md:mt-8 lg:grid-cols-[1.55fr_1fr] lg:gap-7">
            {/* ── 메인 컬럼: 이번 주에 실제로 해야 할 일 ── */}
            <div className="space-y-6 md:space-y-7">
              {/* 이번 주 개요 + 목표 */}
              <div>
                <SectionTitle sub={currentWeek.subtitle}>이번 주 · Week {currentWeek.week}</SectionTitle>
                <Card className="md:!p-6">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[16px] font-black text-[#191F28] md:text-[18px]">{currentWeek.title}</p>
                    <Pill tone={SUBMIT_LABEL[currentWeek.submission.status].tone}>{SUBMIT_LABEL[currentWeek.submission.status].t}</Pill>
                  </div>
                  <div className="mt-3 rounded-xl bg-[#EDF1FD] p-3.5">
                    <p className="text-[11.5px] font-bold text-[#0B46E8]">이번 주 목표</p>
                    <p className="mt-0.5 text-[13.5px] font-semibold leading-relaxed text-[#0B1227]">{currentWeek.goal}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[12px] text-[#8B95A1]">
                    <span className="font-semibold text-[#4E5968]">스텝 {currentWeek.steps.filter((s) => s.done).length}/{currentWeek.steps.length} 완료</span>
                    <span>·</span>
                    <span>{currentWeek.seminar.online ? "온라인" : "오프라인"} 세미나 {currentWeek.seminar.date}</span>
                  </div>
                </Card>
              </div>

              {/* 이번 주 스텝별 해야 할 일 (대시보드에서 바로 진행) */}
              <div>
                <SectionTitle sub="각 단계를 완료하면 번호를 눌러 체크하세요">이번 주 해야 할 일</SectionTitle>
                <Card className="md:!p-6">
                  <Stepper steps={currentWeek.steps} />
                  <Link href={`/career-launch/week/${currentWeek.week}`} className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#0B46E8] py-3 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
                    Week {currentWeek.week} 상세 페이지 →
                  </Link>
                </Card>
              </div>

              {/* 이번 주 과제 제출 */}
              <div>
                <SectionTitle>이번 주 과제 제출</SectionTitle>
                <SubmissionBox label={currentWeek.submission.label} initialStatus={currentWeek.submission.status} />
              </div>
            </div>

            {/* ── 사이드바 컬럼 ── */}
            <div className="space-y-6 md:space-y-7">
              {/* 이번 주 세미나 */}
              <div>
                <SectionTitle>이번 주 세미나</SectionTitle>
                <Card>
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[#EDF1FD] text-[20px]">{currentWeek.seminar.online ? "💻" : "📍"}</span>
                    <div>
                      <p className="text-[14.5px] font-bold text-[#191F28]">Week {currentWeek.week} 세미나</p>
                      <p className="mt-0.5 text-[13px] text-[#4E5968]">{currentWeek.seminar.date} · {currentWeek.seminar.time}</p>
                      <p className="text-[12.5px] text-[#8B95A1]">{currentWeek.seminar.place}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 주차별 진행 */}
              <div>
                <SectionTitle>4주 전체 진행</SectionTitle>
                <div className="space-y-2.5">
                  {WEEKS.map((w) => {
                    const isCurrent = w.week === STUDENT.currentWeek;
                    return (
                      <Link key={w.week} href={`/career-launch/week/${w.week}`}>
                        <Card className={`flex items-center justify-between !p-4 ${isCurrent ? "!border-[#0B46E8]/40 ring-1 ring-[#0B46E8]/20" : ""}`}>
                          <div className="flex items-center gap-3">
                            <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[12.5px] font-black ${w.week <= STUDENT.currentWeek ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#B0B8C1]"}`}>W{w.week}</span>
                            <div className="min-w-0">
                              <p className="truncate text-[13.5px] font-bold text-[#191F28]">{w.title}</p>
                              {isCurrent ? <p className="text-[11px] font-bold text-[#0B46E8]">진행 중</p> : null}
                            </div>
                          </div>
                          <Pill tone={SUBMIT_LABEL[w.submission.status].tone}>{SUBMIT_LABEL[w.submission.status].t}</Pill>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* 수료 조건 */}
              <div>
                <SectionTitle>수료 조건</SectionTitle>
                <Card>
                  <ul className="space-y-2.5 text-[13.5px] text-[#333D4B]">
                    {COMPLETION_CRITERIA.map((c, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[#B7FF5A] text-[10px] font-black text-[#111]">{i + 1}</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
