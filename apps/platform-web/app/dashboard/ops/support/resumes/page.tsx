"use client";

import { ArrowDown, ArrowUp, ArrowsDownUp, Star, X } from "@phosphor-icons/react";
import { MouseEvent, SyntheticEvent, useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Ops console — all resumes list.
// Same UX pattern as /dashboard/ops/support/users: ops-partner-list-card +
// search/filter row + ops-partner-table + ops-pagination + a detail modal.
// Resume content is rendered as pretty-printed JSON in the modal so ops can
// audit the structured body without leaving the page.
// ---------------------------------------------------------------------------

const TOKEN_COOKIE_KEY = "ops_admin_token";

type SortField = "createdAt" | "updatedAt" | "title";
type SortOrder = "asc" | "desc";
type AuthProvider = "EMAIL" | "NAVER" | "KAKAO" | "GOOGLE";

type ResumeUser = {
  id: string;
  email: string;
  name: string | null;
  role: "STUDENT" | "PARTNER" | "OPERATOR";
  phoneNumber: string | null;
  authProvider: AuthProvider | null;
  createdAt: string;
};

type ResumeItem = {
  id: string;
  title: string;
  isPrimary: boolean;
  completionRate: number;
  shareSlug: string;
  createdAt: string;
  updatedAt: string;
  user: ResumeUser | null;
};

type ResumeDetail = ResumeItem & {
  content: unknown; // JSON blob — shape can evolve, so render generically.
};

function readCookie(key: string) {
  if (typeof document === "undefined") return "";
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${key}=`));
  if (entry) return decodeURIComponent(entry.split("=")[1] ?? "");
  try { return window.localStorage.getItem("platform_access_token") || ""; } catch { return ""; }
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR");
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR");
}

function authProviderLabel(provider: AuthProvider | null | undefined) {
  if (provider === "NAVER") return "네이버";
  if (provider === "KAKAO") return "카카오";
  if (provider === "GOOGLE") return "구글";
  if (provider === "EMAIL") return "이메일";
  return "-";
}

function roleLabel(role: ResumeUser["role"] | null | undefined) {
  if (role === "OPERATOR") return "운영자";
  if (role === "PARTNER") return "파트너";
  if (role === "STUDENT") return "일반회원";
  return "-";
}

export default function OpsResumesPage() {
  const detailDialogRef = useRef<HTMLDialogElement>(null);
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const [items, setItems] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listErrorMessage, setListErrorMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 40 | 100>(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isPrimaryFilter, setIsPrimaryFilter] = useState<"ALL" | "PRIMARY" | "SECONDARY">("ALL");

  // Detail modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<ResumeDetail | null>(null);

  const pageButtons = useMemo(() => {
    const maxVisible = 7;
    const pages: number[] = [];
    const start = Math.max(1, page - 3);
    const end = Math.min(totalPages, start + maxVisible - 1);
    const normalizedStart = Math.max(1, end - maxVisible + 1);
    for (let i = normalizedStart; i <= end; i += 1) pages.push(i);
    return pages;
  }, [page, totalPages]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortOrder(field === "title" ? "asc" : "desc");
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowsDownUp size={13} weight="bold" aria-hidden />;
    if (sortOrder === "asc") return <ArrowUp size={13} weight="bold" aria-hidden />;
    return <ArrowDown size={13} weight="bold" aria-hidden />;
  }

  async function fetchResumes() {
    setLoading(true);
    setListErrorMessage(null);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (isPrimaryFilter !== "ALL") {
        params.set("isPrimary", isPrimaryFilter === "PRIMARY" ? "true" : "false");
      }
      params.set("sortBy", sortField);
      params.set("sortOrder", sortOrder);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const response = await fetch(`${apiBaseUrl}/ops/resumes?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        items?: ResumeItem[];
        page?: number;
        pageSize?: number;
        total?: number;
        totalPages?: number;
        message?: string;
      };
      if (!response.ok || !payload.ok) {
        setListErrorMessage(payload.message ?? "이력서 목록을 불러오지 못했습니다.");
        return;
      }
      setItems(payload.items ?? []);
      setTotal(payload.total ?? 0);
      setTotalPages(payload.totalPages ?? 1);
    } catch {
      setListErrorMessage("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    void fetchResumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, sortField, sortOrder, page, pageSize, isPrimaryFilter]);

  // Detail dialog sync.
  useEffect(() => {
    const dialog = detailDialogRef.current;
    if (!dialog) return;
    if (isDetailModalOpen) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (dialog.open) dialog.close();
  }, [isDetailModalOpen]);

  async function openDetail(resumeId: string) {
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/resumes/${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as { ok?: boolean; resume?: ResumeDetail; message?: string };
      if (!response.ok || !payload.ok || !payload.resume) {
        setListErrorMessage(payload.message ?? "이력서 상세를 불러오지 못했습니다.");
        setIsDetailModalOpen(false);
        return;
      }
      setDetail(payload.resume);
    } catch {
      setListErrorMessage("서버 연결에 실패했습니다.");
      setIsDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  function requestCloseDetailModal() {
    setIsDetailModalOpen(false);
    setDetail(null);
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === detailDialogRef.current) requestCloseDetailModal();
  }

  function handleDialogCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    requestCloseDetailModal();
  }

  return (
    <section className="ops-content-section">
      <header>
        <h1>이력서 관리</h1>
        <p>전체 사용자가 작성한 이력서를 검색·정렬·페이징으로 조회합니다.</p>
      </header>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>이력서 목록</h2>
        </div>

        <div className="ops-partner-filters ops-partner-filters--multi">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="이력서 제목, 작성자 이름·이메일 검색"
            className="ops-partner-filter-search"
          />
          <select
            value={isPrimaryFilter}
            onChange={(e) => {
              setIsPrimaryFilter(e.target.value as typeof isPrimaryFilter);
              setPage(1);
            }}
            aria-label="대표 이력서 필터"
          >
            <option value="ALL">대표/일반 전체</option>
            <option value="PRIMARY">대표 이력서</option>
            <option value="SECONDARY">일반 이력서</option>
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
          {isPrimaryFilter !== "ALL" || search ? (
            <button
              type="button"
              className="ops-partner-filter-reset"
              onClick={() => {
                setSearch("");
                setIsPrimaryFilter("ALL");
                setPage(1);
              }}
            >
              필터 초기화
            </button>
          ) : null}
        </div>

        {listErrorMessage ? <p className="ops-form-error">{listErrorMessage}</p> : null}

        <div className="ops-partner-table-wrap">
          <table className="ops-partner-table">
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    className={`ops-th-sort ${sortField === "title" ? "is-active" : ""}`}
                    onClick={() => toggleSort("title")}
                  >
                    <span>이력서 제목</span>
                    <SortIcon field="title" />
                  </button>
                </th>
                <th>작성자</th>
                <th>이메일</th>
                <th>완성률</th>
                <th>대표</th>
                <th>
                  <button
                    type="button"
                    className={`ops-th-sort ${sortField === "createdAt" ? "is-active" : ""}`}
                    onClick={() => toggleSort("createdAt")}
                  >
                    <span>작성일</span>
                    <SortIcon field="createdAt" />
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className={`ops-th-sort ${sortField === "updatedAt" ? "is-active" : ""}`}
                    onClick={() => toggleSort("updatedAt")}
                  >
                    <span>수정일</span>
                    <SortIcon field="updatedAt" />
                  </button>
                </th>
                <th>이력서 링크</th>
                <th>상세정보</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="ops-table-empty">목록을 불러오는 중입니다...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="ops-table-empty">조건에 맞는 이력서가 없습니다.</td>
                </tr>
              ) : (
                items.map((item) => {
                  const pct = item.completionRate ?? 0;
                  const barColor = pct >= 80 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#ef4444";
                  return (
                  <tr
                    key={item.id}
                    className="ops-clickable-row"
                    onClick={() => void openDetail(item.id)}
                  >
                    <td>{item.title || "(제목 없음)"}</td>
                    <td>{item.user?.name || "-"}</td>
                    <td>{item.user?.email || "-"}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 110 }}>
                        <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: barColor,
                              borderRadius: 999,
                              transition: "width 200ms ease"
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color: barColor, fontWeight: 600 }}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {item.isPrimary ? (
                        <span
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#f59e0b", fontWeight: 600 }}
                          aria-label="대표 이력서"
                        >
                          <Star size={14} weight="fill" />
                          <span>대표</span>
                        </span>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>-</span>
                      )}
                    </td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>{formatDate(item.updatedAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {item.shareSlug ? (
                        // 앵커는 기본 display 가 inline 이라 ops-detail-button 의 height 가
                        // 안 잡힘 — inline-flex + center 로 \"상세정보\" 버튼과 같은 30px 박스.
                        <a
                          href={`/resume/share/${item.shareSlug}?view=preview`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ops-detail-button"
                          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                        >
                          이력서 보기
                        </a>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>-</span>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="ops-detail-button"
                        onClick={() => void openDetail(item.id)}
                      >
                        상세정보
                      </button>
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
            총 {total}개 · {page}/{totalPages} 페이지
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

      <dialog
        ref={detailDialogRef}
        className="ops-modal-dialog"
        onCancel={handleDialogCancel}
        onClick={handleDialogClick}
      >
        <article className="ops-modal-card ops-detail-modal-card">
          <div className="ops-modal-fixed-top">
            <div className="ops-modal-header">
              <h2>{detail?.title || "이력서 상세"}</h2>
              <button
                type="button"
                className="ops-modal-close"
                onClick={requestCloseDetailModal}
                aria-label="닫기"
              >
                <X size={16} weight="bold" aria-hidden />
              </button>
            </div>
          </div>
          <div className="ops-modal-scroll-body">
            {detailLoading ? (
              <p className="ops-table-empty">이력서를 불러오는 중입니다...</p>
            ) : detail ? (
              <div className="ops-detail-sections">
                {/* Author info */}
                <section className="ops-detail-section">
                  <h3>작성자</h3>
                  <div className="ops-detail-grid">
                    <div>
                      <span className="ops-detail-label">이름</span>
                      <span>{detail.user?.name || "-"}</span>
                    </div>
                    <div>
                      <span className="ops-detail-label">이메일</span>
                      <span>{detail.user?.email || "-"}</span>
                    </div>
                    <div>
                      <span className="ops-detail-label">역할</span>
                      <span>{roleLabel(detail.user?.role)}</span>
                    </div>
                    <div>
                      <span className="ops-detail-label">가입 방법</span>
                      <span>{authProviderLabel(detail.user?.authProvider)}</span>
                    </div>
                    <div>
                      <span className="ops-detail-label">전화번호</span>
                      <span>{detail.user?.phoneNumber || "-"}</span>
                    </div>
                    <div>
                      <span className="ops-detail-label">가입일</span>
                      <span>{formatDate(detail.user?.createdAt)}</span>
                    </div>
                  </div>
                </section>

                {/* Resume meta */}
                <section className="ops-detail-section">
                  <h3>이력서 정보</h3>
                  <div className="ops-detail-grid">
                    <div>
                      <span className="ops-detail-label">제목</span>
                      <span>{detail.title || "-"}</span>
                    </div>
                    <div>
                      <span className="ops-detail-label">대표 여부</span>
                      <span>{detail.isPrimary ? "대표 이력서" : "-"}</span>
                    </div>
                    <div>
                      <span className="ops-detail-label">완성률</span>
                      {(() => {
                        const pct = detail.completionRate ?? 0;
                        const color = pct >= 80 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#ef4444";
                        return (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 140 }}>
                            <span style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 999, overflow: "hidden", display: "inline-block", minWidth: 80 }}>
                              <span style={{ display: "block", height: "100%", width: `${pct}%`, background: color, borderRadius: 999 }} />
                            </span>
                            <span style={{ fontVariantNumeric: "tabular-nums", color, fontWeight: 600 }}>{pct}%</span>
                          </span>
                        );
                      })()}
                    </div>
                    <div>
                      <span className="ops-detail-label">작성일</span>
                      <span>{formatDateTime(detail.createdAt)}</span>
                    </div>
                    <div>
                      <span className="ops-detail-label">수정일</span>
                      <span>{formatDateTime(detail.updatedAt)}</span>
                    </div>
                  </div>
                </section>

                {/* Structured content (JSON) */}
                <section className="ops-detail-section">
                  <h3>이력서 본문</h3>
                  <pre
                    style={{
                      maxHeight: "60vh",
                      overflow: "auto",
                      background: "#0f172a",
                      color: "#e2e8f0",
                      padding: "12px 14px",
                      borderRadius: 10,
                      fontSize: 12,
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word"
                    }}
                  >
                    {JSON.stringify(detail.content ?? {}, null, 2)}
                  </pre>
                </section>
              </div>
            ) : (
              <p className="ops-table-empty">이력서 정보를 불러오지 못했습니다.</p>
            )}
          </div>
          <div className="ops-modal-fixed-bottom">
            <div className="ops-detail-actions">
              <button type="button" className="ops-action-cancel" onClick={requestCloseDetailModal}>
                닫기
              </button>
            </div>
          </div>
        </article>
      </dialog>
    </section>
  );
}
