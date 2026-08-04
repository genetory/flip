// 오늘의 한 걸음 — 하루 하나의 커리어 미션을 실천하면 연속 일수(streak)가 쌓인다.
// 지금은 localStorage(mock): 미션을 실천한 날짜(YYYY-MM-DD) 목록만 저장한다.
import { useMemo } from "react";
import { useSyncExternalStore } from "react";

const KEY = "talent.dailyStep.v1";
const EMPTY: string[] = [];

const listeners = new Set<() => void>();
let cache: string[] | null = null;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function iso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function read(): string[] {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

// 오늘 미션 완료로 기록(중복 방지). 최근 60일만 보관.
export function markStepDoneToday(): void {
  if (typeof window === "undefined") return;
  const today = iso(new Date());
  const list = read();
  if (list.includes(today)) return;
  const next = [today, ...list].slice(0, 60);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  cache = null;
  listeners.forEach((l) => l());
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

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useDailyStep(): { streak: number; doneToday: boolean } {
  const dates = useSyncExternalStore(subscribe, read, () => EMPTY);
  return useMemo(() => {
    const set = new Set(dates);
    return { doneToday: set.has(iso(new Date())), streak: computeStreak(set) };
  }, [dates]);
}
