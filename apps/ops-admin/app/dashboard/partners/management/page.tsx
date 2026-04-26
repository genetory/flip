"use client";

import { ArrowDown, ArrowUp, ArrowsDownUp, X } from "@phosphor-icons/react";
import { FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { getOpsBadgeClassName } from "../_components/OpsBadge";
import { PartnerDetailView } from "../_components/PartnerDetailView";

const TOKEN_COOKIE_KEY = "ops_admin_token";

type PartnerType = "UNIVERSITY" | "COMPANY" | "AGENCY";
type PartnerIndustry =
  | "EDUCATION"
  | "AGRICULTURE"
  | "AGRICULTURAL_PRODUCTS"
  | "PETS"
  | "FITNESS"
  | "WELLNESS"
  | "BEAUTY"
  | "TRAVEL"
  | "GOLF"
  | "IT"
  | "DEVELOPMENT"
  | "AI"
  | "LLM"
  | "DEEP_LEARNING"
  | "IOT"
  | "IMAGE_PROCESSING"
  | "THREE_D"
  | "DEVICE"
  | "APP_TECH"
  | "STARTUP"
  | "PLATFORM"
  | "COMMERCE"
  | "AGENCY"
  | "COMMUNITY"
  | "GLOBAL"
  | "B2B"
  | "SAAS"
  | "PRODUCTIVITY"
  | "CRM"
  | "AUTOMATION"
  | "CONSULTING"
  | "ADVERTISING"
  | "MARKETING"
  | "CONTENT"
  | "WEB_NOVEL"
  | "K_POP"
  | "CHARACTER"
  | "AVATAR"
  | "VIRTUAL"
  | "PUBLIC_DATA"
  | "CONSTRUCTION"
  | "FOREIGNER"
  | "HR"
  | "MENTAL_CARE"
  | "RENTAL";
type PartnerCompanySize = "SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100";

type PartnerOrganization = {
  id: string;
  partnerType: PartnerType;
  domain: string;
  name: string;
  companySize: PartnerCompanySize | null;
  officeAddress: string | null;
  website: string | null;
  socialMedia: string | null;
  industry: PartnerIndustry;
  description: string | null;
  strengths: string | null;
  adminMemo: string | null;
  memberCount: number;
  createdAt: string;
};

const partnerTypeOptions: Array<{ value: PartnerType; label: string }> = [
  { value: "UNIVERSITY", label: "대학" },
  { value: "AGENCY", label: "에이전시" },
  { value: "COMPANY", label: "파트너" }
];

const industryOptions: Array<{ value: PartnerIndustry; label: string }> = [
  { value: "EDUCATION", label: "교육 / Education" },
  { value: "AGRICULTURE", label: "농업 / Agriculture" },
  { value: "AGRICULTURAL_PRODUCTS", label: "농산물 / Agricultural Products" },
  { value: "PETS", label: "반려동물 / Pets" },
  { value: "FITNESS", label: "피트니스 / Fitness" },
  { value: "WELLNESS", label: "웰니스 / Wellness" },
  { value: "BEAUTY", label: "뷰티 / Beauty" },
  { value: "TRAVEL", label: "여행 / Travel" },
  { value: "GOLF", label: "골프 / Golf" },
  { value: "IT", label: "IT" },
  { value: "DEVELOPMENT", label: "개발 / Development" },
  { value: "AI", label: "AI" },
  { value: "LLM", label: "LLM" },
  { value: "DEEP_LEARNING", label: "딥러닝 / Deep Learning" },
  { value: "IOT", label: "IoT" },
  { value: "IMAGE_PROCESSING", label: "영상처리 / Image Processing" },
  { value: "THREE_D", label: "3D" },
  { value: "DEVICE", label: "디바이스 / Device" },
  { value: "APP_TECH", label: "앱테크 / App Tech" },
  { value: "STARTUP", label: "스타트업 / Startup" },
  { value: "PLATFORM", label: "플랫폼 / Platform" },
  { value: "COMMERCE", label: "커머스 / Commerce" },
  { value: "AGENCY", label: "에이전시 / Agency" },
  { value: "COMMUNITY", label: "커뮤니티 / Community" },
  { value: "GLOBAL", label: "글로벌 / Global" },
  { value: "B2B", label: "B2B" },
  { value: "SAAS", label: "SaaS" },
  { value: "PRODUCTIVITY", label: "업무생산성 / Productivity" },
  { value: "CRM", label: "CRM" },
  { value: "AUTOMATION", label: "자동화 / Automation" },
  { value: "CONSULTING", label: "컨설팅 / Consulting" },
  { value: "ADVERTISING", label: "광고 / Advertising" },
  { value: "MARKETING", label: "마케팅 / Marketing" },
  { value: "CONTENT", label: "콘텐츠 / Content" },
  { value: "WEB_NOVEL", label: "웹소설 / Web Novel" },
  { value: "K_POP", label: "K-pop" },
  { value: "CHARACTER", label: "캐릭터 / Character" },
  { value: "AVATAR", label: "아바타 / Avatar" },
  { value: "VIRTUAL", label: "버추얼 / Virtual" },
  { value: "PUBLIC_DATA", label: "공공데이터 / Public Data" },
  { value: "CONSTRUCTION", label: "건설 / Construction" },
  { value: "FOREIGNER", label: "외국인 / Foreigner" },
  { value: "HR", label: "HR / Human Resources" },
  { value: "MENTAL_CARE", label: "멘탈케어 / Mental Care" },
  { value: "RENTAL", label: "렌탈 / Rental" }
];

const companySizeOptions: Array<{ value: PartnerCompanySize; label: string }> = [
  { value: "SIZE_1_10", label: "1~10인" },
  { value: "SIZE_UNDER_30", label: "30인 이하" },
  { value: "SIZE_UNDER_50", label: "50인 이하" },
  { value: "SIZE_OVER_100", label: "100인 이상" }
];

type SortField = "name" | "domain" | "memberCount" | "createdAt";
type SortOrder = "asc" | "desc";
type PartnerDetailTab = "basic" | "members" | "jobs" | "memo";
type PartnerOrgRole = "OWNER" | "ADMIN" | "MEMBER";

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

function partnerStatusLabel() {
  return "운영중";
}

export default function PartnerManagementPage() {
  const registerDialogRef = useRef<HTMLDialogElement>(null);
  const detailDialogRef = useRef<HTMLDialogElement>(null);
  const addMemberDialogRef = useRef<HTMLDialogElement>(null);

  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const [items, setItems] = useState<PartnerOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [listErrorMessage, setListErrorMessage] = useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDetailEditMode, setIsDetailEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PartnerOrganization | null>(null);
  const [detailDraft, setDetailDraft] = useState<PartnerOrganization | null>(null);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailTab, setDetailTab] = useState<PartnerDetailTab>("basic");
  const [membersRefreshKey, setMembersRefreshKey] = useState(0);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState("");
  const [addMemberName, setAddMemberName] = useState("");
  const [addMemberRole, setAddMemberRole] = useState<PartnerOrgRole>("MEMBER");
  const [addMemberPassword, setAddMemberPassword] = useState("");
  const [addMemberSubmitting, setAddMemberSubmitting] = useState(false);
  const [addMemberErrorMessage, setAddMemberErrorMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 40 | 100>(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [partnerType, setPartnerType] = useState<PartnerType>("COMPANY");
  const [domain, setDomain] = useState("");
  const [name, setName] = useState("");
  const [companySize, setCompanySize] = useState<PartnerCompanySize | "">("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [socialMedia, setSocialMedia] = useState("");
  const [industry, setIndustry] = useState<PartnerIndustry>("IT");
  const [description, setDescription] = useState("");
  const [strengths, setStrengths] = useState("");
  const [adminMemo, setAdminMemo] = useState("");

  function resetForm() {
    setPartnerType("COMPANY");
    setDomain("");
    setName("");
    setCompanySize("");
    setOfficeAddress("");
    setWebsite("");
    setSocialMedia("");
    setIndustry("IT");
    setDescription("");
    setStrengths("");
    setAdminMemo("");
    setFormErrorMessage(null);
  }

  const isFormDirty = useMemo(() => {
    return (
      partnerType !== "COMPANY" ||
      industry !== "IT" ||
      companySize !== "" ||
      domain.trim().length > 0 ||
      name.trim().length > 0 ||
      officeAddress.trim().length > 0 ||
      website.trim().length > 0 ||
      socialMedia.trim().length > 0 ||
      description.trim().length > 0 ||
      strengths.trim().length > 0 ||
      adminMemo.trim().length > 0
    );
  }, [partnerType, industry, companySize, domain, name, officeAddress, website, socialMedia, description, strengths, adminMemo]);

  function requestCloseRegisterModal() {
    if (submitting) return;
    if (!isFormDirty) {
      setIsRegisterModalOpen(false);
      return;
    }

    const confirmed = window.confirm("입력 중인 내용이 사라집니다. 취소하고 닫을까요?");
    if (confirmed) {
      setIsRegisterModalOpen(false);
      resetForm();
    }
  }

  function requestCloseDetailModal() {
    setIsDetailModalOpen(false);
    setIsDetailEditMode(false);
    setSelectedItem(null);
    setDetailDraft(null);
    setDetailTab("basic");
  }

  function resetAddMemberForm() {
    setAddMemberEmail("");
    setAddMemberName("");
    setAddMemberRole("MEMBER");
    setAddMemberPassword("");
    setAddMemberErrorMessage(null);
  }

  function requestCloseAddMemberModal() {
    if (addMemberSubmitting) return;
    setIsAddMemberModalOpen(false);
    resetAddMemberForm();
  }

  function handleDialogCancel(
    event: React.SyntheticEvent<HTMLDialogElement, Event>,
    closeHandler: () => void
  ) {
    event.preventDefault();
    closeHandler();
  }

  function handleDialogClick(
    event: MouseEvent<HTMLDialogElement>,
    closeHandler: () => void
  ) {
    const dialog = event.currentTarget;
    const rect = dialog.getBoundingClientRect();
    const isInsideDialog =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!isInsideDialog) closeHandler();
  }

  function sortItems(itemsToSort: PartnerOrganization[]) {
    const sorted = [...itemsToSort].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name, "ko");
          break;
        case "domain":
          cmp = a.domain.localeCompare(b.domain, "en");
          break;
        case "memberCount":
          cmp = a.memberCount - b.memberCount;
          break;
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return sorted;
  }

  const sortedItems = useMemo(() => sortItems(items), [items, sortField, sortOrder]);
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
    setSortOrder(field === "createdAt" ? "desc" : "asc");
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowsDownUp size={13} weight="bold" aria-hidden />;
    if (sortOrder === "asc") return <ArrowUp size={13} weight="bold" aria-hidden />;
    return <ArrowDown size={13} weight="bold" aria-hidden />;
  }

  async function fetchPartners() {
    setLoading(true);
    setListErrorMessage(null);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const params = new URLSearchParams();
      const query = debouncedSearch.trim();
      if (query) params.set("search", query);

      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const response = await fetch(`${apiBaseUrl}/ops/partners?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        items?: PartnerOrganization[];
        page?: number;
        pageSize?: number;
        total?: number;
        totalPages?: number;
        message?: string;
      };
      if (!response.ok || !payload.ok) {
        setListErrorMessage(payload.message ?? "파트너 목록을 불러오지 못했습니다.");
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
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    void fetchPartners();
  }, [debouncedSearch, page, pageSize]);

  useEffect(() => {
    const dialog = registerDialogRef.current;
    if (!dialog) return;
    if (isRegisterModalOpen) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (dialog.open) dialog.close();
  }, [isRegisterModalOpen]);

  useEffect(() => {
    const dialog = detailDialogRef.current;
    if (!dialog) return;
    if (isDetailModalOpen) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (dialog.open) dialog.close();
  }, [isDetailModalOpen]);

  useEffect(() => {
    const dialog = addMemberDialogRef.current;
    if (!dialog) return;
    if (isAddMemberModalOpen) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (dialog.open) dialog.close();
  }, [isAddMemberModalOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!domain.trim() || !name.trim()) {
      setFormErrorMessage("도메인과 파트너명은 필수입니다.");
      return;
    }

    setSubmitting(true);
    setFormErrorMessage(null);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/partners`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          partnerType,
          domain: domain.trim(),
          name: name.trim(),
          companySize: companySize || undefined,
          officeAddress: officeAddress.trim() || undefined,
          website: website.trim() || undefined,
          socialMedia: socialMedia.trim() || undefined,
          industry,
          description: description.trim() || undefined,
          strengths: strengths.trim() || undefined,
          adminMemo: adminMemo.trim() || undefined
        })
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setFormErrorMessage(payload.message ?? "파트너 등록에 실패했습니다.");
        return;
      }

      resetForm();
      setIsRegisterModalOpen(false);
      await fetchPartners();
    } catch {
      setFormErrorMessage("서버 연결에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveDetail() {
    if (!detailDraft) return;
    if (!detailDraft.domain.trim() || !detailDraft.name.trim()) {
      alert("도메인과 파트너명은 필수입니다.");
      return;
    }

    setDetailSaving(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/partners/${detailDraft.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          partnerType: detailDraft.partnerType,
          domain: detailDraft.domain.trim(),
          name: detailDraft.name.trim(),
          companySize: detailDraft.companySize || undefined,
          officeAddress: detailDraft.officeAddress?.trim() || undefined,
          website: detailDraft.website?.trim() || undefined,
          socialMedia: detailDraft.socialMedia?.trim() || undefined,
          industry: detailDraft.industry,
          description: detailDraft.description?.trim() || undefined,
          strengths: detailDraft.strengths?.trim() || undefined,
          adminMemo: detailDraft.adminMemo?.trim() || undefined
        })
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        alert(payload.message ?? "수정에 실패했습니다.");
        return;
      }

      await fetchPartners();
      setSelectedItem(detailDraft);
      setIsDetailEditMode(false);
    } catch {
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setDetailSaving(false);
    }
  }

  async function handleAddMemberSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detailDraft) return;
    if (!addMemberEmail.trim()) {
      setAddMemberErrorMessage("이메일은 필수입니다.");
      return;
    }

    setAddMemberSubmitting(true);
    setAddMemberErrorMessage(null);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/partners/${detailDraft.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: addMemberEmail.trim(),
          name: addMemberName.trim() || undefined,
          partnerOrgRole: addMemberRole,
          password: addMemberPassword.trim() || undefined
        })
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; temporaryPassword?: string };
      if (!response.ok || !payload.ok) {
        setAddMemberErrorMessage(payload.message ?? "멤버 추가에 실패했습니다.");
        return;
      }

      if (payload.temporaryPassword) {
        window.alert(`임시 비밀번호가 생성되었습니다: ${payload.temporaryPassword}`);
      }

      setIsAddMemberModalOpen(false);
      resetAddMemberForm();
      setMembersRefreshKey((prev) => prev + 1);
      await fetchPartners();
    } catch {
      setAddMemberErrorMessage("멤버 추가 중 오류가 발생했습니다.");
    } finally {
      setAddMemberSubmitting(false);
    }
  }

  return (
    <section className="ops-content-section">
      <header>
        <h1>파트너 관리</h1>
        <p>검색/정렬을 기준으로 파트너를 관리하고 상세 정보를 확인합니다.</p>
      </header>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>등록된 파트너</h2>
          <button
            type="button"
            className="ops-partner-add-button"
            onClick={() => {
              resetForm();
              setIsRegisterModalOpen(true);
            }}
          >
            파트너 등록하기
          </button>
        </div>

        <div className="ops-partner-filters">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="파트너명 또는 도메인 검색"
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
          <table className="ops-partner-table">
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    className={`ops-th-sort ${sortField === "name" ? "is-active" : ""}`}
                    onClick={() => toggleSort("name")}
                  >
                    <span>파트너명</span>
                    <SortIcon field="name" />
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className={`ops-th-sort ${sortField === "domain" ? "is-active" : ""}`}
                    onClick={() => toggleSort("domain")}
                  >
                    <span>도메인</span>
                    <SortIcon field="domain" />
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className={`ops-th-sort ${sortField === "memberCount" ? "is-active" : ""}`}
                    onClick={() => toggleSort("memberCount")}
                  >
                    <span>멤버</span>
                    <SortIcon field="memberCount" />
                  </button>
                </th>
                <th>상태</th>
                <th>
                  <button
                    type="button"
                    className={`ops-th-sort ${sortField === "createdAt" ? "is-active" : ""}`}
                    onClick={() => toggleSort("createdAt")}
                  >
                    <span>등록일</span>
                    <SortIcon field="createdAt" />
                  </button>
                </th>
                <th>상세정보</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="ops-table-empty">목록을 불러오는 중입니다...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ops-table-empty">조건에 맞는 파트너가 없습니다.</td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="ops-clickable-row"
                    onClick={() => {
                      setSelectedItem(item);
                      setDetailDraft(item);
                      setIsDetailEditMode(false);
                      setDetailTab("basic");
                      setIsDetailModalOpen(true);
                    }}
                  >
                    <td>{item.name}</td>
                    <td>{item.domain}</td>
                    <td>{item.memberCount}명</td>
                    <td>
                      <span className={getOpsBadgeClassName("status-approved")}>{partnerStatusLabel()}</span>
                    </td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="ops-detail-button"
                        onClick={() => {
                          setSelectedItem(item);
                          setDetailDraft(item);
                          setIsDetailEditMode(false);
                          setDetailTab("basic");
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
        ref={registerDialogRef}
        className="ops-modal-dialog"
        onCancel={(e) => handleDialogCancel(e, requestCloseRegisterModal)}
        onClick={(e) => handleDialogClick(e, requestCloseRegisterModal)}
      >
        <article className="ops-modal-card">
          <div className="ops-modal-fixed-top">
            <div className="ops-modal-header">
              <h2>파트너 등록</h2>
              <button type="button" className="ops-modal-close" onClick={requestCloseRegisterModal} aria-label="닫기">
                <X size={16} weight="bold" aria-hidden />
              </button>
            </div>
          </div>

          <div className="ops-modal-scroll-body">
            <form id="ops-partner-create-form" className="ops-partner-form" onSubmit={handleSubmit}>
              <label>
                파트너 유형
                <select value={partnerType} onChange={(e) => setPartnerType(e.target.value as PartnerType)}>
                  {partnerTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="ops-partner-form-two-cols">
                <label>
                  <span className="ops-label-required">(파트너 이메일) 도메인 <span className="ops-required">*</span></span>
                  <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" required />
                </label>
                <label>
                  <span className="ops-label-required">파트너명 <span className="ops-required">*</span></span>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Flip Inc." required />
                </label>
              </div>

              <label>
                파트너 규모
                <select value={companySize} onChange={(e) => setCompanySize(e.target.value as PartnerCompanySize | "")}>
                  <option value="">선택 안함</option>
                  {companySizeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                산업 분야
                <select value={industry} onChange={(e) => setIndustry(e.target.value as PartnerIndustry)}>
                  {industryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                사무실 주소
                <input value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} />
              </label>

              <div className="ops-partner-form-two-cols">
                <label>
                  웹사이트
                  <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
                </label>
                <label>
                  소셜 미디어
                  <input value={socialMedia} onChange={(e) => setSocialMedia(e.target.value)} placeholder="https://..." />
                </label>
              </div>

              <label>
                파트너 소개
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </label>

              <label>
                자랑거리 / 장점
                <textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={3} />
              </label>

              <label>
                관리자 메모
                <textarea value={adminMemo} onChange={(e) => setAdminMemo(e.target.value)} rows={3} />
              </label>

              {formErrorMessage ? <p className="ops-form-error">{formErrorMessage}</p> : null}
            </form>
          </div>

          <div className="ops-modal-fixed-bottom">
            <button type="submit" form="ops-partner-create-form" disabled={submitting} className="ops-modal-submit">
              {submitting ? "등록 중..." : "파트너 등록"}
            </button>
          </div>
        </article>
      </dialog>

      <dialog
        ref={detailDialogRef}
        className="ops-modal-dialog"
        onCancel={(e) => handleDialogCancel(e, requestCloseDetailModal)}
        onClick={(e) => handleDialogClick(e, requestCloseDetailModal)}
      >
        {detailDraft ? (
          <article className="ops-modal-card ops-detail-modal-card">
            <div className="ops-modal-fixed-top">
              <div className="ops-modal-header">
                <div className="ops-detail-title-wrap">
                  <h2>{detailDraft.name}</h2>
                  <span className={getOpsBadgeClassName("status-approved")}>{partnerStatusLabel()}</span>
                </div>
                <div className="ops-detail-top-right">
                  <button type="button" className="ops-modal-close" onClick={requestCloseDetailModal} aria-label="닫기">
                    <X size={16} weight="bold" aria-hidden />
                  </button>
                </div>
              </div>
            </div>

            <div className="ops-modal-scroll-body">
              <PartnerDetailView
                partnerId={detailDraft.id}
                name={detailDraft.name}
                domain={detailDraft.domain}
                partnerTypeLabel={partnerTypeOptions.find((opt) => opt.value === detailDraft.partnerType)?.label ?? "-"}
                companySizeLabel={companySizeOptions.find((opt) => opt.value === detailDraft.companySize)?.label ?? "-"}
                industryLabel={industryOptions.find((opt) => opt.value === detailDraft.industry)?.label ?? "-"}
                createdAtLabel={formatDate(detailDraft.createdAt)}
                memberCount={detailDraft.memberCount}
                officeAddress={detailDraft.officeAddress}
                website={detailDraft.website}
                socialMedia={detailDraft.socialMedia}
                description={detailDraft.description}
                strengths={detailDraft.strengths}
                adminMemo={detailDraft.adminMemo}
                membersRefreshKey={membersRefreshKey}
                basicContent={
                  isDetailEditMode ? (
                    <form className="ops-partner-form ops-detail-edit-form" onSubmit={(e) => e.preventDefault()}>
                      <label>
                        파트너 유형
                        <select
                          value={detailDraft.partnerType}
                          onChange={(e) => setDetailDraft({ ...detailDraft, partnerType: e.target.value as PartnerType })}
                        >
                          {partnerTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="ops-partner-form-two-cols">
                        <label>
                          <span className="ops-label-required">(파트너 이메일) 도메인 <span className="ops-required">*</span></span>
                          <input value={detailDraft.domain} onChange={(e) => setDetailDraft({ ...detailDraft, domain: e.target.value })} />
                        </label>
                        <label>
                          <span className="ops-label-required">파트너명 <span className="ops-required">*</span></span>
                          <input value={detailDraft.name} onChange={(e) => setDetailDraft({ ...detailDraft, name: e.target.value })} />
                        </label>
                      </div>

                      <label>
                        파트너 규모
                        <select
                          value={detailDraft.companySize ?? ""}
                          onChange={(e) =>
                            setDetailDraft({
                              ...detailDraft,
                              companySize: (e.target.value || null) as PartnerCompanySize | null
                            })
                          }
                        >
                          <option value="">선택 안함</option>
                          {companySizeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        산업 분야
                        <select
                          value={detailDraft.industry}
                          onChange={(e) => setDetailDraft({ ...detailDraft, industry: e.target.value as PartnerIndustry })}
                        >
                          {industryOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        사무실 주소
                        <input
                          value={detailDraft.officeAddress ?? ""}
                          onChange={(e) => setDetailDraft({ ...detailDraft, officeAddress: e.target.value })}
                        />
                      </label>

                      <div className="ops-partner-form-two-cols">
                        <label>
                          웹사이트
                          <input value={detailDraft.website ?? ""} onChange={(e) => setDetailDraft({ ...detailDraft, website: e.target.value })} />
                        </label>
                        <label>
                          소셜 미디어
                          <input
                            value={detailDraft.socialMedia ?? ""}
                            onChange={(e) => setDetailDraft({ ...detailDraft, socialMedia: e.target.value })}
                          />
                        </label>
                      </div>

                      <label>
                        파트너 소개
                        <textarea
                          value={detailDraft.description ?? ""}
                          rows={4}
                          onChange={(e) => setDetailDraft({ ...detailDraft, description: e.target.value })}
                        />
                      </label>

                      <label>
                        자랑거리 / 장점
                        <textarea
                          value={detailDraft.strengths ?? ""}
                          rows={4}
                          onChange={(e) => setDetailDraft({ ...detailDraft, strengths: e.target.value })}
                        />
                      </label>

                      <label>
                        관리자 메모
                        <textarea
                          value={detailDraft.adminMemo ?? ""}
                          rows={4}
                          onChange={(e) => setDetailDraft({ ...detailDraft, adminMemo: e.target.value })}
                        />
                      </label>
                    </form>
                  ) : undefined
                }
                memoContent={
                  isDetailEditMode ? (
                    <form className="ops-partner-form ops-detail-edit-form" onSubmit={(e) => e.preventDefault()}>
                      <label>
                        관리자 메모
                        <textarea
                          value={detailDraft.adminMemo ?? ""}
                          rows={8}
                          onChange={(e) => setDetailDraft({ ...detailDraft, adminMemo: e.target.value })}
                          placeholder="운영 메모를 입력하세요."
                        />
                      </label>
                    </form>
                  ) : undefined
                }
                tab={detailTab}
                onTabChange={setDetailTab}
              />
            </div>

            <div className="ops-modal-fixed-bottom ops-detail-actions">
              {isDetailEditMode ? (
                <>
                  <button
                    type="button"
                    className="ops-action-cancel"
                    onClick={() => {
                      setIsDetailEditMode(false);
                      if (selectedItem) setDetailDraft(selectedItem);
                    }}
                  >
                    취소
                  </button>
                  <button type="button" className="ops-action-save" onClick={() => void saveDetail()} disabled={detailSaving}>
                    {detailSaving ? "저장 중..." : "저장"}
                  </button>
                </>
              ) : (
                <>
                  {detailTab === "basic" ? (
                    <button type="button" className="ops-action-save" onClick={() => setIsDetailEditMode(true)}>
                      수정
                    </button>
                  ) : null}
                  {detailTab === "memo" ? (
                    <button type="button" className="ops-action-save" onClick={() => setIsDetailEditMode(true)}>
                      메모 작성
                    </button>
                  ) : null}
                  {detailTab === "members" ? (
                    <button
                      type="button"
                      className="ops-action-save"
                      onClick={() => {
                        resetAddMemberForm();
                        setIsAddMemberModalOpen(true);
                      }}
                    >
                      멤버 추가하기
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </article>
        ) : null}
      </dialog>

      <dialog
        ref={addMemberDialogRef}
        className="ops-modal-dialog"
        onCancel={(e) => handleDialogCancel(e, requestCloseAddMemberModal)}
        onClick={(e) => handleDialogClick(e, requestCloseAddMemberModal)}
      >
        <article className="ops-modal-card">
          <div className="ops-modal-fixed-top">
            <div className="ops-modal-header">
              <h2>멤버 추가하기</h2>
              <button type="button" className="ops-modal-close" onClick={requestCloseAddMemberModal} aria-label="닫기">
                <X size={16} weight="bold" aria-hidden />
              </button>
            </div>
          </div>

          <div className="ops-modal-scroll-body">
            <form id="ops-member-create-form" className="ops-partner-form" onSubmit={handleAddMemberSubmit}>
              <label>
                이메일
                <input
                  value={addMemberEmail}
                  onChange={(e) => setAddMemberEmail(e.target.value)}
                  placeholder={detailDraft ? `example@${detailDraft.domain}` : "example@company.com"}
                />
              </label>
              <label>
                담당자명
                <input value={addMemberName} onChange={(e) => setAddMemberName(e.target.value)} placeholder="이름" />
              </label>
              <label>
                역할
                <select value={addMemberRole} onChange={(e) => setAddMemberRole(e.target.value as PartnerOrgRole)}>
                  <option value="OWNER">소유자</option>
                  <option value="ADMIN">관리자</option>
                  <option value="MEMBER">멤버</option>
                </select>
              </label>
              <label>
                초기 비밀번호 (선택)
                <input
                  value={addMemberPassword}
                  onChange={(e) => setAddMemberPassword(e.target.value)}
                  placeholder="비워두면 임시 비밀번호 자동 생성"
                />
              </label>
              {addMemberErrorMessage ? <p className="ops-form-error">{addMemberErrorMessage}</p> : null}
            </form>
          </div>

          <div className="ops-modal-fixed-bottom ops-detail-actions">
            <button type="button" className="ops-action-cancel" onClick={requestCloseAddMemberModal}>
              취소
            </button>
            <button type="submit" form="ops-member-create-form" className="ops-action-save" disabled={addMemberSubmitting}>
              {addMemberSubmitting ? "추가 중..." : "멤버 추가하기"}
            </button>
          </div>
        </article>
      </dialog>
    </section>
  );
}
