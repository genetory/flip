# Career Launch — 파일럿 UAT 시나리오 (Phase 9)

실제 참여자·관리자·기관 담당자가 4주 프로그램을 처음부터 끝까지 검증하기 위한 UAT 문서. **실사용자 초대·외부 발송·프로덕션 배포·운영 DB 삽입은 하지 않는다.**

## 테스트 환경·데이터
- **분석**: GA(`safeSendEvent`, `NEXT_PUBLIC_GA_MEASUREMENT_ID` 설정 시에만 전송). 원문·개인정보 미전송.
- **fixture(개발 전용)**: 기존 seed 스크립트 재사용 — `apps/api/scripts/seed-career-launch-demo.ts`, `seed-dev-users.ts`, `seed-career-week4-demo.ts`, `seed-career-cover-demo.ts`. **로컬 DB(`careerbridge`)에는 실데이터가 있으므로 자동 실행 금지** — 별도 개발/테스트 DB에서만 실행할 것. 파괴적 삽입 금지.
- **역할**: 전역 OPERATOR(슈퍼유저) / 기관 org_admin·org_observer·instructor·counselor(Phase 11 membership, 서버 검증) / 참여자(STUDENT + CareerEnrollment).
- **테스트 계정 상태(권장 준비)**: 신규 / W1~W4 진행 중 / 완주 / 3일+ 정체 / AI 실패 이력 / V1 기존 / 결과물 다수 / 프로필 일부 누락.

---

## 시나리오 A — 신규 참여자 (온보딩 → 4주 완주)
**사전 조건**: 등록(enrollment)된 신규 STUDENT, 진행 데이터 없음.

| # | 사용자 행동 | 예상 결과 | 통과 기준 | 실패 시 확인 |
|---|---|---|---|---|
| 1 | `/career-launch` 진입 | 소개+로그인/등록 게이트 | `career_launch_viewed` 발생 | 인증 세션·enrollment |
| 2 | 대시보드 진입 | 코치 메시지·오늘 할 일·4주 여정 | `career_launch_started`·`career_dashboard_viewed`, h1(sr-only) 존재 | `/career-launch/dashboard` 200, VM 조합 |
| 3 | 첫 상담 시작 | JobsChat 인트로(빈 채팅 아님) | `career_coaching_intro_viewed` → `career_coaching_started` | 상담 shell 렌더 |
| 4 | 경험 입력 | 코치가 요약·확인 요청 | `career_coaching_message_sent`·`career_coaching_response_completed` | job-chat API 200 |
| 5 | 관심 직무 탐색·목표 직무 선택 | 추천 직무·목표 확정 | `career_target_job_confirmed`, CareerTargetJob status=confirmed | week1 데이터 |
| 6 | 1주차 완료 | 완료 조건 충족·다음 주 열림 | `career_week1_completed`, isWeekComplete(1) | doneSteps w1s4 |
| 7 | 2주차 이력서 초안→확인→자소서 | 결과물 생성·확정 | `career_resume_draft_generated`·`career_resume_confirmed`·`career_application_package_finalized` | resume/cover/package |
| 8 | 3주차 모의면접→평가·약점 | 리포트·오답노트 | `mock_interview_started`·`mock_interview_completed`·`career_interview_report_viewed` | InterviewSession completed |
| 9 | 4주차 오답 재도전→최종 비교→성장 | 성장 리포트 | `career_correction_retry_submitted`·`career_growth_report_viewed`·`career_launch_completed` | GrowthReport |

**핵심 통과**: confirmed 정보 재질문 없음(코치 원칙), 각 주차 완료 시 다음 주 게이트 열림, 결과물 저장 성공.

---

## 시나리오 B — 중단 후 복귀
**사전 조건**: W2 진행 중, 상담 도중 이탈.

| # | 행동 | 예상 결과 | 통과 기준 | 실패 시 확인 |
|---|---|---|---|---|
| 1 | 상담 중 페이지 이탈 | 진행/입력 저장(progress.state) | 이탈 시 데이터 유지 | patchProgress 호출 |
| 2 | 재로그인·대시보드 | 마지막 진행 상태 복원 | 현재 주차·다음 행동 정확 | dashboard VM currentWeek |
| 3 | 상담 재개 | 이전 상담 요약 기반 이어감 | AI가 확정 정보 재질문 안 함 | loadRecentConsults·profile confirmed |
| 4 | 중단 미션부터 진행 | 완료 미션은 완료 유지 | doneSteps 보존 | step-status |

---

## 시나리오 C — 오류 복구
**사전 조건**: AI 응답 중 네트워크/업스트림 오류 유도.

