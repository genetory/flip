import type { PrismaClient } from "@prisma/client";

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
