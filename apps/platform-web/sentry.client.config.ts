// Sentry init for the browser. Loaded by Next.js once the instrumentation
// hook fires `register()` on the client. Errors thrown after this file has
// initialised are automatically captured, including unhandled promise
// rejections from React event handlers.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || "";
const env = process.env.NEXT_PUBLIC_SENTRY_ENV?.trim()
  || (process.env.NEXT_PUBLIC_API_URL?.includes("staging") ? "staging" : "production");

if (dsn) {
  Sentry.init({
    dsn,
    environment: env,
    // Sampling: 100% errors, modest performance + session replay so we don't
    // blow the free tier (5k errors/mo, 10k tx/mo, 50 replays/mo).
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false
      })
    ]
  });
}