| # | 행동 | 예상 결과 | 통과 기준 | 실패 시 확인 |
|---|---|---|---|---|
| 1 | AI 요청 중 오류 | 사용자 입력 유지, 오류 메시지 | `career_coaching_response_failed`(errorType) | 입력 텍스트 잔존 |
| 2 | 다시 시도 | 재요청 가능 | 중복 결과물 생성 안 함 | 결과물 count 불변 |
| 3 | 저장 실패 | "저장하지 못했어요"(입력 잔존) | 저장 여부와 문구 일치(§Phase3) | ERROR_COPY.send/artifact |
| 4 | 부분 실패(보조 API) | 정상 영역은 계속 표시 | 전체 페이지 중단 안 됨 | dashboard 핵심/보조 분리 |

---

## 시나리오 D — 기존 V1 사용자
**사전 조건**: V1 결과물(progress blob·resume/cover) 보유 사용자.

| # | 행동 | 예상 결과 | 통과 기준 | 실패 시 확인 |
|---|---|---|---|---|
| 1 | 로그인 | 기존 접근 경로 유지 | 라우트·데이터 손실 없음 | 레거시 URL 200 |
| 2 | 기존 결과물 확인 | 이력서/자소서 표시 | V1 데이터 유지 | resume/cover blob |
| 3 | V2 진입 | Career Profile 지연 병합(최초 GET) | 원본 무변경·profile 생성 | getOrCreateCareerProfile |
| 4 | V1↔V2 혼선 없음 | 완료상태 정확 | doneSteps·산출물 정합 | step id 불변 |

---

## 시나리오 E — 관리자 (운영자)
**사전 조건**: OPERATOR 계정.

1. `/career-launch/ops` 운영 홈 → 오늘 확인할 항목(주의 큐) 표시 · `career_admin_home_viewed`
2. 학생 목록 필터(기수·주차·정체·확인필요·AI실패) · `career_admin_student_opened`
3. 참여자 상세: Career Profile·상담 요약·결과물·면접·개입 이력(원문 최소 노출)
4. 위험/정체 참여자 확인 → 개입 목록(SLA) · `career_admin_intervention_opened`
5. 코치 메모·개입 상태 변경(전이 검증·감사 로그) · `career_intervention_status_changed`
6. 운영 리포트 확인 · 데이터 없음/일부 API 실패 시 영역별 처리

**권한 통과**: 민감 원문은 권한 없는 운영자에게 미노출. 파일럿 모니터(`/ops/pilot`) SLA·중단조건 정상.

---

## 시나리오 F — 기관 담당자
**사전 조건**: org_admin(기관 A), 기관 B에는 접근 불가.

1. `/career-launch/ops/orgs` 기관 대시보드 → 참여율·완료율·주차별·완주율·좌석 · `career_institution_outcome_viewed`
2. 성과 리포트 생성(집계·metricVersion·작은표본 숨김) · `career_institution_report_started`
3. **권한 격리 테스트(필수)**: 기관 B의 orgId 직접 호출 → **403**(requireOrgPerm), 타 기관 참여자 정보 미노출
4. 참여자 0명 기관 → 빈 상태 정상

---

## 분석 이벤트 검증 (핵심)
| 이벤트 | 발생 조건 | 주요 속성 | 중복 방지 | 개인정보 |
|---|---|---|---|---|
| career_launch_viewed | 엔트리 페이지 mount | — | mount 1회 | 없음 |
| career_launch_started | 대시보드 최초 | currentWeek | ref 가드 | 없음 |
| career_coaching_response_completed | AI 응답 성공 | sessionType,week | 응답당 1회 | 없음 |
| career_coaching_response_failed | AI 응답 실패 | errorType | 실패당 1회 | 없음 |
| career_target_job_confirmed | 목표 직무 확정 | week | 확정 시 | 없음 |
| career_application_package_finalized | 패키지 확정 | — | 확정 시 | 없음 |
| mock_interview_completed | 최초 면접 완료 | — | 완료 시 | 없음 |
| career_growth_report_viewed | 성장 리포트 열람 | — | 열람 시 | 없음 |
| career_intervention_created | 위험 신호(개입 생성) | priority | 스캔 dedup | 없음 |

> 퍼널(§7)은 위 + 기존 career_* 이벤트로 측정 가능. **원문/이메일/이름/대화 미전송**.

## 출시 차단 기준 체크(§11)
로그인·권한 오류 / 타사용자·타기관 데이터 노출 / 진행·대화·입력 유실 / 결과물 저장 실패·중복 / 완료 후 다음 단계 미개방 / V1 데이터 손실 / 모바일 핵심 진행 불가 → 발견 시 **P0/P1**, 재현 절차 기록 후 파일럿 차단.
