"use client";

import { useEffect, useState } from "react";
import { readAccessToken } from "../../lib/auth-client";

export type ProgramFeedback = {
  id: string;
  content: string;
  rating: number | null;
  createdAt: string;
  authorRole: "STUDENT" | "PARTNER" | "OPERATOR";
  author: { id: string; name: string | null; role: string };
};

export type ProgramMeeting = {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  agenda: string | null;
  location: string | null;
  notes: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
};

export type ProgramDetail = {
  id: string;
  applicationId: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  startsAt: string;
  endsAt: string | null;
  notes: string | null;
  application: {
    id: string;
    candidateUser: { id: string; name: string | null; email: string };
    position: {
      id: string;
      title: string;
      partnerOrganization: { id: string; name: string } | null;
    };
  };
  meetings: ProgramMeeting[];
  feedbacks: ProgramFeedback[];
  certificate: { id: string; title: string; content: string; issuedAt: string } | null;
  recommendation: { id: string; content: string; signerName: string; signerTitle: string | null; issuedAt: string } | null;
  schoolCreditRequest: {
    id: string;
    schoolName: string;
    courseCode: string | null;
    credits: number;
    status: "REQUESTED" | "APPROVED" | "REJECTED";
    requestedAt: string;
    reviewedAt: string | null;
    reviewNote: string | null;
  } | null;
};

