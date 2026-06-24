"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { AplyCipBadgeButton, CipInfoModal } from "../positions/AplyCipBadge";
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
import { trackExternalPositionClick, trackPositionSearch } from "../../lib/analytics";
import { InFeedAd } from "../ads/InFeedAd";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { partnerIndustryLabel } from "../../lib/partner-industry-labels";
import { ALL_POSITIONS, type Position } from "../../lib/positions-data";
import { paperlogy } from "../../lib/fonts";
import type { PlatformLocale } from "../../lib/auth-messages";
import {
  MapPin,
  Briefcase,
  Bookmark,
  ChevronDown,
  SlidersHorizontal,
  LayoutGrid,
  List,
  RotateCcw,
  Star,
  X
} from "lucide-react";

const FALLBACK_JOB_ROLES = Array.from(new Set(ALL_POSITIONS.map((position) => position.category)));
const FALLBACK_WORK_TYPES = ["On-site", "Hybrid", "Remote"] as const;
const FALLBACK_INDUSTRIES = Array.from(new Set(ALL_POSITIONS.map((position) => position.industry)));
const FALLBACK_COMPANY_SIZES = Array.from(new Set(ALL_POSITIONS.map((position) => position.companySize)));
const FALLBACK_VISA_TYPES = Array.from(new Set(ALL_POSITIONS.flatMap((position) => position.eligibleVisas)));
const ALL_VISA_CODES = ["D-2", "D-4", "D-10", "E-7", "F-2", "F-4", "F-5", "F-6", "H-1"] as const;
const PUBLIC_POSITIONS_PAGE_SIZE = 20;
// PositionRow / PositionGridCard 가 받는 카드 데이터. 다른 페이지(코치 패널
// 등) 에서 같은 행 컴포넌트를 재사용하려면 같이 export 해야 함.
export type PositionCard = Position & {
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
type PositionSourceFilter = "INTERNAL" | "BUDDIES" | "WANTED";

function visaTypeLabel(code: string, locale: PlatformLocale) {
  const pick = (ko: string, en: string, zh: string, vi: string, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;
  if (code === "D-2") return pick("유학", "Student", "留学", "Du học", "留学", "Pelajar");
  if (code === "D-4") return pick("일반연수", "General training", "一般研修", "Đào tạo chung", "一般研修", "Pelatihan umum");
  if (code === "D-10") return pick("구직", "Job seeking", "求职", "Tìm việc", "求職", "Mencari kerja");
  if (code === "E-7") return pick("특정활동", "Specific activity", "特定活动", "Hoạt động cụ thể", "特定活動", "Aktivitas khusus");
  if (code === "F-2") return pick("거주", "Residence", "居住", "Cư trú", "居住", "Tempat tinggal");
  if (code === "F-4") return pick("재외동포", "Overseas Korean", "在外同胞", "Người Hàn ở nước ngoài", "在外同胞", "Diaspora Korea");
  if (code === "F-5") return pick("영주", "Permanent resident", "永住", "Thường trú", "永住", "Penduduk tetap");
  if (code === "F-6") return pick("결혼이민", "Marriage migration", "结婚移民", "Kết hôn nhập cư", "結婚移民", "Migrasi pernikahan");
  if (code === "H-1") return pick("워킹홀리데이", "Working holiday", "打工度假", "Working Holiday", "ワーキングホリデー", "Working Holiday");
  return pick("기타", "Other", "其他", "Khác", "その他", "Lainnya");
}

function formatEligibleVisasForList(codes: string[], locale: PlatformLocale) {
  const noRestriction =
    locale === "ko" ? "무관" : locale === "zh-CN" ? "不限" : locale === "vi" ? "Không giới hạn" : locale === "ja" ? "制限なし" : locale === "id" ? "Tidak ada batasan" : "No restriction";
  if (codes.length === 0) return noRestriction;
  const set = new Set(codes);
  const isAllSelected = ALL_VISA_CODES.every((code) => set.has(code));
  if (isAllSelected) return noRestriction;
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

function companySizeLabel(value: string, locale: PlatformLocale) {
  const pick = (ko: string, en: string, zh: string, vi: string, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;
  if (value === "SIZE_1_10") return pick("10인 이하", "Up to 10", "10人以下", "Tối đa 10", "10名以下", "Maksimal 10");
  if (value === "SIZE_UNDER_30") return pick("30인 이하", "Up to 30", "30人以下", "Tối đa 30", "30名以下", "Maksimal 30");
  if (value === "SIZE_UNDER_50") return pick("50인 이하", "Up to 50", "50人以下", "Tối đa 50", "50名以下", "Maksimal 50");
  if (value === "SIZE_OVER_100") return pick("100인 이상", "100+", "100人以上", "Trên 100", "100名以上", "100+");
  return value;
}

function workTypeLabel(value: string, locale: PlatformLocale) {
  const normalized = value.toLowerCase().replace(/[\s_-]/g, "");
  const pick = (ko: string, en: string, zh: string, vi: string, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;
  if (normalized === "remote") return pick("원격근무", "Remote", "远程办公", "Làm việc từ xa", "在宅勤務", "Kerja jarak jauh");
  if (normalized === "hybrid") return pick("혼합근무", "Hybrid", "混合办公", "Làm việc kết hợp", "ハイブリッド勤務", "Kerja hibrida");
  if (normalized === "onsite") return pick("대면근무", "On-site", "现场办公", "Làm việc tại văn phòng", "出社勤務", "Kerja di kantor");
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

export function mapPublicPositionToCard(item: PublicPositionListItem, locale: PlatformLocale): PositionCard {
  const now = Date.now();
  const createdAt = new Date(item.createdAt);
  const postedDays = Number.isNaN(createdAt.getTime())
    ? 0
    : Math.max(0, Math.floor((now - createdAt.getTime()) / (24 * 60 * 60 * 1000)));
  const company =
    item.partnerOrganization?.name?.trim() ||
    item.sourceCompanyName?.trim() ||
    (locale === "ko" ? "파트너 기업" : locale === "zh-CN" ? "合作企业" : locale === "vi" ? "Doanh nghiệp đối tác" : locale === "ja" ? "パートナー企業" : locale === "id" ? "Perusahaan mitra" : "Partner company");
  const role = item.title;
  const category = item.preferredJobRole?.trim() || "";
  const workType = item.workType ?? inferWorkType(item.workingHours);
  const startDate = item.startDate ? new Date(item.startDate) : null;
  const startLabel =
    startDate && !Number.isNaN(startDate.getTime())
      ? `${startDate.getFullYear()}.${String(startDate.getMonth() + 1).padStart(2, "0")}.${String(startDate.getDate()).padStart(2, "0")}`
      : locale === "ko" ? "즉시" : locale === "zh-CN" ? "立即" : locale === "vi" ? "Ngay" : locale === "ja" ? "即時" : locale === "id" ? "Segera" : "Immediate";
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
    companySize: companySizeLabel(item.partnerOrganization?.companySize ?? (locale === "ko" ? "미정" : locale === "zh-CN" ? "未定" : locale === "vi" ? "Chưa xác định" : locale === "ja" ? "未定" : locale === "id" ? "Belum ditentukan" : "TBD"), locale),
    eligibleVisas: item.eligibleVisas,
    location: item.workLocation?.trim() || item.partnerOrganization?.officeAddress?.trim() || (locale === "ko" ? "협의" : locale === "zh-CN" ? "可协商" : locale === "vi" ? "Thỏa thuận" : locale === "ja" ? "応相談" : locale === "id" ? "Dapat dirundingkan" : "To be discussed"),
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

// External positions route through /positions/:id/go on the API so the
// ops dashboard can count outbound clicks. Returns null when the position
// is internal or has no source URL.
function externalGoHref(positionId: string, sourceKind: PositionSourceKind, sourceUrl: string | null) {
  if (!isExternalSource(sourceKind) || !sourceUrl) return null;
  const apiBase = (process.env.NEXT_PUBLIC_API_URL?.trim() || "").replace(/\/$/, "");
  if (!apiBase) return sourceUrl;
  return `${apiBase}/positions/${encodeURIComponent(positionId)}/go`;
}

function formatPostedDate(position: Position, locale: PlatformLocale) {
  if (position.createdAt) {
    const created = new Date(position.createdAt);
    if (!Number.isNaN(created.getTime())) {
      const now = Date.now();
      const diffMs = Math.max(0, now - created.getTime());
      const minutes = Math.floor(diffMs / (60 * 1000));
      if (minutes < 60) {
        const n = Math.max(1, minutes);
        return locale === "ko" ? `${n}분 전` : locale === "zh-CN" ? `${n} 分钟前` : locale === "vi" ? `${n} phút trước` : locale === "ja" ? `${n}分前` : locale === "id" ? `${n} menit lalu` : `${n}m ago`;
      }
      const hours = Math.floor(minutes / 60);
      if (hours < 24) {
        return locale === "ko" ? `${hours}시간 전` : locale === "zh-CN" ? `${hours} 小时前` : locale === "vi" ? `${hours} giờ trước` : locale === "ja" ? `${hours}時間前` : locale === "id" ? `${hours} jam lalu` : `${hours}h ago`;
      }
      const days = Math.floor(hours / 24);
      if (days < 7) {
        return locale === "ko" ? `${days}일 전` : locale === "zh-CN" ? `${days} 天前` : locale === "vi" ? `${days} ngày trước` : locale === "ja" ? `${days}日前` : locale === "id" ? `${days} hari lalu` : `${days}d ago`;
      }
      const y = created.getFullYear();
      const m = String(created.getMonth() + 1).padStart(2, "0");
      const d = String(created.getDate()).padStart(2, "0");
      return `${y}. ${m}. ${d}`;
    }
  }
  if (position.postedDays <= 0) return locale === "ko" ? "오늘" : locale === "zh-CN" ? "今天" : locale === "vi" ? "Hôm nay" : locale === "ja" ? "今日" : locale === "id" ? "Hari ini" : "Today";
  return locale === "ko" ? `${position.postedDays}일 전` : locale === "zh-CN" ? `${position.postedDays} 天前` : locale === "vi" ? `${position.postedDays} ngày trước` : locale === "ja" ? `${position.postedDays}日前` : locale === "id" ? `${position.postedDays} hari lalu` : `${position.postedDays}d ago`;
}

function formatDeadlineDday(ymd: string, locale: PlatformLocale) {
  const parsed = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!parsed) return ymd;
  const year = Number(parsed[1]);
  const month = Number(parsed[2]);
  const day = Number(parsed[3]);
  const now = new Date();
  const todayKstMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const deadlineKstMs = Date.UTC(year, month - 1, day);
  const diffDays = Math.floor((deadlineKstMs - todayKstMs) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return locale === "en" ? "D-day" : "D-day";
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
}

export function PositionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearchQuery = searchParams.get("q")?.trim() ?? "";
  const { locale } = useLanguage();
  const { user, isReady, isAuthenticated } = useAuthSession();
  const [positions, setPositions] = useState<PositionCard[]>([]);
  const [isPositionsLoading, setIsPositionsLoading] = useState(true);
  const [sortMode, setSortMode] = useState<"latest" | "deadline">("latest");
  const [searchInput, setSearchInput] = useState(initialSearchQuery);
  const [query, setQuery] = useState(initialSearchQuery);
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
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [premiumBanners, setPremiumBanners] = useState<PublicPremiumPositionBannerItem[]>([]);
  const [isPremiumBannersLoading, setIsPremiumBannersLoading] = useState(true);
  const [premiumBannerError, setPremiumBannerError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  // "Aply CIP" 배지 옆 ? 버튼 클릭 시 열리는 프로그램 안내 모달.
  const [isCipModalOpen, setIsCipModalOpen] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState("");
  const [myPartnerOrganizationId, setMyPartnerOrganizationId] = useState<string | null>(null);
  const isKo = locale === "ko";
  const isZh = locale === "zh-CN";
  const isVi = locale === "vi";
  const isJa = locale === "ja";
  const isId = locale === "id";
  const t = (ko: string, en: string, zh: string, vi: string, ja: string = en, id: string = en) =>
    isKo ? ko : isZh ? zh : isVi ? vi : isJa ? ja : isId ? id : en;

  const copy = {
    filter: t("필터", "Filters", "筛选", "Bộ lọc", "フィルター", "Filter"),
    allFilters: t("전체 필터", "All filters", "全部筛选", "Tất cả bộ lọc", "全てのフィルター", "Semua filter"),
    sectionFilter: t("선택 섹션 필터", "Section filters", "分区筛选", "Bộ lọc theo mục", "セクション別フィルター", "Filter per bagian"),
    applyHint: t("선택 즉시 전체 목록에 적용", "Selections are applied immediately", "选择后立即应用到列表", "Áp dụng ngay sau khi chọn", "選択すると即時に反映されます", "Pilihan langsung diterapkan"),
    reset: t("초기화", "Reset", "重置", "Đặt lại", "リセット", "Atur ulang"),
    resetAll: t("전체 초기화", "Clear all", "全部重置", "Xóa tất cả", "全てリセット", "Reset semua"),
    applyFilters: t("적용", "Apply", "应用", "Áp dụng", "適用", "Terapkan"),
    selectedCount: t("개 선택됨", " selected", "已选", " đã chọn", "件選択中", " dipilih"),
    closeFilter: t("필터 닫기", "Close filters", "关闭筛选", "Đóng bộ lọc", "フィルターを閉じる", "Tutup filter"),
    removeFilterSuffix: t("필터 제거", "Remove filter", "移除筛选", "Xóa bộ lọc", "フィルターを削除", "Hapus filter"),
    sortLatest: t("최신순", "Latest", "最新", "Mới nhất", "新着順", "Terbaru"),
    sortDeadline: t("마감임박순", "Deadline", "截止时间", "Hạn nộp", "締切順", "Tenggat"),
    industry: t("산업군", "Industry", "行业", "Ngành", "業種", "Industri"),
    jobRole: t("직무", "Role", "岗位", "Vị trí", "職務", "Posisi"),
    companySize: t("규모", "Size", "规模", "Quy mô", "規模", "Ukuran"),
    visa: t("비자", "Visa", "签证", "Visa", "ビザ", "Visa"),
    workType: t("근무 형태", "Work type", "工作方式", "Hình thức làm việc", "勤務形態", "Tipe pekerjaan"),
    source: t("소스", "Source", "来源", "Nguồn", "ソース", "Sumber"),
    listView: t("리스트 보기", "List view", "列表视图", "Dạng danh sách", "リスト表示", "Tampilan daftar"),
    gridView: t("그리드 보기", "Grid view", "网格视图", "Dạng lưới", "グリッド表示", "Tampilan kisi"),
    title: t("글로벌 인재를 위한 오픈 포지션", "Global Open Positions", "面向全球人才的开放职位", "Vị trí mở cho nhân tài toàn cầu", "グローバル人材のためのオープンポジション", "Posisi Terbuka untuk Talenta Global"),
    subtitle: t("지금 열려 있는 포지션을 빠르게 둘러보고, 내 조건에 맞는 공고를 찾아보세요.", "Find roles that fit you.", "快速浏览正在招聘的职位，找到适合你的机会。", "Khám phá nhanh các vị trí đang mở và tìm cơ hội phù hợp với bạn.", "現在募集中のポジションをすばやく確認し、自分に合う求人を見つけましょう。", "Telusuri posisi yang sedang dibuka dan temukan lowongan yang sesuai dengan Anda."),
    createPosition: t("포지션 생성하기", "Create position", "创建职位", "Tạo vị trí", "ポジションを作成", "Buat posisi"),
    bannerAlt: t("글로벌 인재 포지션 탐색 배너", "Global talent position banner", "全球人才职位探索横幅", "Banner khám phá vị trí cho nhân tài toàn cầu", "グローバル人材向けポジション探索バナー", "Banner pencarian posisi untuk talenta global"),
    searchPlaceholder: t("직무, 기업, 스킬로 검색 (예: Designer, AI, Seoul)", "Search by role, company, or skill (e.g., Designer, AI, Seoul)", "按岗位、公司或技能搜索（例：Designer, AI, Seoul）", "Tìm theo vị trí, công ty hoặc kỹ năng (vd: Designer, AI, Seoul)", "職務・企業・スキルで検索（例：Designer, AI, Seoul）", "Cari berdasarkan posisi, perusahaan, atau keterampilan (mis. Designer, AI, Seoul)"),
    search: t("검색", "Search", "搜索", "Tìm kiếm", "検索", "Cari"),
    popularSearch: t("인기 검색", "Popular searches", "热门搜索", "Tìm kiếm phổ biến", "人気の検索", "Pencarian populer"),
    premiumTitle: t("이런 포지션은 어떠세요?", "Featured Positions", "你可能感兴趣的职位", "Bạn có thể quan tâm", "こんなポジションはいかがですか？", "Posisi Pilihan"),
    premiumSubtitle: t("지금 주목받는 포지션을 먼저 확인해보세요.", "See highlighted positions first.", "先看看当前热门职位。", "Xem trước các vị trí nổi bật.", "今注目のポジションをいち早くチェック。", "Lihat posisi unggulan terlebih dahulu."),
    noPremium: t("현재 노출 가능한 프리미엄 배너가 없습니다.", "No premium banners are available right now.", "当前没有可展示的精选横幅。", "Hiện chưa có banner nổi bật.", "現在表示可能なプレミアムバナーはありません。", "Saat ini tidak ada banner premium yang tersedia."),
    premiumError: t("프리미엄 배너를 불러오지 못했습니다. API 연결 상태와 배너 조건을 확인해주세요.", "Failed to load premium banners. Check API connectivity and banner conditions.", "无法加载精选横幅，请检查 API 连接与配置。", "Không tải được banner nổi bật. Vui lòng kiểm tra kết nối API và cấu hình.", "プレミアムバナーを読み込めませんでした。API接続状況とバナー条件をご確認ください。", "Gagal memuat banner premium. Periksa koneksi API dan kondisi banner."),
    myVisaOnly: t("내 비자로 지원 가능만", "Only eligible for my visa", "仅显示可用我签证申请", "Chỉ hiển thị vị trí phù hợp visa của tôi", "自分のビザで応募可能なものだけ", "Hanya yang sesuai visa saya"),
    myVisaMissing: t("비자정보 필요", "Visa info required", "需要签证信息", "Cần thông tin visa", "ビザ情報が必要です", "Informasi visa diperlukan"),
    noResultTitle: t("조건에 맞는 포지션이 없습니다", "No positions match your filters", "没有符合条件的职位", "Không có vị trí phù hợp bộ lọc", "条件に合うポジションはありません", "Tidak ada posisi yang cocok dengan filter Anda"),
    noResultDesc: t("필터를 조정하거나 다른 키워드로 검색해보세요.", "Adjust filters or try different keywords.", "请调整筛选或尝试其他关键词。", "Hãy điều chỉnh bộ lọc hoặc thử từ khóa khác.", "フィルターを調整するか、別のキーワードでお試しください。", "Sesuaikan filter atau coba kata kunci lain."),
    resetFilters: t("필터 초기화", "Reset filters", "重置筛选", "Đặt lại bộ lọc", "フィルターをリセット", "Atur ulang filter"),
    loadingMore: t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat..."),
    loadMore: t("더 많은 포지션 보기", "Load more positions", "查看更多职位", "Xem thêm vị trí", "もっとポジションを見る", "Muat posisi lainnya"),
    loginRequiredFavorite: t("로그인한 회원만 즐겨찾기를 사용할 수 있습니다.", "Only signed-in users can use favorites.", "仅登录用户可使用收藏。", "Chỉ người dùng đã đăng nhập mới dùng được yêu thích.", "ログインした会員のみお気に入りを利用できます。", "Hanya pengguna yang masuk yang dapat menggunakan favorit."),
    studentRequiredFavorite: t("학생 계정만 즐겨찾기를 사용할 수 있습니다.", "Only student accounts can use favorites.", "仅学生账号可使用收藏。", "Chỉ tài khoản sinh viên mới dùng được yêu thích.", "学生アカウントのみお気に入りを利用できます。", "Hanya akun pelajar yang dapat menggunakan favorit."),
    favoriteFailed: t("즐겨찾기 처리에 실패했습니다.", "Failed to update favorite.", "收藏操作失败。", "Cập nhật yêu thích thất bại.", "お気に入りの更新に失敗しました。", "Gagal memperbarui favorit."),
    loginRequiredApply: t("로그인한 회원만 지원할 수 있습니다.", "Only signed-in users can apply.", "仅登录用户可申请。", "Chỉ người dùng đã đăng nhập mới có thể ứng tuyển.", "ログインした会員のみ応募できます。", "Hanya pengguna yang masuk yang dapat melamar."),
    studentRequiredApply: t("파트너 회원, 어드민은 지원하기에 지원할 수 없습니다.", "Partner and admin accounts cannot apply.", "合作伙伴和管理员账号不可申请。", "Tài khoản đối tác và quản trị không thể ứng tuyển.", "パートナー会員および管理者アカウントは応募できません。", "Akun mitra dan admin tidak dapat melamar."),
    applyFailed: t("지원 처리에 실패했습니다.", "Failed to apply.", "申请失败。", "Ứng tuyển thất bại.", "応募処理に失敗しました。", "Gagal melamar."),
    detailSuffix: t("상세보기", "View details", "查看详情", "Xem chi tiết", "詳細を見る", "Lihat detail"),
    thumbnailSuffix: t("썸네일", "thumbnail", "缩略图", "ảnh thu nhỏ", "サムネイル", "thumbnail"),
    save: t("저장", "Save", "收藏", "Lưu", "保存", "Simpan"),
    edit: t("수정하기", "Edit", "编辑", "Chỉnh sửa", "編集", "Edit"),
    applyDone: t("지원완료", "Applied", "已申请", "Đã ứng tuyển", "応募済み", "Sudah dilamar"),
    apply: t("지원하기", "Apply", "申请", "Ứng tuyển", "応募する", "Lamar"),
    viewDetails: t("상세보기", "View details", "查看详情", "Xem chi tiết", "詳細を見る", "Lihat detail"),
    loginPromptTitle: t("로그인이 필요한 기능입니다.", "Sign in is required for this action.", "此操作需要登录。", "Bạn cần đăng nhập để dùng tính năng này.", "この操作にはログインが必要です。", "Tindakan ini memerlukan login."),
    loginPromptLogin: t("로그인하기", "Go to login", "去登录", "Đi tới đăng nhập", "ログインへ", "Buka login"),
    cancel: t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal"),
    countSuffix: isKo ? "개" : isZh ? "" : isVi ? "" : isJa ? "件" : isId ? "" : "",
    loginToSeeMore: t("로그인해야 더 많은 포지션을 볼 수 있어요.", "Sign in to see more positions.", "登录后可查看更多职位。", "Đăng nhập để xem thêm vị trí.", "ログインするとさらに多くのポジションを表示できます。", "Masuk untuk melihat lebih banyak posisi."),
    loginNow: t("로그인하기", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk"),
    activeVisaLabel: (visa: string | null) =>
      `${isKo ? "내 비자로 지원 가능만" : isZh ? "仅符合我签证条件" : isVi ? "Chỉ phù hợp với visa của tôi" : isJa ? "自分のビザで応募可能なものだけ" : isId ? "Hanya yang sesuai visa saya" : "Only eligible for my visa"} ${visa ? `(${visa})` : `(${isKo ? "비자정보 필요" : isZh ? "需要签证信息" : isVi ? "Cần thông tin visa" : isJa ? "ビザ情報が必要です" : isId ? "Informasi visa diperlukan" : "Visa info required"})`}`
  } as const;

  const toggle = <T extends string>(list: T[], setList: (v: T[]) => void, value: T) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const applySearch = () => {
    const next = searchInput.trim();
    setQuery(next);
    if (next) trackPositionSearch(next);
  };

  const premiumPositionCards = useMemo(
    () => premiumBanners.map((banner) => mapPublicPositionToCard(banner.position, locale)),
    [premiumBanners, locale]
  );
  const filtered = positions;
  // Guests can browse position search freely; only favorite/apply require login.
  const isGuestLocked = false;
  // "Aply 채용" tab = INTERNAL-only source filter (server-side, paginates
  // correctly). "전체" = no source filter.
  const sourceTab: "all" | "aply" =
    positionSources.length === 1 && positionSources[0] === "INTERNAL" ? "aply" : "all";
  const visiblePositions = isGuestLocked ? filtered.slice(0, 3) : filtered;
  const showGuestOverlay = isGuestLocked && filtered.length > 3;
  const effectiveViewMode: "grid" | "list" = isGuestLocked ? "list" : viewMode;

  const hasMorePositions = Boolean(nextCursor);
  const selectedFilterChips = [
    ...jobRoles.map((value) => ({
      key: `jobRole:${value}`,
      label: value,
      onRemove: () => toggle(jobRoles, setJobRoles, value)
    })),
    ...positionSources.map((value) => ({
      key: `source:${value}`,
      label: value === "INTERNAL" ? "Aply" : value === "WANTED" ? "Wanted" : "BUDDIES",
      onRemove: () => toggle(positionSources, setPositionSources, value)
    }))
  ];

  // Sync the URL ?q= back into the search state. This handles navigating
  // here from the hero search bar while already mounted (e.g. logo → home
  // → another search → /positions?q=...).
  useEffect(() => {
    const q = searchParams.get("q")?.trim() ?? "";
    setSearchInput(q);
    setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    let ignore = false;
    // Show the skeleton on every (re)fetch — including tab / filter / sort
    // changes — not just the first load.
    setIsPositionsLoading(true);
    (async () => {
      try {
        const page = await getPublicPositionsPage({
          limit: PUBLIC_POSITIONS_PAGE_SIZE,
          search: query,
          jobRoles: jobRoles.length ? [...jobRoles] : undefined,
          sortOrder: "desc",
          sort: sortMode,
          sourceProviders: positionSources.length ? [...positionSources] : undefined,
          locale
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
  }, [positionSources, locale, query, jobRoles, sortMode]);

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
        sort: sortMode,
        sourceProviders: positionSources.length ? [...positionSources] : undefined,
        locale
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

  const shouldShowLoadingPlaceholder = isPositionsLoading;
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
                  {user?.role === "PARTNER" || user?.role === "OPERATOR" ? (
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

              {isAuthenticated ? (
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
              ) : null}

              {!isPremiumBannersLoading && premiumBanners.length > 0 ? (
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
            {/* Source tabs: 전체 / Aply 채용 (drives the INTERNAL source filter) */}
            <div className="mb-5 flex items-center gap-1 border-b border-border">
              {([
                { key: "all" as const, label: locale === "ko" ? "전체" : locale === "ja" ? "すべて" : locale === "zh-CN" ? "全部" : locale === "vi" ? "Tất cả" : locale === "id" ? "Semua" : "All" },
                { key: "aply" as const, label: locale === "ko" ? "오직 Aply에서만!" : locale === "ja" ? "Aplyだけ!" : locale === "zh-CN" ? "仅在Aply!" : locale === "vi" ? "Chỉ có trên Aply!" : locale === "id" ? "Hanya di Aply!" : "Only on Aply!" }
              ]).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setPositionSources(tab.key === "aply" ? ["INTERNAL"] : [])}
                  className={`relative inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors ${
                    sourceTab === tab.key
                      ? "text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.key === "aply" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/img_logo.webp"
                      alt="Aply"
                      className={`h-4 w-auto ${sourceTab === "aply" ? "" : "opacity-50"}`}
                    />
                  ) : null}
                  {tab.label}
                </button>
              ))}
            </div>
            <div>
              {(
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 gap-2 px-3"
                    onClick={() => setIsFilterPopupOpen((prev) => !prev)}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    {copy.filter}
                    {selectedFilterChips.length > 0 ? (
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-semibold text-background">
                        {selectedFilterChips.length}
                      </span>
                    ) : null}
                    <ChevronDown className={`h-4 w-4 transition-transform ${isFilterPopupOpen ? "rotate-180" : ""}`} />
                  </Button>
                  <div className="relative">
                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as "latest" | "deadline")}
                      className="h-9 appearance-none rounded-md border border-border bg-background pl-3 pr-8 text-sm font-medium text-foreground"
                      aria-label={t("정렬", "Sort", "排序", "Sắp xếp", "並び替え", "Urutkan")}
                    >
                      <option value="latest">{copy.sortLatest}</option>
                      <option value="deadline">{copy.sortDeadline}</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              )}

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
                <div
                  className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
                  onClick={() => setIsFilterPopupOpen(false)}
                >
                  <div
                    className="flex w-full max-w-2xl flex-col rounded-t-2xl border-t border-border bg-card sm:rounded-2xl sm:border"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-4">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-5 w-5" />
                        <h2 className="font-display text-base font-bold">{copy.filter}</h2>
                        {selectedFilterChips.length > 0 ? (
                          <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-semibold text-background">
                            {selectedFilterChips.length}
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        aria-label={copy.closeFilter}
                        onClick={() => setIsFilterPopupOpen(false)}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Body */}
                    <div className="max-h-[60vh] space-y-6 overflow-y-auto px-5 py-5">
                      <section>
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-foreground">
                            {copy.jobRole}
                            {jobRoles.length > 0 ? (
                              <span className="ml-1.5 text-xs font-medium text-muted-foreground">({jobRoles.length})</span>
                            ) : null}
                          </h3>
                          {jobRoles.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setJobRoles([])}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <RotateCcw className="h-3 w-3" /> {copy.reset}
                            </button>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-3">
                          {jobRoleOptions.map((role) => {
                            const checked = jobRoles.includes(role);
                            return (
                              <label
                                key={role}
                                className={`flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted/50 ${
                                  checked ? "text-foreground" : "text-muted-foreground"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 flex-none cursor-pointer accent-foreground"
                                  checked={checked}
                                  onChange={() => toggle(jobRoles, setJobRoles, role)}
                                />
                                <span className="truncate">{role}</span>
                              </label>
                            );
                          })}
                        </div>
                      </section>

                      <section className="border-t border-border/60 pt-5">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-foreground">
                            {copy.source}
                            {positionSources.length > 0 ? (
                              <span className="ml-1.5 text-xs font-medium text-muted-foreground">({positionSources.length})</span>
                            ) : null}
                          </h3>
                          {positionSources.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setPositionSources([])}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <RotateCcw className="h-3 w-3" /> {copy.reset}
                            </button>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-3">
                          {([
                            { key: "INTERNAL", label: "Aply" },
                            { key: "WANTED", label: "Wanted" }
                          ] as const).map((item) => {
                            const checked = positionSources.includes(item.key);
                            return (
                              <label
                                key={item.key}
                                className={`flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted/50 ${
                                  checked ? "text-foreground" : "text-muted-foreground"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 flex-none cursor-pointer accent-foreground"
                                  checked={checked}
                                  onChange={() => toggle(positionSources, setPositionSources, item.key)}
                                />
                                <span className="truncate">{item.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </section>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-5 py-3">
                      <button
                        type="button"
                        onClick={clearAll}
                        disabled={selectedFilterChips.length === 0}
                        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <RotateCcw className="h-4 w-4" /> {copy.resetAll}
                      </button>
                      <Button
                        type="button"
                        variant="dark"
                        size="sm"
                        className="min-w-[120px]"
                        onClick={() => setIsFilterPopupOpen(false)}
                      >
                        {copy.applyFilters}
                        {selectedFilterChips.length > 0 ? ` (${selectedFilterChips.length})` : ""}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {shouldShowLoadingPlaceholder ? (
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
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-16 text-center">
                  <p className="font-display text-lg font-semibold">{copy.noResultTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{copy.noResultDesc}</p>
                  <Button variant="outline" className="mt-4" onClick={clearAll}>{copy.resetFilters}</Button>
                </div>
              ) : (
                effectiveViewMode === "grid" ? (
                  <div className="relative">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
                      {visiblePositions.map((p, idx) => {
                        // 운영자는 어떤 포지션이든 직접 수정 가능 (API PATCH 정책과 일치).
                        // 같은 플래그를 "수정하기" 버튼 노출 조건으로 재사용.
                        const isOwnPartnerPosting =
                          (!!myPartnerOrganizationId && p.partnerDomain === myPartnerOrganizationId)
                          || user?.role === "OPERATOR";
                        const showAdAfter = (idx + 1) % 4 === 0 && idx + 1 < visiblePositions.length;

                        return (
                          <Fragment key={p.id}>
                            <div className={isGuestLocked ? "opacity-80" : undefined}>
                              <PositionGridCard
                                p={p}
                                isOwnPartnerPosting={isOwnPartnerPosting}
                                isStudentUser={user?.role === "STUDENT"}
                                isApplied={appliedIds.includes(p.id)}
                                isFavorite={favoriteIds.includes(p.id)}
                                onToggleFavorite={() => toggleFavorite(p.id)}
                                onApply={() => {
                                  void applyFromList(p.id);
                                }}
                                onShowCip={() => setIsCipModalOpen(true)}
                                locale={locale}
                              />
                            </div>
                            {showAdAfter ? <InFeedAd className="col-span-full" /> : null}
                          </Fragment>
                        );
                      })}
                    </div>
                    {showGuestOverlay ? (
                      <>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-full bg-gradient-to-t from-background via-background/90 to-background/45 to-65% to-transparent" />
                        <div className="absolute inset-x-0 bottom-7 z-50 flex justify-center text-center">
                          <div>
                            <p className="text-sm font-medium">{copy.loginToSeeMore}</p>
                            <Button
                              variant="dark"
                              size="sm"
                              className="mt-2 pointer-events-auto"
                              onClick={() => router.push("/login")}
                            >
                              {copy.loginNow}
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <div className="relative">
                    <div className="space-y-3">
                      {visiblePositions.map((p, idx) => {
                        // 그리드뷰와 동일 — 운영자는 어떤 포지션이든 수정 가능.
                        const isOwnPartnerPosting =
                          (!!myPartnerOrganizationId && p.partnerDomain === myPartnerOrganizationId)
                          || user?.role === "OPERATOR";
                        const showAdAfter = (idx + 1) % 4 === 0 && idx + 1 < visiblePositions.length;

                        return (
                          <Fragment key={p.id}>
                            <div className={isGuestLocked ? "opacity-80" : undefined}>
                              <PositionRow
                                p={p}
                                isOwnPartnerPosting={isOwnPartnerPosting}
                                isStudentUser={user?.role === "STUDENT"}
                                isApplied={appliedIds.includes(p.id)}
                                isFavorite={favoriteIds.includes(p.id)}
                                onToggleFavorite={() => toggleFavorite(p.id)}
                                onApply={() => {
                                  void applyFromList(p.id);
                                }}
                                onShowCip={() => setIsCipModalOpen(true)}
                                locale={locale}
                              />
                            </div>
                            {showAdAfter ? <InFeedAd /> : null}
                          </Fragment>
                        );
                      })}
                    </div>
                    {showGuestOverlay ? (
                      <>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-full bg-gradient-to-t from-background via-background/90 to-background/45 to-65% to-transparent" />
                        <div className="absolute inset-x-0 bottom-8 z-50 flex justify-center text-center">
                          <div>
                            <p className="text-sm font-medium">{copy.loginToSeeMore}</p>
                            <Button
                              variant="dark"
                              size="sm"
                              className="mt-2 pointer-events-auto"
                              onClick={() => router.push("/login")}
                            >
                              {copy.loginNow}
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : null}
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
      {isCipModalOpen ? (
        <CipInfoModal locale={locale} onClose={() => setIsCipModalOpen(false)} />
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

export const PositionRow = ({
  p,
  isOwnPartnerPosting,
  isStudentUser,
  isApplied,
  isFavorite,
  onToggleFavorite,
  onApply,
  onShowCip,
  locale,
  compact = false,
  onSelect,
  selected = false
}: {
  p: PositionCard;
  isOwnPartnerPosting: boolean;
  isStudentUser: boolean;
  isApplied: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onApply: () => void;
  onShowCip?: () => void;
  locale: PlatformLocale;
  // 코치 패널 같은 좁은 영역용. 썸네일 정방형 + 폰트 축소 + 우측 액션 버튼
  // 숨김(카드 전체가 링크라 클릭 한 번으로 상세 진입). 우측 상단 게시일/
  // 마감만 작게 유지.
  compact?: boolean;
  // 선택 모드(공고 맞춤 등) — 주어지면 카드 전체가 상세 링크 대신 '선택' 동작이 된다.
  onSelect?: () => void;
  selected?: boolean;
}) => {
  const isKo = locale === "ko";
  const isZh = locale === "zh-CN";
  const isVi = locale === "vi";
  const isJa = locale === "ja";
  const isId = locale === "id";
  const href = companyHref(p.partnerDomain);
  const copy = {
    detailSuffix: isKo ? "상세보기" : isZh ? "查看详情" : isVi ? "Xem chi tiết" : isJa ? "詳細を見る" : isId ? "Lihat detail" : "View details",
    thumbnailSuffix: isKo ? "썸네일" : isZh ? "缩略图" : isVi ? "ảnh thu nhỏ" : isJa ? "サムネイル" : isId ? "thumbnail" : "thumbnail",
    save: isKo ? "저장" : isZh ? "收藏" : isVi ? "Lưu" : isJa ? "保存" : isId ? "Simpan" : "Save",
    edit: isKo ? "수정하기" : isZh ? "编辑" : isVi ? "Chỉnh sửa" : isJa ? "編集する" : isId ? "Edit" : "Edit",
    applyDone: isKo ? "지원완료" : isZh ? "已申请" : isVi ? "Đã ứng tuyển" : isJa ? "応募完了" : isId ? "Sudah melamar" : "Applied",
    apply: isKo ? "지원하기" : isZh ? "申请" : isVi ? "Ứng tuyển" : isJa ? "応募する" : isId ? "Lamar" : "Apply",
    viewDetails: isKo ? "상세보기" : isZh ? "查看详情" : isVi ? "Xem chi tiết" : isJa ? "詳細を見る" : isId ? "Lihat detail" : "View details",
    externalLink: isKo ? "보러가기" : isZh ? "查看" : isVi ? "Xem" : isJa ? "見に行く" : isId ? "Lihat" : "View"
  } as const;
  const wantedAltLabel = isKo ? "Wanted에서 보기" : isZh ? "在 Wanted 查看" : isVi ? "Xem trên Wanted" : isJa ? "Wantedで見る" : isId ? "Lihat di Wanted" : "View on Wanted";
  const externalLinkLabel: React.ReactNode =
    p.sourceProvider === "BUDDIES"
        ? (isKo ? "Buddies로 보러가기" : isZh ? "在 Buddies 查看" : isVi ? "Xem trên Buddies" : isJa ? "Buddiesで見る" : isId ? "Lihat di Buddies" : "View on Buddies")
        : p.sourceProvider === "WANTED"
          ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src="/img_logo_wanted.webp"
              alt={wantedAltLabel}
              className="h-6 w-auto"
              onError={(event) => {
                const target = event.currentTarget;
                target.style.display = "none";
                const fallback = target.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = "inline";
              }}
            />
          )
          : copy.externalLink;
  const detailHref = externalGoHref(p.id, p.sourceKind, p.sourceUrl) ?? `/positions/${p.id}`;
  return (
    <article className={`group relative rounded-xl border bg-card ${selected ? "border-primary ring-2 ring-inset ring-primary" : "border-border/60"} ${compact ? "p-2.5" : "p-3 md:p-4"}`}>
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          aria-label={`${p.role} ${copy.detailSuffix}`}
          className="absolute inset-0 z-30 rounded-xl"
        />
      ) : isExternalSource(p.sourceKind) && p.sourceUrl ? (
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
      <div className={`absolute z-20 text-right ${compact ? "right-2.5 top-2" : "right-3 top-2.5 md:right-4 md:top-3"}`}>
        <p className={`${compact ? "text-[10px]" : "text-[11px]"} text-muted-foreground`}>{formatPostedDate(p, locale)}</p>
        {p.sourceDeadlineDate ? (
          <p className={`mt-0.5 font-medium text-rose-600 ${compact ? "text-[10px]" : "text-[11px]"}`}>
            {formatDeadlineDday(p.sourceDeadlineDate, locale)}
          </p>
        ) : p.sourceDeadlineRolling ? (
          <p className={`mt-0.5 font-medium text-rose-600 ${compact ? "text-[10px]" : "text-[11px]"}`}>
            {isKo ? "채용시 마감" : isZh ? "招满即止" : isVi ? "Đóng khi tuyển đủ" : isJa ? "採用次第終了" : isId ? "Tutup setelah terisi" : "Rolling deadline"}
          </p>
        ) : null}
      </div>
      <div
        className={
          compact
            ? "grid grid-cols-[72px_1fr] items-start gap-2.5"
            : "grid grid-cols-[84px_1fr] items-start gap-2 md:grid-cols-[180px_1fr_auto] md:items-stretch md:gap-3"
        }
      >
        <div
          className={
            compact
              ? "relative aspect-square w-[72px] shrink-0 overflow-hidden rounded-lg"
              : "relative aspect-[4/3] w-[84px] shrink-0 self-start overflow-hidden rounded-xl md:aspect-[16/9] md:w-[180px] md:self-auto"
          }
        >
          {p.thumbnailUrl ? (
            <img
              src={p.thumbnailUrl}
              alt={`${p.company} ${copy.thumbnailSuffix}`}
              className="block h-full w-full object-cover"
            />
          ) : (
            <div className={`grid h-full w-full place-items-center bg-muted font-display font-bold leading-none text-muted-foreground ${compact ? "text-xl" : "text-2xl"}`}>
              {p.initial}
            </div>
          )}
        </div>

        <div className={compact ? "min-w-0" : "min-w-0 md:flex md:flex-col md:justify-center"}>
          {p.sourceProvider === "INTERNAL" ? (
            <div className="mb-1">
              <AplyCipBadgeButton onClick={() => onShowCip?.()} />
            </div>
          ) : null}
          <div className={`mb-0.5 min-w-0 text-muted-foreground ${compact ? "text-[10.5px]" : "text-[11px] md:text-xs"}`}>
            {href ? (
              <Link
                href={href}
                className={`relative z-20 block truncate font-semibold hover:text-foreground ${
                  compact ? "max-w-[70%]" : "max-w-[56%] md:max-w-[45%]"
                }`}
              >
                {p.company}
              </Link>
            ) : (
              <p className={`truncate font-semibold ${compact ? "max-w-[70%]" : "max-w-[56%] md:max-w-[45%]"}`}>{p.company}</p>
            )}
            {p.category ? <p className="mt-0.5 truncate leading-tight">{p.category}</p> : null}
          </div>
          <h3
            className={
              compact
                ? "mt-1 mb-1 line-clamp-2 font-display text-[13px] font-bold leading-snug"
                : "mt-1 mb-1 line-clamp-1 font-display text-[14px] font-bold leading-snug md:mt-1.5 md:mb-1.5 md:line-clamp-2 md:text-lg"
            }
          >
            {p.role}
          </h3>
          <div
            className={`mt-0.5 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-muted-foreground ${
              compact ? "text-[10.5px]" : "text-[11px] md:mt-1 md:text-xs"
            }`}
          >
            <span className="inline-flex min-w-0 max-w-[50%] items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{p.location}</span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-1 truncate"><Briefcase className="h-3 w-3 shrink-0" />{workTypeLabel(p.type, locale)}</span>
          </div>
        </div>

        {compact ? null : (
        <div className="relative z-20 col-span-2 flex shrink-0 flex-row items-center justify-end gap-2 pt-1 md:col-span-1 md:mt-auto md:self-end md:pt-0">
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-9 w-9" aria-label={copy.save} onClick={onToggleFavorite}>
              <Bookmark className={isFavorite ? "fill-current text-foreground" : ""} />
            </Button>
            {isExternalSource(p.sourceKind) && p.sourceUrl ? (
              <Button
                variant={p.sourceProvider === "WANTED" ? "outline" : "dark"}
                size="sm"
                className={p.sourceProvider === "WANTED" ? "bg-white" : undefined}
                asChild
              >
                <a
                  href={externalGoHref(p.id, p.sourceKind, p.sourceUrl) ?? p.sourceUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    trackExternalPositionClick(p.id, p.sourceProvider);
                  }}
                >
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
        )}
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
  onShowCip,
  locale
}: {
  p: PositionCard;
  isOwnPartnerPosting: boolean;
  isStudentUser: boolean;
  isApplied: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onApply: () => void;
  onShowCip?: () => void;
  locale: PlatformLocale;
}) => {
  const isKo = locale === "ko";
  const isZh = locale === "zh-CN";
  const isVi = locale === "vi";
  const isJa = locale === "ja";
  const isId = locale === "id";
  const href = companyHref(p.partnerDomain);
  const copy = {
    detailSuffix: isKo ? "상세보기" : isZh ? "查看详情" : isVi ? "Xem chi tiết" : isJa ? "詳細を見る" : isId ? "Lihat detail" : "View details",
    thumbnailSuffix: isKo ? "썸네일" : isZh ? "缩略图" : isVi ? "ảnh thu nhỏ" : isJa ? "サムネイル" : isId ? "thumbnail" : "thumbnail",
    save: isKo ? "저장" : isZh ? "收藏" : isVi ? "Lưu" : isJa ? "保存" : isId ? "Simpan" : "Save",
    edit: isKo ? "수정하기" : isZh ? "编辑" : isVi ? "Chỉnh sửa" : isJa ? "編集する" : isId ? "Edit" : "Edit",
    applyDone: isKo ? "지원완료" : isZh ? "已申请" : isVi ? "Đã ứng tuyển" : isJa ? "応募完了" : isId ? "Sudah melamar" : "Applied",
    apply: isKo ? "지원하기" : isZh ? "申请" : isVi ? "Ứng tuyển" : isJa ? "応募する" : isId ? "Lamar" : "Apply",
    externalLink: isKo ? "보러가기" : isZh ? "查看" : isVi ? "Xem" : isJa ? "見に行く" : isId ? "Lihat" : "View"
  } as const;
  const wantedAltLabel = isKo ? "Wanted에서 보기" : isZh ? "在 Wanted 查看" : isVi ? "Xem trên Wanted" : isJa ? "Wantedで見る" : isId ? "Lihat di Wanted" : "View on Wanted";
  const externalLinkLabel: React.ReactNode =
    p.sourceProvider === "BUDDIES"
        ? (isKo ? "Buddies로 보러가기" : isZh ? "在 Buddies 查看" : isVi ? "Xem trên Buddies" : isJa ? "Buddiesで見る" : isId ? "Lihat di Buddies" : "View on Buddies")
        : p.sourceProvider === "WANTED"
          ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src="/img_logo_wanted.webp"
              alt={wantedAltLabel}
              className="h-6 w-auto"
              onError={(event) => {
                const target = event.currentTarget;
                target.style.display = "none";
                const fallback = target.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = "inline";
              }}
            />
          )
          : copy.externalLink;
  const detailHref = externalGoHref(p.id, p.sourceKind, p.sourceUrl) ?? `/positions/${p.id}`;
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
      <div className="mb-2 flex items-center gap-2 text-[11px]">
        <p className="text-muted-foreground">{formatPostedDate(p, locale)}</p>
        {p.sourceDeadlineDate ? (
          <p className="font-medium text-rose-600">
            {formatDeadlineDday(p.sourceDeadlineDate, locale)}
          </p>
        ) : p.sourceDeadlineRolling ? (
          <p className="font-medium text-rose-600">
            {isKo ? "채용시 마감" : isZh ? "招满即止" : isVi ? "Đóng khi tuyển đủ" : isJa ? "採用次第終了" : isId ? "Tutup setelah terisi" : "Rolling deadline"}
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
          {p.sourceProvider === "INTERNAL" ? (
            <div className="mb-1">
              <AplyCipBadgeButton onClick={() => onShowCip?.()} />
            </div>
          ) : null}
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
        <span className="inline-flex min-w-0 max-w-[58%] items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{p.location}</span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-1 truncate"><Briefcase className="h-3 w-3 shrink-0" />{workTypeLabel(p.type, locale)}</span>
      </div>
      <div className="relative z-20 mt-auto flex items-center gap-2 pt-3">
        <Button variant="outline" size="icon" className="h-9 w-9" aria-label={copy.save} onClick={onToggleFavorite}>
          <Bookmark className={isFavorite ? "fill-current text-foreground" : ""} />
        </Button>
        {isExternalSource(p.sourceKind) && p.sourceUrl ? (
          <Button
            variant={p.sourceProvider === "WANTED" ? "outline" : "dark"}
            className={`h-10 flex-1 text-sm ${p.sourceProvider === "WANTED" ? "bg-white" : ""}`}
            asChild
          >
                <a
                  href={externalGoHref(p.id, p.sourceKind, p.sourceUrl) ?? p.sourceUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    trackExternalPositionClick(p.id, p.sourceProvider);
                  }}
                >
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

// CipInfoModal + AplyCipBadgeButton 은 components/positions/AplyCipBadge.tsx 로 추출됨.
