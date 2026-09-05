// Phase 8 마이그레이션 Dry-Run — 읽기 전용. 운영 데이터 변경 없음. 개인정보 원문 미출력(ID 마스킹).
// Career Launch V2 리뉴얼로 기존 사용자를 어떻게 매핑할지 사전 점검한다.
// 실행: set -a; . ./.env; set +a; npx tsx apps/api/scripts/phase8-migration-dryrun.ts [cohortId]
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const started = Date.now();
const mask = (id: string) => `…${id.slice(-6)}`;
const log = (...a: unknown[]) => console.log(...a);

async function main() {
  const cohortFilter = process.argv[2];
  const where = cohortFilter ? { cohortId: cohortFilter } : {};
  log("=== Career Launch V2 마이그레이션 Dry-Run (읽기 전용) ===");
  if (cohortFilter) log(`대상 기수: ${mask(cohortFilter)}`);

  // 대상 = career-launch 등록 학생(진행상태/이력서/자소서/등록 중 하나라도 있는 사용자).
  const enrollments = await prisma.careerEnrollment.findMany({ where, select: { studentUserId: true, cohortId: true } });
  const enrolledIds = Array.from(new Set(enrollments.map((e) => e.studentUserId)));

  const [progressRows, resumeRows, coverRows, profileRows, targetRows, packageRows, sessionRows, growthRows] = await Promise.all([
    prisma.careerLaunchProgress.findMany({ where: cohortFilter ? { studentUserId: { in: enrolledIds } } : {}, select: { studentUserId: true, state: true } }),
    prisma.careerResumeData.findMany({ where: cohortFilter ? { studentUserId: { in: enrolledIds } } : {}, select: { studentUserId: true, content: true, resumeId: true } }),
    prisma.careerCoverLetterData.findMany({ where: cohortFilter ? { studentUserId: { in: enrolledIds } } : {}, select: { studentUserId: true, content: true } }),
    prisma.careerProfile.findMany({ where: cohortFilter ? { studentUserId: { in: enrolledIds } } : {}, select: { studentUserId: true } }),
    prisma.careerTargetJob.findMany({ where: cohortFilter ? { studentUserId: { in: enrolledIds } } : {}, select: { studentUserId: true, status: true } }),
    prisma.careerApplicationPackage.findMany({ where: cohortFilter ? { studentUserId: { in: enrolledIds } } : {}, select: { studentUserId: true, status: true } }),
    prisma.careerInterviewSession.findMany({ where: cohortFilter ? { studentUserId: { in: enrolledIds } } : {}, select: { studentUserId: true } }),
    prisma.careerInterviewGrowthReport.findMany({ where: cohortFilter ? { studentUserId: { in: enrolledIds } } : {}, select: { studentUserId: true } })
  ]);

  const allUserIds = Array.from(new Set([...enrolledIds, ...progressRows.map((r) => r.studentUserId), ...resumeRows.map((r) => r.studentUserId), ...coverRows.map((r) => r.studentUserId)]));
  const hasProfile = new Set(profileRows.map((r) => r.studentUserId));
  const hasResume = new Set(resumeRows.filter((r) => r.content && Object.keys(r.content).length).map((r) => r.studentUserId));
  const hasCover = new Set(coverRows.filter((r) => (r.content as { items?: unknown[] } | null)?.items?.length).map((r) => r.studentUserId));
  const hasTarget = new Set(targetRows.filter((r) => r.status === "confirmed").map((r) => r.studentUserId));
  const hasPackage = new Set(packageRows.filter((r) => r.status === "finalized").map((r) => r.studentUserId));
  const hasSession = new Set(sessionRows.map((r) => r.studentUserId));
  const hasGrowth = new Set(growthRows.map((r) => r.studentUserId));
  const progByUser = new Map(progressRows.map((r) => [r.studentUserId, (r.state && typeof r.state === "object" ? r.state : {}) as Record<string, unknown>]));

  // 유형 분류.
  const types = { A_new: 0, B_week1: 0, C_resume: 0, D_cover: 0, E_interview: 0, F_completed: 0, G_conflict: 0, H_inprogress: 0 };
  let profilesToCreate = 0;
  let mergeableResume = 0;
  let mergeableCover = 0;
  let conflictCandidates = 0;
  let orphanProgress = 0;
  const legacyExperienceBank = { users: 0, items: 0 };

  for (const uid of allUserIds) {
    const st = progByUser.get(uid) ?? {};
    const doneSteps = Array.isArray(st.doneSteps) ? (st.doneSteps as string[]) : [];
    const expBank = Array.isArray(st.experienceBank) ? (st.experienceBank as unknown[]) : [];
    const selectedJobs = Array.isArray(st.selectedJobs) ? (st.selectedJobs as unknown[]) : [];
    const diagnosis = st.diagnosis;
    const enrolled = enrolledIds.includes(uid);
    if (!enrolled && !st && !hasResume.has(uid)) continue;

    // Career Profile 미생성 → 최초 접근 시 병합 예정.
    if (!hasProfile.has(uid) && (hasResume.has(uid) || hasCover.has(uid) || Boolean(diagnosis) || expBank.length)) profilesToCreate++;
    if (hasResume.has(uid)) mergeableResume++;
    if (hasCover.has(uid)) mergeableCover++;
    if (expBank.length) {
      legacyExperienceBank.users++;
      legacyExperienceBank.items += expBank.length;
    }

    // 유형 판정(우선순위 높은 것).
    const week1Done = hasTarget.has(uid) || selectedJobs.length > 0 || Boolean(diagnosis);
    const week4Done = hasGrowth.has(uid);
    const anyData = week1Done || hasResume.has(uid) || hasCover.has(uid) || hasSession.has(uid) || doneSteps.length > 0;
    if (week4Done && hasPackage.has(uid)) types.F_completed++;
    else if (hasSession.has(uid)) types.E_interview++;
    else if (hasCover.has(uid)) types.D_cover++;
    else if (hasResume.has(uid)) types.C_resume++;
    else if (week1Done) types.B_week1++;
    else if (!anyData) types.A_new++;
    else types.H_inprogress++;

    // 충돌 후보: 이력서 basic.name 있는데 프로필 targetRole 등과 다른 경우(간이).
    if (hasResume.has(uid) && hasProfile.has(uid)) conflictCandidates++;

    // 고아 진행상태: progress 있는데 등록(enrollment) 없음.
    if (progByUser.has(uid) && !enrolled) orphanProgress++;
  }
  conflictCandidates = Math.min(conflictCandidates, allUserIds.length);

  log("\n[대상]");
  log(`  전체 대상 사용자: ${allUserIds.length}`);
  log(`  career-launch 등록자: ${enrolledIds.length}`);
  log("\n[유형별 분포]");
  log(`  A 신규(데이터 없음):        ${types.A_new}`);
  log(`  B 기존 Week1 완료:          ${types.B_week1}`);
  log(`  C 기존 이력서 보유:         ${types.C_resume}`);
  log(`  D 기존 자소서 보유:         ${types.D_cover}`);
  log(`  E 기존 면접 기록:           ${types.E_interview}`);
  log(`  F 기존 4주 완료:            ${types.F_completed}`);
  log(`  H 중간 작성:                ${types.H_inprogress}`);
  log("\n[Career Profile 병합 예정(최초 접근 시 지연 병합)]");
  log(`  Profile 생성 예정:          ${profilesToCreate}`);
  log(`  병합 가능 이력서:           ${mergeableResume}`);
  log(`  병합 가능 자소서:           ${mergeableCover}`);
  log(`  레거시 experienceBank:      ${legacyExperienceBank.users}명 / ${legacyExperienceBank.items}건`);
  log(`  충돌 확인 후보(G):          ${conflictCandidates}`);
  log("\n[위험/주의]");
  log(`  고아 진행상태(등록 없음):   ${orphanProgress}`);
  log(`  기존 면접 blob 보유:        ${sessionRows.length ? "신규 세션과 병존(무변경)" : "신규 세션 테이블만"}`);
  log("\n[예상]");
  log(`  파괴적 변경:                0 (additive only)`);
  log(`  데이터 변경(dry-run):       0 (읽기 전용)`);
  log(`  실행시간:                   ${Date.now() - started}ms`);
  log("\n※ 실제 backfill 은 필요 없음 — Career Profile 은 최초 GET 시 지연 병합(getOrCreateCareerProfile)으로 자동 생성됨.");
  log("※ 기존 Week 완료상태·이력서·자소서·면접 blob 은 무변경. 신규 테이블과 병존.");
  await prisma.$disconnect();
}
main().catch(async (e) => {
  console.error("dry-run 실패:", e instanceof Error ? e.message : e);
  await prisma.$disconnect();
  process.exit(1);
});
