# Career Launch V2 — 아키텍처 · 운영 · 배포 문서 (Phase 8)

4주 취업 실행 프로그램(Phase 1~7 리뉴얼)의 통합 문서. 신규 대규모 기능 없이 통합·호환·배포 준비 상태를 정리한다.

## 1. 4주 사용자 흐름

| Week | 목표 | 핵심 산출물 | 신규 모델 |
|---|---|---|---|
| 1 | 나를 이해하고 직무 탐험 | 대표 경험·강점, 추천 직무 3, 직무 체험 2, 목표 직무 확정, 결정 리포트 | CareerExperience, CareerJobTrial, CareerTargetJob, CareerJobDecisionReport |
| 2 | 지원 패키지 완성 | 공고 분석, 공고맞춤 이력서·자소서(문장별 근거), 일관성 검사, Readiness, 예상 질문 | CareerApplicationTarget, CareerDocumentVersion, CareerApplicationPackage, CareerInterviewQuestionSet |
| 3 | 실전 모의면접 & 약점 발견 | 종합 실전면접, 8축 평가, 취약 패턴, 핵심 오답노트 | CareerInterviewSession/Question/Answer/Weakness/Correction |
| 4 | 오답노트 반복 & 최종 검증 | 오답 코칭·재도전·유사질문 전이, 최종 면접, 성장 리포트, 30일 계획 | CareerInterviewCorrectionAttempt, CareerInterviewGrowthReport |
| 전체 | 전담 AI 코치 + 경쟁·개입 | Career Profile 공유, 리그·점수·배지, 운영자 개입 | CareerProfile(+Event), CareerLeague(+Member/Score/Snapshot), CareerAchievement, CareerCohortGoal, CareerIntervention(+Log) |

성공 기준: "목표 직무를 정하고 → 지원서 한 세트 완성 → 최초 면접 약점 반복 교정 → 최종 면접에서 성장 확인".

## 2. 코드 구조 (순수 로직 ↔ DB/LLM 분리)

DB 무의존 순수 모듈(테스트 가능) + `index.ts`의 repository/endpoint/LLM 분리:

- `apps/api/src/career-profile.ts` — Career Profile(17영역·6상태·병합·상태머신·dedup·컨텍스트빌더)
- `apps/api/src/career-week1.ts` — 직무군 taxonomy·미니체험 템플릿·완료판정
- `apps/api/src/career-week2.ts` — 중앙 점수 가중치·검증상태·일관성·Readiness·완료판정
- `apps/api/src/career-week34.ts` — 면접 8축 평가·취약 taxonomy·오답 상태전이·통과기준·성장 11지표
- `apps/api/src/career-league.ts` — 점수 6항목·리그 배정·다음행동·배지·개입 우선순위
- LLM 호출: `careerChatComplete(system, user, name, schema, strict?, ctx?)` — system/user 메시지 분리(prompt injection 방어), json_schema 구조화 출력, sig 캐시.

## 3. 데이터 모델 · 호환

**신규 테이블 25개**(모두 additive, FK onDelete Cascade to User). 기존 테이블/컬럼/데이터 **무변경**.

마이그레이션(로컬 적용됨, 스테이징·프로덕션 `migrate deploy` 필요):
`20260830000000_add_career_profile`(2) · `20260831000000_add_career_week1`(4) · `20260901000000_add_career_week2`(4) · `20260902000000_add_career_week34`(7) · `20260903000000_add_career_league`(8).

### 기존 사용자 호환
- **Career Profile 지연 병합**: 최초 `GET /career-launch/profile` 시 `getOrCreateCareerProfile`가 CareerResumeData/CoverLetterData/Progress를 1회 병합(원본 무변경). **별도 backfill 불필요.**
- 기존 Week 완료상태(`state.doneSteps`)·이력서·자소서·면접 blob(`state.interview`) 무변경, 신규 테이블과 병존.
- Dry-run: `npx tsx apps/api/scripts/phase8-migration-dryrun.ts [cohortId]`(읽기전용·ID 마스킹).

## 4. Career Profile 상태 정책
`confirmed`(사용자 확인) / `inferred`(AI 추론) / `missing` / `conflicted`(이전값·새값 보관) / `rejected`(재제안 금지) / `outdated`. **confirmed는 소스 갱신에도 유지**(mergeSourceFactsIntoProfile는 사용자 결정 보존). 전 AI가 `buildCandidateProfileSummary`로 공유 → 확정 정보 재질문 금지.

## 5. LLM 프롬프트 · 버전 정책
- 프롬프트 버전: `WEEK2_PROMPT_VERSIONS`, `WEEK34_VERSIONS`. 점수 버전: `SCORE_WEIGHTS_VERSION`(w2), `SCORING_VERSION`(면접), `LEAGUE_SCORING_VERSION`. **다른 버전 점수 직접 비교 금지.**
- 공통 가드레일: `NO_FABRICATION`(사실·수치·미사용기술·과장 금지), `IV_SAFETY`(합격가능성 표현 금지·보호특성 미사용·억양 단정 금지·비원어민 언어/역량 분리).
- 실패 처리: 파싱 실패 502(작성물 보존), 업스트림 503(`sendAiUnavailable`), 제출 먼저 저장 후 평가.

