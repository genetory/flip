"use client";

// 저장된 공고별 모의면접 한 건을 읽기전용으로 다시 본다(질문·답변 + 준비도 리포트).
import { X } from "@phosphor-icons/react";
import { RichText } from "./rich-text";
import { useLaunchT } from "../../lib/launch/i18n";
import type { PostingInterviewLog } from "../../lib/launch/progress-client";

export function PostingInterviewLogView({ log, onClose }: { log: PostingInterviewLog; onClose: () => void }) {
  const t = useLaunchT();
  const label = [log.company, log.title].filter(Boolean).join(" · ") || t("공고별 모의면접", "Posting mock interview", "公告模拟面试", "Phỏng vấn theo tin", "求人別模擬面接", "Wawancara per lowongan");
  const date = (() => {
    try {
      return new Date(log.at).toLocaleString();
    } catch {
      return "";
    }
  })();
  const rep = log.report;

  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#EEF1F5] px-5 py-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-black tracking-[-0.01em] text-[#191F28]">{label}</p>
          {date ? <p className="text-[11.5px] text-[#8B95A1]">{date}</p> : null}
        </div>
        <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#4E5968] transition hover:bg-[#F6F8FB]"><X className="h-5 w-5" weight="bold" /></button>
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-4 px-5 py-5">
          <div className="space-y-4 rounded-3xl border border-[#EEF1F5] bg-gradient-to-b from-[#F7F9FF] to-white p-4 md:p-5">
            {log.messages.map((m, i) =>
              m.role === "bot" ? (
                <div key={i} className="flex items-end gap-2">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[15px]">🎤</span>
                  <div className="max-w-[84%] whitespace-pre-wrap break-keep rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[14px] leading-relaxed text-[#191F28] shadow-[0_1px_3px_rgba(17,24,39,0.06)]"><RichText text={m.text} /></div>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[84%] whitespace-pre-wrap break-keep rounded-2xl rounded-br-md bg-[#0B46E8] px-4 py-3 text-[14px] leading-relaxed text-white shadow-[0_2px_8px_-2px_rgba(11,70,232,0.4)]"><RichText text={m.text} /></div>
                </div>
              )
            )}
          </div>

          {rep && (rep.strengths.length > 0 || rep.improvements.length > 0 || rep.modelAnswer) ? (
            <div className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0B46E8]">{t("이 공고 면접 준비도 리포트", "Readiness report for this posting", "本公告面试准备度报告", "Báo cáo sẵn sàng cho tin này", "この求人の準備度レポート", "Laporan kesiapan lowongan ini")}</p>
              {rep.strengths.length > 0 ? (
                <div className="mt-3">
                  <p className="text-[12.5px] font-bold text-[#0A9B59]">💪 {t("잘한 점", "Strengths", "做得好", "Điểm mạnh", "良かった点", "Kelebihan")}</p>
                  <ul className="mt-1 space-y-1">{rep.strengths.map((s, i) => <li key={i} className="break-keep text-[13px] leading-relaxed text-[#333D4B]">· {s}</li>)}</ul>
                </div>
              ) : null}
              {rep.improvements.length > 0 ? (
                <div className="mt-3">
                  <p className="text-[12.5px] font-bold text-[#C77700]">✏️ {t("더 다듬을 점", "To improve", "可改进", "Cần cải thiện", "改善点", "Perlu diperbaiki")}</p>
                  <ul className="mt-1 space-y-1">{rep.improvements.map((s, i) => <li key={i} className="break-keep text-[13px] leading-relaxed text-[#333D4B]">· {s}</li>)}</ul>
                </div>
              ) : null}
              {rep.modelAnswer ? (
                <div className="mt-3 rounded-xl bg-[#F8FAFF] p-3">
                  <p className="text-[12.5px] font-bold text-[#0B46E8]">🧭 {t("모범 답변 방향", "Model answer direction", "范例答案方向", "Hướng trả lời mẫu", "模範解答の方向", "Arah jawaban contoh")}</p>
                  <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#333D4B]">{rep.modelAnswer}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
