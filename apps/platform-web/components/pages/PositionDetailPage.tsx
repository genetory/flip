"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import {
  applyMyPosition,
  deleteMyPartnerPosition,
  getMyAppliedPositions,
  getMyPartnerOrganization,
  getPublicPositionById,
  getPublicPositions,
  type PublicPositionListItem
} from "../../lib/member-profile-client";
import { getPublicPositionStatusBadge } from "../../lib/position-status-meta";
import { ArrowLeft, Briefcase, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import type { PlatformLocale } from "../../lib/auth-messages";
import { partnerIndustryLabel } from "../../lib/partner-industry-labels";

function companySizeLabel(value: string | null | undefined, copy: { infoUnavailable: string }) {
  if (value === "SIZE_1_10") return "1~10";
  if (value === "SIZE_UNDER_30") return "≤30";
  if (value === "SIZE_UNDER_50") return "≤50";
  if (value === "SIZE_OVER_100") return "100+";
  return copy.infoUnavailable;
}

function inferWorkType(value?: string | null): "On-site" | "Hybrid" | "Remote" {
  const text = (value ?? "").toLowerCase();
  if (text.includes("remote") || text.includes("재택")) return "Remote";
  if (text.includes("hybrid") || text.includes("하이브리드")) return "Hybrid";
  return "On-site";
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

function formatPostedDate(value: string, locale: PlatformLocale) {
  const created = new Date(value);
  if (Number.isNaN(created.getTime())) return "-";
  const now = Date.now();
  const diffMs = Math.max(0, now - created.getTime());
  const minutes = Math.floor(diffMs / (60 * 1000));
  const pick = (ko: string, en: string, zh: string, vi: string, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;
  if (minutes < 60) {
    const n = Math.max(1, minutes);
    return pick(`${n}분 전`, `${n}m ago`, `${n} 分钟前`, `${n} phút trước`, `${n}分前`, `${n} menit lalu`);
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return pick(`${hours}시간 전`, `${hours}h ago`, `${hours} 小时前`, `${hours} giờ trước`, `${hours}時間前`, `${hours} jam lalu`);
  const days = Math.floor(hours / 24);
  if (days < 7) return pick(`${days}일 전`, `${days}d ago`, `${days} 天前`, `${days} ngày trước`, `${days}日前`, `${days} hari lalu`);
  const y = created.getFullYear();
  const m = String(created.getMonth() + 1).padStart(2, "0");
  const d = String(created.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${d}`;
}

function getPositionStatusBadge(status: PublicPositionListItem["status"], locale: PlatformLocale) {
  return getPublicPositionStatusBadge(status, locale);
}

function textOrFallback(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function safeStringArray(value: string[] | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function similarityScore(base: PublicPositionListItem, candidate: PublicPositionListItem) {
  let score = 0;
  if (base.preferredJobRole && candidate.preferredJobRole && base.preferredJobRole === candidate.preferredJobRole) score += 4;
  if (base.workType && candidate.workType && base.workType === candidate.workType) score += 3;
  if (
    base.partnerOrganization?.industry &&
    candidate.partnerOrganization?.industry &&
    base.partnerOrganization.industry === candidate.partnerOrganization.industry
  ) {
    score += 2;
  }
  const baseVisaSet = new Set(safeStringArray(base.eligibleVisas));
  const overlapVisas = safeStringArray(candidate.eligibleVisas).filter((visa) => baseVisaSet.has(visa)).length;
  score += Math.min(2, overlapVisas);
  return score;
}

export function PositionDetailPage({
  position: initialPosition,
  positionId
}: {
  position: PublicPositionListItem | null;
  positionId: string;
}) {
  // === All hooks must run on every render in the same order. If we early-
  // return before any hook is called, React error #310 (more hooks than
  // last render) fires when the state later becomes non-null. So every
  // hook used by the full page is declared here, BEFORE the early return.
  const router = useRouter();
  const { locale } = useLanguage();
  const { user, isAuthenticated } = useAuthSession();

  const [position, setPosition] = useState<PublicPositionListItem | null>(initialPosition);
  const [isResolving, setIsResolving] = useState(initialPosition === null);
  const [notFoundForViewer, setNotFoundForViewer] = useState(false);
  const [recommendedPositions, setRecommendedPositions] = useState<PublicPositionListItem[]>([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(true);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);
  const [isThumbnailPreviewOpen, setIsThumbnailPreviewOpen] = useState(false);
  const [appliedPositionIds, setAppliedPositionIds] = useState<string[]>([]);
  const [myPartnerOrganizationId, setMyPartnerOrganizationId] = useState<string | null>(null);
  const inlineGalleryRef = useRef<HTMLDivElement | null>(null);

  const isKo = locale === "ko";
  const isZh = locale === "zh-CN";
  const isVi = locale === "vi";
  const isJa = locale === "ja";
  const isId = locale === "id";

  // When the server-side fetch returned null (position is not in the public
  // OPEN set), retry on the client with the viewer's access token so the
  // posting partner or an operator can see their own pending-review postings.
  useEffect(() => {
    if (initialPosition !== null) return;
    let cancelled = false;
    setIsResolving(true);
    setNotFoundForViewer(false);
    void (async () => {
      try {
        const fetched = await getPublicPositionById(positionId);
        if (cancelled) return;
        setPosition(fetched);
      } catch {
        if (cancelled) return;
        setNotFoundForViewer(true);
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialPosition, positionId, isAuthenticated]);

  // Reset thumbnail gallery state when navigating between positions.
  useEffect(() => {
    setSelectedThumbnailIndex(0);
    setIsThumbnailPreviewOpen(false);
  }, [position?.id]);

  // Bump position viewCount once per browser per day so ops dashboard sees
  // realistic engagement instead of one number per refresh.
  useEffect(() => {
    const id = position?.id;
    if (!id) return;
    if (typeof window === "undefined") return;
    const today = new Date().toISOString().slice(0, 10);
    const storageKey = `position-view:${id}:${today}`;
    try {
      if (window.localStorage.getItem(storageKey)) return;
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // localStorage unavailable (private mode etc.) — still send once
    }
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim() || "";
    if (!apiBase) return;
    const url = `${apiBase.replace(/\/$/, "")}/positions/${encodeURIComponent(id)}/view`;
    void fetch(url, { method: "POST", keepalive: true }).catch(() => {});
  }, [position?.id]);

  // Applied positions for the student viewer.
  useEffect(() => {
    if (!isAuthenticated || !user?.id || user.role !== "STUDENT") {
      setAppliedPositionIds([]);
      return;
    }
    let ignore = false;
    void (async () => {
      try {
        const applied = await getMyAppliedPositions();
        if (ignore) return;
        setAppliedPositionIds(applied.map((item) => item.id));
      } catch {
        if (!ignore) setAppliedPositionIds([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, user?.id, user?.role]);

  // Partner viewer's own organization id (for the "edit" button).
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "PARTNER") {
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
  }, [isAuthenticated, user?.role]);

  // Recommended-positions effect — runs only when position is loaded.
  useEffect(() => {
    if (!position) {
      setRecommendedPositions([]);
      setIsRecommendationsLoading(false);
      return;
    }
    let ignore = false;
    setIsRecommendationsLoading(true);
    void (async () => {
      try {
        const all = await getPublicPositions();
        if (ignore) return;
        const recommended = all
          .filter((item) => item.id !== position.id)
          .map((item) => ({ item, score: similarityScore(position, item) }))
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime();
          })
          .slice(0, 6)
          .map((entry) => entry.item);
        setRecommendedPositions(recommended);
      } catch {
        if (!ignore) setRecommendedPositions([]);
      } finally {
        if (!ignore) setIsRecommendationsLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [position]);

  if (!position) {
    return (
      <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
        <Header />
        <main className="container py-16">
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
            {isResolving ? (
              <>
                <div className="mx-auto mb-3 h-6 w-1/2 animate-pulse rounded bg-muted" />
                <div className="mx-auto h-3 w-3/4 animate-pulse rounded bg-muted" />
              </>
            ) : (
              <>
                <h1 className="font-display text-xl font-bold">
                  {isKo ? "포지션을 찾을 수 없어요" : isZh ? "找不到该职位" : isVi ? "Không tìm thấy vị trí" : isJa ? "ポジションが見つかりません" : isId ? "Posisi tidak ditemukan" : "Position not found"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {notFoundForViewer
                    ? (isKo
                      ? "삭제되었거나 권한이 없는 포지션이에요."
                      : isZh
                        ? "该职位已删除或您无权限查看。"
                        : isVi
                          ? "Vị trí đã bị xóa hoặc bạn không có quyền truy cập."
                          : isJa
                            ? "削除されたか、閲覧権限がありません。"
                            : isId
                              ? "Posisi telah dihapus atau Anda tidak memiliki izin."
                              : "This position was removed or you don't have access.")
                    : (isKo
                      ? "잠시 후 다시 시도해 주세요."
                      : isZh
                        ? "请稍后再试。"
                        : isVi
                          ? "Vui lòng thử lại sau."
                          : isJa
                            ? "しばらくしてから再度お試しください。"
                            : isId
                              ? "Silakan coba lagi nanti."
                              : "Please try again in a moment.")}
                </p>
                <div className="mt-6">
                  <Button variant="dark" asChild>
                    <Link href="/positions">
                      {isKo ? "포지션 목록으로" : isZh ? "返回职位列表" : isVi ? "Về danh sách vị trí" : isJa ? "ポジション一覧へ" : isId ? "Ke daftar posisi" : "Back to positions"}
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  const t = (ko: string, en: string, zh: string, vi: string, ja: string = en, id: string = en) =>
    isKo ? ko : isZh ? zh : isVi ? vi : isJa ? ja : isId ? id : en;
  const copy = {
    partnerCompany: t("파트너 기업", "Partner company", "合作企业", "Doanh nghiệp đối tác", "パートナー企業", "Perusahaan mitra"),
    roleTbd: t("직무 미정", "Role TBD", "岗位待定", "Vị trí chưa xác định", "職務未定", "Posisi belum ditentukan"),
    tbdLocation: t("협의", "To be discussed", "可协商", "Thỏa thuận", "応相談", "Dapat dirundingkan"),
    immediate: t("즉시", "Immediate", "立即", "Ngay", "即時", "Segera"),
    infoUnavailable: t("정보 없음", "No information", "无信息", "Không có thông tin", "情報なし", "Tidak ada informasi"),
    loginRequired: t("로그인한 회원만 지원할 수 있습니다.", "Only signed-in users can apply.", "仅登录用户可申请。", "Chỉ người dùng đã đăng nhập mới có thể ứng tuyển.", "ログインしている会員のみ応募できます。", "Hanya pengguna yang masuk yang dapat melamar."),
    studentRequired: t("파트너 회원, 어드민은 지원하기에 지원할 수 없습니다.", "Partner and admin accounts cannot apply.", "合作伙伴和管理员账号不可申请。", "Tài khoản đối tác và quản trị không thể ứng tuyển.", "パートナー会員および管理者アカウントは応募できません。", "Akun mitra dan admin tidak dapat melamar."),
    appliedAdded: t("지원한 포지션에 추가되었습니다.", "Added to applied positions.", "已添加到已申请职位。", "Đã thêm vào danh sách đã ứng tuyển.", "応募済みポジションに追加されました。", "Ditambahkan ke daftar lamaran."),
    applyFailed: t("지원 처리에 실패했습니다.", "Failed to apply.", "申请失败。", "Ứng tuyển thất bại.", "応募処理に失敗しました。", "Gagal melamar."),
    back: t("뒤로", "Back", "返回", "Quay lại", "戻る", "Kembali"),
    previewAll: t("썸네일 전체보기", "Open full image", "查看大图", "Xem ảnh đầy đủ", "サムネイル全体表示", "Lihat gambar penuh"),
    close: t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup"),
    prevThumbnail: t("이전 썸네일", "Previous image", "上一张", "Ảnh trước", "前のサムネイル", "Gambar sebelumnya"),
    nextThumbnail: t("다음 썸네일", "Next image", "下一张", "Ảnh tiếp theo", "次のサムネイル", "Gambar berikutnya"),
    coreInfo: t("핵심 정보", "Core information", "核心信息", "Thông tin chính", "主要情報", "Informasi utama"),
    workingHours: t("근무 시간", "Working hours", "工作时间", "Giờ làm việc", "勤務時間", "Jam kerja"),
    headcount: t("희망 인원", "Headcount", "招聘人数", "Số lượng tuyển", "募集人数", "Jumlah perekrutan"),
    desiredRole: t("희망 직무", "Desired role", "意向职位", "Vị trí mong muốn", "希望職務", "Posisi yang diinginkan"),
    dressCode: t("근무 복장", "Dress code", "工作着装", "Trang phục làm việc", "勤務時の服装", "Kode busana"),
    postedAt: t("등록일", "Posted", "发布时间", "Ngày đăng", "登録日", "Tanggal diunggah"),
    details: t("상세 안내", "Details", "详细说明", "Chi tiết", "詳細", "Detail"),
    responsibilities: t("주요 업무", "Main responsibilities", "主要职责", "Nhiệm vụ chính", "主な業務", "Tanggung jawab utama"),
    requiredQualifications: t("필수 자격 요건", "Required qualifications", "必备资格条件", "Yêu cầu bắt buộc", "必須資格・要件", "Kualifikasi wajib"),
    hiringProcess: t("채용 프로세스", "Hiring process", "招聘流程", "Quy trình tuyển dụng", "採用プロセス", "Proses perekrutan"),
    companyInfo: t("기업 정보", "Company information", "企业信息", "Thông tin công ty", "企業情報", "Informasi perusahaan"),
    companyName: t("기업 이름", "Company name", "企业名称", "Tên công ty", "企業名", "Nama perusahaan"),
    companySize: t("기업 규모", "Company size", "企业规模", "Quy mô công ty", "企業規模", "Ukuran perusahaan"),
    industry: t("산업", "Industry", "行业", "Ngành nghề", "業種", "Industri"),
    officeAddress: t("사무실 주소", "Office address", "办公地址", "Địa chỉ văn phòng", "事務所住所", "Alamat kantor"),
    website: t("웹사이트", "Website", "网站", "Trang web", "ウェブサイト", "Situs web"),
    socialMedia: t("소셜 미디어", "Social media", "社交媒体", "Mạng xã hội", "ソーシャルメディア", "Media sosial"),
    companyDescription: t("기업 소개", "About the company", "企业介绍", "Giới thiệu công ty", "企業紹介", "Tentang perusahaan"),
    companyStrengths: t("회사 자랑거리", "Strengths", "公司亮点", "Điểm mạnh", "会社の強み", "Keunggulan"),
    companyLogo: t("회사 로고", "Company logo", "公司标志", "Logo công ty", "会社ロゴ", "Logo perusahaan"),
    officePhoto: t("사무실 사진", "Office photo", "办公室照片", "Ảnh văn phòng", "オフィス写真", "Foto kantor"),
    edit: t("수정하기", "Edit", "编辑", "Chỉnh sửa", "編集", "Edit"),
    deleteAction: t("삭제하기", "Delete", "删除", "Xóa", "削除する", "Hapus"),
    deleteConfirm: t("이 포지션을 정말 삭제하시겠습니까? 되돌릴 수 없습니다.", "Delete this position? This cannot be undone.", "确定要删除该职位吗？此操作无法撤销。", "Bạn có chắc muốn xóa vị trí này? Không thể hoàn tác.", "このポジションを削除しますか？元に戻せません。", "Hapus posisi ini? Tindakan tidak dapat dibatalkan."),
    deleteSuccess: t("포지션이 삭제되었습니다.", "Position deleted.", "职位已删除。", "Đã xóa vị trí.", "ポジションを削除しました。", "Posisi telah dihapus."),
    deleteFailed: t("삭제에 실패했습니다.", "Failed to delete.", "删除失败。", "Xóa thất bại.", "削除に失敗しました。", "Gagal menghapus."),
    apply: t("지원하기", "Apply", "申请", "Ứng tuyển", "応募する", "Lamar"),
    applied: t("지원완료", "Applied", "已申请", "Đã ứng tuyển", "応募済み", "Sudah dilamar"),
    recommendationTitle: t("혹시 이런 포지션은 어떠세요?", "You might also like", "你可能也喜欢这些职位", "Bạn cũng có thể thích các vị trí này", "こんなポジションはいかがですか？", "Anda mungkin juga menyukai posisi ini")
  };

  const company = position.partnerOrganization?.name?.trim() || copy.partnerCompany;
  const initial = company[0]?.toUpperCase() ?? "P";
  const category = position.preferredJobRole?.trim() || copy.roleTbd;
  const companyPageHref = companyHref(position.partnerOrganization?.id);
  const postedLabel = formatPostedDate(position.createdAt, locale);
  const thumbnailImages = safeStringArray(position.thumbnailImages);
  const isOwnPartnerPosting = !!myPartnerOrganizationId && position.partnerOrganization?.id === myPartnerOrganizationId;
  const canModerate = user?.role === "OPERATOR" || isOwnPartnerPosting;

  async function handleDeletePosition() {
    if (!position) return;
    if (!canModerate) return;
    if (!window.confirm(copy.deleteConfirm)) return;
    try {
      await deleteMyPartnerPosition(position.id);
      window.alert(copy.deleteSuccess);
      router.push("/positions");
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : copy.deleteFailed);
    }
  }
  const statusBadge = getPositionStatusBadge(position.status, locale);

  // Parse partner organization images (logo + office photos array)
  const partnerOrgOfficePhotos: string[] = (() => {
    const raw = position.partnerOrganization?.officePhotoImageData;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
    } catch {
      // not JSON — treat as single image
    }
    return [raw];
  })();
  const companyLogo = position.partnerOrganization?.companyLogoImageData ?? null;

  async function markAsApplied() {
    if (!position) return;
    if (!isAuthenticated || !user?.id) {
      window.alert(copy.loginRequired);
      return;
    }
    if (user.role !== "STUDENT") {
      window.alert(copy.studentRequired);
      return;
    }
    if (appliedPositionIds.includes(position.id)) return;
    try {
      setAppliedPositionIds((prev) => [...prev, position.id]);
      await applyMyPosition(position.id);
      window.alert(copy.appliedAdded);
    } catch (error) {
      setAppliedPositionIds((prev) => prev.filter((id) => id !== position.id));
      window.alert(error instanceof Error ? error.message : copy.applyFailed);
    }
  }

  function moveThumbnail(direction: "left" | "right") {
    if (thumbnailImages.length <= 1) return;
    setSelectedThumbnailIndex((prev) => {
      if (direction === "left") {
        return prev === 0 ? thumbnailImages.length - 1 : prev - 1;
      }
      return prev === thumbnailImages.length - 1 ? 0 : prev + 1;
    });
  }

  function scrollInlineGallery(direction: "left" | "right") {
    const container = inlineGalleryRef.current;
    if (!container) return;
    const amount = container.clientWidth * 0.92;
    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth"
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                router.back();
              }}
            >
              <ArrowLeft />
              {copy.back}
            </Button>
          </div>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-card md:p-6">
            {thumbnailImages.length > 0 ? (
              <div className="mb-5">
                <div className="relative">
                  <span className={`absolute left-2 top-2 z-20 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge.className}`}>
                    {statusBadge.label}
                  </span>
                  {thumbnailImages.length === 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedThumbnailIndex(0);
                        setIsThumbnailPreviewOpen(true);
                      }}
                      className="block w-full"
                      aria-label={copy.previewAll}
                    >
                      <img
                        src={thumbnailImages[0]}
                        alt={`${company} ${copy.previewAll} 1`}
                        className="aspect-[16/9] w-full rounded-xl object-cover"
                      />
                    </button>
                  ) : (
                    <div className="relative">
                      <div ref={inlineGalleryRef} className="flex gap-2 overflow-x-auto">
                        {thumbnailImages.map((src, index) => (
                          <button
                            key={`${src.slice(0, 20)}-${index}`}
                            type="button"
                            onClick={() => {
                              setSelectedThumbnailIndex(index);
                              setIsThumbnailPreviewOpen(true);
                            }}
                            className="w-[calc(50%-0.25rem)] min-w-[calc(50%-0.25rem)] overflow-hidden rounded-xl"
                            aria-label={`${copy.previewAll} ${index + 1}`}
                          >
                            <img
                              src={src}
                              alt={`${company} ${copy.previewAll} ${index + 1}`}
                              className="aspect-[16/9] w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                      {thumbnailImages.length > 2 ? (
                        <>
                          <button
                            type="button"
                            aria-label={copy.prevThumbnail}
                            onClick={() => scrollInlineGallery("left")}
                            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-black/10 bg-white p-2 text-black shadow-md transition-colors hover:bg-white/90"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            aria-label={copy.nextThumbnail}
                            onClick={() => scrollInlineGallery("right")}
                            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-black/10 bg-white p-2 text-black shadow-md transition-colors hover:bg-white/90"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  )}
                  {isThumbnailPreviewOpen ? (
                    <div
                      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                      onClick={() => setIsThumbnailPreviewOpen(false)}
                    >
                      <div className="relative flex w-full max-w-5xl items-center justify-center" onClick={(event) => event.stopPropagation()}>
                        <img
                          src={thumbnailImages[Math.min(selectedThumbnailIndex, thumbnailImages.length - 1)]}
                          alt={`${company} ${copy.previewAll} ${selectedThumbnailIndex + 1}`}
                          className="block max-h-[88dvh] max-w-full rounded-xl bg-black object-contain"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium"
                          onClick={() => setIsThumbnailPreviewOpen(false)}
                        >
                          {copy.close}
                        </button>
                        {thumbnailImages.length > 2 ? (
                          <>
                            <button
                              type="button"
                              aria-label={copy.prevThumbnail}
                              onClick={() => moveThumbnail("left")}
                              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-black/10 bg-white p-2.5 text-black shadow-md transition-colors hover:bg-white/90"
                            >
                              <ChevronLeft className="h-6 w-6" />
                            </button>
                            <button
                              type="button"
                              aria-label={copy.nextThumbnail}
                              onClick={() => moveThumbnail("right")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-black/10 bg-white p-2.5 text-black shadow-md transition-colors hover:bg-white/90"
                            >
                              <ChevronRight className="h-6 w-6" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="relative mb-5">
                <span className={`absolute left-2 top-2 z-20 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>
                <div className="grid aspect-[16/9] w-full place-items-center rounded-xl bg-muted font-display text-5xl font-bold text-muted-foreground">
                  {initial}
                </div>
              </div>
            )}

            <div>
              <div className="min-w-0 text-sm text-muted-foreground">
                {companyPageHref ? (
                  <Link href={companyPageHref} className="block truncate font-semibold hover:text-foreground">
                    {company}
                  </Link>
                ) : (
                  <span className="block truncate font-semibold">{company}</span>
                )}
                <p className="mt-1 truncate">{category}</p>
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold leading-tight md:text-3xl">{position.title}</h1>
            </div>

            <div className="mt-8">
              <h2 className="text-base font-semibold">{copy.coreInfo}</h2>
              <div className="mt-4 grid gap-6 text-sm md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4 pb-1">
                    <p className="text-sm font-medium text-muted-foreground">{copy.desiredRole}</p>
                    <p className="font-medium">{category}</p>
                  </div>
                  <div className="flex items-start justify-between gap-4 pb-1">
                    <p className="text-sm font-medium text-muted-foreground">{copy.headcount}</p>
                    <p className="font-medium">{position.hiringCount ? `${position.hiringCount}` : copy.infoUnavailable}</p>
                  </div>
                  <div className="flex items-start justify-between gap-4 pb-1">
                    <p className="text-sm font-medium text-muted-foreground">{copy.workingHours}</p>
                    <p className="font-medium">{textOrFallback(position.workingHours, copy.infoUnavailable)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4 pb-1">
                    <p className="text-sm font-medium text-muted-foreground">{copy.dressCode}</p>
                    <p className="font-medium">{textOrFallback(position.dressCode, copy.infoUnavailable)}</p>
                  </div>
                  <div className="flex items-start justify-between gap-4 pb-1">
                    <p className="text-sm font-medium text-muted-foreground">{copy.postedAt}</p>
                    <p className="font-medium">{postedLabel}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-base font-semibold">{copy.details}</h2>
                <div className="mt-4 space-y-5">
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground">{copy.responsibilities}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm leading-7">{textOrFallback(position.mainResponsibilities, copy.infoUnavailable)}</p>
                  </section>
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground">{copy.requiredQualifications}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm leading-7">{textOrFallback(position.requiredQualifications, copy.infoUnavailable)}</p>
                  </section>
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground">{copy.hiringProcess}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm leading-7">{textOrFallback(position.hiringProcess, copy.infoUnavailable)}</p>
                  </section>
                </div>
              </div>

              {position.partnerOrganization ? (
                <div className="mt-8">
                  <h2 className="text-base font-semibold">{copy.companyInfo}</h2>
                  {(companyLogo || partnerOrgOfficePhotos.length > 0) ? (
                    <div className="mt-4 flex flex-wrap items-start gap-3">
                      {companyLogo ? (
                        <div className="flex flex-col items-center gap-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={companyLogo}
                            alt={copy.companyLogo}
                            className="h-24 w-24 rounded-2xl border border-border/60 bg-white object-cover"
                          />
                          <span className="text-[10px] text-muted-foreground">{copy.companyLogo}</span>
                        </div>
                      ) : null}
                      {partnerOrgOfficePhotos.map((photo, index) => (
                        <div key={`org-photo-${index}`} className="flex flex-col items-center gap-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo}
                            alt={copy.officePhoto}
                            className="h-24 w-24 rounded-2xl border border-border/60 object-cover"
                          />
                          <span className="text-[10px] text-muted-foreground">{copy.officePhoto}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                    <div><span className="text-muted-foreground">{copy.companyName}</span><p className="font-medium">{position.partnerOrganization.name || "-"}</p></div>
                    <div><span className="text-muted-foreground">{copy.industry}</span><p className="font-medium">{position.partnerOrganization.industry ? partnerIndustryLabel(position.partnerOrganization.industry) : "-"}</p></div>
                    <div><span className="text-muted-foreground">{copy.companySize}</span><p className="font-medium">{companySizeLabel(position.partnerOrganization.companySize, copy)}</p></div>
                    <div><span className="text-muted-foreground">{copy.officeAddress}</span><p className="font-medium">{position.partnerOrganization.officeAddress || "-"}</p></div>
                    <div><span className="text-muted-foreground">{copy.website}</span><p className="font-medium break-all">{position.partnerOrganization.website || "-"}</p></div>
                    <div><span className="text-muted-foreground">{copy.socialMedia}</span><p className="font-medium break-all">{position.partnerOrganization.socialMedia || "-"}</p></div>
                  </div>
                  {position.partnerOrganization.description ? (
                    <section className="mt-5">
                      <h3 className="text-sm font-medium text-muted-foreground">{copy.companyDescription}</h3>
                      <p className="mt-1 whitespace-pre-line text-sm leading-7">{position.partnerOrganization.description}</p>
                    </section>
                  ) : null}
                  {position.partnerOrganization.strengths ? (
                    <section className="mt-5">
                      <h3 className="text-sm font-medium text-muted-foreground">{copy.companyStrengths}</h3>
                      <p className="mt-1 whitespace-pre-line text-sm leading-7">{position.partnerOrganization.strengths}</p>
                    </section>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-end gap-2">
              {canModerate ? (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => void handleDeletePosition()}
                    className="border-red-300 bg-red-50 text-red-600 hover:border-red-400 hover:bg-red-100 hover:text-red-700"
                  >
                    {copy.deleteAction}
                  </Button>
                  <Button variant="dark" size="lg" asChild>
                    <Link href={`/positions/${position.id}/edit`}>{copy.edit}</Link>
                  </Button>
                </>
              ) : (
                <Button
                  variant="dark"
                  size="lg"
                  onClick={markAsApplied}
                  disabled={user?.role === "STUDENT" && appliedPositionIds.includes(position.id)}
                  className={user?.role === "STUDENT" && appliedPositionIds.includes(position.id) ? "border border-zinc-300 bg-zinc-200 text-zinc-500 hover:bg-zinc-200 disabled:opacity-100" : undefined}
                >
                  {user?.role === "STUDENT" && appliedPositionIds.includes(position.id) ? copy.applied : copy.apply}
                </Button>
              )}
            </div>

          </section>

          {isRecommendationsLoading ? (
            <section className="mt-10" aria-hidden>
              <div className="mb-4 h-7 w-56 animate-pulse rounded bg-muted" />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <article key={`recommended-skeleton-${index}`} className="rounded-xl border border-border bg-card p-4 shadow-card">
                    <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-muted" />
                    <div className="mt-4 space-y-2">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                      <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="mt-3 h-10 w-full animate-pulse rounded bg-muted" />
                  </article>
                ))}
              </div>
            </section>
          ) : recommendedPositions.length > 0 ? (
            <section className="mt-10">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{copy.recommendationTitle}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {recommendedPositions.map((item) => {
                  const itemCompany = item.partnerOrganization?.name?.trim() || copy.partnerCompany;
                  const itemCompanyHref = companyHref(item.partnerOrganization?.id);
                  const itemWorkType = item.workType ?? inferWorkType(item.workingHours);
                  const itemLocation = item.workLocation?.trim() || item.partnerOrganization?.officeAddress?.trim() || copy.tbdLocation;
                  const itemJobRole = item.preferredJobRole?.trim() || copy.roleTbd;
                  const itemThumbnailImages = safeStringArray(item.thumbnailImages);
                  const itemIsOwnPartnerPosting = !!myPartnerOrganizationId && item.partnerOrganization?.id === myPartnerOrganizationId;
                  const itemIsApplied = user?.role === "STUDENT" && appliedPositionIds.includes(item.id);
                  return (
                    <article key={item.id} className="group relative flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-elevated">
                      <Link
                        href={`/positions/${item.id}`}
                        aria-label={`${item.title} ${copy.apply}`}
                        className="absolute inset-0 z-10 rounded-xl"
                      />
                      {itemThumbnailImages[0] ? (
                        <img
                          src={itemThumbnailImages[0]}
                          alt={`${itemCompany} ${t("썸네일", "thumbnail", "缩略图", "ảnh thu nhỏ", "サムネイル", "thumbnail")}`}
                          className="block aspect-[16/9] w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="grid aspect-[16/9] w-full place-items-center rounded-xl bg-muted font-display text-4xl font-bold text-muted-foreground">
                          {itemCompany[0]?.toUpperCase() ?? "P"}
                        </div>
                      )}
                      <div className="mt-4 text-xs text-muted-foreground">
                        <div className="min-w-0 md:flex md:flex-col md:justify-center">
                          {itemCompanyHref ? (
                            <Link href={itemCompanyHref} className="relative z-20 block truncate font-semibold hover:text-foreground">
                              {itemCompany}
                            </Link>
                          ) : (
                            <p className="truncate font-semibold">{itemCompany}</p>
                          )}
                          <p className="mt-1 truncate">{itemJobRole}</p>
                        </div>
                      </div>
                      <h3 className="mt-1 truncate font-display text-base font-bold leading-tight">{item.title}</h3>
                      <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-muted-foreground">
                        <span className="inline-flex min-w-0 max-w-[58%] items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{itemLocation}</span>
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1 truncate"><Briefcase className="h-3 w-3 shrink-0" />{workTypeLabel(itemWorkType, locale)}</span>
                      </div>
                      <div className="relative z-20 mt-auto flex items-center gap-2 pt-3">
                        {itemIsOwnPartnerPosting ? (
                          <Button variant="dark" className="h-10 flex-1 text-sm" asChild>
                            <Link href={`/positions/${item.id}/edit`}>{copy.edit}</Link>
                          </Button>
                        ) : (
                          <Button
                            variant="dark"
                            className={`h-10 flex-1 text-sm ${itemIsApplied ? "border border-zinc-300 bg-zinc-200 text-zinc-500 hover:bg-zinc-200 disabled:opacity-100" : ""}`}
                            asChild={!itemIsApplied}
                            disabled={itemIsApplied}
                          >
                            {itemIsApplied ? (
                              <span>{copy.applied}</span>
                            ) : (
                              <Link href={`/positions/${item.id}`}>{copy.apply}</Link>
                            )}
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
