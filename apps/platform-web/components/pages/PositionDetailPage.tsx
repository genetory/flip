"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import {
  applyMyPosition,
  getMyAppliedPositions,
  getMyPartnerOrganization,
  getPublicPositions,
  type PublicPositionListItem
} from "../../lib/member-profile-client";
import { getPublicPositionStatusBadge } from "../../lib/position-status-meta";
import { ArrowLeft, Briefcase, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import type { PlatformLocale } from "../../lib/auth-messages";

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

export function PositionDetailPage({ position }: { position: PublicPositionListItem }) {
  const router = useRouter();
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const isZh = locale === "zh-CN";
  const isVi = locale === "vi";
  const isJa = locale === "ja";
  const isId = locale === "id";
  const t = (ko: string, en: string, zh: string, vi: string, ja: string = en, id: string = en) =>
    isKo ? ko : isZh ? zh : isVi ? vi : isJa ? ja : isId ? id : en;
  const copy = {
    partnerCompany: t("파트너 기업", "Partner company", "合作企业", "Doanh nghiệp đối tác", "パートナー企業", "Perusahaan mitra"),
    roleTbd: t("직무 미정", "Role TBD", "岗位待定", "Vị trí chưa xác định", "職務未定", "Posisi belum ditentukan"),
    tbdLocation: t("협의", "To be discussed", "可协商", "Thỏa thuận", "応相談", "Dapat dirundingkan"),
    immediate: t("즉시", "Immediate", "立即", "Ngay", "即時", "Segera"),
    noRestriction: t("무관", "No restriction", "不限", "Không giới hạn", "制限なし", "Tidak ada batasan"),
    noNationalityRestriction: t("국적 무관", "No nationality restriction", "国籍不限", "Không giới hạn quốc tịch", "国籍不問", "Tidak ada batasan kewarganegaraan"),
    noLanguageRequirement: t("언어 조건 없음", "No language requirement", "无语言要求", "Không yêu cầu ngôn ngữ", "言語要件なし", "Tidak ada syarat bahasa"),
    noDetails: t("상세 조건 확인", "See details", "查看详情", "Xem chi tiết", "詳細を確認", "Lihat detail"),
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
    workType: t("근무 형태", "Work type", "工作方式", "Hình thức làm việc", "勤務形態", "Tipe pekerjaan"),
    startDate: t("공고 시작일", "Start date", "开始日期", "Ngày bắt đầu", "開始日", "Tanggal mulai"),
    workLocation: t("근무 지역", "Work location", "工作地点", "Địa điểm làm việc", "勤務地", "Lokasi kerja"),
    postedAt: t("등록일", "Posted", "发布时间", "Ngày đăng", "登録日", "Tanggal diunggah"),
    requirements: t("지원 조건", "Requirements", "申请条件", "Yêu cầu", "応募条件", "Persyaratan"),
    visas: t("지원 가능 비자", "Eligible visas", "可申请签证", "Visa đủ điều kiện", "応募可能ビザ", "Visa yang memenuhi syarat"),
    languages: t("소통 언어", "Languages", "沟通语言", "Ngôn ngữ", "コミュニケーション言語", "Bahasa"),
    nationalities: t("선호 국적", "Preferred nationalities", "偏好国籍", "Quốc tịch ưu tiên", "希望国籍", "Kewarganegaraan yang diutamakan"),
    keywords: t("주요 키워드", "Keywords", "关键词", "Từ khóa", "主要キーワード", "Kata kunci"),
    details: t("상세 안내", "Details", "详细说明", "Chi tiết", "詳細", "Detail"),
    responsibilities: t("주요 업무", "Main responsibilities", "主要职责", "Nhiệm vụ chính", "主な業務", "Tanggung jawab utama"),
    requiredQualifications: t("필수 자격", "Required qualifications", "必备资格", "Yêu cầu bắt buộc", "必須資格", "Kualifikasi wajib"),
    preferredQualifications: t("우대 사항", "Preferred qualifications", "优先条件", "Ưu tiên", "優遇事項", "Kualifikasi yang diutamakan"),
    hiringProcess: t("채용 프로세스", "Hiring process", "招聘流程", "Quy trình tuyển dụng", "採用プロセス", "Proses perekrutan"),
    notes: t("추가 메모", "Additional notes", "附加备注", "Ghi chú thêm", "追加メモ", "Catatan tambahan"),
    edit: t("수정하기", "Edit", "编辑", "Chỉnh sửa", "編集", "Edit"),
    apply: t("지원하기", "Apply", "申请", "Ứng tuyển", "応募する", "Lamar"),
    applied: t("지원완료", "Applied", "已申请", "Đã ứng tuyển", "応募済み", "Sudah dilamar"),
    recommendationTitle: t("혹시 이런 포지션은 어떠세요?", "You might also like", "你可能也喜欢这些职位", "Bạn cũng có thể thích các vị trí này", "こんなポジションはいかがですか？", "Anda mungkin juga menyukai posisi ini")
  };

  const { user, isAuthenticated } = useAuthSession();
  const [recommendedPositions, setRecommendedPositions] = useState<PublicPositionListItem[]>([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(true);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);
  const [isThumbnailPreviewOpen, setIsThumbnailPreviewOpen] = useState(false);
  const [appliedPositionIds, setAppliedPositionIds] = useState<string[]>([]);
  const [myPartnerOrganizationId, setMyPartnerOrganizationId] = useState<string | null>(null);
  const inlineGalleryRef = useRef<HTMLDivElement | null>(null);
  const company = position.partnerOrganization?.name?.trim() || copy.partnerCompany;
  const initial = company[0]?.toUpperCase() ?? "P";
  const category = position.preferredJobRole?.trim() || copy.roleTbd;
  const location = position.workLocation?.trim() || position.partnerOrganization?.officeAddress?.trim() || copy.tbdLocation;
  const workType = position.workType ?? inferWorkType(position.workingHours);
  const companyPageHref = companyHref(position.partnerOrganization?.id);
  const startRaw = position.startDate ? new Date(position.startDate) : null;
  const startLabel = startRaw && !Number.isNaN(startRaw.getTime()) ? startRaw.toLocaleDateString(locale === "en" ? "en-US" : "ko-KR") : copy.immediate;
  const postedLabel = formatPostedDate(position.createdAt, locale);
  const thumbnailImages = safeStringArray(position.thumbnailImages);
  const eligibleVisas = safeStringArray(position.eligibleVisas);
  const preferredNationalitiesRaw = safeStringArray(position.preferredNationalities);
  const communicationLanguagesRaw = safeStringArray(position.communicationLanguages);
  const isOwnPartnerPosting = !!myPartnerOrganizationId && position.partnerOrganization?.id === myPartnerOrganizationId;
  const statusBadge = getPositionStatusBadge(position.status, locale);
  const tagItems = [
    ...(position.preferredJobRole ? [position.preferredJobRole] : []),
    ...communicationLanguagesRaw.slice(0, 3),
    ...(position.workingHours ? [position.workingHours] : [])
  ].filter((value, index, array) => array.indexOf(value) === index);
  const visas = eligibleVisas.length ? eligibleVisas : [copy.noRestriction];
  const preferredNationalities = preferredNationalitiesRaw.length ? preferredNationalitiesRaw : [copy.noNationalityRestriction];
  const communicationLanguages = communicationLanguagesRaw.length ? communicationLanguagesRaw : [copy.noLanguageRequirement];

  useEffect(() => {
    setSelectedThumbnailIndex(0);
    setIsThumbnailPreviewOpen(false);
  }, [position.id]);

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

  useEffect(() => {
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

  async function markAsApplied() {
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
                    <p className="text-sm font-medium text-muted-foreground">{copy.workType}</p>
                    <p className="font-medium">{workTypeLabel(workType, locale)}</p>
                  </div>
                  <div className="flex items-start justify-between gap-4 pb-1">
                    <p className="text-sm font-medium text-muted-foreground">{copy.startDate}</p>
                    <p className="font-medium">{startLabel}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4 pb-1">
                    <p className="text-sm font-medium text-muted-foreground">{copy.workLocation}</p>
                    <p className="font-medium">{location}</p>
                  </div>
                  <div className="flex items-start justify-between gap-4 pb-1">
                    <p className="text-sm font-medium text-muted-foreground">{copy.postedAt}</p>
                    <p className="font-medium">{postedLabel}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-base font-semibold">{copy.requirements}</h2>
                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  <div className="space-y-5">
                    <article>
                      <h3 className="text-sm font-medium text-muted-foreground">{copy.visas}</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {visas.map((item) => (
                          <span key={item} className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                            {item}
                          </span>
                        ))}
                      </div>
                    </article>
                    <article>
                      <h3 className="text-sm font-medium text-muted-foreground">{copy.languages}</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {communicationLanguages.map((item) => (
                          <span key={item} className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                            {item}
                          </span>
                        ))}
                      </div>
                    </article>
                  </div>
                  <div className="space-y-5">
                    <article>
                      <h3 className="text-sm font-medium text-muted-foreground">{copy.nationalities}</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {preferredNationalities.map((item) => (
                          <span key={item} className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                            {item}
                          </span>
                        ))}
                      </div>
                    </article>
                    <article>
                      <h3 className="text-sm font-medium text-muted-foreground">{copy.keywords}</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(tagItems.length ? tagItems : [copy.noDetails]).map((tag) => (
                          <span key={tag} className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </article>
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
                    <h3 className="text-sm font-medium text-muted-foreground">{copy.preferredQualifications}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm leading-7">{textOrFallback(position.preferredQualifications, copy.infoUnavailable)}</p>
                  </section>
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground">{copy.hiringProcess}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm leading-7">{textOrFallback(position.hiringProcess, copy.infoUnavailable)}</p>
                  </section>
                  {position.additionalNotes?.trim() ? (
                    <section>
                      <h3 className="text-sm font-medium text-muted-foreground">{copy.notes}</h3>
                      <p className="mt-1 whitespace-pre-line text-sm leading-7">{position.additionalNotes}</p>
                    </section>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end">
              {isOwnPartnerPosting ? (
                <Button variant="dark" size="lg" asChild>
                  <Link href={`/positions/${position.id}/edit`}>{copy.edit}</Link>
                </Button>
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
