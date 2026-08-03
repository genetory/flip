// 관심 직무 — 프로필 정보의 일부. '나에게 맞는 공고' 매칭에 사용.
// 지금은 localStorage(mock). 추후 서버 프로필(preferredJobRoles)로 저장·동기화한다.
import { useSyncExternalStore } from "react";

const KEY = "talent.jobInterests.v1";
const EMPTY: string[] = [];

const listeners = new Set<() => void>();
let cache: string[] | null = null;

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

function emit() {
  cache = null;
  listeners.forEach((l) => l());
}

export function saveJobInterests(roles: string[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(roles));
  } catch {
    /* noop */
  }
  emit();
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

export function useJobInterests(): string[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
