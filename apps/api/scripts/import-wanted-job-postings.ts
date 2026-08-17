import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PositionSourceProvider, PositionStatus, PrismaClient } from "@prisma/client";
import { type NormalizedExternalPosition, upsertExternalPositions } from "./crawlers/core";

const prisma = new PrismaClient();

const LOCK_DIR = join(tmpdir(), "aply-wanted-import");
const LOCK_FILE = join(LOCK_DIR, "import.lock");
const LOCK_TTL_MS = 10 * 60 * 1000; // 10 minutes

function acquireLock(): boolean {
  if (!existsSync(LOCK_DIR)) mkdirSync(LOCK_DIR, { recursive: true });
  if (existsSync(LOCK_FILE)) {
    try {
      const raw = readFileSync(LOCK_FILE, "utf8");
      const startedAt = Number(raw.trim());
      if (Number.isFinite(startedAt) && Date.now() - startedAt < LOCK_TTL_MS) {
        return false;
      }
    } catch {
      // ignore unreadable lock; treat as stale
    }
  }
  writeFileSync(LOCK_FILE, String(Date.now()));
  return true;
}

function releaseLock() {
  try {
    if (existsSync(LOCK_FILE)) unlinkSync(LOCK_FILE);
  } catch {
    // best-effort
  }
}

const BASE_URL = (process.env.WANTED_API_BASE_URL?.trim() || "https://openapi.wanted.jobs").replace(/\/$/, "");
const JOBS_PATH = "/v2/jobs";
const CLIENT_ID = process.env.WANTED_CLIENT_ID?.trim() ?? "";
const CLIENT_SECRET = process.env.WANTED_CLIENT_SECRET?.trim() ?? "";
const PAGE_SIZE_RAW = Number(process.env.WANTED_PAGE_SIZE ?? "20");
const MAX_PAGES_RAW = Number(process.env.WANTED_MAX_PAGES ?? "5");
const REQUEST_DELAY_MS_RAW = Number(process.env.WANTED_REQUEST_DELAY_MS ?? "1100");

const PAGE_SIZE = Number.isFinite(PAGE_SIZE_RAW) ? Math.min(Math.max(Math.trunc(PAGE_SIZE_RAW), 1), 50) : 20;
const MAX_PAGES = Number.isFinite(MAX_PAGES_RAW) ? Math.min(Math.max(Math.trunc(MAX_PAGES_RAW), 1), 500) : 5;
// 전체(한국인 포함) 크롤 페이지 수 — 이제 메인 소스라 외국인 필터보다 넓게 잡는다.
const GENERAL_MAX_PAGES_RAW = Number(process.env.WANTED_GENERAL_MAX_PAGES ?? "25");
const GENERAL_MAX_PAGES = Number.isFinite(GENERAL_MAX_PAGES_RAW)
  ? Math.min(Math.max(Math.trunc(GENERAL_MAX_PAGES_RAW), 1), 500)
  : 25;
// Wanted policy: <=10 calls / 10s. Enforce a hard 1100ms floor between calls
// regardless of env override to stay well below the threshold.
const MIN_REQUEST_DELAY_MS = 1100;
const REQUEST_DELAY_MS = Math.max(
  Number.isFinite(REQUEST_DELAY_MS_RAW) ? Math.trunc(REQUEST_DELAY_MS_RAW) : MIN_REQUEST_DELAY_MS,
  MIN_REQUEST_DELAY_MS
);

// Wanted v2 jobs response (verified against actual API sample).
type WantedCompany = {
  id?: number;
  name?: string | null;
};

type WantedAddress = {
  country?: string | null;
  location?: string | null;
  full_location?: string | null;
};

type WantedImage = {
  origin?: string | null;
  thumb?: string | null;
};

type WantedCategoryTag = {
  id?: number;
  title?: string | null;
};

