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
      // 레거시 /positions(공고 목록·상세) → 새 /talent/jobs 로 영구 이관.
      // 파트너 생성(/positions/create)·수정(/positions/:id/edit)은 보존해야 하므로
      // 목록은 정확 매치, 상세는 단일 세그먼트에서 create 만 제외한다.
      {
        source: "/positions",
        destination: "/talent/jobs",
        permanent: true
      },
      {
        source: "/positions/:id((?!create$)[^/]+)",
        destination: "/talent/jobs/:id",
        permanent: true
      },
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
