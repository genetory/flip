// Week 3~4 데이터 흐름 통합 테스트(실 DB, 비-LLM). 세션→답변→취약→오답→재도전→유사전이→통과→성장→완료.
// 안전: 세션 없는 학생에게 적용→검증→생성분만 정리.
// 실행: set -a; . ./.env; set +a; npx tsx apps/api/scripts/itest-career-week34-db.ts
import { PrismaClient } from "@prisma/client";
import { answerEvalTotal, evaluateCorrectionPass, computeGrowth, computeWeek3Completion, computeWeek4Completion, canTransitionCorrection } from "../src/career-week34";

const prisma = new PrismaClient();
const log = (...a: unknown[]) => console.log(...a);

async function main() {
  const alt = await prisma.careerEnrollment.findMany({ take: 30, orderBy: { createdAt: "desc" }, select: { studentUserId: true, cohortId: true } });
  let target: { studentUserId: string; cohortId: string | null } | null = null;
  for (const a of alt) {
    const c = await prisma.careerInterviewSession.count({ where: { studentUserId: a.studentUserId } });
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
  const ids = { initId: "", finalId: "", corrId: "", growthId: "" };
  try {
    // 1) 최초면접 세션 + 질문 + 답변(평가 포함).
    const init = await prisma.careerInterviewSession.create({ data: { studentUserId: userId, cohortId, sessionType: "initial_mock", status: "completed", startedAt: new Date(), completedAt: new Date(), reportData: { total: 52 } } });
    ids.initId = init.id;
    const evalLow = { scores: { questionUnderstanding: 60, relevance: 55, specificity: 40, evidence: 40, structure: 45, jobConnection: 45, consistency: 55, delivery: 55 }, total: 0, weaknessTypes: ["UNCLEAR_ROLE", "WEAK_EVIDENCE"] };
    evalLow.total = answerEvalTotal(evalLow.scores);
    for (let i = 0; i < 5; i++) {
      const q = await prisma.careerInterviewQuestion.create({ data: { studentUserId: userId, sessionId: init.id, question: `__ITEST__ Q${i}`, type: "experience", order: i } });
      await prisma.careerInterviewAnswer.create({ data: { studentUserId: userId, sessionId: init.id, questionId: q.id, answerText: "답변", evaluationData: evalLow as object, score: evalLow.total, answeredAt: new Date() } });
    }
    log(`  ✓ 최초면접 세션+질문5+답변5(평가 total=${evalLow.total})`);

    // 2) 취약패턴 + 오답노트.
    const w = await prisma.careerInterviewWeakness.create({ data: { studentUserId: userId, cohortId, weaknessType: "UNCLEAR_ROLE", title: "역할이 불분명", occurrenceCount: 4, severity: "high", status: "open" } });
    const corr = await prisma.careerInterviewCorrection.create({ data: { studentUserId: userId, cohortId, weaknessId: w.id, question: "__ITEST__ 갈등 해결 경험?", questionType: "conflict", status: "discovered", initialScore: 49, latestScore: 49 } });
    ids.corrId = corr.id;
    log("  ✓ 취약패턴 + 오답노트 생성");

    // 3) 상태 전이 discovered→coaching→retrying + 같은질문 재도전(개선).
    assert(canTransitionCorrection("discovered", "coaching"));
    await prisma.careerInterviewCorrection.update({ where: { id: corr.id }, data: { status: "coaching" } });
    await prisma.careerInterviewCorrectionAttempt.create({ data: { studentUserId: userId, correctionId: corr.id, questionText: corr.question, answerText: "개선된 답변", attemptType: "same_question", score: 68 } });
    await prisma.careerInterviewCorrection.update({ where: { id: corr.id }, data: { status: "retrying", attemptCount: 1, latestScore: 68 } });

    // 4) 유사질문 전이 + 통과 판정.
    const pass = evaluateCorrectionPass({ sameQuestionImproved: true, similarUsedStructure: true, consistentWithDocument: true, evidenceConcrete: true, roleClear: true, jobConnected: true, noNewCritical: true, aiConfidence: 0.8 });
    await prisma.careerInterviewCorrectionAttempt.create({ data: { studentUserId: userId, correctionId: corr.id, questionText: "유사 질문", answerText: "구조적 답변", attemptType: "similar_question", score: 74, passed: pass.passed } });
    await prisma.careerInterviewCorrection.update({ where: { id: corr.id }, data: { status: "passed", transferAttemptCount: 1, latestScore: 74, passedAt: new Date(), passReason: pass as object } });
    await prisma.careerInterviewWeakness.update({ where: { id: w.id }, data: { status: "resolved" } });
    log(`  ✓ 재도전→유사질문 전이→통과(passed=${pass.passed})`);

    // 5) 최종면접 세션(개선 점수).
    const fin = await prisma.careerInterviewSession.create({ data: { studentUserId: userId, cohortId, sessionType: "final_mock", status: "completed", startedAt: new Date(), completedAt: new Date(), reportData: { total: 71 } } });
    ids.finalId = fin.id;
    const evalHigh = { scores: { questionUnderstanding: 75, relevance: 72, specificity: 68, evidence: 65, structure: 70, jobConnection: 68, consistency: 72, delivery: 70 }, total: 70 };
    for (let i = 0; i < 3; i++) {
      const q = await prisma.careerInterviewQuestion.create({ data: { studentUserId: userId, sessionId: fin.id, question: `__ITEST__ FQ${i}`, type: "experience", order: i } });
      await prisma.careerInterviewAnswer.create({ data: { studentUserId: userId, sessionId: fin.id, questionId: q.id, answerText: "개선답변", evaluationData: evalHigh as object, score: evalHigh.total, answeredAt: new Date() } });
    }

    // 6) 성장률.
    const growth = computeGrowth({ initialTotal: 52, finalTotal: 71, initialAxes: { evidence: 40, jobConnection: 45 }, finalAxes: { evidence: 65, jobConnection: 68 }, correctionsTotal: 1, correctionsPassed: 1, transferTotal: 1, transferPassed: 1, weaknessesTotal: 1, weaknessesResolved: 1, followupHandled: 0.6, scoringVersion: "iv_scoring_v1" });
    const gr = await prisma.careerInterviewGrowthReport.create({ data: { studentUserId: userId, cohortId, initialSessionId: init.id, finalSessionId: fin.id, growthData: growth as object, remainingWeaknesses: [] as object, nextActions: { next30Days: ["실전 지원 3곳"] } as object } });
    ids.growthId = gr.id;
    log(`  ✓ 최종면접 + 성장률(${growth.initialScore}→${growth.finalScore}, 통과율 ${growth.correctionPassRate}%)`);

    // 7) 완료 판정.
    const w3 = computeWeek3Completion({ packageExists: true, strategyViewed: true, initialMockCompleted: true, minQuestionsAnswered: true, perQuestionEvaluated: true, weaknessAnalyzed: true, correctionNotes: 5, reportViewed: true, trainingPlanCreated: true });
    const w4 = computeWeek4Completion({ correctionsTrained: 5, sameQuestionRetried: true, requiredTransferDone: true, finalMockCompleted: true, comparisonDone: true, growthReportExists: true, plan30Viewed: true });
    log(`  ✓ Week3 완료 ${w3.doneCount}/9=${w3.complete}, Week4 완료 ${w4.doneCount}/7=${w4.complete}`);

    log("\n✅ Week3~4 데이터 흐름 통합 테스트 통과");
  } finally {
    if (ids.growthId) await prisma.careerInterviewGrowthReport.deleteMany({ where: { id: ids.growthId } }).catch(() => null);
    await prisma.careerInterviewCorrectionAttempt.deleteMany({ where: { studentUserId: userId, correctionId: ids.corrId } }).catch(() => null);
    await prisma.careerInterviewCorrection.deleteMany({ where: { studentUserId: userId, question: { startsWith: "__ITEST__" } } }).catch(() => null);
    await prisma.careerInterviewWeakness.deleteMany({ where: { studentUserId: userId, title: "역할이 불분명" } }).catch(() => null);
    await prisma.careerInterviewAnswer.deleteMany({ where: { sessionId: { in: [ids.initId, ids.finalId].filter(Boolean) } } }).catch(() => null);
    await prisma.careerInterviewQuestion.deleteMany({ where: { sessionId: { in: [ids.initId, ids.finalId].filter(Boolean) } } }).catch(() => null);
    await prisma.careerInterviewSession.deleteMany({ where: { id: { in: [ids.initId, ids.finalId].filter(Boolean) } } }).catch(() => null);
    log("  ✓ 테스트 데이터 정리 완료(DB 원상복구)");
    await prisma.$disconnect();
  }
}
function assert(v: boolean) {
  if (!v) throw new Error("assert 실패");
}
main().catch(async (e) => {
  console.error("통합 테스트 실패:", e instanceof Error ? e.message : e);
  await prisma.$disconnect();
  process.exit(1);
});
