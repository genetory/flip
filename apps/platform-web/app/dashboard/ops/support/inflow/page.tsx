"use client";

import { useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";

type ProviderRow = Record<string, Record<"STUDENT" | "PARTNER" | "OPERATOR", number>>;

type InflowPayload = {
  byProvider: ProviderRow;
  topAffiliations: { affiliation: string | null; count: number }[];
  weekly: { week: string; STUDENT: number; PARTNER: number; OPERATOR: number }[];
  monthly: { month: string; STUDENT: number; PARTNER: number; OPERATOR: number }[];
};

type PeriodMode = "weekly" | "monthly";
const BUCKET_COUNT = 12;

// Local-date YYYY-MM-DD (NOT toISOString — that's UTC and shifts the
// bucket key by a day in non-UTC timezones).
function fmtLocalDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function fmtLocalMonth(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// Build the most-recent N week buckets ending this week (Monday-aligned),
// matching the date_trunc('week', ...) Postgres output the API uses.
function lastNWeekBuckets(n: number): string[] {
  const result: string[] = [];
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 1=Mon
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i += 1) {
    result.unshift(fmtLocalDate(d));
    d.setDate(d.getDate() - 7);
  }
  return result;
}

// Most-recent N month buckets as 'YYYY-MM'.
function lastNMonthBuckets(n: number): string[] {
  const result: string[] = [];
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i += 1) {
    result.unshift(fmtLocalMonth(d));
    d.setMonth(d.getMonth() - 1);
  }
  return result;
}

const PROVIDER_LABEL: Record<string, string> = {
  EMAIL: "이메일",
  NAVER: "네이버",
  KAKAO: "카카오",
  GOOGLE: "구글"
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Tiny 주간/월간 toggle. Reused by both charts so they look identical.
function PeriodToggle({ value, onChange }: { value: PeriodMode; onChange: (v: PeriodMode) => void }) {
  return (
    <div
      role="tablist"
      aria-label="기간 선택"
      style={{ display: "inline-flex", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}
    >
      {(["weekly", "monthly"] as PeriodMode[]).map((mode) => {
        const active = mode === value;
        return (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(mode)}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              border: 0,
              background: active ? "var(--ops-accent-dark)" : "#fff",
              color: active ? "#fff" : "#6b7280"
            }}
          >
            {mode === "weekly" ? "주간" : "월간"}
          </button>
        );
      })}
    </div>
  );
}

// Generic stacked-bar chart. Each bucket renders even when total=0 — empty
// buckets show a 2px gray baseline so the time axis stays visually intact
// instead of "missing" bars hinting at no data. Hovering a bucket pops a
// styled tooltip above it with per-segment counts.
type ChartBucket = {
  key: string;
  label: string;
  segments: { value: number; color: string }[];
  tooltipTitle: string;
  tooltipLines: { label: string; value: number; color: string }[];
};

