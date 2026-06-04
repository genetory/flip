"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";
import { IssueDetailModal, type IssueDetailIssue } from "../../../../../components/issues/IssueDetailModal";
import { downloadCsv, formatCsvDate } from "../../../../../lib/csv-export";

type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type IssueType = "NO_SHOW" | "BEHAVIOR" | "DROPOUT" | "ATTITUDE" | "PAYMENT" | "OTHER";

type Issue = {
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

export default function OpsIssuesPage() {
  const [items, setItems] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<IssueDetailIssue | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | IssueStatus>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 40 | 100>(20);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = readAccessToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const response = await fetch(`${apiBaseUrl}/ops/issues?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as {
        ok?: boolean;
        items?: Issue[];
        total?: number;
        totalPages?: number;
      };
      setItems(payload.items ?? []);
      setTotal(payload.total ?? 0);
      setTotalPages(payload.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "이슈 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(id: string, status: IssueStatus) {
    setUpdating(id);
    try {
      const token = readAccessToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBaseUrl}/ops/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                status,
                resolvedAt:
                  status === "RESOLVED" || status === "CLOSED" ? new Date().toISOString() : it.resolvedAt
              }
            : it
        )
      );
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "상태 변경 실패");
    } finally {
      setUpdating(null);
    }
  }

  const pageButtons = useMemo(() => {
    const maxVisible = 7;
    const pages: number[] = [];
    const start = Math.max(1, page - 3);
    const end = Math.min(totalPages, start + maxVisible - 1);
    const normalizedStart = Math.max(1, end - maxVisible + 1);
    for (let i = normalizedStart; i <= end; i += 1) pages.push(i);
    return pages;
  }, [page, totalPages]);

  return (
    <section className="ops-content-section">
      <header>
        <h1>이슈 리포트</h1>
        <p>파트너·학생이 제출한 이슈를 검토하고 케이스를 트래킹하세요.</p>
      </header>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>이슈 목록</h2>
          <button
            type="button"
            className="ops-detail-button"
            onClick={() => {
              downloadCsv(
                "issues",
                ["유형", "상태", "제목", "설명", "신고자", "신고자 역할", "대상", "담당자", "처리 메모", "생성", "처리"],
                items.map((it) => [
                  TYPE_LABEL[it.type],
                  STATUS_LABEL[it.status],
                  it.title,
                  it.description,
                  it.reporter.name ?? it.reporter.email,
                  it.reporter.role,
                  it.subject ? (it.subject.name ?? it.subject.email) : "",
                  it.assignedTo ? (it.assignedTo.name ?? it.assignedTo.email) : "",
                  it.resolutionNote ?? "",
                  formatCsvDate(it.createdAt),
                  formatCsvDate(it.resolvedAt)
                ])
              );
            }}
            disabled={items.length === 0}
          >
            CSV 내보내기
          </button>
        </div>

        <div className="ops-partner-filters ops-partner-filters--multi">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="제목 / 설명 검색"
            className="ops-partner-filter-search"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(1);
            }}
            aria-label="상태 필터"
          >
            <option value="ALL">전체 상태</option>
            <option value="OPEN">신규</option>
            <option value="IN_PROGRESS">처리 중</option>
            <option value="RESOLVED">해결</option>
            <option value="CLOSED">종료</option>
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
          {statusFilter !== "ALL" || search ? (
            <button
              type="button"
              className="ops-partner-filter-reset"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
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
                <th>유형</th>
                <th>제목</th>
                <th>신고자</th>
                <th>대상</th>
                <th>상태</th>
                <th>생성</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="ops-table-empty">목록을 불러오는 중입니다...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="ops-table-empty">조건에 맞는 이슈가 없습니다.</td></tr>
              ) : (
                items.map((it) => {
                  const isUpdating = updating === it.id;
                  return (
                    <tr key={it.id}>
                      <td>{TYPE_LABEL[it.type]}</td>
                      <td>{it.title}</td>
                      <td>
                        <div className="ops-row-strong">{it.reporter.name ?? it.reporter.email}</div>
                        <div className="ops-row-sub" style={{ fontSize: 11 }}>{it.reporter.role}</div>
                      </td>
                      <td>{it.subject ? (it.subject.name ?? it.subject.email) : "-"}</td>
                      <td>
                        <span className={`ops-pill ${STATUS_PILL[it.status]}`}>{STATUS_LABEL[it.status]}</span>
                      </td>
                      <td className="ops-row-sub">{formatRelativeTime(it.createdAt)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="ops-table-actions" style={{ gap: 6 }}>
                          <select
                            value={it.status}
                            disabled={isUpdating}
                            onChange={(e) => void updateStatus(it.id, e.target.value as IssueStatus)}
                            className="ops-select ops-select-inline"
                            style={{ height: 32, minWidth: 110, fontSize: 12 }}
                          >
                            {(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as IssueStatus[]).map((s) => (
                              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="ops-detail-button"
                            onClick={() => setDetailTarget(it as IssueDetailIssue)}
                            style={{ height: 32, fontSize: 12 }}
                          >
                            상세
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      <IssueDetailModal
        open={detailTarget !== null}
        issue={detailTarget}
        onClose={() => setDetailTarget(null)}
        onUpdated={() => void load()}
      />
    </section>
  );
}
