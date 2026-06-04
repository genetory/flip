/**
 * One-off seed: drop a plausible Korean-style resume onto student@test.com so
 * the new detail view has real content to render. Idempotent — running it
 * twice updates the same resume row instead of stacking duplicates.
 *
 * Usage:
 *   pnpm --filter @apps/api tsx scripts/seed-student-resume.ts
 *   (or) cd apps/api && npx tsx scripts/seed-student-resume.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_EMAIL = "student@test.com";
const TITLE = "프런트엔드 신입 지원용 이력서";

const content = {
  basicName: "김함판",
  basicEmail: "student@test.com",
  basicPhone: "010-2580-3691",
  basicResidence: "서울 성동구",
  basicVisa: null,

  summary: "사용자 경험에 진심인 프런트엔드 신입 — React/Next.js 기반 디자인 시스템·DX에 강점",
  selfIntroduction:
    "안녕하세요. 컴퓨터공학을 전공하면서 사용자가 \"이런 화면이면 한 번 더 쓰고 싶다\"고 느끼는 순간을 만드는 데 가장 큰 흥미를 느껴 프런트엔드를 선택한 김함판입니다.\n\n학교 동아리에서 작은 SaaS를 직접 launch한 경험과 6개월간의 카카오 인턴에서 디자인 시스템·DX 도구를 다뤘던 경험을 바탕으로, 입사 후에도 \"코드 한 줄이 사용자에게 어떻게 닿는지\"를 매일 점검하면서 일하고 싶습니다.\n\nReact/Next.js·TypeScript·Tailwind를 주력으로, 디자인 토큰과 컴포넌트 라이브러리 작업에 자신 있습니다. 협업에서는 PR 디스크립션과 회고 문서를 꼼꼼히 남기는 편입니다.",

  educations: [
    {
      schoolName: "서울대학교",
      educationType: "BACHELOR",
      major: "컴퓨터공학",
      status: "GRADUATED"
    },
    {
      schoolName: "원티드 프리온보딩 (프런트엔드 12기)",
      educationType: "BOOTCAMP",
      major: "프런트엔드 엔지니어링",
      status: "GRADUATED"
    }
  ],

  careers: [
    {
      companyName: "카카오",
      position: "프런트엔드 엔지니어 인턴",
      description:
        "사내 어드민 도구를 React + Next.js로 마이그레이션하는 프로젝트에 참여했습니다.\n- 디자인 토큰을 정리하고 12개 공용 컴포넌트를 재작성해 페이지 평균 LCP를 2.6s → 1.4s로 단축\n- Storybook 기반 비주얼 QA 도입, 회귀 버그 리포트를 주당 4건 → 1건 미만으로 감소\n- 사내 개발자 8명 대상 \"디자인 토큰 도입기\" 발표"
    }
  ],

  activities: [
    {
      title: "DailyLog — 학습 일지 SaaS (졸업 작품)",
      organization: "서울대 SCSC 학회",
      description:
        "Next.js 14(App Router) + Prisma + Postgres로 1인 학습 일지 SaaS를 만들고 launch했습니다.\n- 베타 30일 동안 활성 사용자 120명, 7일 잔존율 41%\n- 카카오 로그인·이메일 매직 링크 두 가지 인증 동시 지원\n- 사용자 인터뷰 12회로 기능 우선순위 재조정 → 회고 자동 요약 기능 추가"
    },
    {
      title: "FE 코드 리뷰 스터디 운영진",
      organization: "교내 FE 동아리 IxD",
      description:
        "주 1회 PR 리뷰 스터디를 1년간 운영했습니다. 회당 평균 3개 PR을 라이브로 리뷰하고, 학기말에 회고 자료집(40p)을 발행해 신규 기수 온보딩에 활용."
    }
  ],

  skills: [
    "React",
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
    "Storybook",
    "Vitest / Playwright",
    "Prisma",
    "Figma"
  ],

  languages: [
    { language: "한국어 (Korean)", level: "원어민" },
    { language: "English", level: "비즈니스 / TOEIC 920" }
  ],

  certifications: [
    { name: "SQLD (SQL 개발자)", issuer: "한국데이터산업진흥원" },
    { name: "정보처리기사", issuer: "한국산업인력공단" }
  ],

  links: [
    { label: "GitHub", url: "https://github.com/hampan-kim" },
    { label: "포트폴리오", url: "https://hampan.kim" },
    { label: "기술 블로그", url: "https://hampan.kim/blog" }
  ]
};

async function main() {
  // `email` is part of a composite unique key (email + authProvider), so a
  // bare findUnique({ email }) is rejected. There's typically only one row
  // per email in dev anyway — findFirst is fine here.
  const user = await prisma.user.findFirst({
    where: { email: TARGET_EMAIL },
    select: { id: true, email: true, name: true, role: true }
  });
  if (!user) {
    console.error(`[seed] user not found: ${TARGET_EMAIL}`);
    process.exit(1);
  }
  console.log(`[seed] target user: ${user.email} (${user.id}) role=${user.role}`);

  // Re-use any existing resume titled the same so the script is idempotent.
  const existing = await prisma.resume.findFirst({
    where: { userId: user.id, title: TITLE },
    select: { id: true, isPrimary: true }
  });

  if (existing) {
    const updated = await prisma.resume.update({
      where: { id: existing.id },
      data: { content }
    });
    console.log(`[seed] updated existing resume id=${updated.id} (isPrimary=${updated.isPrimary})`);
  } else {
    // First-resume rule mirrors the API: if the user has none, mark this
    // one as the representative (대표) resume automatically.
    const count = await prisma.resume.count({ where: { userId: user.id } });
    const isPrimary = count === 0;
    const created = await prisma.resume.create({
      data: {
        userId: user.id,
        title: TITLE,
        content,
        isPrimary
      }
    });
    console.log(`[seed] created resume id=${created.id} isPrimary=${created.isPrimary}`);
  }

  // For a test seed we always want this filled-in resume to be the
  // representative one, even if the account already has a stub from an
  // earlier session — clear other primaries and mark ours.
  const ours = await prisma.resume.findFirst({
    where: { userId: user.id, title: TITLE },
    select: { id: true, isPrimary: true }
  });
  if (ours && !ours.isPrimary) {
    await prisma.$transaction([
      prisma.resume.updateMany({ where: { userId: user.id, isPrimary: true }, data: { isPrimary: false } }),
      prisma.resume.update({ where: { id: ours.id }, data: { isPrimary: true } })
    ]);
    console.log(`[seed] promoted seeded resume to 대표`);
  }

  // Quick sanity print
  const all = await prisma.resume.findMany({
    where: { userId: user.id },
    select: { id: true, title: true, isPrimary: true, updatedAt: true },
    orderBy: { updatedAt: "desc" }
  });
  console.log(`[seed] user now has ${all.length} resume(s):`);
  for (const r of all) {
    console.log(`        - ${r.title} ${r.isPrimary ? "(대표)" : ""} :: ${r.id}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
