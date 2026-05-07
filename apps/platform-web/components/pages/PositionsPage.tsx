"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import {
  addMyFavoritePosition,
  applyMyPosition,
  getMyAppliedPositions,
  getMyCandidateProfile,
  getMyFavoritePositions,
  getMyPartnerOrganization,
  getPublicPremiumPositionBanners,
  getPositionsMeta,
  getPublicPositionsPage,
  removeMyFavoritePosition,
  type PublicPositionListItem,
  type PublicPremiumPositionBannerItem
} from "../../lib/member-profile-client";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { partnerIndustryLabel } from "../../lib/partner-industry-labels";
import { ALL_POSITIONS, type Position } from "../../lib/positions-data";
import { paperlogy } from "../../lib/fonts";
import {
  MapPin,
  Briefcase,
  Bookmark,
  ChevronDown,
  SlidersHorizontal,
  LayoutGrid,
  List,
  RotateCcw,
  X
} from "lucide-react";

const FALLBACK_JOB_ROLES = Array.from(new Set(ALL_POSITIONS.map((position) => position.category)));
const FALLBACK_WORK_TYPES = ["On-site", "Hybrid", "Remote"] as const;
const FALLBACK_INDUSTRIES = Array.from(new Set(ALL_POSITIONS.map((position) => position.industry)));
const FALLBACK_COMPANY_SIZES = Array.from(new Set(ALL_POSITIONS.map((position) => position.companySize)));
const FALLBACK_VISA_TYPES = Array.from(new Set(ALL_POSITIONS.flatMap((position) => position.eligibleVisas)));
const ALL_VISA_CODES = ["D-2", "D-4", "D-10", "E-7", "F-2", "F-4", "F-5", "F-6", "H-1"] as const;
const PUBLIC_POSITIONS_PAGE_SIZE = 20;
type PositionCard = Position & {
  status: PublicPositionListItem["status"];
  sourceKind: PublicPositionListItem["sourceKind"];
  sourceProvider: PublicPositionListItem["sourceProvider"];
  sourceExternalId: PublicPositionListItem["sourceExternalId"];
  sourceUrl: PublicPositionListItem["sourceUrl"];
  sourceDeadlineDate?: PublicPositionListItem["sourceDeadlineDate"];
  sourceDeadlineRolling?: PublicPositionListItem["sourceDeadlineRolling"];
};
type PositionSourceKind = PublicPositionListItem["sourceKind"];
type PositionSourceProvider = PublicPositionListItem["sourceProvider"];
type PositionSourceFilter = "INTERNAL" | "KOWORK" | "BUDDIES";

function visaTypeLabel(code: string, locale: "ko" | "en") {
  if (locale === "ko") {
    if (code === "D-2") return "유학";
    if (code === "D-4") return "일반연수";
    if (code === "D-10") return "구직";
    if (code === "E-7") return "특정활동";
    if (code === "F-2") return "거주";
    if (code === "F-4") return "재외동포";
    if (code === "F-5") return "영주";
    if (code === "F-6") return "결혼이민";
    if (code === "H-1") return "워킹홀리데이";
    return "기타";
  }
  if (code === "D-2") return "Student";
  if (code === "D-4") return "General training";
  if (code === "D-10") return "Job seeking";
  if (code === "E-7") return "Specific activity";
  if (code === "F-2") return "Residence";
  if (code === "F-4") return "Overseas Korean";
  if (code === "F-5") return "Permanent resident";
  if (code === "F-6") return "Marriage migration";
  if (code === "H-1") return "Working holiday";
  return "Other";
}

function formatEligibleVisasForList(codes: string[], locale: "ko" | "en") {
  if (codes.length === 0) return locale === "ko" ? "무관" : "No restriction";
  const set = new Set(codes);
  const isAllSelected = ALL_VISA_CODES.every((code) => set.has(code));
  if (isAllSelected) return locale === "ko" ? "무관" : "No restriction";
  return codes.join(", ");
}

function mapVisaTypeToCode(visaType: string | null | undefined) {
  if (!visaType) return null;
  if (visaType.includes("-")) return visaType;
  if (visaType === "D10_JOB_SEEKING") return "D-10";
  if (visaType === "D2_STUDENT") return "D-2";
  if (visaType === "D4_GENERAL_TRAINING") return "D-4";
  if (visaType === "F2_RESIDENCE") return "F-2";
  if (visaType === "F4_OVERSEAS_KOREAN") return "F-4";
  if (visaType === "F5_PERMANENT_RESIDENCE") return "F-5";
  if (visaType === "F6_MARRIAGE_IMMIGRATION") return "F-6";
  if (visaType === "E7_SPECIFIC_ACTIVITY") return "E-7";
  if (visaType === "H1_WORKING_HOLIDAY") return "H-1";
  return null;
}

function companySizeLabel(value: string, locale: "ko" | "en") {
  if (value === "SIZE_1_10") return locale === "ko" ? "10인 이하" : "Up to 10";
  if (value === "SIZE_UNDER_30") return locale === "ko" ? "30인 이하" : "Up to 30";
  if (value === "SIZE_UNDER_50") return locale === "ko" ? "50인 이하" : "Up to 50";
  if (value === "SIZE_OVER_100") return locale === "ko" ? "100인 이상" : "100+";
  return value;
}

function workTypeLabel(value: string, locale: "ko" | "en") {
  const normalized = value.toLowerCase().replace(/[\s_-]/g, "");
  if (normalized === "remote") return locale === "ko" ? "원격근무" : "Remote";
  if (normalized === "hybrid") return locale === "ko" ? "혼합근무" : "Hybrid";
  if (normalized === "onsite") return locale === "ko" ? "대면근무" : "On-site";
  return value;
}

