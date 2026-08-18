"use client";

// 파트너 알림 — 서버 알림(지원·메시지·면접 등) 목록. 클릭 시 개별 읽음 + '모두 읽음' 버튼.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CaretRight, Checks } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TLoading, TError } from "../../talent/ui/primitives";
import { getMyNotifications, markAllServerNotificationsRead, markServerNotificationRead, type ServerNotification } from "../../../lib/member-profile-client";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { usePlatformT } from "../../../lib/i18n";

function emojiForType(type: string): string {
  if (type.startsWith("INTERVIEW")) return "🗓️";
  if (type.includes("MOCK_INTERVIEW")) return "🎤";
  if (type.includes("COMMENT") || type.includes("MESSAGE")) return "💬";
  if (type.includes("APPLICATION") || type.includes("APPLICANT")) return "🧑‍💼";
  if (type.startsWith("POSITION")) return "📋";
  return "🔔";
}

// 서버 알림의 linkPath(레거시 /dashboard/partner/* 포함)를 현재 파트너 앱(/partner/*) 라우트로 매핑.
// 지원자 상세는 복합 id가 필요해 클라이언트에서 특정할 수 없으므로 목록으로 보낸다.
function resolveNotifLink(n: ServerNotification): string | null {
  const lp = n.linkPath ?? "";
  if (lp.startsWith("/partner/")) return lp;
  if (lp.startsWith("/dashboard/partner/positions")) return lp.replace("/dashboard/partner", "/partner");
  // 특정 지원자로 딥링크(뒤에 id 가 붙은 경우) — id 를 보존해 상세로. (상세 엔드포인트가 applicationId 도 해석)
  if (/^\/dashboard\/partner\/applicants\/.+/.test(lp)) return lp.replace("/dashboard/partner", "/partner");
  if (lp.startsWith("/dashboard/partner/")) return partnerRoutes.applicants;
  if (n.type.startsWith("POSITION") || n.type.includes("MOCK_INTERVIEW")) return partnerRoutes.positions;
  if (/APPLIC|INTERVIEW|CANDIDATE|CONNECTION|MESSAGE|COMMENT/.test(n.type)) return partnerRoutes.applicants;
  return null;
}

export function PartnerNotificationsScreen() {
  const t = usePlatformT();
  const [items, setItems] = useState<ServerNotification[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  function load() {
    setStatus("loading");
    getMyNotifications(50)
      .then(({ items }) => {
        setItems(items);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  const unread = useMemo(() => (items ?? []).filter((n) => n.readAt === null).length, [items]);

  // 클릭 시 개별 읽음(낙관적 업데이트 + 서버 반영).
  function readOne(id: string) {
    setItems((prev) => (prev ? prev.map((n) => (n.id === id && n.readAt === null ? { ...n, readAt: new Date().toISOString() } : n)) : prev));
    void markServerNotificationRead(id).catch(() => {});
  }

  function readAll() {
    setItems((prev) => (prev ? prev.map((n) => (n.readAt === null ? { ...n, readAt: new Date().toISOString() } : n)) : prev));
    void markAllServerNotificationsRead().catch(() => {});
  }

  return (
    <PartnerAppShell>
      <div className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t("알림", "Notifications", "通知", "Thông báo", "通知", "Notifikasi")}{unread > 0 ? <span className="ml-1.5 align-middle text-[15px] font-black text-[#0B46E8]">{unread}</span> : null}</h1>
            <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t("지원·메시지·면접 등 소식을 확인해요.", "Check updates like applications, messages, and interviews.", "查看申请、消息、面试等动态。", "Xem cập nhật về ứng tuyển, tin nhắn, phỏng vấn.", "応募・メッセージ・面接などのお知らせを確認します。", "Lihat kabar seperti lamaran, pesan, dan wawancara.")}</p>
          </div>
          {unread > 0 ? (
            <button type="button" onClick={readAll} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]">
              <Checks className="h-4 w-4" weight="bold" /> {t("모두 읽음", "Read all", "全部已读", "Đọc tất cả", "すべて既読", "Baca semua")}
            </button>
          ) : null}
        </div>

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" ? (
          (items ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>🔔</span>
              <p className="mt-3 text-[15px] font-bold text-[#191F28]">{t("새로운 알림이 없어요", "No new notifications", "没有新通知", "Không có thông báo mới", "新しい通知はありません", "Tidak ada notifikasi baru")}</p>
              <p className="mt-1 text-[13px] text-[#8B95A1]">{t("지원·메시지가 오면 여기에서 알려드릴게요.", "We'll let you know here when applications or messages arrive.", "有申请或消息时会在这里通知您。", "Chúng tôi sẽ báo tại đây khi có ứng tuyển hoặc tin nhắn.", "応募やメッセージが届くとここでお知らせします。", "Kami beri tahu di sini saat ada lamaran atau pesan.")}</p>
            </div>
          ) : (
            <div className="flex flex-col overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
              {(items ?? []).map((n, i) => (
                <NotificationRow key={n.id} n={n} last={i === (items ?? []).length - 1} onRead={() => readOne(n.id)} />
              ))}
            </div>
          )
        ) : null}
      </div>
    </PartnerAppShell>
  );
}

function NotificationRow({ n, last, onRead }: { n: ServerNotification; last: boolean; onRead: () => void }) {
  const href = resolveNotifLink(n);
  const inner = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[19px]" aria-hidden>{emojiForType(n.type)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[14.5px] font-bold text-[#191F28]">{n.title}</p>
          <span className="ml-auto shrink-0 text-[11.5px] text-[#B0B8C1]">{formatRelativeTime(new Date(n.createdAt).getTime())}</span>
        </div>
        {n.message ? <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{n.message}</p> : null}
      </div>
      {href ? <CaretRight className="mt-1 h-4 w-4 shrink-0 text-[#C4CAD2]" /> : null}
    </>
  );
  const base = `flex items-start gap-3.5 px-4 py-4 ${last ? "" : "border-b border-[#F2F4F6]"} ${n.readAt === null ? "bg-[#F5F8FF]" : ""}`;
  if (href) {
    return (
      <Link href={href} onClick={onRead} className={`${base} transition hover:bg-[#F6F8FB]`}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onRead} className={`${base} w-full text-left transition hover:bg-[#F6F8FB]`}>
      {inner}
    </button>
  );
}
