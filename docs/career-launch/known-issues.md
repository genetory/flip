# Career Launch — 알려진 이슈 (Phase 16)

각 이슈: ID · 우선순위 · 영향 · 재현 · 현재/기대 · 임시대응 · 권장수정 · 영역 · 배포차단.

---

## KI-1 · 분석 funnel 자체 DB 적재 · P1 · **해결됨(Phase 16)**
- 기존: 핵심 전환(진단·목표직무·프로그램 완료)은 이미 서버(TalentEvent) 적재. 갭은 **미션/주차 완료**의 DB 적재였음.
- 조치: 직렬화 상태-쓰기 헬퍼 `updateCareerProgressState`에서 **doneStep 전이(새로 추가된 스텝)** 를 잡아 커밋 후 `recordProgressMilestones`로 `CareerActivityEvent`(`mission_complete` 스텝별, `week_complete` = wNs4)를 적재. **전이 시점 1회만 → 중복 없음**(Serializable + 재시도라 동시 쓰기에도 최종 성공분만). fire-and-forget(저장 흐름 무영향). api tsc 검증.
- 남은 것(선택): 순수 뷰/클릭 이벤트는 여전히 GA 전용(완료 funnel은 이제 DB 조회 가능). 영역: 분석.

## KI-2 · growth·corrections 페이지 하드코딩 한국어 · P1 · **해결됨(Phase 16)**
- 영향(과거): 비한국어 사용자. `growth/page.tsx`·`corrections/page.tsx` 문자열이 `t()` 미적용이었음.
- 조치: 두 페이지의 모든 사용자 문자열을 `useLaunchT` 6개국어로 래핑(`WEEK_LABEL`·`CORRECTION_GROUP_LABEL`/CTA는 페이지 내 t() 기반으로 이동, 공유 상수 미변경). tsc·build 검증. 차단: 아니오.

## KI-3 · 고아/미연결 참여자 라우트 · P2 · 부분 해결(Phase 16)
- **해결됨**: `/career-launch/resume`·`/career-launch/cover-letter` — resume-maker 빌더를 감싼 thin wrapper(noindex), 인바운드 링크 0, `resume-collect`/`resume-preview`·`cover-collect`/`cover-preview`로 완전 대체된 잔재 → **삭제**(build 검증, 171p). 임베드된 resume-maker 컴포넌트는 다른 곳에서 사용되어 영향 없음.
- **해결됨(Phase 16)**: `/career-launch/profile` — 헤더 nav에 "프로필" 항목 추가로 연결(데스크톱·모바일). 홈 정리에서 대시보드의 패스포트·스냅샷을 뺀 대신 프로필 상세를 여기서 접근하게 됨(정합성 복구). build 검증.
- **해결됨(후속)**: `/career-launch/experience` — '내 경험 찾아보기'를 1주차 정식 스텝(`w1exp`)으로 편입(붕 뜬 별도 카드 제거). 주차 페이지에선 스텝 클릭 시 모달(ExperienceChat embedded)로 열리고, 결과 카드의 '경험 더 찾기'·'다시하기'는 이 독립 라우트로 연결 → diagnosis/jobs/materials와 동일 패턴으로 정합. **유지 확정.**
- **결정 대기(REVIEW, 무해)**:
  - `/career-launch/survey` — 대시보드 프롬프트가 외부 `NEXT_PUBLIC_CAREER_SURVEY_*_URL`로 연결 → 직접링크 의도로 추정. → 의도 확인.

## KI-4 · 관리자 nav 발견성 불일치 · P2 · 부분 해결(Phase 16)
- **해결됨**: `ops/interventions`(코치 개입) — `ops-nav.tsx` "학생 관리" 그룹에 추가. `ops/university`(대학 B2B 판매·리포트 롤업, orgs와 **별개** 확인) — "분석" 그룹에 "대학 리포트"로 추가. build 검증.
- 참고(선택): 메인 ops 콘솔 메뉴(`app/dashboard/ops/_components/menu.ts`)와 CL ops-nav 항목 구성 차이 정합은 별도 검토 대상.

## KI-5 · ops layout 클라측 역할 가드 없음 · P2 · **해결됨(Phase 16)**
- 조치: `app/career-launch/ops/layout.tsx`를 클라 컴포넌트로 전환하고 운영콘솔(`app/dashboard/ops/layout.tsx`)과 동일한 가드 적용 — `isReady` 로딩 스켈레톤 후 `user.role !== "OPERATOR"`면 `/login`으로 리다이렉트, 그전엔 셸 미렌더. 서버 `requireRoles([OPERATOR])` 403은 그대로. tsc·build 검증. 차단: 아니오.

