"use client";

import { ArrowDown, ArrowUp, ArrowsDownUp, X } from "@phosphor-icons/react";
import { MouseEvent, SyntheticEvent, useEffect, useMemo, useRef, useState } from "react";
import { OpsBadge, toneFromEmailVerified, toneFromPartnerOrgRole } from "../../partners/_components/OpsBadge";
import { PartnerUnifiedDetailModal } from "../../partners/_components/PartnerUnifiedDetailModal";

const TOKEN_COOKIE_KEY = "ops_admin_token";

type SortField = "email" | "name" | "partnerName" | "partnerOrgRole" | "createdAt";
type SortOrder = "asc" | "desc";
type PartnerCompanySize = "SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100";

type PartnerUserItem = {
  id: string;
  email: string;
  name: string | null;
  phoneNumber: string | null;
  jobTitle: string | null;
  adminMemo: string | null;
  role: "STUDENT" | "PARTNER" | "OPERATOR";
  partnerType: "COMPANY" | "UNIVERSITY" | "AGENCY" | null;
  partnerOrgRole: "OWNER" | "ADMIN" | "MEMBER" | null;
  emailVerified: boolean;
  createdAt: string;
  partnerName: string;
  partner: {
    id: string;
    name: string;
    companySize: PartnerCompanySize | null;
    partnerType: "COMPANY" | "UNIVERSITY" | "AGENCY";
    industry: string;
    officeAddress: string | null;
    website: string | null;
    socialMedia: string | null;
    description: string | null;
    strengths: string | null;
    adminMemo: string | null;
    createdAt: string;
  } | null;
};

