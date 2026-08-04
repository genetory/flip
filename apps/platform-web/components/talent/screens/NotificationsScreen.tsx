"use client";

// 알림 — 내 활동(지원·팔로우·저장)과 소식(팔로잉 새 글·회사 새 공고)을 함께 모아본다.
// 언더라인 탭(포지션 탐색과 동일) + 리스트 형식. 동적 스토어(mock).
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useNotifications, markAllNotificationsRead, type Notification, type NotificationKind } from "../../../lib/talent/notifications";
import { formatRelativeTime } from "../../../lib/talent/career-feed";

type Filter = "all" | "activity" | "update";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "activity", label: "내 활동" },
  { key: "update", label: "소식" }
];

// 동적 알림이 없을 때 노출할 추천(정적).
const SUGGESTIONS = [
  { id: "tip-resume", emoji: "📝", title: "이력서를 완성해보세요", body: "기본 정보를 등록하면 이력서를 만들 수 있어요.", href: talentAppRoutes.resume },
  { id: "tip-jobs", emoji: "💼", title: "새로운 추천 공고가 있어요", body: "관심 직무에 맞는 공고를 확인해보세요.", href: talentAppRoutes.jobs }
];

export function NotificationsScreen() {
  const dynamic = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");

  // 화면을 열면 모두 읽음 처리(벨 배지 클리어).
  useEffect(() => {
    markAllNotificationsRead();
  }, []);

  const unread = useMemo(() => dynamic.filter((n) => n.unread).length, [dynamic]);

  const filtered = useMemo(
    () => (filter === "all" ? dynamic : dynamic.filter((n) => (n.kind ?? "update") === filter)),
    [dynamic, filter]
  );

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-5">
        <div>
          <TalentBackButton className="mb-3" />
          <div className="flex items-end justify-between gap-3">
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">알림</h1>
            {unread > 0 ? <span className="text-[12.5px] font-bold text-[#0B46E8]">안 읽음 {unread}</span> : null}
          </div>
        </div>

        {/* 카테고리 탭 — 포지션 탐색과 동일한 언더라인 탭 바 */}
        <div className="flex gap-6">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-current={active ? "page" : undefined}
                className={`relative pb-1.5 text-[15px] font-bold transition ${active ? "text-[#191F28]" : "text-[#B0B8C1] hover:text-[#8B95A1]"}`}
              >
                {f.label}
                {active ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#0B46E8]" /> : null}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="flex flex-col overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
            {filtered.map((n, i) => (
              <Row key={n.id} n={n} last={i === filtered.length - 1} />
            ))}
          </div>
        )}
      </div>
    </TalentAppShell>
  );
}

const KIND_STYLE: Record<NotificationKind, { dot: string; text: string; label: string; avatar: string }> = {
  activity: { dot: "bg-[#0B46E8]", text: "text-[#8B95A1]", label: "내 활동", avatar: "bg-[#EDF1FD]" },
  update: { dot: "bg-[#12B76A]", text: "text-[#8B95A1]", label: "소식", avatar: "bg-[#F2F4F6]" }
};

function Row({ n, last }: { n: Notification; last: boolean }) {
  const s = KIND_STYLE[n.kind] ?? KIND_STYLE.update;
  return (
    <Link
      href={n.href}
      className={`flex items-start gap-3.5 px-4 py-4 transition ${n.unread ? "bg-[#F5F8FF] hover:bg-[#EEF3FE]" : "hover:bg-[#F6F8FB]"} ${last ? "" : "border-b border-[#F2F4F6]"}`}
    >
      <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[19px] ${s.avatar}`} aria-hidden>
        {n.emoji}
        {n.unread ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#0B46E8]" aria-label="안 읽음" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${s.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
          <span className="ml-auto shrink-0 text-[11.5px] text-[#B0B8C1]">{formatRelativeTime(n.createdAt)}</span>
        </div>
        <p className={`mt-1.5 truncate text-[14.5px] ${n.unread ? "font-bold text-[#191F28]" : "font-semibold text-[#4E5968]"}`}>{n.title}</p>
        <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{n.body}</p>
      </div>
      <CaretRight className="mt-1 h-4 w-4 shrink-0 text-[#C4CAD2]" />
    </Link>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const msg =
    filter === "activity"
      ? "지원·팔로우·저장 같은 활동이 여기 쌓여요."
      : filter === "update"
        ? "팔로우한 사람·회사의 새 소식이 여기 도착해요."
        : "활동이 생기면 여기에서 알려드릴게요.";
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>🔔</span>
        <p className="mt-3 text-[15px] font-bold text-[#191F28]">새로운 알림이 없어요</p>
        <p className="mt-1 text-[13px] text-[#8B95A1]">{msg}</p>
      </div>
      {filter !== "update" ? (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
          {SUGGESTIONS.map((sug, i) => (
            <Link
              key={sug.id}
              href={sug.href}
              className={`flex items-start gap-3.5 px-4 py-4 transition hover:bg-[#F6F8FB] ${i === SUGGESTIONS.length - 1 ? "" : "border-b border-[#F2F4F6]"}`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2F4F6] text-[19px]" aria-hidden>{sug.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-bold text-[#191F28]">{sug.title}</p>
                <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{sug.body}</p>
              </div>
              <CaretRight className="mt-1 h-4 w-4 shrink-0 text-[#C4CAD2]" />
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
