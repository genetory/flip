// 문서 '전체 점검'(AI) 평가 — 생성 품질이 아니라 **오탐/누락**을 재는 하니스.
//
// 왜 run.ts(judge) 와 따로 있나: 점검 기능의 성패는 글이 얼마나 좋아지는지가 아니라
// "잡아야 할 것을 잡고, 멀쩡한 것은 건드리지 않는지"다. 이건 judge 점수가 아니라
// 고정된 기대값으로 세는 게 맞다(같은 입력 N 회 → 몇 번 맞췄나).
//
// 프롬프트는 src/llm/review.ts 단일 소스를 실제 엔드포인트와 똑같이 쓴다(드리프트 없음).
// 골든셋은 전부 합성(가상 인물)이다 — 공개 레포 규칙상 실제 사용자 데이터를 넣지 않는다.
//
//   npm run eval:review                      # 기본 모델(= 프로덕션 docReviewModel)
//   REPEAT=6 npm run eval:review             # 반복 늘리기
//   MODEL=gpt-4o-mini npm run eval:review    # 모델 바꿔 비교
//   npm run eval:review -- --dry             # 프롬프트만 출력(모델 호출 없음, 비용 0)
import { config as loadDotenv } from "dotenv";
loadDotenv();
loadDotenv({ path: "../../.env" });
import OpenAI from "openai";
import { generateJson } from "../llm/generate";
import { REVIEW_FINDINGS_SCHEMA, buildCoverReviewPrompt, buildResumeReviewPrompt, normalizeReviewFindings } from "../llm/review";

const REPEAT = Number(process.env.REPEAT ?? 4);
// 프로덕션 기본값(index.ts docReviewModel)과 같게 둔다 — 다른 모델 변수를 섞지 않는다.
const MODEL = process.env.MODEL ?? process.env.DOC_REVIEW_MODEL ?? "gpt-4o";
const DRY = process.argv.includes("--dry");

// 규칙 점검(platform-web/lib/talent/*-scan.ts)이 이미 보여 주는 지적을 AI 가 또 했는지 — 문구로 본다.
const DUP_WORDS = /숫자|수치|정량|짧|길이|글자 ?수|기간|날짜|말투|문체|어미|했습니다|중복|겹치|상투/;

const GOOD_EXPERIENCE = {
  id: "ok_ops",
  section: "경력",
  company: "물류 스타트업 운영팀",
  period: "2024-07 ~ 2025-06",
  text: "주문 접수 흐름을 재정리해 처리 시간을 건당 12분에서 8분으로 줄임. 담당자 5명과 주간 점검 회의를 운영해 월 120건이던 입력 오류를 12건으로 낮춤"
};
const GOOD_ANSWER = {
  id: "ok_answer",
  prompt: "가장 큰 성과를 낸 경험을 서술해 주세요.",
  limit: 500,
  text:
    "물류 스타트업 운영팀에서 주문 접수 흐름을 재정리했습니다. 담당자 다섯 분을 따로 인터뷰해 같은 정보를 세 곳에 중복 입력하고 있다는 것을 찾았고, " +
    "입력 지점을 한 곳으로 모으는 안을 만들어 주간 회의에서 합의했습니다. 그 결과 처리 시간이 건당 12분에서 8분으로 줄고 월 120건이던 입력 오류가 12건으로 내려갔습니다. " +
    "이 경험에서 문제를 지적하기보다 쓰는 사람의 동선을 먼저 보는 것이 빠르다는 것을 배웠고, 운영 담당자로 지원하며 같은 방식으로 접근하려 합니다."
};

type Case = {
  name: string;
  kind: "resume" | "cover";
  /** 매번 잡아야 하는 블록 id. */
  mustHit: string[];
  /** 한 번도 지적되면 안 되는 블록 id — 오탐은 누락보다 나쁘다. */
  neverHit: string[];
  build: () => { system: string; user: string };
  ids: string[];
};

