import "dotenv/config";
import * as cheerio from "cheerio";
import { PositionSourceProvider, PositionStatus, PrismaClient } from "@prisma/client";
import { type NormalizedExternalPosition, upsertExternalPositions } from "./crawlers/core";

const prisma = new PrismaClient();

const BASE_URL = "https://kowork.kr";
const LIST_URL = process.env.KOWORK_LIST_URL ?? `${BASE_URL}/post/list`;
const GRAPHQL_URL = process.env.KOWORK_GRAPHQL_URL ?? "https://api.kowork.kr:8080/graphql";
const PAGE_SIZE_RAW = Number(process.env.KOWORK_PAGE_SIZE ?? "100");
const MAX_PAGES_RAW = Number(process.env.KOWORK_MAX_PAGES ?? "500");
const PAGE_SIZE = Number.isFinite(PAGE_SIZE_RAW) ? Math.min(Math.max(Math.trunc(PAGE_SIZE_RAW), 1), 100) : 100;
const MAX_PAGES = Number.isFinite(MAX_PAGES_RAW) ? Math.min(Math.max(Math.trunc(MAX_PAGES_RAW), 1), 2000) : 500;

type KoworkPosting = {
  id: string | number;
  title: string;
  deadline?: number | null;
  publishedAt?: number | null;
  employmentType?: string | null;
  jobCategory?: string | null;
  isE7VisaSupported?: boolean;
  workPlace?: { address?: string | null } | null;
  corporation?: { name?: string | null; logo?: { publicUrl?: string | null } | null } | null;
  logo?: { publicUrl?: string | null } | null;
};

async function areAllExistingExternalIds(externalIds: string[]): Promise<boolean> {
  const ids = Array.from(new Set(externalIds.map((id) => id.trim()).filter((id) => id.length > 0)));
  if (ids.length === 0) return false;
  const matched = await prisma.position.count({
    where: {
      sourceProvider: PositionSourceProvider.KOWORK,
      sourceExternalId: { in: ids }
    }
  });
  return matched === ids.length;
}

function compact(values: Array<string | null | undefined>): string[] {
  return values.map((v) => (typeof v === "string" ? v.trim() : "")).filter((v) => v.length > 0);
}

