# Career Launch — 대학·기관 B2B 운영 확장 (Phase 11)

Career Launch를 여러 기관에 반복 판매·운영하는 멀티테넌트 제품으로 만드는 기반. 결제·전자계약·실제 외부 발송은 이번 범위가 아니다(사용량 데이터는 추후 연결 가능).

## 1. 아키텍처
- 순수 로직 `apps/api/src/career-org.ts` — 기관 유형/상태, **중앙 권한 매트릭스**(`PERMISSION_MATRIX`·`can`/`canAny`), 좌석 계산(`computeSeatUsage`·`canAllocateSeat`), 라이선스 상태(`deriveLicenseStatus`), 초대 전이, CSV 검증(`validateCsvRows`), 리포트 작은표본 숨김(`shouldHideGroup`), 감사 액션 목록. 단위 테스트 20개.
- 인가는 `index.ts`의 서버측 계층으로 강제: `resolveActorOrgRoles(req, orgId)`(DB membership 조회, 전역 OPERATOR=aply_super) → `requireOrgPerm(req,res,orgId,permission)`. **클라이언트 organizationId 불신, 화면 숨김 아님.**
- 감사 `writeOrgAudit`(민감 원문 미저장).
- 프론트 `app/career-launch/ops/orgs/page.tsx`(기관 대시보드·담당자·좌석·리포트·감사), `lib/launch/org-client.ts`.

## 2. 데이터 모델 (additive)
- `Organization`(기관 — 채용사 PartnerOrganization과 별개), `OrganizationMembership`(기관 역할), `CareerProgramTemplate`+`CareerCohortTemplateSnapshot`(템플릿·스냅샷), `OrganizationLicense`(좌석), `CareerStaffAssignment`(강사·상담자), `CareerOrganizationReport`(성과 스냅샷), `OrganizationAuditLog`(감사).
- `CareerCohort` +`organizationId`(nullable)·`templateId` — 기존 기수 무영향.
- **레거시 `university` 문자열 유지**. backfill `apps/api/scripts/phase11-org-backfill.ts`(DRY-RUN 기본, `--commit` 반영, 멱등, 파괴적 변경 0)로 university→Organization 매핑.
- 마이그레이션 `20260906000000_add_org_b2b`(로컬 적용). 스테이징/프로덕션 `migrate deploy` 필요.

## 3. 역할·권한 (중앙 매트릭스)
- 전역: `aply_super`(전권, 기존 OPERATOR), `aply_operator`.
- 기관: `org_admin`(기관 운영·등록·리포트, **원문 접근 불가**), `org_observer`(집계·리포트 열람만), `instructor`(배정 범위 진행/결과 검토), `counselor`(배정 학생 개입).
- **원문(student:read_raw)은 APLY 측만.** 기관 관리자에게도 상담·이력서·면접 원문 미노출.

## 4. 멀티테넌트 격리
1. 모든 기관 API가 `requireOrgPerm`로 서버측 membership 검증. 2. 교차 기관 접근 차단(다른 org 멤버십 없으면 403). 3. 리포트 다운로드도 동일 권한. 4. cohort/enroll은 `cohort.organizationId === orgId` 재확인. 통합테스트 `itest-career-org-db.ts`로 A/B 격리 검증.

## 5. 프로그램 템플릿·기수
- 템플릿(`configuration`에 주차·미션·완료조건·세미나·설문·flag·직무체험·패키지·면접·경쟁·개입·KPI·리포트 규칙). 새 버전은 `POST /templates/:id/version`.
- 기수 생성 시 **템플릿 스냅샷 저장** → 이후 템플릿 수정과 무관하게 진행 중 기수는 스냅샷을 따름.
- 기수 복제(`POST /cohorts/:id/clone`): 주차·세미나·설문·flag·리포트 설정·스냅샷만. **학생·결과물·점수·리그·개입·설문응답·개인정보 미복제.**

## 6. 학생 등록·좌석
- 개별 등록, CSV 검증(미리보기·행별·파일내 중복·최대 500행), CSV 커밋(멱등: 기존 등록 스킵), 초대 링크(inviteCode 기반, **외부 발송 없음**), 등록 취소.
- 좌석: allocated=등록 / activated=첫 상담 / completed=Week4. **중복 등록·재초대는 1좌석**(중복 차감 방지). 좌석 부족 시 **신규 활성화만 제한, 기존 학생 데이터 삭제 없음**. suspended/expired 기관·라이선스는 신규 제한.

## 7. 성과 리포트 (기관 제출용)
- 집계 스냅샷 + `metricVersion`(org_metrics_v1). **표본 5명 미만은 세부 분류 숨김.** 학생 원문(이력서·상담·면접 답변) 미포함. 웹 화면·CSV 우선(PDF는 기존 체계 있을 때만).
- 다운로드는 `report:download` 권한 + 감사 로그.

## 8. 감사 로그
기관 생성·수정·상태변경·멤버·기수 생성/복제·등록·CSV·좌석·배정·flag·리포트 생성/다운로드·개입. `{before,after}`는 요약 변경분만 — **비밀번호·토큰·이력서/상담 원문 미저장.**

## 9. API (요약)
- 기관: `POST/GET /career-launch/orgs`, `GET/PATCH /orgs/:id`, 멤버 `GET/POST/DELETE /orgs/:id/members`.
- 템플릿: `GET/POST /templates`, `POST /templates/:id/version`.
- 기수: `GET/POST /orgs/:id/cohorts`, `POST /cohorts/:id/clone`.
- 학생: enroll, `students/csv/validate`, `.../csv/commit`, `invite-link`, unenroll.
- 좌석: `GET /orgs/:id/license`, `PUT`(APLY).
- 배정: `POST/GET /orgs/:id/staff`.
- 대시보드/리포트/감사: `GET /orgs/:id/dashboard`, `POST/GET /orgs/:id/reports`, `GET /orgs/:id/reports/:rid`, `GET /orgs/:id/audit`.
- 모두 authenticate + 서버측 org-scope 권한.

## 10. 알려진 한계 / 후속
- 기관 상태별 접근 정책은 신규 활성화 제한까지 구현(세부 read 정책은 후속).
- CSV 업로드 UI(파싱·미리보기 화면), PDF 리포트, 역할별 전용 화면(강사·상담자·관찰자 뷰), 화이트라벨 브랜딩은 후속.
- 실제 이메일 초대·결제·청구 미구현(사용량 데이터는 제공).
- 대량 학생 리스트 성능: 대시보드는 집계 쿼리로 처리, 대규모 확장 시 스냅샷 캐시 검토.

## 11. 운영 체크리스트 (첫 유료 기관 전, 사람 수행)
- [ ] 스테이징 `migrate deploy`(20260906) + backfill `--commit` 검토
- [ ] APLY 운영자가 기관 생성 → org_admin 지정(가입된 사용자)
- [ ] 라이선스/좌석 설정(APLY)
- [ ] 프로그램 템플릿 생성 → 기수 생성(스냅샷 확인)
- [ ] 격리 확인(다른 기관 관리자 접근 403)
- [ ] 리포트 작은표본 숨김·원문 미포함 확인
- [ ] 개인정보 처리방침·데이터 보존기간(기관 configuration)
