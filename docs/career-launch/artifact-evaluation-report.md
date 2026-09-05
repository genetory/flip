# Career Launch — 결과물 평가 결과 (Phase 14)

## 실행 환경
- 로컬. **실제 OpenAI 호출로 콘텐츠 생성/평가 미실행** — 크레딧 소진 + "실제 API 비용 대량 발생 금지"(§21). GA 미연결.
- 검증 가능: 결과물 생성/저장/버전/일관성 **구조**·스키마·결정적 테스트. **모델 콘텐츠 품질 항목은 NOT MEASURED**.
- 사용 모델(코드): `OPENAI_MATCHING_MODEL`(기본 gpt-4o)·폴백 mini, Responses API + json_schema. prompt version `WEEK2_PROMPT_VERSIONS`·`consistency_v1`. V1/V2 프롬프트 공존, V1 결과물 무변경.

## 결과물별 판정
| 결과물 | 판정 | 사유 |
|---|---|---|
| 직무 추천 | **PARTIAL** | 스키마(근거·연결경험·추론여부) 구조 확인 / 콘텐츠 NOT MEASURED |
| Career Profile | **PASS(구조)** | 6상태 구분·inferred 자동승격 차단·단위 11테스트 |
| 이력서 | **PARTIAL** | SourceLink 근거·NO_FABRICATION·버전 구조 / 콘텐츠 NOT MEASURED |
| 자기소개서 | **PARTIAL** | 동일 |
| 예상 면접질문 | **PARTIAL** | 내부 목적/평가역량/난이도 스키마 / 콘텐츠 NOT MEASURED |
| 모의면접 평가 | **PARTIAL** | 8축 평가·근거·IV_SAFETY 구조 / 콘텐츠 NOT MEASURED |
| 오답노트 | **PARTIAL** | 상태전이·통과기준 구조 / 콘텐츠 NOT MEASURED |
| 개선 답변 | **PARTIAL** | attempt·pass 판정 구조 / 콘텐츠 NOT MEASURED |
| 최초·최종 비교 | **PARTIAL** | comparisonData·버전 주의(다른 질문셋 비교 경고) / 콘텐츠 NOT MEASURED |
| 성장 리포트 | **PARTIAL** | growthData·비교불가시 0·과장 금지 구조 / 콘텐츠 NOT MEASURED |
| 실제 지원 실행계획 | **PARTIAL** | nextActions 구조 / 콘텐츠 NOT MEASURED |

## 오류 지표
| 지표 | 값 |
|---|---|
| 허위 사실 수(실측) | **NOT MEASURED** (NO_FABRICATION·unsupported 구조 존재) |
| 결과물 간 사실 불일치(실측) | **NOT MEASURED** / 결정적 검사기(`checkArtifactConsistency`)로 critical 충돌 시 finalize 차단 — 로직 검증 10테스트 |
| 확인 없이 확정된 중요 정보 | **0(구조)** — critical 충돌·근거없음 시 finalizeBlocked |
| 상투 표현 수 | **NOT MEASURED** |
| 사용자 수정 유실 | **0(구조)** — CareerDocumentVersion 버전 보존 |
| 중복 결과물 | **0(구조)** — 버전/upsert |
| schema 오류 | **0** — zod·json_schema 서버 검증 |

## 구현 변경
- 신규 **`apps/api/src/career-artifact-consistency.ts`**: 구조화 사실 기반 교차 일관성 검사(match/paraphrase/needs_confirmation/conflict/unsupported, critical 충돌 시 finalizeBlocked). 단위 테스트 10건. **LLM 무의존.**
- 문서 3종(rubric·scenarios·report). 프롬프트·에디터·스키마·저장 구조는 **무변경**(이미 원칙 충족 + 콘텐츠 실측 불가 상태에서 프롬프트 변경은 회귀 검증 불가).

## 남은 문제
- **P0/P1**: 구조·결정적 수준 없음.
- **P1(측정)**: 콘텐츠 품질 실측 미완 → 완전 PASS 불가.
- **P2**: 일관성 검사기를 실제 결과물 확정 흐름(패키지 finalize 엔드포인트)에 연결(현재 순수 모듈·테스트만); 실 OpenAI eval 하네스는 크레딧 후.

## 다음 재평가
크레딧 충전 후 Persona A~F × 결과물 세트 생성 → 10항목 채점 + 허위/불일치/상투 실측 → 일관성 검사기 finalize 연결 → 이 문서 갱신.
