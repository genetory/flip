"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CaretDown, ImageSquare, X } from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { PartnerAdminTwoColumn } from "../partner/PartnerAdminTwoColumn";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import {
  createMyPartnerPosition,
  getMyPartnerPositionById,
  getMyPartnerOrganization,
  isPartnerOrganizationProfileComplete,
  updateMyPartnerPosition,
  type MyPartnerOrganization
} from "../../lib/member-profile-client";
import { JOB_CATEGORIES, jobCategoryLabel } from "../../lib/job-categories";
import { partnerIndustryLabel } from "../../lib/partner-industry-labels";

function companySizeLabel(value: string | null | undefined, t: (ko: string, en: string, zh?: string, vi?: string, ja?: string, id?: string) => string) {
  if (value === "SIZE_1_10") return t("1~10인", "1–10 people", "1~10人", "1–10 người", "1~10名", "1–10 orang");
  if (value === "SIZE_UNDER_30") return t("30인 이하", "≤30 people", "30人以下", "≤30 người", "30名以下", "≤30 orang");
  if (value === "SIZE_UNDER_50") return t("50인 이하", "≤50 people", "50人以下", "≤50 người", "50名以下", "≤50 orang");
  if (value === "SIZE_OVER_100") return t("100인 이상", "100+ people", "100人以上", "100+ người", "100名以上", "100+ orang");
  return "-";
}

type PartnerPositionStatus = "DRAFT" | "PENDING_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "REJECTED";
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

function workTypeDisplayTitle(workType: "On-site" | "Hybrid" | "Remote", t: (ko: string, en: string, zh?: string, vi?: string, ja?: string, id?: string) => string) {
  if (workType === "On-site") return t("오피스 출근", "On-site", "现场办公", "Làm việc tại văn phòng", "オフィス出社", "Kantor");
  if (workType === "Hybrid") return t("하이브리드", "Hybrid", "混合办公", "Làm việc kết hợp", "ハイブリッド", "Hibrida");
  return t("원격", "Remote", "远程办公", "Làm việc từ xa", "在宅", "Jarak jauh");
}

function employmentTypeDisplayTitle(employmentType: EmploymentType, t: (ko: string, en: string, zh?: string, vi?: string, ja?: string, id?: string) => string) {
  if (employmentType === "FULL_TIME") return t("정직원", "Full-time", "正式员工", "Toàn thời gian", "正社員", "Karyawan tetap");
  if (employmentType === "PART_TIME") return t("알바", "Part-time", "兼职", "Bán thời gian", "アルバイト", "Paruh waktu");
  if (employmentType === "UNPAID_INTERN") return t("무급 인턴", "Unpaid intern", "无薪实习", "Thực tập không lương", "無給インターン", "Magang tanpa bayaran");
  return t("인턴", "Intern", "实习", "Thực tập", "インターン", "Magang");
}

function employmentClassificationDisplayTitle(value: EmploymentClassification, t: (ko: string, en: string, zh?: string, vi?: string, ja?: string, id?: string) => string) {
  if (value === "UNPAID_INTERN_EXPERIENCE") return t("무급 체험형 인턴", "Unpaid experience intern", "无薪体验型实习", "Thực tập trải nghiệm không lương", "無給体験型インターン", "Magang pengalaman tanpa bayaran");
  if (value === "UNPAID_INTERN_CONVERSION") return t("무급 전환형 인턴", "Unpaid conversion intern", "无薪转正型实习", "Thực tập chuyển đổi không lương", "無給転換型インターン", "Magang konversi tanpa bayaran");
  if (value === "PAID_INTERN_EXPERIENCE") return t("유급 체험형 인턴", "Paid experience intern", "有薪体验型实习", "Thực tập trải nghiệm có lương", "有給体験型インターン", "Magang pengalaman berbayar");
  if (value === "PAID_INTERN_CONVERSION") return t("유급 전환형 인턴", "Paid conversion intern", "有薪转正型实习", "Thực tập chuyển đổi có lương", "有給転換型インターン", "Magang konversi berbayar");
  if (value === "PART_TIME") return t("알바", "Part-time", "兼职", "Bán thời gian", "アルバイト", "Paruh waktu");
  return t("정직원", "Full-time", "正式员工", "Toàn thời gian", "正社員", "Karyawan tetap");
}

function toEmploymentTypeFromClassification(value: EmploymentClassification): EmploymentType {
  if (value === "FULL_TIME") return "FULL_TIME";
  if (value === "PART_TIME") return "PART_TIME";
  if (value === "UNPAID_INTERN_EXPERIENCE" || value === "UNPAID_INTERN_CONVERSION") return "UNPAID_INTERN";
  return "INTERN";
}

function isUnpaidInternClassification(value: EmploymentClassification) {
  return value === "UNPAID_INTERN_EXPERIENCE" || value === "UNPAID_INTERN_CONVERSION";
}

