"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthSessionProvider } from "../../../../components/auth/AuthSessionProvider";
import { useAuthSession } from "../../../../components/auth/AuthSessionProvider";
import { LanguageProvider } from "../../../../components/i18n/LanguageProvider";
import { PartnerPositionCreatePage } from "../../../../components/pages/PartnerPositionCreatePage";
import { storeAccessToken } from "../../../../lib/auth-client";
import { getPartnerPositionStatusMeta, type PositionStatus } from "./position-status-meta";

const TOKEN_COOKIE_KEY = "partner_admin_token";

type SortField = "title" | "status" | "hiringCount" | "createdAt";
type SortOrder = "asc" | "desc";
type EmploymentType = "FULL_TIME" | "INTERN" | "PART_TIME" | "UNPAID_INTERN";
type EmploymentClassification =
  | "UNPAID_INTERN_EXPERIENCE"
  | "UNPAID_INTERN_CONVERSION"
  | "PAID_INTERN_EXPERIENCE"
  | "PAID_INTERN_CONVERSION"
  | "PART_TIME"
  | "FULL_TIME";
const VISA_OPTIONS = ["D-2", "D-4", "D-10", "E-7", "F-2", "F-4", "F-5", "F-6", "H-1"] as const;
const NO_VISA_OPTION = "NO_VISA_REQUIRED";

type PartnerPosition = {
  id: string;
  title: string;
  status: PositionStatus;
  employmentType: EmploymentType;
  employmentClassification?: EmploymentClassification | null;
  workType: "On-site" | "Hybrid" | "Remote" | null;
  workLocation: string | null;
  preferredJobRole: string | null;
  hiringCount: number | null;
  startDate: string | null;
  hiringProcess: string | null;
  mainResponsibilities: string | null;
  requiredQualifications: string | null;
  preferredQualifications: string | null;
  additionalNotes: string | null;
  eligibleVisas: string[];
  communicationLanguages: string[];
  preferredNationalities: string[];
  postingProgressLogs?: Array<{ id: string; message: string; createdAt: string }>;
  statusHistories?: Array<{ id: string; fromStatus: PositionStatus | null; toStatus: PositionStatus; note: string | null; createdAt: string }>;
  createdAt: string;
};

type PositionForm = {
  title: string;
  status: PositionStatus;
  workType: "On-site" | "Hybrid" | "Remote";
  employmentClassification: EmploymentClassification;
  preferredJobRole: string;
  hiringCount: string;
  workLocation: string;
  startDate: string;
  hiringProcess: string;
  mainResponsibilities: string;
  requiredQualifications: string;
  preferredQualifications: string;
  additionalNotes: string;
  eligibleVisas: string[];
  communicationLanguages: string;
  preferredNationalities: string;
};

const POSITION_STATUS_OPTIONS: PositionStatus[] = ["OPEN", "PAUSED", "CLOSED"];
// 필터 칩 순서(운영/지원자 목록과 동일한 카운트 칩 UX)
const STATUS_FILTER_ORDER: PositionStatus[] = ["OPEN", "PENDING_REVIEW", "DRAFT", "PAUSED", "CLOSED", "REJECTED"];

