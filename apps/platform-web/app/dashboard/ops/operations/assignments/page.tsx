"use client";

import { useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";
import { AssignmentDetailModal, type AssignmentDetailItem } from "../../../../../components/assignments/AssignmentDetailModal";

type OpsAssignment = {
  id: string;
  applicationId: string;
  title: string;
  status: "ASSIGNED" | "SUBMITTED" | "REVIEWED" | "CANCELLED";
  dueAt: string | null;
  assignedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  feedbackRating: number | null;
  candidateName: string | null;
  candidateEmail: string | null;
  positionTitle: string | null;
  partnerOrganizationName: string | null;
};

const STATUS_LABEL: Record<OpsAssignment["status"], { label: string; pill: string }> = {
  ASSIGNED: { label: "부여됨", pill: "ops-pill-amber" },
  SUBMITTED: { label: "제출됨", pill: "ops-pill-blue" },
  REVIEWED: { label: "검토 완료", pill: "ops-pill-green" },
  CANCELLED: { label: "취소", pill: "ops-pill-gray" }
};

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export default function AssignmentsMonitoringPage() {
  const [items, setItems] = useState<OpsAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<OpsAssignment["status"] | "ALL">("ALL");
  const [detailTarget, setDetailTarget] = useState<AssignmentDetailItem | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = readAccessToken();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
        const response = await fetch(`${apiBaseUrl}/ops/assignments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store"
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { ok?: boolean; items?: OpsAssignment[] };
        setItems(payload.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "과제 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [reloadKey]);

  const counts = useMemo(() => {
    const result = { ALL: items.length, ASSIGNED: 0, SUBMITTED: 0, REVIEWED: 0, CANCELLED: 0 };
    for (const it of items) result[it.status] += 1;
    return result;
  }, [items]);

  const filtered = useMemo(
    () => (filterStatus === "ALL" ? items : items.filter((a) => a.status === filterStatus)),
    [items, filterStatus]
  );

  return (
    <section className="ops-content-section">
      <header>
        <h1>과제 진행 현황</h1>
        <p>파트너가 부여한 과제와 지원자의 제출/검토 상태를 한눈에 확인하세요.</p>
      </header>

      <article className="ops-card">
        <div className="ops-filter-chip-row">
          {(["ALL", "ASSIGNED", "SUBMITTED", "REVIEWED", "CANCELLED"] as const).map((key) => {
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
        <div className="ops-empty-card">해당 상태의 과제가 없습니다.</div>
      ) : (
        <article className="ops-table-card">
          <table>
            <colgroup>
              <col style={{ width: "18%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "7%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>과제</th>
                <th>지원자</th>
                <th>회사/포지션</th>
                <th>마감</th>
                <th>제출</th>
                <th>검토</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => {
                const badge = STATUS_LABEL[it.status];
                return (
                  <tr key={it.id}>
                    <td className="ops-row-strong">{it.title}</td>
                    <td>
                      <div className="ops-row-strong">{it.candidateName ?? "-"}</div>
                      <div className="ops-row-sub">{it.candidateEmail}</div>
                    </td>
                    <td>
                      <div className="ops-row-strong">{it.partnerOrganizationName ?? "-"}</div>
                      <div className="ops-row-sub">{it.positionTitle}</div>
                    </td>
                    <td>{formatDateTime(it.dueAt)}</td>
                    <td>{formatDateTime(it.submittedAt)}</td>
                    <td>
                      {formatDateTime(it.reviewedAt)}
                      {it.feedbackRating ? <div className="ops-row-sub">★ {it.feedbackRating}/5</div> : null}
                    </td>
                    <td>
                      <span className={`ops-pill ${badge.pill}`}>{badge.label}</span>
                    </td>
                    <td>
                      <button type="button" className="ops-btn" onClick={() => setDetailTarget(it as AssignmentDetailItem)}>
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

      <AssignmentDetailModal
        open={detailTarget !== null}
        assignment={detailTarget}
        onClose={() => setDetailTarget(null)}
        onUpdated={() => setReloadKey((k) => k + 1)}
      />
    </section>
  );
}
