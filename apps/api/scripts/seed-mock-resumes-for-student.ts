import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";

// 운영(또는 임의 환경) DB 에 student@test.com 용 mock 이력서 2종을 시드.
// 한글 본문 이력서 1 + 영문 본문 이력서 1 (+ 한국어 번역 캐시 하드코딩).
// 양언어 디스플레이/코치 화면 데모용. OpenAI 호출 없음 → 어디서나 실행 가능.
//
// 동작:
//   - 기본 dry-run: preview 만 출력, DB 변경 없음
//   - `--apply`: 트랜잭션 안에서 2개 row 생성
//   - 이미 동일 title 의 이력서가 있어도 건드리지 않고 새 row 만 추가 (추가
//     해줘 요청에 맞춤). isPrimary 는 둘 다 false — 기존 primary 보존.
//
// 사용:
//   DATABASE_URL=... npm exec --workspace=apps/api -- \
//     tsx scripts/seed-mock-resumes-for-student.ts          # preview
//   DATABASE_URL=... npm exec --workspace=apps/api -- \
//     tsx scripts/seed-mock-resumes-for-student.ts --apply  # 실제 추가

const TARGET_EMAIL = "student@test.com";

// ---- 한글 이력서 본문 ------------------------------------------------------
const koContent = {
  basicName: "박진우",
  basicEmail: TARGET_EMAIL,
  basicPhone: "010-2345-6789",
  basicResidence: "서울특별시 관악구",
  basicVisa: "D2_STUDENT",
  desiredJobRole: "프론트엔드 엔지니어",
  workType: "FULL_TIME",
  desiredLocation: "서울",
  availableFrom: "2025-09",
  summary:
    "React·TypeScript 기반의 사용자 인터페이스를 만드는 데 익숙한 주니어 프론트엔드 엔지니어입니다. 디자인 시스템과 성능 최적화에 관심이 있습니다.",
  selfIntroduction:
    "안녕하세요, 서울대학교 컴퓨터공학과 3학년 박진우입니다. 사용자에게 실제로 쓰이는 인터페이스를 만들고 싶다는 생각으로 카카오 인턴 기간 동안 파트너 대시보드 리뉴얼을 주도했고, 번들 분리와 이미지 지연 로딩으로 초기 로드를 40% 단축했습니다. 한국어를 모국어로, 영어는 비즈니스 회화 수준으로 사용합니다. 졸업 후 한국 IT 기업에서 정규직으로 합류해 실사용 제품을 더 많이 출시하고 싶습니다.",
  educations: [
    {
      schoolName: "서울대학교",
      educationType: "UNIVERSITY",
      major: "컴퓨터공학",
      status: "ENROLLED",
      startDate: "2023-03",
      endDate: ""
    }
  ],
  careers: [
    {
      companyName: "카카오",
      position: "프론트엔드 엔지니어 (인턴)",
      description:
        "파트너 대시보드 리뉴얼을 주도하며 번들 분리·이미지 지연 로딩으로 초기 로드 시간을 40% 단축했습니다. 팀에서 재사용되는 8개 React 컴포넌트를 만들고 문서화했으며, 신규 인턴 3명에게 TypeScript 베스트 프랙티스와 코드리뷰 룰을 멘토링했습니다.",
      startDate: "2024-06",
      endDate: "2024-09"
    }
  ],
  activities: [
    {
      title: "졸업 프로젝트 — 실시간 번역 웹앱",
      organization: "서울대학교",
      description:
        "Next.js 와 OpenAI API 를 활용해 한국어-영어 실시간 번역 웹앱을 만들었습니다. UX 를 처음부터 설계하고 유학생 5명과 사용자 인터뷰를 진행했으며, 학기 종료 전 WAU 200명을 달성했습니다.",
      startDate: "2024-09",
      endDate: "2024-12"
    }
  ],
  skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Figma", "Git"],
  languages: [
    { language: "한국어", level: "Native" },
    { language: "영어", level: "Business" }
  ],
  certifications: [{ name: "AWS Certified Cloud Practitioner", issuer: "Amazon" }],
  links: [
    { label: "GitHub", url: "https://github.com/jinpark-demo" },
    { label: "Portfolio", url: "https://jin.dev" }
  ]
};