type WantedJob = {
  id?: number | string;
  status?: string | null;
  due_time?: string | null;
  name?: string | null;
  company?: WantedCompany | null;
  employment_type?: string | null;
  additional_apply_type?: string[] | null;
  address?: WantedAddress | null;
  title_img?: WantedImage | null;
  logo_img?: WantedImage | null;
  category_tags?: {
    parent_tag?: WantedCategoryTag | null;
    child_tags?: WantedCategoryTag[] | null;
  } | null;
  url?: string | null;
};

type WantedJobsResponse = {
  data?: WantedJob[];
  links?: { prev?: string | null; next?: string | null } | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildHeaders(): Record<string, string> {
  return {
    "wanted-client-id": CLIENT_ID,
    "wanted-client-secret": CLIENT_SECRET,
    Accept: "application/json"
  };
}

// Two independent foreigner-eligibility signals on Wanted. They are NOT
// supersets of each other — partners can opt in via either, so we fetch both
// and dedupe by job id.
type ForeignerFilter =
  | { kind: "additional_apply_type"; label: "foreigner_friendly_company" }
  | { kind: "tag"; tagId: 10526; label: "foreigner_open_to_apply" };

const FOREIGNER_FILTERS: ForeignerFilter[] = [
  { kind: "additional_apply_type", label: "foreigner_friendly_company" },
  { kind: "tag", tagId: 10526, label: "foreigner_open_to_apply" }
];

// filter === null → 전체 공고(한국인 포함) 조회. 필터가 있으면 외국인 신호별 조회.
async function fetchJobs(offset: number, limit: number, filter: ForeignerFilter | null): Promise<WantedJobsResponse> {
  const params = new URLSearchParams();
  params.set("offset", String(offset));
  params.set("limit", String(limit));
  if (filter?.kind === "additional_apply_type") {
    params.append("additional_apply_types", "job.additional_apply_type.foreigner");
  } else if (filter?.kind === "tag") {
    params.append("tags", String(filter.tagId));
  }

  const url = `${BASE_URL}${JOBS_PATH}?${params.toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders()
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Wanted API request failed: ${response.status} ${response.statusText} :: ${body.slice(0, 500)}`);
  }

  return (await response.json()) as WantedJobsResponse;
}

function pickTitle(job: WantedJob): string {
  return (job.name ?? "").trim();
}

function pickWorkLocation(job: WantedJob): string | null {
  const full = job.address?.full_location?.trim();
  if (full && full.length > 0) return full;
  const loc = job.address?.location?.trim();
  return loc && loc.length > 0 ? loc : null;
}

function isHttpUrl(value: string | null | undefined): value is string {
  return typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"));
}

function pickThumbnails(job: WantedJob): string[] {
  const candidates = [job.title_img?.origin, job.title_img?.thumb, job.logo_img?.origin, job.logo_img?.thumb];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of candidates) {
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!isHttpUrl(value)) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function pickPreferredJobRole(job: WantedJob): string | null {
  // Use category_tags.parent_tag.title as the broad job-role bucket the
  // platform-web filter exposes. child_tags are more granular and would
  // explode the filter chips.
  const parent = job.category_tags?.parent_tag?.title?.trim();
  return parent && parent.length > 0 ? parent : null;
}

function isActiveJob(job: WantedJob): boolean {
  return (job.status ?? "").trim().toLowerCase() === "active";
}

function pickEmploymentType(job: WantedJob): string | null {
  const raw = (job.employment_type ?? "").trim().toLowerCase();
  if (!raw) return null;
  if (raw === "regular" || raw === "fulltime" || raw === "full-time" || raw === "full_time") return "FULL_TIME";
  if (raw === "intern" || raw === "internship") return "INTERN";
  if (raw === "contract" || raw === "contractor") return "FULL_TIME";
  if (raw === "part-time" || raw === "part_time" || raw === "parttime") return "PART_TIME";
  return null;
}

