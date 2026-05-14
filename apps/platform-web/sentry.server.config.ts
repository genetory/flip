// Sentry init for the Node.js side of Next.js (RSC, route handlers, server
// actions). Loaded by Next.js once `register()` runs in the nodejs runtime.

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
