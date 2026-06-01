"use client";

import Link from "next/link";
import { Briefcase, GraduationCap, Inbox, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { readAccessToken } from "../../../lib/auth-client";

type DashboardStats = {
  users: { total: number; students: number; partners: number; operators: number };
  partnerOrgs: { total: number; verified: number };
  positions: { total: number; open: number };
};

type MatchingStats = {
  applications: { SUBMITTED: number; INTERVIEW: number; ACCEPTED: number; REJECTED: number };
  activePrograms: number;
  completedPrograms: number;
  openSchoolCreditRequests: number;
  applicationsLast7Days: number;
};

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  linkPath: string;
  occurredAt: string;
};

type RecentSignup = {
  id: string;
  email: string;
  name: string | null;
  role: "STUDENT" | "PARTNER" | "OPERATOR";
  createdAt: string;
  authProvider: "EMAIL" | "NAVER" | "KAKAO" | "GOOGLE";
};

const OPS_ACTIVITY_COLOR: Record<string, string> = {
  USER_SIGNUP: "#10b981",
  POSITION_NEW: "#1d4ed8",
  APPLICATION_STATUS: "#3b82f6",
  ISSUE_NEW: "#dc2626",
  PROGRAM_STARTED: "#047857",
  SCHOOL_CREDIT: "#b45309"
};

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "학생",
  PARTNER: "파트너",
  OPERATOR: "운영자"
};

const PROVIDER_LABEL: Record<string, string> = {
  EMAIL: "이메일",
  NAVER: "네이버",
  KAKAO: "카카오",
  GOOGLE: "구글"
};

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

// KPI card — icon + label + big value + delta line (mirrors the reports page)
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

