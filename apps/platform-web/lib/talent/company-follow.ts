"use client";

// 관심 회사(팔로우) — 실제 서버(CandidateProfile.followedCompanyNames) 귀속.
// 리뉴얼은 회사를 이름으로 식별하므로 이름 기반. 계정 전환 시 자동 로드·리셋.
import { useEffect, useSyncExternalStore } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { getMyFollowedCompanies, followCompany as apiFollow, unfollowCompany as apiUnfollow } from "../member-profile-client";
import { notifyFollowedCompany } from "./activity-log";
import type { PlatformT } from "../i18n";

const listeners = new Set<() => void>();
const EMPTY: string[] = [];
let names: string[] | null = null;
let loadedForUser: string | null | undefined = undefined;

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function syncUser(userId: string | null): void {
  if (loadedForUser === userId) return;
  loadedForUser = userId;
  names = null; // 계정 전환 → 리셋
  emit();
  if (!userId) return;
  void getMyFollowedCompanies()
    .then((list) => {
      if (loadedForUser === userId) {
        names = list;
        emit();
      }
    })
    .catch(() => {
      if (loadedForUser === userId) {
        names = [];
        emit();
      }
    });
}

export function isCompanyFollowed(name: string): boolean {
  return (names ?? []).includes(name);
}

export function followCompanyName(name: string, t: PlatformT): void {
  const cur = names ?? [];
  if (cur.includes(name)) return;
  names = [name, ...cur]; // 낙관적 반영
  emit();
  notifyFollowedCompany(t, name); // 내 활동 알림
  void apiFollow(name)
    .then((list) => {
      names = list;
      emit();
    })
    .catch(() => {});
}

export function unfollowCompanyName(name: string): void {
  const cur = names ?? [];
  if (!cur.includes(name)) return;
  names = cur.filter((n) => n !== name);
  emit();
  void apiUnfollow(name)
    .then((list) => {
      names = list;
      emit();
    })
    .catch(() => {});
}

export function toggleCompanyFollow(name: string, t: PlatformT): void {
  if (isCompanyFollowed(name)) unfollowCompanyName(name);
  else followCompanyName(name, t);
}

export function useFollowedCompanies(): string[] {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;
  useEffect(() => {
    syncUser(userId);
  }, [userId]);
  return useSyncExternalStore(subscribe, () => names, () => null) ?? EMPTY;
}
