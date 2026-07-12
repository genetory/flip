// 테스트용 — student@test.com 의 Career Launch 'Week 4'만 완료 상태로 채운다.
// 기존 progress(1~3주차·진단·직무·정리)·이력서·자소서는 건드리지 않고 병합만 한다.
// 실행: cd apps/api && set -a; . ../../.env; set +a; node --import tsx scripts/seed-career-week4-demo.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EMAIL = "student@test.com";
const WEEK4_STEPS = ["w4s1", "w4-self", "w4-job", "w4-fit", "w4-apply", "w4s4"];
const INTERVIEW_PRACTICED = ["self", "job", "fit"];

async function main() {
  const user = await prisma.user.findFirst({ where: { email: EMAIL } });
  if (!user) throw new Error(`user not found: ${EMAIL}`);
  const uid = user.id;

  const existing = await prisma.careerLaunchProgress.findUnique({ where: { studentUserId: uid } });
  const prev = (existing?.state && typeof existing.state === "object" ? existing.state : {}) as Record<string, unknown>;

  const prevInterview = (prev.interview && typeof prev.interview === "object" ? prev.interview : {}) as { practiced?: unknown };
  const prevDone = Array.isArray(prev.doneSteps) ? (prev.doneSteps as string[]) : [];
  const doneSteps = Array.from(new Set([...prevDone, ...WEEK4_STEPS]));

  const state = {
    ...prev,
    interview: { ...prevInterview, practiced: INTERVIEW_PRACTICED },
    doneSteps
  };

  await prisma.careerLaunchProgress.upsert({
    where: { studentUserId: uid },
    create: { studentUserId: uid, state },
    update: { state }
  });

  console.log(`✓ seeded Week 4 for ${EMAIL} (userId=${uid})`);
  console.log(`  - interview.practiced: ${INTERVIEW_PRACTICED.join(", ")}`);
  console.log(`  - doneSteps(+week4): ${doneSteps.length}개`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
