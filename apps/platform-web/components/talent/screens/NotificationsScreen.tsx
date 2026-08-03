"use client";

// 알림 — 팔로잉한 사람의 새 글 등 활동 알림. 동적 스토어(mock) + 온보딩 팁.
import { useEffect } from "react";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useNotifications, markAllNotificationsRead } from "../../../lib/talent/notifications";
import { formatRelativeTime } from "../../../lib/talent/career-feed";

interface Noti {
  id: string;
  emoji: string;
  title: string;
  body: string;
  time: string;
  href: string;
  unread: boolean;
}

// 온보딩 팁(정적) — 동적 알림이 없을 때도 화면이 비지 않게 하단에 노출.
const ONBOARDING_TIPS: Noti[] = [
  { id: "tip-resume", emoji: "📝", title: "이력서를 완성해보세요", body: "기본 정보를 등록하면 이력서를 만들 수 있어요.", time: "", href: talentAppRoutes.resumes, unread: false },
  { id: "tip-jobs", emoji: "💼", title: "새로운 추천 공고가 있어요", body: "관심 직무에 맞는 공고를 확인해보세요.", time: "", href: talentAppRoutes.jobs, unread: false },
  { id: "tip-note", emoji: "✨", title: "AI 커리어 노트를 시작해보세요", body: "오늘 있었던 일을 남기면 이력서로 정리돼요.", time: "", href: talentAppRoutes.chat, unread: false }
];

export function NotificationsScreen() {
  const dynamic = useNotifications();

  // 화면을 열면 모두 읽음 처리(벨 배지 클리어).
  useEffect(() => {
    markAllNotificationsRead();
  }, []);

  const items: Noti[] = [
    ...dynamic.map((n) => ({
      id: n.id,
      emoji: n.emoji,
      title: n.title,
      body: n.body,
      time: formatRelativeTime(n.createdAt),
      href: n.href,
      unread: n.unread
    })),
    ...ONBOARDING_TIPS
  ];

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-5">
        <div>
          <TalentBackButton className="mb-3" />
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">알림</h1>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>🔔</span>
            <p className="mt-3 text-[15px] font-bold text-[#191F28]">새로운 알림이 없어요</p>
            <p className="mt-1 text-[13px] text-[#8B95A1]">활동이 생기면 여기에서 알려드릴게요.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                className={`flex items-start gap-3.5 rounded-2xl border p-4 transition ${
                  n.unread ? "border-[#E4EDFB] bg-[#F5F8FF] hover:border-[#0B46E8]/40" : "border-[#EEF1F5] bg-white hover:border-[#D7DCE3]"
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[18px]" aria-hidden>{n.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[14.5px] font-bold text-[#191F28]">{n.title}</p>
                    {n.unread ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B46E8]" aria-label="안 읽음" /> : null}
                  </div>
                  <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{n.body}</p>
                  <p className="mt-1 text-[11.5px] text-[#B0B8C1]">{n.time}</p>
                </div>
                <CaretRight className="mt-1 h-4 w-4 shrink-0 text-[#C4CAD2]" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </TalentAppShell>
  );
}
