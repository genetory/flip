// 자소서 문항 간 내용 중복 감지 — 같은 경험을 여러 문항에 재사용하면 감점 요인이다.
// 서버 호출 없이 클라이언트에서 계산한다(LLM 불필요, 즉시 반응).

export type CoverOverlapItem = { id: string; question: string; text: string };
export type CoverOverlap = {
  aId: string;
  bId: string;
  aQuestion: string;
  bQuestion: string;
  score: number; // 0~1
  shared: string[]; // 겹치는 핵심 단어(사용자에게 '무엇이' 겹쳤는지 보여주기 위함)
};

// 조사·어미를 떼어 같은 명사를 같은 토큰으로 모은다. 형태소 분석기 없이 하는 근사치라
// 완벽하지 않지만, "편의점에서"와 "편의점은"을 같게 보는 정도면 중복 판단에 충분하다.
const PARTICLES = /(?:으로써|으로서|에서는|에서도|에게서|이라는|라는|으로|이며|하며|에서|에게|한테|까지|부터|보다|처럼|만큼|이나|이든|은|는|이|가|을|를|에|의|와|과|도|만|랑|나|요)$/;

// 어디에나 나오는 말은 중복 신호가 아니다.
const STOP = new Set([
  "저는","제가","그리고","하지만","때문","통해","위해","대한","가장","많은","다양","경험","활동","생각","사람","시간","부분","과정","결과","노력","역량","능력","회사","지원","업무","내용","이후","당시","이를","또한","특히","정말","항상","모든","자신","스스로","무엇","하나","조금","문제","해결","목표","준비","시작","마음"
]);

function tokens(text: string): string[] {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^\p{Script=Hangul}\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((w) => w.replace(PARTICLES, ""))
    // 종결 어미로 끝나는 토큰(했습니다·입니다…)은 어느 글에나 나와 중복 신호가 아니다.
    .filter((w) => !/(?:습니다|입니다|합니다|했다|였다|이다)$/.test(w))
    .filter((w) => w.length >= 2 && !STOP.has(w));
}

// 짧은 항목은 우연히 겹치기 쉬워 오탐이 난다 — 두 항목 모두 이 길이를 넘어야 비교한다.
const MIN_CHARS = 80;
// 자카드 유사도 임계값. 0.30 이상이면 같은 소재를 재활용한 것으로 본다(경험적 기준).
const THRESHOLD = 0.3;

export function findCoverOverlaps(items: CoverOverlapItem[]): CoverOverlap[] {
  const usable = items
    .filter((it) => (it.text ?? "").trim().length >= MIN_CHARS)
    .map((it) => ({ ...it, set: new Set(tokens(it.text)) }))
    .filter((it) => it.set.size >= 5);

  const out: CoverOverlap[] = [];
  for (let i = 0; i < usable.length; i++) {
    for (let j = i + 1; j < usable.length; j++) {
      const a = usable[i];
      const b = usable[j];
      // 같은 문항 안의 여러 항목은 같은 주제를 이어 쓰는 게 자연스러우므로 제외한다.
      if (a.question === b.question) continue;
      const shared: string[] = [];
      for (const w of a.set) if (b.set.has(w)) shared.push(w);
      const union = a.set.size + b.set.size - shared.length;
      const score = union > 0 ? shared.length / union : 0;
      if (score >= THRESHOLD) {
        // 긴 단어가 더 특징적이라 먼저 보여준다.
        shared.sort((x, y) => y.length - x.length);
        out.push({ aId: a.id, bId: b.id, aQuestion: a.question, bQuestion: b.question, score, shared: shared.slice(0, 6) });
      }
    }
  }
  return out.sort((x, y) => y.score - x.score);
}
