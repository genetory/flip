"use client";

import Link from "next/link";
import { Briefcase, GraduationCap, Tray as Inbox, Users } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";
import { getApplicationStatusLabel, type ApplicationStatus } from "../../../../../lib/status-labels";

type ReportsOverview = {
  users: {
    byRole: { STUDENT: number; PARTNER: number; OPERATOR: number };
    last7Days: number;
    last30Days: number;
  };
  positions: {
    byStatus: { DRAFT: number; PENDING_REVIEW: number; OPEN: number; PAUSED: number; CLOSED: number; REJECTED: number };
    last7Days: number;
  };
  applications: {
    byStatus: { SUBMITTED: number; INTERVIEW: number; ACCEPTED: number; REJECTED: number };
    last7Days: number;
  };
  programs: { byStatus: { ACTIVE: number; COMPLETED: number; CANCELLED: number } };
  artifacts: { certificates: number; recommendations: number };
  issues: { byStatus: { OPEN: number; IN_PROGRESS: number; RESOLVED: number; CLOSED: number } };
};

type ApplicationRow = {
  id: string;
  positionTitle: string;
  partnerOrganizationName: string | null;
  candidateName: string | null;
  candidateEmail: string;
  status: ApplicationStatus;
  submittedAt: string;
};

const POSITION_STATUS_ORDER: Array<{ key: keyof ReportsOverview["positions"]["byStatus"]; label: string }> = [
  { key: "DRAFT", label: "초안" },
  { key: "PENDING_REVIEW", label: "검수" },
  { key: "OPEN", label: "모집" },
  { key: "PAUSED", label: "중단" },
  { key: "CLOSED", label: "마감" },
  { key: "REJECTED", label: "반려" }
];

const APP_TAB_FILTERS: Array<{ key: "ALL" | ApplicationStatus; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "SUBMITTED", label: "검토 중" },
  { key: "INTERVIEW", label: "면접 예정" },
  { key: "ACCEPTED", label: "합격" },
  { key: "REJECTED", label: "불합격" }
];

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  return d.toLocaleDateString("ko-KR");
}

// KPI card — icon + label + big value + delta line
function KpiCard({
  Icon,
  label,
  value,
  delta
}: {
  Icon: typeof Users;
  label: string;
  value: number;
  delta?: { text: string; direction?: "up" | "down" | "muted" };
}) {
  const deltaCls = delta?.direction === "down" ? "is-down" : delta?.direction === "muted" ? "is-muted" : "";
  return (
    <div className="ops-report-kpi">
      <div className="ops-report-kpi-head">
        <span className="icon" aria-hidden>
          <Icon size={16} />
        </span>
        <span>{label}</span>
      </div>
      <p className="value">{value.toLocaleString()}</p>
      {delta ? <p className={`delta ${deltaCls}`}>{delta.text}</p> : null}
    </div>
  );
}

