"use client";

// Week 4 — Interview Answer Bank. 핵심 면접 질문 8개의 내 모범 답변(면접 노트). "받기" 캐시.
import { useEffect, useState } from "react";
import { Sparkle, CircleNotch, CaretDown } from "@phosphor-icons/react";
import { fetchAnswerBank, type AnswerBankItem } from "../../lib/launch/feedback-client";
import { Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

export function AnswerBankCard() {
  const t = useLaunchT();
  const [state, setState] = useState<"loading" | "ready" | "done" | "none" | "error">("loading");
  const [answers, setAnswers] = useState<AnswerBankItem[]>([]);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const r = await fetchAnswerBank({ generate: false });
        if (!alive) return;
        if (r.unavailable) return setState("none");
        if (r.answers) {
          setAnswers(r.answers);
          setStale(r.stale);
          setState("done");
        } else if (r.needsGenerate) setState("ready");
        else setState("none");
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const run = async (force: boolean) => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const r = await fetchAnswerBank({ generate: true, force });
      if (r.answers) {
        setAnswers(r.answers);
        setStale(false);
        setState("done");
        setOpen(0);
      } else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (state === "none" || state === "loading") return null;

  return (
    <Card className="md:!p-6">
      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0B46E8]">{t("면접 답변 노트", "Interview answer bank", "面试回答笔记", "Sổ câu trả lời PV", "面接回答ノート", "Catatan jawaban wawancara")}</p>
      <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t("자주 나오는 8개 질문의 내 답변을 미리 정리해요. 면접 전에 이 노트만 봐도 든든해요.", "Draft your answers to the 8 most common questions — a note to review before interviews.", "提前整理8个常见问题的回答，面试前看这份笔记就安心。", "Chuẩn bị câu trả lời cho 8 câu hỏi thường gặp — xem trước khi phỏng vấn.", "よく出る8つの質問の回答を事前に整理。面接前にこのノートで安心。", "Susun jawaban 8 pertanyaan umum — catatan sebelum wawancara.")}</p>

      {state === "ready" ? (
        <div className="mt-3 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F4F6] text-[22px]" aria-hidden>📝</span>
          <p className="mt-3 text-[15px] font-bold text-[#191F28]">{t("내 면접 답변 노트 만들기", "Build my answer bank", "生成我的面试回答笔记", "Tạo sổ câu trả lời", "面接回答ノートを作る", "Buat catatan jawaban")}</p>
          <button type="button" onClick={() => run(false)} disabled={busy} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-60">
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
            {busy ? t("정리 중…", "Drafting…", "整理中…", "Đang soạn…", "作成中…", "Menyusun…") : t("답변 노트 만들기", "Build answer bank", "生成回答笔记", "Tạo sổ trả lời", "回答ノートを作る", "Buat catatan")}
          </button>
          {failed ? <p className="mt-2 text-[12px] font-semibold text-[#F04452]">{t("잠시 문제가 생겼어요. 잠시 후 다시 시도해 주세요.", "Something went wrong. Please try again in a moment.", "出现了一点问题，请稍后再试。", "Đã xảy ra sự cố. Vui lòng thử lại sau.", "問題が発生しました。少し後にもう一度お試しください。", "Terjadi masalah. Silakan coba lagi.")}</p> : null}
        </div>
      ) : null}

      {state === "done" ? (
        <div className="mt-4 flex flex-col gap-2.5">
          {stale ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FFF9EC] px-3 py-2">
              <span className="text-[12px] font-semibold text-[#B7791F]">{t("내용이 바뀌었어요. 다시 받아 갱신할 수 있어요.", "Your content changed. Refresh to update.", "内容已更新，可重新获取。", "Nội dung đã đổi. Nhận lại.", "内容が変わりました。再取得で更新できます。", "Konten berubah. Ambil ulang.")}</span>
              <button type="button" onClick={() => run(true)} disabled={busy} className="rounded-lg bg-[#191F28] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-60">{busy ? "…" : t("다시 받기", "Refresh", "重新获取", "Nhận lại", "再取得", "Ambil ulang")}</button>
            </div>
          ) : null}
          {answers.map((a, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="overflow-hidden rounded-2xl border border-[#EEF1F5]">
                <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition hover:bg-[#FAFBFC]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EDF1FD] text-[11px] font-black text-[#0B46E8]">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-[#191F28]">{a.question}</span>
                  <CaretDown className={`h-4 w-4 shrink-0 text-[#C4CAD2] transition ${isOpen ? "rotate-180" : ""}`} weight="bold" />
                </button>
                {isOpen ? (
                  <div className="border-t border-[#F2F4F6] px-4 py-3.5">
                    <p className="whitespace-pre-wrap break-keep text-[13px] leading-relaxed text-[#333D4B]">{a.answer}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {state === "error" ? <p className="mt-3 text-[13px] text-[#8B95A1]">{t("불러오지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't load. Please try again.", "无法加载，请稍后再试。", "Không thể tải. Vui lòng thử lại.", "読み込めませんでした。", "Tidak dapat memuat.")}</p> : null}
    </Card>
  );
}
