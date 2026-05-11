import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export default nextConfig;
