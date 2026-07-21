"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { readAccessToken } from "../../lib/auth-client";
import { getApplicationStatusLabel, type ApplicationStatus } from "../../lib/status-labels";
import { useToast } from "../toast/ToastProvider";
import { ProposeInterviewSlotsModal } from "../interviews/ProposeInterviewSlotsModal";
import { AssignmentManagerModal } from "../assignments/AssignmentManagerModal";
import { ApplicationDocsModal } from "./ApplicationDocsModal";
import type { ResumeContent } from "../../lib/member-profile-client";

export type ApplicationDetail = {
  id: string;
  positionId: string;
  candidateUserId: string;
  status: ApplicationStatus;
  memo: string | null;
  submittedAt: string;
  updatedAt: string;
  // 지원에 연결된 대표 이력서(resume-maker). 없으면 null.
  resume?: { id: string; title: string; shareSlug: string } | null;
  // 제출 시점 스냅샷(제출본 보존). 있으면 스냅샷을 보여주고, 없으면(과거 지원건) resume 라이브 링크로 폴백.
  resumeSnapshot?: unknown | null;
  coverLetterSnapshot?: { title?: string; company?: string | null; items?: Array<{ id?: string; prompt?: string; answer?: string }> } | null;
  candidateUser: {
    id: string;
    name: string | null;
    email: string;
    phoneNumber: string | null;
    nationality: string | null;
    affiliation: string | null;
    jobTitle: string | null;
    role: string;
    createdAt: string;
  };
  position: {
    id: string;
    title: string;
    status: string;
    partnerOrganization: { id: string; name: string } | null;
  };
  statusHistories: Array<{
    id: string;
    status: ApplicationStatus;
    memo: string | null;
    changedAt: string;
    changedBy: { id: string; name: string | null; email: string; role: string } | null;
  }>;
  interviewSlots: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
    location: string | null;
    notes: string | null;
    status: "PROPOSED" | "SELECTED" | "CANCELLED";
    proposedAt: string;
    selectedAt: string | null;
    cancelledAt: string | null;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    description: string;
    status: "ASSIGNED" | "SUBMITTED" | "REVIEWED" | "CANCELLED";
    dueAt: string | null;
    assignedAt: string;
    submittedAt: string | null;
    submissionContent: string | null;
    submissionLinks: string[];
    feedbackContent: string | null;
    feedbackRating: number | null;
    reviewedAt: string | null;
    assignedBy: { id: string; name: string | null } | null;
    reviewedBy: { id: string; name: string | null } | null;
  }>;
  program: {
    id: string;
    status: string;
    startsAt: string;
    endsAt: string | null;
    meetings: Array<{ id: string; scheduledAt: string; status: string }>;
    certificate: { id: string; title: string } | null;
    recommendation: { id: string; signerName: string } | null;
    schoolCreditRequest: { id: string; status: string; schoolName: string; credits: number } | null;
  } | null;
  issues: Array<{
    id: string;
    type: string;
    status: string;
    title: string;
    description: string;
    createdAt: string;
    reporter: { id: string; name: string | null; email: string; role: string } | null;
    assignedTo?: { id: string; name: string | null; email: string } | null;
  }>;
};

type Props = {
  applicationId: string;
  viewer: "operator" | "partner";
};

const STATUS_OPTIONS: ApplicationStatus[] = ["SUBMITTED", "INTERVIEW", "ACCEPTED", "REJECTED"];

const STATUS_KO: Record<ApplicationStatus, string> = {
  SUBMITTED: "검토 중",
  INTERVIEW: "면접 예정",
  ACCEPTED: "합격",
  REJECTED: "불합격",
  WITHDRAWN: "철회"
};

const SLOT_STATUS_PILL: Record<string, string> = {
  PROPOSED: "ops-pill-amber",
  SELECTED: "ops-pill-green",
  CANCELLED: "ops-pill-gray"
};

const ASSIGNMENT_STATUS_PILL: Record<string, string> = {
  ASSIGNED: "ops-pill-amber",
  SUBMITTED: "ops-pill-blue",
  REVIEWED: "ops-pill-green",
  CANCELLED: "ops-pill-gray"
};

