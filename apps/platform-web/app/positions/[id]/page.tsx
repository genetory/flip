import type { Metadata } from "next";
import { PositionDetailPage } from "../../../components/pages/PositionDetailPage";
import type { PublicPositionListItem } from "../../../lib/member-profile-client";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.NEXT_PUBLIC_API_URL?.includes("staging") ? "https://staging.aply.global" : "https://aply.global");
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000";

async function fetchPublicPosition(id: string): Promise<PublicPositionListItem | null> {
  if (!id) return null;
  try {
    const response = await fetch(`${apiBaseUrl}/positions/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 }
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { ok?: boolean; item?: PublicPositionListItem };
    if (!payload?.ok || !payload.item) return null;
    return payload.item;
  } catch {
    return null;
  }
}

function shortenText(input: string | null | undefined, max = 160): string {
  if (!input) return "";
  const cleaned = input.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

function jobPostingEmploymentType(type: PublicPositionListItem["employmentType"]): string {
  switch (type) {
    case "FULL_TIME":
      return "FULL_TIME";
    case "PART_TIME":
      return "PART_TIME";
    case "INTERN":
    case "UNPAID_INTERN":
      return "INTERN";
    default:
      return "FULL_TIME";
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const position = await fetchPublicPosition(id);
  if (!position) {
    // Position is missing from the public listing (deleted, paused, closed,
    // or pending review). The page still renders a client-side authed
    // fetch so the owning partner can see it, but we must tell crawlers to
    // skip indexing so they don't treat the empty shell as a soft 404 and
    // demote the rest of the position URLs.
    return {
      title: "포지션을 찾을 수 없음 | Aply",
      robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
      alternates: { canonical: `${siteUrl}/positions` }
    };
  }
  const companyName = position.partnerOrganization?.name ?? position.sourceCompanyName ?? "Aply";
  const titleBase = `${position.title} @ ${companyName}`;
  const description =
    shortenText(position.mainResponsibilities) ||
    shortenText(position.preferredQualifications) ||
    `${position.title} at ${companyName} — apply via Aply, the career platform connecting global talent with Korean partners.`;
  const ogImage = position.thumbnailImages?.[0];
  const canonical = `${siteUrl}/positions/${position.id}`;
  return {
    title: `${titleBase} | Aply`,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: titleBase,
      description,
      url: canonical,
      siteName: "Aply",
      images: ogImage ? [{ url: ogImage }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: titleBase,
      description,
      images: ogImage ? [ogImage] : undefined
    }
  };
}

function buildJobPostingJsonLd(position: PublicPositionListItem) {
  const companyName = position.partnerOrganization?.name ?? position.sourceCompanyName ?? "Aply Partner";
  const description =
    [position.mainResponsibilities, position.requiredQualifications, position.preferredQualifications]
      .filter((entry): entry is string => !!entry && entry.trim().length > 0)
      .join("\n\n") || position.title;
  const jobLocation = position.workLocation
    ? {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: position.workLocation,
          addressCountry: "KR"
        }
      }
    : undefined;
  return {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: position.title,
    description,
    identifier: {
      "@type": "PropertyValue",
      name: companyName,
      value: position.id
    },
    datePosted: position.createdAt,
    validThrough: position.sourceDeadlineDate ?? undefined,
    employmentType: jobPostingEmploymentType(position.employmentType),
    hiringOrganization: {
      "@type": "Organization",
      name: companyName,
      sameAs: position.sourceUrl ?? `${siteUrl}/positions/${position.id}`
    },
    jobLocation,
    directApply: position.sourceKind === "INTERNAL"
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // SSR fetch only sees OPEN/public positions. We do NOT 404 here — the
  // PositionDetailPage falls back to an authenticated client fetch so the
  // posting partner (and operators) can view their own pending-review
  // positions before approval.
  const position = await fetchPublicPosition(id);
  return (
    <>
      {position ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJobPostingJsonLd(position)) }}
        />
      ) : null}
      <PositionDetailPage position={position} positionId={id} />
    </>
  );
}