// ---- 영문 이력서 본문 + 한국어 번역 캐시 -----------------------------------
const enContent = {
  basicName: "Jin Park",
  basicEmail: TARGET_EMAIL,
  basicPhone: "010-2345-6789",
  basicResidence: "Seoul, South Korea",
  basicVisa: "D2_STUDENT",
  desiredJobRole: "Frontend Engineer",
  workType: "FULL_TIME",
  desiredLocation: "Seoul",
  availableFrom: "2025-09",
  summary:
    "Junior frontend engineer with 2 years of experience focused on React, TypeScript, and design systems.",
  selfIntroduction:
    "Hi, I'm Jin. I'm a frontend engineer who loves shipping pixel-perfect interfaces and helping teams move faster with clear documentation. I've spent the last two years building consumer products at Kakao, where I led a dashboard redesign and mentored junior developers. I'm currently looking for an internship at a Korean tech company where I can deepen my product sense while improving my Korean (currently TOPIK 4). My north star: ship things people use every week, not every demo.",
  educations: [
    {
      schoolName: "Seoul National University",
      educationType: "UNIVERSITY",
      major: "Computer Science",
      status: "ENROLLED",
      startDate: "2023-03",
      endDate: ""
    }
  ],
  careers: [
    {
      companyName: "Kakao",
      position: "Frontend Engineer (Intern)",
      description:
        "Led the redesign of the partner dashboard, reducing load time by 40% through bundle splitting and image lazy-loading. Built and documented 8 reusable React components that the team still uses today. Mentored 3 incoming interns on TypeScript best practices and code review hygiene.",
      startDate: "2024-06",
      endDate: "2024-09"
    }
  ],
  activities: [
    {
      title: "Capstone Project — Real-time Translation App",
      organization: "Seoul National University",
      description:
        "Built a Korean-English real-time translation web app using Next.js and the OpenAI API. Designed the UX from scratch and ran 5 user interviews with international students. The app reached 200 weekly active users before the semester ended.",
      startDate: "2024-09",
      endDate: "2024-12"
    }
  ],
  skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Figma", "Git"],
  languages: [
    { language: "English", level: "Native" },
    { language: "Korean", level: "TOPIK 4" }
  ],
  certifications: [{ name: "AWS Certified Cloud Practitioner", issuer: "Amazon" }],
  links: [
    { label: "GitHub", url: "https://github.com/jinpark-demo" },
    { label: "Portfolio", url: "https://jin.dev" }
  ]
};

// 영문 본문의 long-form 필드를 한국어로 번역한 캐시. 양언어 디스플레이가
// 즉시 켜지도록 사전에 채워둠 (OpenAI 호출 없이 데모용으로 충분).
const enTranslations = {
  ko: {
    summary: "React, TypeScript, 디자인 시스템 중심으로 2년차 경력을 쌓은 주니어 프론트엔드 엔지니어입니다.",
    selfIntroduction:
      "안녕하세요, Jin 입니다. 픽셀 단위까지 다듬은 인터페이스를 출시하고 명확한 문서로 팀이 더 빨리 움직일 수 있게 돕는 프론트엔드 엔지니어입니다. 지난 2년간 카카오에서 컨슈머 제품을 만들었고 대시보드 리디자인을 주도하면서 주니어 개발자를 멘토링했습니다. 현재 한국어(TOPIK 4) 를 더 끌어올리며 제품 감각을 키울 수 있는 한국 IT 기업의 인턴십을 찾고 있습니다. 핵심 지표: 데모가 아니라 사람들이 매주 사용하는 제품을 출시하는 것.",
    careers: [
      {
        description:
          "파트너 대시보드 리디자인을 주도해 번들 분리와 이미지 지연 로딩으로 로드 시간을 40% 단축했습니다. 팀이 지금도 사용하는 재사용 가능한 React 컴포넌트 8개를 만들고 문서화했으며, 신규 인턴 3명에게 TypeScript 베스트 프랙티스와 코드 리뷰 위생을 멘토링했습니다."
      }
    ],
    activities: [
      {
        description:
          "Next.js 와 OpenAI API 로 한국어-영어 실시간 번역 웹앱을 만들었습니다. UX 를 처음부터 설계하고 유학생 5명과 사용자 인터뷰를 진행했으며, 학기가 끝나기 전 주간 활성 사용자 200명을 달성했습니다."
      }
    ]
  }
};

const prisma = new PrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  console.info(`Mode: ${apply ? "APPLY (will insert)" : "DRY-RUN (preview only)"}`);

  const user = await prisma.user.findFirst({
    where: { email: TARGET_EMAIL },
    select: { id: true, email: true, name: true }
  });
  if (!user) {
    console.error(`❌ User ${TARGET_EMAIL} not found in this DB. Aborting.`);
    process.exit(1);
  }

  const existingCount = await prisma.resume.count({ where: { userId: user.id } });
  console.info(`User: ${user.email} (id ${user.id})`);
  console.info(`Existing resumes for this user: ${existingCount}`);
  console.info("Will create 2 new resumes:");
  console.info(`  1) 한글 이력서 — 프론트엔드 엔지니어 (박진우)`);
  console.info(`  2) English Resume — Frontend Engineer (Jin Park) + KO translation cache`);

  if (!apply) {
    console.info("\nDry-run only. Re-run with --apply to actually insert.");
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const koResume = await tx.resume.create({
      data: {
        userId: user.id,
        title: "한글 이력서 — 프론트엔드 엔지니어",
        content: koContent as unknown as Prisma.InputJsonValue,
        // 한국어 본문이라 번역 캐시 불필요. 앱이 저장 시점에 다른 언어면 채움.
        isPrimary: false
      },
      select: { id: true, shareSlug: true, title: true }
    });
    const enResume = await tx.resume.create({
      data: {
        userId: user.id,
        title: "English Resume — Frontend Engineer",
        content: enContent as unknown as Prisma.InputJsonValue,
        translations: enTranslations as unknown as Prisma.InputJsonValue,
        isPrimary: false
      },
      select: { id: true, shareSlug: true, title: true }
    });
    return { koResume, enResume };
  });

  console.info("\n✅ Created 2 mock resumes:");
  console.info(`   • ${result.koResume.title}`);
  console.info(`       id: ${result.koResume.id}`);
  console.info(`       share: /resume/share/${result.koResume.shareSlug}`);
  console.info(`   • ${result.enResume.title}`);
  console.info(`       id: ${result.enResume.id}`);
  console.info(`       share: /resume/share/${result.enResume.shareSlug}`);
}

main()
  .catch((e) => {
    console.error("[seed-mock-resumes] Fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
