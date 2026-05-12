"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";
import { getApplicationStatusLabel, type ApplicationStatus } from "../../../../../lib/status-labels";
import { downloadCsv, formatCsvDate } from "../../../../../lib/csv-export";

type OpsApplication = {
  id: string;
  positionId: string;
  positionTitle: string;
  partnerOrganizationName: string | null;
  candidateUserId: string;
  candidateName: string | null;
  candidateEmail: string;
  status: ApplicationStatus;
  memo: string | null;
  submittedAt: string;
  updatedAt: string;
};

const STATUS_FLOW: { value: ApplicationStatus; label: string }[] = [
  { value: "SUBMITTED", label: "검토 중" },
  { value: "INTERVIEW", label: "면접 예정" },
  { value: "ACCEPTED", label: "합격" },
  { value: "REJECTED", label: "불합격" }
];

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  return d.toLocaleDateString("ko-KR");
}

export default function OpsApplicationsPage() {
  const [items, setItems] = useState<OpsApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "ALL">("ALL");
  const [updating, setUpdating] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = readAccessToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBaseUrl}/ops/applications`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { ok?: boolean; items?: OpsApplication[] };
      setItems(payload.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "지원 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    setUpdating(applicationId);
    try {
      const token = readAccessToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBaseUrl}/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setItems((prev) => prev.map((it) => (it.id === applicationId ? { ...it, status } : it)));
      setActionError(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "상태 변경 실패");
    } finally {
      setUpdating(null);
    }
  }

  const filtered = useMemo(() => {
    if (filterStatus === "ALL") return items;
    return items.filter((it) => it.status === filterStatus);
  }, [items, filterStatus]);

  const counts = useMemo(() => {
    const result: Record<ApplicationStatus | "ALL", number> = {
      ALL: items.length,
      SUBMITTED: 0,
      INTERVIEW: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      WITHDRAWN: 0
    };
    for (const it of items) result[it.status] += 1;
    return result;
  }, [items]);

  return (
    <section className="ops-content-section">
      <header>
        <h1>전체 지원 현황</h1>
        <p>모든 파트너 회사의 지원자를 통합 검토하고 상태를 조정할 수 있어요.</p>
      </header>

      <article className="ops-card">
        <div className="ops-card-header">
          <div className="ops-filter-chip-row">
            {(["ALL", "SUBMITTED", "INTERVIEW", "ACCEPTED", "REJECTED"] as const).map((key) => {
              const active = filterStatus === key;
              const label = key === "ALL" ? "전체" : STATUS_FLOW.find((s) => s.value === key)?.label;
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
          <button
            type="button"
            className="ops-btn"
            onClick={() => {
              const statusKo: Record<string, string> = {
                SUBMITTED: "검토 중",
                INTERVIEW: "면접 예정",
                ACCEPTED: "합격",
                REJECTED: "불합격",
                WITHDRAWN: "철회"
              };
              downloadCsv(
                "applications",
                ["지원자", "이메일", "회사", "포지션", "상태", "메모", "지원 시점", "최근 업데이트"],
                filtered.map((it) => [
                  it.candidateName ?? "",
                  it.candidateEmail,
                  it.partnerOrganizationName ?? "",
                  it.positionTitle,
                  statusKo[it.status] ?? it.status,
                  it.memo ?? "",
                  formatCsvDate(it.submittedAt),
                  formatCsvDate(it.updatedAt)
                ])
              );
            }}
            disabled={filtered.length === 0}
          >
            CSV 내보내기
          </button>
        </div>
      </article>

      {actionError ? <div className="ops-error-card">{actionError}</div> : null}

      {loading ? (
        <div className="ops-empty-card">지원 목록을 불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="ops-empty-card">해당 상태의 지원이 없습니다.</div>
      ) : (
        <article className="ops-table-card">
          <table>
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "28%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "28%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>지원자</th>
                <th>회사 · 포지션</th>
                <th>상태</th>
                <th>지원 시점</th>
                <th style={{ textAlign: "right" }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => {
                const badge = getApplicationStatusLabel(it.status, "operator");
                const isUpdating = updating === it.id;
                return (
                  <tr key={it.id}>
                    <td>
                      <div className="ops-row-strong">{it.candidateName ?? "-"}</div>
                      <div className="ops-row-sub">{it.candidateEmail}</div>
                    </td>
                    <td>
                      <div className="ops-row-strong">{it.partnerOrganizationName ?? "-"}</div>
                      <div className="ops-row-sub">{it.positionTitle}</div>
                    </td>
                    <td>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="ops-row-sub">{formatRelativeTime(it.submittedAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <div className="ops-table-actions" style={{ justifyContent: "flex-end" }}>
                        <select
                          value={it.status}
                          disabled={isUpdating}
                          onChange={(e) => void updateStatus(it.id, e.target.value as ApplicationStatus)}
                          className="ops-select ops-select-inline"
                        >
                          {STATUS_FLOW.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <Link href={`/dashboard/ops/operations/applications/${it.id}`} className="ops-btn">
                          상세
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
    </section>
  );
}
