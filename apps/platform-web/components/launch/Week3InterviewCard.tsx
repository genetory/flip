"use client";

// Week 3 '실전 모의면접 & 약점 발견'(Phase 6) — 종합 실전면접(진행 중 점수 미노출) → 종합 리포트 → 취약패턴 → 핵심 오답노트.
import { useEffect, useRef, useState } from "react";
import { CircleNotch, Sparkle, CheckCircle } from "@phosphor-icons/react";
import { Card, Pill, SectionTitle } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";
import { trackCareerFunnel } from "../../lib/analytics";
import { fetchWeek3, type Week3Status } from "../../lib/launch/week34";
import { CareerChatModal } from "./CareerChatModal";
import { Week3InterviewChat } from "./Week3InterviewChat";

export function Week3InterviewCard() {
  const t = useLaunchT();
  const [status, setStatus] = useState<Week3Status | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [showChat, setShowChat] = useState(false);
  const alive = useRef(true);

  const reload = async () => {
    try {
      const s = await fetchWeek3();
      if (alive.current) {
        setStatus(s);
        setPhase("ready");
      }
    } catch {
      if (alive.current) setPhase("error");
    }
  };
  useEffect(() => {
    alive.current = true;
    trackCareerFunnel("career_week3_started");
    void reload();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 면접 채팅 모달 닫기 → 상태 새로고침(완료 시 리포트·취약패턴이 카드에 나타남).
  const closeChat = () => {
    setShowChat(false);
    void reload();
  };

  if (phase === "loading") return <Card><p className="flex items-center gap-2 py-6 text-[13px] text-[#8B95A1]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> {t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p></Card>;
  if (phase === "error" || !status) return <Card><p className="py-4 text-[13px] text-[#8B95A1]">{t("불러오지 못했어요.", "Couldn't load.", "加载失败。", "Không tải được.", "読み込めませんでした。", "Gagal memuat.")}</p><button type="button" onClick={() => void reload()} className="mt-2 rounded-lg border border-[#E5E8EB] px-3 py-1.5 text-[12px] font-semibold text-[#4E5968]">{t("다시 시도", "Retry", "重试", "Thử lại", "再試行", "Coba lagi")}</button></Card>;

  const initialDone = status.sessions.some((s) => s.sessionType === "initial_mock" && s.status === "completed");

  return (
    <div className="space-y-4">
      {showChat ? <CareerChatModal onClose={closeChat}><Week3InterviewChat embedded onClose={closeChat} /></CareerChatModal> : null}
      <Card>
        <div className="flex items-center justify-between gap-2">
          <SectionTitle sub={t("공고·서류 기반 종합 실전면접으로 약점을 찾아요", "Find weaknesses via a full mock based on posting and documents", "基于公告与材料的综合实战面试找出弱点", "Tìm điểm yếu qua phỏng vấn dựa trên tin & hồ sơ", "求人・書類ベースの総合面接で弱点発見", "Temukan kelemahan lewat wawancara berbasis lowongan & dokumen")}>{t("실전 모의면접", "Real mock interview", "实战模拟面试", "Phỏng vấn thử", "実戦模擬面接", "Wawancara simulasi")}</SectionTitle>
          <Pill tone={status.completion.complete ? "green" : "grey"}>{status.completion.doneCount}/9</Pill>
        </div>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {status.completion.checks.map((c) => (
            <li key={c.key} className="flex items-center gap-1.5 text-[12.5px]"><CheckCircle className={`h-4 w-4 shrink-0 ${c.done ? "text-[#0A9B59]" : "text-[#C9CDD2]"}`} weight={c.done ? "fill" : "regular"} /><span className={c.done ? "text-[#4E5968]" : "text-[#8B95A1]"}>{c.label}</span></li>
          ))}
        </ul>
        {!initialDone ? (
          <button type="button" onClick={() => setShowChat(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0B1227]">
            <Sparkle className="h-4 w-4" weight="fill" />
            {t("실전 모의면접 시작", "Start mock interview", "开始模拟面试", "Bắt đầu phỏng vấn", "模擬面接を始める", "Mulai wawancara")}
          </button>
        ) : null}
      </Card>

      {/* 종합 리포트 */}
      {status.report ? (
        <Card>
          <div className="flex items-center justify-between">
            <SectionTitle>{t("면접 종합 리포트", "Interview report", "面试综合报告", "Báo cáo phỏng vấn", "面接総合レポート", "Laporan wawancara")}</SectionTitle>
            <p className="text-[22px] font-black text-[#0B46E8]">{status.report.totalScore}</p>
          </div>
          {status.report.strongCompetencies?.length ? <p className="mt-1 text-[12.5px]"><b className="text-[#3A6B00]">{t("강한 역량", "Strong", "强项", "Điểm mạnh", "強い力", "Kuat")}:</b> {status.report.strongCompetencies.join(", ")}</p> : null}
          {status.report.topWeaknesses?.length ? (
            <div className="mt-2 rounded-xl bg-[#FFFBEB] p-3">
              <p className="text-[12px] font-bold text-[#C77700]">{t("우선 개선할 취약점", "Top weaknesses to fix", "优先改进的弱点", "Điểm yếu ưu tiên", "優先改善の弱点", "Kelemahan utama")}</p>
              <ul className="mt-1 space-y-0.5 text-[12px] text-[#4E5968]">{status.report.topWeaknesses.map((w, i) => <li key={i}>• {w}</li>)}</ul>
            </div>
          ) : null}
          {status.report.coachSummary ? <p className="mt-2 break-keep rounded-xl bg-[#F6F8FB] p-3 text-[12.5px] leading-relaxed text-[#333D4B]">{status.report.coachSummary}</p> : null}
          {status.report.humanReviewRequired ? <p className="mt-2 text-[11.5px] text-[#8B95A1]">ℹ️ {t("AI 확신도가 낮아 코치의 추가 검토를 권장해요.", "Low AI confidence — a coach review is recommended.", "AI置信度较低，建议教练复核。", "Độ tin cậy AI thấp — nên coach xem lại.", "AIの確信度が低く、コーチの確認を推奨します。", "Keyakinan AI rendah — disarankan ditinjau pelatih.")}</p> : null}
        </Card>
      ) : null}

      {/* 취약 패턴 */}
      {status.weaknesses.length ? (
        <Card>
          <SectionTitle sub={t("여러 답변에 반복된 패턴이에요", "Patterns repeated across answers", "多次答复中重复的模式", "Mẫu lặp lại qua các câu trả lời", "複数の回答で反復したパターン", "Pola yang berulang")}>{t("반복 취약 패턴", "Recurring weaknesses", "反复弱点", "Điểm yếu lặp lại", "反復する弱点", "Kelemahan berulang")}</SectionTitle>
          <div className="mt-2 space-y-1.5">
            {status.weaknesses.map((w) => (
              <div key={w.id} className="rounded-xl border border-[#EEF1F5] bg-white p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12.5px] font-semibold text-[#191F28]">{w.title || w.label}</p>
                  <Pill tone={w.severity === "high" ? "amber" : "grey"}>{t(`${w.occurrenceCount}회`, `${w.occurrenceCount}x`, `${w.occurrenceCount}次`, `${w.occurrenceCount} lần`, `${w.occurrenceCount}回`, `${w.occurrenceCount}x`)}</Pill>
                </div>
              </div>
            ))}
          </div>
          {status.corrections.length ? <p className="mt-2 text-[12px] font-semibold text-[#0B46E8]">📓 {t(`핵심 오답노트 ${status.corrections.length}개가 준비됐어요. Week 4에서 훈련해요.`, `${status.corrections.length} review notes ready — train them in Week 4.`, `已准备 ${status.corrections.length} 个错题本，将在第4周训练。`, `${status.corrections.length} sổ sửa lỗi sẵn sàng — luyện ở Tuần 4.`, `復習ノート ${status.corrections.length}件を用意しました。Week4で訓練します。`, `${status.corrections.length} catatan siap — latih di Minggu 4.`)}</p> : null}
        </Card>
      ) : null}
    </div>
  );
}
