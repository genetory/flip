// 테스트용 — student@test.com 계정의 Career Launch '자기소개서'만 목업으로 채운다.
// 문항 라벨은 스텝별 집중 대화와 동일(지원 동기·성장 과정·성격의 장단점·입사 후 포부).
// 대표 자기소개서라 특정 회사는 비워둔다(company=null). progress·resume 는 건드리지 않는다.
// 실행: cd apps/api && set -a; . ../../.env; set +a; node --import tsx scripts/seed-career-cover-demo.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EMAIL = "student@test.com";

const coverContent = {
  company: null,
  items: [
    {
      question: "지원 동기",
      answer:
        "대학에서 컴퓨터공학을 공부하며 데이터로 문제를 정의하고 풀어내는 과정에 깊이 매료되었습니다. 특히 눈에 보이지 않는 서버와 API가 수많은 사용자 경험을 안정적으로 떠받친다는 점에 끌려 백엔드 개발자를 목표로 삼았습니다. 인턴과 프로젝트에서 직접 성능을 개선해본 경험은 이 분야가 제 강점과 잘 맞는다는 확신을 주었고, 앞으로 더 많은 사람이 신뢰할 수 있는 서비스를 만드는 개발자로 성장하고 싶어 이 직무에 지원합니다."
    },
    {
      question: "성장 과정",
      answer:
        "낯선 나라에서의 유학은 저에게 가장 큰 성장의 무대였습니다. 언어와 문화가 다른 환경에서 스스로 계획을 세우고 문제를 해결하며 책임감과 끈기를 배웠습니다. 데이터 분석 동아리에서 다양한 국적의 팀원들과 협업하며 서로 다른 관점을 조율하는 법을 익혔고, 여러 프로젝트를 이끌면서 '끝까지 완성해내는 힘'이 실력만큼 중요하다는 것을 체감했습니다. 이런 경험들이 지금의 저를 만들었습니다."
    },
    {
      question: "성격의 장단점",
      answer:
        "저의 강점은 문제를 끝까지 파고드는 집요함과, 배운 것을 팀에 공유하려는 태도입니다. 막히는 문제도 원인을 데이터로 좁혀가며 해결해왔습니다. 다만 완성도를 높이려다 속도가 느려지는 점이 아쉬워, 최근에는 우선순위를 먼저 정하고 '충분히 좋은 상태'에서 공유해 피드백을 빠르게 받는 방식으로 이를 보완하고 있습니다."
    },
    {
      question: "입사 후 포부",
      answer:
        "입사 후에는 안정적이고 빠른 백엔드 시스템을 만드는 일에 기여하며, 맡은 서비스의 성능과 신뢰성을 꾸준히 끌어올리고 싶습니다. 나아가 한국어·영어·베트남어를 아우르는 소통 능력과 문화적 이해를 살려, 글로벌 사용자를 향한 서비스 확장에 다리 역할을 하는 개발자로 성장하겠습니다."
    }
  ]
};

async function main() {
  const user = await prisma.user.findFirst({ where: { email: EMAIL } });
  if (!user) throw new Error(`user not found: ${EMAIL}`);
  const uid = user.id;

  await prisma.careerCoverLetterData.upsert({
    where: { studentUserId: uid },
    create: { studentUserId: uid, content: coverContent },
    update: { content: coverContent }
  });

  console.log(`✓ seeded 자기소개서 목업 for ${EMAIL} (userId=${uid})`);
  console.log(`  - cover: ${coverContent.items.length} items (${coverContent.items.map((i) => i.question).join(", ")}), company=${coverContent.company ?? "(없음)"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
