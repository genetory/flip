import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  AuthProvider,
  CommunityPostCategory,
  MemberRole,
  PartnerCompanySize,
  PartnerIndustry,
  PartnerOrgUserRole,
  PartnerType,
  PositionStatus,
  PrismaClient
} from "@prisma/client";

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  const defaultPassword = "!Test1234";
  const passwordHash = await hash(defaultPassword);

  const users = [
    {
      email: "test@test.com",
      realName: "Operator Test",
      name: "test",
      role: MemberRole.OPERATOR,
      partnerType: null,
      partnerOrgRole: null
    },
    {
      email: "partner@test.com",
      realName: "Partner Test",
      name: "partner",
      role: MemberRole.PARTNER,
      partnerType: PartnerType.COMPANY,
      partnerOrgRole: PartnerOrgUserRole.OWNER
    },
    {
      email: "student@test.com",
      realName: "Student Test",
      name: "student",
      role: MemberRole.STUDENT,
      partnerType: null,
      partnerOrgRole: null
    }
  ] as const;

  for (const user of users) {
    await prisma.user.upsert({
      where: { email_authProvider: { email: user.email, authProvider: AuthProvider.EMAIL } },
      update: {
        realName: user.realName,
        name: user.name,
        passwordHash,
        role: user.role,
        partnerType: user.partnerType,
        partnerOrgRole: user.partnerOrgRole
      },
      create: {
        email: user.email,
        realName: user.realName,
        name: user.name,
        passwordHash,
        role: user.role,
        partnerType: user.partnerType,
        partnerOrgRole: user.partnerOrgRole,
        emailVerified: true
      }
    });
  }

  const partnerOrg = await prisma.partnerOrganization.upsert({
    where: { domain: "test.com" },
    update: {
      partnerType: PartnerType.COMPANY,
      name: "Test Company",
      industry: PartnerIndustry.IT,
      companySize: PartnerCompanySize.SIZE_UNDER_30,
      officeAddress: "Seoul, Gangnam-gu",
      website: "https://test.com"
    },
    create: {
      partnerType: PartnerType.COMPANY,
      domain: "test.com",
      name: "Test Company",
      industry: PartnerIndustry.IT,
      companySize: PartnerCompanySize.SIZE_UNDER_30,
      officeAddress: "Seoul, Gangnam-gu",
      website: "https://test.com"
    }
  });

  const samplePositions = [
    {
      title: "Global Marketing Manager",
      status: PositionStatus.OPEN,
      workType: "Hybrid",
      eligibleVisas: ["D-2", "D-10", "E-7", "F-2", "F-4"],
      preferredJobRole: "Marketing",
      hiringCount: 2,
      workingHours: "주 5일, 09:00-18:00",
      workLocation: "서울 강남구",
      startDate: new Date("2026-05-12T00:00:00.000Z"),
      communicationLanguages: ["한국어", "영어"],
      preferredNationalities: ["국적 무관"],
      mainResponsibilities: "글로벌 마케팅 전략 수립 및 캠페인 운영",
      requiredQualifications: "관련 경력 2년 이상",
      preferredQualifications: "B2B SaaS 경험",
      additionalNotes: "외국인 비자 스폰서십 검토 가능"
    },
    {
      title: "Frontend Engineer",
      status: PositionStatus.OPEN,
      workType: "Remote",
      eligibleVisas: ["D-10", "E-7", "F-2", "F-4", "F-6"],
      preferredJobRole: "Frontend Development",
      hiringCount: 1,
      workingHours: "유연근무제",
      workLocation: "원격",
      startDate: new Date("2026-05-01T00:00:00.000Z"),
      communicationLanguages: ["한국어", "영어"],
      preferredNationalities: ["국적 무관"],
      mainResponsibilities: "React/Next.js 기반 웹 서비스 개발",
      requiredQualifications: "TypeScript 실무 경험",
      preferredQualifications: "디자인 시스템 운영 경험",
      additionalNotes: "원격 근무 중심"
    },
    {
      title: "Operations Coordinator",
      status: PositionStatus.OPEN,
      workType: "On-site",
      eligibleVisas: ["D-4", "D-10", "F-2", "H-1"],
      preferredJobRole: "Operations",
      hiringCount: 3,
      workingHours: "주 5일, 10:00-19:00",
      workLocation: "서울 성수동",
      startDate: new Date("2026-05-20T00:00:00.000Z"),
      communicationLanguages: ["한국어"],
      preferredNationalities: ["국적 무관"],
      mainResponsibilities: "운영 프로세스 개선 및 고객 지원",
      requiredQualifications: "커뮤니케이션 능력",
      preferredQualifications: "스타트업 운영 경험",
      additionalNotes: "현장 근무 필수"
    },
    {
      title: "Backend Engineer",
      status: PositionStatus.OPEN,
      workType: "Hybrid",
      eligibleVisas: ["D-10", "E-7", "F-2", "F-4", "F-5"],
      preferredJobRole: "Backend Development",
      hiringCount: 2,
      workingHours: "주 5일, 10:00-19:00",
      workLocation: "서울 판교",
      startDate: new Date("2026-05-26T00:00:00.000Z"),
      communicationLanguages: ["한국어", "영어"],
      preferredNationalities: ["국적 무관"],
      mainResponsibilities: "Node.js API 설계 및 성능 개선",
      requiredQualifications: "백엔드 실무 3년 이상",
      preferredQualifications: "Prisma/PostgreSQL 경험",
      additionalNotes: "서버 아키텍처 고도화 경험 우대"
    },
    {
      title: "UI/UX Designer",
      status: PositionStatus.OPEN,
      workType: "Remote",
      eligibleVisas: ["D-2", "D-10", "F-2", "F-4", "H-1"],
      preferredJobRole: "UI/UX Design",
      hiringCount: 1,
      workingHours: "탄력근무",
      workLocation: "원격",
      startDate: new Date("2026-06-02T00:00:00.000Z"),
      communicationLanguages: ["영어"],
      preferredNationalities: ["국적 무관"],
      mainResponsibilities: "신규 기능 UX 리서치 및 화면 설계",
      requiredQualifications: "Figma 활용 능력",
      preferredQualifications: "B2C 서비스 디자인 경험",
      additionalNotes: "포트폴리오 제출 필수"
    },
    {
      title: "Data Analyst",
      status: PositionStatus.OPEN,
      workType: "On-site",
      eligibleVisas: ["D-10", "E-7", "F-2", "F-6"],
      preferredJobRole: "Data Analysis",
      hiringCount: 1,
      workingHours: "주 5일, 09:30-18:30",
      workLocation: "서울 여의도",
      startDate: new Date("2026-05-30T00:00:00.000Z"),
      communicationLanguages: ["한국어", "영어"],
      preferredNationalities: ["국적 무관"],
      mainResponsibilities: "대시보드 구축 및 KPI 분석",
      requiredQualifications: "SQL/BI 도구 활용",
      preferredQualifications: "A/B 테스트 분석 경험",
      additionalNotes: "업무용 데이터 접근 권한 제공"
    },
    {
      title: "Product Manager",
      status: PositionStatus.OPEN,
      workType: "Hybrid",
      eligibleVisas: ["D-10", "F-2", "F-4", "F-6"],
      preferredJobRole: "Product Manager",
      hiringCount: 1,
      workingHours: "주 5일, 10:00-19:00",
      workLocation: "서울 강남구",
      startDate: new Date("2026-06-10T00:00:00.000Z"),
      communicationLanguages: ["한국어", "영어"],
      preferredNationalities: ["국적 무관"],
      mainResponsibilities: "제품 로드맵 수립 및 스쿼드 운영",
      requiredQualifications: "서비스 기획 경험",
      preferredQualifications: "애자일 프로세스 경험",
      additionalNotes: "주 2회 오피스 출근"
    },
    {
      title: "Business Development Manager",
      status: PositionStatus.OPEN,
      workType: "On-site",
      eligibleVisas: ["E-7", "F-2", "F-4", "F-5"],
      preferredJobRole: "Sales",
      hiringCount: 2,
      workingHours: "주 5일, 09:00-18:00",
      workLocation: "부산 해운대구",
      startDate: new Date("2026-06-05T00:00:00.000Z"),
      communicationLanguages: ["한국어", "영어", "일본어"],
      preferredNationalities: ["국적 무관"],
      mainResponsibilities: "파트너십 발굴 및 계약 협상",
      requiredQualifications: "B2B 세일즈 경험",
      preferredQualifications: "글로벌 파트너 커뮤니케이션 경험",
      additionalNotes: "해외 출장 가능자 우대"
    },
    {
      title: "Customer Success Specialist",
      status: PositionStatus.OPEN,
      workType: "Remote",
      eligibleVisas: ["D-2", "D-10", "F-2", "F-6", "H-1"],
      preferredJobRole: "Operations",
      hiringCount: 2,
      workingHours: "교대근무 가능",
      workLocation: "원격",
      startDate: new Date("2026-05-28T00:00:00.000Z"),
      communicationLanguages: ["한국어", "영어", "중국어"],
      preferredNationalities: ["국적 무관"],
      mainResponsibilities: "고객 온보딩 및 이슈 해결",
      requiredQualifications: "문서/채팅 기반 커뮤니케이션 역량",
      preferredQualifications: "SaaS CS 경험",
      additionalNotes: "주말 일부 교대 가능자 선호"
    },
    {
      title: "HR Coordinator",
      status: PositionStatus.OPEN,
      workType: "Hybrid",
      eligibleVisas: ["D-4", "D-10", "F-2", "F-4", "F-6"],
      preferredJobRole: "HR",
      hiringCount: 1,
      workingHours: "주 5일, 09:00-18:00",
      workLocation: "인천 송도",
      startDate: new Date("2026-06-15T00:00:00.000Z"),
      communicationLanguages: ["한국어", "영어"],
      preferredNationalities: ["국적 무관"],
      mainResponsibilities: "채용 운영 및 입/퇴사 관리",
      requiredQualifications: "HR 행정 업무 이해",
      preferredQualifications: "노무/급여 시스템 사용 경험",
      additionalNotes: "하이브리드 근무(주 3회 출근)"
    }
  ] as const;

  await prisma.position.deleteMany({
    where: {
      partnerOrganizationId: partnerOrg.id,
      title: { in: samplePositions.map((item) => item.title) }
    }
  });

  await prisma.position.createMany({
    data: samplePositions.map((item) => ({
      partnerOrganizationId: partnerOrg.id,
      ...item
    }))
  });

  const sampleCommunityPosts = [
    {
      authorName: "지은",
      category: CommunityPostCategory.FREE,
      title: "이번 주말에 네트워킹 모임 같이 갈 분?",
      body: "서울 쪽에서 가벼운 커피챗 모임 잡아보려고 해요. 관심 있으면 댓글 남겨주세요.",
      likes: 12,
      comments: 7
    },
    {
      authorName: "Lina",
      category: CommunityPostCategory.CAREER,
      title: "면접 질문 대비 템플릿 공유합니다",
      body: "직무별로 자주 나오는 질문 정리해둔 템플릿이에요. 필요하신 분들 참고해서 본인 경험에 맞게 바꿔보세요.",
      likes: 19,
      comments: 14
    },
    {
      authorName: "Rahman",
      category: CommunityPostCategory.HELP,
      title: "D-2 비자 상태에서 인턴 진행 시 준비 서류 질문",
      body: "회사에서 요청한 서류 리스트가 조금 달라서요. 최근에 진행하신 분들 체크리스트 공유 가능할까요?",
      likes: 6,
      comments: 13
    },
    {
      authorName: "Ethan",
      category: CommunityPostCategory.FREE,
      title: "Anyone up for a casual coffee chat this Friday?",
      body: "I want to meet people who are also preparing for internships in Seoul. Drop a comment if you're interested.",
      likes: 11,
      comments: 9
    },
    {
      authorName: "Sophia",
      category: CommunityPostCategory.CAREER,
      title: "Resume tip: quantify your project impact",
      body: "Replacing vague descriptions with numbers helped me get more interview calls. Happy to share examples.",
      likes: 24,
      comments: 16
    },
    {
      authorName: "Noah",
      category: CommunityPostCategory.HELP,
      title: "How long did your ARC address update take?",
      body: "I submitted online last week and status is still pending. Wondering what timeline others experienced.",
      likes: 8,
      comments: 12
    },
    {
      authorName: "王晨",
      category: CommunityPostCategory.FREE,
      title: "有没有一起练韩语面试的小伙伴？",
      body: "我想每周找两次时间做模拟面试，互相给反馈。时间可以晚上或者周末。",
      likes: 15,
      comments: 10
    },
    {
      authorName: "李娜",
      category: CommunityPostCategory.CAREER,
      title: "市场岗位面试常见问题整理",
      body: "我把最近三次面试的问题做了分类，包含自我介绍、案例分析和沟通题，欢迎补充。",
      likes: 18,
      comments: 15
    },
    {
      authorName: "陈宇",
      category: CommunityPostCategory.HELP,
      title: "留学生实习合同需要特别注意什么？",
      body: "公司发来的协议里有几条不太确定，特别是工作时间和保险部分，想请教有经验的同学。",
      likes: 9,
      comments: 11
    },
    {
      authorName: "Narin",
      category: CommunityPostCategory.FREE,
      title: "มีใครอยากหาเพื่อนไปงาน networking ไหม",
      body: "กำลังหาคนไปงานด้วยกันช่วงสุดสัปดาห์นี้ ถ้าใครสนใจคอมเมนต์ไว้ได้เลยนะครับ",
      likes: 10,
      comments: 8
    },
    {
      authorName: "Pim",
      category: CommunityPostCategory.CAREER,
      title: "แชร์ประสบการณ์สัมภาษณ์งานสาย Marketing",
      body: "สิ่งที่ช่วยมากคือเตรียมตัวอย่างผลงานให้เล่าเป็นโครงเรื่องสั้นๆ ใครอยากได้ template บอกได้เลย",
      likes: 14,
      comments: 9
    },
    {
      authorName: "Korn",
      category: CommunityPostCategory.HELP,
      title: "ต่อวีซ่านักเรียนต้องเตรียมเอกสารอะไรเพิ่มบ้าง",
      body: "เอกสารพื้นฐานมีครบแล้ว แต่ไม่แน่ใจว่าต้องใช้ statement ย้อนหลังกี่เดือนครับ",
      likes: 7,
      comments: 10
    },
    {
      authorName: "Lucía",
      category: CommunityPostCategory.FREE,
      title: "¿Alguien quiere practicar coreano para entrevistas?",
      body: "Estoy buscando un grupo pequeño para practicar respuestas de entrevista dos veces por semana.",
      likes: 13,
      comments: 7
    },
    {
      authorName: "Mateo",
      category: CommunityPostCategory.CAREER,
      title: "Cómo preparé mi CV para puestos en Corea",
      body: "Adapté mi CV al formato local y enfoqué logros medibles. Si quieren, comparto una plantilla base.",
      likes: 17,
      comments: 12
    },
    {
      authorName: "Sofía",
      category: CommunityPostCategory.HELP,
      title: "Consulta sobre seguro de salud para estudiantes",
      body: "¿Es obligatorio desde el primer mes o hay un periodo de espera? Me confunden las fechas.",
      likes: 6,
      comments: 8
    },
    {
      authorName: "민수",
      category: CommunityPostCategory.FREE,
      title: "요즘 다들 주말에 뭐하면서 리프레시하세요?",
      body: "취업 준비하다 보니 번아웃이 와서요. 가볍게 할 수 있는 루틴 추천 부탁드려요.",
      likes: 16,
      comments: 13
    },
    {
      authorName: "하은",
      category: CommunityPostCategory.CAREER,
      title: "합격 후기: 포트폴리오 구조 바꾸고 연락 늘었어요",
      body: "문제-해결-결과 순으로 프로젝트를 정리했더니 면접에서 질문이 훨씬 명확해졌습니다.",
      likes: 22,
      comments: 18
    },
    {
      authorName: "준호",
      category: CommunityPostCategory.HELP,
      title: "외국인등록증 재발급 온라인 신청 해보신 분?",
      body: "분실해서 재발급해야 하는데 방문 예약이 꽉 차 있어서 온라인 가능 여부가 궁금합니다.",
      likes: 9,
      comments: 9
    },
    {
      authorName: "Emily",
      category: CommunityPostCategory.FREE,
      title: "Looking for a study buddy for TOPIK prep",
      body: "Planning to study weekday evenings near Sinchon. Beginners and intermediate level both welcome.",
      likes: 12,
      comments: 6
    },
    {
      authorName: "Daniel",
      category: CommunityPostCategory.CAREER,
      title: "Interview follow-up email template",
      body: "Sending a concise thank-you note after interviews improved response rates for me. I can share my template.",
      likes: 20,
      comments: 11
    },
    {
      authorName: "Olivia",
      category: CommunityPostCategory.HELP,
      title: "Part-time work hour limit for D-2 students?",
      body: "I heard the limit can vary by language score and semester. Does anyone have the latest guidance?",
      likes: 8,
      comments: 14
    }
  ] as const;

  await prisma.communityPost.deleteMany({
    where: {
      title: { in: sampleCommunityPosts.map((item) => item.title) }
    }
  });

  await prisma.communityPost.createMany({
    data: sampleCommunityPosts
  });

  console.log("Seeded users:");
  users.forEach((user) => {
    console.log(`- ${user.email} (${user.role}) / ${defaultPassword}`);
  });
  console.log(`Seeded partner organization: ${partnerOrg.name} (${partnerOrg.domain})`);
  console.log(`Seeded sample positions: ${samplePositions.length} items`);
  console.log(`Seeded sample community posts: ${sampleCommunityPosts.length} items`);
}

main()
  .catch((error) => {
    console.error("Failed to seed users:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
