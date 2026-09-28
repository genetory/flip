// Master kill switch for every AdSense placement on the site.
//
// 2026-09-28: AdSense 의 "low value content" 지적이 해소되어 다시 켰다(사용자 확인).
//
// 다시 지적을 받으면 여기만 false 로 되돌린다 — 그러면 로더 스크립트·사이드바 유닛·
// 인피드 유닛이 사이트 어디에도 나가지 않는다. 지적받은 상태로 광고 코드를 남겨두면
// 위반 기간만 길어지므로, 부분 제거가 아니라 이 스위치로 한 번에 끄는 것이 원칙이다.
//
// 실제로 로더가 나가려면 NEXT_PUBLIC_ADSENSE_CLIENT_ID 도 설정돼 있어야 한다
// (app/layout.tsx). 이 값은 GitHub Environment(production)에만 두고 staging 에는
// 두지 않는다 — staging.aply.global 은 심사 대상 도메인이 아니고, 테스트 도메인에
// 광고를 띄우는 것은 정책상 문제가 될 수 있다.
export const ADS_ENABLED = true;
