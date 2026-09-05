"use client";

// 저장된 공고별 모의면접 한 건 다시보기 — 카드형(items)은 결과 리스트로 오답노트 재도전까지,
// 구버전(채팅 messages)은 읽기전용 대화로 표시.
import { X } from "@phosphor-icons/react";
import { RichText } from "./rich-text";
import { PostingResultList } from "./PostingResultList";
import { logRescore } from "../../lib/launch/interview-logs";
import { useLaunchT } from "../../lib/launch/i18n";
import type { PostingInterviewLog, PostingInterviewItem } from "../../lib/launch/progress-client";

export function PostingInterviewReview({ log, onClose, onLogChange }: { log: PostingInterviewLog; onClose: () => void; onLogChange: (log: PostingInterviewLog) => void }) {
  const t = useLaunchT();
  const label = [log.company, log.title].filter(Boolean).join(" · ") || t("공고별 모의면접", "Posting mock interview", "公告模拟面试", "Phỏng vấn theo tin", "求人別模擬面接", "Wawancara per lowongan");
  const date = (() => {
    try {
      return new Date(log.at).toLocaleString();
    } catch {
      return "";
    }
  })();
  const items = log.items ?? [];
  const avg = items.length ? Math.round(items.reduce((s, it) => s + it.score, 0) / items.length) : null;

  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#EEF1F5] px-5 py-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-black tracking-[-0.01em] text-[#191F28]">{label}</p>
          {date ? <p className="text-[11.5px] text-[#8B95A1]">{date}{avg != null ? ` · ${t("평균", "Avg", "平均", "TB", "平均", "Rata")} ${avg}` : ""}</p> : null}
        </div>
        <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#4E5968] transition hover:bg-[#F6F8FB]"><X className="h-5 w-5" weight="bold" /></button>
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-5 py-5">
          {items.length ? (
            <PostingResultList items={items} rescore={logRescore(log)} onItemsChange={(next: PostingInterviewItem[]) => onLogChange({ ...log, items: next })} />
          ) : log.messages?.length ? (
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
          ) : (
            <p className="py-8 text-center text-[13px] text-[#8B95A1]">{t("표시할 내용이 없어요.", "Nothing to show.", "无内容可显示。", "Không có nội dung.", "表示する内容がありません。", "Tidak ada yang ditampilkan.")}</p>
          )}
        </div>
      </main>
    </div>
  );
}
