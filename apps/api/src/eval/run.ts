/* eslint-disable no-console */
// LLM 품질 평가 하니스 러너.
//
// 사용:
//   OPENAI_API_KEY=sk-... npx tsx src/eval/run.ts            # 라이브 실행(생성 + 규칙검사 + LLM judge)
//   npx tsx src/eval/run.ts --dry                            # 프롬프트만 조립해 출력(모델 호출 없음)
//   npx tsx src/eval/run.ts --selftest                       # 규칙검사 로직 자체 점검(모델 불필요)
//   npx tsx src/eval/run.ts --feature cover_letter           # 특정 기능만
//   npx tsx src/eval/run.ts --no-judge                       # 규칙검사만(judge 생략, 비용 절감)
//
// 환경변수:
//   EVAL_GENERATOR_MODEL (기본 = OPENAI_TRANSLATION_MODEL = gpt-4o-mini, 즉 프로덕션과 동일)
//   EVAL_JUDGE_MODEL     (기본 gpt-4o)
//
// 결과: eval-report/report-<timestamp>.json + 콘솔 요약 표. promptVersion 별로 비교하려면
// 프롬프트를 바꾼 뒤 다시 돌려 avgCheckScore·avgJudgeOverall 변화를 본다.
import { promises as fs } from "fs";
import path from "path";
import OpenAI from "openai";
import { FEATURES } from "./features";
import { stripCliches } from "../llm/prompts";
import { runChecks, checkScore } from "./checks";
import { judgeCase } from "./judge";
import { GOLDEN } from "./golden";
import type { CaseResult, FeatureId, GoldenCase, Report } from "./types";

const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const opt = (f: string) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};

const DRY = has("--dry");
const SELFTEST = has("--selftest");
const NO_JUDGE = has("--no-judge");
const FEATURE = opt("--feature") as FeatureId | undefined;
const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL ?? "gpt-4o";

function selectCases(): GoldenCase[] {
  return FEATURE ? GOLDEN.filter((c) => c.feature === FEATURE) : GOLDEN;
}

// ── 셀프테스트: 검사 로직이 좋은/나쁜 샘플을 구분하는지 확인(모델 불필요) ──
function selftest(): void {
  console.log("● selftest — 규칙 검사 로직 점검\n");
  const good: GoldenCase = GOLDEN.find((c) => c.id === "cover_motive_basic")!;
  const goodOut =
    "저는 백엔드 개발자로 성장하고 싶어 지원하게 되었습니다. 교내 학사관리 웹서비스 개선 프로젝트에서 회원 가입과 출석 기능의 백엔드를 맡아 Django REST API를 설계하고 PostgreSQL 스키마를 구성했습니다. 팀원 네 명과 역할을 나눠 협업하며 사용자가 겪던 불편을 직접 개선해 본 경험은, 실제 서비스를 안정적으로 운영하는 일에 대한 관심으로 이어졌습니다. 입사 후에는 견고한 API와 데이터 설계로 신뢰받는 서비스를 만드는 개발자가 되고 싶습니다.";
  const badOut =
    "- 저는 혁신적이고 탁월한 인재입니다.\n- 매출을 350% 성장시킨 압도적인 경험이 있습니다.\nI am the best candidate ever.";
  const g = runChecks(good, goodOut);
  const b = runChecks(bad(good), badOut);
  console.log(`  좋은 샘플 checkScore = ${checkScore(g).toFixed(2)} (기대: 높음)`);
  for (const c of g) if (!c.pass) console.log(`    - fail: ${c.name} ${c.detail ?? ""}`);
  console.log(`  나쁜 샘플 checkScore = ${checkScore(b).toFixed(2)} (기대: 낮음)`);
  for (const c of b) if (!c.pass) console.log(`    - fail: ${c.name} ${c.detail ?? ""}`);
  const okDiff = checkScore(g) > checkScore(b) + 0.3;
  console.log(`\n  판정: ${okDiff ? "OK (구분됨)" : "WARN (구분 약함)"}`);
}
function bad(c: GoldenCase): GoldenCase {
  return c;
}

// ── dry: 프롬프트 조립만 출력 ──
function dry(): void {
  console.log("● dry-run — 조립된 프롬프트 미리보기(모델 호출 없음)\n");
  for (const c of selectCases()) {
    const spec = FEATURES[c.feature];
    const { system, user } = spec.buildMessages(c.input);
    console.log("─".repeat(70));
    console.log(`[${c.id}] ${spec.label}  (model=${spec.model()})`);
    if (c.note) console.log(`note: ${c.note}`);
    console.log("\n--- SYSTEM ---\n" + system);
    console.log("\n--- USER ---\n" + user + "\n");
  }
  console.log("─".repeat(70));
  console.log(`총 ${selectCases().length} 케이스.`);
}