function visaDisplayTitle(visa: string, t: (ko: string, en: string, zh?: string, vi?: string, ja?: string, id?: string) => string) {
  if (visa === NO_VISA_OPTION) return t("비자 무관", "No visa required", "不限签证", "Không yêu cầu visa", "ビザ不問", "Tidak memerlukan visa");
  if (visa === "D-2") return t("D-2 (유학)", "D-2 (Student)", "D-2 (留学)", "D-2 (Du học)", "D-2 (留学)", "D-2 (Pelajar)");
  if (visa === "D-4") return t("D-4 (일반연수)", "D-4 (General training)", "D-4 (一般研修)", "D-4 (Đào tạo chung)", "D-4 (一般研修)", "D-4 (Pelatihan umum)");
  if (visa === "D-10") return t("D-10 (구직)", "D-10 (Job seeker)", "D-10 (求职)", "D-10 (Tìm việc)", "D-10 (求職)", "D-10 (Pencari kerja)");
  if (visa === "E-7") return t("E-7 (특정활동)", "E-7 (Specific activities)", "E-7 (特定活动)", "E-7 (Hoạt động cụ thể)", "E-7 (特定活動)", "E-7 (Aktivitas khusus)");
  if (visa === "F-2") return t("F-2 (거주)", "F-2 (Resident)", "F-2 (居住)", "F-2 (Cư trú)", "F-2 (居住)", "F-2 (Penduduk)");
  if (visa === "F-4") return t("F-4 (재외동포)", "F-4 (Overseas Korean)", "F-4 (在外同胞)", "F-4 (Người Hàn ở nước ngoài)", "F-4 (在外同胞)", "F-4 (Diaspora Korea)");
  if (visa === "F-5") return t("F-5 (영주)", "F-5 (Permanent resident)", "F-5 (永住)", "F-5 (Thường trú)", "F-5 (永住)", "F-5 (Penduduk tetap)");
  if (visa === "F-6") return t("F-6 (결혼이민)", "F-6 (Marriage migrant)", "F-6 (结婚移民)", "F-6 (Kết hôn nhập cư)", "F-6 (結婚移民)", "F-6 (Migran pernikahan)");
  if (visa === "H-1") return t("H-1 (관광취업)", "H-1 (Working holiday)", "H-1 (打工度假)", "H-1 (Working Holiday)", "H-1 (ワーキングホリデー)", "H-1 (Working Holiday)");
  return visa;
}

function toLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toIsoDateStart(value: string) {
  if (!value) return null;
  return `${value}T00:00:00.000Z`;
}

function RequiredMark() {
  return <span className="ml-1 text-red-500">*</span>;
}

async function readFileAsDataUrl(file: File, readFailed: string) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(readFailed));
    reader.readAsDataURL(file);
  });
}

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.floor((base64.length * 3) / 4);
}

function createObjectUrl(file: File) {
  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return null;
  return URL.createObjectURL(file);
}

async function convertImageFileToWebpDataUrl(
  file: File,
  readFailed: string
) {
  const originalDataUrl = await readFileAsDataUrl(file, readFailed);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(readFailed));
    img.src = originalDataUrl;
  });

  let width = image.width;
  let height = image.height;
  let quality = 0.9;
  let output = originalDataUrl;

  for (let i = 0; i < 6; i += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(readFailed);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    output = canvas.toDataURL("image/webp", quality);
    if (estimateDataUrlBytes(output) <= 5 * 1024 * 1024) return output;
    quality = Math.max(0.5, quality - 0.1);
    width *= 0.9;
    height *= 0.9;
  }

  return output;
}

