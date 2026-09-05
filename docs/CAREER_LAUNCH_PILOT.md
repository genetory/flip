# Career Launch V2 — 파일럿 운영·측정 (Phase 9)

10~20명 실제 학생 4주 파일럿을 위한 운영·측정 시스템. 신규 핵심 기능 없음 — 가설 검증·문제 조기 발견·운영자 개입 환경. **실제 활성화·사용자 초대·외부 발송·프로덕션 배포는 명시 승인 전 금지.**

## 1. 검증 가설 (측정 연결)
- **A 전담 코치**: confirmed 재질문률(0 목표), "이미 답했어요" 사용률, 상담 연속성 만족도(설문 consult_end).
- **B 2주 지원 패키지**: 목표 직무 확정률·패키지 완성률·unsupported율(퍼널 + 설문 week1/2).
- **C 면접 반복훈련**: 초기/최종 완료율·유사질문 통과율·성장(+15점 목표)(퍼널 + growth report).
- **D 경쟁 동기부여**: 리그 조회→미션 수행·부담감(설문 competition).
- **E 사람 개입**: 신호 정확도·개입까지 시간·재활성화(개입 SLA + 정성 피드백).

## 2. 아키텍처
- 순수 로직 `apps/api/src/career-pilot.ts` — 학생 상태·15단계 퍼널·중단조건·SLA·KPI·준비 체크리스트·설문 정의·정성 분류·비용 추정. DB 무의존, 단위 테스트 29개.
- 엔드포인트 `index.ts`: `/career-launch/ops/pilot/:cohortId/{readiness,monitor,funnel,cost,daily-report,final-report,feedback}`, `/pilot/students/:id/status`, `/pilot/feedback/:id/resolve`. 학생용: `/career-launch/survey/pending`, `POST /survey`, `POST /feedback`.
- 비용 캡처: `careerChatComplete` 가 모든 호출의 `usage`(토큰)·재시도·실패를 `CareerAiCostDaily`(cohort×feature×date×model)로 집계. 원문 미저장.
- 프론트: `app/career-launch/ops/pilot/page.tsx`(운영 모니터링), `components/launch/PilotFeedbackWidget.tsx`(학생 인앱 설문/빠른 피드백), `lib/launch/pilot-client.ts`.

## 3. 데이터 모델 (additive)
- `CareerCohort` +`isPilot,programVersion,featureFlags,participantLimit,pilotStartAt,pilotEndAt,surveyConfiguration,monitoringConfiguration`.
- `CareerPilotSurvey` — surveyKey별 1건(unique studentUserId+surveyKey → 반복 노출 방지), 5점 척도 answers + 선택 comment.
- `CareerQualitativeFeedback` — category·severity·주차/단계만(원문 없음), resolvedAt.
- `CareerAiCostDaily` — calls/inputTokens/outputTokens/retries/cacheHits/failures/estCostUsd 일별 집계.
- 마이그레이션 `20260904000000_add_career_pilot`(로컬 적용됨, 스테이징/프로덕션 `migrate deploy` 필요).

## 4. 파일럿 준비 체크리스트 (18항목)
자동 판정(기수/일정/주차/세미나/참여자/flag/LLM env/설문/지원연락처) + 수동 확인(운영자·강사 권한·분석이벤트·개인정보 안내·테스트계정·마이그레이션·롤백). 필수 미충족 시 활성화 전 경고. 수동 항목은 `monitoringConfiguration.manualChecks`.

## 5. 학생 상태 (9종, 운영자 확정 구분)
invited/registered/onboarding/active/at_risk/intervention_required/paused/completed/withdrawn. 자동 계산 + 근거(reasons). **withdrawn·intervention_required 는 자동 확정하지 않음** — 운영자가 근거 확인 후 override(`progress.state.pilotStatusOverride`). override가 항상 우선.

## 6. 매일 확인할 지표 (모니터링 화면)
- 전체: 등록/오늘활동/활성/위험(3일+)/개입필요/완주/SLA초과/긴급피드백/주차별완료.
- 학생별: 상태(근거 hover)·주차·최근활동·산출물·운영자 상태 override.
- 중단조건 배너(관측형 자동 감지) + 미해결 개입 SLA 표.

## 7. 개입 SLA
P0 즉시 / P1 당일 / 사람상담 1영업일 / 결과물충돌 1영업일 / 3일정체 익영업일 / 낮은confidence 주차종료전 / 일반 2영업일. 모니터링에서 초과 항목 강조.

## 8. 중단 조건
데이터손실·타기관노출·저장실패·완료상태손실·confirmed 반복질문·허위생성·답변유실·점수대량오류·비용급증·P0·P1반복·과반이탈·개입확인불가. 관측형은 자동 감지(정성 피드백·비용·퍼널 이탈), 나머지는 운영자 수동. **감지 시 flag 비활성화·복구 절차 안내, 자동 프로덕션 변경 없음.**

## 9. 핵심 퍼널 (15단계)
초대→가입→첫상담→W1완료→목표확정→W2시작→패키지확정→W3시작→초면접→오답확인→W4시작→유사질문통과→최종면접→완주→실제지원. **표본<8 이면 전환율보다 실인원으로 해석**(경고 표시).