function readCookie(key: string) {
  if (typeof document === "undefined") return "";
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${key}=`));
  if (entry) return decodeURIComponent(entry.split("=")[1] ?? ""); try { return window.localStorage.getItem("platform_access_token") || ""; } catch { return ""; }
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR");
}

function partnerOrgRoleLabel(role: PartnerUserItem["partnerOrgRole"]) {
  if (role === "OWNER") return "소유자";
  if (role === "ADMIN") return "관리자";
  if (role === "MEMBER") return "멤버";
  return "-";
}

function roleLabel(role: PartnerUserItem["role"]) {
  if (role === "OPERATOR") return "운영자";
  if (role === "PARTNER") return "파트너";
  return "일반회원";
}

function companySizeLabel(size: PartnerCompanySize | null) {
  if (size === "SIZE_1_10") return "1~10인";
  if (size === "SIZE_UNDER_30") return "30인 이하";
  if (size === "SIZE_UNDER_50") return "50인 이하";
  if (size === "SIZE_OVER_100") return "100인 이상";
  return "-";
}

export default function PartnerUsersPage() {
  const detailDialogRef = useRef<HTMLDialogElement>(null);
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const [items, setItems] = useState<PartnerUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listErrorMessage, setListErrorMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 40 | 100>(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedPartner, setSelectedPartner] = useState<PartnerUserItem["partner"]>(null);
  const [isPartnerDetailModalOpen, setIsPartnerDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PartnerUserItem | null>(null);
  const [detailMode, setDetailMode] = useState<"partner" | "user" | null>(null);
  const [userDetailTab, setUserDetailTab] = useState<"basic" | "memo">("basic");
  const [isUserMemoEditMode, setIsUserMemoEditMode] = useState(false);
  const [userMemoDraft, setUserMemoDraft] = useState("");
  const [userMemoSaving, setUserMemoSaving] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const pageButtons = useMemo(() => {
    const maxVisible = 7;
    const pages: number[] = [];
    const start = Math.max(1, page - 3);
    const end = Math.min(totalPages, start + maxVisible - 1);
    const normalizedStart = Math.max(1, end - maxVisible + 1);
    for (let i = normalizedStart; i <= end; i += 1) pages.push(i);
    return pages;
  }, [page, totalPages]);

  const sortedItems = useMemo(() => {
    const normalize = (value: string | null | undefined) => (value ?? "").toLowerCase();
    const sorted = [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = normalize(a.name).localeCompare(normalize(b.name), "ko");
          break;
        case "email":
          cmp = a.email.localeCompare(b.email, "en");
          break;
        case "partnerName":
          cmp = a.partnerName.localeCompare(b.partnerName, "ko");
          break;
        case "partnerOrgRole": {
          const rank: Record<"OWNER" | "ADMIN" | "MEMBER", number> = {
            OWNER: 0,
            ADMIN: 1,
            MEMBER: 2
          };
          const aRank = a.partnerOrgRole ? rank[a.partnerOrgRole] : 999;
          const bRank = b.partnerOrgRole ? rank[b.partnerOrgRole] : 999;
          cmp = aRank - bRank;
          break;
        }
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [items, sortField, sortOrder]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortOrder("asc");
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowsDownUp size={13} weight="bold" aria-hidden />;
    if (sortOrder === "asc") return <ArrowUp size={13} weight="bold" aria-hidden />;
    return <ArrowDown size={13} weight="bold" aria-hidden />;
  }

  async function fetchPartnerUsers() {
    setLoading(true);
    setListErrorMessage(null);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const response = await fetch(`${apiBaseUrl}/ops/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        items?: PartnerUserItem[];
        page?: number;
        pageSize?: number;
        total?: number;
        totalPages?: number;
        message?: string;
      };
      if (!response.ok || !payload.ok) {
        setListErrorMessage(payload.message ?? "전체 사용자 목록을 불러오지 못했습니다.");
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
    void fetchPartnerUsers();
  }, [debouncedSearch, sortField, sortOrder, page, pageSize]);

  function requestCloseDetailModal() {
    setIsDetailModalOpen(false);
    setSelectedUser(null);
    setDetailMode(null);
    setUserDetailTab("basic");
    setIsUserMemoEditMode(false);
    setUserMemoDraft("");
  }

  async function saveUserMemo() {
    if (!selectedUser) return;
    setUserMemoSaving(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/users/${selectedUser.id}/admin-memo`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          adminMemo: userMemoDraft.trim() || undefined
        })
      });
      const payload = (await response.json()) as { ok?: boolean; item?: { id: string; adminMemo: string | null }; message?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? "사용자 관리자 메모 저장에 실패했습니다.");
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedUser.id
            ? {
                ...item,
                adminMemo: payload.item!.adminMemo
              }
            : item
        )
      );
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              adminMemo: payload.item!.adminMemo
            }
          : prev
      );
      setIsUserMemoEditMode(false);
    } catch {
      window.alert("사용자 관리자 메모 저장 중 오류가 발생했습니다.");
    } finally {
      setUserMemoSaving(false);
    }
  }

  function handleDialogCancel(event: SyntheticEvent<HTMLDialogElement, Event>) {
    event.preventDefault();
    requestCloseDetailModal();
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    const dialog = event.currentTarget;
    const rect = dialog.getBoundingClientRect();
    const isInsideDialog =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!isInsideDialog) requestCloseDetailModal();
  }

  useEffect(() => {
    const dialog = detailDialogRef.current;
    if (!dialog) return;
    if (isDetailModalOpen) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (dialog.open) dialog.close();
  }, [isDetailModalOpen]);

  return (
    <section className="ops-content-section">
      <header>
        <h1>전체 사용자 관리</h1>
        <p>학생/파트너/운영자 전체 계정을 조회하고 검색/정렬/페이징으로 운영합니다.</p>
      </header>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>전체 사용자 목록</h2>
        </div>

        <div className="ops-partner-filters">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="이메일, 이름, 파트너사 검색"
            className="ops-partner-filter-search"
          />
          <select
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(Number(e.target.value) as 20 | 40 | 100);
              setPage(1);
            }}
          >
            <option value="20">20개</option>
            <option value="40">40개</option>
            <option value="100">100개</option>
          </select>
        </div>

        {listErrorMessage ? <p className="ops-form-error">{listErrorMessage}</p> : null}

        <div className="ops-partner-table-wrap">
          <table className="ops-partner-table ops-partner-users-table">
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    className={`ops-th-sort ${sortField === "name" ? "is-active" : ""}`}
                    onClick={() => toggleSort("name")}
                  >
                    <span>담당자명</span>
                    <SortIcon field="name" />
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className={`ops-th-sort ${sortField === "email" ? "is-active" : ""}`}
                    onClick={() => toggleSort("email")}
                  >
                    <span>이메일</span>
                    <SortIcon field="email" />
                  </button>
                </th>
                <th>
                  <span>권한</span>
                </th>
                <th>
                  <button
                    type="button"
                    className={`ops-th-sort ${sortField === "partnerName" ? "is-active" : ""}`}
                    onClick={() => toggleSort("partnerName")}
                  >
                    <span>파트너사</span>
                    <SortIcon field="partnerName" />
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className={`ops-th-sort ${sortField === "partnerOrgRole" ? "is-active" : ""}`}
                    onClick={() => toggleSort("partnerOrgRole")}
                  >
                    <span>역할</span>
                    <SortIcon field="partnerOrgRole" />
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className={`ops-th-sort ${sortField === "createdAt" ? "is-active" : ""}`}
                    onClick={() => toggleSort("createdAt")}
                  >
                    <span>가입일</span>
                    <SortIcon field="createdAt" />
                  </button>
                </th>
                <th>상세정보</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="ops-table-empty">목록을 불러오는 중입니다...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="ops-table-empty">조건에 맞는 사용자가 없습니다.</td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="ops-clickable-row"
                    onClick={() => {
                      setSelectedUser(item);
                      setSelectedPartner(null);
                      setDetailMode("user");
                      setUserDetailTab("basic");
                      setIsUserMemoEditMode(false);
                      setUserMemoDraft(item.adminMemo ?? "");
                      setIsDetailModalOpen(true);
                    }}
                  >
                    <td>{item.name || "-"}</td>
                    <td>{item.email}</td>
                    <td>{roleLabel(item.role)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {item.partner ? (
                        <button
                          type="button"
                          className="ops-link-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPartner(item.partner);
                            setIsPartnerDetailModalOpen(true);
                          }}
                        >
                          {item.partnerName}
                        </button>
                      ) : (
                        item.partnerName
                      )}
                    </td>
                    <td>
                      {item.partnerOrgRole ? (
                        <OpsBadge tone={toneFromPartnerOrgRole(item.partnerOrgRole)}>{partnerOrgRoleLabel(item.partnerOrgRole)}</OpsBadge>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="ops-detail-button"
                        onClick={() => {
                          setSelectedUser(item);
                          setSelectedPartner(null);
                          setDetailMode("user");
                          setUserDetailTab("basic");
                          setIsUserMemoEditMode(false);
                          setUserMemoDraft(item.adminMemo ?? "");
                          setIsDetailModalOpen(true);
                        }}
                      >
                        상세정보
                      </button>
                    </td>
                  </tr>
                ))
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
        {detailMode === "user" && selectedUser ? (
          <article className="ops-modal-card ops-detail-modal-card">
            <div className="ops-modal-fixed-top">
              <div className="ops-modal-header">
                <h2>{selectedUser.name || "담당자 상세정보"}</h2>
                <button type="button" className="ops-modal-close" onClick={requestCloseDetailModal} aria-label="닫기">
                  <X size={16} weight="bold" aria-hidden />
                </button>
              </div>
            </div>
            <div className="ops-modal-scroll-body">
              <div className="ops-detail-tabbed">
                <div className="ops-detail-tabs" role="tablist" aria-label="사용자 상세 탭">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={userDetailTab === "basic"}
                    className={`ops-detail-tab ${userDetailTab === "basic" ? "is-active" : ""}`}
                    onClick={() => setUserDetailTab("basic")}
                  >
                    기본 정보
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={userDetailTab === "memo"}
                    className={`ops-detail-tab ${userDetailTab === "memo" ? "is-active" : ""}`}
                    onClick={() => setUserDetailTab("memo")}
                  >
                    관리자 메모
                  </button>
                </div>

                <div className="ops-detail-tab-panel">
                  {userDetailTab === "basic" ? (
                    <div className="ops-detail-sections">
                      <section className="ops-detail-section">
                        <h3>사용자 정보</h3>
                        <div className="ops-detail-grid">
                          <div><span>담당자명</span><strong>{selectedUser.name || "-"}</strong></div>
                          <div><span>이메일</span><strong>{selectedUser.email}</strong></div>
                          <div><span>휴대폰 번호</span><strong>{selectedUser.phoneNumber || "-"}</strong></div>
                          <div><span>직책</span><strong>{selectedUser.jobTitle || "-"}</strong></div>
                          <div><span>권한</span><strong>{roleLabel(selectedUser.role)}</strong></div>
                          <div>
                            <span>파트너 역할</span>
                            <strong>
                              {selectedUser.partnerOrgRole ? (
                                <OpsBadge tone={toneFromPartnerOrgRole(selectedUser.partnerOrgRole)}>{partnerOrgRoleLabel(selectedUser.partnerOrgRole)}</OpsBadge>
                              ) : (
                                "-"
                              )}
                            </strong>
                          </div>
                          <div><span>유형</span><strong>{selectedUser.partnerType || "-"}</strong></div>
                          <div>
                            <span>이메일 인증 상태</span>
                            <strong>
                              <OpsBadge tone={toneFromEmailVerified(selectedUser.emailVerified)}>
                                {selectedUser.emailVerified ? "승인 완료" : "미승인"}
                              </OpsBadge>
                            </strong>
                          </div>
                          <div><span>가입일</span><strong>{formatDate(selectedUser.createdAt)}</strong></div>
                        </div>
                      </section>
                      <section className="ops-detail-section">
                        <h3>연결 파트너 정보</h3>
                        <div className="ops-detail-grid">
                          <div><span>파트너사</span><strong>{selectedUser.partnerName}</strong></div>
                        </div>
                      </section>
                    </div>
                  ) : (
                    <section className="ops-detail-section">
                      <h3>관리자 메모</h3>
                      {isUserMemoEditMode ? (
                        <div className="ops-detail-grid ops-detail-grid-single">
                          <label>
                            <span>메모</span>
                            <textarea
                              rows={8}
                              value={userMemoDraft}
                              onChange={(e) => setUserMemoDraft(e.target.value)}
                              placeholder="사용자 관리자 메모를 입력하세요."
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="ops-detail-grid ops-detail-grid-single">
                          <div><span>메모</span><strong>{selectedUser.adminMemo || "-"}</strong></div>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              </div>
            </div>
            <div className="ops-modal-fixed-bottom ops-detail-actions">
              {userDetailTab === "memo" ? (
                isUserMemoEditMode ? (
                  <>
                    <button
                      type="button"
                      className="ops-action-cancel"
                      onClick={() => {
                        setIsUserMemoEditMode(false);
                        setUserMemoDraft(selectedUser.adminMemo ?? "");
                      }}
                    >
                      취소
                    </button>
                    <button type="button" className="ops-action-save" onClick={() => void saveUserMemo()} disabled={userMemoSaving}>
                      {userMemoSaving ? "저장 중..." : "저장"}
                    </button>
                  </>
                ) : (
                  <button type="button" className="ops-action-save" onClick={() => setIsUserMemoEditMode(true)}>
                    메모 작성
                  </button>
                )
              ) : null}
            </div>
          </article>
        ) : null}
      </dialog>

      <PartnerUnifiedDetailModal
        open={isPartnerDetailModalOpen && !!selectedPartner}
        partner={selectedPartner}
        onClose={() => {
          setIsPartnerDetailModalOpen(false);
          setSelectedPartner(null);
        }}
        onUpdated={(updated) => {
          setSelectedPartner((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
        }}
      />
    </section>
  );
}