function ChartBars({ buckets, max, height = 120 }: { buckets: ChartBucket[]; max: number; height?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: height + 24, position: "relative" }}>
      {buckets.map((b, idx) => {
        const total = b.segments.reduce((acc, s) => acc + s.value, 0);
        const totalPct = max > 0 ? (total / max) * 100 : 0;
        const isHovered = hovered === idx;
        return (
          <div
            key={b.key}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 0 }}
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered((h) => (h === idx ? null : h))}
          >
            <div
              style={{
                width: "100%",
                height,
                position: "relative",
                display: "flex",
                flexDirection: "column-reverse",
                cursor: "default"
              }}
            >
              {isHovered ? (
                <div
                  role="tooltip"
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    marginBottom: 6,
                    background: "#111827",
                    color: "#fff",
                    fontSize: 11,
                    lineHeight: 1.5,
                    padding: "6px 10px",
                    borderRadius: 6,
                    whiteSpace: "nowrap",
                    zIndex: 10,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.18)"
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{b.tooltipTitle}</div>
                  {b.tooltipLines.map((line) => (
                    <div key={line.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ display: "inline-block", width: 8, height: 8, background: line.color, borderRadius: 2 }} />
                      <span>
                        {line.label}: <strong style={{ fontWeight: 600 }}>{line.value.toLocaleString()}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              {total === 0 ? (
                // Zero baseline so the bucket is still visible on the axis
                <div style={{ width: "100%", height: 2, background: "#e5e7eb", borderRadius: 2 }} />
              ) : (
                b.segments.map((seg, segIdx) => {
                  if (seg.value <= 0) return null;
                  const pct = (seg.value / total) * totalPct;
                  const isTop = b.segments.slice(segIdx + 1).every((s) => s.value <= 0);
                  return (
                    <div
                      key={segIdx}
                      style={{
                        background: seg.color,
                        height: `${pct}%`,
                        width: "100%",
                        borderRadius: isTop ? "4px 4px 0 0" : 0
                      }}
                    />
                  );
                })
              )}
            </div>
            <span style={{ fontSize: 10, color: "#6b7280", whiteSpace: "nowrap" }}>{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function InflowPage() {
  const [data, setData] = useState<InflowPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signupPeriod, setSignupPeriod] = useState<PeriodMode>("weekly");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBase()}/ops/reports/inflow`, {
          headers: authHeaders(),
          cache: "no-store"
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as InflowPayload & { ok?: boolean };
        setData(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "유입 통계를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const providerRows = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.byProvider).map(([provider, counts]) => ({
      provider,
      total: counts.STUDENT + counts.PARTNER + counts.OPERATOR,
      ...counts
    })).sort((a, b) => b.total - a.total);
  }, [data]);

  const totalSignups = useMemo(
    () => providerRows.reduce((acc, r) => acc + r.total, 0),
    [providerRows]
  );

  // Signup trend — pad to 12 buckets so the chart always has the same
  // number of bars regardless of how recently the platform launched.
  // Buckets without data render as zero-height bars (with a thin baseline).
  const signupBuckets = useMemo(() => {
    if (!data) return [] as { key: string; label: string; STUDENT: number; PARTNER: number; OPERATOR: number }[];
    if (signupPeriod === "weekly") {
      const byKey = new Map(data.weekly.map((w) => [w.week, w]));
      return lastNWeekBuckets(BUCKET_COUNT).map((wk) => {
        const r = byKey.get(wk);
        return {
          key: wk,
          // 'MM.DD' compact label
          label: wk.slice(5).replace("-", "."),
          STUDENT: r?.STUDENT ?? 0,
          PARTNER: r?.PARTNER ?? 0,
          OPERATOR: r?.OPERATOR ?? 0
        };
      });
    }
    const byKey = new Map(data.monthly.map((m) => [m.month, m]));
    return lastNMonthBuckets(BUCKET_COUNT).map((mo) => {
      const r = byKey.get(mo);
      return {
        key: mo,
        // 'YY.MM' compact label
        label: `${mo.slice(2, 4)}.${mo.slice(5, 7)}`,
        STUDENT: r?.STUDENT ?? 0,
        PARTNER: r?.PARTNER ?? 0,
        OPERATOR: r?.OPERATOR ?? 0
      };
    });
  }, [data, signupPeriod]);

  const signupMax = useMemo(
    () => signupBuckets.reduce((acc, b) => Math.max(acc, b.STUDENT + b.PARTNER + b.OPERATOR), 0),
    [signupBuckets]
  );


  return (
    <section className="ops-content-section">
      <header>
        <h1>유입 경로 관리</h1>
        <p>가입 채널(이메일·소셜), 사주 이벤트 funnel, 학교/소속 기준 유입 분포를 추적하고, 주간 신규 가입 추이를 확인하세요.</p>
      </header>

      {loading ? (
        <div className="ops-empty-card">불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : !data ? (
        <div className="ops-empty-card">데이터가 없습니다.</div>
      ) : (
        <>
          <article className="ops-card">
            <h2 className="ops-section-title">가입 채널 분포 (역할별)</h2>
            <article className="ops-table-card" style={{ marginTop: 12 }}>
              <table>
                <colgroup>
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "15%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>채널</th>
                    <th>학생</th>
                    <th>파트너</th>
                    <th>운영자</th>
                    <th>합계</th>
                    <th>비중</th>
                  </tr>
                </thead>
                <tbody>
                  {providerRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="ops-row-sub" style={{ textAlign: "center" }}>아직 가입자가 없습니다.</td>
                    </tr>
                  ) : (
                    providerRows.map((r) => {
                      const pct = totalSignups > 0 ? Math.round((r.total / totalSignups) * 1000) / 10 : 0;
                      return (
                        <tr key={r.provider}>
                          <td className="ops-row-strong">{PROVIDER_LABEL[r.provider] ?? r.provider}</td>
                          <td>{r.STUDENT.toLocaleString()}</td>
                          <td>{r.PARTNER.toLocaleString()}</td>
                          <td>{r.OPERATOR.toLocaleString()}</td>
                          <td className="ops-row-strong">{r.total.toLocaleString()}</td>
                          <td className="ops-row-sub">{pct}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </article>
          </article>

          <article className="ops-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <h2 className="ops-section-title">
                {signupPeriod === "weekly" ? "주간" : "월간"} 신규 가입 추이 (최근 {BUCKET_COUNT}
                {signupPeriod === "weekly" ? "주" : "개월"})
              </h2>
              <PeriodToggle value={signupPeriod} onChange={setSignupPeriod} />
            </div>
            <div style={{ marginTop: 12 }}>
              <ChartBars
                buckets={signupBuckets.map((b) => ({
                  key: b.key,
                  label: b.label,
                  segments: [
                    { value: b.STUDENT, color: "#3b82f6" },
                    { value: b.PARTNER, color: "#8b5cf6" },
                    { value: b.OPERATOR, color: "#f59e0b" }
                  ],
                  tooltipTitle: signupPeriod === "weekly" ? `주 시작 ${b.key}` : `${b.key}`,
                  tooltipLines: [
                    { label: "학생", value: b.STUDENT, color: "#3b82f6" },
                    { label: "파트너", value: b.PARTNER, color: "#8b5cf6" },
                    { label: "운영자", value: b.OPERATOR, color: "#f59e0b" },
                    { label: "합계", value: b.STUDENT + b.PARTNER + b.OPERATOR, color: "#374151" }
                  ]
                }))}
                max={signupMax}
                height={150}
              />
            </div>
            <div className="ops-tag-row" style={{ marginTop: 12 }}>
              <span className="ops-pill ops-pill-blue">학생</span>
              <span className="ops-pill ops-pill-violet">파트너</span>
              <span className="ops-pill ops-pill-amber">운영자</span>
            </div>
          </article>

          <article className="ops-card">
            <h2 className="ops-section-title">학교/소속 Top 20 (학생 기준)</h2>
            {data.topAffiliations.length === 0 ? (
              <p className="ops-card-subtle" style={{ margin: 0 }}>아직 소속 정보가 등록된 학생이 없습니다.</p>
            ) : (
              <article className="ops-table-card" style={{ marginTop: 12 }}>
                <table>
                  <colgroup>
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "72%" }} />
                    <col style={{ width: "20%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>소속</th>
                      <th>학생 수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topAffiliations.map((a, idx) => (
                      <tr key={`${a.affiliation}-${idx}`}>
                        <td className="ops-row-sub">{idx + 1}</td>
                        <td className="ops-row-strong">{a.affiliation ?? "-"}</td>
                        <td>{a.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            )}
          </article>
        </>
      )}
    </section>
  );
}
