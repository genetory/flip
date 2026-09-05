# Career Launch — KPI 정의서 (Phase 10)

산식은 **단일 소스** `apps/api/src/career-kpi.ts`에서 정의(화면별 중복 금지). 조회: `GET /career-launch/ops/kpi/:cohortId`(운영자). `metricVersion=kpi_v1`. 목표값은 **하드코딩 아님** — `CareerCohort.monitoringConfiguration.kpiTargets`로 주입, 미설정 시 `DEFAULT_KPI_TARGETS`.

## North Star Metric
**"4주 안에 지원서와 면접 준비를 모두 완료한 참여자 수/비율."**
조건(모두 충족): 이력서 확정 + 자기소개서 확정 + 최초 모의면접 완료 + 오답 재도전 완료 + 성장 리포트 확인. `computeNorthStar` — 고유 참여자 기준, breakdown 제공.

## 핵심 KPI (`computeKpiSet`)
| key | 지표 | 분자 | 분모 | 이벤트 | 기본목표 |
|---|---|---|---|---|---|
| signup_rate | 초대 대비 가입률 | 가입 | 초대 | career_launch_viewed | 80% |
| activation_rate | 24h 내 첫 상담 | 24h 내 첫 상담 | 가입 | career_coaching_started | 70% |
| week1_rate | 목표 직무 확정률 | 목표 확정 | 등록 | career_target_job_confirmed | 75% |
| week2_rate | 지원 패키지 완성률 | 패키지 finalized | 등록 | career_application_package_finalized | 65% |
| week3_rate | 최초 모의면접 완료율 | 면접 완료 | 등록 | mock_interview_completed | 60% |
| week4_rate | 재도전 완료율 | 재도전 완료 | 등록 | career_correction_retry_submitted | 50% |
| completion_rate | 4주 완주율 | 성장 리포트 | 등록 | career_launch_completed | 50% |
| artifact_confirm_rate | 결과물 확인률 | 사용자 확정 | 생성 | career_resume_confirmed | 80% |
| reask_rate | 반복 질문률(이하) | 이미답했어요 | 대화형 호출 | career_pilot_feedback_submitted | ≤10% |
| recovery_rate | 개입 후 복귀율 | 개입 후 재활성 | 개입 대상 | career_intervention_resolved | 40% |
| recommend_rate | 추천 의향 | 추천 긍정 | 종료 설문 | career_pilot_survey_submitted | 70% |
| real_application_rate | 실제 지원 시작률 | 실제 지원 | 완주 | (CareerEmploymentOutcome) | — |

- **포함/제외**: reask_rate 는 운영자·테스트 계정 제외 권장. 분모 0이면 `null`(값 0으로 확정하지 않음).
- **작은 표본**: 참여자 `< 5`(`KPI_MIN_SAMPLE`)면 `smallSample=true` — 개인 추정 가능한 세부 통계 노출 자제.
- **목표 대비 상태**: `kpiStatus` — on_track/below/no_data(reask는 이하가 목표라 방향 반대).

## 초기 목표값(파일럿, 조정 가능)
`DEFAULT_KPI_TARGETS`(career-kpi.ts). 파일럿 후 `monitoringConfiguration.kpiTargets`로 기수별 조정.

## 개인정보
KPI·이벤트에 **이력서/상담/면접 원문·이름·이메일 미포함**. 집계 수치만.
