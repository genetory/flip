import type {
  CandidateEducationStatus,
  CandidateEducationType,
  CandidateLanguageLevel,
  CandidateLanguageType,
  CandidatePreferredJobRole,
  CandidateVisaType,
  PartnerIndustry,
  PrismaClient
} from "@prisma/client";
import bcrypt from "bcryptjs";

// Casual, college-student-toned community content in each nationality's own
// language. Used by the ops "generate community content" tool to populate the
// board with believable foreign-student posts/comments.

type PostTemplate = { category: "FREE" | "CAREER" | "HELP"; title: string; body: string };

const POSTS_BY_NATIONALITY: Record<string, PostTemplate[]> = {
  Vietnam: [
    { category: "FREE", title: "Cơm trưa ở căng tin trường", body: "Hôm nay ăn kimbap với tteokbokki, ngon mà cay xé lưỡi 😂 Mọi người hay ăn gì ở trường?" },
    { category: "FREE", title: "Mùa đông Hàn lạnh thật", body: "Lần đầu thấy tuyết nhiều thế này, vừa vui vừa run 🥶 Mách mình chỗ mua áo ấm giá sinh viên với!" },
    { category: "HELP", title: "Mở tài khoản ngân hàng ở đâu dễ?", body: "Sinh viên mới qua nên hơi rối, ngân hàng nào làm thẻ cho người nước ngoài dễ nhất ạ? 🙏" }
  ],
  China: [
    { category: "FREE", title: "周末去汉江骑车太爽了", body: "天气一好就想去汉江骑车野餐，超chill～有没有一起的同学约一下？" },
    { category: "FREE", title: "靠追剧学韩语真有用", body: "边看剧边记台词，口语进步不少哈哈。有什么下饭剧推荐吗？" },
    { category: "HELP", title: "外国人手机卡推荐", body: "刚来想办便宜点的手机卡，有适合学生的推荐吗？" }
  ],
  Japan: [
    { category: "FREE", title: "ソウルのカフェ巡りにハマってる", body: "勉強しながらカフェ巡りが最近の楽しみ☕ おすすめあったら教えて！" },
    { category: "FREE", title: "自炊はじめました", body: "キムチチゲ作ったら意外と簡単だった！簡単レシピ共有しませんか？" },
    { category: "FREE", title: "韓国の紅葉きれい", body: "キャンパスの紅葉が最高でした🍁 みんなどこかおすすめの紅葉スポットある？" }
  ],
  Indonesia: [
    { category: "HELP", title: "Rekomendasi provider HP buat mahasiswa?", body: "Baru sampai, bingung pilih SIM murah. Ada saran buat anak kampus? 🙏" },
    { category: "FREE", title: "Nemu makanan halal deket kampus", body: "Akhirnya ketemu resto halal deket kampus 😭 Ada yang tau tempat enak lain?" },
    { category: "FREE", title: "Kangen rumah pas ujian", body: "Lagi musim ujian, kangen masakan rumah 😂 Semangat ya semuanya!" }
  ],
  India: [
    { category: "FREE", title: "कैंपस फेस्टिवल मज़ेदार था", body: "आज कॉलेज फेस्ट की परफॉर्मेंस देखी, माहौल ज़बरदस्त था! 🎉 आप गए थे क्या?" },
    { category: "CAREER", title: "स्टूडेंट क्लब join करूँ?", body: "नेटवर्किंग के लिए कोई अच्छा क्लब या स्टार्टअप कम्युनिटी है? रिकमेंड करें plz" },
    { category: "FREE", title: "कोरियन खाना spicy है", body: "यहाँ का खाना मसालेदार है पर मज़ा आता है 😋 कोई veg friendly जगह पता है?" }
  ],
  Philippines: [
    { category: "FREE", title: "Ang lamig pero ang saya", body: "Miss ko na pamilya ko pero masaya naman dito 😊 Sino gustong mag-meetup ng Pinoy students?" },
    { category: "HELP", title: "May part-time tips ba kayo?", body: "Naghahanap ng part-time na bagay sa schedule ng klase. May suggestions? " },
    { category: "FREE", title: "First snow experience!", body: "First time kong makakita ng snow, ang ganda! ❄️ Excited na ako sa winter break." }
  ],
  Thailand: [
    { category: "FREE", title: "ไปเที่ยวเกาะนามิมา", body: "วันหยุดไปเกาะนามิ ใบไม้เปลี่ยนสีสวยมากกก 🍁 ใครอยากไปด้วยทักมาน้า" },
    { category: "FREE", title: "นั่งคาเฟ่อ่านหนังสือทั้งวัน", body: "ช่วงสอบนั่งคาเฟ่ยาวเลย ใครมีคาเฟ่เงียบ ๆ แนะนำหน่อยน้า" },
    { category: "FREE", title: "คิดถึงอาหารไทย", body: "อยากกินส้มตำมากกก 😭 แถวมหาลัยมีร้านอาหารไทยอร่อย ๆ มั้ยคะ" }
  ],
  Uzbekistan: [
    { category: "FREE", title: "Koreyada osh pishirdim", body: "Bugun osh pishirdim, koreys do'stlarga ham yoqdi 😄 Sizlar milliy taom pishirasizmi?" },
    { category: "FREE", title: "Qish juda sovuq ekan", body: "Koreyada qish ancha sovuq ekan 🥶 Issiq kiyim qayerdan arzon olsa bo'ladi?" },
    { category: "HELP", title: "Talabalar uchun maslahat", body: "Yangi kelganman, chegirmali transport karta qanday olinadi? Rahmat!" }
  ],
  Mongolia: [
    { category: "FREE", title: "Солонгосын намар гоё", body: "Навчис унаж байгааг хараад гэрээ саналаа 🍂 Хамт зугаалах хүн байна уу?" },
    { category: "FREE", title: "Шалгалтын улирал хэцүү", body: "Шалгалт ойртоход номын санд хоног хоносон 😂 Бүгд амжилт хүсье!" },
    { category: "FREE", title: "Солонгос хоол амттай", body: "Самгёпсаль үнэхээр амттай юм аа 😋 Хямд газар мэдэх хүн байна уу?" }
  ],
  Nepal: [
    { category: "FREE", title: "नयाँ साथीहरू बनाउँदै", body: "कोरियामा नयाँ साथी बनाउन रमाइलो छ। भाषा सिक्दै छु, गाह्रो भए पनि मज्जा 😅" },
    { category: "FREE", title: "जाडो धेरै छ", body: "यहाँको जाडो साह्रै चिसो रहेछ 🥶 न्यानो ज्याकेट कहाँ सस्तो पाइन्छ?" },
    { category: "HELP", title: "विद्यार्थीलाई सुझाव", body: "नयाँ आएको, मोबाइल सिम कसरी सस्तोमा लिने? सुझाव दिनुहोस् न।" }
  ],
  France: [
    { category: "FREE", title: "La vie étudiante à Séoul", body: "Les cafés ouverts tard pour réviser, génial ! Des coins sympas à conseiller ?" },
    { category: "FREE", title: "Première neige à Séoul", body: "Première grosse neige, c'était magnifique ❄️ Vous faites quoi cet hiver ?" },
    { category: "FREE", title: "La cuisine coréenne 😍", body: "Accro au tteokbokki et au BBQ coréen 😂 Un resto à recommander près du campus ?" }
  ],
  Germany: [
    { category: "HELP", title: "Tipps für die Ausländerregistrierung?", body: "Hat jemand Tipps für den Termin beim Immigration Office? Welche Dokumente genau? Danke!" },
    { category: "FREE", title: "Cafés zum Lernen in Seoul", body: "Suche ruhige Cafés zum Lernen. Habt ihr Empfehlungen? ☕" },
    { category: "FREE", title: "Koreanisches Essen ist top", body: "Bin süchtig nach koreanischem BBQ 😂 Jemand Lust am Wochenende?" }
  ],
  Brazil: [
    { category: "FREE", title: "Apaixonado pela comida coreana", body: "Viciado em churrasco coreano e noraebang 🎤😂 Alguém pra um rolê no fim de semana?" },
    { category: "FREE", title: "Primeira neve!", body: "Primeira vez que vejo neve de verdade, que lindo ❄️ Animado pro inverno!" },
    { category: "FREE", title: "Vida de estudante em Seul", body: "Cafés abertos até tarde pra estudar é o melhor! Alguma dica de lugar legal?" }
  ]
};

