import { NextResponse } from "next/server";

const TOKEN_COOKIE_KEY = "partner_admin_token";

export async function POST(request: Request) {
  const redirectUrl = new URL("/", request.url);
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(TOKEN_COOKIE_KEY, "", {
    path: "/",
    maxAge: 0
  });

  return response;
}
