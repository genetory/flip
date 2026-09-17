// 규칙 기반 품질 검사 — 결정적(모델 불필요). LLM-as-judge 를 보완해 환각·형식·분량을 잡는다.
import type { CheckResult, GoldenCase } from "./types";

// 과장·미사여구 금지어(프롬프트가 지양하라고 명시하는 표현들).
const BANNED = ["혁신적", "탁월한", "압도적", "완벽한", "최고의", "누구보다", "독보적"];

function countChars(s: string): number {
  return [...s].length;
}

// 문자열에서 숫자 토큰 추출(연도·퍼센트·개수 등). 콤마 제거 후 3자리 이상/퍼센트 위주.
function numberTokens(s: string): string[] {
  const out = new Set<string>();
  const re = /\d[\d,]*\.?\d*\s*(%|퍼센트|명|건|개|회|억|만|천|년|개월|주|시간)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const raw = m[0].replace(/[,\s]/g, "");
    // 한 자리 숫자(1~2 등 흔한 서수)는 환각 판정에서 제외.
    const digits = raw.replace(/[^\d]/g, "");
    if (digits.length >= 2 || raw.includes("%")) out.add(raw);
  }
  return [...out];
}

function isMostlyKorean(s: string): boolean {
  const hangul = (s.match(/[가-힣]/g) ?? []).length;
  const letters = (s.match(/[A-Za-z가-힣]/g) ?? []).length || 1;
  return hangul / letters > 0.6;
}

// 공통 검사(모든 생성 텍스트).
function commonChecks(output: string, sourceText: string): CheckResult[] {
  const checks: CheckResult[] = [];
  checks.push({ name: "non_empty", pass: output.trim().length > 0, weight: 3 });
  checks.push({ name: "korean_output", pass: isMostlyKorean(output), weight: 2 });

  const banned = BANNED.filter((w) => output.includes(w));
  checks.push({
    name: "no_exaggeration",
    pass: banned.length === 0,
    weight: 2,
    detail: banned.length ? `과장어: ${banned.join(", ")}` : undefined
  });

  // 불릿/번호 머리표 금지(줄글 요구).
  const hasBullets = /(^|\n)\s*([-•*]|\d+[.)])\s/.test(output);
  checks.push({ name: "no_bullets", pass: !hasBullets, weight: 1 });

  // 환각 숫자 — 출력의 숫자 토큰이 입력(소스)에 없으면 의심.
  const srcNums = new Set(numberTokens(sourceText));
  const outNums = numberTokens(output);
  const fabricated = outNums.filter((n) => !srcNums.has(n));
  checks.push({
    name: "no_fabricated_numbers",
    pass: fabricated.length === 0,
    weight: 3,
    detail: fabricated.length ? `입력에 없는 숫자: ${fabricated.join(", ")}` : undefined
  });

  return checks;
}

// 입력 컨텍스트를 '허용 근거' 텍스트로 직렬화(숫자 대조·키워드 확인용).
function sourceTextOf(c: GoldenCase): string {
  return JSON.stringify(c.input);
}

export function runChecks(c: GoldenCase, output: string): CheckResult[] {
  const src = sourceTextOf(c);
  const checks = commonChecks(output, src);
  const input = c.input as Record<string, unknown>;

  // 공통 — '반드시 반영할 소재'(keywords)가 있으면 전부 반영됐는지(토큰 기반).
  const kws = Array.isArray(input.keywords) ? (input.keywords as string[]) : [];
  if (kws.length) {
    const wovenRatio = (k: string): number => {
      const toks = k.split(/[\s·,]+/).map((t) => t.trim()).filter((t) => t.length >= 1);
      if (!toks.length) return 1;
      const hit = toks.filter((t) => output.includes(t)).length;
      return hit / toks.length;
    };
    const missing = kws.filter((k) => k.trim() && wovenRatio(k) < 0.6);
    checks.push({
      name: "keywords_woven",
      pass: missing.length === 0,
      weight: 3,
      detail: missing.length ? `미반영 소재: ${missing.join(", ")}` : undefined
    });
  }

  if (c.feature === "polish_intro") {
    // 자기소개는 1인칭 진술체 유지.
    checks.push({ name: "first_person", pass: /(저는|제가|저의|제)/.test(output), weight: 2 });
  }

  if (c.feature === "cover_letter") {
    const isPolish = input.mode === "polish";
    // 1인칭·존댓말 자소서 문체.
    const firstPerson = /(저는|제가|저의|제)/.test(output);
    const jondaetmal = /(습니다|입니다|겠습니다|합니다)/.test(output);
    checks.push({ name: "first_person", pass: firstPerson, weight: 2 });
    checks.push({ name: "jondaetmal", pass: jondaetmal, weight: 2 });

    // 분량(draft + targetChars 지정 시 ±20%).
    const target = typeof input.targetChars === "number" ? (input.targetChars as number) : undefined;
    if (!isPolish && target) {
      const n = countChars(output);
      const lo = target * 0.8;
      const hi = target * 1.2;
      checks.push({
        name: "char_target",
        pass: n >= lo && n <= hi,
        weight: 2,
        detail: `${n}자 (목표 ${target}±20%)`
      });
    }

    // JD 그라운딩 — 목표 공고의 핵심 용어가 답변에 반영됐는가(공고와의 접점).
    const jobText = typeof input.jobText === "string" ? (input.jobText as string) : "";
    if (jobText.trim()) {
      // 공고에서 의미 토큰 추출(2자 이상 한글/영문, 흔한 불용어 제외).
      const stop = new Set(["주요", "업무", "자격", "요건", "우대", "사항", "채용", "회사", "지원", "경험", "능숙", "활용", "지식", "기초"]);
      const toks = Array.from(
        new Set(
          (jobText.match(/[A-Za-z]{2,}|[가-힣]{2,}/g) ?? [])
            .map((t) => t.trim())
            .filter((t) => t.length >= 2 && !stop.has(t))
        )
      );
      const hit = toks.filter((t) => output.includes(t));
      // 공고 핵심어가 최소 3개(또는 25%) 이상 답변에 반영되면 통과.
      const pass = hit.length >= Math.min(3, Math.ceil(toks.length * 0.25));
      checks.push({
        name: "jd_alignment",
        pass,
        weight: 2,
        detail: `공고어 반영 ${hit.length}/${toks.length} (${hit.slice(0, 6).join(", ")})`
      });
    }

  }

  if (c.feature === "polish_experience") {
    // 담백한 진술체(자소서와 달리 존댓말 강제는 아님) — 단일 단락(줄바꿈 최소).
    const lineBreaks = (output.match(/\n/g) ?? []).length;
    checks.push({
      name: "single_paragraph",
      pass: lineBreaks <= 1,
      weight: 1,
      detail: lineBreaks > 1 ? `줄바꿈 ${lineBreaks}개` : undefined
    });
  }

  return checks;
}

export function checkScore(checks: CheckResult[]): number {
  const total = checks.reduce((s, c) => s + c.weight, 0) || 1;
  const got = checks.reduce((s, c) => s + (c.pass ? c.weight : 0), 0);
  return got / total;
}
