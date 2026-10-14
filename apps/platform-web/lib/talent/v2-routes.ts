// 기존 talent 주소 → v2 주소. v2 로 다시 만든 화면만 적는다(없는 화면은 그대로 기존 화면).
// middleware 가 스테이징·로컬에서만 이 표로 /talent/* 를 /v2/* 로 보낸다(프로덕션은 v2 가 닫혀 있어 그대로).
// 로그인·가입·온보딩·비자·대학·이력서 진단/맞춤(tailor)·포인트 등은 아직 기존 화면.

const EXACT: Record<string, string> = {
  "/talent": "/v2",
  "/talent/home": "/v2/home",
  "/talent/career": "/v2/career",
  "/talent/start": "/v2/career",
  "/talent/jobs": "/v2/jobs",
  "/talent/applications": "/v2/applications",
  "/talent/career/interviews": "/v2/interviews",
  "/talent/notifications": "/v2/notifications",
  "/talent/settings": "/v2/settings",
  "/talent/career/profile": "/v2/profile",
  "/talent/insights": "/v2/guide",
  "/talent/connections": "/v2/connections",
  "/talent/feed": "/v2/connections#interested",
  "/talent/career/experiences": "/v2/experiences",
  "/talent/career/history": "/v2/history",
  "/talent/career/resume/editor": "/v2/resume",
  "/talent/career/resume/preview": "/v2/resume/preview",
  "/talent/career/resumes": "/v2/resumes",
  "/talent/career/cover/editor": "/v2/cover",
  "/talent/career/cover/preview": "/v2/cover/preview",
  "/talent/career/cover-letters": "/v2/cover-letters"
};

// 동적 주소 — [패턴, v2 주소 만들기]
const PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^\/talent\/jobs\/([^/]+)$/, (m) => `/v2/jobs/${m[1]}`],
  [/^\/talent\/insights\/[^/]+\/([^/]+)$/, (m) => `/v2/guide/${m[1]}`],
  [/^\/talent\/activity\/([^/]+)$/, (m) => `/v2/activity/${m[1]}`],
  [/^\/talent\/company\/([^/]+)$/, (m) => `/v2/companies/${m[1]}`],
  // 이력서 상세 — 맞춤(tailor)은 아직 기존 화면이라 /resumes/[id] 만
  [/^\/talent\/career\/resumes\/([^/]+)$/, (m) => `/v2/resumes/${m[1]}`]
];

/** 기존 talent 주소에 맞는 v2 주소(없으면 null). 끝의 '/' 는 무시한다. */
export function talentToV2(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (EXACT[path]) return EXACT[path];
  for (const [re, to] of PATTERNS) {
    const m = path.match(re);
    if (m) return to(m);
  }
  return null;
}
