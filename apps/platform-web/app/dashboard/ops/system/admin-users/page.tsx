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

type VerifiedFilter = "ALL" | "VERIFIED" | "UNVERIFIED";

const VERIFIED_LABEL: Record<VerifiedFilter, string> = {
  ALL: "전체",
  VERIFIED: "이메일 인증",
  UNVERIFIED: "이메일 미인증"
};

export default function AdminUsersPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleKey | "ALL">("ALL");
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>("ALL");
  const [memoDraft, setMemoDraft] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<string | null>(null);
  // Pagination — 30 per page, server-side via `page` query param.
  const PAGE_SIZE = 30;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  async function load(opts: { search?: string; emailVerified?: VerifiedFilter; page?: number } = {}) {
    setLoading(true);
    setError(null);
    try {
      const targetPage = opts.page ?? 1;
      const params = new URLSearchParams({ pageSize: String(PAGE_SIZE), page: String(targetPage) });
      if (opts.search) params.set("search", opts.search);
      // Server-side verification filter — only sends the param when narrowed;
      // ALL sends nothing so verified + unverified both come back.
      if (opts.emailVerified === "VERIFIED") params.set("emailVerified", "true");
      else if (opts.emailVerified === "UNVERIFIED") params.set("emailVerified", "false");
      const response = await fetch(`${apiBase()}/ops/users?${params.toString()}`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as {
        items?: AdminUser[];
        total?: number;
        totalPages?: number;
        page?: number;
      };
      setItems(payload.items ?? []);
      setTotal(payload.total ?? 0);
      setTotalPages(Math.max(1, payload.totalPages ?? 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "사용자 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // Initial fetch only — subsequent loads are driven by the filter/page effect
  // below to avoid double-fetching on mount.
  useEffect(() => {
    void load({ emailVerified: verifiedFilter, page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when search, verification filter, or page changes. Debounced for
  // search so each keystroke doesn't hit the API.
  useEffect(() => {
    const id = setTimeout(() => void load({ search, emailVerified: verifiedFilter, page }), 300);
    return () => clearTimeout(id);
  }, [search, verifiedFilter, page]);

  // Any filter/search change resets back to page 1 so the user doesn't land
  // on a page that no longer exists under the new filter.
  useEffect(() => {
    setPage(1);
  }, [search, verifiedFilter]);

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

  // Email-verification counts reflect what came back AFTER the server-side
  // verified filter, so they sum to the visible list. With ALL selected they
  // give a quick verified/unverified breakdown of the page.
  const verifiedCounts = useMemo(() => {
    let verified = 0;
    let unverified = 0;
    for (const it of items) {
      if (it.emailVerified) verified += 1;
      else unverified += 1;
    }
    return { ALL: items.length, VERIFIED: verified, UNVERIFIED: unverified };
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
          <div className="ops-filter-chip-row" style={{ marginTop: 8 }}>
            {(["ALL", "VERIFIED", "UNVERIFIED"] as const).map((key) => {
              const active = verifiedFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setVerifiedFilter(key)}
                  className={`ops-filter-chip ${active ? "is-active" : ""}`}
                >
                  {VERIFIED_LABEL[key]} <span className="ops-filter-chip-count">{verifiedCounts[key]}</span>
                </button>
              );
            })}
          </div>
          <div className="ops-row">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름·이메일 검색 (예: gmail.com)"
              className="ops-input"
              style={{ width: 260 }}
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
              CSV 내보내기 (현재 페이지)
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

      {!loading && !error && total > 0 ? (
        <div
          className="ops-row"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 12,
            flexWrap: "wrap"
          }}
        >
          <span className="ops-row-sub">
            총 <strong style={{ color: "var(--foreground, #111)" }}>{total.toLocaleString("ko-KR")}</strong>명
            {" · "}
            {((page - 1) * PAGE_SIZE + 1).toLocaleString("ko-KR")}–
            {Math.min(page * PAGE_SIZE, total).toLocaleString("ko-KR")}
          </span>
          <div className="ops-row" style={{ gap: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              className="ops-btn"
              onClick={() => setPage(1)}
              disabled={page <= 1}
            >
              « 처음
            </button>
            <button
              type="button"
              className="ops-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ‹ 이전
            </button>
            <span className="ops-row-sub" style={{ padding: "0 8px" }}>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="ops-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              다음 ›
            </button>
            <button
              type="button"
              className="ops-btn"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
            >
              마지막 »
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
