# Career Launch — 로컬 릴리스 준비 상태 (Phase 16)

## 검수 환경
- 로컬만. 스테이징·프로덕션 배포 없음, git push/PR 없음, 실 사용자/운영 데이터 미사용, 운영 DB migration 미실행.
- Base: 작업 트리(미커밋), HEAD `f516515` 기준. 앱: `apps/platform-web`(Next 16, React 19, webpack) + `apps/api`(Express+Prisma+Postgres).
- 검수 방법: 정적 코드 분석(전수 감사 4종) + tsc + production build + 순수 모듈 테스트. **브라우저 육안·부하·실 OpenAI 호출은 NOT MEASURED**(도구·환경 제약).

## 핵심 기능 상태 (전수 추적 검증)
17개 영역 중 **15 IMPLEMENTED**(실 엔드포인트+Prisma 모델), **2 PARTIAL(설계상)**. mock/placeholder 데이터 없음.

| 영역 | 상태 |
|---|---|
| 4주 프로그램·주차 미션·게이팅 | IMPLEMENTED (잠금은 클라 계산, 서버는 스케줄 제공) |
| Career Profile + 사용자 확인(confirm/reject/infer, revision 낙관적 동시성) | IMPLEMENTED |
| 전담 AI 코치(대화 LLM) / 대시보드 코치 메시지(규칙 기반) | IMPLEMENTED (혼합) |
| 결과물 보관함(파생 상태 뷰) | IMPLEMENTED |
| 모의면접 / 오답노트 / 성장 리포트 | IMPLEMENTED |
| 코호트 리그 / 관리자 운영 / 기관 리포트 / KPI | IMPLEMENTED |
| 보안·권한(requireRoles·requireOrgPerm·org audit) | IMPLEMENTED |
| **분석 이벤트** | **PARTIAL** — funnel은 GA 클라 전용, 자체 DB 미적재(일부 CareerActivityEvent만) |
| **AI 안전성** | **PARTIAL** — no-fabrication 등 프롬프트 지시 수준, 출력 후 프로그램 검증기 없음 |
| **성능·비용** | 비용 IMPLEMENTED(CareerAiCostDaily) / 성능 PARTIAL(latency 텔레메트리 없음) |

## 역할별 검수 결과 (정적, 흐름 회귀는 NOT TESTED)
| 역할 | 결과 | 근거 |
|---|---|---|
| 신규 참여자 4주 흐름 CTA | PASS(정적) | 핵심 흐름 깨진 CTA 0, href="#"/빈 onClick 없음 |
| 복귀 참여자(상태 복원) | PARTIAL(정적) | 진단 transcript 복원 구현(Phase 15). 브라우저 재현 NOT TESTED |
| 관리자 | PASS(정적) | ops 라우트 실데이터, 권한 requireRoles. nav 발견성 갭(§known-issues) |
| 기관 담당자 | PASS(정적) | org 격리 requireOrgPerm + audit |
| 기존 V1 | N/A | Career Launch 전면 V2, 레거시 twin 없음(next.config 308 미접촉) |
| 전체 브라우저 흐름 재수행 | NOT TESTED | 로컬 브라우저 육안 검증 환경 없음 |

## V1 호환성
- Career Launch는 전면 V2 신규 트리. next.config redirect가 `/career-launch/*` 미접촉 → **V1 데이터 손실 위험 없음**. (참고: talent 등 기존 V1 흐름은 이번 범위 밖, 미변경.)

## 테스트 결과
| 항목 | 결과 |
|---|---|
| typecheck (web) | PASS (exit 0) |
| typecheck/build (api, tsc) | PASS (exit 0) |
| production build (web) | PASS (173 pages) |
| 순수 모듈 unit test | PASS (예: artifact-consistency 10건) |
| targeted/integration(DB) test | NOT RUN (로컬 Postgres 연결 필요) |
| AI eval / artifact eval | NOT MEASURED (실 OpenAI 호출 없음) |
| E2E (Playwright smoke) | NOT RUN |
| lint | NOT RUN (Next16 `next lint` 별도) |

## migration 상태
- career migration 7종 모두 **additive**(DROP/DELETE/TRUNCATE 없음). 스키마 드리프트 없음(이번 세션 변경은 코드 전용). 미커밋(로컬). 운영 DB 미실행.

