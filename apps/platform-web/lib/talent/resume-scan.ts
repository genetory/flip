// 이력서 전체 점검 — 규칙으로만 계산한다(AI 호출 없음).
//
// 자소서(cover-scan)에는 점검이 있었는데 이력서에는 아무것도 없었다. 다듬기(AiPolish)와
// 일괄 정리는 있지만 "어디를 고쳐야 하는지"는 사용자가 스스로 찾아야 했다.
//
// 여기서 잡는 것은 전부 "사람이 보면 바로 아는" 것들이다. 판단이 필요한 것(근거가 약한
// 주장 등)은 규칙으로 잡지 않는다 — 오탐이 나면 오히려 방해가 된다.
import type { ResumeItem } from "./resume-doc";
import { findCoverOverlaps } from "./cover-overlap";

export type ResumeScanIssue =
  | { kind: "empty" }
  /** 경력·프로젝트·활동인데 한 일만 있고 결과(수치)가 없다. */
  | { kind: "noNumber" }
  /** 기간을 쓰는 섹션인데 비어 있다. */
  | { kind: "noPeriod" }
  /** 내용이 너무 짧아 읽는 사람이 판단할 수 없다. */
  | { kind: "tooShort"; length: number }
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
/** 성과 수치를 기대하는 섹션 — 학력·자격증에 숫자를 요구하면 오탐이다. */
const RESULT_SECTIONS = new Set(["experience", "project", "activity"]);

/** 너무 짧다고 보는 길이(공백 제외). 서술이 필요한 섹션에만 적용한다 —
 *  학력("한국대학교 컴퓨터공학 학사")·자격증·스킬은 원래 짧아서 여기 걸면 전부 오탐이 된다. */
const MIN_CHARS = 20;
/** 중복 비교 대상이 되는 최소 길이 — 짧은 항목은 우연히 겹친다. */
const OVERLAP_MIN_CHARS = 60;

const HAS_NUMBER = /\d/;
// 이력서는 명사형(…함, …개선)으로 끝내는 것이 관례다. 대화체·경어체 종결이 보이면 알려 준다.
// 어간을 일일이 나열하면("했습니다"만) "만들었습니다" 같은 변형을 놓친다 → 어미로 잡는다.
const SPOKEN_END = /(?:습니다|읍니다|어요|아요|해요|예요|에요|네요|죠)[.!?]?\s*$/;

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

    const bare = text.replace(/\s/g, "");
    if (RESULT_SECTIONS.has(it.section) && bare.length < MIN_CHARS) add(it.id, { kind: "tooShort", length: bare.length });

    if (DATE_SECTIONS.has(it.section) && !(it.startDate ?? "").trim() && !(it.endDate ?? "").trim()) {
      add(it.id, { kind: "noPeriod" });
    }

    if (RESULT_SECTIONS.has(it.section) && !HAS_NUMBER.test(text)) {
      add(it.id, { kind: "noNumber" });
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
