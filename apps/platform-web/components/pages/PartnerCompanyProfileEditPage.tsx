"use client";

import Link from "next/link";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CaretDown, ImageSquare, X } from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { PartnerAdminTwoColumn } from "../partner/PartnerAdminTwoColumn";
import { useAuthSession } from "../auth/AuthSessionProvider";
import {
  createMyPartnerOrganizationJoinCode,
  getMembersMeta,
  getMyPartnerOrganization,
  isPartnerOrganizationProfileComplete,
  joinMyPartnerOrganizationByCode,
  updateMyPartnerOrganizationBasic
} from "../../lib/member-profile-client";
import { partnerIndustryLabel } from "../../lib/partner-industry-labels";
import { useLanguage } from "../i18n/LanguageProvider";
import { useToast } from "../toast/ToastProvider";

const SQUIRCLE_CLIP_ID = "partner-thumb-squircle-clip";
const SQUIRCLE_STROKE_PATH = "M50,0 C74,0 86,3 93,10 C97,14 100,26 100,50 C100,74 97,86 93,90 C86,97 74,100 50,100 C26,100 14,97 7,90 C3,86 0,74 0,50 C0,26 3,14 7,10 C14,3 26,0 50,0 Z";
const SQUIRCLE_FALLBACK_STYLE = {
  clipPath: `url(#${SQUIRCLE_CLIP_ID})`,
  WebkitClipPath: `url(#${SQUIRCLE_CLIP_ID})`
} as const;
const SQUIRCLE_SHAPE_VALUE = "shape(from 50% 0%, curve to 100% 50% with 100% 15%, 100% 35%, curve to 50% 100% with 85% 100%, 65% 100%, curve to 0% 50% with 0% 85%, 0% 65%, curve to 50% 0% with 15% 0%, 35% 0%)";

function readFileAsDataUrl(file: File, readFailed: string) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error(readFailed));
    };
    reader.onerror = () => reject(new Error(readFailed));
    reader.readAsDataURL(file);
  });
}

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.floor((base64.length * 3) / 4);
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
    if (estimateDataUrlBytes(output) <= 5 * 1024 * 1024) {
      return output;
    }
    quality = Math.max(0.5, quality - 0.1);
    width *= 0.9;
    height *= 0.9;
  }

  return output;
}

function createObjectUrl(file: File) {
  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return null;
  return URL.createObjectURL(file);
}

function SquircleStroke() {
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 z-20 h-full w-full" aria-hidden="true">
      <path d={SQUIRCLE_STROKE_PATH} fill="none" stroke="hsl(var(--border))" strokeWidth="1.2" />
    </svg>
  );
}

