"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Info, CheckCircle, Warning, WarningOctagon, X } from "@phosphor-icons/react";
import { readAccessToken } from "../../lib/auth-client";
import { useAuthSession } from "../auth/AuthSessionProvider";

type Severity = "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";

type Announcement = {
  id: string;
  title: string;
  body: string;
  severity: Severity;
  audience: string;
  linkPath: string | null;
  startsAt: string;
  endsAt: string | null;
};

const SEVERITY_STYLE: Record<Severity, { bg: string; border: string; color: string }> = {
  INFO: { bg: "#eff6ff", border: "#bfdbfe", color: "#1e3a8a" },
  SUCCESS: { bg: "#ecfdf5", border: "#a7f3d0", color: "#065f46" },
  WARNING: { bg: "#fffbeb", border: "#fde68a", color: "#92400e" },
  CRITICAL: { bg: "#fef2f2", border: "#fca5a5", color: "#991b1b" }
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const DISMISSED_KEY = "announcements:dismissed:v1";

function readDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function writeDismissed(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // silent
  }
}

function SeverityIcon({ severity, size = 16, color }: { severity: Severity; size?: number; color?: string }) {
  const c = color ?? "currentColor";
  if (severity === "CRITICAL") return <WarningOctagon size={size} color={c} weight="fill" />;
  if (severity === "WARNING") return <Warning size={size} color={c} weight="fill" />;
  if (severity === "SUCCESS") return <CheckCircle size={size} color={c} weight="fill" />;
  return <Info size={size} color={c} weight="fill" />;
}

export function AnnouncementBanner() {
  const { isAuthenticated, isReady } = useAuthSession();
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => readDismissed());

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) return;
    async function load() {
      try {
        const response = await fetch(`${apiBase()}/members/me/announcements`, {
          headers: authHeaders(),
          cache: "no-store"
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { items?: Announcement[] };
        setItems(payload.items ?? []);
      } catch {
        // silent
      }
    }
    void load();
  }, [isReady, isAuthenticated]);

  function dismiss(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      writeDismissed(next);
      return next;
    });
  }

  const visible = items.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 16px 0" }}>
      {visible.map((a) => {
        const tone = SEVERITY_STYLE[a.severity];
        return (
          <div
            key={a.id}
            style={{
              background: tone.bg,
              border: `1px solid ${tone.border}`,
              borderRadius: 10,
              padding: "10px 14px",
              display: "flex",
              alignItems: "flex-start",
              gap: 10
            }}
          >
            <SeverityIcon severity={a.severity} color={tone.color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: tone.color, margin: 0 }}>{a.title}</p>
              <p style={{ fontSize: 12, color: tone.color, opacity: 0.85, margin: "2px 0 0", whiteSpace: "pre-wrap" }}>
                {a.body}
              </p>
              {a.linkPath ? (
                <Link
                  href={a.linkPath}
                  style={{ fontSize: 12, color: tone.color, fontWeight: 600, textDecoration: "underline", marginTop: 4, display: "inline-block" }}
                >
                  자세히 보기 →
                </Link>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(a.id)}
              aria-label="닫기"
              style={{
                width: 24,
                height: 24,
                border: 0,
                background: "transparent",
                color: tone.color,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.7
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
