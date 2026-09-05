# Career Launch — 배포 전 체크리스트 (Phase 11)

실제 배포는 명시 승인 후. 아래를 모두 확인한 뒤 파일럿 모집.

## 코드
- [ ] typecheck(api/web) 0 · production build 0(web 173/173)
- [ ] unit test(pure modules: profile·week1·week2·week34·league·pilot·org·kpi) 전건
- [ ] integration test(6종, DB 원복)
- [ ] lint — Next 16 `next lint` 제거·독립 ESLint 없음(현황: tsc+build 대체) ⚠️
- [ ] E2E — Playwright config·spec 부재(현황: 미실행) ⚠️
- [ ] database migration 검토(리뉴얼 마이그레이션 순서 replay)
- [ ] feature flag 검토(기수 단위)
- [ ] **V1 회귀**: 레거시 URL·결과물·완료상태 유지

## 보안
- [ ] 권한 테스트: 미로그인 401·권한없음 403
- [ ] **기관 격리 테스트**: 타 기관 orgId/participant/report 접근 403(requireOrgPerm)
- [ ] 사용자 격리: A가 B의 profile/artifact/conversation/file 접근 차단(self-스코프)
- [ ] secret 검사: `.env` 미커밋·NEXT_PUBLIC secret 없음(확인됨)
- [ ] 로그 개인정보 검사: Authorization/token/원문/이메일 미기록
- [ ] rate limit 검사(AI 엔드포인트)
- [ ] 보안 헤더(CSP·X-Frame-Options·X-Content-Type-Options·Referrer-Policy·HSTS) — **배포 환경에서 확인**(외부 도메인·폰트·스토리지 출처 조사 후)
- [ ] 관리자 라우트 검색엔진 노출 차단(robots)

## AI
- [ ] prompt version·모델 설정(OPENAI_* env) 확인
- [ ] timeout·retry·비용 상한(rateLimit·quota) 확인
- [ ] 개인정보 최소 전송(Profile 요약 우선) 확인
- [ ] 사실 확인 흐름(needs_confirmation·SourceLink) 확인
- [ ] 안전 응답(위기→human_review, NO_FABRICATION) 확인
- [ ] **OpenAI 크레딧 충전**

## 운영
- [ ] 운영자 계정·기관 설정·프로그램 기간·코치 배정 확인
- [ ] 긴급 연락 체계·장애 대응 문서(`CAREER_LAUNCH_INCIDENT.md`)
- [ ] KPI 이벤트·`/ops/kpi` 확인
- [ ] **파일럿 테스트 계정 제거 계획**(개발 DB seed는 실DB와 분리)

## 배포
- [ ] 스테이징 검증(migrate deploy + 이미지 직접 pull)
- [ ] DB 백업 확인 · migration 순서 · rollback 방법(additive→테이블 삭제 불필요)
- [ ] 배포 후 smoke test(엔드포인트 401·핵심 화면)
- [ ] 모니터링(`/ops` 주의 큐·`/ops/pilot` 중단조건)
- [ ] 첫 24h 집중 관찰: AI 실패율·저장 실패·개입·비용

## 정책 결정 필요(배포 전)
- [ ] **데이터 보관기간**(직접식별·경력·상담·운영) — `POLICY DECISION REQUIRED`
- [ ] **삭제·탈퇴 시 Career Launch 데이터/백업 처리** — `POLICY DECISION REQUIRED`
- [ ] **법적/계약 보존 데이터 구분** — `POLICY DECISION REQUIRED`
