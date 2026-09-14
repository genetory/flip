// 대학별 공개 랜딩(talent) 설정 레지스트리.
// 메뉴에는 노출하지 않고 slug 로만 진입: /talent/university/<slug>
//
// 여기에는 '공개 브랜딩'만 둔다(대학명·슬로건·강조색·워드마크 — 모두 공개 정보).
// 학생 수·기수 코드 등 파트너/개인 관련 값은 소스에 두지 말고 런타임 API/DB 에서 읽는다.
// (공개 레포 규칙) 새 대학은 이 레지스트리에 한 줄 추가하면 페이지가 생긴다.
//
// 참고: 대학 공식 로고/심볼마크는 각 대학 브랜드 가이드상 별도 승인이 필요할 수 있어,
// 기본은 워드마크(대학명)로 온브랜드하게 렌더하고, 승인된 로고 자산이 있으면 logoUrl 로 교체.

export type UniversityLanding = {
  slug: string;
  displayName: string; // 한양대학교
  shortName: string; // 한양대
  wordmark: string; // 로고 미승인 시 표기용 워드마크
  logoUrl?: string; // 승인된 공식 로고가 있으면 지정(public/ 경로 또는 절대 URL)
  accent: string; // 강조색(대학 브랜드 컬러)
  accentDeep: string; // 그라데이션/딥 톤
  motto?: string; // 건학정신·슬로건 등 공개 문구
  // 해당 대학의 진행 중인 Career Launch 기수 초대코드가 있으면 지정 — 있으면 주 CTA 가
  // '무료 4주 프로그램 시작'(초대링크), 없으면 '무료로 시작하기'(가입)로 자동 전환(적응형).
  careerLaunchInvite?: string;
  // 랜딩에 노출할 공개 공고 큐레이션 조건(공개 /positions API 로 조회).
  jobQuery?: { foreignerEligible?: boolean; jobRoles?: string[]; locations?: string[]; limit?: number };
  noindex?: boolean; // 메뉴 미노출 단계에선 검색 색인 제외(기본 true 권장)
};

const REGISTRY: Record<string, UniversityLanding> = {
  hanyang: {
    slug: "hanyang",
    displayName: "한양대학교",
    shortName: "한양대",
    wordmark: "HANYANG UNIVERSITY",
    accent: "#0E4A84", // Hanyang Blue(딥 로열블루) — 공식 정확값은 대학 디자인경영센터 확인 필요
    accentDeep: "#0A335C",
    motto: "사랑의 실천 · The Engine of Korea",
    // careerLaunchInvite 미지정 → 적응형 CTA 가 '무료로 시작하기'(가입)로 동작.
    jobQuery: { limit: 4 },
    noindex: true
  }
};

export function getUniversityLanding(slug: string): UniversityLanding | null {
  if (!slug) return null;
  return REGISTRY[slug.trim().toLowerCase()] ?? null;
}
