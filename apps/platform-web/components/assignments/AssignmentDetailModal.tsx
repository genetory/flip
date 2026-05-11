"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readAccessToken } from "../../lib/auth-client";

export type AssignmentStatus = "ASSIGNED" | "SUBMITTED" | "REVIEWED" | "CANCELLED";

export type AssignmentDetailItem = {
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
  partnerOrganizationName?: string | null;
};

type AssignmentFull = {
  id: string;
  applicationId: string;
  title: string;
  description: string;
  dueAt: string | null;
  status: AssignmentStatus;
  assignedAt: string;
  submittedAt: string | null;
  submissionContent: string | null;
  submissionLinks: string[];
  feedbackContent: string | null;
  feedbackRating: number | null;
  reviewedAt: string | null;
  assignedBy: { id: string; name: string | null } | null;
  reviewedBy: { id: string; name: string | null } | null;
};

type Props = {
  open: boolean;
  assignment: AssignmentDetailItem | null;
  onClose: () => void;
  onUpdated: () => void;
  viewer?: "operator" | "partner";
};

const STATUS_LABEL: Record<AssignmentStatus, string> = {
  ASSIGNED: "부여됨",
  SUBMITTED: "제출됨",
  REVIEWED: "검토 완료",
  CANCELLED: "취소"
};

const STATUS_PILL: Record<AssignmentStatus, string> = {
  ASSIGNED: "ops-pill-amber",
  SUBMITTED: "ops-pill-blue",
  REVIEWED: "ops-pill-green",
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

export function AssignmentDetailModal({ open, assignment, onClose, onUpdated, viewer = "operator" }: Props) {
  const applicantBasePath = viewer === "partner"
    ? "/dashboard/partner/applicants"
    : "/dashboard/ops/operations/applications";
  const [full, setFull] = useState<AssignmentFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState("");
  const [ratingDraft, setRatingDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !assignment) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBase()}/applications/${assignment!.applicationId}/assignments`, {
          headers: authHeaders(),
          cache: "no-store"
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { items?: AssignmentFull[] };
        const f = (payload.items ?? []).find((it) => it.id === assignment!.id) ?? null;
        setFull(f);
        if (f) {
          setFeedbackDraft(f.feedbackContent ?? "");
          setRatingDraft(f.feedbackRating ? String(f.feedbackRating) : "");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "과제 상세를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [open, assignment?.id]);

  if (!open || !assignment) return null;

  async function submitReview() {
    if (!full) return;
    if (!feedbackDraft.trim()) {
      setError("피드백 내용을 입력해 주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: { feedbackContent: string; feedbackRating?: number } = { feedbackContent: feedbackDraft.trim() };
      const ratingNum = Number.parseInt(ratingDraft, 10);
      if (Number.isFinite(ratingNum) && ratingNum >= 1 && ratingNum <= 5) body.feedbackRating = ratingNum;
      const response = await fetch(`${apiBase()}/assignments/${full!.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "피드백 저장 실패");
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
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>{assignment.title}</h2>
            <p className="ops-card-subtle" style={{ marginTop: 4 }}>
              {assignment.candidateName ?? "-"} · {assignment.partnerOrganizationName ?? "-"} · {assignment.positionTitle ?? "-"}
            </p>
          </div>
          <Link href={`${applicantBasePath}/${assignment.applicationId}`} className="ops-btn">
            지원 상세 →
          </Link>
        </div>

        {loading ? (
          <p className="ops-card-subtle" style={{ margin: 0 }}>불러오는 중...</p>
        ) : !full ? (
          <p className="ops-card-subtle" style={{ margin: 0 }}>과제를 찾을 수 없습니다.</p>
        ) : (
          <>
            <div className="ops-tag-row" style={{ marginBottom: 12 }}>
              <span className={`ops-pill ${STATUS_PILL[full.status]}`}>{STATUS_LABEL[full.status]}</span>
            </div>

            <article className="ops-soft-card">
              <p className="ops-form-label">과제 설명</p>
              <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{full.description}</p>
              <p className="ops-card-subtle" style={{ marginTop: 8 }}>
                부여 {formatDateTime(full.assignedAt)} · 마감 {formatDateTime(full.dueAt)}
                {full.assignedBy ? ` · 담당 ${full.assignedBy.name ?? "-"}` : ""}
              </p>
            </article>

            {full.submissionContent ? (
              <article className="ops-card">
                <h3 className="ops-section-title">제출 ({formatDateTime(full.submittedAt)})</h3>
                <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", margin: 0 }}>{full.submissionContent}</p>
                {full.submissionLinks.length > 0 ? (
                  <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12 }}>
                    {full.submissionLinks.map((link, idx) => (
                      <li key={idx}>
                        <a href={link} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8" }}>
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ) : null}

            {full.feedbackContent ? (
              <article className="ops-card">
                <h3 className="ops-section-title">기존 피드백</h3>
                <div style={{ padding: 12, background: "#ecfdf5", borderRadius: 10 }}>
                  <p className="ops-card-subtle" style={{ color: "#047857", margin: 0, fontWeight: 600 }}>
                    {formatDateTime(full.reviewedAt)}
                    {full.feedbackRating ? ` · 평가 ${full.feedbackRating}/5` : ""}
                    {full.reviewedBy ? ` · ${full.reviewedBy.name ?? "-"}` : ""}
                  </p>
                  <p style={{ fontSize: 13, color: "#065f46", whiteSpace: "pre-wrap", margin: "6px 0 0" }}>{full.feedbackContent}</p>
                </div>
              </article>
            ) : null}

            {full.status === "SUBMITTED" || full.status === "REVIEWED" ? (
              <article className="ops-card">
                <h3 className="ops-section-title">{full.feedbackContent ? "피드백 수정" : "피드백 작성"}</h3>
                <textarea
                  value={feedbackDraft}
                  onChange={(e) => setFeedbackDraft(e.target.value)}
                  rows={4}
                  placeholder="피드백 내용을 입력해 주세요"
                  className="ops-textarea"
                />
                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <label className="ops-form-label" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    평가 (1-5, 선택)
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={ratingDraft}
                      onChange={(e) => setRatingDraft(e.target.value)}
                      className="ops-input"
                      style={{ width: 70 }}
                    />
                  </label>
                  <button type="button" onClick={() => void submitReview()} disabled={saving} className="ops-btn ops-btn-primary">
                    {saving ? "저장 중..." : "피드백 저장"}
                  </button>
                </div>
              </article>
            ) : null}
          </>
        )}

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