async function live(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY 가 없습니다. --dry 로 프롬프트만 보거나 키를 설정해 실행하세요.");
    process.exit(2);
  }
  const openai = new OpenAI({ apiKey });
  const cases = selectCases();
  const results: CaseResult[] = [];
  const generatorModel = FEATURES[cases[0]?.feature ?? "cover_letter"].model();
  console.log(`● 라이브 평가 — 생성 모델=${generatorModel}, judge=${NO_JUDGE ? "off" : JUDGE_MODEL}, ${cases.length}건\n`);

  for (const c of cases) {
    const spec = FEATURES[c.feature];
    const { system, user } = spec.buildMessages(c.input);
    const started = Date.now();
    let output = "";
    let error: string | undefined;
    try {
      const completion = await openai.chat.completions.create({
        model: spec.model(),
        temperature: spec.temperature,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      });
      const rawText = completion.choices?.[0]?.message?.content ?? "{}";
      let json: Record<string, unknown> = {};
      try {
        json = JSON.parse(rawText);
      } catch {
        error = "invalid_json";
      }
      // 프로덕션 파이프라인과 동일하게 상투어 정리를 적용해 '실제 출력'을 평가한다.
      output = stripCliches(spec.extract(json).trim());
      if (!output && !error) error = "empty_output";
    } catch (e) {
      error = (e as Error).message?.slice(0, 200) ?? "call_failed";
    }

    const checks = output ? runChecks(c, output) : [];
    const cScore = output ? checkScore(checks) : 0;
    let judge;
    if (output && !NO_JUDGE) {
      try {
        judge = await judgeCase(openai, c, output, JUDGE_MODEL);
      } catch (e) {
        error = (error ? error + "; " : "") + "judge_failed:" + ((e as Error).message?.slice(0, 80) ?? "");
      }
    }
    const r: CaseResult = { id: c.id, feature: c.feature, output, error, checks, checkScore: cScore, judge, ms: Date.now() - started };
    results.push(r);
    const j = judge ? ` judge=${judge.overall}/5` : "";
    console.log(`  [${c.id}] check=${(cScore * 100).toFixed(0)}%${j}${error ? ` ⚠ ${error}` : ""} (${r.ms}ms)`);
    for (const ch of checks) if (!ch.pass) console.log(`      ✗ ${ch.name} ${ch.detail ?? ""}`);
  }

  const report = summarize(results, generatorModel);
  printSummary(report);
  await writeReport(report);
}

function summarize(cases: CaseResult[], generatorModel: string): Report {
  const errored = cases.filter((c) => c.error).length;
  const avgCheck = cases.length ? cases.reduce((s, c) => s + c.checkScore, 0) / cases.length : 0;
  const judged = cases.filter((c) => c.judge);
  const avgJudge = judged.length ? judged.reduce((s, c) => s + (c.judge?.overall ?? 0), 0) / judged.length : null;
  const byFeature: Report["summary"]["byFeature"] = {};
  for (const c of cases) {
    const f = (byFeature[c.feature] ??= { count: 0, avgCheckScore: 0, avgJudgeOverall: null });
    f.count += 1;
  }
  for (const key of Object.keys(byFeature)) {
    const fc = cases.filter((c) => c.feature === key);
    byFeature[key].avgCheckScore = fc.reduce((s, c) => s + c.checkScore, 0) / fc.length;
    const fj = fc.filter((c) => c.judge);
    byFeature[key].avgJudgeOverall = fj.length ? fj.reduce((s, c) => s + (c.judge?.overall ?? 0), 0) / fj.length : null;
  }
  return {
    startedAt: new Date().toISOString(),
    generatorModel,
    judgeModel: NO_JUDGE ? "(off)" : JUDGE_MODEL,
    cases,
    summary: { total: cases.length, errored, avgCheckScore: avgCheck, avgJudgeOverall: avgJudge, byFeature }
  };
}

function printSummary(r: Report): void {
  console.log("\n" + "═".repeat(70));
  console.log(`요약 — 생성모델 ${r.generatorModel} · judge ${r.judgeModel}`);
  console.log(`  규칙검사 평균: ${(r.summary.avgCheckScore * 100).toFixed(1)}%`);
  console.log(`  judge 종합 평균: ${r.summary.avgJudgeOverall == null ? "-" : r.summary.avgJudgeOverall.toFixed(2) + "/5"}`);
  console.log(`  오류: ${r.summary.errored}/${r.summary.total}`);
  console.log("  기능별:");
  for (const [f, v] of Object.entries(r.summary.byFeature)) {
    console.log(`    - ${f}: check ${(v.avgCheckScore * 100).toFixed(0)}% · judge ${v.avgJudgeOverall == null ? "-" : v.avgJudgeOverall.toFixed(2)}`);
  }
  console.log("═".repeat(70));
}

async function writeReport(r: Report): Promise<void> {
  const dir = path.join(process.cwd(), "eval-report");
  await fs.mkdir(dir, { recursive: true });
  const ts = r.startedAt.replace(/[:.]/g, "-");
  const file = path.join(dir, `report-${ts}.json`);
  await fs.writeFile(file, JSON.stringify(r, null, 2), "utf8");
  console.log(`\n리포트 저장: ${path.relative(process.cwd(), file)}`);
}

async function main(): Promise<void> {
  if (SELFTEST) return selftest();
  if (DRY) return dry();
  await live();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