// Vertical bar chart for status distribution. Each column has a translucent
// track that fills up to the proportional height.
function VBars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="ops-report-vbars">
      {data.map((d) => {
        const heightPct = (d.value / max) * 100;
        return (
          <div key={d.label}>
            <div className="col" title={`${d.label}: ${d.value.toLocaleString()}`}>
              <span className="fill" style={{ height: `${heightPct}%` }} />
            </div>
            <span className="label">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ReportsPage() {
  const [stats, setStats] = useState<ReportsOverview | null>(null);
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appTab, setAppTab] = useState<"ALL" | ApplicationStatus>("ALL");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, appsRes] = await Promise.all([
          fetch(`${apiBase()}/ops/reports/overview`, { headers: authHeaders(), cache: "no-store" }),
          fetch(`${apiBase()}/ops/applications?pageSize=20`, { headers: authHeaders(), cache: "no-store" })
        ]);
        if (!overviewRes.ok) throw new Error(`HTTP ${overviewRes.status}`);
        const overviewPayload = (await overviewRes.json()) as { stats?: ReportsOverview };
        setStats(overviewPayload.stats ?? null);

        if (appsRes.ok) {
          const appsPayload = (await appsRes.json()) as { items?: ApplicationRow[] };
          setApps(appsPayload.items ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "리포트를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const totals = useMemo(() => {
    if (!stats) return null;
    const totalUsers =
      stats.users.byRole.STUDENT + stats.users.byRole.PARTNER + stats.users.byRole.OPERATOR;
    const totalApplications = Object.values(stats.applications.byStatus).reduce((a, b) => a + b, 0);
    return { totalUsers, totalApplications };
  }, [stats]);

  const positionBars = useMemo(() => {
    if (!stats) return [];
    return POSITION_STATUS_ORDER.map((s) => ({
      label: s.label,
      value: stats.positions.byStatus[s.key]
    }));
  }, [stats]);

  const filteredApps = useMemo(() => {
    if (appTab === "ALL") return apps;
    return apps.filter((a) => a.status === appTab);
  }, [apps, appTab]);

  const appTabCounts = useMemo(() => {
    const init: Record<"ALL" | ApplicationStatus, number> = {
      ALL: apps.length,
      SUBMITTED: 0,
      INTERVIEW: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      WITHDRAWN: 0
    };
    for (const a of apps) init[a.status] += 1;
    return init;
  }, [apps]);

  // Application acceptance rate as a 보조 KPI on the right side card
  const acceptanceRate = useMemo(() => {
    if (!stats) return 0;
    const total =
      stats.applications.byStatus.SUBMITTED +
      stats.applications.byStatus.INTERVIEW +
      stats.applications.byStatus.ACCEPTED +
      stats.applications.byStatus.REJECTED;
    if (total === 0) return 0;
    return Math.round((stats.applications.byStatus.ACCEPTED / total) * 1000) / 10;
  }, [stats]);

  return (
    <section className="ops-content-section">
      <header>
        <h1>리포트</h1>
        <p>플랫폼 전체의 사용자/포지션/지원/프로그램 등 주요 지표를 한눈에 확인하세요.</p>
      </header>

      {loading ? (
        <div className="ops-empty-card">리포트를 불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : !stats || !totals ? (
        <div className="ops-empty-card">아직 데이터가 없습니다.</div>
      ) : (
        <>
          {/* KPI strip — 4 핵심 지표 */}
          <article className="ops-partner-list-card">
            <div className="ops-partner-list-top">
              <h2>한눈에 보기</h2>
            </div>
            <div className="ops-report-kpi-strip">
              <KpiCard
                Icon={Users}
                label="전체 사용자"
                value={totals.totalUsers}
                delta={{
                  text: `최근 7일 +${stats.users.last7Days.toLocaleString()}`,
                  direction: stats.users.last7Days > 0 ? "up" : "muted"
                }}
              />
              <KpiCard
                Icon={Briefcase}
                label="모집 중 포지션"
                value={stats.positions.byStatus.OPEN}
                delta={{
                  text: `최근 7일 신규 +${stats.positions.last7Days.toLocaleString()}`,
                  direction: stats.positions.last7Days > 0 ? "up" : "muted"
                }}
              />
              <KpiCard
                Icon={Inbox}
                label="전체 지원"
                value={totals.totalApplications}
                delta={{
                  text: `최근 7일 +${stats.applications.last7Days.toLocaleString()}`,
                  direction: stats.applications.last7Days > 0 ? "up" : "muted"
                }}
              />
              <KpiCard
                Icon={GraduationCap}
                label="진행 중 프로그램"
                value={stats.programs.byStatus.ACTIVE}
                delta={{
                  text: `완료 ${stats.programs.byStatus.COMPLETED.toLocaleString()}`,
                  direction: "muted"
                }}
              />
            </div>
          </article>

          {/* 2-column chart row — 포지션 상태 bar chart + 합격률 카드 */}
          <article className="ops-partner-list-card">
            <div className="ops-report-chart-row">
              <div className="ops-report-chart-card">
                <div className="ops-report-chart-head">
                  <div className="ops-report-chart-title">
                    <span className="name">포지션 상태 분포</span>
                    <span className="num">
                      {Object.values(stats.positions.byStatus).reduce((a, b) => a + b, 0).toLocaleString()}
                    </span>
                    <span className="delta">전체 포지션</span>
                  </div>
                </div>
                <VBars data={positionBars} />
              </div>

              <div className="ops-report-chart-card">
                <div className="ops-report-chart-head">
                  <div className="ops-report-chart-title">
                    <span className="name">지원 합격률</span>
                    <span className="num">{acceptanceRate}%</span>
                    <span className="delta">
                      합격 {stats.applications.byStatus.ACCEPTED.toLocaleString()} / 면접{" "}
                      {stats.applications.byStatus.INTERVIEW.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
                  {(["SUBMITTED", "INTERVIEW", "ACCEPTED", "REJECTED"] as const).map((key) => {
                    const value = stats.applications.byStatus[key];
                    const totalApps =
                      stats.applications.byStatus.SUBMITTED +
                      stats.applications.byStatus.INTERVIEW +
                      stats.applications.byStatus.ACCEPTED +
                      stats.applications.byStatus.REJECTED;
                    const pct = totalApps > 0 ? (value / totalApps) * 100 : 0;
                    const labelMap: Record<typeof key, string> = {
                      SUBMITTED: "검토 중",
                      INTERVIEW: "면접 예정",
                      ACCEPTED: "합격",
                      REJECTED: "불합격"
                    };
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ minWidth: 60, fontSize: 12, color: "var(--ink-faint)" }}>{labelMap[key]}</span>
                        <div
                          style={{
                            flex: 1,
                            height: 8,
                            background: "var(--surface-2)",
                            borderRadius: 999,
                            overflow: "hidden"
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              height: "100%",
                              width: `${pct}%`,
                              background: "var(--ops-accent-dark)"
                            }}
                          />
                        </div>
                        <span
                          style={{
                            minWidth: 36,
                            textAlign: "right",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--ink)",
                            fontVariantNumeric: "tabular-nums"
                          }}
                        >
                          {value.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </article>

          {/* 최근 지원 — 탭 + 테이블 */}
          <article className="ops-partner-list-card">
            <div className="ops-partner-list-top">
              <h2>최근 지원</h2>
              <Link href="/dashboard/ops/operations/applications" className="ops-detail-button">
                전체 보기
              </Link>
            </div>

            <div style={{ marginTop: 4 }}>
              <div className="ops-report-tabs" role="tablist">
                {APP_TAB_FILTERS.map((t) => {
                  const active = appTab === t.key;
                  const count = appTabCounts[t.key] ?? 0;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={`ops-report-tab${active ? " is-active" : ""}`}
                      onClick={() => setAppTab(t.key)}
                    >
                      {t.label}
                      {count > 0 && t.key !== "ALL" ? <span className="badge">{count}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ops-partner-table-wrap" style={{ marginTop: 14 }}>
              <table className="ops-partner-table">
                <thead>
                  <tr>
                    <th>지원자</th>
                    <th>회사</th>
                    <th>포지션</th>
                    <th>상태</th>
                    <th>지원 시점</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="ops-table-empty">조건에 맞는 지원이 없습니다.</td>
                    </tr>
                  ) : (
                    filteredApps.slice(0, 10).map((a) => {
                      const badge = getApplicationStatusLabel(a.status, "operator");
                      return (
                        <tr key={a.id}>
                          <td>
                            <div className="ops-row-strong">{a.candidateName ?? "-"}</div>
                            <div className="ops-row-sub">{a.candidateEmail}</div>
                          </td>
                          <td>{a.partnerOrganizationName ?? "-"}</td>
                          <td>{a.positionTitle}</td>
                          <td>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="ops-row-sub">{formatRelativeTime(a.submittedAt)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </>
      )}
    </section>
  );
}
