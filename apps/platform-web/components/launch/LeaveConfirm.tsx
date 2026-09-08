"use client";

// 편집기에서 되돌리기/이탈처럼 되돌릴 수 없는 동작 전에 확인받는 작은 모달.
// 기본 문구는 '나가기(이탈)'용. title/desc/confirmLabel 을 넘기면 '변경 취소(되돌리기)' 등으로 재사용.
import { useEffect } from "react";
import type { useLaunchT } from "../../lib/launch/i18n";

export function LeaveConfirm({
  onStay,
  onConfirm,
  t,
  title,
  desc,
  confirmLabel,
  stayLabel
}: {
  onStay: () => void;
  onConfirm: () => void;
  t: ReturnType<typeof useLaunchT>;
  title?: string;
  desc?: string;
  confirmLabel?: string;
  stayLabel?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onStay(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStay]);

  const titleText = title ?? t("나가시겠어요?", "Leave this page?", "要离开吗？", "Rời trang này?", "このページを離れますか？", "Tinggalkan halaman?");
  const descText = desc ?? t("저장하지 않은 변경 내용이 있어요. 나가면 이번 변경 내용은 사라져요.", "You have unsaved changes. If you leave, these changes will be lost.", "有未保存的更改。离开将丢失这些更改。", "Bạn có thay đổi chưa lưu. Nếu rời đi, các thay đổi này sẽ mất.", "保存していない変更があります。離れると今回の変更は失われます。", "Ada perubahan yang belum disimpan. Jika keluar, perubahan ini hilang.");
  const confirmText = confirmLabel ?? t("나가기", "Leave", "离开", "Rời đi", "離れる", "Keluar");
  const stayText = stayLabel ?? t("계속 편집", "Keep editing", "继续编辑", "Tiếp tục sửa", "編集を続ける", "Lanjut edit");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0B1227]/40 p-4" onClick={onStay}>
      <div className="w-full max-w-[360px] rounded-3xl bg-white p-6 shadow-[0_24px_60px_-20px_rgba(11,18,39,0.4)]" onClick={(e) => e.stopPropagation()}>
        <p className="text-[16px] font-black tracking-[-0.01em] text-[#191F28]">{titleText}</p>
        <p className="mt-2 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">{descText}</p>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onStay} className="flex-1 rounded-xl border border-[#E5E8EB] bg-white px-4 py-2.5 text-[13.5px] font-bold text-[#4E5968] transition hover:text-[#191F28]">
            {stayText}
          </button>
          <button type="button" onClick={onConfirm} className="flex-1 rounded-xl bg-[#F04452] px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#D93A47]">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
