# Career Launch — 개인정보 분류·처리 (Phase 11)

기술 구현 상태 기준. **보관기간·법적 기준은 코드로 확정 불가 → `POLICY DECISION REQUIRED`.** 임의 확정하지 않음.

## 분류 표
| 분류 | 항목 | 저장 위치 | 접근 역할 | AI 전달 | 로그 포함 | 분석 포함 | 마스킹 | 보관 정책 |
|---|---|---|---|---|---|---|---|---|
| **직접 식별** | 이름·실명 | User | 본인·운영자·기관(필요범위) | 실명만(이력서용, 최소) | ✗ | ✗ | 목록서 부분 | POLICY |
| | 이메일·전화 | User | 본인·운영자 | ✗ | ✗ | ✗ | 목록 마스킹 권장 | POLICY |
| | 계정 식별자 | User.id | 서버 | ✗ | 익명 id로 | ✗ | — | — |
| | 학교·기관 | Education·Organization | 본인·운영자·기관 | 요약 | ✗ | institution_id만 | — | POLICY |
| **경력·지원** | 학력·경력·프로젝트·기술 | CandidateProfile·CareerExperience | 본인·운영자(필요) | 구조화 요약(최소) | ✗ | ✗ | — | POLICY |
| | 이력서·자기소개서 | CareerResumeData·CoverLetterData·CareerDocumentVersion | 본인·운영자(필요) | 현재 작업분만 | ✗ | ✗ | 대시보드 원문 미노출 | POLICY |
| | 지원 직무·기업명 | CareerTargetJob·ApplicationTarget | 본인·운영자 | 필요분 | ✗ | ✗ | — | POLICY |
| **상담·평가** | AI 대화 | CareerLaunchProgress.state(요약)·CareerCoachingSession | 본인·운영자(필요·감사) | 최근 요약 우선 | ✗ | ✗ | 목록 미노출 | POLICY |
| | 면접 답변·평가·약점 | CareerInterviewAnswer·Weakness | 본인·운영자(필요) | 평가 시 해당분 | ✗ | ✗ | 목록 미노출 | POLICY |
| | 오답노트 | CareerInterviewCorrection | 본인·운영자 | 해당 오답 | ✗ | ✗ | — | POLICY |
| | 코치 메모 | CareerIntervention.evidence/aiSummary | 운영자·담당 코치 | **✗(명시 필요시만)** | ✗ | ✗ | — | POLICY |
| | 만족도·자유응답 | CareerPilotSurvey·CareerLaunchSatisfaction | 운영자(집계) | ✗ | ✗ | category/척도만 | 집계만 | POLICY |
| **운영** | 접속·진행·미션 | CareerLaunchProgress·CareerActivityEvent | 본인·운영자 | ✗ | 익명 id | 원문 없음 | — | POLICY |
| | 분석 이벤트 | GA | — | ✗ | — | enum·수치만(PII 없음) | — | GA 정책 |
| | 오류 기록 | 서버 로그 | 개발·운영 | ✗ | request_id 권장 | ✗ | — | POLICY |
| | 개입 기록 | CareerIntervention(Log) | 운영자·담당 | ✗ | ✗ | ✗ | — | POLICY |

## 최소 수집·노출 (구현 상태)
- 학생 데이터는 **본인 스코프**(서버 `where studentUserId: req.auth.userId`) — 366곳.
- 관리자 목록은 이름 중심(운영 식별 정당), **상담/이력서 원문은 대시보드 기본 미노출**(필요 시 상세·감사).
- 클라이언트 상태·URL·분석 이벤트에 **원문 미포함**.
- 고위험 정보(주민번호·여권·계좌) **입력 안내로 차단**(참여자 가이드).

## 삭제·탈퇴·데이터 권리 (§17)
| 항목 | 구현 상태 |
|---|---|
| 본인 결과물 삭제 | 부분(이력서/자소서 편집·삭제 경로 존재) — **POLICY DECISION REQUIRED**(Career Launch 산출물 삭제 범위) |
| 계정 탈퇴 | 기존 User 삭제 경로 존재(Cascade). Career Launch 데이터 onDelete Cascade 연결 |
| 탈퇴 후 CL 데이터 | Cascade 삭제(FK). **백업 처리 = POLICY DECISION REQUIRED** |
| 기관 종료 후 데이터 | suspended/expired는 신규만 제한, 기존 보존 — **보관기간 POLICY DECISION REQUIRED** |
| 결과물 다운로드 | 인쇄/미리보기 존재 |
| 운영자 삭제 요청 처리 | 절차 **POLICY DECISION REQUIRED** |
| 법적 보존 데이터 구분 | **POLICY DECISION REQUIRED** |

> 삭제 검증 시 실제 사용자 데이터 삭제 금지(개발 DB에서만).
