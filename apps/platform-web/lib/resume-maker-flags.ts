// 공고 맞춤·모의 면접은 아직 비공개(작업중). 로컬 개발(next dev)에서는 그대로 사용하고,
// 빌드/배포(스테이징·프로덕션)에서는 '준비 중'으로 표시한다.
// 공개 시점에 이 플래그만 false 로 바꾸면 된다.
export const RESUME_TOOLS_WIP = process.env.NODE_ENV !== "development";
