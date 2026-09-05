# Career Launch — 성능 기준선 (Phase 15)

## 환경
- **로컬만.** 배포·스테이징 없음. 실제 사용자 데이터·운영 DB 부하·실 OpenAI 부하 테스트 없음.
- 앱: `apps/platform-web`(Next 16 App Router, React 19, webpack, Node 24) + `apps/api`(Express + Prisma + Postgres).
- Base commit: `f516515` + 작업 트리(미커밋). 측정 도구: 정적 코드 분석 + tsc + build. **Lighthouse/RUM/부하 하네스 없음.**

## 실행 명령어
```
# 타입체크
npx tsc --noEmit -p apps/platform-web/tsconfig.json
npx tsc -p apps/api/tsconfig.json --noEmit
# 빌드(프로덕션)
npm run build -w apps/platform-web   # next build --webpack
npm run build -w apps/api            # tsc
# 순수 모듈 단위 테스트(무 DB)
npx tsx apps/api/scripts/test-career-week1.ts   # week2/week34/league/kpi/org/profile/pilot/artifact-consistency 동일
# E2E 스모크
npm run smoke
```

## 측정 가능 / 불가
| 항목 | 상태 |
|---|---|
| 쿼리 형태·N+1 카운트·EXPLAIN | 측정 가능(로컬 Postgres + Prisma 로깅) |
| lost-update 재현(동시 PATCH) | 측정 가능 |
| 페이지 진입 시 LLM 호출 발생 | 측정 가능(네트워크 탭) |
| tsc/build/pure test | 측정 가능 |
| **초기 렌더 시간·FCP·LCP·CLS** | **NOT MEASURED**(Lighthouse/RUM 없음, dev≠prod) |
| **bundle 크기(아이콘 tree-shake)** | **NOT MEASURED**(analyzer 미설치) |
| **실 LLM latency·token·비용** | **NOT MEASURED**(실 API 미호출) |
| **다중 인스턴스 rate limit·pool 경합·프로덕션 row 볼륨** | **NOT MEASURED**(스테이징 필요) |
| **동시 사용 부하(p95 등)** | **NOT TESTED**(부하 하네스 없음) |

## 대상 화면 — 구조적 병목(수정 전)
| 화면 | 수정 전 상태 | 지표 |
|---|---|---|
| Career Launch 랜딩 `/career-launch` | 로그인 후 대시보드로 리다이렉트만 | 저위험 |
| 참여자 대시보드 `/dashboard` | 마운트 시 **7 요청 중복**(server VM + 레거시 6 fetch), 전 CSR·무캐시 | P1 |
| AI 상담(진단/자료/면접/경험) | **마운트 즉시 LLM 호출**(진입=청구) | P0-1 |
| 1주차 직무 탐색 `/jobs` | `started` 게이트로 진입 시 LLM 없음(올바른 패턴) | 기준 |
| 2주차 에디터 `/week/2` | 결과 카드 다수, 각 생성 버튼(캐시형); 동시 더블클릭 중복 생성 | P0-2 |
| 3주차 모의면접 `/week/3` | 면접 채팅 마운트 즉시 LLM | P0-1 |
| 4주차 오답노트 `/week/4` | 성장 리포트 upstream 오류 시 결정 산출물 폐기 | P1 |
| 결과물 보관함 `/deliverables` | 단일 fetch, 저위험 | OK |
| 관리자 참여자 목록 `/ops/students` | **무한·무필터 4테이블 findMany**, 전체 state/이력서/자소서 JSON을 목록에 로드, 필터·페이지네이션 클라이언트 | P0-4 |
| 관리자 참여자 상세 `/ops/students/:id` | 키 기반 5 findUnique 병렬, 적절 | OK |
| KPI 대시보드 | 코호트 스코프 배치(`in: ids`), N+1 없음 | OK |

## 수정 전 → 수정 후 (이번 턴 적용분)
| 항목 | 수정 전 | 수정 후 | 개선율 |
|---|---|---|---|
| OpenAI 요청 timeout | SDK 기본 **600s** × retry, 양 경로 | env `OPENAI_TIMEOUT_MS`(기본 **120s**) + maxRetries 명시 | 멈춘 요청 점유 시간 상한 ↓ (실측 latency NOT MEASURED) |
| 동시 중복 LLM 요청 | 방어 없음(클라 버튼만) | 서버 single-flight + TTL 재사용(`LLM_DEDUP_TTL_MS` 기본 10s) | 동일 입력 동시/즉시 중복 → **1회 호출로 합침**(회귀 재현으로 검증, 실 API NOT MEASURED) |
| progress 동시 저장 lost-update (P0-5) | read-merge-write, 락·트랜잭션 없음 | Serializable 트랜잭션 + 재시도 헬퍼(`updateCareerProgressState`), PATCH·resume-chat 적용 | 자동저장 vs AI저장 직렬화(동일 DB). 나머지 ~26 writer는 점진 이식(PARTIAL) |

## 측정 한계
- 위 "수정 후"의 실제 비용·latency 절감량은 **실 OpenAI 호출 없이는 정량화 불가(NOT MEASURED)**. 로직·구조 수준에서만 검증(typecheck + 리뷰).
- dev 모드 수치는 production build와 다르므로 어떤 렌더 수치도 프로덕션으로 단정하지 않음.
- single-flight/rate limit은 **인메모리·per-instance** — 다중 Azure 인스턴스에선 인스턴스 간 중복을 막지 못함(→ `llm-cost-model.md`·`load-test-report.md` 한계 참조).

## 남은 P0/P1(보고됨, 미구현 — 승인/협조 필요)
- **P0-1 auto-LLM 게이트**(4개 채팅) — 클라 UX 변경(시작 화면). 승인 후.
- **P0-4 `/ops/students` 페이지네이션** — FE+BE 협조 또는 요약 컬럼 마이그레이션. 승인 후.
- **P0-5 잔여** — `state` 를 쓰는 나머지 ~26 writer에 `updateCareerProgressState` 점진 이식(코드 전용, 무마이그레이션). PATCH·resume-chat 은 완료.
- **P1 비용 필드 보강**(latency·cached token·week/mission) — `CareerAiCostDaily` 마이그레이션. 승인 후. (→ `llm-cost-model.md`)