// Slim horizontal funnel — each stage gets its own row with the count and
// (optionally) the stage-to-stage conversion %. Slim 6px track keeps the
// chart airy instead of bulky vertical columns.
function FunnelRows({ stages }: { stages: { label: string; value: number }[] }) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <div style={{ display: "grid", gap: 18, marginTop: 8 }}>
      {stages.map((s, idx) => {
        const widthPct = max > 0 ? (s.value / max) * 100 : 0;
        const prev = idx > 0 ? stages[idx - 1] : null;
        const conv = prev && prev.value > 0 ? Math.round((s.value / prev.value) * 1000) / 10 : null;
        return (
          <div key={s.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 8
              }}
            >
              <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{s.label}</span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#111827",
                  fontVariantNumeric: "tabular-nums"
                }}
              >
                {s.value.toLocaleString()}
                {conv !== null ? (
                  <span style={{ marginLeft: 10, fontSize: 11, color: "#6b7280", fontWeight: 500 }}>
                    → {conv}%
                  </span>
                ) : null}
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: 6,
                background: "#f3f4f6",
                borderRadius: 999,
                overflow: "hidden"
              }}
            >
              <span
                style={{
                  display: "block",
                  width: `${widthPct}%`,
                  height: "100%",
                  background: "var(--ops-accent-dark)",
                  borderRadius: "inherit"
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

type StaleUnverified = {
  count: number;
  thresholdDays: number;
  sample: { id: string; email: string; name: string | null; authProvider: string; createdAt: string }[];
};

export default function OpsDashboardHome() {
  const { user } = useAuthSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [matching, setMatching] = useState<MatchingStats | null>(null);
  const [recent, setRecent] = useState<RecentSignup[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [staleUnverified, setStaleUnverified] = useState<StaleUnverified | null>(null);
  const [wiping, setWiping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      try {
        const token = readAccessToken();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
        const [dashResp, matchResp, activityResp, staleResp] = await Promise.all([
          fetch(`${apiBaseUrl}/ops/dashboard`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            cache: "no-store"
          }),
          fetch(`${apiBaseUrl}/ops/matching-stats`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            cache: "no-store"
          }),
          fetch(`${apiBaseUrl}/ops/activity`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            cache: "no-store"
          }),
          fetch(`${apiBaseUrl}/ops/stale-unverified`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            cache: "no-store"
          })
        ]);
        if (!dashResp.ok) throw new Error(`HTTP ${dashResp.status}`);
        const payload = (await dashResp.json()) as { ok?: boolean; stats?: DashboardStats; recentSignups?: RecentSignup[] };
        if (!ignore && payload.ok) {
          setStats(payload.stats ?? null);
          setRecent(payload.recentSignups ?? []);
        }
        if (matchResp.ok) {
          const matchPayload = (await matchResp.json()) as { ok?: boolean; stats?: MatchingStats };
          if (!ignore && matchPayload.ok) setMatching(matchPayload.stats ?? null);
        }
        if (activityResp.ok) {
          const actPayload = (await activityResp.json()) as { items?: ActivityItem[] };
          if (!ignore) setActivity(actPayload.items ?? []);
        }
        if (staleResp.ok) {
          const stalePayload = (await staleResp.json()) as { ok?: boolean } & StaleUnverified;
          if (!ignore && stalePayload.ok) {
            setStaleUnverified({
              count: stalePayload.count,
              thresholdDays: stalePayload.thresholdDays,
              sample: stalePayload.sample
            });
          }
        }
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "대시보드를 불러오지 못했습니다.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleWipeStale() {
    if (!staleUnverified || staleUnverified.count === 0) return;
    const typed = window.prompt(
      `${staleUnverified.count}명의 미인증 계정을 영구 삭제합니다.\n계속하려면 DELETE 를 정확히 입력하세요.`
    );
    if (typed !== "DELETE") return;
    setWiping(true);
    try {
      const token = readAccessToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBaseUrl}/ops/stale-unverified/wipe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ confirm: "DELETE" })
      });
      const payload = (await response.json()) as { ok?: boolean; deletedCount?: number; message?: string };
      if (!response.ok || !payload.ok) {
        window.alert(payload.message ?? "삭제 실패");
        return;
      }
      window.alert(`${payload.deletedCount ?? 0}명 삭제 완료`);
      setStaleUnverified((prev) => (prev ? { ...prev, count: 0, sample: [] } : prev));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "삭제 중 오류");
    } finally {
      setWiping(false);
    }
  }

  const applicationFunnel = useMemo(() => {
    if (!matching) return [];
    return [
      { label: "검토 중", value: matching.applications.SUBMITTED },
      { label: "면접 예정", value: matching.applications.INTERVIEW },
      { label: "합격", value: matching.applications.ACCEPTED },
      { label: "불합격", value: matching.applications.REJECTED }
    ];
  }, [matching]);

  const totalApplications = useMemo(() => {
    if (!matching) return 0;
    return (
      matching.applications.SUBMITTED +
      matching.applications.INTERVIEW +
      matching.applications.ACCEPTED +
      matching.applications.REJECTED
    );
  }, [matching]);

  return (
    <section className="ops-content-section">
      <header>
        <h1>운영 대시보드</h1>
        <p>안녕하세요, {user?.name ?? "운영자"}님. 플랫폼 전반의 운영 상태를 한눈에 확인하세요.</p>
      </header>

      {loading ? (
        <div className="ops-empty-card">대시보드 데이터를 불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : !stats ? (
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
                value={stats.users.total}
                delta={{
                  text: `학생 ${stats.users.students.toLocaleString()} · 파트너 ${stats.users.partners.toLocaleString()} · 운영자 ${stats.users.operators.toLocaleString()}`,
                  direction: "muted"
                }}
              />
              <KpiCard
                Icon={Briefcase}
                label="파트너 회사"
                value={stats.partnerOrgs.total}
                delta={{
                  text: `인증 완료 ${stats.partnerOrgs.verified.toLocaleString()}`,
                  direction: stats.partnerOrgs.verified > 0 ? "up" : "muted"
                }}
              />
              <KpiCard
                Icon={Briefcase}
                label="모집 중 포지션"
                value={stats.positions.open}
                delta={{
                  text: `전체 ${stats.positions.total.toLocaleString()}`,
                  direction: "muted"
                }}
              />
              <KpiCard
                Icon={Inbox}
                label="지원함 (검토 중)"
                value={matching?.applications.SUBMITTED ?? 0}
                delta={{
                  text: `최근 7일 +${(matching?.applicationsLast7Days ?? 0).toLocaleString()} · 전체 ${totalApplications.toLocaleString()}`,
                  direction:
                    matching && matching.applications.SUBMITTED > 0
                      ? "up"
                      : "muted"
                }}
              />
            </div>
          </article>

          {/* 지원 funnel — 전체 너비 차트 카드 */}
          {matching ? (
            <article className="ops-partner-list-card">
              <div className="ops-report-chart-card">
                <div className="ops-report-chart-head">
                  <div className="ops-report-chart-title">
                    <span className="name">지원 → 합격 funnel</span>
                    <span className="num">{totalApplications.toLocaleString()}</span>
                    <span className="delta">전체 지원</span>
                  </div>
                </div>
                <FunnelRows stages={applicationFunnel} />
              </div>
            </article>
          ) : null}

          {/* 청소 — 이메일 미인증 7일+ */}
          {staleUnverified ? (
            <article className="ops-partner-list-card">
              <div className="ops-partner-list-top">
                <h2>미인증 가입 정리</h2>
                {staleUnverified.count > 0 ? (
                  <button
                    type="button"
                    className="ops-action-danger"
                    onClick={() => void handleWipeStale()}
                    disabled={wiping}
                  >
                    {wiping ? "삭제 중..." : `${staleUnverified.count.toLocaleString()}명 일괄 삭제`}
                  </button>
                ) : null}
              </div>
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: staleUnverified.count > 0 ? "#b42318" : "#16a34a",
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1.1
                  }}
                >
                  {staleUnverified.count.toLocaleString()}명
                </div>
                <p className="ops-card-subtle" style={{ margin: 0 }}>
                  이메일 인증을 마치지 않고 {staleUnverified.thresholdDays}일 이상 방치된 계정입니다.
                  봇/스팸 가입 의심 — 로그인 불가 상태라 삭제해도 사용자 영향 없습니다.
                </p>
              </div>
              {staleUnverified.sample.length > 0 ? (
                <div style={{ marginTop: 14 }}>
                  <p className="ops-row-sub" style={{ marginBottom: 6 }}>최근 10건 미리보기</p>
                  <div className="ops-partner-table-wrap">
                    <table className="ops-partner-table">
                      <thead>
                        <tr>
                          <th>이름</th>
                          <th>이메일</th>
                          <th>가입 방식</th>
                          <th>가입 시점</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staleUnverified.sample.map((u) => (
                          <tr key={u.id}>
                            <td className="ops-row-sub">{u.name ?? "-"}</td>
                            <td>{u.email}</td>
                            <td>{PROVIDER_LABEL[u.authProvider] ?? u.authProvider}</td>
                            <td className="ops-row-sub">{formatRelativeTime(u.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </article>
          ) : null}

          {/* 최근 활동 */}
          <article className="ops-partner-list-card">
            <div className="ops-partner-list-top">
              <h2>최근 활동</h2>
              <span className="ops-row-sub" style={{ fontSize: 12 }}>최근 7일</span>
            </div>
            {activity.length === 0 ? (
              <p className="ops-card-subtle" style={{ marginTop: 12 }}>최근 활동이 없습니다.</p>
            ) : (
              <div className="ops-activity-feed" style={{ marginTop: 12 }}>
                {activity.map((it) => (
                  <Link key={it.id} href={it.linkPath} className="ops-activity-item">
                    <span
                      className="ops-activity-dot"
                      style={{ background: OPS_ACTIVITY_COLOR[it.type] ?? "#9ca3af" }}
                      aria-hidden
                    />
                    <div className="ops-activity-text">
                      <p className="ops-activity-title">{it.title}</p>
                      <p className="ops-activity-sub">{it.subtitle}</p>
                    </div>
                    <span className="ops-activity-time">{formatRelativeTime(it.occurredAt)}</span>
                  </Link>
                ))}
              </div>
            )}
          </article>

          {/* 최근 가입자 */}
          <article className="ops-partner-list-card">
            <div className="ops-partner-list-top">
              <h2>최근 가입자</h2>
              <Link href="/dashboard/ops/support/users" className="ops-detail-button">
                전체 보기
              </Link>
            </div>
            <div className="ops-partner-table-wrap" style={{ marginTop: 12 }}>
              <table className="ops-partner-table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>역할</th>
                    <th>가입 방식</th>
                    <th>가입 시점</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="ops-table-empty">최근 가입자가 없습니다.</td>
                    </tr>
                  ) : (
                    recent.map((u) => (
                      <tr key={u.id}>
                        <td className="ops-row-strong">{u.name ?? "-"}</td>
                        <td>{u.email}</td>
                        <td>{ROLE_LABEL[u.role] ?? u.role}</td>
                        <td>{PROVIDER_LABEL[u.authProvider] ?? u.authProvider}</td>
                        <td className="ops-row-sub">{formatRelativeTime(u.createdAt)}</td>
                      </tr>
                    ))
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
