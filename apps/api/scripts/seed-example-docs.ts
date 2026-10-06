// 로컬 테스트용 예제 이력서·자기소개서를 시드 계정에 넣는다.
//
//   npm run db:seed:docs                      # student@test.com
//   npm run db:seed:docs -- --email a@test.com
//   npm run db:seed:docs -- --clean           # 예제를 지우고 빈 문서로
//
// 왜 필요한가: '전체 점검'(규칙 + AI)은 문서에 내용이 있어야 볼 수 있다. 빈 계정으로는
// "아직 작성 안 됨" 말고는 아무것도 안 나와서 기능을 확인할 수 없다.
//
// 그래서 예제를 일부러 **섞어서** 만든다:
//   (가) 규칙이 잡는 것   — 수치 없음 / 기간 없음 / 너무 짧음 / 대화체 종결 / 항목 간 중복
//   (나) AI 가 잡는 것    — 근거 없는 주장 / 역할 불분명 / 희망 직무와 무관 / 문항에 답하지 않음
//   (다) 아무 문제 없는 것 — 여기에 지적이 붙으면 오탐이다(이게 제일 중요한 확인 지점)
// 각 항목 옆 주석에 어디에 해당하는지 적어 두었다.
//
// 저장 위치는 화면과 같다 — Resume.content.renewalResume / renewalCover 한 행.
// 문항·칸 배치는 에디터가 열릴 때 autoPlaceCover / placeAllUnplaced 가 알아서 한다.
//
// 실제 사용자 계정을 덮어쓰지 않도록 @test.com 메일만 받는다(--force 로 해제).
// DATABASE_URL 등은 레포 루트 .env 에 있다(apps/api 에는 .env 가 없다).
// 어느 위치에서 돌려도 되게 cwd 와 루트를 모두 읽는다.
import { config as loadDotenv } from "dotenv";
import path from "node:path";
loadDotenv();
loadDotenv({ path: path.resolve(__dirname, "../../../.env") });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const has = (name: string) => process.argv.includes(`--${name}`);

const now = Date.now();
let seq = 0;
const uid = (p: string) => `seed-${p}-${now}-${seq++}`;

type Item = { id: string; section: string; text: string; startDate?: string; endDate?: string; company?: string };

const resumeItems: Item[] = [
  // (다) 문제 없음 — 학력
  { id: uid("edu"), section: "education", company: "한빛대학교 컴퓨터공학과", text: "컴퓨터공학 학사 졸업 (GPA 3.8/4.5). 운영체제·데이터베이스·분산시스템 전공", startDate: "2018-03", endDate: "2022-02" },

  // (다) 문제 없음 — 한 일·방법·결과가 다 있다. 여기 지적이 붙으면 오탐.
  { id: uid("exp"), section: "experience", company: "페이코어 (PayCore)", text: "결제·정산 API 를 설계하고 운영. 일 평균 300만 건의 트랜잭션을 처리하는 시스템을 구축하고, 모놀리식을 마이크로서비스로 전환해 배포 리드타임을 40% 단축", startDate: "2022-03", endDate: "현재" },

  // (가) 규칙: 수치 없음 + 기간 없음 / (나) AI: 역할 불분명
  { id: uid("exp"), section: "experience", company: "커머스랩 (CommerceLab)", text: "백엔드 개발 업무를 담당하며 팀의 성장에 기여했고 전반적인 효율을 개선함. 다양한 업무를 두루 수행함" },

  // (가) 규칙: 대화체 종결 + 수치 없음
  { id: uid("exp"), section: "experience", company: "한빛카페", text: "손님 응대와 매장 정리를 열심히 했습니다", startDate: "2021-03", endDate: "2021-12" },

  // (다) 문제 없음 — 프로젝트
  { id: uid("prj"), section: "project", company: "재고 조회 화면 개선", text: "창고 담당자 4명의 작업을 따라다니며 조회에 평균 6단계가 걸리는 것을 확인. 자주 쓰는 조건을 기본값으로 바꿔 2단계로 줄였고, 적용 후 한 달간 조회 1건당 소요 시간이 48초에서 19초로 감소", startDate: "2023-01", endDate: "2023-03" },

  // (가) 규칙: 너무 짧음 + 수치 없음
  { id: uid("prj"), section: "project", company: "사내 사이드 프로젝트", text: "웹사이트 기획·개발", startDate: "2023-06", endDate: "2023-08" },

  // (나) AI: 희망 직무(백엔드)와 관련이 약하다
  { id: uid("act"), section: "activity", company: "교내 등산 동아리", text: "매주 등산 코스를 정하고 회원 15명의 참가 신청을 받아 일정을 조율함", startDate: "2019-03", endDate: "2019-12" },

  { id: uid("cert"), section: "certificate", company: "한국산업인력공단", text: "정보처리기사 취득", startDate: "2021-05", endDate: "2021-05" },
  { id: uid("cert"), section: "certificate", company: "Amazon Web Services", text: "AWS Certified Solutions Architect – Associate 취득", startDate: "2022-09", endDate: "2022-09" },
  { id: uid("lang"), section: "language", text: "한국어 — 모국어 / 영어 — 업무상 문서 작성 및 회의 가능 (TOEIC 905)" },
  { id: uid("skill"), section: "skill", text: "Java, Spring Boot, Kotlin, PostgreSQL, Redis, Kafka, Docker, Kubernetes, AWS" }
];

