# Aply QA 가이드

자동화가 잡지 못하는 영역을 사람이 검증하는 방법. CI/CD가 모든 PR에서 빌드 / 스모크 / 배포를 자동으로 검증하니까, 팀원이 직접 봐야 하는 건 **자동화가 못 보는 것**에만 집중합니다.

## 자동화가 이미 보장하는 것 (수동 X)

매 staging 배포에서 자동으로 검증되며, 깨지면 Discord에 `❌ smoke FAILED` 알림 + PR 머지 차단:

- 홈 / 로그인 / 회원가입 / 포지션 페이지 HTTP 200
- API `/health`, `/positions`, `/positions/meta` 정상 응답 + 스키마
- CORS 헤더 (staging origin echo)
- OAuth 버튼 4개(이메일/Naver/Google/Kakao) UI 렌더링
- 정적 자산 (favicon, manifest) 도달

스모크는 `tests/smoke/web.smoke.spec.ts`에 있습니다. 신규 자동화 후보가 생기면 여기에 추가.

---

## QA 책임 분담

| 빈도 | 담당 | 소요 | 범위 |
|---|---|---|---|
| **매 PR** | 변경자 본인 | 5~10분 | 변경 페이지 happy path + 인접 회귀 |
| **매 sprint(주 1~2회)** | 전담 QA 1명 | 30분~1시간 | 3페르소나 전체 E2E |
| **매 release** | 운영자 | 15분 | production 머지 직전 + 머지 후 smoke |
| **매 월 1회** | 팀 전체 | 1시간 | 다국어/실기기/외부 연동 심층 |

---

## A. 매 PR마다 (변경자 본인)

자동 생성된 PR 본문의 QA checklist에 마킹.

기본 체크:
- [ ] 변경한 페이지를 **모바일 viewport** (Chrome DevTools → iPhone 14)에서 한 번
- [ ] 변경한 페이지를 **한국어 + 영어** 둘 다 확인 (i18n 깨짐 자주 발생)
- [ ] 변경한 API/페이지를 **로그인 상태 + 비로그인 상태** 양쪽
- [ ] 인접 기능 1개가 깨지지 않았는지 (회귀)

기능별 추가:
- 폼 변경 → 빈 값 / 너무 긴 값 / 특수문자 입력
- API 변경 → 권한 누수 (다른 회사 데이터 조회 가능한지)
- DB 마이그레이션 변경 → 로컬에서 `prisma migrate reset` 후 깨끗하게 적용되는지

---

## B. 매 Sprint (전담 QA)

3개 페르소나의 전체 E2E를 staging에서 1회씩.

### 👤 Student / Candidate

1. 회원가입 (이메일 + OAuth 4종 중 1개)
2. 이메일 인증 메일 도착 → 클릭 → 인증 완료
3. 프로필 완성 (학력, 경력, 어학, 활동, 관심 직무 5개 섹션)
4. 프로필 사진 업로드 (Azure Blob 동작 확인)
5. AI 매칭 분석 실행 → 점수 / 추천 포지션 노출
6. 포지션 검색 + 필터(직무 카테고리, 소스 토글) + 정렬(최신/마감순) + 페이지네이션
7. 포지션 상세 → 찜 → 지원
8. 외부 포지션(Wanted) 클릭 → 새 탭으로 원티드 이동
9. 커뮤니티 글 작성 + 댓글 + 좋아요
10. 알림(Notification) 도착 (지원 알림)
11. 로그아웃 → 다시 로그인

### 🏢 Partner

1. 회원가입 (대표자 또는 멤버 가입 코드로 합류)
2. 회사 프로필 작성
3. 회사 인증 자료 업로드 → ops 승인 대기 상태 확인
4. 포지션 등록 → ops 승인 대기 → 발행 후 student 측에 노출
5. 지원자 리스트 확인 → 상태 변경 (서류 검토 → 면접 제안)
6. 면접 슬롯 제안 → student가 선택 시 알림
7. 어사인먼트 발행 / 회수
8. 팀 멤버 초대 (초대 코드 생성 → 다른 계정으로 합류)
9. 회사 정보 수정 → 재승인 플로우

### ⚙️ Ops

1. 신규 파트너 가입 승인 / 반려
2. 포지션 리비전 검토 → 승인/반려 사유 입력
3. 매칭 로그 확인 (AI 매칭 결과 기록)
4. 크롤러 수동 실행 (Wanted/Buddies/Kowork) → 결과 카드 + Discord 알림
5. 알림(공지사항) 발송 → 모든 사용자에게 도달 확인
6. 사용자 정지 / 해제
7. 시스템 설정 변경 (자동 매칭, 이메일 발송 모드 등)

---

## C. 매 Release (운영자)

자동 생성된 develop → main PR을 머지하기 전:

- [ ] PR 본문 QA checklist 마킹 확인
- [ ] staging에서 변경된 영역 5분 sanity check
- [ ] 깨진 부분 발견 시 develop에 fix 후 자동 재검증 대기 (PR 자동 업데이트됨)

머지 후 5분 내:

- [ ] Discord에 `✅ production deploy success` 도착
- [ ] https://aply.global 메인 화면 정상
- [ ] 로그인 1회 (production 계정으로)
- [ ] 포지션 상세 1회

production 사고 발생 시:

- [ ] **즉시 롤백** → main에 직전 커밋으로 revert PR 생성 + 자동 머지
- [ ] Discord에 사고 메시지 (재현 방법 + 영향 범위)
- [ ] 사후 fix는 develop에서 다시 통상 사이클로

---

