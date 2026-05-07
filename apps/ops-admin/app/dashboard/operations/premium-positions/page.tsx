"use client";

import { UploadSimple, X } from "@phosphor-icons/react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { getOpsBadgeClassName } from "../../partners/_components/OpsBadge";
import { PartnerUnifiedDetailModal } from "../../partners/_components/PartnerUnifiedDetailModal";
import { getOpsPositionStatusMeta, type PositionStatus } from "../../_components/position-status-meta";

const TOKEN_COOKIE_KEY = "ops_admin_token";

type DetailTabKey = "basic" | "matching" | "logs" | "memo";

type PositionParticipant = {
  id: string;
  name: string;
  note: string | null;
  createdAt: string;
  createdBy: { id: string; name: string | null; email: string } | null;
};

type PositionProgressLog = {
  id: string;
  message: string;
  createdAt: string;
  createdBy: { id: string; name: string | null; email: string } | null;
};

type PositionStatusHistory = {
  id: string;
  fromStatus: PositionStatus | null;
  toStatus: PositionStatus;
  note: string | null;
  createdAt: string;
  createdBy: { id: string; name: string | null; email: string } | null;
};

type PremiumBannerMeta = {
  enabled: boolean;
  bannerImageUrl: string | null;
  bannerTitle: string | null;
  bannerSubtitle: string | null;
  priority: number | null;
} | null;

type PositionItem = {
  id: string;
  title: string;
  status: PositionStatus;
  preferredJobRole?: string | null;
  hiringCount?: number | null;
  thumbnailImages?: string[];
  matchingParticipants?: PositionParticipant[];
  postingProgressLogs?: PositionProgressLog[];
  statusHistories?: PositionStatusHistory[];
  preferredNationalities?: string[];
  communicationLanguages?: string[];
  hiringProcess?: string | null;
  workingHours?: string | null;
  mainResponsibilities?: string | null;
  requiredQualifications?: string | null;
  preferredQualifications?: string | null;
  dressCode?: string | null;
  wantsPreTraining?: boolean | null;
  additionalNotes?: string | null;
  adminMemo?: string | null;
  createdAt: string;
  partnerOrganization: {
    id: string;
    name: string;
    domain: string;
  } | null;
  premiumBanner: PremiumBannerMeta;
};

type PartnerDetailItem = {
  id: string;
  partnerType: "UNIVERSITY" | "COMPANY" | "AGENCY";
  domain: string;
  name: string;
  companySize: "SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100" | null;
  officeAddress: string | null;
  website: string | null;
  socialMedia: string | null;
  industry: string;
  description: string | null;
  strengths: string | null;
  adminMemo: string | null;
  createdAt: string;
  memberCount: number;
};

type PremiumForm = {
  enabled: boolean;
  bannerImageUrl: string;
  bannerTitle: string;
  bannerSubtitle: string;
  priority: string;
};

