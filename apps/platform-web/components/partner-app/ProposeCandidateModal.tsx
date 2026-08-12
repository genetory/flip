"use client";

// 모의 면접 참여자에게 제안하는 모달 — 메시지 + (선택) 면접 시간.
// 공고 상세 / 지원자 페이지(모의 면접 탭) / 홈 섹션에서 공통 사용.
import { useState } from "react";
import { useTalentPopup } from "../talent/feedback/TalentPopupProvider";
import { useLockBodyScroll } from "../../lib/talent/useLockBodyScroll";
import { proposeToMockInterviewCandidate } from "../../lib/member-profile-client";
import { usePlatformT } from "../../lib/i18n";

const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 8; h <= 23; h += 1) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
})();

export function ProposeCandidateModal({
  positionId,
  userId,
  name,
  onClose,
  onDone
}: {
  positionId: string;
  userId: string;
  name: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = usePlatformT();
  const toast = useTalentPopup();
  useLockBodyScroll();
  const [message, setMessage] = useState(t(
    "모의 면접 결과가 인상적이에요. 함께 이야기 나눠보고 싶습니다.",
    "Your mock interview results are impressive. I'd love to talk with you.",
    "您的模拟面试结果令人印象深刻，很想与您聊聊。",
    "Kết quả phỏng vấn thử của bạn rất ấn tượng. Tôi rất muốn trò chuyện với bạn.",
    "模擬面接の結果が印象的でした。ぜひお話ししたいです。",
    "Hasil wawancara simulasi Anda mengesankan. Saya ingin berbincang dengan Anda."
  ));
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);

  function submit() {
    if (saving) return;
    let interviewAt: string | undefined;
    if (date && time) {
      const d = new Date(`${date}T${time}`);
      d.setMinutes(Math.round(d.getMinutes() / 30) * 30, 0, 0);
      interviewAt = d.toISOString();
    }
    setSaving(true);
    proposeToMockInterviewCandidate(positionId, userId, { message: message.trim() || undefined, interviewAt })
      .then(() => {
        toast.success(t("제안을 보냈어요", "Proposal sent", "已发送提议", "Đã gửi đề nghị", "提案を送りました", "Ajakan terkirim"));
        onDone();
      })
      .catch(() => toast.error(t("제안에 실패했어요.", "Failed to send proposal.", "发送提议失败。", "Gửi đề nghị thất bại.", "提案の送信に失敗しました。", "Gagal mengirim ajakan.")))
      .finally(() => setSaving(false));
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-[440px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6">
          <p className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t(`${name} 님에게 제안`, `Propose to ${name}`, `向 ${name} 发送提议`, `Đề nghị với ${name}`, `${name} さんへ提案`, `Ajukan ke ${name}`)}</p>
          <p className="mt-1 text-[12.5px] text-[#8B95A1]">{t("수락하면 연락처가 공유돼요. 면접 시간을 함께 제안할 수 있어요.", "If accepted, contact details are shared. You can also propose an interview time.", "对方接受后将共享联系方式，您还可一并提议面试时间。", "Nếu chấp nhận, thông tin liên hệ sẽ được chia sẻ. Bạn cũng có thể đề nghị giờ phỏng vấn.", "承諾されると連絡先が共有されます。面接時間も一緒に提案できます。", "Jika diterima, kontak akan dibagikan. Anda juga bisa mengusulkan waktu wawancara.")}</p>
        </div>
        <div className="flex flex-col gap-3.5 px-6 py-4">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">{t("메시지", "Message", "留言", "Tin nhắn", "メッセージ", "Pesan")}</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28] outline-none focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">{t("면접 시간 제안", "Propose interview time", "提议面试时间", "Đề nghị giờ phỏng vấn", "面接時間の提案", "Usulkan waktu wawancara")} <span className="font-normal text-[#B0B8C1]">{t("(선택)", "(optional)", "（可选）", "(tùy chọn)", "(任意)", "(opsional)")}</span></span>
            <div className="flex gap-1.5">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-w-0 flex-1 rounded-lg bg-[#F5F6F8] px-3 py-2.5 text-[13px] text-[#191F28] outline-none [color-scheme:light]" />
              <select value={time} onChange={(e) => setTime(e.target.value)} className="w-[110px] shrink-0 rounded-lg bg-[#F5F6F8] px-2.5 py-2.5 text-[13px] text-[#191F28] outline-none [color-scheme:light]">
                <option value="">{t("시간", "Time", "时间", "Giờ", "時間", "Waktu")}</option>
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </label>
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button type="button" onClick={onClose} disabled={saving} className="h-[50px] flex-1 rounded-2xl bg-[#F2F4F6] text-[14.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">{t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}</button>
          <button type="button" onClick={submit} disabled={saving} className="h-[50px] flex-1 rounded-2xl bg-[#0B46E8] text-[14.5px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">{saving ? t("보내는 중…", "Sending…", "发送中…", "Đang gửi…", "送信中…", "Mengirim…") : t("제안 보내기", "Send proposal", "发送提议", "Gửi đề nghị", "提案を送る", "Kirim ajakan")}</button>
        </div>
      </div>
    </div>
  );
}
