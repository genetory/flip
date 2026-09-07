"use client";

// 저장된 모의면접 한 건 다시보기 — 카드형(items)은 결과 리스트로 오답노트 재도전까지,
// 구버전(채팅 messages)은 읽기전용 대화로 표시. 레이아웃은 면접 세션 화면과 동일하게 통일.
import { X } from "@phosphor-icons/react";
import { RichText } from "./rich-text";
import { PostingResultList } from "./PostingResultList";
import { logRescore } from "../../lib/launch/interview-logs";
import { useLaunchT } from "../../lib/launch/i18n";
import type { PostingInterviewLog, PostingInterviewItem } from "../../lib/launch/progress-client";

export function PostingInterviewReview({ log, onClose, onLogChange }: { log: PostingInterviewLog; onClose: () => void; onLogChange: (log: PostingInterviewLog) => void }) {
  const t = useLaunchT();
  const label = [log.company, log.title].filter(Boolean).join(" · ") || t("모의면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi");
  const date = (() => {
    try {
      return new Date(log.at).toLocaleString();
    } catch {
      return "";
    }
  })();
  const items = log.items ?? [];
  const avg = items.length ? Math.round(items.reduce((s, it) => s + it.score, 0) / items.length) : null;
  const eyebrow =
    log.source === "basic"
      ? t("3주차 · 기본 면접", "Week 3 · Basic interview", "第3周 · 基础面试", "Tuần 3 · Phỏng vấn cơ bản", "Week 3 · 基本面接", "Minggu 3 · Wawancara dasar")
      : t("4주차 · 공고별 모의면접", "Week 4 · Posting mock interview", "第4周 · 公告模拟面试", "Tuần 4 · Phỏng vấn theo tin", "Week 4 · 求人別模擬面接", "Minggu 4 · Wawancara per lowongan");

  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#EEF1F5] px-5 py-3">
        <p className="min-w-0 truncate text-[14px] font-black tracking-[-0.01em] text-[#191F28]">{label}</p>
        <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#4E5968] transition hover:bg-[#F6F8FB]"><X className="h-5 w-5" weight="bold" /></button>
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-4 md:pt-8">
          <div className="mt-3.5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{eyebrow}</p>
            <h1 className="mt-1.5 break-keep text-[20px] font-black leading-[1.2] tracking-[-0.02em] text-[#191F28] md:text-[24px]">{label}</h1>
            {date ? <p className="mt-1.5 text-[12.5px] text-[#8B95A1]">{date}</p> : null}
          </div>

          {items.length ? (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[14px] font-black text-[#191F28]">{t("면접 결과", "Interview results", "面试结果", "Kết quả phỏng vấn", "面接結果", "Hasil wawancara")}</p>
                {avg != null ? <span className="rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[12px] font-bold text-[#0B46E8]">{t("평균", "Avg", "平均", "TB", "平均", "Rata")} {avg}</span> : null}
              </div>
              <PostingResultList items={items} rescore={logRescore(log)} onItemsChange={(next: PostingInterviewItem[]) => onLogChange({ ...log, items: next })} />
            </div>
          ) : log.messages?.length ? (
            <div className="mt-5 space-y-4 rounded-3xl border border-[#EEF1F5] bg-gradient-to-b from-[#F7F9FF] to-white p-4 md:p-5">
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
          ) : (
            <p className="mt-8 py-8 text-center text-[13px] text-[#8B95A1]">{t("표시할 내용이 없어요.", "Nothing to show.", "无内容可显示。", "Không có nội dung.", "表示する内容がありません。", "Tidak ada yang ditampilkan.")}</p>
          )}
        </div>
      </main>
    </div>
  );
}
