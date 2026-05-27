import "dotenv/config";
import { CommunityPostCategory, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Post = { category: CommunityPostCategory; title: string; body: string };

// One casual, college-student-toned post per candidate, written in that
// candidate's own language. Posts are indexed to the candidates in email
// order (cand01..cand20), which matches seed-foreign-candidates.ts.
// Mostly free-talk; a few career/help — like a real foreign-student board.
const POSTS: Post[] = [
  // 0 Nguyen Thi Mai — Vietnam (VI)
  { category: "FREE", title: "Cơm trưa ở căng tin trường", body: "Hôm nay ăn thử kimbap với tteokbokki ở căng tin, ngon mà cay xé lưỡi 😂 Mọi người hay ăn gì ở trường thế?" },
  // 1 Tran Van Hung — Vietnam (VI)
  { category: "FREE", title: "Mùa đông Hàn Quốc lạnh thật sự", body: "Lần đầu thấy tuyết rơi nhiều như vậy, vừa vui vừa run 🥶 Có ai mách mình chỗ mua áo khoác ấm mà giá sinh viên không?" },
  // 2 Li Wei — China (ZH)
  { category: "FREE", title: "周末去汉江骑车太爽了", body: "天气一好就想去汉江骑自行车野餐，超级chill～有没有一起的同学约一下？" },
  // 3 Zhang Yan — China (ZH)
  { category: "FREE", title: "靠追剧学韩语真的有用", body: "最近边看韩剧边记台词，口语进步了不少哈哈。大家有什么下饭剧推荐吗？" },
  // 4 Sato Yuki — Japan (JA)
  { category: "FREE", title: "ソウルのカフェ巡りにハマってる", body: "勉強しながらカフェ巡りするのが最近の楽しみ☕ おすすめのカフェあったら教えてください！" },
  // 5 Tanaka Ren — Japan (JA)
  { category: "FREE", title: "自炊はじめました", body: "キムチチゲ作ってみたけど意外と簡単だった！留学生のみんな、簡単レシピ共有しませんか？" },
  // 6 Putri Anjani — Indonesia (ID)
  { category: "HELP", title: "Rekomendasi provider HP buat mahasiswa?", body: "Baru sampai Korea, bingung pilih kartu SIM yang murah. Ada saran buat anak kampus? 🙏" },
  // 7 Budi Santoso — Indonesia (ID)
  { category: "FREE", title: "Akhirnya nemu makanan halal deket kampus", body: "Seneng banget akhirnya ketemu resto halal deket kampus 😭 Ada yang tau tempat enak lainnya?" },
  // 8 Priya Sharma — India (HI)
  { category: "FREE", title: "कैंपस फेस्टिवल बहुत मज़ेदार था", body: "आज कॉलेज फेस्ट में परफॉर्मेंस देखी, माहौल ज़बरदस्त था! 🎉 आप लोग गए थे क्या?" },
  // 9 Arjun Mehta — India (HI)
  { category: "CAREER", title: "स्टूडेंट क्लब join करूँ?", body: "नेटवर्किंग के लिए कोई अच्छा स्टूडेंट क्लब या स्टार्टअप कम्युनिटी पता है? रिकमेंड कीजिए plz" },
  // 10 Maria Santos — Philippines (FIL)
  { category: "FREE", title: "Ang lamig pero ang saya", body: "Miss ko na pamilya ko sa Pilipinas pero masaya naman dito 😊 Sino gustong mag-meetup ng mga Pinoy students?" },
  // 11 Jose Rizal Cruz — Philippines (FIL)
  { category: "HELP", title: "May part-time tips ba kayo?", body: "Naghahanap ako ng part-time na bagay sa schedule ng klase. May suggestions kayo?" },
  // 12 Somchai Phichai — Thailand (TH)
  { category: "FREE", title: "ไปเที่ยวเกาะนามิมา", body: "วันหยุดไปเกาะนามิมาครับ ใบไม้เปลี่ยนสีสวยมากกก 🍁 ใครอยากไปเที่ยวด้วยกันทักมาได้นะ" },
  // 13 Chananya Wong — Thailand (TH)
  { category: "FREE", title: "นั่งอ่านหนังสือในคาเฟ่ทั้งวัน", body: "ช่วงสอบนั่งคาเฟ่ยาวเลยค่ะ ใครมีคาเฟ่เงียบ ๆ นั่งทำงานได้นาน แนะนำหน่อยน้า" },
  // 14 Aziz Karimov — Uzbekistan (UZ)
  { category: "FREE", title: "Koreyada osh pishirib ko'rdim", body: "Bugun uyda osh pishirdim, koreys do'stlarimga ham yoqdi 😄 Sizlar milliy taomlaringizni pishirib turasizmi?" },
  // 15 Oyunaa Bat — Mongolia (MN)
  { category: "FREE", title: "Солонгосын намар үнэхээр гоё", body: "Навчис унаж байгааг хараад гэр орноо саналаа 🍂 Хамт зугаалах хүн байна уу?" },
  // 16 Bishal Gurung — Nepal (NE)
  { category: "FREE", title: "नयाँ साथीहरू बनाउँदै", body: "कोरियामा नयाँ साथीहरू बनाउन रमाइलो छ। भाषा सिक्दै छु, अलि गाह्रो भए पनि मज्जा आउँछ 😅" },
  // 17 Camille Dubois — France (FR)
  { category: "FREE", title: "La vie étudiante à Séoul", body: "Les cafés ouverts tard pour réviser, c'est génial ! Vous avez des coins sympas à conseiller à Séoul ?" },
  // 18 Lukas Müller — Germany (DE)
  { category: "HELP", title: "Tipps für die Ausländerregistrierung?", body: "Hat jemand Tipps für den Termin beim Immigration Office? Welche Dokumente brauche ich genau? Danke!" },
  // 19 Gabriel Souza — Brazil (PT)
  { category: "FREE", title: "Apaixonado pela comida coreana", body: "Tô viciado em churrasco coreano e em noraebang 🎤😂 Alguém pra marcar um rolê no fim de semana?" }
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const authors = await prisma.user.findMany({
    where: { email: { startsWith: "cand", endsWith: "@seed.aply" } },
    select: { id: true, name: true },
    orderBy: { email: "asc" }
  });
  if (authors.length === 0) {
    console.error("No seeded candidates found. Run seed-foreign-candidates.ts first.");
    process.exit(1);
  }
  const authorIds = authors.map((a) => a.id);

  // Remove Korean / sample posts (null-author or Korean-nationality authors)
  // so the board reads as a foreign-student community.
  const delKorean = await prisma.communityPost.deleteMany({
    where: {
      OR: [
        { authorId: null },
        { author: { is: { nationality: null } } },
        { author: { is: { nationality: { in: ["Korea", "한국", "대한민국", "Korean"] } } } }
      ]
    }
  });
  if (delKorean.count) console.log(`Removed ${delKorean.count} Korean/sample posts.`);

  // Remove previous foreign seed posts so re-runs don't duplicate.
  const delPrev = await prisma.communityPost.deleteMany({ where: { authorId: { in: authorIds } } });
  if (delPrev.count) console.log(`Removed ${delPrev.count} previous foreign seed posts.`);

  const now = Date.now();
  for (let i = 0; i < POSTS.length; i++) {
    const post = POSTS[i];
    const author = authors[i % authors.length];
    const createdAt = new Date(now - (i * rand(8, 26) + rand(0, 6)) * 60 * 60 * 1000);

    await prisma.communityPost.create({
      data: {
        authorId: author.id,
        authorName: author.name ?? "익명",
        category: post.category,
        title: post.title,
        body: post.body,
        likes: rand(0, 38),
        comments: rand(0, 9),
        createdAt,
        updatedAt: createdAt
      }
    });
    console.log(`✓ [${post.category}] ${author.name}: ${post.title}`);
  }

  console.log(`\nCreated ${POSTS.length} native-language posts; Korean posts removed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
