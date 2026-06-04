"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const TOKEN_COOKIE_KEY = "ops_admin_token";

type RevisionStatus = "PENDING" | "APPROVED" | "REJECTED";

type PositionItem = {
  id: string;
  createdAt: string;
  position: {
    id: string;
    title: string;
    status: "DRAFT" | "PENDING_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "REJECTED";
  };
  partnerOrganization: { id: string; name: string } | null;
  status: RevisionStatus;
  reviewNote?: string | null;
};

function readCookie(key: string) {
  if (typeof document === "undefined") return "";
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${key}=`));
  if (entry) return decodeURIComponent(entry.split("=")[1] ?? ""); try { return window.localStorage.getItem("platform_access_token") || ""; } catch { return ""; }
}

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  return d.toLocaleDateString("ko-KR");
}

const STATUS_LABEL: Record<RevisionStatus, string> = {
  PENDING: "검수 대기",
  APPROVED: "승인됨",
  REJECTED: "반려됨"
};

const STATUS_PILL: Record<RevisionStatus, string> = {
  PENDING: "ops-pill-amber",
  APPROVED: "ops-pill-green",
  REJECTED: "ops-pill-red"
};

export default function PositionRevisionManagementPage() {
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);

  const [items, setItems] = useState<PositionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"ALL" | RevisionStatus>("PENDING");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 40 | 100>(20);

  const reload = useCallback(async () => {
    const token = readCookie(TOKEN_COOKIE_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const response = await fetch(`${apiBaseUrl}/ops/position-revisions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        items?: PositionItem[];
        total?: number;
        message?: string;
      };
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? "요청 목록을 불러오지 못했습니다.");
      setItems(payload.items ?? []);
      setTotal(payload.total ?? 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, statusFilter, page, pageSize]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const pageButtons = useMemo(() => {
    const maxVisible = 7;
    const pages: number[] = [];
    const start = Math.max(1, page - 3);
    const end = Math.min(totalPages, start + maxVisible - 1);
    const normalizedStart = Math.max(1, end - maxVisible + 1);
    for (let i = normalizedStart; i <= end; i += 1) pages.push(i);
    return pages;
  }, [page, totalPages]);

  const review = async (id: string, action: "approve" | "reject") => {
    const token = readCookie(TOKEN_COOKIE_KEY);
    if (!token) return;
    if (action === "reject" && !window.confirm("이 수정 요청을 반려하시겠습니까?")) return;
    try {
      setActingId(id);
      const response = await fetch(`${apiBaseUrl}/ops/position-revisions/${encodeURIComponent(id)}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({})
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? "처리에 실패했습니다.");
      if (action === "approve") {
        window.alert("승인 완료: 수정사항이 반영되었습니다.");
      } else {
        window.alert("반려 완료: 파트너가 다시 제출해야 합니다.");
      }
      await reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "처리에 실패했습니다.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <section className="ops-content-section">
      <header>
        <h1>포지션 수정 관리</h1>
        <p>파트너의 포지션 수정 요청을 검토하고 승인/반려합니다.</p>
      </header>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>수정 요청 목록</h2>
        </div>

        <div className="ops-partner-filters ops-partner-filters--multi">
          <span className="ops-row-sub" style={{ flex: 1, fontSize: 12 }}>
            {statusFilter === "ALL"
              ? `전체 ${total.toLocaleString()}건`
              : `${STATUS_LABEL[statusFilter]} ${total.toLocaleString()}건`}
          </span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(1);
            }}
            aria-label="상태 필터"
          >
            <option value="ALL">전체 상태</option>
            <option value="PENDING">검수 대기</option>
            <option value="APPROVED">승인됨</option>
            <option value="REJECTED">반려됨</option>
          </select>
          <select
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(Number(e.target.value) as 20 | 40 | 100);
              setPage(1);
            }}
            aria-label="페이지 크기"
          >
            <option value="20">20개</option>
            <option value="40">40개</option>
            <option value="100">100개</option>
          </select>
          {statusFilter !== "PENDING" ? (
            <button
              type="button"
              className="ops-partner-filter-reset"
              onClick={() => {
                setStatusFilter("PENDING");
                setPage(1);
              }}
            >
              필터 초기화
            </button>
          ) : null}
        </div>

        {error ? <p className="ops-form-error">{error}</p> : null}

        <div className="ops-partner-table-wrap">
          <table className="ops-partner-table">
            <thead>
              <tr>
                <th>포지션명</th>
                <th>파트너사</th>
                <th>상태</th>
                <th>요청</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="ops-table-empty">목록을 불러오는 중입니다...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="ops-table-empty">조건에 맞는 수정 요청이 없습니다.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.position?.title ?? "-"}</td>
                    <td>{item.partnerOrganization?.name ?? "-"}</td>
                    <td>
                      <span className={`ops-pill ${STATUS_PILL[item.status]}`}>{STATUS_LABEL[item.status]}</span>
                    </td>
                    <td className="ops-row-sub">{formatRelativeTime(item.createdAt)}</td>
                    <td>
                      <div className="ops-table-actions" style={{ gap: 6 }}>
                        {item.status === "PENDING" ? (
                          <>
                            <button
                              type="button"
                              className="ops-action-danger"
                              onClick={() => void review(item.id, "reject")}
                              disabled={actingId === item.id}
                              style={{ minWidth: 64, height: 32, fontSize: 12 }}
                            >
                              반려
                            </button>
                            <button
                              type="button"
                              className="ops-action-save"
                              onClick={() => void review(item.id, "approve")}
                              disabled={actingId === item.id}
                              style={{ minWidth: 64, height: 32, fontSize: 12 }}
                            >
                              승인
                            </button>
                          </>
                        ) : (
                          <span className="ops-row-sub" style={{ fontSize: 12 }}>처리 완료</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="ops-pagination">
          <span>
            총 {total.toLocaleString()}개 · {page}/{totalPages} 페이지
          </span>
          <div className="ops-pagination-numbers">
            {pageButtons.map((num) => (
              <button
                key={num}
                type="button"
                className={num === page ? "is-active" : ""}
                onClick={() => setPage(num)}
              >
                {num}
              </button>
            ))}
          </div>
          <span />
        </div>
      </article>
    </section>
  );
}