## D. 매 월 1회 (팀 전체)

심층 점검 — sprint 단위로는 안 도는 영역.

언어 / 디자인:
- [ ] 6개 언어 (ko/en/zh-CN/vi/ja/id) 메인 + 포지션 + 로그인 한 번씩
- [ ] 일본어 / 인도네시아어 폰트 깨짐 없는지
- [ ] 한자가 적절히 simplified vs traditional

OAuth / 인증:
- [ ] Naver / Google / Kakao / 이메일 모두 실제 로그인 성공
- [ ] OAuth 도중 취소 시 에러 페이지가 사용자 친화적

이메일:
- [ ] 회원가입 인증 메일 도착 (Gmail / Naver / 외부 도메인 모두)
- [ ] 스팸 폴더 안 가는지

외부 연동:
- [ ] Azure Blob 이미지 업로드 + 표시
- [ ] Discord 웹훅 5개 + 모두 (signup, position apply, community, etc.)
- [ ] GA4 Realtime에 이벤트 잡힘 (sign_up, login, view_position, apply_position)
- [ ] Wanted importer 일 1회 자동 실행되고 신규 포지션 들어옴

디바이스 / 네트워크:
- [ ] 실기기: iOS Safari (iPhone) + Android Chrome
- [ ] 느린 네트워크: Chrome DevTools "Slow 4G" 시뮬레이션
- [ ] 반응형: 320px / 768px / 1280px / 1920px 폭

성능:
- [ ] 메인 페이지 Lighthouse 점수 (Performance ≥ 70)
- [ ] LCP < 4s

---

## 자주 놓치는 edge case 체크리스트

### 빈 상태

- [ ] 포지션 0개일 때 empty view 메시지
- [ ] 지원 이력 0건일 때
- [ ] 찜 0개일 때
- [ ] 알림 0개일 때
- [ ] 커뮤니티 글 0건일 때

### 오류 상태

- [ ] 로그인 비번 3회 실패 시 안내 메시지
- [ ] 만료된 세션으로 API 호출 → 자동 refresh 또는 로그인 화면 전환
- [ ] OAuth 도중 취소 → 사용자 친화적 에러 페이지
- [ ] 이메일 인증 만료된 링크 클릭 → 재발송 버튼
- [ ] 파일 업로드 용량/형식 초과 → 명확한 에러 메시지
- [ ] 네트워크 끊김 중 폼 제출 → 데이터 손실 방지 또는 재시도 UI

### 권한 / 보안

- [ ] 비로그인 사용자가 보호 페이지 직접 접근 → 로그인 redirect
- [ ] 다른 회사의 포지션/지원자 URL 직접 접근 → 403
- [ ] 일반 사용자가 ops 라우트 직접 URL → 403
- [ ] 파트너 멤버 권한과 대표자 권한 분리

### 라이프사이클

- [ ] 회원탈퇴 → 같은 이메일로 즉시 재가입 시도
- [ ] 파트너 멤버 강제 탈퇴 → 그 사람이 만든 포지션은?
- [ ] 만료된 포지션이 검색 리스트에서 사라짐
- [ ] 마감일 지난 포지션에 지원 시도 → 차단
- [ ] 회사 정보 변경 중 재승인 대기 상태 표시

### 동시성 / 경합

- [ ] 같은 포지션에 빠르게 2회 지원 클릭 → 1회만 등록
- [ ] 폼 작성 중 다른 탭에서 같은 데이터 수정
- [ ] 이메일 인증 링크 두 번 클릭 → idempotent

---

## QA 결과 기록

| 어디 | 무엇 |
|---|---|
| PR 댓글 | 변경자가 매 PR에서 QA checklist 체크 |
| Discord `#aply-deploys` | 발견 즉시 공유 (재현 단계 1줄) |
| Linear / Notion 버그 티켓 | 상세 재현 단계 + 스크린샷 + 환경 정보 |

심각도 기준:

| 등급 | 정의 | 대응 |
|---|---|---|
| P0 | 모든 사용자가 사용 불가 (홈 500, DB 다운) | 즉시 롤백, oncall 호출 |
| P1 | 핵심 기능 일부 사용자 사용 불가 (로그인 실패, 지원 안 됨) | release 보류, hotfix |
| P2 | 단일 기능 깨짐 또는 UI 깨짐 | 다음 PR에서 fix |
| P3 | 개선 사항 | backlog |

---

## 다음 단계 — 자동화 후보

수동 QA가 무거워지면 단계적으로 자동화로 옮길 후보:

1. **로그인 E2E (이메일)** — Playwright로 회원가입 → 인증 메일 모킹 → 로그인
2. **포지션 검색 시나리오** — 필터 + 페이지네이션 + 정렬 토글
3. **반응형 스크린샷 비교** — Percy 또는 Playwright `toHaveScreenshot()`
4. **번역 누락 감지** — 모든 i18n key가 6개 언어에 존재하는지 lint
5. **API contract 테스트** — OpenAPI 스키마 기반 schemathesis

신규 자동화는 `tests/smoke/`에 추가하면 매 staging 배포에서 자동 실행됩니다.

---

## 참고

- 워크플로우 정의: `.github/workflows/deploy-azure-containers.yml`
- 스모크 테스트: `tests/smoke/web.smoke.spec.ts`
- 로컬 스모크 실행: `npm run smoke` (또는 `npm run smoke:headed`)
- staging URL: https://staging.aply.global
- production URL: https://aply.global
- Discord 배포 채널: `DEPLOY_DISCORD_WEBHOOK_URL`이 가리키는 채널