function asUrl(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `${BASE_URL}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

function formatJobCategory(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  return raw
    .toLowerCase()
    .split("_")
    .filter((part) => part.length > 0)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
}

function toYmdInKst(epochMs: number | null): string | null {
  if (!Number.isFinite(epochMs)) return null;
  const dt = new Date(Number(epochMs));
  if (Number.isNaN(dt.getTime())) return null;
  const kst = new Date(dt.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function mapPostingFromGraphql(post: KoworkPosting): NormalizedExternalPosition | null {
  const idRaw = String(post.id ?? "").trim();
  const title = String(post.title ?? "").trim();
  if (!idRaw || !title) return null;

  const publishedAtMs = typeof post.publishedAt === "number" ? post.publishedAt : null;
  const deadlineMs = typeof post.deadline === "number" ? post.deadline : null;
  const deadlineYmd = toYmdInKst(deadlineMs);
  const postedAt = publishedAtMs ? new Date(publishedAtMs) : null;
  const status = deadlineMs && deadlineMs < Date.now() ? PositionStatus.CLOSED : PositionStatus.OPEN;

  const employmentTypeRaw = (post.employmentType ?? "").trim() || null;
  const jobCategoryRaw = (post.jobCategory ?? "").trim() || null;
  const companyName = (post.corporation?.name ?? "").trim() || null;
  const workLocation = (post.workPlace?.address ?? "").trim() || null;
  const thumbnailRaw = post.logo?.publicUrl ?? post.corporation?.logo?.publicUrl ?? null;
  const eligibleVisas = post.isE7VisaSupported ? ["E-7 가능"] : [];

  return {
    externalId: idRaw,
    sourceProvider: PositionSourceProvider.KOWORK,
    sourceUrl: `${BASE_URL}/post/${idRaw}`,
    title,
    status,
    postedAt,
    workLocation,
    preferredJobRole: formatJobCategory(jobCategoryRaw),
    thumbnailImages: compact([asUrl(thumbnailRaw)]),
    eligibleVisas,
    additionalNotes: compact([
      "sourcePlatform: KOWORK",
      companyName ? `sourceCompanyName: ${companyName}` : null,
      deadlineYmd ? `sourceDeadlineDate: ${deadlineYmd}` : null,
      employmentTypeRaw ? `sourceEmploymentType: ${employmentTypeRaw}` : null,
      jobCategoryRaw ? `sourceJobCategory: ${jobCategoryRaw}` : null,
      `sourceListUrl: ${LIST_URL}`,
      `sourceGraphqlUrl: ${GRAPHQL_URL}`
    ]).join("\n")
  };
}

function applyKoworkDisplayOrder(rows: NormalizedExternalPosition[]): NormalizedExternalPosition[] {
  const usedOffsetByPostedAt = new Map<number, number>();
  return rows.map((row) => {
    if (!row.postedAt || Number.isNaN(row.postedAt.getTime())) return row;
    const t = row.postedAt.getTime();
    const offset = usedOffsetByPostedAt.get(t) ?? 0;
    usedOffsetByPostedAt.set(t, offset + 1);
    return {
      ...row,
      // Keep source datetime semantics while preserving in-list ordering for same timestamp.
      postedAt: new Date(t - offset)
    };
  });
}

async function fetchGraphqlRows(): Promise<NormalizedExternalPosition[]> {
  const query = `query findPostings($filters: FindPostingsInput!) {
    findPostings(filters: $filters) {
      items {
        id
        title
        deadline
        publishedAt
        employmentType
        jobCategory
        isE7VisaSupported
        workPlace { address }
        corporation {
          name
          logo { publicUrl }
        }
        logo { publicUrl }
      }
      endCursor
      hasNextPage
    }
  }`;

  const rows: NormalizedExternalPosition[] = [];
  let page = 0;
  let endCursor: number | null = null;
  let hasNextPage = true;

  while (hasNextPage && page < MAX_PAGES) {
    const filters: Record<string, unknown> = { limit: PAGE_SIZE };
    if (typeof endCursor === "number" && Number.isFinite(endCursor)) {
      filters.endCursor = endCursor;
    }

    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0 (compatible; CareerBridgeBot/1.0)"
      },
      body: JSON.stringify({
        query,
        variables: { filters }
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`failed to fetch kowork graphql (${response.status}): ${text.slice(0, 300)}`);
    }

    const payload = (await response.json()) as {
      errors?: Array<{ message?: string }>;
      data?: {
        findPostings?: {
          items?: KoworkPosting[];
          endCursor?: string | number | null;
          hasNextPage?: boolean;
        };
      };
    };

    if (payload.errors?.length) {
      throw new Error(`kowork graphql error: ${payload.errors.map((e) => e.message ?? "unknown").join(" | ")}`);
    }

    const block = payload.data?.findPostings;
    const items = Array.isArray(block?.items) ? block.items : [];
    const pageExternalIds = items.map((item) => String(item.id ?? "").trim()).filter((id) => id.length > 0);
    const allOverlap = await areAllExistingExternalIds(pageExternalIds);
    for (const item of items) {
      const mapped = mapPostingFromGraphql(item);
      if (mapped) rows.push(mapped);
    }

    const nextCursorRaw = block?.endCursor;
    const nextCursor = typeof nextCursorRaw === "number" ? nextCursorRaw : Number(nextCursorRaw ?? NaN);
    endCursor = Number.isFinite(nextCursor) ? nextCursor : null;
    hasNextPage = Boolean(block?.hasNextPage && endCursor !== null);
    page += 1;

    if (allOverlap) {
      break;
    }

    if (items.length === 0) break;
  }

  return applyKoworkDisplayOrder(rows);
}

function isVisaTag(value: string): boolean {
  return /비자|visa|^e-\d|^d-\d|^f-\d|^h-\d/i.test(value.trim());
}

function isEmploymentTag(value: string): boolean {
  return /(정규직|계약직|인턴|아르바이트|파트타임|프리랜서|임시직|full[- ]?time|part[- ]?time|intern|freelance|temporary)/i.test(value.trim());
}

function isLocationTag(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (/^(서울|경기|부산|인천|대전|대구|광주|울산|세종|제주|강원|충북|충남|전북|전남|경북|경남)(\s|$)/.test(v)) return true;
  if (/^[가-힣]+\s[가-힣]+(시|군|구)(\s|$)/.test(v)) return true;
  return false;
}

function extractRowsFromHtml(html: string): NormalizedExternalPosition[] {
  const $ = cheerio.load(html);
  const rows: NormalizedExternalPosition[] = [];

  const desktopCards = $('a[id^="post-list-post-card-desktop-"]');
  const mobileCards = $('a[id^="post-list-post-card-mobile-"]');
  const cards = desktopCards.length > 0 ? desktopCards : mobileCards;

  cards.each((_idx, el) => {
    const root = $(el);
    const href = root.attr("href")?.trim() ?? "";
    const idFromAttr = (root.attr("id")?.match(/-(\d+)$/)?.[1] ?? "").trim();
    const idFromHref = (href.match(/\/post\/(\d+)/)?.[1] ?? "").trim();
    const idRaw = idFromAttr || idFromHref;

    const title =
      root.find("p.line-clamp-2.text-ellipsis").first().text().trim() ||
      root.find("p").first().text().trim();

    if (!idRaw || !title) return;

    const sourceUrl = asUrl(href) ?? `${BASE_URL}/post/${idRaw}`;
    const companyLine = root.find("div.web-h-md-n-16, div.web-c-rg-12").first().text().replace(/\s+/g, " ").trim();
    const companyName = companyLine.split("D-")[0]?.trim() ?? null;

    const tags = compact(
      root
        .find("p.py-\\[6px\\]")
        .map((_i, node) => $(node).text())
        .get()
    );

    const workLocation = tags.find((tag) => isLocationTag(tag)) ?? null;
    const employmentTypeRaw = tags.find((tag) => isEmploymentTag(tag)) ?? null;
    const visaTags = tags.filter((tag) => isVisaTag(tag));
    const jobCategoryRawCandidate =
      tags.find((tag) => !isLocationTag(tag) && !isEmploymentTag(tag) && !isVisaTag(tag)) ?? null;
    const jobCategoryRaw =
      jobCategoryRawCandidate && !isEmploymentTag(jobCategoryRawCandidate) ? jobCategoryRawCandidate : null;
    const thumbnailRaw = root.find("img").first().attr("src")?.trim() ?? null;
    const daysRaw = root.find("p").filter((_i, node) => $(node).text().includes("D-")).first().text().trim();
    const dayMatch = daysRaw.match(/D-\s*(\d+)/i);
    const daysLeft = dayMatch ? Number(dayMatch[1]) : null;
    const status = Number.isFinite(daysLeft) && (daysLeft ?? 0) < 0 ? PositionStatus.CLOSED : PositionStatus.OPEN;
    const postedAt = Number.isFinite(daysLeft)
      ? new Date(Date.now() - ((daysLeft ?? 0) * 24 * 60 * 60 * 1000))
      : null;

    rows.push({
      externalId: idRaw,
      sourceProvider: PositionSourceProvider.KOWORK,
      sourceUrl,
      title,
      status,
      postedAt,
      workLocation,
      preferredJobRole: formatJobCategory(jobCategoryRaw),
      thumbnailImages: compact([asUrl(thumbnailRaw)]),
      eligibleVisas: visaTags.length > 0 ? visaTags : [],
      additionalNotes: compact([
        "sourcePlatform: KOWORK",
        companyName ? `sourceCompanyName: ${companyName}` : null,
        employmentTypeRaw ? `sourceEmploymentType: ${employmentTypeRaw}` : null,
        jobCategoryRaw ? `sourceJobCategory: ${jobCategoryRaw}` : null,
        `sourceListUrl: ${LIST_URL}`
      ]).join("\n")
    });
  });

  return rows;
}

function mapPostToRow(row: NormalizedExternalPosition): NormalizedExternalPosition | null {
  const idRaw = String(row.externalId ?? "").trim();
  const title = row.title.trim();
  if (!idRaw || !title) return null;

  return {
    externalId: idRaw,
    sourceProvider: row.sourceProvider,
    sourceUrl: row.sourceUrl,
    title,
    status: row.status,
    postedAt: row.postedAt,
    workLocation: row.workLocation,
    preferredJobRole: row.preferredJobRole,
    thumbnailImages: row.thumbnailImages,
    eligibleVisas: row.eligibleVisas,
    additionalNotes: row.additionalNotes
  };
}

async function run() {
  let parsedRows: NormalizedExternalPosition[] = [];
  let mode: "graphql" | "html-fallback" = "graphql";

  try {
    parsedRows = await fetchGraphqlRows();
    if (parsedRows.length === 0) {
      throw new Error("empty result from graphql");
    }
  } catch (graphqlError) {
    mode = "html-fallback";
    const response = await fetch(LIST_URL, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; CareerBridgeBot/1.0)"
      }
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `failed to fetch kowork list (${response.status}) after graphql fallback: ${text.slice(0, 300)}`
      );
    }
    const html = await response.text();
    parsedRows = extractRowsFromHtml(html);
    console.warn("KOWORK graphql failed, used HTML fallback:", graphqlError);
  }

  const rows = parsedRows
    .map((row) => mapPostToRow(row))
    .filter((row): row is NormalizedExternalPosition => Boolean(row));
  const deduped = Array.from(new Map(rows.map((row) => [row.externalId, row])).values());
  const result = await upsertExternalPositions(prisma, "import-kowork-job-postings", deduped);

  console.log(
    JSON.stringify(
      {
        ok: true,
        fetchMode: mode,
        pageSize: PAGE_SIZE,
        maxPages: MAX_PAGES,
        sourceProvider: PositionSourceProvider.KOWORK,
        sourcePlatform: "KOWORK",
        listUrl: LIST_URL,
        graphqlUrl: GRAPHQL_URL,
        ...result
      },
      null,
      2
    )
  );
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
