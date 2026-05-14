import path from "node:path";
import { fileURLToPath } from "node:url";
import { withSentryConfig } from "@sentry/nextjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Deploy marker: rebuild staging with new aply.global domain envs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    qualities: [70, 75, 80]
  },
  turbopack: {
    root: __dirname
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.aply.global" }],
        destination: "https://aply.global/:path*",
        permanent: true
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.staging.aply.global" }],
        destination: "https://staging.aply.global/:path*",
        permanent: true
      }
    ];
  }
};

// Only wrap with Sentry when an auth token is available (CI build).
// Locally we still want a normal `next dev` to work without uploading
// source maps to Sentry on every restart.
const sentryEnabled = !!process.env.SENTRY_AUTH_TOKEN?.trim();

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG?.trim() || "aply",
      project: process.env.SENTRY_PROJECT?.trim() || "platform-web",
      silent: !process.env.CI,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true
    })
  : nextConfig;
