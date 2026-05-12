"use client";

import { useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";

type SchoolCreditRequestRow = {
  id: string;
  programId: string;
  schoolName: string;
  courseCode: string | null;
  credits: number;
  status: "REQUESTED" | "APPROVED" | "REJECTED";
  requestedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  reviewedByName: string | null;
  candidateName: string | null;
  candidateEmail: string | null;
  candidateAffiliation: string | null;
  positionTitle: string | null;
  partnerOrganizationName: string | null;
};

const STATUS_LABEL: Record<SchoolCreditRequestRow["status"], { label: string; pill: string }> = {
  REQUESTED: { label: "심사 대기", pill: "ops-pill-amber" },
  APPROVED: { label: "승인", pill: "ops-pill-green" },
  REJECTED: { label: "반려", pill: "ops-pill-red" }
};

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function SchoolCreditReviewPage() {
  const [items, setItems] = useState<SchoolCreditRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<SchoolCreditRequestRow["status"] | "ALL">("REQUESTED");
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/ops/school-credit-requests`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { items?: SchoolCreditRequestRow[] };
      setItems(payload.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "학점 인정 요청을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function review(requestId: string, status: "APPROVED" | "REJECTED") {
    setUpdating(requestId);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/ops/school-credit-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status, reviewNote: noteDraft[requestId]?.trim() || undefined })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "검토 처리 실패");
    } finally {
      setUpdating(null);
    }
  }

  const counts = useMemo(() => {
    const result = { ALL: items.length, REQUESTED: 0, APPROVED: 0, REJECTED: 0 };
    for (const it of items) result[it.status] += 1;
    return result;
  }, [items]);

  const filtered = useMemo(
    () => (filterStatus === "ALL" ? items : items.filter((r) => r.status === filterStatus)),
    [items, filterStatus]
  );

  return (
    <section className="ops-content-section">
      <header>
        <h1>학점 인정 검토</h1>
        <p>학생이 제출한 학교 연계형 학점 인정 요청을 검토하고 승인/반려 처리하세요.</p>
      </header>

      <article className="ops-card">
        <div className="ops-filter-chip-row">
          {(["ALL", "REQUESTED", "APPROVED", "REJECTED"] as const).map((key) => {
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
        <div className="ops-empty-card">불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="ops-empty-card">해당 상태의 학점 인정 요청이 없습니다.</div>
      ) : (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((r) => {
            const badge = STATUS_LABEL[r.status];
            const isUpdating = updating === r.id;
            return (
              <article key={r.id} className="ops-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>
                      {r.candidateName ?? "-"} · {r.schoolName}
                      {r.courseCode ? ` · ${r.courseCode}` : ""}
                      {` · ${r.credits}학점`}
                    </p>
                    <p className="ops-card-subtle" style={{ marginTop: 4 }}>
                      {r.candidateEmail} · {r.candidateAffiliation ?? "-"}
                    </p>
                    <p className="ops-card-subtle" style={{ marginTop: 2 }}>
                      {r.partnerOrganizationName ?? "-"} · {r.positionTitle}
                    </p>
                    <p className="ops-card-subtle" style={{ marginTop: 2 }}>
                      요청: {formatDateTime(r.requestedAt)}
                      {r.reviewedAt ? ` · 검토: ${formatDateTime(r.reviewedAt)} (${r.reviewedByName ?? "-"})` : ""}
                    </p>
                  </div>
                  <span className={`ops-pill ${badge.pill}`}>{badge.label}</span>
                </div>

                {r.reviewNote ? (
                  <p style={{ fontSize: 12, color: "#374151", marginTop: 8, whiteSpace: "pre-wrap" }}>📝 {r.reviewNote}</p>
                ) : null}

                {r.status === "REQUESTED" ? (
                  <div className="ops-soft-card" style={{ marginTop: 12 }}>
                    <textarea
                      value={noteDraft[r.id] ?? ""}
                      onChange={(e) => setNoteDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder="검토 메모 (선택)"
                      rows={2}
                      className="ops-textarea"
                    />
                    <div className="ops-row-end" style={{ marginTop: 8 }}>
                      <button type="button" onClick={() => void review(r.id, "REJECTED")} disabled={isUpdating} className="ops-btn ops-btn-danger">
                        반려
                      </button>
                      <button type="button" onClick={() => void review(r.id, "APPROVED")} disabled={isUpdating} className="ops-btn ops-btn-primary">
                        승인
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
