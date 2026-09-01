# Career Launch — AI 코치 평가 결과 (Phase 13)

## 실행 환경
- 로컬. **실제 OpenAI 호출 eval 미실행** — 크레딧 소진 상태 + "실제 API 비용 크게 발생하는 평가 무단 실행 금지"(§21) 준수. GA 미연결.
- 검증 가능: 결정적(코드) 테스트·프롬프트/기억 구조 검토·스키마 검증. **모델 품질(의미) 항목은 NOT MEASURED**.
- 사용 모델(코드상): `OPENAI_MATCHING_MODEL`(기본 gpt-4o)·폴백 gpt-4o-mini, `OPENAI_INTERVIEW_MODEL`. Responses API + json_schema. **실측 설정은 배포 환경 확인 필요.**
- prompt version: `WEEK2_PROMPT_VERSIONS`·`WEEK34_VERSIONS`(코드). V1/V2 프롬프트 공존 — careerChatComplete는 대화형(reply)만 코치 원칙 주입, V1 경로 무변경.

## 구조 검증 결과 (결정적, PASS)
| 문제(사용자 지적) | 구조적 방어 | 결정적 검증 |
|---|---|---|
| 반복 질문 | `careerProfileAsksNeeded` confirmed 제외 + directive "확정 정보 재질문 금지" | ✅ 단위 11건(재질문 방지·확정 보존·충돌) |
| 한 번에 많은 질문 | directive "질문 한 번에 하나만" | 프롬프트 검토 ✅ / 실측 NOT MEASURED |
| 이미 준 정보 미활용 | `buildCareerProfileContext` 주입 | ✅ 컨텍스트 빌더 |
| 설문처럼 느껴짐 | directive "질문 전 해석·초안 먼저" | 프롬프트 ✅ / 실측 NOT MEASURED |
| 근거 없는 추천/허위 경력 | `NO_FABRICATION`·unsupported·needsConfirmation | ✅ 스키마·상수 / 실측 NOT MEASURED |
| 주차 바뀌면 망각 | `loadRecentConsults(2)` cross-week | ✅ 헬퍼 / 실측 NOT MEASURED |
| 결과물↔대화 불일치 | 서버 검증·validationData·SourceLink | ✅ 스키마 |
| 대화 완료했는데 상태 안 바뀜 | 서버 완료판정(computeWeekN) — AI가 상태 확정 안 함 | ✅ 서버 로직 |

## Persona별 결과
| Persona | 상태 | 사유 |
|---|---|---|
| A~H | **NOT TESTED(모델 품질)** | 실 OpenAI eval 미실행(크레딧/비용). 구조적 방어는 시나리오 문서에 매핑 |
- 결정적 항목(권한·재질문 방지·스키마·상태전환)은 A~H 공통으로 **PASS**(코드/단위 테스트).

## 핵심 지표
| 지표 | 값 |
|---|---|
| 평균 품질 점수 | **NOT MEASURED** |
| 반복 질문률(실측) | **NOT MEASURED** (구조적 dedup은 검증됨) |
| 사실 오류 수(실측) | **NOT MEASURED** (NO_FABRICATION 구조 존재) |
| 안전 위반 수(실측) | **NOT MEASURED** (IV_SAFETY 구조 존재) |
| 평균 대화 단계·token·응답시간·재시도율 | **NOT MEASURED** (CareerAiCostDaily로 실운영 시 집계) |

## AI 구조 변경
- **없음(코드).** 이유: 기억/재질문방지/사실성/안전 구조가 이미 스펙 원칙을 충족하고, **모델 품질을 실측 eval로 검증할 수 없는 상태에서 프롬프트를 변경하면 회귀를 검증할 수 없음**(§21 "근거 없이 모델/프롬프트 변경 금지"). → 프롬프트·기억 구조 유지, 문서화·검증만 수행.

## 남은 문제
- **P0/P1**: 구조·결정적 수준에서 없음.
- **P1(측정)**: 모델 품질 실측 미완 → 실 eval 전 완전 PASS 불가.
- **P2**: 실 OpenAI eval 하네스(스크립트) 신설 여부는 크레딧·비용 승인 후.

## 다음 재평가
크레딧 충전 후 Persona A~H × 6상황 실행 → 점수표 채점 → 반복질문률/사실성/안전성 실측 → 이 문서 갱신.
