"use client";

import { useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";
import { IssueDetailModal, type IssueDetailIssue } from "../../../../../components/issues/IssueDetailModal";
import { downloadCsv, formatCsvDate } from "../../../../../lib/csv-export";

type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type IssueType = "NO_SHOW" | "BEHAVIOR" | "DROPOUT" | "ATTITUDE" | "PAYMENT" | "OTHER";

type Issue = {
  id: string;
  type: IssueType;
  status: IssueStatus;
  title: string;
  description: string;
  positionId: string | null;
  applicationId: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  reporter: { id: string; name: string | null; email: string; role: string };
  subject: { id: string; name: string | null; email: string; role: string } | null;
  assignedTo: { id: string; name: string | null; email: string } | null;
};

const TYPE_LABEL: Record<IssueType, string> = {
  NO_SHOW: "노쇼",
  BEHAVIOR: "행동·태도",
  DROPOUT: "참여 중단",
  ATTITUDE: "커뮤니케이션",
  PAYMENT: "정산/결제",
  OTHER: "기타"
};

const STATUS_LABEL: Record<IssueStatus, string> = {
  OPEN: "신규",
  IN_PROGRESS: "처리 중",
  RESOLVED: "해결",
  CLOSED: "종료"
};

const STATUS_PILL: Record<IssueStatus, string> = {
  OPEN: "ops-pill-red",
  IN_PROGRESS: "ops-pill-amber",
  RESOLVED: "ops-pill-green",
  CLOSED: "ops-pill-gray"
};

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

export default function OpsIssuesPage() {
  const [items, setItems] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<IssueStatus | "ALL">("ALL");
  const [updating, setUpdating] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<IssueDetailIssue | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = readAccessToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBaseUrl}/ops/issues`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { ok?: boolean; items?: Issue[] };
      setItems(payload.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "이슈 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateStatus(id: string, status: IssueStatus) {
    setUpdating(id);
    try {
      const token = readAccessToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBaseUrl}/ops/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status, resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date().toISOString() : it.resolvedAt } : it)));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "상태 변경 실패");
    } finally {
      setUpdating(null);
    }
  }

  const counts = useMemo(() => {
    const result: Record<IssueStatus | "ALL", number> = { ALL: items.length, OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 };
    for (const it of items) result[it.status] += 1;
    return result;
  }, [items]);

  const filtered = useMemo(() => {
    if (filterStatus === "ALL") return items;
    return items.filter((it) => it.status === filterStatus);
  }, [items, filterStatus]);

  return (
    <section className="ops-content-section">
      <header>
        <h1>이슈 리포트</h1>
        <p>파트너·학생이 제출한 이슈를 검토하고 케이스를 트래킹하세요.</p>
      </header>

      <article className="ops-card">
        <div className="ops-card-header">
          <div className="ops-filter-chip-row">
            {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map((key) => {
              const active = filterStatus === key;
              const label = key === "ALL" ? "전체" : STATUS_LABEL[key];
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
              downloadCsv(
                "issues",
                ["유형", "상태", "제목", "설명", "신고자", "신고자 역할", "대상", "담당자", "처리 메모", "생성", "처리"],
                filtered.map((it) => [
                  TYPE_LABEL[it.type],
                  STATUS_LABEL[it.status],
                  it.title,
                  it.description,
                  it.reporter.name ?? it.reporter.email,
                  it.reporter.role,
                  it.subject ? (it.subject.name ?? it.subject.email) : "",
                  it.assignedTo ? (it.assignedTo.name ?? it.assignedTo.email) : "",
                  it.resolutionNote ?? "",
                  formatCsvDate(it.createdAt),
                  formatCsvDate(it.resolvedAt)
                ])
              );
            }}
            disabled={filtered.length === 0}
          >
            CSV 내보내기
          </button>
        </div>
      </article>

      {loading ? (
        <div className="ops-empty-card">이슈 목록을 불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="ops-empty-card">해당 상태의 이슈가 없습니다.</div>
      ) : (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((it) => {
            const isUpdating = updating === it.id;
            return (
              <article key={it.id} className="ops-card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                    <div className="ops-tag-row" style={{ marginBottom: 8 }}>
                      <span className="ops-pill ops-pill-gray">{TYPE_LABEL[it.type]}</span>
                      <span className={`ops-pill ${STATUS_PILL[it.status]}`}>{STATUS_LABEL[it.status]}</span>
                      <span className="ops-pill ops-pill-gray" style={{ background: "transparent" }}>{formatRelativeTime(it.createdAt)}</span>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#111827" }}>{it.title}</h3>
                    <p style={{ fontSize: 13, color: "#374151", margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{it.description}</p>
                    <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280", display: "flex", flexWrap: "wrap", gap: 12 }}>
                      <span>신고자: <strong style={{ color: "#374151" }}>{it.reporter.name ?? it.reporter.email}</strong> ({it.reporter.role})</span>
                      {it.subject ? (
                        <span>대상: <strong style={{ color: "#374151" }}>{it.subject.name ?? it.subject.email}</strong></span>
                      ) : null}
                    </div>
                  </div>
                  <div className="ops-table-actions">
                    <select
                      value={it.status}
                      disabled={isUpdating}
                      onChange={(e) => void updateStatus(it.id, e.target.value as IssueStatus)}
                      className="ops-select ops-select-inline"
                      style={{ minWidth: 130 }}
                    >
                      {(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as IssueStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="ops-btn" onClick={() => setDetailTarget(it as IssueDetailIssue)}>
                      상세
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <IssueDetailModal
        open={detailTarget !== null}
        issue={detailTarget}
        onClose={() => setDetailTarget(null)}
        onUpdated={() => void load()}
      />
    </section>
  );
}