## KI-6 · 관리자 오류 피드백에 `alert()` 사용 · P3 · **해결됨(Phase 16)**
- 조치: `ops/students/page.tsx`·`ops/students/[id]/page.tsx`의 `alert()` 8건을 앱 `useToast()`(`components/toast/ToastProvider`, 루트 레이아웃 제공)로 교체 — 오류는 `toast.error`, 발송 완료는 `toast.success`, SMTP 미설정 안내는 `toast.info`. 파괴적 작업의 `confirm()`·입력 `prompt()`는 용도상 유지. tsc·build 검증. 차단: 아니오.

## KI-7 · `RECOMMENDED_JOBS.match` 하드코딩 % · P3 · 차단: 아니오
- 재조사(Phase 16): match %는 **표시는 안 되지만 `recommendJobs()`의 정렬 키**(`data.ts:399,407` `sort((a,b)=>b.match-a.match)`) — 단순 dormant 아님. **제거 시 추천 순서가 바뀌는 기능 변경**이라 안전 정리 대상 아님(그대로 둠). 위험은 낮음(누군가 `job.match`를 렌더하면 mock 수치 노출 — 현재 소비처는 정렬뿐). 실데이터 연결은 별도 과제. 영역: 데이터.

## KI-8 · 주차 잠금 서버 미강제 · P2 · **해결됨(Phase 16)**
- 조치: `requireCareerEnrollment` 미들웨어(모든 career 엔드포인트 공통)에 중앙 게이트 추가 — `weekForCareerPath`로 대상 주차 판별(week2/3/4 + interview/session=week3), `isCareerWeekUnlocked`(클라 weekUnlocked와 동일: schedule forceOpen/opensAt 우선, 없으면 wN-1s4 완료 폴백)로 판정. **잠긴 주차의 쓰기(POST/PATCH/PUT/DELETE)만 403**(읽기 GET은 허용 — 잠금 안내용), **OPERATOR는 bypass**. 폴백이 클라(전체 스텝)보다 관대해 **정당한 사용자 오차단 없음**, 직접 API 우회만 차단. api tsc 검증. 영역: 백엔드/보안.

## KI-9 · API 응답 미검증 `as` 캐스트 · P2 · 부분 해결(Phase 16)
- **zod 미채택 이유**: platform-web에 **zod 의존성 없음**(apps/api만) → 신규 클라 의존성+번들 비용. 또 실제 응답으로 스키마 검증 불가(로컬)라 **과엄격 거부로 정상 데이터 파손 위험**. 대부분 캐스트는 이미 `typeof`/`Array.isArray`/`?? []` 가드 존재.
- **조치(의존성 없는 가드)**: 가장 위험한 **무가드 벌크 배열 캐스트**(`(d.x as T[]) ?? []` — 비배열 응답 시 하위 `.map` 크래시)를 `asArray<T>(v)=Array.isArray(v)?v:[]` 로 교체. week34(3곳: sessions/weaknesses/corrections 등), week1(4곳: experiences/trials/targets/gapsToClose), week2(3곳: targets/versions/findings). tsc·build 검증.
- 남은 것: 비-배열 중첩 객체 캐스트의 전면 zod 검증 → **zod 의존성 추가 결정 필요**(별도). 영역: 타입계약.

