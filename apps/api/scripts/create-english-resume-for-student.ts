// 일회성 시드 스크립트 — student@test.com 에 영어로 작성된 풀바디 이력서를
// 만들고, 한국어 번역까지 미리 채워서 양언어 표시 기능을 즉시 확인할 수
// 있게 한다. dev 환경 전용. 운영 DB 에는 절대 실행하지 말 것.
//
// 실행:
//   set -a; source .env; set +a; \
//     npx tsx apps/api/scripts/create-english-resume-for-student.ts

import { PrismaClient, Prisma } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const model = process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-4o-mini";
const TARGET_EMAIL = "student@test.com";

const content = {
  basicName: "Jin Park",
  basicEmail: TARGET_EMAIL,
  basicPhone: "010-2345-6789",
  basicResidence: "Seoul, South Korea",
  basicVisa: "D2_STUDENT",
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

const SYSTEM_PROMPT =
  "당신은 이력서 번역가입니다. 외국인 지원자의 이력서 텍스트를 한국 기업이 읽기 좋은 자연스러운 한국어로 번역하세요. 원문에 있는 사실만 사용하고, 새 사실/수치/회사명/날짜를 추가하지 마세요. 회사명·학교명은 영문 그대로 두거나 (한국어 표기) 형태로 자연스럽게 표기. JSON 한 개의 객체만 응답: { \"ko\": string }";

async function translateOne(text: string): Promise<string | null> {
  if (!openai) return null;
  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text }
      ]
    });
    const raw = completion.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw) as { ko?: unknown };
    return typeof parsed.ko === "string" ? parsed.ko.trim() : null;
  } catch (e) {
    console.error("translate failed:", e);
    return null;
  }
}

async function buildTranslations() {
  const [summaryKo, selfIntroKo, careerDescKo, activityDescKo] = await Promise.all([
    translateOne(content.summary),
    translateOne(content.selfIntroduction),
    translateOne(content.careers[0].description),
    translateOne(content.activities[0].description)
  ]);
  return {
    ko: {
      ...(summaryKo ? { summary: summaryKo } : {}),
      ...(selfIntroKo ? { selfIntroduction: selfIntroKo } : {}),
      ...(careerDescKo ? { careers: [{ description: careerDescKo }] } : {}),
      ...(activityDescKo ? { activities: [{ description: activityDescKo }] } : {})
    }
  };
}

async function main() {
  const user = await prisma.user.findFirst({ where: { email: TARGET_EMAIL } });
  if (!user) {
    console.error(`User ${TARGET_EMAIL} not found.`);
    process.exit(1);
  }

  console.log("Translating long-form fields to Korean (4 OpenAI calls)...");
  const translations = await buildTranslations();
  console.log("Translation done.");

  const created = await prisma.resume.create({
    data: {
      userId: user.id,
      title: "English Resume — Frontend Engineer",
      content: content as unknown as Prisma.InputJsonValue,
      translations: translations as unknown as Prisma.InputJsonValue,
      isPrimary: false
    }
  });
  console.log(`✅ Created resume ${created.id} (English) for ${TARGET_EMAIL}`);
  console.log(`   Open: http://localhost:3000/resume/${created.id}/preview`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
