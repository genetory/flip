"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle, Circle } from "@phosphor-icons/react";
import { readAccessToken } from "../../lib/auth-client";

type CompletionItem = {
  key: string;
  label: string;
  filled: boolean;
};

type CompletionPayload = {
  total: number;
  filledCount: number;
  percent: number;
  items: CompletionItem[];
};

const ITEM_LINK: Record<string, string> = {
  name: "/profile/edit",
  phoneNumber: "/profile/edit",
  nationality: "/profile/edit",
  affiliation: "/profile/edit",
  birthDate: "/profile/edit",
  gender: "/profile/edit",
  jobTitle: "/profile/edit",
  profileImage: "/profile/edit",
  emailVerified: "/verify-email",
  selfIntroduction: "/profile/resume/edit/profile-text",
  career: "/profile/resume/edit/career",
  education: "/profile/resume/edit/education",
  languageSkill: "/profile/resume/edit/language"
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function ProfileCompletionMeter() {
  const [data, setData] = useState<CompletionPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`${apiBase()}/members/me/profile-completion`, {
          headers: authHeaders(),
          cache: "no-store"
        });
        if (!response.ok) return;
        const payload = (await response.json()) as CompletionPayload;
        setData(payload);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading || !data) return null;
  if (data.percent === 100) {
    return (
      <article className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-5">
        <div className="flex items-center gap-3">
          <CheckCircle size={24} weight="fill" color="#047857" />
          <div>
            <p className="text-sm font-semibold text-emerald-700">프로필 100% 완료</p>
            <p className="mt-0.5 text-xs text-emerald-700/80">모든 정보가 입력되어 있어요. 매칭 가능성이 가장 높은 상태!</p>
          </div>
        </div>
      </article>
    );
  }

  const missing = data.items.filter((i) => !i.filled);
  const color = data.percent >= 70 ? "#047857" : data.percent >= 40 ? "#b45309" : "#dc2626";

  return (
    <article className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">프로필 완성도</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data.filledCount}/{data.total} 항목 작성 — 완성도를 높이면 매칭 확률이 올라가요.
          </p>
        </div>
        <p className="text-2xl font-bold" style={{ color }}>
          {data.percent}%
        </p>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          style={{
            width: `${data.percent}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            transition: "width 0.4s ease"
          }}
        />
      </div>
      {missing.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground">아직 작성 안 한 항목</p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {missing.map((it) => {
              const href = ITEM_LINK[it.key];
              return (
                <li key={it.key}>
                  {href ? (
                    <Link
                      href={href}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      <Circle size={14} weight="duotone" />
                      <span>{it.label} 추가하기 →</span>
                    </Link>
                  ) : (
                    <span className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground">
                      <Circle size={14} weight="duotone" />
                      <span>{it.label}</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
