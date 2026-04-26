import "dotenv/config";
import bcrypt from "bcryptjs";
import {
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
      where: { email: user.email },
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
      status: PositionStatus.MATCHING,
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
      status: PositionStatus.MATCHING,
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
      status: PositionStatus.MATCHING,
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

  console.log("Seeded users:");
  users.forEach((user) => {
    console.log(`- ${user.email} (${user.role}) / ${defaultPassword}`);
  });
  console.log(`Seeded partner organization: ${partnerOrg.name} (${partnerOrg.domain})`);
  console.log(`Seeded sample positions: ${samplePositions.length} items`);
}

main()
  .catch((error) => {
    console.error("Failed to seed users:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