const resumeDoc = {
  targetRole: "백엔드 엔지니어",
  summary:
    "결제·정산 도메인에서 4년간 백엔드를 맡아 왔습니다. 일 300만 건 규모의 트랜잭션을 다루며 장애 없이 배포하는 구조를 만드는 데 관심이 많고, 쓰는 사람의 동선을 먼저 보고 문제를 찾는 방식으로 일합니다.",
  items: resumeItems,
  links: [
    { label: "GitHub", url: "github.com/example-dev" },
    { label: "기술 블로그", url: "example-dev.log.dev" }
  ],
  showPhoto: false,
  createdAt: now,
  updatedAt: now
};

// 자소서 — item.question 이 문항 이름과 같으면 에디터가 그 문항에 자동으로 넣는다.
const coverItems = [
  // (나) AI: 문항에 답하지 않음 — 지원 동기를 묻는데 성실함 이야기만
  {
    id: uid("cov"),
    question: "지원 동기",
    text:
      "저는 어려서부터 성실함을 가장 중요하게 생각해 왔습니다. 고등학생 때는 3년간 지각을 한 번도 하지 않았고, 대학에서도 모든 수업에 빠지지 않고 출석했습니다. 앞으로도 성실하게 살아가겠습니다. 이런 성격은 어떤 일을 맡아도 끝까지 해내는 힘이 되어 주었다고 생각합니다."
  },
  // (다) 문제 없음 — 사례·역할·결과·배운 점·직무 연결이 다 있다. 지적이 붙으면 오탐.
  {
    id: uid("cov"),
    question: "나의 강점과 준비된 경험",
    text:
      "결제 정산 배치가 매달 마감일에 지연되는 문제를 맡았습니다. 로그를 쌓아 보니 전체 처리 시간의 70%가 한 테이블의 중복 조회에서 나오고 있었습니다. 조회 결과를 캐시에 두고 배치를 단계별로 나누는 안을 만들어 팀 리뷰에서 합의했고, 적용 후 마감 소요 시간이 4시간 20분에서 1시간 10분으로 줄었습니다. 이 과정에서 추측으로 고치기보다 먼저 재어 보는 것이 빠르다는 것을 배웠고, 백엔드 엔지니어로 지원하며 같은 방식으로 접근하려 합니다."
  },
  // (가) 규칙: 분량 부족 + 상투어
  {
    id: uid("cov"),
    question: "성장 과정",
    text: "저는 화목한 가정에서 자라며 성실함과 책임감을 배웠습니다. 맡은 일은 끝까지 해내는 사람이 되고자 노력해 왔습니다."
  },
  // (나) AI: 근거 없는 주장 — 사례 없이 성격만
  {
    id: uid("cov"),
    question: "성격의 장단점",
    text:
      "저의 장점은 책임감이 강하고 꼼꼼하다는 점입니다. 어떤 일이든 맡으면 끝까지 해내려 하고, 작은 부분도 놓치지 않으려 합니다. 단점은 완벽을 추구하다 보니 가끔 속도가 느려진다는 점인데, 이를 보완하기 위해 항상 노력하고 있습니다. 앞으로도 장점은 살리고 단점은 고쳐 나가겠습니다."
  }
  // '입사 후 포부'는 일부러 비워 둔다 — 규칙의 '아직 작성 안 됨'을 확인할 수 있게.
];

const coverDoc = {
  items: coverItems,
  questions: ["지원 동기", "나의 강점과 준비된 경험", "성장 과정", "성격의 장단점", "입사 후 포부"],
  showPhoto: false,
  companyName: "한빛페이",
  keywords: ["결제 시스템", "장애 대응"], // 본문에 없는 소재 → 규칙의 '소재 누락' 확인용
  createdAt: now,
  updatedAt: now
};

