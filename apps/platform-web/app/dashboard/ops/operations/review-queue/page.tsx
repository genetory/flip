"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [partners, setPartners] = useState<PendingPartner[]>([]);
  const [positions, setPositions] = useState<PendingPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<Set<string>>(new Set());
  const [selectedPositionIds, setSelectedPositionIds] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const headers = authHeaders();
      const [partnersResp, positionsResp] = await Promise.all([
        fetch(`${apiBaseUrl()}/ops/partners?pageSize=100`, { headers, cache: "no-store" }),
        fetch(`${apiBaseUrl()}/ops/positions?status=PENDING_REVIEW&pageSize=100`, { headers, cache: "no-store" })
      ]);
      if (!partnersResp.ok) throw new Error(`partners HTTP ${partnersResp.status}`);
      if (!positionsResp.ok) throw new Error(`positions HTTP ${positionsResp.status}`);
      const partnersPayload = (await partnersResp.json()) as { ok?: boolean; items?: Array<{ id: string; name: string; partnerType: string; industry: string; companySize: string | null; website: string | null; officeAddress: string | null; createdAt: string; verification?: { approved: boolean }; businessRegistrationDocumentData?: string | null; fourInsuranceSubscriberListData?: string | null }> };
      const positionsPayload = (await positionsResp.json()) as { ok?: boolean; items?: Array<{ id: string; title: string; status: string; createdAt: string; partnerOrganization?: { id: string; name: string } | null }> };
      const pendingPartners = (partnersPayload.items ?? []).filter((p) => !p.verification?.approved);
      setPartners(
        pendingPartners.map((p) => ({
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
      setPositions(
        (positionsPayload.items ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          status: p.status,
          partnerOrganizationName: p.partnerOrganization?.name ?? null,
          partnerOrganizationId: p.partnerOrganization?.id ?? null,
          createdAt: p.createdAt
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "검수 큐를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function approvePartner(id: string) {
    setUpdating(id);
    try {
      const response = await fetch(`${apiBaseUrl()}/ops/partners/${id}/verification-approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ approved: true })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPartners((prev) => prev.filter((p) => p.id !== id));
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
      // Rejected partners stay in queue (not approved) — just refresh
      await load();
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
      setPositions((prev) => prev.filter((p) => p.id !== id));
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
      setPositions((prev) => prev.filter((p) => p.id !== id));
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
      await load();
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
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "일괄 처리 실패");
    } finally {
      setBulkRunning(false);
    }
  }

  function toggleSet(setter: (updater: (prev: Set<string>) => Set<string>) => void, id: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const counts = useMemo(() => ({ partners: partners.length, positions: positions.length }), [partners.length, positions.length]);

  return (
    <section className="ops-content-section">
      <header>
        <h1>검수 큐</h1>
        <p>새로 가입한 파트너 회사와 새 공고를 검수하고 승인하세요.</p>
      </header>

      <article className="ops-card">
        <div className="ops-filter-chip-row">
          {([
            { key: "partners" as const, label: "파트너 가입 검수" },
            { key: "positions" as const, label: "공고 검수" }
          ]).map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`ops-filter-chip ${active ? "is-active" : ""}`}
              >
                {t.label} <span className="ops-filter-chip-count">{counts[t.key]}</span>
              </button>
            );
          })}
        </div>
      </article>

      {loading ? (
        <div className="ops-empty-card">검수 대기 항목을 불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : tab === "partners" ? (
        partners.length === 0 ? (
          <div className="ops-empty-card">검수 대기 중인 파트너가 없습니다.</div>
        ) : (
          <>
            {selectedPartnerIds.size > 0 ? (
              <article className="ops-card" style={{ background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827" }}>
                  {selectedPartnerIds.size}개 파트너 선택됨
                </p>
                <div className="ops-table-actions">
                  <button type="button" onClick={() => setSelectedPartnerIds(new Set())} className="ops-btn">
                    선택 해제
                  </button>
                  <button type="button" onClick={() => void bulkPartners(false)} disabled={bulkRunning} className="ops-btn ops-btn-danger">
                    일괄 반려
                  </button>
                  <button type="button" onClick={() => void bulkPartners(true)} disabled={bulkRunning} className="ops-btn ops-btn-primary">
                    일괄 승인
                  </button>
                </div>
              </article>
            ) : (
              <article className="ops-card">
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280", margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={partners.length > 0 && selectedPartnerIds.size === partners.length}
                    onChange={(e) =>
                      setSelectedPartnerIds(e.target.checked ? new Set(partners.map((p) => p.id)) : new Set())
                    }
                  />
                  전체 선택 ({partners.length}개)
                </label>
              </article>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {partners.map((p) => {
                const isUpdating = updating === p.id;
                const checked = selectedPartnerIds.has(p.id);
                return (
                  <article key={p.id} className="ops-card">
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: 12, minWidth: 0, flex: "1 1 280px" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSet(setSelectedPartnerIds, p.id)}
                          style={{ marginTop: 4 }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#111827" }}>{p.name}</h3>
                          <p className="ops-card-subtle">
                            {p.partnerType} · {p.industry} {p.companySize ? `· ${p.companySize}` : ""}
                          </p>
                          <p className="ops-card-subtle" style={{ marginTop: 2 }}>가입 {formatRelativeTime(p.createdAt)}</p>
                          {p.website ? <p style={{ fontSize: 12, color: "#374151", margin: "8px 0 0" }}>웹사이트: {p.website}</p> : null}
                          {p.officeAddress ? <p style={{ fontSize: 12, color: "#374151", margin: "4px 0 0" }}>주소: {p.officeAddress}</p> : null}
                          <div className="ops-tag-row" style={{ marginTop: 8 }}>
                            <span className={`ops-pill ${p.businessRegistrationDocumentData ? "ops-pill-green" : "ops-pill-amber"}`}>
                              사업자등록증 {p.businessRegistrationDocumentData ? "제출" : "미제출"}
                            </span>
                            <span className={`ops-pill ${p.fourInsuranceSubscriberListData ? "ops-pill-green" : "ops-pill-amber"}`}>
                              4대보험 {p.fourInsuranceSubscriberListData ? "제출" : "미제출"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ops-table-actions">
                        <button type="button" disabled={isUpdating} onClick={() => void rejectPartner(p.id)} className="ops-btn ops-btn-danger">
                          반려
                        </button>
                        <button type="button" disabled={isUpdating} onClick={() => void approvePartner(p.id)} className="ops-btn ops-btn-primary">
                          승인
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )
      ) : positions.length === 0 ? (
        <div className="ops-empty-card">검수 대기 중인 공고가 없습니다.</div>
      ) : (
        <>
          {selectedPositionIds.size > 0 ? (
            <article className="ops-card" style={{ background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827" }}>
                {selectedPositionIds.size}개 공고 선택됨
              </p>
              <div className="ops-table-actions">
                <button type="button" onClick={() => setSelectedPositionIds(new Set())} className="ops-btn">
                  선택 해제
                </button>
                <button type="button" onClick={() => void bulkPositions(false)} disabled={bulkRunning} className="ops-btn ops-btn-danger">
                  일괄 반려
                </button>
                <button type="button" onClick={() => void bulkPositions(true)} disabled={bulkRunning} className="ops-btn ops-btn-primary">
                  일괄 승인 → 게시
                </button>
              </div>
            </article>
          ) : (
            <article className="ops-card">
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280", margin: 0 }}>
                <input
                  type="checkbox"
                  checked={positions.length > 0 && selectedPositionIds.size === positions.length}
                  onChange={(e) =>
                    setSelectedPositionIds(e.target.checked ? new Set(positions.map((p) => p.id)) : new Set())
                  }
                />
                전체 선택 ({positions.length}개)
              </label>
            </article>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {positions.map((p) => {
              const isUpdating = updating === p.id;
              const checked = selectedPositionIds.has(p.id);
              return (
                <article key={p.id} className="ops-card">
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: 12, minWidth: 0, flex: "1 1 280px" }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSet(setSelectedPositionIds, p.id)}
                        style={{ marginTop: 4 }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#111827" }}>{p.title}</h3>
                        {p.partnerOrganizationName ? <p className="ops-card-subtle">{p.partnerOrganizationName}</p> : null}
                        <p className="ops-card-subtle" style={{ marginTop: 2 }}>등록 {formatRelativeTime(p.createdAt)}</p>
                      </div>
                    </div>
                    <div className="ops-table-actions">
                      <button type="button" disabled={isUpdating} onClick={() => void rejectPosition(p.id)} className="ops-btn ops-btn-danger">
                        반려
                      </button>
                      <button type="button" disabled={isUpdating} onClick={() => void approvePosition(p.id)} className="ops-btn ops-btn-primary">
                        승인 → 게시
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
