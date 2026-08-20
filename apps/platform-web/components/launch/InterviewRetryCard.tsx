"use client";

// Week 4 — Interview Retry. Interview Score 의 '다시 연습할 질문 TOP5'를 다시 답하면
// AI가 채점·힌트를 주고, 재도전할수록 점수가 오르는 걸(before→after) 보여준다.
import { useEffect, useState } from "react";
import { CircleNotch, CaretDown, ArrowRight, ArrowClockwise } from "@phosphor-icons/react";
import { fetchInterviewScore } from "../../lib/launch/feedback-client";
import { requestInterviewRetry, type RetryResult } from "../../lib/launch/experience";
import { Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

function scoreColor(v: number): string {
  return v >= 80 ? "text-[#0A9B59]" : v >= 60 ? "text-[#0B46E8]" : "text-[#C77700]";
}

export function InterviewRetryCard() {
  const t = useLaunchT();
  const [questions, setQuestions] = useState<string[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, { first: number; last: RetryResult }>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState<Record<number, string>>({});

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const r = await fetchInterviewScore({ generate: false });
        if (alive && r.score && Array.isArray(r.score.retryTop5) && r.score.retryTop5.length) setQuestions(r.score.retryTop5);
      } catch {
        /* 무시 */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (questions.length === 0) return null;

  const submit = async (i: number) => {
    const answer = (drafts[i] ?? "").trim();
    if (answer.length < 2 || busy !== null) return;
    setBusy(i);
    setErr((e) => ({ ...e, [i]: "" }));
    try {
      const res = await requestInterviewRetry(questions[i], answer);
      setResults((prev) => ({ ...prev, [i]: { first: prev[i]?.first ?? res.score, last: res } }));
    } catch (e) {
      const quota = e instanceof Error && /quota|402|포인트|ticket/i.test(e.message);
      setErr((er) => ({ ...er, [i]: quota ? t("AI 포인트를 모두 사용했어요.", "You're out of AI points.", "AI积分已用完。", "Hết điểm AI.", "AIポイントを使い切りました。", "Poin AI habis.") : t("잠시 문제가 생겼어요. 다시 시도해 주세요.", "Something went wrong. Please try again.", "出现了一点问题，请重试。", "Đã xảy ra sự cố. Vui lòng thử lại.", "問題が発生しました。もう一度お試しください。", "Terjadi masalah. Coba lagi.") }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="md:!p-6">
      <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-[#0B46E8]"><ArrowClockwise className="h-4 w-4" weight="bold" /> {t("질문 다시 답하기", "Re-answer questions", "重新回答问题", "Trả lời lại câu hỏi", "質問に再回答", "Jawab ulang pertanyaan")}</p>
      <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t("연습이 필요한 질문에 다시 답해보세요. 답할수록 점수가 오르는 걸 확인할 수 있어요.", "Re-answer the questions you need to practice — watch your score climb.", "对需要练习的问题重新作答，看着分数一步步提升。", "Trả lời lại câu bạn cần luyện — điểm sẽ tăng dần.", "練習が必要な質問に再回答して、点数が上がるのを確認しましょう。", "Jawab ulang pertanyaan yang perlu dilatih — lihat skormu naik.")}</p>

      <div className="mt-4 flex flex-col gap-2.5">
        {questions.map((q, i) => {
          const isOpen = open === i;
          const res = results[i];
          return (
            <div key={i} className="overflow-hidden rounded-2xl border border-[#EEF1F5]">
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition hover:bg-[#FAFBFC]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EDF1FD] text-[11px] font-black text-[#0B46E8]">{i + 1}</span>
                <span className="min-w-0 flex-1 break-keep text-[13.5px] font-bold text-[#191F28]">{q}</span>
                {res ? (
                  <span className="shrink-0 text-[12px] font-black tabular-nums">
                    {res.first !== res.last.score ? <span className="text-[#B0B8C1]">{res.first} <ArrowRight className="inline h-3 w-3" weight="bold" /> </span> : null}
                    <span className={scoreColor(res.last.score)}>{res.last.score}</span>
                  </span>
                ) : null}
                <CaretDown className={`h-4 w-4 shrink-0 text-[#C4CAD2] transition ${isOpen ? "rotate-180" : ""}`} weight="bold" />
              </button>
              {isOpen ? (
                <div className="border-t border-[#F2F4F6] px-4 py-3.5">
                  {res?.last.hint ? <p className="mb-2.5 rounded-lg bg-[#F8FAFF] px-3 py-2 text-[12.5px] leading-relaxed text-[#0B46E8]">🧭 {res.last.hint}</p> : null}
                  <textarea
                    value={drafts[i] ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [i]: e.target.value }))}
                    rows={3}
                    placeholder={t("이 질문에 다시 답해보세요", "Re-answer this question", "重新回答这个问题", "Trả lời lại câu này", "この質問に再回答", "Jawab ulang pertanyaan ini")}
                    className="w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:outline-none"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {err[i] ? <p className="text-[12px] font-semibold text-[#F04452]">{err[i]}</p> : <span />}
                    <button type="button" onClick={() => submit(i)} disabled={(drafts[i] ?? "").trim().length < 2 || busy !== null} className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-bold transition ${(drafts[i] ?? "").trim().length >= 2 && busy === null ? "bg-[#191F28] text-white hover:bg-[#0B1227]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"}`}>
                      {busy === i ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : null}
                      {busy === i ? t("채점 중…", "Scoring…", "评分中…", "Đang chấm…", "採点中…", "Menilai…") : res ? t("다시 채점", "Score again", "再次评分", "Chấm lại", "再採点", "Nilai lagi") : t("답변 채점", "Score answer", "评分回答", "Chấm điểm", "回答を採点", "Nilai jawaban")}
                    </button>
                  </div>
                  {res ? (
                    <div className="mt-3 rounded-xl border border-[#EEF1F5] p-3">
                      <p className="text-[13px] leading-relaxed text-[#333D4B]">{res.last.feedback}</p>
                      {res.last.good.length > 0 ? <p className="mt-2 text-[12.5px] text-[#0A9B59]">💪 {res.last.good.join(" · ")}</p> : null}
                      {res.last.improve.length > 0 ? <p className="mt-1 text-[12.5px] text-[#C77700]">✏️ {res.last.improve.join(" · ")}</p> : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