const COMMENTS_BY_NATIONALITY: Record<string, string[]> = {
  Vietnam: ["Hay quá! 😄", "Mình cũng muốn thử", "Cảm ơn đã chia sẻ!", "Đồng cảm ghê 😂", "Cho mình tham gia với!"],
  China: ["哈哈太真实了", "我也想去！", "谢谢分享～", "同感同感 😂", "求带 lol"],
  Japan: ["わかる〜！", "私も行きたい", "シェアありがとう！", "めっちゃ共感 😂", "今度一緒に行こう！"],
  Indonesia: ["Setuju banget! 😄", "Aku juga mau coba", "Makasih infonya!", "Relate banget 😂", "Ajak aku dong!"],
  India: ["बिल्कुल सही! 😄", "मुझे भी जाना है", "शुक्रिया शेयर करने के लिए", "एकदम relatable 😂", "मुझे भी ले चलो!"],
  Philippines: ["Grabe, relate! 😄", "Gusto ko rin yan", "Salamat sa share!", "Same tayo haha", "Sama ako next time!"],
  Thailand: ["จริงงง 😆", "อยากไปบ้างง", "ขอบคุณที่แชร์น้า", "อินมากกก", "ชวนเราด้วยน้า!"],
  Uzbekistan: ["Zo'r ekan! 😄", "Men ham xohlayman", "Rahmat bo'lishganingiz uchun", "Juda mos keldi 😂", "Meni ham olib boring!"],
  Mongolia: ["Үнэхээр зөв! 😄", "Би ч явмаар байна", "Хуваалцсанд баярлалаа", "Яг л миний бодол 😂", "Намайг ч дагуулаарай!"],
  Nepal: ["साँच्चै रमाइलो! 😄", "मलाई पनि जान मन छ", "सेयर गरेकोमा धन्यवाद", "एकदम मिल्यो 😂", "मलाई पनि लैजानु!"],
  France: ["Trop bien ! 😄", "Moi aussi je veux essayer", "Merci du partage !", "Tellement vrai 😂", "Emmène-moi !"],
  Germany: ["Cool! 😄", "Will ich auch mal", "Danke fürs Teilen!", "So wahr 😂", "Nimm mich mit!"],
  Brazil: ["Que massa! 😄", "Também quero", "Valeu por compartilhar!", "Muito eu isso 😂", "Me chama da próxima!"]
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type CommunityGenOptions = {
  posts: number;
  commentsMin: number;
  commentsMax: number;
  daysBack: number;
};

export type CommunityGenResult = { postsCreated: number; commentsCreated: number };

// Generates believable community posts (+ comments) authored by the seeded
// foreign candidates, with random past timestamps within `daysBack` days.
export async function generateCommunityContent(
  prisma: PrismaClient,
  opts: CommunityGenOptions
): Promise<CommunityGenResult> {
  const posts = Math.max(0, Math.min(100, Math.floor(opts.posts)));
  const cMin = Math.max(0, Math.min(20, Math.floor(opts.commentsMin)));
  const cMax = Math.max(cMin, Math.min(20, Math.floor(opts.commentsMax)));
  const daysBack = Math.max(0, Math.min(365, Math.floor(opts.daysBack)));

  const candidates = await prisma.user.findMany({
    where: { email: { startsWith: "cand", endsWith: "@seed.aply" } },
    select: { id: true, name: true, nationality: true }
  });
  if (candidates.length === 0 || posts === 0) {
    return { postsCreated: 0, commentsCreated: 0 };
  }

  const now = Date.now();
  const windowMs = daysBack * 24 * 60 * 60 * 1000;
  let postsCreated = 0;
  let commentsCreated = 0;

  for (let i = 0; i < posts; i++) {
    const author = pick(candidates);
    const pool = POSTS_BY_NATIONALITY[author.nationality ?? ""] ?? [
      { category: "FREE" as const, title: "Hello from Korea!", body: "Loving campus life here 😄" }
    ];
    const tpl = pick(pool);
    const createdAt = new Date(now - rand(0, windowMs || 1));

    const created = await prisma.communityPost.create({
      data: {
        authorId: author.id,
        authorName: author.name ?? "익명",
        category: tpl.category,
        title: tpl.title,
        body: tpl.body,
        likes: rand(0, 40),
        comments: 0,
        createdAt,
        updatedAt: createdAt
      }
    });
    postsCreated++;

    const others = shuffle(candidates.filter((c) => c.id !== author.id));
    const n = Math.min(rand(cMin, cMax), others.length);
    for (let k = 0; k < n; k++) {
      const c = others[k];
      const cpool = COMMENTS_BY_NATIONALITY[c.nationality ?? ""] ?? ["👍", "Nice!"];
      const cCreatedAt = new Date(Math.min(now, createdAt.getTime() + (k + 1) * rand(10, 240) * 60 * 1000));
      await prisma.communityPostComment.create({
        data: { postId: created.id, authorId: c.id, authorName: c.name ?? "익명", body: pick(cpool), createdAt: cCreatedAt, updatedAt: cCreatedAt }
      });
      commentsCreated++;
    }
    if (n > 0) {
      await prisma.communityPost.update({ where: { id: created.id }, data: { comments: n } });
    }
  }

  return { postsCreated, commentsCreated };
}

// ---- Candidate seeding (server-side, callable from the ops console) -------
type CandidateSeed = {
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

const CANDIDATES: CandidateSeed[] = [
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

function candBirthDate(year: number) {
  return new Date(Date.UTC(year, (year * 7) % 12, ((year * 3) % 27) + 1));
}

export async function seedForeignCandidates(prisma: PrismaClient): Promise<{ created: number; total: number }> {
  const passwordHash = await bcrypt.hash("!Test1234", 10);
  let created = 0;
  for (let i = 0; i < CANDIDATES.length; i++) {
    const s = CANDIDATES[i];
    const email = `cand${String(i + 1).padStart(2, "0")}@seed.aply`;
    const year = 1996 + (i % 7);
    const user = await prisma.user.upsert({
      where: { email_authProvider: { email, authProvider: "EMAIL" } },
      update: {},
      create: {
        email,
        emailVerified: true,
        isActive: true,
        realName: s.name,
        name: s.name,
        nationality: s.nationality,
        gender: s.gender,
        birthDate: candBirthDate(year),
        phoneNumber: `010-0000-${String(1000 + i)}`,
        role: "STUDENT",
        authProvider: "EMAIL",
        passwordHash
      }
    });
    const existing = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
    if (existing) continue;
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
          create: [{ schoolName: s.school, educationType: s.degree, major: s.major, status: s.eduStatus, country: s.nationality }]
        },
        languageSkills: {
          create: [
            { language: "KOREAN", level: s.koreanLevel, testName: s.topik ? "TOPIK" : null, score: s.topik },
            { language: "ENGLISH", level: s.englishLevel },
            ...(s.nativeLang !== "KOREAN" && s.nativeLang !== "ENGLISH" ? [{ language: s.nativeLang, level: "NATIVE" as CandidateLanguageLevel }] : [])
          ]
        },
        careers: s.company && s.position ? { create: [{ companyName: s.company, position: s.position, isCurrent: false }] } : undefined
      }
    });
    created++;
  }
  const total = await prisma.user.count({ where: { email: { startsWith: "cand", endsWith: "@seed.aply" } } });
  return { created, total };
}

// Delete every community post not authored by an OPERATOR (keeps official
// operator posts). Comments cascade with their posts.
export async function deleteNonOperatorCommunityPosts(prisma: PrismaClient): Promise<{ deleted: number }> {
  const operators = await prisma.user.findMany({ where: { role: "OPERATOR" }, select: { id: true } });
  const opIds = operators.map((o) => o.id);
  const result = await prisma.communityPost.deleteMany({
    where: opIds.length ? { OR: [{ authorId: null }, { authorId: { notIn: opIds } }] } : {}
  });
  return { deleted: result.count };
}
