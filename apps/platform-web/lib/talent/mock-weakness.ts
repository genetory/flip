// 내 면접 약점 — 이미 쌓인 모의면접 답변에서 **계산해서** 보여준다. 저장하지 않는다.
//
// 왜 저장하지 않나:
// Career Launch 에 CareerInterviewWeakness 테이블이 있지만 그건 프로그램 세션이 주인이다.
// 세션을 끝낼 때 `deleteMany({ applicationPackageId: null, status: "open" })` 으로 열린 약점을
// 통째로 지우는데, 비수강생이 쓰면 applicationPackageId 가 똑같이 null 이라 **같이 지워진다**.
// 게다가 주차 대시보드 세 곳이 studentUserId 만으로 읽어서 수강생 화면에 섞인다.
// 약점은 답변에서 파생되는 '뷰'이지 별도 진실이 아니므로, 읽을 때 계산하면 그 충돌이 전부 사라진다.
// (저장이 없으니 마이그레이션도, 지워질 걱정도, 두 시스템이 어긋날 일도 없다.)
import { CATEGORY_ORDER, catMeta } from "./mock-interview-categories";
import type { SelfMockAnswer, SelfMockRecord } from "./self-mock";

export type WeaknessRow = {
  category: string;
  label: string;
  emoji: string;
  /** 채점이 끝난 답변 수. 0 이면 아직 모르는 영역이다. */
  answered: number;
  /** 평균 점수(0~100). answered 가 0 이면 null. */
  average: number | null;
  /** 가장 낮게 받은 답변 — '이 질문 다시 연습'의 대상. */
  worst: { question: string; score: number; improvement: string } | null;
};

/** 이 점수 미만이면 '더 볼 곳'으로 본다. 모의면접 피드백 점수 분포 기준(80 이상은 잘 쓴 답). */
export const WEAK_BELOW = 70;
/** 한 영역을 판단하려면 최소 이만큼은 답해 봐야 한다 — 1건으로 '약점'이라 하면 오해를 준다. */
const MIN_ANSWERS = 1;

const scored = (a: SelfMockAnswer): a is SelfMockAnswer & { score: number } => typeof a.score === "number" && isFinite(a.score);

/**
 * 영역별로 묶어 평균과 가장 낮은 답변을 뽑는다. 답변이 없는 영역도 '아직 안 해 봄'으로 함께 돌려준다 —
 * 약점만 보여 주면 "내가 뭘 안 해 봤는지"를 알 수 없다.
 */
export function analyzeMockWeakness(record: SelfMockRecord | null | undefined): WeaknessRow[] {
  const byCat = new Map<string, SelfMockAnswer[]>();
  for (const a of record?.answers ?? []) {
    const key = CATEGORY_ORDER.includes(a.category) ? a.category : "other";
    byCat.set(key, [...(byCat.get(key) ?? []), a]);
  }

  const rows: WeaknessRow[] = CATEGORY_ORDER.map((category) => {
    const meta = catMeta(category);
    const all = byCat.get(category) ?? [];
    const done = all.filter(scored);
    const average = done.length ? Math.round(done.reduce((s, a) => s + a.score, 0) / done.length) : null;
    // 가장 낮은 점수 하나 — 같은 점수면 최근 것을 쓴다(그 사이 실력이 달라졌을 수 있다).
    const worstAnswer = done.length
      ? done.reduce((lo, a) => (a.score < lo.score || (a.score === lo.score && a.updatedAt > lo.updatedAt) ? a : lo))
      : null;
    return {
      category,
      label: meta.label,
      emoji: meta.emoji,
      answered: done.length,
      average,
      worst: worstAnswer
        ? {
            question: worstAnswer.question,
            score: worstAnswer.score,
            improvement: (worstAnswer.feedback?.improvements ?? []).find((x) => x.trim()) ?? ""
          }
        : null
    };
  });

  // 약한 영역 먼저, 그다음 아직 안 해 본 영역, 잘한 영역은 뒤로.
  const rank = (r: WeaknessRow) => (r.average === null ? 1 : r.average < WEAK_BELOW ? 0 : 2);
  return rows.sort((a, b) => rank(a) - rank(b) || (a.average ?? 0) - (b.average ?? 0));
}

/** 더 볼 곳이 하나라도 있나 — 섹션을 띄울지 판단한다. */
export function hasWeakArea(rows: WeaknessRow[]): boolean {
  return rows.some((r) => r.answered >= MIN_ANSWERS && r.average !== null && r.average < WEAK_BELOW);
}
