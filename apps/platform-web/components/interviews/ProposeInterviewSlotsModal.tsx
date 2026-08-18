"use client";

import { useEffect, useState } from "react";
import { readAccessToken } from "../../lib/auth-client";
import { usePlatformT } from "../../lib/i18n";

type SlotInput = {
  date: string;
  startTime: string;
  endTime: string;
  location: string;
};

type Props = {
  open: boolean;
  applicationId?: string;
  applicantName?: string | null;
  positionTitle?: string | null;
  onClose: () => void;
  onProposed?: () => void;
};

// 30분 단위 시간 옵션(00:00 ~ 23:30) — 면접 제안 시간은 항상 30분 그리드에 맞춘다.
const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 30, mins));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function emptySlot(): SlotInput {
  return { date: "", startTime: "10:00", endTime: "10:30", location: "" };
}

function toIsoString(date: string, time: string) {
  if (!date || !time) return null;
  const local = new Date(`${date}T${time}:00`);
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}

export function ProposeInterviewSlotsModal({ open, applicationId, applicantName, positionTitle, onClose, onProposed }: Props) {
  const t = usePlatformT();
  const [slots, setSlots] = useState<SlotInput[]>([emptySlot(), emptySlot()]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSlots([emptySlot(), emptySlot()]);
      setNotes("");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  function updateSlot(index: number, partial: Partial<SlotInput>) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...partial } : s)));
  }

  // 시작 시간을 바꾸면 종료가 시작보다 이르거나 같아지지 않도록 자동으로 +30분 보정.
  function changeStart(index: number, startTime: string) {
    setSlots((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const next = { ...s, startTime };
        if (timeToMinutes(next.endTime) <= timeToMinutes(startTime)) {
          next.endTime = minutesToTime(timeToMinutes(startTime) + 30);
        }
        return next;
      })
    );
  }

  function addSlot() {
    if (slots.length >= 5) return;
    setSlots((prev) => [...prev, emptySlot()]);
  }

  function removeSlot(index: number) {
    setSlots((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handleSubmit() {
    if (!applicationId) return;
    setError(null);
    const payload: { startsAt: string; endsAt: string; location?: string; notes?: string }[] = [];
    // 겹침 검증용 구간(ms). 같은 시간대가 서로 겹치지 않아야 한다.
    const ranges: { start: number; end: number }[] = [];
    for (const s of slots) {
      const startsAt = toIsoString(s.date, s.startTime);
      const endsAt = toIsoString(s.date, s.endTime);
      if (!startsAt || !endsAt) {
        setError(t("모든 일정의 날짜와 시간을 입력해 주세요.", "Please enter the date and time for all slots.", "请输入所有时段的日期和时间。", "Vui lòng nhập ngày và giờ cho tất cả các khung giờ.", "すべての候補の日付と時間を入力してください。", "Harap masukkan tanggal dan waktu untuk semua slot."));
        return;
      }
      // 30분 그리드 확인(안전장치 — 셀렉트로만 입력되면 항상 통과).
      if (timeToMinutes(s.startTime) % 30 !== 0 || timeToMinutes(s.endTime) % 30 !== 0) {
        setError(t("면접 시간은 30분 단위로 선택해 주세요.", "Please choose interview times in 30-minute increments.", "请以30分钟为单位选择面试时间。", "Vui lòng chọn thời gian phỏng vấn theo mốc 30 phút.", "面接時間は30分単位で選択してください。", "Silakan pilih waktu wawancara dalam kelipatan 30 menit."));
        return;
      }
      const startMs = new Date(startsAt).getTime();
      const endMs = new Date(endsAt).getTime();
      if (endMs <= startMs) {
        setError(t("종료 시간이 시작 시간보다 늦어야 합니다.", "The end time must be later than the start time.", "结束时间必须晚于开始时间。", "Thời gian kết thúc phải muộn hơn thời gian bắt đầu.", "終了時間は開始時間より後でなければなりません。", "Waktu selesai harus lebih lambat dari waktu mulai."));
        return;
      }
      // 앞선 옵션들과 시간대가 겹치는지 확인(반열림 구간 [start, end)).
      if (ranges.some((r) => startMs < r.end && endMs > r.start)) {
        setError(t("제안한 면접 시간이 서로 겹칩니다. 겹치지 않게 조정해 주세요.", "The proposed interview times overlap. Please adjust them so they don't overlap.", "提议的面试时间相互重叠。请调整以避免重叠。", "Các khung giờ phỏng vấn đề xuất bị trùng nhau. Vui lòng điều chỉnh để không trùng.", "提案した面接時間が重複しています。重複しないよう調整してください。", "Waktu wawancara yang diusulkan tumpang tindih. Harap sesuaikan agar tidak tumpang tindih."));
        return;
      }
      ranges.push({ start: startMs, end: endMs });
      payload.push({
        startsAt,
        endsAt,
        location: s.location.trim() || undefined,
        notes: notes.trim() || undefined
      });
    }
    setSubmitting(true);
    try {
      const token = readAccessToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBaseUrl}/applications/${applicationId}/interview-slots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ slots: payload })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      onProposed?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("일정 제안에 실패했습니다.", "Failed to propose the schedule.", "提议日程失败。", "Không thể đề xuất lịch.", "日程の提案に失敗しました。", "Gagal mengusulkan jadwal."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,18,39,0.55)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 24px 48px rgba(11,18,39,0.25)"
        }}
      >
        <header style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0B1227", margin: 0 }}>{t("면접 일정 제안", "Propose Interview Schedule", "提议面试日程", "Đề xuất lịch phỏng vấn", "面接日程の提案", "Usulkan Jadwal Wawancara")}</h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
            {applicantName ?? t("지원자", "Applicant", "申请人", "Ứng viên", "応募者", "Pelamar")} · {positionTitle ?? t("포지션", "Position", "职位", "Vị trí", "ポジション", "Posisi")}
          </p>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {slots.map((slot, index) => (
            <div
              key={index}
              style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#f9fafb" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0B1227" }}>{t("옵션", "Option", "选项", "Tùy chọn", "オプション", "Opsi")} {index + 1}</span>
                {slots.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeSlot(index)}
                    style={{ fontSize: 12, color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}
                  >
                    {t("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}
                  </button>
                ) : null}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <label style={{ fontSize: 11, color: "#6b7280" }}>
                  {t("날짜", "Date", "日期", "Ngày", "日付", "Tanggal")}
                  <input
                    type="date"
                    value={slot.date}
                    onChange={(e) => updateSlot(index, { date: e.target.value })}
                    style={{ marginTop: 4, width: "100%", padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}
                  />
                </label>
                <label style={{ fontSize: 11, color: "#6b7280" }}>
                  {t("시작", "Start", "开始", "Bắt đầu", "開始", "Mulai")}
                  <select
                    value={slot.startTime}
                    onChange={(e) => changeStart(index, e.target.value)}
                    style={{ marginTop: 4, width: "100%", padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, background: "#fff" }}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 11, color: "#6b7280" }}>
                  {t("종료", "End", "结束", "Kết thúc", "終了", "Selesai")}
                  <select
                    value={slot.endTime}
                    onChange={(e) => updateSlot(index, { endTime: e.target.value })}
                    style={{ marginTop: 4, width: "100%", padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, background: "#fff" }}
                  >
                    {TIME_OPTIONS.filter((t) => timeToMinutes(t) > timeToMinutes(slot.startTime)).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label style={{ fontSize: 11, color: "#6b7280", marginTop: 8, display: "block" }}>
                {t("장소 / 화상회의 링크 (선택)", "Location / video call link (optional)", "地点 / 视频会议链接（可选）", "Địa điểm / liên kết cuộc gọi video (tùy chọn)", "場所 / ビデオ通話リンク（任意）", "Lokasi / tautan panggilan video (opsional)")}
                <input
                  type="text"
                  value={slot.location}
                  onChange={(e) => updateSlot(index, { location: e.target.value })}
                  placeholder={t("서울시 강남구 ... 또는 Zoom 링크", "e.g. address or Zoom link", "例如：地址或 Zoom 链接", "vd: địa chỉ hoặc liên kết Zoom", "例：住所または Zoom リンク", "mis. alamat atau tautan Zoom")}
                  style={{ marginTop: 4, width: "100%", padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}
                />
              </label>
            </div>
          ))}

          {slots.length < 5 ? (
            <button
              type="button"
              onClick={addSlot}
              style={{
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: "#0B1227",
                background: "#fff",
                border: "1px dashed #cbd5e1",
                borderRadius: 8,
                cursor: "pointer"
              }}
            >
              {t("+ 옵션 추가 (최대 5개)", "+ Add option (up to 5)", "+ 添加选项（最多5个）", "+ Thêm tùy chọn (tối đa 5)", "+ オプション追加（最大5件）", "+ Tambah opsi (maks. 5)")}
            </button>
          ) : null}

          <label style={{ fontSize: 11, color: "#6b7280" }}>
            {t("지원자에게 전달할 메모 (선택)", "Note for the applicant (optional)", "给申请人的备注（可选）", "Ghi chú cho ứng viên (tùy chọn)", "応募者へのメモ（任意）", "Catatan untuk pelamar (opsional)")}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t("간단한 안내 사항을 입력해 주세요", "Enter a brief message", "请输入简短的说明", "Nhập hướng dẫn ngắn gọn", "簡単な案内を入力してください", "Masukkan pesan singkat")}
              style={{ marginTop: 4, width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, resize: "vertical" }}
            />
          </label>

          {error ? <p style={{ color: "#dc2626", fontSize: 12, margin: 0 }}>{error}</p> : null}
        </div>

        <footer style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#0B1227", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer" }}
          >
            {t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#fff", background: "#0B1227", border: "1px solid #0B1227", borderRadius: 8, cursor: submitting ? "wait" : "pointer" }}
          >
            {submitting ? t("전송 중...", "Sending...", "发送中...", "Đang gửi...", "送信中...", "Mengirim...") : t("일정 제안하기", "Propose schedule", "提议日程", "Đề xuất lịch", "日程を提案", "Usulkan jadwal")}
          </button>
        </footer>
      </div>
    </div>
  );
}
