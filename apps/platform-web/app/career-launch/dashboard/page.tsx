"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COMPLETION_CRITERIA, STUDENT, WEEKS } from "../../../lib/launch/data";
import { AutoSubmitStatus, Card, Pill, ProgressBar, SectionTitle } from "../../../components/launch/ui";
import { LiveWeekSteps, type DiagResult } from "../../../components/launch/live-week-steps";
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

  // 진단·직무 선정 결과(localStorage)를 읽어 현재 주차 진행에 반영한다.
  const [diag, setDiag] = useState<DiagResult>(null);
  const [jobs, setJobs] = useState<string[]>([]);
  useEffect(() => {
    try {
      const d = window.localStorage.getItem("career-launch:diagnosis");
      if (d) setDiag(JSON.parse(d));
      const j = window.localStorage.getItem("career-launch:selected-jobs");
      if (j) setJobs(JSON.parse(j));
    } catch {
      // localStorage 접근 불가 시 결과 없이 진행
    }
  }, []);

  const currentWeek = WEEKS.find((w) => w.week === STUDENT.currentWeek)!;
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;
  const totalSteps = WEEKS.reduce((n, w) => n + w.steps.length, 0);

  // 현재 주차 스텝의 실제 완료 여부(진단/직무 결과 + data.done).
  const isStepDone = (id: string, dataDone?: boolean) =>
    id === "w1s1" ? Boolean(diag) : id === "w1s2" ? jobs.length > 0 : Boolean(dataDone);
  const currentDone = currentWeek.steps.filter((s) => isStepDone(s.id, s.done)).length;
  const doneSteps = WEEKS.reduce(
    (n, w) => n + w.steps.filter((s) => (w.week === currentWeek.week ? isStepDone(s.id, s.done) : s.done)).length,
    0
  );
  const progress = Math.round((doneSteps / totalSteps) * 100);

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
          <Card className="md:!p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-[#8B95A1]">{STUDENT.cohort}</p>
                <h1 className="mt-1 text-[22px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[27px]">{displayName}님, 반가워요 👋</h1>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#4E5968]">
                  지금은 <b className="font-bold text-[#0B46E8]">Week {currentWeek.week}</b> · {currentWeek.title} 단계예요.
                </p>
              </div>
              <Pill tone="blue">Week {STUDENT.currentWeek} / 4</Pill>
            </div>
            <div className="mt-5 rounded-2xl bg-[#F6F8FB] p-4 md:mt-6 md:p-5">
              <div className="mb-2.5 flex items-end justify-between">
                <div>
                  <p className="text-[13px] font-bold text-[#333D4B]">전체 진행률</p>
                  <p className="mt-0.5 text-[12px] text-[#8B95A1]">완료한 스텝 {doneSteps}/{totalSteps}</p>
                </div>
                <span className="text-[26px] font-black leading-none text-[#0B46E8] md:text-[30px]">
                  {progress}<span className="text-[16px]">%</span>
                </span>
              </div>
              <ProgressBar value={progress} height={12} />
            </div>
          </Card>

          <div className="mt-7 grid gap-7 md:mt-9 lg:grid-cols-[1.55fr_1fr] lg:gap-8">
            {/* ── 메인 컬럼: 이번 주에 실제로 해야 할 일 ── */}
            <div className="space-y-7 md:space-y-8">
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
                    <span className="font-semibold text-[#4E5968]">스텝 {currentDone}/{currentWeek.steps.length} 완료</span>
                    <span>·</span>
                    <span>{currentWeek.seminar.online ? "온라인" : "오프라인"} 세미나 {currentWeek.seminar.date}</span>
                  </div>
                </Card>
              </div>

              {/* 이번 주 스텝별 해야 할 일 (대시보드에서 바로 진행) */}
              <div>
                <SectionTitle sub="한 단계씩 끝내고 번호를 콕 눌러 체크해요">이번 주 해야 할 일</SectionTitle>
                <Card className="md:!p-6">
                  <LiveWeekSteps steps={currentWeek.steps} diag={diag} jobs={jobs} />
                </Card>
              </div>

              {/* 이번 주 과제 — aply.global 활동에서 자동 수집 */}
              <div>
                <SectionTitle sub="따로 제출하지 않아도 활동을 하면 자동으로 반영돼요">이번 주 과제</SectionTitle>
                <AutoSubmitStatus label={currentWeek.submission.label} status={currentWeek.submission.status} source={currentWeek.submission.source} />
              </div>
            </div>

            {/* ── 사이드바 컬럼 ── */}
            <div className="space-y-7 md:space-y-8">
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
                <div className="space-y-3">
                  {WEEKS.map((w) => {
                    const isCurrent = w.week === STUDENT.currentWeek;
                    const locked = w.week > STUDENT.currentWeek; // 아직 시작 안 된 주차
                    const inner = (
                      <Card className={`flex items-center justify-between !p-4 ${isCurrent ? "!border-[#0B46E8]/40 ring-1 ring-[#0B46E8]/20" : ""} ${locked ? "opacity-60" : ""}`}>
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-[12.5px] font-black leading-none ${locked ? "bg-[#F2F4F6] text-[#B0B8C1]" : "bg-[#0B46E8] text-white"}`}>W{w.week}</span>
                          <div className="min-w-0">
                            <p className={`truncate text-[13.5px] font-bold ${locked ? "text-[#8B95A1]" : "text-[#191F28]"}`}>{w.title}</p>
                            {isCurrent ? <p className="text-[11px] font-bold text-[#0B46E8]">진행 중</p> : null}
                          </div>
                        </div>
                        {locked ? (
                          <Pill tone="grey">🔒 예정</Pill>
                        ) : (
                          <Pill tone={SUBMIT_LABEL[w.submission.status].tone}>{SUBMIT_LABEL[w.submission.status].t}</Pill>
                        )}
                      </Card>
                    );
                    // 현재 주차는 대시보드에 이미 상세가 나오므로 링크 없음(클릭 불필요).
                    // 시작 전 주차는 비활성. 지난 주차만 상세로 이동한다.
                    if (locked || isCurrent) {
                      return (
                        <div key={w.week} aria-disabled={locked} className={`block ${locked ? "cursor-not-allowed" : ""}`}>
                          {inner}
                        </div>
                      );
                    }
                    return (
                      <Link key={w.week} href={`/career-launch/week/${w.week}`} className="block">
                        {inner}
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
