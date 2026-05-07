import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Footer } from "../../../components/site/Footer";
import { Header } from "../../../components/site/Header";
import { CompanyPositionsSection } from "../../../components/pages/CompanyPositionsSection";
import { Button } from "../../../components/ui/button";
import { getPublicPositions } from "../../../lib/member-profile-client";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";

function companySizeLabel(value: string | null | undefined, isKo: boolean) {
  if (value === "SIZE_1_10") return isKo ? "10인 이하" : "Up to 10";
  if (value === "SIZE_UNDER_30") return isKo ? "30인 이하" : "Up to 30";
  if (value === "SIZE_UNDER_50") return isKo ? "50인 이하" : "Up to 50";
  if (value === "SIZE_OVER_100") return isKo ? "100인 이상" : "100+";
  return isKo ? "미정" : "TBD";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${d}`;
}

function workTypeLabel(value: string | null | undefined, isKo: boolean) {
  const normalized = (value ?? "").toLowerCase().replace(/[\s_-]/g, "");
  if (normalized === "remote") return "Remote";
  if (normalized === "hybrid") return "Hybrid";
  if (normalized === "onsite") return "On-site";
  return value?.trim() || (isKo ? "정보 없음" : "No information");
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language") ?? "";
  const isKo = acceptLanguage.toLowerCase().includes("ko");
  const t = (ko: string, en: string) => (isKo ? ko : en);

  const referer = headerStore.get("referer");
  const backHref = referer && referer.trim() ? referer : "/positions";
  const { id } = await params;
  const companyId = decodeURIComponent(id).trim();

  let items: Awaited<ReturnType<typeof getPublicPositions>> = [];
  try {
    items = await getPublicPositions();
  } catch {
    items = [];
  }

  const companyPositions = items
    .filter((item) => item.partnerOrganization?.id === companyId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (companyPositions.length === 0) {
    notFound();
  }

  const company = companyPositions[0].partnerOrganization;
  const companyName = company?.name?.trim() || (isKo ? "파트너 기업" : "Partner company");
  const companyInitial = companyName[0]?.toUpperCase() ?? "C";
  const companyLogoSrc = companyPositions
    .flatMap((item) => item.thumbnailImages ?? [])
    .find((src) => typeof src === "string" && src.trim().length > 0) ?? null;
  const industryLabel = partnerIndustryLabel(company?.industry ?? "OTHER");
  const companySize = companySizeLabel(company?.companySize, isKo);
  const officeAddress = company?.officeAddress?.trim() || t("주소 정보 없음", "No address info");
  const totalPositions = companyPositions.length;
  const activePositions = companyPositions.filter((item) => item.status === "OPEN").length;
  const latestPositionDate = formatDate(companyPositions[0]?.createdAt);
  const uniqueWorkLocations = Array.from(
    new Set(
      companyPositions
        .map((item) => item.workLocation?.trim() || item.partnerOrganization?.officeAddress?.trim() || "")
        .filter((value) => value.length > 0)
    )
  );
  const uniqueWorkTypes = Array.from(
    new Set(
      companyPositions
        .map((item) => workTypeLabel(item.workType, isKo))
        .filter((value) => value.length > 0)
    )
  );

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href={backHref}>
                <ArrowLeft />
                {t("뒤로 가기", "Back")}
              </Link>
            </Button>
          </div>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Company</p>
            <div className="mt-3 mb-3">
              {companyLogoSrc ? (
                <img
                  src={companyLogoSrc}
                  alt={`${companyName} ${t("로고", "logo")}`}
                  className="h-20 w-20 rounded-xl border border-border object-cover"
                />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-xl border border-border bg-muted font-display text-2xl font-bold text-muted-foreground">
                  {companyInitial}
                </div>
              )}
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold md:text-3xl">{companyName}</h1>

            <div className="mt-6 grid gap-3 text-sm md:grid-cols-2">
              <InfoRow label={t("산업군", "Industry")} value={industryLabel} />
              <InfoRow label={t("회사 규모", "Company size")} value={companySize} />
              <InfoRow label={t("사무실 주소", "Office address")} value={officeAddress} />
              <InfoRow label={t("전체 포지션 수", "Total positions")} value={`${totalPositions}${isKo ? "개" : ""}`} />
              <InfoRow label={t("진행 중 포지션", "Active positions")} value={`${activePositions}${isKo ? "개" : ""}`} />
              <InfoRow label={t("최근 포지션 등록일", "Latest posting date")} value={latestPositionDate} />
              <InfoRow
                label={t("근무 지역", "Work location")}
                value={uniqueWorkLocations.length > 0 ? uniqueWorkLocations.join(", ") : t("정보 없음", "No information")}
              />
              <InfoRow
                label={t("근무 형태", "Work type")}
                value={uniqueWorkTypes.length > 0 ? uniqueWorkTypes.join(", ") : t("정보 없음", "No information")}
              />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold">{t("이 회사의 진행중인 포지션", "Open positions at this company")}</h2>
            <CompanyPositionsSection items={companyPositions} />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}
