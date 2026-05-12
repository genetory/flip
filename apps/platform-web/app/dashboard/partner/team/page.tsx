"use client";

import { useEffect, useState } from "react";
import { readAccessToken } from "../../../../lib/auth-client";

type Member = {
  id: string;
  name: string | null;
  email: string;
  phoneNumber: string | null;
  jobTitle: string | null;
  partnerOrgRole: string | null;
  emailVerified: boolean;
  createdAt: string;
};

type JoinCode = {
  code: string;
  expiresAt: string;
};

const ROLE_PILL: Record<string, string> = {
  OWNER: "ops-pill-violet",
  ADMIN: "ops-pill-blue",
  MEMBER: "ops-pill-gray"
};

const ROLE_LABEL: Record<string, string> = {
  OWNER: "오너",
  ADMIN: "관리자",
  MEMBER: "멤버"
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export default function PartnerTeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<JoinCode | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myOrgRole, setMyOrgRole] = useState<"OWNER" | "ADMIN" | "MEMBER" | null>(null);
  const canManage = myOrgRole === "OWNER" || myOrgRole === "ADMIN";

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/partner/team`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) {
        if (response.status === 403) throw new Error("회사 정보를 먼저 등록해야 팀을 볼 수 있습니다.");
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as { items?: Member[]; myUserId?: string; myOrgRole?: "OWNER" | "ADMIN" | "MEMBER" | null };
      setMembers(payload.items ?? []);
      setMyUserId(payload.myUserId ?? null);
      setMyOrgRole(payload.myOrgRole ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "팀 멤버를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function changeRole(memberId: string, role: "OWNER" | "ADMIN" | "MEMBER") {
    setUpdating(memberId);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/partner/team/${memberId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ partnerOrgRole: role })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, partnerOrgRole: role } : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "권한 변경 실패");
    } finally {
      setUpdating(null);
    }
  }

  async function removeMember(memberId: string) {
    if (!window.confirm("이 멤버를 팀에서 제외하시겠습니까?")) return;
    setUpdating(memberId);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/partner/team/${memberId}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "제외 실패");
    } finally {
      setUpdating(null);
    }
  }

  async function generateInviteCode() {
    setGeneratingCode(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/members/me/partner-organization/join-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { item?: JoinCode };
      if (payload.item) setJoinCode(payload.item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "초대 코드 생성 실패");
    } finally {
      setGeneratingCode(false);
    }
  }

  return (
    <section className="ops-content-section">
      <header>
        <h1>팀 멤버</h1>
        <p>회사에 소속된 멤버를 관리하고 새 멤버를 초대하세요.</p>
      </header>

      {canManage ? (
        <article className="ops-card">
          <div className="ops-card-header">
            <h2>새 멤버 초대</h2>
            <button type="button" onClick={() => void generateInviteCode()} disabled={generatingCode} className="ops-btn ops-btn-primary">
              {generatingCode ? "생성 중..." : "초대 코드 발급"}
            </button>
          </div>
          {joinCode ? (
            <div className="ops-soft-card" style={{ marginTop: 12 }}>
              <p className="ops-form-label">초대 코드</p>
              <p style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 20, fontWeight: 700, color: "#111827", margin: "4px 0 0" }}>
                {joinCode.code}
              </p>
              <p className="ops-card-subtle" style={{ marginTop: 4 }}>
                만료: {formatDateTime(joinCode.expiresAt)} · 새 사용자가 회원가입 시 이 코드를 입력하면 회사에 자동 합류됩니다.
              </p>
            </div>
          ) : (
            <p className="ops-card-subtle" style={{ marginTop: 12 }}>
              초대 코드를 발급하면 새 사용자가 회사에 합류할 수 있어요.
            </p>
          )}
        </article>
      ) : myOrgRole ? (
        <article className="ops-card">
          <p className="ops-card-subtle" style={{ margin: 0 }}>
            팀 멤버 추가 / 권한 변경 / 제외는 OWNER 또는 ADMIN 권한이 있어야 가능합니다. 현재 권한: <strong>{ROLE_LABEL[myOrgRole] ?? myOrgRole}</strong>
          </p>
        </article>
      ) : null}

      {loading ? (
        <div className="ops-empty-card">불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : members.length === 0 ? (
        <div className="ops-empty-card">아직 등록된 팀 멤버가 없습니다.</div>
      ) : (
        <article className="ops-table-card">
          <table>
            <colgroup>
              <col style={{ width: "16%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>직책</th>
                <th>권한</th>
                <th>인증</th>
                <th>가입일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isUpdating = updating === m.id;
                const isMe = myUserId === m.id;
                return (
                  <tr key={m.id}>
                    <td>
                      <div className="ops-row-strong">
                        {m.name ?? "-"}
                        {isMe ? <span className="ops-pill ops-pill-blue" style={{ marginLeft: 6 }}>나</span> : null}
                      </div>
                      <div className="ops-row-sub">{m.phoneNumber ?? ""}</div>
                    </td>
                    <td>{m.email}</td>
                    <td>{m.jobTitle ?? "-"}</td>
                    <td>
                      {canManage ? (
                        <select
                          value={m.partnerOrgRole ?? "MEMBER"}
                          disabled={isUpdating || (isMe && m.partnerOrgRole === "OWNER")}
                          onChange={(e) => void changeRole(m.id, e.target.value as "OWNER" | "ADMIN" | "MEMBER")}
                          className="ops-select ops-select-inline"
                          style={{ minWidth: 100 }}
                        >
                          <option value="OWNER">오너</option>
                          <option value="ADMIN">관리자</option>
                          <option value="MEMBER">멤버</option>
                        </select>
                      ) : (
                        <span className={`ops-pill ${ROLE_PILL[m.partnerOrgRole ?? "MEMBER"] ?? "ops-pill-gray"}`}>
                          {ROLE_LABEL[m.partnerOrgRole ?? "MEMBER"] ?? m.partnerOrgRole ?? "MEMBER"}
                        </span>
                      )}
                    </td>
                    <td>
                      {m.emailVerified ? (
                        <span className="ops-pill ops-pill-green">완료</span>
                      ) : (
                        <span className="ops-pill ops-pill-amber">미인증</span>
                      )}
                    </td>
                    <td className="ops-row-sub">{formatDateTime(m.createdAt)}</td>
                    <td>
                      {canManage && !isMe ? (
                        <button
                          type="button"
                          onClick={() => void removeMember(m.id)}
                          disabled={isUpdating}
                          className="ops-btn ops-btn-danger"
                        >
                          제외
                        </button>
                      ) : null}
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
