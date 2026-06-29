#!/usr/bin/env node
// resume-maker i18n 가드 — 컴포넌트에서 "지역화되지 않은 하드코딩 한국어"가 다시
// 끼어드는 회귀를 막는다. 사전(lib/resume-maker-i18n/*)·정규식·EDU 매핑 키·언어명
// 같은 정상 한글은 건드리지 않도록, 사용자에게 보이는 위치만 좁게 검사한다:
//   - JSX 텍스트 노드(>...한글...<)
//   - placeholder / aria-label / title= 속성 문자열
//   - toast.*( "..." ) 호출 인자
// 위반이 있으면 목록을 출력하고 종료코드 1.
//
// 실행: node scripts/check-resume-i18n.mjs   (또는 npm run check:i18n)

import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, "..", "components", "resume-maker");
const HANGUL = /[가-힣]/;

// 주석 제거: 블록(/* */), JSX 블록({/* */}), 라인(//).
function stripComments(src) {
  return src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "") // {/* ... */}
    .replace(/\/\*[\s\S]*?\*\//g, "") // /* ... */
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1"); // // ... (URL의 // 는 앞에 : 가 있어 보존)
}

// 한 줄에서 "보이는 텍스트" 위치의 한글만 위반으로 본다.
function violationsInLine(line) {
  const hits = [];
  // JSX 텍스트 노드: > 와 < 사이(태그/표현식 제외)에 한글
  for (const m of line.matchAll(/>([^<>{}]*[가-힣][^<>{}]*)</g)) {
    const text = m[1].trim();
    if (text) hits.push(text);
  }
  // placeholder / aria-label / title 속성 문자열
  for (const m of line.matchAll(/(?:placeholder|aria-label|title)\s*=\s*["'`]([^"'`]*[가-힣][^"'`]*)["'`]/g)) {
    hits.push(m[1].trim());
  }
  // toast.success/error/info( "..." )
  for (const m of line.matchAll(/toast\.\w+\(\s*["'`]([^"'`]*[가-힣][^"'`]*)["'`]/g)) {
    hits.push(m[1].trim());
  }
  return hits;
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".tsx"));
const violations = [];

for (const file of files) {
  const raw = readFileSync(join(DIR, file), "utf8");
  const cleaned = stripComments(raw);
  const lines = cleaned.split("\n");
  lines.forEach((line, i) => {
    if (!HANGUL.test(line)) return;
    for (const v of violationsInLine(line)) {
      violations.push({ file, line: i + 1, text: v });
    }
  });
}

if (violations.length > 0) {
  console.error("✗ resume-maker i18n 가드 실패 — 지역화되지 않은 한국어 텍스트:");
  for (const v of violations) {
    console.error(`  components/resume-maker/${v.file}:${v.line}  "${v.text}"`);
  }
  console.error(`\n총 ${violations.length}건. 위 문자열을 useXxxCopy() 사전으로 옮기세요.`);
  process.exit(1);
}

console.log(`✓ resume-maker i18n 가드 통과 (${files.length}개 컴포넌트, 하드코딩 한국어 텍스트 없음)`);
