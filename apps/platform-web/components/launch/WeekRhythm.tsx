"use client";

// 매주 반복되는 5단계 리듬 — LEARN → TALK → BUILD → REVIEW → COMPLETE.
// 학생이 이번 주 흐름을 한눈에 이해하게 하는 매거진 스트립.
import { GraduationCap, ChatCircleText, PenNib, MagnifyingGlass, CheckCircle } from "@phosphor-icons/react";
import { useLaunchT } from "../../lib/launch/i18n";

export function WeekRhythm() {
  const t = useLaunchT();
  const steps = [
    { key: "LEARN", Icon: GraduationCap, label: t("배우기", "Learn", "学习", "Học", "学ぶ", "Belajar"), sub: t("세미나·짧은 콘텐츠", "Seminar · content", "研讨会·内容", "Hội thảo · nội dung", "セミナー・コンテンツ", "Seminar · konten") },
    { key: "TALK", Icon: ChatCircleText, label: t("대화하기", "Talk", "对话", "Trò chuyện", "対話", "Ngobrol"), sub: t("AI 코치와 대화", "Chat with AI coach", "与AI教练对话", "Trò chuyện AI", "AIコーチと対話", "Ngobrol AI") },
    { key: "BUILD", Icon: PenNib, label: t("만들기", "Build", "制作", "Tạo", "作る", "Buat"), sub: t("결과물 만들기", "Build deliverables", "制作成果", "Tạo kết quả", "成果物を作る", "Buat hasil") },
    { key: "REVIEW", Icon: MagnifyingGlass, label: t("점검하기", "Review", "评审", "Đánh giá", "点検", "Tinjau"), sub: t("AI 평가·수정", "AI review · fix", "AI评估·修改", "AI đánh giá", "AI評価・修正", "AI nilai · perbaiki") },
    { key: "COMPLETE", Icon: CheckCircle, label: t("완료하기", "Complete", "完成", "Hoàn tất", "完了", "Selesai"), sub: t("이번 주 미션 완료", "Finish the mission", "完成本周任务", "Xong nhiệm vụ", "ミッション完了", "Selesaikan misi") }
  ];
  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-4 md:p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8B95A1]">{t("이번 주 흐름", "This week's rhythm", "本周流程", "Nhịp tuần này", "今週の流れ", "Ritme minggu ini")}</p>
      <div className="mt-3 flex items-stretch gap-1 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={s.key} className="flex min-w-0 flex-1 items-center gap-1">
            <div className="flex min-w-[68px] flex-1 flex-col items-center rounded-xl bg-[#F8FAFF] px-2 py-3 text-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EDF1FD] text-[#0B46E8]"><s.Icon className="h-4 w-4" weight="fill" /></span>
              <span className="mt-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#0B46E8]">{s.key}</span>
              <span className="mt-0.5 text-[12px] font-bold text-[#191F28]">{s.label}</span>
              <span className="mt-0.5 hidden break-keep text-[10.5px] leading-tight text-[#8B95A1] sm:block">{s.sub}</span>
            </div>
            {i < steps.length - 1 ? <span className="shrink-0 text-[13px] font-black text-[#C4CAD2]">›</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
