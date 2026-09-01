"use client";

// UX Phase 5 — 나의 성장. 개인 변화 우선, 점수는 이유와 함께. 데이터 없으면 0점/빈 그래프 금지.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Circle, TrendUp } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../components/AplyFooter";
import { EmptyState, ErrorState, CardSkeleton, DashboardSection } from "../../../components/launch/dashboard-states";
import { LeagueCard } from "../../../components/launch/LeagueCard";
import { fetchGrowth, type GrowthVM } from "../../../lib/launch/hub-client";
import { trackCareerFunnel } from "../../../lib/analytics";
import { useLaunchT } from "../../../lib/launch/i18n";

// 막대 비교(레이더 대신, 접근성·텍스트 병기).
function AxisBar({ label, initial, final }: { label: string; initial: number; final: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12.5px]">
        <span className="text-[#4E5968]">{label}</span>
        <span className="tabular-nums text-[#191F28]">
          {initial} → <b className={final >= initial ? "text-[#0A9B59]" : "text-[#C0392B]"}>{final}</b>
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#F2F4F6]">
        <div className="h-full rounded-full bg-[#3182F6]" style={{ width: `${Math.min(100, final)}%` }} />
      </div>
    </div>
  );
}

export default function GrowthDashboardPage() {
  const t = useLaunchT();
  const [vm, setVm] = useState<GrowthVM | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const WEEK_LABEL = [
    t("Week 1 목표 직무", "Week 1 Target role", "Week 1 目标职务", "Tuần 1 Nghề mục tiêu", "Week 1 目標職種", "Minggu 1 Peran target"),
    t("Week 2 지원 패키지", "Week 2 Application package", "Week 2 申请材料包", "Tuần 2 Bộ hồ sơ", "Week 2 応募パッケージ", "Minggu 2 Paket lamaran"),
    t("Week 3 최초 면접", "Week 3 First interview", "Week 3 首次面试", "Tuần 3 Phỏng vấn đầu", "Week 3 初回面接", "Minggu 3 Wawancara pertama"),
    t("Week 4 오답 해결·최종 면접", "Week 4 Fixes & final interview", "Week 4 纠错与终面", "Tuần 4 Sửa lỗi & phỏng vấn cuối", "Week 4 復習・最終面接", "Minggu 4 Perbaikan & wawancara akhir")
  ];
  const load = () => {
    setPhase("loading");
    void fetchGrowth()
      .then((d) => {
        setVm(d);
        setPhase("ready");
        trackCareerFunnel("career_growth_viewed", {});
      })
      .catch(() => setPhase("error"));
  };
  useEffect(load, []);

  const cmp = vm?.interviewComparison;

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FB]">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-8">
          <p className="cl-eyebrow">4-Week Journey</p>
          <h1 className="cl-display mt-1.5">{t("나의 성장", "My growth", "我的成长", "Sự phát triển của tôi", "私の成長", "Pertumbuhanku")}</h1>
          <p className="cl-lead mt-2.5 max-w-[52ch]">
            {t(
              "처음 시작했을 때와 비교해 직무 방향, 지원서, 면접 답변이 어떻게 달라졌는지 확인해요.",
              "See how your role direction, application, and interview answers changed compared to when you started.",
              "看看与刚开始时相比，你的职业方向、申请材料和面试回答有了怎样的变化。",
              "Xem hướng nghề, hồ sơ và câu trả lời phỏng vấn đã thay đổi thế nào so với khi bắt đầu.",
              "始めた頃と比べて、職種の方向・応募書類・面接の答えがどう変わったか確認しましょう。",
              "Lihat bagaimana arah peran, lamaran, dan jawaban wawancaramu berubah sejak awal."
            )}
          </p>
          <hr className="cl-rule mt-5" />

          {phase === "loading" ? (
            <div className="mt-5 flex flex-col gap-3">
              <CardSkeleton height={90} />
              <CardSkeleton height={130} />
              <CardSkeleton height={130} />
            </div>
          ) : phase === "error" || !vm ? (
            <div className="mt-5">
              <ErrorState onRetry={load} />
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-7">
              {/* 성장 요약 한 문장 */}
              <div className="rounded-2xl bg-gradient-to-br from-[#0A9B59] to-[#0B7E4A] p-5 text-white">
                <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white/85">
                  <TrendUp size={15} weight="bold" /> {t("나의 변화", "My change", "我的变化", "Thay đổi của tôi", "私の変化", "Perubahanku")}
                </div>
                <p className="mt-2 text-[15px] font-semibold leading-relaxed">{vm.summarySentence}</p>
              </div>

              {/* 4주 여정 */}
              <DashboardSection title={t("4주 여정", "4-week journey", "4周旅程", "Hành trình 4 tuần", "4週間のジャーニー", "Perjalanan 4 minggu")} sub={t("각 주차에서 얻은 결과", "What you gained each week", "每周的收获", "Kết quả mỗi tuần", "各週で得た成果", "Hasil tiap minggu")}>
                <div className="flex flex-col gap-2">
                  {vm.weekOutcomes.map((w, i) => (
                    <div key={w.week} className="flex items-center gap-2.5 rounded-xl border border-[#EEF1F5] bg-white p-3">
                      {w.done ? <CheckCircle size={18} weight="fill" className="text-[#0A9B59]" /> : <Circle size={18} className="text-[#C9CDD2]" />}
                      <span className="text-[11.5px] font-bold text-[#8B95A1]">Week {w.week}</span>
                      <span className="text-[13.5px] text-[#191F28]">{w.label || WEEK_LABEL[i]}</span>
                    </div>
                  ))}
                </div>
              </DashboardSection>

              {/* 면접 변화 — 데이터 있을 때만(0점 그래프 금지) */}
              <DashboardSection title={t("면접 변화", "Interview change", "面试变化", "Thay đổi phỏng vấn", "面接の変化", "Perubahan wawancara")} sub={t("최초 대비 최종", "First vs final", "首次对比最终", "Đầu so với cuối", "最初と最終の比較", "Awal vs akhir")}>
                {cmp?.available && cmp.initialScore != null && cmp.finalScore != null ? (
                  <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] text-[#8B95A1]">{t("최초 → 최종", "First → final", "首次 → 最终", "Đầu → cuối", "最初 → 最終", "Awal → akhir")}</p>
                      <p className="text-[20px] font-bold tabular-nums text-[#191F28]">
                        {cmp.initialScore} → {cmp.finalScore}
                        {cmp.delta != null ? <span className="ml-1.5 text-[14px] text-[#0A9B59]">({cmp.delta >= 0 ? "+" : ""}{cmp.delta})</span> : null}
                      </p>
                    </div>
                    {cmp.axes && cmp.axes.length > 0 ? (
                      <div className="mt-4 flex flex-col gap-3" onMouseEnter={() => trackCareerFunnel("career_interview_comparison_viewed")}>
                        {cmp.axes.map((a) => (
                          <AxisBar key={a.key} label={a.label} initial={a.initial} final={a.final} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <EmptyState
                    title={t("아직 비교할 성장 데이터가 없어요", "No growth data to compare yet", "暂无可对比的成长数据", "Chưa có dữ liệu để so sánh", "まだ比較できる成長データがありません", "Belum ada data pertumbuhan untuk dibandingkan")}
                    description={t("첫 실전면접을 완료하면 이후 답변과 비교할 수 있어요.", "Finish your first mock interview to compare later answers.", "完成首次实战面试后即可与之后的回答对比。", "Hoàn thành phỏng vấn thử đầu tiên để so sánh câu trả lời sau.", "初回の実戦模擬面接を終えると、以降の答えと比較できます。", "Selesaikan wawancara simulasi pertama untuk membandingkan jawaban berikutnya.")}
                    ctaLabel={t("첫 실전면접 시작하기", "Start your first mock interview", "开始首次实战面试", "Bắt đầu phỏng vấn thử đầu tiên", "初回の実戦模擬面接を始める", "Mulai wawancara simulasi pertama")}
                    href="/career-launch/week/3"
                  />
                )}
              </DashboardSection>

              {/* 해결한 약점 */}
              <DashboardSection title={t("해결한 약점", "Weaknesses fixed", "已解决的弱点", "Điểm yếu đã khắc phục", "解決した弱点", "Kelemahan yang diperbaiki")}>
                <div className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
                  <p className="text-[14px] font-bold text-[#191F28]">
                    {t("오답", "Corrections", "纠错", "Sửa lỗi", "復習", "Perbaikan")} {vm.correctionSummary.passed}
                    <span className="text-[13px] font-normal text-[#8B95A1]">/{vm.correctionSummary.total} {t("해결", "resolved", "已解决", "đã xong", "解決", "selesai")}</span>
                  </p>
                  {vm.remainingWeaknesses.length > 0 ? (
                    <Link href="/career-launch/corrections" onClick={() => trackCareerFunnel("career_remaining_weakness_opened")} className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#1B64DA]">
                      {t(`아직 남은 약점 ${vm.remainingWeaknesses.length}개 보기`, `See ${vm.remainingWeaknesses.length} weaknesses left`, `查看剩余 ${vm.remainingWeaknesses.length} 个弱点`, `Xem ${vm.remainingWeaknesses.length} điểm yếu còn lại`, `残りの弱点 ${vm.remainingWeaknesses.length}件を見る`, `Lihat ${vm.remainingWeaknesses.length} kelemahan tersisa`)} <ArrowRight size={12} weight="bold" />
                    </Link>
                  ) : null}
                </div>
              </DashboardSection>

              {/* 다음 30일 + 리포트 */}
              <div className="flex flex-col gap-2">
                <Link href="/career-launch/week/4" onClick={() => trackCareerFunnel("career_thirty_day_plan_viewed")} className="flex items-center gap-2 rounded-2xl border border-[#EEF1F5] bg-white p-4 text-[13.5px] font-semibold text-[#191F28]">
                  {t("다음 30일 행동계획 보기", "See your 30-day action plan", "查看未来30天行动计划", "Xem kế hoạch hành động 30 ngày", "次の30日行動計画を見る", "Lihat rencana aksi 30 hari")} <ArrowRight size={14} className="ml-auto text-[#C9CDD2]" />
                </Link>
              </div>

              {/* 리그·경쟁 — 보조 영역(하단) */}
              <DashboardSection title={t("함께하는 사람들", "Doing this together", "同行的人", "Cùng đồng hành", "一緒に取り組む仲間", "Bersama-sama")} sub={t("경쟁보다 내 성장을 먼저", "Your growth before competition", "成长优先于竞争", "Phát triển trước cạnh tranh", "競争より自分の成長を優先", "Pertumbuhan sebelum kompetisi")}>
                <LeagueCard />
              </DashboardSection>
            </div>
          )}
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
