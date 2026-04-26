import "dotenv/config";
import { createHash } from "node:crypto";
import {
  PartnerCompanySize,
  PartnerIndustry,
  PartnerOrgUserRole,
  PartnerType,
  MemberRole,
  PrismaClient
} from "@prisma/client";

type RawCompanyListItem = Record<string, unknown>;
type RawCompanyDetail = Record<string, unknown>;

const prisma = new PrismaClient();

const API_BASE = process.env.ADMIN_COMPANIES_API_URL ?? "https://admin.flip-ers.com/api/companies";
const TOKEN = process.env.ADMIN_COMPANIES_TOKEN ?? "";
const PAGE_SIZE = Number(process.env.ADMIN_COMPANIES_PAGE_SIZE ?? 50);
const MAX_PAGES = Number(process.env.ADMIN_COMPANIES_MAX_PAGES ?? 0);
const HASH_MARKER = "[[sourceSyncHash:";

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asDate(value: unknown): Date | null {
  const text = asString(value);
  if (!text) return null;
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item)).filter((item): item is string => Boolean(item));
}

function parseListPayload(payload: unknown): { items: RawCompanyListItem[]; total?: number } {
  if (!payload || typeof payload !== "object") return { items: [] };
  const p = payload as Record<string, unknown>;
  const items = Array.isArray(p.data) ? (p.data as RawCompanyListItem[]) : [];
  const total = typeof p.total === "number" ? p.total : undefined;
  return { items, total };
}

async function fetchListPage(page: number) {
  const url = new URL(API_BASE);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(PAGE_SIZE));

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`company list fetch failed (page=${page}, status=${response.status}): ${text.slice(0, 300)}`);
  }
  return parseListPayload((await response.json()) as unknown);
}