function companyHref(partnerOrganizationId?: string | null) {
  if (!partnerOrganizationId?.trim()) return null;
  return `/companies/${encodeURIComponent(partnerOrganizationId.trim())}`;
}

function inferWorkType(value?: string | null): "On-site" | "Hybrid" | "Remote" {
  const text = (value ?? "").toLowerCase();
  if (text.includes("remote") || text.includes("재택")) return "Remote";
  if (text.includes("hybrid") || text.includes("하이브리드")) return "Hybrid";
  return "On-site";
}

function mapPublicPositionToCard(item: PublicPositionListItem, locale: "ko" | "en"): PositionCard {
  const now = Date.now();
  const createdAt = new Date(item.createdAt);
  const postedDays = Number.isNaN(createdAt.getTime())
    ? 0
    : Math.max(0, Math.floor((now - createdAt.getTime()) / (24 * 60 * 60 * 1000)));
  const company =
    item.partnerOrganization?.name?.trim() ||
    item.sourceCompanyName?.trim() ||
    (locale === "ko" ? "파트너 기업" : "Partner company");
  const role = item.title;
  const category = item.preferredJobRole?.trim() || "";
  const workType = item.workType ?? inferWorkType(item.workingHours);
  const startDate = item.startDate ? new Date(item.startDate) : null;
  const startLabel =
    startDate && !Number.isNaN(startDate.getTime())
      ? `${startDate.getFullYear()}.${String(startDate.getMonth() + 1).padStart(2, "0")}.${String(startDate.getDate()).padStart(2, "0")}`
      : locale === "ko" ? "즉시" : "Immediate";
  const statusMatchBase = item.status === "OPEN" ? 86 : 78;
  const match = Math.min(99, Math.max(60, statusMatchBase + Math.min(8, item.matchingParticipantsCount)));
  const tags = [
    ...(item.preferredJobRole ? [item.preferredJobRole] : []),
    ...item.communicationLanguages.slice(0, 2),
    ...(item.workingHours ? [item.workingHours] : [])
  ].filter((value, index, array) => array.indexOf(value) === index).slice(0, 3);

  return {
    id: item.id,
    createdAt: item.createdAt,
    partnerDomain: item.partnerOrganization?.id ?? undefined,
    thumbnailUrl: item.thumbnailImages[0] ?? undefined,
    company,
    initial: company[0]?.toUpperCase() ?? "P",
    role,
    category,
    industry: item.partnerOrganization?.industry ?? "OTHER",
    companySize: companySizeLabel(item.partnerOrganization?.companySize ?? (locale === "ko" ? "미정" : "TBD"), locale),
    eligibleVisas: item.eligibleVisas,
    location: item.workLocation?.trim() || item.partnerOrganization?.officeAddress?.trim() || (locale === "ko" ? "협의" : "To be discussed"),
    type: workType,
    start: startLabel,
    postedDays,
    applicants: item.matchingParticipantsCount,
    match,
    tags,
    highlight: postedDays <= 3 ? "New" : item.status === "OPEN" ? "Hot" : undefined,
    status: item.status,
    sourceKind: item.sourceKind,
    sourceProvider: item.sourceProvider,
    sourceExternalId: item.sourceExternalId,
    sourceUrl: item.sourceUrl
    ,
    sourceDeadlineDate: item.sourceDeadlineDate,
    sourceDeadlineRolling: item.sourceDeadlineRolling
  };
}

function isExternalSource(sourceKind: PositionSourceKind) {
  return sourceKind === "EXTERNAL";
}

function formatPostedDate(position: Position, locale: "ko" | "en") {
  if (position.createdAt) {
    const created = new Date(position.createdAt);
    if (!Number.isNaN(created.getTime())) {
      const now = Date.now();
      const diffMs = Math.max(0, now - created.getTime());
      const minutes = Math.floor(diffMs / (60 * 1000));
      if (minutes < 60) return locale === "ko" ? `${Math.max(1, minutes)}분 전` : `${Math.max(1, minutes)}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return locale === "ko" ? `${hours}시간 전` : `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return locale === "ko" ? `${days}일 전` : `${days}d ago`;
      const y = created.getFullYear();
      const m = String(created.getMonth() + 1).padStart(2, "0");
      const d = String(created.getDate()).padStart(2, "0");
      return `${y}. ${m}. ${d}`;
    }
  }
  if (position.postedDays <= 0) return locale === "ko" ? "오늘" : "Today";
  return locale === "ko" ? `${position.postedDays}일 전` : `${position.postedDays}d ago`;
}

function formatDeadlineDday(ymd: string, locale: "ko" | "en") {
  const parsed = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!parsed) return ymd;
  const year = Number(parsed[1]);
  const month = Number(parsed[2]);
  const day = Number(parsed[3]);
  const now = new Date();
  const todayKstMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const deadlineKstMs = Date.UTC(year, month - 1, day);
  const diffDays = Math.floor((deadlineKstMs - todayKstMs) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return locale === "ko" ? "D-day" : "D-day";
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
}

