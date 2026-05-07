import "dotenv/config";
import { createHash } from "node:crypto";
import { PartnerType, PositionSourceKind, PositionSourceProvider, PositionStatus, PrismaClient } from "@prisma/client";

type RawPosting = Record<string, unknown>;

type PageResult = {
  postings: RawPosting[];
  totalPages?: number;
};

const prisma = new PrismaClient();

const API_BASE =
  process.env.JOB_POSTINGS_API_URL ??
  "https://admin-staging.flip-ers.com/api/job-postings";
const TOKEN = process.env.JOB_POSTINGS_TOKEN ?? process.env.COMPANY_USERS_TOKEN ?? "";
const PAGE_SIZE = Number(process.env.JOB_POSTINGS_PAGE_SIZE ?? 20);
const MAX_PAGES = Number(process.env.JOB_POSTINGS_MAX_PAGES ?? 0);
const FETCH_DETAIL = (process.env.JOB_POSTINGS_FETCH_DETAIL ?? "1") !== "0";
const HASH_MARKER = "[[sourceSyncHash:";
const DEFAULT_STATUS = (() => {
  const raw = (process.env.JOB_POSTINGS_DEFAULT_STATUS ?? "OPEN").toUpperCase();
  if (raw === PositionStatus.DRAFT) return PositionStatus.DRAFT;
  if (raw === PositionStatus.CLOSED) return PositionStatus.CLOSED;
  if (raw === PositionStatus.PENDING_REVIEW) return PositionStatus.PENDING_REVIEW;
  if (raw === PositionStatus.PAUSED) return PositionStatus.PAUSED;
  if (raw === PositionStatus.REJECTED) return PositionStatus.REJECTED;
  return PositionStatus.OPEN;
})();

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed)) return Math.trunc(parsed);
  }
  return null;
}

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => asString(entry)).filter((entry): entry is string => Boolean(entry));
  }
  const raw = asString(value);
  if (!raw) return [];
  return raw
    .split(/[,\n/|]+/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function pickPostingId(raw: RawPosting): string | null {
  const numericId =
    (typeof raw.id === "number" && Number.isFinite(raw.id) ? String(Math.trunc(raw.id)) : null) ??
    (typeof raw.jobPostingId === "number" && Number.isFinite(raw.jobPostingId) ? String(Math.trunc(raw.jobPostingId)) : null);
  return (
    numericId ??
    asString(raw.id) ??
    asString(raw.jobPostingId) ??
    asString(raw.postingId) ??
    asString(raw.recruitmentId) ??
    null
  );
}

function pickTitle(raw: RawPosting): string | null {
  return (
    asString(raw.title) ??
    asString(raw.jobTitle) ??
    asString(raw.positionTitle) ??
    asString(raw.postingTitle) ??
    asString(raw.name) ??
    null
  );
}

function pickCompanyObject(raw: RawPosting): Record<string, unknown> | null {
  return (
    asRecord(raw.company) ??
    asRecord(raw.partner) ??
    asRecord(raw.organization) ??
    asRecord(raw.employer) ??
    null
  );
}

function pickCompanyName(raw: RawPosting): string | null {
  const company = pickCompanyObject(raw);
  return (
    asString(raw.companyName) ??
    asString(raw.organizationCompanyName) ??
    asString(raw.partnerName) ??
    asString(raw.organizationName) ??
    asString(raw.employerName) ??
    asString(company?.companyName) ??
    asString(company?.name) ??
    null
  );
}

function pickDomain(raw: RawPosting): string | null {
  const company = pickCompanyObject(raw);
  const websiteRaw =
    asString(raw.companyWebsite) ??
    asString(raw.website) ??
    asString(company?.website) ??
    asString(raw.url) ??
    null;
  const explicitDomain =
    asString(raw.companyDomain) ??
    asString(raw.domain) ??
    asString(company?.domain) ??
    null;

  if (explicitDomain) {
    return explicitDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  }

  if (websiteRaw) {
    try {
      const url = websiteRaw.startsWith("http") ? new URL(websiteRaw) : new URL(`https://${websiteRaw}`);
      return url.hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      const normalized = websiteRaw.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
      return normalized.split("/")[0] ?? null;
    }
  }
  return null;
}

function pickStatus(raw: RawPosting): PositionStatus {
  const statusRaw =
    asString(raw.status) ??
    asString(raw.postingStatus) ??
    asString(raw.recruitmentStatus) ??
    "";
  const normalized = statusRaw.toUpperCase().replace(/\s+/g, "_");
  if (normalized.includes("CLOSE") || normalized.includes("END") || normalized.includes("마감")) {
    return PositionStatus.CLOSED;
  }
  if (normalized.includes("APPROVED") || normalized.includes("ACTIVE") || normalized.includes("OPEN")) {
    return PositionStatus.OPEN;
  }
  if (normalized.includes("PENDING") || normalized.includes("REVIEW") || normalized.includes("승인_대기") || normalized.includes("승인대기")) {
    return PositionStatus.PENDING_REVIEW;
  }
  if (normalized.includes("PAUSE") || normalized.includes("HOLD") || normalized.includes("중지")) {
    return PositionStatus.PAUSED;
  }
  if (normalized.includes("REJECT") || normalized.includes("반려")) {
    return PositionStatus.REJECTED;
  }
  if (normalized.includes("DRAFT") || normalized.includes("TEMP") || normalized.includes("임시")) {
    return PositionStatus.DRAFT;
  }
  if (normalized.length > 0) {
    return PositionStatus.OPEN;
  }
  return DEFAULT_STATUS;
}

function pickBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1 ? true : value === 0 ? false : null;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["y", "yes", "true", "1", "필요", "있음"].includes(normalized)) return true;
    if (["n", "no", "false", "0", "불필요", "없음"].includes(normalized)) return false;
  }
  return null;
}

