// 공개 주소(/talent/...) ↔ v2 화면(/v2/...) 표. 주소창에는 늘 /talent/... 만 보이게 한다.
// middleware 가 스테이징·로컬에서만 쓴다: /talent/* 는 v2 화면으로 rewrite(주소 그대로), /v2/* 로 직접 오면 공개 주소로 보낸다.
// 프로덕션은 v2 가 닫혀 있어 /talent/* 가 그대로 기존 화면. 표에 없는 화면(로그인·가입·진단·tailor·비자·대학 등)도 기존 화면.

// 공개 주소 → v2 화면(정확히 같은 주소)
const EXACT: Record<string, string> = {
  "/talent/home": "/v2/home",
  "/talent/career": "/v2/career",
  "/talent/jobs": "/v2/jobs",
  "/talent/applications": "/v2/applications",
  "/talent/career/interviews": "/v2/interviews",
  "/talent/notifications": "/v2/notifications",
  "/talent/settings": "/v2/settings",
  "/talent/career/profile": "/v2/profile",
  "/talent/insights": "/v2/guide",
  "/talent/companies": "/v2/companies",
  "/talent/payments": "/v2/payments",
  "/talent/payments/success": "/v2/payments/success",
  "/talent/payments/fail": "/v2/payments/fail",
  "/talent/connections": "/v2/connections",
  "/talent/career/experiences": "/v2/experiences",
  "/talent/career/history": "/v2/history",
  "/talent/career/resume/editor": "/v2/resume",
  "/talent/career/resume/preview": "/v2/resume/preview",
  "/talent/career/resumes": "/v2/resumes",
  "/talent/career/cover/editor": "/v2/cover",
  "/talent/career/cover/preview": "/v2/cover/preview",
  "/talent/career/cover-letters": "/v2/cover-letters"
};

// 동적 값이 붙는 주소 — [공개 접두, v2 접두]. 값은 한 칸(슬래시 없음)만.
const DYNAMIC: [string, string][] = [
  ["/talent/jobs/", "/v2/jobs/"],
  ["/talent/company/", "/v2/companies/"],
  ["/talent/insights/", "/v2/guide/"],
  ["/talent/career/resumes/", "/v2/resumes/"],
  ["/talent/activity/", "/v2/activity/"]
];

// 없어졌거나 합쳐진 옛 주소 → 공개 주소(redirect)
const ALIASES: Record<string, string> = {
  "/talent": "/talent/home",
  "/talent/start": "/talent/career",
  "/talent/feed": "/talent/connections#interested",
  "/talent/community": "/talent/home",
  "/talent/onboarding": "/talent/home",
  "/talent/settings/points": "/talent/payments"
};

const trim = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
const oneSegment = (path: string, prefix: string) => path.startsWith(prefix) && path.length > prefix.length && !path.slice(prefix.length).includes("/");

/** 옛 주소면 옮겨 갈 공개 주소(redirect). 예전 글 주소(/talent/insights/분류/slug)도 여기서. */
export function talentAlias(pathname: string): string | null {
  const path = trim(pathname);
  if (ALIASES[path]) return ALIASES[path];
  const old = path.match(/^\/talent\/insights\/[^/]+\/([^/]+)$/);
  return old ? `/talent/insights/${old[1]}` : null;
}

/** 공개 주소에 맞는 v2 화면(rewrite 대상, 없으면 null). */
export function talentToV2(pathname: string): string | null {
  const path = trim(pathname);
  if (EXACT[path]) return EXACT[path];
  for (const [pub, v2] of DYNAMIC) if (oneSegment(path, pub)) return v2 + path.slice(pub.length);
  return null;
}

/** v2 화면 주소로 직접 들어왔을 때 보낼 공개 주소(없으면 null — 준비 중 화면 등). */
export function v2ToTalent(pathname: string): string | null {
  const path = trim(pathname);
  if (path === "/v2") return "/talent/home";
  for (const [pub, v2] of Object.entries(EXACT)) if (v2 === path) return pub;
  for (const [pub, v2] of DYNAMIC) if (oneSegment(path, v2)) return pub + path.slice(v2.length);
  return null;
}
