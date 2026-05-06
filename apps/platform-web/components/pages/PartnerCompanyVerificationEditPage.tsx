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
  const t = (ko: string, en: string) => (locale === "ko" ? ko : en);
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
    businessRegistration: t("사업자등록증", "Business registration"),
    insuranceList: t("4대보험 가입자명부", "4-insurance subscriber list")
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
        setErrorMessage(error instanceof Error ? error.message : t("인증 정보를 불러오지 못했습니다.", "Failed to load verification data."));
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
      setErrorMessage(t("파일 크기는 2MB 이하로 업로드해주세요.", "Please upload files up to 2MB."));
      return;
    }

    setErrorMessage(null);
    setUploadingField(field);
    try {
      const data = await readFileAsDataUrl(file, t("파일을 읽지 못했습니다.", "Failed to read file."));
      if (field === "businessRegistrationDocumentData") setBusinessRegistrationDocumentData(data);
      if (field === "fourInsuranceSubscriberListData") setFourInsuranceSubscriberListData(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("파일 업로드에 실패했습니다.", "Failed to upload file."));
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
      setErrorMessage(error instanceof Error ? error.message : t("인증 정보 저장에 실패했습니다.", "Failed to save verification data."));
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
              {input.uploaded ? t("업로드 완료", "Uploaded") : t("미업로드", "Not uploaded")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input id={inputId} type="file" accept={input.accept} className="sr-only" onChange={(event) => void handleUpload(event, input.key)} />
            <Button variant="outline" size="sm" asChild disabled={isUploading}>
              <label htmlFor={inputId} className="cursor-pointer">
                {isUploading ? t("업로드 중...", "Uploading...") : t("파일 선택", "Select file")}
              </label>
            </Button>
            <p className="text-xs text-muted-foreground">{t("최대 2MB", "Up to 2MB")}</p>
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
          <h1 className="mb-6 font-display text-3xl font-bold tracking-tight">{t("인증 정보 편집", "Edit verification")}</h1>

          {!isReady ? (
            <p className="text-sm text-muted-foreground">{t("정보를 불러오는 중...", "Loading information...")}</p>
          ) : !isAuthenticated || !user ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("로그인이 필요합니다.", "Sign in is required.")}</p>
              <Button variant="dark" asChild>
                <Link href="/login">{t("로그인하러 가기", "Go to login")}</Link>
              </Button>
            </div>
          ) : user.role !== "PARTNER" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("파트너회원만 수정할 수 있습니다.", "Only partner accounts can edit this page.")}</p>
              <Button variant="outline" asChild>
                <Link href="/profile">{t("돌아가기", "Back")}</Link>
              </Button>
            </div>
          ) : (
            <section className="space-y-4">
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {t(
                  "사업자등록증, 4대보험 가입자명부를 업로드하면 운영자 인증 검토를 요청할 수 있습니다.",
                  "Upload business registration and 4-insurance list to request operator verification review."
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
                    "Under review: required documents are uploaded and sent to the operator review list."
                  )
                  : t("검토 요청 전 준비 필요", "Before review request") + `: ${verificationMissing.join(", ")} ${t("업로드가 필요합니다.", "must be uploaded.")}`}
              </div>
              {uploadingField ? <div className="text-xs text-muted-foreground">{t("파일 처리 중...", "Processing file...")}</div> : null}

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => router.push("/profile")} disabled={isSaving}>
                  {t("취소", "Cancel")}
                </Button>
                <Button variant="dark" onClick={() => void handleSave()} disabled={isSaving}>
                  {isSaving ? t("저장 중...", "Saving...") : t("저장", "Save")}
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
