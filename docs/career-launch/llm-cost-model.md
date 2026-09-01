# Career Launch — LLM 비용 모델 (Phase 15)

## 원칙
- **실 OpenAI 호출 0건.** 실제 token·latency·비용은 **NOT MEASURED**. 아래는 코드 구조 기반 호출 수 추정 + 가격표 위치이며, 실측 전까지 신뢰 지표는 **호출 수·(추정)토큰 구조**까지로 제한한다.
- 개인정보(메시지·이력서·자소서·면접 답변 원문, 이름·이메일·전화)는 비용 로그에 기록하지 않는다 — 현재 `CareerAiCostDaily`는 콘텐츠를 저장하지 않음(확인됨).

## 호출 경로
- 모든 Career Launch LLM은 `careerChatComplete`(apps/api/src/index.ts) 단일 헬퍼 경유. **약 40개 작업**.
- 모델: 전 작업 **단일 `OPENAI_MATCHING_MODEL`(기본 gpt-4o)**, 실패 시 폴백 `gpt-4o-mini`(1회). 작업별 모델 분리 없음(P2 제안).
- 구조화 출력: Responses API `json_schema`(strict 선택). 폴백 경로는 `json_object`(스키마 강제 없음).

## 작업 유형 × 모델 × 프롬프트 버전 × 호출 특성
| 작업 | feature 키 | 모델 | 캐시형(재생성 방지) | 진입 시 자동호출 |
|---|---|---|---|---|
| 진단 대화 | `diagnosis_chat` | gpt-4o | 아니오(대화) | **예(P0-1)** |
| 직무 대화 | `job_chat` | gpt-4o | 아니오 | 아니오(started 게이트) |
| 자료 대화 | `material_chat` | gpt-4o | 아니오 | **예(P0-1)** |
| 경험 채굴 | `experience_mining` | gpt-4o | 아니오 | **예(P0-1)** |
| 면접 대화 | `interview_*` | gpt-4o | 아니오 | **예(P0-1)** |
| 직무 추천(W1) | `w1_recommendations`/`job_recommendation` | gpt-4o | 예(hash) | 아니오 |
| 이력서 생성(W2) | `w2_resume_draft` | gpt-4o | 예 | 아니오 |
| 자소서 생성(W2) | `w2_cover_draft` | gpt-4o | 예 | 아니오 |
| 점수/일관성(W2) | `w2_*_score`,`w2_consistency` | gpt-4o | 예 | 아니오 |
| 면접 질문/평가(W3) | `iv_qgen`,`iv_answer_eval`,`interview_score` | gpt-4o | 일부 | 아니오 |
| 오답/성장(W4) | `iv_coaching`,`iv_growth` | gpt-4o | 예 | 아니오 |
| 리포트/피드백 | `week_feedback`,`final_feedback`,`career_report` | gpt-4o | 예 | 아니오 |

## Token 구조(구조 기반, 실측 아님)
- **입력 팽창 요인(P1)**: 대화형은 매 턴 **전체 transcript(최대 80msg×2000자) + 전체 Career Profile 요약 + 시스템 프롬프트 + 최근 상담 2건 + 현재 결과물 JSON** 을 재전송. 요약·프롬프트 캐싱 없음 → 턴 수에 비례(최악 준-quadratic).
- **출력 상한 없음(P1)**: `max_output_tokens` 미설정 → gpt-4o($10/M out)에서 무제한. 런어웨이 1건 상한 없음.
- 즉시 재사용/single-flight(이번 턴): 동일 입력 동시·즉시 중복 호출을 1회로 합쳐 **중복 청구 제거**(TTL 기본 10s).

## 가격 출처 (하드코딩 금지 원칙)
- 단가는 코드에 이미 분리된 테이블 사용: **`apps/api/src/career-pilot.ts`의 `LLM_PRICING`** (per-1M USD): gpt-4o 2.5 / 10, gpt-4o-mini 0.15 / 0.6, gpt-5 1.25 / 10, gpt-5-mini 0.25 / 2, default 2.5 / 10.
- 비용 추정: `estimateLlmCost(model, inTok, outTok)`(career-pilot.ts). **주의: 이 표가 실제 OpenAI 공식가와 드리프트할 수 있음** — 검증 전까지 비용은 "이 표 기준 추정치"로만 보고. 표는 코드에서 갱신 가능(별도 상수 계층).

## 기록 필드 (현재 vs 제안)
`CareerAiCostDaily`(일일 집계, unique `[cohortId,feature,dateKey,model,promptVersion]`).
- **현재 기록**: calls, inputTokens, outputTokens, retries, failures, estCostUsd, model, feature, cohort, day.
- **누락(P1 제안 — 마이그레이션 필요, 미실행)**: `latencyMsSum`/avg, `cachedTokens`(컬럼 `cacheHits` 존재하나 **미기록**), request_id(요청 단위 감사), week/mission 차원. 실패 시 0 토큰 기록(실 소모 유실).
- 금지(확인됨, 유지): 메시지/이력서/자소서/면접 원문, 이름·이메일·전화, system prompt 원문, API key.

## 규모별 월간 시뮬레이션 — 계산 구조(수치 NOT MEASURED)
1인 프로그램 완주 시 작업별 예상 호출 수(대화 턴 수는 fixture로 측정 필요 → 현재 NOT MEASURED):
```
per_user_calls   = Σ(작업별 호출 수)            # W1..W4 + 리포트, fixture 측정 필요
per_user_in_tok  = Σ(작업별 평균 입력 token)     # 실측 필요
per_user_out_tok = Σ(작업별 평균 출력 token)     # 실측 필요
monthly_cost(N)  = N × ( per_user_in_tok/1e6 × price_in
                       + per_user_out_tok/1e6 × price_out )   # price = LLM_PRICING[model]
```
| 규모 N | 계산 | 비고 |
|---|---|---|
| 10 | `monthly_cost(10)` | 파일럿 |
| 100 | `monthly_cost(100)` | |
| 500 | `monthly_cost(500)` | |
| 1,000 | `monthly_cost(1000)` | |
| 5,000 | `monthly_cost(5000)` | 이 규모에서 관리자 목록 P0-4·rate limit 인스턴스 배수 문제 표면화 |

**중복/재시도/요약 비율** = 이번 single-flight로 중복 청구는 서버에서 제거(동일 인스턴스 한정). 실제 중복률·retry율·요약 호출률은 **실 트래픽 계측 필요(NOT MEASURED)**.

## 재평가 조건
크레딧/스테이징 확보 시: Persona fixture로 작업별 실 token·latency 캡처 → 위 표 채움 → `estCostUsd` 정확도 검증 → 가격표 공식가 대조 → 이 문서 갱신.