function pickLineText(raw: RawPosting, keys: string[]): string | null {
  for (const key of keys) {
    const value = raw[key];
    if (Array.isArray(value)) {
      const lines = value.map((it) => asString(it)).filter((it): it is string => Boolean(it));
      if (lines.length > 0) return lines.join("\n");
      continue;
    }
    const text = asString(value);
    if (text) return text;
  }
  return null;
}

function parsePagePayload(payload: unknown): PageResult {
  if (Array.isArray(payload)) {
    return { postings: payload as RawPosting[] };
  }
  if (!payload || typeof payload !== "object") {
    return { postings: [] };
  }

  const p = payload as Record<string, unknown>;
  if (Array.isArray(p.data)) {
    const totalPagesFromTotal =
      typeof p.total === "number" && typeof p.limit === "number" && p.limit > 0
        ? Math.max(1, Math.ceil(p.total / p.limit))
        : undefined;
    return {
      postings: p.data as RawPosting[],
      totalPages: totalPagesFromTotal
    };
  }

  const container =
    asRecord(p.data) ??
    asRecord(p.result) ??
    asRecord(p.payload) ??
    p;

  const postings =
    (Array.isArray(container.items) ? container.items : null) ??
    (Array.isArray(container.jobPostings) ? container.jobPostings : null) ??
    (Array.isArray(container.postings) ? container.postings : null) ??
    (Array.isArray(container.results) ? container.results : null) ??
    [];

  const totalPagesRaw =
    (container.totalPages as number | undefined) ??
    (container.lastPage as number | undefined) ??
    (container.pageCount as number | undefined) ??
    (asRecord(container.pagination)?.totalPages as number | undefined);

  return {
    postings: postings as RawPosting[],
    totalPages: typeof totalPagesRaw === "number" && Number.isFinite(totalPagesRaw) ? totalPagesRaw : undefined
  };
}

function parseDetailPayload(payload: unknown): RawPosting | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const data = asRecord(p.data);
  if (data) return data;
  const result = asRecord(p.result);
  if (result) return result;
  const item = asRecord(p.item);
  if (item) return item;
  return p;
}

