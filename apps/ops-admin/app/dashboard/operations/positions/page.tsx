"use client";

import { ArrowDown, ArrowUp, ArrowsDownUp, Trash, X } from "@phosphor-icons/react";
import { MouseEvent, SyntheticEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getOpsBadgeClassName, OpsBadge } from "../../partners/_components/OpsBadge";
import { PartnerUnifiedDetailModal } from "../../partners/_components/PartnerUnifiedDetailModal";

const TOKEN_COOKIE_KEY = "ops_admin_token";

type PositionStatus = "DRAFT" | "OPEN" | "MATCHING" | "CLOSED";
type SortField = "title" | "status" | "hiringCount" | "createdAt";
type SortOrder = "asc" | "desc";
type TabKey = "basic" | "matching" | "logs" | "memo";

type PartnerOption = { id: string; name: string; domain: string };
type PartnerCompanySize = "SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100";
type PartnerIndustry =
  | "IT"
  | "HEALTHCARE"
  | "MANUFACTURING"
  | "RETAIL"
  | "FINANCE"
  | "EDUCATION"
  | "MEDIA"
  | "PUBLIC"
  | "OTHER";
type PreferredNationality =
  | "국적 무관"
  | "미국"
  | "유럽 국가"
  | "동남아 국가"
  | "한국"
  | "Other";

const preferredNationalityOptions: PreferredNationality[] = [
  "국적 무관",
  "미국",
  "유럽 국가",
  "동남아 국가",
  "한국",
  "Other"
];

type CommunicationLanguage = "영어" | "한국어" | "일본어" | "중국어" | "Other";

const communicationLanguageOptions: CommunicationLanguage[] = [
  "영어",
  "한국어",
  "일본어",
  "중국어",
  "Other"
];

const partnerIndustryLabelMap: Record<PartnerIndustry, string> = {
  IT: "IT",
  HEALTHCARE: "헬스케어",
  MANUFACTURING: "제조",
  RETAIL: "리테일",
  FINANCE: "금융",
  EDUCATION: "교육",
  MEDIA: "미디어",
  PUBLIC: "공공",
  OTHER: "기타"
};

function partnerIndustryLabel(value: PartnerIndustry) {
  return partnerIndustryLabelMap[value] ?? value;
}

function companySizeLabel(size: PartnerCompanySize) {
  if (size === "SIZE_1_10") return "1~10인";
  if (size === "SIZE_UNDER_30") return "30인 이하";
  if (size === "SIZE_UNDER_50") return "50인 이하";
  return "100인 이상";
}

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

type PositionPremiumBanner = {
  enabled: boolean;
  bannerImageUrl: string | null;
  bannerTitle: string | null;
  bannerSubtitle: string | null;
  priority: number | null;
};