function readCookie(key: string) {
  if (typeof document === "undefined") return "";
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${key}=`));
  if (entry) return decodeURIComponent(entry.split("=")[1] ?? ""); try { return window.localStorage.getItem("platform_access_token") || ""; } catch { return ""; }
}

function PlatformPartnerSessionBridge() {
  const { setAuthenticatedUser } = useAuthSession();

  useEffect(() => {
    const token = readCookie(TOKEN_COOKIE_KEY);
    if (!token) return;
    storeAccessToken(token);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    void (async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          cache: "no-store"
        });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          ok?: boolean;
          user?: {
            id: string;
            email: string;
            realName?: string | null;
            name?: string | null;
            phoneNumber?: string | null;
            birthDate?: string | null;
            gender?: string | null;
            role: "STUDENT" | "PARTNER" | "OPERATOR";
            partnerType?: "UNIVERSITY" | "COMPANY" | "AGENCY" | null;
            partnerOrgRole?: "OWNER" | "ADMIN" | "MEMBER" | null;
          };
        };
        if (!payload.ok || !payload.user || payload.user.role !== "PARTNER") return;
        setAuthenticatedUser(payload.user);
      } catch {
        // no-op: modal will render login-required state if auth cannot be bridged
      }
    })();
  }, [setAuthenticatedUser]);

  return null;
}

function toEmploymentType(classification: EmploymentClassification): EmploymentType {
  if (classification === "FULL_TIME") return "FULL_TIME";
  if (classification === "PART_TIME") return "PART_TIME";
  if (classification === "UNPAID_INTERN_EXPERIENCE" || classification === "UNPAID_INTERN_CONVERSION") return "UNPAID_INTERN";
  return "INTERN";
}

function inferClassificationFromType(type: EmploymentType): EmploymentClassification {
  if (type === "FULL_TIME") return "FULL_TIME";
  if (type === "PART_TIME") return "PART_TIME";
  if (type === "UNPAID_INTERN") return "UNPAID_INTERN_EXPERIENCE";
  return "PAID_INTERN_EXPERIENCE";
}

function statusLabel(status: PositionStatus) {
  return getPartnerPositionStatusMeta(status).labelKo;
}

function statusBadgeTone(status: PositionStatus) {
  return getPartnerPositionStatusMeta(status).badgeTone;
}

function statusOptionClass(status: PositionStatus) {
  return getPartnerPositionStatusMeta(status).optionClass;
}

function employmentTypeDisplayTitle(
  value: EmploymentType,
  employmentClassification?: PartnerPosition["employmentClassification"]
) {
  if (employmentClassification === "UNPAID_INTERN_EXPERIENCE") return "무급 체험형 인턴";
  if (employmentClassification === "UNPAID_INTERN_CONVERSION") return "무급 전환형 인턴";
  if (employmentClassification === "PAID_INTERN_EXPERIENCE") return "유급 체험형 인턴";
  if (employmentClassification === "PAID_INTERN_CONVERSION") return "유급 전환형 인턴";
  if (employmentClassification === "PART_TIME") return "알바";
  if (employmentClassification === "FULL_TIME") return "정직원";
  if (value === "FULL_TIME") return "정직원";
  if (value === "PART_TIME") return "알바";
  if (value === "UNPAID_INTERN") return "무급 인턴";
  return "유급 인턴";
}

function workTypeDisplayTitle(value: string | null) {
  if (!value) return "-";
  const normalized = value.trim().toLowerCase();
  if (normalized === "on-site" || normalized === "onsite") return "오피스 출근";
  if (normalized === "hybrid") return "하이브리드";
  if (normalized === "remote") return "원격";
  return value;
}

function visaDisplayTitle(visa: string) {
  if (visa === NO_VISA_OPTION) return "비자 무관";
  if (visa === "D-2") return "D-2 (유학)";
  if (visa === "D-4") return "D-4 (일반연수)";
  if (visa === "D-10") return "D-10 (구직)";
  if (visa === "E-7") return "E-7 (특정활동)";
  if (visa === "F-2") return "F-2 (거주)";
  if (visa === "F-4") return "F-4 (재외동포)";
  if (visa === "F-5") return "F-5 (영주)";
  if (visa === "F-6") return "F-6 (결혼이민)";
  if (visa === "H-1") return "H-1 (관광취업)";
  return visa;
}

function compare(a: string, b: string, order: SortOrder) {
  const direction = order === "asc" ? 1 : -1;
  return a.localeCompare(b, "ko") * direction;
}

function compareNumber(a: number, b: number, order: SortOrder) {
  const direction = order === "asc" ? 1 : -1;
  return (a - b) * direction;
}

function toDateInput(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function toLinesText(lines: string[]) {
  return lines.join("\n");
}

function toLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function emptyForm(): PositionForm {
  return {
    title: "",
    status: "DRAFT",
    workType: "On-site",
    employmentClassification: "UNPAID_INTERN_EXPERIENCE",
    preferredJobRole: "",
    hiringCount: "",
    workLocation: "",
    startDate: "",
    hiringProcess: "",
    mainResponsibilities: "",
    requiredQualifications: "",
    preferredQualifications: "",
    additionalNotes: "",
    eligibleVisas: [],
    communicationLanguages: "",
    preferredNationalities: ""
  };
}

function formFromPosition(item: PartnerPosition): PositionForm {
  return {
    title: item.title,
    status: item.status,
    workType: item.workType ?? "On-site",
    employmentClassification: item.employmentClassification ?? inferClassificationFromType(item.employmentType),
    preferredJobRole: item.preferredJobRole ?? "",
    hiringCount: item.hiringCount ? String(item.hiringCount) : "",
    workLocation: item.workLocation ?? "",
    startDate: toDateInput(item.startDate),
    hiringProcess: item.hiringProcess ?? "",
    mainResponsibilities: item.mainResponsibilities ?? "",
    requiredQualifications: item.requiredQualifications ?? "",
    preferredQualifications: item.preferredQualifications ?? "",
    additionalNotes: item.additionalNotes ?? "",
    eligibleVisas: item.eligibleVisas ?? [],
    communicationLanguages: toLinesText(item.communicationLanguages ?? []),
    preferredNationalities: toLinesText(item.preferredNationalities ?? [])
  };
}

export default function PartnerPositionsPage() {
  const [items, setItems] = useState<PartnerPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PositionStatus>("ALL");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [openStatusModalId, setOpenStatusModalId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const reloadList = async () => {
    const token = readCookie(TOKEN_COOKIE_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/partner/positions`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (!response.ok) throw new Error("포지션 목록을 불러오지 못했습니다.");
      const payload = (await response.json()) as { ok: boolean; items: PartnerPosition[] };
      if (!payload.ok) throw new Error("포지션 목록을 불러오지 못했습니다.");
      setItems(payload.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "포지션 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reloadList();
  }, []);

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenStatusModalId(null);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  const filtered = useMemo(() => {
    let next = [...items];
    if (statusFilter !== "ALL") next = next.filter((item) => item.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      next = next.filter((item) => {
        return (
          item.title.toLowerCase().includes(q)
          || (item.preferredJobRole ?? "").toLowerCase().includes(q)
        );
      });
    }

    next.sort((a, b) => {
      if (sortField === "title") return compare(a.title, b.title, sortOrder);
      if (sortField === "status") return compare(a.status, b.status, sortOrder);
      if (sortField === "hiringCount") return compareNumber(a.hiringCount ?? 0, b.hiringCount ?? 0, sortOrder);
      return sortOrder === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return next;
  }, [items, search, sortField, sortOrder, statusFilter]);

  // 상태별 개수 — 필터 칩에 표시(전체 items 기준, 필터와 무관)
  const statusCounts = useMemo(() => {
    const c: Partial<Record<PositionStatus, number>> = {};
    for (const it of items) c[it.status] = (c[it.status] ?? 0) + 1;
    return c;
  }, [items]);

  const setSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortOrder(field === "createdAt" ? "desc" : "asc");
  };

  const updateStatus = async (id: string, status: PositionStatus) => {
    const token = readCookie(TOKEN_COOKIE_KEY);
    if (!token) return;

    // 마감은 지원자가 더 이상 지원할 수 없는 되돌리기 어려운 조치 — 확인을 받는다.
    if (status === "CLOSED" && !window.confirm("이 포지션을 마감하시겠습니까? 마감하면 지원자가 더 이상 지원할 수 없습니다.")) {
      return;
    }

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    setOpenStatusModalId(null);

    const response = await fetch(`${apiBaseUrl}/partner/positions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      await reloadList();
      window.alert("상태 변경에 실패했습니다.");
    }
  };

  const openCreate = () => {
    setModalMode("create");
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    setModalMode("edit");
    setEditingId(id);
    setModalOpen(true);
  };

  const clonePosition = async (id: string, title: string) => {
    const confirmed = window.confirm(`'${title}' 포지션을 복제하시겠습니까? 새 포지션이 초안(DRAFT) 상태로 생성됩니다.`);
    if (!confirmed) return;
    const token = readCookie(TOKEN_COOKIE_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/partner/positions/${id}/clone`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }
      setError(null);
      await reloadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "포지션 복제 실패");
    }
  };

  return (
    <section className="ops-content-section">
      <header>
        <h1>포지션 관리</h1>
        <p>내 회사가 등록한 포지션 목록과 현재 상태를 확인합니다.</p>
      </header>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>포지션 목록</h2>
          <button type="button" className="ops-partner-add-button" onClick={openCreate}>
            포지션 등록
          </button>
        </div>

        <div className="ops-position-filters">
          <input
            className="ops-partner-filter-search"
            placeholder="제목/희망직무 검색"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ flex: 1, minWidth: 240 }}
          />
        </div>
        {/* 상태 필터 — 각 상태별 개수를 한눈에(다른 목록과 동일한 카운트 칩) */}
        <div className="ops-filter-chip-row" role="tablist" aria-label="상태 필터">
          <button
            type="button"
            className={`ops-filter-chip ${statusFilter === "ALL" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("ALL")}
          >
            전체 <span className="ops-filter-chip-count">{items.length}</span>
          </button>
          {STATUS_FILTER_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              className={`ops-filter-chip ${statusFilter === s ? "is-active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {statusLabel(s)} <span className="ops-filter-chip-count">{statusCounts[s] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="ops-partner-table-wrap ops-position-list-table-wrap">
          <table className="ops-partner-table ops-position-list-table">
            <colgroup>
              <col style={{ width: "24%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "28%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <button type="button" className="ops-th-sort" onClick={() => setSort("title")}>
                    제목
                  </button>
                </th>
                <th>
                  <button type="button" className="ops-th-sort" onClick={() => setSort("status")}>
                    상태
                  </button>
                </th>
                <th>희망 직무</th>
                <th>
                  <button type="button" className="ops-th-sort" onClick={() => setSort("hiringCount")}>
                    희망 인원
                  </button>
                </th>
                <th>
                  <button type="button" className="ops-th-sort" onClick={() => setSort("createdAt")}>
                    등록일
                  </button>
                </th>
                <th>상세정보</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="ops-table-empty">불러오는 중...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="ops-table-empty">{error}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="ops-table-empty">등록된 포지션이 없습니다.</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="ops-clickable-row" onClick={() => openEdit(item.id)}>
                    <td><span className="ops-cell-clamp-3">{item.title}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="ops-status-menu-wrap">
                        <button
                          type="button"
                          className={`ops-status-badge ${statusBadgeTone(item.status)} is-clickable`}
                          onClick={() => setOpenStatusModalId(item.id)}
                        >
                          {statusLabel(item.status)}
                        </button>
                      </div>
                    </td>
                    <td><span className="ops-cell-clamp-3">{item.preferredJobRole ?? "-"}</span></td>
                    <td><span className="ops-cell-clamp-3">{item.hiringCount ? `${item.hiringCount}명` : "-"}</span></td>
                    <td><span className="ops-cell-clamp-3">{new Date(item.createdAt).toLocaleDateString("ko-KR")}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="ops-inline-actions">
                        <button type="button" className="ops-detail-button" onClick={() => openEdit(item.id)}>
                          수정
                        </button>
                        <button type="button" className="ops-detail-button" onClick={() => void clonePosition(item.id, item.title)}>
                          복제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
      {openStatusModalId ? (
        <div
          className="ops-modal-backdrop"
          onClick={() => setOpenStatusModalId(null)}
        >
          <div className="ops-modal-panel ops-status-change-modal" onClick={(event) => event.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>상태 변경</h3>
            <p style={{ margin: "8px 0 0", color: "var(--ink-faint)", fontSize: 13 }}>변경할 상태를 선택하세요.</p>
            <div className="ops-status-change-grid" style={{ marginTop: 14 }}>
              {POSITION_STATUS_OPTIONS.map((status) => {
                const current = items.find((item) => item.id === openStatusModalId)?.status;
                return (
                  <button
                    key={status}
                    type="button"
                    className={`ops-status-change-button ${statusOptionClass(status)} ${current === status ? "is-active" : ""}`}
                    onClick={() => void updateStatus(openStatusModalId, status)}
                  >
                    {statusLabel(status)}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
              <button type="button" className="ops-detail-button" onClick={() => setOpenStatusModalId(null)}>닫기</button>
            </div>
          </div>
        </div>
      ) : null}

      {modalOpen ? (
        <div className="platform-embed-theme">
          <LanguageProvider>
            <AuthSessionProvider>
              <PlatformPartnerSessionBridge />
              <PartnerPositionCreatePage
                embedded
                mode={modalMode}
                positionId={editingId ?? undefined}
                onEmbeddedClose={() => {
                  setModalOpen(false);
                  void reloadList();
                }}
              />
            </AuthSessionProvider>
          </LanguageProvider>
        </div>
      ) : null}
    </section>
  );
}
