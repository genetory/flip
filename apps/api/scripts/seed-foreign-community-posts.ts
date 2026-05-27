import "dotenv/config";
import { CommunityPostCategory, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Post = { category: CommunityPostCategory; title: string; body: string };

// Posts that read like real foreign job-seekers in Korea. Assigned to the
// seeded candidate accounts (cand01~20@seed.aply) in rotation.
const POSTS: Post[] = [
  { category: "HELP", title: "D-2에서 E-7 비자 전환, 경험 공유해주실 분?", body: "졸업을 앞두고 있는데 D-2에서 E-7으로 전환 준비 중이에요. 회사 추천서랑 전공 연관성이 중요하다고 들었는데, 실제로 전환해보신 분들 팁이 있을까요?" },
  { category: "CAREER", title: "외국인 개발자 이력서, 한국식으로 어떻게 써야 할까요?", body: "본국에서 쓰던 CV를 그대로 내야 할지, 한국식 이력서로 다시 써야 할지 고민이에요. 자기소개서도 필수인가요? 다들 어떻게 준비하셨나요?" },
  { category: "FREE", title: "TOPIK 6급 드디어 합격했어요!", body: "3번째 도전 만에 6급 받았습니다 🎉 면접에서 한국어로 자신 있게 말할 수 있을 것 같아요. 같이 준비하는 분들 화이팅!" },
  { category: "HELP", title: "면접에서 비자 스폰서 질문, 먼저 꺼내도 될까요?", body: "면접 때 회사가 비자 지원을 해주는지 궁금한데, 제가 먼저 물어보면 마이너스가 될까요? 타이밍이 고민이에요." },
  { category: "CAREER", title: "한국 IT 회사 코딩테스트 후기 (백엔드)", body: "최근 본 코테는 알고리즘 2문제 + SQL이었어요. 한국어 문제였지만 영어 번역도 제공됐습니다. 준비하시는 분들 자료구조/SQL 꼭 챙기세요." },
  { category: "FREE", title: "한국에서 첫 출근! 회사 문화 적응기", body: "지난주부터 출근 시작했어요. 회식 문화가 생각보다 부담 없고 팀원들이 친절해서 다행이에요. 점심은 거의 같이 먹네요 ㅎㅎ" },
  { category: "HELP", title: "디자이너 포트폴리오, 한국 회사는 어떤 걸 더 볼까요?", body: "UI/UX 포지션 지원 중인데, 과정 중심으로 보여주는 게 좋을지 결과물 중심이 좋을지 고민이에요. 한국 기업 선호가 따로 있을까요?" },
  { category: "CAREER", title: "데이터 분석 직무 면접 질문 정리해봤어요", body: "최근 본 면접들 기준으로 자주 나온 질문: SQL 윈도우 함수, A/B 테스트 해석, 지표 정의. 한국어 커뮤니케이션도 많이 봅니다." },
  { category: "FREE", title: "외국인 친구들이랑 같이 스터디 만들고 싶어요", body: "서울에서 한국 취업 준비하는 외국인 분들, 같이 면접 스터디 하실 분 계신가요? 주 1회 온라인도 좋아요!" },
  { category: "HELP", title: "F-4 비자인데 취업 제한 있나요?", body: "재외동포(F-4) 비자로 한국에 있는데 직무 제한이 있다고 들었어요. 사무직/마케팅은 괜찮은 걸까요? 경험자분 답변 부탁드려요." },
  { category: "CAREER", title: "한국 스타트업 vs 대기업, 외국인 입장에서", body: "스타트업은 비자 지원이 빠른 대신 안정성이 걱정이고, 대기업은 절차가 까다롭다고 들었어요. 다들 어떤 기준으로 정하셨어요?" },
  { category: "FREE", title: "한국어 면접 너무 떨려요 ㅠㅠ", body: "내일 첫 한국어 면접인데 긴장돼서 잠이 안 와요. 자기소개랑 지원동기는 외웠는데... 응원 부탁해요!" },
  { category: "HELP", title: "워홀(H-1)로 와서 정규직 전환 가능할까요?", body: "워킹홀리데이로 한국에 왔는데 마음에 드는 회사를 찾았어요. 워홀에서 바로 E-7으로 전환한 사례 있으신가요?" },
  { category: "CAREER", title: "마케팅 직무, 외국어 능력이 강점이 될까요?", body: "영어+모국어 가능한데 한국 회사 글로벌 마케팅 포지션에서 어필 포인트가 될 수 있을까요? 실제로 도움 됐던 분 계세요?" },
  { category: "FREE", title: "한국 취업 6개월차, 솔직 후기", body: "처음엔 언어도 문화도 힘들었는데 이제 조금 적응했어요. 외국인이라고 너무 위축되지 않아도 되더라고요. 다들 힘내세요!" },
  { category: "HELP", title: "이력서에 사진 꼭 넣어야 하나요?", body: "본국에서는 사진을 안 넣는데 한국은 넣는 경우가 많다고 들었어요. 요즘도 필수인가요? 회사마다 다른가요?" },
  { category: "CAREER", title: "PM 직무 지원 중인데 경력 어필 팁", body: "본국에서 2년 PM 경험이 있는데 한국 시장 경험이 없어서 걱정이에요. 면접에서 어떻게 풀어내면 좋을까요?" },
  { category: "FREE", title: "한국 회사 점심 문화가 신기해요", body: "팀이 다 같이 점심 먹으러 가는 게 처음엔 어색했는데 이제는 좋아요. 메뉴 고르는 것도 은근 재밌네요 😄" },
  { category: "HELP", title: "연봉 협상, 외국인도 해도 되나요?", body: "오퍼를 받았는데 연봉 협상을 시도해도 될지 모르겠어요. 첫 직장이라 조심스러운데 경험 있으신 분 조언 부탁드려요." },
  { category: "CAREER", title: "엔지니어 채용, 한국어 어느 정도 필요할까요?", body: "백엔드 포지션인데 영어로 소통 가능한 팀도 있다고 들었어요. 실제로 한국어 없이도 일하는 외국 개발자분들 계신가요?" },
  { category: "FREE", title: "합격했습니다! 응원해주신 분들 감사해요", body: "지난달에 면접 떨린다고 글 올렸었는데 결국 합격했어요!! 이 커뮤니티에서 많은 도움 받았습니다. 다음은 여러분 차례예요 🙌" },
  { category: "HELP", title: "지방 근무 vs 수도권, 비자/생활 측면 고민", body: "경상도 쪽 회사에서 오퍼가 왔는데 외국인 인프라가 어떤지 궁금해요. 지방에서 일하시는 분들 생활 어떠세요?" },
  { category: "CAREER", title: "신입 디자이너 포트폴리오 피드백 받고 싶어요", body: "곧 졸업하는 산업디자인 전공입니다. 포트폴리오 함께 봐주실 선배님 계실까요? 한국 취업이 목표예요." },
  { category: "FREE", title: "한국 생활 꿀팁 공유 (외국인 기준)", body: "교통카드, 배달앱, 통신사 알뜰폰 등 처음에 헤맸던 것들 정리해봤어요. 필요하신 분들 댓글 주세요!" }
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

  // Clean previous seed posts by these authors so re-runs don't duplicate.
  const authorIds = authors.map((a) => a.id);
  const del = await prisma.communityPost.deleteMany({ where: { authorId: { in: authorIds } } });
  if (del.count) console.log(`Removed ${del.count} previous seed posts.`);

  const now = Date.now();
  let order = 0;
  for (let i = 0; i < POSTS.length; i++) {
    const post = POSTS[i];
    const author = authors[i % authors.length];
    // Spread timestamps over the last ~16 days, most recent first-ish.
    const createdAt = new Date(now - (order * rand(8, 28) + rand(0, 6)) * 60 * 60 * 1000);
    order += 1;

    await prisma.communityPost.create({
      data: {
        authorId: author.id,
        authorName: author.name ?? "익명",
        category: post.category,
        title: post.title,
        body: post.body,
        likes: rand(0, 47),
        comments: rand(0, 12),
        createdAt,
        updatedAt: createdAt
      }
    });
    console.log(`✓ [${post.category}] ${post.title}  — ${author.name}`);
  }

  console.log(`\nCreated ${POSTS.length} community posts across ${authors.length} foreign candidates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
