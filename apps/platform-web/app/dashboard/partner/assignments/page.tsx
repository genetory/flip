"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../lib/auth-client";
import { AssignmentDetailModal, type AssignmentDetailItem } from "../../../../components/assignments/AssignmentDetailModal";

type AssignmentStatus = "ASSIGNED" | "SUBMITTED" | "REVIEWED" | "CANCELLED";

type Item = {
  id: string;
  applicationId: string;
  title: string;
  status: AssignmentStatus;
  dueAt: string | null;
  assignedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  feedbackRating: number | null;
  candidateName: string | null;
  candidateEmail: string | null;
  positionTitle: string | null;
};

const STATUS_LABEL: Record<AssignmentStatus, { label: string; pill: string }> = {
  ASSIGNED: { label: "부여됨", pill: "ops-pill-amber" },
  SUBMITTED: { label: "제출됨", pill: "ops-pill-blue" },
  REVIEWED: { label: "검토 완료", pill: "ops-pill-green" },
  CANCELLED: { label: "취소", pill: "ops-pill-gray" }
};

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export default function PartnerAssignmentsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<AssignmentStatus | "ALL">("ALL");
  const [detailTarget, setDetailTarget] = useState<AssignmentDetailItem | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = readAccessToken();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
        const response = await fetch(`${apiBaseUrl}/partner/assignments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store"
        });
        if (!response.ok) {
          if (response.status === 403) throw new Error("회사 정보를 먼저 등록해야 과제를 볼 수 있습니다.");
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = (await response.json()) as { items?: Item[] };
        setItems(payload.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "과제를 불러오지 못했습니다.");
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
        <h1>과제 관리</h1>
        <p>회사가 부여한 과제와 지원자의 제출/검토 현황을 모니터링하세요.</p>
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
              <col style={{ width: "20%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "14%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>과제</th>
                <th>지원자</th>
                <th>포지션</th>
                <th>마감</th>
                <th>제출</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => {
                const badge = STATUS_LABEL[it.status];
                // 마감이 지났는데 아직 제출 안 된 과제 = 마감 초과(눈에 띄게 표시)
                const dueMs = it.dueAt ? new Date(it.dueAt).getTime() : null;
                const overdue = dueMs !== null && !it.submittedAt && dueMs < Date.now();
                return (
                  <tr key={it.id}>
                    <td className="ops-row-strong">{it.title}</td>
                    <td>
                      <div className="ops-row-strong">{it.candidateName ?? "-"}</div>
                      <div className="ops-row-sub">{it.candidateEmail}</div>
                    </td>
                    <td>{it.positionTitle}</td>
                    <td>
                      <span style={overdue ? { color: "var(--danger)", fontWeight: 700 } : undefined}>{formatDateTime(it.dueAt)}</span>
                      {overdue ? <span className="ops-pill ops-pill-red" style={{ marginLeft: 6 }}>마감 초과</span> : null}
                    </td>
                    <td>{formatDateTime(it.submittedAt)}</td>
                    <td>
                      <span className={`ops-pill ${badge.pill}`}>{badge.label}</span>
                    </td>
                    <td>
                      <div className="ops-table-actions">
                        <button type="button" className="ops-btn" onClick={() => setDetailTarget(it as AssignmentDetailItem)}>
                          상세
                        </button>
                        <Link href={`/dashboard/partner/applicants/${it.applicationId}`} className="ops-btn">
                          지원자
                        </Link>
                      </div>
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
        viewer="partner"
        onClose={() => setDetailTarget(null)}
        onUpdated={() => setReloadKey((k) => k + 1)}
      />
    </section>
  );
}
