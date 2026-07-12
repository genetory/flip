// 테스트용 — student@test.com 계정에 Career Launch 전체를 완료한 것처럼 목업 데이터 주입.
// 실행: cd apps/api && set -a; . ../../.env; set +a; node --import tsx scripts/seed-career-launch-demo.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EMAIL = "student@test.com";

const ALL_STEPS = [
  "w1s1", "w1s2", "w1s3", "w1s4",
  "w2-basic", "w2-edu", "w2-exp", "w2-skill", "w2-lang", "w2s4",
  "w3-motive", "w3-growth", "w3-strength", "w3-aspiration", "w3s4",
  "w4s1", "w4s2", "w4s3", "w4s4"
];

const progressState = {
  diagnosis: {
    percent: 72,
    level: "방향은 뚜렷하고 서류만 다듬으면 충분히 경쟁력 있어요",
    strengths: ["다국어(한국어·영어·베트남어) 소통 능력", "데이터 분석 프로젝트 경험", "성실하고 배우려는 태도"],
    improvements: ["2주차에 대표 이력서 완성하기", "3주차 자기소개서 문항별로 다듬기", "E-7 비자 지원 가능 기업 리스트업"]
  },
  selectedJobs: ["백엔드 개발자", "프론트엔드 개발자", "소프트웨어 엔지니어"],
  materials: [
    "백엔드 개발자: 서버·API 설계·구현이 주 업무, Java/Spring·DB 지식이 핵심",
    "프론트엔드 개발자: 사용자 화면 구현, React·TypeScript 역량이 중요",
    "소프트웨어 엔지니어: 전반적 개발 역량과 CS 기초(자료구조·알고리즘)가 바탕"
  ],
  doneSteps: ALL_STEPS
};

const resumeContent = {
  basic: { name: "응우옌 마이", email: "mai@example.com", phone: "010-1234-5678", summary: "데이터로 문제를 푸는 걸 좋아하는 백엔드 개발자 지망생입니다." },
  educations: [{ school: "고려대학교", major: "컴퓨터학과", degree: "학사", period: "2020.03~2024.02", note: null }],
  experiences: [
    { title: "백엔드 인턴", org: "네이버", period: "2023.06~2023.12", bullets: ["Java/Spring 기반 API 응답 속도를 30% 개선", "일 100만 건 로그 처리 파이프라인 구축에 참여"] },
    { title: "데이터 분석 동아리", org: "고려대 DSC", period: "2022.03~2023.02", bullets: ["팀 프로젝트 5건 리딩, 교내 공모전 1회 입상"] }
  ],
  skills: ["Java", "Spring", "Python", "SQL", "Git"],
  languages: [
    { language: "한국어", level: "TOPIK 5급" },
    { language: "영어", level: "업무 회화 가능" },
    { language: "베트남어", level: "모국어" }
  ]
};

const coverContent = {
  company: null,
  items: [
    { question: "지원 동기", answer: "데이터로 문제를 정의하고 풀어내는 과정에 매료되어, 안정적인 서버·API로 사용자 경험을 떠받치는 백엔드 개발자를 목표로 삼았습니다. 직접 성능을 개선해본 경험이 이 분야가 제 강점과 맞는다는 확신을 주었습니다." },
    { question: "성장 과정", answer: "유학 생활 동안 다양한 국적의 팀원과 협업하며 소통과 책임감을 배웠고, 데이터 분석 동아리에서 프로젝트를 이끌며 끝까지 완성해내는 힘을 키웠습니다." },
    { question: "성격의 장단점", answer: "문제를 끝까지 파고드는 집요함이 강점이고, 완성도를 높이려다 속도가 느려지는 점은 우선순위를 먼저 정하는 방식으로 보완하고 있습니다." },
    { question: "입사 후 포부", answer: "안정적이고 빠른 백엔드 시스템에 기여하고, 한국어·영어·베트남어 소통 능력과 문화적 이해를 살려 글로벌 서비스 확장에 다리 역할을 하고 싶습니다." }
  ]
};

async function main() {
  const user = await prisma.user.findFirst({ where: { email: EMAIL } });
  if (!user) throw new Error(`user not found: ${EMAIL}`);
  const uid = user.id;

  await prisma.careerLaunchProgress.upsert({
    where: { studentUserId: uid },
    create: { studentUserId: uid, state: progressState },
    update: { state: progressState }
  });
  await prisma.careerResumeData.upsert({
    where: { studentUserId: uid },
    create: { studentUserId: uid, content: resumeContent },
    update: { content: resumeContent }
  });
  await prisma.careerCoverLetterData.upsert({
    where: { studentUserId: uid },
    create: { studentUserId: uid, content: coverContent },
    update: { content: coverContent }
  });

  console.log(`✓ seeded Career Launch demo data for ${EMAIL} (userId=${uid})`);
  console.log(`  - progress: diagnosis ${progressState.diagnosis.percent}%, jobs ${progressState.selectedJobs.length}, materials ${progressState.materials.length}, doneSteps ${progressState.doneSteps.length}`);
  console.log(`  - resume: ${resumeContent.experiences.length} experiences, ${resumeContent.skills.length} skills`);
  console.log(`  - cover: ${coverContent.items.length} items @ ${coverContent.company}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