export function PartnerPositionCreatePage({
  embedded = false,
  onEmbeddedClose,
  mode = "create",
  positionId
}: {
  embedded?: boolean;
  onEmbeddedClose?: () => void;
  mode?: "create" | "edit";
  positionId?: string;
} = {}) {
  const isEditMode = mode === "edit";
  const router = useRouter();
  const { locale } = useLanguage();
  const t = (ko: string, en: string, zh: string = en, vi: string = en, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;
  const { user, isReady, isAuthenticated } = useAuthSession();

  const [isCheckingOrg, setIsCheckingOrg] = useState(false);
  const [isLoadingPosition, setIsLoadingPosition] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [createBlockedReason, setCreateBlockedReason] = useState<"profile" | "verification" | null>(null);
  const [currentVerificationStatus, setCurrentVerificationStatus] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<PartnerPositionStatus>("PENDING_REVIEW");
  const [workType, setWorkType] = useState<"On-site" | "Hybrid" | "Remote">("On-site");
  const [employmentClassification, setEmploymentClassification] = useState<EmploymentClassification>("UNPAID_INTERN_EXPERIENCE");
  const [thumbnailImages, setThumbnailImages] = useState<string[]>([]);
  const [preferredJobRole, setPreferredJobRole] = useState("");
  const [hiringCount, setHiringCount] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [startDate, setStartDate] = useState("");

  const [mainResponsibilities, setMainResponsibilities] = useState("");
  const [hiringProcess, setHiringProcess] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [org, setOrg] = useState<MyPartnerOrganization | null>(null);

  const [eligibleVisas, setEligibleVisas] = useState<string[]>([]);
  const [communicationLanguages, setCommunicationLanguages] = useState("");
  const [preferredNationalities, setPreferredNationalities] = useState("");
  const [requiredQualifications, setRequiredQualifications] = useState("");
  const [preferredQualifications, setPreferredQualifications] = useState("");

  const [isEducationalPurpose, setIsEducationalPurpose] = useState(false);
  const [notReplacingWorker, setNotReplacingWorker] = useState(false);
  const [hasMentorAndPlan, setHasMentorAndPlan] = useState(false);
  const [visaNoticeConfirmed, setVisaNoticeConfirmed] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingThumbnails, setIsUploadingThumbnails] = useState(false);
  const [thumbnailPreviewUrls, setThumbnailPreviewUrls] = useState<string[]>([]);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!embedded) return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [embedded]);

  useEffect(() => {
    if (mode !== "create") return;
    if (!isReady || !isAuthenticated || !user) return;
    if (user.role !== "PARTNER" && user.role !== "OPERATOR") return;

    // Operators bypass the org-affiliation check — they post directly and
    // skip approval entirely (handled server-side too).
    if (user.role === "OPERATOR") {
      setCanCreate(true);
      setCreateBlockedReason(null);
      setCurrentVerificationStatus(null);
      setOrg(null);
      return;
    }

    let ignore = false;
    setIsCheckingOrg(true);
    void (async () => {
      try {
        const org = await getMyPartnerOrganization();
        if (ignore) return;
        setOrg(org);
        const isProfileComplete = isPartnerOrganizationProfileComplete(org);
        const canPostPositions = Boolean(org?.permissions?.canPostPositions);
        const verificationStatus = org?.verification?.isApproved
          ? t("운영중", "Active", "运营中", "Đang hoạt động", "稼働中", "Aktif")
          : t("검토중 (승인 대기)", "Under review (approval pending)", "审核中（等待批准）", "Đang xem xét (chờ phê duyệt)", "審査中(承認待ち)", "Sedang ditinjau (menunggu persetujuan)");
        const allowed = isProfileComplete && canPostPositions;
        setCurrentVerificationStatus(verificationStatus);
        setCanCreate(allowed);
        if (allowed) {
          setCreateBlockedReason(null);
        } else if (!isProfileComplete) {
          setCreateBlockedReason("profile");
        } else {
          setCreateBlockedReason("verification");
        }
      } catch (error) {
        if (ignore) return;
        setCanCreate(false);
        setCreateBlockedReason("profile");
        setCurrentVerificationStatus(null);
        setErrorMessage(error instanceof Error ? error.message : t("기업 정보를 불러오지 못했습니다.", "Failed to load company information.", "无法加载企业信息。", "Không thể tải thông tin công ty.", "企業情報を読み込めませんでした。", "Gagal memuat informasi perusahaan."));
      } finally {
        if (!ignore) setIsCheckingOrg(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, isReady, user, locale, mode]);

  useEffect(() => {
    if (mode !== "edit") return;
    if (!positionId) return;
    if (!isReady || !isAuthenticated || !user) return;
    if (user.role !== "PARTNER" && user.role !== "OPERATOR") return;
    let ignore = false;
    setIsLoadingPosition(true);
    void (async () => {
      try {
        const [item, loadedOrg] = await Promise.all([
          getMyPartnerPositionById(positionId),
          getMyPartnerOrganization()
        ]);
        if (ignore) return;
        setOrg(loadedOrg);
        setTitle(item.title ?? "");
        setStatus((item.status as PartnerPositionStatus) ?? "PENDING_REVIEW");
        setWorkType(item.workType === "Hybrid" || item.workType === "Remote" ? item.workType : "On-site");
        setEmploymentClassification(
          (item.employmentClassification as EmploymentClassification | null | undefined)
          ?? (item.employmentType === "FULL_TIME"
            ? "FULL_TIME"
            : item.employmentType === "PART_TIME"
              ? "PART_TIME"
              : item.employmentType === "UNPAID_INTERN"
                ? "UNPAID_INTERN_EXPERIENCE"
                : "PAID_INTERN_EXPERIENCE")
        );
        setThumbnailImages(item.thumbnailImages ?? []);
        setEligibleVisas(item.eligibleVisas ?? []);
        setPreferredJobRole(item.preferredJobRole ?? "");
        setHiringCount(item.hiringCount ? String(item.hiringCount) : "");
        setWorkLocation(item.workLocation ?? "");
        setStartDate(item.startDate ? new Date(item.startDate).toISOString().slice(0, 10) : "");
        setHiringProcess(item.hiringProcess ?? "");
        setCommunicationLanguages((item.communicationLanguages ?? []).join("\n"));
        setPreferredNationalities((item.preferredNationalities ?? []).join("\n"));
        setMainResponsibilities(item.mainResponsibilities ?? "");
        setRequiredQualifications(item.requiredQualifications ?? "");
        setPreferredQualifications(item.preferredQualifications ?? "");
        setAdditionalNotes(item.additionalNotes ?? "");
        setWorkingHours(item.workingHours ?? "");
        setDressCode(item.dressCode ?? "");
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : t("포지션 정보를 불러오지 못했습니다.", "Failed to load position information.", "无法加载职位信息。", "Không thể tải thông tin vị trí.", "ポジション情報を読み込めませんでした。", "Gagal memuat informasi posisi."));
        }
      } finally {
        if (!ignore) setIsLoadingPosition(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [mode, positionId, isReady, isAuthenticated, user, locale]);

  function validateCurrentStep() {
    if (!title.trim()) {
      setErrorMessage(t("포지션 제목을 입력해주세요.", "Please enter a position title.", "请输入职位标题。", "Vui lòng nhập tiêu đề vị trí.", "ポジションのタイトルを入力してください。", "Silakan masukkan judul posisi."));
      return false;
    }
    if (!preferredJobRole.trim()) {
      setErrorMessage(t("희망 직무를 선택해주세요.", "Please select desired role.", "请选择意向职位。", "Vui lòng chọn vị trí mong muốn.", "希望職務を選択してください。", "Silakan pilih posisi yang diinginkan."));
      return false;
    }
    if (!mainResponsibilities.trim()) {
      setErrorMessage(t("주요 업무를 입력해주세요.", "Please enter main responsibilities.", "请输入主要工作。", "Vui lòng nhập nhiệm vụ chính.", "主な業務を入力してください。", "Silakan masukkan tugas utama."));
      return false;
    }
    if (hiringCount.trim()) {
      const parsedHiringCount = Number(hiringCount);
      if (!Number.isFinite(parsedHiringCount)) {
        setErrorMessage(t("모집 인원 형식을 확인해주세요.", "Please check hiring count format.", "请检查招聘人数格式。", "Vui lòng kiểm tra định dạng số lượng tuyển dụng.", "募集人数の形式を確認してください。", "Silakan periksa format jumlah perekrutan."));
        return false;
      }
    }
    setErrorMessage(null);
    return true;
  }

  // 서버 body 제한(36mb)에 걸려 413 이 나기 전에, 제출 전 썸네일 총 용량을 미리 확인.
  const TOO_LARGE_MESSAGE = () =>
    t(
      "이미지 용량이 너무 큽니다. 사진 장수를 줄이거나 크기가 작은 이미지를 사용해 주세요.",
      "Images are too large. Reduce the number of photos or use smaller images.",
      "图片过大。请减少照片数量或使用更小的图片。",
      "Hình ảnh quá lớn. Hãy giảm số lượng ảnh hoặc dùng ảnh nhỏ hơn.",
      "画像の容量が大きすぎます。枚数を減らすか、小さい画像を使用してください。",
      "Gambar terlalu besar. Kurangi jumlah foto atau gunakan gambar yang lebih kecil."
    );

  async function handleSubmit() {
    if (!validateCurrentStep()) return;

    // 이미지 총 용량 사전 체크(서버 body 한계 40mb 대비 여유 38MiB — 썸네일 5장 최대치는 통과).
    const thumbBytes = thumbnailImages.reduce((sum, img) => sum + (img?.length ?? 0), 0);
    if (thumbBytes > 38 * 1024 * 1024) {
      setErrorMessage(TOO_LARGE_MESSAGE());
      return;
    }

    const parsedHiringCount = hiringCount.trim() ? Number(hiringCount) : undefined;
    const employmentType = toEmploymentTypeFromClassification(employmentClassification);
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        title: title.trim(),
        workType,
        employmentType,
        employmentClassification,
        thumbnailImages,
        eligibleVisas: eligibleVisas.includes(NO_VISA_OPTION) ? [] : eligibleVisas,
        preferredJobRole: preferredJobRole.trim() || undefined,
        hiringCount: parsedHiringCount && parsedHiringCount >= 1 ? parsedHiringCount : undefined,
        workLocation: workLocation.trim() || undefined,
        startDate: toIsoDateStart(startDate),
        hiringProcess: hiringProcess.trim() || undefined,
        workingHours: workingHours.trim() || undefined,
        communicationLanguages: toLines(communicationLanguages),
        preferredNationalities: toLines(preferredNationalities),
        mainResponsibilities: mainResponsibilities.trim() || undefined,
        requiredQualifications: requiredQualifications.trim() || undefined,
        preferredQualifications: preferredQualifications.trim() || undefined,
        dressCode: dressCode.trim() || undefined,
        additionalNotes: additionalNotes.trim() || undefined
      };
      const isOperator = user?.role === "OPERATOR";
      if (mode === "edit" && positionId) {
        await updateMyPartnerPosition(positionId, payload);
        if (embedded) {
          onEmbeddedClose?.();
        } else {
          window.alert(
            isOperator
              ? t("수정사항이 저장되었습니다.", "Changes saved.", "修改已保存。", "Đã lưu thay đổi.", "変更が保存されました。", "Perubahan disimpan.")
              : t("수정사항이 저장되어 바로 반영되었습니다.", "Changes saved and published right away.", "修改已保存并立即生效。", "Các thay đổi đã được lưu và áp dụng ngay.", "変更が保存され、すぐに反映されました。", "Perubahan disimpan dan langsung diterapkan.")
          );
          router.push(`/partner/positions/${encodeURIComponent(positionId)}`);
        }
      } else {
        const created = await createMyPartnerPosition(payload);
        if (embedded) {
          onEmbeddedClose?.();
        } else {
          window.alert(
            isOperator
              ? t("포지션이 즉시 게시되었습니다.", "Position published.", "职位已立即发布。", "Vị trí đã được đăng ngay.", "ポジションが即時公開されました。", "Posisi langsung diterbitkan.")
              : t("포지션이 등록되어 바로 게시되었습니다.", "Position created and published right away.", "职位已创建并立即发布。", "Vị trí đã được tạo và đăng ngay.", "ポジションが登録され、すぐに公開されました。", "Posisi dibuat dan langsung diterbitkan.")
          );
          router.push(`/partner/positions/${encodeURIComponent(created.id)}`);
        }
      }
      router.refresh();
    } catch (error) {
      const status = (error as { status?: number } | null)?.status;
      if (status === 413) {
        // 용량 초과 — 구체적 안내(일반 실패 메시지 대신).
        setErrorMessage(TOO_LARGE_MESSAGE());
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : mode === "edit"
              ? t("포지션 수정에 실패했습니다.", "Failed to update position.", "更新职位失败。", "Cập nhật vị trí thất bại.", "ポジションの修正に失敗しました。", "Gagal memperbarui posisi.")
              : t("포지션 생성에 실패했습니다.", "Failed to create position.", "创建职位失败。", "Tạo vị trí thất bại.", "ポジションの作成に失敗しました。", "Gagal membuat posisi.")
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleThumbnailUpload(selected: File[]) {
    if (!selected || selected.length === 0) return;
    const maxRawFileSize = 20 * 1024 * 1024;
    if (selected.some((file) => file.size > maxRawFileSize)) {
      setErrorMessage(t("원본 파일은 20MB 이하만 선택할 수 있습니다.", "Original files up to 20MB are allowed.", "原始文件大小不得超过20MB。", "Chỉ cho phép tệp gốc dưới 20MB.", "元のファイルは20MB以下のみ選択できます。", "File asli hanya dapat dipilih hingga 20MB."));
      return;
    }

    setIsUploadingThumbnails(true);
    setErrorMessage(null);
    const previews = selected
      .map((file) => createObjectUrl(file))
      .filter((item): item is string => Boolean(item));
    try {
      const remain = Math.max(0, 5 - thumbnailImages.length);
      if (remain <= 0) return;
      if (previews.length > 0) {
        setThumbnailPreviewUrls((prev) => [...prev, ...previews].slice(0, 5));
      }
      const converted: string[] = [];
      let failedCount = 0;
      for (const file of selected.slice(0, remain)) {
        try {
          let data = await readFileAsDataUrl(file, t("파일을 읽지 못했습니다.", "Failed to read file.", "无法读取文件。", "Không thể đọc tệp.", "ファイルを読み込めませんでした。", "Gagal membaca file."));
          if (estimateDataUrlBytes(data) > 5 * 1024 * 1024) {
            data = await convertImageFileToWebpDataUrl(
              file,
              t("파일을 읽지 못했습니다.", "Failed to read file.", "无法读取文件。", "Không thể đọc tệp.", "ファイルを読み込めませんでした。", "Gagal membaca file.")
            );
            if (estimateDataUrlBytes(data) > 5 * 1024 * 1024) {
              failedCount += 1;
              continue;
            }
          }
          converted.push(data);
        } catch {
          try {
            const fallback = await readFileAsDataUrl(file, t("파일을 읽지 못했습니다.", "Failed to read file.", "无法读取文件。", "Không thể đọc tệp.", "ファイルを読み込めませんでした。", "Gagal membaca file."));
            if (fallback && estimateDataUrlBytes(fallback) <= 5 * 1024 * 1024) {
              converted.push(fallback);
            } else {
              failedCount += 1;
            }
          } catch {
            failedCount += 1;
          }
        }
      }

      if (converted.length > 0) {
        setThumbnailImages((prev) => [...prev, ...converted].slice(0, 5));
      }
      if (failedCount > 0 && converted.length === 0) {
        setErrorMessage(
          t(
            "이미지 변환에 실패했어요. 다른 이미지로 다시 시도해주세요.",
            "Image conversion failed. Please try with a different image.",
            "图片转换失败。请尝试使用其他图片。",
            "Chuyển đổi hình ảnh thất bại. Vui lòng thử với hình ảnh khác.",
            "画像の変換に失敗しました。別の画像でもう一度お試しください。",
            "Konversi gambar gagal. Silakan coba dengan gambar lain."
          )
        );
      } else if (failedCount > 0) {
        setErrorMessage(
          t(
            "일부 이미지는 변환되지 않아 제외되었어요.",
            "Some images could not be converted and were skipped.",
            "部分图片未能转换已被跳过。",
            "Một số hình ảnh không thể chuyển đổi và đã bị bỏ qua.",
            "一部の画像は変換できず除外されました。",
            "Beberapa gambar tidak dapat dikonversi dan dilewati."
          )
        );
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("썸네일 업로드에 실패했습니다.", "Failed to upload thumbnails.", "缩略图上传失败。", "Tải lên hình thu nhỏ thất bại.", "サムネイルのアップロードに失敗しました。", "Gagal mengunggah thumbnail."));
    } finally {
      previews.forEach((item) => URL.revokeObjectURL(item));
      if (previews.length > 0) {
        setThumbnailPreviewUrls((prev) => prev.filter((item) => !previews.includes(item)));
      }
      setIsUploadingThumbnails(false);
    }
  }

  const content = (
    <div className={embedded ? "mx-auto flex h-full max-w-4xl flex-col" : "mx-auto max-w-4xl"}>
      <h1 className={embedded ? "shrink-0 pb-2 font-display text-3xl font-bold tracking-tight" : "mb-6 font-display text-3xl font-bold tracking-tight"}>
        {mode === "edit" ? t("포지션 수정", "Edit position", "编辑职位", "Chỉnh sửa vị trí", "ポジションの修正", "Edit posisi") : t("포지션 등록", "Create position", "创建职位", "Tạo vị trí", "ポジションの登録", "Buat posisi")}
      </h1>

          {!isReady ? (
            <p className="text-sm text-muted-foreground">{t("정보를 불러오는 중...", "Loading information...", "正在加载信息...", "Đang tải thông tin...", "情報を読み込み中...", "Memuat informasi...")}</p>
          ) : !isAuthenticated || !user ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("로그인이 필요합니다.", "Sign in is required.", "需要登录。", "Cần đăng nhập.", "ログインが必要です。", "Diperlukan masuk.")}</p>
              <Button variant="dark" asChild>
                <Link href="/login">{t("로그인하러 가기", "Go to login", "前往登录", "Đi đến đăng nhập", "ログインへ", "Pergi ke masuk")}</Link>
              </Button>
            </div>
          ) : user.role !== "PARTNER" && user.role !== "OPERATOR" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("파트너회원·운영자만 포지션을 생성할 수 있습니다.", "Only partner or operator accounts can create positions.", "只有合作伙伴或运营账户可以创建职位。", "Chỉ tài khoản đối tác hoặc vận hành mới có thể tạo vị trí.", "パートナー会員・運営者のみポジションを作成できます。", "Hanya akun mitra atau operator yang dapat membuat posisi.")}</p>
              <Button variant="outline" asChild>
                <Link href="/partner/positions">{t("포지션 목록으로", "Go to positions", "前往职位列表", "Đi đến danh sách vị trí", "ポジション一覧へ", "Ke daftar posisi")}</Link>
              </Button>
            </div>
          ) : mode === "edit" && isLoadingPosition ? (
            <p className="text-sm text-muted-foreground">{t("포지션 정보를 불러오는 중...", "Loading position information...", "正在加载职位信息...", "Đang tải thông tin vị trí...", "ポジション情報を読み込み中...", "Memuat informasi posisi...")}</p>
          ) : isCheckingOrg ? (
            <p className="text-sm text-muted-foreground">{t("기업 정보 상태를 확인하는 중...", "Checking company profile status...", "正在确认企业信息状态...", "Đang kiểm tra trạng thái thông tin công ty...", "企業情報のステータスを確認中...", "Memeriksa status profil perusahaan...")}</p>
          ) : mode === "create" && !canCreate ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {createBlockedReason === "verification"
                  ? t("파트너 운영중이 승인되지 않으면 포지션을 등록할 수 없습니다", "Positions cannot be created until partner operation is approved.", "合作伙伴运营未获批准前无法创建职位。", "Không thể tạo vị trí cho đến khi hoạt động đối tác được phê duyệt.", "パートナーの稼働中が承認されないとポジションを登録できません", "Posisi tidak dapat dibuat hingga operasi mitra disetujui.")
                  : t("포지션 생성 전 기업 기본 정보 입력이 필요합니다.", "Basic company information is required before creating positions.", "创建职位前需要填写企业基本信息。", "Cần nhập thông tin cơ bản của công ty trước khi tạo vị trí.", "ポジション作成前に企業の基本情報の入力が必要です。", "Informasi dasar perusahaan diperlukan sebelum membuat posisi.")}
              </p>
              {createBlockedReason === "verification" && currentVerificationStatus ? (
                <p className="text-sm text-muted-foreground">
                  {t("현재 인증상태", "Current verification status", "当前认证状态", "Trạng thái xác minh hiện tại", "現在の認証ステータス", "Status verifikasi saat ini")}: {currentVerificationStatus}
                </p>
              ) : null}
              <Button variant="dark" asChild>
                <Link href={createBlockedReason === "verification" ? "/partner-profile/verification/edit" : "/partner-profile/edit?required=1"}>
                  {createBlockedReason === "verification"
                    ? t("인증 정보 확인하러 가기", "Go to verification", "前往确认认证信息", "Đi đến xác minh", "認証情報の確認へ", "Pergi ke verifikasi")
                    : t("기업 정보 입력하러 가기", "Go to company profile", "前往填写企业信息", "Đi đến hồ sơ công ty", "企業情報の入力へ", "Pergi ke profil perusahaan")}
                </Link>
              </Button>
            </div>
          ) : (
            <section className={embedded ? "flex min-h-0 flex-1 flex-col space-y-4 p-1 [&_input]:focus-visible:outline-none [&_input]:focus-visible:ring-2 [&_input]:focus-visible:ring-inset [&_input]:focus-visible:ring-[#0B1227]/20 [&_select]:focus-visible:outline-none [&_select]:focus-visible:ring-2 [&_select]:focus-visible:ring-inset [&_select]:focus-visible:ring-[#0B1227]/20 [&_textarea]:focus-visible:outline-none [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-inset [&_textarea]:focus-visible:ring-[#0B1227]/20" : "space-y-6 rounded-2xl border border-border/70 bg-card p-5 md:p-6 [&_input]:focus-visible:outline-none [&_input]:focus-visible:ring-2 [&_input]:focus-visible:ring-inset [&_input]:focus-visible:ring-[#0B1227]/20 [&_select]:focus-visible:outline-none [&_select]:focus-visible:ring-2 [&_select]:focus-visible:ring-inset [&_select]:focus-visible:ring-[#0B1227]/20 [&_textarea]:focus-visible:outline-none [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-inset [&_textarea]:focus-visible:ring-[#0B1227]/20"}>
              <div className={embedded ? "min-h-0 flex-1 overflow-y-auto px-1" : ""}>
              <div className="space-y-6">

                {/* Company info summary (read-only — managed on partner profile) */}
                {org ? (
                  <section className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-5 md:p-6">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-base font-semibold">{t("기업 정보", "Company information", "企业信息", "Thông tin công ty", "企業情報", "Informasi perusahaan")}</h2>
                      <Link
                        href="/partner-profile/edit"
                        className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {t("기업 프로필 편집", "Edit company profile", "编辑企业资料", "Sửa hồ sơ công ty", "企業プロフィール編集", "Edit profil perusahaan")} →
                      </Link>
                    </div>
                    <p className="text-xs text-muted-foreground">{t("기업 정보는 기업 프로필 페이지에서 한 번 입력하면 모든 포지션 공고에 자동으로 사용됩니다.", "Company info is set once on the company profile and reused for every position.", "企业信息只需在企业资料页填写一次，便会自动用于每个职位。", "Thông tin công ty chỉ cần nhập một lần trong hồ sơ và sẽ dùng chung cho mọi vị trí.", "企業情報は企業プロフィールで一度入力すると、すべてのポジション公告に自動で使われます。", "Informasi perusahaan diisi sekali di profil dan digunakan ulang untuk semua posisi.")}</p>
                    {(() => {
                      const officePhotos: string[] = (() => {
                        const raw = org.officePhotoImageData;
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
                      const hasAnyImage = Boolean(org.companyLogoImageData) || officePhotos.length > 0;
                      if (!hasAnyImage) return null;
                      return (
                        <div className="flex flex-wrap items-start gap-3 pt-1">
                          {org.companyLogoImageData ? (
                            <div className="flex flex-col items-center gap-1">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={org.companyLogoImageData}
                                alt={t("회사 로고", "Company logo", "公司标志", "Logo công ty", "会社ロゴ", "Logo perusahaan")}
                                className="h-20 w-20 rounded-2xl border border-border/60 bg-white object-cover"
                              />
                              <span className="text-[10px] text-muted-foreground">{t("회사 로고", "Logo", "标志", "Logo", "ロゴ", "Logo")}</span>
                            </div>
                          ) : null}
                          {officePhotos.map((photo, index) => (
                            <div key={`${index}-${photo.slice(0, 24)}`} className="flex flex-col items-center gap-1">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photo}
                                alt={t("사무실 사진", "Office photo", "办公室照片", "Ảnh văn phòng", "オフィス写真", "Foto kantor")}
                                className="h-20 w-20 rounded-2xl border border-border/60 object-cover"
                              />
                              <span className="text-[10px] text-muted-foreground">{t("사무실", "Office", "办公室", "Văn phòng", "オフィス", "Kantor")}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    <div className="grid gap-3 text-sm md:grid-cols-2">
                      <div><span className="text-muted-foreground">{t("기업 이름", "Company name", "企业名称", "Tên công ty", "企業名", "Nama perusahaan")}</span><p className="font-medium">{org.name || "-"}</p></div>
                      <div><span className="text-muted-foreground">{t("사무실 주소", "Office address", "办公地址", "Địa chỉ văn phòng", "事務所住所", "Alamat kantor")}</span><p className="font-medium">{org.officeAddress || "-"}</p></div>
                      <div><span className="text-muted-foreground">{t("기업 규모", "Company size", "企业规模", "Quy mô công ty", "企業規模", "Ukuran perusahaan")}</span><p className="font-medium">{companySizeLabel(org.companySize, t)}</p></div>
                      <div><span className="text-muted-foreground">{t("산업 카테고리", "Industry", "行业类别", "Ngành nghề", "業種", "Industri")}</span><p className="font-medium">{org.industry ? partnerIndustryLabel(org.industry) : "-"}</p></div>
                      <div><span className="text-muted-foreground">{t("기업 웹사이트", "Website", "企业网站", "Trang web", "ウェブサイト", "Situs web")}</span><p className="font-medium break-all">{org.website || "-"}</p></div>
                      <div><span className="text-muted-foreground">{t("소셜 미디어", "Social media", "社交媒体", "Mạng xã hội", "ソーシャルメディア", "Media sosial")}</span><p className="font-medium break-all">{org.socialMedia || "-"}</p></div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-muted-foreground">{t("기업 소개", "Description", "企业介绍", "Giới thiệu công ty", "企業紹介", "Deskripsi perusahaan")}</span><p className="mt-1 whitespace-pre-line">{org.description || "-"}</p></div>
                      <div><span className="text-muted-foreground">{t("회사 자랑거리", "Strengths", "公司亮点", "Điểm mạnh công ty", "会社の強み", "Keunggulan perusahaan")}</span><p className="mt-1 whitespace-pre-line">{org.strengths || "-"}</p></div>
                    </div>
                  </section>
                ) : null}

                {/* Position-specific fields */}
                <section className="space-y-5">
                  <h2 className="text-base font-semibold">{t("포지션 정보", "Position details", "职位信息", "Chi tiết vị trí", "ポジション情報", "Detail posisi")}</h2>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("썸네일 이미지 (최대 5장)", "Thumbnail images (max 5)", "缩略图 (最多5张)", "Hình ảnh thu nhỏ (tối đa 5)", "サムネイル画像 (最大5枚)", "Gambar thumbnail (maks 5)")}</label>
                    <p className="text-xs text-muted-foreground">{t("회사·사무실·추가 이미지 등을 자유롭게 등록하세요. 장당 최대 5MB.", "Upload company, office, or additional photos. Up to 5MB per image.", "可上传公司、办公室或附加照片，每张最大5MB。", "Tải lên ảnh công ty, văn phòng hoặc bổ sung. Tối đa 5MB mỗi ảnh.", "会社・オフィス・追加画像など自由にアップロード可。1枚最大5MB。", "Unggah foto perusahaan, kantor, atau tambahan. Maksimal 5MB per gambar.")} · {thumbnailImages.length}/5</p>
                    <input
                      id="position-thumbnail-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      ref={thumbnailInputRef}
                      className="sr-only"
                      onChange={(e) => {
                        const selected = e.currentTarget.files ? Array.from(e.currentTarget.files) : [];
                        e.currentTarget.value = "";
                        void handleThumbnailUpload(selected);
                      }}
                      disabled={isUploadingThumbnails || isSubmitting}
                    />
                    <div className="overflow-x-auto py-2">
                      <div className="flex w-max gap-3">
                        <div className="h-20 w-20 shrink-0">
                          <label
                            htmlFor="position-thumbnail-upload"
                            className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-muted text-muted-foreground ${isUploadingThumbnails || isSubmitting || thumbnailImages.length >= 5 ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                            aria-label={t("이미지 업로드", "Upload image", "上传图片", "Tải lên hình ảnh", "画像をアップロード", "Unggah gambar")}
                            aria-disabled={isUploadingThumbnails || isSubmitting || thumbnailImages.length >= 5}
                          >
                            <ImageSquare size={22} />
                          </label>
                        </div>
                        {(thumbnailImages.length > 0 ? thumbnailImages : thumbnailPreviewUrls).map((image, index) => (
                          <div key={`${index}-${image.slice(0, 24)}`} className="relative h-20 w-20 shrink-0">
                            {thumbnailImages.length > 0 ? (
                              <button
                                type="button"
                                aria-label={t("이미지 삭제", "Remove image", "删除图片", "Xóa hình ảnh", "画像を削除", "Hapus gambar")}
                                className="absolute -right-1 -top-1 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black text-white shadow-[0_8px_18px_-8px_rgba(0,0,0,0.9)] transition hover:bg-black/85"
                                onClick={() => setThumbnailImages((prev) => prev.filter((_, i) => i !== index))}
                                disabled={isUploadingThumbnails || isSubmitting}
                              >
                                <X size={12} weight="bold" />
                              </button>
                            ) : null}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image}
                              alt={t("썸네일 미리보기", "Thumbnail preview", "缩略图预览", "Xem trước hình thu nhỏ", "サムネイルのプレビュー", "Pratinjau thumbnail")}
                              className="h-20 w-20 rounded-2xl object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("포지션명", "Position title", "职位名称", "Tên vị trí", "ポジション名", "Judul posisi")}<RequiredMark /></label>
                    <input
                      className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm"
                      placeholder={t("예) 프론트엔드 개발 인턴", "e.g. Frontend Developer Intern", "例）前端开发实习生", "Ví dụ) Thực tập sinh phát triển Frontend", "例) フロントエンド開発インターン", "Contoh) Magang Pengembang Frontend")}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("희망 직무", "Desired role", "意向职位", "Vị trí mong muốn", "希望職務", "Posisi yang diinginkan")}<RequiredMark /></label>
                      <div className="relative">
                        <select
                          className="h-10 w-full appearance-none rounded-md border-0 bg-muted/50 px-3 pr-10 text-sm"
                          value={preferredJobRole}
                          onChange={(e) => setPreferredJobRole(e.target.value)}
                        >
                          <option value="">{t("선택해주세요", "Please select", "请选择", "Vui lòng chọn", "選択してください", "Silakan pilih")}</option>
                          {JOB_CATEGORIES.map((category) => (
                            <option key={category} value={category}>{jobCategoryLabel(category, locale)}</option>
                          ))}
                        </select>
                        <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("희망 인원", "Headcount", "招聘人数", "Số lượng tuyển", "募集人数", "Jumlah perekrutan")}</label>
                      <input
                        type="number"
                        min={1}
                        className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm"
                        placeholder={t("예) 3", "e.g. 3", "例）3", "Ví dụ) 3", "例) 3", "Contoh) 3")}
                        value={hiringCount}
                        onChange={(e) => setHiringCount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("근무 시간", "Working hours", "工作时间", "Giờ làm việc", "勤務時間", "Jam kerja")}</label>
                    <input
                      className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm"
                      placeholder={t("예) 평일 09:00 ~ 18:00 (점심 1시간)", "e.g. Mon–Fri 09:00 – 18:00 (1h lunch)", "例）周一至周五 09:00–18:00 (午餐1小时)", "Ví dụ) Thứ 2–6, 09:00 – 18:00 (1 giờ ăn trưa)", "例) 平日 09:00〜18:00（昼休み1時間）", "Contoh) Sen–Jum 09:00 – 18:00 (1 jam makan siang)")}
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("주요 업무", "Main responsibilities", "主要工作", "Nhiệm vụ chính", "主な業務", "Tugas utama")}<RequiredMark /></label>
                    <textarea
                      className="min-h-28 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm"
                      placeholder={t("담당 업무를 항목별로 작성해주세요.", "List main responsibilities by bullet points.", "请按项目列出主要职责。", "Liệt kê các trách nhiệm chính theo từng mục.", "担当業務を項目別にご記入ください。", "Tuliskan tanggung jawab utama dalam poin-poin.")}
                      value={mainResponsibilities}
                      onChange={(e) => setMainResponsibilities(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("필수 자격 요건", "Required qualifications", "必备资格条件", "Yêu cầu bắt buộc", "必須資格・要件", "Kualifikasi wajib")}</label>
                    <textarea
                      className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm"
                      placeholder={t("필수 기술/경험/자격 요건을 작성해주세요.", "Describe required skills, experience, and qualifications.", "请描述必备的技能、经验和资格要求。", "Mô tả các kỹ năng, kinh nghiệm và yêu cầu bắt buộc.", "必須のスキル・経験・資格要件をご記入ください。", "Jelaskan keterampilan, pengalaman, dan kualifikasi yang diperlukan.")}
                      value={requiredQualifications}
                      onChange={(e) => setRequiredQualifications(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("채용 프로세스", "Hiring process", "招聘流程", "Quy trình tuyển dụng", "採用プロセス", "Proses perekrutan")}</label>
                    <textarea
                      className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm"
                      placeholder={t("예) 서류 검토 → 1차 인터뷰 → 최종 합격", "e.g. Resume review → Interview → Final decision", "例）简历审核 → 面试 → 最终录用", "Ví dụ) Xét hồ sơ → Phỏng vấn → Quyết định cuối cùng", "例) 書類審査 → 一次面接 → 最終合格", "Contoh) Review resume → Wawancara → Keputusan akhir")}
                      value={hiringProcess}
                      onChange={(e) => setHiringProcess(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("근무 복장", "Dress code", "工作着装", "Trang phục làm việc", "勤務時の服装", "Kode busana")}</label>
                    <input
                      className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm"
                      placeholder={t("예) 비즈니스 캐주얼 / 자유 복장", "e.g. Business casual / Free dress", "例）商务休闲 / 自由着装", "Ví dụ) Smart casual / Trang phục tự do", "例) ビジネスカジュアル / 自由", "Contoh) Smart casual / Bebas")}
                      value={dressCode}
                      onChange={(e) => setDressCode(e.target.value)}
                    />
                  </div>
                </section>
              </div>

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
              </div>

              <div className={embedded ? "sticky bottom-0 z-10 flex items-center justify-between gap-2 bg-card pt-3" : "flex items-center justify-between gap-2 pt-2"}>
                <Button
                  variant="outline"
                  onClick={() => (embedded ? (onEmbeddedClose ? onEmbeddedClose() : router.back()) : router.push("/profile"))}
                  disabled={isSubmitting}
                >
                  {t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="dark" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                    {isSubmitting
                      ? isEditMode
                        ? t("저장 중...", "Saving...", "保存中...", "Đang lưu...", "保存中...", "Sedang menyimpan...")
                        : t("생성 중...", "Creating...", "创建中...", "Đang tạo...", "作成中...", "Membuat...")
                      : isEditMode
                        ? t("수정사항 저장", "Save changes", "保存修改", "Lưu thay đổi", "変更を保存", "Simpan perubahan")
                        : user?.role === "OPERATOR"
                          ? t("바로 게시", "Publish now", "立即发布", "Đăng ngay", "今すぐ公開", "Terbitkan sekarang")
                          : t("승인 요청 제출", "Submit for review", "提交审核请求", "Gửi yêu cầu phê duyệt", "承認依頼を提出", "Kirim untuk tinjauan")}
                  </Button>
                </div>
              </div>
            </section>
          )}
    </div>
  );

  if (embedded) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4">
        <div className="h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-card p-5 md:p-6">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30 font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <PartnerAdminTwoColumn>
          {content}
        </PartnerAdminTwoColumn>
      </main>
      <Footer />
    </div>
  );
}
