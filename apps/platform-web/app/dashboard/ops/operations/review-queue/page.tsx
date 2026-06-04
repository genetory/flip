"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";

type ReviewTab = "partners" | "positions";

type PendingPartner = {
  id: string;
  name: string;
  partnerType: string;
  industry: string;
  companySize: string | null;
  website: string | null;
  officeAddress: string | null;
  createdAt: string;
  businessRegistrationDocumentData: string | null;
  fourInsuranceSubscriberListData: string | null;
};

type PendingPosition = {
  id: string;
  title: string;
  status: string;
  partnerOrganizationName: string | null;
  partnerOrganizationId: string | null;
  createdAt: string;
};

const PARTNER_TYPE_LABEL: Record<string, string> = {
  UNIVERSITY: "대학",
  COMPANY: "파트너",
  AGENCY: "에이전시"
};

const COMPANY_SIZE_LABEL: Record<string, string> = {
  SIZE_1_10: "1~10인",
  SIZE_UNDER_30: "30인 이하",
  SIZE_UNDER_50: "50인 이하",
  SIZE_OVER_100: "100인 이상"
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

const apiBaseUrl = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ReviewQueuePage() {
  const [tab, setTab] = useState<ReviewTab>("partners");

  // Partners — debounced search + pagination, mirrors the all-users page.
  const [partnerSearch, setPartnerSearch] = useState("");
  const [partnerDebouncedSearch, setPartnerDebouncedSearch] = useState("");
  const [partners, setPartners] = useState<PendingPartner[]>([]);
  const [partnerTotal, setPartnerTotal] = useState(0);
  const [partnerTotalPages, setPartnerTotalPages] = useState(1);
  const [partnerPage, setPartnerPage] = useState(1);
  const [partnerPageSize, setPartnerPageSize] = useState<20 | 40 | 100>(20);

  // Positions — same shape.
  const [positionSearch, setPositionSearch] = useState("");
  const [positionDebouncedSearch, setPositionDebouncedSearch] = useState("");
  const [positions, setPositions] = useState<PendingPosition[]>([]);
  const [positionTotal, setPositionTotal] = useState(0);
  const [positionTotalPages, setPositionTotalPages] = useState(1);
  const [positionPage, setPositionPage] = useState(1);
  const [positionPageSize, setPositionPageSize] = useState<20 | 40 | 100>(20);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<Set<string>>(new Set());
  const [selectedPositionIds, setSelectedPositionIds] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);

  // Debounce — 400ms, same as all-users page.
  useEffect(() => {
    const t = setTimeout(() => setPartnerDebouncedSearch(partnerSearch), 400);
    return () => clearTimeout(t);
  }, [partnerSearch]);

  useEffect(() => {
    const t = setTimeout(() => setPositionDebouncedSearch(positionSearch), 400);
    return () => clearTimeout(t);
  }, [positionSearch]);

  const loadPartners = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("verificationApproved", "false");
    if (partnerDebouncedSearch.trim()) params.set("search", partnerDebouncedSearch.trim());
    params.set("page", String(partnerPage));
    params.set("pageSize", String(partnerPageSize));
    const response = await fetch(`${apiBaseUrl()}/ops/partners?${params.toString()}`, {
      headers: authHeaders(),
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`partners HTTP ${response.status}`);
    const payload = (await response.json()) as {
      ok?: boolean;
      items?: Array<{
        id: string;
        name: string;
        partnerType: string;
        industry: string;
        companySize: string | null;
        website: string | null;
        officeAddress: string | null;
        createdAt: string;
        businessRegistrationDocumentData?: string | null;
        fourInsuranceSubscriberListData?: string | null;
      }>;
      total?: number;
      totalPages?: number;
    };
    setPartners(
      (payload.items ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        partnerType: p.partnerType,
        industry: p.industry,
        companySize: p.companySize,
        website: p.website,
        officeAddress: p.officeAddress,
        createdAt: p.createdAt,
        businessRegistrationDocumentData: p.businessRegistrationDocumentData ?? null,
        fourInsuranceSubscriberListData: p.fourInsuranceSubscriberListData ?? null
      }))
    );
    setPartnerTotal(payload.total ?? 0);
    setPartnerTotalPages(payload.totalPages ?? 1);
  }, [partnerDebouncedSearch, partnerPage, partnerPageSize]);

  const loadPositions = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("status", "PENDING_REVIEW");
    if (positionDebouncedSearch.trim()) params.set("search", positionDebouncedSearch.trim());
    params.set("page", String(positionPage));
    params.set("pageSize", String(positionPageSize));
    const response = await fetch(`${apiBaseUrl()}/ops/positions?${params.toString()}`, {
      headers: authHeaders(),
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`positions HTTP ${response.status}`);
    const payload = (await response.json()) as {
      ok?: boolean;
      items?: Array<{
        id: string;
        title: string;
        status: string;
        createdAt: string;
        partnerOrganization?: { id: string; name: string } | null;
      }>;
      total?: number;
      totalPages?: number;
    };
    setPositions(
      (payload.items ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        partnerOrganizationName: p.partnerOrganization?.name ?? null,
        partnerOrganizationId: p.partnerOrganization?.id ?? null,
        createdAt: p.createdAt
      }))
    );
    setPositionTotal(payload.total ?? 0);
    setPositionTotalPages(payload.totalPages ?? 1);
  }, [positionDebouncedSearch, positionPage, positionPageSize]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadPartners(), loadPositions()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "검수 큐를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [loadPartners, loadPositions]);

  // Both tabs refetch on any dep change so the inactive tab's count badge
  // stays accurate.
  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  async function approvePartner(id: string) {
    setUpdating(id);
    try {
      const response = await fetch(`${apiBaseUrl()}/ops/partners/${id}/verification-approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ approved: true })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await refreshAll();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "승인 실패");
    } finally {
      setUpdating(null);
    }
  }

  async function rejectPartner(id: string) {
    if (!window.confirm("이 파트너의 인증을 반려하시겠습니까?")) return;
    setUpdating(id);
    try {
      const response = await fetch(`${apiBaseUrl()}/ops/partners/${id}/verification-approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ approved: false })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await refreshAll();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "반려 실패");
    } finally {
      setUpdating(null);
    }
  }

  async function approvePosition(id: string) {
    setUpdating(id);
    try {
      const response = await fetch(`${apiBaseUrl()}/ops/positions/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status: "OPEN" })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await refreshAll();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "승인 실패");
    } finally {
      setUpdating(null);
    }
  }

  async function rejectPosition(id: string) {
    if (!window.confirm("이 공고를 반려하시겠습니까?")) return;
    setUpdating(id);
    try {
      const response = await fetch(`${apiBaseUrl()}/ops/positions/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status: "REJECTED" })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await refreshAll();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "반려 실패");
    } finally {
      setUpdating(null);
    }
  }

  async function bulkPartners(approved: boolean) {
    const ids = Array.from(selectedPartnerIds);
    if (ids.length === 0) return;
    if (!window.confirm(`선택한 ${ids.length}개 파트너를 ${approved ? "승인" : "반려"}하시겠습니까?`)) return;
    setBulkRunning(true);
    setError(null);
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`${apiBaseUrl()}/ops/partners/${id}/verification-approval`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ approved })
          })
        )
      );
      setSelectedPartnerIds(new Set());
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "일괄 처리 실패");
    } finally {
      setBulkRunning(false);
    }
  }

  async function bulkPositions(approve: boolean) {
    const ids = Array.from(selectedPositionIds);
    if (ids.length === 0) return;
    if (!window.confirm(`선택한 ${ids.length}개 공고를 ${approve ? "승인 → 게시" : "반려"}하시겠습니까?`)) return;
    setBulkRunning(true);
    setError(null);
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`${apiBaseUrl()}/ops/positions/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ status: approve ? "OPEN" : "REJECTED" })
          })
        )
      );
      setSelectedPositionIds(new Set());
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "일괄 처리 실패");
    } finally {
      setBulkRunning(false);
    }
  }

  // ---- Partner pagination + select helpers ----
  const partnerPageButtons = useMemo(() => {
    const maxVisible = 7;
    const pages: number[] = [];
    const start = Math.max(1, partnerPage - 3);
    const end = Math.min(partnerTotalPages, start + maxVisible - 1);
    const normalizedStart = Math.max(1, end - maxVisible + 1);
    for (let i = normalizedStart; i <= end; i += 1) pages.push(i);
    return pages;
  }, [partnerPage, partnerTotalPages]);

  const allPartnersSelected = partners.length > 0 && partners.every((p) => selectedPartnerIds.has(p.id));
  const somePartnersSelected = partners.some((p) => selectedPartnerIds.has(p.id));

  function togglePartner(id: string) {
    setSelectedPartnerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllPartners() {
    setSelectedPartnerIds((prev) => {
      const next = new Set(prev);
      if (allPartnersSelected) {
        for (const p of partners) next.delete(p.id);
      } else {
        for (const p of partners) next.add(p.id);
      }
      return next;
    });
  }

  // ---- Position pagination + select helpers ----
  const positionPageButtons = useMemo(() => {
    const maxVisible = 7;
    const pages: number[] = [];
    const start = Math.max(1, positionPage - 3);
    const end = Math.min(positionTotalPages, start + maxVisible - 1);
    const normalizedStart = Math.max(1, end - maxVisible + 1);
    for (let i = normalizedStart; i <= end; i += 1) pages.push(i);
    return pages;
  }, [positionPage, positionTotalPages]);

  const allPositionsSelected = positions.length > 0 && positions.every((p) => selectedPositionIds.has(p.id));
  const somePositionsSelected = positions.some((p) => selectedPositionIds.has(p.id));

  function togglePosition(id: string) {
    setSelectedPositionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllPositions() {
    setSelectedPositionIds((prev) => {
      const next = new Set(prev);
      if (allPositionsSelected) {
        for (const p of positions) next.delete(p.id);
      } else {
        for (const p of positions) next.add(p.id);
      }
      return next;
    });
  }

  return (
    <section className="ops-content-section">
      <header>
        <h1>검수 큐</h1>
        <p>새로 가입한 파트너 회사와 새 공고를 검수하고 승인하세요.</p>
      </header>

      {/* Segmented tabs */}
      <div className="ops-report-tabs" role="tablist" aria-label="검수 큐 탭">
        {(
          [
            { key: "partners" as const, label: "파트너 가입 검수", count: partnerTotal },
            { key: "positions" as const, label: "공고 검수", count: positionTotal }
          ]
        ).map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`ops-report-tab${active ? " is-active" : ""}`}
            >
              {t.label}
              {t.count > 0 ? <span className="badge">{t.count}</span> : null}
            </button>
          );
        })}
      </div>

      {error ? <div className="ops-error-card">{error}</div> : null}

      {/* ----- 파트너 가입 검수 ----- */}
      {tab === "partners" ? (
        <article className="ops-partner-list-card">
          <div className="ops-partner-list-top">
            <h2>파트너 가입 검수 목록</h2>
          </div>

          <div className="ops-partner-filters ops-partner-filters--multi">
            <input
              value={partnerSearch}
              onChange={(e) => {
                setPartnerSearch(e.target.value);
                setPartnerPage(1);
              }}
              placeholder="파트너명 검색"
              className="ops-partner-filter-search"
            />
            <select
              value={String(partnerPageSize)}
              onChange={(e) => {
                setPartnerPageSize(Number(e.target.value) as 20 | 40 | 100);
                setPartnerPage(1);
              }}
              aria-label="페이지 크기"
            >
              <option value="20">20개</option>
              <option value="40">40개</option>
              <option value="100">100개</option>
            </select>
            {partnerSearch ? (
              <button
                type="button"
                className="ops-partner-filter-reset"
                onClick={() => {
                  setPartnerSearch("");
                  setPartnerPage(1);
                }}
              >
                필터 초기화
              </button>
            ) : null}
          </div>

          {selectedPartnerIds.size > 0 ? (
            <div className="ops-bulk-actionbar">
              <span>
                <strong>{selectedPartnerIds.size.toLocaleString()}개</strong> 선택됨
              </span>
              <div className="ops-bulk-actionbar-buttons">
                <button
                  type="button"
                  className="ops-action-cancel"
                  onClick={() => setSelectedPartnerIds(new Set())}
                  disabled={bulkRunning}
                >
                  선택 해제
                </button>
                <button
                  type="button"
                  className="ops-action-danger"
                  onClick={() => void bulkPartners(false)}
                  disabled={bulkRunning}
                >
                  {bulkRunning ? "처리 중..." : "일괄 반려"}
                </button>
                <button
                  type="button"
                  className="ops-action-save"
                  onClick={() => void bulkPartners(true)}
                  disabled={bulkRunning}
                >
                  {bulkRunning ? "처리 중..." : "일괄 승인"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="ops-partner-table-wrap">
            <table className="ops-partner-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      aria-label="현재 페이지 전체 선택"
                      checked={allPartnersSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = !allPartnersSelected && somePartnersSelected;
                      }}
                      onChange={toggleSelectAllPartners}
                    />
                  </th>
                  <th>파트너명</th>
                  <th>유형</th>
                  <th>산업</th>
                  <th>규모</th>
                  <th>서류</th>
                  <th>가입</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="ops-table-empty">목록을 불러오는 중입니다...</td>
                  </tr>
                ) : partners.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="ops-table-empty">검수 대기 중인 파트너가 없습니다.</td>
                  </tr>
                ) : (
                  partners.map((p) => {
                    const isUpdating = updating === p.id;
                    const checked = selectedPartnerIds.has(p.id);
                    return (
                      <tr key={p.id}>
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`${p.name} 선택`}
                            checked={checked}
                            onChange={() => togglePartner(p.id)}
                          />
                        </td>
                        <td>{p.name}</td>
                        <td>{PARTNER_TYPE_LABEL[p.partnerType] ?? p.partnerType}</td>
                        <td>{p.industry}</td>
                        <td>{p.companySize ? COMPANY_SIZE_LABEL[p.companySize] ?? p.companySize : "-"}</td>
                        <td>
                          <div style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
                            <span className={`ops-pill ${p.businessRegistrationDocumentData ? "ops-pill-green" : "ops-pill-amber"}`}>
                              사업자등록증 {p.businessRegistrationDocumentData ? "O" : "X"}
                            </span>
                            <span className={`ops-pill ${p.fourInsuranceSubscriberListData ? "ops-pill-green" : "ops-pill-amber"}`}>
                              4대보험 {p.fourInsuranceSubscriberListData ? "O" : "X"}
                            </span>
                          </div>
                        </td>
                        <td className="ops-row-sub">{formatRelativeTime(p.createdAt)}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="ops-table-actions" style={{ gap: 6 }}>
                            <button
                              type="button"
                              className="ops-action-danger"
                              onClick={() => void rejectPartner(p.id)}
                              disabled={isUpdating || bulkRunning}
                              style={{ minWidth: 64, height: 32, fontSize: 12 }}
                            >
                              반려
                            </button>
                            <button
                              type="button"
                              className="ops-action-save"
                              onClick={() => void approvePartner(p.id)}
                              disabled={isUpdating || bulkRunning}
                              style={{ minWidth: 64, height: 32, fontSize: 12 }}
                            >
                              승인
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
              총 {partnerTotal.toLocaleString()}개 · {partnerPage}/{partnerTotalPages} 페이지
            </span>
            <div className="ops-pagination-numbers">
              {partnerPageButtons.map((num) => (
                <button
                  key={num}
                  type="button"
                  className={num === partnerPage ? "is-active" : ""}
                  onClick={() => setPartnerPage(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            <span />
          </div>
        </article>
      ) : null}

      {/* ----- 공고 검수 ----- */}
      {tab === "positions" ? (
        <article className="ops-partner-list-card">
          <div className="ops-partner-list-top">
            <h2>공고 검수 목록</h2>
          </div>

          <div className="ops-partner-filters ops-partner-filters--multi">
            <input
              value={positionSearch}
              onChange={(e) => {
                setPositionSearch(e.target.value);
                setPositionPage(1);
              }}
              placeholder="공고 제목 / 파트너사 검색"
              className="ops-partner-filter-search"
            />
            <select
              value={String(positionPageSize)}
              onChange={(e) => {
                setPositionPageSize(Number(e.target.value) as 20 | 40 | 100);
                setPositionPage(1);
              }}
              aria-label="페이지 크기"
            >
              <option value="20">20개</option>
              <option value="40">40개</option>
              <option value="100">100개</option>
            </select>
            {positionSearch ? (
              <button
                type="button"
                className="ops-partner-filter-reset"
                onClick={() => {
                  setPositionSearch("");
                  setPositionPage(1);
                }}
              >
                필터 초기화
              </button>
            ) : null}
          </div>

          {selectedPositionIds.size > 0 ? (
            <div className="ops-bulk-actionbar">
              <span>
                <strong>{selectedPositionIds.size.toLocaleString()}개</strong> 선택됨
              </span>
              <div className="ops-bulk-actionbar-buttons">
                <button
                  type="button"
                  className="ops-action-cancel"
                  onClick={() => setSelectedPositionIds(new Set())}
                  disabled={bulkRunning}
                >
                  선택 해제
                </button>
                <button
                  type="button"
                  className="ops-action-danger"
                  onClick={() => void bulkPositions(false)}
                  disabled={bulkRunning}
                >
                  {bulkRunning ? "처리 중..." : "일괄 반려"}
                </button>
                <button
                  type="button"
                  className="ops-action-save"
                  onClick={() => void bulkPositions(true)}
                  disabled={bulkRunning}
                >
                  {bulkRunning ? "처리 중..." : "일괄 승인 → 게시"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="ops-partner-table-wrap">
            <table className="ops-partner-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      aria-label="현재 페이지 전체 선택"
                      checked={allPositionsSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = !allPositionsSelected && somePositionsSelected;
                      }}
                      onChange={toggleSelectAllPositions}
                    />
                  </th>
                  <th>공고 제목</th>
                  <th>파트너사</th>
                  <th>등록</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="ops-table-empty">목록을 불러오는 중입니다...</td>
                  </tr>
                ) : positions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="ops-table-empty">검수 대기 중인 공고가 없습니다.</td>
                  </tr>
                ) : (
                  positions.map((p) => {
                    const isUpdating = updating === p.id;
                    const checked = selectedPositionIds.has(p.id);
                    return (
                      <tr key={p.id}>
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`${p.title} 선택`}
                            checked={checked}
                            onChange={() => togglePosition(p.id)}
                          />
                        </td>
                        <td>{p.title}</td>
                        <td>{p.partnerOrganizationName ?? "-"}</td>
                        <td className="ops-row-sub">{formatRelativeTime(p.createdAt)}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="ops-table-actions" style={{ gap: 6 }}>
                            <button
                              type="button"
                              className="ops-action-danger"
                              onClick={() => void rejectPosition(p.id)}
                              disabled={isUpdating || bulkRunning}
                              style={{ minWidth: 64, height: 32, fontSize: 12 }}
                            >
                              반려
                            </button>
                            <button
                              type="button"
                              className="ops-action-save"
                              onClick={() => void approvePosition(p.id)}
                              disabled={isUpdating || bulkRunning}
                              style={{ minWidth: 96, height: 32, fontSize: 12 }}
                            >
                              승인 → 게시
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
              총 {positionTotal.toLocaleString()}개 · {positionPage}/{positionTotalPages} 페이지
            </span>
            <div className="ops-pagination-numbers">
              {positionPageButtons.map((num) => (
                <button
                  key={num}
                  type="button"
                  className={num === positionPage ? "is-active" : ""}
                  onClick={() => setPositionPage(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            <span />
          </div>
        </article>
      ) : null}
    </section>
  );
}