export function PartnerCompanyProfileEditPage({
  embedded: embeddedProp,
  onClose
}: { embedded?: boolean; onClose?: () => void } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const toast = useToast();
  const t = (ko: string, en: string, zh: string = en, vi: string = en, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;
  const requiredMode = searchParams.get("required") === "1";
  const embedded = embeddedProp ?? searchParams.get("embedded") === "1";
  const finishEdit = () => {
    if (embedded && onClose) {
      onClose();
      return;
    }
    router.push("/profile");
  };
  const { user, isReady, isAuthenticated } = useAuthSession();

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState<"" | "SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100">("");
  const [website, setWebsite] = useState("");
  const [socialMedia, setSocialMedia] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [description, setDescription] = useState("");
  const [strengths, setStrengths] = useState("");
  const [companyLogoImageData, setCompanyLogoImageData] = useState<string | null>(null);
  const [companyLogoPreviewUrl, setCompanyLogoPreviewUrl] = useState<string | null>(null);
  const [officePhotoImages, setOfficePhotoImages] = useState<string[]>([]);
  const [officePhotoPreviewUrls, setOfficePhotoPreviewUrls] = useState<string[]>([]);
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [hasOrganization, setHasOrganization] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const [uploadingField, setUploadingField] = useState<"companyLogoImageData" | "officePhotoImageData" | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const officeInputRef = useRef<HTMLInputElement | null>(null);
  const [squircleStyle, setSquircleStyle] = useState<Record<string, string>>(SQUIRCLE_FALLBACK_STYLE);

  useEffect(() => {
    if (typeof window === "undefined" || !("CSS" in window) || typeof window.CSS.supports !== "function") return;
    if (window.CSS.supports("clip-path", SQUIRCLE_SHAPE_VALUE)) {
      setSquircleStyle({
        clipPath: SQUIRCLE_SHAPE_VALUE,
        WebkitClipPath: SQUIRCLE_SHAPE_VALUE
      });
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== "PARTNER") return;
    let isMounted = true;

    void (async () => {
      try {
        const [org, meta] = await Promise.all([getMyPartnerOrganization(), getMembersMeta()]);
        if (!isMounted) return;

        setIndustryOptions(meta.partnerIndustries);
        if (org) {
          setHasOrganization(true);
          setName(org.name ?? "");
          setIndustry(org.industry ?? "");
          setCompanySize((org.companySize ?? "") as "" | "SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100");
          setWebsite(org.website ?? "");
          setSocialMedia(org.socialMedia ?? "");
          setOfficeAddress(org.officeAddress ?? "");
          setDescription(org.description ?? "");
          setStrengths(org.strengths ?? "");
          setCompanyLogoImageData(org.companyLogoImageData ?? null);
          if (org.officePhotoImageData) {
            try {
              const parsed = JSON.parse(org.officePhotoImageData) as unknown;
              if (Array.isArray(parsed)) {
                setOfficePhotoImages(parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0));
              } else {
                setOfficePhotoImages([org.officePhotoImageData]);
              }
            } catch {
              setOfficePhotoImages([org.officePhotoImageData]);
            }
          } else {
            setOfficePhotoImages([]);
          }

          if (requiredMode && isPartnerOrganizationProfileComplete(org)) {
            if (embedded && onClose) {
              onClose();
            } else {
              router.replace("/profile");
              router.refresh();
            }
            return;
          }
        }
        if (!org) {
          setHasOrganization(false);
        }
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : t("파트너 정보를 불러오지 못했습니다.", "Failed to load partner information.", "无法加载合作伙伴信息。", "Không thể tải thông tin đối tác.", "パートナー情報を読み込めませんでした。", "Gagal memuat informasi mitra."));
      } finally {
        if (isMounted) setIsLoadingForm(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [requiredMode, router, locale, user]);

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>,
    field: "companyLogoImageData" | "officePhotoImageData"
  ) {
    const maxFileSize = 5 * 1024 * 1024;
    const maxRawFileSize = 20 * 1024 * 1024;
    const inputEl = event.currentTarget;
    const files = inputEl.files;
    if (!files || files.length === 0) return;
    const selected = Array.from(files);
    if (selected.some((file) => file.size > maxRawFileSize)) {
      setErrorMessage(t("원본 파일은 20MB 이하만 선택할 수 있습니다.", "Original files up to 20MB are allowed.", "原始文件大小不可超过20MB。", "Tệp gốc chỉ được chọn dưới 20MB.", "元のファイルは20MB以下のみ選択できます。", "File asli hanya dapat dipilih hingga 20MB."));
      return;
    }

    setErrorMessage(null);
    setUploadingField(field);
    try {
      if (field === "companyLogoImageData") {
        const preview = createObjectUrl(selected[0]);
        if (preview) {
          if (companyLogoPreviewUrl) URL.revokeObjectURL(companyLogoPreviewUrl);
          setCompanyLogoPreviewUrl(preview);
        }
        const data = await convertImageFileToWebpDataUrl(
          selected[0],
          t("파일을 읽지 못했습니다.", "Failed to read file.", "无法读取文件。", "Không thể đọc tệp.", "ファイルを読み込めませんでした。", "Gagal membaca file.")
        );
        if (estimateDataUrlBytes(data) > maxFileSize) {
          setErrorMessage(t("변환 후에도 5MB를 초과합니다. 더 작은 이미지를 선택해주세요.", "Still exceeds 5MB after conversion. Please choose a smaller image.", "转换后仍超过5MB。请选择更小的图片。", "Sau khi chuyển đổi vẫn vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.", "変換後も5MBを超えています。より小さい画像を選択してください。", "Setelah konversi masih melebihi 5MB. Silakan pilih gambar yang lebih kecil."));
          return;
        }
        setCompanyLogoImageData(data);
        if (preview) {
          URL.revokeObjectURL(preview);
          setCompanyLogoPreviewUrl(null);
        }
      } else {
        const previews = selected
          .map((file) => createObjectUrl(file))
          .filter((item): item is string => Boolean(item));
        if (previews.length > 0) {
          setOfficePhotoPreviewUrls((prev) => [...prev, ...previews].slice(0, 10));
        }
        const images = await Promise.all(
          selected.map((file) =>
            convertImageFileToWebpDataUrl(file, t("파일을 읽지 못했습니다.", "Failed to read file.", "无法读取文件。", "Không thể đọc tệp.", "ファイルを読み込めませんでした。", "Gagal membaca file."))
          )
        );
        if (images.some((item) => estimateDataUrlBytes(item) > maxFileSize)) {
          setErrorMessage(t("일부 이미지가 변환 후에도 5MB를 초과합니다. 더 작은 이미지를 선택해주세요.", "Some images still exceed 5MB after conversion. Please choose smaller images.", "部分图片转换后仍超过5MB。请选择更小的图片。", "Một số ảnh sau khi chuyển đổi vẫn vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.", "一部の画像が変換後も5MBを超えています。より小さい画像を選択してください。", "Beberapa gambar masih melebihi 5MB setelah konversi. Silakan pilih gambar yang lebih kecil."));
          previews.forEach((item) => URL.revokeObjectURL(item));
          setOfficePhotoPreviewUrls((prev) => prev.filter((item) => !previews.includes(item)));
          return;
        }
        setOfficePhotoImages((prev) => [...prev, ...images].slice(0, 10));
        previews.forEach((item) => URL.revokeObjectURL(item));
        setOfficePhotoPreviewUrls((prev) => prev.filter((item) => !previews.includes(item)));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("파일 업로드에 실패했습니다.", "Failed to upload file.", "文件上传失败。", "Tải tệp thất bại.", "ファイルのアップロードに失敗しました。", "Gagal mengunggah file."));
    } finally {
      setUploadingField(null);
      inputEl.value = "";
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      const message = t("파트너명을 입력해주세요.", "Please enter partner name.", "请输入合作伙伴名称。", "Vui lòng nhập tên đối tác.", "パートナー名を入力してください。", "Silakan masukkan nama mitra.");
      setErrorMessage(message);
      toast.error(message);
      return;
    }
    if (!industry) {
      const message = t("산업군을 선택해주세요.", "Please select an industry.", "请选择行业。", "Vui lòng chọn ngành.", "業種を選択してください。", "Silakan pilih industri.");
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateMyPartnerOrganizationBasic({
        name: name.trim(),
        industry,
        companySize: companySize || null,
        website: website.trim() ? website.trim() : null,
        socialMedia: socialMedia.trim() ? socialMedia.trim() : null,
        officeAddress: officeAddress.trim() ? officeAddress.trim() : null,
        description: description.trim() ? description.trim() : null,
        strengths: strengths.trim() ? strengths.trim() : null,
        companyLogoImageData,
        officePhotoImageData: officePhotoImages.length > 0 ? JSON.stringify(officePhotoImages) : null
      });
      setHasOrganization(true);
      toast.success(t("저장되었습니다.", "Saved successfully.", "已保存。", "Đã lưu.", "保存しました。", "Berhasil disimpan."));
      if (embedded && onClose) {
        onClose();
      } else if (requiredMode) {
        router.push("/profile");
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t("파트너 정보 저장에 실패했습니다.", "Failed to save partner information.", "保存合作伙伴信息失败。", "Lưu thông tin đối tác thất bại.", "パートナー情報の保存に失敗しました。", "Gagal menyimpan informasi mitra.");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleJoinOrganization() {
    if (!joinCode.trim()) {
      const message = t("초대코드를 입력해주세요.", "Please enter invite code.", "请输入邀请码。", "Vui lòng nhập mã mời.", "招待コードを入力してください。", "Silakan masukkan kode undangan.");
      setErrorMessage(message);
      toast.error(message);
      return;
    }
    setIsJoining(true);
    setErrorMessage(null);
    try {
      const joined = await joinMyPartnerOrganizationByCode(joinCode.trim());
      if (!joined) {
        const message = t("회사 정보를 불러오지 못했습니다.", "Failed to load company.", "无法加载公司信息。", "Không thể tải thông tin công ty.", "会社情報を読み込めませんでした。", "Gagal memuat informasi perusahaan.");
        setErrorMessage(message);
        toast.error(message);
        return;
      }
      setHasOrganization(true);
      setName(joined.name ?? "");
      setIndustry(joined.industry ?? "");
      setWebsite(joined.website ?? "");
      setOfficeAddress(joined.officeAddress ?? "");
      setDescription(joined.description ?? "");
      setCompanyLogoImageData(joined.companyLogoImageData ?? null);
      setOfficePhotoImages([]);
      setJoinCode("");
      toast.success(t("회사에 합류했습니다.", "Joined the company.", "已加入公司。", "Đã tham gia công ty.", "会社に参加しました。", "Berhasil bergabung dengan perusahaan."));
      finishEdit();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("회사 합류에 실패했습니다.", "Failed to join company.", "加入公司失败。", "Tham gia công ty thất bại.", "会社への参加に失敗しました。", "Gagal bergabung dengan perusahaan.");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsJoining(false);
    }
  }

  async function handleGenerateInviteCode() {
    setIsGeneratingCode(true);
    setErrorMessage(null);
    try {
      const generated = await createMyPartnerOrganizationJoinCode();
      setInviteCode(generated.code);
      setInviteExpiresAt(generated.expiresAt);
      toast.success(t("초대코드를 생성했습니다.", "Invite code generated.", "已生成邀请码。", "Đã tạo mã mời.", "招待コードを生成しました。", "Kode undangan dibuat."));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("초대코드 생성에 실패했습니다.", "Failed to generate invite code.", "生成邀请码失败。", "Tạo mã mời thất bại.", "招待コードの生成に失敗しました。", "Gagal membuat kode undangan.");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsGeneratingCode(false);
    }
  }

  return (
    <div className={embedded ? "flex flex-col bg-muted/30 font-sans text-foreground antialiased" : "min-h-screen flex flex-col bg-muted/30 font-sans text-foreground antialiased"}>
      {embedded ? null : <Header />}
      <main className={embedded ? "container py-6" : "container py-12 md:py-16"}>
        <svg aria-hidden="true" width="0" height="0" className="absolute">
          <defs>
            <clipPath id={SQUIRCLE_CLIP_ID} clipPathUnits="objectBoundingBox">
              <path d="M0.5,0 C0.74,0 0.86,0.03 0.93,0.1 C0.97,0.14 1,0.26 1,0.5 C1,0.74 0.97,0.86 0.93,0.9 C0.86,0.97 0.74,1 0.5,1 C0.26,1 0.14,0.97 0.07,0.9 C0.03,0.86 0,0.74 0,0.5 C0,0.26 0.03,0.14 0.07,0.1 C0.14,0.03 0.26,0 0.5,0 Z" />
            </clipPath>
          </defs>
        </svg>
        <PartnerAdminTwoColumn className="p-0 md:p-0">
          <div className="space-y-6">
            <div>
              <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-foreground">
                {t("파트너 프로필", "Partner profile", "合作伙伴资料", "Hồ sơ đối tác", "パートナープロフィール", "Profil Mitra")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("파트너 조직의 기본 정보를 관리합니다.", "Manage basic information for your partner organization.", "管理合作伙伴组织的基本信息。", "Quản lý thông tin cơ bản của tổ chức đối tác.", "パートナー組織の基本情報を管理します。", "Kelola informasi dasar organisasi mitra Anda.")}
              </p>
            </div>
            <div>
              {!isReady ? (
                <p className="text-sm text-muted-foreground">{t("정보를 불러오는 중...", "Loading information...", "正在加载信息...", "Đang tải thông tin...", "情報を読み込み中...", "Memuat informasi...")}</p>
              ) : !isAuthenticated || !user ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t("로그인이 필요합니다.", "Sign in is required.", "需要先登录。", "Cần đăng nhập.", "ログインが必要です。", "Diperlukan masuk.")}</p>
                  <Button variant="dark" asChild>
                    <Link href="/login">{t("로그인하러 가기", "Go to login", "前往登录", "Đi tới đăng nhập", "ログインへ", "Pergi ke masuk")}</Link>
                  </Button>
                </div>
              ) : user.role !== "PARTNER" ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t("파트너회원만 수정할 수 있습니다.", "Only partner accounts can edit this page.", "仅合作伙伴账号可以编辑此页面。", "Chỉ tài khoản đối tác mới có thể chỉnh sửa trang này.", "パートナー会員のみこのページを編集できます。", "Hanya akun mitra yang dapat mengedit halaman ini.")}</p>
                  <Button variant="outline" asChild>
                    <Link href="/profile">{t("돌아가기", "Back", "返回", "Quay lại", "戻る", "Kembali")}</Link>
                  </Button>
                </div>
              ) : isLoadingForm ? (
                <p className="text-sm text-muted-foreground">{t("폼을 준비하는 중...", "Preparing form...", "正在准备表单...", "Đang chuẩn bị biểu mẫu...", "フォームを準備中...", "Menyiapkan formulir...")}</p>
              ) : (
                <section className="space-y-4">
                {requiredMode ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {t(
                      "파트너 회원으로 가입했는데 기업에 속해있지 않거나 기업이 등록되어 있지 않으면 로그인 후 기업 등록 절차가 필요합니다.",
                      "If a partner account is not linked to a company or no company is registered, company registration is required after login.",
                      "如果合作伙伴账号未关联公司或尚未注册公司,登录后需要进行公司注册流程。",
                      "Nếu tài khoản đối tác chưa liên kết với công ty hoặc chưa có công ty được đăng ký, cần đăng ký công ty sau khi đăng nhập."
                    )}
                  </div>
                ) : null}

                {!hasOrganization ? (
                  <div className="rounded-2xl border border-border/70 bg-card p-4 md:p-5">
                    <p className="text-sm font-semibold text-foreground">{t("기존 회사에 합류", "Join existing company", "加入现有公司", "Tham gia công ty hiện có", "既存の会社に参加", "Bergabung dengan perusahaan yang ada")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("파트너 관리자가 전달한 초대코드를 입력하면 바로 합류할 수 있습니다.", "Enter an invite code from your partner admin to join instantly.", "输入合作伙伴管理员提供的邀请码即可立即加入。", "Nhập mã mời từ quản trị viên đối tác để tham gia ngay.", "パートナー管理者が共有した招待コードを入力するとすぐに参加できます。", "Masukkan kode undangan dari admin mitra untuk bergabung secara instan.")}
                    </p>
                    <div className="mt-3 space-y-2">
                      <label className="text-sm font-medium" htmlFor="partner-join-code">
                        {t("초대코드", "Invite code", "邀请码", "Mã mời", "招待コード", "Kode undangan")}
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          id="partner-join-code"
                          className="h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm"
                          value={joinCode}
                          onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                          placeholder={t("예: PJT-4K8Q2-M9W7D", "e.g. PJT-4K8Q2-M9W7D", "例如:PJT-4K8Q2-M9W7D", "Ví dụ: PJT-4K8Q2-M9W7D", "例: PJT-4K8Q2-M9W7D", "Contoh: PJT-4K8Q2-M9W7D")}
                          maxLength={120}
                        />
                        <Button variant="outline" onClick={() => void handleJoinOrganization()} disabled={isJoining || isSaving}>
                          {isJoining ? t("합류 중...", "Joining...", "加入中...", "Đang tham gia...", "参加中...", "Sedang bergabung...") : t("합류하기", "Join", "加入", "Tham gia", "参加する", "Bergabung")}
                        </Button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {t("코드가 없다면 아래에서 회사 정보를 입력하고 새 회사를 생성하세요.", "If you don't have a code, fill out company info below to create a new one.", "如果没有邀请码,请在下方填写公司信息以创建新公司。", "Nếu bạn không có mã, hãy điền thông tin công ty bên dưới để tạo công ty mới.", "コードがない場合は、下記の会社情報を入力して新しい会社を作成してください。", "Jika Anda tidak memiliki kode, isi informasi perusahaan di bawah untuk membuat yang baru.")}
                    </p>
                  </div>
                ) : null}

                {hasOrganization && (user?.partnerOrgRole === "OWNER" || user?.partnerOrgRole === "ADMIN") ? (
                  <div className="rounded-2xl border border-border/70 bg-card p-4 md:p-5">
                    <p className="text-sm font-semibold text-foreground">{t("팀 합류 초대코드 발급", "Generate team invite code", "生成团队邀请码", "Tạo mã mời nhóm", "チーム参加用招待コードを発行", "Buat kode undangan tim")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("코드는 1회 사용되며 일정 시간 후 자동 만료됩니다.", "The code is single-use and expires automatically after a limited time.", "邀请码仅可使用一次,并将在限定时间后自动过期。", "Mã chỉ sử dụng một lần và sẽ tự động hết hạn sau một thời gian.", "コードは1回のみ使用でき、一定時間後に自動的に期限切れとなります。", "Kode hanya sekali pakai dan akan otomatis kedaluwarsa setelah waktu terbatas.")}
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Button variant="outline" onClick={() => void handleGenerateInviteCode()} disabled={isGeneratingCode || isSaving}>
                        {isGeneratingCode ? t("생성 중...", "Generating...", "生成中...", "Đang tạo...", "生成中...", "Membuat...") : t("새 초대코드 생성", "Generate new code", "生成新邀请码", "Tạo mã mời mới", "新しい招待コードを生成", "Buat kode undangan baru")}
                      </Button>
                      {inviteCode ? (
                        <p className="text-sm font-medium text-foreground">
                          {inviteCode}
                          {inviteExpiresAt ? ` · ${t("만료", "Expires", "过期", "Hết hạn", "期限", "Kedaluwarsa")}: ${new Date(inviteExpiresAt).toLocaleString(locale === "en" ? "en-US" : "ko-KR")}` : ""}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-2xl bg-white p-4 md:p-5">
                <div className="grid gap-6 py-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-medium" htmlFor="company-logo-upload">
                        {t("기업 이미지(로고)", "Company image (logo)", "企业图片(标志)", "Hình ảnh công ty (logo)", "企業画像(ロゴ)", "Gambar perusahaan (logo)")}
                      </label>
                    </div>
                    <input
                      id="company-logo-upload"
                      type="file"
                      accept="image/*"
                      ref={logoInputRef}
                      className="sr-only"
                      onChange={(event) => void handleUpload(event, "companyLogoImageData")}
                      disabled={uploadingField === "companyLogoImageData"}
                    />
                    <p className="text-xs text-muted-foreground">{t("최대 5MB", "Up to 5MB", "最大5MB", "Tối đa 5MB", "最大5MB", "Hingga 5MB")}</p>
                    <div className="py-5">
                    {companyLogoPreviewUrl ? (
                      <div className="space-y-2">
                        <div
                          className="relative h-24 w-24"
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (isSaving || uploadingField === "companyLogoImageData") return;
                            logoInputRef.current?.click();
                          }}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            if (isSaving || uploadingField === "companyLogoImageData") return;
                            logoInputRef.current?.click();
                          }}
                          aria-disabled={isSaving || uploadingField === "companyLogoImageData"}
                        >
                          <div
                            className="relative h-24 w-24 overflow-hidden bg-muted/30"
                            style={squircleStyle}
                          >
                            <div className="absolute inset-0 scale-[1.05] bg-muted/30" aria-hidden="true" />
                            <SquircleStroke />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={companyLogoPreviewUrl}
                              alt={t("기업 로고 미리보기", "Company logo preview", "企业标志预览", "Xem trước logo công ty", "企業ロゴのプレビュー", "Pratinjau logo perusahaan")}
                              className="absolute inset-0 z-10 block h-full w-full scale-[1.08] object-cover bg-muted/30"
                            />
                          </div>
                          <button
                            type="button"
                            aria-label={t("로고 삭제", "Remove logo", "删除标志", "Xóa logo", "ロゴを削除", "Hapus logo")}
                            className="absolute -right-1 top-1 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black text-white shadow-[0_8px_18px_-8px_rgba(0,0,0,0.9)] transition hover:bg-black/85"
                            onClick={(event) => {
                              event.stopPropagation();
                              setCompanyLogoPreviewUrl(null);
                              setCompanyLogoImageData(null);
                            }}
                            disabled={isSaving || uploadingField === "companyLogoImageData"}
                          >
                            <X size={12} weight="bold" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">{t("변환 중...", "Converting...", "转换中...", "Đang chuyển đổi...", "変換中...", "Sedang mengonversi...")}</p>
                      </div>
                    ) : companyLogoImageData ? (
                      <div className="space-y-2">
                        <div
                          className="relative h-24 w-24"
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (isSaving || uploadingField === "companyLogoImageData") return;
                            logoInputRef.current?.click();
                          }}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            if (isSaving || uploadingField === "companyLogoImageData") return;
                            logoInputRef.current?.click();
                          }}
                          aria-disabled={isSaving || uploadingField === "companyLogoImageData"}
                        >
                          <div
                            className="relative h-24 w-24 overflow-hidden bg-muted/30"
                            style={squircleStyle}
                          >
                            <div className="absolute inset-0 scale-[1.05] bg-muted/30" aria-hidden="true" />
                            <SquircleStroke />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              key={companyLogoImageData.slice(0, 80)}
                              src={companyLogoImageData}
                              alt={t("기업 로고 미리보기", "Company logo preview", "企业标志预览", "Xem trước logo công ty", "企業ロゴのプレビュー", "Pratinjau logo perusahaan")}
                              className="absolute inset-0 z-10 block h-full w-full scale-[1.08] object-cover bg-muted/30"
                            />
                          </div>
                          <button
                            type="button"
                            aria-label={t("로고 삭제", "Remove logo", "删除标志", "Xóa logo", "ロゴを削除", "Hapus logo")}
                            className="absolute -right-1 top-1 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black text-white shadow-[0_8px_18px_-8px_rgba(0,0,0,0.9)] transition hover:bg-black/85"
                            onClick={(event) => {
                              event.stopPropagation();
                              setCompanyLogoImageData(null);
                            }}
                            disabled={isSaving || uploadingField === "companyLogoImageData"}
                          >
                            <X size={12} weight="bold" />
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {!companyLogoPreviewUrl && !companyLogoImageData ? (
                      <div className="h-24 w-24">
                        <button
                          type="button"
                          className="relative flex h-24 w-24 items-center justify-center overflow-hidden bg-muted text-muted-foreground"
                          style={squircleStyle}
                          onClick={() => logoInputRef.current?.click()}
                          disabled={isSaving || uploadingField === "companyLogoImageData"}
                          aria-label={t("로고 이미지 업로드", "Upload logo image", "上传标志图片", "Tải lên hình logo", "ロゴ画像をアップロード", "Unggah gambar logo")}
                        >
                          <SquircleStroke />
                          <ImageSquare size={24} className="text-muted-foreground" />
                        </button>
                      </div>
                    ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-medium" htmlFor="office-photo-upload">
                        {t("추가 이미지(오피스/현장)", "Additional image (office/site)", "其他图片(办公室/现场)", "Hình ảnh bổ sung (văn phòng/hiện trường)", "追加画像(オフィス/現場)", "Gambar tambahan (kantor/lokasi)")}
                      </label>
                    </div>
                    <input
                      id="office-photo-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      ref={officeInputRef}
                      className="sr-only"
                      onChange={(event) => void handleUpload(event, "officePhotoImageData")}
                      disabled={uploadingField === "officePhotoImageData"}
                    />
                    <p className="text-xs text-muted-foreground">{t("최대 5MB", "Up to 5MB", "最大5MB", "Tối đa 5MB", "最大5MB", "Hingga 5MB")}</p>
                    <div className="overflow-x-auto py-5">
                      <div className="flex w-max gap-4">
                      <div className="h-24 w-24 shrink-0">
                        <button
                          type="button"
                          className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden bg-muted text-muted-foreground"
                          style={squircleStyle}
                          onClick={() => officeInputRef.current?.click()}
                          disabled={isSaving || uploadingField === "officePhotoImageData"}
                          aria-label={t("추가 이미지 업로드", "Upload additional image", "上传其他图片", "Tải lên hình ảnh bổ sung", "追加画像をアップロード", "Unggah gambar tambahan")}
                        >
                          <SquircleStroke />
                          <ImageSquare size={24} className="text-muted-foreground" />
                        </button>
                      </div>

                      {(officePhotoImages.length > 0 ? officePhotoImages : officePhotoPreviewUrls).map((image, index) => (
                        <div key={`${index}-${image.slice(0, 32)}`} className="relative h-24 w-24 shrink-0">
                          {officePhotoImages.length > 0 ? (
                            <button
                              type="button"
                              aria-label={t("이미지 삭제", "Remove image", "删除图片", "Xóa hình ảnh", "画像を削除", "Hapus gambar")}
                              className="absolute -right-1 top-1 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black text-white shadow-[0_8px_18px_-8px_rgba(0,0,0,0.9)] transition hover:bg-black/85"
                              onClick={() => {
                                setOfficePhotoImages((prev) => prev.filter((_, i) => i !== index));
                              }}
                              disabled={isSaving || uploadingField === "officePhotoImageData"}
                            >
                              <X size={12} weight="bold" />
                            </button>
                          ) : null}
                          <div className="relative h-24 w-24 overflow-hidden bg-muted/30" style={squircleStyle}>
                            <div className="absolute inset-0 scale-[1.05] bg-muted/30" aria-hidden="true" />
                            <SquircleStroke />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image}
                              alt={t("추가 이미지 미리보기", "Additional image preview", "其他图片预览", "Xem trước hình ảnh bổ sung", "追加画像のプレビュー", "Pratinjau gambar tambahan")}
                              className="absolute inset-0 z-10 block h-full w-full scale-[1.08] object-cover"
                            />
                          </div>
                          {officePhotoImages.length === 0 ? (
                            <p className="absolute inset-x-0 bottom-1 text-center text-[10px] text-white/90">{t("변환 중...", "Converting...", "转换中...", "Đang chuyển đổi...", "変換中...", "Sedang mengonversi...")}</p>
                          ) : null}
                        </div>
                      ))}
                      </div>
                    </div>
                  </div>
                </div>
                </div>

                <div className="rounded-2xl bg-white p-4 md:p-5">
                  <p className="text-sm font-bold text-[#0B1227]">{t("기본 정보", "Basic information", "基本信息", "Thông tin cơ bản", "基本情報", "Informasi dasar")}</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="company-name">{t("파트너명", "Partner name", "合作伙伴名称", "Tên đối tác", "パートナー名", "Nama mitra")}</label>
                    <input
                      id="company-name"
                      className="h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder={t("예: Aply Studio", "e.g. Aply Studio", "例如:Aply Studio", "Ví dụ: Aply Studio", "例: Aply Studio", "Contoh: Aply Studio")}
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="company-industry">{t("산업군", "Industry", "行业", "Ngành", "業種", "Industri")}</label>
                    <div className="relative">
                      <select
                        id="company-industry"
                        className="h-11 w-full appearance-none rounded-xl border-0 bg-muted/40 px-3 pr-9 text-sm"
                        value={industry}
                        onChange={(event) => setIndustry(event.target.value)}
                      >
                        <option value="">{t("선택", "Select", "选择", "Chọn", "選択", "Pilih")}</option>
                        {industryOptions.map((option) => (
                          <option key={option} value={option}>{partnerIndustryLabel(option)}</option>
                        ))}
                      </select>
                      <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="company-size">{t("기업 규모", "Company size", "企业规模", "Quy mô công ty", "企業規模", "Ukuran perusahaan")}</label>
                    <div className="relative">
                      <select
                        id="company-size"
                        className="h-11 w-full appearance-none rounded-xl border-0 bg-muted/40 px-3 pr-9 text-sm"
                        value={companySize}
                        onChange={(event) => setCompanySize(event.target.value as "" | "SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100")}
                      >
                        <option value="">{t("선택 안 함", "Not selected", "未选择", "Chưa chọn", "選択しない", "Belum dipilih")}</option>
                        <option value="SIZE_1_10">{t("1~10인", "1–10 people", "1~10人", "1–10 người", "1~10名", "1–10 orang")}</option>
                        <option value="SIZE_UNDER_30">{t("30인 이하", "≤30 people", "30人以下", "≤30 người", "30名以下", "≤30 orang")}</option>
                        <option value="SIZE_UNDER_50">{t("50인 이하", "≤50 people", "50人以下", "≤50 người", "50名以下", "≤50 orang")}</option>
                        <option value="SIZE_OVER_100">{t("100인 이상", "100+ people", "100人以上", "100+ người", "100名以上", "100+ orang")}</option>
                      </select>
                      <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="company-website">{t("웹사이트", "Website", "网站", "Trang web", "ウェブサイト", "Situs web")}</label>
                    <input
                      id="company-website"
                      className="h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm"
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                      placeholder="https://example.com"
                      maxLength={240}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="company-address">{t("주소", "Address", "地址", "Địa chỉ", "住所", "Alamat")}</label>
                    <input
                      id="company-address"
                      className="h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm"
                      value={officeAddress}
                      onChange={(event) => setOfficeAddress(event.target.value)}
                      placeholder={t("예: 서울특별시 강남구 ...", "e.g. Gangnam-gu, Seoul ...", "例如:首尔特别市江南区 ...", "Ví dụ: Gangnam-gu, Seoul ...", "例: ソウル特別市江南区 ...", "Contoh: Gangnam-gu, Seoul ...")}
                      maxLength={300}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <label className="text-sm font-medium" htmlFor="company-social-media">{t("소셜 미디어", "Social media", "社交媒体", "Mạng xã hội", "ソーシャルメディア", "Media sosial")}</label>
                  <textarea
                    id="company-social-media"
                    className="min-h-20 w-full rounded-xl border-0 bg-muted/40 px-3 py-3 text-sm"
                    value={socialMedia}
                    onChange={(event) => setSocialMedia(event.target.value)}
                    placeholder={t("예: 인스타그램 @company / 페이스북 fb.com/company / 링크드인 linkedin.com/company/...", "e.g. Instagram @company / Facebook fb.com/company / LinkedIn linkedin.com/company/...", "例：Instagram @company / Facebook fb.com/company / LinkedIn linkedin.com/company/...", "Ví dụ: Instagram @company / Facebook fb.com/company / LinkedIn linkedin.com/company/...", "例: Instagram @company / Facebook fb.com/company / LinkedIn linkedin.com/company/...", "Contoh: Instagram @company / Facebook fb.com/company / LinkedIn linkedin.com/company/...")}
                    maxLength={2000}
                  />
                </div>
                </div>

                <div className="rounded-2xl bg-white p-4 md:p-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="company-description">{t("소개", "Description", "简介", "Giới thiệu", "紹介", "Deskripsi")}</label>
                  <textarea
                    id="company-description"
                    className="min-h-36 w-full rounded-xl border-0 bg-muted/40 px-3 py-3 text-sm"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={t("회사/서비스 소개, 채용 포지션 특성, 협업 방식 등을 간단히 작성해 주세요.", "Briefly describe your company, hiring focus, and collaboration style.", "请简要介绍公司/服务、招聘职位特点及协作方式等。", "Vui lòng mô tả ngắn gọn công ty/dịch vụ, đặc điểm vị trí tuyển dụng và phong cách hợp tác.", "会社/サービスの紹介、募集ポジションの特徴、協業スタイルなどを簡潔にご記入ください。", "Jelaskan secara singkat perusahaan/layanan, fokus perekrutan, dan gaya kolaborasi Anda.")}
                    maxLength={2000}
                  />
                  <p className="text-xs text-slate-500">{description.length}/2000</p>
                </div>
                <div className="mt-4 space-y-2">
                  <label className="text-sm font-medium" htmlFor="company-strengths">{t("회사 자랑거리", "Strengths", "公司亮点", "Điểm mạnh", "会社の強み", "Keunggulan")}</label>
                  <textarea
                    id="company-strengths"
                    className="min-h-28 w-full rounded-xl border-0 bg-muted/40 px-3 py-3 text-sm"
                    value={strengths}
                    onChange={(event) => setStrengths(event.target.value)}
                    placeholder={t("복지, 문화, 성장 기회 등 지원자에게 어필할 수 있는 회사의 강점을 적어주세요.", "Share benefits, culture, growth opportunities and anything that makes your company stand out to candidates.", "请描述福利、文化、成长机会等可以吸引候选人的公司亮点。", "Hãy chia sẻ phúc lợi, văn hóa, cơ hội phát triển và bất cứ điều gì giúp công ty bạn nổi bật.", "福利・文化・成長機会など、候補者にアピールできる会社の強みをご記入ください。", "Bagikan tunjangan, budaya, kesempatan berkembang, dan apa pun yang membuat perusahaan Anda menonjol.")}
                    maxLength={2000}
                  />
                  <p className="text-xs text-slate-500">{strengths.length}/2000</p>
                </div>
                </div>

                {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

                <div className="flex items-center justify-end gap-2 pt-2">
                  {!requiredMode ? (
                    <Button variant="outline" onClick={() => finishEdit()} disabled={isSaving}>
                      {t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
                    </Button>
                  ) : null}
                  <Button variant="dark" onClick={() => void handleSave()} disabled={isSaving}>
                    {isSaving ? t("저장 중...", "Saving...", "保存中...", "Đang lưu...", "保存中...", "Sedang menyimpan...") : requiredMode ? t("입력 완료", "Complete", "完成", "Hoàn tất", "入力完了", "Selesai") : t("저장", "Save", "保存", "Lưu", "保存", "Simpan")}
                  </Button>
                </div>
                </section>
              )}
            </div>
          </div>
        </PartnerAdminTwoColumn>
      </main>
      {embedded ? null : <Footer />}
    </div>
  );
}
