// 내 활동 알림 — 내가 한 행동(지원·팔로우·관심회사·저장)을 알림에 적재한다.
// 소식(팔로잉 새 글 등)과 구분하기 위해 kind: "activity" 로 남긴다.
import { addNotification } from "./notifications";
import { talentAppRoutes } from "./app-nav";
import type { PlatformT } from "../i18n";

// 지원 완료.
export function notifyApplied(t: PlatformT, positionId: string, jobTitle: string, company: string): void {
  addNotification({
    kind: "activity",
    emoji: "📮",
    title: t("지원을 완료했어요", "Application submitted", "已完成申请", "Đã nộp đơn", "応募が完了しました", "Lamaran terkirim"),
    body: company ? `${company} · ${jobTitle}` : jobTitle,
    href: talentAppRoutes.applications,
    dedupeKey: `activity:apply:${positionId}`
  });
}

// 사용자 팔로우.
export function notifyFollowedUser(t: PlatformT, name: string): void {
  addNotification({
    kind: "activity",
    emoji: "🙌",
    title: t("새로 팔로우했어요", "Started following", "已开始关注", "Đã theo dõi", "フォローしました", "Mulai mengikuti"),
    body: t(`${name}님의 소식을 받아볼 수 있어요`, `You'll get updates from ${name}`, `你将收到${name}的动态`, `Bạn sẽ nhận tin từ ${name}`, `${name}さんの更新を受け取れます`, `Kamu akan menerima kabar dari ${name}`),
    href: "/talent/activity/following-users",
    dedupeKey: `activity:follow-user:${name}`
  });
}

// 관심 회사 등록.
export function notifyFollowedCompany(t: PlatformT, name: string): void {
  addNotification({
    kind: "activity",
    emoji: "⭐",
    title: t("관심 회사로 등록했어요", "Added to followed companies", "已加入关注公司", "Đã thêm công ty quan tâm", "関心企業に登録しました", "Ditambahkan ke perusahaan diikuti"),
    body: t(`${name}의 새 공고를 알려드릴게요`, `We'll notify you of new postings from ${name}`, `我们会通知你${name}的新职位`, `Chúng tôi sẽ báo tin tuyển mới từ ${name}`, `${name}の新しい求人をお知らせします`, `Kami akan beri tahu lowongan baru dari ${name}`),
    href: "/talent/activity/following-companies",
    dedupeKey: `activity:follow-company:${name}`
  });
}

// 포지션 저장(즐겨찾기).
export function notifySavedPosition(t: PlatformT, positionId: string, jobTitle?: string): void {
  addNotification({
    kind: "activity",
    emoji: "🔖",
    title: t("공고를 저장했어요", "Posting saved", "已保存职位", "Đã lưu tin tuyển", "求人を保存しました", "Lowongan disimpan"),
    body: jobTitle
      ? t(`${jobTitle} · 저장한 공고에서 다시 볼 수 있어요`, `${jobTitle} · Find it again in saved postings`, `${jobTitle} · 可在已保存职位中再次查看`, `${jobTitle} · Xem lại trong tin đã lưu`, `${jobTitle} · 保存した求人で再確認できます`, `${jobTitle} · Lihat lagi di lowongan tersimpan`)
      : t("저장한 공고에서 다시 볼 수 있어요", "Find it again in saved postings", "可在已保存职位中再次查看", "Xem lại trong tin đã lưu", "保存した求人で再確認できます", "Lihat lagi di lowongan tersimpan"),
    href: "/talent/activity/favorite-positions",
    dedupeKey: `activity:save-position:${positionId}`
  });
}

// 피드 글 저장(즐겨찾기).
export function notifySavedFeed(t: PlatformT, postId: string): void {
  addNotification({
    kind: "activity",
    emoji: "📌",
    title: t("피드 글을 저장했어요", "Post saved", "已保存动态", "Đã lưu bài viết", "投稿を保存しました", "Postingan disimpan"),
    body: t("저장한 글에서 다시 볼 수 있어요", "Find it again in saved posts", "可在已保存内容中再次查看", "Xem lại trong bài đã lưu", "保存した投稿で再確認できます", "Lihat lagi di postingan tersimpan"),
    href: "/talent/activity/favorite-feed",
    dedupeKey: `activity:save-feed:${postId}`
  });
}
