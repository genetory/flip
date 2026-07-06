import { resolveMx, resolve4, resolve6 } from "dns/promises";

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

/**
 * 일회용/임시 이메일 도메인 — 봇·스팸 가입에 흔히 쓰인다. 이런 주소는 MX 가 있어
 * 위 KNOWN_GOOD / MX 검사는 통과하므로 별도로 막는다. 인증 메일을 보내봐야
 * 열어보지 않아 반송·미참여로 도메인 평판만 깎인다. 필요 시 계속 추가.
 */
const DISPOSABLE_DOMAINS = new Set<string>([
  "mailinator.com", "mailinator.net", "mailinator.org",
  "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "guerrillamail.biz", "guerrillamailblock.com",
  "sharklasers.com", "grr.la", "spam4.me",
  "10minutemail.com", "10minutemail.net", "20minutemail.com",
  "temp-mail.org", "tempmail.com", "tempmailo.com", "tempmail.net", "tempr.email", "tempmail.plus", "temp-mail.io",
  "throwawaymail.com", "throwawayemailaddresses.com",
  "yopmail.com", "yopmail.net", "yopmail.fr",
  "getnada.com", "nada.email",
  "trashmail.com", "trashmail.net", "trashmail.de", "trash-mail.com",
  "dispostable.com", "discard.email", "discardmail.com",
  "maildrop.cc", "mintemail.com", "mohmal.com",
  "fakeinbox.com", "fakemail.net", "fake-mail.net",
  "mailnesia.com", "mailcatch.com", "maileater.com", "mailtemp.net",
  "emailondeck.com", "getairmail.com", "moakt.com", "mytemp.email",
  "inboxbear.com", "tempinbox.com", "tempemail.co", "spambog.com",
  "anonbox.net", "burnermail.io", "33mail.com", "vomoto.com", "luxusmail.org",
  "easytrashmail.com", "mail-temp.com", "linshiyouxiang.net"
]);

type DeliverabilityResult =
  | { ok: true; cached: boolean }
  | { ok: false; reason: "no-mx" | "nxdomain" | "invalid-email" | "disposable" };

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

// MX 가 없는 도메인(특히 서브도메인)도 A/AAAA 레코드가 있으면 메일을 받을 수 있다
// (RFC 5321 §5.1 — MX 없으면 A/AAAA 를 암시적 MX 로 사용). 그래서 MX 부재 시 주소
// 레코드로 폴백해 서브도메인 이메일이 잘못 차단되지 않게 한다.
async function hasAddressRecord(domain: string): Promise<boolean> {
  const check = async (fn: (name: string) => Promise<unknown[]>): Promise<boolean> => {
    try {
      const records = await withTimeout(fn(domain), MX_LOOKUP_TIMEOUT_MS);
      return Array.isArray(records) && records.length > 0;
    } catch {
      return false;
    }
  };
  if (await check(resolve4)) return true;
  return check(resolve6);
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

  // 일회용/임시 메일은 MX 가 있어 통과해버리므로 먼저 차단(봇·스팸 가입 + 반송 방지).
  if (DISPOSABLE_DOMAINS.has(domain)) return { ok: false, reason: "disposable" };

  if (KNOWN_GOOD_DOMAINS.has(domain)) return { ok: true, cached: true };

  const cached = getCached(domain);
  if (cached) return cached;

  try {
    const records = await withTimeout(resolveMx(domain), MX_LOOKUP_TIMEOUT_MS);
    const hasUsableMx = Array.isArray(records) && records.some((r) => r && typeof r.exchange === "string" && r.exchange.trim().length > 0);
    if (hasUsableMx) {
      const result: DeliverabilityResult = { ok: true, cached: false };
      setCached(domain, result);
      return result;
    }
    // MX 없음 → A/AAAA(암시적 MX) 폴백. 서브도메인이 A레코드로만 메일 받는 경우 통과.
    const hasAddr = await hasAddressRecord(domain);
    const result: DeliverabilityResult = hasAddr ? { ok: true, cached: false } : { ok: false, reason: "no-mx" };
    setCached(domain, result);
    return result;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    // MX 조회가 NXDOMAIN/ENODATA 여도, 주소 레코드가 있으면 메일 수신 가능(암시적 MX).
    if (code === "ENOTFOUND" || code === "ENODATA") {
      const hasAddr = await hasAddressRecord(domain);
      if (hasAddr) {
        const result: DeliverabilityResult = { ok: true, cached: false };
        setCached(domain, result);
        return result;
      }
      const result: DeliverabilityResult = { ok: false, reason: code === "ENOTFOUND" ? "nxdomain" : "no-mx" };
      setCached(domain, result);
      return result;
    }
    // Timeouts, SERVFAIL, etc. — treat as soft pass so signup isn't held
    // hostage by a flaky resolver. Don't cache.
    return { ok: true, cached: false };
  }
}
