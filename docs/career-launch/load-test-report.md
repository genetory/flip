# Career Launch — 안정성 / 부하 검수 (Phase 15)

## 실행 범위
- 로컬 정적 분석 + typecheck + build. **실제 동시 부하 하네스 없음.** 실 외부 서비스·운영 DB·실 OpenAI에 부하 미실행.
- 따라서 아래 동시성 규모(1/5/20/50명)의 실측 오류율·p95는 모두 **NOT TESTED**. 코드 경로의 안전성만 정성 평가.

## 동시 요청 규모 결과
| 규모 | 오류율 | 평균 | p95 | 중복 생성 | 상태 충돌 | 판정 |
|---|---|---|---|---|---|---|
| 1 | — | — | — | — | — | NOT TESTED |
| 5 | — | — | — | — | — | NOT TESTED |
| 20 | — | — | — | — | — | NOT TESTED |
| 50 | — | — | — | — | — | NOT TESTED |

로컬 환경으로 신뢰할 수 없는 규모라 실행하지 않음(NOT TESTED). 부하 하네스(k6/autocannon + 로컬 mock OpenAI) 도입은 후속 제안.

## Idempotency / 중복 방지 (구조 평가)
| 시나리오 | 수정 전 | 수정 후(이번 턴) |
|---|---|---|
| 전송 버튼 연속 클릭 / Enter 연타 | 클라 버튼 비활성화만 | + **서버 single-flight**(동일 userId·feature·입력 → 1회) |
| 느린 응답 중 재전송 / timeout 후 재시도 | 중복 호출 | TTL(10s) 내 동일 입력 → 캐시 결과 재사용, 재청구 없음 |
| 서버 retry + 클라 retry 동시 | 중복 | single-flight로 합류 |
| **여러 탭/기기(다중 인스턴스)** | 중복 | **여전히 취약**(인메모리 per-instance) — 한계 명시 |
| 결과물 생성 버튼 반복(캐시형) | 완료 후엔 hash 캐시로 방지, 동시 더블클릭은 둘 다 생성 | single-flight로 동시 더블클릭도 합류 |

- **판정: PARTIAL** — 단일 인스턴스 중복은 서버에서 방어(회귀 재현으로 검증). **다중 인스턴스 교차 중복은 미방어** → 완전 방어에는 분산 idempotency(Redis 등) 필요. 영구 차단 아님(TTL 만료 후 정상 재호출).

## 저장 경쟁 상태 (구조 평가)
- **`PATCH /career-launch/progress` (P0-5) — 수정됨(코드 전용, 무마이그레이션).** `state` read-merge-write를 **Serializable 트랜잭션 + 제한 재시도(P2034/40001/deadlock)** 로 감쌌다. 재시도 시 최신 prev 재병합 → 이전 동시 변경을 덮어쓰지 않음. 공통 헬퍼 `updateCareerProgressState(userId, mutate)` 로 추출.
  - 같은 헬퍼를 **resume-chat doneSteps 쓰기**, **resume-data 리셋**, **공유 헬퍼 `setCareerStepsDone`(편집형 빌더 저장 다수 호출처)** 에 적용 → 최상위 경쟁(AI저장·에디터저장 vs 자동저장) 직렬화.
  - **PARTIAL**: 생성 완료 시 단일 스텝을 마킹하는 나머지 writer(week2~4 플로우 엔드포인트 등, 저빈도 one-shot)는 아직 평이한 upsert. 동일 헬퍼로 점진 이식 필요(P1). 대안(마이그레이션): `revision` 컬럼 낙관적 동시성(`CareerProfile` 패턴) — 클라 연동 시 교차탭까지 커버. 미실행.
  - 한계: Serializable은 **동일 DB** 내 직렬화. 검증은 로컬 동시 PATCH 재현 수준(실측 부하 NOT TESTED).
