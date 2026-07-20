"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { readAccessToken } from "../../../../../../lib/auth-client";

type UserDetail = {
  id: string;
  email: string;
  emailVerified: boolean;
  isActive: boolean;
  suspendedAt: string | null;
  suspendedReason: string | null;
  name: string | null;
  phoneNumber: string | null;
  nationality: string | null;
  affiliation: string | null;
  jobTitle: string | null;
  birthDate: string | null;
  gender: string | null;
  adminMemo: string | null;
  role: "STUDENT" | "PARTNER" | "OPERATOR";
  partnerType: string | null;
  partnerOrgRole: string | null;
  authProvider: string;
  createdAt: string;
  updatedAt: string;
  partnerOrganization: { id: string; name: string; partnerType: string; industry: string } | null;
};

type AppItem = {
  id: string;
  positionId: string;
  positionTitle: string;
  partnerOrganizationName: string | null;
  status: "SUBMITTED" | "INTERVIEW" | "ACCEPTED" | "REJECTED";
  memo: string | null;
  submittedAt: string;
  updatedAt: string;
};

type ProgItem = {
  id: string;
  applicationId: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  startsAt: string;
  endsAt: string | null;
  positionTitle: string;
};

type IssueItem = {
  id: string;
  type: string;
  status: string;
  title: string;
  description: string;
  createdAt: string;
};

type DetailPayload = {
  user: UserDetail;
  applications: AppItem[];
  programs: ProgItem[];
  reportedIssues: IssueItem[];
  subjectIssues: IssueItem[];
};

const ROLE_LABEL: Record<UserDetail["role"], string> = {
  STUDENT: "학생",
  PARTNER: "파트너",
  OPERATOR: "운영자"
};

const ROLE_PILL: Record<UserDetail["role"], string> = {
  STUDENT: "ops-pill-blue",
  PARTNER: "ops-pill-violet",
  OPERATOR: "ops-pill-amber"
};

const PROVIDER_LABEL: Record<string, string> = {
  EMAIL: "이메일",
  NAVER: "네이버",
  KAKAO: "카카오",
  GOOGLE: "구글"
};

const APP_STATUS_PILL: Record<AppItem["status"], string> = {
  SUBMITTED: "ops-pill-amber",
  INTERVIEW: "ops-pill-blue",
  ACCEPTED: "ops-pill-green",
  REJECTED: "ops-pill-red"
};

const APP_STATUS_KO: Record<AppItem["status"], string> = {
  SUBMITTED: "검토 중",
  INTERVIEW: "면접 예정",
  ACCEPTED: "합격",
  REJECTED: "불합격"
};

const PROGRAM_STATUS_PILL: Record<ProgItem["status"], string> = {
  ACTIVE: "ops-pill-blue",
  COMPLETED: "ops-pill-green",
  CANCELLED: "ops-pill-gray"
};

const ISSUE_TYPE_KO: Record<string, string> = {
  NO_SHOW: "노쇼",
  BEHAVIOR: "행동·태도",
  DROPOUT: "참여 중단",
  ATTITUDE: "커뮤니케이션",
  PAYMENT: "정산/결제",
  OTHER: "기타"
};

