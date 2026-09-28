// 자소서 상투어 감지 — 사용자가 직접 쓴 문장에도 같은 기준을 보여준다.
//
// ⚠️ 원본(단일 소스)은 apps/api/src/llm/prompts.ts 다. 거기 자소서 시스템 프롬프트가
// 이 표현들을 금지하고(규칙 4 + '좋은 자소서의 조건'), stripCliches() 가 일부를 후처리로
// 지운다. apps/api 와 apps/platform-web 은 서로를 워크스페이스 의존성으로 걸고 있지 않아
// 목록을 공유할 수 없다 → 여기 사본을 둔다. 프롬프트의 금지어를 고치면 이 파일도 같이 고칠 것.
export type ClicheHit = { label: string; why: string };

type Rule = { re: RegExp; label: string; why: string };

// why 는 "왜 나쁜가"가 아니라 "대신 무엇을 쓰라"를 알려준다 — 지적만 하면 고치지 못한다.
const RULES: Rule[] = [
  // 과장 형용사 — 프롬프트 공통 규칙 4에서 '절대 사용 금지'.
  {
    re: /혁신적|탁월(?:한|하게)|압도적|독보적|누구보다|완벽한|최고의/g,
    label: "과장 형용사",
    why: "형용사 대신 무엇을 어떻게 했는지 사실로 보여주세요"
  },
  // 누구에게나 붙는 추상 명사구.
  {
    re: /가치를?\s*창출|실질적인\s*가치|잠재력을?\s*극대화|역량을?\s*바탕으로|다양한\s*역량|효율적이고\s*창조적|효율적인\s*결과/g,
    label: "빈 추상 명사구",
    why: "그 자리에 본인만의 구체적 사실(무엇을 했고 배웠는지)을 넣으세요"
  },
  // 결의 표명 — 근거 없는 각오.
  {
    re: /최선을\s*다하겠|열정을\s*가지고|열정이\s*있습니다|간절히\s*희망|성실합니다/g,
    label: "근거 없는 각오",
    why: "각오 대신 그 성격이 드러난 구체적 상황·행동을 쓰세요"
  },
  // 두루뭉술한 마무리 — 프롬프트가 '막연한 각오로 끝내지 말 것'으로 금지.
  {
    re: /기여하고\s*싶습니다|기여하고자|가치를?\s*전달하고\s*싶|성장에\s*기여|극대화하고\s*싶/g,
    label: "두루뭉술한 포부",
    why: "이 회사·직무에서 구체적으로 무엇을 어떻게 하겠다는 계획 하나를 쓰세요"
  },
  // 회사를 뭉뚱그려 지칭.
  {
    re: /귀사의\s*[^.\n]{0,12}가치|귀사의\s*비전/g,
    label: "공고 뭉뚱그림",
    why: "공고의 요구사항 하나를 집어 내 경험과 짝지어 서술하세요"
  }
];

export function findCliches(text: string): ClicheHit[] {
  const t = text ?? "";
  if (!t.trim()) return [];
  const hits: ClicheHit[] = [];
  for (const r of RULES) {
    // 전역 정규식은 lastIndex 가 남으므로 매 호출마다 초기화한다.
    r.re.lastIndex = 0;
    if (r.re.test(t)) hits.push({ label: r.label, why: r.why });
  }
  return hits;
}

// 실제로 걸린 표현 자체를 뽑아 사용자에게 보여준다(어디를 고칠지 알려주려면 표현이 필요).
export function findClichePhrases(text: string): string[] {
  const t = text ?? "";
  if (!t.trim()) return [];
  const out = new Set<string>();
  for (const r of RULES) {
    r.re.lastIndex = 0;
    for (const m of t.matchAll(r.re)) {
      const v = m[0].trim();
      if (v) out.add(v);
    }
  }
  return [...out];
}
