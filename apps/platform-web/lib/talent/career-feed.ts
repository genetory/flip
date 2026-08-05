// 내 커리어 피드 — 사용자가 채팅으로 남긴 한 줄들을 히스토리로 보관.
// 항목은 계정(서버 Resume.content.renewalCareerFeed)에 귀속된다.
// 단, "삭제한 refId"(dismissed)는 재생성 방지용 기기 로컬 플래그로만 둔다.
import { useEffect, useSyncExternalStore } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { setCareerFeed, snapshotCareerFeed, subscribeDocs, syncUser } from "./renewal-docs-store";
import type { CareerSection } from "./career-chat";

export interface FeedEntry {
  id: string;
  text: string;
  section: CareerSection;
  createdAt: number;
  // 이력서/자기소개서 등에서 추가된 항목이면 표시/링크를 덮어쓴다.
  emoji?: string;
  label?: string;
  href?: string;
  refId?: string; // 이력서 항목/자소서 문항과 매핑(중복 방지)
}

export interface FeedEntryOptions {
  emoji?: string;
  label?: string;
  href?: string;
  refId?: string;
  createdAt?: number;
}

const EMPTY: FeedEntry[] = [];
// 사용자가 삭제한 refId 모음 — 이력서/자소서 유래 항목을 지워도 sync가 되살리지 않게 한다(기기 로컬).
const DISMISS_KEY = "talent.careerFeed.dismissed.v1";
let dismissedCache: Set<string> | null = null;

function readDismissed(): Set<string> {
  if (dismissedCache) return dismissedCache;
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    dismissedCache = new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    dismissedCache = new Set();
  }
  return dismissedCache;
}

function addDismissed(refId: string): void {
  const set = readDismissed();
  if (set.has(refId)) return;
  set.add(refId);
  try {
    window.localStorage.setItem(DISMISS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* noop */
  }
}

function read(): FeedEntry[] {
  return snapshotCareerFeed() ?? EMPTY;
}

// 최신순으로 앞에 쌓는다.
export function addFeedEntry(text: string, section: CareerSection, opts?: FeedEntryOptions): FeedEntry {
  const entry: FeedEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text: text.trim(),
    section,
    createdAt: opts?.createdAt ?? Date.now(),
    ...(opts?.emoji ? { emoji: opts.emoji } : {}),
    ...(opts?.label ? { label: opts.label } : {}),
    ...(opts?.href ? { href: opts.href } : {}),
    ...(opts?.refId ? { refId: opts.refId } : {})
  };
  setCareerFeed([entry, ...read()].sort((a, b) => b.createdAt - a.createdAt));
  return entry;
}

// refId 로 매핑된 항목을 백필·동기화. 없으면 추가, 있으면 내용이 바뀐 경우 갱신(멱등).
export function ensureFeedEntry(refId: string, text: string, section: CareerSection, opts?: FeedEntryOptions): void {
  const t = text.trim();
  if (!t) return;
  // 사용자가 지운 항목이면 되살리지 않는다.
  if (readDismissed().has(refId)) return;
  const list = read();
  const existing = list.find((e) => e.refId === refId);
  if (existing) {
    if (existing.text !== t) {
      setCareerFeed(list.map((e) => (e.refId === refId ? { ...e, text: t } : e)));
    }
    return;
  }
  addFeedEntry(text, section, { ...opts, refId });
}

export function removeFeedEntry(id: string): void {
  const list = read();
  const target = list.find((e) => e.id === id);
  // 이력서/자소서 유래(refId) 항목은 dismissed에 기록해 sync 재생성을 막는다.
  if (target?.refId) addDismissed(target.refId);
  setCareerFeed(list.filter((e) => e.id !== id));
}

// 최신순 피드(계정 귀속, useSyncExternalStore로 화면 간 동기화).
export function useCareerFeed(): FeedEntry[] {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;
  useEffect(() => {
    syncUser(userId);
  }, [userId]);
  return useSyncExternalStore(subscribeDocs, snapshotCareerFeed, () => null) ?? EMPTY;
}

// 상대 시간 표시("방금 전 / N분 전 / N시간 전 / N일 전 / 날짜").
export function formatRelativeTime(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return "방금 전";
  if (diff < hour) return `${Math.floor(diff / min)}분 전`;
  if (diff < day) return `${Math.floor(diff / hour)}시간 전`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}일 전`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
