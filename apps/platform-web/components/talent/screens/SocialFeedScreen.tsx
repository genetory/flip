"use client";

// 커뮤니티 피드 — 로그인 사용자가 글을 쓰고, 서로 팔로우해 팔로잉한 사람 소식을 모아본다.
import { useMemo, useState } from "react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TPageHeader } from "../ui/primitives";
import { FeedPostList } from "../feed/FeedPostList";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { useSocialFeed, addFeedPost, roleLabel, type FeedAuthorRole } from "../../../lib/talent/social-feed";
import { authorKey, useFollowing } from "../../../lib/talent/social-graph";
import { extractFromFeedPost } from "../../../lib/talent/feed-extract-client";
import { ensureResumeItemByRef } from "../../../lib/talent/resume-doc";
import { ensureCoverItemByRef } from "../../../lib/talent/cover-doc";
import type { CareerSection } from "../../../lib/talent/career-chat";

export function SocialFeedScreen() {
  const { user } = useAuthSession();
  const posts = useSocialFeed();
  const following = useFollowing();
  const [text, setText] = useState("");
  const [tab, setTab] = useState<"all" | "following">("all");

  const name = user?.realName || user?.name || "나";
  const role: FeedAuthorRole = user?.role === "OPERATOR" ? "OPERATOR" : user?.role === "PARTNER" ? "PARTNER" : "STUDENT";

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
          <FeedPostList posts={visible} />
        )}
      </div>
    </TalentAppShell>
  );
}
