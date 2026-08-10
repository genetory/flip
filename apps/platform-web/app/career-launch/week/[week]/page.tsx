"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { WEEKS } from "../../../../lib/launch/data";
import { Card, SectionTitle } from "../../../../components/launch/ui";
import { WeekStepper } from "../../../../components/launch/week-stepper";
import { WeekDocs } from "../../../../components/launch/week-docs";
import { WeekGate } from "../../../../components/launch/week-gate";
import { WeekAutoFeedback } from "../../../../components/launch/week-auto-feedback";
import { WeekSeminar } from "../../../../components/launch/week-seminar";
import { CareerLaunchHeader } from "../../../../components/launch/CareerLaunchHeader";
import { Footer } from "../../../../components/site/Footer";
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        {/* 포지션 탐색 페이지와 동일한 컨텐츠 폭(max-w-6xl). 모바일 1단 / 데스크탑 좌 스텝 + 우 사이드바 2단 */}
        <div className="mx-auto w-full max-w-6xl px-5 pt-6 md:pt-10">
          {/* 뒤로 + 헤더 */}
          <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            {t("← 대시보드", "← Dashboard", "← 仪表板", "← Bảng điều khiển", "← ダッシュボード", "← Dasbor")}
          </Link>
          <div className="mt-3">
            <p className="text-[28px] font-black leading-none tracking-[-0.02em] text-[#0B46E8] md:text-[34px]">Week {plan.week}</p>
            <p className="mt-2 text-[12.5px] font-normal text-[#8B95A1]">{weekText(plan.week, "subtitle")}</p>
            <h1 className="mt-3 text-[19px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">{weekText(plan.week, "title")}</h1>
          </div>

          {/* 이번 주 목표 배너 (전체 폭) */}
          <div className="mt-5 rounded-2xl border border-[#CFE0FF] bg-[#EDF1FD] p-4 md:p-5">
            <p className="text-[12px] font-bold text-[#0B46E8]">{t("이번 주 목표", "This week's goal", "本周目标", "Mục tiêu tuần này", "今週の目標", "Target minggu ini")}</p>
            <p className="mt-1 break-keep text-[14px] font-semibold leading-relaxed text-[#0B1227] md:text-[15px]">
              {weekText(plan.week, "goal")
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
              <SectionTitle sub={t("끝낸 단계는 번호를 콕 눌러 체크해요", "Tap the number to check off a step you've finished", "点击序号即可勾选已完成的步骤", "Nhấn vào số để đánh dấu bước đã hoàn thành", "終えたステップは番号をタップしてチェック", "Ketuk nomor untuk menandai langkah yang selesai")}>{t("이번 주 해야 할 일", "This week's to-dos", "本周待办", "Việc cần làm tuần này", "今週やること", "Yang harus dilakukan minggu ini")}</SectionTitle>
              <WeekGate week={plan.week}>
                <Card className="md:!p-6">
                  {/* 4주차는 스텝이 독립적이라 순서 잠금 없이 자유롭게 진행 */}
                  <WeekStepper steps={plan.steps} sequential={plan.week !== 4} />
                </Card>
              </WeekGate>
            </div>

            {/* ── 사이드바 ── */}
            <div className="min-w-0 space-y-7">
              {/* 세미나 정보 — 운영자가 기수에 입력한 일정 */}
              <WeekSeminar week={plan.week} />

              {/* 피드백 — 1~3주차만 결과물 기반 자동 코치 피드백(4주차는 없음) */}
              {plan.week <= 3 ? (
                <div>
                  <SectionTitle>{t("피드백", "Feedback", "反馈", "Phản hồi", "フィードバック", "Umpan balik")}</SectionTitle>
                  <WeekAutoFeedback week={plan.week} />
                </div>
              ) : null}

              {/* 내 이력서·자기소개서 — 2주차부터 미리보기(세미나·피드백 아래) */}
              {plan.week >= 2 ? <WeekDocs week={plan.week} /> : null}

              {/* 4주 전체 진행 — 모든 주차 페이지에 동일하게 노출 */}
              <div>
                <SectionTitle>{t("4주 전체 진행", "Full 4-week progress", "4周整体进度", "Tiến độ toàn bộ 4 tuần", "4週間全体の進捗", "Progres 4 minggu penuh")}</SectionTitle>
                <div className="space-y-3">
                  {WEEKS.map((w) => {
                    const isCurrent = w.week === plan.week;
                    const inner = (
                      <Card className={`flex items-center justify-between !p-4 ${isCurrent ? "!border-[#0B46E8]/40 ring-1 ring-[#0B46E8]/20" : ""}`}>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#0B46E8] text-[12.5px] font-black leading-none text-white">W{w.week}</span>
                          <div className="min-w-0">
                            <p className="truncate text-[13.5px] font-bold text-[#191F28]">{weekText(w.week, "title")}</p>
                            {isCurrent ? <p className="text-[11px] font-bold text-[#0B46E8]">{t("보는 중", "Viewing", "查看中", "Đang xem", "表示中", "Sedang dilihat")}</p> : null}
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

          {/* 최종 주차 CTA — 대시보드로 이동해 완성한 내 결과물을 확인 */}
          {plan.week === 4 ? (
            <Link href="/career-launch/dashboard" className="mt-8 flex items-center justify-center rounded-xl bg-[#B7FF5A] py-3.5 text-[14px] font-bold text-[#111] transition hover:brightness-105">
              {t("완성한 내 결과물 보러 가기 →", "See my finished deliverables →", "去查看我完成的成果 →", "Xem kết quả đã hoàn thành của tôi →", "完成した私の成果物を見に行く →", "Lihat hasil saya yang sudah selesai →")}
            </Link>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