const ISSUE_STATUS_PILL: Record<string, string> = {
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

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR");
}

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export default function OpsUserDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params?.id[0] : "";
  const [data, setData] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const [memoDraft, setMemoDraft] = useState("");
  const [emailVerifiedDraft, setEmailVerifiedDraft] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/ops/users/${id}`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as DetailPayload & { ok?: boolean };
      setData(payload);
      setMemoDraft(payload.user?.adminMemo ?? "");
      setEmailVerifiedDraft(payload.user?.emailVerified ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "사용자 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function changeRole(nextRole: UserDetail["role"]) {
    if (!data) return;
    setUpdating(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/ops/users/${data.user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ role: nextRole })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "역할 변경 실패");
    } finally {
      setUpdating(false);
    }
  }

  async function saveMemo() {
    if (!data) return;
    setUpdating(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/ops/users/${data.user.id}/admin-memo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ adminMemo: memoDraft })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "메모 저장 실패");
    } finally {
      setUpdating(false);
    }
  }

  async function toggleSuspend() {
    if (!data) return;
    const willSuspend = data.user.isActive;
    let reason: string | null = null;
    if (willSuspend) {
      const input = window.prompt("정지 사유를 입력하세요 (선택):", "");
      if (input === null) return;
      reason = input.trim() || null;
    } else {
      if (!window.confirm("이 사용자를 다시 활성화하시겠습니까?")) return;
    }
    setUpdating(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/ops/users/${data.user.id}/suspend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ isActive: !willSuspend, reason })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경 실패");
    } finally {
      setUpdating(false);
    }
  }

  if (!id) return null;

  return (
    <section className="ops-content-section">
      <Link href="/dashboard/ops/system/admin-users" style={{ fontSize: 12, color: "var(--ink-faint)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
        <ArrowLeft size={13} weight="bold" aria-hidden /> 사용자 목록
      </Link>
      <header style={{ marginTop: 8 }}>
        <h1>사용자 상세</h1>
        <p>사용자 프로필과 플랫폼 활동을 한 화면에서 확인하세요.</p>
      </header>

      {loading ? (
        <div className="ops-empty-card">불러오는 중...</div>
      ) : error && !data ? (
        <div className="ops-error-card">{error}</div>
      ) : !data ? (
        <div className="ops-empty-card">사용자를 찾을 수 없습니다.</div>
      ) : (
        <>
          <article className="ops-card">
            <div className="ops-card-header">
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                  {data.user.name ?? "-"}
                </h2>
                <p className="ops-card-subtle" style={{ marginTop: 4 }}>
                  {data.user.email}
                  {!data.user.emailVerified ? " · 미인증" : ""}
                </p>
              </div>
              <div className="ops-table-actions">
                <span className={`ops-pill ${ROLE_PILL[data.user.role]}`}>{ROLE_LABEL[data.user.role]}</span>
                {data.user.isActive ? (
                  <span className="ops-pill ops-pill-green">활성</span>
                ) : (
                  <span className="ops-pill ops-pill-red">정지</span>
                )}
                <button
                  type="button"
                  onClick={() => void toggleSuspend()}
                  disabled={updating}
                  className={`ops-btn ${data.user.isActive ? "ops-btn-danger" : "ops-btn-primary"}`}
                >
                  {data.user.isActive ? "계정 정지" : "계정 활성화"}
                </button>
              </div>
            </div>

            {!data.user.isActive && data.user.suspendedReason ? (
              <div className="ops-error-card" style={{ marginTop: 8 }}>
                <strong>정지 사유:</strong> {data.user.suspendedReason}
              </div>
            ) : null}

            <div className="ops-form-grid-3" style={{ marginTop: 16 }}>
              <label className="ops-form-label">
                역할 변경
                <select
                  value={data.user.role}
                  onChange={(e) => void changeRole(e.target.value as UserDetail["role"])}
                  disabled={updating}
                  className="ops-select"
                  style={{ marginTop: 4 }}
                >
                  <option value="STUDENT">학생</option>
                  <option value="PARTNER">파트너</option>
                  <option value="OPERATOR">운영자</option>
                </select>
              </label>
              <label className="ops-form-label">
                전화번호
                <p style={{ marginTop: 4, color: "var(--ink)", fontSize: 13 }}>{data.user.phoneNumber ?? "-"}</p>
              </label>
              <label className="ops-form-label">
                가입 방식
                <p style={{ marginTop: 4, color: "var(--ink)", fontSize: 13 }}>{PROVIDER_LABEL[data.user.authProvider] ?? data.user.authProvider}</p>
              </label>
            </div>

            <div className="ops-form-grid-3" style={{ marginTop: 10 }}>
              <label className="ops-form-label">
                국적
                <p style={{ marginTop: 4, color: "var(--ink)", fontSize: 13 }}>{data.user.nationality ?? "-"}</p>
              </label>
              <label className="ops-form-label">
                소속
                <p style={{ marginTop: 4, color: "var(--ink)", fontSize: 13 }}>{data.user.affiliation ?? "-"}</p>
              </label>
              <label className="ops-form-label">
                직무 희망
                <p style={{ marginTop: 4, color: "var(--ink)", fontSize: 13 }}>{data.user.jobTitle ?? "-"}</p>
              </label>
            </div>

            <div className="ops-form-grid-3" style={{ marginTop: 10 }}>
              <label className="ops-form-label">
                생년월일
                <p style={{ marginTop: 4, color: "var(--ink)", fontSize: 13 }}>{data.user.birthDate ? formatDate(data.user.birthDate) : "-"}</p>
              </label>
              <label className="ops-form-label">
                성별
                <p style={{ marginTop: 4, color: "var(--ink)", fontSize: 13 }}>{data.user.gender ?? "-"}</p>
              </label>
              <label className="ops-form-label">
                가입일
                <p style={{ marginTop: 4, color: "var(--ink)", fontSize: 13 }}>{formatDateTime(data.user.createdAt)}</p>
              </label>
            </div>

            {data.user.partnerOrganization ? (
              <div className="ops-soft-card" style={{ marginTop: 12 }}>
                <p className="ops-form-label">파트너 소속</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: "4px 0 0" }}>{data.user.partnerOrganization.name}</p>
                <p className="ops-card-subtle" style={{ marginTop: 2 }}>{data.user.partnerOrganization.partnerType} · {data.user.partnerOrganization.industry}</p>
              </div>
            ) : null}

            <label className="ops-form-label" style={{ marginTop: 12, display: "block" }}>
              관리자 메모
              <textarea
                value={memoDraft}
                onChange={(e) => setMemoDraft(e.target.value)}
                rows={3}
                placeholder="이 사용자에 대한 내부 메모"
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
            <h3 className="ops-section-title">지원 내역 ({data.applications.length})</h3>
            {data.applications.length === 0 ? (
              <p className="ops-card-subtle" style={{ margin: 0 }}>지원한 포지션이 없습니다.</p>
            ) : (
              <article className="ops-table-card">
                <table>
                  <colgroup>
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "8%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>포지션</th>
                      <th>회사</th>
                      <th>상태</th>
                      <th>지원 시점</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.applications.map((a) => (
                      <tr key={a.id}>
                        <td className="ops-row-strong">{a.positionTitle}</td>
                        <td>{a.partnerOrganizationName ?? "-"}</td>
                        <td>
                          <span className={`ops-pill ${APP_STATUS_PILL[a.status]}`}>{APP_STATUS_KO[a.status]}</span>
                        </td>
                        <td className="ops-row-sub">{formatDateTime(a.submittedAt)}</td>
                        <td>
                          <Link href={`/dashboard/ops/operations/applications/${a.id}`} className="ops-btn">
                            상세
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            )}
          </article>

          {data.programs.length > 0 ? (
            <article className="ops-card">
              <h3 className="ops-section-title">프로그램 참여 ({data.programs.length})</h3>
              <article className="ops-table-card">
                <table>
                  <colgroup>
                    <col style={{ width: "50%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "10%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>포지션</th>
                      <th>기간</th>
                      <th>상태</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.programs.map((p) => (
                      <tr key={p.id}>
                        <td className="ops-row-strong">{p.positionTitle}</td>
                        <td>{formatDate(p.startsAt)} ~ {formatDate(p.endsAt)}</td>
                        <td>
                          <span className={`ops-pill ${PROGRAM_STATUS_PILL[p.status]}`}>
                            {p.status === "ACTIVE" ? "진행 중" : p.status === "COMPLETED" ? "완료" : "취소"}
                          </span>
                        </td>
                        <td>
                          <Link href={`/dashboard/ops/operations/programs/${p.id}`} className="ops-btn">
                            상세
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            </article>
          ) : null}

          {(data.reportedIssues.length > 0 || data.subjectIssues.length > 0) ? (
            <article className="ops-card">
              <h3 className="ops-section-title">이슈 ({data.reportedIssues.length + data.subjectIssues.length})</h3>
              <div className="ops-stack">
                {[...data.reportedIssues.map((i) => ({ ...i, side: "신고자" as const })),
                  ...data.subjectIssues.map((i) => ({ ...i, side: "대상" as const }))].map((i) => (
                  <div key={`${i.side}-${i.id}`} className="ops-soft-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div>
                        <div className="ops-tag-row" style={{ marginBottom: 6 }}>
                          <span className="ops-pill ops-pill-gray">{i.side}</span>
                          <span className="ops-pill ops-pill-gray">{ISSUE_TYPE_KO[i.type] ?? i.type}</span>
                          <span className={`ops-pill ${ISSUE_STATUS_PILL[i.status]}`}>{i.status}</span>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: 0 }}>{i.title}</p>
                        <p className="ops-card-subtle" style={{ marginTop: 4 }}>{formatDateTime(i.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {error ? <div className="ops-error-card">{error}</div> : null}
        </>
      )}
    </section>
  );
}
