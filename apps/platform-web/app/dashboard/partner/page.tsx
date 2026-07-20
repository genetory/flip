"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { readAccessToken } from "../../../lib/auth-client";

type DashboardStats = {
  positions: { total: number; open: number; closed: number };
};

type RecentPosition = {
  id: string;
  title: string;
  status: "OPEN" | "PAUSED" | "CLOSED";
  createdAt: string;
};

type PartnerOrgPayload = {
  id: string;
  name: string;
  verificationApproved?: boolean;
};

const QUICK_LINKS = [
  { label: "포지션 등록 / 관리", href: "/dashboard/partner/positions", desc: "새 포지션을 올리거나 진행 중인 포지션을 관리해요" },
  { label: "지원자 관리", href: "/dashboard/partner/applicants", desc: "지원자 프로필 확인과 매칭 진행 상태 변경" },
  { label: "회사 정보 / 인증", href: "/dashboard/partner/company", desc: "회사 정보 편집과 인증 서류 업로드" }
];

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "임시저장",
  PENDING_REVIEW: "승인대기",
  OPEN: "모집중",
  PAUSED: "일시 중단",
  CLOSED: "마감",
  REJECTED: "반려"
};

const STATUS_PILL: Record<string, string> = {
  DRAFT: "ops-pill-gray",
  PENDING_REVIEW: "ops-pill-amber",
  OPEN: "ops-pill-green",
  PAUSED: "ops-pill-amber",
  CLOSED: "ops-pill-gray",
  REJECTED: "ops-pill-red"
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

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  linkPath: string;
  occurredAt: string;
};

const ACTIVITY_DOT_COLOR: Record<string, string> = {
  APPLICATION_NEW: "var(--accent-ink)",
  APPLICATION_STATUS: "var(--accent)",
  INTERVIEW_SELECTED: "var(--accent-ink)",
  INTERVIEW_CANCELLED: "var(--ink-faint)",
  ASSIGNMENT_SUBMITTED: "var(--accent-ink)",
  ASSIGNMENT_REVIEWED: "var(--accent-ink)",
  COMMENT_NEW: "var(--accent-ink)"
};

function formatRelativeKo(iso: string) {
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

export default function PartnerDashboardHome() {
  const { user } = useAuthSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentPosition[]>([]);
  const [org, setOrg] = useState<PartnerOrgPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      try {
        const token = readAccessToken();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
        const [dashResp, actResp] = await Promise.all([
          fetch(`${apiBaseUrl}/partner/dashboard`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            cache: "no-store"
          }),
          fetch(`${apiBaseUrl}/partner/activity`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            cache: "no-store"
          })
        ]);
        if (!dashResp.ok) {
          if (dashResp.status === 403) throw new Error("AFFILIATION_REQUIRED");
          throw new Error(`HTTP ${dashResp.status}`);
        }
        const payload = (await dashResp.json()) as {
          ok?: boolean;
          stats?: DashboardStats;
          recentPositions?: RecentPosition[];
          partnerOrganization?: PartnerOrgPayload;
        };
        if (!ignore && payload.ok) {
          setStats(payload.stats ?? null);
          setRecent(payload.recentPositions ?? []);
          setOrg(payload.partnerOrganization ?? null);
        }
        if (actResp.ok) {
          const actPayload = (await actResp.json()) as { items?: ActivityItem[] };
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
    <section className="ops-content-section partner-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>파트너 대시보드</h1>
          <p>
            안녕하세요, {user?.name ?? "파트너"}님{org ? ` · ${org.name}` : ""}. 포지션과 지원자 현황을 한눈에 확인하세요.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="ops-empty-card">대시보드를 불러오는 중...</div>
      ) : error === "AFFILIATION_REQUIRED" ? (
        <article className="ops-card">
          <h2 className="ops-card-inline-heading">아직 회사 정보가 등록되지 않았어요</h2>
          <p className="ops-card-subtle">
            회사 정보를 먼저 등록하면 포지션을 올리고 지원자를 관리할 수 있어요.
          </p>
          <div className="partner-cta-row">
            <Link href="/partner-profile/edit" className="ops-btn ops-btn-primary">
              회사 등록하기
            </Link>
          </div>
        </article>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : (
        <>
          {stats ? (
            <section className="ops-card-grid">
              <Link href="/dashboard/partner/positions" className="ops-card partner-kpi partner-kpi--link">
                <p className="partner-kpi-label">전체 포지션</p>
                <p className="partner-kpi-value">{stats.positions.total.toLocaleString()}</p>
                <p className="partner-kpi-sub">
                  모집중 {stats.positions.open.toLocaleString()} · 마감 {stats.positions.closed.toLocaleString()}
                </p>
              </Link>
              <article className="ops-card partner-kpi">
                <p className="partner-kpi-label">회사 인증 상태</p>
                <p className={`partner-kpi-value ${org?.verificationApproved ? "is-emerald" : "is-amber"}`}>
                  {org?.verificationApproved ? "인증 완료" : "인증 대기 중"}
                </p>
                <Link href="/dashboard/partner/company" className="partner-kpi-link">
                  회사 정보 보기 →
                </Link>
              </article>
              <article className="ops-card partner-kpi">
                <p className="partner-kpi-label">지원자</p>
                <Link href="/dashboard/partner/applicants" className="partner-kpi-value">
                  지원자 목록 →
                </Link>
                <p className="partner-kpi-sub">접수된 지원자를 확인하고 매칭을 진행하세요</p>
              </article>
            </section>
          ) : null}

          <section>
            <h2 className="ops-section-heading">최근 활동</h2>
            {activity.length > 0 ? (
              <article className="ops-card">
                <div className="ops-activity-feed">
                  {activity.map((it) => (
                    <Link key={it.id} href={it.linkPath} className="ops-activity-item">
                      <span
                        className="ops-activity-dot"
                        style={{ background: ACTIVITY_DOT_COLOR[it.type] ?? "var(--ink-faint)" }}
                        aria-hidden
                      />
                      <div className="ops-activity-text">
                        <p className="ops-activity-title">{it.title}</p>
                        <p className="ops-activity-sub">{it.subtitle}</p>
                      </div>
                      <span className="ops-activity-time">{formatRelativeKo(it.occurredAt)}</span>
                    </Link>
                  ))}
                </div>
              </article>
            ) : (
              <div className="ops-empty-card">아직 활동이 없습니다. 지원자가 들어오면 여기에 표시됩니다.</div>
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
              <h2 className="ops-section-heading">최근 포지션</h2>
              <article className="ops-table-card">
                <table>
                  <colgroup>
                    <col style={{ width: "60%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "20%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>제목</th>
                      <th>상태</th>
                      <th>등록일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <Link href={`/dashboard/partner/positions`} className="ops-table-row-title">
                            {p.title}
                          </Link>
                        </td>
                        <td>
                          <span className={`ops-pill ${STATUS_PILL[p.status] ?? "ops-pill-gray"}`}>
                            {STATUS_LABEL[p.status] ?? p.status}
                          </span>
                        </td>
                        <td className="ops-row-sub">{formatRelativeTime(p.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            </section>
          ) : (
            <section>
              <article className="ops-card">
                <h2 className="ops-card-inline-heading">아직 올린 포지션이 없어요</h2>
                <p className="ops-card-subtle">
                  첫 포지션을 등록하고 지원자 매칭을 시작해보세요.
                </p>
                <div className="partner-cta-row">
                  <Link href="/dashboard/partner/positions" className="ops-btn ops-btn-primary">
                    포지션 등록하기
                  </Link>
                </div>
              </article>
            </section>
          )}
        </>
      )}
    </section>
  );
}
