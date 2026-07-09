"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COMPLETION_CRITERIA, STUDENT, WEEKS } from "../../../lib/launch/data";
import { Card, Pill, ProgressBar, SectionTitle } from "../../../components/launch/ui";
import { CoachFeedback } from "../../../components/launch/coach-feedback";
import { fetchProgress } from "../../../lib/launch/progress-client";
import { fetchResumeData, hasResumeContent } from "../../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent } from "../../../lib/launch/cover-data";
import { weekDoneCount, type LaunchData } from "../../../lib/launch/step-status";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";

// 주차별 최종 결과물(이 주에 나오는 것).
const WEEK_DELIVERABLE: Record<number, string> = {
  1: "취업 진단 · 직무 방향",
  2: "대표 이력서",
  3: "자기소개서",
  4: "기업 지원"
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

  const diag = data.progress.diagnosis;
  const jobs = data.progress.selectedJobs ?? [];
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
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-6xl px-5 pt-6 md:pt-10">
          {/* 인사 + 전체 진행률 */}
          <Card className="md:!p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-[#8B95A1]">{STUDENT.cohort}</p>
                <h1 className="mt-1 text-[22px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[27px]">{displayName}님, 반가워요 👋</h1>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#4E5968]">4주 동안 이력서·자기소개서를 완성하고 기업에 지원해요.</p>
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

          <div className="mt-7 grid gap-7 md:mt-9 lg:grid-cols-[1.55fr_1fr] lg:gap-8">
            {/* ── 메인: 4주 여정 퍼널 ── */}
            <div className="space-y-7 md:space-y-8">
              <div>
                <SectionTitle sub="각 주차를 눌러 진행하세요 · 완료할수록 결과물이 완성돼요">4주 여정</SectionTitle>
                <ol className="space-y-3">
                  {WEEKS.map((w) => {
                    const done = weekDoneCount(w.steps, data);
                    const total = w.steps.length;
                    const pct = total ? Math.round((done / total) * 100) : 0;
                    const status = done === total ? "완료" : done > 0 ? "진행 중" : "시작 전";
                    const tone = done === total ? "green" : done > 0 ? "blue" : "grey";
                    return (
                      <li key={w.week}>
                        <Link href={`/career-launch/week/${w.week}`} className="block">
                          <Card className="!p-4 transition hover:border-[#0B46E8]/40 md:!p-5">
                            <div className="flex items-start gap-3.5">
                              <span
                                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-[12.5px] font-black leading-none ${
                                  done === total ? "bg-emerald-500 text-white" : done > 0 ? "bg-[#0B46E8] text-white" : "border-2 border-[#D7DCE3] bg-white text-[#8B95A1]"
                                }`}
                              >
                                W{w.week}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                                  <p className="text-[15.5px] font-black tracking-[-0.01em] text-[#191F28] md:text-[16.5px]">{w.title}</p>
                                  <Pill tone={tone}>{status}</Pill>
                                </div>
                                <p className="mt-0.5 text-[12.5px] text-[#8B95A1]">{w.subtitle}</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="rounded-full bg-[#EDF1FD] px-2 py-0.5 text-[11px] font-bold text-[#0B46E8]">📦 {WEEK_DELIVERABLE[w.week]}</span>
                                  <span className="text-[11.5px] font-semibold text-[#8B95A1]">스텝 {done}/{total}</span>
                                </div>
                                <div className="mt-2">
                                  <ProgressBar value={pct} height={6} />
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* 결과물 */}
              <div>
                <SectionTitle sub="4주 동안 만들어지는 결과물">내 결과물</SectionTitle>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ResultTile
                    emoji="🧭"
                    title="취업 진단 · 직무 방향"
                    status={diag && typeof diag.percent === "number" ? `준비도 ${diag.percent}%${jobs.length ? ` · 직무 ${jobs.length}개` : ""}` : "진단 전"}
                    ready={Boolean(diag)}
                    href="/career-launch/diagnosis"
                    cta="보기"
                  />
                  <ResultTile
                    emoji="📄"
                    title="대표 이력서"
                    status={resumeReady ? "작성 중 · 크게보기" : "시작 전"}
                    ready={resumeReady}
                    href={resumeReady ? "/career-launch/resume-preview" : "/career-launch/resume-collect"}
                    cta={resumeReady ? "크게보기 ↗" : "시작하기"}
                    blank={resumeReady}
                  />
                  <ResultTile
                    emoji="📝"
                    title="자기소개서"
                    status={coverReady ? "작성 중 · 크게보기" : "시작 전"}
                    ready={coverReady}
                    href={coverReady ? "/career-launch/cover-preview" : "/career-launch/cover-collect"}
                    cta={coverReady ? "크게보기 ↗" : "시작하기"}
                    blank={coverReady}
                  />
                  <ResultTile emoji="🚀" title="기업 지원" status={data.progress.doneSteps?.includes("w4s3") ? "지원 완료" : "준비 중"} ready={Boolean(data.progress.doneSteps?.includes("w4s3"))} href="/career-launch/week/4" cta="보기" />
                </div>
              </div>
            </div>

            {/* ── 사이드바 ── */}
            <div className="space-y-7 md:space-y-8">
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

// 결과물 타일 — 상태 + 링크(크게보기/시작하기).
function ResultTile({ emoji, title, status, ready, href, cta, blank }: { emoji: string; title: string; status: string; ready: boolean; href: string; cta: string; blank?: boolean }) {
  return (
    <Card className="flex items-center justify-between gap-3 !p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl text-[18px] ${ready ? "bg-[#EAFFD1]" : "bg-[#F2F4F6]"}`}>{emoji}</span>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-bold text-[#191F28]">{title}</p>
          <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">{status}</p>
        </div>
      </div>
      <Link
        href={href}
        {...(blank ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={`shrink-0 rounded-lg px-3 py-2 text-[12.5px] font-bold transition ${ready ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "border border-[#D7DCE3] bg-white text-[#4E5968] hover:border-[#0B46E8]/40"}`}
      >
        {cta}
      </Link>
    </Card>
  );
}
