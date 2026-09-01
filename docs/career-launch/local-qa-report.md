# Career Launch — 로컬 통합 QA 기록 (Phase 12)

## 검수 환경
- 실행: 로컬 개발 (API `localhost:4000`, WEB `localhost:3000`). 패키지 매니저 npm, Node v24.14.1.
- **배포·push·PR 없음. 실사용자 데이터·운영 DB 미변경.**
- 로컬 DB: `careerbridge`(실데이터 존재 → seed/migration 미실행, 읽기·기존 통합테스트만).

## 실행 명령어
- API: (기존 방식) dev 서버 실행 → `:4000`
- WEB: `npm run dev`(webpack) → `:3000`
- 검증: `npx tsc --noEmit`(api/web), `npm run build`(web), `npx tsx apps/api/scripts/test-career-*.ts`(순수모듈), `node scripts/copy-audit.mjs`.

## ⚠️ 검증 범위 한계 (정직 고지)
- **이 환경에서는 실제 브라우저를 구동할 수 없음**(Playwright config·career-launch spec 부재, 신규 도입 금지 지시 준수). 따라서 **시각 렌더링·실제 클릭 흐름은 "확인함"으로 표기하지 않음**.
- 가능한 검증: 서버 기동·HTTP 라우트 스모크·auth 게이트·코드 정적 검토·build/tsc·개발잔재/링크/hydration 스캔.
- OpenAI(크레딧 필요)·GA(측정ID 게이트)는 로컬 미연결 → AI 상담 실사용·이벤트 전송은 미검증.

## 확인한 항목 (코드/HTTP 수준)
| 항목 | 결과 |
|---|---|
| API/WEB 서버 기동 | ✅ 200 |
| career-launch 라우트 스모크 | ✅ /·/dashboard·/week/1·/deliverables·/corrections·/growth·/ops 모두 200 |
| ops 보호 엔드포인트 | ✅ 401(미인증), 404(미존재) |
| 개발잔재(TODO/console.log/placeholder) | ✅ 0 |
| 내부 링크 → 실제 라우트 | ✅ 끊긴 링크 없음 |
| hydration 위험(Math.random 렌더) | ✅ 0 |
| tsc(api/web) | ✅ 0 |
| production build(web) | ✅ 173/173 |
| copy-audit(금지 용어) | ✅ 0 |
| 순수모듈 unit | ✅ profile·week1·week2·week34·league·pilot·org·kpi 전건 |

## 이번 세션 수정
| 문제 | 우선 | 파일 | 수정 전 | 수정 내용 | 재검증 |
|---|---|---|---|---|---|
| 하단 우측 피드백 위젯이 대시보드에 **상시 노출** | P2 | `PilotFeedbackWidget.tsx`·`dashboard/page.tsx` | surveyKey 없이 마운트→아무 설문+빠른피드백 버튼 상시 | **각 주차 완료 시 그 주차 설문만 1회 노출**, 응답/닫기 후 localStorage로 재노출 차단, 빠른피드백은 설문 카드 내부로 | tsc·build ✅ |
| 타이포 위계 약함 | P3 | `globals.css` + 5개 화면 | 균일한 텍스트 크기 | **매거진 에디토리얼 타입 스케일**(cl-eyebrow/display/headline/title/lead/caption) + 허브·주차 히어로·섹션 헤더 적용 | tsc·build ✅ |

## 화면별 결과
| 화면 | 결과 | 근거 |
|---|---|---|
| 랜딩 | **PARTIAL** | 라우트 200·코드 구조 확인 / 시각 미검증 |
| 참여자 대시보드 | **PARTIAL** | 200·h1(sr-only)·VM 조합·상태 코드 확인 / 시각 미검증 |
| AI 상담 | **PARTIAL** | 인트로 게이트·오류 시 입력보존 코드 확인 / **실 AI 응답 미검증(크레딧)** |
| 1~4주차 | **PARTIAL** | 200·공통 프레임·완료조건 확인 / 시각 미검증 |
| 결과물/오답/성장 허브 | **PARTIAL** | 200·VM·매거진 적용 / 시각 미검증 |
| 관리자(ops) | **PARTIAL** | 200·주의큐·권한 게이트 / 시각 미검증 |
| 기관 담당자 | **PARTIAL** | requireOrgPerm 격리 확인(통합테스트) / 시각 미검증 |
| KPI 대시보드 | **NOT TESTED(화면)** | 엔드포인트만·프론트 화면 미구현 |
| 기존 V1 | **PARTIAL** | 레거시 URL·step id 불변 확인 / 시각 미검증 |

## 확인하지 못한 항목
- 실제 브라우저 렌더링·클릭 흐름·모바일 뷰포트(360~1440)·모바일 키보드·차트 렌더·모달/드로어 실동작.
- 실제 AI 상담(OpenAI 크레딧)·분석 이벤트 전송(GA).
- 관리자/기관 실계정 UI(fixture는 개발 DB 필요).

## 남은 문제
- **P0/P1**: 코드·라우트·격리 수준에서 발견 없음.
- **P2**: KPI 대시보드 프론트 화면 미구현(엔드포인트만); 실기기 반응형·상태별 화면 시각 검증 필요.
- **P3**: 매거진 타이포 나머지 화면(ops·상담) 확대 적용.

## 다음 로컬 검수에서 확인할 것
실 브라우저 6개 뷰포트 × 핵심 화면, 실 AI 상담(크레딧 충전 후), 개발 DB fixture로 상태별(신규/진행/완료/잠금/오류) 화면, 관리자/기관 실계정 흐름.

---

## Phase 16 최종 회귀·정리 (요약)
정적 전수 감사(라우트/CTA·기능 구현상태·placeholder/용어/타입) + build/tsc 완료. 상세는 `release-readiness.md`·`known-issues.md` 참조.
- **핵심 4주 흐름 CTA: 깨진 것 없음(must-fix 0).** 17개 영역 중 15 IMPLEMENTED, mock/placeholder 데이터 없음.
- **정리 완료**: 용어 버그 3건(자기소개서 "3주차"→"2주차", 중복 단어), 대시보드 dead helper 3함수 제거, 미사용 컴포넌트 7종 삭제(build 검증), `.env.example` optional 문서화.
- **남은 이슈**: P0 없음. P1 = 분석 GA→DB 이중화, growth·corrections i18n. P2/REVIEW = 고아 라우트 5종 결정, 관리자 nav 정합, `as` 캐스트 zod화. → `known-issues.md`.
- **판정: LOCAL RELEASE CANDIDATE WITH CONDITIONS** (브라우저 전체 흐름·실 LLM/부하 NOT TESTED).
