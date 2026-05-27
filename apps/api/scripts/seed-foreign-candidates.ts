import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  AuthProvider,
  CandidateEducationStatus,
  CandidateEducationType,
  CandidateLanguageLevel,
  CandidateLanguageType,
  CandidatePreferredJobRole,
  CandidateVisaType,
  MemberRole,
  PartnerIndustry,
  PrismaClient
} from "@prisma/client";

const prisma = new PrismaClient();

type Seed = {
  name: string;
  nationality: string;
  gender: "male" | "female";
  nativeLang: CandidateLanguageType;
  visa: CandidateVisaType;
  livesInKorea: boolean;
  residence: string | null;
  school: string;
  major: string;
  degree: CandidateEducationType;
  eduStatus: CandidateEducationStatus;
  koreanLevel: CandidateLanguageLevel;
  topik: string | null;
  englishLevel: CandidateLanguageLevel;
  jobRoles: CandidatePreferredJobRole[];
  industries: PartnerIndustry[];
  skills: string[];
  company?: string;
  position?: string;
  intro: string;
};

// 20 international candidates who want to work in Korea — diverse nationalities,
// visas, fields. Romanized names; profiles are plausible but synthetic.
const SEEDS: Seed[] = [
  { name: "Nguyen Thi Mai", nationality: "Vietnam", gender: "female", nativeLang: "VIETNAMESE", visa: "D2_STUDENT", livesInKorea: true, residence: "서울특별시", school: "Korea University", major: "경영학", degree: "BACHELOR", eduStatus: "ENROLLED", koreanLevel: "ADVANCED", topik: "5급", englishLevel: "INTERMEDIATE", jobRoles: ["MARKETING", "OPERATIONS_PLANNING"], industries: ["COMMERCE", "CONTENT"], skills: ["Excel", "Notion", "콘텐츠 기획"], company: "Shopee VN", position: "마케팅 인턴", intro: "Tôi là du học sinh ngành Quản trị Kinh doanh, mong muốn trở thành marketer kết nối thị trường Việt Nam với nội dung Hàn Quốc." },
  { name: "Tran Van Hung", nationality: "Vietnam", gender: "male", nativeLang: "VIETNAMESE", visa: "E7_SPECIFIC_ACTIVITY", livesInKorea: true, residence: "경기도", school: "Hanoi Univ. of Science", major: "컴퓨터공학", degree: "BACHELOR", eduStatus: "GRADUATED", koreanLevel: "INTERMEDIATE", topik: "4급", englishLevel: "ADVANCED", jobRoles: ["BACKEND_DEVELOPMENT", "SOFTWARE_DEVELOPMENT"], industries: ["IT", "SAAS"], skills: ["Java", "Spring", "MySQL", "AWS"], company: "FPT Software", position: "백엔드 개발자", intro: "Tôi là kỹ sư backend 3 năm kinh nghiệm, muốn phát triển sự nghiệp tại các công ty IT Hàn Quốc." },
  { name: "Li Wei", nationality: "China", gender: "male", nativeLang: "CHINESE", visa: "D2_STUDENT", livesInKorea: true, residence: "서울특별시", school: "Yonsei University", major: "데이터사이언스", degree: "MASTER", eduStatus: "ENROLLED", koreanLevel: "ADVANCED", topik: "6급", englishLevel: "ADVANCED", jobRoles: ["DATA_ANALYSIS_SCIENCE"], industries: ["AI", "IT"], skills: ["Python", "SQL", "Pandas", "Tableau"], company: "Tencent", position: "데이터 분석 인턴", intro: "我是数据科学硕士研究生，喜欢用数据帮助决策，希望在韩国从事数据分析工作。" },
  { name: "Zhang Yan", nationality: "China", gender: "female", nativeLang: "CHINESE", visa: "F4_OVERSEAS_KOREAN", livesInKorea: true, residence: "인천광역시", school: "Inha University", major: "시각디자인", degree: "BACHELOR", eduStatus: "GRADUATED", koreanLevel: "NATIVE", topik: null, englishLevel: "INTERMEDIATE", jobRoles: ["UI_UX_DESIGN"], industries: ["CONTENT", "PLATFORM"], skills: ["Figma", "Photoshop", "Illustrator"], company: "스타트업 A", position: "주니어 디자이너", intro: "我是注重用户体验的 UI/UX 设计师，作为在外同胞，韩语接近母语水平。" },
  { name: "Sato Yuki", nationality: "Japan", gender: "female", nativeLang: "JAPANESE", visa: "D10_JOB_SEEKING", livesInKorea: true, residence: "서울특별시", school: "Sophia University", major: "한국어학", degree: "BACHELOR", eduStatus: "GRADUATED", koreanLevel: "ADVANCED", topik: "5급", englishLevel: "INTERMEDIATE", jobRoles: ["MARKETING", "SALES"], industries: ["TRAVEL", "BEAUTY"], skills: ["일본어 번역", "SNS 운영"], company: "Rakuten", position: "마케팅 어시스턴트", intro: "韓国と日本、両国の市場を理解するマーケターとして働きたいです。韓国語学を専攻しました。" },
  { name: "Tanaka Ren", nationality: "Japan", gender: "male", nativeLang: "JAPANESE", visa: "H1_WORKING_HOLIDAY", livesInKorea: true, residence: "부산광역시", school: "Osaka University", major: "기계공학", degree: "BACHELOR", eduStatus: "GRADUATED", koreanLevel: "INTERMEDIATE", topik: "3급", englishLevel: "INTERMEDIATE", jobRoles: ["OPERATIONS_PLANNING"], industries: ["DEVICE", "STARTUP"], skills: ["CAD", "프로젝트 관리"], intro: "ワーキングホリデーで韓国に来ました。製造・ハードウェアのスタートアップで経験を積みたいです。" },
  { name: "Putri Anjani", nationality: "Indonesia", gender: "female", nativeLang: "INDONESIAN", visa: "D2_STUDENT", livesInKorea: true, residence: "대전광역시", school: "KAIST", major: "전산학", degree: "MASTER", eduStatus: "ENROLLED", koreanLevel: "INTERMEDIATE", topik: "4급", englishLevel: "ADVANCED", jobRoles: ["SOFTWARE_DEVELOPMENT", "DATA_ANALYSIS_SCIENCE"], industries: ["AI", "DEEP_LEARNING"], skills: ["Python", "PyTorch", "C++"], company: "Gojek", position: "ML 인턴", intro: "Saya mahasiswa magister ilmu komputer yang ingin menggabungkan riset machine learning dengan praktik nyata di Korea." },
  { name: "Budi Santoso", nationality: "Indonesia", gender: "male", nativeLang: "INDONESIAN", visa: "E7_SPECIFIC_ACTIVITY", livesInKorea: true, residence: "경기도", school: "Universitas Indonesia", major: "산업공학", degree: "BACHELOR", eduStatus: "GRADUATED", koreanLevel: "INTERMEDIATE", topik: "4급", englishLevel: "ADVANCED", jobRoles: ["OPERATIONS_PLANNING", "PRODUCT_MANAGER"], industries: ["COMMERCE", "PLATFORM"], skills: ["SQL", "Jira", "프로세스 개선"], company: "Tokopedia", position: "운영 매니저", intro: "Saya ingin melanjutkan pengalaman operasi logistik dan e-commerce saya di platform Korea." },
  { name: "Priya Sharma", nationality: "India", gender: "female", nativeLang: "HINDI", visa: "E7_SPECIFIC_ACTIVITY", livesInKorea: false, residence: null, school: "IIT Delhi", major: "Computer Science", degree: "BACHELOR", eduStatus: "GRADUATED", koreanLevel: "BEGINNER", topik: null, englishLevel: "NATIVE", jobRoles: ["FRONTEND_DEVELOPMENT", "SOFTWARE_DEVELOPMENT"], industries: ["IT", "SAAS"], skills: ["React", "TypeScript", "Next.js"], company: "Infosys", position: "프론트엔드 개발자", intro: "मैं एक फ्रंटएंड डेवलपर हूँ और ग्लोबल SaaS प्रोडक्ट बनाने वाली कोरियाई टीम के साथ काम करना चाहती हूँ।" },
  { name: "Arjun Mehta", nationality: "India", gender: "male", nativeLang: "HINDI", visa: "D10_JOB_SEEKING", livesInKorea: true, residence: "서울특별시", school: "Seoul National University", major: "경영학(MBA)", degree: "MASTER", eduStatus: "ENROLLED", koreanLevel: "INTERMEDIATE", topik: "3급", englishLevel: "NATIVE", jobRoles: ["PRODUCT_MANAGER", "OPERATIONS_PLANNING"], industries: ["STARTUP", "B2B"], skills: ["전략 기획", "데이터 분석", "Figma"], company: "Zomato", position: "프로덕트 매니저", intro: "मैं डेटा-आधारित प्रोडक्ट मैनेजर हूँ और कोरियाई स्टार्टअप में 0→1 बनाना चाहता हूँ।" },
  { name: "Maria Santos", nationality: "Philippines", gender: "female", nativeLang: "FILIPINO", visa: "F2_RESIDENCE", livesInKorea: true, residence: "경기도", school: "University of the Philippines", major: "회계학", degree: "BACHELOR", eduStatus: "GRADUATED", koreanLevel: "ADVANCED", topik: "5급", englishLevel: "NATIVE", jobRoles: ["FINANCE_ACCOUNTING"], industries: ["B2B", "CONSULTING"], skills: ["회계", "Excel", "ERP"], company: "Accenture PH", position: "재무 분석가", intro: "Gusto kong manirahan at magtrabaho bilang finance at accounting professional sa Korea. May F-2 (residence) visa ako." },
  { name: "Jose Rizal Cruz", nationality: "Philippines", gender: "male", nativeLang: "FILIPINO", visa: "E7_SPECIFIC_ACTIVITY", livesInKorea: true, residence: "서울특별시", school: "Ateneo de Manila", major: "Marketing", degree: "BACHELOR", eduStatus: "GRADUATED", koreanLevel: "INTERMEDIATE", topik: "4급", englishLevel: "NATIVE", jobRoles: ["MARKETING", "SALES"], industries: ["GLOBAL", "COMMERCE"], skills: ["퍼포먼스 마케팅", "GA4", "영어 카피"], company: "Lazada", position: "그로스 마케터", intro: "Nais kong tumulong sa global marketing ng mga Korean brand para sa merkado ng Timog-silangang Asya." },
  { name: "Somchai Phichai", nationality: "Thailand", gender: "male", nativeLang: "THAI", visa: "D2_STUDENT", livesInKorea: true, residence: "서울특별시", school: "Sungkyunkwan University", major: "호텔경영", degree: "BACHELOR", eduStatus: "ENROLLED", koreanLevel: "INTERMEDIATE", topik: "4급", englishLevel: "INTERMEDIATE", jobRoles: ["SALES", "OPERATIONS_PLANNING"], industries: ["TRAVEL", "WELLNESS"], skills: ["고객 응대", "태국어", "예약 관리"], intro: "ผมอยากทำงานด้านการท่องเที่ยวและการบริการที่เชื่อมโยงประเทศไทยกับเกาหลีครับ" },
  { name: "Chananya Wong", nationality: "Thailand", gender: "female", nativeLang: "THAI", visa: "D2_STUDENT", livesInKorea: true, residence: "광주광역시", school: "Chonnam National University", major: "식품공학", degree: "MASTER", eduStatus: "ENROLLED", koreanLevel: "ADVANCED", topik: "5급", englishLevel: "INTERMEDIATE", jobRoles: ["DATA_ANALYSIS_SCIENCE", "OPERATIONS_PLANNING"], industries: ["AGRICULTURAL_PRODUCTS", "COMMERCE"], skills: ["R", "통계 분석", "품질관리"], intro: "ฉันสนใจงานวิเคราะห์ข้อมูลด้านอาหารและสินค้าเกษตรเพื่อสร้างคุณค่าค่ะ" },
  { name: "Aziz Karimov", nationality: "Uzbekistan", gender: "male", nativeLang: "OTHER", visa: "E7_SPECIFIC_ACTIVITY", livesInKorea: true, residence: "경기도", school: "Tashkent IT University", major: "정보통신", degree: "BACHELOR", eduStatus: "GRADUATED", koreanLevel: "ADVANCED", topik: "5급", englishLevel: "INTERMEDIATE", jobRoles: ["BACKEND_DEVELOPMENT"], industries: ["IT", "IOT"], skills: ["Node.js", "PostgreSQL", "Docker"], company: "EPAM", position: "소프트웨어 엔지니어", intro: "Men Koreyada backend muhandis sifatida o'z o'rnimni topishni istayman." },
  { name: "Oyunaa Bat", nationality: "Mongolia", gender: "female", nativeLang: "OTHER", visa: "D2_STUDENT", livesInKorea: true, residence: "서울특별시", school: "Ewha Womans University", major: "국제통상", degree: "BACHELOR", eduStatus: "ENROLLED", koreanLevel: "ADVANCED", topik: "5급", englishLevel: "INTERMEDIATE", jobRoles: ["SALES", "MARKETING"], industries: ["GLOBAL", "COMMERCE"], skills: ["무역 실무", "몽골어", "영어"], intro: "Би Монгол, Солонгос хоёрын хооронд худалдаа, борлуулалтын гүүр болж ажиллахыг хүсэж байна." },
  { name: "Bishal Gurung", nationality: "Nepal", gender: "male", nativeLang: "OTHER", visa: "D4_GENERAL_TRAINING", livesInKorea: true, residence: "경상남도", school: "한국어학당", major: "한국어", degree: "CERTIFICATE", eduStatus: "ENROLLED", koreanLevel: "INTERMEDIATE", topik: "3급", englishLevel: "INTERMEDIATE", jobRoles: ["OPERATIONS_PLANNING"], industries: ["CONSTRUCTION", "AGRICULTURE"], skills: ["성실함", "현장 경험"], intro: "म कोरियाली भाषा सिक्दै उत्पादन क्षेत्रमा निरन्तर बढ्न चाहन्छु।" },
  { name: "Camille Dubois", nationality: "France", gender: "female", nativeLang: "FRENCH", visa: "H1_WORKING_HOLIDAY", livesInKorea: true, residence: "서울특별시", school: "Sciences Po", major: "International Relations", degree: "MASTER", eduStatus: "GRADUATED", koreanLevel: "INTERMEDIATE", topik: "3급", englishLevel: "NATIVE", jobRoles: ["MARKETING", "PRODUCT_MANAGER"], industries: ["K_POP", "CONTENT"], skills: ["프랑스어", "콘텐츠 기획", "PR"], company: "Universal Music", position: "콘텐츠 PM", intro: "Je souhaite faire connaître le contenu coréen en Europe. Je suis en visa vacances-travail (PVT)." },
  { name: "Lukas Müller", nationality: "Germany", gender: "male", nativeLang: "GERMAN", visa: "D10_JOB_SEEKING", livesInKorea: true, residence: "서울특별시", school: "TU Munich", major: "Mechatronics", degree: "MASTER", eduStatus: "GRADUATED", koreanLevel: "BEGINNER", topik: null, englishLevel: "NATIVE", jobRoles: ["SOFTWARE_DEVELOPMENT", "OPERATIONS_PLANNING"], industries: ["DEVICE", "IOT"], skills: ["C++", "ROS", "임베디드"], company: "Bosch", position: "로보틱스 엔지니어", intro: "Ich möchte als Embedded-Ingenieur bei einem koreanischen Fertigungs- oder Robotikunternehmen arbeiten." },
  { name: "Gabriel Souza", nationality: "Brazil", gender: "male", nativeLang: "OTHER", visa: "D2_STUDENT", livesInKorea: true, residence: "서울특별시", school: "Hanyang University", major: "산업디자인", degree: "BACHELOR", eduStatus: "ENROLLED", koreanLevel: "INTERMEDIATE", topik: "4급", englishLevel: "ADVANCED", jobRoles: ["UI_UX_DESIGN", "PRODUCT_MANAGER"], industries: ["PLATFORM", "STARTUP"], skills: ["Figma", "프로토타이핑", "포르투갈어"], intro: "Quero atuar como designer de produto em uma startup coreana, unindo design e estratégia de produto." }
];

