import "dotenv/config";
import * as cheerio from "cheerio";
import { PositionSourceProvider, PositionStatus, PrismaClient } from "@prisma/client";
import { type NormalizedExternalPosition, upsertExternalPositions } from "./crawlers/core";

const prisma = new PrismaClient();

const BASE_URL = "https://www.buddieskorea.com";
const LIST_URL = process.env.BUDDIES_LIST_URL ?? `${BASE_URL}/foreign-talent/home`;
const MAX_PAGES = Math.max(1, Number(process.env.BUDDIES_MAX_PAGES ?? 200));
const FETCH_DETAIL = (process.env.BUDDIES_FETCH_DETAIL ?? "1") !== "0";

// 일시적 엣지/서버 장애(502/503/504, 네트워크 단절)로 크롤이 통째로 실패하던
// 문제 대응 — 지수 백오프 재시도. 영구 에러(404 등)는 재시도하지 않고, 재시도
// 소진 시에는 응답/예외를 그대로 호출부에 넘겨 진짜 장애는 그대로 드러난다.
const FETCH_MAX_RETRIES = Math.max(0, Number(process.env.BUDDIES_FETCH_RETRIES ?? 4));
const FETCH_RETRY_BASE_MS = Math.max(100, Number(process.env.BUDDIES_FETCH_RETRY_BASE_MS ?? 1000));
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
// 일부 호스팅 엣지(Cloudflare 류)는 기본 fetch UA 를 봇으로 보고 502 를 주기도
// 해서, 브라우저류 UA 를 명시한다.
const FETCH_UA =
  process.env.BUDDIES_FETCH_UA ??
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: { "user-agent": FETCH_UA, ...(init?.headers ?? {}) }
      });
      // 성공 / 재시도 불가 상태 / 마지막 시도 → 응답을 그대로 반환(호출부가
      // !response.ok 를 처리). 그 외 재시도 대상은 백오프 후 재시도.
      if (response.ok || !RETRYABLE_STATUS.has(response.status) || attempt >= FETCH_MAX_RETRIES) {
        return response;
      }
      await response.text().catch(() => ""); // 연결 정리 후 재시도
      console.warn(`[buddies] HTTP ${response.status} — retry ${attempt + 1}/${FETCH_MAX_RETRIES}: ${url}`);
    } catch (err) {
      if (attempt >= FETCH_MAX_RETRIES) throw err;
      console.warn(`[buddies] network error — retry ${attempt + 1}/${FETCH_MAX_RETRIES}: ${url} (${(err as Error)?.message ?? err})`);
    }
    await sleep(FETCH_RETRY_BASE_MS * 2 ** attempt);
  }
}

async function areAllExistingExternalIds(externalIds: string[]): Promise<boolean> {
  const ids = Array.from(new Set(externalIds.map((id) => id.trim()).filter((id) => id.length > 0)));
  if (ids.length === 0) return false;
  const matched = await prisma.position.count({
    where: {
      sourceProvider: PositionSourceProvider.BUDDIES,
      sourceExternalId: { in: ids }
    }
  });
  return matched === ids.length;
}

