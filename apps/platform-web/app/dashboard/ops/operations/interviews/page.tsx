"use client";

import { useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";
import { InterviewSlotDetailModal, type SlotDetailItem } from "../../../../../components/interviews/InterviewSlotDetailModal";

type OpsInterviewSlot = {
  id: string;
  applicationId: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  notes: string | null;
  status: "PROPOSED" | "SELECTED" | "CANCELLED";
  proposedAt: string;
  selectedAt: string | null;
  cancelledAt: string | null;
  candidateName: string | null;
  candidateEmail: string | null;
  positionTitle: string | null;
  partnerOrganizationName: string | null;
};

const STATUS_LABEL: Record<OpsInterviewSlot["status"], { label: string; pill: string }> = {
  PROPOSED: { label: "제안됨", pill: "ops-pill-amber" },
  SELECTED: { label: "확정", pill: "ops-pill-green" },
  CANCELLED: { label: "취소", pill: "ops-pill-gray" }
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export default function InterviewProgressPage() {
  const [items, setItems] = useState<OpsInterviewSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<OpsInterviewSlot["status"] | "ALL">("ALL");
  const [detailTarget, setDetailTarget] = useState<SlotDetailItem | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = readAccessToken();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
        const response = await fetch(`${apiBaseUrl}/ops/interview-slots`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store"
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { ok?: boolean; items?: OpsInterviewSlot[] };
        setItems(payload.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "인터뷰 일정을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [reloadKey]);

  const counts = useMemo(() => {
    const result = { ALL: items.length, PROPOSED: 0, SELECTED: 0, CANCELLED: 0 };
    for (const it of items) result[it.status] += 1;
    return result;
  }, [items]);

  const filtered = useMemo(
    () => (filterStatus === "ALL" ? items : items.filter((s) => s.status === filterStatus)),
    [items, filterStatus]
  );

  return (
    <section className="ops-content-section">
      <header>
        <h1>인터뷰/진행 현황</h1>
        <p>파트너가 제안한 면접 일정과 지원자의 선택 결과를 한눈에 모니터링하세요.</p>
      </header>

      <article className="ops-card">
        <div className="ops-filter-chip-row">
          {(["ALL", "PROPOSED", "SELECTED", "CANCELLED"] as const).map((key) => {
            const active = filterStatus === key;
            const label = key === "ALL" ? "전체" : STATUS_LABEL[key].label;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilterStatus(key)}
                className={`ops-filter-chip ${active ? "is-active" : ""}`}
              >
                {label} <span className="ops-filter-chip-count">{counts[key]}</span>
              </button>
            );
          })}
        </div>
      </article>

      {loading ? (
        <div className="ops-empty-card">일정을 불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="ops-empty-card">해당 상태의 인터뷰 일정이 없습니다.</div>
      ) : (
        <article className="ops-table-card">
          <table>
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>지원자</th>
                <th>회사/포지션</th>
                <th>일정</th>
                <th>장소</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((slot) => {
                const badge = STATUS_LABEL[slot.status];
                return (
                  <tr key={slot.id}>
                    <td>
                      <div className="ops-row-strong">{slot.candidateName ?? "-"}</div>
                      <div className="ops-row-sub">{slot.candidateEmail}</div>
                    </td>
                    <td>
                      <div className="ops-row-strong">{slot.partnerOrganizationName ?? "-"}</div>
                      <div className="ops-row-sub">{slot.positionTitle}</div>
                    </td>
                    <td>
                      {formatDateTime(slot.startsAt)}
                      <div className="ops-row-sub">~ {formatDateTime(slot.endsAt)}</div>
                    </td>
                    <td>{slot.location ?? "-"}</td>
                    <td>
                      <span className={`ops-pill ${badge.pill}`}>{badge.label}</span>
                    </td>
                    <td>
                      <button type="button" className="ops-btn" onClick={() => setDetailTarget(slot as SlotDetailItem)}>
                        상세
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </article>
      )}

      <InterviewSlotDetailModal
        open={detailTarget !== null}
        slot={detailTarget}
        onClose={() => setDetailTarget(null)}
        onUpdated={() => setReloadKey((k) => k + 1)}
      />
    </section>
  );
}
