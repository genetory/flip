"use client";

// 내가 직접 등록한 면접 — Aply에서 지원하지 않은 곳도(Aply 공고·링크·본문으로 가져온 공고) 일정과 함께 등록해 두고 연습한다.
// 계정(서버 Resume.content.renewalMyInterviews)에 저장, 본인만 본다.
import { useEffect, useSyncExternalStore } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { setMyInterviews, snapshotMyInterviews, subscribeDocs, syncUser, type MyInterview } from "./renewal-docs-store";

export type { MyInterview };

export function useMyInterviews(): MyInterview[] {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;
  useEffect(() => {
    syncUser(userId);
  }, [userId]);
  return useSyncExternalStore(subscribeDocs, snapshotMyInterviews, () => null) ?? [];
}

/** 같은 공고를 다시 등록하면 일정만 바꾼다. */
export function saveMyInterview(data: Omit<MyInterview, "id" | "createdAt">): MyInterview {
  const cur = snapshotMyInterviews() ?? [];
  const same = cur.find((m) => m.positionId === data.positionId);
  const item: MyInterview = same ? { ...same, ...data } : { id: `mi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now(), ...data };
  setMyInterviews([item, ...cur.filter((m) => m !== same)].slice(0, 30));
  return item;
}

export function removeMyInterview(id: string): void {
  setMyInterviews((snapshotMyInterviews() ?? []).filter((m) => m.id !== id));
}
