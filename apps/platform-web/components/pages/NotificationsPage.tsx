"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { readAccessToken } from "../../lib/auth-client";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  linkPath: string | null;
  readAt: string | null;
  createdAt: string;
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

const TYPE_LABEL: Record<string, { label: string; emoji: string }> = {
  APPLICATION_STATUS_CHANGED: { label: "지원 상태", emoji: "📌" },
  INTERVIEW_SLOTS_PROPOSED: { label: "면접 일정", emoji: "🗓" },
  INTERVIEW_SLOT_SELECTED: { label: "면접 일정", emoji: "🗓" },
  ASSIGNMENT_CREATED: { label: "과제", emoji: "📝" },
  ASSIGNMENT_SUBMITTED: { label: "과제", emoji: "📝" },
  ASSIGNMENT_REVIEWED: { label: "과제 피드백", emoji: "💬" },
  ISSUE_REPORTED: { label: "이슈", emoji: "⚠️" },
  SCHOOL_CREDIT_REQUESTED: { label: "학점 인정", emoji: "🎓" },
  SCHOOL_CREDIT_REVIEWED: { label: "학점 인정", emoji: "🎓" },
  APPLICATION_COMMENT_FROM_CANDIDATE: { label: "댓글", emoji: "💬" },
  APPLICATION_COMMENT_FROM_COMPANY: { label: "댓글", emoji: "💬" },
  APPLICATION_WITHDRAWN: { label: "지원 철회", emoji: "🚫" }
};

export function NotificationsPage() {
  const { isReady, isAuthenticated } = useAuthSession();
  const { locale } = useLanguage();
  const tr = (ko: string, en: string, zh: string = en, vi: string = en, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;

  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/members/me/notifications?limit=100`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { items?: Notification[] };
      setItems(payload.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알림을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    void load();
  }, [isReady, isAuthenticated, load]);

  const filtered = useMemo(
    () => (filter === "UNREAD" ? items.filter((it) => !it.readAt) : items),
    [items, filter]
  );

  const unreadCount = useMemo(() => items.filter((it) => !it.readAt).length, [items]);

  async function markRead(id: string) {
    try {
      await fetch(`${apiBase()}/members/me/notifications/${id}/read`, {
        method: "PATCH",
        headers: authHeaders()
      });
      const now = new Date().toISOString();
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, readAt: now } : it)));
    } catch {
      // silent
    }
  }

  async function markAllRead() {
    setUpdating(true);
    try {
      await fetch(`${apiBase()}/members/me/notifications/read-all`, {
        method: "PATCH",
        headers: authHeaders()
      });
      const now = new Date().toISOString();
      setItems((prev) => prev.map((it) => (it.readAt ? it : { ...it, readAt: now })));
    } catch {
      // silent
    } finally {
      setUpdating(false);
    }
  }

  if (isReady && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-2xl font-bold">{tr("로그인이 필요합니다", "Sign in required", "需要登录", "Cần đăng nhập", "ログインが必要です", "Diperlukan masuk")}</h1>
          <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            {tr("로그인하기", "Sign in", "登录", "Đăng nhập", "ログイン", "Masuk")}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {tr("알림", "Notifications", "通知", "Thông báo", "通知", "Notifikasi")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {tr("최근 받은 알림을 한곳에서 확인하세요.", "All your recent notifications in one place.", "在此查看您最近收到的所有通知。", "Xem tất cả thông báo gần đây của bạn.", "最近の通知をまとめて確認できます。", "Semua notifikasi terbaru Anda di satu tempat.")}
            </p>
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={updating}
              className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
            >
              {tr("모두 읽음 처리", "Mark all as read", "全部标记为已读", "Đánh dấu tất cả đã đọc", "すべて既読にする", "Tandai semua sudah dibaca")}
            </button>
          ) : null}
        </header>

        <div className="mb-4 flex gap-2">
          {(["ALL", "UNREAD"] as const).map((key) => {
            const active = filter === key;
            const label = key === "ALL"
              ? tr("전체", "All", "全部", "Tất cả", "すべて", "Semua")
              : tr("읽지 않음", "Unread", "未读", "Chưa đọc", "未読", "Belum dibaca");
            const count = key === "ALL" ? items.length : unreadCount;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  active ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {label} <span className="ml-1 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">{tr("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}</p>
        ) : error ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-md border border-border/50 bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
            {filter === "UNREAD"
              ? tr("읽지 않은 알림이 없습니다.", "No unread notifications.", "没有未读通知。", "Không có thông báo chưa đọc.", "未読の通知はありません。", "Tidak ada notifikasi yang belum dibaca.")
              : tr("아직 받은 알림이 없습니다.", "No notifications yet.", "暂无通知。", "Chưa có thông báo nào.", "まだ通知はありません。", "Belum ada notifikasi.")}
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((it) => {
              const meta = TYPE_LABEL[it.type] ?? { label: it.type, emoji: "🔔" };
              const unread = !it.readAt;
              const inner = (
                <div
                  className={`rounded-2xl border p-4 transition ${
                    unread ? "border-primary/30 bg-primary/5" : "border-border/60 bg-card hover:border-foreground/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        <span>{meta.emoji}</span> <span className="uppercase tracking-wide">{meta.label}</span>
                      </p>
                      <p className={`mt-1 text-sm ${unread ? "font-semibold text-foreground" : "text-foreground"}`}>
                        {it.title}
                      </p>
                      {it.message ? (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{it.message}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatRelative(it.createdAt)} · {formatDateTime(it.createdAt)}
                      </p>
                    </div>
                    {unread ? <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" aria-hidden /> : null}
                  </div>
                </div>
              );
              return (
                <li key={it.id}>
                  {it.linkPath ? (
                    <Link
                      href={it.linkPath}
                      onClick={() => {
                        if (unread) void markRead(it.id);
                      }}
                      className="block no-underline"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (unread) void markRead(it.id);
                      }}
                      className="block w-full text-left"
                    >
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
