"use client";

import { useEffect, useState } from "react";
import { getInterviewSlotsForApplication, selectInterviewSlot, type InterviewSlot } from "../../lib/member-profile-client";

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
      .catch((err) => setError(err instanceof Error ? err.message : "일정을 불러오지 못했습니다."))
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
      setError(err instanceof Error ? err.message : "일정 선택에 실패했습니다.");
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
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0B1227", margin: 0 }}>면접 일정 선택</h2>
          {positionTitle ? <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>{positionTitle}</p> : null}
        </header>

        {loading ? (
          <p style={{ color: "#6b7280", fontSize: 13 }}>일정을 불러오는 중...</p>
        ) : selected ? (
          <div style={{ border: "1px solid #16a34a", borderRadius: 12, padding: 16, background: "#f0fdf4" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#16a34a" }}>확정된 면접</p>
            <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: 600, color: "#0B1227" }}>
              {formatDateTime(selected.startsAt)} ~ {formatDateTime(selected.endsAt)}
            </p>
            {selected.location ? <p style={{ margin: "6px 0 0", fontSize: 12, color: "#374151" }}>장소: {selected.location}</p> : null}
            {selected.notes ? <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6b7280" }}>{selected.notes}</p> : null}
          </div>
        ) : proposed.length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: 13 }}>아직 제안된 면접 일정이 없습니다. 회사에서 일정을 제안하면 알려드릴게요.</p>
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
                  {slot.location ? <p style={{ margin: "4px 0 0", fontSize: 12, color: "#374151" }}>장소: {slot.location}</p> : null}
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
                    {isSelecting ? "선택 중..." : "이 일정으로 선택"}
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
            닫기
          </button>
        </footer>
      </div>
    </div>
  );
}
