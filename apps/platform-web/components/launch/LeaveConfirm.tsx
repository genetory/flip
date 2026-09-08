"use client";

// 저장 안 한 변경이 있을 때 편집기를 나가려 하면 확인받는 작은 모달.
import { useEffect } from "react";
import type { useLaunchT } from "../../lib/launch/i18n";

export function LeaveConfirm({ onStay, onLeave, t }: { onStay: () => void; onLeave: () => void; t: ReturnType<typeof useLaunchT> }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onStay(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStay]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0B1227]/40 p-4" onClick={onStay}>
      <div className="w-full max-w-[360px] rounded-3xl bg-white p-6 shadow-[0_24px_60px_-20px_rgba(11,18,39,0.4)]" onClick={(e) => e.stopPropagation()}>
        <p className="text-[16px] font-black tracking-[-0.01em] text-[#191F28]">{t("변경 내용을 취소할까요?", "Discard changes?", "要放弃更改吗？", "Hủy thay đổi?", "変更を取り消しますか？", "Buang perubahan?")}</p>
        <p className="mt-2 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">{t("저장하지 않은 변경 내용이 있어요. 취소하고 나가면 이번 변경 내용은 사라져요.", "You have unsaved changes. If you cancel and leave, these changes will be lost.", "有未保存的更改。取消并离开将丢失这些更改。", "Bạn có thay đổi chưa lưu. Nếu hủy và rời đi, các thay đổi này sẽ mất.", "保存していない変更があります。取り消して出ると今回の変更は失われます。", "Ada perubahan yang belum disimpan. Jika batal dan keluar, perubahan ini hilang.")}</p>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onStay} className="flex-1 rounded-xl border border-[#E5E8EB] bg-white px-4 py-2.5 text-[13.5px] font-bold text-[#4E5968] transition hover:text-[#191F28]">
            {t("계속 편집", "Keep editing", "继续编辑", "Tiếp tục sửa", "編集を続ける", "Lanjut edit")}
          </button>
          <button type="button" onClick={onLeave} className="flex-1 rounded-xl bg-[#F04452] px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#D93A47]">
            {t("취소하고 나가기", "Discard & leave", "放弃并离开", "Hủy & rời đi", "取り消して出る", "Buang & keluar")}
          </button>
        </div>
      </div>
    </div>
  );
}
