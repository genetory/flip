"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import {
  getMembersMeta,
  getMyPartnerOrganization,
  isPartnerOrganizationProfileComplete,
  updateMyPartnerOrganizationBasic
} from "../../lib/member-profile-client";
import { partnerIndustryLabel } from "../../lib/partner-industry-labels";
import { useLanguage } from "../i18n/LanguageProvider";

export function PartnerCompanyProfileEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const t = (ko: string, en: string) => (locale === "ko" ? ko : en);
  const requiredMode = searchParams.get("required") === "1";
  const { user, isReady, isAuthenticated } = useAuthSession();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [description, setDescription] = useState("");
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "PARTNER") return;
    let isMounted = true;

    void (async () => {
      try {
        const [org, meta] = await Promise.all([getMyPartnerOrganization(), getMembersMeta()]);
        if (!isMounted) return;

        setIndustryOptions(meta.partnerIndustries);
        if (org) {
          setName(org.name ?? "");
          setIndustry(org.industry ?? "");
          setWebsite(org.website ?? "");
          setOfficeAddress(org.officeAddress ?? "");
          setDescription(org.description ?? "");

          if (requiredMode && isPartnerOrganizationProfileComplete(org)) {
            router.replace("/positions");
            router.refresh();
            return;
          }
        }
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : t("파트너 정보를 불러오지 못했습니다.", "Failed to load partner information."));
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [requiredMode, router, locale, user]);

  async function handleSave() {
    if (!name.trim()) {
      setErrorMessage(t("파트너명을 입력해주세요.", "Please enter partner name."));
      return;
    }
    if (!industry) {
      setErrorMessage(t("산업군을 선택해주세요.", "Please select an industry."));
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateMyPartnerOrganizationBasic({
        name: name.trim(),
        industry,
        website: website.trim() ? website.trim() : null,
        officeAddress: officeAddress.trim() ? officeAddress.trim() : null,
        description: description.trim() ? description.trim() : null
      });
      router.push(requiredMode ? "/positions" : "/profile");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("파트너 정보 저장에 실패했습니다.", "Failed to save partner information."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 font-display text-3xl font-bold tracking-tight">{t("기본 정보 편집", "Edit basic information")}</h1>

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
              {requiredMode ? (
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {t("가입 완료를 위해 파트너명과 산업군 입력이 필요합니다.", "To complete signup, partner name and industry are required.")}
                </div>
              ) : null}
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="company-name">
                  {t("파트너명", "Partner name")}
                </label>
                <input
                  id="company-name"
                  className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="company-industry">
                  {t("산업군", "Industry")}
                </label>
                <select
                  id="company-industry"
                  className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                >
                  <option value="">{t("선택", "Select")}</option>
                  {industryOptions.map((option) => (
                    <option key={option} value={option}>
                      {partnerIndustryLabel(option)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="company-website">
                  {t("웹사이트", "Website")}
                </label>
                <input
                  id="company-website"
                  className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder="https://example.com"
                  maxLength={240}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="company-address">
                  {t("주소", "Address")}
                </label>
                <input
                  id="company-address"
                  className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={officeAddress}
                  onChange={(event) => setOfficeAddress(event.target.value)}
                  maxLength={300}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="company-description">
                  {t("소개", "Description")}
                </label>
                <textarea
                  id="company-description"
                  className="min-h-28 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={2000}
                />
              </div>

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

              <div className="flex items-center justify-end gap-2 pt-2">
                {!requiredMode ? (
                  <Button variant="outline" onClick={() => router.push("/profile")} disabled={isSaving}>
                    {t("취소", "Cancel")}
                  </Button>
                ) : null}
                <Button variant="dark" onClick={() => void handleSave()} disabled={isSaving}>
                  {isSaving ? t("저장 중...", "Saving...") : requiredMode ? t("입력 완료하고 계속", "Continue") : t("저장", "Save")}
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
