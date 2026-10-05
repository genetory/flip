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

export type CoverScanIssue =
  | { kind: "empty" }
  | { kind: "over"; length: number; limit: number }
  | { kind: "under"; length: number; limit: number }
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

export type ScanQuestion = { id: string; prompt: string; limit: number | null; text: string };

/** 분량 '부족' 기준 — 한도의 80% 미만이면 짧다고 본다(기존 최종 점검과 같은 기준). */
const UNDER_RATIO = 0.8;

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
      else if (n < Math.round(q.limit * UNDER_RATIO)) add(q.id, { kind: "under", length: n, limit: q.limit });
    }

    const phrases = findClichePhrases(body);
    if (phrases.length) add(q.id, { kind: "cliche", phrases });
  }

  // 문항 간 내용 중복 — 예전 최종 점검에서 빠져 있던 검사. 같은 경험을 두 문항에 쓰면
  // 읽는 사람이 "할 말이 없나" 하고 느낀다.
  const overlaps = findCoverOverlaps(
    questions.filter((q) => q.text.trim()).map((q) => ({ id: q.id, question: q.prompt, text: q.text }))
  );
  for (const o of overlaps) {
    add(o.aId, { kind: "overlap", withQuestion: o.bQuestion, shared: o.shared });
    add(o.bId, { kind: "overlap", withQuestion: o.aQuestion, shared: o.shared });
  }

  // 필수 소재는 문서 전체에서 확인한다 — AI 가 넣었더라도 이후 편집에서 지웠을 수 있다.
  const all = questions.map((q) => q.text).join("\n");
  const missingKeywords = keywords
    .map((k) => k.trim())
    .filter((k) => k.length > 0 && !all.includes(k));

  return {
    byQuestion,
    missingKeywords,
    filledPercent: questions.length ? Math.round((filled / questions.length) * 100) : 0,
    flaggedCount: byQuestion.size
  };
}
