// 관심 직무 — 프로필 정보의 일부. '나에게 맞는 공고' 매칭에 사용.
// 저장은 localStorage 가 아니라 로그인 계정(서버 Resume.content.renewalJobInterests)에 귀속된다.
import { useEffect, useSyncExternalStore } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { setJobInterests as storeSetJobInterests, snapshotJobInterests, subscribeDocs, syncUser } from "./renewal-docs-store";

const EMPTY: string[] = [];

// 관심 직무 최대 개수 — 선택 UI·AI 추천 추가 등 모든 경로에서 공유.
export const MAX_JOB_INTERESTS = 5;

// 저장 — 계정(서버)에 반영. 실제 쓰기는 공유 스토어가 debounce 처리한다. 상한 초과분은 잘라낸다.
export function saveJobInterests(roles: string[]): void {
  storeSetJobInterests(roles.slice(0, MAX_JOB_INTERESTS));
}

// 계정 귀속 — 로그인한 유저의 서버 관심 직무를 구독한다.
export function useJobInterests(): string[] {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;
  useEffect(() => {
    syncUser(userId);
  }, [userId]);
  const roles = useSyncExternalStore(subscribeDocs, snapshotJobInterests, () => null);
  return roles ?? EMPTY;
}
