"use client";

import { useCallback, useEffect, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";
import { AplyProfileCard } from "../../../../../components/resume-maker/AplyProfileCard";
import { computeResumeProgress } from "../../../../../lib/resume-maker-progress";
import { EMPTY_BUILDER_STATE, type ResumeBuilderState } from "../../../../../lib/resume-maker-types";
import type { ResumeContent } from "../../../../../lib/member-profile-client";

// 이력서 인재풀 — 이력서 빌더에서 "기업 추천 후보 등록"(poolOptIn)에 동의한 학생을
// APLY Profile 카드로 보여주는 운영자 화면. 사주 캠페인(saju-leads)과 별개 퍼널.

type PoolItem = {
  resumeId: string;
  title: string;
  updatedAt: string;
  consentedAt: string | null;
  userName: string | null;
  userEmail: string | null;
  content: ResumeContent & { builder?: ResumeBuilderState };
};

type PoolPayload = { ok: boolean; items: PoolItem[] };

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}
function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ResumePoolPage() {
  const [items, setItems] = useState<PoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${apiBase()}/ops/resume-pool`);
      if (debouncedQ) url.searchParams.set("q", debouncedQ);
      const response = await fetch(url.toString(), { headers: authHeaders(), cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as PoolPayload;
      setItems(payload.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "이력서 인재풀을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="ops-content-section">
      <header>
        <h1>이력서 인재풀</h1>
        <p>
          AI 이력서 만들기에서 “기업 추천 후보 등록”에 동의한 학생입니다. 각 카드는 기업에게 제공되는 APLY Profile과
          동일한 형태로, 국적·비자·언어·전공·희망직무·핵심 경험이 정리되어 있습니다.
        </p>
      </header>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>후보 목록</h2>
          <div className="ops-tag-row">
            <span className="ops-pill ops-pill-violet">전체: {items.length}</span>
          </div>
        </div>

        <div className="ops-partner-filters">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름 / 이메일 / 희망직무 검색"
            className="ops-partner-filter-search"
          />
        </div>

        {error ? <p className="ops-form-error">{error}</p> : null}

        {loading ? (
          <p className="ops-table-empty" style={{ padding: "32px 0" }}>목록을 불러오는 중입니다...</p>
        ) : items.length === 0 ? (
          <p className="ops-table-empty" style={{ padding: "32px 0" }}>아직 등록된 후보가 없습니다.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" style={{ marginTop: 12 }}>
            {items.map((it) => {
              const builder = it.content.builder ?? EMPTY_BUILDER_STATE;
              const completeness = computeResumeProgress(it.content, builder).percent;
              return (
                <div key={it.resumeId}>
                  <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-muted-foreground">
                    {it.userName ? <span className="font-semibold text-foreground">{it.userName}</span> : null}
                    {it.userEmail ? <span>{it.userEmail}</span> : null}
                    {it.consentedAt ? <span>· 동의 {new Date(it.consentedAt).toLocaleDateString("ko-KR")}</span> : null}
                  </div>
                  <AplyProfileCard content={it.content} completeness={completeness} />
                </div>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
}