function pickAdditionalNotes(job: WantedJob): string | null {
  const lines: string[] = [];
  // API(extractSourceCompanyName)는 'sourceCompanyName:' 접두사 라인만 회사명으로 인식한다.
  // (buddies 크롤러와 동일 규약) 'Company:' 로 쓰면 파싱되지 않아 '비공개 기업'으로 표시된다.
  if (job.company?.name?.trim()) lines.push(`sourceCompanyName: ${job.company.name.trim()}`);
  const due = job.due_time?.trim() ?? "";
  if (due) lines.push(`Deadline: ${due}`);
  const employment = job.employment_type?.trim();
  if (employment) lines.push(`Wanted employment_type: ${employment}`);
  return lines.length > 0 ? lines.join("\n") : null;
}

function pickSourceDeadlineDate(job: WantedJob): Date | null {
  const raw = job.due_time?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const parsed = new Date(`${raw}T23:59:59+09:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// foreignerEligible: 외국인 필터 조회에서 확인된 공고면 true. 태그 경로로만
// 외국인 가능인 공고는 payload의 additional_apply_type엔 안 나오므로, 이 인자로 보강한다.
function normalize(job: WantedJob, foreignerEligible: boolean): NormalizedExternalPosition | null {
  if (!isActiveJob(job)) return null;

  const externalIdRaw = job.id;
  const externalId =
    typeof externalIdRaw === "number"
      ? String(externalIdRaw)
      : typeof externalIdRaw === "string"
        ? externalIdRaw.trim()
        : "";
  if (!externalId) return null;

  const title = pickTitle(job);
  if (!title) return null;

  const sourceUrl = isHttpUrl(job.url?.trim())
    ? job.url!.trim()
    : `https://www.wanted.co.kr/wd/${externalId}`;

  // 원티드 '전체' 공고를 수집한다. 버리지 않고, 외국인 지원 가능 공고엔 필터용 태그만 부여한다.
  const eligibleVisas: string[] = [];
  if (foreignerEligible || job.additional_apply_type?.includes("foreigner")) {
    eligibleVisas.push("FOREIGNER_FRIENDLY");
  }

  return {
    externalId,
    title,
    sourceUrl,
    sourceProvider: PositionSourceProvider.WANTED,
    postedAt: null,
    status: PositionStatus.OPEN,
    workLocation: pickWorkLocation(job),
    workType: null,
    employmentType: pickEmploymentType(job) ?? "FULL_TIME",
    preferredJobRole: pickPreferredJobRole(job),
    thumbnailImages: pickThumbnails(job),
    communicationLanguages: [],
    eligibleVisas,
    additionalNotes: pickAdditionalNotes(job),
    sourceDeadlineDate: pickSourceDeadlineDate(job)
  };
}

async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("[wanted-import] WANTED_CLIENT_ID/WANTED_CLIENT_SECRET env vars are required.");
    process.exit(1);
  }

  if (!acquireLock()) {
    console.warn("[wanted-import] Another import is already in progress; aborting to honor rate limits.");
    process.exit(0);
  }

  console.info(
    `[wanted-import] Starting · base=${BASE_URL} pageSize=${PAGE_SIZE} ` +
    `foreignerPages=${MAX_PAGES} generalPages=${GENERAL_MAX_PAGES} delayMs=${REQUEST_DELAY_MS}`
  );

  const totals = { created: 0, updated: 0, skipped: 0, seen: 0 };
  let lastCallAt = 0;
  // Encode receive order into postedAt so that Wanted's latest_order survives
  // through `ORDER BY createdAt DESC`. The first job we see gets the most recent
  // timestamp; subsequent jobs are 1 second older.
  const importStartedAt = Date.now();
  let globalOrder = 0;
  // Dedup across all phases — a job id is upserted at most once per run.
  const seenJobIds = new Set<string>();
  // 외국인 필터로 확인된 job id 모음. 전체 크롤 단계에서 이 Set으로 외국인 여부를 보강한다.
  const foreignerIds = new Set<string>();

  const jobKey = (id: WantedJob["id"]): string =>
    typeof id === "number" ? String(id) : typeof id === "string" ? id.trim() : "";

  // 한 페이즈(필터 조회 또는 전체 조회)를 페이지 단위로 크롤·업서트한다.
  // resolveForeigner: 해당 페이즈에서 각 공고를 외국인 가능으로 볼지 판정.
  async function crawlPhase(
    label: string,
    filter: ForeignerFilter | null,
    maxPages: number,
    resolveForeigner: (key: string) => boolean
  ) {
    console.info(`[wanted-import] Phase: ${label}`);
    for (let page = 0; page < maxPages; page += 1) {
      const offset = page * PAGE_SIZE;
      // Guarantee the minimum gap *before* each network call (not after), so
      // the limiter is robust to fast responses and unrelated work between pages.
      const elapsed = Date.now() - lastCallAt;
      if (lastCallAt > 0 && elapsed < REQUEST_DELAY_MS) {
        await sleep(REQUEST_DELAY_MS - elapsed);
      }
      let payload: WantedJobsResponse;
      lastCallAt = Date.now();
      try {
        payload = await fetchJobs(offset, PAGE_SIZE, filter);
      } catch (error) {
        console.error(`[wanted-import] Failed to fetch [${label}] page ${page} (offset=${offset}):`, error);
        break;
      }
      const items = Array.isArray(payload.data) ? payload.data : [];
      if (items.length === 0) {
        console.info(`[wanted-import] [${label}] empty page at offset=${offset}; advancing.`);
        break;
      }
      totals.seen += items.length;

      // Dedup before normalize so we don't waste DB write budget on already-imported ids.
      const fresh = items.filter((job) => {
        const key = jobKey(job.id);
        if (!key) return false;
        if (seenJobIds.has(key)) return false;
        seenJobIds.add(key);
        return true;
      });

      const normalized = fresh
        .map((job) => normalize(job, resolveForeigner(jobKey(job.id))))
        .filter((row): row is NormalizedExternalPosition => Boolean(row))
        .map((row) => {
          const stamped: NormalizedExternalPosition = {
            ...row,
            postedAt: new Date(importStartedAt - globalOrder * 1000)
          };
          globalOrder += 1;
          return stamped;
        });

      const result = await upsertExternalPositions(prisma, "import-wanted-job-postings", normalized);
      totals.created += result.created;
      totals.updated += result.updated;
      totals.skipped += result.skipped;
      console.info(
        `[wanted-import] [${label}] page=${page} offset=${offset} seen=${items.length} fresh=${fresh.length} ` +
        `normalized=${normalized.length} created=${result.created} updated=${result.updated} skipped=${result.skipped}`
      );
    }
  }

  // 1단계: 외국인 필터 2개 → 외국인 공고를 먼저 수집(정확히 FOREIGNER_FRIENDLY 태깅)하고
  //        id를 foreignerIds에 기록. (이 단계 공고는 전부 외국인 가능)
  for (const filter of FOREIGNER_FILTERS) {
    await crawlPhase(filter.label, filter, MAX_PAGES, (key) => {
      if (key) foreignerIds.add(key);
      return true;
    });
  }

  // 2단계: 필터 없이 전체 공고(한국인 포함) → 1단계에서 본 id는 dedup으로 건너뛰고,
  //        나머지는 payload의 additional_apply_type(normalize 내부)만으로 외국인 여부 판정.
  await crawlPhase("all_jobs", null, GENERAL_MAX_PAGES, (key) => foreignerIds.has(key));

  console.info(
    `[wanted-import] Done · seen=${totals.seen} created=${totals.created} ` +
    `updated=${totals.updated} skipped=${totals.skipped} foreignerTagged=${foreignerIds.size}`
  );
}

main()
  .catch((error) => {
    console.error("[wanted-import] Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    releaseLock();
    await prisma.$disconnect();
  });