export function PositionsPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const { user, isReady, isAuthenticated } = useAuthSession();
  const [positions, setPositions] = useState<PositionCard[]>([]);
  const [isPositionsLoading, setIsPositionsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [jobRoles, setJobRoles] = useState<string[]>([]);
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [companySizes, setCompanySizes] = useState<string[]>([]);
  const [visaTypes, setVisaTypes] = useState<string[]>([]);
  const [positionSources, setPositionSources] = useState<PositionSourceFilter[]>([]);
  const [industryOptions, setIndustryOptions] = useState<string[]>(FALLBACK_INDUSTRIES);
  const [jobRoleOptions, setJobRoleOptions] = useState<string[]>(FALLBACK_JOB_ROLES);
  const [companySizeOptions, setCompanySizeOptions] = useState<string[]>(FALLBACK_COMPANY_SIZES);
  const [visaTypeOptions, setVisaTypeOptions] = useState<string[]>(FALLBACK_VISA_TYPES);
  const [workTypeOptions, setWorkTypeOptions] = useState<string[]>([...FALLBACK_WORK_TYPES]);
  const [myVisaCode, setMyVisaCode] = useState<string | null>(null);
  const [onlyMyVisaEligible, setOnlyMyVisaEligible] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const [filterPopupMode, setFilterPopupMode] = useState<"all" | "section">("all");
  const [activeFilterSection, setActiveFilterSection] = useState<"jobRole" | "source">("jobRole");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [premiumBanners, setPremiumBanners] = useState<PublicPremiumPositionBannerItem[]>([]);
  const [isPremiumBannersLoading, setIsPremiumBannersLoading] = useState(true);
  const [premiumBannerError, setPremiumBannerError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState("");
  const [myPartnerOrganizationId, setMyPartnerOrganizationId] = useState<string | null>(null);
  const isKo = locale === "ko";

  const copy = {
    filter: isKo ? "필터" : "Filters",
    allFilters: isKo ? "전체 필터" : "All filters",
    sectionFilter: isKo ? "선택 섹션 필터" : "Section filters",
    applyHint: isKo ? "선택 즉시 전체 목록에 적용" : "Selections are applied immediately",
    reset: isKo ? "초기화" : "Reset",
    closeFilter: isKo ? "필터 닫기" : "Close filters",
    removeFilterSuffix: isKo ? "필터 제거" : "Remove filter",
    industry: isKo ? "산업군" : "Industry",
    jobRole: isKo ? "직무" : "Role",
    companySize: isKo ? "규모" : "Size",
    visa: isKo ? "비자" : "Visa",
    workType: isKo ? "근무 형태" : "Work type",
    source: isKo ? "소스" : "Source",
    listView: isKo ? "리스트 보기" : "List view",
    gridView: isKo ? "그리드 보기" : "Grid view",
    title: isKo ? "글로벌 인재를 위한 오픈 포지션" : "Global Open Positions",
    subtitle: isKo
      ? "지금 열려 있는 포지션을 빠르게 둘러보고, 내 조건에 맞는 공고를 찾아보세요."
      : "Find roles that fit you.",
    createPosition: isKo ? "포지션 생성하기" : "Create position",
    bannerAlt: isKo ? "글로벌 인재 포지션 탐색 배너" : "Global talent position banner",
    searchPlaceholder: isKo ? "직무, 기업, 스킬로 검색 (예: Designer, AI, Seoul)" : "Search by role, company, or skill (e.g., Designer, AI, Seoul)",
    search: isKo ? "검색" : "Search",
    popularSearch: isKo ? "인기 검색" : "Popular searches",
    premiumTitle: isKo ? "이런 포지션은 어떠세요?" : "Featured Positions",
    premiumSubtitle: isKo ? "지금 주목받는 포지션을 먼저 확인해보세요." : "See highlighted positions first.",
    noPremium: isKo ? "현재 노출 가능한 프리미엄 배너가 없습니다." : "No premium banners are available right now.",
    premiumError: isKo
      ? "프리미엄 배너를 불러오지 못했습니다. API 연결 상태와 배너 조건을 확인해주세요."
      : "Failed to load premium banners. Check API connectivity and banner conditions.",
    myVisaOnly: isKo ? "내 비자로 지원 가능만" : "Only eligible for my visa",
    myVisaMissing: isKo ? "비자정보 필요" : "Visa info required",
    noResultTitle: isKo ? "조건에 맞는 포지션이 없습니다" : "No positions match your filters",
    noResultDesc: isKo ? "필터를 조정하거나 다른 키워드로 검색해보세요." : "Adjust filters or try different keywords.",
    resetFilters: isKo ? "필터 초기화" : "Reset filters",
    loadingMore: isKo ? "불러오는 중..." : "Loading...",
    loadMore: isKo ? "더 많은 포지션 보기" : "Load more positions",
    loginRequiredFavorite: isKo ? "로그인한 회원만 즐겨찾기를 사용할 수 있습니다." : "Only signed-in users can use favorites.",
    studentRequiredFavorite: isKo ? "학생 계정만 즐겨찾기를 사용할 수 있습니다." : "Only student accounts can use favorites.",
    favoriteFailed: isKo ? "즐겨찾기 처리에 실패했습니다." : "Failed to update favorite.",
    loginRequiredApply: isKo ? "로그인한 회원만 지원할 수 있습니다." : "Only signed-in users can apply.",
    studentRequiredApply: isKo ? "파트너 회원, 어드민은 지원하기에 지원할 수 없습니다." : "Partner and admin accounts cannot apply.",
    applyFailed: isKo ? "지원 처리에 실패했습니다." : "Failed to apply.",
    detailSuffix: isKo ? "상세보기" : "View details",
    thumbnailSuffix: isKo ? "썸네일" : "thumbnail",
    save: isKo ? "저장" : "Save",
    edit: isKo ? "수정하기" : "Edit",
    applyDone: isKo ? "지원완료" : "Applied",
    apply: isKo ? "지원하기" : "Apply",
    viewDetails: isKo ? "상세보기" : "View details",
    loginPromptTitle: isKo ? "로그인이 필요한 기능입니다." : "Sign in is required for this action.",
    loginPromptLogin: isKo ? "로그인하기" : "Go to login",
    cancel: isKo ? "취소" : "Cancel",
    countSuffix: isKo ? "개" : "",
    activeVisaLabel: (visa: string | null) =>
      `${isKo ? "내 비자로 지원 가능만" : "Only eligible for my visa"} ${visa ? `(${visa})` : `(${isKo ? "비자정보 필요" : "Visa info required"})`}`
  } as const;

  const toggle = <T extends string>(list: T[], setList: (v: T[]) => void, value: T) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const applySearch = () => {
    setQuery(searchInput.trim());
  };

  const premiumPositionCards = useMemo(
    () => premiumBanners.map((banner) => mapPublicPositionToCard(banner.position, locale)),
    [premiumBanners, locale]
  );
  const filtered = positions;

  const hasMorePositions = Boolean(nextCursor);
  const filterSections = [
    { id: "jobRole" as const, label: copy.jobRole },
    { id: "source" as const, label: copy.source }
  ];
  const activeFilterSectionLabel = filterSections.find((section) => section.id === activeFilterSection)?.label ?? copy.filter;
  const filterPopupTitle = filterPopupMode === "all" ? copy.allFilters : activeFilterSectionLabel;
  const activeSectionFilterCount = activeFilterSection === "jobRole" ? jobRoles.length : positionSources.length;
  const selectedFilterChips = [
    ...jobRoles.map((value) => ({
      key: `jobRole:${value}`,
      label: value,
      onRemove: () => toggle(jobRoles, setJobRoles, value)
    })),
    ...positionSources.map((value) => ({
      key: `source:${value}`,
      label: value === "INTERNAL" ? (isKo ? "생성" : "Created") : value === "KOWORK" ? "KOWORK" : "BUDDIES",
      onRemove: () => toggle(positionSources, setPositionSources, value)
    }))
  ];

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const page = await getPublicPositionsPage({
          limit: PUBLIC_POSITIONS_PAGE_SIZE,
          search: query,
          jobRoles: jobRoles.length ? [...jobRoles] : undefined,
          sortOrder: "desc",
          sourceProviders: positionSources.length ? [...positionSources] : undefined
        });
        if (ignore) return;
        setPositions(page.items.map((item) => mapPublicPositionToCard(item, locale)));
        setNextCursor(page.nextCursor);
      } catch {
        if (ignore) return;
        setPositions([]);
        setNextCursor(null);
      } finally {
        if (!ignore) setIsPositionsLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [positionSources, locale, query, jobRoles]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const items = await getPublicPremiumPositionBanners();
        if (ignore) return;
        setPremiumBanners(items);
        setPremiumBannerError(null);
      } catch {
        if (!ignore) {
          setPremiumBanners([]);
          setPremiumBannerError(copy.premiumError);
        }
      } finally {
        if (!ignore) setIsPremiumBannersLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !isAuthenticated || user?.role !== "STUDENT") {
      setMyVisaCode(null);
      return;
    }

    let ignore = false;
    (async () => {
      try {
        const profile = await getMyCandidateProfile();
        if (ignore) return;
        setMyVisaCode(mapVisaTypeToCode(profile?.visaType ?? null));
      } catch {
        if (ignore) return;
        setMyVisaCode(null);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [isReady, isAuthenticated, user?.role]);

  useEffect(() => {
    if (!isReady || !isAuthenticated || user?.role !== "PARTNER") {
      setMyPartnerOrganizationId(null);
      return;
    }
    let ignore = false;
    void (async () => {
      try {
        const org = await getMyPartnerOrganization();
        if (ignore) return;
        setMyPartnerOrganizationId(org?.id ?? null);
      } catch {
        if (!ignore) setMyPartnerOrganizationId(null);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [isReady, isAuthenticated, user?.role]);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || !user?.id || user.role !== "STUDENT") {
      setFavoriteIds([]);
      setAppliedIds([]);
      return;
    }
    let ignore = false;
    void (async () => {
      try {
        const [favorites, applied] = await Promise.all([getMyFavoritePositions(), getMyAppliedPositions()]);
        if (ignore) return;
        setFavoriteIds(favorites.map((item) => item.id));
        setAppliedIds(applied.map((item) => item.id));
      } catch {
        if (!ignore) {
          setFavoriteIds([]);
          setAppliedIds([]);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [isReady, isAuthenticated, user?.id, user?.role]);

  async function toggleFavorite(positionId: string) {
    if (!isAuthenticated || !user?.id) {
      setLoginPromptMessage(copy.loginRequiredFavorite);
      setIsLoginPromptOpen(true);
      return;
    }
    if (user.role !== "STUDENT") {
      window.alert(copy.studentRequiredFavorite);
      return;
    }
    const isFavorite = favoriteIds.includes(positionId);
    const optimistic = isFavorite
      ? favoriteIds.filter((id) => id !== positionId)
      : [...favoriteIds, positionId];
    setFavoriteIds(optimistic);
    try {
      if (isFavorite) {
        await removeMyFavoritePosition(positionId);
      } else {
        await addMyFavoritePosition(positionId);
      }
    } catch (error) {
      setFavoriteIds(favoriteIds);
      window.alert(error instanceof Error ? error.message : copy.favoriteFailed);
    }
  }

  async function applyFromList(positionId: string) {
    if (!isAuthenticated || !user?.id) {
      setLoginPromptMessage(copy.loginRequiredApply);
      setIsLoginPromptOpen(true);
      return;
    }
    if (user.role !== "STUDENT") {
      window.alert(copy.studentRequiredApply);
      return;
    }
    if (appliedIds.includes(positionId)) return;
    const optimistic = [...appliedIds, positionId];
    setAppliedIds(optimistic);
    try {
      await applyMyPosition(positionId);
    } catch (error) {
      setAppliedIds(appliedIds);
      window.alert(error instanceof Error ? error.message : copy.applyFailed);
    }
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const meta = await getPositionsMeta();
        if (ignore) return;
        if (meta.partnerIndustries.length) setIndustryOptions(meta.partnerIndustries);
        if (meta.jobRoles.length) setJobRoleOptions(meta.jobRoles);
        if (meta.partnerCompanySizes.length) {
          setCompanySizeOptions(meta.partnerCompanySizes.map((value) => companySizeLabel(value, locale)));
        }
        if (meta.candidateVisaTypes.length) {
          const mapped = Array.from(
            new Set(meta.candidateVisaTypes.map((value) => mapVisaTypeToCode(value)).filter((value) => typeof value === "string"))
          ) as string[];
          if (mapped.length) setVisaTypeOptions(mapped);
        }
        if (meta.workTypes.length) setWorkTypeOptions(meta.workTypes);
      } catch {
        // keep fallback options when meta API is unavailable
      }
    })();
    return () => {
      ignore = true;
    };
  }, [copy.premiumError, locale]);

  const clearAll = () => {
    setJobRoles([]);
    setPositionSources([]);
  };

  const clearActiveSection = () => {
    if (activeFilterSection === "jobRole") {
      setJobRoles([]);
      return;
    }
    setPositionSources([]);
  };

  async function handleLoadMorePositions() {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const page = await getPublicPositionsPage({
        cursor: nextCursor,
        limit: PUBLIC_POSITIONS_PAGE_SIZE,
        search: query,
        jobRoles: jobRoles.length ? [...jobRoles] : undefined,
        sortOrder: "desc",
        sourceProviders: positionSources.length ? [...positionSources] : undefined
      });
      const mapped = page.items.map((item) => mapPublicPositionToCard(item, locale));
      setPositions((prev) => {
        const existing = new Set(prev.map((item) => item.id));
        const appended = mapped.filter((item) => !existing.has(item.id));
        return [...prev, ...appended];
      });
      setNextCursor(page.nextCursor);
    } catch {
      // keep current list
    } finally {
      setIsLoadingMore(false);
    }
  }

  const shouldShowLoadingPlaceholder = isPositionsLoading && positions.length === 0 && premiumPositionCards.length === 0;
  const placeholderItems = Array.from({ length: 6 }, (_, index) => index);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="pb-20">
        <section className="bg-gradient-to-b from-muted/40 to-background">
          <div className="container py-12 md:py-16">
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-col">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h1 className={`${paperlogy.className} text-3xl font-black tracking-[-0.03em] text-black md:text-5xl`}>
                      {copy.title}
                    </h1>
                    <p className="mt-2 text-sm font-normal text-slate-600 md:text-base">
                      {copy.subtitle}
                    </p>
                  </div>
                  {user?.role === "PARTNER" ? (
                    <Button
                      variant="dark"
                      size="lg"
                      asChild
                      className="w-full rounded-xl bg-[#b7ff5a] font-semibold text-[#111111] transition-colors hover:bg-[#a8ee4d] md:w-auto"
                    >
                      <Link href="/positions/create">{copy.createPosition}</Link>
                    </Button>
                  ) : null}
                </div>

                <div className="relative mt-4 h-[180px] overflow-hidden rounded-2xl bg-white md:h-[220px]">
                  <Image
                    src="/img_position_hero.webp"
                    alt={copy.bannerAlt}
                    width={1680}
                    height={945}
                    preload
                    fetchPriority="high"
                    quality={70}
                    sizes="(max-width: 768px) 100vw, 896px"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>

              <div className="mt-8">
                <div className="flex flex-col gap-3">
                  <div className="mx-auto flex w-full items-center gap-2 rounded-2xl bg-white p-2">
                    <div className="flex-1">
                      <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applySearch();
                          }
                        }}
                        placeholder={copy.searchPlaceholder}
                        className="h-11 w-full rounded-xl bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                      />
                    </div>
                    <Button
                      variant="dark"
                      size="lg"
                      className="h-11 shrink-0 rounded-xl bg-[#b7ff5a] px-4 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#a8ee4d]"
                      type="button"
                      onClick={applySearch}
                    >
                      {copy.search}
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
                  <span className="text-xs font-semibold text-muted-foreground">{copy.popularSearch}</span>
                  {["Design", "Remote", "IT", "D-10", "AI"].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => {
                        setSearchInput(chip);
                        setQuery(chip);
                      }}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {isPremiumBannersLoading ? (
                <section className="mt-12" aria-hidden>
                  <div className="mb-4 h-8 w-64 animate-pulse rounded bg-muted" />
                  <div className="grid gap-3 md:grid-cols-3">
                    {Array.from({ length: 3 }, (_, index) => (
                      <div key={`premium-banner-skeleton-${index}`} className="rounded-xl border border-border/60 bg-card p-4">
                        <div className="h-[160px] animate-pulse rounded-lg bg-muted" />
                        <div className="mt-3 space-y-2">
                          <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : premiumBanners.length > 0 ? (
                <section className="mt-12">
                  <h2 className={`${paperlogy.className} mb-4 text-3xl font-black tracking-[-0.03em] text-[#0B1227] md:text-5xl`}>
                    {copy.premiumTitle}
                  </h2>
                  <p className="mb-4 text-sm text-slate-600 md:text-base">{copy.premiumSubtitle}</p>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {premiumBanners.map((banner) => (
                      <Link
                        key={banner.id}
                        href={`/positions/${banner.positionId}`}
                        className="block w-[calc(160px*16/9)] shrink-0 rounded-xl border border-border/60 bg-card p-4"
                      >
                        <div className="h-[160px] overflow-hidden rounded-lg bg-muted">
                          <img src={banner.bannerImageUrl} alt={banner.bannerTitle} className="h-full w-full object-cover" />
                        </div>
                        <div className="mt-3">
                          <p className="line-clamp-2 text-base font-bold leading-tight text-foreground">{banner.bannerTitle}</p>
                          {banner.bannerSubtitle ? (
                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{banner.bannerSubtitle}</p>
                          ) : null}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : premiumBannerError ? (
                <section className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {premiumBannerError}
                </section>
              ) : null}
            </div>
          </div>
        </section>

        <section className="container">
          <div className="mx-auto max-w-4xl">
            <div>
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 gap-2 px-3"
                    onClick={() => {
                      if (isFilterPopupOpen && filterPopupMode === "all") {
                        setIsFilterPopupOpen(false);
                        return;
                      }
                      setFilterPopupMode("all");
                      setIsFilterPopupOpen(true);
                    }}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    {copy.filter}
                    <ChevronDown className={`h-4 w-4 transition-transform ${isFilterPopupOpen ? "rotate-180" : ""}`} />
                  </Button>
                  <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
                    {filterSections.map((section) => (
                      <Button
                        key={section.id}
                        type="button"
                        variant="outline"
                        className="h-9 shrink-0 px-3"
                        onClick={() => {
                          setActiveFilterSection(section.id);
                          setFilterPopupMode("section");
                          setIsFilterPopupOpen(true);
                        }}
                      >
                        {section.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant={viewMode === "list" ? "dark" : "outline"}
                    size="icon"
                    aria-label={copy.listView}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === "grid" ? "dark" : "outline"}
                    size="icon"
                    aria-label={copy.gridView}
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {selectedFilterChips.length > 0 ? (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={clearAll}
                    className="inline-flex h-7 items-center gap-1 rounded-full px-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {copy.reset}
                  </button>
                  {selectedFilterChips.map((chip) => (
                    <span key={chip.key} className="inline-flex h-7 items-center gap-1 rounded-full bg-foreground px-2.5 text-xs text-background">
                      {chip.label}
                      <button
                        type="button"
                        aria-label={`${chip.label} ${copy.removeFilterSuffix}`}
                        onClick={chip.onRemove}
                        className="text-background/90 hover:text-background"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              {isFilterPopupOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
                    onClick={() => setIsFilterPopupOpen(false)}
                  >
                  <div
                    className="w-full max-w-3xl rounded-2xl border border-border bg-card p-5"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        <h2 className="font-display text-base font-bold">{filterPopupTitle}</h2>
                        <span className="text-xs text-muted-foreground">
                          {filterPopupMode === "all" ? copy.allFilters : copy.sectionFilter} · {copy.applyHint}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeSectionFilterCount > 0 ? (
                          <button onClick={clearActiveSection} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                            <RotateCcw className="h-3 w-3" /> {copy.reset}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          aria-label={copy.closeFilter}
                          onClick={() => setIsFilterPopupOpen(false)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[56vh] overflow-y-auto p-1">
                      {filterPopupMode === "all" || activeFilterSection === "jobRole" ? (
                        <div className="mb-4 last:mb-0">
                          <div className="flex flex-wrap gap-2">
                            {jobRoleOptions.map((role) => (
                              <FilterBadge
                                key={role}
                                label={role}
                                active={jobRoles.includes(role)}
                                onClick={() => toggle(jobRoles, setJobRoles, role)}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {filterPopupMode === "all" || activeFilterSection === "source" ? (
                        <div className="mb-4 last:mb-0">
                          <div className="flex flex-wrap gap-2">
                            {([
                              { key: "INTERNAL", label: isKo ? "생성" : "Created" },
                              { key: "KOWORK", label: "KOWORK" },
                              { key: "BUDDIES", label: "BUDDIES" }
                            ] as const).map((item) => (
                              <FilterBadge
                                key={item.key}
                                label={item.label}
                                active={positionSources.includes(item.key)}
                                onClick={() => toggle(positionSources, setPositionSources, item.key)}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  </div>
                </>
              ) : null}

              {shouldShowLoadingPlaceholder ? (
                viewMode === "grid" ? (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {placeholderItems.map((item) => (
                      <article
                        key={`grid-skeleton-${item}`}
                        className="overflow-hidden rounded-xl border border-border/60 bg-card p-4"
                        aria-hidden
                      >
                        <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-muted" />
                        <div className="mt-4 space-y-2">
                          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                          <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {placeholderItems.map((item) => (
                      <article
                        key={`list-skeleton-${item}`}
                        className="rounded-xl border border-border/60 bg-card p-4"
                        aria-hidden
                      >
                        <div className="flex flex-col gap-2 md:grid md:grid-cols-[180px_1fr_auto] md:items-stretch md:gap-3">
                          <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-muted md:w-[180px]" />
                          <div className="space-y-2 md:flex md:flex-col md:justify-center">
                            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                          </div>
                          <div className="h-10 w-[120px] animate-pulse self-end rounded bg-muted" />
                        </div>
                      </article>
                    ))}
                  </div>
                )
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-16 text-center">
                  <p className="font-display text-lg font-semibold">{copy.noResultTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{copy.noResultDesc}</p>
                  <Button variant="outline" className="mt-4" onClick={clearAll}>{copy.resetFilters}</Button>
                </div>
              ) : (
                viewMode === "grid" ? (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((p) => {
                      const isOwnPartnerPosting = !!myPartnerOrganizationId && p.partnerDomain === myPartnerOrganizationId;

                      return (
                        <PositionGridCard
                          key={p.id}
                          p={p}
                          isOwnPartnerPosting={isOwnPartnerPosting}
                          isStudentUser={user?.role === "STUDENT"}
                          isApplied={appliedIds.includes(p.id)}
                          isFavorite={favoriteIds.includes(p.id)}
                          onToggleFavorite={() => toggleFavorite(p.id)}
                          onApply={() => {
                            void applyFromList(p.id);
                          }}
                          locale={locale}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((p) => {
                      const isOwnPartnerPosting = !!myPartnerOrganizationId && p.partnerDomain === myPartnerOrganizationId;

                      return (
                        <PositionRow
                          key={p.id}
                          p={p}
                          isOwnPartnerPosting={isOwnPartnerPosting}
                          isStudentUser={user?.role === "STUDENT"}
                          isApplied={appliedIds.includes(p.id)}
                          isFavorite={favoriteIds.includes(p.id)}
                          onToggleFavorite={() => toggleFavorite(p.id)}
                          onApply={() => {
                            void applyFromList(p.id);
                          }}
                          locale={locale}
                        />
                      );
                    })}
                  </div>
                )
              )}

              {hasMorePositions ? (
                <div className="mt-10 flex items-center justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      void handleLoadMorePositions();
                    }}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? copy.loadingMore : copy.loadMore}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
      {isLoginPromptOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setIsLoginPromptOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-elevated"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold tracking-tight">{copy.loginPromptTitle}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{loginPromptMessage}</p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsLoginPromptOpen(false)}
              >
                {copy.cancel}
              </Button>
              <Button
                variant="dark"
                onClick={() => {
                  setIsLoginPromptOpen(false);
                  router.push("/login");
                }}
              >
                {copy.loginPromptLogin}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
}

const FilterBadge = ({
  label,
  active,
  onClick,
  disabled
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex h-9 items-center whitespace-nowrap rounded-full border px-3 text-sm transition-colors ${
      disabled
        ? "cursor-not-allowed border-border bg-muted text-muted-foreground/60"
        : active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
    }`}
  >
    {label}
  </button>
);

const PositionRow = ({
  p,
  isOwnPartnerPosting,
  isStudentUser,
  isApplied,
  isFavorite,
  onToggleFavorite,
  onApply,
  locale
}: {
  p: PositionCard;
  isOwnPartnerPosting: boolean;
  isStudentUser: boolean;
  isApplied: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onApply: () => void;
  locale: "ko" | "en";
}) => {
  const isKo = locale === "ko";
  const href = companyHref(p.partnerDomain);
  const copy = {
    detailSuffix: isKo ? "상세보기" : "View details",
    thumbnailSuffix: isKo ? "썸네일" : "thumbnail",
    save: isKo ? "저장" : "Save",
    edit: isKo ? "수정하기" : "Edit",
    applyDone: isKo ? "지원완료" : "Applied",
    apply: isKo ? "지원하기" : "Apply",
    viewDetails: isKo ? "상세보기" : "View details",
    externalLink: isKo ? "보러가기" : "View"
  } as const;
  const externalLinkLabel =
    p.sourceProvider === "KOWORK"
      ? (isKo ? "Kowork로 보러가기" : "View on Kowork")
      : p.sourceProvider === "BUDDIES"
        ? (isKo ? "Buddies로 보러가기" : "View on Buddies")
        : copy.externalLink;
  const detailHref = isExternalSource(p.sourceKind) && p.sourceUrl ? p.sourceUrl : `/positions/${p.id}`;
  return (
    <article className="group relative rounded-xl border border-border/60 bg-card p-4">
      {isExternalSource(p.sourceKind) && p.sourceUrl ? (
        <a
          href={detailHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${p.role} ${copy.detailSuffix}`}
          className="absolute inset-0 z-10 rounded-xl"
        />
      ) : (
        <Link
          href={detailHref}
          aria-label={`${p.role} ${copy.detailSuffix}`}
          className="absolute inset-0 z-10 rounded-xl"
        />
      )}
      <div className="absolute right-4 top-3 z-20 text-right">
        <p className="text-[11px] text-muted-foreground">{formatPostedDate(p, locale)}</p>
        {p.sourceDeadlineDate ? (
          <p className="mt-0.5 text-[11px] font-medium text-rose-600">
            {formatDeadlineDday(p.sourceDeadlineDate, locale)}
          </p>
        ) : p.sourceDeadlineRolling ? (
          <p className="mt-0.5 text-[11px] font-medium text-rose-600">
            {isKo ? "채용시 마감" : "Rolling deadline"}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 md:grid md:grid-cols-[180px_1fr_auto] md:items-stretch md:gap-3">
        <div className="relative aspect-[16/9] w-full shrink-0 self-start overflow-hidden rounded-xl md:w-[180px] md:self-auto">
          {p.thumbnailUrl ? (
            <img
              src={p.thumbnailUrl}
              alt={`${p.company} ${copy.thumbnailSuffix}`}
              className="block h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-muted font-display text-2xl font-bold leading-none text-muted-foreground">
              {p.initial}
            </div>
          )}
        </div>

        <div className="flex-1 md:flex md:flex-col md:justify-center">
          <div className="mb-0.5 min-w-0 text-xs text-muted-foreground">
            {href ? (
              <Link href={href} className="relative z-20 block max-w-[45%] truncate font-semibold hover:text-foreground">
                {p.company}
              </Link>
            ) : (
              <p className="max-w-[45%] truncate font-semibold">{p.company}</p>
            )}
            {p.category ? <p className="mt-1 truncate leading-tight">{p.category}</p> : null}
          </div>
          <h3 className="mt-1.5 mb-1.5 line-clamp-2 font-display text-lg font-bold leading-snug">{p.role}</h3>
          <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-muted-foreground">
            <span className="inline-flex min-w-0 max-w-[50%] items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" />{p.location}</span>
            <span className="inline-flex min-w-0 items-center gap-1 truncate"><Briefcase className="h-3 w-3 shrink-0" />{workTypeLabel(p.type, locale)}</span>
          </div>
        </div>

        <div className="relative z-20 flex shrink-0 flex-row items-center justify-between gap-2 border-t border-border/60 pt-1.5 md:mt-auto md:self-end md:border-0 md:pt-0">
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" aria-label={copy.save} onClick={onToggleFavorite}>
              <Bookmark className={isFavorite ? "fill-current text-foreground" : ""} />
            </Button>
            {isExternalSource(p.sourceKind) && p.sourceUrl ? (
              <Button variant="dark" size="sm" asChild>
                <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  {externalLinkLabel}
                </a>
              </Button>
            ) : isOwnPartnerPosting ? (
              <Button variant="dark" size="sm" asChild>
                <Link href={`/positions/${p.id}/edit`}>{copy.edit}</Link>
              </Button>
            ) : isStudentUser ? (
              <Button
                variant="dark"
                size="sm"
                onClick={onApply}
                disabled={isApplied}
                className={isApplied ? "border border-zinc-300 bg-zinc-200 text-zinc-500 hover:bg-zinc-200 disabled:opacity-100" : undefined}
              >
                {isApplied ? copy.applyDone : copy.apply}
              </Button>
            ) : (
              <Button variant="dark" size="sm" asChild>
                <Link href={`/positions/${p.id}`}>{copy.apply}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

const PositionGridCard = ({
  p,
  isOwnPartnerPosting,
  isStudentUser,
  isApplied,
  isFavorite,
  onToggleFavorite,
  onApply,
  locale
}: {
  p: PositionCard;
  isOwnPartnerPosting: boolean;
  isStudentUser: boolean;
  isApplied: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onApply: () => void;
  locale: "ko" | "en";
}) => {
  const isKo = locale === "ko";
  const href = companyHref(p.partnerDomain);
  const copy = {
    detailSuffix: isKo ? "상세보기" : "View details",
    thumbnailSuffix: isKo ? "썸네일" : "thumbnail",
    save: isKo ? "저장" : "Save",
    edit: isKo ? "수정하기" : "Edit",
    applyDone: isKo ? "지원완료" : "Applied",
    apply: isKo ? "지원하기" : "Apply",
    externalLink: isKo ? "보러가기" : "View"
  } as const;
  const externalLinkLabel =
    p.sourceProvider === "KOWORK"
      ? (isKo ? "Kowork로 보러가기" : "View on Kowork")
      : p.sourceProvider === "BUDDIES"
        ? (isKo ? "Buddies로 보러가기" : "View on Buddies")
        : copy.externalLink;
  const detailHref = isExternalSource(p.sourceKind) && p.sourceUrl ? p.sourceUrl : `/positions/${p.id}`;
  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-border/60 bg-card p-4">
      {isExternalSource(p.sourceKind) && p.sourceUrl ? (
        <a
          href={detailHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${p.role} ${copy.detailSuffix}`}
          className="absolute inset-0 z-10 rounded-xl"
        />
      ) : (
        <Link
          href={detailHref}
          aria-label={`${p.role} ${copy.detailSuffix}`}
          className="absolute inset-0 z-10 rounded-xl"
        />
      )}
      <div className="mb-2 text-right">
        <p className="text-[11px] text-muted-foreground">{formatPostedDate(p, locale)}</p>
        {p.sourceDeadlineDate ? (
          <p className="mt-0.5 text-[11px] font-medium text-rose-600">
            {formatDeadlineDday(p.sourceDeadlineDate, locale)}
          </p>
        ) : p.sourceDeadlineRolling ? (
          <p className="mt-0.5 text-[11px] font-medium text-rose-600">
            {isKo ? "채용시 마감" : "Rolling deadline"}
          </p>
        ) : null}
      </div>
      <div className="relative">
        {p.thumbnailUrl ? (
          <img src={p.thumbnailUrl} alt={`${p.company} ${copy.thumbnailSuffix}`} className="block aspect-[16/9] w-full rounded-xl object-cover" />
        ) : (
          <div className="grid aspect-[16/9] w-full place-items-center rounded-xl bg-muted font-display text-4xl font-bold text-muted-foreground">
            {p.initial}
          </div>
        )}
      </div>
      <div className="mt-4 text-xs text-muted-foreground">
        <div className="min-w-0 md:flex md:flex-col md:justify-center">
          {href ? (
            <Link href={href} className="relative z-20 block truncate font-semibold hover:text-foreground">
              {p.company}
            </Link>
          ) : (
            <p className="truncate font-semibold">{p.company}</p>
          )}
          {p.category ? <p className="mt-1 truncate">{p.category}</p> : null}
        </div>
      </div>
      <h3 className="mt-2 mb-2 line-clamp-2 font-display text-base font-bold leading-tight">{p.role}</h3>
      <div className="mt-1.5 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-muted-foreground">
        <span className="inline-flex min-w-0 max-w-[58%] items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" />{p.location}</span>
        <span className="inline-flex min-w-0 items-center gap-1 truncate"><Briefcase className="h-3 w-3 shrink-0" />{workTypeLabel(p.type, locale)}</span>
      </div>
      <div className="relative z-20 mt-auto flex items-center gap-2 pt-3">
        <Button variant="outline" size="icon" aria-label={copy.save} onClick={onToggleFavorite}>
          <Bookmark className={isFavorite ? "fill-current text-foreground" : ""} />
        </Button>
        {isExternalSource(p.sourceKind) && p.sourceUrl ? (
          <Button variant="dark" className="h-10 flex-1 text-sm" asChild>
                <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  {externalLinkLabel}
                </a>
              </Button>
        ) : isOwnPartnerPosting ? (
          <Button variant="dark" className="h-10 flex-1 text-sm" asChild>
            <Link href={`/positions/${p.id}/edit`}>{copy.edit}</Link>
          </Button>
        ) : isStudentUser ? (
          <Button
            variant="dark"
            className={`h-10 flex-1 text-sm ${isApplied ? "border border-zinc-300 bg-zinc-200 text-zinc-500 hover:bg-zinc-200 disabled:opacity-100" : ""}`}
            onClick={onApply}
            disabled={isApplied}
          >
            {isApplied ? copy.applyDone : copy.apply}
          </Button>
        ) : (
          <Button variant="dark" className="h-10 flex-1 text-sm" asChild>
            <Link href={`/positions/${p.id}`}>{copy.apply}</Link>
          </Button>
        )}
      </div>
    </article>
  );
};
