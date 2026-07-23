"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "@phosphor-icons/react";
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

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // 드롭다운은 position: fixed 로 띄워(page wrapper 의 overflow-x: clip 에 잘리지
  // 않도록) 열 때 트리거 위치를 측정해 뷰포트 안에 안전하게 배치한다.
  const [menuStyle, setMenuStyle] = useState<{ top: number; right: number; width: number }>({
    top: 64,
    right: 12,
    width: 360
  });

  function openMenu() {
    const rect = containerRef.current?.getBoundingClientRect();
    const margin = 12;
    const right = rect ? Math.max(margin, Math.round(window.innerWidth - rect.right)) : margin;
    const width = Math.min(360, window.innerWidth - right - margin);
    setMenuStyle({ top: rect ? Math.round(rect.bottom + 8) : 64, right, width });
    setOpen(true);
    void load(); // 열 때 전체 목록을 최신으로 불러온다.
  }

  // 전체 목록 로드 — 드롭다운을 열 때만. (폴링은 아래 경량 카운트만.)
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase()}/members/me/notifications?limit=30`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { items?: Notification[]; unreadCount?: number };
      setItems(payload.items ?? []);
      setUnreadCount(payload.unreadCount ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // 뱃지용 경량 미읽음 카운트 — 목록 없이 count 만.
  const loadCount = useCallback(async () => {
    try {
      const response = await fetch(`${apiBase()}/members/me/notifications/unread-count`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { unreadCount?: number };
      setUnreadCount(payload.unreadCount ?? 0);
    } catch {
      // silent
    }
  }, []);

  // 탭이 보일 때만 60초 폴링(카운트). 백그라운드 탭에선 멈추고, 복귀/포커스 시 즉시 갱신.
  useEffect(() => {
    void loadCount();
    let interval: ReturnType<typeof setInterval> | null = null;
    const startPolling = () => {
      if (interval) return;
      interval = setInterval(() => void loadCount(), 60000);
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void loadCount();
        startPolling();
      } else {
        stopPolling();
      }
    };
    const onFocus = () => void loadCount();
    if (document.visibilityState === "visible") startPolling();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadCount]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
    return undefined;
  }, [open]);

  async function markRead(id: string) {
    try {
      await fetch(`${apiBase()}/members/me/notifications/${id}/read`, {
        method: "PATCH",
        headers: authHeaders()
      });
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, readAt: new Date().toISOString() } : it)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  }

  async function markAllRead() {
    try {
      await fetch(`${apiBase()}/members/me/notifications/read-all`, {
        method: "PATCH",
        headers: authHeaders()
      });
      const now = new Date().toISOString();
      setItems((prev) => prev.map((it) => (it.readAt ? it : { ...it, readAt: now })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-label="알림"
        style={{
          width: 36,
          height: 36,
          border: 0,
          borderRadius: 999,
          background: "transparent",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative"
        }}
      >
        <Bell size={20} weight={unreadCount > 0 ? "fill" : "regular"} />
        {unreadCount > 0 ? (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: 999,
              background: "#dc2626",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          style={{
            // fixed — page wrapper 의 overflow-x: clip 에 잘리지 않고 항상
            // 뷰포트 안에 보이도록. 위치는 openMenu 에서 트리거 기준 측정.
            position: "fixed",
            top: menuStyle.top,
            right: menuStyle.right,
            width: menuStyle.width,
            maxHeight: "70vh",
            overflowY: "auto",
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.16)",
            zIndex: 50
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #f3f4f6" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>알림</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                style={{ fontSize: 12, color: "#6b7280", background: "none", border: 0, cursor: "pointer" }}
              >
                모두 읽음
              </button>
            ) : null}
          </div>

          {loading && items.length === 0 ? (
            <p style={{ padding: "20px 16px", fontSize: 13, color: "#6b7280", margin: 0 }}>불러오는 중...</p>
          ) : items.length === 0 ? (
            <p style={{ padding: "24px 16px", fontSize: 13, color: "#6b7280", margin: 0, textAlign: "center" }}>새 알림이 없습니다.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {items.map((it) => {
                const unread = !it.readAt;
                const inner = (
                  <div
                    style={{
                      padding: "12px 16px",
                      background: unread ? "#eff6ff" : "transparent",
                      borderBottom: "1px solid #f3f4f6",
                      cursor: it.linkPath ? "pointer" : "default"
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: unread ? 600 : 500, color: "#111827", margin: 0 }}>
                      {it.title}
                    </p>
                    {it.message ? (
                      <p style={{ fontSize: 12, color: "#374151", margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{it.message}</p>
                    ) : null}
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>{formatRelative(it.createdAt)}</p>
                  </div>
                );
                return (
                  <li key={it.id}>
                    {it.linkPath ? (
                      <Link
                        href={it.linkPath}
                        onClick={() => {
                          if (unread) void markRead(it.id);
                          setOpen(false);
                        }}
                        style={{ textDecoration: "none", color: "inherit", display: "block" }}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (unread) void markRead(it.id);
                        }}
                        style={{ width: "100%", textAlign: "left", background: "none", border: 0, padding: 0, cursor: "pointer" }}
                      >
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div style={{ padding: "10px 16px", borderTop: "1px solid #f3f4f6", textAlign: "center" }}>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              style={{ fontSize: 12, color: "#1d4ed8", textDecoration: "none", fontWeight: 600 }}
            >
              모든 알림 보기 →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
