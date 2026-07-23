"use client";

import Link from "next/link";
import { PushPin, Clock } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../lib/auth-client";
import { useToast } from "../../../../components/toast/ToastProvider";

// 상태 변경 시 지원자에게 알림이 나가는 상태(면접/합격/불합격) — 파트너에게 이를 알린다.
const NOTIFY_STATUSES: ApplicationStatus[] = ["INTERVIEW", "ACCEPTED", "REJECTED"];
import { getApplicationStatusLabel, type ApplicationStatus } from "../../../../lib/status-labels";
import { ReportIssueModal } from "../../../../components/issues/ReportIssueModal";
import { downloadCsv, formatCsvDate } from "../../../../lib/csv-export";

type PartnerApplication = {
  id: string;
  positionId: string;
  positionTitle: string;
  candidateUserId: string;
  candidateName: string | null;
  // 연락처는 면접 요청 후에만 공개 — 그 전에는 null.
  candidateEmail: string | null;
  candidateNationality: string | null;
  contactUnlocked?: boolean;
  status: ApplicationStatus;
  memo: string | null;
  submittedAt: string;
  updatedAt: string;
  // 안 읽은 지원자 메시지 수(뱃지용)
  unreadMessages: number;
};

const STATUS_FLOW: { value: ApplicationStatus; label: string }[] = [
  { value: "SUBMITTED", label: "검토 중" },
  { value: "INTERVIEW", label: "면접 예정" },
  { value: "ACCEPTED", label: "합격" },
  { value: "REJECTED", label: "불합격" }
];

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

