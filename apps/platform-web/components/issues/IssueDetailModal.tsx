"use client";

import { useEffect, useState } from "react";
import { readAccessToken } from "../../lib/auth-client";

export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type IssueType = "NO_SHOW" | "BEHAVIOR" | "DROPOUT" | "ATTITUDE" | "PAYMENT" | "OTHER";

export type IssueDetailIssue = {
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

type Props = {
  open: boolean;
  issue: IssueDetailIssue | null;
  onClose: () => void;
  onUpdated: () => void;
  viewer?: "operator" | "partner" | "student";
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

export function IssueDetailModal({ open, issue, onClose, onUpdated, viewer = "operator" }: Props) {
  const canManage = viewer === "operator";
  const [statusDraft, setStatusDraft] = useState<IssueStatus>("OPEN");
  const [noteDraft, setNoteDraft] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!issue) return;
    setStatusDraft(issue.status);
    setNoteDraft(issue.resolutionNote ?? "");
    setAssigneeEmail(issue.assignedTo?.email ?? "");
    setError(null);
  }, [issue?.id, open]);

  if (!open || !issue) return null;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        status: statusDraft,
        resolutionNote: noteDraft.trim() || null
      };
      const trimmedEmail = assigneeEmail.trim();
      if (trimmedEmail !== (issue?.assignedTo?.email ?? "")) {
        if (!trimmedEmail) {
          body.assignedToUserId = null;
        } else {
          const lookup = await fetch(`${apiBase()}/ops/users?search=${encodeURIComponent(trimmedEmail)}&pageSize=10`, {
            headers: authHeaders(),
            cache: "no-store"
          });
          if (!lookup.ok) throw new Error(`담당자 조회 실패 HTTP ${lookup.status}`);
          const payload = (await lookup.json()) as { items?: Array<{ id: string; email: string }> };
          const match = (payload.items ?? []).find((u) => u.email.toLowerCase() === trimmedEmail.toLowerCase());
          if (!match) throw new Error(`'${trimmedEmail}' 이메일의 운영자를 찾을 수 없습니다.`);
          body.assignedToUserId = match.id;
        }
      }
      const response = await fetch(`${apiBase()}/ops/issues/${issue!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "이슈 업데이트 실패");
    } finally {
      setSaving(false);
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
          width: "min(640px, 100%)",
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
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>{issue.title}</h2>
            <div className="ops-tag-row" style={{ marginTop: 6 }}>
              <span className="ops-pill ops-pill-gray">{TYPE_LABEL[issue.type]}</span>
              <span className={`ops-pill ${STATUS_PILL[issue.status]}`}>{STATUS_LABEL[issue.status]}</span>
            </div>
          </div>
          <button type="button" className="ops-btn" onClick={onClose}>
            닫기
          </button>
        </div>

        <article className="ops-soft-card">
          <p className="ops-form-label">설명</p>
          <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{issue.description}</p>
        </article>

        <dl className="ops-list-card-meta" style={{ marginTop: 12 }}>
          <dt>신고자</dt>
          <dd>{issue.reporter.name ?? issue.reporter.email} ({issue.reporter.role})</dd>
          {issue.subject ? (
            <>
              <dt>대상</dt>
              <dd>{issue.subject.name ?? issue.subject.email} ({issue.subject.role})</dd>
            </>
          ) : null}
          <dt>생성</dt>
          <dd>{formatDateTime(issue.createdAt)}</dd>
          <dt>최근 업데이트</dt>
          <dd>{formatDateTime(issue.updatedAt)}</dd>
          {issue.resolvedAt ? (
            <>
              <dt>처리 시점</dt>
              <dd>{formatDateTime(issue.resolvedAt)}</dd>
            </>
          ) : null}
        </dl>

        {canManage ? (
          <article className="ops-soft-card" style={{ marginTop: 12 }}>
            <h3 className="ops-section-title">케이스 관리</h3>
            <label className="ops-form-label">
              상태
              <select
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value as IssueStatus)}
                className="ops-select"
                style={{ marginTop: 4 }}
              >
                {(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as IssueStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </label>
            <label className="ops-form-label" style={{ marginTop: 10, display: "block" }}>
              담당자 이메일 (운영자)
              <input
                type="email"
                value={assigneeEmail}
                onChange={(e) => setAssigneeEmail(e.target.value)}
                placeholder="operator@flip-ers.com"
                className="ops-input"
                style={{ marginTop: 4 }}
              />
              <p className="ops-card-subtle" style={{ marginTop: 4 }}>이메일을 비우면 담당 해제</p>
            </label>
            <label className="ops-form-label" style={{ marginTop: 10, display: "block" }}>
              처리 메모
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={4}
                placeholder="이슈 처리 내역, 결정사항 등"
                className="ops-textarea"
                style={{ marginTop: 4 }}
              />
            </label>
            {error ? <p style={{ color: "#dc2626", fontSize: 12, marginTop: 10 }}>{error}</p> : null}
            <div className="ops-row-end" style={{ marginTop: 12 }}>
              <button type="button" onClick={onClose} className="ops-btn">
                취소
              </button>
              <button type="button" onClick={() => void save()} disabled={saving} className="ops-btn ops-btn-primary">
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </article>
        ) : (
          <article className="ops-soft-card" style={{ marginTop: 12 }}>
            <h3 className="ops-section-title">처리 상태</h3>
            <div className="ops-list-card-meta">
              <dt>담당자</dt>
              <dd>{issue.assignedTo ? `${issue.assignedTo.name ?? issue.assignedTo.email}` : "미지정"}</dd>
              <dt>처리 메모</dt>
              <dd style={{ whiteSpace: "pre-wrap" }}>{issue.resolutionNote ?? "아직 처리 메모가 없습니다."}</dd>
            </div>
            <p className="ops-card-subtle" style={{ marginTop: 10 }}>
              상태 변경과 처리 메모는 운영자가 관리합니다.
            </p>
            <div className="ops-row-end" style={{ marginTop: 12 }}>
              <button type="button" onClick={onClose} className="ops-btn">
                닫기
              </button>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
