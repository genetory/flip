// UX Phase 7 — 사용자 노출 문구 감사(읽기 전용). 코드를 자동으로 변경하지 않는다.
// 금지·원시 용어가 사용자 노출 문자열에 남아 있는지 검색해 리포트한다.
// 실행: node apps/platform-web/scripts/copy-audit.mjs
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOTS = ["app/career-launch", "components/launch", "lib/launch"];
// 사용자에게 노출되면 안 되는 표현(내부 코드·주석 제외 근사). 정규식.
const BANNED = [
  { term: "챗봇", why: "코치 언어로", to: "AI 커리어 코치" },
  { term: "AI 채팅", why: "코치 언어로", to: "1:1 커리어 상담" },
  { term: "AI 분석", why: "코치 언어로", to: "코치의 판단" },
  { term: "자가진단", why: "봇·검사 프레이밍", to: "첫 커리어 상담" },
  { term: "퀘스트", why: "게임 톤", to: "이번 주 미션" },
  { term: "재생성", why: "시스템 톤", to: "다른 방향으로 제안받기" },
  { term: "성공했습니다", why: "행동+결과로", to: "…했어요" },
  { term: "저장되었습니다", why: "행동+결과로", to: "…이 저장됐어요" },
  { term: "처리 중입니다", why: "상황별 로딩으로", to: "…하고 있어요" },
  { term: "다시 시도해주세요", why: "저장여부 안내 포함", to: "…다시 …" },
  { term: "Unknown Error", why: "코드값 노출", to: "요청을 처리하지 못했어요" },
  { term: ">\\s*(Failed|Loading|Error|Retry)\\s*<", why: "영어 상태코드 노출", to: "한국어 상태 문구" },
  { term: ">\\s*(at_risk|not_started|in_progress)\\s*<", why: "내부 코드 노출", to: "상태 라벨 매핑" }
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if ([".tsx", ".ts"].includes(extname(p))) out.push(p);
  }
  return out;
}

let total = 0;
const findings = [];
for (const root of ROOTS) {
  let files = [];
  try {
    files = walk(root);
  } catch {
    continue;
  }
  for (const f of files) {
    const lines = readFileSync(f, "utf8").split("\n");
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      // 주석 라인 근사 제외.
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
      for (const b of BANNED) {
        const re = new RegExp(b.term);
        if (re.test(line)) {
          findings.push({ file: f, line: i + 1, term: b.term, why: b.why, to: b.to });
          total++;
        }
      }
    });
  }
}

if (findings.length === 0) {
  console.log("✅ 사용자 노출 금지 용어 없음(copy-audit 통과).");
} else {
  console.log(`⚠️  사용자 노출 금지 용어 ${findings.length}건:\n`);
  for (const f of findings) console.log(`  ${f.file}:${f.line}  [${f.term}] → ${f.to}  (${f.why})`);
  console.log("\n※ 이 스크립트는 코드를 변경하지 않습니다. 위치를 확인해 수동으로 문구를 정리하세요.");
}
process.exit(0);
