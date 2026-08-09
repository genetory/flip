"use client";

// 알림 설정 — 계정(서버 Resume.content)에 저장. push=공고/추천 알림, email=이메일 소식.
// 저장은 opt-out 플래그(기본 false=켜짐)로 두고, 화면엔 on/off로 노출한다.
import { useEffect, useSyncExternalStore } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import {
  snapshotNotifPushOptOut,
  snapshotNotifEmailOptOut,
  setNotifPushOptOut,
  setNotifEmailOptOut,
  subscribeDocs,
  syncUser
} from "./renewal-docs-store";

export function useNotifPrefs() {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;
  useEffect(() => {
    syncUser(userId);
  }, [userId]);
  const pushOptOut = useSyncExternalStore(subscribeDocs, snapshotNotifPushOptOut, () => false);
  const emailOptOut = useSyncExternalStore(subscribeDocs, snapshotNotifEmailOptOut, () => false);
  return {
    pushOn: !pushOptOut,
    emailOn: !emailOptOut,
    setPushOn: (v: boolean) => setNotifPushOptOut(!v),
    setEmailOn: (v: boolean) => setNotifEmailOptOut(!v)
  };
}
