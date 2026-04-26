import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_COOKIE_KEY = "ops_admin_token";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE_KEY)?.value;
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"]
};