function readCookie(key: string) {
  if (typeof document === "undefined") return "";
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${key}=`));
  return entry ? decodeURIComponent(entry.split("=")[1] ?? "") : "";
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR");
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR");
}

function statusLabel(status: PositionStatus) {
  return getOpsPositionStatusMeta(status).labelKo;
}

function statusTone(status: PositionStatus) {
  return getOpsPositionStatusMeta(status).tone;
}

function premiumIneligibilityReasons(item: PositionItem) {
  const reasons: string[] = [];
  if (item.status !== "OPEN") {
    reasons.push("상태가 OPEN 아님");
  }
  const directBanner = item.premiumBanner?.bannerImageUrl?.trim() ?? "";
  const fallbackImage = (item.thumbnailImages ?? []).find((image) => image.trim().length > 0) ?? "";
  if (!directBanner && !fallbackImage) {
    reasons.push("배너 이미지 없음");
  }
  return reasons;
}

function formFromItem(item: PositionItem | null): PremiumForm {
  return {
    enabled: item?.premiumBanner?.enabled ?? true,
    bannerImageUrl: item?.premiumBanner?.bannerImageUrl ?? "",
    bannerTitle: item?.premiumBanner?.bannerTitle ?? "",
    bannerSubtitle: item?.premiumBanner?.bannerSubtitle ?? "",
    priority:
      item?.premiumBanner?.priority !== null && item?.premiumBanner?.priority !== undefined
        ? String(item.premiumBanner.priority)
        : ""
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function PremiumPositionsPage() {
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<PositionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<"register" | "manage">("register");
  const [registerStep, setRegisterStep] = useState<"pick" | "edit">("pick");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPositionDetailModalOpen, setIsPositionDetailModalOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTabKey>("basic");
  const [detailItem, setDetailItem] = useState<PositionItem | null>(null);
  const [premiumSearch, setPremiumSearch] = useState("");
  const [premiumDebouncedSearch, setPremiumDebouncedSearch] = useState("");
  const [premiumPageSize, setPremiumPageSize] = useState<20 | 40 | 100>(20);
  const [registerSearch, setRegisterSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<PremiumForm>(formFromItem(null));
  const [isPartnerDetailModalOpen, setIsPartnerDetailModalOpen] = useState(false);
  const [partnerDetail, setPartnerDetail] = useState<PartnerDetailItem | null>(null);

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId]);

  const appliedPremiumItems = useMemo(() => {
    return items
      .filter((item) => item.premiumBanner?.enabled)
      .sort((a, b) => {
        const aPriority = a.premiumBanner?.priority ?? 9_999;
        const bPriority = b.premiumBanner?.priority ?? 9_999;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [items]);

  const registerSearchResults = useMemo(() => {
    const q = registerSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const partner = item.partnerOrganization?.name ?? "";
      return `${item.title} ${partner}`.toLowerCase().includes(q);
    });
  }, [items, registerSearch]);

  const filteredPremiumItems = useMemo(() => {
    const q = premiumDebouncedSearch.trim().toLowerCase();
    if (!q) return appliedPremiumItems;
    return appliedPremiumItems.filter((item) => {
      const partner = item.partnerOrganization?.name ?? "";
      return `${item.title} ${partner}`.toLowerCase().includes(q);
    });
  }, [appliedPremiumItems, premiumDebouncedSearch]);

  const visiblePremiumItems = useMemo(
    () => filteredPremiumItems.slice(0, premiumPageSize),
    [filteredPremiumItems, premiumPageSize]
  );

  async function fetchPositions() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const params = new URLSearchParams({
        sortBy: "createdAt",
        sortOrder: "desc",
        page: "1",
        pageSize: "100"
      });
      const response = await fetch(`${apiBaseUrl}/ops/positions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as { ok?: boolean; items?: PositionItem[]; message?: string };
      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "포지션 목록을 불러오지 못했습니다.");
        return;
      }
      setItems(payload.items ?? []);
    } catch {
      setErrorMessage("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchPositions();
  }, []);

  useEffect(() => {
    if (!selectedItem) return;
    setForm(formFromItem(selectedItem));
    setUploadErrorMessage(null);
  }, [selectedItem]);

  useEffect(() => {
    const timeout = setTimeout(() => setPremiumDebouncedSearch(premiumSearch), 400);
    return () => clearTimeout(timeout);
  }, [premiumSearch]);

  function openRegisterModal() {
    setModalMode("register");
    setRegisterStep("pick");
    setRegisterSearch("");
    setSelectedId(null);
    setForm(formFromItem(null));
    setUploadErrorMessage(null);
    setIsModalOpen(true);
  }

  function openManageModal(item: PositionItem) {
    setModalMode("manage");
    setRegisterStep("edit");
    setRegisterSearch("");
    setSelectedId(item.id);
    setUploadErrorMessage(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setRegisterStep("pick");
    setUploadErrorMessage(null);
  }

  function selectPositionForRegister(item: PositionItem) {
    setSelectedId(item.id);
    setForm(formFromItem(item));
    setRegisterStep("edit");
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function openPositionDetailModal(item: PositionItem) {
    setDetailItem(item);
    setDetailTab("basic");
    setIsPositionDetailModalOpen(true);
  }

  function closePositionDetailModal() {
    setIsPositionDetailModalOpen(false);
    setDetailItem(null);
  }

  function requestClosePartnerDetailModal() {
    setIsPartnerDetailModalOpen(false);
    setPartnerDetail(null);
  }

  function openPartnerDetailModal(partner: PositionItem["partnerOrganization"]) {
    if (!partner) return;
    setPartnerDetail({
      id: partner.id,
      name: partner.name,
      domain: partner.domain,
      partnerType: "COMPANY",
      companySize: null,
      officeAddress: null,
      website: null,
      socialMedia: null,
      industry: "IT",
      description: null,
      strengths: null,
      adminMemo: null,
      createdAt: new Date().toISOString(),
      memberCount: 0
    });
    setIsPartnerDetailModalOpen(true);
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadErrorMessage("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadErrorMessage("이미지 크기는 2MB 이하로 업로드해주세요.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (!dataUrl) {
        setUploadErrorMessage("이미지 변환에 실패했습니다.");
        return;
      }
      setUploadErrorMessage(null);
      setForm((prev) => ({ ...prev, bannerImageUrl: dataUrl }));
    } catch {
      setUploadErrorMessage("이미지 업로드 처리 중 오류가 발생했습니다.");
    }
  }

  async function savePremium() {
    if (!selectedItem) {
      window.alert("먼저 포지션을 선택해주세요.");
      return;
    }

    setSaving(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/positions/${selectedItem.id}/premium-banner`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          enabled: form.enabled,
          bannerImageUrl: form.bannerImageUrl.trim() || null,
          bannerTitle: form.bannerTitle.trim() || null,
          bannerSubtitle: form.bannerSubtitle.trim() || null,
          priority: form.priority.trim() ? Number(form.priority) : null
        })
      });
      const payload = (await response.json()) as { ok?: boolean; item?: PositionItem; message?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? "프리미엄 배너 저장에 실패했습니다.");
        return;
      }
      setItems((prev) => prev.map((item) => (item.id === payload.item!.id ? payload.item! : item)));
      setSelectedId(payload.item.id);
      setIsModalOpen(false);
      setRegisterStep("pick");
      window.alert("저장되었습니다.");
    } catch {
      window.alert("프리미엄 배너 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="ops-content-section">
      <header>
        <h1>프리미엄 포지션 관리</h1>
        <p>프리미엄 적용 포지션만 목록에 표시됩니다.</p>
      </header>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>프리미엄 포지션 목록</h2>
          <button type="button" className="ops-action-save" onClick={openRegisterModal}>
            프리미엄 포지션 등록하기
          </button>
        </div>

        {errorMessage ? <p className="ops-form-error">{errorMessage}</p> : null}

        <div className="ops-partner-filters ops-position-filters" style={{ marginTop: 12 }}>
          <input
            value={premiumSearch}
            onChange={(event) => setPremiumSearch(event.target.value)}
            placeholder="프리미엄 포지션 검색 (포지션명/기업명)"
            className="ops-partner-filter-search"
          />
          <div className="ops-position-filter-right">
            <select
              value={String(premiumPageSize)}
              onChange={(event) => setPremiumPageSize(Number(event.target.value) as 20 | 40 | 100)}
            >
              <option value="20">20개</option>
              <option value="40">40개</option>
              <option value="100">100개</option>
            </select>
          </div>
        </div>

        <div className="ops-partner-table-wrap ops-position-list-table-wrap" style={{ marginTop: 12 }}>
          <table className="ops-partner-table ops-position-list-table">
            <colgroup>
              <col style={{ width: "17%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>제목</th>
                <th>상태</th>
                <th>파트너사</th>
                <th>희망 직무</th>
                <th>희망 인원</th>
                <th>등록일</th>
                <th style={{ textAlign: "center" }}>상세정보</th>
                <th style={{ textAlign: "center" }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="ops-table-empty">목록을 불러오는 중입니다...</td>
                </tr>
              ) : visiblePremiumItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="ops-table-empty">
                    {premiumDebouncedSearch.trim() ? "검색 결과가 없습니다." : "적용된 프리미엄 포지션이 없습니다."}
                  </td>
                </tr>
              ) : (
                visiblePremiumItems.map((item) => (
                  <tr key={item.id} className="ops-clickable-row" onClick={() => openManageModal(item)}>
                    <td><span className="ops-cell-clamp-3">{item.title}</span></td>
                    <td>
                      <span className={getOpsBadgeClassName(statusTone(item.status))}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      {item.partnerOrganization ? (
                        <button
                          type="button"
                          className="ops-link-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openPartnerDetailModal(item.partnerOrganization);
                          }}
                        >
                          <span className="ops-cell-clamp-3">{item.partnerOrganization.name}</span>
                        </button>
                      ) : (
                        <span className="ops-cell-clamp-3">-</span>
                      )}
                    </td>
                    <td><span className="ops-cell-clamp-3">{item.preferredJobRole ?? "-"}</span></td>
                    <td><span className="ops-cell-clamp-3">{item.hiringCount ? `${item.hiringCount}명` : "-"}</span></td>
                    <td><span className="ops-cell-clamp-3">{formatDate(item.createdAt)}</span></td>
                    <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                      <button
                        type="button"
                        className="ops-detail-button"
                        style={{ display: "inline-flex", width: 84, alignItems: "center", justifyContent: "center" }}
                        onClick={(event) => {
                          event.stopPropagation();
                          openPositionDetailModal(item);
                        }}
                      >
                        상세정보
                      </button>
                    </td>
                    <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                      <button
                        type="button"
                        className="ops-action-save"
                        style={{ display: "inline-flex", width: 84, alignItems: "center", justifyContent: "center" }}
                        onClick={(event) => {
                          event.stopPropagation();
                          openManageModal(item);
                        }}
                      >
                        관리
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      {isModalOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 70
          }}
          onClick={closeModal}
        >
          <div style={{ width: "min(100%, 1140px)", maxWidth: "calc(100% - 24px)" }} onClick={(event) => event.stopPropagation()}>
            <article className="ops-modal-card ops-detail-modal-card">
              <div className="ops-modal-fixed-top">
                <div className="ops-modal-header">
                  <h2>{modalMode === "register" ? "프리미엄 포지션 등록" : "프리미엄 포지션 관리"}</h2>
                  <button type="button" aria-label="닫기" className="ops-modal-close" onClick={closeModal}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="ops-modal-scroll-body">
                <div className="ops-position-basic-sections-scroll">

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => {
                void onFileChange(event);
              }}
              style={{ display: "none" }}
            />

            {modalMode === "register" ? (
              registerStep === "pick" ? (
                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  <div className="ops-partner-filters ops-position-filters">
                    <input
                      value={registerSearch}
                      onChange={(event) => setRegisterSearch(event.target.value)}
                      placeholder="제목, 파트너사, 희망 직무 검색"
                      className="ops-partner-filter-search"
                    />
                  </div>

                  <div className="ops-partner-table-wrap ops-position-list-table-wrap">
                    <table className="ops-partner-table ops-position-list-table">
                      <colgroup>
                        <col style={{ width: "19%" }} />
                        <col style={{ width: "9%" }} />
                        <col style={{ width: "14%" }} />
                        <col style={{ width: "23%" }} />
                        <col style={{ width: "11%" }} />
                        <col style={{ width: "12%" }} />
                        <col style={{ width: "12%" }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>제목</th>
                          <th>상태</th>
                          <th>파트너사</th>
                          <th>희망 직무</th>
                          <th>희망 인원</th>
                          <th>등록일</th>
                          <th>선택</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registerSearchResults.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="ops-table-empty">검색 결과가 없습니다.</td>
                          </tr>
                        ) : (
                          registerSearchResults.map((item) => (
                            <tr key={item.id} className="ops-clickable-row" onClick={() => selectPositionForRegister(item)}>
                              <td><span className="ops-cell-clamp-3">{item.title}</span></td>
                              <td>
                                <span className={getOpsBadgeClassName(statusTone(item.status))}>
                                  {statusLabel(item.status)}
                                </span>
                              </td>
                              <td><span className="ops-cell-clamp-3">{item.partnerOrganization?.name ?? "-"}</span></td>
                              <td><span className="ops-cell-clamp-3">{item.preferredJobRole ?? "-"}</span></td>
                              <td><span className="ops-cell-clamp-3">{item.hiringCount ? `${item.hiringCount}명` : "-"}</span></td>
                              <td><span className="ops-cell-clamp-3">{formatDate(item.createdAt)}</span></td>
                              <td>
                                <button
                                  type="button"
                                  className="ops-detail-button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    selectPositionForRegister(item);
                                  }}
                                >
                                  선택
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null
            ) : null}

            {selectedItem && (modalMode === "manage" || registerStep === "edit") ? (
              <>
                <p style={{ margin: "14px 0 0", fontSize: 13, color: "#4b5563" }}>
                  선택 포지션: {selectedItem.title} · {selectedItem.partnerOrganization?.name ?? "기업 정보 없음"}
                </p>

                <div
                  style={{
                    marginTop: 12,
                    width: "calc(200px * 16 / 9)",
                    marginLeft: "auto",
                    marginRight: "auto",
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                    aspectRatio: "16 / 9",
                    height: 200,
                    position: "relative",
                    background: form.bannerImageUrl
                      ? `center / cover no-repeat url(${form.bannerImageUrl})`
                      : "linear-gradient(120deg, #111827 0%, #374151 100%)"
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%)"
                    }}
                  />
                  <div style={{ position: "absolute", left: 14, bottom: 12, color: "#fff" }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
                      {form.bannerTitle.trim() || "[목업] 프리미엄 포지션 타이틀"}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.9 }}>
                      {form.bannerSubtitle.trim() || "배너 서브타이틀 미리보기"}
                    </p>
                  </div>
                </div>

                <section className="ops-detail-section" style={{ marginTop: 14 }}>
                  <h3 style={{ marginBottom: 12 }}>배너 기본 정보</h3>
                  <div className="ops-detail-grid ops-detail-grid-single ops-premium-form-single-column">
                    <label>
                      <span>활성화</span>
                      <select
                        value={form.enabled ? "enabled" : "disabled"}
                        onChange={(event) => setForm((prev) => ({ ...prev, enabled: event.target.value === "enabled" }))}
                      >
                        <option value="disabled">비활성</option>
                        <option value="enabled">활성</option>
                      </select>
                    </label>
                    <label>
                      <span>배너 타이틀</span>
                      <input
                        value={form.bannerTitle}
                        onChange={(event) => setForm((prev) => ({ ...prev, bannerTitle: event.target.value }))}
                      />
                    </label>
                    <label>
                      <span>배너 서브타이틀</span>
                      <input
                        value={form.bannerSubtitle}
                        onChange={(event) => setForm((prev) => ({ ...prev, bannerSubtitle: event.target.value }))}
                      />
                    </label>
                    <label>
                      <span>우선순위 (낮을수록 상단)</span>
                      <input
                        type="number"
                        min={0}
                        max={9999}
                        value={form.priority}
                        onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
                        placeholder="예: 10"
                      />
                    </label>
                  </div>
                </section>

                <section className="ops-detail-section" style={{ marginTop: 14 }}>
                  <h3 style={{ marginBottom: 12 }}>배너 이미지</h3>
                  <div className="ops-detail-grid ops-detail-grid-single ops-premium-form-single-column">
                    <label>
                      <span>배너 이미지 업로드</span>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button type="button" className="ops-action-save" onClick={openFilePicker}>
                          <UploadSimple size={14} />
                          이미지 파일 선택
                        </button>
                        {form.bannerImageUrl.trim() ? (
                          <button
                            type="button"
                            className="ops-action-cancel"
                            onClick={() => setForm((prev) => ({ ...prev, bannerImageUrl: "" }))}
                          >
                            이미지 제거
                          </button>
                        ) : null}
                      </div>
                    </label>
                    <label>
                      <span>배너 이미지 URL</span>
                      <input
                        value={form.bannerImageUrl}
                        onChange={(event) => setForm((prev) => ({ ...prev, bannerImageUrl: event.target.value }))}
                        placeholder="https://..."
                      />
                    </label>
                  </div>

                  {uploadErrorMessage ? <p className="ops-form-error">{uploadErrorMessage}</p> : null}
                </section>
              </>
            ) : null}

            </div>
            </div>

            <div className="ops-modal-fixed-bottom">
              {modalMode === "register" && registerStep === "edit" ? (
                <button
                  type="button"
                  className="ops-action-cancel"
                  onClick={() => {
                    setRegisterStep("pick");
                    setSelectedId(null);
                    setForm(formFromItem(null));
                  }}
                >
                  이전
                </button>
              ) : null}
              {modalMode === "manage" || registerStep === "edit" ? (
                <button type="button" className="ops-action-save" disabled={saving} onClick={() => void savePremium()}>
                  {saving ? "저장 중..." : "저장"}
                </button>
              ) : null}
            </div>
            </article>
          </div>
        </div>
      ) : null}

      {isPositionDetailModalOpen && detailItem ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 80
          }}
          onClick={closePositionDetailModal}
        >
          <div style={{ width: "min(100%, 1140px)", maxWidth: "calc(100% - 24px)" }} onClick={(event) => event.stopPropagation()}>
            <article className="ops-modal-card ops-detail-modal-card">
              <div className="ops-modal-fixed-top">
                <div className="ops-modal-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <h2 style={{ margin: 0 }}>{detailItem.title || "공고 상세정보"}</h2>
                    <span className={getOpsBadgeClassName(statusTone(detailItem.status))}>{statusLabel(detailItem.status)}</span>
                  </div>
                  <button type="button" aria-label="닫기" className="ops-modal-close" onClick={closePositionDetailModal}>
                    <X size={18} />
                  </button>
                </div>

                <div className="ops-detail-tabs ops-position-detail-tabs" role="tablist" aria-label="공고 상세 탭">
                  <button type="button" role="tab" aria-selected={detailTab === "basic"} className={`ops-detail-tab ${detailTab === "basic" ? "is-active" : ""}`} onClick={() => setDetailTab("basic")}>기본 정보</button>
                  <button type="button" role="tab" aria-selected={detailTab === "matching"} className={`ops-detail-tab ${detailTab === "matching" ? "is-active" : ""}`} onClick={() => setDetailTab("matching")}>매칭 참여자 리스트</button>
                  <button type="button" role="tab" aria-selected={detailTab === "logs"} className={`ops-detail-tab ${detailTab === "logs" ? "is-active" : ""}`} onClick={() => setDetailTab("logs")}>공고 진행 로그</button>
                  <button type="button" role="tab" aria-selected={detailTab === "memo"} className={`ops-detail-tab ${detailTab === "memo" ? "is-active" : ""}`} onClick={() => setDetailTab("memo")}>관리자 메모</button>
                </div>
              </div>
              <div className="ops-modal-scroll-body">
                <div className="ops-position-basic-sections-scroll">
                  {detailTab === "basic" ? (
                    <section className="ops-detail-section">
                      <h3>공고 기본 정보</h3>
                      <div className="ops-detail-grid ops-detail-grid-single ops-position-basic-readonly">
                        <div><span>제목</span><strong>{detailItem.title || "-"}</strong></div>
                        <div><span>희망 직무</span><strong>{detailItem.preferredJobRole || "-"}</strong></div>
                        <div>
                          <span>파트너사</span>
                          <strong>{detailItem.partnerOrganization ? `${detailItem.partnerOrganization.name} (${detailItem.partnerOrganization.domain})` : "선택 안 함"}</strong>
                        </div>
                        <div><span>등록일</span><strong>{formatDate(detailItem.createdAt)}</strong></div>
                        <div><span>선호 국적</span><strong>{(detailItem.preferredNationalities ?? []).join(", ") || "선택 안 함"}</strong></div>
                        <div><span>소통 언어</span><strong>{(detailItem.communicationLanguages ?? []).join(", ") || "선택 안 함"}</strong></div>
                        <div><span>채용 프로세스</span><strong>{detailItem.hiringProcess || "-"}</strong></div>
                        <div><span>희망 인원</span><strong>{detailItem.hiringCount ? `${detailItem.hiringCount}명` : "-"}</strong></div>
                        <div><span>근무 시간</span><strong>{detailItem.workingHours || "-"}</strong></div>
                        <div><span>근무 복장</span><strong>{detailItem.dressCode || "-"}</strong></div>
                        <div><span>사전 교육 및 과제 희망 여부</span><strong>{detailItem.wantsPreTraining === true ? "희망" : detailItem.wantsPreTraining === false ? "비희망" : "미정"}</strong></div>
                        <div><span>주요 업무</span><strong>{detailItem.mainResponsibilities || "-"}</strong></div>
                        <div><span>필수 자격 요건</span><strong>{detailItem.requiredQualifications || "-"}</strong></div>
                        <div><span>우대 자격 요건</span><strong>{detailItem.preferredQualifications || "-"}</strong></div>
                        <div><span>기타 참고 사항</span><strong>{detailItem.additionalNotes || "-"}</strong></div>
                      </div>
                    </section>
                  ) : null}

                  {detailTab === "matching" ? (
                    <section className="ops-detail-section">
                      <h3>매칭 참여자 리스트</h3>
                      <div className="ops-partner-table-wrap">
                        <table className="ops-partner-table">
                          <thead>
                            <tr><th>이름</th><th>메모</th><th>추가일</th><th>추가자</th></tr>
                          </thead>
                          <tbody>
                            {(detailItem.matchingParticipants ?? []).length === 0 ? (
                              <tr><td colSpan={4} className="ops-table-empty">등록된 참여자가 없습니다.</td></tr>
                            ) : (
                              (detailItem.matchingParticipants ?? []).map((participant) => (
                                <tr key={participant.id}>
                                  <td>{participant.name}</td>
                                  <td>{participant.note || "-"}</td>
                                  <td>{formatDateTime(participant.createdAt)}</td>
                                  <td>{participant.createdBy?.name || participant.createdBy?.email || "시스템"}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  ) : null}

                  {detailTab === "logs" ? (
                    <section className="ops-detail-section">
                      <h3>공고 진행 로그</h3>
                      <div className="ops-detail-log-list">
                        {(detailItem.postingProgressLogs ?? []).length === 0 ? (
                          <p className="ops-table-empty">등록된 진행 로그가 없습니다.</p>
                        ) : (
                          (detailItem.postingProgressLogs ?? []).map((log) => (
                            <p key={log.id}>
                              [{formatDateTime(log.createdAt)}] {log.message} / {log.createdBy?.name || log.createdBy?.email || "시스템"}
                            </p>
                          ))
                        )}
                      </div>

                      <h3 style={{ marginTop: 16 }}>상태 변경 이력</h3>
                      <div className="ops-detail-log-list">
                        {(detailItem.statusHistories ?? []).length === 0 ? (
                          <p className="ops-table-empty">상태 변경 이력이 없습니다.</p>
                        ) : (
                          (detailItem.statusHistories ?? []).map((history) => (
                            <p key={history.id}>
                              [{formatDateTime(history.createdAt)}] {history.fromStatus ? statusLabel(history.fromStatus) : "초기"} → {statusLabel(history.toStatus)} / {history.createdBy?.name || history.createdBy?.email || "시스템"}
                              {history.note ? ` / ${history.note}` : ""}
                            </p>
                          ))
                        )}
                      </div>
                    </section>
                  ) : null}

                  {detailTab === "memo" ? (
                    <section className="ops-detail-section">
                      <h3>관리자 메모</h3>
                      <div className="ops-detail-grid ops-detail-grid-single">
                        <div><span>메모</span><strong>{detailItem.adminMemo || "-"}</strong></div>
                      </div>
                    </section>
                  ) : null}
                </div>
              </div>
            </article>
          </div>
        </div>
      ) : null}

      <PartnerUnifiedDetailModal
        open={isPartnerDetailModalOpen}
        partner={partnerDetail}
        onClose={requestClosePartnerDetailModal}
      />
    </section>
  );
}
