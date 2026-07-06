"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { COMPLETION_CRITERIA, NEXT_SEMINAR, overallProgress, STUDENT, WEEKS } from "../../../lib/launch/data";
import { Card, LaunchContainer, LaunchTopBar, Pill, ProgressBar, SectionTitle } from "../../../components/launch/ui";
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
    <main className="pb-16">
      <LaunchTopBar />
      <LaunchContainer className="pt-6">
        {/* 인사 + 진행률 */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#8B95A1]">{STUDENT.cohort}</p>
              <p className="text-[18px] font-black text-[#0B1227]">{displayName}님</p>
            </div>
            <Pill tone="blue">Week {STUDENT.currentWeek} / 4</Pill>
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
              <span className="font-semibold text-[#4E5968]">전체 진행률</span>
              <span className="font-black text-[#0B46E8]">{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>
        </Card>

        {/* 이번 주 미션 */}
        <div className="mt-7">
          <SectionTitle sub={currentWeek.subtitle}>이번 주 미션 · Week {currentWeek.week}</SectionTitle>
          <Card onClick={undefined}>
            <p className="text-[15px] font-bold text-[#191F28]">{currentWeek.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[#4E5968]">{currentWeek.goal}</p>
            <div className="mt-3 flex items-center gap-2">
              <Pill tone={SUBMIT_LABEL[currentWeek.submission.status].tone}>{SUBMIT_LABEL[currentWeek.submission.status].t}</Pill>
              <span className="text-[12px] text-[#8B95A1]">미션 {currentWeek.missions.filter((m) => m.done).length}/{currentWeek.missions.length} 완료</span>
            </div>
            <Link href={`/career-launch/week/${currentWeek.week}`} className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#0B46E8] py-3 text-[14px] font-bold text-white">
              이번 주 미션 진행하기 →
            </Link>
          </Card>
        </div>

        {/* 다음 세미나 */}
        <div className="mt-7">
          <SectionTitle>다음 오프라인 세미나</SectionTitle>
          <Card>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[#EDF1FD] text-[20px]">📅</span>
              <div>
                <p className="text-[14.5px] font-bold text-[#191F28]">{NEXT_SEMINAR.title}</p>
                <p className="mt-0.5 text-[13px] text-[#4E5968]">{NEXT_SEMINAR.date} · {NEXT_SEMINAR.time}</p>
                <p className="text-[12.5px] text-[#8B95A1]">{NEXT_SEMINAR.place}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 주차별 제출 상태 */}
        <div className="mt-7">
          <SectionTitle>주차별 제출 상태</SectionTitle>
          <div className="space-y-2.5">
            {WEEKS.map((w) => (
              <Link key={w.week} href={`/career-launch/week/${w.week}`}>
                <Card className="flex items-center justify-between !p-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[12.5px] font-black ${w.week <= STUDENT.currentWeek ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#B0B8C1]"}`}>W{w.week}</span>
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-bold text-[#191F28]">{w.title}</p>
                    </div>
                  </div>
                  <Pill tone={SUBMIT_LABEL[w.submission.status].tone}>{SUBMIT_LABEL[w.submission.status].t}</Pill>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* 수료 조건 */}
        <div className="mt-7">
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
      </LaunchContainer>
    </main>
  );
}
