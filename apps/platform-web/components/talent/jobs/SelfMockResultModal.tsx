"use client";

// 내 서류 기반 self 모의 면접의 "지난 연습 결과"를 저장된 기록 그대로 보여준다.
// (모의 면접은 열 때마다 새 질문을 생성하므로, 결과는 저장된 답변/피드백을 직접 렌더한다.)
import { useState } from "react";
import { X, CaretDown, Trash } from "@phosphor-icons/react";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { catMeta } from "../../../lib/talent/mock-interview-categories";
import { useSelfMock, clearSelfMock, type SelfMockAnswer } from "../../../lib/talent/self-mock";
import { usePlatformT } from "../../../lib/i18n";

export function SelfMockResultModal({ onClose }: { onClose: () => void }) {
  const t = usePlatformT();
  useLockBodyScroll();
  const record = useSelfMock();
  const answers = record?.answers ?? [];

  function reset() {
    if (typeof window !== "undefined" && !window.confirm(t("지난 연습 결과를 모두 지울까요?", "Delete all past practice results?", "删除所有过往练习记录？", "Xóa toàn bộ kết quả luyện tập cũ?", "過去の練習結果をすべて削除しますか？", "Hapus semua hasil latihan sebelumnya?"))) return;
    clearSelfMock();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-3xl bg-white sm:h-[680px] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-[#F2F4F6] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[15px] font-black tracking-[-0.02em] text-[#0B1227]">{t("내 모의 면접 연습 결과", "My mock interview results", "我的模拟面试练习结果", "Kết quả luyện phỏng vấn của tôi", "私の模擬面接練習結果", "Hasil latihan wawancara saya")}</p>
            <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">{t("내 이력서·자기소개서 기반 연습 기록", "Practice log based on my resume & cover letter", "基于我的简历和自我介绍的练习记录", "Nhật ký luyện tập dựa trên CV và thư xin việc", "私の履歴書・自己PRに基づく練習記録", "Log latihan berdasarkan resume & surat lamaran saya")}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {answers.length === 0 ? (
            <p className="py-10 text-center text-[13.5px] text-[#8B95A1]">{t("아직 연습 기록이 없어요. 모의 면접을 진행하면 여기에 쌓여요.", "No practice records yet. Do a mock interview and it'll appear here.", "还没有练习记录。进行模拟面试后会显示在这里。", "Chưa có bản ghi luyện tập. Làm phỏng vấn thử để hiện ở đây.", "まだ練習記録がありません。模擬面接を行うとここに溜まります。", "Belum ada catatan latihan. Lakukan wawancara simulasi untuk melihatnya di sini.")}</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl bg-[#F5F8FF] p-4">
                <p className="text-[13px] font-bold text-[#0B46E8]">{t(`연습한 문항 ${answers.length}개`, `${answers.length} question${answers.length > 1 ? "s" : ""} practiced`, `已练习 ${answers.length} 道题`, `Đã luyện ${answers.length} câu`, `練習した設問 ${answers.length}件`, `${answers.length} pertanyaan dilatih`)}</p>
                <p className="mt-1 break-keep text-[12.5px] text-[#8B95A1]">{t("문항별 답변과 AI 피드백을 다시 확인해요.", "Review your answers and AI feedback per question.", "逐题回顾你的回答和 AI 反馈。", "Xem lại câu trả lời và phản hồi AI theo từng câu.", "設問ごとの回答とAIフィードバックを確認します。", "Tinjau jawaban dan umpan balik AI per pertanyaan.")}</p>
              </div>

              <div className="flex flex-col gap-2.5">
                {answers.map((a, i) => (
                  <AnswerCard key={i} a={a} defaultOpen={i === 0} />
                ))}
              </div>

              <button type="button" onClick={reset} className="mt-1 inline-flex items-center justify-center gap-1.5 self-center rounded-xl px-3 py-2 text-[12.5px] font-bold text-[#8B95A1] transition hover:bg-[#F2F4F6] hover:text-[#F04452]">
                <Trash className="h-4 w-4" /> {t("기록 초기화", "Reset records", "重置记录", "Xóa bản ghi", "記録をリセット", "Reset catatan")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnswerCard({ a, defaultOpen }: { a: SelfMockAnswer; defaultOpen?: boolean }) {
  const t = usePlatformT();
  const [open, setOpen] = useState(!!defaultOpen);
  const meta = catMeta(a.category);
  const fb = a.feedback ?? null;
  return (
    <div className="overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full flex-col gap-1.5 px-4 py-3.5 text-left">
        <span className={`inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10.5px] font-bold ${meta.badge}`}>{meta.emoji} {meta.label}</span>
        <span className="flex w-full items-start gap-2.5">
          <span className="min-w-0 flex-1 break-keep text-[13.5px] font-bold text-[#191F28]">{a.question}</span>
          <CaretDown className={`mt-0.5 h-4 w-4 shrink-0 text-[#B0B8C1] transition ${open ? "rotate-180" : ""}`} weight="bold" />
        </span>
      </button>
      {open ? (
        <div className="border-t border-[#F2F4F6] px-4 py-3.5">
          <p className="text-[11.5px] font-bold text-[#8B95A1]">{t("내 답변", "My answer", "我的回答", "Câu trả lời của tôi", "私の回答", "Jawaban saya")}</p>
          <p className="mt-1 whitespace-pre-wrap break-keep text-[13px] leading-relaxed text-[#4E5968]">{a.answer || "—"}</p>

          {fb ? (
            <div className="mt-3 flex flex-col gap-2.5 rounded-2xl bg-[#F8FAFB] p-3.5">
              {fb.strengths.length ? (
                <div>
                  <p className="text-[11.5px] font-bold text-[#0A9B59]">{t("잘한 점", "Strengths", "亮点", "Điểm mạnh", "良かった点", "Kelebihan")}</p>
                  <ul className="mt-1 flex flex-col gap-0.5">{fb.strengths.map((s, i) => <li key={i} className="break-keep text-[12.5px] text-[#4E5968]">· {s}</li>)}</ul>
                </div>
              ) : null}
              {fb.improvements.length ? (
                <div>
                  <p className="text-[11.5px] font-bold text-[#E8890C]">{t("개선하면 좋아요", "Areas to improve", "可改进之处", "Cần cải thiện", "改善するとよい点", "Perlu diperbaiki")}</p>
                  <ul className="mt-1 flex flex-col gap-0.5">{fb.improvements.map((s, i) => <li key={i} className="break-keep text-[12.5px] text-[#4E5968]">· {s}</li>)}</ul>
                </div>
              ) : null}
              {fb.sampleAnswer ? (
                <div>
                  <p className="text-[11.5px] font-bold text-[#0B46E8]">{t("모범답안(내 이력서 기반)", "Model answer (based on my resume)", "范例答案（基于我的简历）", "Câu trả lời mẫu (dựa trên CV của tôi)", "模範回答（私の履歴書に基づく）", "Jawaban model (berdasarkan resume saya)")}</p>
                  <p className="mt-1 whitespace-pre-wrap break-keep text-[12.5px] leading-relaxed text-[#4E5968]">{fb.sampleAnswer}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
