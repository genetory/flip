"use client";

// Career Launch 알림함 — 프로그램(주차 열림·세미나·결과물·완주) 관련 알림만 모아본다.
// talent/partner 알림과 별개 스토어. career-launch 크롬(헤더·푸터) 사용.
import Link from "next/link";
import { ArrowLeft, CaretRight, Checks } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "./CareerLaunchHeader";
import { LaunchAmbientBackground } from "./LaunchAmbientBackground";
import { AplyFooter } from "../AplyFooter";
import { Reveal } from "../site/Reveal";
import { useLaunchT } from "../../lib/launch/i18n";
import {
  useLaunchNotifications,
  markAllLaunchNotificationsRead,
  markLaunchNotificationRead,
  type LaunchNotification
} from "../../lib/launch/notifications";

export function LaunchNotificationsScreen() {
  const t = useLaunchT();
  const items = useLaunchNotifications();
  const unread = items.filter((n) => n.unread).length;

  return (
    <div className="isolate flex min-h-screen flex-col bg-white">
      <LaunchAmbientBackground />
      <CareerLaunchHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[880px] px-5 pb-24 pt-6 md:pt-10">
          <Reveal>
            <Link href="/career-launch/dashboard" className="mb-4 inline-flex items-center gap-1 text-[15px] font-medium text-[color:var(--v2-faint)] transition hover:text-[color:var(--v2-ink-3)]">
              <ArrowLeft className="h-4 w-4" weight="bold" />
              {t("대시보드", "Dashboard", "仪表盘", "Bảng điều khiển", "ダッシュボード", "Dasbor")}
            </Link>
            <div className="flex items-end justify-between gap-3">
              <h1 className="text-[26px] font-bold leading-[1.38] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[30px]">
                {t("알림", "Notifications", "通知", "Thông báo", "通知", "Notifikasi")}
                {unread > 0 ? <span className="ml-1.5 align-middle text-[18px] font-bold text-[color:var(--v2-accent)]">{unread}</span> : null}
              </h1>
              {unread > 0 ? (
                <button
                  type="button"
                  onClick={() => markAllLaunchNotificationsRead()}
                  className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-[color:var(--v2-accent-weak)] px-3.5 text-[14px] font-semibold text-[color:var(--v2-accent)] transition hover:opacity-80"
                >
                  <Checks className="h-4 w-4" weight="bold" /> {t("모두 읽음", "Mark all read", "全部已读", "Đánh dấu đã đọc", "すべて既読", "Tandai dibaca")}
                </button>
              ) : null}
            </div>

            <div className="mt-5">
              {items.length === 0 ? (
                <div className="rounded-3xl bg-[color:var(--v2-fill)] px-6 py-12 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--v2-band)] text-[22px]" aria-hidden>🔔</span>
                  <p className="mt-4 text-[17px] font-bold text-[color:var(--v2-ink)]">{t("새로운 알림이 없어요", "No notifications yet", "暂无通知", "Chưa có thông báo", "通知はまだありません", "Belum ada notifikasi")}</p>
                  <p className="mt-1.5 text-[15px] leading-[1.6] text-[color:var(--v2-faint)]">{t("주차가 열리거나 세미나 일정이 잡히면 여기로 알려드려요.", "We'll let you know here when a week opens or a seminar is scheduled.", "有新周开放或研讨会安排时，会在此通知你。", "Chúng tôi sẽ báo ở đây khi có tuần mới hoặc lịch hội thảo.", "週が開いたりセミナーが決まるとここでお知らせします。", "Kami akan memberi tahu di sini saat minggu baru dibuka atau seminar dijadwalkan.")}</p>
                </div>
              ) : (
                <div className="-mx-2 flex flex-col">
                  {items.map((n, i) => (
                    <Row key={n.id} n={n} last={i === items.length - 1} rel={rel(n.createdAt, t)} />
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}

function Row({ n, last, rel }: { n: LaunchNotification; last: boolean; rel: string }) {
  const cls = `flex items-start gap-3.5 rounded-2xl px-2 py-3.5 transition active:bg-[color:var(--v2-band)] ${n.unread ? "bg-[color:var(--v2-accent-weak)]/60 md:hover:bg-[color:var(--v2-accent-weak)]" : "md:hover:bg-[color:var(--v2-fill)]"} ${last ? "" : "mb-1"}`;
  const inner = (
    <>
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--v2-band)] text-[20px]" aria-hidden>
        {n.emoji}
        {n.unread ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[color:var(--v2-accent)]" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="ml-auto shrink-0 text-[13px] text-[color:var(--v2-faint)]">{rel}</span>
        </div>
        <p className={`mt-0.5 truncate text-[17px] leading-[1.45] ${n.unread ? "font-bold text-[color:var(--v2-ink)]" : "font-semibold text-[color:var(--v2-ink-3)]"}`}>{n.title}</p>
        <p className="mt-0.5 break-keep text-[14px] leading-[1.5] text-[color:var(--v2-muted)]">{n.body}</p>
      </div>
      <CaretRight className="mt-4 h-4 w-4 shrink-0 text-[color:var(--v2-faint)]" />
    </>
  );
  // 외부 링크(설문 폼 등)는 새 탭으로.
  if (n.external) {
    return (
      <a href={n.href} target="_blank" rel="noopener noreferrer" onClick={() => markLaunchNotificationRead(n.id)} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={n.href} onClick={() => markLaunchNotificationRead(n.id)} className={cls}>
      {inner}
    </Link>
  );
}

// 상대 시간 — 언어별 간단 표기.
function rel(ts: number, t: ReturnType<typeof useLaunchT>): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return t("방금", "just now", "刚刚", "vừa xong", "たった今", "baru saja");
  if (m < 60) return t(`${m}분 전`, `${m}m ago`, `${m}分钟前`, `${m} phút trước`, `${m}分前`, `${m} mnt lalu`);
  const h = Math.floor(m / 60);
  if (h < 24) return t(`${h}시간 전`, `${h}h ago`, `${h}小时前`, `${h} giờ trước`, `${h}時間前`, `${h} jam lalu`);
  const d = Math.floor(h / 24);
  return t(`${d}일 전`, `${d}d ago`, `${d}天前`, `${d} ngày trước`, `${d}日前`, `${d} hari lalu`);
}
