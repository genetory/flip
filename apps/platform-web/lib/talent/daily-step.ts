// 오늘의 한 걸음 — 하루 하나의 커리어 미션을 실천하면 연속 일수(streak)가 쌓인다.
// 실천한 날짜(YYYY-MM-DD) 목록을 계정(서버 Resume.content.renewalDailySteps)에 보관한다.
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { setDailySteps, snapshotDailySteps, subscribeDocs, syncUser } from "./renewal-docs-store";

const EMPTY: string[] = [];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function iso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 오늘 미션 완료로 기록(중복 방지). 최근 60일만 보관.
export function markStepDoneToday(): void {
  if (typeof window === "undefined") return;
  const today = iso(new Date());
  const list = snapshotDailySteps() ?? [];
  if (list.includes(today)) return;
  setDailySteps([today, ...list].slice(0, 60));
}

// 오늘(완료 시) 또는 어제부터 이어지는 연속 일수.
function computeStreak(set: Set<string>): number {
  const d = new Date();
  if (!set.has(iso(d))) d.setDate(d.getDate() - 1); // 오늘 아직이면 어제부터 카운트
  let count = 0;
  while (set.has(iso(d))) {
    count += 1;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

export function useDailyStep(): { streak: number; doneToday: boolean } {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;
  useEffect(() => {
    syncUser(userId);
  }, [userId]);
  const dates = useSyncExternalStore(subscribeDocs, snapshotDailySteps, () => null) ?? EMPTY;
  return useMemo(() => {
    const set = new Set(dates);
    return { doneToday: set.has(iso(new Date())), streak: computeStreak(set) };
  }, [dates]);
}
