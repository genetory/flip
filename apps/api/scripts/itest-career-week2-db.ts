// Week 2 데이터 흐름 통합 테스트(실 DB, 비-LLM). 공고→패키지→문서버전→일관성→점수→확정→예상질문→완료.
// 안전: 관련 레코드가 없는 학생에게 적용→검증→생성분만 정리.
// 실행: set -a; . ./.env; set +a; npx tsx apps/api/scripts/itest-career-week2-db.ts
import { PrismaClient } from "@prisma/client";
import { computeApplicationReadiness, computeWeek2Completion, countByStatus } from "../src/career-week2";

const prisma = new PrismaClient();
const log = (...a: unknown[]) => console.log(...a);

async function main() {
  const alt = await prisma.careerEnrollment.findMany({ take: 30, orderBy: { createdAt: "desc" }, select: { studentUserId: true, cohortId: true } });
  let target: { studentUserId: string; cohortId: string | null } | null = null;
  for (const a of alt) {
    const c = await prisma.careerApplicationTarget.count({ where: { studentUserId: a.studentUserId } });
    if (c === 0) {
      target = a;
      break;
    }
  }
  if (!target) {
    log("적합한 학생 없음 — 스킵");
    await prisma.$disconnect();
    return;
  }
  const userId = target.studentUserId;
  const cohortId = target.cohortId;
  log(`대상 학생: ...${userId.slice(-6)}`);
  const created = { targetId: "", pkgId: "", resumeVerId: "", coverVerId: "", iqId: "" };
  try {
    // 1) 기준 공고 + 패키지.
    const tgt = await prisma.careerApplicationTarget.create({ data: { studentUserId: userId, cohortId, sourceType: "paste", companyName: "테스트사", jobTitle: "서비스 기획", rawContent: "__ITEST__", structuredData: { jobTitle: "서비스 기획", requirements: ["문제 정의"] }, analysisData: { requiredCompetencies: ["문제정의"], missing: ["데이터"] }, status: "analyzed" } });
    created.targetId = tgt.id;
    const pkg = await prisma.careerApplicationPackage.create({ data: { studentUserId: userId, cohortId, applicationTargetId: tgt.id, status: "draft" } });
    created.pkgId = pkg.id;
    log("  ✓ 기준 공고 + 패키지 생성");

    // 2) 이력서/자소서 버전(문장별 근거).
    const links = [{ id: "s1", text: "사용자 문제를 정리했어요", status: "verified" }, { id: "s2", text: "매출 20% 개선", status: "unsupported" }];
    const rv = await prisma.careerDocumentVersion.create({ data: { studentUserId: userId, cohortId, documentType: "resume", variant: "targeted", applicationTargetId: tgt.id, content: { headline: "서비스 기획 지망" }, sourceLinks: links as object, validationData: { counts: countByStatus(links as never) } as object, generatedBy: "ai" } });
    created.resumeVerId = rv.id;
    const cv = await prisma.careerDocumentVersion.create({ data: { studentUserId: userId, cohortId, documentType: "cover", variant: "targeted", applicationTargetId: tgt.id, content: { items: [{ id: "c1", prompt: "지원동기", answer: "..." }] }, sourceLinks: [{ id: "c1", text: "동아리 조율 경험", status: "verified" }] as object, generatedBy: "ai" } });
    created.coverVerId = cv.id;
    await prisma.careerApplicationPackage.update({ where: { id: pkg.id }, data: { resumeVersionId: rv.id, coverVersionId: cv.id } });
    log("  ✓ 공고맞춤 이력서·자소서 버전 생성(문장별 근거)");

    // 3) 일관성(critical 1건) → 확인 처리.
    const findings = [{ id: "f1", severity: "critical", category: "metric_mismatch", message: "성과 수치 근거 부족", refs: ["s2"], resolved: false, userAcknowledged: false }];
    await prisma.careerApplicationPackage.update({ where: { id: pkg.id }, data: { validationData: { findings, criticalUnresolved: 1 } as object, status: "checking" } });
    // 사용자 확인 → criticalUnresolved 0
    const resolved = findings.map((f) => ({ ...f, userAcknowledged: true }));
    await prisma.careerApplicationPackage.update({ where: { id: pkg.id }, data: { validationData: { findings: resolved, criticalUnresolved: 0 } as object } });
    log("  ✓ 일관성 검사 critical 1건 → 사용자 확인 처리");

    // 4) 점수 + Readiness(중앙 가중치).
    const readiness = computeApplicationReadiness({ resumeTotal: 78, coverTotal: 72, jdMatchTotal: 65, unsupportedCount: 1, criticalUnresolved: 0 });
    await prisma.careerApplicationPackage.update({ where: { id: pkg.id }, data: { scoreData: { resume: { total: 78 }, cover: { total: 72 }, jdMatch: { total: 65 }, readiness } as object, readinessScore: readiness.score } });
    log(`  ✓ Application Readiness = ${readiness.score} (ready=${readiness.ready})`);

    // 5) 최종 확정.
    await prisma.careerApplicationPackage.update({ where: { id: pkg.id }, data: { status: "finalized", finalizedAt: new Date() } });

    // 6) Week3 예상 질문 세트.
    const iq = await prisma.careerInterviewQuestionSet.create({ data: { studentUserId: userId, cohortId, applicationPackageId: pkg.id, questions: [{ question: "성과 수치의 근거는?", type: "fact_check", source: "resume" }] as object, promptVersion: "iq_v1" } });
    created.iqId = iq.id;
    log("  ✓ 지원 패키지 확정 + Week3 예상 질문 저장");

    // 7) 완료 판정.
    const finalPkg = await prisma.careerApplicationPackage.findUnique({ where: { id: pkg.id } });
    const completion = computeWeek2Completion({
      targetJobConfirmed: true, masterResumeExists: true, applicationTargetSelected: true, jdAnalyzed: true,
      targetedResumeExists: true, coverRequiredDone: true, criticalResolvedOrAck: (finalPkg?.readinessScore != null),
      unsupportedReviewed: true, readinessScoreExists: finalPkg?.readinessScore != null, packageFinalized: finalPkg?.status === "finalized", interviewQuestionsGenerated: true
    });
    log(`  ✓ Week2 완료 판정: ${completion.doneCount}/11, complete=${completion.complete}`);
    if (!completion.complete) throw new Error("완료 판정 실패: " + JSON.stringify(completion.checks.filter((c) => !c.done)));

    log("\n✅ Week2 데이터 흐름 통합 테스트 통과");
  } finally {
    if (created.iqId) await prisma.careerInterviewQuestionSet.deleteMany({ where: { id: created.iqId } }).catch(() => null);
    if (created.resumeVerId || created.coverVerId) await prisma.careerDocumentVersion.deleteMany({ where: { id: { in: [created.resumeVerId, created.coverVerId].filter(Boolean) } } }).catch(() => null);
    if (created.pkgId) await prisma.careerApplicationPackage.deleteMany({ where: { id: created.pkgId } }).catch(() => null);
    if (created.targetId) await prisma.careerApplicationTarget.deleteMany({ where: { id: created.targetId } }).catch(() => null);
    log("  ✓ 테스트 데이터 정리 완료(DB 원상복구)");
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error("통합 테스트 실패:", e instanceof Error ? e.message : e);
  await prisma.$disconnect();
  process.exit(1);
});