const CASES: Case[] = [
  (() => {
    const items = [
      // 규칙이 이미 잡는 항목(수치 없음·대화체) — AI 가 같은 말을 하면 안 된다.
      { id: "rule_only", section: "경력", company: "카페 알바", period: "2023-03 ~ 2023-12", text: "손님 응대를 열심히 했습니다" },
      // 근거 없는 주장 + 역할 불분명 — AI 가 잡아야 하는 것.
      { id: "vague", section: "프로젝트", company: "교내 팀 프로젝트", period: "2024-03 ~ 2024-06", text: "팀의 성장에 기여했고 전반적인 효율을 30% 개선함. 다양한 업무를 두루 수행함" },
      GOOD_EXPERIENCE
    ];
    return {
      name: "이력서 — 문제 섞인 문서",
      kind: "resume" as const,
      mustHit: ["vague"],
      neverHit: [GOOD_EXPERIENCE.id],
      ids: items.map((i) => i.id),
      build: () => buildResumeReviewPrompt({ targetRole: "물류/운영 담당자", items })
    };
  })(),
  (() => {
    const items = [
      GOOD_EXPERIENCE,
      {
        id: "ok_project",
        section: "프로젝트",
        company: "재고 조회 화면 개선",
        period: "2025-01 ~ 2025-03",
        text: "창고 담당자 4명의 작업을 따라다니며 조회에 평균 6단계가 걸리는 것을 확인함. 자주 쓰는 조건을 기본값으로 바꿔 2단계로 줄이고, 적용 후 한 달간 조회 1건당 소요 시간이 48초에서 19초로 감소"
      }
    ];
    return {
      // 가장 중요한 케이스 — 고칠 게 없을 때 억지로 찾아내는 모델이 여기서 걸린다.
      name: "이력서 — 전부 잘 쓴 문서(0건이어야 함)",
      kind: "resume" as const,
      mustHit: [],
      neverHit: items.map((i) => i.id),
      ids: items.map((i) => i.id),
      build: () => buildResumeReviewPrompt({ targetRole: "물류/운영 담당자", items })
    };
  })(),
  (() => {
    const questions = [
      // 문항에 답하지 않음 — AI 가 잡아야 하는 것.
      {
        id: "off_ask",
        prompt: "우리 회사에 지원한 이유를 서술해 주세요.",
        limit: 500,
        text:
          "저는 어려서부터 성실함을 가장 중요하게 생각해 왔습니다. 고등학생 때는 3년간 지각을 한 번도 하지 않았고, 대학에서도 모든 수업에 빠지지 않고 출석했습니다. " +
          "앞으로도 성실하게 살아가겠습니다. 저의 이런 성격은 어떤 일을 맡아도 끝까지 해내는 힘이 되어 주었다고 생각합니다."
      },
      GOOD_ANSWER
    ];
    return {
      name: "자소서 — 문제 섞인 문서",
      kind: "cover" as const,
      mustHit: ["off_ask"],
      neverHit: [GOOD_ANSWER.id],
      ids: questions.map((q) => q.id),
      build: () => buildCoverReviewPrompt({ company: "한국물류", questions })
    };
  })(),
  (() => {
    const questions = [GOOD_ANSWER];
    return {
      name: "자소서 — 전부 잘 쓴 문서(0건이어야 함)",
      kind: "cover" as const,
      mustHit: [],
      neverHit: [GOOD_ANSWER.id],
      ids: questions.map((q) => q.id),
      build: () => buildCoverReviewPrompt({ company: "한국물류", questions })
    };
  })()
];

async function main() {
  if (DRY) {
    for (const c of CASES) {
      const { system, user } = c.build();
      console.log(`\n${"=".repeat(70)}\n${c.name}\n${"=".repeat(70)}\n[system]\n${system}\n\n[user]\n${user}`);
    }
    return;
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY 가 없습니다. --dry 는 키 없이 돌 수 있습니다.");
    process.exit(1);
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log(`모델 ${MODEL} · 케이스당 ${REPEAT}회`);
  let failed = 0;

  for (const c of CASES) {
    const { system, user } = c.build();
    const allowed = new Set(c.ids);
    const runsWith: Record<string, number> = {};
    const notes: string[] = [];
    let total = 0;
    let dup = 0;
    let unknownId = 0;
    let callFailed = 0;

    for (let i = 0; i < REPEAT; i++) {
      const r = await generateJson<{ findings?: unknown }>({
        openai,
        model: MODEL,
        temperature: 0.2,
        system,
        user,
        schema: REVIEW_FINDINGS_SCHEMA,
        schemaName: `review_${c.kind}`
      });
      // 호출 자체가 실패한 것과 '지적 0건'은 전혀 다르다. 구분하지 않으면 접근 권한이 없는
      // 모델이 '전부 잘 쓴 문서' 케이스를 통과해 버린다(실제로 한 번 그렇게 속았다).
      if (!r.data) {
        callFailed += 1;
        notes.push(`[호출 실패] via=${r.via} ${r.error ?? ""}`);
        continue;
      }
      // 정규화 전/후를 비교해 '모르는 id' 가 얼마나 오는지도 센다(화면이 엉뚱한 곳을 표시할 위험).
      const rawCount = Array.isArray(r.data.findings) ? (r.data.findings as unknown[]).length : 0;
      const findings = normalizeReviewFindings(r.data.findings, allowed, 8);
      unknownId += Math.max(0, rawCount - findings.length);
      const seen = new Set<string>();
      for (const f of findings) {
        total += 1;
        if (!seen.has(f.id)) {
          seen.add(f.id);
          runsWith[f.id] = (runsWith[f.id] ?? 0) + 1;
        }
        if (DUP_WORDS.test(f.issue)) {
          dup += 1;
          notes.push(`[규칙중복] ${f.id}: ${f.issue}`);
        } else if (notes.length < 4) notes.push(`${f.id}: ${f.issue}`);
      }
    }

    const missed = c.mustHit.filter((id) => (runsWith[id] ?? 0) < REPEAT);
    const falsePos = c.neverHit.filter((id) => (runsWith[id] ?? 0) > 0);
    const ok = missed.length === 0 && falsePos.length === 0 && dup === 0 && callFailed === 0;
    if (!ok) failed += 1;
    console.log(`\n${ok ? "PASS" : "FAIL"}  ${c.name}`);
    console.log(`  지적 ${total}건 · 규칙중복 ${dup} · 모르는 id ${unknownId}${callFailed ? ` · 호출 실패 ${callFailed}/${REPEAT}` : ""}`);
    console.log(`  적중: ${Object.entries(runsWith).map(([k, v]) => `${k}=${v}/${REPEAT}`).join(" ") || "(0건)"}`);
    if (missed.length) console.log(`  누락: ${missed.join(", ")} (매 회 잡아야 함)`);
    if (falsePos.length) console.log(`  오탐: ${falsePos.join(", ")} ← 멀쩡한 글을 지적했다`);
    for (const n of notes) console.log("   ·", n);
  }

  console.log(`\n${failed === 0 ? "전부 통과" : `${failed}개 케이스 실패`} (${CASES.length}개 중)`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
