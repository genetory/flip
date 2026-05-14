import { resolveMx } from "dns/promises";

/**
 * Domains we know are valid mail providers — skip DNS lookup so we don't
 * hammer resolvers and slow down signup. Anything outside this set goes
 * through resolveMx().
 */
const KNOWN_GOOD_DOMAINS = new Set<string>([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.co.kr",
  "yahoo.co.jp",
  "icloud.com",
  "me.com",
  "mac.com",
  "naver.com",
  "daum.net",
  "hanmail.net",
  "kakao.com",
  "nate.com",
  "korea.com",
  "qq.com",
  "163.com",
  "126.com",
  "sina.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "fastmail.com",
  "zoho.com",
  "yandex.com",
  "yandex.ru"
]);

type DeliverabilityResult =
  | { ok: true; cached: boolean }
  | { ok: false; reason: "no-mx" | "nxdomain" | "invalid-email" };

const MX_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MX_LOOKUP_TIMEOUT_MS = 4_000;

const cache = new Map<string, { result: DeliverabilityResult; expiresAt: number }>();

function getCached(domain: string): DeliverabilityResult | null {
  const hit = cache.get(domain);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(domain);
    return null;
  }
  return hit.result;
}

function setCached(domain: string, result: DeliverabilityResult) {
  cache.set(domain, { result, expiresAt: Date.now() + MX_CACHE_TTL_MS });
}

function extractDomain(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return null;
  return trimmed.slice(at + 1);
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("MX_LOOKUP_TIMEOUT")), ms);
    })
  ]);
}

/**
 * Returns whether the email's domain can actually receive mail.
 *
 * - Returns { ok: true } for well-known major providers without doing DNS.
 * - For everything else, does an MX lookup with a short timeout.
 * - On DNS errors that aren't clearly "no mail server" (timeouts, soft
 *   failures), returns { ok: true } so we don't block signup on a flaky
 *   resolver. The whole point is to catch the obvious "this domain has
 *   no MX at all" case (e.g. scoutlab.co).
 */
export async function checkEmailDeliverable(email: string): Promise<DeliverabilityResult> {
  const domain = extractDomain(email);
  if (!domain) return { ok: false, reason: "invalid-email" };

  if (KNOWN_GOOD_DOMAINS.has(domain)) return { ok: true, cached: true };

  const cached = getCached(domain);
  if (cached) return cached;

  try {
    const records = await withTimeout(resolveMx(domain), MX_LOOKUP_TIMEOUT_MS);
    const hasUsableMx = Array.isArray(records) && records.some((r) => r && typeof r.exchange === "string" && r.exchange.trim().length > 0);
    const result: DeliverabilityResult = hasUsableMx ? { ok: true, cached: false } : { ok: false, reason: "no-mx" };
    setCached(domain, result);
    return result;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOTFOUND") {
      const result: DeliverabilityResult = { ok: false, reason: "nxdomain" };
      setCached(domain, result);
      return result;
    }
    if (code === "ENODATA") {
      const result: DeliverabilityResult = { ok: false, reason: "no-mx" };
      setCached(domain, result);
      return result;
    }
    // Timeouts, SERVFAIL, etc. — treat as soft pass so signup isn't held
    // hostage by a flaky resolver. Don't cache.
    return { ok: true, cached: false };
  }
}
