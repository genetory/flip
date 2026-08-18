"use client";

// 첫 실행 온보딩 봤는지 여부 — 계정(서버 Resume.content.renewalOnboardingSeen)에 저장.
// 기기별 localStorage가 아니라 서버에 귀속해 어느 기기에서든 일관되게 판단한다.
import { useEffect, useSyncExternalStore } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { setOnboardingSeen as storeSet, snapshotOnboardingSeen, subscribeDocs, syncUser } from "./renewal-docs-store";

export function useOnboardingSeen(): boolean {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;
  useEffect(() => {
    syncUser(userId);
  }, [userId]);
  return useSyncExternalStore(subscribeDocs, snapshotOnboardingSeen, () => false);
}

// 온보딩을 마치거나 웰컴 카드를 닫으면 호출 → 서버에 반영(debounce 저장).
export function markOnboardingSeen(): void {
  storeSet(true);
}
