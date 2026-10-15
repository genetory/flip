// 테스트용 — student@test.com 의 '모의 면접' 탭을 채워 본다(로컬 확인용).
//  1) 면접 진행 중인 지원의 확정 면접 시각을 오늘 기준 D-3, D-6 으로 옮긴다 → '면접 D-n' 카드가 뜬다.
//  2) 지원한 공고 두 곳에 공고 모의 면접 기록을 넣는다 → '연습 기록'에 공고별 기록이 뜬다.
// 다시 돌려도 같은 결과(멱등). @test.com 계정만 받는다.
// 실행: cd apps/api && set -a; . ../../.env; set +a; node --import tsx scripts/seed-interview-hub-demo.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const EMAIL = process.argv.find((a) => a.startsWith("--email="))?.slice("--email=".length) ?? "student@test.com";

/** 오늘(KST) 기준 n일 뒤 14:00 KST. */
function kstAfternoon(daysFromToday: number): Date {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600_000);
  const d = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() + daysFromToday, 14 - 9, 0, 0);
  return new Date(d);
}

const SAMPLE_ANSWERS = [
  {
    question: "우리 회사에 지원한 이유는 무엇인가요?",
    answer: "교환학생으로 한국에 와서 학교 SNS를 운영하며 마케팅에 관심이 생겼고, 해외 고객을 늘리려는 회사 방향과 제 경험이 맞다고 생각했습니다.",
    score: 72
  },
  {
    question: "가장 성과가 좋았던 캠페인과 본인의 역할을 말씀해 주세요.",
    answer: "학교 축제 홍보 캠페인에서 게시물 반응을 분석해 시간대를 바꿨고, 참여가 30% 정도 늘었습니다.",
    score: 58
  }
];

async function main() {
  if (!EMAIL.endsWith("@test.com")) throw new Error(`테스트 계정만 받습니다: ${EMAIL}`);
  const user = await prisma.user.findFirst({ where: { email: EMAIL }, select: { id: true } });
  if (!user) throw new Error(`user not found: ${EMAIL}`);

  // 1) 면접 진행 중 지원 — 확정 슬롯을 앞으로 옮긴다(가까운 것부터 D-3, D-6).
  const apps = await prisma.application.findMany({
    where: { candidateUserId: user.id, status: "INTERVIEW" },
    select: { id: true, positionId: true, position: { select: { title: true } }, interviewSlots: { where: { status: "SELECTED" }, select: { id: true } } },
    orderBy: { submittedAt: "asc" }
  });
  const offsets = [3, 6];
  for (const [i, app] of apps.slice(0, offsets.length).entries()) {
    const startsAt = kstAfternoon(offsets[i]);
    const endsAt = new Date(startsAt.getTime() + 3600_000);
    // 확정 슬롯이 여러 개면 화면은 첫 SELECTED 를 읽으므로 첫 것만 옮긴다.
    const first = app.interviewSlots[0];
    if (first) {
      await prisma.interviewSlot.update({ where: { id: first.id }, data: { startsAt, endsAt, location: "서울 강남구 · 본사 3층 회의실", reminderSentAt: null } });
    } else {
      await prisma.interviewSlot.create({ data: { applicationId: app.id, startsAt, endsAt, status: "SELECTED", selectedAt: new Date(), location: "서울 강남구 · 본사 3층 회의실" } });
    }
    console.log(`면접 D-${offsets[i]}: ${app.position.title} → ${startsAt.toISOString()}`);
  }

  // 2) 공고 모의 면접 기록 — 지원한 공고 두 곳.
  const applied = await prisma.application.findMany({ where: { candidateUserId: user.id }, select: { positionId: true }, distinct: ["positionId"], take: 2 });
  for (const [i, { positionId }] of applied.entries()) {
    const answers = i === 0 ? SAMPLE_ANSWERS : SAMPLE_ANSWERS.slice(1);
    const best = Math.max(...answers.map((a) => a.score));
    const lastPracticedAt = new Date(Date.now() - (i + 1) * 86400_000);
    await prisma.mockInterviewSession.upsert({
      where: { userId_positionId: { userId: user.id, positionId } },
      create: { userId: user.id, positionId, answeredCount: answers.length, bestScore: best, answers, lastPracticedAt },
      update: { answeredCount: answers.length, bestScore: best, answers, lastPracticedAt }
    });
    console.log(`모의 면접 기록: ${positionId} (답변 ${answers.length}, 최고 ${best})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
