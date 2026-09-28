// 자소서 제출 전 최종 점검 — 흩어진 규칙을 한 곳에서 계산한다.
//
// 전부 "제출 전에 사용자가 직접 고쳐야 하는" 항목이고, AI 호출 없이 클라이언트에서 즉시
// 계산하므로 포인트가 들지 않는다.
// 표시 문구는 화면(다국어 t())에서 만든다 — 여기서는 숫자·이름만 넘긴다.
import { coverQuestions, type CoverDoc } from "./cover-doc";
import { findClichePhrases } from "./cliche-phrases";
import { findCoverOverlaps, type CoverOverlap } from "./cover-overlap";

export type CoverIssue =
  | { kind: "empty"; question: string }
  | { kind: "under"; question: string; length: number; target: number; short: number }
  | { kind: "over"; question: string; length: number; limit: number; excess: number }
  | { kind: "cliche"; question: string; phrases: string[] }
  | { kind: "keyword"; keyword: string }
  | { kind: "overlap"; aQuestion: string; bQuestion: string; shared: string[] };

export type CoverReview = {
  issues: CoverIssue[];
  filledPercent: number; // 답변이 채워진 문항 비율(0~100)
  overlaps: CoverOverlap[];
};

export function reviewCover(doc: CoverDoc | null): CoverReview {
  if (!doc) return { issues: [], filledPercent: 0, overlaps: [] };
  const questions = coverQuestions(doc);
  const issues: CoverIssue[] = [];
  let filled = 0;

  for (const q of questions) {
    const body = doc.items
      .filter((it) => it.question === q)
      .map((it) => (it.text ?? "").trim())
      .filter(Boolean)
      .join("\n");
    if (!body) {
      issues.push({ kind: "empty", question: q });
      continue;
    }
    filled += 1;

    // 글자 수 기준은 백엔드 프롬프트와 같게 둔다(최소 target, 상한 target*1.2).
    // 한 문항에 여러 항목을 쓸 수 있으므로 문항 전체 길이로 본다.
    const target = doc.targetChars?.[q];
    if (target) {
      const limit = Math.round(target * 1.2);
      if (body.length < target) issues.push({ kind: "under", question: q, length: body.length, target, short: target - body.length });
      else if (body.length > limit) issues.push({ kind: "over", question: q, length: body.length, limit, excess: body.length - limit });
    }

    const phrases = findClichePhrases(body);
    if (phrases.length) issues.push({ kind: "cliche", question: q, phrases });
  }

  // 반드시 넣을 소재 — AI가 넣었더라도 사용자가 이후 편집에서 지웠을 수 있으므로 본문에서 확인한다.
  const all = doc.items.map((it) => it.text ?? "").join("\n");
  for (const k of doc.keywords ?? []) {
    const key = k.trim();
    if (key && !all.includes(key)) issues.push({ kind: "keyword", keyword: key });
  }

  const overlaps = findCoverOverlaps(doc.items.map((it) => ({ id: it.id, question: it.question, text: it.text ?? "" })));
  for (const o of overlaps) {
    issues.push({ kind: "overlap", aQuestion: o.aQuestion, bQuestion: o.bQuestion, shared: o.shared });
  }

  return { issues, filledPercent: questions.length ? Math.round((filled / questions.length) * 100) : 0, overlaps };
}
