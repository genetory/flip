"use client";

import { useEffect, useMemo, useState } from "react";

const TOKEN_COOKIE_KEY = "partner_admin_token";

type ApplicantStatus =
  | "APPLIED"
  | "REVIEWING"
  | "INTERVIEW"
  | "OFFERED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "COMPLETED";

type SortField = "name" | "positionTitle" | "status" | "appliedAt";
type SortOrder = "asc" | "desc";

type PartnerApplicant = {
  id: string;
  name: string;
  email: string;
  positionTitle: string;
  school: string | null;
  major: string | null;
  status: ApplicantStatus;
  appliedAt: string | null;
};

function readCookie(key: string) {
  if (typeof document === "undefined") return "";
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${key}=`));
  return entry ? decodeURIComponent(entry.split("=")[1] ?? "") : "";
}

function statusBadgeTone(status: ApplicantStatus) {
  if (status === "ACCEPTED" || status === "OFFERED" || status === "COMPLETED") return "ops-status-approved";
  if (status === "REJECTED" || status === "WITHDRAWN") return "ops-status-rejected";
  if (status === "INTERVIEW" || status === "REVIEWING") return "ops-role-admin";
  return "ops-status-pending";
}

function statusLabel(status: ApplicantStatus) {
  if (status === "APPLIED") return "지원 접수";
  if (status === "REVIEWING") return "검토 중";
  if (status === "INTERVIEW") return "인터뷰";
  if (status === "OFFERED") return "오퍼";
  if (status === "ACCEPTED") return "합격";
  if (status === "REJECTED") return "불합격";
  if (status === "WITHDRAWN") return "지원 철회";
  return "완료";
}

function compare(a: string, b: string, order: SortOrder) {
  const direction = order === "asc" ? 1 : -1;
  return a.localeCompare(b, "ko") * direction;
}

export default function PartnerApplicantsPage() {
  const [items, setItems] = useState<PartnerApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ApplicantStatus>("ALL");
  const [sortField, setSortField] = useState<SortField>("appliedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".ops-status-menu-wrap")) return;
      setOpenStatusMenuId(null);
    };
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  useEffect(() => {
    const token = readCookie(TOKEN_COOKIE_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    void (async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiBaseUrl}/partner/applicants`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store"
        });
        if (!response.ok) throw new Error("지원자 목록을 불러오지 못했습니다.");
        const payload = (await response.json()) as { ok: boolean; items: PartnerApplicant[] };
        if (!payload.ok) throw new Error("지원자 목록을 불러오지 못했습니다.");
        setItems(payload.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "지원자 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let next = [...items];
    if (statusFilter !== "ALL") next = next.filter((item) => item.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      next = next.filter((item) => {
        return item.name.toLowerCase().includes(q)
          || item.email.toLowerCase().includes(q)
          || item.positionTitle.toLowerCase().includes(q);
      });
    }

    next.sort((a, b) => {
      if (sortField === "name") return compare(a.name, b.name, sortOrder);
      if (sortField === "positionTitle") return compare(a.positionTitle, b.positionTitle, sortOrder);
      if (sortField === "status") return compare(a.status, b.status, sortOrder);
      const aTime = a.appliedAt ? new Date(a.appliedAt).getTime() : 0;
      const bTime = b.appliedAt ? new Date(b.appliedAt).getTime() : 0;
      return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    });

    return next;
  }, [items, search, sortField, sortOrder, statusFilter]);

  const setSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortOrder(field === "appliedAt" ? "desc" : "asc");
  };

  const updateStatus = async (id: string, status: ApplicantStatus) => {
    const token = readCookie(TOKEN_COOKIE_KEY);
    if (!token) return;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    setOpenStatusMenuId(null);

    const response = await fetch(`${apiBaseUrl}/partner/applicants/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const reload = await fetch(`${apiBaseUrl}/partner/applicants`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (reload.ok) {
        const payload = (await reload.json()) as { ok: boolean; items: PartnerApplicant[] };
        if (payload.ok) setItems(payload.items);
      }
      window.alert("상태 변경에 실패했습니다.");
    }
  };

  return (
    <section className="ops-content-section">
      <header>
        <h1>지원자 관리</h1>
        <p>내 포지션에 지원한 후보자의 상태를 확인합니다.</p>
      </header>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>지원자 목록</h2>
        </div>

        <div className="ops-partner-filters ops-position-filters">
          <input
            className="ops-partner-filter-search"
            placeholder="이름/이메일/포지션 검색"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="ops-position-filter-right">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "ALL" | ApplicantStatus)}>
              <option value="ALL">전체 상태</option>
              <option value="APPLIED">지원 접수</option>
              <option value="REVIEWING">검토 중</option>
              <option value="INTERVIEW">인터뷰</option>
              <option value="OFFERED">오퍼</option>
              <option value="ACCEPTED">합격</option>
              <option value="REJECTED">불합격</option>
              <option value="WITHDRAWN">지원 철회</option>
              <option value="COMPLETED">완료</option>
            </select>
          </div>
        </div>

        <div className="ops-partner-table-wrap">
          <table className="ops-partner-table ops-candidate-list-table">
            <thead>
              <tr>
                <th>
                  <button type="button" className="ops-th-sort" onClick={() => setSort("name")}>
                    이름
                  </button>
                </th>
                <th>이메일</th>
                <th>
                  <button type="button" className="ops-th-sort" onClick={() => setSort("positionTitle")}>
                    지원 포지션
                  </button>
                </th>
                <th>학력/전공</th>
                <th>
                  <button type="button" className="ops-th-sort" onClick={() => setSort("status")}>
                    상태
                  </button>
                </th>
                <th>
                  <button type="button" className="ops-th-sort" onClick={() => setSort("appliedAt")}>
                    지원일
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="ops-table-empty">불러오는 중...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="ops-table-empty">{error}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="ops-table-empty">지원자가 없습니다.</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td><span className="ops-cell-clamp-3">{item.positionTitle}</span></td>
                    <td>{item.school ? `${item.school}${item.major ? ` / ${item.major}` : ""}` : "-"}</td>
                    <td>
                      <div className="ops-status-menu-wrap">
                        <button
                          type="button"
                          className={`ops-status-badge ${statusBadgeTone(item.status)} is-clickable`}
                          onClick={() => setOpenStatusMenuId((prev) => (prev === item.id ? null : item.id))}
                        >
                          {statusLabel(item.status)}
                        </button>
                        {openStatusMenuId === item.id ? (
                          <div className="ops-status-toggle-menu">
                            {([
                              "APPLIED",
                              "REVIEWING",
                              "INTERVIEW",
                              "OFFERED",
                              "ACCEPTED",
                              "REJECTED",
                              "WITHDRAWN",
                              "COMPLETED"
                            ] as ApplicantStatus[]).map((status) => (
                              <button
                                key={status}
                                type="button"
                                className={
                                  `${status === "REJECTED" || status === "WITHDRAWN" ? "reject" : status === "APPLIED" || status === "REVIEWING" ? "pending" : "approve"}`
                                  + `${item.status === status ? " is-active" : ""}`
                                }
                                onClick={() => void updateStatus(item.id, status)}
                              >
                                {statusLabel(status)}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td>{item.appliedAt ? new Date(item.appliedAt).toLocaleDateString("ko-KR") : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
