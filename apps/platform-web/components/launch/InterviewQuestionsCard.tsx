"use client";

// Week 4 — 예상 질문 생성. 이력서·자소서·직무 기반 예상 면접 질문을 카테고리별로. "받기" 캐시.
import { useEffect, useState } from "react";
import { Sparkle, CircleNotch } from "@phosphor-icons/react";
import { fetchInterviewQuestions, type PredictedQuestion } from "../../lib/launch/feedback-client";
import { Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

type LaunchT = ReturnType<typeof useLaunchT>;
function catLabel(t: LaunchT, c: string): string {
  switch (c) {
    case "resume": return t("이력서 기반", "Resume-based", "基于简历", "Từ hồ sơ", "履歴書ベース", "Dari resume");
    case "cover": return t("자소서 기반", "Cover-based", "基于自我介绍", "Từ thư", "自己紹介書ベース", "Dari surat");
    case "job": return t("직무 질문", "Job questions", "职务问题", "Câu hỏi nghề", "職務質問", "Pertanyaan peran");
    case "verify": return t("검증 질문", "Verification", "验证问题", "Kiểm chứng", "検証質問", "Verifikasi");
    default: return t("기본 인성", "Basic", "基本人品", "Cơ bản", "基本人柄", "Dasar");
  }
}
const CAT_ORDER = ["basic", "resume", "cover", "job", "verify"];

export function InterviewQuestionsCard() {
  const t = useLaunchT();
  const [state, setState] = useState<"loading" | "ready" | "done" | "none" | "error">("loading");
  const [questions, setQuestions] = useState<PredictedQuestion[]>([]);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const r = await fetchInterviewQuestions({ generate: false });
        if (!alive) return;
        if (r.unavailable) return setState("none");
        if (r.questions) {
          setQuestions(r.questions);
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
      const r = await fetchInterviewQuestions({ generate: true, force });
      if (r.questions) {
        setQuestions(r.questions);
        setStale(false);
        setState("done");
      } else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (state === "none" || state === "loading") return null;

  const grouped = CAT_ORDER.map((c) => ({ cat: c, items: questions.filter((q) => q.category === c) })).filter((g) => g.items.length > 0);

  return (
    <Card className="md:!p-6">
      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0B46E8]">{t("예상 면접 질문", "Predicted interview questions", "预测面试问题", "Câu hỏi PV dự đoán", "予想面接質問", "Prediksi pertanyaan")}</p>
      <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t("내 이력서·자소서·직무에서 실제로 나올 만한 질문을 뽑아드려요. 면접 전에 답을 준비해봐요.", "We predict questions likely to come from your resume, cover letter, and role. Prep your answers.", "根据你的简历、自我介绍与职务预测可能的问题。面试前准备好答案吧。", "Dự đoán câu hỏi có thể có từ hồ sơ, thư và nghề của bạn.", "履歴書・自己紹介書・職務から出そうな質問を予測します。", "Kami prediksi pertanyaan dari resume, surat, dan peranmu.")}</p>

      {state === "ready" ? (
        <div className="mt-3 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F4F6] text-[22px]" aria-hidden>❓</span>
          <p className="mt-3 text-[15px] font-bold text-[#191F28]">{t("예상 질문 받아보기", "Get predicted questions", "获取预测问题", "Nhận câu hỏi dự đoán", "予想質問を受け取る", "Dapatkan prediksi")}</p>
          <button type="button" onClick={() => run(false)} disabled={busy} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-60">
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
            {busy ? t("뽑는 중…", "Generating…", "生成中…", "Đang tạo…", "作成中…", "Membuat…") : t("예상 질문 받기", "Get questions", "获取问题", "Nhận câu hỏi", "質問を受け取る", "Dapatkan")}
          </button>
          {failed ? <p className="mt-2 text-[12px] font-semibold text-[#F04452]">{t("잠시 문제가 생겼어요. 잠시 후 다시 시도해 주세요.", "Something went wrong. Please try again in a moment.", "出现了一点问题，请稍后再试。", "Đã xảy ra sự cố. Vui lòng thử lại sau.", "問題が発生しました。少し後にもう一度お試しください。", "Terjadi masalah. Silakan coba lagi.")}</p> : null}
        </div>
      ) : null}

      {state === "done" ? (
        <div className="mt-4 flex flex-col gap-4">
          {stale ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FFF9EC] px-3 py-2">
              <span className="text-[12px] font-semibold text-[#B7791F]">{t("내용이 바뀌었어요. 다시 받아 갱신할 수 있어요.", "Your content changed. Refresh to update.", "内容已更新，可重新获取。", "Nội dung đã đổi. Nhận lại.", "内容が変わりました。再取得で更新できます。", "Konten berubah. Ambil ulang.")}</span>
              <button type="button" onClick={() => run(true)} disabled={busy} className="rounded-lg bg-[#191F28] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-60">{busy ? "…" : t("다시 받기", "Refresh", "重新获取", "Nhận lại", "再取得", "Ambil ulang")}</button>
            </div>
          ) : null}
          {grouped.map((g) => (
            <div key={g.cat}>
              <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#0B46E8]">{catLabel(t, g.cat)}</p>
              <ul className="mt-1.5 space-y-1.5">
                {g.items.map((q, i) => (
                  <li key={i} className="flex gap-2 rounded-xl border border-[#EEF1F5] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#333D4B]">
                    <span className="shrink-0 text-[#0B46E8]">Q.</span>
                    <span className="break-keep">{q.question}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {state === "error" ? <p className="mt-3 text-[13px] text-[#8B95A1]">{t("불러오지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't load. Please try again.", "无法加载，请稍后再试。", "Không thể tải. Vui lòng thử lại.", "読み込めませんでした。", "Tidak dapat memuat.")}</p> : null}
    </Card>
  );
}
