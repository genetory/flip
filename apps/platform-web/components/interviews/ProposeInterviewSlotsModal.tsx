"use client";

import { useEffect, useState } from "react";
import { readAccessToken } from "../../lib/auth-client";

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

function emptySlot(): SlotInput {
  return { date: "", startTime: "10:00", endTime: "11:00", location: "" };
}

function toIsoString(date: string, time: string) {
  if (!date || !time) return null;
  const local = new Date(`${date}T${time}:00`);
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}

export function ProposeInterviewSlotsModal({ open, applicationId, applicantName, positionTitle, onClose, onProposed }: Props) {
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
    for (const s of slots) {
      const startsAt = toIsoString(s.date, s.startTime);
      const endsAt = toIsoString(s.date, s.endTime);
      if (!startsAt || !endsAt) {
        setError("모든 일정의 날짜와 시간을 입력해 주세요.");
        return;
      }
      if (new Date(endsAt) <= new Date(startsAt)) {
        setError("종료 시간이 시작 시간보다 늦어야 합니다.");
        return;
      }
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
      setError(err instanceof Error ? err.message : "일정 제안에 실패했습니다.");
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
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0B1227", margin: 0 }}>면접 일정 제안</h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
            {applicantName ?? "지원자"} · {positionTitle ?? "포지션"}
          </p>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {slots.map((slot, index) => (
            <div
              key={index}
              style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#f9fafb" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0B1227" }}>옵션 {index + 1}</span>
                {slots.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeSlot(index)}
                    style={{ fontSize: 12, color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}
                  >
                    삭제
                  </button>
                ) : null}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <label style={{ fontSize: 11, color: "#6b7280" }}>
                  날짜
                  <input
                    type="date"
                    value={slot.date}
                    onChange={(e) => updateSlot(index, { date: e.target.value })}
                    style={{ marginTop: 4, width: "100%", padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}
                  />
                </label>
                <label style={{ fontSize: 11, color: "#6b7280" }}>
                  시작
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(index, { startTime: e.target.value })}
                    style={{ marginTop: 4, width: "100%", padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}
                  />
                </label>
                <label style={{ fontSize: 11, color: "#6b7280" }}>
                  종료
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(index, { endTime: e.target.value })}
                    style={{ marginTop: 4, width: "100%", padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}
                  />
                </label>
              </div>
              <label style={{ fontSize: 11, color: "#6b7280", marginTop: 8, display: "block" }}>
                장소 / 화상회의 링크 (선택)
                <input
                  type="text"
                  value={slot.location}
                  onChange={(e) => updateSlot(index, { location: e.target.value })}
                  placeholder="서울시 강남구 ... 또는 Zoom 링크"
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
              + 옵션 추가 (최대 5개)
            </button>
          ) : null}

          <label style={{ fontSize: 11, color: "#6b7280" }}>
            지원자에게 전달할 메모 (선택)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="간단한 안내 사항을 입력해 주세요"
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
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#fff", background: "#0B1227", border: "1px solid #0B1227", borderRadius: 8, cursor: submitting ? "wait" : "pointer" }}
          >
            {submitting ? "전송 중..." : "일정 제안하기"}
          </button>
        </footer>
      </div>
    </div>
  );
}
