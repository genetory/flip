"use client";

import Link from "next/link";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { getMyPartnerOrganization, updateMyPartnerOrganizationBasic } from "../../lib/member-profile-client";
import { useLanguage } from "../i18n/LanguageProvider";

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

export function PartnerCompanyVerificationEditPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = (ko: string, en: string, zh?: string, vi?: string) =>
    locale === "ko" ? ko : locale === "zh-CN" ? (zh ?? en) : locale === "vi" ? (vi ?? en) : en;
  const { user, isReady, isAuthenticated } = useAuthSession();
  const [businessRegistrationDocumentData, setBusinessRegistrationDocumentData] = useState<string | null>(null);
  const [fourInsuranceSubscriberListData, setFourInsuranceSubscriberListData] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  type VerificationFieldKey =
    | "businessRegistrationDocumentData"
    | "fourInsuranceSubscriberListData";

  const labels = {
    businessRegistration: t("사업자등록증", "Business registration", "营业执照", "Giấy đăng ký kinh doanh"),
    insuranceList: t("4대보험 가입자명부", "4-insurance subscriber list", "四大保险参保名册", "Danh sách tham gia 4 loại bảo hiểm")
  };

  const verificationMissing = useMemo(
    () =>
      [
        !businessRegistrationDocumentData ? labels.businessRegistration : null,
        !fourInsuranceSubscriberListData ? labels.insuranceList : null
      ].filter((item): item is string => Boolean(item)),
    [
      businessRegistrationDocumentData,
      fourInsuranceSubscriberListData,
      labels.businessRegistration,
      labels.insuranceList
    ]
  );
  const verificationReady = verificationMissing.length === 0;

  useEffect(() => {
    if (!user || user.role !== "PARTNER") return;
    let isMounted = true;

    void (async () => {
      try {
        const org = await getMyPartnerOrganization();
        if (!isMounted) return;
        if (!org) return;
        setBusinessRegistrationDocumentData(org.businessRegistrationDocumentData ?? null);
        setFourInsuranceSubscriberListData(org.fourInsuranceSubscriberListData ?? null);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : t("인증 정보를 불러오지 못했습니다.", "Failed to load verification data.", "无法加载认证信息。", "Không thể tải thông tin xác minh."));
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [locale, user]);

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>,
    field: VerificationFieldKey
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage(t("파일 크기는 2MB 이하로 업로드해주세요.", "Please upload files up to 2MB.", "请上传不超过 2MB 的文件。", "Vui lòng tải tệp tối đa 2MB."));
      return;
    }

    setErrorMessage(null);
    setUploadingField(field);
    try {
      const data = await readFileAsDataUrl(file, t("파일을 읽지 못했습니다.", "Failed to read file.", "无法读取文件。", "Không thể đọc tệp."));
      if (field === "businessRegistrationDocumentData") setBusinessRegistrationDocumentData(data);
      if (field === "fourInsuranceSubscriberListData") setFourInsuranceSubscriberListData(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("파일 업로드에 실패했습니다.", "Failed to upload file.", "文件上传失败。", "Tải tệp thất bại."));
    } finally {
      setUploadingField(null);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await updateMyPartnerOrganizationBasic({
        businessRegistrationDocumentData,
        fourInsuranceSubscriberListData
      });
      router.push("/profile");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("인증 정보 저장에 실패했습니다.", "Failed to save verification data.", "保存认证信息失败。", "Lưu thông tin xác minh thất bại."));
    } finally {
      setIsSaving(false);
    }
  }

  function renderUploadCard(input: {
    key: VerificationFieldKey;
    title: string;
    accept: string;
    uploaded: boolean;
  }) {
    const inputId = `verification-upload-${input.key}`;
    const isUploading = uploadingField === input.key;
    return (
      <div key={input.key} className="rounded-md border border-border bg-white p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{input.title}</p>
            <span
              className={
                input.uploaded
                  ? "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                  : "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              }
            >
              {input.uploaded ? t("업로드 완료", "Uploaded", "已上传", "Đã tải lên") : t("미업로드", "Not uploaded", "未上传", "Chưa tải lên")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input id={inputId} type="file" accept={input.accept} className="sr-only" onChange={(event) => void handleUpload(event, input.key)} />
            <Button variant="outline" size="sm" asChild disabled={isUploading}>
              <label htmlFor={inputId} className="cursor-pointer">
                {isUploading ? t("업로드 중...", "Uploading...", "上传中...", "Đang tải lên...") : t("파일 선택", "Select file", "选择文件", "Chọn tệp")}
              </label>
            </Button>
            <p className="text-xs text-muted-foreground">{t("최대 2MB", "Up to 2MB", "最大 2MB", "Tối đa 2MB")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30 font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 font-display text-3xl font-bold tracking-tight">{t("인증 정보 편집", "Edit verification", "编辑认证信息", "Chỉnh sửa thông tin xác minh")}</h1>

          {!isReady ? (
            <p className="text-sm text-muted-foreground">{t("정보를 불러오는 중...", "Loading information...", "正在加载信息...", "Đang tải thông tin...")}</p>
          ) : !isAuthenticated || !user ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("로그인이 필요합니다.", "Sign in is required.", "需要先登录。", "Cần đăng nhập.")}</p>
              <Button variant="dark" asChild>
                <Link href="/login">{t("로그인하러 가기", "Go to login", "前往登录", "Đi tới đăng nhập")}</Link>
              </Button>
            </div>
          ) : user.role !== "PARTNER" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("파트너회원만 수정할 수 있습니다.", "Only partner accounts can edit this page.", "仅合作伙伴账户可编辑此页面。", "Chỉ tài khoản đối tác mới có thể chỉnh sửa trang này.")}</p>
              <Button variant="outline" asChild>
                <Link href="/profile">{t("돌아가기", "Back", "返回", "Quay lại")}</Link>
              </Button>
            </div>
          ) : (
            <section className="space-y-4">
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {t(
                  "사업자등록증, 4대보험 가입자명부를 업로드하면 운영자 인증 검토를 요청할 수 있습니다.",
                  "Upload business registration and 4-insurance list to request operator verification review.",
                  "上传营业执照和四大保险参保名册后，可申请运营方进行认证审核。",
                  "Tải lên giấy đăng ký kinh doanh và danh sách tham gia 4 loại bảo hiểm để yêu cầu vận hành viên xét duyệt xác minh."
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {renderUploadCard({
                  key: "businessRegistrationDocumentData",
                  title: labels.businessRegistration,
                  accept: ".pdf,image/*",
                  uploaded: Boolean(businessRegistrationDocumentData)
                })}
                {renderUploadCard({
                  key: "fourInsuranceSubscriberListData",
                  title: labels.insuranceList,
                  accept: ".pdf,image/*",
                  uploaded: Boolean(fourInsuranceSubscriberListData)
                })}
              </div>

              <div className={verificationReady ? "text-xs text-emerald-600" : "text-xs text-amber-600"}>
                {verificationReady
                  ? t(
                    "검토 중: 필수 서류 업로드가 완료되어 운영자 검토 리스트로 전달됩니다.",
                    "Under review: required documents are uploaded and sent to the operator review list.",
                    "审核中：必要文件已上传，已提交至运营方审核列表。",
                    "Đang xét duyệt: hồ sơ bắt buộc đã tải lên và được chuyển tới danh sách xét duyệt của vận hành viên."
                  )
                  : t("검토 요청 전 준비 필요", "Before review request", "提交审核前需准备", "Cần chuẩn bị trước khi gửi xét duyệt") + `: ${verificationMissing.join(", ")} ${t("업로드가 필요합니다.", "must be uploaded.", "需要上传。", "cần được tải lên.")}`}
              </div>
              {uploadingField ? <div className="text-xs text-muted-foreground">{t("파일 처리 중...", "Processing file...", "处理文件中...", "Đang xử lý tệp...")}</div> : null}

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => router.push("/profile")} disabled={isSaving}>
                  {t("취소", "Cancel", "取消", "Hủy")}
                </Button>
                <Button variant="dark" onClick={() => void handleSave()} disabled={isSaving}>
                  {isSaving ? t("저장 중...", "Saving...", "保存中...", "Đang lưu...") : t("저장", "Save", "保存", "Lưu")}
                </Button>
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
