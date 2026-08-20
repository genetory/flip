"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CaretRight, ArrowRight } from "@phosphor-icons/react";
import { WEEKS } from "../../../../lib/launch/data";
import { SectionTitle } from "../../../../components/launch/ui";
import { WeekStepper } from "../../../../components/launch/week-stepper";
import { WeekDocs } from "../../../../components/launch/week-docs";
import { WeekGate } from "../../../../components/launch/week-gate";
import { WeekAutoFeedback } from "../../../../components/launch/week-auto-feedback";
import { InterviewPrepChecklist } from "../../../../components/launch/InterviewPrepChecklist";
import { WeekSeminar } from "../../../../components/launch/week-seminar";
import { CareerLaunchHeader } from "../../../../components/launch/CareerLaunchHeader";
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
  // 주차 테마 일러스트(기존 자산) — 진단·직무 / 이력서 / 자소서 / 면접.
  const WEEK_IMAGE: Record<number, string> = {
    1: "/img_ai_analyze.webp",
    2: "/img_resume.webp",
    3: "/img_coverletter.webp",
    4: "/img_fake_interview.webp"
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          {/* 뒤로 */}
          <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            {t("← 대시보드", "← Dashboard", "← 仪表板", "← Bảng điều khiển", "← ダッシュボード", "← Dasbor")}
          </Link>

          {/* 매거진 마스트헤드 — 에디토리얼 라벨 + 헤드라인 + 데크 (+ 주차 테마 일러스트) */}
          <div className="mt-3.5 flex items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{weekLabel(plan.week)}</p>
              <h1 className="mt-2.5 break-keep text-[26px] font-black leading-[1.18] tracking-[-0.03em] text-[#191F28] md:text-[34px]">{weekText(plan.week, "title")}</h1>
              <p className="mt-2.5 max-w-[560px] break-keep text-[14.5px] leading-relaxed text-[#4E5968] md:text-[15.5px]">{weekText(plan.week, "subtitle")}</p>
            </div>
            {WEEK_IMAGE[plan.week] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={WEEK_IMAGE[plan.week]} alt="" className="hidden h-auto w-40 shrink-0 rounded-2xl sm:block md:w-52" loading="lazy" />
            ) : null}
          </div>

          {/* 이번 주 목표 — 뉴트럴 콜아웃 */}
          <div className="mt-6 rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-5 md:p-6">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("이번 주 목표", "This week's goal", "本周目标", "Mục tiêu tuần này", "今週の目標", "Target minggu ini")}</p>
            <p className="mt-2 break-keep text-[14.5px] font-semibold leading-relaxed text-[#191F28] md:text-[15.5px]">
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

          {/* ── 단일 컬럼 매거진 본문 ── */}
          <div className="mt-9 flex flex-col gap-10 md:mt-10">
            {/* 이번 주 해야 할 일 */}
            <div>
              <SectionTitle sub={t("끝낸 단계는 번호를 콕 눌러 체크해요", "Tap the number to check off a step you've finished", "点击序号即可勾选已完成的步骤", "Nhấn vào số để đánh dấu bước đã hoàn thành", "終えたステップは番号をタップしてチェック", "Ketuk nomor untuk menandai langkah yang selesai")}>{t("이번 주 해야 할 일", "This week's to-dos", "本周待办", "Việc cần làm tuần này", "今週やること", "Yang harus dilakukan minggu ini")}</SectionTitle>
              <WeekGate week={plan.week}>
                <div className="rounded-3xl border border-[#EEF1F5] bg-white p-5 md:p-6">
                  {/* 4주차는 스텝이 독립적이라 순서 잠금 없이 자유롭게 진행 */}
                  <WeekStepper steps={plan.steps} sequential={plan.week !== 4} />
                </div>
              </WeekGate>
            </div>

            {/* 세미나 정보 — 운영자가 기수에 입력한 일정 */}
            <WeekSeminar week={plan.week} />

            {/* 피드백 — 1~3주차만 결과물 기반 자동 코치 피드백(4주차는 없음) */}
            {plan.week <= 3 ? (
              <div>
                <SectionTitle>{t("피드백", "Feedback", "反馈", "Phản hồi", "フィードバック", "Umpan balik")}</SectionTitle>
                <WeekAutoFeedback week={plan.week} />
              </div>
            ) : null}

            {/* 4주차 — 면접 준비 체크리스트(점수 대신 준비도로 자신감) */}
            {plan.week === 4 ? (
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
                        <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2] transition group-hover:translate-x-0.5" weight="bold" aria-hidden />
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
          </div>

          {/* 최종 주차 CTA — 흑백 다크 카드(대시보드 '다음 할 일'과 동일한 결) */}
          {plan.week === 4 ? (
            <Link
              href="/career-launch/dashboard"
              className="group mt-10 flex items-center justify-between gap-4 rounded-2xl bg-[#191F28] p-5 transition hover:bg-[#0B1227] md:p-6"
            >
              <span className="text-[15px] font-bold text-white md:text-[16.5px]">{t("완성한 내 결과물 보러 가기", "See my finished deliverables", "去查看我完成的成果", "Xem kết quả đã hoàn thành của tôi", "完成した私の成果物を見に行く", "Lihat hasil saya yang sudah selesai")}</span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:bg-white/20 group-hover:translate-x-0.5"><ArrowRight className="h-[18px] w-[18px]" weight="bold" aria-hidden /></span>
            </Link>
          ) : null}
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
