"use client";

// Week 3 — 자소서 질문 분석. 문항을 넣으면 질문 의도 + 쓰기 좋은 내 경험(적합도 별점)을 알려준다.
import { useState } from "react";
import { CircleNotch, Question } from "@phosphor-icons/react";
import { analyzeCoverQuestion, type CoverQuestionResult } from "../../lib/launch/feedback-client";
import { Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

function stars(fit: number): string {
  const n = Math.max(1, Math.min(5, Math.round(fit / 20)));
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
}

export function CoverQuestionCard() {
  const t = useLaunchT();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CoverQuestionResult | null>(null);
  const [err, setErr] = useState("");

  const run = async () => {
    const text = q.trim();
    if (text.length < 3 || busy) return;
    setBusy(true);
    setErr("");
    try {
      setResult(await analyzeCoverQuestion(text));
    } catch (e) {
      const quota = e instanceof Error && /quota|402|포인트|ticket/i.test(e.message);
      setErr(quota ? t("AI 포인트를 모두 사용했어요.", "You're out of AI points.", "AI积分已用完。", "Hết điểm AI.", "AIポイントを使い切りました。", "Poin AI habis.") : t("잠시 문제가 생겼어요. 다시 시도해 주세요.", "Something went wrong. Please try again.", "出现了一点问题，请重试。", "Đã xảy ra sự cố. Vui lòng thử lại.", "問題が発生しました。もう一度お試しください。", "Terjadi masalah. Coba lagi."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="md:!p-6">
      <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-[#0B46E8]"><Question className="h-4 w-4" weight="fill" /> {t("자소서 질문 분석", "Cover-letter question analysis", "自我介绍问题分析", "Phân tích câu hỏi thư", "自己紹介書の設問分析", "Analisis pertanyaan surat")}</p>
      <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t("자소서 문항을 붙여넣으면 기업이 보고 싶어 하는 것과, 그 질문에 쓰기 좋은 내 경험을 알려드려요.", "Paste a prompt and we'll show what the company wants — and which of your experiences fit best.", "粘贴题目，我们会告诉你企业想看什么，以及最适合的经验。", "Dán câu hỏi, chúng tôi cho biết công ty muốn gì và kinh nghiệm nào hợp nhất.", "設問を貼ると、企業が見たいものと、その質問に合う経験を提示します。", "Tempel pertanyaan, kami tunjukkan yang dicari perusahaan dan pengalaman paling cocok.")}</p>

      <textarea
        value={q}
        onChange={(e) => setQ(e.target.value)}
        rows={2}
        placeholder={t("예: 실패 경험과 이를 극복한 과정을 작성하세요.", "e.g. Describe a failure and how you overcame it.", "例：请写下失败经历及克服过程。", "VD: Mô tả thất bại và cách vượt qua.", "例：失敗経験とその克服過程を書いてください。", "cth: Ceritakan kegagalan dan cara mengatasinya.")}
        className="mt-3 w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        {err ? <p className="text-[12.5px] font-semibold text-[#F04452]">{err}</p> : <span />}
        <button type="button" onClick={run} disabled={q.trim().length < 3 || busy} className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13.5px] font-bold transition ${q.trim().length >= 3 && !busy ? "bg-[#191F28] text-white hover:bg-[#0B1227]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"}`}>
          {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : null}
          {busy ? t("분석 중…", "Analyzing…", "分析中…", "Đang phân tích…", "分析中…", "Menganalisis…") : t("질문 분석", "Analyze", "分析问题", "Phân tích", "設問を分析", "Analisis")}
        </button>
      </div>

      {result ? (
        <div className="mt-4 flex flex-col gap-3">
          {result.intent.length > 0 ? (
            <div className="rounded-2xl bg-[#F8FAFF] p-4">
              <p className="text-[11.5px] font-bold text-[#0B46E8]">🎯 {t("이 질문에서 보고 싶은 것", "What the question looks for", "该问题想看的", "Điều câu hỏi tìm", "この設問が見たいもの", "Yang dicari pertanyaan")}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">{result.intent.map((it, i) => <span key={i} className="rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-[#0B46E8]">{it}</span>)}</div>
            </div>
          ) : null}
          {result.recommended.length > 0 ? (
            <div className="rounded-2xl border border-[#EEF1F5] p-4">
              <p className="text-[11.5px] font-bold text-[#191F28]">📌 {t("이 질문에 쓰기 좋은 내 경험", "Your experiences that fit", "适合此题的经验", "Kinh nghiệm phù hợp", "この設問に合う経験", "Pengalaman yang cocok")}</p>
              <ul className="mt-2 space-y-2">
                {result.recommended.map((r, i) => (
                  <li key={i} className="break-keep text-[13px] leading-relaxed">
                    <span className="font-bold text-[#191F28]">{r.experience}</span> <span className="text-[12px] font-semibold text-[#F5A524]">{stars(r.fit)}</span>
                    <span className="block text-[12.5px] text-[#8B95A1]">{r.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
