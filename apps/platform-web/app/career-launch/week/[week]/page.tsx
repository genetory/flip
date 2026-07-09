import { notFound } from "next/navigation";
import Link from "next/link";
import { WEEKS } from "../../../../lib/launch/data";
import { Card, Pill, SectionTitle } from "../../../../components/launch/ui";
import { WeekStepper } from "../../../../components/launch/week-stepper";
import { WeekDocs } from "../../../../components/launch/week-docs";
import { Header } from "../../../../components/site/Header";
import { Footer } from "../../../../components/site/Footer";

// 5~8. Week 1~4 미션 페이지 (동적 라우트)
export default async function LaunchWeekPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  const n = Number(week);
  const plan = WEEKS.find((w) => w.week === n);
  if (!plan) notFound();

  const feedbackPill = {
    none: <Pill tone="grey">피드백 없음</Pill>,
    pending: <Pill tone="amber">피드백 대기 중</Pill>,
    done: <Pill tone="green">피드백 완료</Pill>
  }[plan.feedback.status];
  const doneCount = plan.steps.filter((s) => s.done).length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16">
        {/* 포지션 탐색 페이지와 동일한 컨텐츠 폭(max-w-6xl). 모바일 1단 / 데스크탑 좌 스텝 + 우 사이드바 2단 */}
        <div className="mx-auto w-full max-w-6xl px-5 pt-6 md:pt-10">
          {/* 뒤로 + 헤더 */}
          <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            ← 대시보드
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-[#0B46E8] text-[17px] font-black text-white">W{plan.week}</span>
            <div>
              <p className="text-[12.5px] font-bold text-[#8B95A1]">Week {plan.week} · {plan.subtitle}</p>
              <h1 className="text-[19px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">{plan.title}</h1>
            </div>
          </div>

          {/* 이번 주 목표 배너 (전체 폭) */}
          <div className="mt-5 rounded-2xl border border-[#CFE0FF] bg-[#EDF1FD] p-4 md:p-5">
            <p className="text-[12px] font-bold text-[#0B46E8]">이번 주 목표</p>
            <p className="mt-1 break-keep text-[14px] font-semibold leading-relaxed text-[#0B1227] md:text-[15px]">
              {plan.goal
                .split(/(?<=\.)\s+/)
                .filter(Boolean)
                .map((line, li) => (
                  <span key={li} className="block">
                    {line}
                  </span>
                ))}
            </p>
          </div>

          <div className="mt-7 grid gap-7 md:mt-9 lg:grid-cols-[1.55fr_1fr] lg:gap-8">
            {/* ── 메인: 스텝별 해야 할 일 ── */}
            <div className="min-w-0">
              <SectionTitle sub={`총 ${plan.steps.length}단계 중 ${doneCount}단계 완료했어요 · 끝낸 단계는 번호를 콕 눌러 체크해요`}>
                이번 주 해야 할 일
              </SectionTitle>
              <Card className="md:!p-6">
                <WeekStepper steps={plan.steps} />
              </Card>
            </div>

            {/* ── 사이드바 ── */}
            <div className="min-w-0 space-y-7">
              {/* 세미나 정보 */}
              <div>
                <SectionTitle>세미나 정보</SectionTitle>
                <Card className="flex items-start gap-3">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[#EDF1FD] text-[20px]">{plan.seminar.online ? "💻" : "📍"}</span>
                  <div>
                    <p className="text-[14px] font-bold text-[#191F28]">{plan.seminar.date}</p>
                    <p className="mt-0.5 text-[13px] text-[#4E5968]">{plan.seminar.time}</p>
                    <p className="text-[12.5px] text-[#8B95A1]">{plan.seminar.place}</p>
                  </div>
                </Card>
              </div>

              {/* 피드백 상태 */}
              <div>
                <SectionTitle>피드백</SectionTitle>
                <Card>
                  <div className="flex items-center justify-between">
                    <span className="text-[13.5px] font-semibold text-[#4E5968]">피드백 상태</span>
                    {feedbackPill}
                  </div>
                  {plan.feedback.note ? <p className="mt-3 rounded-xl bg-[#F6F8FB] p-3.5 text-[13.5px] leading-relaxed text-[#333D4B]">“{plan.feedback.note}”</p> : null}
                </Card>
              </div>

              {/* 내 이력서·자소서 — 2주차부터 미리보기(세미나·피드백 아래) */}
              {plan.week >= 2 ? <WeekDocs week={plan.week} /> : null}

              {/* 4주 전체 진행 — 모든 주차 페이지에 동일하게 노출 */}
              <div>
                <SectionTitle>4주 전체 진행</SectionTitle>
                <div className="space-y-3">
                  {WEEKS.map((w) => {
                    const isCurrent = w.week === plan.week;
                    const inner = (
                      <Card className={`flex items-center justify-between !p-4 ${isCurrent ? "!border-[#0B46E8]/40 ring-1 ring-[#0B46E8]/20" : ""}`}>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#0B46E8] text-[12.5px] font-black leading-none text-white">W{w.week}</span>
                          <div className="min-w-0">
                            <p className="truncate text-[13.5px] font-bold text-[#191F28]">{w.title}</p>
                            {isCurrent ? <p className="text-[11px] font-bold text-[#0B46E8]">보는 중</p> : null}
                          </div>
                        </div>
                      </Card>
                    );
                    if (isCurrent) {
                      return (
                        <div key={w.week}>{inner}</div>
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
            </div>
          </div>

          {/* 최종 주차 CTA */}
          {plan.week === 4 ? (
            <Link href="/career-launch/profile" className="mt-8 flex items-center justify-center rounded-xl bg-[#B7FF5A] py-3.5 text-[14px] font-bold text-[#111] transition hover:brightness-105">
              Global Talent Profile 완성하기 →
            </Link>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