## 10. 초기 성공 기준 (운영자 수정 가능)
초대→가입 80% / 첫상담 70% / W1 65% / 목표확정 80%(W1완료자) / 패키지 50% / 초면접 45% / 최종 35% / 완주 35% / confirmed 재질문 0 / 전체 재질문 3%미만 / LLM 실패 5%미만 / 저장실패 0 / 면접성장 +15 / 상담연속성 4.0 / 사람느낌 60% / 경쟁도움 50% / 30일내 지원 60%. 통계적 확정 아님 — 개선 우선순위용.

## 11. 설문 (인앱, 반복 노출 방지)
consult_end·week1~4_end·competition, 각 4~5문항 5점 척도 + 선택 주관식 1. surveyKey별 1건. 정성 칩("이미 답했어요" 등 9종) 즉시 전송. **원문·개인정보를 분석 이벤트에 미포함**(surveyKey/category enum만).

## 12. 비용 모니터링
기능별(consult/resume/interview_eval 등)·일별 집계, 호출·토큰·재시도·실패·추정비용(근사), 사용자당·완주자당. 오늘이 기준 평균의 3배 초과 시 급증 경고. 캐시 절감은 호출 수 감소로 반영. **추정치이므로 실제 청구와 다를 수 있음.**

## 13. 리포트
- 일일 운영 리포트: 사실 데이터만(AI 요약과 분리), 원문 없음, 관리자 조회/다운로드(자동 외부 발송 없음).
- 파일럿 종료 리포트: 참여·결과물·AI품질·성장·경쟁·운영·비용·평가 집계. 최종 판정(EXPAND/ITERATE/PAUSE) + 개선 우선순위 5개는 **운영자가 근거 보고 결정**.

## 14. 개인정보 주의사항
- 운영자 화면은 학생 식별 정당(관리 목적) — 단, 상담 원문·민감내용 미표시.
- 설문/정성 피드백 원문은 저장/이벤트 금지(척도·category만).
- 비용·AI 요약에 원문 미포함. genetory/flip PUBLIC repo에 PII 커밋 금지.

## 15. 대응 가이드(요약)
- 중복 질문: Career Profile confirmed 상태 확인 → 재질문 원인 프롬프트 점검.
- AI 오류: 503(크레딧/업스트림)은 재시도 안내, 502(파싱)는 작성물 보존 확인.
- 저장 오류: content_lost 피드백 → 해당 학생 결과물 백업 확인(중단 조건).
- 면접 중단: interview_blocked → 세션 상태·크레딧 확인.
- P0/P1: flag 비활성화 → 복구 → 재발 방지.

## 16. 회고(4주 종료 후)
종료 리포트 + 가설 A~E별 판정 + 개선 우선순위 5개 → EXPAND/ITERATE/PAUSE 결정.

## 16b. Phase 10 계기(instrumentation) — 다음 파일럿 분석 준비
Phase 10 진입 시 **실제 파일럿 미실행 → 분석 데이터 0**임을 확인(`apps/api/scripts/phase10-pilot-analysis.ts` 읽기전용). 임의 추정 대신, 다음 파일럿에서 섹션 1 지표가 실제로 수집되도록 계기를 보강(additive):
- **CareerActivityEvent**(append-only, 원문 없음): `week_enter`(체류시간·재진입), `next_action_click`, `league_view`, `rank_detail_view`, `privacy_change`, `suggestion_accept/modify/reject`, `skip`, `unsure`, `ask_ai`. 학생 엔드포인트 `POST /career-launch/activity`. 프론트 `logActivity()` — 주차 진입·리그 조회·다음행동 클릭에 연결.
- **참여 집계** `computeEngagement`(순수): 주차별 체류시간(세션 30분 경계 누적)·재진입(6h+ 복귀)·제안 수락률·건너뛰기/잘모름/AI추천 신호. funnel·final-report에 노출.
- **confirmed 재질문율**(자동): `already_answered` 정성신고 ÷ 대화형 호출 수(둘 다 서버 집계) → final-report `aiQuality.reask`.
- **근거부족(unsupported)·critical**: 패키지 `validationData` 집계 → final-report.
- **프롬프트 버전 차원**: `CareerAiCostDaily.promptVersion` 추가, `careerChatComplete` ctx.promptVersion → 비용/오류를 버전별 비교(cost `byPromptVersion`).
- 마이그레이션 `20260905000000_add_career_activity`(로컬 적용). **실제 파일럿을 1회 실행해야 분석·개선 스프린트가 성립.**

## 17. 알려진 한계
- 대학별 데이터 격리 미구현(단일 글로벌 OPERATOR) — 다기관 동시 파일럿 시 필요.
- 비용 추정 단가는 근사(실청구≠추정). 캐시 히트는 careerChatComplete 도달 전 스킵돼 호출 감소로만 반영.
- 일부 중단 조건(P0/P1·타기관노출)은 자동 감지 불가 → 운영자 수동.
- 설문 노출 타이밍은 대시보드 기준(주차 화면별 정밀 트리거는 후속).
