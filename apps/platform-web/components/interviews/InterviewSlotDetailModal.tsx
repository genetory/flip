"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readAccessToken } from "../../lib/auth-client";

export type SlotStatus = "PROPOSED" | "SELECTED" | "CANCELLED";

export type SlotDetailItem = {
  id: string;
  applicationId: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  notes: string | null;
  status: SlotStatus;
  proposedAt: string;
  selectedAt: string | null;
  cancelledAt: string | null;
  candidateName: string | null;
  candidateEmail: string | null;
  positionTitle: string | null;
  partnerOrganizationName?: string | null;
};

type AppSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  notes: string | null;
  status: SlotStatus;
  proposedAt: string;
  selectedAt: string | null;
  cancelledAt: string | null;
};

type Props = {
  open: boolean;
  slot: SlotDetailItem | null;
  onClose: () => void;
  onUpdated: () => void;
  viewer?: "operator" | "partner";
};

const STATUS_LABEL: Record<SlotStatus, string> = {
  PROPOSED: "제안됨",
  SELECTED: "확정",
  CANCELLED: "취소"
};

const STATUS_PILL: Record<SlotStatus, string> = {
  PROPOSED: "ops-pill-amber",
  SELECTED: "ops-pill-green",
  CANCELLED: "ops-pill-gray"
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export function InterviewSlotDetailModal({ open, slot, onClose, onUpdated, viewer = "operator" }: Props) {
  const applicantBasePath = viewer === "partner"
    ? "/dashboard/partner/applicants"
    : "/dashboard/ops/operations/applications";
  const [allSlots, setAllSlots] = useState<AppSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !slot) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBase()}/applications/${slot!.applicationId}/interview-slots`, {
          headers: authHeaders(),
          cache: "no-store"
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { items?: AppSlot[] };
        setAllSlots(payload.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "면접 일정을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [open, slot?.id]);

  if (!open || !slot) return null;

  async function changeStatus(slotId: string, nextStatus: SlotStatus) {
    setUpdating(slotId);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/interview-slots/${slotId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      onUpdated();
      const refresh = await fetch(`${apiBase()}/applications/${slot!.applicationId}/interview-slots`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (refresh.ok) {
        const payload = (await refresh.json()) as { items?: AppSlot[] };
        setAllSlots(payload.items ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경 실패");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
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
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 24px 48px rgba(11,18,39,0.25)"
        }}
      >
        <div className="ops-card-header" style={{ marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
              {slot.candidateName ?? "-"}
            </h2>
            <p className="ops-card-subtle" style={{ marginTop: 4 }}>
              {slot.partnerOrganizationName ?? "-"} · {slot.positionTitle ?? "-"}
            </p>
            <p className="ops-card-subtle" style={{ marginTop: 2 }}>{slot.candidateEmail}</p>
          </div>
          <Link href={`${applicantBasePath}/${slot.applicationId}`} className="ops-btn">
            지원 상세 →
          </Link>
        </div>

        <article className="ops-soft-card">
          <h3 className="ops-section-title">선택된 슬롯</h3>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>
            {formatDateTime(slot.startsAt)} ~ {formatDateTime(slot.endsAt)}
          </p>
          {slot.location ? <p className="ops-card-subtle" style={{ marginTop: 4 }}>📍 {slot.location}</p> : null}
          {slot.notes ? <p className="ops-card-subtle" style={{ marginTop: 2 }}>{slot.notes}</p> : null}
          <div className="ops-tag-row" style={{ marginTop: 8 }}>
            <span className={`ops-pill ${STATUS_PILL[slot.status]}`}>{STATUS_LABEL[slot.status]}</span>
          </div>
          <p className="ops-card-subtle" style={{ marginTop: 8 }}>
            제안 {formatDateTime(slot.proposedAt)}
            {slot.selectedAt ? ` · 선택 ${formatDateTime(slot.selectedAt)}` : ""}
            {slot.cancelledAt ? ` · 취소 ${formatDateTime(slot.cancelledAt)}` : ""}
          </p>
        </article>

        <article className="ops-card" style={{ marginTop: 12 }}>
          <h3 className="ops-section-title">이 지원의 모든 면접 슬롯 ({allSlots.length})</h3>
          {loading ? (
            <p className="ops-card-subtle" style={{ margin: 0 }}>불러오는 중...</p>
          ) : allSlots.length === 0 ? (
            <p className="ops-card-subtle" style={{ margin: 0 }}>슬롯이 없습니다.</p>
          ) : (
            <div className="ops-stack">
              {allSlots.map((s) => {
                const isUpdating = updating === s.id;
                return (
                  <div key={s.id} className="ops-soft-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
                          {formatDateTime(s.startsAt)} ~ {formatDateTime(s.endsAt)}
                        </p>
                        {s.location ? <p className="ops-card-subtle" style={{ marginTop: 4 }}>📍 {s.location}</p> : null}
                      </div>
                      <span className={`ops-pill ${STATUS_PILL[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                    </div>
                    {s.status !== "CANCELLED" ? (
                      <div className="ops-row-end" style={{ marginTop: 10 }}>
                        {s.status === "PROPOSED" ? (
                          <button type="button" className="ops-btn" disabled={isUpdating} onClick={() => void changeStatus(s.id, "SELECTED")}>
                            확정 처리
                          </button>
                        ) : null}
                        <button type="button" className="ops-btn ops-btn-danger" disabled={isUpdating} onClick={() => void changeStatus(s.id, "CANCELLED")}>
                          {s.status === "SELECTED" ? "취소 (노쇼/철회)" : "취소"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </article>

        {error ? <p style={{ color: "#dc2626", fontSize: 12, marginTop: 10 }}>{error}</p> : null}

        <div className="ops-row-end" style={{ marginTop: 12 }}>
          <button type="button" onClick={onClose} className="ops-btn">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
