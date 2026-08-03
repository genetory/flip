"use client";

// 커뮤니티 피드 — 로그인 사용자가 글을 쓰고, 서로 팔로우해 팔로잉한 사람 소식을 모아본다.
import { useMemo, useState } from "react";
import { Trash, BookmarkSimple } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TPageHeader } from "../ui/primitives";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { useSocialFeed, addFeedPost, removeFeedPost, roleLabel, type FeedAuthorRole, type FeedPost } from "../../../lib/talent/social-feed";
import { authorKey, isFollowing, toggleFollow, useFollowing, type FeedAuthor } from "../../../lib/talent/social-graph";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { extractFromFeedPost } from "../../../lib/talent/feed-extract-client";
import { toggleFeedBookmark, useFeedBookmarks } from "../../../lib/talent/feed-bookmarks";
import { ensureResumeItemByRef, useResumeDoc } from "../../../lib/talent/resume-doc";
import { ensureCoverItemByRef, useCoverDoc } from "../../../lib/talent/cover-doc";
import type { CareerSection } from "../../../lib/talent/career-chat";

export function SocialFeedScreen() {
  const { user } = useAuthSession();
  const posts = useSocialFeed();
  const following = useFollowing();
  const bookmarks = useFeedBookmarks();
  const resumeDoc = useResumeDoc();
  const coverDoc = useCoverDoc();
  const [text, setText] = useState("");
  const [tab, setTab] = useState<"all" | "following">("all");
  const [profile, setProfile] = useState<FeedAuthor | null>(null);

  const name = user?.realName || user?.name || "나";
  const role: FeedAuthorRole = user?.role === "OPERATOR" ? "OPERATOR" : user?.role === "PARTNER" ? "PARTNER" : "STUDENT";
  const meKey = authorKey({ name, role });

  // 이력서/자소서에 이미 반영된 피드 글 refId 집합 → 내 글에 "반영됨" 표시.
  const reflectedRefIds = useMemo(() => {
    const s = new Set<string>();
    resumeDoc?.items.forEach((i) => i.refId && s.add(i.refId));
    coverDoc?.items.forEach((i) => i.refId && s.add(i.refId));
    return s;
  }, [resumeDoc, coverDoc]);

  function submit() {
    const t = text.trim();
    if (!t) return;
    const post = addFeedPost({ authorName: name, authorRole: role, text: t });
    setText("");
    if (!post) return;
    // 백그라운드: 글에서 이력서/자소서 소재를 뽑아 내 문서에 자동 삽입(비공개 side-effect).
    void extractFromFeedPost({ text: t, name }).then((ex) => {
      if (ex.resume) ensureResumeItemByRef(`feed:${post.id}`, ex.resume.section as CareerSection, ex.resume.text);
      if (ex.cover) ensureCoverItemByRef(`feed:${post.id}`, ex.cover.question, ex.cover.text);
    });
  }

  const followSet = useMemo(() => new Set(following), [following]);
  const bookmarkSet = useMemo(() => new Set(bookmarks), [bookmarks]);
  const visible = useMemo(
    () => (tab === "following" ? posts.filter((p) => followSet.has(authorKey({ name: p.authorName, role: p.authorRole }))) : posts),
    [tab, posts, followSet]
  );

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-5">
        <TPageHeader title="피드" description="취업 준비생과 기업이 함께 이야기 나누는 공간이에요." />

        {/* 작성 */}
        <div className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[15px] font-black text-[#0B46E8]">{name.slice(0, 1)}</span>
            <div className="min-w-0 flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="지금 어떤 생각을 나누고 싶나요?"
                className="w-full resize-none break-keep rounded-xl bg-[#F5F6F8] px-3.5 py-3 text-[14px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[12px] text-[#8B95A1]">{name} · {roleLabel(role)}</span>
                <button
                  type="button"
                  onClick={submit}
                  disabled={!text.trim()}
                  className="rounded-xl bg-[#0B46E8] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-40"
                >
                  게시
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 — 전체 / 팔로잉 */}
        <div className="flex gap-6 border-b border-[#EEF1F5]">
          {([
            { key: "all", label: "전체" },
            { key: "following", label: `팔로잉${following.length ? ` ${following.length}` : ""}` }
          ] as { key: "all" | "following"; label: string }[]).map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={active ? "page" : undefined}
                className={`relative -mb-px pb-2.5 text-[14px] transition ${active ? "font-bold text-[#191F28]" : "font-normal text-[#B0B8C1] hover:text-[#8B95A1]"}`}
              >
                {t.label}
                {active ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#0B46E8]" /> : null}
              </button>
            );
          })}
        </div>

        {/* 목록 */}
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[20px]" aria-hidden>{tab === "following" ? "👥" : "💬"}</span>
            <p className="mt-3 text-[14px] font-bold text-[#191F28]">{tab === "following" ? "팔로잉한 사람의 글이 없어요" : "아직 글이 없어요"}</p>
            <p className="mt-1 text-[12.5px] text-[#8B95A1]">{tab === "following" ? "관심 있는 사람을 팔로우해보세요." : "첫 글을 남겨보세요."}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((p) => (
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
        )}
      </div>

      {profile ? (
        <AuthorProfileModal
          author={profile}
          posts={posts}
          meKey={meKey}
          onClose={() => setProfile(null)}
        />
      ) : null}
    </TalentAppShell>
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
