"use client";

// 계정 설정 — 프로필 요약, 알림(mock), 계정 관리, 로그아웃.
import Link from "next/link";
import { useState } from "react";
import { CaretRight, SignOut } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { JobInterestCard } from "../jobs/JobInterestCard";
import { TCard, TPageHeader } from "../ui/primitives";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useFollowing, parseAuthorKey, unfollowAuthor, type FeedAuthor } from "../../../lib/talent/social-graph";
import { roleLabel } from "../../../lib/talent/social-feed";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-[#0B46E8]" : "bg-[#D7DCE3]"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function FollowList({ title, emptyText, authors }: { title: string; emptyText: string; authors: FeedAuthor[] }) {
  return (
    <div>
      <p className="mb-2.5 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}{authors.length ? <span className="ml-1.5 text-[13px] font-semibold text-[#8B95A1]">{authors.length}</span> : null}</p>
      {authors.length === 0 ? (
        <TCard className="px-5 py-6 text-center text-[13px] text-[#8B95A1]">{emptyText}</TCard>
      ) : (
        <TCard className="divide-y divide-[#F2F4F6]">
          {authors.map((a) => (
            <div key={`${a.role}::${a.name}`} className="flex items-center gap-3 px-5 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[13px] font-black text-[#0B46E8]">{a.name.slice(0, 1)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-[#191F28]">{a.name}</p>
                <p className="text-[12px] text-[#8B95A1]">{roleLabel(a.role)}</p>
              </div>
              <button type="button" onClick={() => unfollowAuthor(a)} className="shrink-0 rounded-lg bg-[#F2F4F6] px-3 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">
                팔로잉
              </button>
            </div>
          ))}
        </TCard>
      )}
    </div>
  );
}

function Item({ label, href, value }: { label: string; href?: string; value?: string }) {
  const inner = (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="flex-1 text-[14.5px] text-[#191F28]">{label}</span>
      {value ? <span className="text-[13px] text-[#8B95A1]">{value}</span> : null}
      {href ? <CaretRight className="h-4 w-4 text-[#C4CAD2]" /> : null}
    </div>
  );
  if (href) return <Link href={href} className="block transition hover:bg-[#F6F8FB]">{inner}</Link>;
  return inner;
}

export function SettingsScreen() {
  const { user, logout, getAccountUrl } = useAuthSession();
  const [pushOn, setPushOn] = useState(true);
  const [emailOn, setEmailOn] = useState(true);
  const following = useFollowing();

  const name = user?.realName || user?.name || "나";

  // 팔로우 스토어를 역할로 분리: PARTNER = 관심 회사, 그 외 = 팔로우한 사용자.
  const followedAuthors = following.map(parseAuthorKey).filter((a): a is FeedAuthor => a !== null);
  const followedCompanies = followedAuthors.filter((a) => a.role === "PARTNER");
  const followedUsers = followedAuthors.filter((a) => a.role !== "PARTNER");

  return (
    <TalentAppShell maxWidth="4xl">
      <TPageHeader title="계정 설정" />

      <div className="flex flex-col gap-4">
        {/* 프로필 요약 */}
        <TCard className="flex items-center gap-4 p-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[20px] font-black text-[#0B46E8]">{name.slice(0, 1)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold text-[#191F28]">{name}</p>
            {user?.email ? <p className="mt-0.5 truncate text-[13px] text-[#8B95A1]">{user.email}</p> : null}
          </div>
          <Link href={talentAppRoutes.profile} className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[13px] font-semibold text-[#4E5968] hover:bg-[#E5E8EB]">
            프로필 편집
          </Link>
        </TCard>

        {/* 관심 직무 */}
        <JobInterestCard variant="edit" />

        {/* 팔로우한 사용자 */}
        <FollowList title="팔로우한 사용자" emptyText="피드에서 관심 있는 사람을 팔로우해보세요." authors={followedUsers} />

        {/* 관심 회사 */}
        <FollowList title="관심 회사" emptyText="피드에서 관심 있는 회사를 팔로우해보세요." authors={followedCompanies} />

        {/* 알림 */}
        <div>
          <p className="mb-2.5 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">알림</p>
          <TCard className="divide-y divide-[#F2F4F6]">
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="flex-1 text-[14.5px] text-[#191F28]">추천 공고 알림</span>
              <Toggle on={pushOn} onChange={setPushOn} label="추천 공고 알림" />
            </div>
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="flex-1 text-[14.5px] text-[#191F28]">이메일 소식 받기</span>
              <Toggle on={emailOn} onChange={setEmailOn} label="이메일 소식 받기" />
            </div>
          </TCard>
        </div>

        {/* 계정 */}
        <div>
          <p className="mb-2.5 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">계정</p>
          <TCard className="divide-y divide-[#F2F4F6]">
            <Item label="계정 정보 관리" href={getAccountUrl()} />
            <Item label="개인정보처리방침" href="/legal/privacy" />
            <Item label="이용약관" href="/legal/terms" />
          </TCard>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-[#EEF1F5] bg-white py-4 text-[14px] font-semibold text-[#F04452] transition hover:bg-[#FFF5F5]"
        >
          <SignOut className="h-[18px] w-[18px]" /> 로그아웃
        </button>
      </div>
    </TalentAppShell>
  );
}