function birthDate(year: number) {
  return new Date(Date.UTC(year, (year * 7) % 12, ((year * 3) % 27) + 1));
}

async function main() {
  const passwordHash = await bcrypt.hash("!Test1234", 10);
  let created = 0;

  for (let i = 0; i < SEEDS.length; i++) {
    const s = SEEDS[i];
    const email = `cand${String(i + 1).padStart(2, "0")}@seed.aply`;
    const year = 1996 + (i % 7);

    const user = await prisma.user.upsert({
      where: { email_authProvider: { email, authProvider: AuthProvider.EMAIL } },
      update: {},
      create: {
        email,
        emailVerified: true,
        isActive: true,
        realName: s.name,
        name: s.name,
        nationality: s.nationality,
        gender: s.gender,
        birthDate: birthDate(year),
        phoneNumber: `010-0000-${String(1000 + i)}`,
        role: MemberRole.STUDENT,
        authProvider: AuthProvider.EMAIL,
        passwordHash
      }
    });

    const existing = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
    if (existing) {
      continue;
    }

    await prisma.candidateProfile.create({
      data: {
        userId: user.id,
        visaType: s.visa,
        workPermit: s.visa !== "D2_STUDENT" && s.visa !== "D4_GENERAL_TRAINING",
        livesInKorea: s.livesInKorea,
        residenceProvince: s.residence,
        preferredJobRoles: s.jobRoles,
        preferredIndustries: s.industries,
        skills: s.skills,
        selfIntroduction: s.intro,
        educations: {
          create: [
            {
              schoolName: s.school,
              educationType: s.degree,
              major: s.major,
              status: s.eduStatus,
              country: s.nationality,
              isKoreanSchool:
                /University|Univ|KAIST|학당|대학/.test(s.school) &&
                /Korea|Yonsei|Seoul|Inha|Sungkyunkwan|Chonnam|Ewha|Hanyang|KAIST|학당/.test(s.school)
            }
          ]
        },
        languageSkills: {
          create: [
            { language: "KOREAN", level: s.koreanLevel, testName: s.topik ? "TOPIK" : null, score: s.topik },
            { language: "ENGLISH", level: s.englishLevel },
            ...(s.nativeLang !== "KOREAN" && s.nativeLang !== "ENGLISH"
              ? [{ language: s.nativeLang as CandidateLanguageType, level: "NATIVE" as CandidateLanguageLevel }]
              : [])
          ]
        },
        careers:
          s.company && s.position
            ? { create: [{ companyName: s.company, position: s.position, isCurrent: false }] }
            : undefined
      }
    });
    created++;
    console.log(`✓ ${email}  ${s.name} (${s.nationality}) — ${s.visa}`);
  }

  const total = await prisma.user.count({ where: { role: MemberRole.STUDENT } });
  console.log(`\nCreated ${created} new foreign candidates. Total STUDENT users: ${total}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