async function fetchPage(page: number): Promise<PageResult> {
  const url = new URL(API_BASE);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(PAGE_SIZE));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TOKEN}`
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`fetch failed (page=${page}, status=${response.status}): ${text.slice(0, 500)}`);
  }
  const payload = (await response.json()) as unknown;
  return parsePagePayload(payload);
}

async function fetchPostingDetail(postingId: string): Promise<RawPosting | null> {
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const response = await fetch(`${base}/${encodeURIComponent(postingId)}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`
    }
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`detail fetch failed (id=${postingId}, status=${response.status}): ${text.slice(0, 500)}`);
  }

  const payload = (await response.json()) as unknown;
  return parseDetailPayload(payload);
}

function mergePostingSummaryAndDetail(summary: RawPosting, detail: RawPosting | null): RawPosting {
  if (!detail) return summary;
  return {
    ...summary,
    ...detail,
    company: asRecord(detail.company) ?? asRecord(summary.company) ?? undefined,
    partner: asRecord(detail.partner) ?? asRecord(summary.partner) ?? undefined,
    organization: asRecord(detail.organization) ?? asRecord(summary.organization) ?? undefined,
    employer: asRecord(detail.employer) ?? asRecord(summary.employer) ?? undefined
  };
}

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(주\)|㈜|주식회사|inc\.?|co\.?,?\s?ltd\.?|ltd\.?|corp\.?|corporation|llc/gi, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function sourceMarker(postingId: string) {
  return `[[stagingJobPostingId:${postingId}]]`;
}

function makeHash(payload: unknown): string {
  return createHash("sha1").update(JSON.stringify(payload)).digest("hex");
}

function extractHashFromNotes(notes: string | null): string | null {
  if (!notes) return null;
  const markerStart = notes.indexOf(HASH_MARKER);
  if (markerStart < 0) return null;
  const markerEnd = notes.indexOf("]]", markerStart);
  if (markerEnd < 0) return null;
  return notes.slice(markerStart + HASH_MARKER.length, markerEnd).trim() || null;
}

async function run() {
  if (!TOKEN) {
    throw new Error("JOB_POSTINGS_TOKEN is required (or COMPANY_USERS_TOKEN fallback).");
  }

  const partners = await prisma.partnerOrganization.findMany({
    where: { partnerType: PartnerType.COMPANY },
    select: { id: true, name: true, domain: true }
  });
  const partnerByDomain = new Map(partners.map((p) => [p.domain.toLowerCase(), p]));
  const partnerByName = new Map(partners.map((p) => [normalizeCompanyName(p.name), p]));

  let page = 1;
  let fetched = 0;
  let created = 0;
  let updated = 0;
  let skippedUnchanged = 0;
  let matchedByDomain = 0;
  let matchedByName = 0;
  let unmatchedPartner = 0;
  let skippedNoTitle = 0;
  let detailsFetched = 0;
  let detailsMissing = 0;
  let detailsSkipped = 0;

  while (true) {
    if (MAX_PAGES > 0 && page > MAX_PAGES) break;

    const { postings, totalPages } = await fetchPage(page);
    if (postings.length === 0) break;

    for (const summary of postings) {
      fetched += 1;
      const postingId = pickPostingId(summary) ?? `page-${page}-idx-${fetched}`;
      const detail =
        FETCH_DETAIL && !postingId.startsWith("page-") ? await fetchPostingDetail(postingId) : null;
      if (FETCH_DETAIL) {
        if (postingId.startsWith("page-")) detailsSkipped += 1;
        else if (detail) detailsFetched += 1;
        else detailsMissing += 1;
      }
      const raw = mergePostingSummaryAndDetail(summary, detail);

      const title = pickTitle(raw);
      if (!title) {
        skippedNoTitle += 1;
        continue;
      }

      const companyName = pickCompanyName(raw);
      const domain = pickDomain(raw);
      let partnerOrganizationId: string | undefined;

      if (domain && partnerByDomain.has(domain)) {
        partnerOrganizationId = partnerByDomain.get(domain)!.id;
        matchedByDomain += 1;
      } else if (companyName) {
        const normalizedName = normalizeCompanyName(companyName);
        const matched = partnerByName.get(normalizedName);
        if (matched) {
          partnerOrganizationId = matched.id;
          matchedByName += 1;
        } else {
          unmatchedPartner += 1;
        }
      } else {
        unmatchedPartner += 1;
      }

      const status = pickStatus(raw);
      const hiringCount =
        asNumber(raw.hiringCount) ??
        asNumber(raw.numberOfInterns) ??
        asNumber(raw.headCount) ??
        asNumber(raw.recruitCount);
      const preferredNationalities = toArray(raw.preferredNationalities ?? raw.nationalities ?? raw.preferredNationality);
      const communicationLanguages = toArray(raw.communicationLanguages ?? raw.languages ?? raw.language);
      const hiringProcess = pickLineText(raw, ["hiringProcess", "process", "recruitmentProcess"]);
      const preferredJobRole =
        asString(raw.preferredJobRole) ??
        asString(raw.desiredPosition) ??
        asString(raw.jobRole) ??
        asString(raw.positionCategory);
      const scheduleRange = [asString(raw.workStartTime), asString(raw.workEndTime)]
        .filter((v): v is string => Boolean(v))
        .join(" ~ ");
      const workingHours =
        asString(raw.workingHours) ??
        asString(raw.workSchedule) ??
        asString(raw.workTime) ??
        (scheduleRange.length > 0 ? scheduleRange : null);
      const mainResponsibilities = pickLineText(raw, [
        "mainResponsibilities",
        "responsibilities",
        "jobDescription",
        "description"
      ]);
      const requiredQualifications = pickLineText(raw, [
        "requiredQualifications",
        "requirements",
        "qualification",
        "requiredSkills"
      ]);
      const preferredQualifications = pickLineText(raw, [
        "preferredQualifications",
        "preferredRequirements",
        "preferredSkills"
      ]);
      const dressCode = asString(raw.dressCode) ?? asString(raw.attire);
      const wantsPreTraining =
        pickBoolean(raw.wantsPreTraining) ??
        pickBoolean(raw.preTrainingRequired) ??
        pickBoolean(raw.trainingRequired) ??
        (() => {
          const preTraining = asString(raw.preTraining)?.toUpperCase();
          if (!preTraining) return null;
          if (preTraining.includes("NONE") || preTraining.includes("NO")) return false;
          return true;
        })();
      const remoteUpdatedAt =
        asString(raw.updatedAt) ??
        asString(raw.modifiedAt) ??
        asString(raw.lastModifiedAt) ??
        null;
      const syncHash = makeHash({
        partnerOrganizationId: partnerOrganizationId ?? null,
        title,
        status,
        preferredNationalities,
        communicationLanguages,
        hiringProcess,
        preferredJobRole,
        hiringCount,
        workingHours,
        mainResponsibilities,
        requiredQualifications,
        preferredQualifications,
        dressCode,
        wantsPreTraining,
        companyName,
        domain,
        remoteUpdatedAt
      });
      const marker = sourceMarker(postingId);
      const additionalNotes = [
        marker,
        `${HASH_MARKER}${syncHash}]]`,
        "Imported from admin-staging job-postings API",
        companyName ? `sourceCompanyName: ${companyName}` : null,
        domain ? `sourceDomain: ${domain}` : null,
        remoteUpdatedAt ? `sourceUpdatedAt: ${remoteUpdatedAt}` : null,
        asString(raw.location) ? `sourceLocation: ${asString(raw.location)}` : null,
        asString(raw.employmentType) ? `sourceEmploymentType: ${asString(raw.employmentType)}` : null,
        asString(raw.salary) ? `sourceSalary: ${asString(raw.salary)}` : null
      ]
        .filter((line): line is string => Boolean(line))
        .join("\n");

      const legacyCompanyMarker = companyName ? `sourceCompanyName: ${companyName}` : null;
      const existing = await prisma.position.findFirst({
        where: {
          OR: [
            { additionalNotes: { contains: marker } },
            {
              AND: [
                { title },
                { additionalNotes: { contains: "Imported from admin-staging job-postings API" } },
                ...(legacyCompanyMarker ? [{ additionalNotes: { contains: legacyCompanyMarker } }] : [])
              ]
            }
          ]
        },
        select: {
          id: true,
          partnerOrganizationId: true,
          title: true,
          status: true,
          preferredNationalities: true,
          communicationLanguages: true,
          hiringProcess: true,
          preferredJobRole: true,
          hiringCount: true,
          workingHours: true,
          mainResponsibilities: true,
          requiredQualifications: true,
          preferredQualifications: true,
          dressCode: true,
          wantsPreTraining: true,
          additionalNotes: true
        }
      });

      const existingHash = extractHashFromNotes(existing?.additionalNotes ?? null);
      const existingNotes = existing?.additionalNotes ?? null;
      const hasSameUpdatedAtMarker =
        Boolean(existingNotes) &&
        Boolean(remoteUpdatedAt) &&
        existingNotes!.includes(`sourceUpdatedAt: ${remoteUpdatedAt}`);
      const hasSameMappedFields =
        Boolean(existing) &&
        existing!.partnerOrganizationId === (partnerOrganizationId ?? null) &&
        existing!.title === title &&
        existing!.status === status &&
        JSON.stringify(existing!.preferredNationalities) === JSON.stringify(preferredNationalities) &&
        JSON.stringify(existing!.communicationLanguages) === JSON.stringify(communicationLanguages) &&
        (existing!.hiringProcess ?? null) === (hiringProcess ?? null) &&
        (existing!.preferredJobRole ?? null) === (preferredJobRole ?? null) &&
        (existing!.hiringCount ?? null) === (hiringCount ?? null) &&
        (existing!.workingHours ?? null) === (workingHours ?? null) &&
        (existing!.mainResponsibilities ?? null) === (mainResponsibilities ?? null) &&
        (existing!.requiredQualifications ?? null) === (requiredQualifications ?? null) &&
        (existing!.preferredQualifications ?? null) === (preferredQualifications ?? null) &&
        (existing!.dressCode ?? null) === (dressCode ?? null) &&
        (existing!.wantsPreTraining ?? null) === (wantsPreTraining ?? null);
      if (existing && (existingHash === syncHash || hasSameUpdatedAtMarker || hasSameMappedFields)) {
        skippedUnchanged += 1;
        continue;
      }

      if (existing) {
        await prisma.position.update({
          where: { id: existing.id },
          data: {
            partnerOrganizationId,
            sourceKind: PositionSourceKind.EXTERNAL,
            sourceProvider: PositionSourceProvider.OTHER,
            sourceExternalId: postingId,
            sourceUrl: `${API_BASE.replace(/\\/$/, "")}/${encodeURIComponent(postingId)}`,
            sourceFetchedAt: new Date(),
            title,
            status,
            preferredNationalities,
            communicationLanguages,
            hiringProcess,
            preferredJobRole,
            hiringCount,
            workingHours,
            mainResponsibilities,
            requiredQualifications,
            preferredQualifications,
            dressCode,
            wantsPreTraining,
            additionalNotes
          }
        });
        updated += 1;
      } else {
        await prisma.position.create({
          data: {
            partnerOrganizationId,
            sourceKind: PositionSourceKind.EXTERNAL,
            sourceProvider: PositionSourceProvider.OTHER,
            sourceExternalId: postingId,
            sourceUrl: `${API_BASE.replace(/\\/$/, "")}/${encodeURIComponent(postingId)}`,
            sourceFetchedAt: new Date(),
            title,
            status,
            preferredNationalities,
            communicationLanguages,
            hiringProcess,
            preferredJobRole,
            hiringCount,
            workingHours,
            mainResponsibilities,
            requiredQualifications,
            preferredQualifications,
            dressCode,
            wantsPreTraining,
            additionalNotes
          }
        });
        created += 1;
      }
    }

    if (totalPages && page >= totalPages) break;
    if (postings.length < PAGE_SIZE) break;
    page += 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        pageSize: PAGE_SIZE,
        pagesProcessed: page,
        detailEnabled: FETCH_DETAIL,
        fetched,
        detailsFetched,
        detailsMissing,
        detailsSkipped,
        created,
        updated,
        skippedUnchanged,
        matchedByDomain,
        matchedByName,
        unmatchedPartner,
        skippedNoTitle
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