function absUrl(href: string) {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  return `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
}

function compact(values: string[]) {
  return values.map((v) => v.trim()).filter((v) => v.length > 0);
}

function parseDateCandidate(raw: string): Date | null {
  const match = raw.match(/(20\d{2})[.\-/]\s?(\d{1,2})[.\-/]\s?(\d{1,2})/);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const dt = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function extractYmd(raw: string): string | null {
  const match = raw.match(/(20\d{2})[.\-/]\s?(\d{1,2})[.\-/]\s?(\d{1,2})/);
  if (!match) return null;
  const y = match[1];
  const m = match[2].padStart(2, "0");
  const d = match[3].padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function extractPostedAtFromDetailHtml(html: string): Date | null {
  const $ = cheerio.load(html);
  const lines = compact(
    $("body")
      .text()
      .split(/\n+/g)
      .map((s) => s.replace(/\s+/g, " ").trim())
  );

  for (const line of lines) {
    if (!/(등록일|작성일|게시일|posted)/i.test(line)) continue;
    const parsed = parseDateCandidate(line);
    if (parsed) return parsed;
  }
  return null;
}

function discoverPaginationLinks(html: string, currentUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  $("a[href]").each((_idx, el) => {
    const hrefRaw = $(el).attr("href")?.trim();
    if (!hrefRaw) return;
    try {
      const u = new URL(hrefRaw, currentUrl);
      if (!u.pathname.includes("/foreign-talent/home")) return;
      let hasPageParam = false;
      for (const key of u.searchParams.keys()) {
        if (key.endsWith("_page")) {
          hasPageParam = true;
          break;
        }
      }
      if (hasPageParam) links.add(u.toString());
    } catch {
      // ignore malformed links
    }
  });
  return Array.from(links);
}

async function collectAllListPages(initialUrl: string) {
  const queue: string[] = [initialUrl];
  const visited = new Set<string>();
  const htmlByUrl = new Map<string, string>();

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    const response = await fetchWithRetry(url);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`failed to fetch buddies list (${response.status}): ${url} / ${text.slice(0, 300)}`);
    }
    const html = await response.text();
    htmlByUrl.set(url, html);

    for (const discovered of discoverPaginationLinks(html, url)) {
      if (!visited.has(discovered)) queue.push(discovered);
    }
  }

  return Array.from(htmlByUrl.entries()).map(([url, html]) => ({ url, html }));
}

function extractPageNumber(url: string): number {
  try {
    const u = new URL(url);
    for (const [key, value] of u.searchParams.entries()) {
      if (!key.endsWith("_page")) continue;
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
    }
  } catch {
    // ignore
  }
  return 1;
}

function isDateLikeLabel(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (/\d{4}[./-]\d{1,2}[./-]\d{1,2}/.test(v)) return true;
  if (/\d{1,2}[./-]\d{1,2}/.test(v)) return true;
  if (/채용시\s*마감/i.test(v)) return true;
  return false;
}

function isMeaninglessJobRole(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === "general") return true;
  if (normalized === "role tbd") return true;
  if (normalized === "unspecified role") return true;
  return false;
}

function extractJobRolesFromDetailHtml(html: string): string[] {
  const $ = cheerio.load(html);
  const values = compact(
    $(
      [
        '[fs-cmsfilter-field="job type"]',
        '[fs-cmsfilter-field="job-type"]',
        '[fs-cmsfilter-field="job tpye"]',
        '[fs-cmsfilter-field="job-tpye"]'
      ].join(",")
    )
      .map((_i, node) => $(node).text())
      .get()
  );
  return Array.from(new Set(values.filter((value) => !isDateLikeLabel(value) && !isMeaninglessJobRole(value))));
}

function parseCards(html: string): NormalizedExternalPosition[] {
  const $ = cheerio.load(html);
  const rows: NormalizedExternalPosition[] = [];

  $(".card.job").each((_idx, el) => {
    const root = $(el);
    const href = root.find('a[href^="/job-post/"]').first().attr("href")?.trim();
    const title = root.find(".jobtilte").first().text().trim();
    const company = root.find('[fs-cmsfilter-field="회사이름"]').first().text().trim();
    const address = root.find(".address").first().text().trim();
    const deadlineRaw = compact(
      root
        .find("#data-expired, .text-block-35")
        .map((_i, node) => $(node).text())
        .get()
    ).join(" ");
    const deadlineYmd = extractYmd(deadlineRaw);
    const rollingDeadlineText = compact(
      root
        .find(".text-block-47, .text-block-237.willbe")
        .map((_i, node) => $(node).text())
        .get()
    ).join(" ");
    const isRollingDeadline = /채용시\s*마감/i.test(rollingDeadlineText);
    const thumbnailRaw =
      root.find("img.square-icon.card-job-icon").first().attr("src")?.trim() ??
      root.find("img.card-job-icon").first().attr("src")?.trim() ??
      root.find("img").first().attr("src")?.trim() ??
      "";

    if (!href || !title) return;

    const externalId = href.replace(/^\/job-post\//, "").trim();
    if (!externalId) return;

    const statusTexts = compact(
      root
        .find(".text-block-237")
        .map((_i, node) => $(node).text())
        .get()
    );
    const joinedStatus = statusTexts.join(" ").toLowerCase();
    const isOpenLike = joinedStatus.includes("접수중") || joinedStatus.includes("open");
    const isClosedLike = !isOpenLike && (joinedStatus.includes("마감") || joinedStatus.includes("closed"));

    const visaValues = compact(
      root
        .find('[fs-cmsfilter-field="visa"]')
        .map((_i, node) => $(node).text())
        .get()
    );

    const languageValues = compact(
      root
        .find('[fs-cmsfilter-field="외국어"]')
        .map((_i, node) => $(node).text())
        .get()
    );

    const jobTypes = compact(
      root
        .find(
          [
            '[fs-cmsfilter-field="job type"]',
            '[fs-cmsfilter-field="job-type"]',
            '[fs-cmsfilter-field="job tpye"]',
            '[fs-cmsfilter-field="job-tpye"]'
          ].join(",")
        )
        .map((_i, node) => $(node).text())
        .get()
    );
    const validJobTypes = Array.from(new Set(jobTypes.filter((value) => !isDateLikeLabel(value) && !isMeaninglessJobRole(value))));

    rows.push({
      externalId,
      sourceProvider: PositionSourceProvider.BUDDIES,
      sourceUrl: absUrl(href),
      title,
      status: isClosedLike ? PositionStatus.CLOSED : PositionStatus.OPEN,
      workLocation: address || null,
      preferredJobRole: validJobTypes[0] ?? null,
      thumbnailImages: thumbnailRaw ? [absUrl(thumbnailRaw)] : [],
      communicationLanguages: languageValues,
      eligibleVisas: visaValues,
      additionalNotes: [
        company ? `sourceCompanyName: ${company}` : null,
        deadlineYmd ? `sourceDeadlineDate: ${deadlineYmd}` : null,
        isRollingDeadline ? "sourceDeadlineRolling: true" : null,
        validJobTypes.length > 0 ? `sourceJobTypes: ${validJobTypes.join(", ")}` : null,
        `sourceListUrl: ${LIST_URL}`
      ]
        .filter((line): line is string => Boolean(line))
        .join("\n")
    });
  });

  const byExternalId = new Map<string, NormalizedExternalPosition>();
  for (const row of rows) {
    byExternalId.set(row.externalId, row);
  }
  return Array.from(byExternalId.values());
}

async function enrichPostedAt(rows: NormalizedExternalPosition[]) {
  if (!FETCH_DETAIL) return rows;
  const next: NormalizedExternalPosition[] = [];
  for (const row of rows) {
    try {
      const response = await fetchWithRetry(row.sourceUrl);
      if (!response.ok) {
        next.push(row);
        continue;
      }
      const headerLastModified = response.headers.get("last-modified");
      const html = await response.text();
      const postedAtFromHtml = extractPostedAtFromDetailHtml(html);
      const detailJobRoles = extractJobRolesFromDetailHtml(html);
      const postedAtFromHeader =
        headerLastModified && !Number.isNaN(new Date(headerLastModified).getTime())
          ? new Date(headerLastModified)
          : null;
      const postedAt = postedAtFromHtml ?? postedAtFromHeader;
      next.push({
        ...row,
        postedAt,
        preferredJobRole: row.preferredJobRole ?? detailJobRoles[0] ?? null
      });
    } catch {
      next.push(row);
    }
  }
  return next;
}

async function run() {
  const allPages = (await collectAllListPages(LIST_URL)).sort((a, b) => extractPageNumber(a.url) - extractPageNumber(b.url));
  const pages: Array<{ url: string; html: string }> = [];
  for (const page of allPages) {
    const rows = parseCards(page.html);
    const ids = rows.map((row) => row.externalId);
    pages.push(page);
    if (await areAllExistingExternalIds(ids)) {
      break;
    }
  }
  const merged = new Map<string, NormalizedExternalPosition>();
  const rankByExternalId = new Map<string, number>();
  let rankCursor = 0;
  for (const page of pages) {
    const rows = parseCards(page.html);
    for (const row of rows) {
      if (!merged.has(row.externalId)) {
        merged.set(row.externalId, row);
        rankByExternalId.set(row.externalId, rankCursor);
        rankCursor += 1;
      }
    }
  }
  const rows = await enrichPostedAt(Array.from(merged.values()));
  const now = Date.now();
  const rowsWithStableOrderPostedAt = rows.map((row) => {
    const rank = rankByExternalId.get(row.externalId) ?? 999_999;
    // Always preserve Buddies on-screen ordering (page 1 top is newest).
    // We use this timestamp for stable ordering in our Positions list.
    return { ...row, postedAt: new Date(now - rank * 1000) };
  });
  const result = await upsertExternalPositions(prisma, "import-buddies-job-postings", rowsWithStableOrderPostedAt);

  console.log(
    JSON.stringify(
      {
        ok: true,
        sourceProvider: PositionSourceProvider.BUDDIES,
        listUrl: LIST_URL,
        pagesFetched: pages.length,
        detailFetched: FETCH_DETAIL,
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
