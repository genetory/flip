"use client";

// 알림 — 내 활동(지원·팔로우·저장)과 소식(팔로잉 새 글·회사 새 공고)을 함께 모아본다.
// 카테고리 필터 + 시간대(오늘/지난 7일/이전) 그룹으로 알림함답게 구성. 동적 스토어(mock).
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

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

type Bucket = "today" | "week" | "earlier";
const BUCKET_LABEL: Record<Bucket, string> = { today: "오늘", week: "지난 7일", earlier: "이전" };
const BUCKET_ORDER: Bucket[] = ["today", "week", "earlier"];

function bucketOf(ts: number, todayStart: number, now: number): Bucket {
  if (ts >= todayStart) return "today";
  if (now - ts < 7 * 24 * 60 * 60 * 1000) return "week";
  return "earlier";
}

export function NotificationsScreen() {
  const dynamic = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");

  // 화면을 열면 모두 읽음 처리(벨 배지 클리어).
  useEffect(() => {
    markAllNotificationsRead();
  }, []);

  const counts = useMemo(() => {
    const unread = dynamic.filter((n) => n.unread).length;
    const activity = dynamic.filter((n) => n.kind === "activity").length;
    const update = dynamic.filter((n) => (n.kind ?? "update") === "update").length;
    return { unread, activity, update, all: dynamic.length };
  }, [dynamic]);

  const filtered = useMemo(
    () => (filter === "all" ? dynamic : dynamic.filter((n) => (n.kind ?? "update") === filter)),
    [dynamic, filter]
  );

  const groups = useMemo(() => {
    const todayStart = startOfToday();
    const now = Date.now();
    const map: Record<Bucket, Notification[]> = { today: [], week: [], earlier: [] };
    for (const n of filtered) map[bucketOf(n.createdAt, todayStart, now)].push(n);
    return BUCKET_ORDER.map((b) => ({ bucket: b, items: map[b] })).filter((g) => g.items.length > 0);
  }, [filtered]);

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-6">
        <div>
          <TalentBackButton className="mb-3" />
          <div className="flex items-end justify-between gap-3">
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">알림</h1>
            {counts.unread > 0 ? (
              <span className="text-[12.5px] font-bold text-[#0B46E8]">안 읽음 {counts.unread}</span>
            ) : null}
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const n = f.key === "all" ? counts.all : f.key === "activity" ? counts.activity : counts.update;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold transition ${
                  active ? "bg-[#0B1227] text-white" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]"
                }`}
              >
                {f.label}
                {n > 0 ? <span className={`ml-1 ${active ? "text-white/70" : "text-[#B0B8C1]"}`}>{n}</span> : null}
              </button>
            );
          })}
        </div>

        {groups.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="flex flex-col gap-7">
            {groups.map((g) => (
              <section key={g.bucket}>
                <h2 className="mb-2.5 px-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#B0B8C1]">{BUCKET_LABEL[g.bucket]}</h2>
                <div className="flex flex-col gap-2">
                  {g.items.map((n) => (
                    <Row key={n.id} n={n} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </TalentAppShell>
  );
}

const KIND_STYLE: Record<NotificationKind, { chip: string; label: string; avatar: string }> = {
  activity: { chip: "bg-[#EDF1FD] text-[#0B46E8]", label: "내 활동", avatar: "bg-[#EDF1FD]" },
  update: { chip: "bg-[#EAF6EE] text-[#12B76A]", label: "소식", avatar: "bg-[#F2F4F6]" }
};

function Row({ n }: { n: Notification }) {
  const s = KIND_STYLE[n.kind] ?? KIND_STYLE.update;
  return (
    <Link
      href={n.href}
      className={`flex items-start gap-3.5 rounded-2xl border p-4 transition ${
        n.unread ? "border-[#E4EDFB] bg-[#F5F8FF] hover:border-[#0B46E8]/40" : "border-[#EEF1F5] bg-white hover:border-[#D7DCE3]"
      }`}
    >
      <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[19px] ${s.avatar}`} aria-hidden>
        {n.emoji}
        {n.unread ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#0B46E8]" aria-label="안 읽음" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ${s.chip}`}>{s.label}</span>
          <span className="ml-auto shrink-0 text-[11.5px] text-[#B0B8C1]">{formatRelativeTime(n.createdAt)}</span>
        </div>
        <p className="mt-1.5 truncate text-[14.5px] font-bold text-[#191F28]">{n.title}</p>
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
        <div>
          <h2 className="mb-2.5 px-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#B0B8C1]">이런 건 어때요</h2>
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((s) => (
              <Link key={s.id} href={s.href} className="flex items-start gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2F4F6] text-[19px]" aria-hidden>{s.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-bold text-[#191F28]">{s.title}</p>
                  <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{s.body}</p>
                </div>
                <CaretRight className="mt-1 h-4 w-4 shrink-0 text-[#C4CAD2]" />
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
