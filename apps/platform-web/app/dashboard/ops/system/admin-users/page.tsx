"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";
import { downloadCsv, formatCsvDate } from "../../../../../lib/csv-export";

type AdminUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  phoneNumber: string | null;
  adminMemo: string | null;
  role: "STUDENT" | "PARTNER" | "OPERATOR";
  partnerType: string | null;
  partnerOrgRole: string | null;
  createdAt: string;
  partnerName: string | null;
};

type RoleKey = AdminUser["role"];

const ROLE_LABEL: Record<RoleKey, string> = {
  STUDENT: "학생",
  PARTNER: "파트너",
  OPERATOR: "운영자"
};

const ROLE_PILL: Record<RoleKey, string> = {
  STUDENT: "ops-pill-blue",
  PARTNER: "ops-pill-violet",
  OPERATOR: "ops-pill-amber"
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR");
}

export default function AdminUsersPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleKey | "ALL">("ALL");
  const [memoDraft, setMemoDraft] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  async function load(opts: { search?: string } = {}) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ pageSize: "100" });
      if (opts.search) params.set("search", opts.search);
      const response = await fetch(`${apiBase()}/ops/users?${params.toString()}`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { items?: AdminUser[] };
      setItems(payload.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "사용자 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void load({ search }), 300);
    return () => clearTimeout(id);
  }, [search]);

  async function changeRole(userId: string, role: RoleKey) {
    setUpdating(userId);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/ops/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ role })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setItems((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "역할 변경 실패");
    } finally {
      setUpdating(null);
    }
  }

  async function saveMemo(userId: string) {
    const memo = memoDraft[userId] ?? "";
    setUpdating(userId);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/ops/users/${userId}/admin-memo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ adminMemo: memo })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setItems((prev) => prev.map((u) => (u.id === userId ? { ...u, adminMemo: memo } : u)));
      setMemoDraft((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "메모 저장 실패");
    } finally {
      setUpdating(null);
    }
  }

  const counts = useMemo(() => {
    const result = { ALL: items.length, STUDENT: 0, PARTNER: 0, OPERATOR: 0 };
    for (const it of items) result[it.role] += 1;
    return result;
  }, [items]);

  const filtered = useMemo(
    () => (roleFilter === "ALL" ? items : items.filter((u) => u.role === roleFilter)),
    [items, roleFilter]
  );

  return (
    <section className="ops-content-section">
      <header>
        <h1>전체 사용자 관리</h1>
        <p>플랫폼의 모든 사용자(학생/파트너/운영자)를 검색하고 역할·관리자 메모를 편집할 수 있어요.</p>
      </header>

      <article className="ops-card">
        <div className="ops-card-header">
          <div className="ops-filter-chip-row">
            {(["ALL", "STUDENT", "PARTNER", "OPERATOR"] as const).map((key) => {
              const active = roleFilter === key;
              const label = key === "ALL" ? "전체" : ROLE_LABEL[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRoleFilter(key)}
                  className={`ops-filter-chip ${active ? "is-active" : ""}`}
                >
                  {label} <span className="ops-filter-chip-count">{counts[key]}</span>
                </button>
              );
            })}
          </div>
          <div className="ops-row">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름/이메일 검색"
              className="ops-input"
              style={{ width: 240 }}
            />
            <button
              type="button"
              className="ops-btn"
              onClick={() => {
                downloadCsv(
                  "users",
                  ["이름", "이메일", "역할", "전화번호", "소속", "메모", "이메일 인증", "가입일"],
                  filtered.map((u) => [
                    u.name ?? "",
                    u.email,
                    ROLE_LABEL[u.role],
                    u.phoneNumber ?? "",
                    u.partnerName ?? "",
                    u.adminMemo ?? "",
                    u.emailVerified ? "Y" : "N",
                    formatCsvDate(u.createdAt)
                  ])
                );
              }}
              disabled={filtered.length === 0}
            >
              CSV 내보내기
            </button>
          </div>
        </div>
      </article>

      {loading ? (
        <div className="ops-empty-card">사용자 목록을 불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="ops-empty-card">해당 사용자가 없습니다.</div>
      ) : (
        <article className="ops-table-card">
          <table>
            <colgroup>
              <col style={{ width: "14%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>역할</th>
                <th>소속</th>
                <th>가입일</th>
                <th>관리자 메모</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isUpdating = updating === u.id;
                const memoOpen = u.id in memoDraft;
                return (
                  <tr key={u.id}>
                    <td>
                      <Link href={`/dashboard/ops/system/admin-users/${u.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <div className="ops-row-strong">{u.name ?? "-"}</div>
                        <div className="ops-row-sub">{u.phoneNumber ?? ""}</div>
                      </Link>
                    </td>
                    <td>
                      <div>{u.email}</div>
                      {!u.emailVerified ? <div className="ops-row-sub">미인증</div> : null}
                    </td>
                    <td>
                      <div className="ops-table-actions">
                        <span className={`ops-pill ${ROLE_PILL[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                        <select
                          value={u.role}
                          disabled={isUpdating}
                          onChange={(e) => void changeRole(u.id, e.target.value as RoleKey)}
                          className="ops-select ops-select-inline"
                          style={{ minWidth: 100 }}
                        >
                          <option value="STUDENT">학생</option>
                          <option value="PARTNER">파트너</option>
                          <option value="OPERATOR">운영자</option>
                        </select>
                      </div>
                    </td>
                    <td>{u.partnerName ?? "-"}</td>
                    <td className="ops-row-sub">{formatDate(u.createdAt)}</td>
                    <td style={{ minWidth: 240 }}>
                      {memoOpen ? (
                        <div className="ops-row" style={{ flexWrap: "nowrap" }}>
                          <input
                            type="text"
                            value={memoDraft[u.id]}
                            onChange={(e) => setMemoDraft((prev) => ({ ...prev, [u.id]: e.target.value }))}
                            className="ops-input"
                            style={{ flex: 1, height: 28, padding: "0 8px" }}
                          />
                          <button type="button" onClick={() => void saveMemo(u.id)} disabled={isUpdating} className="ops-btn ops-btn-primary">
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setMemoDraft((prev) => {
                                const next = { ...prev };
                                delete next[u.id];
                                return next;
                              })
                            }
                            className="ops-btn"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setMemoDraft((prev) => ({ ...prev, [u.id]: u.adminMemo ?? "" }))}
                          className="ops-btn"
                          style={{ textAlign: "left", justifyContent: "flex-start", maxWidth: 260, whiteSpace: "normal", height: "auto", padding: "6px 10px" }}
                        >
                          {u.adminMemo ? u.adminMemo : "메모 추가"}
                        </button>
                      )}
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
