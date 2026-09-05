"use client";

// 공고별 모의면접 결과 리스트 — 문항별 점수·내 답변·모범답안·피드백을 펼쳐보고, 오답노트처럼 재도전(재채점).
// 세션 종료 화면과 지난 기록 다시보기에서 공유한다.
import { useState } from "react";
import { CaretDown, CircleNotch, ArrowClockwise, PaperPlaneRight } from "@phosphor-icons/react";
import { useLaunchT } from "../../lib/launch/i18n";
import type { PostingScore } from "../../lib/launch/posting-interview";
import type { PostingInterviewItem } from "../../lib/launch/progress-client";

function scoreTone(s: number): { text: string; bg: string } {
  if (s >= 80) return { text: "text-[#0A9B59]", bg: "bg-[#E7F7EF]" };
  if (s >= 60) return { text: "text-[#0B46E8]", bg: "bg-[#EDF1FD]" };
  if (s >= 40) return { text: "text-[#C77700]", bg: "bg-[#FFF6E5]" };
  return { text: "text-[#F04452]", bg: "bg-[#FEECEC]" };
}

export function PostingResultList({ items, rescore, onItemsChange }: { items: PostingInterviewItem[]; rescore?: (question: string, answer: string) => Promise<PostingScore>; onItemsChange?: (items: PostingInterviewItem[]) => void }) {
  const t = useLaunchT();
  const [open, setOpen] = useState<number | null>(0);
  const [retryIdx, setRetryIdx] = useState<number | null>(null);
  const [retryText, setRetryText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const canRetry = Boolean(rescore && onItemsChange);

  const doRetry = async (i: number) => {
    const a = retryText.trim();
    if (!a || busy || !rescore || !onItemsChange) return;
    setBusy(true);
    setErr("");
    try {
      const s = await rescore(items[i].question, a);
      onItemsChange(items.map((it, j) => (j === i ? { ...it, answer: a, score: s.score, modelAnswer: s.modelAnswer, feedback: s.feedback, strengths: s.strengths, improvements: s.improvements } : it)));
      setRetryIdx(null);
      setRetryText("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2.5">
      {items.map((it, i) => {
        const tone = scoreTone(it.score);
        const isOpen = open === i;
        return (
          <div key={i} className="overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
            <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
              <span className={`flex h-10 w-12 shrink-0 flex-col items-center justify-center rounded-lg ${tone.bg}`}>
                <span className={`text-[15px] font-black leading-none ${tone.text}`}>{it.score}</span>
                <span className={`text-[9px] font-bold ${tone.text}`}>/100</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold text-[#8B95A1]">Q{i + 1}</span>
                <span className="block break-keep text-[13.5px] font-bold leading-snug text-[#191F28] line-clamp-2">{it.question}</span>
              </span>
              <CaretDown className={`h-4 w-4 shrink-0 text-[#C4CAD2] transition ${isOpen ? "rotate-180" : ""}`} weight="bold" />
            </button>
            {isOpen ? (
              <div className="space-y-3 border-t border-[#F2F4F6] px-3.5 py-3 text-[13px] leading-relaxed">
                <div>
                  <p className="text-[11.5px] font-bold text-[#8B95A1]">{t("내 답변", "My answer", "我的回答", "Câu trả lời của tôi", "私の回答", "Jawabanku")}</p>
                  <p className="mt-0.5 whitespace-pre-wrap break-keep text-[#333D4B]">{it.answer}</p>
                </div>
                {it.feedback ? (
                  <div className="rounded-xl bg-[#FAFBFC] p-3">
                    <p className="text-[11.5px] font-bold text-[#C77700]">💬 {t("피드백", "Feedback", "反馈", "Nhận xét", "フィードバック", "Umpan balik")}</p>
                    <p className="mt-0.5 break-keep text-[#4E5968]">{it.feedback}</p>
                  </div>
                ) : null}
                {it.modelAnswer ? (
                  <div className="rounded-xl bg-[#F8FAFF] p-3">
                    <p className="text-[11.5px] font-bold text-[#0B46E8]">🧭 {t("모범답안", "Model answer", "范例答案", "Câu trả lời mẫu", "模範解答", "Jawaban contoh")}</p>
                    <p className="mt-0.5 whitespace-pre-wrap break-keep text-[#333D4B]">{it.modelAnswer}</p>
                  </div>
                ) : null}
                {canRetry ? (
                  retryIdx === i ? (
                    <div>
                      <textarea value={retryText} onChange={(e) => setRetryText(e.target.value)} rows={4} placeholder={t("이번엔 이렇게 답해볼게요…", "This time I'll answer like this…", "这次这样回答…", "Lần này tôi sẽ trả lời thế này…", "今回はこう答えます…", "Kali ini aku jawab begini…")} className="w-full resize-none rounded-xl border border-[#E5E8EB] p-3 text-[15px] leading-relaxed outline-none focus:border-[#0B46E8]" />
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={() => void doRetry(i)} disabled={busy || !retryText.trim()} className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">{busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <PaperPlaneRight className="h-4 w-4" weight="fill" />}{t("다시 채점", "Re-score", "重新评分", "Chấm lại", "再採点", "Nilai ulang")}</button>
                        <button type="button" onClick={() => { setRetryIdx(null); setRetryText(""); }} className="rounded-xl border border-[#E5E8EB] px-4 py-2 text-[13px] font-bold text-[#4E5968] transition hover:bg-[#F6F8FB]">{t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}</button>
                      </div>
                      {err ? <p className="mt-1.5 text-[12px] text-[#F04452]">{err}</p> : null}
                    </div>
                  ) : (
                    <button type="button" onClick={() => { setRetryIdx(i); setRetryText(""); setErr(""); }} className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2 text-[12.5px] font-bold text-[#0B46E8] transition hover:border-[#0B46E8]/40"><ArrowClockwise className="h-3.5 w-3.5" weight="bold" />{t("다시 답하기", "Try again", "重新作答", "Trả lời lại", "もう一度答える", "Coba lagi")}</button>
                  )
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