- **다단계 저장 트랜잭션 부재(P1)**: `resume-chat`가 data + mirror(Resume) + progress를 독립 write → 중간 실패 시 부분 저장. 제안: 상태 변경 다중 write를 `$transaction`으로 원자화(진행상태 병합은 위 헬퍼로 일부 해소).

## Streaming / timeout / 취소
- 스트리밍 없음(전 blocking). timeout: **수정됨**(120s, env). **클라 이탈 시 서버 취소 미구현** — 사용자가 나가도 서버는 생성 완료·청구(P1, 미수정). AbortController를 OpenAI 호출에 연결하는 후속 제안.
- 취소/부분응답이 최종 결과물로 저장되는가: 대화형은 done 플래그로만 확정 → 부분 응답이 최종본으로 저장될 위험은 낮음. 생성형은 파싱 성공 시 저장.

## Rate Limit / 사용량
- 구현: 인메모리·per-IP·per-instance 고정창 카운터. **다중 인스턴스에서 무효**(인스턴스 수만큼 배수, 재배포 시 리셋) — **완전한 운영 방어로 보고하지 않음**. 분산 스토어(Redis) + per-user 키 후속 제안.
- per-user AI 캡(`aiGate`)은 채팅 계열에만 연결, **~30개 생성 엔드포인트 누락** + 프리미엄 캡이 레거시 Talent feature명 기준(Career Launch 값과 불일치) → 실 per-user gpt-4o 지출 대부분 미캡. 후속 제안.

## 장애 격리 (구조 평가 — 양호)
| 외부 실패 | 결과 | 판정 |
|---|---|---|
| OpenAI 429/5xx | `503 AI_UNAVAILABLE`, 사용자 입력 별도 저장 유지, 폴백 모델 | PASS |
| 분석(GA/서버 이벤트) | fire-and-forget, 저장 실패 유발 안 함 | PASS |
| 알림/이메일 | Career Launch 저장 경로 밖, 롤백 안 함 | PASS |
| 채용공고 API | SSRF 가드 + 8s timeout + try/catch, 저장분 조회 가능 | PASS |
| 파일 스토리지(Azure Blob) | try/catch → 500, 기존 결과물 삭제 안 함 | PASS |
| **Week4 성장 리포트** | upstream 오류 시 결정 산출물 폐기(재계산됨, 사용자 데이터 유실 아님) | PARTIAL |
| 오류 추적(Sentry) | **미설치** — console 로그만, 알림/집계 없음 | 한계 |

## 관리자 대량 데이터 (구조 평가)
- `/ops/students`: **전체를 브라우저로 로드 후 클라이언트 필터/페이지네이션** + 서버가 전 코호트 state/이력서/자소서 JSON 조회. 0/10/100명은 무리 없으나 **1,000/5,000명에서 P0**(pool 점유·메모리·전송량). fixture 실측은 NOT TESTED. 서버 페이지네이션 + 요약 엔드포인트/컬럼이 필요(FE+BE 협조, 보고됨).
- `/ops/interventions/scan`: 학생당 4쿼리 N+1(P1). 배치화 제안.

## 남은 병목 (우선순위)
- P0: auto-LLM 진입 게이트(P0-1), 관리자 목록 페이지네이션(P0-4), progress lost-update(P0-5).
- P1: LLM context 요약/트리밍, per-user 캡 확장 + 분산 rate limit, 비용 필드 보강, 다단계 저장 트랜잭션, 클라 이탈 취소.
- P2: 작업별 모델 분리, 폴백 스키마 강제, 대시보드 중복 fetch, 채팅 리스트 가상화, 폰트 @import.

## 최종 판정: **PERFORMANCE QA — 미완(진행 중)**
이번 턴 구현분(timeout, single-flight)은 안전·검증(typecheck). 그러나 P0-1/P0-4/P0-5가 미해결이고 실측(latency·비용·부하)이 NOT MEASURED이므로 **완전 PASS 아님**. → 조건부 진행: 남은 P0를 승인 순서대로 처리 + 스테이징 실측 후 재판정.
