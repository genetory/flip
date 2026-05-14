// Sentry init for the Edge runtime (middleware). We don't use Next.js
// middleware today, but @sentry/nextjs expects this file to exist for the
// edge runtime path.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN?.trim()
  || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()
  || "";
const env = process.env.SENTRY_ENV?.trim()
  || process.env.NEXT_PUBLIC_SENTRY_ENV?.trim()
  || (process.env.NEXT_PUBLIC_API_URL?.includes("staging") ? "staging" : "production");

if (dsn) {
  Sentry.init({
    dsn,
    environment: env,
    tracesSampleRate: 0.1
  });
}
