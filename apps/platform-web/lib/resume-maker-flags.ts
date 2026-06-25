// 공고 맞춤·모의 면접 공개 게이트.
// - 로컬(next dev): 공개
// - 스테이징(staging-api.aply.global): 공개 — 테스트용
// - 프로덕션(api.aply.global): '준비 중'으로 표시(아직 비공개)
// NEXT_PUBLIC_API_URL 은 빌드 시 환경별로 주입되므로 이것으로 환경을 구분한다.
// 프로덕션 공개 시점엔 아래 식을 그냥 `false` 로 바꾸면 된다.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
export const RESUME_TOOLS_WIP = apiUrl.includes("aply.global") && !apiUrl.includes("staging");
