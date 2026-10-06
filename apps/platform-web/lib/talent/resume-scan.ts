// 이력서 전체 점검 — 규칙으로만 계산한다(AI 호출 없음).
//
// 자소서(cover-scan)에는 점검이 있었는데 이력서에는 아무것도 없었다. 다듬기(AiPolish)와
// 일괄 정리는 있지만 "어디를 고쳐야 하는지"는 사용자가 스스로 찾아야 했다.
//
// 여기서 잡는 것은 전부 "사람이 보면 바로 아는" 것들이다. 판단이 필요한 것(근거가 약한
// 주장 등)은 규칙으로 잡지 않는다 — 오탐이 나면 오히려 방해가 된다.
import type { ResumeItem } from "./resume-doc";
import { findCoverOverlaps } from "./cover-overlap";

// 어떤 검사를 넣지 '않는지'가 중요하다. '성과 수치가 없다'·'너무 짧다' 는 항목마다 걸려서
// 목록이 금세 열 줄이 넘고, 그러면 사용자는 목록 자체를 안 읽는다. 그런 건 AI 점검이
// "이 문장은 무엇을 했는지가 없다"처럼 **이유와 함께** 짚어 주는 쪽이 낫다.
// 여기 남긴 것은 전부 '보면 바로 알고, 자주는 안 걸리는' 것들이다.
export type ResumeScanIssue =
  | { kind: "empty" }
  /** 기간을 쓰는 섹션인데 비어 있다. */
  | { kind: "noPeriod" }
  /** 이력서체가 아닌 대화체 종결(…했어요 / …했습니다). */
  | { kind: "spoken"; sample: string }
  /** 다른 항목과 내용이 겹친다. */
  | { kind: "overlap"; withText: string; shared: string[] };

export type ResumeScan = {
  byItem: Map<string, ResumeScanIssue[]>;
  flaggedCount: number;
};

/** 기간을 기대하는 섹션(스킬·어학은 기간이 없는 게 정상이다). */
const DATE_SECTIONS = new Set(["education", "experience", "project", "activity", "certificate", "award"]);
/** 중복 비교 대상이 되는 최소 길이 — 짧은 항목은 우연히 겹친다. */
const OVERLAP_MIN_CHARS = 60;
// 이력서는 명사형(…함, …개선)으로 끝내는 것이 관례다. 대화체·경어체 종결이 보이면 알려 준다.
// 어간을 일일이 나열하면("했습니다"만) "만들었습니다" 같은 변형을 놓친다 → 어미로 잡는다.
const SPOKEN_END = /(?:습니다|읍니다|어요|아요|해요|예요|에요|네요|죠)[.!?]?\s*$/;

/**
 * 이 지적이 본문의 어느 글자를 가리키는가 — 형광펜으로 칠할 구절.
 * 빈 배열이면 가리킬 곳이 없는 지적이다('수치가 없다'처럼 **빠진 것**은 칠할 글자가 없다).
 */
export function resumeIssueQuotes(issue: ResumeScanIssue): string[] {
  if (issue.kind === "spoken") return [issue.sample];
  if (issue.kind === "overlap") return issue.shared;
  return [];
}

export function scanResume(items: ResumeItem[]): ResumeScan {
  const byItem = new Map<string, ResumeScanIssue[]>();
  const add = (id: string, issue: ResumeScanIssue) => {
    const cur = byItem.get(id) ?? [];
    cur.push(issue);
    byItem.set(id, cur);
  };

  for (const it of items) {
    const text = (it.text ?? "").trim();
    if (!text) {
      add(it.id, { kind: "empty" });
      continue;
    }

    if (DATE_SECTIONS.has(it.section) && !(it.startDate ?? "").trim() && !(it.endDate ?? "").trim()) {
      add(it.id, { kind: "noPeriod" });
    }

    // 줄 단위로 본다 — 여러 줄 중 하나만 대화체인 경우가 많다.
    for (const line of text.split(/\r?\n/)) {
      const l = line.trim();
      if (l && SPOKEN_END.test(l)) {
        add(it.id, { kind: "spoken", sample: l.slice(0, 24) });
        break;
      }
    }
  }

  // 항목 간 중복 — 자소서와 같은 토큰 비교기를 쓴다(조사 제거·불용어 처리가 되어 있다).
  const long = items.filter((it) => (it.text ?? "").replace(/\s/g, "").length >= OVERLAP_MIN_CHARS);
  const overlaps = findCoverOverlaps(long.map((it) => ({ id: it.id, question: (it.text ?? "").slice(0, 20), text: it.text ?? "" })));
  for (const o of overlaps) {
    add(o.aId, { kind: "overlap", withText: o.bQuestion, shared: o.shared });
    add(o.bId, { kind: "overlap", withText: o.aQuestion, shared: o.shared });
  }

  return { byItem, flaggedCount: byItem.size };
}
