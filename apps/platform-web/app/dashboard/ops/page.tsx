"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

const OPS_ACTIVITY_COLOR: Record<string, string> = {
  USER_SIGNUP: "#10b981",
  POSITION_NEW: "#1d4ed8",
  APPLICATION_STATUS: "#3b82f6",
  ISSUE_NEW: "#dc2626",
  PROGRAM_STARTED: "#047857",
  SCHOOL_CREDIT: "#b45309"
};

function formatRelativeOps(iso: string) {
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

type RecentSignup = {
  id: string;
  email: string;
  name: string | null;
  role: "STUDENT" | "PARTNER" | "OPERATOR";
  createdAt: string;
  authProvider: "EMAIL" | "NAVER" | "KAKAO" | "GOOGLE";
};

const QUICK_LINKS = [
  { label: "검수 큐", href: "/dashboard/ops/operations/review-queue", desc: "파트너 가입 · 공고 검수 대기 목록" },
  { label: "전체 지원 현황", href: "/dashboard/ops/operations/applications", desc: "모든 파트너의 지원자 상태 확인" },
  { label: "파트너 관리", href: "/dashboard/ops/partners/management", desc: "등록된 파트너 회사 목록과 인증 상태" },
  { label: "후보자 관리", href: "/dashboard/ops/operations/candidates", desc: "학생 프로필 검색·검토" },
  { label: "포지션 관리", href: "/dashboard/ops/operations/positions", desc: "모든 포지션과 상태 변경" },
  { label: "크롤링", href: "/dashboard/ops/system/crawlers", desc: "외부 데이터 가져오기 실행" }
];

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

export default function OpsDashboardHome() {
  const { user } = useAuthSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [matching, setMatching] = useState<MatchingStats | null>(null);
  const [recent, setRecent] = useState<RecentSignup[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      try {
        const token = readAccessToken();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
        const [dashResp, matchResp, activityResp] = await Promise.all([
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

  return (
    <section className="ops-content-section">
      <header className="dashboard-header">
        <div>
          <h1>운영 대시보드</h1>
          <p>안녕하세요, {user?.name ?? "운영자"}님. 플랫폼 전반의 운영 상태를 한눈에 확인하세요.</p>
        </div>
      </header>

      {loading ? (
        <p style={{ color: "#6b7280", padding: "16px 0" }}>대시보드 데이터를 불러오는 중...</p>
      ) : error ? (
        <p style={{ color: "#dc2626", padding: "16px 0" }}>{error}</p>
      ) : (
        <>
          {stats ? (
            <section className="ops-card-grid">
              <article className="ops-card">
                <p className="ops-kpi-label" style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>전체 사용자</p>
                <p style={{ fontSize: 32, fontWeight: 900, margin: "8px 0 4px", color: "#111827" }}>{stats.users.total.toLocaleString()}</p>
                <p className="ops-card-subtle" style={{ margin: 0 }}>
                  학생 {stats.users.students.toLocaleString()} · 파트너 {stats.users.partners.toLocaleString()} · 운영자 {stats.users.operators.toLocaleString()}
                </p>
              </article>
              <article className="ops-card">
                <p className="ops-kpi-label" style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>파트너 회사</p>
                <p style={{ fontSize: 32, fontWeight: 900, margin: "8px 0 4px", color: "#111827" }}>{stats.partnerOrgs.total.toLocaleString()}</p>
                <p className="ops-card-subtle" style={{ margin: 0 }}>인증 완료 {stats.partnerOrgs.verified.toLocaleString()}</p>
              </article>
              <article className="ops-card">
                <p className="ops-kpi-label" style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>포지션</p>
                <p style={{ fontSize: 32, fontWeight: 900, margin: "8px 0 4px", color: "#111827" }}>{stats.positions.total.toLocaleString()}</p>
                <p className="ops-card-subtle" style={{ margin: 0 }}>모집중 {stats.positions.open.toLocaleString()}</p>
              </article>
            </section>
          ) : null}

          {matching ? (
            <section>
              <h2 className="ops-section-heading">매칭 모니터링</h2>
              <article className="ops-card">
                <p className="ops-kpi-label" style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>지원 → 합격 퍼널</p>
                <div className="ops-funnel-grid">
                  <div className="ops-kpi-tile">
                    <p className="ops-kpi-label">지원 (검토 중)</p>
                    <p className="ops-kpi-value">{matching.applications.SUBMITTED.toLocaleString()}</p>
                  </div>
                  <div className="ops-kpi-tile ops-kpi-blue">
                    <p className="ops-kpi-label">면접 예정</p>
                    <p className="ops-kpi-value">{matching.applications.INTERVIEW.toLocaleString()}</p>
                  </div>
                  <div className="ops-kpi-tile ops-kpi-green">
                    <p className="ops-kpi-label">합격</p>
                    <p className="ops-kpi-value">{matching.applications.ACCEPTED.toLocaleString()}</p>
                  </div>
                  <div className="ops-kpi-tile">
                    <p className="ops-kpi-label">불합격</p>
                    <p className="ops-kpi-value">{matching.applications.REJECTED.toLocaleString()}</p>
                  </div>
                </div>
                <div className="ops-funnel-grid">
                  <div className="ops-kpi-tile ops-kpi-blue">
                    <p className="ops-kpi-label">진행 중 프로그램</p>
                    <p className="ops-kpi-value">{matching.activePrograms.toLocaleString()}</p>
                  </div>
                  <div className="ops-kpi-tile ops-kpi-green">
                    <p className="ops-kpi-label">완료된 프로그램</p>
                    <p className="ops-kpi-value">{matching.completedPrograms.toLocaleString()}</p>
                  </div>
                  <div className="ops-kpi-tile ops-kpi-amber">
                    <p className="ops-kpi-label">학점 인정 심사 대기</p>
                    <p className="ops-kpi-value">{matching.openSchoolCreditRequests.toLocaleString()}</p>
                  </div>
                  <div className="ops-kpi-tile">
                    <p className="ops-kpi-label">최근 7일 신규 지원</p>
                    <p className="ops-kpi-value">{matching.applicationsLast7Days.toLocaleString()}</p>
                  </div>
                </div>
              </article>
            </section>
          ) : null}

          <section>
            <h2 className="ops-section-heading">최근 활동 (7일)</h2>
            {activity.length === 0 ? (
              <div className="ops-empty-card">최근 활동이 없습니다.</div>
            ) : (
              <article className="ops-card">
                <div className="ops-activity-feed">
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
                      <span className="ops-activity-time">{formatRelativeOps(it.occurredAt)}</span>
                    </Link>
                  ))}
                </div>
              </article>
            )}
          </section>

          <section>
            <h2 className="ops-section-heading">빠른 이동</h2>
            <div className="ops-card-grid">
              {QUICK_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="ops-list-card">
                  <p className="ops-list-card-title">{link.label} →</p>
                  <p className="ops-list-card-sub">{link.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {recent.length > 0 ? (
            <section>
              <h2 className="ops-section-heading">최근 가입한 사용자</h2>
              <article className="ops-table-card">
                <table>
                  <colgroup>
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "32%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "20%" }} />
                  </colgroup>
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
                    {recent.map((u) => (
                      <tr key={u.id}>
                        <td className="ops-row-strong">{u.name ?? "-"}</td>
                        <td>{u.email}</td>
                        <td>{ROLE_LABEL[u.role] ?? u.role}</td>
                        <td>{PROVIDER_LABEL[u.authProvider] ?? u.authProvider}</td>
                        <td className="ops-row-sub">{formatRelativeTime(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}
