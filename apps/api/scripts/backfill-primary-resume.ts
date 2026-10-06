// 대표 이력서를 '지금 쓰는 이력서'로 옮긴다.
//
//   npm run backfill:primary-resume            # dry-run(기본) — 숫자만 센다. 쓰기 없음
//   npm run backfill:primary-resume -- --apply # 실제 이관
//   DATABASE_URL=... npm run backfill:primary-resume   # 다른 환경을 보려면 URL 을 넘긴다
//
// 왜 필요한가:
// 지금 사용자가 갈 수 있는 이력서 화면은 리뉴얼 에디터뿐이다(옛 경로는 next.config 에서 308).
// 그런데 추천 공고·신규공고 알림·파트너 인재검색·공유 이력서는 전부 `isPrimary = true` 한 행만
// 본다. 대표 플래그는 리뉴얼 이전에 찍힌 값이라 **사용자가 오늘 고쳐 쓴 이력서가 매칭에서
// 통째로 빠질 수 있다.** 대표를 지정하던 화면(/profile)도 지금은 308 로 막혀 있어서,
// 사용자가 스스로 바로잡을 방법이 없다.
//
// 안전 규칙 셋:
//  1. 리뉴얼 행에 **항목이 있을 때만** 옮긴다. 내용 있는 레거시 이력서를 빈 것으로 바꾸면 안 된다.
//  2. 인재풀 동의(poolOptIn)를 새 대표로 **승계**한다. 안 하면 기업 추천에서 조용히 사라진다
//     (POST /members/me/resumes/:id/primary 와 같은 규칙).
//  3. 기본이 dry-run 이다. --apply 를 줘야 쓴다.
import { config as loadDotenv } from "dotenv";
import path from "node:path";
loadDotenv();
loadDotenv({ path: path.resolve(__dirname, "../../../.env") });
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const asObj = (c: unknown): Record<string, unknown> => (c && typeof c === "object" ? (c as Record<string, unknown>) : {});
const isRenewal = (c: unknown) => Object.keys(asObj(c)).some((k) => k.startsWith("renewal"));
const itemCount = (c: unknown) => {
  const d = asObj(c).renewalResume;
  const items = asObj(d).items;
  return Array.isArray(items) ? items.length : 0;
};

async function main() {
  const rows = await prisma.resume.findMany({
    select: { id: true, userId: true, isPrimary: true, content: true, updatedAt: true },
    orderBy: { updatedAt: "desc" }
  });
  const byUser = new Map<string, typeof rows>();
  for (const r of rows) byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r]);

  let withRenewal = 0;
  let alreadyOk = 0;
  let skipEmpty = 0;
  let toMove = 0;
  let carryOptIn = 0;
  let noPrimaryAtAll = 0;
  const plan: { userId: string; targetId: string; carry: boolean }[] = [];

  for (const [userId, rs] of byUser) {
    const ren = rs.find((r) => isRenewal(r.content));
    if (!ren) continue;
    withRenewal += 1;
    if (ren.isPrimary) {
      alreadyOk += 1;
      continue;
    }
    if (itemCount(ren.content) === 0) {
      skipEmpty += 1; // 규칙 1
      continue;
    }
    const oldPrimary = rs.find((r) => r.isPrimary);
    if (!oldPrimary) noPrimaryAtAll += 1;
    const oldOptIn = asObj(oldPrimary?.content).poolOptIn;
    const carry = Boolean(oldOptIn) && !asObj(ren.content).poolOptIn;
    if (carry) carryOptIn += 1;
    toMove += 1;
    plan.push({ userId, targetId: ren.id, carry });
  }

  console.log(`${APPLY ? "[실행]" : "[점검만 — 쓰기 없음]"} Resume 행 ${rows.length} · 유저 ${byUser.size}`);
  console.log(`리뉴얼 문서 보유            : ${withRenewal}`);
  console.log(` └ 이미 대표임              : ${alreadyOk}`);
  console.log(` └ 비어 있어 건너뜀         : ${skipEmpty}`);
  console.log(` └ 대표로 옮길 대상         : ${toMove}`);
  console.log(`   그중 poolOptIn 승계 필요 : ${carryOptIn}`);
  console.log(`   그중 기존 대표가 없음    : ${noPrimaryAtAll}`);

  if (!APPLY) {
    console.log("\n--apply 를 붙이면 실제로 옮깁니다.");
    return;
  }
  let done = 0;
  for (const p of plan) {
    const target = await prisma.resume.findUnique({ where: { id: p.targetId }, select: { content: true } });
    if (!target) continue;
    const oldPrimary = await prisma.resume.findFirst({ where: { userId: p.userId, isPrimary: true }, select: { content: true } });
    const oldOptIn = asObj(oldPrimary?.content).poolOptIn;
    const targetObj = asObj(target.content);
    const carry = Boolean(oldOptIn) && !targetObj.poolOptIn;
    await prisma.$transaction([
      prisma.resume.updateMany({ where: { userId: p.userId, isPrimary: true }, data: { isPrimary: false } }),
      prisma.resume.update({
        where: { id: p.targetId },
        data: { isPrimary: true, ...(carry ? { content: { ...targetObj, poolOptIn: oldOptIn } as Prisma.InputJsonValue } : {}) }
      })
    ]);
    done += 1;
  }
  console.log(`\n옮김 ${done}건. 임베딩은 다음 저장 때 갱신된다 — 바로 반영하려면 백필을 따로 돌린다.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
