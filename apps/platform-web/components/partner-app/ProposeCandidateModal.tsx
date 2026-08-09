"use client";

// 모의 면접 참여자에게 제안하는 모달 — 메시지 + (선택) 면접 시간.
// 공고 상세 / 지원자 페이지(모의 면접 탭) / 홈 섹션에서 공통 사용.
import { useState } from "react";
import { useTalentPopup } from "../talent/feedback/TalentPopupProvider";
import { useLockBodyScroll } from "../../lib/talent/useLockBodyScroll";
import { proposeToMockInterviewCandidate } from "../../lib/member-profile-client";

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
  const toast = useTalentPopup();
  useLockBodyScroll();
  const [message, setMessage] = useState("모의 면접 결과가 인상적이에요. 함께 이야기 나눠보고 싶습니다.");
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
        toast.success("제안을 보냈어요");
        onDone();
      })
      .catch(() => toast.error("제안에 실패했어요."))
      .finally(() => setSaving(false));
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-[440px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6">
          <p className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{name} 님에게 제안</p>
          <p className="mt-1 text-[12.5px] text-[#8B95A1]">수락하면 연락처가 공유돼요. 면접 시간을 함께 제안할 수 있어요.</p>
        </div>
        <div className="flex flex-col gap-3.5 px-6 py-4">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">메시지</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28] outline-none focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">면접 시간 제안 <span className="font-normal text-[#B0B8C1]">(선택)</span></span>
            <div className="flex gap-1.5">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-w-0 flex-1 rounded-lg bg-[#F5F6F8] px-3 py-2.5 text-[13px] text-[#191F28] outline-none [color-scheme:light]" />
              <select value={time} onChange={(e) => setTime(e.target.value)} className="w-[110px] shrink-0 rounded-lg bg-[#F5F6F8] px-2.5 py-2.5 text-[13px] text-[#191F28] outline-none [color-scheme:light]">
                <option value="">시간</option>
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </label>
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button type="button" onClick={onClose} disabled={saving} className="h-[50px] flex-1 rounded-2xl bg-[#F2F4F6] text-[14.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">취소</button>
          <button type="button" onClick={submit} disabled={saving} className="h-[50px] flex-1 rounded-2xl bg-[#0B46E8] text-[14.5px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">{saving ? "보내는 중…" : "제안 보내기"}</button>
        </div>
      </div>
    </div>
  );
}
