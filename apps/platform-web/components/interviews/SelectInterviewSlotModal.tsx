"use client";

import { useEffect, useState } from "react";
import { getInterviewSlotsForApplication, selectInterviewSlot, type InterviewSlot } from "../../lib/member-profile-client";
import { usePlatformT } from "../../lib/i18n";

type Props = {
  open: boolean;
  applicationId?: string;
  positionTitle?: string | null;
  onClose: () => void;
  onSelected?: () => void;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export function SelectInterviewSlotModal({ open, applicationId, positionTitle, onClose, onSelected }: Props) {
  const t = usePlatformT();
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !applicationId) return;
    setLoading(true);
    setError(null);
    getInterviewSlotsForApplication(applicationId)
      .then((items) => setSlots(items))
      .catch((err) => setError(err instanceof Error ? err.message : t("일정을 불러오지 못했습니다.", "Failed to load the schedule.", "无法加载日程。", "Không thể tải lịch.", "日程を読み込めませんでした。", "Gagal memuat jadwal.")))
      .finally(() => setLoading(false));
  }, [open, applicationId]);

  if (!open) return null;

  async function handleSelect(slotId: string) {
    setSelecting(slotId);
    setError(null);
    try {
      await selectInterviewSlot(slotId);
      onSelected?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("일정 선택에 실패했습니다.", "Failed to select the schedule.", "选择日程失败。", "Không thể chọn lịch.", "日程の選択に失敗しました。", "Gagal memilih jadwal."));
    } finally {
      setSelecting(null);
    }
  }

  const proposed = slots.filter((s) => s.status === "PROPOSED");
  const selected = slots.find((s) => s.status === "SELECTED");

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
          width: "min(520px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 24px 48px rgba(11,18,39,0.25)"
        }}
      >
        <header style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0B1227", margin: 0 }}>{t("면접 일정 선택", "Select Interview Slot", "选择面试日程", "Chọn lịch phỏng vấn", "面接日程の選択", "Pilih Jadwal Wawancara")}</h2>
          {positionTitle ? <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>{positionTitle}</p> : null}
        </header>

        {loading ? (
          <p style={{ color: "#6b7280", fontSize: 13 }}>{t("일정을 불러오는 중...", "Loading schedule...", "正在加载日程...", "Đang tải lịch...", "日程を読み込み中...", "Memuat jadwal...")}</p>
        ) : selected ? (
          <div style={{ border: "1px solid #16a34a", borderRadius: 12, padding: 16, background: "#f0fdf4" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#16a34a" }}>{t("확정된 면접", "Confirmed interview", "已确认的面试", "Phỏng vấn đã xác nhận", "確定した面接", "Wawancara terkonfirmasi")}</p>
            <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: 600, color: "#0B1227" }}>
              {formatDateTime(selected.startsAt)} ~ {formatDateTime(selected.endsAt)}
            </p>
            {selected.location ? <p style={{ margin: "6px 0 0", fontSize: 12, color: "#374151" }}>{t("장소", "Location", "地点", "Địa điểm", "場所", "Lokasi")}: {selected.location}</p> : null}
            {selected.notes ? <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6b7280" }}>{selected.notes}</p> : null}
          </div>
        ) : proposed.length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: 13 }}>{t("아직 제안된 면접 일정이 없습니다. 회사에서 일정을 제안하면 알려드릴게요.", "No interview slots have been proposed yet. We'll let you know when the company proposes one.", "尚未提议面试日程。公司提议后我们会通知您。", "Chưa có lịch phỏng vấn nào được đề xuất. Chúng tôi sẽ thông báo khi công ty đề xuất.", "まだ提案された面接日程はありません。企業が提案したらお知らせします。", "Belum ada slot wawancara yang diusulkan. Kami akan memberi tahu Anda saat perusahaan mengusulkannya.")}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {proposed.map((slot) => {
              const isSelecting = selecting === slot.id;
              return (
                <div
                  key={slot.id}
                  style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#fff" }}
                >
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0B1227" }}>
                    {formatDateTime(slot.startsAt)} ~ {formatDateTime(slot.endsAt)}
                  </p>
                  {slot.location ? <p style={{ margin: "4px 0 0", fontSize: 12, color: "#374151" }}>{t("장소", "Location", "地点", "Địa điểm", "場所", "Lokasi")}: {slot.location}</p> : null}
                  {slot.notes ? <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>{slot.notes}</p> : null}
                  <button
                    type="button"
                    onClick={() => handleSelect(slot.id)}
                    disabled={isSelecting}
                    style={{
                      marginTop: 10,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 6,
                      border: "1px solid #0B1227",
                      background: "#0B1227",
                      color: "#fff",
                      cursor: isSelecting ? "wait" : "pointer"
                    }}
                  >
                    {isSelecting ? t("선택 중...", "Selecting...", "选择中...", "Đang chọn...", "選択中...", "Memilih...") : t("이 일정으로 선택", "Select this slot", "选择此日程", "Chọn khung giờ này", "この日程を選択", "Pilih slot ini")}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {error ? <p style={{ color: "#dc2626", fontSize: 12, marginTop: 12 }}>{error}</p> : null}

        <footer style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#0B1227", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer" }}
          >
            {t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}
          </button>
        </footer>
      </div>
    </div>
  );
}