// 모의면접 답변 기록 — '내 면접 약점' 화면을 보려면 채점된 답변이 있어야 한다.
// 영역을 일부러 섞는다: 잘한 영역 / 약한 영역 / 아직 안 해 본 영역이 모두 보이게.
const mockInterview = {
  answers: [
    { question: "1분 자기소개를 해주세요.", category: "intro", answer: "결제·정산 백엔드를 4년간 맡아 왔습니다. 일 300만 건 트랜잭션을 다루며 장애 없이 배포하는 구조를 만드는 데 집중해 왔습니다.", score: 84,
      feedback: { score: 84, strengths: ["맡은 도메인이 분명하다"], improvements: [], sampleAnswer: "" }, updatedAt: now - 86400000 },
    { question: "맡았던 가장 어려운 기술적 문제는 무엇이었나요?", category: "competency", answer: "팀에서 결제 실패율을 낮추는 작업을 했습니다. 여러 가지를 개선했습니다.", score: 55,
      feedback: { score: 55, strengths: [], improvements: ["팀이 한 일인지 본인이 한 일인지 알 수 없어, 읽는 사람이 기여를 가늠할 수 없습니다"], sampleAnswer: "" }, updatedAt: now - 72000000 },
    { question: "기술 선택의 근거를 설명해 주세요.", category: "competency", answer: "요즘 많이 쓰는 기술이라 골랐습니다.", score: 61,
      feedback: { score: 61, strengths: [], improvements: ["대안을 무엇과 비교했는지 한 줄 넣어 주세요"], sampleAnswer: "" }, updatedAt: now - 60000000 },
    { question: "실패했던 경험과 그로부터 배운 점을 말씀해 주세요.", category: "experience", answer: "배포를 잘못해서 장애가 났습니다. 다음부터는 조심하고 있습니다.", score: 42,
      feedback: { score: 42, strengths: [], improvements: ["그래서 무엇을 바꿨는지(절차·도구)를 한 줄 넣어 주세요"], sampleAnswer: "" }, updatedAt: now - 50000000 }
  ],
  updatedAt: now
};

const basicInfo = {
  realName: "이준호",
  email: "student@test.com",
  phone: "010-2345-6789",
  address: "서울특별시 강남구 테헤란로 123, 8층",
  photoUrl: ""
};

async function main() {
  const email = arg("email") ?? "student@test.com";
  const clean = has("clean");
  if (!email.endsWith("@test.com") && !has("force")) {
    console.error(`실제 계정일 수 있어 멈춥니다: ${email}\n@test.com 계정만 받습니다(정말 덮어쓰려면 --force).`);
    process.exit(1);
  }

  const user = await prisma.user.findFirst({ where: { email }, select: { id: true, email: true } });
  if (!user) {
    console.error(`${email} 계정이 없습니다. 먼저 npm run db:seed 를 돌려 주세요.`);
    process.exit(1);
  }

  // 화면과 같은 규칙으로 행을 고른다 — renewal* 키를 가진 최신 행.
  const rows = await prisma.resume.findMany({
    where: { userId: user.id },
    select: { id: true, title: true, content: true, updatedAt: true },
    orderBy: { updatedAt: "desc" }
  });
  const target = rows.find((r) => {
    const c = r.content as Record<string, unknown> | null;
    return c != null && Object.keys(c).some((k) => k.startsWith("renewal"));
  });

  // 이력서·자소서 말고 다른 renewal* 값(관심 직무·북마크 등)은 건드리지 않는다.
  const base = (target?.content as Record<string, unknown> | null) ?? {};
  const content: Record<string, unknown> = { ...base };
  if (clean) {
    delete content.renewalResume;
    delete content.renewalCover;
    delete content.coverLetterItems;
    delete content.renewalMockInterview;
  } else {
    content.renewalResume = resumeDoc;
    content.renewalCover = coverDoc;
    // 레거시 화면이 읽는 미러도 같이 맞춘다(화면 저장 로직과 동일).
    content.coverLetterItems = coverItems.map((c) => ({ id: c.id, prompt: c.question, answer: c.text }));
    content.renewalBasicInfo = (base.renewalBasicInfo as unknown) ?? basicInfo;
    content.renewalMockInterview = mockInterview;
    content.desiredJobRole = resumeDoc.targetRole;
  }

  if (target) {
    await prisma.resume.update({ where: { id: target.id }, data: { content: content as never } });
    console.log(`${clean ? "예제를 지웠습니다" : "예제를 넣었습니다"} — ${email} / Resume ${target.id}`);
  } else {
    if (clean) {
      console.log(`${email} 에 리뉴얼 문서가 없습니다. 지울 것이 없습니다.`);
      return;
    }
    const created = await prisma.resume.create({
      data: { userId: user.id, title: "내 이력서", content: content as never, isPrimary: rows.length === 0 }
    });
    console.log(`예제를 넣었습니다(새 행) — ${email} / Resume ${created.id}`);
  }

  if (!clean) {
    console.log(`  이력서 ${resumeItems.length}개 항목 · 자소서 ${coverItems.length}개 답변(문항 5개 중 1개는 일부러 비움)`);
    console.log(`  모의면접 답변 ${mockInterview.answers.length}개(잘한 영역·약한 영역·안 해 본 영역이 섞여 있음)`);
    console.log("  /talent/career/resume · /talent/career/cover 에서 '전체 점검'을 확인하세요.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
