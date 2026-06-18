import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Deploy marker: rebuild staging with new aply.global domain envs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Emit hidden source maps for the production browser bundle so client error
  // reports (see ErrorReporter) can be mapped back to real function names.
  // Maps are uploaded as separate .map files; they don't change the shipped JS.
  productionBrowserSourceMaps: true,
  images: {
    qualities: [70, 75, 80],
    // Allow query strings on local /public images so we can use `?v=N`
    // to bust the image optimizer cache after replacing a static asset
    // in place (omitting `search` accepts any query string).
    localPatterns: [{ pathname: "/**" }]
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

export default nextConfig;