async function fetchDetail(companyId: number) {
  const response = await fetch(`${API_BASE}/${companyId}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`company detail fetch failed (id=${companyId}, status=${response.status}): ${text.slice(0, 300)}`);
  }
  return (await response.json()) as RawCompanyDetail;
}

function mapCompanySize(raw: string | null): PartnerCompanySize | null {
  const normalized = (raw ?? "").toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("1-10")) return PartnerCompanySize.SIZE_1_10;
  if (normalized.includes("30")) return PartnerCompanySize.SIZE_UNDER_30;
  if (normalized.includes("50")) return PartnerCompanySize.SIZE_UNDER_50;
  if (normalized.includes("100") || normalized.includes("over")) return PartnerCompanySize.SIZE_OVER_100;
  return null;
}

function mapIndustry(raw: string | null): PartnerIndustry {
  const key = (raw ?? "").toLowerCase();
  const exactMap: Record<string, PartnerIndustry> = {
    education: PartnerIndustry.EDUCATION,
    agriculture: PartnerIndustry.AGRICULTURE,
    pets: PartnerIndustry.PETS,
    fitness: PartnerIndustry.FITNESS,
    wellness: PartnerIndustry.WELLNESS,
    beauty: PartnerIndustry.BEAUTY,
    travel: PartnerIndustry.TRAVEL,
    golf: PartnerIndustry.GOLF,
    it: PartnerIndustry.IT,
    ai: PartnerIndustry.AI,
    startup: PartnerIndustry.STARTUP,
    platform: PartnerIndustry.PLATFORM,
    commerce: PartnerIndustry.COMMERCE,
    agency: PartnerIndustry.AGENCY,
    community: PartnerIndustry.COMMUNITY,
    global: PartnerIndustry.GLOBAL,
    b2b: PartnerIndustry.B2B,
    saas: PartnerIndustry.SAAS,
    consulting: PartnerIndustry.CONSULTING,
    advertising: PartnerIndustry.ADVERTISING,
    marketing: PartnerIndustry.MARKETING,
    content: PartnerIndustry.CONTENT,
    construction: PartnerIndustry.CONSTRUCTION,
    hr: PartnerIndustry.HR
  };
  if (key in exactMap) return exactMap[key];
  if (key.includes("manufact")) return PartnerIndustry.DEVICE;
  if (key.includes("cosmetic") || key.includes("k-beauty")) return PartnerIndustry.BEAUTY;
  if (key.includes("software") || key.includes("develop")) return PartnerIndustry.DEVELOPMENT;
  if (key.includes("robot")) return PartnerIndustry.IOT;
  if (key.includes("finance") || key.includes("bank")) return PartnerIndustry.CONSULTING;
  return PartnerIndustry.STARTUP;
}

function mapPartnerRole(raw: string | null): PartnerOrgUserRole {
  const normalized = (raw ?? "").toUpperCase();
  if (normalized === "OWNER") return PartnerOrgUserRole.OWNER;
  if (normalized === "ADMIN" || normalized === "MANAGER") return PartnerOrgUserRole.ADMIN;
  return PartnerOrgUserRole.MEMBER;
}

function makeHash(payload: unknown): string {
  return createHash("sha1").update(JSON.stringify(payload)).digest("hex");
}

function extractHashFromMemo(memo: string | null): string | null {
  if (!memo) return null;
  const markerStart = memo.indexOf(HASH_MARKER);
  if (markerStart < 0) return null;
  const markerEnd = memo.indexOf("]]", markerStart);
  if (markerEnd < 0) return null;
  return memo.slice(markerStart + HASH_MARKER.length, markerEnd).trim() || null;
}

async function run() {
  if (!TOKEN) throw new Error("ADMIN_COMPANIES_TOKEN is required");

  let page = 1;
  let total: number | undefined;
  const listItems: RawCompanyListItem[] = [];

  while (true) {
    if (MAX_PAGES > 0 && page > MAX_PAGES) break;
    const { items, total: responseTotal } = await fetchListPage(page);
    if (typeof responseTotal === "number") total = responseTotal;
    if (items.length === 0) break;
    listItems.push(...items);
    if (items.length < PAGE_SIZE) break;
    if (total !== undefined && listItems.length >= total) break;
    page += 1;
  }

  let imported = 0;
  let updated = 0;
  let skippedUnchanged = 0;
  let linkedUsers = 0;

  for (const item of listItems) {
    const companyId = Number(item.id);
    if (!Number.isFinite(companyId)) continue;

    const detail = await fetchDetail(companyId);
    const domain = asString(detail.domain)?.toLowerCase();
    if (!domain) continue;

    const companyName = asString(detail.companyName) ?? domain;
    const reviewedAt = asDate(detail.reviewedAt);
    const companySize = mapCompanySize(asString(detail.companySize));
    const industries = asStringArray(detail.industries);
    const mappedIndustry = mapIndustry(industries[0] ?? null);

    const website = asString(detail.website)?.replace(/\s*\n+\s*/g, ", ") ?? null;
    const socialMedia = asString(detail.socialMedia);
    const officeAddress = asString(detail.officeAddress);
    const introduction = asString(detail.introduction);
    const strengths = asString(detail.strengths);
    const operationStatus = asString(detail.operationStatus);
    const members = Array.isArray(detail.members) ? (detail.members as Array<Record<string, unknown>>) : [];
    const memberSignatures = members
      .map((member) => {
        const user = (member.user ?? null) as Record<string, unknown> | null;
        const memberEmail = asString(user?.email)?.toLowerCase();
        const memberRole = mapPartnerRole(asString(member.role));
        if (!memberEmail) return null;
        return `${memberEmail}:${memberRole}`;
      })
      .filter((value): value is string => Boolean(value))
      .sort();
    const remoteUpdatedAt = asString(detail.updatedAt) ?? asString(detail.modifiedAt) ?? null;
    const syncHash = makeHash({
      companyName,
      reviewedAt: reviewedAt?.toISOString() ?? null,
      companySize,
      mappedIndustry,
      domain,
      website,
      socialMedia,
      officeAddress,
      introduction,
      strengths,
      operationStatus,
      industries,
      remoteUpdatedAt,
      memberSignatures
    });
    const sourceMemo = industries.length > 0 ? `sourceIndustries: ${industries.join(", ")}` : null;
    const statusMemo = operationStatus ? `sourceOperationStatus: ${operationStatus}` : null;
    const remoteUpdatedAtMemo = remoteUpdatedAt ? `sourceUpdatedAt: ${remoteUpdatedAt}` : null;
    const hashMemo = `${HASH_MARKER}${syncHash}]]`;
    const adminMemo = [sourceMemo, statusMemo, remoteUpdatedAtMemo, hashMemo].filter(Boolean).join(" | ") || null;

    const existing = await prisma.partnerOrganization.findUnique({
      where: { domain },
      select: { id: true, adminMemo: true }
    });

    const existingHash = extractHashFromMemo(existing?.adminMemo ?? null);
    if (existing && existingHash === syncHash) {
      skippedUnchanged += 1;
    } else {
      await prisma.partnerOrganization.upsert({
        where: { domain },
        create: {
          partnerType: PartnerType.COMPANY,
          domain,
          name: companyName,
          companySize,
          officeAddress,
          website,
          socialMedia,
          industry: mappedIndustry,
          description: introduction,
          strengths,
          adminMemo
        },
        update: {
          partnerType: PartnerType.COMPANY,
          name: companyName,
          companySize,
          officeAddress,
          website,
          socialMedia,
          industry: mappedIndustry,
          description: introduction,
          strengths,
          adminMemo
        }
      });

      if (existing) updated += 1;
      else imported += 1;
    }

    for (const member of members) {
      const memberRole = mapPartnerRole(asString(member.role));
      const user = (member.user ?? null) as Record<string, unknown> | null;
      const memberEmail = asString(user?.email)?.toLowerCase();
      if (!memberEmail) continue;

      const updatedUser = await prisma.user.updateMany({
        where: {
          email: memberEmail,
          role: MemberRole.PARTNER
        },
        data: {
          affiliation: companyName,
          partnerType: PartnerType.COMPANY,
          partnerOrgRole: memberRole
        }
      });
      linkedUsers += updatedUser.count;
    }
  }

  // Fallback linking by email-domain for partner users not covered by members
  const companies = await prisma.partnerOrganization.findMany({
    where: { partnerType: PartnerType.COMPANY },
    select: { domain: true, name: true }
  });
  for (const company of companies) {
    await prisma.user.updateMany({
      where: {
        role: MemberRole.PARTNER,
        email: { endsWith: `@${company.domain}` },
        OR: [{ affiliation: null }, { affiliation: "" }]
      },
      data: {
        affiliation: company.name,
        partnerType: PartnerType.COMPANY
      }
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        apiBase: API_BASE,
        totalFromApi: total ?? null,
        fetchedCompanies: listItems.length,
        importedCompanies: imported,
        updatedCompanies: updated,
        skippedUnchangedCompanies: skippedUnchanged,
        linkedUsers
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
