import { NextRequest, NextResponse } from "next/server";

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

  const user = process.env.BASIC_AUTH_USER?.trim();
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) return NextResponse.next();

  const header = req.headers.get("authorization") ?? "";
  const expected = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
  if (header === expected) {
    return NextResponse.next();
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
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|site\\.webmanifest).*)"]
};