export default function PartnerApplicantsPage() {
  const [items, setItems] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "ALL">("ALL");
  const [updating, setUpdating] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<PartnerApplication | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("ALL");
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  const toast = useToast();

  // 리포트 등에서 ?status= / ?position= 로 딥링크되면 초기 필터를 맞춘다(useSearchParams 대신 window 로 읽어 Suspense 불필요).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const s = sp.get("status");
    if (s && ["ALL", "SUBMITTED", "INTERVIEW", "ACCEPTED", "REJECTED"].includes(s)) {
      setFilterStatus(s as ApplicationStatus | "ALL");
    }
    const pos = sp.get("position");
    if (pos) setPositionFilter(pos);
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = readAccessToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBaseUrl}/partner/applications`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store"
      });
      if (!response.ok) {
        if (response.status === 403) throw new Error("회사 정보를 먼저 등록해야 지원자 목록을 볼 수 있어요.");
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as { ok?: boolean; items?: PartnerApplication[] };
      setItems(payload.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "지원자 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    const label = STATUS_FLOW.find((s) => s.value === status)?.label ?? status;
    const notifies = NOTIFY_STATUSES.includes(status);
    // 변경 전 확인 — 지원자에게 알림이 나간다는 것을 명확히 알린다(특히 합격/불합격).
    if (notifies) {
      const msg =
        status === "ACCEPTED" || status === "REJECTED"
          ? `이 지원자를 '${label}'(으)로 처리할까요?\n지원자에게 결과 이메일·서비스 알림이 전송됩니다.`
          : `상태를 '${label}'(으)로 변경할까요?\n지원자에게 이메일·서비스 알림이 전송됩니다.`;
      if (!window.confirm(msg)) return;
    }
    setUpdating(applicationId);
    try {
      const token = readAccessToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBaseUrl}/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setItems((prev) => prev.map((it) => (it.id === applicationId ? { ...it, status } : it)));
      setActionError(null);
      toast.success(notifies ? `'${label}'(으)로 변경했어요. 지원자에게 알림을 보냈어요.` : `'${label}'(으)로 변경했어요.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "상태 변경 실패");
      toast.error("상태 변경에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setUpdating(null);
    }
  }

  // 검색(이름/이메일/포지션) + 포지션 필터는 목록·칸반 양쪽에 적용된다.
  const filteredBase = useMemo(() => {
    let next = items;
    if (positionFilter !== "ALL") next = next.filter((it) => it.positionId === positionFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      next = next.filter(
        (it) =>
          (it.candidateName ?? "").toLowerCase().includes(q) ||
          (it.candidateEmail ?? "").toLowerCase().includes(q) ||
          it.positionTitle.toLowerCase().includes(q)
      );
    }
    return next;
  }, [items, search, positionFilter]);

  // 상태 칩은 목록 뷰에만 적용(칸반은 컬럼이 상태이므로).
  const filtered = useMemo(() => {
    if (filterStatus === "ALL") return filteredBase;
    return filteredBase.filter((it) => it.status === filterStatus);
  }, [filteredBase, filterStatus]);

  // 포지션 필터 드롭다운용 — 지원이 있는 포지션 목록(중복 제거).
  const positionOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of items) if (!map.has(it.positionId)) map.set(it.positionId, it.positionTitle);
    return Array.from(map, ([id, title]) => ({ id, title }));
  }, [items]);

  async function bulkUpdateStatus(status: ApplicationStatus) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const label = STATUS_FLOW.find((s) => s.value === status)?.label ?? status;
    const notifies = NOTIFY_STATUSES.includes(status);
    const confirmMsg = `선택한 ${ids.length}명을 '${label}'(으)로 변경할까요?${notifies ? "\n각 지원자에게 이메일·서비스 알림이 전송됩니다." : ""}`;
    if (!window.confirm(confirmMsg)) return;
    setBulkRunning(true);
    setActionError(null);
    try {
      const token = readAccessToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      await Promise.all(
        ids.map((id) =>
          fetch(`${apiBaseUrl}/applications/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ status })
          })
        )
      );
      setItems((prev) => prev.map((it) => (selectedIds.has(it.id) ? { ...it, status } : it)));
      setSelectedIds(new Set());
      toast.success(notifies ? `${ids.length}명을 '${label}'(으)로 변경하고 알림을 보냈어요.` : `${ids.length}명을 '${label}'(으)로 변경했어요.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "일괄 상태 변경 실패");
      toast.error("일괄 변경에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setBulkRunning(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const counts = useMemo(() => {
    const result: Record<ApplicationStatus | "ALL", number> = {
      ALL: filteredBase.length,
      SUBMITTED: 0,
      INTERVIEW: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      WITHDRAWN: 0
    };
    for (const it of filteredBase) result[it.status] += 1;
    return result;
  }, [filteredBase]);

  return (
    <section className="ops-content-section">
      <header>
        <h1>지원자 관리</h1>
        <p>회사가 받은 지원을 상태별로 검토하고 다음 단계로 이동시키세요.</p>
      </header>

      <article className="ops-card">
        <div className="ops-card-header" style={{ gap: 10 }}>
          <div className="ops-row" style={{ gap: 8, flexWrap: "wrap" }}>
            <input
              className="ops-partner-filter-search"
              placeholder="이름·이메일·포지션 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 220 }}
            />
            <select className="ops-select" value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)} style={{ width: "auto", minWidth: 150 }}>
              <option value="ALL">전체 포지션</option>
              {positionOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.title}</option>
              ))}
            </select>
          </div>
          <div className="ops-row">
            <div className="ops-view-toggle">
              <button type="button" className={viewMode === "table" ? "is-active" : ""} onClick={() => setViewMode("table")}>
                목록
              </button>
              <button type="button" className={viewMode === "kanban" ? "is-active" : ""} onClick={() => setViewMode("kanban")}>
                칸반
              </button>
            </div>
            <button
              type="button"
              className="ops-btn"
              onClick={() => {
                const statusKo: Record<string, string> = {
                  SUBMITTED: "검토 중",
                  INTERVIEW: "면접 예정",
                  ACCEPTED: "합격",
                  REJECTED: "불합격",
                  WITHDRAWN: "철회"
                };
                downloadCsv(
                  "applicants",
                  ["지원자", "이메일", "국적", "포지션", "상태", "메모", "지원 시점"],
                  filtered.map((it) => [
                    it.candidateName ?? "",
                    it.candidateEmail ?? "",
                    it.candidateNationality ?? "",
                    it.positionTitle,
                    statusKo[it.status] ?? it.status,
                    it.memo ?? "",
                    formatCsvDate(it.submittedAt)
                  ])
                );
              }}
              disabled={filtered.length === 0}
            >
              CSV
            </button>
          </div>
        </div>
      </article>

      {/* 상태 칩은 목록 뷰에만 — 칸반은 컬럼 자체가 상태이므로 숨긴다 */}
      {viewMode === "table" ? (
        <div className="ops-filter-chip-row">
          {(["ALL", "SUBMITTED", "INTERVIEW", "ACCEPTED", "REJECTED"] as const).map((key) => {
            const active = filterStatus === key;
            const label = key === "ALL" ? "전체" : STATUS_FLOW.find((s) => s.value === key)?.label;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilterStatus(key)}
                className={`ops-filter-chip ${active ? "is-active" : ""}`}
              >
                {label} <span className="ops-filter-chip-count">{counts[key]}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {actionError ? <div className="ops-error-card">{actionError}</div> : null}

      {selectedIds.size > 0 && viewMode === "table" ? (
        <article className="ops-card" style={{ background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
            {selectedIds.size}명 선택됨
          </p>
          <div className="ops-table-actions">
            <button type="button" onClick={() => setSelectedIds(new Set())} className="ops-btn">
              선택 해제
            </button>
            <select
              className="ops-select ops-select-inline"
              disabled={bulkRunning}
              defaultValue=""
              onChange={(e) => {
                const val = e.target.value as ApplicationStatus;
                if (val) void bulkUpdateStatus(val);
                e.target.value = "";
              }}
              style={{ minWidth: 160 }}
            >
              <option value="">일괄 상태 변경...</option>
              {STATUS_FLOW.map((s) => (
                <option key={s.value} value={s.value}>{s.label}로 변경</option>
              ))}
            </select>
          </div>
        </article>
      ) : null}

      {loading ? (
        <div className="ops-empty-card">지원자 목록을 불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : filtered.length === 0 && viewMode === "table" ? (
        <div className="ops-empty-card">해당 상태의 지원자가 없습니다.</div>
      ) : viewMode === "kanban" ? (
        <div className="ops-kanban">
          {STATUS_FLOW.map((stage) => {
            const stageItems = filteredBase.filter((it) => it.status === stage.value);
            return (
              <div key={stage.value} className="ops-kanban-column">
                <div className="ops-kanban-column-head">
                  <span className="ops-kanban-column-title">{stage.label}</span>
                  <span className="ops-kanban-column-count">{stageItems.length}</span>
                </div>
                {stageItems.length === 0 ? (
                  <p className="ops-kanban-empty">없음</p>
                ) : (
                  stageItems.map((it) => {
                    const isUpdating = updating === it.id;
                    return (
                      <div key={it.id} className="ops-kanban-card">
                        <Link href={`/dashboard/partner/applicants/${it.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                          <p className="ops-kanban-card-name" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {it.candidateName ?? "-"}
                            {it.unreadMessages > 0 ? (
                              <span title="새 메시지" style={{ display: "inline-flex", minWidth: 16, height: 16, padding: "0 4px", alignItems: "center", justifyContent: "center", borderRadius: 999, background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700 }}>
                                {it.unreadMessages > 9 ? "9+" : it.unreadMessages}
                              </span>
                            ) : null}
                          </p>
                          <p className="ops-kanban-card-sub">{it.candidateEmail ?? "연락처 비공개(면접 요청 후)"}</p>
                          {it.candidateNationality ? <p className="ops-kanban-card-sub">{it.candidateNationality}</p> : null}
                          <p className="ops-kanban-card-sub" style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                            <PushPin size={12} weight="bold" aria-hidden /> {it.positionTitle}
                          </p>
                          <p className="ops-kanban-card-sub" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock size={12} weight="bold" aria-hidden /> {formatRelativeTime(it.submittedAt)}
                          </p>
                        </Link>
                        <div className="ops-kanban-card-actions">
                          <select
                            value={it.status}
                            disabled={isUpdating}
                            onChange={(e) => void updateStatus(it.id, e.target.value as ApplicationStatus)}
                            className="ops-select"
                          >
                            {STATUS_FLOW.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <article className="ops-table-card">
          <table>
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "30%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every((it) => selectedIds.has(it.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set([...selectedIds, ...filtered.map((it) => it.id)]));
                      } else {
                        const next = new Set(selectedIds);
                        for (const it of filtered) next.delete(it.id);
                        setSelectedIds(next);
                      }
                    }}
                  />
                </th>
                <th>지원자</th>
                <th>포지션</th>
                <th>상태</th>
                <th>지원 시점</th>
                <th style={{ textAlign: "right" }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => {
                const badge = getApplicationStatusLabel(it.status, "partner");
                const isUpdating = updating === it.id;
                return (
                  <tr key={it.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(it.id)}
                        onChange={() => toggleSelect(it.id)}
                      />
                    </td>
                    <td>
                      <div className="ops-row-strong" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {it.candidateName ?? "-"}
                        {it.unreadMessages > 0 ? (
                          <span title="새 메시지" style={{ display: "inline-flex", minWidth: 16, height: 16, padding: "0 4px", alignItems: "center", justifyContent: "center", borderRadius: 999, background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700 }}>
                            {it.unreadMessages > 9 ? "9+" : it.unreadMessages}
                          </span>
                        ) : null}
                      </div>
                      <div className="ops-row-sub">{it.candidateEmail ?? "연락처 비공개(면접 요청 후)"}</div>
                      {it.candidateNationality ? <div className="ops-row-sub">{it.candidateNationality}</div> : null}
                    </td>
                    <td>{it.positionTitle}</td>
                    <td>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="ops-row-sub">{formatRelativeTime(it.submittedAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <div className="ops-table-actions" style={{ justifyContent: "flex-end" }}>
                        <Link href={`/dashboard/partner/applicants/${it.id}`} className="ops-btn">
                          상세
                        </Link>
                        <button type="button" onClick={() => setReportTarget(it)} className="ops-btn ops-btn-danger">
                          이슈 신고
                        </button>
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </article>
      )}

      <ReportIssueModal
        open={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        defaultApplicationId={reportTarget?.id}
        defaultPositionId={reportTarget?.positionId}
        defaultSubjectUserId={reportTarget?.candidateUserId}
      />
    </section>
  );
}
