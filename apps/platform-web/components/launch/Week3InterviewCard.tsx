"use client";

// Week 3 '실전 모의면접 & 약점 발견'(Phase 6) — 종합 실전면접(진행 중 점수 미노출) → 종합 리포트 → 취약패턴 → 핵심 오답노트.
import { useEffect, useRef, useState } from "react";
import { CircleNotch, Sparkle, CheckCircle, Microphone } from "@phosphor-icons/react";
import { Card, Pill, SectionTitle } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";
import { trackCareerFunnel } from "../../lib/analytics";
import { startSession, submitAnswer, completeSession, fetchWeek3, type InterviewQuestion, type Week3Status } from "../../lib/launch/week34";

export function Week3InterviewCard() {
  const t = useLaunchT();
  const [status, setStatus] = useState<Week3Status | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [live, setLive] = useState<{ sessionId: string; question: InterviewQuestion; index: number; total: number } | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
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

  const start = async () => {
    setBusy(true);
    setErr("");
    try {
      const { session, question, total } = await startSession("initial_mock");
      trackCareerFunnel("career_initial_mock_started");
      if (question) setLive({ sessionId: session.id, question, index: 1, total });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy(false);
    }
  };
  const submit = async () => {
    if (!live || !answer.trim()) return;
    setBusy(true);
    setErr("");
    try {
      trackCareerFunnel("career_interview_answer_submitted");
      const { next, done } = await submitAnswer(live.sessionId, live.question.id, answer);
      setAnswer("");
      if (done || !next) {
        // 종료 → 분석.
        const r = await completeSession(live.sessionId);
        trackCareerFunnel("career_initial_mock_completed", { score: r.total });
        setLive(null);
        await reload();
      } else {
        setLive({ ...live, question: next, index: live.index + 1 });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy(false);
    }
  };

  if (phase === "loading") return <Card><p className="flex items-center gap-2 py-6 text-[13px] text-[#8B95A1]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> {t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p></Card>;
  if (phase === "error" || !status) return <Card><p className="py-4 text-[13px] text-[#8B95A1]">{t("불러오지 못했어요.", "Couldn't load.", "加载失败。", "Không tải được.", "読み込めませんでした。", "Gagal memuat.")}</p><button type="button" onClick={() => void reload()} className="mt-2 rounded-lg border border-[#E5E8EB] px-3 py-1.5 text-[12px] font-semibold text-[#4E5968]">{t("다시 시도", "Retry", "重试", "Thử lại", "再試行", "Coba lagi")}</button></Card>;

  // 면접 진행 중 — 실전감을 위해 점수/코칭 미노출.
  if (live) {
    return (
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#0B46E8]">{t("실전 모의면접 진행 중", "Mock interview in progress", "模拟面试进行中", "Đang phỏng vấn thử", "模擬面接進行中", "Wawancara berlangsung")}</p>
          <Pill tone="grey">{t(`질문 ${live.index}`, `Q ${live.index}`, `问题 ${live.index}`, `Câu ${live.index}`, `質問 ${live.index}`, `Soal ${live.index}`)}{live.total ? ` / ~${live.total}` : ""}</Pill>
        </div>
        <p className="mt-3 break-keep text-[16px] font-black leading-relaxed text-[#191F28]">{live.question.question}</p>
        {live.question.parentQuestionId ? <p className="mt-1 text-[11.5px] font-semibold text-[#C77700]">↳ {t("꼬리질문", "Follow-up", "追问", "Câu hỏi tiếp", "追加質問", "Lanjutan")}</p> : null}
        <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={5} placeholder={t("실제 면접처럼 답변해 주세요", "Answer as in a real interview", "像真实面试一样作答", "Trả lời như phỏng vấn thật", "本番のように答えてください", "Jawab seperti wawancara nyata")} className="mt-3 w-full resize-none rounded-xl border border-[#E5E8EB] p-3 text-[16px] leading-relaxed outline-none focus:border-[#0B46E8]" />
        <p className="mt-1 text-[11px] text-[#8B95A1]"><Microphone className="mr-1 inline h-3.5 w-3.5" /> {t("면접 중에는 점수를 보여주지 않아요. 끝나면 전체 평가를 드려요.", "Scores are hidden during the interview — you'll get full feedback at the end.", "面试中不显示分数，结束后提供完整评价。", "Điểm được ẩn trong phỏng vấn — nhận đánh giá đầy đủ khi kết thúc.", "面接中は点数を表示しません。終了後に総合評価を出します。", "Skor disembunyikan selama wawancara — umpan balik lengkap di akhir.")}</p>
        <button type="button" onClick={() => void submit()} disabled={busy || !answer.trim()} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
          {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : null}
          {t("답변 완료 → 다음", "Submit → Next", "提交 → 下一题", "Gửi → Tiếp", "回答 → 次へ", "Kirim → Berikutnya")}
        </button>
        {err ? <p className="mt-2 text-[12px] text-[#F04452]">{err}</p> : null}
      </Card>
    );
  }

  const initialDone = status.sessions.some((s) => s.sessionType === "initial_mock" && s.status === "completed");

  return (
    <div className="space-y-4">
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
          <button type="button" onClick={() => void start()} disabled={busy} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-60">
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
            {t("실전 모의면접 시작", "Start mock interview", "开始模拟面试", "Bắt đầu phỏng vấn", "模擬面接を始める", "Mulai wawancara")}
          </button>
        ) : null}
        {err ? <p className="mt-2 text-[12px] text-[#F04452]">{err}</p> : null}
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
