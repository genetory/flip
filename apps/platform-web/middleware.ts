import { NextRequest, NextResponse } from "next/server";
import { talentAlias, talentToV2, v2ToTalent } from "./lib/talent/v2-routes";

// Legacy domain alias — anything that lands on flip-ers.com (or its www
// subdomain) is permanently redirected to the same path on aply.global so
// the brand resolves to a single canonical host. Runs BEFORE the basic
// auth gate so the redirect isn't intercepted on the staging host.
const LEGACY_DOMAIN_HOSTS = new Set(["flip-ers.com", "www.flip-ers.com"]);
const CANONICAL_ORIGIN = "https://aply.global";

/**
 * Optional HTTP Basic Auth gate. Activates only when both BASIC_AUTH_USER and
 * BASIC_AUTH_PASSWORD env vars are set — so staging can enable it without
 * affecting production. Set the two vars on the staging App Service only.
 *
 * Once set, the browser shows the native login dialog on first visit and
 * remembers the credentials for the session. Search-engine bots get 401
 * which is a useful side-effect for staging (no accidental indexing).
 */
export function middleware(req: NextRequest) {
  // Strip the optional port — Azure Container Apps forwards the original
  // Host header which usually carries no port, but be defensive.
  const rawHost = (req.headers.get("host") ?? "").toLowerCase();
  const host = rawHost.split(":")[0];
  if (LEGACY_DOMAIN_HOSTS.has(host)) {
    const url = new URL(req.url);
    const dest = new URL(`${url.pathname}${url.search}`, CANONICAL_ORIGIN);
    return NextResponse.redirect(dest, 308);
  }

  // Career Launch 는 서브도메인(launch.*)을 폐기하고 /career-launch 경로만 쓴다.
  // launch.aply.global / launch.localhost 등으로 들어오면 서브도메인을 떼어낸
  // 정식 호스트의 /career-launch 로 영구 리다이렉트한다.
  if (host.startsWith("launch.")) {
    const baseHost = host.slice("launch.".length);
    const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "") ?? "https";
    const port = rawHost.includes(":") ? `:${rawHost.split(":")[1]}` : "";
    return NextResponse.redirect(`${proto}://${baseHost}${port}/career-launch`, 308);
  }

  // 리뉴얼 v2(/v2/*) — 기존 화면을 건드리지 않고 따로 만드는 새 화면 묶음. 스테이징·로컬에서만 연다.
  // 프로덕션(aply.global 등 'staging' 이 없는 호스트)에선 404 — 새 화면 코드가 아예 돌지 않게 여기서 막는다.
  const previewHost = host.includes("staging") || host === "localhost" || host === "127.0.0.1";
  const pathname = req.nextUrl.pathname;
  if (pathname === "/v2" || pathname.startsWith("/v2/")) {
    if (!previewHost) return new NextResponse("Not Found", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
    // 주소창에 v2 가 보이지 않게 — v2 주소로 직접 오면 공개 주소(/talent/...)로 보낸다.
    const pub = v2ToTalent(pathname);
    if (pub) {
      const url = req.nextUrl.clone();
      url.pathname = pub;
      return NextResponse.redirect(url, 307);
    }
  }

  // 스테이징·로컬: v2 로 다시 만든 talent 화면은 같은 주소에서 v2 화면을 보여 준다(rewrite — 주소 그대로).
  // 없어진 옛 주소는 공개 주소로 redirect. 프로덕션은 그대로 기존 화면. ?legacy=1 이면 비교용으로 기존 화면.
  if (previewHost && pathname.startsWith("/talent") && req.nextUrl.searchParams.get("legacy") !== "1") {
    const alias = talentAlias(pathname);
    if (alias) {
      const url = req.nextUrl.clone();
      const [path, hash] = alias.split("#");
      url.pathname = path;
      if (hash) url.hash = hash;
      return NextResponse.redirect(url, 307);
    }
    const dest = talentToV2(pathname);
    if (dest) {
      const url = req.nextUrl.clone();
      url.pathname = dest;
      return withBasicAuth(req, () => NextResponse.rewrite(url));
    }
  }

  return withBasicAuth(req, () => NextResponse.next());
}

/** 스테이징 Basic Auth(BASIC_AUTH_USER/PASSWORD 가 있을 때만) — 통과하면 ok() 응답. */
function withBasicAuth(req: NextRequest, ok: () => NextResponse): NextResponse {
  const user = process.env.BASIC_AUTH_USER?.trim();
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) return ok();

  const header = req.headers.get("authorization") ?? "";
  const expected = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
  if (header === expected) {
    return ok();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Aply Staging", charset="UTF-8"',
      "Cache-Control": "no-store"
    }
  });
}

// Skip Next.js internal asset routes that the browser hits before the user
// has had a chance to authenticate. Everything else (including pages, /api,
// images, fonts) is gated.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|sitemaps/|site\\.webmanifest).*)"]
};
