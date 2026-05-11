"use client";

import { useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../lib/auth-client";
import { IssueDetailModal, type IssueDetailIssue } from "../../../../components/issues/IssueDetailModal";

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

const TYPE_KO: Record<IssueType, string> = {
  NO_SHOW: "노쇼",
  BEHAVIOR: "행동·태도",
  DROPOUT: "참여 중단",
  ATTITUDE: "커뮤니케이션",
  PAYMENT: "정산/결제",
  OTHER: "기타"
};

const STATUS_KO: Record<IssueStatus, string> = {
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

function formatRelative(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  return d.toLocaleDateString("ko-KR");
}

export default function PartnerIssuesPage() {
  const [items, setItems] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<IssueStatus | "ALL">("ALL");
  const [detailTarget, setDetailTarget] = useState<IssueDetailIssue | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = readAccessToken();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
        const response = await fetch(`${apiBaseUrl}/partner/issues`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store"
        });
        if (!response.ok) {
          if (response.status === 403) throw new Error("회사 정보를 먼저 등록해야 이슈를 볼 수 있습니다.");
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = (await response.json()) as { items?: Issue[] };
        setItems(payload.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "이슈를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const counts = useMemo(() => {
    const result = { ALL: items.length, OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 };
    for (const it of items) result[it.status] += 1;
    return result;
  }, [items]);

  const filtered = useMemo(
    () => (filterStatus === "ALL" ? items : items.filter((i) => i.status === filterStatus)),
    [items, filterStatus]
  );

  return (
    <section className="ops-content-section">
      <header>
        <h1>이슈 리포트</h1>
        <p>회사가 신고했거나 회사 지원자와 관련된 이슈를 확인하세요. 운영자가 처리 상태를 업데이트합니다.</p>
      </header>

      <article className="ops-card">
        <div className="ops-filter-chip-row">
          {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map((key) => {
            const active = filterStatus === key;
            const label = key === "ALL" ? "전체" : STATUS_KO[key];
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
        <div className="ops-empty-card">해당 상태의 이슈가 없습니다.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((it) => (
            <article key={it.id} className="ops-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                  <div className="ops-tag-row" style={{ marginBottom: 8 }}>
                    <span className="ops-pill ops-pill-gray">{TYPE_KO[it.type]}</span>
                    <span className={`ops-pill ${STATUS_PILL[it.status]}`}>{STATUS_KO[it.status]}</span>
                    <span className="ops-pill ops-pill-gray" style={{ background: "transparent" }}>{formatRelative(it.createdAt)}</span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#111827" }}>{it.title}</h3>
                  <p style={{ fontSize: 13, color: "#374151", margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{it.description}</p>
                  <p className="ops-card-subtle" style={{ marginTop: 8 }}>
                    신고: {it.reporter.name ?? it.reporter.email} ({it.reporter.role})
                    {it.subject ? ` · 대상: ${it.subject.name ?? it.subject.email}` : ""}
                    {it.assignedTo ? ` · 담당: ${it.assignedTo.name ?? it.assignedTo.email}` : ""}
                  </p>
                </div>
                <button type="button" className="ops-btn" onClick={() => setDetailTarget(it as IssueDetailIssue)}>
                  상세
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <IssueDetailModal
        open={detailTarget !== null}
        issue={detailTarget}
        viewer="partner"
        onClose={() => setDetailTarget(null)}
        onUpdated={() => {}}
      />
    </section>
  );
}