const ISSUE_STATUS_PILL: Record<string, string> = {
  OPEN: "ops-pill-red",
  IN_PROGRESS: "ops-pill-amber",
  RESOLVED: "ops-pill-green",
  CLOSED: "ops-pill-gray"
};

const ISSUE_STATUS_KO: Record<string, string> = {
  OPEN: "신규",
  IN_PROGRESS: "처리 중",
  RESOLVED: "해결",
  CLOSED: "종료"
};

const ISSUE_TYPE_KO: Record<string, string> = {
  NO_SHOW: "노쇼",
  BEHAVIOR: "행동·태도",
  DROPOUT: "참여 중단",
  ATTITUDE: "커뮤니케이션",
  PAYMENT: "정산/결제",
  OTHER: "기타"
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

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR");
}

type Comment = {
  id: string;
  content: string;
  visibility: "INTERNAL" | "CANDIDATE";
  createdAt: string;
  author: { id: string; name: string | null; email: string; role: string };
};

// 상태 변경 시 지원자에게 이메일·서비스 알림이 나가는 상태.
const DETAIL_NOTIFY_STATUSES: ApplicationStatus[] = ["INTERVIEW", "ACCEPTED", "REJECTED"];

export function ApplicationDetailView({ applicationId, viewer }: Props) {
  const toast = useToast();
  const [data, setData] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [memoDraft, setMemoDraft] = useState("");
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [docsTab, setDocsTab] = useState<"resume" | "cover" | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentVisibility, setCommentVisibility] = useState<"INTERNAL" | "CANDIDATE">("INTERNAL");
  const [postingComment, setPostingComment] = useState(false);

  const fetchPath = viewer === "operator"
    ? `/ops/applications/${applicationId}`
    : `/partner/applications/${applicationId}`;
  const programLinkBase = viewer === "operator"
    ? "/dashboard/ops/operations/programs"
    : "/dashboard/partner/programs";

  const loadComments = useCallback(async () => {
    try {
      const response = await fetch(`${apiBase()}/applications/${applicationId}/comments`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { items?: Comment[] };
      setComments(payload.items ?? []);
    } catch {
      // silent
    }
  }, [applicationId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}${fetchPath}`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { item?: ApplicationDetail };
      setData(payload.item ?? null);
      setMemoDraft(payload.item?.memo ?? "");
      void loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "지원 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [fetchPath]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(nextStatus: ApplicationStatus) {
    if (!data) return;
    const label = getApplicationStatusLabel(nextStatus, viewer).label;
    const notifies = DETAIL_NOTIFY_STATUSES.includes(nextStatus);
    // 면접 예정으로 넘어갈 때는 곧바로 '면접 일정 제안' 흐름으로 유도한다.
    if (nextStatus === "INTERVIEW" && data.status !== "INTERVIEW") {
      const go = window.confirm(
        "이 지원자를 면접 대상자로 선정합니다.\n지금 면접 일정을 제안하시겠어요?\n\n확인: 면접 일정 제안 창 열기\n취소: 상태만 '면접 예정'으로 변경(지원자에게 선정 알림)"
      );
      if (go) {
        setInterviewOpen(true); // 제안 창이 상태 전환 + 시간 이메일까지 처리
        return;
      }
      // 취소 시 아래 일반 흐름으로 상태만 '면접 예정'으로 변경한다.
    } else if (nextStatus === "ACCEPTED" || nextStatus === "REJECTED") {
      const memoNote = memoDraft.trim() ? "\n메모가 회사 메시지로 함께 전달됩니다." : "";
      if (!window.confirm(`이 지원자를 '${label}'(으)로 처리할까요?\n지원자에게 이메일·서비스 알림이 전송됩니다.${memoNote}`)) return;
    }
    setUpdating(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/applications/${data.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status: nextStatus, memo: memoDraft })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
      toast.success(notifies ? `'${label}'(으)로 변경했어요. 지원자에게 알림을 보냈어요.` : `'${label}'(으)로 변경했어요.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경 실패");
      toast.error("상태 변경에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setUpdating(false);
    }
  }

  async function saveMemo() {
    if (!data) return;
    setUpdating(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/applications/${data.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status: data.status, memo: memoDraft })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "메모 저장 실패");
    } finally {
      setUpdating(false);
    }
  }

  async function postComment() {
    if (!data) return;
    if (!commentDraft.trim()) return;
    setPostingComment(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/applications/${data.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ content: commentDraft.trim(), visibility: commentVisibility })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setCommentDraft("");
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "댓글 작성 실패");
    } finally {
      setPostingComment(false);
    }
  }

  async function deleteComment(id: string) {
    try {
      const response = await fetch(`${apiBase()}/application-comments/${id}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "댓글 삭제 실패");
    }
  }

  if (loading) return <div className="ops-empty-card">불러오는 중...</div>;
  if (error && !data) return <div className="ops-error-card">{error}</div>;
  if (!data) return <div className="ops-empty-card">지원 정보를 찾을 수 없습니다.</div>;

  return (
    <>
      <article className="ops-card">
        <div className="ops-card-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
              {data.candidateUser.name ?? "-"}
            </h2>
            <p className="ops-card-subtle" style={{ marginTop: 4 }}>
              {data.position.partnerOrganization?.name ?? "-"} · {data.position.title}
            </p>
            <p className="ops-card-subtle" style={{ marginTop: 2 }}>
              {data.candidateUser.email}
              {data.candidateUser.phoneNumber ? ` · ${data.candidateUser.phoneNumber}` : ""}
              {data.candidateUser.nationality ? ` · ${data.candidateUser.nationality}` : ""}
            </p>
            <p className="ops-card-subtle" style={{ marginTop: 2 }}>
              소속 {data.candidateUser.affiliation ?? "-"} · 직무 희망 {data.candidateUser.jobTitle ?? "-"}
            </p>
          </div>
          <span className={`ops-pill ${
            data.status === "ACCEPTED" ? "ops-pill-green" :
            data.status === "REJECTED" ? "ops-pill-red" :
            data.status === "INTERVIEW" ? "ops-pill-blue" : "ops-pill-amber"
          }`}>{getApplicationStatusLabel(data.status, viewer).label}</span>
        </div>

        <div className="ops-form-grid-3" style={{ marginTop: 16 }}>
          <label className="ops-form-label">
            상태
            <select
              className="ops-select"
              value={data.status}
              disabled={updating}
              onChange={(e) => void updateStatus(e.target.value as ApplicationStatus)}
              style={{ marginTop: 4 }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_KO[s]}</option>
              ))}
            </select>
          </label>
          <label className="ops-form-label">
            지원일
            <p style={{ marginTop: 4, color: "#111827", fontSize: 13 }}>{formatDateTime(data.submittedAt)}</p>
          </label>
          <label className="ops-form-label">
            최근 업데이트
            <p style={{ marginTop: 4, color: "#111827", fontSize: 13 }}>{formatDateTime(data.updatedAt)}</p>
          </label>
        </div>

        <div className="ops-form-label" style={{ marginTop: 16, display: "block" }}>
          지원 서류 <span className="ops-card-subtle">(제출 당시 그대로)</span>
          <div className="ops-row" style={{ marginTop: 4, gap: 8 }}>
            {data.resumeSnapshot ? (
              <button type="button" className="ops-btn" onClick={() => setDocsTab("resume")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                📄 이력서 보기
              </button>
            ) : data.resume ? (
              // 과거 지원건(스냅샷 없음) — 현재 이력서 공유 링크로 폴백
              <a
                href={`/resume/share/${data.resume.shareSlug}?view=preview`}
                target="_blank"
                rel="noopener noreferrer"
                className="ops-btn"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                📄 이력서 보기(현재본)
              </a>
            ) : null}
            {data.coverLetterSnapshot && (data.coverLetterSnapshot.items ?? []).some((it) => it?.answer?.trim()) ? (
              <button type="button" className="ops-btn" onClick={() => setDocsTab("cover")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                ✍️ 자기소개서 보기
              </button>
            ) : null}
            {!data.resumeSnapshot && !data.resume && !data.coverLetterSnapshot ? (
              <p className="ops-card-subtle" style={{ margin: 0 }}>연결된 서류가 없습니다.</p>
            ) : null}
          </div>
        </div>

        {docsTab ? (
          <ApplicationDocsModal
            resumeContent={(data.resumeSnapshot as ResumeContent | null) ?? null}
            coverLetter={data.coverLetterSnapshot ?? null}
            initialTab={docsTab}
            onClose={() => setDocsTab(null)}
          />
        ) : null}

        <div className="ops-row" style={{ marginTop: 12 }}>
          <button type="button" className="ops-btn" onClick={() => setInterviewOpen(true)}>
            면접 일정 제안
          </button>
          <button type="button" className="ops-btn" onClick={() => setAssignmentOpen(true)}>
            과제 관리
          </button>
        </div>

        <label className="ops-form-label" style={{ marginTop: 12, display: "block" }}>
          {viewer === "operator" ? "운영 메모" : "회사 메모"}
          <textarea
            value={memoDraft}
            onChange={(e) => setMemoDraft(e.target.value)}
            rows={3}
            placeholder="이 지원에 대한 내부 메모"
            className="ops-textarea"
            style={{ marginTop: 4 }}
          />
        </label>
        <div className="ops-row-end" style={{ marginTop: 8 }}>
          <button type="button" onClick={() => void saveMemo()} disabled={updating} className="ops-btn ops-btn-primary">
            {updating ? "저장 중..." : "메모 저장"}
          </button>
        </div>
      </article>

      <article className="ops-card">
        <h3 className="ops-section-title">상태 변경 히스토리</h3>
        {data.statusHistories.length === 0 ? (
          <p className="ops-card-subtle" style={{ margin: 0 }}>아직 변경 이력이 없습니다.</p>
        ) : (
          <div className="ops-stack">
            {data.statusHistories.map((h) => (
              <div key={h.id} className="ops-soft-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <span className={`ops-pill ${
                    h.status === "ACCEPTED" ? "ops-pill-green" :
                    h.status === "REJECTED" ? "ops-pill-red" :
                    h.status === "INTERVIEW" ? "ops-pill-blue" : "ops-pill-amber"
                  }`}>{STATUS_KO[h.status]}</span>
                  {h.memo ? <p style={{ fontSize: 13, color: "#374151", margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{h.memo}</p> : null}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p className="ops-card-subtle" style={{ margin: 0 }}>{formatDateTime(h.changedAt)}</p>
                  <p className="ops-card-subtle" style={{ margin: "2px 0 0" }}>{h.changedBy?.name ?? h.changedBy?.email ?? "-"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="ops-card">
        <h3 className="ops-section-title">면접 일정 ({data.interviewSlots.length})</h3>
        {data.interviewSlots.length === 0 ? (
          <div className="ops-stack" style={{ gap: 10 }}>
            <p className="ops-card-subtle" style={{ margin: 0 }}>
              {data.status === "INTERVIEW"
                ? "면접 대상자로 선정됐어요. 준비되면 아래 버튼으로 면접 일정을 제안하세요. (지금 바로 잡지 않아도 됩니다)"
                : "제안된 면접 일정이 없습니다."}
            </p>
            <div className="ops-row">
              <button type="button" className="ops-btn ops-btn-primary" onClick={() => setInterviewOpen(true)}>
                면접 일정 제안하기
              </button>
            </div>
          </div>
        ) : (
          <div className="ops-stack">
            {data.interviewSlots.map((slot) => (
              <div key={slot.id} className="ops-soft-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
                    {formatDateTime(slot.startsAt)} ~ {formatDateTime(slot.endsAt)}
                  </p>
                  {slot.location ? <p className="ops-card-subtle" style={{ marginTop: 4 }}>📍 {slot.location}</p> : null}
                  {slot.notes ? <p className="ops-card-subtle" style={{ marginTop: 2 }}>{slot.notes}</p> : null}
                  <p className="ops-card-subtle" style={{ marginTop: 4 }}>
                    제안 {formatDateTime(slot.proposedAt)}
                    {slot.selectedAt ? ` · 선택 ${formatDateTime(slot.selectedAt)}` : ""}
                    {slot.cancelledAt ? ` · 취소 ${formatDateTime(slot.cancelledAt)}` : ""}
                  </p>
                </div>
                <span className={`ops-pill ${SLOT_STATUS_PILL[slot.status]}`}>
                  {slot.status === "PROPOSED" ? "제안됨" : slot.status === "SELECTED" ? "확정" : "취소"}
                </span>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="ops-card">
        <h3 className="ops-section-title">과제 ({data.assignments.length})</h3>
        {data.assignments.length === 0 ? (
          <p className="ops-card-subtle" style={{ margin: 0 }}>부여된 과제가 없습니다.</p>
        ) : (
          <div className="ops-stack">
            {data.assignments.map((a) => (
              <div key={a.id} className="ops-soft-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>{a.title}</p>
                    <p className="ops-card-subtle" style={{ marginTop: 4 }}>
                      부여 {formatDateTime(a.assignedAt)} · 마감 {formatDateTime(a.dueAt)}
                      {a.assignedBy ? ` · 담당 ${a.assignedBy.name ?? "-"}` : ""}
                    </p>
                  </div>
                  <span className={`ops-pill ${ASSIGNMENT_STATUS_PILL[a.status]}`}>
                    {a.status === "ASSIGNED" ? "부여됨" : a.status === "SUBMITTED" ? "제출됨" : a.status === "REVIEWED" ? "검토 완료" : "취소"}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", margin: "8px 0 0" }}>{a.description}</p>
                {a.submissionContent ? (
                  <div style={{ marginTop: 8, padding: 10, background: "#fff", borderRadius: 8 }}>
                    <p className="ops-card-subtle" style={{ margin: 0, fontWeight: 600, color: "#111827" }}>제출 ({formatDateTime(a.submittedAt)})</p>
                    <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{a.submissionContent}</p>
                  </div>
                ) : null}
                {a.feedbackContent ? (
                  <div style={{ marginTop: 8, padding: 10, background: "#ecfdf5", borderRadius: 8 }}>
                    <p className="ops-card-subtle" style={{ margin: 0, fontWeight: 600, color: "#047857" }}>
                      피드백 ({formatDateTime(a.reviewedAt)}{a.feedbackRating ? ` · ${a.feedbackRating}/5` : ""})
                    </p>
                    <p style={{ fontSize: 13, color: "#065f46", whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{a.feedbackContent}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </article>

      {data.program ? (
        <article className="ops-card">
          <h3 className="ops-section-title">프로그램</h3>
          <div className="ops-soft-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>
                  {formatDate(data.program.startsAt)} ~ {formatDate(data.program.endsAt)}
                </p>
                <p className="ops-card-subtle" style={{ marginTop: 4 }}>
                  미팅 {data.program.meetings.length}건
                  {data.program.certificate ? " · 수료증 발급" : ""}
                  {data.program.recommendation ? " · 추천서 발급" : ""}
                  {data.program.schoolCreditRequest ? ` · 학점 인정 ${data.program.schoolCreditRequest.status === "APPROVED" ? "승인" : data.program.schoolCreditRequest.status === "REJECTED" ? "반려" : "심사중"}` : ""}
                </p>
              </div>
              <div className="ops-table-actions">
                <span className={`ops-pill ${data.program.status === "ACTIVE" ? "ops-pill-blue" : data.program.status === "COMPLETED" ? "ops-pill-green" : "ops-pill-gray"}`}>
                  {data.program.status === "ACTIVE" ? "진행 중" : data.program.status === "COMPLETED" ? "완료" : "취소"}
                </span>
                <Link href={`${programLinkBase}/${data.program.id}`} className="ops-btn">
                  상세 →
                </Link>
              </div>
            </div>
          </div>
        </article>
      ) : null}

      <article className="ops-card">
        <h3 className="ops-section-title">관련 이슈 ({data.issues.length})</h3>
        {data.issues.length === 0 ? (
          <p className="ops-card-subtle" style={{ margin: 0 }}>등록된 이슈가 없습니다.</p>
        ) : (
          <div className="ops-stack">
            {data.issues.map((i) => (
              <div key={i.id} className="ops-soft-card">
                <div className="ops-tag-row" style={{ marginBottom: 6 }}>
                  <span className="ops-pill ops-pill-gray">{ISSUE_TYPE_KO[i.type] ?? i.type}</span>
                  <span className={`ops-pill ${ISSUE_STATUS_PILL[i.status]}`}>{ISSUE_STATUS_KO[i.status] ?? i.status}</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>{i.title}</p>
                <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{i.description}</p>
                <p className="ops-card-subtle" style={{ marginTop: 4 }}>
                  {formatDateTime(i.createdAt)} · 신고 {i.reporter?.name ?? i.reporter?.email ?? "-"}
                  {i.assignedTo ? ` · 담당 ${i.assignedTo.name ?? i.assignedTo.email}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="ops-card">
        <h3 className="ops-section-title">댓글 / 메모 ({comments.length})</h3>
        <div className="ops-soft-card" style={{ marginBottom: 12 }}>
          <textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder={
              viewer === "operator"
                ? "내부 메모 또는 회사·지원자와 공유할 내용"
                : "지원자에게 공유할 메시지 또는 회사 내부 메모"
            }
            rows={3}
            className="ops-textarea"
          />
          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <select
              value={commentVisibility}
              onChange={(e) => setCommentVisibility(e.target.value as "INTERNAL" | "CANDIDATE")}
              className="ops-select"
              style={{ width: "auto", minWidth: 180 }}
            >
              <option value="INTERNAL">🔒 내부 (회사·운영자만)</option>
              <option value="CANDIDATE">👁 지원자에게도 공개</option>
            </select>
            <button type="button" onClick={() => void postComment()} disabled={postingComment} className="ops-btn ops-btn-primary">
              {postingComment ? "작성 중..." : "댓글 등록"}
            </button>
          </div>
        </div>
        {comments.length === 0 ? (
          <p className="ops-card-subtle" style={{ margin: 0 }}>아직 작성된 댓글이 없습니다.</p>
        ) : (
          <div className="ops-stack">
            {comments.map((c) => {
              const isPartner = c.author.role === "PARTNER";
              const isOps = c.author.role === "OPERATOR";
              const isStudent = c.author.role === "STUDENT";
              return (
                <div
                  key={c.id}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: isOps ? "#fffbeb" : isPartner ? "#eff6ff" : isStudent ? "#fdf4ff" : "#f9fafb"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div className="ops-tag-row">
                      <span className={`ops-pill ${isOps ? "ops-pill-amber" : isPartner ? "ops-pill-blue" : "ops-pill-violet"}`}>
                        {c.author.name ?? c.author.email} ({isOps ? "운영자" : isPartner ? "회사" : "지원자"})
                      </span>
                      <span className={`ops-pill ${c.visibility === "INTERNAL" ? "ops-pill-gray" : "ops-pill-green"}`}>
                        {c.visibility === "INTERNAL" ? "🔒 내부" : "👁 공개"}
                      </span>
                    </div>
                    <span className="ops-card-subtle" style={{ flexShrink: 0 }}>{formatDateTime(c.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#111827", whiteSpace: "pre-wrap", margin: "8px 0 0" }}>{c.content}</p>
                  <div className="ops-row-end" style={{ marginTop: 6 }}>
                    <button type="button" onClick={() => void deleteComment(c.id)} className="ops-btn ops-btn-danger" style={{ height: 24, fontSize: 11, padding: "0 8px" }}>
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>

      {error ? <div className="ops-error-card">{error}</div> : null}

      <ProposeInterviewSlotsModal
        open={interviewOpen}
        applicationId={data.id}
        applicantName={data.candidateUser.name ?? undefined}
        positionTitle={data.position.title}
        onClose={() => setInterviewOpen(false)}
        onProposed={() => void load()}
      />
      <AssignmentManagerModal
        open={assignmentOpen}
        applicationId={data.id}
        applicantName={data.candidateUser.name ?? undefined}
        positionTitle={data.position.title}
        onClose={() => {
          setAssignmentOpen(false);
          void load();
        }}
      />
    </>
  );
}
