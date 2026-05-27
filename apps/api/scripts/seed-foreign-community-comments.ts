import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Casual, college-student-toned comments per nationality (commenter's own
// language). Generic enough to fit any free-talk post.
const COMMENTS_BY_NATIONALITY: Record<string, string[]> = {
  Vietnam: ["Hay quá! 😄", "Mình cũng muốn thử nha", "Cảm ơn đã chia sẻ!", "Đồng cảm ghê 😂", "Cho mình tham gia với!"],
  China: ["哈哈太真实了", "我也想去！", "谢谢分享～", "同感同感 😂", "求带 lol"],
  Japan: ["わかる〜！", "いいな、私も行きたい", "シェアありがとう！", "めっちゃ共感 😂", "今度一緒に行こう！"],
  Indonesia: ["Setuju banget! 😄", "Aku juga mau coba", "Makasih infonya!", "Relate banget 😂", "Ajak aku dong!"],
  India: ["बिल्कुल सही! 😄", "मुझे भी जाना है", "शेयर करने के लिए शुक्रिया", "एकदम relatable 😂", "मुझे भी साथ ले चलो!"],
  Philippines: ["Grabe, relate! 😄", "Gusto ko rin yan", "Salamat sa share!", "Same tayo haha", "Sama ako next time!"],
  Thailand: ["จริงงง 😆", "อยากไปบ้างง", "ขอบคุณที่แชร์น้า", "อินมากกก", "ชวนเราด้วยน้า!"],
  Uzbekistan: ["Zo'r ekan! 😄", "Men ham xohlayman", "Bo'lishganingiz uchun rahmat", "Juda mos keldi 😂", "Meni ham olib boring!"],
  Mongolia: ["Үнэхээр зөв! 😄", "Би ч бас явмаар байна", "Хуваалцсанд баярлалаа", "Яг л миний бодол 😂", "Намайг ч дагуулаарай!"],
  Nepal: ["साँच्चै रमाइलो! 😄", "मलाई पनि जान मन छ", "सेयर गरेकोमा धन्यवाद", "एकदम मिल्यो 😂", "मलाई पनि लैजानु है!"],
  France: ["Trop bien ! 😄", "Moi aussi je veux essayer", "Merci du partage !", "Tellement vrai 😂", "Emmène-moi la prochaine fois !"],
  Germany: ["Cool! 😄", "Will ich auch mal", "Danke fürs Teilen!", "So wahr 😂", "Nimm mich nächstes Mal mit!"],
  Brazil: ["Que massa! 😄", "Também quero", "Valeu por compartilhar!", "Muito eu isso 😂", "Me chama da próxima!"]
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  const candidates = await prisma.user.findMany({
    where: { email: { startsWith: "cand", endsWith: "@seed.aply" } },
    select: { id: true, name: true, nationality: true }
  });
  if (candidates.length === 0) {
    console.error("No seeded candidates found. Run seed-foreign-candidates.ts first.");
    process.exit(1);
  }
  const candIds = candidates.map((c) => c.id);

  const posts = await prisma.communityPost.findMany({
    where: { authorId: { in: candIds } },
    select: { id: true, authorId: true, createdAt: true }
  });

  // Clean previous seed comments so re-runs don't duplicate.
  const del = await prisma.communityPostComment.deleteMany({ where: { authorId: { in: candIds } } });
  if (del.count) console.log(`Removed ${del.count} previous seed comments.`);

  let total = 0;
  for (const post of posts) {
    // Commenters = other candidates (not the post author).
    const others = shuffle(candidates.filter((c) => c.id !== post.authorId));
    const n = Math.min(rand(1, 5), others.length);
    const commenters = others.slice(0, n);

    for (let k = 0; k < commenters.length; k++) {
      const c = commenters[k];
      const pool = COMMENTS_BY_NATIONALITY[c.nationality ?? ""] ?? ["👍", "😄", "Nice!"];
      const body = pool[rand(0, pool.length - 1)];
      // Comment timestamps fall after the post, spaced out a bit.
      const createdAt = new Date(post.createdAt.getTime() + (k + 1) * rand(20, 180) * 60 * 1000);
      await prisma.communityPostComment.create({
        data: { postId: post.id, authorId: c.id, authorName: c.name ?? "익명", body, createdAt, updatedAt: createdAt }
      });
      total++;
    }
    await prisma.communityPost.update({ where: { id: post.id }, data: { comments: commenters.length } });
  }

  console.log(`\nCreated ${total} comments across ${posts.length} posts (1-5 each, in each commenter's language).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
