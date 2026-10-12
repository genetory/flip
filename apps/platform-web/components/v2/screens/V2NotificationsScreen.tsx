"use client";

// v2 알림 — 기존 알림함(lib/talent/notifications)과 같은 데이터를 v2 모양으로.
// 칩으로 전체·내 활동·소식을 고르고, 오늘·최근 7일·이전으로 묶어 보여 준다. 안 읽은 건 파란 점.
import { useMemo, useState } from "react";
import Link from "next/link";
import { V2Shell } from "../V2Shell";
import { Chip, Masthead, Page, Row, Section } from "../ui";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { useNotifications, markAllNotificationsRead, markNotificationRead, type Notification } from "../../../lib/talent/notifications";
import { formatRelativeTime } from "../../../lib/talent/career-feed";

type Filter = "all" | "activity" | "update";

// 알림 링크는 기존 화면 주소로 쌓인다 — v2에 이미 있는 화면은 v2로 보낸다.
function toV2(href: string): string {
  if (href.startsWith("/talent/applications")) return "/v2/applications";
  if (href.startsWith("/talent/career/interviews")) return "/v2/interviews";
  if (/^\/talent\/jobs\/[^/?#]+/.test(href)) return href.replace(/^\/talent\/jobs/, "/v2/jobs");
  if (href === "/talent/jobs" || href.startsWith("/talent/jobs?")) return "/v2/jobs";
  if (href === "/talent/career") return "/v2/career";
  if (href === "/talent/home" || href === "/talent") return "/v2/home";
  return href;
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function V2NotificationsScreen() {
  const t = usePlatformT();
  const all = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");
  const [now] = useState(() => Date.now());
  const unread = all.filter((n) => n.unread).length;
  const list = useMemo(() => (filter === "all" ? all : all.filter((n) => (n.kind ?? "update") === filter)), [all, filter]);
  const groups = useMemo(() => {
    const today = startOfDay(now);
    const week = today - 6 * 86_400_000;
    const out: { key: string; title: string; items: Notification[] }[] = [
      { key: "today", title: t("오늘", "Today", "今天", "Hôm nay", "今日", "Hari ini"), items: list.filter((n) => n.createdAt >= today) },
      { key: "week", title: t("최근 7일", "Last 7 days", "最近7天", "7 ngày qua", "直近7日", "7 hari terakhir"), items: list.filter((n) => n.createdAt < today && n.createdAt >= week) },
      { key: "older", title: t("이전", "Earlier", "更早", "Trước đó", "それ以前", "Sebelumnya"), items: list.filter((n) => n.createdAt < week) }
    ];
    return out.filter((g) => g.items.length);
  }, [list, now, t]);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t("전체", "All", "全部", "Tất cả", "すべて", "Semua") },
    { key: "activity", label: t("내 활동", "My activity", "我的活动", "Hoạt động", "自分の活動", "Aktivitas") },
    { key: "update", label: t("소식", "Updates", "动态", "Tin tức", "お知らせ", "Kabar") }
  ];

  return (
    <V2Shell requireAuth>
      <Page>
        <Masthead
          eyebrow={t("알림", "Notifications", "通知", "Thông báo", "通知", "Notifikasi")}
          title={unread > 0 ? t(`안 읽은 알림 ${unread}개`, `${unread} unread`, `${unread} 条未读`, `${unread} chưa đọc`, `未読 ${unread}件`, `${unread} belum dibaca`) : t("새 알림을 다 읽었어요", "You're all caught up", "全部已读", "Bạn đã đọc hết", "すべて既読です", "Semua sudah dibaca")}
          lede={t("지원 상태·면접·메시지와 팔로우한 곳의 소식을 모아 보여 드려요.", "Applications, interviews, messages, and updates you follow — in one place.", "汇总申请状态、面试、消息和关注动态。", "Trạng thái ứng tuyển, phỏng vấn, tin nhắn và tin theo dõi.", "応募状況・面接・メッセージとフォローの新着をまとめます。", "Status lamaran, wawancara, pesan, dan kabar yang diikuti.")}
        />
        <div className="-mt-2 flex items-center gap-2 px-5 pb-6">
          {filters.map((f) => (
            <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
            </Chip>
          ))}
          {unread > 0 ? (
            <button type="button" onClick={() => markAllNotificationsRead()} className="ml-auto shrink-0 whitespace-nowrap text-[14px] font-semibold text-[color:var(--v2-accent)]">
              {t("모두 읽음", "Read all", "全部已读", "Đọc hết", "全既読", "Baca semua")}
            </button>
          ) : null}
        </div>

        {groups.length ? (
          groups.map((g) => (
            <Section key={g.key} title={g.title}>
              <ul className="flex flex-col">
                {g.items.map((n) => (
                  <li key={n.id}>
                    <NotiRow t={t} n={n} />
                  </li>
                ))}
              </ul>
            </Section>
          ))
        ) : (
          <EmptyState t={t} filter={filter} />
        )}
      </Page>
    </V2Shell>
  );
}

function NotiRow({ t, n }: { t: PlatformT; n: Notification }) {
  return (
    <Link
      href={toV2(n.href)}
      onClick={() => markNotificationRead(n.id)}
      className="-mx-2 flex w-[calc(100%+16px)] items-start gap-3.5 rounded-2xl px-2 py-3.5 transition active:bg-[color:var(--v2-band)] md:hover:bg-[color:var(--v2-fill)]"
    >
      <span className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[20px] ${n.kind === "activity" ? "bg-[#edf1fd]" : "bg-[color:var(--v2-band)]"}`} aria-hidden>
        {n.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={`min-w-0 flex-1 truncate text-[16px] leading-[1.45] ${n.unread ? "font-bold text-[color:var(--v2-ink)]" : "font-semibold text-[color:var(--v2-ink-3)]"}`}>{n.title}</span>
          {n.unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--v2-accent)]" aria-label={t("안 읽음", "Unread", "未读", "Chưa đọc", "未読", "Belum dibaca")} /> : null}
        </span>
        {n.body ? <span className="mt-0.5 line-clamp-2 block break-keep text-[14px] leading-[1.55] text-[color:var(--v2-muted)]">{n.body}</span> : null}
        <span className="mt-1 block text-[13px] text-[color:var(--v2-faint)]">{formatRelativeTime(n.createdAt, undefined, t)}</span>
      </span>
    </Link>
  );
}

function EmptyState({ t, filter }: { t: PlatformT; filter: Filter }) {
  const msg =
    filter === "activity"
      ? t("지원·팔로우·저장 같은 활동이 여기 쌓여요.", "Applications, follows, and saves show up here.", "申请、关注、收藏等活动会显示在这里。", "Ứng tuyển, theo dõi, lưu sẽ hiện ở đây.", "応募・フォロー・保存がここに表示されます。", "Lamaran, follow, dan simpan muncul di sini.")
      : filter === "update"
        ? t("팔로우한 사람·회사의 새 소식이 여기 도착해요.", "Updates from people and companies you follow arrive here.", "关注的人和公司的新动态会出现在这里。", "Tin mới từ người/công ty bạn theo dõi.", "フォローした人・会社の新着が届きます。", "Kabar dari yang kamu ikuti muncul di sini.")
        : t("새 소식이 생기면 여기에서 알려 드릴게요.", "We'll let you know here when something happens.", "有新动态时会在这里通知你。", "Chúng tôi sẽ báo tại đây.", "動きがあればここでお知らせします。", "Kami beri tahu di sini.");
  return (
    <>
      <div className="px-5 pb-8">
        <div className="rounded-3xl bg-[color:var(--v2-fill)] px-5 py-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[26px]" aria-hidden>
            🔔
          </span>
          <p className="mt-4 text-[17px] font-bold text-[color:var(--v2-ink)]">{t("아직 알림이 없어요", "No notifications yet", "还没有通知", "Chưa có thông báo", "まだ通知はありません", "Belum ada notifikasi")}</p>
          <p className="mt-1 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{msg}</p>
        </div>
      </div>
      {filter !== "update" ? (
        <Section title={t("이것부터 해 보세요", "Try these first", "先试试这些", "Thử những việc này", "まずはこれから", "Coba ini dulu")}>
          <Row href="/v2/career" lead="📝" title={t("이력서 완성하기", "Complete your resume", "完善简历", "Hoàn thành CV", "履歴書を完成", "Lengkapi resume")} meta={t("서류가 준비되면 바로 지원할 수 있어요", "Apply right away once ready", "准备好即可投递", "Sẵn sàng là ứng tuyển ngay", "準備できればすぐ応募", "Siap lalu langsung melamar")} />
          <Row href="/v2/jobs" lead="💼" title={t("추천 공고 보기", "See recommended jobs", "查看推荐职位", "Xem việc gợi ý", "おすすめ求人を見る", "Lihat rekomendasi")} meta={t("관심 직무에 맞는 공고", "Matching your interests", "符合兴趣的职位", "Phù hợp sở thích", "関心職種に合う求人", "Sesuai minat")} />
        </Section>
      ) : null}
    </>
  );
}
