"use client";

import Link from "next/link";
import { CheckCircle, X, XCircle } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";
import { getApplicationStatusLabel, type ApplicationStatus } from "../../../../../lib/status-labels";
import { downloadCsv, formatCsvDate } from "../../../../../lib/csv-export";
import {
  PartnerUnifiedDetailModal,
  type PartnerDetailModel
} from "../../partners/_components/PartnerUnifiedDetailModal";

type PositionSourceProvider = "INTERNAL" | "BUDDIES" | "WANTED" | "OTHER";
type PositionSourceKind = "INTERNAL" | "EXTERNAL";

type OpsApplication = {
  id: string;
  positionId: string;
  positionTitle: string;
  positionPreferredJobRole: string | null;
  positionSourceKind: PositionSourceKind;
  positionSourceProvider: PositionSourceProvider;
  partnerOrganizationId: string | null;
  partnerOrganizationName: string | null;
  candidateUserId: string;
  candidateName: string | null;
  candidateEmail: string;
  candidateNationality: string | null;
  status: ApplicationStatus;
  memo: string | null;
  submittedAt: string;
  updatedAt: string;
};

type UserDetail = {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  phoneNumber: string | null;
  nationality: string | null;
  role: string;
  jobTitle: string | null;
  affiliation: string | null;
  createdAt: string;
  adminMemo?: string | null;
};

const STATUS_FLOW: { value: ApplicationStatus; label: string }[] = [
  { value: "SUBMITTED", label: "검토 중" },
  { value: "INTERVIEW", label: "면접 예정" },
  { value: "ACCEPTED", label: "합격" },
  { value: "REJECTED", label: "불합격" }
];

// Korean labels for crawl-source provider — same chip the positions list uses.
function sourceProviderLabel(provider: PositionSourceProvider): string | null {
  if (provider === "BUDDIES") return "버디즈";
  if (provider === "WANTED") return "원티드";
  if (provider === "OTHER") return "외부";
  return null;
}