## 6. 점수 산정 정책 (중앙·버전 관리)
- 리그 100점: 미션25+결과물25+성장20+실전15+오답10+동료5(비활성→정규화). `career-league.ts` `SCORE_WEIGHTS`.
- **서버에서만 계산**(클라 변경 불가), `CareerLeagueScore.sourceSnapshot`.
- 어뷰징 방지: 방문/채팅으로 점수 없음, 실전훈련 캡, 오답은 **통과 상태 기준**(재도전 횟수 아님), 성장 비교불가시 0.
- 점수 ≠ 합격 가능성(UI 명시).

## 7. 오답 통과 기준
`evaluateCorrectionPass`: 같은질문 개선 + 유사질문 구조 사용 + 일관성 + 역할 명확 + 새 취약점 없음(필수) + 근거/직무연결(선택 1+). **점수만으론 통과 아님.** 확신도<0.5면 사람 검토 제안.

## 8. 리그 · 개인정보 정책
- 실명 기본 비노출(닉네임/버킷). **5명 미만 상세 순위 숨김**(`shouldHideRank`). 소수 직무군 병합(`assignJobLeagues`).
- 리그 스냅샷에 상담 원문·민감정보 미저장. 익명 피드는 합산.
- 하위권엔 꼴찌 대신 다음 행동 + 예상 점수 변화(`computeNextActions`, 서버 계산).

## 9. 운영자 개입 정책
- 규칙 기반 신호(`computeInterventionPriority`) → critical/high/medium/low + reasonCodes. **LLM만으로 critical 확정 금지.**
- 상태: open→assigned→contacted→in_review→waiting_user→resolved/dismissed(전이 검증·dismiss 사유 필수·감사 로그 `CareerInterventionLog`).
- AI 운영 요약: 사실(facts)과 AI 해석 분리, 심리 단정 금지.
- 권한: `requireRoles([OPERATOR])`. **대학별 격리는 미구현(단일 글로벌 OPERATOR) — 한계.**

## 10. 분석 이벤트
`CareerFunnelEvent` 유니온(analytics.ts)에 career_week1~4_*·league·intervention 이벤트 등록. 원문 답변·개인정보 미포함. (연결 감사는 Phase 8 QA 참조.)

## 11. 환경변수
- `DATABASE_URL`(로컬 localhost), `OPENAI_API_KEY`(없으면 AI 503, 프로그램 진행은 지속), `OPENAI_INTERVIEW_MODEL`(기본 gpt-4o), `NEXT_PUBLIC_API_URL`.
- 신규 `NEXT_PUBLIC_*`는 Environment(staging·production) 시크릿에.

## 12. Feature Flag (권장, 미구현)
현재 flag 시스템 없음 → 과도한 신규 시스템 대신 **기수 단위 설정 또는 환경변수** 권장:
`career_launch_v2 / career_profile_v2 / career_coach_v2 / job_trial_v1 / application_package_v1 / interview_correction_v1 / career_league_v1 / career_intervention_v1`.
적용 순서: 내부관리자 → 테스트기수 → 파일럿기수 → 신규기수 → 기존기수 선택. **기존 사용자 자동 강제전환 금지.**

## 13. 롤백
- UI/API: 신규 카드·라우트 비활성(코드 revert). **생성된 결과물은 보존.**
- Prisma: **컬럼/테이블 삭제 금지** — 이전 코드가 신규 테이블 무시하고 동작(additive). 롤백 시 migration down 불필요.
- 점수·리그 오류는 핵심 진행과 분리(리그 실패해도 Week 진행 지속).

## 14. 단계적 배포 (실제 배포는 승인 후)
Stage 0 개발(테스트·fixture) → 1 스테이징(migrate deploy·E2E·리허설) → 2 내부 3~5명 → 3 파일럿 10~20명(flag·밀착 모니터) → 4 제한 확대(KPI·비용·성능) → 5 전체 신규기수(기존은 선택).
**중단 조건**: 데이터 손실·결과물 접근 불가·인증/권한 오류·중복질문률 초과·AI 실패율 급증·답변 유실·잘못된 점수 대량·기관 데이터 노출·LLM 비용 급증·핵심 퍼널 이탈 급증.

## 15. 운영 체크리스트
- [ ] 스테이징 `migrate deploy`로 25테이블 반영, 이미지 직접 pull로 검증
- [ ] OpenAI 크레딧 충전(현재 소진 상태 — AI 기능 전제)
- [ ] 기수 생성·주차 일정·세미나(기존 ops 화면)
- [ ] cohort별 `CareerCohortGoal` 초기 설정
- [ ] 개입 스캔 `POST /ops/interventions/scan/:cohortId`(수동 또는 후속 크론)
- [ ] 리그 스냅샷 정기 배치(후속)
- [ ] 6언어 표시 확인, 실브라우저 모바일·데스크톱 확인

## 16. 알려진 제한사항
- 대학별 데이터 격리 미구현(단일 글로벌 OPERATOR).
- 동료 기여(peer feedback) 기능 없음 → contribution 점수 비활성.
- 세션 재개 UI·음성 입력(인프라 없어 텍스트만)·공개설정 UI·외부 알림 발송 미구현.
- 리그 정기 스냅샷·개입 스캔은 온디맨드(크론 후속).
- lint: Next 16 `next lint` 제거 + 독립 ESLint 설정 없음 → tsc+build로 대체.
