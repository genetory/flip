"use client";

import { useEffect, useState } from "react";
import { Sparkle, CircleNotch } from "@phosphor-icons/react";
import { fetchFinalFeedback } from "../../lib/launch/feedback-client";
import { trackCareerFinalFeedback } from "../../lib/analytics";
import { Card } from "./ui";
import { RichText } from "./rich-text";
import { useLaunchT } from "../../lib/launch/i18n";

// 완주 최종 피드백 — 이력서·자기소개서·면접 종합. 자동 생성(과금)하지 않고,
// 저장분이 있으면 보여주고 없으면 '받기' 버튼으로 사용자가 요청할 때만 생성(AI 포인트 2개).
export function FinalFeedbackCard() {
  const t = useLaunchT();
  const [state, setState] = useState<"loading" | "ready" | "done" | "none" | "error">("loading");
  const [text, setText] = useState("");
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [quota, setQuota] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const fb = await fetchFinalFeedback({ generate: false });
        if (!alive) return;
        if (fb.text && fb.text.trim()) {
          setText(fb.text);
          setStale(fb.stale);
          setState("done");
          trackCareerFinalFeedback("view");
        } else if (fb.needsGenerate) {
          setState("ready");
        } else {
          setState("none");
        }
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
    setQuota(false);
    setFailed(false);
    trackCareerFinalFeedback(force ? "regenerate" : "view");
    try {
      const fb = await fetchFinalFeedback({ force, generate: true });
      if (fb.text && fb.text.trim()) {
        setText(fb.text);
        setStale(false);
        setState("done");
      } else {
        setFailed(true); // 응답은 왔지만 내용이 비어 있음 → 재시도 안내.
      }
    } catch (e) {
      // 포인트/한도(402) 오류는 정확히 구분해 안내하고, 그 외는 일반 재시도 안내(무응답 방지).
      if (e instanceof Error && /quota|402|포인트|ticket/i.test(e.message)) setQuota(true);
      else setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (state === "none") return null; // 종합할 결과물이 없으면 섹션 숨김

  return (
    <Card className="md:!p-6">
      {state === "done" && stale ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FFF9EC] px-3 py-2">
          <p className="text-[12px] font-semibold text-[#B7791F]">{t("결과물이 바뀌었어요. 최신 내용으로 다시 받을 수 있어요.", "Your work has changed. You can get updated feedback based on the latest content.", "你的内容已更新，可以根据最新内容重新获取反馈。", "Nội dung của bạn đã thay đổi. Bạn có thể nhận lại phản hồi theo nội dung mới nhất.", "内容が変わりました。最新の内容でもう一度受け取れます。", "Hasil kerja Anda telah berubah. Anda bisa mendapatkan umpan balik terbaru sesuai konten terkini.")}</p>
          <button
            type="button"
            onClick={() => run(true)}
            disabled={busy}
            className="shrink-0 rounded-lg border border-[#0B46E8]/25 bg-white px-2.5 py-1 text-[11.5px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD] disabled:opacity-50"
          >
            {busy ? t("받는 중…", "Getting…", "获取中…", "Đang nhận…", "受け取り中…", "Sedang mengambil…") : t("다시 받기", "Get again", "重新获取", "Nhận lại", "もう一度受け取る", "Ambil lagi")}
          </button>
        </div>
      ) : null}

      {state === "loading" ? (
        <p className="text-[13px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p>
      ) : state === "ready" ? (
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F4F6] text-[22px]" aria-hidden>🎯</span>
          <p className="mt-3 text-[15px] font-bold text-[#191F28]">{t("4주 종합 피드백을 받아보세요", "Get your 4-week summary feedback", "领取你的4周综合反馈", "Nhận phản hồi tổng hợp 4 tuần", "4週間の総合フィードバックを受け取りましょう", "Dapatkan umpan balik ringkas 4 minggu")}</p>
          <p className="mx-auto mt-1 max-w-[420px] break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t("이력서·자기소개서·면접을 종합해 AI 코치가 강점과 다음 단계를 정리해드려요.", "Your AI coach reviews your resume, cover letter, and interview to summarize your strengths and next steps.", "AI教练综合你的简历、自我介绍书与面试，整理优势与下一步。", "AI coach tổng hợp CV, thư giới thiệu và phỏng vấn để tóm tắt điểm mạnh và bước tiếp theo.", "AIコーチが履歴書・自己紹介書・面接を総合して強みと次のステップをまとめます。", "AI coach meninjau resume, surat lamaran, dan wawancara untuk merangkum kelebihan dan langkah berikutnya.")}</p>
          <button
            type="button"
            onClick={() => run(false)}
            disabled={busy}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-60"
          >
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
            {busy ? t("받는 중…", "Getting…", "获取中…", "Đang nhận…", "受け取り中…", "Sedang mengambil…") : t("최종 피드백 받기", "Get final feedback", "获取最终反馈", "Nhận phản hồi cuối", "最終フィードバックを受け取る", "Dapatkan umpan balik akhir")}
          </button>
          {quota ? <p className="mt-2 text-[12px] font-semibold text-[#F04452]">{t("AI 포인트가 부족해요. 충전 후 다시 시도해 주세요.", "You're out of AI points. Please recharge and try again.", "AI 积分不足，请充值后再试。", "Bạn đã hết điểm AI. Vui lòng nạp thêm và thử lại.", "AIポイントが不足しています。チャージ後にもう一度お試しください。", "Poin AI habis. Silakan isi ulang dan coba lagi.")}</p> : failed ? <p className="mt-2 text-[12px] font-semibold text-[#F04452]">{t("잠시 문제가 생겼어요. 잠시 후 다시 시도해 주세요.", "Something went wrong. Please try again in a moment.", "出现了一点问题，请稍后再试。", "Đã xảy ra sự cố. Vui lòng thử lại sau giây lát.", "問題が発生しました。少し後にもう一度お試しください。", "Terjadi masalah. Silakan coba lagi sebentar lagi.")}</p> : null}
        </div>
      ) : state === "done" ? (
        <div className="text-[14.5px] leading-[1.75] text-[#333D4B]">
          <RichText text={text} sectioned />
        </div>
      ) : (
        <p className="text-[13px] text-[#8B95A1]">{t("피드백을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't load the feedback. Please try again in a moment.", "无法加载反馈。请稍后再试。", "Không thể tải phản hồi. Vui lòng thử lại sau giây lát.", "フィードバックを読み込めませんでした。少し後にもう一度お試しください。", "Tidak dapat memuat umpan balik. Silakan coba lagi sebentar lagi.")}</p>
      )}

      {state === "done" ? (
        <p className="mt-3 border-t border-[#F2F4F6] pt-3 text-[11px] text-[#B0B8C1]">{t("AI가 이력서·자기소개서·면접을 종합해 생성해요.", "Generated by AI from your resume, cover letter, and interview.", "由AI综合简历、自我介绍书与面试生成。", "Do AI tổng hợp CV, thư giới thiệu và phỏng vấn.", "AIが履歴書・自己紹介書・面接を総合して生成します。", "Dibuat AI dari resume, surat lamaran, dan wawancara.")}</p>
      ) : null}
    </Card>
  );
}
