import type { MetadataRoute } from "next";
import { VISA_DETAILS } from "../lib/visa-details";

// Generate sitemap at request time, cached for 1h. Build-time generation
// timed out (60s ceiling) once the position pagination grew past ~5k rows;
// pushing this to ISR lets the first post-deploy request pay the cost and
// every subsequent visitor (incl. search crawlers) sees the cached XML.
export const revalidate = 3600;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.NEXT_PUBLIC_API_URL?.includes("staging") ? "https://staging.aply.global" : "https://aply.global");
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000";

const STATIC_PATHS: Array<{ path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }> = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/positions", priority: 0.9, changeFrequency: "daily" },
  { path: "/matching-probability", priority: 0.7, changeFrequency: "weekly" },
  { path: "/community", priority: 0.7, changeFrequency: "daily" },
  { path: "/resources", priority: 0.7, changeFrequency: "weekly" },
  { path: "/resources/visa", priority: 0.6, changeFrequency: "monthly" },
  { path: "/resources/resume", priority: 0.6, changeFrequency: "monthly" },
  { path: "/resources/documents", priority: 0.6, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.5, changeFrequency: "monthly" },
  { path: "/legal/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/privacy", priority: 0.3, changeFrequency: "yearly" }
];

type PublicPositionItem = {
  id: string;
  updatedAt?: string | null;
  sourceDeadlineDate?: string | null;
};

async function fetchAllPublicPositionIds(): Promise<PublicPositionItem[]> {
  // Stream every public position through cursor pagination so the sitemap
  // stays in sync with what's actually listed. Bail after a generous cap to
  // keep the response under Google's 50k-URL sitemap limit.
  const out: PublicPositionItem[] = [];
  const pageSize = 100;
  const maxPages = 200;
  let cursor: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const params = new URLSearchParams({ limit: String(pageSize) });
    if (cursor) params.set("cursor", cursor);
    let response: Response;
    try {
      response = await fetch(`${apiBaseUrl}/positions?${params.toString()}`, {
        next: { revalidate: 3600 }
      });
    } catch {
      break;
    }
    if (!response.ok) break;
    const payload = (await response.json()) as {
      ok?: boolean;
      items?: PublicPositionItem[];
      nextCursor?: string | null;
    };
    if (!payload?.ok || !Array.isArray(payload.items)) break;
    out.push(...payload.items);
    if (!payload.nextCursor) break;
    cursor = payload.nextCursor;
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((entry) => ({
    url: `${siteUrl}${entry.path}`,
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority
  }));

  const visaEntries: MetadataRoute.Sitemap = Object.keys(VISA_DETAILS).map((code) => ({
    url: `${siteUrl}/resources/visa/${encodeURIComponent(code)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6
  }));

  let positionEntries: MetadataRoute.Sitemap = [];
  try {
    const positions = await fetchAllPublicPositionIds();
    positionEntries = positions.map((position) => ({
      url: `${siteUrl}/positions/${position.id}`,
      lastModified: position.updatedAt ? new Date(position.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.8
    }));
  } catch {
    // never let a sitemap fetch failure break the rest of the index
  }

  return [...staticEntries, ...visaEntries, ...positionEntries];
}