## KI-11 · 1주차 직무 흐름 슬림화(후속) · P3 · 정리
- 배경: 1주차에 직무 선택이 두 군데(스텝 ③ JobsChat=`selectedJobs` vs ExploreCard 추천→체험→확정=`careerTargetJob`)라 중복·혼선. 사용자 피드백으로 **체험·결정 리포트 흐름 제거** 후, 다시 **두 직무 UI를 하나로 통합** 결정.
- 1차 조치: `Week1ExploreCard`를 목표 직무 확정 전용으로 슬림화(체험·결정 제거). 확정 시 다른 1순위 자동 강등, 표시용 label 부여, 사용자가 고른 구체 직무명은 `reason` 에 보존해 표시·프로필에 사용.
- 2차 조치(**통합**): 별도 `Week1ExploreCard` **삭제**. 목표 확정을 **스텝 ③ '관심 직무 선정'의 결과 패널(WeekStepper)로 이동** — 고른 관심 직무 옆 '목표로 정하기' 버튼으로 1순위 확정(`confirmTargetJob`, 서버가 라벨→직무군 해석). 확정 목표는 `state.targetJob` 에 기록해 WeekStepper 가 추가 조회 없이 🎯 표시. week2 근거(`targetJobConfirmed`)·프로필 targetRole 그대로 유지. → **직무 고르는 곳이 스텝 ③ 한 군데로 통일**.
- 3차 조치(**dead code 제거, 완료**): 미사용 확정된 서버 엔드포인트 `week1/recommendations`·`week1/trials/*`(5개)·`week1/decision`·`GET week1` **삭제**, 관련 헬퍼/스키마(`buildWeek1LlmContext`·`W1_RECO/EVAL/DECISION_SCHEMA`·`JOB_FAMILY_LIST_FOR_PROMPT`) 삭제. `career-week1.ts`에서 미니체험 템플릿·추천/결정 zod 스키마·`computeWeek1Completion` 제거(326→73줄, 직무군 taxonomy·경험카드 스키마·목표 상수만 존치). client `week1.ts`는 `confirmTargetJob`만 남기고 정리. 삭제 기능 테스트 정리(`test-career-week1.ts` 축소, 통합테스트 `itest-career-week1-db.ts` 삭제). **보존**: `week1/target`·`experiences` 엔드포인트, 공유 헬퍼(`getJobFamily`/`resolveJobFamily`/`isJobFamilyKey`/`week1CohortId`). api/web tsc·build·단위테스트 통과.
- 남은 것(선택): Prisma `careerJobTrial`·`careerJobDecisionReport` 테이블은 스키마/마이그레이션 리스크로 **미삭제**(앱 미사용, 무해). 필요 시 별도 마이그레이션으로 정리.

## KI-12 · Career Report 위치 이동 + 대시보드 완주 캡스톤 dead code 제거 · P3 · 정리
- 조치1: 1주차의 `CareerReportCard`(6영역 점수·로드맵)를 **4주차 종료 시점 캡스톤**으로 이동 — 1주차엔 이력서·자소서·면접 영역이 비어 시기상조·중복이었음. 데이터(대시보드·프로필·운영·스냅샷의 `careerReport` 재사용)는 유지.
- 조치2: 대시보드에 **import만 되고 렌더 안 되던 죽은 캡스톤** 제거 — `CompletionSummaryCard`·`FinalFeedbackCard` 컴포넌트 파일 삭제, 미사용 `reportReady` 제거, 이들 전용이던 client `fetchCompletion`·`Completion`·`fetchFinalFeedback` 삭제(이전 홈 정리 때 렌더가 빠진 잔재). web tsc·build 통과.
- 남은 것(선택, 무해): 이제 클라 호출부 0이 된 서버 엔드포인트 `GET /career-launch/completion`·`POST /career-launch/final-feedback` 잔존(운영 콘솔은 `state.finalFeedback` 표시만 하므로 기능 손실 없음 — 카드가 이미 미렌더였음). 후속 정리 대상. 영역: 백엔드.

---
### 배포 차단(P0) 이슈: **없음**

## KI-10 · 서버 생성 데이터 다국어화 · P2 · 부분 해결(Phase 16)
- 클라 구조 라벨: 6개국어 완료(growth·corrections·deliverables·dashboard-cards·week-frame·dashboard-states·PilotFeedbackWidget·오늘의 상담 인트로).
- **서버 대시보드 코치/다음행동(해결)**: 서버 `srvT(lang,...)` 헬퍼 + `NEXT_ACTION_ROUTE`(정적)/`nextActionStrings`(현지화) 신설, `GET /career-launch/dashboard?lang=` 로 클라 locale 수신. `coach.{todayFocus·purpose·cta·expectedResult·remembered·recentlyCompleted}` 와 nextAction 문자열을 6개국어로 생성(한국어 문법 변형 로직 제거·키별 완성문으로 재구조화). 클라 `fetchDashboard(locale)` + locale 변경 시 재조회. **api/web tsc·build 통과. 단 실제 렌더링·번역 품질은 NOT MEASURED**(실 대시보드 데이터+브라우저 필요).
- 남은 갭: LLM 생성 결과물(이력서/자소서/면접 피드백 등)·`a.label`(결과물명) 등 다른 서버 문자열; 이력서 문서(resume-render)는 한국 시장 제출용이라 한국어 유지가 적절. 영역: 백엔드/i18n.
