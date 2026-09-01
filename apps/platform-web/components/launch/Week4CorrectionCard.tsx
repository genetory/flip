"use client";

// Week 4 '면접 오답노트 반복훈련 & 최종 검증'(Phase 6) — 오답 코칭 → 같은 질문 재도전 → 유사 질문 전이 → 최종 실전면접 → 성장 리포트.
import { useEffect, useRef, useState } from "react";
import { CircleNotch, Sparkle, CheckCircle, ArrowsClockwise } from "@phosphor-icons/react";
import { Card, Pill, SectionTitle } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";
import { trackCareerFunnel } from "../../lib/analytics";
import {
  fetchWeek4,
  coachCorrection,
  submitAttempt,
  generateSimilar,
  generateGrowth,
  startSession,
  submitAnswer,
  completeSession,
  type Week4Status,
  type Correction,
  type CorrectionCoaching
} from "../../lib/launch/week34";

const STATUS_LABEL: Record<string, string> = { discovered: "발견", coaching: "학습 중", retrying: "재도전 중", transfer_test: "유사질문 검증", passed: "통과", paused: "잠시 멈춤", archived: "보관" };

export function Week4CorrectionCard() {
  const t = useLaunchT();
  const [status, setStatus] = useState<Week4Status | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const alive = useRef(true);

  const reload = async () => {
    try {
      const s = await fetchWeek4();
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
    trackCareerFunnel("career_week4_started");
    void reload();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (fn: () => Promise<void>, key: string) => {
    setBusy(key);
    setErr("");
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy("");
    }
  };

  if (phase === "loading") return <Card><p className="flex items-center gap-2 py-6 text-[13px] text-[#8B95A1]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> {t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p></Card>;
  if (phase === "error" || !status) return <Card><p className="py-4 text-[13px] text-[#8B95A1]">{t("불러오지 못했어요.", "Couldn't load.", "加载失败。", "Không tải được.", "読み込めませんでした。", "Gagal memuat.")}</p><button type="button" onClick={() => void reload()} className="mt-2 rounded-lg border border-[#E5E8EB] px-3 py-1.5 text-[12px] font-semibold text-[#4E5968]">{t("다시 시도", "Retry", "重试", "Thử lại", "再試行", "Coba lagi")}</button></Card>;

  const finalMockDone = status.completion.checks.find((c) => c.key === "final_mock")?.done;
  const allTrained = status.corrections.length > 0 && status.corrections.filter((c) => c.attemptCount > 0).length >= Math.min(5, status.corrections.length);

  return (
    <div className="space-y-4">
      {/* 상단 요약 + 체크리스트 */}
      <Card>
        <div className="flex items-center justify-between gap-2">
          <SectionTitle sub={t("약점을 반복 훈련하고 성장을 검증해요", "Drill weaknesses and verify growth", "反复训练弱点并验证成长", "Luyện điểm yếu và kiểm chứng tiến bộ", "弱点を訓練し成長を検証", "Latih kelemahan & verifikasi pertumbuhan")}>{t("오답노트 훈련", "Review-note training", "错题本训练", "Luyện sổ sửa lỗi", "復習ノート訓練", "Latihan catatan")}</SectionTitle>
          <div className="flex items-center gap-2">
            <Pill tone="green">{t(`해결 ${status.resolvedCount}`, `${status.resolvedCount} passed`, `已解决 ${status.resolvedCount}`, `${status.resolvedCount} đạt`, `解決 ${status.resolvedCount}`, `${status.resolvedCount} lolos`)}</Pill>
            <Pill tone="grey">{status.completion.doneCount}/7</Pill>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#8B95A1]">
          <span>{t("남은 오답", "Remaining", "剩余", "Còn lại", "残り", "Sisa")} <b className="text-[#191F28]">{status.remainingCount}</b></span>
          <span>{t("유사질문 통과율", "Transfer pass rate", "相似题通过率", "Tỷ lệ đạt câu tương tự", "類似質問通過率", "Rasio lolos serupa")} <b className="text-[#191F28]">{status.transferPassRate}%</b></span>
        </div>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {status.completion.checks.map((c) => (
            <li key={c.key} className="flex items-center gap-1.5 text-[12.5px]"><CheckCircle className={`h-4 w-4 shrink-0 ${c.done ? "text-[#0A9B59]" : "text-[#C9CDD2]"}`} weight={c.done ? "fill" : "regular"} /><span className={c.done ? "text-[#4E5968]" : "text-[#8B95A1]"}>{c.label}</span></li>
          ))}
        </ul>
      </Card>

      {/* 오답노트 카드들 */}
      {status.corrections.length === 0 ? (
        <Card><p className="py-3 text-[13px] text-[#8B95A1]">{t("Week 3 실전면접을 먼저 완료하면 핵심 오답노트가 생성돼요.", "Complete the Week 3 mock interview to generate review notes.", "先完成第3周模拟面试以生成错题本。", "Hoàn thành phỏng vấn Tuần 3 để tạo sổ sửa lỗi.", "Week3の模擬面接を終えると復習ノートが作成されます。", "Selesaikan wawancara Minggu 3 untuk membuat catatan.")}</p></Card>
      ) : (
        <div className="space-y-3">
          {status.corrections.map((c) => <CorrectionCard key={c.id} correction={c} busy={busy} onRun={run} onChanged={reload} />)}
        </div>
      )}

      {/* 최종 실전면접 + 성장 리포트 */}
      {allTrained ? (
        <Card>
          <SectionTitle sub={t("훈련 뒤 최종 면접으로 성장을 검증해요", "Verify growth with a final mock after training", "训练后用最终面试验证成长", "Kiểm chứng bằng phỏng vấn cuối", "訓練後、最終面接で成長を検証", "Verifikasi dengan wawancara akhir")}>{t("최종 검증", "Final verification", "最终验证", "Kiểm chứng cuối", "最終検証", "Verifikasi akhir")}</SectionTitle>
          {!finalMockDone ? (
            <FinalMock onDone={reload} />
          ) : !status.growthReport ? (
            <button type="button" onClick={() => void run(async () => { const g = await generateGrowth(); trackCareerFunnel("career_growth_report_viewed"); await reload(); if (g.needsInitialMock) setErr(t("최초 면접이 필요해요.", "Initial mock needed.", "需要最初面试。", "Cần phỏng vấn đầu.", "最初の面接が必要です。", "Perlu wawancara awal.")); }, "growth")} disabled={busy === "growth"} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-60">
              {busy === "growth" ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
              {t("최종 성장 리포트 생성", "Generate growth report", "生成成长报告", "Tạo báo cáo tiến bộ", "成長レポート生成", "Buat laporan pertumbuhan")}
            </button>
          ) : (
            <GrowthView report={status.growthReport} />
          )}
          {err ? <p className="mt-2 text-[12px] text-[#F04452]">{err}</p> : null}
        </Card>
      ) : null}
    </div>
  );
}

function CorrectionCard({ correction: c, busy, onRun, onChanged }: { correction: Correction; busy: string; onRun: (fn: () => Promise<void>, key: string) => Promise<void>; onChanged: () => Promise<void> }) {
  const t = useLaunchT();
  const [open, setOpen] = useState(false);
  const [coaching, setCoaching] = useState<CorrectionCoaching | null>(c.coachingData ?? null);
  const [answer, setAnswer] = useState("");
  const [similar, setSimilar] = useState<{ question: string } | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const passed = c.status === "passed";

  const doCoach = () =>
    onRun(async () => {
      const co = await coachCorrection(c.id);
      trackCareerFunnel("career_correction_coaching_viewed");
      setCoaching(co);
    }, `coach-${c.id}`);
  const doRetry = (type: "same_question" | "similar_question") =>
    onRun(async () => {
      trackCareerFunnel(type === "same_question" ? "career_correction_retry_submitted" : "career_transfer_test_completed", { attemptType: type });
      const r = await submitAttempt(c.id, type, answer, similar?.question);
      setFeedback([r.evaluation?.keyProblem ? `핵심: ${r.evaluation.keyProblem}` : "", r.evaluation?.recommendedStructure ? `구조: ${r.evaluation.recommendedStructure}` : "", r.pass ? (r.pass.passed ? "✓ 통과!" : `아직: ${r.pass.reason}`) : ""].filter(Boolean).join(" · "));
      setAnswer("");
      if (r.pass?.passed) trackCareerFunnel("career_correction_passed");
      await onChanged();
    }, `retry-${c.id}`);
  const doSimilar = () =>
    onRun(async () => {
      trackCareerFunnel("career_transfer_test_started");
      const s = await generateSimilar(c.id);
      setSimilar(s);
      await onChanged();
    }, `similar-${c.id}`);

  return (
    <Card>
      <button type="button" onClick={() => { setOpen((o) => !o); if (!open) trackCareerFunnel("career_correction_opened"); }} className="flex w-full items-start justify-between gap-2 text-left">
        <p className="min-w-0 break-keep text-[13.5px] font-bold text-[#191F28]">{c.question}</p>
        <Pill tone={passed ? "green" : c.status === "transfer_test" ? "blue" : "grey"}>{STATUS_LABEL[c.status] ?? c.status}</Pill>
      </button>
      {open ? (
        <div className="mt-3 space-y-2.5">
          {/* 최초 점수 → 최근 점수 */}
          <p className="text-[12px] text-[#8B95A1]">{t("최초", "Initial", "最初", "Đầu", "最初", "Awal")} {c.initialScore ?? "-"} → {t("최근", "Latest", "最近", "Gần nhất", "最近", "Terbaru")} {c.latestScore ?? "-"}</p>
          {/* 코칭 */}
          {!coaching ? (
            <button type="button" onClick={() => void doCoach()} disabled={busy === `coach-${c.id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-[#EDF1FD] px-3.5 py-2 text-[12.5px] font-bold text-[#0B46E8] disabled:opacity-60">
              {busy === `coach-${c.id}` ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
              {t("개선 구조 코칭", "Coach the structure", "改进结构指导", "Coaching cấu trúc", "改善構造コーチ", "Coaching struktur")}
            </button>
          ) : (
            <div className="rounded-xl bg-[#FAFBFC] p-3 text-[12px] leading-relaxed">
              <p><b className="text-[#191F28]">{t("핵심 문제", "Key issue", "核心问题", "Vấn đề chính", "核心課題", "Isu utama")}</b> {coaching.keyIssue}</p>
              <p className="mt-1"><b className="text-[#0B46E8]">{t("추천 구조", "Structure", "推荐结构", "Cấu trúc", "推奨構造", "Struktur")}</b> {coaching.recommendedStructure}</p>
              {coaching.hint ? <p className="mt-1 text-[#4E5968]">💡 {coaching.hint}</p> : null}
            </div>
          )}
          {/* 재도전 입력 */}
          {!passed ? (
            <>
              {similar ? <p className="rounded-lg bg-[#F5F8FF] px-2.5 py-1.5 text-[12px] font-semibold text-[#0B46E8]">🔁 {t("유사 질문", "Similar", "相似题", "Câu tương tự", "類似質問", "Serupa")}: {similar.question}</p> : null}
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} placeholder={similar ? t("유사 질문에 답해 보세요", "Answer the similar question", "回答相似题", "Trả lời câu tương tự", "類似質問に答えて", "Jawab soal serupa") : t("다시 답해 보세요", "Answer again", "再次作答", "Trả lời lại", "もう一度答えて", "Jawab lagi")} className="w-full resize-none rounded-xl border border-[#E5E8EB] p-2.5 text-[16px] leading-relaxed outline-none focus:border-[#0B46E8]" />
              <div className="flex flex-wrap gap-2">
                {!similar ? (
                  <button type="button" onClick={() => void doRetry("same_question")} disabled={!answer.trim() || busy === `retry-${c.id}` || c.attemptCount >= 2} className="rounded-xl bg-[#0B46E8] px-3.5 py-2 text-[12.5px] font-bold text-white disabled:opacity-50">{t("같은 질문 재도전", "Retry same", "同题再试", "Thử lại", "同じ質問再挑戦", "Coba lagi")}{c.attemptCount >= 2 ? ` (${t("한도", "limit", "上限", "hết", "上限", "batas")})` : ""}</button>
                ) : (
                  <button type="button" onClick={() => void doRetry("similar_question")} disabled={!answer.trim() || busy === `retry-${c.id}`} className="rounded-xl bg-[#0B46E8] px-3.5 py-2 text-[12.5px] font-bold text-white disabled:opacity-50">{t("유사 질문 제출", "Submit similar", "提交相似题", "Gửi câu tương tự", "類似質問を提出", "Kirim serupa")}</button>
                )}
                {!similar ? <button type="button" onClick={() => void doSimilar()} disabled={busy === `similar-${c.id}`} className="inline-flex items-center gap-1 rounded-xl border border-[#DCE3F0] bg-white px-3.5 py-2 text-[12.5px] font-bold text-[#0B46E8]"><ArrowsClockwise className="h-3.5 w-3.5" weight="bold" /> {t("유사 질문으로", "Try similar", "换相似题", "Câu tương tự", "類似質問へ", "Ke serupa")}</button> : null}
              </div>
              {feedback ? <p className="rounded-lg bg-[#F6F8FB] px-2.5 py-1.5 text-[12px] text-[#333D4B]">{feedback}</p> : null}
            </>
          ) : (
            <p className="text-[12.5px] font-bold text-[#0A9B59]">✓ {t("이 오답을 통과했어요! 유사 질문에서도 개선된 구조를 사용했어요.", "Passed! You used the improved structure even in a similar question.", "已通过！在相似题中也使用了改进结构。", "Đã đạt! Bạn dùng cấu trúc cải thiện cả ở câu tương tự.", "通過！類似質問でも改善構造を使えました。", "Lolos! Struktur membaik bahkan di soal serupa.")}</p>
          )}
        </div>
      ) : null}
    </Card>
  );
}

function FinalMock({ onDone }: { onDone: () => Promise<void> }) {
  const t = useLaunchT();
  const [live, setLive] = useState<{ sessionId: string; question: { id: string; question: string }; index: number; total: number } | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const start = async () => {
    setBusy(true);
    try {
      trackCareerFunnel("career_final_mock_started");
      const { session, question, total } = await startSession("final_mock");
      if (question) setLive({ sessionId: session.id, question, index: 1, total });
    } finally {
      setBusy(false);
    }
  };
  const submit = async () => {
    if (!live || !answer.trim()) return;
    setBusy(true);
    try {
      const { next, done } = await submitAnswer(live.sessionId, live.question.id, answer);
      setAnswer("");
      if (done || !next) {
        await completeSession(live.sessionId);
        trackCareerFunnel("career_final_mock_completed");
        setLive(null);
        await onDone();
      } else setLive({ ...live, question: next, index: live.index + 1 });
    } finally {
      setBusy(false);
    }
  };
  if (!live) return <button type="button" onClick={() => void start()} disabled={busy} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-60">{busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}{t("최종 실전면접 시작", "Start final mock", "开始最终面试", "Bắt đầu phỏng vấn cuối", "最終面接を始める", "Mulai wawancara akhir")}</button>;
  return (
    <div className="mt-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#0B46E8]">{t("최종 실전면접", "Final mock", "最终面试", "Phỏng vấn cuối", "最終面接", "Wawancara akhir")} · Q{live.index}{live.total ? `/~${live.total}` : ""}</p>
      <p className="mt-2 break-keep text-[15px] font-black text-[#191F28]">{live.question.question}</p>
      <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4} className="mt-2 w-full resize-none rounded-xl border border-[#E5E8EB] p-2.5 text-[16px] leading-relaxed outline-none focus:border-[#0B46E8]" />
      <button type="button" onClick={() => void submit()} disabled={busy || !answer.trim()} className="mt-2 rounded-xl bg-[#0B46E8] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50">{t("답변 완료 → 다음", "Submit → Next", "提交 → 下一题", "Gửi → Tiếp", "回答 → 次へ", "Kirim → Berikutnya")}</button>
    </div>
  );
}

function GrowthView({ report }: { report: import("../../lib/launch/week34").GrowthReport }) {
  const t = useLaunchT();
  const g = report.growthData;
  const na = report.nextActions ?? {};
  return (
    <div className="mt-2 space-y-3">
      {g ? (
        <div className="rounded-2xl bg-[#191F28] p-4 text-white">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("면접 성장", "Interview growth", "面试成长", "Tiến bộ phỏng vấn", "面接の成長", "Pertumbuhan")}</p>
            <p className="text-[15px] font-black">{g.initialScore} → <span className="text-[#B7FF5A]">{g.finalScore}</span> <span className="text-[12px] text-white/70">({g.scoreDelta >= 0 ? "+" : ""}{g.scoreDelta})</span></p>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[11px]">
            <div className="rounded-lg bg-white/10 px-1 py-1"><p className="text-white/60">{t("오답 통과율", "Pass rate", "通过率", "Tỷ lệ đạt", "通過率", "Lolos")}</p><p className="font-extrabold tabular-nums">{g.correctionPassRate}%</p></div>
            <div className="rounded-lg bg-white/10 px-1 py-1"><p className="text-white/60">{t("유사질문", "Transfer", "相似题", "Tương tự", "類似", "Serupa")}</p><p className="font-extrabold tabular-nums">{g.transferPassRate}%</p></div>
            <div className="rounded-lg bg-white/10 px-1 py-1"><p className="text-white/60">{t("해결/남음", "Resolved/Left", "解决/剩", "Đạt/Còn", "解決/残", "Lolos/Sisa")}</p><p className="font-extrabold tabular-nums">{g.weaknessResolvedCount}/{g.remainingWeaknessCount}</p></div>
          </div>
        </div>
      ) : null}
      {na.coachMessage ? <p className="break-keep rounded-xl bg-[#F6F8FB] p-3 text-[12.5px] leading-relaxed text-[#333D4B]">{na.coachMessage}</p> : null}
      {na.next30Days?.length ? (
        <div className="rounded-xl border border-[#EEF1F5] p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#0B46E8]">{t("30일 행동계획", "30-day plan", "30天行动计划", "Kế hoạch 30 ngày", "30日行動計画", "Rencana 30 hari")}</p>
          <ul className="mt-1 space-y-0.5 text-[12px] text-[#4E5968]">{na.next30Days.map((s, i) => <li key={i}>• {s}</li>)}</ul>
        </div>
      ) : null}
      {report.humanReviewRequired ? <p className="text-[11.5px] text-[#8B95A1]">ℹ️ {t("코치의 추가 검토를 권장해요.", "A coach review is recommended.", "建议教练复核。", "Nên coach xem lại.", "コーチの確認を推奨します。", "Disarankan ditinjau pelatih.")}</p> : null}
    </div>
  );
}
