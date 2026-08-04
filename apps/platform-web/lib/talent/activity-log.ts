// 내 활동 알림 — 내가 한 행동(지원·팔로우·관심회사·저장)을 알림에 적재한다.
// 소식(팔로잉 새 글 등)과 구분하기 위해 kind: "activity" 로 남긴다.
import { addNotification } from "./notifications";
import { talentAppRoutes } from "./app-nav";

// 지원 완료.
export function notifyApplied(positionId: string, jobTitle: string, company: string): void {
  addNotification({
    kind: "activity",
    emoji: "📮",
    title: "지원을 완료했어요",
    body: company ? `${company} · ${jobTitle}` : jobTitle,
    href: talentAppRoutes.applications,
    dedupeKey: `activity:apply:${positionId}`
  });
}

// 사용자 팔로우.
export function notifyFollowedUser(name: string): void {
  addNotification({
    kind: "activity",
    emoji: "🙌",
    title: "새로 팔로우했어요",
    body: `${name}님의 소식을 받아볼 수 있어요`,
    href: "/talent/activity/following-users",
    dedupeKey: `activity:follow-user:${name}`
  });
}

// 관심 회사 등록.
export function notifyFollowedCompany(name: string): void {
  addNotification({
    kind: "activity",
    emoji: "⭐",
    title: "관심 회사로 등록했어요",
    body: `${name}의 새 공고를 알려드릴게요`,
    href: "/talent/activity/following-companies",
    dedupeKey: `activity:follow-company:${name}`
  });
}

// 포지션 저장(즐겨찾기).
export function notifySavedPosition(positionId: string, jobTitle?: string): void {
  addNotification({
    kind: "activity",
    emoji: "🔖",
    title: "공고를 저장했어요",
    body: jobTitle ? `${jobTitle} · 저장한 공고에서 다시 볼 수 있어요` : "저장한 공고에서 다시 볼 수 있어요",
    href: "/talent/activity/favorite-positions",
    dedupeKey: `activity:save-position:${positionId}`
  });
}

// 피드 글 저장(즐겨찾기).
export function notifySavedFeed(postId: string): void {
  addNotification({
    kind: "activity",
    emoji: "📌",
    title: "피드 글을 저장했어요",
    body: "저장한 글에서 다시 볼 수 있어요",
    href: "/talent/activity/favorite-feed",
    dedupeKey: `activity:save-feed:${postId}`
  });
}
