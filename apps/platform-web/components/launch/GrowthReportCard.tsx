"use client";

// Week 4 최종 산출물 — 성장 리포트(최초·최종 비교 + 개선점 + 남은 약점 + 30일/7일 행동계획 +
// 코치 메시지). 데이터·생성은 백엔드(generateGrowth)에 있었지만 학생용 표시 화면이 없어 신설.
// AI 생성 비용이 있으므로 명시적 버튼으로만 생성/조회(캐시 존재 시 재생성 안 함).
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleNotch, TrendUp, Target, ListChecks, ChatCircleText, WarningCircle } from "@phosphor-icons/react";
import { generateGrowth, type GrowthReport } from "../../lib/launch/week34";
import { useLaunchT } from "../../lib/launch/i18n";
import { trackCareerFunnel } from "../../lib/analytics";

type Phase = "idle" | "loading" | "ready" | "needsInitial" | "needsFinal" | "error";

export function GrowthReportCard() {
  const t = useLaunchT();
  const [phase, setPhase] = useState<Phase>("idle");
  const [report, setReport] = useState<GrowthReport | null>(null);

  const load = async () => {
    setPhase("loading");
    try {
      const r = await generateGrowth();
      if (r.needsInitialMock) return setPhase("needsInitial");
      if (r.needsFinalMock) return setPhase("needsFinal");
      if (!r.report) return setPhase("error");
      setReport(r.report);
      setPhase("ready");
      trackCareerFunnel("career_growth_report_viewed");
    } catch {
      setPhase("error");
    }
  };

  // 아직 생성 전 — 설명 + 받기 버튼.
  if (phase !== "ready") {
    return (
      <div className="rounded-2xl border border-[#EEF1F5] bg-white p-6">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]"><TrendUp className="h-6 w-6" weight="duotone" aria-hidden /></span>
        <h3 className="mt-4 text-[16px] font-black text-[#0B1227]">{t("성장 리포트 · 30일 계획", "Growth report · 30-day plan", "成长报告·30天计划", "Báo cáo phát triển · kế hoạch 30 ngày", "成長レポート・30日計画", "Laporan pertumbuhan · rencana 30 hari")}</h3>
        <p className="mt-1.5 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">{t("최초·최종 모의면접을 비교해 얼마나 성장했는지, 남은 약점과 앞으로 30일 행동계획을 정리해드려요.", "We compare your first and final mock interviews to show your growth, remaining gaps, and a 30-day action plan.", "对比首次与最终模拟面试，展示你的成长、剩余弱点与30天行动计划。", "So sánh phỏng vấn thử đầu và cuối để cho thấy sự tiến bộ, điểm còn yếu và kế hoạch 30 ngày.", "初回・最終模擬面接を比較して成長・残る弱点・30日行動計画を整理します。", "Membandingkan wawancara simulasi pertama & akhir untuk menunjukkan pertumbuhan, kekurangan, dan rencana 30 hari.")}</p>

        {phase === "needsInitial" || phase === "needsFinal" ? (
          <div className="mt-4 rounded-xl bg-[#FFFBEB] px-4 py-3 text-[12.5px] font-semibold text-[#C77700]">
            {phase === "needsInitial"
              ? t("먼저 3주차 최초 모의면접을 완료해주세요.", "Finish your Week 3 first mock interview first.", "请先完成第3周首次模拟面试。", "Hãy hoàn thành phỏng vấn thử đầu (Tuần 3) trước.", "まずWeek3の初回模擬面接を完了してください。", "Selesaikan wawancara simulasi pertama (Minggu 3) dulu.")
              : t("먼저 이번 주 최종 모의면접을 완료해주세요.", "Finish this week's final mock interview first.", "请先完成本周最终模拟面试。", "Hãy hoàn thành phỏng vấn thử cuối tuần này trước.", "まず今週の最終模擬面接を完了してください。", "Selesaikan wawancara simulasi akhir minggu ini dulu.")}
          </div>
        ) : phase === "error" ? (
          <p className="mt-4 rounded-xl bg-[#FDECEC] px-4 py-3 text-[12.5px] font-semibold text-[#F04452]">{t("리포트를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't load the report. Please try again shortly.", "无法加载报告，请稍后重试。", "Không tải được báo cáo. Thử lại sau.", "レポートを読み込めませんでした。少し後にお試しください。", "Gagal memuat laporan. Coba lagi.")}</p>
        ) : null}

        <button type="button" onClick={() => void load()} disabled={phase === "loading"} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0B46E8] px-5 py-3 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
          {phase === "loading" ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : null}
          {phase === "needsInitial" || phase === "needsFinal" ? t("다시 확인", "Check again", "重新确认", "Kiểm tra lại", "再確認", "Cek lagi") : t("성장 리포트 받기", "Get my growth report", "获取成长报告", "Nhận báo cáo", "成長レポートを受け取る", "Ambil laporan")} <ArrowRight className="h-4 w-4" weight="bold" aria-hidden />
        </button>
      </div>
    );
  }

  // 생성 완료 — 리포트 렌더.
  const g = report?.growthData;
  const na = report?.nextActions;
  const List = ({ icon: Icon, title, items, tone }: { icon: typeof Target; title: string; items?: string[]; tone: string }) =>
    items && items.length > 0 ? (
      <div className="rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-4">
        <p className="flex items-center gap-1.5 text-[13px] font-black text-[#191F28]"><Icon className="h-4 w-4" weight="bold" style={{ color: tone }} aria-hidden /> {title}</p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {items.map((it, i) => (
            <li key={i} className="flex gap-1.5 break-keep text-[13px] leading-relaxed text-[#4E5968]"><span aria-hidden style={{ color: tone }}>·</span>{it}</li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#EEF1F5] bg-white p-6">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDF1FD] text-[#0B46E8]"><TrendUp className="h-5 w-5" weight="duotone" aria-hidden /></span>
        <h3 className="text-[16px] font-black text-[#0B1227]">{t("나의 성장 리포트", "My growth report", "我的成长报告", "Báo cáo phát triển của tôi", "私の成長レポート", "Laporan pertumbuhanku")}</h3>
      </div>

      {/* 최초 → 최종 비교 */}
      {g ? (
        <div className="rounded-2xl bg-[#0B1227] p-5 text-white">
          <div className="flex items-end justify-center gap-3">
            <div className="text-center"><p className="text-[11px] font-bold text-white/50">{t("최초", "First", "首次", "Đầu", "初回", "Awal")}</p><p className="text-[26px] font-black leading-none tabular-nums text-white/80">{g.initialScore}</p></div>
            <ArrowRight className="mb-1 h-5 w-5 text-white/40" weight="bold" aria-hidden />
            <div className="text-center"><p className="text-[11px] font-bold text-[#7BB0FF]">{t("최종", "Final", "最终", "Cuối", "最終", "Akhir")}</p><p className="text-[34px] font-black leading-none tabular-nums" style={{ color: "#7BB0FF" }}>{g.finalScore}</p></div>
          </div>
          <p className="mt-3 text-center text-[12.5px] font-bold text-white/70">
            {g.scoreDelta >= 0 ? "▲ " : "▼ "}{Math.abs(g.scoreDelta)}{t("점", " pts", "分", " điểm", "点", " poin")} · {t("취약점", "Weaknesses", "弱点", "Điểm yếu", "弱点", "Kelemahan")} {g.weaknessResolvedCount}/{g.weaknessResolvedCount + g.remainingWeaknessCount} {t("해결", "resolved", "已解决", "đã giải quyết", "解決", "teratasi")}
          </p>
        </div>
      ) : null}

      {na?.coachMessage ? (
        <div className="rounded-2xl bg-[#EDF1FD] p-4">
          <p className="flex items-center gap-1.5 text-[12px] font-black uppercase tracking-[0.08em] text-[#0B46E8]"><ChatCircleText className="h-4 w-4" weight="fill" aria-hidden /> {t("코치 메시지", "Coach's message", "教练寄语", "Lời nhắn HLV", "コーチのメッセージ", "Pesan pelatih")}</p>
          <p className="mt-1.5 break-keep text-[13.5px] leading-relaxed text-[#191F28]">{na.coachMessage}</p>
        </div>
      ) : null}

      <List icon={TrendUp} tone="#0A9B59" title={t("가장 개선된 점", "Most improved", "最大改善", "Cải thiện nhất", "最も改善", "Paling meningkat")} items={na?.mostImproved} />
      <List icon={WarningCircle} tone="#C77700" title={t("남은 약점", "Remaining gaps", "剩余弱点", "Điểm còn yếu", "残る弱点", "Kekurangan tersisa")} items={report?.remainingWeaknesses} />
      <List icon={ListChecks} tone="#0B46E8" title={t("다음 7일 계획", "Next 7 days", "未来7天计划", "7 ngày tới", "次の7日計画", "7 hari ke depan")} items={na?.next7Days} />
      <List icon={Target} tone="#0B46E8" title={t("30일 행동계획", "30-day action plan", "30天行动计划", "Kế hoạch 30 ngày", "30日行動計画", "Rencana 30 hari")} items={na?.next30Days} />
      <List icon={Target} tone="#8B95A1" title={t("면접 당일 팁", "Interview-day tips", "面试当天提示", "Mẹo ngày PV", "面接当日のコツ", "Tips hari-H")} items={na?.interviewDayTips} />

      <Link href="/career-launch/corrections" className="mt-1 inline-flex items-center gap-1 text-[13px] font-bold text-[#0B46E8]">
        {t("오답노트 복습하기", "Review interview notes", "复习错题本", "Ôn sổ lỗi", "復習ノートを見る", "Tinjau catatan")} <ArrowRight className="h-3.5 w-3.5" weight="bold" aria-hidden />
      </Link>
    </div>
  );
}
