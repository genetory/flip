// 내 커리어 피드 — 사용자가 채팅으로 남긴 한 줄들을 히스토리로 보관.
// 항목·삭제한 refId(dismissed) 모두 계정(서버 Resume.content)에 귀속된다.
import { useEffect, useSyncExternalStore } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { setCareerFeed, snapshotCareerFeed, setCareerFeedDismissed, snapshotCareerFeedDismissed, subscribeDocs, syncUser } from "./renewal-docs-store";
import type { CareerSection } from "./career-chat";
import type { PlatformT } from "../i18n";

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

// 사용자가 삭제한 refId 모음 — 이력서/자소서 유래 항목을 지워도 sync가 되살리지 않게 한다(계정 귀속).
function readDismissed(): Set<string> {
  return new Set(snapshotCareerFeedDismissed() ?? []);
}

function addDismissed(refId: string): void {
  const cur = snapshotCareerFeedDismissed() ?? [];
  if (cur.includes(refId)) return;
  setCareerFeedDismissed([...cur, refId]);
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
// t 미제공 시 한국어로 폴백(파트너·운영 등 아직 다국어화 안 된 소비자 호환).
export function formatRelativeTime(ts: number, now: number = Date.now(), t?: PlatformT): string {
  const tr: PlatformT = t ?? ((ko) => ko);
  const diff = Math.max(0, now - ts);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return tr("방금 전", "just now", "刚刚", "vừa xong", "たった今", "baru saja");
  if (diff < hour) {
    const n = Math.floor(diff / min);
    return tr(`${n}분 전`, `${n}m ago`, `${n}分钟前`, `${n} phút trước`, `${n}分前`, `${n} menit lalu`);
  }
  if (diff < day) {
    const n = Math.floor(diff / hour);
    return tr(`${n}시간 전`, `${n}h ago`, `${n}小时前`, `${n} giờ trước`, `${n}時間前`, `${n} jam lalu`);
  }
  if (diff < 7 * day) {
    const n = Math.floor(diff / day);
    return tr(`${n}일 전`, `${n}d ago`, `${n}天前`, `${n} ngày trước`, `${n}日前`, `${n} hari lalu`);
  }
  const d = new Date(ts);
  const mo = d.getMonth() + 1;
  const da = d.getDate();
  return tr(`${mo}월 ${da}일`, `${mo}/${da}`, `${mo}月${da}日`, `${da}/${mo}`, `${mo}月${da}日`, `${da}/${mo}`);
}
