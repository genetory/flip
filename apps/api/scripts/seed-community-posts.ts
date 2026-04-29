import "dotenv/config";
import { CommunityPostCategory, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
    data: sampleCommunityPosts.map((item) => ({
      ...item,
      comments: 0
    }))
  });

  const seededPosts = await prisma.communityPost.findMany({
    where: {
      title: { in: sampleCommunityPosts.map((item) => item.title) }
    },
    select: { id: true, title: true },
    orderBy: [{ createdAt: "asc" }]
  });

  const commenterPool = ["Ari", "민지", "Chen", "Nok", "Carlos", "Yuna", "Leo", "Sora", "Mei", "Ploy"] as const;

  const commentTemplates = [
    "좋은 정보 감사합니다! 저도 비슷한 경험 있었어요.",
    "혹시 자세한 절차 공유해주실 수 있나요?",
    "I had a similar experience. This is super helpful!",
    "Could you share a bit more detail on this part?",
    "谢谢分享！这个对我很有帮助。",
    "可以再说明一下流程吗？我也在准备这个。",
    "ขอบคุณมากครับ ข้อมูลนี้ช่วยได้มากเลย",
    "มีใครทำขั้นตอนนี้ล่าสุดบ้าง อยากขอคำแนะนำเพิ่มครับ",
    "¡Gracias por compartir! Me ayudó bastante.",
    "¿Podrías contar un poco más sobre el proceso?"
  ] as const;

  for (let index = 0; index < seededPosts.length; index += 1) {
    const post = seededPosts[index];
    const commentCount = (index % 2) + 2; // 2~3 comments per post
    const comments = Array.from({ length: commentCount }).map((_, offset) => ({
      postId: post.id,
      authorName: commenterPool[(index + offset) % commenterPool.length],
      body: commentTemplates[(index + offset) % commentTemplates.length]
    }));

    await prisma.communityPostComment.createMany({ data: comments });
    await prisma.communityPost.update({
      where: { id: post.id },
      data: { comments: commentCount }
    });
  }

  console.log(`Seeded sample community posts: ${sampleCommunityPosts.length} items`);
  console.log(`Seeded sample community comments: ${seededPosts.reduce((sum, _, idx) => sum + ((idx % 2) + 2), 0)} items`);
}

main()
  .catch((error) => {
    console.error("Failed to seed community posts:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