function roleLabel(role: string | undefined | null) {
  if (role === "OPERATOR") return "운영자";
  if (role === "PARTNER") return "파트너";
  if (role === "STUDENT") return "일반회원";
  return role ?? "-";
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

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR");
}

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function OpsApplicationsPage() {
  const [items, setItems] = useState<OpsApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ApplicationStatus>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 40 | 100>(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [updating, setUpdating] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Detail popups — partner & user. Each lazy-loads on first click and caches
  // the result for the open lifecycle.
  const [partnerDetail, setPartnerDetail] = useState<PartnerDetailModel | null>(null);
  const [isPartnerOpen, setIsPartnerOpen] = useState(false);
  const [partnerLoading, setPartnerLoading] = useState(false);

  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [userLoading, setUserLoading] = useState(false);

  const pageButtons = useMemo(() => {
    const maxVisible = 7;
    const pages: number[] = [];
    const start = Math.max(1, page - 3);
    const end = Math.min(totalPages, start + maxVisible - 1);
    const normalizedStart = Math.max(1, end - maxVisible + 1);
    for (let i = normalizedStart; i <= end; i += 1) pages.push(i);
    return pages;
  }, [page, totalPages]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const response = await fetch(`${apiBase()}/ops/applications?${params.toString()}`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as {
        ok?: boolean;
        items?: OpsApplication[];
        total?: number;
        totalPages?: number;
        message?: string;
      };
      if (!payload.ok) {
        setError(payload.message ?? "지원 목록을 불러오지 못했습니다.");
        return;
      }
      setItems(payload.items ?? []);
      setTotal(payload.total ?? 0);
      setTotalPages(payload.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "지원 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // load is a closure over the filters/page state, deps must list them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, page, pageSize]);

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    setUpdating(applicationId);
    try {
      const response = await fetch(`${apiBase()}/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setItems((prev) => prev.map((it) => (it.id === applicationId ? { ...it, status } : it)));
      setActionError(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "상태 변경 실패");
    } finally {
      setUpdating(null);
    }
  }

  async function openPartnerDetail(partnerOrganizationId: string) {
    setIsPartnerOpen(true);
    setPartnerLoading(true);
    try {
      const response = await fetch(`${apiBase()}/ops/partners/${partnerOrganizationId}`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        item?: {
          id: string;
          partnerType: PartnerDetailModel["partnerType"];
          name: string;
          companySize: PartnerDetailModel["companySize"];
          officeAddress: string | null;
          website: string | null;
          socialMedia: string | null;
          industry: string;
          description: string | null;
          strengths: string | null;
          adminMemo: string | null;
          memberCount?: number;
          createdAt: string;
        };
        message?: string;
      };
      if (!response.ok || !payload.ok || !payload.item) {
        setActionError(payload.message ?? "파트너 정보를 불러오지 못했습니다.");
        setIsPartnerOpen(false);
        return;
      }
      const item = payload.item;
      setPartnerDetail({
        id: item.id,
        partnerType: item.partnerType,
        name: item.name,
        companySize: item.companySize,
        officeAddress: item.officeAddress,
        website: item.website,
        socialMedia: item.socialMedia,
        industry: item.industry,
        description: item.description,
        strengths: item.strengths,
        adminMemo: item.adminMemo,
        memberCount: item.memberCount,
        createdAt: item.createdAt
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "파트너 정보를 불러오지 못했습니다.");
      setIsPartnerOpen(false);
    } finally {
      setPartnerLoading(false);
    }
  }

  async function openUserDetail(userId: string) {
    setIsUserOpen(true);
    setUserLoading(true);
    setUserDetail(null);
    try {
      const response = await fetch(`${apiBase()}/ops/users/${userId}`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        // The /ops/users/:id endpoint returns a rich object with nested
        // applications/programs/etc. We only need the identity fields.
        user?: UserDetail & Record<string, unknown>;
        message?: string;
      };
      if (!response.ok || !payload.ok || !payload.user) {
        setActionError(payload.message ?? "사용자 정보를 불러오지 못했습니다.");
        setIsUserOpen(false);
        return;
      }
      const u = payload.user;
      setUserDetail({
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: Boolean(u.emailVerified),
        phoneNumber: u.phoneNumber ?? null,
        nationality: u.nationality ?? null,
        role: u.role,
        jobTitle: u.jobTitle ?? null,
        affiliation: u.affiliation ?? null,
        createdAt: typeof u.createdAt === "string" ? u.createdAt : new Date().toISOString(),
        adminMemo: typeof u.adminMemo === "string" ? u.adminMemo : null
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "사용자 정보를 불러오지 못했습니다.");
      setIsUserOpen(false);
    } finally {
      setUserLoading(false);
    }
  }

  const anyFilterActive = statusFilter !== "ALL" || search.trim().length > 0;

  return (
    <section className="ops-content-section">
      <header>
        <h1>전체 지원 현황</h1>
        <p>모든 파트너 회사의 지원자를 통합 검토하고 상태를 조정할 수 있어요.</p>
      </header>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>지원 목록</h2>
          <button
            type="button"
            className="ops-action-save"
            onClick={() => {
              const statusKo: Record<string, string> = {
                SUBMITTED: "검토 중",
                INTERVIEW: "면접 예정",
                ACCEPTED: "합격",
                REJECTED: "불합격",
                WITHDRAWN: "철회"
              };
              downloadCsv(
                "applications",
                ["지원자", "이메일", "국적", "회사", "포지션", "직무", "상태", "지원 시점", "최근 업데이트"],
                items.map((it) => [
                  it.candidateName ?? "",
                  it.candidateEmail,
                  it.candidateNationality ?? "",
                  it.partnerOrganizationName ?? "",
                  it.positionTitle,
                  it.positionPreferredJobRole ?? "",
                  statusKo[it.status] ?? it.status,
                  formatCsvDate(it.submittedAt),
                  formatCsvDate(it.updatedAt)
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
            placeholder="지원자 / 이메일 / 회사 / 포지션 검색"
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
            <option value="SUBMITTED">검토 중</option>
            <option value="INTERVIEW">면접 예정</option>
            <option value="ACCEPTED">합격</option>
            <option value="REJECTED">불합격</option>
            <option value="WITHDRAWN">철회</option>
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
          {anyFilterActive ? (
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

        {actionError ? <p className="ops-form-error">{actionError}</p> : null}
        {error ? <p className="ops-form-error">{error}</p> : null}

        <div className="ops-partner-table-wrap">
          <table className="ops-partner-table">
            <thead>
              <tr>
                <th>지원자</th>
                <th>국적</th>
                <th>회사</th>
                <th>포지션</th>
                <th>직무</th>
                <th>상태</th>
                <th>지원 시점</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="ops-table-empty">목록을 불러오는 중입니다...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="ops-table-empty">조건에 맞는 지원이 없습니다.</td>
                </tr>
              ) : (
                items.map((it) => {
                  const badge = getApplicationStatusLabel(it.status, "operator");
                  const isUpdating = updating === it.id;
                  const crawlLabel = it.positionSourceKind === "EXTERNAL"
                    ? sourceProviderLabel(it.positionSourceProvider)
                    : null;
                  return (
                    <tr key={it.id}>
                      <td>
                        <button
                          type="button"
                          className="ops-link-button"
                          onClick={() => void openUserDetail(it.candidateUserId)}
                        >
                          <span className="ops-row-strong">{it.candidateName ?? "-"}</span>
                        </button>
                        <div className="ops-row-sub">{it.candidateEmail}</div>
                      </td>
                      <td>{it.candidateNationality ?? "-"}</td>
                      <td>
                        {crawlLabel ? (
                          <span className="ops-pill ops-pill-violet">{crawlLabel}</span>
                        ) : it.partnerOrganizationId && it.partnerOrganizationName ? (
                          <button
                            type="button"
                            className="ops-link-button"
                            onClick={() => void openPartnerDetail(it.partnerOrganizationId!)}
                          >
                            {it.partnerOrganizationName}
                          </button>
                        ) : (
                          <span className="ops-row-sub">-</span>
                        )}
                      </td>
                      <td>{it.positionTitle}</td>
                      <td>{it.positionPreferredJobRole ?? "-"}</td>
                      <td>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="ops-row-sub">{formatRelativeTime(it.submittedAt)}</td>
                      <td>
                        <div className="ops-table-actions">
                          <select
                            value={it.status}
                            disabled={isUpdating}
                            onChange={(e) => void updateStatus(it.id, e.target.value as ApplicationStatus)}
                            className="ops-select ops-select-inline"
                          >
                            {STATUS_FLOW.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          <Link href={`/dashboard/ops/operations/applications/${it.id}`} className="ops-btn">
                            상세
                          </Link>
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

      <PartnerUnifiedDetailModal
        open={isPartnerOpen}
        partner={partnerLoading ? null : partnerDetail}
        onClose={() => {
          setIsPartnerOpen(false);
          setPartnerDetail(null);
        }}
        onUpdated={(updated) => {
          setPartnerDetail((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
        }}
      />

      {isUserOpen ? (
        <div
          className="ops-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="지원자 상세"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsUserOpen(false);
              setUserDetail(null);
            }
          }}
        >
          <div className="ops-modal-panel ops-modal-panel--detail">
            <div className="ops-modal-panel-header">
              <h2>{userDetail?.name || "지원자 상세"}</h2>
              <button
                type="button"
                className="ops-modal-close"
                onClick={() => {
                  setIsUserOpen(false);
                  setUserDetail(null);
                }}
                aria-label="닫기"
              >
                <X size={16} weight="bold" aria-hidden />
              </button>
            </div>
            <div className="ops-modal-panel-body">
              {userLoading ? (
                <p className="ops-row-sub">불러오는 중...</p>
              ) : userDetail ? (
                <div className="ops-detail-grid">
                  <div>
                    <span>이메일</span>
                    <strong>
                      <span className="ops-email-with-badge">
                        {userDetail.emailVerified ? (
                          <CheckCircle
                            size={16}
                            weight="fill"
                            className="ops-email-verify-icon is-verified"
                            aria-label="이메일 인증 완료"
                          />
                        ) : (
                          <XCircle
                            size={16}
                            weight="fill"
                            className="ops-email-verify-icon is-unverified"
                            aria-label="이메일 미인증"
                          />
                        )}
                        <span>{userDetail.email}</span>
                      </span>
                    </strong>
                  </div>
                  <div><span>전화번호</span><strong>{userDetail.phoneNumber || "-"}</strong></div>
                  <div><span>국적</span><strong>{userDetail.nationality || "-"}</strong></div>
                  <div><span>역할</span><strong>{roleLabel(userDetail.role)}</strong></div>
                  <div><span>소속</span><strong>{userDetail.affiliation || "-"}</strong></div>
                  <div><span>직책</span><strong>{userDetail.jobTitle || "-"}</strong></div>
                  <div><span>가입일</span><strong>{formatDate(userDetail.createdAt)}</strong></div>
                  {userDetail.adminMemo ? (
                    <div><span>운영자 메모</span><strong>{userDetail.adminMemo}</strong></div>
                  ) : null}
                </div>
              ) : (
                <p className="ops-row-sub">사용자 정보를 불러올 수 없습니다.</p>
              )}
            </div>
            <div className="ops-modal-panel-footer">
              <button
                type="button"
                className="ops-action-cancel"
                onClick={() => {
                  setIsUserOpen(false);
                  setUserDetail(null);
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
