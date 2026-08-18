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
      // ===== 레거시 → 리뉴얼 전면 이관 =====
      // 리뉴얼(/talent·/partner·/career-launch·/)이 아닌 페이지로의 이동을 URL 레벨에서 차단.
      // 유지(리뉴얼 트윈 없음/필수): 운영자 콘솔 /dashboard/ops/*, 법적고지 /legal/*,
      //   OAuth 콜백 /auth/*/return, 이메일 인증 /verify-email·/signup/verify-email,
      //   공개 공유 링크 /resume/share/:slug·/cover-letter/share/:slug.

      // 공고: 목록·상세(레거시) → 탤런트 잡 / 생성·수정(레거시) → 파트너 리뉴얼 에디터
      { source: "/positions", destination: "/talent/jobs", permanent: true },
      { source: "/positions/create", destination: "/partner/positions/new", permanent: true },
      { source: "/positions/:id/edit", destination: "/partner/positions/:id/edit", permanent: true },
      { source: "/positions/:id((?!create$)[^/]+)", destination: "/talent/jobs/:id", permanent: true },

      // 인증(레거시) → 탤런트 리뉴얼 (파트너는 /partner/login·/partner/signup 사용)
      { source: "/login", destination: "/talent/login", permanent: true },
      { source: "/signup", destination: "/talent/signup", permanent: true },

      // 학생 프로필·알림(레거시) → 탤런트 리뉴얼
      { source: "/profile/notifications", destination: "/talent/notifications", permanent: true },
      { source: "/profile/assignments", destination: "/talent/assignments", permanent: true },
      { source: "/profile/programs/:path*", destination: "/talent/programs", permanent: true },
      { source: "/profile/resume/:path*", destination: "/talent/career/resume", permanent: true },
      { source: "/profile/:path*", destination: "/talent/career/profile", permanent: true },
      { source: "/notifications", destination: "/talent/notifications", permanent: true },
      { source: "/matching-probability", destination: "/talent/home", permanent: true },
      { source: "/companies/:id", destination: "/talent/jobs", permanent: true },

      // 레거시 이력서 도구 → 리뉴얼 이력서 (공유 /resume/share/:slug 는 유지)
      { source: "/resume-maker/cover-letters/:path*", destination: "/talent/career/cover-letters", permanent: true },
      { source: "/resume-maker/:path*", destination: "/talent/career/resumes", permanent: true },
      { source: "/resume", destination: "/talent/career/resumes", permanent: true },
      { source: "/resume/:id/edit", destination: "/talent/career/resumes", permanent: true },
      { source: "/resume/:id/preview", destination: "/talent/career/resumes", permanent: true },
      { source: "/resume/:id((?!share$)[^/]+)", destination: "/talent/career/resumes", permanent: true },

      // 레거시 파트너 콘솔 → 리뉴얼 파트너 앱 (트윈 없는 하위는 홈으로)
      { source: "/dashboard/partner/applicants/:id", destination: "/partner/applicants/:id", permanent: true },
      { source: "/dashboard/partner/applicants", destination: "/partner/applicants", permanent: true },
      { source: "/dashboard/partner/company", destination: "/partner/company", permanent: true },
      { source: "/dashboard/partner/positions", destination: "/partner/positions", permanent: true },
      { source: "/dashboard/partner/:path*", destination: "/partner/home", permanent: true },

      // 레거시 파트너 프로필 → 리뉴얼
      { source: "/partner-profile/verification/:path*", destination: "/partner/company", permanent: true },
      { source: "/partner-profile/:path*", destination: "/partner/profile", permanent: true },

      // 공개 이벤트·마케팅(리뉴얼 트윈 없음) → 리뉴얼 랜딩.
      // 단, MBTI·사주(/events/mbti·/events/saju)는 탤런트 홈 배너에서 쓰므로 예외(차단하지 않음).
      { source: "/events", destination: "/", permanent: true },
      { source: "/events/hanpass/:path*", destination: "/", permanent: true },
      { source: "/events/visa/:path*", destination: "/", permanent: true },
      { source: "/events/seoul-global-center/:path*", destination: "/", permanent: true },
      { source: "/business/:path*", destination: "/", permanent: true },
      { source: "/pricing", destination: "/", permanent: true },
      { source: "/community", destination: "/", permanent: true },
      { source: "/resources/:path*", destination: "/", permanent: true },

      // 기존 www → apex 정규화(유지)
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
