// SGC 6주 일경험 프로그램 모집 기간 — 디테일 페이지와 신청 페이지가 모두
// 동일한 D-day / 마감 판정에 의존하므로 한 곳에서만 관리.

export const SGC_RECRUIT_START_ISO = "2026-06-15";
export const SGC_RECRUIT_END_ISO   = "2026-06-19";

export type SgcRecruitState =
  | { kind: "before"; daysToStart: number }
  | { kind: "open";   daysToClose: number }
  | { kind: "closed" };

export function computeSgcRecruitState(now: Date = new Date()): SgcRecruitState {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = new Date(SGC_RECRUIT_START_ISO + "T00:00:00Z").getTime();
  const end   = new Date(SGC_RECRUIT_END_ISO   + "T00:00:00Z").getTime();
  const ms = 86_400_000;
  if (today < start) return { kind: "before", daysToStart: Math.ceil((start - today) / ms) };
  if (today > end)   return { kind: "closed" };
  return { kind: "open", daysToClose: Math.max(0, Math.ceil((end - today) / ms)) };
}

export function isSgcRecruitClosed(now: Date = new Date()): boolean {
  return computeSgcRecruitState(now).kind === "closed";
}
