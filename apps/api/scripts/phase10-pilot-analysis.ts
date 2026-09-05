// Phase 10 파일럿 데이터 분석 — 읽기 전용. 운영 데이터 무변경. 개인정보 원문 미출력.
// 목적: 실제로 분석 가능한 파일럿 데이터가 있는지 먼저 검증한다(없으면 부족분·수집법 보고).
// 실행: set -a; . ./.env; set +a; npx tsx apps/api/scripts/phase10-pilot-analysis.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const log = (...a: unknown[]) => console.log(...a);

async function main() {
  log("=== Phase 10 파일럿 데이터 분석 (읽기 전용) ===\n");

  // 1) 파일럿 기수.
  const cohorts = await prisma.careerCohort.findMany({ select: { id: true, university: true, name: true, isPilot: true, status: true, featureFlags: true, participantLimit: true, pilotStartAt: true, pilotEndAt: true } });
  const pilotCohorts = cohorts.filter((c) => c.isPilot);
  log("[기수]");
  log(`  전체 기수: ${cohorts.length}`);
  log(`  파일럿(isPilot=true) 기수: ${pilotCohorts.length}`);
  for (const c of pilotCohorts) log(`    - ${c.university}/${c.name} flags=${JSON.stringify(c.featureFlags)} limit=${c.participantLimit ?? "-"} pilotStart=${c.pilotStartAt ?? "-"}`);

  // 2) 등록/사용자.
  const enrollments = await prisma.careerEnrollment.findMany({ select: { studentUserId: true, cohortId: true } });
  const enrolledIds = Array.from(new Set(enrollments.map((e) => e.studentUserId)));
  const pilotCohortIds = new Set(pilotCohorts.map((c) => c.id));
  const pilotEnrollments = enrollments.filter((e) => pilotCohortIds.has(e.cohortId));
  const pilotUserIds = Array.from(new Set(pilotEnrollments.map((e) => e.studentUserId)));

  // 테스트/운영자 계정 식별(이메일 도메인·role).
  const users = enrolledIds.length ? await prisma.user.findMany({ where: { id: { in: enrolledIds } }, select: { id: true, email: true, role: true } }) : [];
  const isTestish = (email: string | null) => !email || /test|example|flip-ers\.com|\+/.test(email);
  const operators = users.filter((u) => u.role === "OPERATOR").length;
  const testish = users.filter((u) => isTestish(u.email)).length;
  log("\n[등록/사용자]");
  log(`  전체 등록 사용자: ${enrolledIds.length}`);
  log(`  파일럿 기수 등록 사용자: ${pilotUserIds.length}`);
  log(`  그중 OPERATOR role: ${operators}`);
  log(`  테스트성 이메일(추정): ${testish}`);

  // 3) 측정 데이터(Phase 9 신규 테이블).
  const [surveyTotal, surveyPilot, qualTotal, qualPilot, costRows, costPilot] = await Promise.all([
    prisma.careerPilotSurvey.count(),
    pilotUserIds.length ? prisma.careerPilotSurvey.count({ where: { studentUserId: { in: pilotUserIds } } }) : Promise.resolve(0),
    prisma.careerQualitativeFeedback.count(),
    pilotUserIds.length ? prisma.careerQualitativeFeedback.count({ where: { studentUserId: { in: pilotUserIds } } }) : Promise.resolve(0),
    prisma.careerAiCostDaily.findMany({ select: { calls: true, failures: true, estCostUsd: true, cohortId: true, feature: true } }),
    Promise.resolve(0)
  ]);
  const costCalls = costRows.reduce((a, b) => a + b.calls, 0);
  const costFail = costRows.reduce((a, b) => a + b.failures, 0);
  const costUsd = costRows.reduce((a, b) => a + b.estCostUsd, 0);
  log("\n[측정 데이터 — Phase 9 신규]");
  log(`  설문(CareerPilotSurvey): 전체 ${surveyTotal} / 파일럿 ${surveyPilot}`);
  log(`  정성 피드백(CareerQualitativeFeedback): 전체 ${qualTotal} / 파일럿 ${qualPilot}`);
  log(`  LLM 비용 집계행(CareerAiCostDaily): ${costRows.length}행, 호출 ${costCalls}, 실패 ${costFail}, 추정 $${costUsd.toFixed(4)}`);

  // 4) 진행/결과물(퍼널 원자료).
  const [progressAll, targets, packages, sessions, corrections, growth, outcomes, interventions, satisfaction] = await Promise.all([
    prisma.careerLaunchProgress.count(),
    prisma.careerTargetJob.count({ where: { status: "confirmed" } }),
    prisma.careerApplicationPackage.count({ where: { status: "finalized" } }),
    prisma.careerInterviewSession.count({ where: { status: "completed" } }),
    prisma.careerInterviewCorrection.count(),
    prisma.careerInterviewGrowthReport.count(),
    prisma.careerEmploymentOutcome.count(),
    prisma.careerIntervention.count(),
    prisma.careerLaunchSatisfaction.count()
  ]);
  // 파일럿 사용자 한정 진행.
  const pilotProgress = pilotUserIds.length ? await prisma.careerLaunchProgress.findMany({ where: { studentUserId: { in: pilotUserIds } }, select: { state: true, updatedAt: true } }) : [];
  const weekDone = [0, 0, 0, 0];
  for (const p of pilotProgress) {
    const st = (p.state && typeof p.state === "object" ? p.state : {}) as { doneSteps?: unknown };
    const ds = Array.isArray(st.doneSteps) ? (st.doneSteps as string[]) : [];
    for (let w = 1; w <= 4; w++) if (ds.includes(`w${w}s4`)) weekDone[w - 1]++;
  }
  log("\n[진행/결과물 — 전체 DB]");
  log(`  CareerLaunchProgress: ${progressAll}, 목표확정 ${targets}, 패키지 finalized ${packages}, 완료 면접세션 ${sessions}`);
  log(`  오답 ${corrections}, 성장리포트 ${growth}, 취업성과 ${outcomes}, 개입 ${interventions}, 만족도 ${satisfaction}`);
  log(`  파일럿 사용자 주차완료(w1~4): [${weekDone.join(", ")}]`);

  // 5) 분석 가능성 판정.
  log("\n[분석 가능성 판정]");
  const realPilotUsers = pilotUserIds.length - operators; // 운영자 제외 근사
  const hasSurveys = surveyPilot > 0;
  const hasCost = costCalls > 0;
  const hasProgress = pilotProgress.length > 0;
  const enough = realPilotUsers >= 5 && (hasSurveys || hasProgress) && hasCost;
  log(`  실 파일럿 사용자(운영자 제외 근사): ${realPilotUsers}`);
  log(`  설문 데이터: ${hasSurveys ? "있음" : "없음"} / 비용 데이터: ${hasCost ? "있음" : "없음"} / 진행 데이터: ${hasProgress ? "있음" : "없음"}`);
  log(`  → 분석 가능 수준: ${enough ? "가능(단, 표본 작으면 통계확정 금지)" : "불충분 — 임의 추정 금지, 데이터 수집 먼저"}`);

  await prisma.$disconnect();
}
main().catch(async (e) => {
  console.error("분석 실패:", e instanceof Error ? e.message : e);
  await prisma.$disconnect();
  process.exit(1);
});
