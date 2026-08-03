"use client";

// 피드 글 목록 — 카드/팔로우/북마크/작성자 프로필 모달을 한데 묶은 공용 리스트.
// 커뮤니티 피드 화면과 "즐겨찾기한 피드" 상세에서 동일한 UI/UX로 재사용한다.
import { useMemo, useState } from "react";
import { Trash, BookmarkSimple } from "@phosphor-icons/react";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { useSocialFeed, removeFeedPost, roleLabel, type FeedAuthorRole, type FeedPost } from "../../../lib/talent/social-feed";
import { authorKey, isFollowing, toggleFollow, useFollowing, type FeedAuthor } from "../../../lib/talent/social-graph";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { toggleFeedBookmark, useFeedBookmarks } from "../../../lib/talent/feed-bookmarks";
import { useResumeDoc } from "../../../lib/talent/resume-doc";
import { useCoverDoc } from "../../../lib/talent/cover-doc";

export function FeedPostList({ posts }: { posts: FeedPost[] }) {
  const { user } = useAuthSession();
  const allPosts = useSocialFeed();
  const following = useFollowing();
  const bookmarks = useFeedBookmarks();
  const resumeDoc = useResumeDoc();
  const coverDoc = useCoverDoc();
  const [profile, setProfile] = useState<FeedAuthor | null>(null);

  const name = user?.realName || user?.name || "나";
  const role: FeedAuthorRole = user?.role === "OPERATOR" ? "OPERATOR" : user?.role === "PARTNER" ? "PARTNER" : "STUDENT";
  const meKey = authorKey({ name, role });

  const followSet = useMemo(() => new Set(following), [following]);
  const bookmarkSet = useMemo(() => new Set(bookmarks), [bookmarks]);
  const reflectedRefIds = useMemo(() => {
    const s = new Set<string>();
    resumeDoc?.items.forEach((i) => i.refId && s.add(i.refId));
    coverDoc?.items.forEach((i) => i.refId && s.add(i.refId));
    return s;
  }, [resumeDoc, coverDoc]);

  return (
    <>
      <div className="flex flex-col gap-3">
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            meKey={meKey}
            following={followSet.has(authorKey({ name: p.authorName, role: p.authorRole }))}
            bookmarked={bookmarkSet.has(p.id)}
            reflected={reflectedRefIds.has(`feed:${p.id}`)}
            onOpenProfile={() => setProfile({ name: p.authorName, role: p.authorRole })}
            onToggleFollow={() => toggleFollow({ name: p.authorName, role: p.authorRole })}
          />
        ))}
      </div>

      {profile ? <AuthorProfileModal author={profile} posts={allPosts} meKey={meKey} onClose={() => setProfile(null)} /> : null}
    </>
  );
}

function PostCard({
  post,
  meKey,
  following,
  bookmarked,
  reflected,
  onOpenProfile,
  onToggleFollow
}: {
  post: FeedPost;
  meKey: string;
  following: boolean;
  bookmarked: boolean;
  reflected: boolean;
  onOpenProfile: () => void;
  onToggleFollow: () => void;
}) {
  const key = authorKey({ name: post.authorName, role: post.authorRole });
  const mine = key === meKey;

  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={onOpenProfile} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[13px] font-black text-[#0B46E8]" aria-label={`${post.authorName} 프로필`}>
          {post.authorName.slice(0, 1)}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={onOpenProfile} className="truncate text-[13.5px] font-bold text-[#191F28] hover:underline">{post.authorName}</button>
            <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${post.authorRole === "PARTNER" ? "bg-[#EAF7EE] text-[#1F8B4C]" : "bg-[#EDF1FD] text-[#0B46E8]"}`}>{roleLabel(post.authorRole)}</span>
          </div>
          <p className="text-[11.5px] text-[#B0B8C1]">{formatRelativeTime(post.createdAt)}</p>
        </div>
        <button
          type="button"
          onClick={() => toggleFeedBookmark(post.id)}
          aria-label={bookmarked ? "즐겨찾기 취소" : "즐겨찾기"}
          aria-pressed={bookmarked}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${bookmarked ? "text-[#0B46E8]" : "text-[#B0B8C1] hover:bg-[#F2F4F6] hover:text-[#4E5968]"}`}
        >
          <BookmarkSimple className="h-4 w-4" weight={bookmarked ? "fill" : "regular"} />
        </button>
        {mine ? (
          <button type="button" onClick={() => removeFeedPost(post.id)} aria-label="삭제" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#B0B8C1] transition hover:bg-[#F2F4F6] hover:text-[#F04452]">
            <Trash className="h-4 w-4" />
          </button>
        ) : (
          <FollowButton following={following} onClick={onToggleFollow} />
        )}
      </div>
      <p className="mt-3 whitespace-pre-line break-keep text-[14px] leading-relaxed text-[#333D4B]">{post.text}</p>
      {mine && reflected ? (
        <p className="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-[#F5F8FF] px-2 py-1 text-[11.5px] font-semibold text-[#0B46E8]">📄 이력서·자기소개서에 반영됨</p>
      ) : null}
    </div>
  );
}

function FollowButton({ following, onClick }: { following: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={following}
      className={`shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-bold transition ${
        following ? "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]" : "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]"
      }`}
    >
      {following ? "팔로잉" : "팔로우"}
    </button>
  );
}

function AuthorProfileModal({ author, posts, meKey, onClose }: { author: FeedAuthor; posts: FeedPost[]; meKey: string; onClose: () => void }) {
  const following = useFollowing();
  const key = authorKey(author);
  const mine = key === meKey;
  const isFollowed = isFollowing(author);
  void following; // 팔로우 토글 시 리렌더 트리거용 구독
  const authored = posts.filter((p) => authorKey({ name: p.authorName, role: p.authorRole }) === key);

  return (
    <div role="dialog" aria-modal="true" aria-label={`${author.name} 프로필`} className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1227]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(11,18,39,0.18)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center px-7 pt-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[26px] font-black text-[#0B46E8]">{author.name.slice(0, 1)}</span>
          <div className="mt-3 flex items-center gap-1.5">
            <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{author.name}</h2>
            <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${author.role === "PARTNER" ? "bg-[#EAF7EE] text-[#1F8B4C]" : "bg-[#EDF1FD] text-[#0B46E8]"}`}>{roleLabel(author.role)}</span>
          </div>
          <p className="mt-1 text-[12.5px] text-[#8B95A1]">게시물 {authored.length}</p>
          {!mine ? (
            <button
              type="button"
              onClick={() => toggleFollow(author)}
              className={`mt-4 w-full rounded-xl px-4 py-2.5 text-[14px] font-bold transition ${
                isFollowed ? "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]" : "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]"
              }`}
            >
              {isFollowed ? "팔로잉" : "팔로우"}
            </button>
          ) : null}
        </div>

        <div className="mt-5 max-h-[46vh] overflow-y-auto border-t border-[#EEF1F5] px-5 py-4">
          {authored.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-[#8B95A1]">아직 남긴 글이 없어요.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {authored.map((p) => (
                <div key={p.id} className="rounded-xl bg-[#F9FAFB] p-3.5">
                  <p className="whitespace-pre-line break-keep text-[13.5px] leading-relaxed text-[#333D4B]">{p.text}</p>
                  <p className="mt-1.5 text-[11px] text-[#B0B8C1]">{formatRelativeTime(p.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-7 pb-6 pt-2">
          <button type="button" onClick={onClose} className="w-full rounded-xl bg-[#F2F4F6] px-4 py-2.5 text-[14px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">닫기</button>
        </div>
      </div>
    </div>
  );
}
