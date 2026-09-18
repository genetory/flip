/* eslint-disable no-console */
// 커리어런치 코칭 대화 품질 eval 러너.
//
// 사용:
//   OPENAI_API_KEY=... npx tsx src/eval/career/run.ts                       # 생성 gpt-4o(현행) vs judge gpt-4o
//   OPENAI_API_KEY=... ANTHROPIC_API_KEY=... CAREER_COACH_MODEL=claude-sonnet-5 npx tsx src/eval/career/run.ts --repeat 3
//   npx tsx src/eval/career/run.ts --dry                                    # 조립된 프롬프트만 출력
//
// 환경변수:
//   CAREER_COACH_MODEL (기본 = OPENAI_MATCHING_MODEL = gpt-4o, 즉 프로덕션 현행). EVAL_GENERATOR_MODEL 은 전역 강제.
//   EVAL_JUDGE_MODEL   (기본 gpt-4o)
import { promises as fs } from "fs";
import path from "path";
import OpenAI from "openai";
import { generateJson } from "../../llm/generate";
import { CAREER_GOLDEN } from "./golden";
import { judgeCoachTurn } from "./judge";
import type { CoachCaseResult } from "./types";

const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const DRY = has("--dry");
const NO_JUDGE = has("--no-judge");
const FEATURE = opt("--feature");
const REPEAT = Math.max(1, Number(opt("--repeat") ?? "1") || 1);
const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL ?? "gpt-4o";
const GEN_MODEL = process.env.EVAL_GENERATOR_MODEL ?? process.env.CAREER_COACH_MODEL ?? process.env.OPENAI_MATCHING_MODEL ?? "gpt-4o";

const cases = FEATURE ? CAREER_GOLDEN.filter((c) => c.feature === FEATURE) : CAREER_GOLDEN;

async function dry(): Promise<void> {
  for (const c of cases) {
    console.log("─".repeat(70));
    console.log(`[${c.id}] ${c.feature}${c.note ? " — " + c.note : ""}`);
    console.log("\n--- SYSTEM ---\n" + c.system);
    console.log("\n--- USER ---\n" + c.user + "\n");
  }
  console.log(`총 ${cases.length} 케이스.`);
}

async function live(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { console.error("OPENAI_API_KEY 필요(judge 용). --dry 로 프롬프트만 볼 수 있음."); process.exit(2); }
  const openai = new OpenAI({ apiKey });
  console.log(`● 커리어런치 코칭 eval — 생성=${GEN_MODEL}, judge=${NO_JUDGE ? "off" : JUDGE_MODEL}, ${cases.length}건 × repeat ${REPEAT}\n`);
  const results: CoachCaseResult[] = [];
  const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

  for (const c of cases) {
    const overalls: number[] = [];
    let last!: CoachCaseResult;
    for (let rep = 0; rep < REPEAT; rep++) {
      const started = Date.now();
      let reply = ""; let error: string | undefined;
      try {
        const { data, error: genErr } = await generateJson<Record<string, unknown>>({
          openai, model: GEN_MODEL, temperature: 0.6, system: c.system, user: c.user, schema: c.schema, schemaName: c.schemaName, strict: c.strict ?? false
        });
        if (genErr) error = genErr;
        reply = c.extractReply(data ?? {}).trim();
        if (!reply && !error) error = "empty_reply";
      } catch (e) { error = (e as Error).message?.slice(0, 200) ?? "call_failed"; }

      let judge;
      if (reply && !NO_JUDGE) {
        try { judge = await judgeCoachTurn(openai, c.judgeContext, reply, JUDGE_MODEL); }
        catch (e) { error = (error ? error + "; " : "") + "judge_failed:" + ((e as Error).message?.slice(0, 80) ?? ""); }
      }
      last = { id: c.id, feature: c.feature, reply, error, judgeOveralls: [], judge, ms: Date.now() - started };
      if (judge) overalls.push(judge.overall);
      if (REPEAT > 1) console.log(`  [${c.id}] #${rep + 1} ${judge ? "overall=" + judge.overall : ""}${error ? " ⚠ " + error : ""}`);
    }
    last.judgeOveralls = overalls;
    results.push(last);
    if (REPEAT > 1) console.log(`  ▸ [${c.id}] (${c.feature}) overall평균=${avg(overalls).toFixed(2)}/5 (${overalls.join(",")})`);
    else console.log(`  [${c.id}] (${c.feature}) ${last.judge ? "overall=" + last.judge.overall + " (t" + last.judge.tone + "/c" + last.judge.coaching + "/g" + last.judge.groundedness + "/p" + last.judge.progress + ")" : ""}${last.error ? " ⚠ " + last.error : ""}`);
  }

  const overallAvg = avg(results.flatMap((r) => r.judgeOveralls.length ? r.judgeOveralls : r.judge ? [r.judge.overall] : []));
  console.log("\n" + "═".repeat(70));
  console.log(`요약 — 생성 ${GEN_MODEL} · judge ${NO_JUDGE ? "(off)" : JUDGE_MODEL}`);
  console.log(`  코칭 종합 평균: ${overallAvg.toFixed(2)}/5`);
  const byF: Record<string, number[]> = {};
  for (const r of results) (byF[r.feature] ??= []).push(...(r.judgeOveralls.length ? r.judgeOveralls : r.judge ? [r.judge.overall] : []));
  for (const [f, arr] of Object.entries(byF)) console.log(`    - ${f}: ${avg(arr).toFixed(2)}`);
  console.log("═".repeat(70));

  const dir = path.join(process.cwd(), "eval-report");
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `career-report-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await fs.writeFile(file, JSON.stringify({ genModel: GEN_MODEL, judgeModel: JUDGE_MODEL, results }, null, 2), "utf8");
  console.log(`\n리포트 저장: ${path.relative(process.cwd(), file)}`);
}

(DRY ? dry() : live()).catch((e) => { console.error(e); process.exit(1); });
