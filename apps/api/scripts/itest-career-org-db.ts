// Phase 11 기관 B2B 데이터 흐름 통합 테스트(실 DB, 비-LLM). 멀티테넌트 격리·멤버십·템플릿·좌석·감사.
// 안전: 생성분만 정리(임시 org/cohort/멤버십). 운영 데이터 무변경.
// 실행: set -a; . ./.env; set +a; npx tsx apps/api/scripts/itest-career-org-db.ts
import { PrismaClient } from "@prisma/client";
import { can, canAny, computeSeatUsage, deriveLicenseStatus, validateCsvRows, type ActorRole } from "../src/career-org";

const prisma = new PrismaClient();
const log = (...a: unknown[]) => console.log(...a);

// 서버 인가 로직과 동일한 규칙(격리 검증): 사용자의 org 역할 조회 후 permission 확인.
async function rolesInOrg(userId: string, orgId: string): Promise<ActorRole[]> {
  const ms = await prisma.organizationMembership.findMany({ where: { organizationId: orgId, userId, status: "active" }, select: { role: true } });
  return ms.map((m) => m.role as ActorRole);
}

async function main() {
  const users = await prisma.user.findMany({ take: 2, orderBy: { createdAt: "asc" }, select: { id: true } });
  if (users.length < 2) {
    log("사용자 2명 미만 — 스킵");
    await prisma.$disconnect();
    return;
  }
  const [adminA, adminB] = users;
  const ids = { orgA: "", orgB: "", cohortA: "", templateId: "", reportId: "" };
  try {
    // 1) 두 기관 생성 + 각각 다른 org_admin.
    const orgA = await prisma.organization.create({ data: { name: "__ITEST_ORG_A__", type: "university", status: "active" } });
    const orgB = await prisma.organization.create({ data: { name: "__ITEST_ORG_B__", type: "public_agency", status: "active" } });
    ids.orgA = orgA.id;
    ids.orgB = orgB.id;
    await prisma.organizationMembership.create({ data: { organizationId: orgA.id, userId: adminA.id, role: "org_admin", status: "active" } });
    await prisma.organizationMembership.create({ data: { organizationId: orgB.id, userId: adminB.id, role: "org_admin", status: "active" } });
    log("  ✓ 기관 2개 + 각 org_admin 생성");

    // 2) 멀티테넌트 격리 — A 관리자는 A 만, B 는 접근 불가.
    const aInA = await rolesInOrg(adminA.id, orgA.id);
    const aInB = await rolesInOrg(adminA.id, orgB.id);
    if (!canAny(aInA, "cohort:read")) throw new Error("A 관리자가 자기 기관 읽기 실패");
    if (canAny(aInB, "cohort:read")) throw new Error("격리 위반: A 관리자가 B 기관 접근 가능");
    log(`  ✓ 격리: A는 A접근(${aInA.join(",")}) / B접근 차단(${aInB.length === 0 ? "역할없음" : aInB.join(",")})`);

    // 3) org_admin 은 원문 접근 불가(권한 매트릭스).
    if (can("org_admin", "student:read_raw")) throw new Error("org_admin 이 원문 접근 가능(정책 위반)");
    log("  ✓ org_admin 원문(student:read_raw) 접근 불가 확인");

    // 4) 템플릿 → 기수 생성 + 스냅샷(이후 템플릿 수정과 무관).
    const template = await prisma.careerProgramTemplate.create({ data: { name: "__ITEST_TPL__", version: 1, programVersion: "v2", configuration: { durationWeeks: 4, kpiTargets: { week1Completed: 65 } } as object } });
    ids.templateId = template.id;
    const cohortA = await prisma.careerCohort.create({ data: { organizationId: orgA.id, university: orgA.name, name: "__ITEST_COHORT__", inviteCode: `__ITEST_ORG_${Date.now().toString().slice(-8)}`, templateId: template.id, programVersion: "v2" } });
    ids.cohortA = cohortA.id;
    await prisma.careerCohortTemplateSnapshot.create({ data: { cohortId: cohortA.id, templateId: template.id, templateVersion: 1, configuration: template.configuration as object } });
    const snap = await prisma.careerCohortTemplateSnapshot.findUnique({ where: { cohortId: cohortA.id } });
    if (!snap) throw new Error("스냅샷 생성 실패");
    log("  ✓ 템플릿 기반 기수 생성 + 스냅샷 저장(기수는 스냅샷을 따름)");

    // 5) 좌석 계산 — 중복 등록은 1좌석(중복 차감 방지).
    const seatStudents = [
      { studentUserId: adminA.id, activated: true, completed: false },
      { studentUserId: adminA.id, activated: false, completed: false }, // 중복
      { studentUserId: adminB.id, activated: false, completed: false }
    ];
    const usage = computeSeatUsage(seatStudents, 2);
    if (usage.allocated !== 2) throw new Error(`좌석 중복 차감(기대 2, 실제 ${usage.allocated})`);
    const lic = deriveLicenseStatus({ stored: "active", endAtMs: Date.now() + 864e5, nowMs: Date.now(), allocated: usage.allocated, contractedSeats: 2 });
    if (lic !== "exhausted") throw new Error(`라이선스 소진 판정 오류(${lic})`);
    log(`  ✓ 좌석 계산(배정 ${usage.allocated}, 활성 ${usage.activated}) + 라이선스 ${lic}`);

    // 6) CSV 검증(순수) — 중복/오류 구분.
    const csv = validateCsvRows([{ email: "x@a.com" }, { email: "x@a.com" }, { email: "bad" }]);
    if (csv.valid !== 1 || csv.duplicates !== 1 || csv.invalid !== 1) throw new Error("CSV 검증 오류");
    log("  ✓ CSV 검증(유효1·중복1·오류1)");

    // 7) 리포트 스냅샷 + 감사 로그.
    const report = await prisma.careerOrganizationReport.create({ data: { organizationId: orgA.id, cohortId: cohortA.id, reportType: "cohort_performance", metricVersion: "org_metrics_v1", snapshotData: { cover: { participants: 3 } } as object, generatedBy: adminA.id } });
    ids.reportId = report.id;
    await prisma.organizationAuditLog.create({ data: { organizationId: orgA.id, actorId: adminA.id, actorRole: "org_admin", action: "report.generate", targetType: "report", targetId: report.id, changeData: { after: { reportType: "cohort_performance" } } as object } });
    const auditCount = await prisma.organizationAuditLog.count({ where: { organizationId: orgA.id } });
    if (auditCount < 1) throw new Error("감사 로그 기록 실패");
    log(`  ✓ 리포트 스냅샷(metricVersion) + 감사 로그 ${auditCount}건`);

    log("\n✅ Phase 11 기관 B2B 데이터 흐름 통합 테스트 통과");
  } finally {
    // 정리(생성분만). Cascade 로 멤버십·라이선스·리포트·감사·스냅샷 함께 삭제.
    if (ids.cohortA) {
      await prisma.careerCohortTemplateSnapshot.deleteMany({ where: { cohortId: ids.cohortA } }).catch(() => null);
      await prisma.careerCohort.deleteMany({ where: { id: ids.cohortA } }).catch(() => null);
    }
    if (ids.templateId) await prisma.careerProgramTemplate.deleteMany({ where: { id: ids.templateId } }).catch(() => null);
    if (ids.orgA) await prisma.organization.deleteMany({ where: { id: ids.orgA } }).catch(() => null);
    if (ids.orgB) await prisma.organization.deleteMany({ where: { id: ids.orgB } }).catch(() => null);
    log("  ✓ 테스트 데이터 정리 완료(DB 원상복구)");
    await prisma.$disconnect();
  }
}
main().catch(async (e) => {
  console.error("통합 테스트 실패:", e instanceof Error ? e.message : e);
  await prisma.$disconnect();
  process.exit(1);
});
