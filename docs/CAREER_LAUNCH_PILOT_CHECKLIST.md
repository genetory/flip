# Career Launch — 파일럿 체크리스트 (Phase 10)

실제 대학·기관 파일럿 모집 전 확인. 자동 판정 항목은 `/career-launch/ops/pilot/:cohortId/readiness`(`computeReadiness`)에서 확인.

## 준비 (D-7 이전)
- [ ] 스테이징 `migrate deploy` — 리뉴얼 마이그레이션 전부 반영, 이미지 직접 pull 검증
- [ ] **OpenAI 크레딧 충전**(AI 코칭 전제)
- [ ] `Organization` 생성 + org_admin 지정 + `OrganizationLicense`(좌석)
- [ ] 프로그램 템플릿 → `CareerCohort` 생성(isPilot·featureFlags·participantLimit·pilotStart/End)
- [ ] 주차 일정(`CareerCohortWeek`)·세미나(`CareerSeminar`)
- [ ] `monitoringConfiguration.kpiTargets` 설정(기수별 목표)
- [ ] 참여자 초대(링크/CSV) — **외부 이메일 자동발송 없음**(링크·코드만)
- [ ] 개인정보·AI 이용 안내 게시
- [ ] 준비 체크리스트 필수 항목 전부 충족(`readiness.ready=true`)

## 데이터 안전
- [ ] 테스트 데이터는 **개발/테스트 DB에서만** seed(로컬 `careerbridge` 실DB 삽입 금지)
- [ ] 테스트 계정과 실 참여자 분리
- [ ] 분석 이벤트에 원문·개인정보 미포함 확인

## 기능 점검 (UAT — `CAREER_LAUNCH_UAT.md`)
- [ ] 신규 4주 완주(A) · 중단 복귀(B) · 오류 복구(C) · V1 기존(D)
- [ ] 관리자(E): 운영 홈·개입·모니터
- [ ] 기관(F): **격리 403 테스트**(타 기관 접근 차단)

## 측정 점검
- [ ] North Star + 핵심 KPI 조회(`/ops/kpi/:cohortId`) 정상
- [ ] 주의 큐(`/ops`)·파일럿 모니터(`/ops/pilot`) SLA·중단조건 표시
- [ ] 파일럿 설문(`CareerPilotSurvey`) 수집

## 출시 차단 기준 (발견 시 P0/P1)
로그인·권한 오류 / 타 사용자·기관 노출 / 진행·대화·입력 유실 / 결과물 저장 실패·중복 / 완료 후 다음 단계 미오픈 / V1 손실 / 모바일 핵심 진행 불가 → **파일럿 중단**, 재현 절차 기록.

## 파일럿 중 (일일)
- [ ] 운영자 매뉴얼 매일 오전/오후 루틴
- [ ] 중단조건 감지 시 flag 비활성화·복구
- [ ] 개입 SLA 준수

> 실제 파일럿 활성화·사용자 초대·프로덕션 배포는 **명시 승인 후**에만.
