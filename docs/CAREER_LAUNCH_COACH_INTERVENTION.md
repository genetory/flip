# Career Launch — 코치 개입 가이드 (Phase 10)

AI가 대부분의 상담을 진행하되, 아래 상황에서 운영자·코치가 개입한다. 규칙 기반 감지(`computeInterventionPriority`, `career-league.ts`) + 서버 스캔(`POST /career-launch/ops/interventions/scan/:cohortId`) + SLA(`computeSlaStatus`, `career-pilot.ts`). **AI가 의료·심리 전문가처럼 판단하지 않고 안전 안내 + 사람 검토로 연결.**

## 자동 확인 대상
| 감지 조건 | 관리자 표시 | 우선순위 | 담당 | 최초 확인 목표 | 권장 대응 | 완료 조건 | 기록 |
|---|---|---|---|---|---|---|---|
| 가입 24h 내 미시작 | 진행 확인 필요 | medium | 운영자 | 1영업일 | 시작 안내 재발송(가짜 발송 금지, 안내문 복사) | 첫 상담 시작 | 신호·조치 |
| 3일+ 무활동 | 진행 확인 필요 | high | 운영자 | 당일 | 이어하기 유도·막힌 단계 확인 | 재활동 | daysSinceActivity |
| 같은 미션 3회+ 실패 | 확인 필요 | high | 코치 | 당일 | 다른 표현 질문 전환·힌트 | 미션 진행 | 실패 횟수 |
| 반복 질문 신고 | 확인 필요 | medium | 코치 | 주차 종료 전 | 프로필 confirmed 점검·프롬프트 확인 | 신고 해소 | already_answered |
| AI 답변 반복 무도움 | 확인 필요 | medium | 코치 | 주차 종료 전 | 상담 방향 재설정 | 만족 응답 | 평가 |
| 목표 직무 미결정 | 확인 필요 | high | 코치 | 당일 | 직무 비교 상담 제안 | targetConfirmed | — |
| 이력서 사실 확인 장기 대기 | 확인 필요 | high | 코치 | 1영업일 | 확인 문장 함께 검토 | criticalUnresolved 해소 | unsupportedCount |
| 3주차 면접 중도 이탈 | 확인 필요 | high | 코치 | 당일 | 면접 재개 안내 | 면접 완료 | session status |
| 4주차 재도전 미시작 | 확인 필요 | medium | 코치 | 주차 종료 전 | 오답 1개 함께 연습 | 재도전 | correction status |
| 마감 48h 전 미완료 | 확인 필요 | high | 운영자 | 당일 | 남은 단계 압축 안내 | 주차 완료 | deadline |

## 긴급 개입 대상 (**즉시 P0**)
- 타 사용자/타 기관 정보 노출, AI 부적절·위험 생성, 사용자 데이터 유실, 결과물 오덮어쓰기, 권한 밖 데이터 노출 → **즉시 기능 flag 비활성화·개발팀 전달·감사 로그**.
- 사용자가 상담 중 **심각한 정서적 어려움** 표현 → AI가 진단하지 않고 **안전 안내 + 사람 검토(human_review) 연결**. 필요 시 외부 전문기관 안내 문구 제공.

## 처리 흐름
상태 전이(`canTransitionIntervention`): open→assigned→contacted→in_review→waiting_user→resolved/dismissed. **dismiss 사유 필수**, 모든 전이 감사 로그(`CareerInterventionLog`). 해결 시 처리내용·해결사유·학생 다음 행동·재확인 여부 기록. AI 운영 요약은 **사실(facts)과 AI 해석 분리**(`/ops/interventions/:id/ai-summary`).

## SLA
P0 즉시 / P1(사람상담·사실충돌) 1영업일 / 3일정체 익영업일 / 낮은 confidence 주차 종료 전 / 일반 2영업일. 초과 항목은 운영 홈·파일럿 모니터에서 강조.