type Props = {
  programId: string;
  viewer: "partner" | "student" | "operator";
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR");
}

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ProgramDetailView({ programId, viewer }: Props) {
  const canEditMeta = viewer === "partner" || viewer === "operator";
  const canManageMeetings = viewer === "partner" || viewer === "operator";
  const canIssueArtifacts = viewer === "partner" || viewer === "operator";
  const canRequestCredit = viewer === "student";

  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusDraft, setStatusDraft] = useState<ProgramDetail["status"]>("ACTIVE");
  const [startsAtDraft, setStartsAtDraft] = useState("");
  const [endsAtDraft, setEndsAtDraft] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingDuration, setMeetingDuration] = useState("30");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [meetingNotesDraft, setMeetingNotesDraft] = useState<Record<string, string>>({});
  const [updatingMeeting, setUpdatingMeeting] = useState<string | null>(null);

  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackRating, setFeedbackRating] = useState("");
  const [postingFeedback, setPostingFeedback] = useState(false);

  const [certTitle, setCertTitle] = useState("");
  const [certContent, setCertContent] = useState("");
  const [issuingCert, setIssuingCert] = useState(false);

  const [recContent, setRecContent] = useState("");
  const [recSigner, setRecSigner] = useState("");
  const [recSignerTitle, setRecSignerTitle] = useState("");
  const [issuingRec, setIssuingRec] = useState(false);

  const [schoolName, setSchoolName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [credits, setCredits] = useState("3");
  const [requestingCredit, setRequestingCredit] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/programs/${programId}`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { ok?: boolean; item?: ProgramDetail };
      const p = payload.item ?? null;
      setProgram(p);
      if (p) {
        setStatusDraft(p.status);
        setStartsAtDraft(toDateInputValue(p.startsAt));
        setEndsAtDraft(toDateInputValue(p.endsAt));
        setCertTitle(p.certificate?.title ?? "");
        setCertContent(p.certificate?.content ?? "");
        setRecContent(p.recommendation?.content ?? "");
        setRecSigner(p.recommendation?.signerName ?? "");
        setRecSignerTitle(p.recommendation?.signerTitle ?? "");
        setSchoolName(p.schoolCreditRequest?.schoolName ?? "");
        setCourseCode(p.schoolCreditRequest?.courseCode ?? "");
        setCredits(String(p.schoolCreditRequest?.credits ?? 3));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "프로그램을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [programId]);

  async function saveMeta() {
    setSavingMeta(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { status: statusDraft };
      if (startsAtDraft) body.startsAt = new Date(`${startsAtDraft}T00:00:00`).toISOString();
      body.endsAt = endsAtDraft ? new Date(`${endsAtDraft}T23:59:59`).toISOString() : null;
      const response = await fetch(`${apiBase()}/programs/${programId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "프로그램 정보 저장 실패");
    } finally {
      setSavingMeta(false);
    }
  }

  async function createMeeting() {
    if (!meetingDate || !meetingTime) {
      setError("미팅 날짜와 시간을 입력해 주세요.");
      return;
    }
    setCreatingMeeting(true);
    setError(null);
    try {
      const scheduledAt = new Date(`${meetingDate}T${meetingTime}:00`).toISOString();
      const body = {
        scheduledAt,
        durationMinutes: Number.parseInt(meetingDuration, 10) || 30,
        agenda: meetingAgenda.trim() || undefined,
        location: meetingLocation.trim() || undefined
      };
      const response = await fetch(`${apiBase()}/programs/${programId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setMeetingDate("");
      setMeetingTime("");
      setMeetingAgenda("");
      setMeetingLocation("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "미팅 추가 실패");
    } finally {
      setCreatingMeeting(false);
    }
  }

  async function updateMeeting(meetingId: string, body: Record<string, unknown>) {
    setUpdatingMeeting(meetingId);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/program-meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "미팅 업데이트 실패");
    } finally {
      setUpdatingMeeting(null);
    }
  }

  async function postFeedback() {
    if (!feedbackContent.trim()) {
      setError("피드백 내용을 입력해 주세요.");
      return;
    }
    setPostingFeedback(true);
    setError(null);
    try {
      const body: { content: string; rating?: number } = { content: feedbackContent.trim() };
      const ratingNum = Number.parseInt(feedbackRating, 10);
      if (Number.isFinite(ratingNum) && ratingNum >= 1 && ratingNum <= 5) body.rating = ratingNum;
      const response = await fetch(`${apiBase()}/programs/${programId}/feedbacks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setFeedbackContent("");
      setFeedbackRating("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "피드백 작성 실패");
    } finally {
      setPostingFeedback(false);
    }
  }

  async function issueCertificate() {
    if (!certTitle.trim() || !certContent.trim()) {
      setError("수료증 제목과 내용을 입력해 주세요.");
      return;
    }
    setIssuingCert(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/programs/${programId}/certificate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ title: certTitle.trim(), content: certContent.trim() })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "수료증 발급 실패");
    } finally {
      setIssuingCert(false);
    }
  }

  async function issueRecommendation() {
    if (!recContent.trim() || !recSigner.trim()) {
      setError("추천서 내용과 작성자 이름을 입력해 주세요.");
      return;
    }
    setIssuingRec(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/programs/${programId}/recommendation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          content: recContent.trim(),
          signerName: recSigner.trim(),
          signerTitle: recSignerTitle.trim() || undefined
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "추천서 발급 실패");
    } finally {
      setIssuingRec(false);
    }
  }

  async function requestSchoolCredit() {
    if (!schoolName.trim()) {
      setError("학교명을 입력해 주세요.");
      return;
    }
    setRequestingCredit(true);
    setError(null);
    try {
      const creditsNum = Number.parseInt(credits, 10) || 0;
      const response = await fetch(`${apiBase()}/programs/${programId}/school-credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          schoolName: schoolName.trim(),
          courseCode: courseCode.trim() || undefined,
          credits: creditsNum
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "학점 인정 요청 실패");
    } finally {
      setRequestingCredit(false);
    }
  }

  if (loading) {
    return <div className="ops-empty-card">불러오는 중...</div>;
  }
  if (error && !program) {
    return <div className="ops-error-card">{error}</div>;
  }
  if (!program) {
    return <div className="ops-empty-card">프로그램을 찾을 수 없습니다.</div>;
  }

  const meetingStatusPill = (s: ProgramMeeting["status"]) =>
    s === "COMPLETED" ? "ops-pill-green" : s === "CANCELLED" ? "ops-pill-gray" : "ops-pill-amber";
  const meetingStatusLabel = (s: ProgramMeeting["status"]) =>
    s === "SCHEDULED" ? "예정" : s === "COMPLETED" ? "완료" : "취소";

  return (
    <div>
      <article className="ops-card">
        <div className="ops-card-header">
          <div>
            <h2 className="ops-card-header" style={{ fontSize: 18, margin: 0 }}>{program.application.candidateUser.name ?? "-"}</h2>
            <p className="ops-card-subtle" style={{ marginTop: 4 }}>
              {program.application.position.partnerOrganization?.name ?? "-"} · {program.application.position.title}
            </p>
            <p className="ops-card-subtle" style={{ marginTop: 2 }}>{program.application.candidateUser.email}</p>
          </div>
        </div>

        <div className="ops-form-grid-3" style={{ marginTop: 16 }}>
          <label className="ops-form-label">
            상태
            {canEditMeta ? (
              <select
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value as ProgramDetail["status"])}
                className="ops-select"
                style={{ marginTop: 4 }}
              >
                <option value="ACTIVE">진행 중</option>
                <option value="COMPLETED">완료</option>
                <option value="CANCELLED">취소</option>
              </select>
            ) : (
              <p style={{ marginTop: 4, color: "#111827", fontSize: 13 }}>{program.status}</p>
            )}
          </label>
          <label className="ops-form-label">
            시작일
            {canEditMeta ? (
              <input type="date" value={startsAtDraft} onChange={(e) => setStartsAtDraft(e.target.value)} className="ops-input" style={{ marginTop: 4 }} />
            ) : (
              <p style={{ marginTop: 4, color: "#111827", fontSize: 13 }}>{formatDate(program.startsAt)}</p>
            )}
          </label>
          <label className="ops-form-label">
            종료일
            {canEditMeta ? (
              <input type="date" value={endsAtDraft} onChange={(e) => setEndsAtDraft(e.target.value)} className="ops-input" style={{ marginTop: 4 }} />
            ) : (
              <p style={{ marginTop: 4, color: "#111827", fontSize: 13 }}>{formatDate(program.endsAt)}</p>
            )}
          </label>
        </div>
        {canEditMeta ? (
          <div className="ops-row-end" style={{ marginTop: 12 }}>
            <button type="button" onClick={() => void saveMeta()} disabled={savingMeta} className="ops-btn ops-btn-primary">
              {savingMeta ? "저장 중..." : "프로그램 정보 저장"}
            </button>
          </div>
        ) : null}
      </article>

      <article className="ops-card">
        <h3 className="ops-section-title">정기 면담</h3>
        {canManageMeetings ? (
          <div className="ops-soft-card" style={{ marginBottom: 12 }}>
            <div className="ops-form-grid-3">
              <label className="ops-form-label">
                날짜
                <input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="ops-input" style={{ marginTop: 4 }} />
              </label>
              <label className="ops-form-label">
                시간
                <input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} className="ops-input" style={{ marginTop: 4 }} />
              </label>
              <label className="ops-form-label">
                소요 시간(분)
                <input type="number" min={5} max={600} value={meetingDuration} onChange={(e) => setMeetingDuration(e.target.value)} className="ops-input" style={{ marginTop: 4 }} />
              </label>
            </div>
            <label className="ops-form-label" style={{ marginTop: 8 }}>
              아젠다 (선택)
              <input type="text" value={meetingAgenda} onChange={(e) => setMeetingAgenda(e.target.value)} className="ops-input" style={{ marginTop: 4 }} />
            </label>
            <label className="ops-form-label" style={{ marginTop: 8 }}>
              장소 / 링크 (선택)
              <input type="text" value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)} className="ops-input" style={{ marginTop: 4 }} />
            </label>
            <div className="ops-row-end" style={{ marginTop: 10 }}>
              <button type="button" onClick={() => void createMeeting()} disabled={creatingMeeting} className="ops-btn ops-btn-primary">
                {creatingMeeting ? "추가 중..." : "미팅 추가"}
              </button>
            </div>
          </div>
        ) : null}
        {program.meetings.length === 0 ? (
          <p className="ops-card-subtle" style={{ margin: 0 }}>아직 등록된 면담이 없습니다.</p>
        ) : (
          <div className="ops-stack">
            {program.meetings.map((m) => {
              const isUpdating = updatingMeeting === m.id;
              return (
                <div key={m.id} className="ops-soft-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
                        {formatDateTime(m.scheduledAt)} ({m.durationMinutes}분)
                      </p>
                      {m.agenda ? <p className="ops-card-subtle" style={{ marginTop: 4 }}>{m.agenda}</p> : null}
                      {m.location ? <p className="ops-card-subtle" style={{ marginTop: 2 }}>📍 {m.location}</p> : null}
                    </div>
                    <span className={`ops-pill ${meetingStatusPill(m.status)}`}>{meetingStatusLabel(m.status)}</span>
                  </div>
                  {canManageMeetings && m.status !== "CANCELLED" ? (
                    <div style={{ marginTop: 10 }}>
                      <textarea
                        value={meetingNotesDraft[m.id] ?? m.notes ?? ""}
                        onChange={(e) => setMeetingNotesDraft((prev) => ({ ...prev, [m.id]: e.target.value }))}
                        placeholder="미팅 노트 (선택)"
                        rows={2}
                        className="ops-textarea"
                      />
                      <div className="ops-row-end" style={{ marginTop: 8 }}>
                        <button type="button" onClick={() => void updateMeeting(m.id, { status: "CANCELLED" })} disabled={isUpdating} className="ops-btn ops-btn-danger">
                          취소
                        </button>
                        <button type="button" onClick={() => void updateMeeting(m.id, { notes: meetingNotesDraft[m.id] ?? m.notes ?? null })} disabled={isUpdating} className="ops-btn">
                          노트 저장
                        </button>
                        {m.status === "SCHEDULED" ? (
                          <button type="button" onClick={() => void updateMeeting(m.id, { status: "COMPLETED", notes: meetingNotesDraft[m.id] ?? m.notes ?? null })} disabled={isUpdating} className="ops-btn ops-btn-primary">
                            완료 처리
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : m.notes ? (
                    <p className="ops-card-subtle" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>📝 {m.notes}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </article>

      <article className="ops-card">
        <h3 className="ops-section-title">프로그램 피드백</h3>
        <div className="ops-soft-card" style={{ marginBottom: 12 }}>
          <textarea
            value={feedbackContent}
            onChange={(e) => setFeedbackContent(e.target.value)}
            placeholder={viewer === "student" ? "회사에 전달할 피드백을 작성하세요" : "지원자에게 전달할 피드백을 작성하세요"}
            rows={3}
            className="ops-textarea"
          />
          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <label className="ops-form-label" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              평가 (1-5, 선택)
              <input type="number" min={1} max={5} value={feedbackRating} onChange={(e) => setFeedbackRating(e.target.value)} className="ops-input" style={{ width: 70 }} />
            </label>
            <button type="button" onClick={() => void postFeedback()} disabled={postingFeedback} className="ops-btn ops-btn-primary">
              {postingFeedback ? "등록 중..." : "피드백 등록"}
            </button>
          </div>
        </div>
        {program.feedbacks.length === 0 ? (
          <p className="ops-card-subtle" style={{ margin: 0 }}>아직 등록된 피드백이 없습니다.</p>
        ) : (
          <div className="ops-stack">
            {program.feedbacks.map((f) => {
              const isPartner = f.authorRole === "PARTNER" || f.authorRole === "OPERATOR";
              return (
                <div key={f.id} style={{ padding: 12, background: isPartner ? "#eff6ff" : "#fdf4ff", borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#374151" }}>
                    <span style={{ fontWeight: 600 }}>
                      {f.author.name ?? "-"} ({isPartner ? "회사" : "지원자"})
                      {f.rating ? ` · ${f.rating}/5` : ""}
                    </span>
                    <span className="ops-card-subtle">{formatDateTime(f.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#111827", whiteSpace: "pre-wrap", margin: "6px 0 0" }}>{f.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </article>

      <article className="ops-card">
        <h3 className="ops-section-title">수료증</h3>
        {program.certificate ? (
          <div style={{ padding: 12, background: "#ecfdf5", borderRadius: 10 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#047857", margin: 0 }}>{program.certificate.title}</p>
            <p className="ops-card-subtle" style={{ marginTop: 4 }}>발급일: {formatDateTime(program.certificate.issuedAt)}</p>
            <p style={{ fontSize: 13, color: "#065f46", whiteSpace: "pre-wrap", marginTop: 8 }}>{program.certificate.content}</p>
          </div>
        ) : (
          <p className="ops-card-subtle" style={{ margin: 0 }}>아직 수료증이 발급되지 않았습니다.</p>
        )}
        {canIssueArtifacts ? (
          <div className="ops-soft-card" style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>
              {program.certificate ? "수료증 수정" : "수료증 발급"}
            </p>
            <input type="text" value={certTitle} onChange={(e) => setCertTitle(e.target.value)} placeholder="수료증 제목" className="ops-input" />
            <textarea value={certContent} onChange={(e) => setCertContent(e.target.value)} placeholder="수료 내용 / 프로그램 요약" rows={4} className="ops-textarea" style={{ marginTop: 8 }} />
            <div className="ops-row-end" style={{ marginTop: 8 }}>
              <button type="button" onClick={() => void issueCertificate()} disabled={issuingCert} className="ops-btn ops-btn-primary">
                {issuingCert ? "발급 중..." : program.certificate ? "수정" : "발급"}
              </button>
            </div>
          </div>
        ) : null}
      </article>

      <article className="ops-card">
        <h3 className="ops-section-title">추천서</h3>
        {program.recommendation ? (
          <div style={{ padding: 12, background: "#eff6ff", borderRadius: 10 }}>
            <p className="ops-card-subtle" style={{ margin: 0 }}>
              발급일: {formatDateTime(program.recommendation.issuedAt)} · 작성: {program.recommendation.signerName}
              {program.recommendation.signerTitle ? ` (${program.recommendation.signerTitle})` : ""}
            </p>
            <p style={{ fontSize: 13, color: "#1e3a8a", whiteSpace: "pre-wrap", marginTop: 8 }}>{program.recommendation.content}</p>
          </div>
        ) : (
          <p className="ops-card-subtle" style={{ margin: 0 }}>아직 추천서가 작성되지 않았습니다.</p>
        )}
        {canIssueArtifacts ? (
          <div className="ops-soft-card" style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>
              {program.recommendation ? "추천서 수정" : "추천서 작성"}
            </p>
            <textarea value={recContent} onChange={(e) => setRecContent(e.target.value)} placeholder="추천 내용" rows={5} className="ops-textarea" />
            <div className="ops-form-grid-2" style={{ marginTop: 8 }}>
              <input type="text" value={recSigner} onChange={(e) => setRecSigner(e.target.value)} placeholder="작성자 이름" className="ops-input" />
              <input type="text" value={recSignerTitle} onChange={(e) => setRecSignerTitle(e.target.value)} placeholder="직책 (선택)" className="ops-input" />
            </div>
            <div className="ops-row-end" style={{ marginTop: 8 }}>
              <button type="button" onClick={() => void issueRecommendation()} disabled={issuingRec} className="ops-btn ops-btn-primary">
                {issuingRec ? "작성 중..." : program.recommendation ? "수정" : "작성"}
              </button>
            </div>
          </div>
        ) : null}
      </article>

      <article className="ops-card">
        <h3 className="ops-section-title">학점 인정 요청</h3>
        {program.schoolCreditRequest ? (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background:
                program.schoolCreditRequest.status === "APPROVED"
                  ? "#ecfdf5"
                  : program.schoolCreditRequest.status === "REJECTED"
                    ? "#fef2f2"
                    : "#fffbeb"
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
              {program.schoolCreditRequest.schoolName}
              {program.schoolCreditRequest.courseCode ? ` · ${program.schoolCreditRequest.courseCode}` : ""}
              {` · ${program.schoolCreditRequest.credits}학점`}
            </p>
            <p className="ops-card-subtle" style={{ marginTop: 4 }}>
              요청: {formatDateTime(program.schoolCreditRequest.requestedAt)} · 상태:{" "}
              {program.schoolCreditRequest.status === "REQUESTED"
                ? "심사 대기"
                : program.schoolCreditRequest.status === "APPROVED"
                  ? "승인됨"
                  : "반려"}
              {program.schoolCreditRequest.reviewedAt ? ` (${formatDateTime(program.schoolCreditRequest.reviewedAt)})` : ""}
            </p>
            {program.schoolCreditRequest.reviewNote ? (
              <p style={{ fontSize: 13, color: "#374151", marginTop: 6, whiteSpace: "pre-wrap" }}>📝 {program.schoolCreditRequest.reviewNote}</p>
            ) : null}
          </div>
        ) : (
          <p className="ops-card-subtle" style={{ margin: 0 }}>학점 인정 요청이 등록되지 않았습니다.</p>
        )}
        {canRequestCredit ? (
          <div className="ops-soft-card" style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>
              {program.schoolCreditRequest ? "학점 인정 요청 재제출" : "학점 인정 요청"}
            </p>
            <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="학교명" className="ops-input" />
            <div className="ops-form-grid-2" style={{ marginTop: 8 }}>
              <input type="text" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="과목 코드 (선택)" className="ops-input" />
              <input type="number" min={0} max={20} value={credits} onChange={(e) => setCredits(e.target.value)} placeholder="학점" className="ops-input" />
            </div>
            <div className="ops-row-end" style={{ marginTop: 8 }}>
              <button type="button" onClick={() => void requestSchoolCredit()} disabled={requestingCredit} className="ops-btn ops-btn-primary">
                {requestingCredit ? "제출 중..." : "요청 제출"}
              </button>
            </div>
          </div>
        ) : null}
      </article>

      {error ? <p style={{ color: "#dc2626", fontSize: 12, marginTop: 12 }}>{error}</p> : null}
    </div>
  );
}