type PositionItem = {
  id: string;
  partnerOrganizationId: string | null;
  title: string;
  status: PositionStatus;
  matchingParticipants: PositionParticipant[];
  postingProgressLogs: PositionProgressLog[];
  statusHistories: PositionStatusHistory[];
  preferredNationalities: string[];
  communicationLanguages: string[];
  hiringProcess: string | null;
  preferredJobRole: string | null;
  hiringCount: number | null;
  workingHours: string | null;
  mainResponsibilities: string | null;
  requiredQualifications: string | null;
  preferredQualifications: string | null;
  dressCode: string | null;
  wantsPreTraining: boolean | null;
  additionalNotes: string | null;
  adminMemo: string | null;
  premiumBanner: PositionPremiumBanner | null;
  createdAt: string;
  partnerOrganization: {
    id: string;
    name: string;
    domain: string;
  } | null;
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

type PositionForm = {
  partnerOrganizationId: string;
  title: string;
  status: PositionStatus;
  postingProgressLogs: string;
  preferredNationality: PreferredNationality | "";
  communicationLanguage: CommunicationLanguage | "";
  hiringProcess: string;
  preferredJobRole: string;
  hiringCount: string;
  workingHours: string;
  mainResponsibilities: string;
  requiredQualifications: string;
  preferredQualifications: string;
  dressCode: string;
  wantsPreTraining: "yes" | "no" | "unset";
  additionalNotes: string;
  adminMemo: string;
};

function readCookie(key: string) {
  if (typeof document === "undefined") return "";
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${key}=`));
  return entry ? decodeURIComponent(entry.split("=")[1] ?? "") : "";
}

function statusLabel(status: PositionStatus) {
  if (status === "DRAFT") return "임시저장";
  if (status === "OPEN") return "공개";
  if (status === "MATCHING") return "매칭 진행";
  return "마감";
}

function statusTone(status: PositionStatus) {
  if (status === "DRAFT") return "status-pending" as const;
  if (status === "OPEN") return "status-approved" as const;
  if (status === "MATCHING") return "role-admin" as const;
  return "status-rejected" as const;
}

function statusOptionClass(status: PositionStatus) {
  if (status === "DRAFT") return "ops-position-status-draft";
  if (status === "OPEN") return "ops-position-status-open";
  if (status === "MATCHING") return "ops-position-status-matching";
  return "ops-position-status-closed";
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

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toLineText(value: string[] | null | undefined) {
  return (value ?? []).join("\n");
}

function emptyForm(): PositionForm {
  return {
    partnerOrganizationId: "",
    title: "",
    status: "DRAFT",
    postingProgressLogs: "",
    preferredNationality: "",
    communicationLanguage: "",
    hiringProcess: "",
    preferredJobRole: "",
    hiringCount: "",
    workingHours: "",
    mainResponsibilities: "",
    requiredQualifications: "",
    preferredQualifications: "",
    dressCode: "",
    wantsPreTraining: "unset",
    additionalNotes: "",
    adminMemo: ""
  };
}

function formFromItem(item: PositionItem): PositionForm {
  return {
    partnerOrganizationId: item.partnerOrganizationId ?? "",
    title: item.title,
    status: item.status,
    postingProgressLogs: item.postingProgressLogs.map((it) => it.message).join("\n"),
    preferredNationality:
      item.preferredNationalities.find((value): value is PreferredNationality =>
        preferredNationalityOptions.includes(value as PreferredNationality)
      ) ?? "",
    communicationLanguage:
      item.communicationLanguages.find((value): value is CommunicationLanguage =>
        communicationLanguageOptions.includes(value as CommunicationLanguage)
      ) ?? "",
    hiringProcess: item.hiringProcess ?? "",
    preferredJobRole: item.preferredJobRole ?? "",
    hiringCount: item.hiringCount ? String(item.hiringCount) : "",
    workingHours: item.workingHours ?? "",
    mainResponsibilities: item.mainResponsibilities ?? "",
    requiredQualifications: item.requiredQualifications ?? "",
    preferredQualifications: item.preferredQualifications ?? "",
    dressCode: item.dressCode ?? "",
    wantsPreTraining:
      item.wantsPreTraining === true ? "yes" : item.wantsPreTraining === false ? "no" : "unset",
    additionalNotes: item.additionalNotes ?? "",
    adminMemo: item.adminMemo ?? ""
  };
}

export default function PositionManagementPage() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const detailIdFromQuery = searchParams.get("detailId");

  const [items, setItems] = useState<PositionItem[]>([]);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [partnerIndustries, setPartnerIndustries] = useState<PartnerIndustry[]>([]);
  const [partnerCompanySizes, setPartnerCompanySizes] = useState<PartnerCompanySize[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [listErrorMessage, setListErrorMessage] = useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState<PartnerIndustry | "">("");
  const [companySizeFilter, setCompanySizeFilter] = useState<PartnerCompanySize | "">("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 40 | 100>(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "detail">("create");
  const [tab, setTab] = useState<TabKey>("basic");
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PositionItem | null>(null);
  const [form, setForm] = useState<PositionForm>(emptyForm());
  const [statusMenu, setStatusMenu] = useState<{
    id: string;
    currentStatus: PositionStatus;
    mode: "list" | "detail";
  } | null>(null);

  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantNote, setNewParticipantNote] = useState("");
  const [newLogMessage, setNewLogMessage] = useState("");
  const [isPartnerDetailModalOpen, setIsPartnerDetailModalOpen] = useState(false);
  const [partnerDetail, setPartnerDetail] = useState<PartnerDetailItem | null>(null);

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
    setSortOrder("asc");
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowsDownUp size={13} weight="bold" aria-hidden />;
    if (sortOrder === "asc") return <ArrowUp size={13} weight="bold" aria-hidden />;
    return <ArrowDown size={13} weight="bold" aria-hidden />;
  }

  async function fetchMeta() {
    const token = readCookie(TOKEN_COOKIE_KEY);
    const response = await fetch(`${apiBaseUrl}/ops/positions/meta`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      partners?: PartnerOption[];
      usedPartnerIndustries?: PartnerIndustry[];
      usedPartnerCompanySizes?: PartnerCompanySize[];
    };
    if (response.ok && payload.ok) {
      setPartners(payload.partners ?? []);
      setPartnerIndustries(payload.usedPartnerIndustries ?? []);
      setPartnerCompanySizes(payload.usedPartnerCompanySizes ?? []);
    }
  }

  async function fetchPositions() {
    setLoading(true);
    setListErrorMessage(null);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (industryFilter) params.set("partnerIndustry", industryFilter);
      if (companySizeFilter) params.set("partnerCompanySize", companySizeFilter);
      params.set("sortBy", sortField);
      params.set("sortOrder", sortOrder);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const response = await fetch(`${apiBaseUrl}/ops/positions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        items?: PositionItem[];
        total?: number;
        totalPages?: number;
        message?: string;
      };
      if (!response.ok || !payload.ok) {
        setListErrorMessage(payload.message ?? "공고 목록을 불러오지 못했습니다.");
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

  async function fetchPositionById(id: string) {
    const token = readCookie(TOKEN_COOKIE_KEY);
    const response = await fetch(`${apiBaseUrl}/ops/positions/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const payload = (await response.json()) as { ok?: boolean; item?: PositionItem; message?: string };
    if (!response.ok || !payload.ok || !payload.item) {
      throw new Error(payload.message ?? "공고 상세 정보를 불러오지 못했습니다.");
    }
    return payload.item;
  }

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    void fetchMeta();
  }, []);

  useEffect(() => {
    void fetchPositions();
  }, [debouncedSearch, industryFilter, companySizeFilter, sortField, sortOrder, page, pageSize]);

  useEffect(() => {
    if (!detailIdFromQuery) return;

    let cancelled = false;
    const clearDetailQuery = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("detailId");
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname);
    };

    void (async () => {
      try {
        const existing = items.find((entry) => entry.id === detailIdFromQuery);
        if (existing) {
          if (!cancelled) openDetailModal(existing);
          return;
        }

        const item = await fetchPositionById(detailIdFromQuery);
        if (cancelled) return;
        setItems((prev) => {
          const exists = prev.some((entry) => entry.id === item.id);
          if (exists) return prev.map((entry) => (entry.id === item.id ? item : entry));
          return [item, ...prev];
        });
        openDetailModal(item);
      } catch (error) {
        if (!cancelled) {
          window.alert(error instanceof Error ? error.message : "공고 상세 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) clearDetailQuery();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [detailIdFromQuery, items, pathname, router, searchParams]);

  useEffect(() => {
    if (!statusMenu) return;

    const handlePointerDown = (event: globalThis.MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".ops-status-menu-wrap")) return;
      setStatusMenu(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [statusMenu]);

  function openCreateModal() {
    setModalMode("create");
    setTab("basic");
    setIsEditMode(true);
    setSelectedItem(null);
    setForm(emptyForm());
    setFormErrorMessage(null);
    setNewParticipantName("");
    setNewParticipantNote("");
    setNewLogMessage("");
    setIsModalOpen(true);
  }

  function openDetailModal(item: PositionItem) {
    setModalMode("detail");
    setTab("basic");
    setIsEditMode(false);
    setSelectedItem(item);
    setForm(formFromItem(item));
    setFormErrorMessage(null);
    setNewParticipantName("");
    setNewParticipantNote("");
    setNewLogMessage("");
    setStatusMenu(null);
    setIsModalOpen(true);
  }

  function requestCloseModal() {
    if (submitting) return;
    setIsModalOpen(false);
    setFormErrorMessage(null);
    setSelectedItem(null);
    setIsEditMode(false);
    setStatusMenu(null);
  }

  function handleDialogCancel(event: SyntheticEvent<HTMLDialogElement, Event>) {
    event.preventDefault();
    requestCloseModal();
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    const dialog = event.currentTarget;
    const rect = dialog.getBoundingClientRect();
    const isInsideDialog =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!isInsideDialog) requestCloseModal();
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isModalOpen) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (dialog.open) dialog.close();
  }, [isModalOpen]);

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

  async function savePosition() {
    if (!form.title.trim()) {
      setFormErrorMessage("제목은 필수입니다.");
      return;
    }

    setSubmitting(true);
    setFormErrorMessage(null);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const payload = {
        partnerOrganizationId: form.partnerOrganizationId || undefined,
        title: form.title.trim(),
        status: form.status,
        postingProgressLogs: splitLines(form.postingProgressLogs),
        preferredNationalities: form.preferredNationality ? [form.preferredNationality] : [],
        communicationLanguages: form.communicationLanguage ? [form.communicationLanguage] : [],
        hiringProcess: form.hiringProcess.trim() || undefined,
        preferredJobRole: form.preferredJobRole.trim() || undefined,
        hiringCount: form.hiringCount.trim() ? Number(form.hiringCount) : undefined,
        workingHours: form.workingHours.trim() || undefined,
        mainResponsibilities: form.mainResponsibilities.trim() || undefined,
        requiredQualifications: form.requiredQualifications.trim() || undefined,
        preferredQualifications: form.preferredQualifications.trim() || undefined,
        dressCode: form.dressCode.trim() || undefined,
        wantsPreTraining:
          form.wantsPreTraining === "unset" ? undefined : form.wantsPreTraining === "yes",
        additionalNotes: form.additionalNotes.trim() || undefined,
        ...(modalMode === "detail" ? { adminMemo: form.adminMemo.trim() || undefined } : {})
      };

      const url =
        modalMode === "create"
          ? `${apiBaseUrl}/ops/positions`
          : `${apiBaseUrl}/ops/positions/${selectedItem?.id}`;
      const method = modalMode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as {
        ok?: boolean;
        item?: PositionItem;
        message?: string;
      };
      if (!response.ok || !result.ok || !result.item) {
        setFormErrorMessage(result.message ?? "공고 저장에 실패했습니다.");
        return;
      }
      if (modalMode === "create") {
        setItems((prev) => [result.item!, ...prev]);
      } else {
        setItems((prev) => prev.map((item) => (item.id === result.item!.id ? result.item! : item)));
        setSelectedItem(result.item);
        setIsEditMode(false);
      }
      await fetchPositions();
      if (modalMode === "create") requestCloseModal();
    } catch {
      setFormErrorMessage("공고 저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatusFromList(id: string, currentStatus: PositionStatus, nextStatus: PositionStatus) {
    setStatusMenu(null);
    if (currentStatus === nextStatus) return;
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/positions/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const payload = (await response.json()) as { ok?: boolean; item?: PositionItem; message?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? "상태 변경에 실패했습니다.");
        return;
      }

      setItems((prev) => prev.map((it) => (it.id === payload.item!.id ? payload.item! : it)));
      setSelectedItem((prev) => {
        if (!prev || prev.id !== payload.item!.id) return prev;
        setForm(formFromItem(payload.item!));
        return payload.item!;
      });
    } catch {
      window.alert("상태 변경 중 오류가 발생했습니다.");
    }
  }

  function toggleStatusMenu(id: string, currentStatus: PositionStatus, mode: "list" | "detail") {
    setStatusMenu((prev) => {
      if (prev && prev.id === id && prev.mode === mode) return null;
      return { id, currentStatus, mode };
    });
  }

  async function addParticipant() {
    if (!selectedItem || !newParticipantName.trim()) return;
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/positions/${selectedItem.id}/participants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newParticipantName.trim(),
          note: newParticipantNote.trim() || undefined
        })
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        item?: PositionParticipant;
        message?: string;
      };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? "참여자 추가에 실패했습니다.");
        return;
      }
      const next = {
        ...selectedItem,
        matchingParticipants: [payload.item, ...selectedItem.matchingParticipants]
      };
      setSelectedItem(next);
      setItems((prev) => prev.map((it) => (it.id === next.id ? next : it)));
      setNewParticipantName("");
      setNewParticipantNote("");
    } catch {
      window.alert("참여자 추가 중 오류가 발생했습니다.");
    }
  }

  async function removeParticipant(participantId: string) {
    if (!selectedItem) return;
    const confirmed = window.confirm("참여자를 삭제할까요?");
    if (!confirmed) return;
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(
        `${apiBaseUrl}/ops/positions/${selectedItem.id}/participants/${participantId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        window.alert(payload.message ?? "참여자 삭제에 실패했습니다.");
        return;
      }
      const next = {
        ...selectedItem,
        matchingParticipants: selectedItem.matchingParticipants.filter((it) => it.id !== participantId)
      };
      setSelectedItem(next);
      setItems((prev) => prev.map((it) => (it.id === next.id ? next : it)));
    } catch {
      window.alert("참여자 삭제 중 오류가 발생했습니다.");
    }
  }

  async function addProgressLog() {
    if (!selectedItem || !newLogMessage.trim()) return;
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/positions/${selectedItem.id}/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: newLogMessage.trim() })
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        item?: PositionProgressLog;
        message?: string;
      };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? "로그 추가에 실패했습니다.");
        return;
      }
      const next = {
        ...selectedItem,
        postingProgressLogs: [payload.item, ...selectedItem.postingProgressLogs]
      };
      setSelectedItem(next);
      setItems((prev) => prev.map((it) => (it.id === next.id ? next : it)));
      setNewLogMessage("");
    } catch {
      window.alert("로그 추가 중 오류가 발생했습니다.");
    }
  }

  return (
    <section className="ops-content-section">
      <header>
        <h1>포지션 관리</h1>
        <p>공고 등록부터 상태 변경, 매칭 참여자, 진행 로그, 관리자 메모까지 한 화면에서 운영합니다.</p>
      </header>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>공고 목록</h2>
          <button type="button" className="ops-partner-add-button" onClick={openCreateModal}>
            공고 등록하기
          </button>
        </div>

        <div className="ops-partner-filters ops-position-filters">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="제목, 파트너사, 희망 직무 검색"
            className="ops-partner-filter-search"
          />
          <div className="ops-position-filter-right">
            <select
              value={industryFilter}
              onChange={(e) => {
                setIndustryFilter(e.target.value as PartnerIndustry | "");
                setPage(1);
              }}
            >
              <option value="">산업 전체</option>
              {partnerIndustries.map((industry) => (
                <option key={industry} value={industry}>
                  {partnerIndustryLabel(industry)}
                </option>
              ))}
            </select>
            <select
              value={companySizeFilter}
              onChange={(e) => {
                setCompanySizeFilter(e.target.value as PartnerCompanySize | "");
                setPage(1);
              }}
            >
              <option value="">기업 규모 전체</option>
              {partnerCompanySizes.map((size) => (
                <option key={size} value={size}>
                  {companySizeLabel(size)}
                </option>
              ))}
            </select>
            <select value={String(pageSize)} onChange={(e) => setPageSize(Number(e.target.value) as 20 | 40 | 100)}>
              <option value="20">20개</option>
              <option value="40">40개</option>
              <option value="100">100개</option>
            </select>
          </div>
        </div>

        {listErrorMessage ? <p className="ops-form-error">{listErrorMessage}</p> : null}

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
                <th>
                  <button type="button" className={`ops-th-sort ${sortField === "title" ? "is-active" : ""}`} onClick={() => toggleSort("title")}>
                    <span>제목</span><SortIcon field="title" />
                  </button>
                </th>
                <th>
                  <button type="button" className={`ops-th-sort ${sortField === "status" ? "is-active" : ""}`} onClick={() => toggleSort("status")}>
                    <span>상태</span><SortIcon field="status" />
                  </button>
                </th>
                <th>파트너사</th>
                <th>희망 직무</th>
                <th>
                  <button type="button" className={`ops-th-sort ${sortField === "hiringCount" ? "is-active" : ""}`} onClick={() => toggleSort("hiringCount")}>
                    <span>희망 인원</span><SortIcon field="hiringCount" />
                  </button>
                </th>
                <th>
                  <button type="button" className={`ops-th-sort ${sortField === "createdAt" ? "is-active" : ""}`} onClick={() => toggleSort("createdAt")}>
                    <span>등록일</span><SortIcon field="createdAt" />
                  </button>
                </th>
                <th>상세정보</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="ops-table-empty">목록을 불러오는 중입니다...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="ops-table-empty">등록된 공고가 없습니다.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="ops-clickable-row" onClick={() => openDetailModal(item)}>
                    <td><span className="ops-cell-clamp-3">{item.title}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="ops-status-menu-wrap">
                        <button
                          type="button"
                          className={getOpsBadgeClassName(statusTone(item.status), "is-clickable")}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatusMenu(item.id, item.status, "list");
                          }}
                        >
                          {statusLabel(item.status)}
                        </button>
                        {statusMenu?.id === item.id && statusMenu.mode === "list" ? (
                          <div className="ops-status-toggle-menu ops-position-status-toggle-menu">
                            {(["DRAFT", "OPEN", "MATCHING", "CLOSED"] as PositionStatus[]).map((status) => (
                              <button
                                key={status}
                                type="button"
                                className={`${statusOptionClass(status)} ${statusMenu.currentStatus === status ? "is-active" : ""}`}
                                onClick={() => void updateStatusFromList(item.id, item.status, status)}
                              >
                                {statusLabel(status)}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {item.partnerOrganization ? (
                        <button
                          type="button"
                          className="ops-link-button"
                          onClick={(e) => {
                            e.stopPropagation();
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
                    <td onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="ops-detail-button" onClick={() => openDetailModal(item)}>상세정보</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="ops-pagination">
          <span>총 {total}개 · {page}/{totalPages} 페이지</span>
          <div className="ops-pagination-numbers">
            {pageButtons.map((num) => (
              <button key={num} type="button" className={num === page ? "is-active" : ""} onClick={() => setPage(num)}>{num}</button>
            ))}
          </div>
          <span />
        </div>
      </article>

      <dialog ref={dialogRef} className="ops-modal-dialog" onCancel={handleDialogCancel} onClick={handleDialogClick}>
        <article className="ops-modal-card ops-detail-modal-card">
          <div className="ops-modal-fixed-top">
            <div className="ops-modal-header">
              <div className="ops-detail-title-wrap">
                <h2>{modalMode === "create" ? "공고 등록하기" : selectedItem?.title ?? "공고 상세정보"}</h2>
                {modalMode === "detail" && selectedItem ? (
                  <div className="ops-status-menu-wrap">
                    <button
                      type="button"
                      className={getOpsBadgeClassName(statusTone(selectedItem.status), "is-clickable")}
                      onClick={() => toggleStatusMenu(selectedItem.id, selectedItem.status, "detail")}
                    >
                      {statusLabel(selectedItem.status)}
                    </button>
                    {statusMenu?.id === selectedItem.id && statusMenu.mode === "detail" ? (
                      <div className="ops-status-toggle-menu ops-position-status-toggle-menu">
                        {(["DRAFT", "OPEN", "MATCHING", "CLOSED"] as PositionStatus[]).map((status) => (
                          <button
                            key={status}
                            type="button"
                            className={`${statusOptionClass(status)} ${statusMenu.currentStatus === status ? "is-active" : ""}`}
                            onClick={() => void updateStatusFromList(selectedItem.id, selectedItem.status, status)}
                          >
                            {statusLabel(status)}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="ops-detail-top-right">
                <button type="button" className="ops-modal-close" onClick={requestCloseModal} aria-label="닫기">
                  <X size={16} weight="bold" aria-hidden />
                </button>
              </div>
            </div>
            {modalMode === "detail" ? (
              <div className="ops-detail-tabs ops-position-detail-tabs" role="tablist" aria-label="공고 상세 탭">
                <button type="button" role="tab" aria-selected={tab === "basic"} className={`ops-detail-tab ${tab === "basic" ? "is-active" : ""}`} onClick={() => setTab("basic")}>기본 정보</button>
                <button type="button" role="tab" aria-selected={tab === "matching"} className={`ops-detail-tab ${tab === "matching" ? "is-active" : ""}`} onClick={() => setTab("matching")}>매칭 참여자 리스트</button>
                <button type="button" role="tab" aria-selected={tab === "logs"} className={`ops-detail-tab ${tab === "logs" ? "is-active" : ""}`} onClick={() => setTab("logs")}>공고 진행 로그</button>
                <button type="button" role="tab" aria-selected={tab === "memo"} className={`ops-detail-tab ${tab === "memo" ? "is-active" : ""}`} onClick={() => setTab("memo")}>관리자 메모</button>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); void savePosition(); }}
            className={`ops-modal-scroll-body ${modalMode === "create" || (modalMode === "detail" && tab === "basic" && isEditMode) ? "ops-position-create-body" : ""}`}
          >
            {modalMode === "create" || tab === "basic" ? (
              <div className={`ops-detail-sections ${modalMode === "detail" && tab === "basic" ? "ops-position-basic-sections-scroll" : ""}`}>
                <section className="ops-detail-section">
                  <h3>공고 기본 정보</h3>
                  {modalMode === "detail" && !isEditMode ? (
                    <div className="ops-detail-grid ops-detail-grid-single ops-position-basic-readonly">
                      <div className="ops-position-basic-status-row">
                        <span>상태</span>
                        <strong>
                          {selectedItem ? (
                            <OpsBadge tone={statusTone(selectedItem.status)}>{statusLabel(selectedItem.status)}</OpsBadge>
                          ) : (
                            "-"
                          )}
                        </strong>
                      </div>
                      <div><span>제목</span><strong>{selectedItem?.title || "-"}</strong></div>
                      <div><span>희망 직무</span><strong>{form.preferredJobRole || "-"}</strong></div>
                      <div>
                        <span>파트너사</span>
                        <strong>{selectedItem?.partnerOrganization ? `${selectedItem.partnerOrganization.name} (${selectedItem.partnerOrganization.domain})` : "선택 안 함"}</strong>
                      </div>
                      <div><span>등록일</span><strong>{selectedItem ? formatDate(selectedItem.createdAt) : "-"}</strong></div>
                      <div><span>선호 국적</span><strong>{form.preferredNationality || "선택 안 함"}</strong></div>
                      <div><span>소통 언어</span><strong>{form.communicationLanguage || "선택 안 함"}</strong></div>
                      <div><span>채용 프로세스</span><strong>{form.hiringProcess || "-"}</strong></div>
                      <div><span>희망 인원</span><strong>{form.hiringCount ? `${form.hiringCount}명` : "-"}</strong></div>
                      <div><span>근무 시간</span><strong>{form.workingHours || "-"}</strong></div>
                      <div><span>근무 복장</span><strong>{form.dressCode || "-"}</strong></div>
                      <div><span>사전 교육 및 과제 희망 여부</span><strong>{form.wantsPreTraining === "yes" ? "희망" : form.wantsPreTraining === "no" ? "비희망" : "미정"}</strong></div>
                      <div><span>주요 업무</span><strong>{form.mainResponsibilities || "-"}</strong></div>
                      <div><span>필수 자격 요건</span><strong>{form.requiredQualifications || "-"}</strong></div>
                      <div><span>우대 자격 요건</span><strong>{form.preferredQualifications || "-"}</strong></div>
                      <div><span>기타 참고 사항</span><strong>{form.additionalNotes || "-"}</strong></div>
                    </div>
                  ) : (
                    <div className={`ops-detail-grid ${modalMode === "create" || (modalMode === "detail" && isEditMode) ? "ops-detail-grid-create" : ""}`}>
                      <label><span>제목 <em className="ops-required">*</em></span><input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} disabled={modalMode === "detail" && !isEditMode} /></label>
                      <label><span>상태</span><select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as PositionStatus }))} disabled={modalMode === "detail" && !isEditMode}><option value="DRAFT">임시저장</option><option value="OPEN">공개</option><option value="MATCHING">매칭 진행</option><option value="CLOSED">마감</option></select></label>
                      <label><span>파트너사</span><select value={form.partnerOrganizationId} onChange={(e) => setForm((p) => ({ ...p, partnerOrganizationId: e.target.value }))} disabled={modalMode === "detail" && !isEditMode}><option value="">선택 안 함</option>{partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name} ({partner.domain})</option>)}</select></label>
                      <label>
                        <span>선호 국적</span>
                        <select
                          value={form.preferredNationality}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, preferredNationality: e.target.value as PreferredNationality | "" }))
                          }
                          disabled={modalMode === "detail" && !isEditMode}
                        >
                          <option value="">선택 안 함</option>
                          {preferredNationalityOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>소통 언어</span>
                        <select
                          value={form.communicationLanguage}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, communicationLanguage: e.target.value as CommunicationLanguage | "" }))
                          }
                          disabled={modalMode === "detail" && !isEditMode}
                        >
                          <option value="">선택 안 함</option>
                          {communicationLanguageOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label><span>채용 프로세스</span><textarea rows={4} value={form.hiringProcess} onChange={(e) => setForm((p) => ({ ...p, hiringProcess: e.target.value }))} disabled={modalMode === "detail" && !isEditMode} /></label>
                      <label><span>희망 직무</span><input value={form.preferredJobRole} onChange={(e) => setForm((p) => ({ ...p, preferredJobRole: e.target.value }))} disabled={modalMode === "detail" && !isEditMode} /></label>
                      <label><span>희망 인원</span><input type="number" min={1} value={form.hiringCount} onChange={(e) => setForm((p) => ({ ...p, hiringCount: e.target.value }))} disabled={modalMode === "detail" && !isEditMode} /></label>
                      <label><span>근무 시간</span><input value={form.workingHours} onChange={(e) => setForm((p) => ({ ...p, workingHours: e.target.value }))} disabled={modalMode === "detail" && !isEditMode} /></label>
                      <label><span>근무 복장</span><input value={form.dressCode} onChange={(e) => setForm((p) => ({ ...p, dressCode: e.target.value }))} disabled={modalMode === "detail" && !isEditMode} /></label>
                      <label><span>사전 교육 및<br></br>과제 희망 여부</span><select value={form.wantsPreTraining} onChange={(e) => setForm((p) => ({ ...p, wantsPreTraining: e.target.value as "yes" | "no" | "unset" }))} disabled={modalMode === "detail" && !isEditMode}><option value="unset">미정</option><option value="yes">희망</option><option value="no">비희망</option></select></label>
                      <label><span>주요 업무</span><textarea rows={5} value={form.mainResponsibilities} onChange={(e) => setForm((p) => ({ ...p, mainResponsibilities: e.target.value }))} disabled={modalMode === "detail" && !isEditMode} /></label>
                      <label><span>필수 자격 요건</span><textarea rows={5} value={form.requiredQualifications} onChange={(e) => setForm((p) => ({ ...p, requiredQualifications: e.target.value }))} disabled={modalMode === "detail" && !isEditMode} /></label>
                      <label><span>우대 자격 요건</span><textarea rows={5} value={form.preferredQualifications} onChange={(e) => setForm((p) => ({ ...p, preferredQualifications: e.target.value }))} disabled={modalMode === "detail" && !isEditMode} /></label>
                      <label><span>기타 참고 사항</span><textarea rows={5} value={form.additionalNotes} onChange={(e) => setForm((p) => ({ ...p, additionalNotes: e.target.value }))} disabled={modalMode === "detail" && !isEditMode} /></label>
                    </div>
                  )}
                </section>
                {modalMode === "detail" && selectedItem ? (
                  <section className="ops-detail-section">
                    <h3>상태 변경 이력</h3>
                    {selectedItem.statusHistories.length === 0 ? (
                      <p className="ops-detail-empty">상태 변경 이력이 없습니다.</p>
                    ) : (
                      <ul className="ops-position-lines">
                        {selectedItem.statusHistories.map((history) => (
                          <li key={history.id}>
                            [{formatDateTime(history.createdAt)}] {history.fromStatus ? statusLabel(history.fromStatus) : "초기"}
                            {" -> "}
                            {statusLabel(history.toStatus)} / {history.createdBy?.name || history.createdBy?.email || "시스템"}
                            {history.note ? ` / ${history.note}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ) : null}
              </div>
            ) : null}

            {modalMode === "detail" && tab === "matching" ? (
              selectedItem ? (
                <section className="ops-detail-section">
                  <h3>매칭 참여자 리스트</h3>
                  <div className="ops-position-inline-form">
                    <input value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} placeholder="참여자명" />
                    <input value={newParticipantNote} onChange={(e) => setNewParticipantNote(e.target.value)} placeholder="메모(선택)" />
                    <button type="button" className="ops-action-save" onClick={() => void addParticipant()}>추가</button>
                  </div>
                  {selectedItem.matchingParticipants.length === 0 ? (
                    <p className="ops-detail-empty">등록된 참여자가 없습니다.</p>
                  ) : (
                    <div className="ops-partner-table-wrap">
                      <table className="ops-partner-table">
                        <thead><tr><th>이름</th><th>메모</th><th>등록자</th><th>등록일</th><th>삭제</th></tr></thead>
                        <tbody>
                          {selectedItem.matchingParticipants.map((it) => (
                            <tr key={it.id}>
                              <td>{it.name}</td>
                              <td>{it.note || "-"}</td>
                              <td>{it.createdBy?.name || it.createdBy?.email || "-"}</td>
                              <td>{formatDateTime(it.createdAt)}</td>
                              <td><button type="button" className="ops-icon-danger-button" onClick={() => void removeParticipant(it.id)}><Trash size={16} /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ) : null
            ) : null}

            {modalMode === "detail" && tab === "logs" ? (
              selectedItem ? (
                <section className="ops-detail-section">
                  <h3>공고 진행 로그</h3>
                  <div className="ops-position-inline-form">
                    <input value={newLogMessage} onChange={(e) => setNewLogMessage(e.target.value)} placeholder="진행 로그 입력" />
                    <button type="button" className="ops-action-save" onClick={() => void addProgressLog()}>추가</button>
                  </div>
                  {selectedItem.postingProgressLogs.length === 0 ? (
                    <p className="ops-detail-empty">진행 로그가 없습니다.</p>
                  ) : (
                    <ul className="ops-position-lines">
                      {selectedItem.postingProgressLogs.map((it) => (
                        <li key={it.id}>
                          [{formatDateTime(it.createdAt)}] {it.message} / {it.createdBy?.name || it.createdBy?.email || "시스템"}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ) : null
            ) : null}

            {modalMode === "detail" && tab === "memo" ? (
              <section className="ops-detail-section">
                <h3>관리자 메모</h3>
                {isEditMode ? (
                  <div className="ops-detail-grid ops-detail-grid-single">
                    <label><span>메모</span><textarea rows={12} value={form.adminMemo} onChange={(e) => setForm((p) => ({ ...p, adminMemo: e.target.value }))} /></label>
                  </div>
                ) : (
                  <div className="ops-detail-grid ops-detail-grid-single">
                    <div><span>메모</span><strong>{selectedItem?.adminMemo || "-"}</strong></div>
                  </div>
                )}
              </section>
            ) : null}

            {formErrorMessage ? <p className="ops-form-error">{formErrorMessage}</p> : null}
          </form>

          <div className="ops-modal-fixed-bottom ops-detail-actions">
            {modalMode === "detail" && !isEditMode ? (
              tab === "basic" || tab === "memo" ? (
                <button type="button" className="ops-action-save" onClick={() => setIsEditMode(true)}>수정</button>
              ) : null
            ) : (
              <>
                {modalMode === "detail" ? (
                  <button type="button" className="ops-action-cancel" onClick={() => { setIsEditMode(false); if (selectedItem) setForm(formFromItem(selectedItem)); }}>취소</button>
                ) : null}
                {tab === "basic" || tab === "memo" || modalMode === "create" ? (
                  <button type="button" className="ops-action-save" disabled={submitting} onClick={() => void savePosition()}>
                    {submitting ? "저장 중..." : modalMode === "create" ? "등록" : "저장"}
                  </button>
                ) : null}
              </>
            )}
          </div>
        </article>
      </dialog>

      <PartnerUnifiedDetailModal
        open={isPartnerDetailModalOpen && !!partnerDetail}
        partner={partnerDetail}
        onClose={requestClosePartnerDetailModal}
        onUpdated={(updated) => {
          setPartnerDetail((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
          setItems((prev) =>
            prev.map((item) =>
              item.partnerOrganization?.id === updated.id
                ? {
                    ...item,
                    partnerOrganization: {
                      ...item.partnerOrganization,
                      name: updated.name
                    }
                  }
                : item
            )
          );
        }}
      />
    </section>
  );
}
