"use client";

// 파트너 알림 — 서버 알림(지원·메시지·면접 등) 목록. 열면 모두 읽음 처리.
import { useEffect, useState } from "react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TLoading, TError } from "../../talent/ui/primitives";
import { getMyNotifications, markAllServerNotificationsRead, type ServerNotification } from "../../../lib/member-profile-client";
import { formatRelativeTime } from "../../../lib/talent/career-feed";

function emojiForType(type: string): string {
  if (type.startsWith("INTERVIEW")) return "🗓️";
  if (type.includes("COMMENT") || type.includes("MESSAGE")) return "💬";
  if (type.includes("APPLICATION") || type.includes("APPLICANT")) return "🧑‍💼";
  if (type.startsWith("POSITION")) return "📋";
  return "🔔";
}

export function PartnerNotificationsScreen() {
  const [items, setItems] = useState<ServerNotification[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  function load() {
    setStatus("loading");
    getMyNotifications(50)
      .then(({ items }) => {
        setItems(items);
        setStatus("ready");
        void markAllServerNotificationsRead().catch(() => {});
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <PartnerAppShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">알림</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">지원·메시지·면접 등 소식을 확인해요.</p>
        </div>

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" ? (
          (items ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>🔔</span>
              <p className="mt-3 text-[15px] font-bold text-[#191F28]">새로운 알림이 없어요</p>
              <p className="mt-1 text-[13px] text-[#8B95A1]">지원·메시지가 오면 여기에서 알려드릴게요.</p>
            </div>
          ) : (
            <div className="flex flex-col overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
              {(items ?? []).map((n, i) => (
                <div key={n.id} className={`flex items-start gap-3.5 px-4 py-4 ${i === (items ?? []).length - 1 ? "" : "border-b border-[#F2F4F6]"} ${n.readAt === null ? "bg-[#F5F8FF]" : ""}`}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[19px]" aria-hidden>{emojiForType(n.type)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[14.5px] font-bold text-[#191F28]">{n.title}</p>
                      <span className="ml-auto shrink-0 text-[11.5px] text-[#B0B8C1]">{formatRelativeTime(new Date(n.createdAt).getTime())}</span>
                    </div>
                    {n.message ? <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{n.message}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}
      </div>
    </PartnerAppShell>
  );
}
