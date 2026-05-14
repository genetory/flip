// Next.js instrumentation hook. Re-exports Sentry's per-runtime configs so
// the right one (node / edge) loads automatically. The client config is
// loaded via the conventional sentry.client.config.ts file.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
