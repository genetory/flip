// 자소서 전체 점검 — 규칙으로만 계산한다(AI 호출 없음, 즉시, 무료, 같은 입력에 같은 결과).
//
// 왜 모았나: 모듈형 에디터의 FinalCheckSection 이 같은 검사를 직접 다시 구현하고 있었고,
// 그 과정에서 '문항 간 내용 중복'(findCoverOverlaps)이 빠졌다. 검사 결과를 목록으로만
// 보여 줘서 "어느 카드를 고쳐야 하는지"는 사용자가 직접 찾아야 했다.
// 여기서 한 번 계산해 문항별로 묶어 돌려주면, 목록과 카드 배지가 같은 근거를 쓴다.
//
// 표시 문구는 화면(다국어 t())에서 만든다 — 여기서는 숫자·이름만 넘긴다.
import { findClichePhrases } from "./cliche-phrases";
import { findCoverOverlaps } from "./cover-overlap";

// '분량 부족'은 뺐다 — 문항마다 걸려서 목록이 길어지고, 길이는 문항 옆 글자 수 막대가
// 이미 보여 준다. '초과'는 남긴다: 넘치면 제출 자체가 안 되는데, 지금 보고 있지 않은
// 문항의 초과는 이 목록 말고는 알 길이 없다.
export type CoverScanIssue =
  | { kind: "empty" }
  | { kind: "over"; length: number; limit: number }
  | { kind: "cliche"; phrases: string[] }
  | { kind: "overlap"; withQuestion: string; shared: string[] };

/** 문항 id → 그 문항에서 발견된 문제들. 문제가 없으면 키가 없다. */
export type CoverScan = {
  byQuestion: Map<string, CoverScanIssue[]>;
  /** 본문 어디에도 없는 필수 소재(문항에 속하지 않는 문서 단위 문제). */
  missingKeywords: string[];
  /** 답변이 채워진 문항 비율(0~100). */
  filledPercent: number;
  /** 문제가 하나라도 있는 문항 수. */
  flaggedCount: number;
};

export type ScanQuestion = {
  id: string;
  prompt: string;
  limit: number | null;
  text: string;
  /** 이 문항에 들어간 에피소드 id. 중복 검사에서 '의도적 재사용'을 가려내는 데 쓴다. */
  blocks?: string[];
};

/**
 * 이 지적이 답변의 어느 글자를 가리키는가 — 형광펜으로 칠할 구절.
 * 빈 배열이면 가리킬 곳이 없는 지적이다(분량 초과·미달, 미작성은 칠할 글자가 없다).
 */
export function coverIssueQuotes(issue: CoverScanIssue): string[] {
  if (issue.kind === "cliche") return issue.phrases;
  if (issue.kind === "overlap") return issue.shared;
  return [];
}

export function scanCover(questions: ScanQuestion[], keywords: string[], charCount: (s: string) => number): CoverScan {
  const byQuestion = new Map<string, CoverScanIssue[]>();
  const add = (id: string, issue: CoverScanIssue) => {
    const cur = byQuestion.get(id) ?? [];
    cur.push(issue);
    byQuestion.set(id, cur);
  };

  let filled = 0;
  for (const q of questions) {
    const body = q.text.trim();
    if (!body) {
      add(q.id, { kind: "empty" });
      continue;
    }
    filled += 1;

    if (q.limit) {
      const n = charCount(body);
      if (n > q.limit) add(q.id, { kind: "over", length: n, limit: q.limit });
    }

    const phrases = findClichePhrases(body);
    if (phrases.length) add(q.id, { kind: "cliche", phrases });
  }

  // 문항 간 내용 중복 — 같은 경험을 두 문항에 쓰면 읽는 사람이 "할 말이 없나" 하고 느낀다.
  //
  // 단, **같은 에피소드를 일부러 여러 문항에 넣는 것은 이 에디터의 설계**다(왼쪽 카드에
  // "문항 2에 사용"이라고 표시까지 한다). 문항 텍스트만 비교하면 그 재사용이 100% 겹쳐
  // 보여서, 의도대로 쓴 사용자를 지적하게 된다. 에피소드를 공유하는 문항 쌍은 비교에서 뺀다.
  //
  // 이러면 'q1=[A,X], q2=[A,Y] 인데 X 와 Y 가 사실상 같은 이야기'인 경우를 놓친다.
  // 그래도 이쪽을 고른다 — 오탐은 놓치는 것보다 나쁘고(점검 자체를 안 믿게 된다),
  // 그런 경우는 AI 점검이 이유와 함께 짚어 준다.
  const blocksOf = new Map(questions.map((q) => [q.id, new Set(q.blocks ?? [])]));
  const sharesEpisode = (a: string, b: string) => {
    const sa = blocksOf.get(a);
    const sb = blocksOf.get(b);
    if (!sa || !sb) return false;
    for (const id of sa) if (sb.has(id)) return true;
    return false;
  };
  const overlaps = findCoverOverlaps(
    questions.filter((q) => q.text.trim()).map((q) => ({ id: q.id, question: q.prompt, text: q.text }))
  );
  for (const o of overlaps) {
    if (sharesEpisode(o.aId, o.bId)) continue;
    add(o.aId, { kind: "overlap", withQuestion: o.bQuestion, shared: o.shared });
    add(o.bId, { kind: "overlap", withQuestion: o.aQuestion, shared: o.shared });
  }

  // 필수 소재는 문서 전체에서 확인한다 — AI 가 넣었더라도 이후 편집에서 지웠을 수 있다.
  // 띄어쓰기는 무시하고 찾는다: 소재를 "결제 시스템"으로 적어 두고 본문에 "결제시스템"으로
  // 썼다면 넣은 것이다. 글자 그대로만 맞추면 멀쩡히 쓴 소재를 "없다"고 하게 된다.
  const all = questions.map((q) => q.text).join("\n").replace(/\s/g, "");
  const missingKeywords = keywords
    .map((k) => k.trim())
    .filter((k) => k.length > 0 && !all.includes(k.replace(/\s/g, "")));

  return {
    byQuestion,
    missingKeywords,
    filledPercent: questions.length ? Math.round((filled / questions.length) * 100) : 0,
    flaggedCount: byQuestion.size
  };
}
