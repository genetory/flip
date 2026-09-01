# Career Launch — 운영자 매뉴얼 (Phase 10)

운영자가 4주 프로그램을 매일 운영하기 위한 실무 매뉴얼. 제품의 실제 화면·권한·이벤트와 일치.

## 접근·권한
- 운영자(APLY OPERATOR)는 `/career-launch/ops`(운영 콘솔)에 접근. 슈퍼유저(모든 기수·학생).
- 기관 담당자는 `/career-launch/ops/orgs`(소속 기관만, 서버 `requireOrgPerm` 검증).
- 학생 원문(상담·이력서·면접 답변)은 권한·필요 범위에서만.

## 매일 오전 (운영 홈 `/career-launch/ops`)
"오늘 확인할 항목(주의 큐)"에서 우선 확인:
- 전날 활동/신규 시작자 → 핵심 지표 카드
- **즉시**: critical 개입 → `/ops/interventions`
- **오늘**: 사람 상담 요청·사실 충돌·high 개입·SLA 초과·3일+ 정체
- AI 응답 실패·결과물 저장 실패 → 파일럿 모니터 `/ops/pilot`(중단조건)
- 사용자 확인 대기·코치 개입 대기 → 개입 목록

## 매일 오후
- 미완료자 변화·개입 결과(개입 상태 전이) → `/ops/interventions`
- 반복 실패 참여자·데이터/권한 오류 → 파일럿 모니터
- 세미나 참석·다음 날 안내 대상 → 기수 상세

## 매주 시작
- 해당 주차 오픈 상태(`CareerCohortWeek`) 확인 → `/ops/cohorts/:id`
- 이번 주 목표 안내(참여자 가이드 §주차 시작), 세미나 일정
- 운영자·코치 역할 분담, 전주 미완료자 이월 정책(설정)

## 매주 종료
- 주차 진입/완료율·결과물 완성률·이탈·개입률·복귀율·만족도 → **KPI 대시보드 `/ops/kpi/:cohortId`**
- 주요 문의(장애 대응 가이드), 다음 주 개선사항

## 화면 맵
| 목적 | 경로 |
|---|---|
| 오늘 할 일(주의 큐) | `/career-launch/ops` |
| 학생 목록·상세 | `/career-launch/ops/students` |
| 개입 관리(SLA) | `/career-launch/ops/interventions` |
| 파일럿 모니터(중단조건·비용) | `/career-launch/ops/pilot` |
| KPI·North Star | `GET /career-launch/ops/kpi/:cohortId` |
| 기수·주차·세미나 | `/career-launch/ops/cohorts` |
| 기관(B2B)·리포트·좌석 | `/career-launch/ops/orgs` |

## 금지(운영 원칙)
실사용자 외부 발송·프로덕션 임의 배포·운영 DB 테스트데이터 삽입·타 기관 데이터 공유·개인정보 로그 금지. AI를 사람으로 오인시키지 않음.