## 환경변수 상태
- `.env.example` 존재, **실제 secret 없음**(플레이스홀더만). Phase 15 optional 튜닝값(`OPENAI_TIMEOUT_MS`·`OPENAI_MAX_RETRIES`·`LLM_DEDUP_TTL_MS`) 문서화 추가. NEXT_PUBLIC 오용 없음.

## feature flag 상태
- Career Launch 전용 별도 flag 시스템 없음(진입은 role/enrollment 게이트). 위험 flag 없음.

## mock 격리 상태
- 운영 화면에 mock/샘플 데이터 없음. `RECOMMENDED_JOBS.match` 하드코딩 %는 **렌더 안 됨(dormant)**. `STUDENT` 폴백은 더미 PII 없음. 개발 인증 우회 없음.

## 보안 상태
- ops 라우트 서버측 `requireRoles([OPERATOR])`, org `requireOrgPerm` + audit. **Phase 16**: ops layout에 클라측 역할 가드 추가(비운영자 직접 URL 접근 시 셸 미렌더 + `/login` 리다이렉트, 운영콘솔과 동일 패턴). 서버 403은 그대로.

## AI 품질 / 결과물 품질 상태
- Phase 13·14 기준 구조·결정적 검증 PASS. **모델 콘텐츠 품질은 NOT MEASURED**(실 OpenAI 호출 없음). 결과물 간 일관성 검사기(`career-artifact-consistency`) 존재, finalize 연결은 P2.

## 성능 상태 (Phase 15)
- OpenAI timeout(120s)·서버 single-flight dedup·progress lost-update(Serializable 병합) 적용. 실측 latency·비용·부하 NOT MEASURED. 상세: `performance-baseline.md`·`llm-cost-model.md`·`load-test-report.md`.

## 남은 P0/P1
- **P0: 없음.**
- **P1**: 분석 funnel GA→DB 이중화(KI-1); 관리자 목록 페이지네이션(1000명+ 스케일, `load-test-report.md`); LLM context 트리밍·분산 rate limit(Phase 15 잔여). ~~growth·corrections i18n~~ → **Phase 16에서 해결**.

## Phase 16 해결 완료 (이번 정리)
- [x] 용어 버그(자소서 주차 표기) · 미사용 컴포넌트 7종·dead helper 제거
- [x] growth·corrections i18n(KI-2) · alert→toast(KI-6) · 3개 콘텐츠 페이지 너비 통일(max-w-5xl)
- [x] ops 콘솔 역할 가드(KI-5) · stale 라우트 2종 삭제 + `/profile` nav 연결(KI-3) · `interventions`·`university` nav 추가(KI-4)
- [x] 미션/주차 완료 서버 이벤트 적재(KI-1) · 주차 잠금 서버 강제(KI-8)
- [x] deliverables 페이지 i18n(감사 누락분) · 콘텐츠 페이지 너비 통일(deliverables/growth/corrections + 오늘의 상담 인트로 → max-w-5xl) · 버튼 모션 애니메이션 제거(active:scale·hover translate)

## 배포 전 확인사항(체크리스트)
- [ ] 브라우저에서 4주 전체 흐름 육안 회귀(신규·복귀)
- [ ] `/experience`·`/survey` 라우트 처리 + `ops/university` vs `orgs` 정리 결정(KI-3·KI-4)
- [ ] KI-1 분석 GA→DB 이중화 결정, KI-8 주차 서버 게이트, KI-9 `as`→zod
- [ ] 스테이징에서 실 LLM latency·비용·다중 인스턴스 rate limit 재측정
- [ ] migration 커밋 + 스테이징 `migrate deploy`
- [ ] E2E/통합 테스트 로컬 Postgres로 실행

## 최종 로컬 판정: **LOCAL RELEASE CANDIDATE WITH CONDITIONS**
P0 없음·핵심 흐름 CTA 정상·mock/인증우회 없음·build PASS·V1 손실 위험 없음. 단, **브라우저 전체 흐름 회귀·실 LLM/부하 실측이 NOT TESTED**이고 P1(i18n·관리자 스케일) 및 고아 라우트 결정이 남아 완전 RC 아님 → 조건부.
