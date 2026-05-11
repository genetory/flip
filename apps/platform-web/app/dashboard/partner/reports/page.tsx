"use client";

import { useEffect, useState } from "react";
import { readAccessToken } from "../../../../lib/auth-client";

type PartnerReports = {
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
};

type PositionBreakdown = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  applicationsTotal: number;
  byStatus: { SUBMITTED: number; INTERVIEW: number; ACCEPTED: number; REJECTED: number };
  acceptanceRate: number;
};

const POSITION_STATUS_PILL: Record<string, string> = {
  DRAFT: "ops-pill-gray",
  PENDING_REVIEW: "ops-pill-amber",
  OPEN: "ops-pill-green",
  PAUSED: "ops-pill-amber",
  CLOSED: "ops-pill-gray",
  REJECTED: "ops-pill-red"
};

const POSITION_STATUS_KO: Record<string, string> = {
  DRAFT: "초안",
  PENDING_REVIEW: "검수 대기",
  OPEN: "모집 중",
  PAUSED: "일시 중단",
  CLOSED: "마감",
  REJECTED: "반려"
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function PartnerReportsPage() {
  const [stats, setStats] = useState<PartnerReports | null>(null);
  const [positions, setPositions] = useState<PositionBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, positionsRes] = await Promise.all([
          fetch(`${apiBase()}/partner/reports`, { headers: authHeaders(), cache: "no-store" }),
          fetch(`${apiBase()}/partner/reports/positions`, { headers: authHeaders(), cache: "no-store" })
        ]);
        if (!overviewRes.ok) {
          if (overviewRes.status === 403) throw new Error("회사 정보를 먼저 등록해야 리포트를 볼 수 있습니다.");
          throw new Error(`HTTP ${overviewRes.status}`);
        }
        const overview = (await overviewRes.json()) as { stats?: PartnerReports };
        setStats(overview.stats ?? null);
        if (positionsRes.ok) {
          const posPayload = (await positionsRes.json()) as { items?: PositionBreakdown[] };
          setPositions(posPayload.items ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "리포트를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <section className="ops-content-section">
      <header>
        <h1>채용 리포트</h1>
        <p>우리 회사의 포지션 · 지원 · 프로그램 · 발급물 종합 통계.</p>
      </header>

      {loading ? (
        <div className="ops-empty-card">불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : !stats ? (
        <div className="ops-empty-card">아직 데이터가 없습니다.</div>
      ) : (
        <>
          <article className="ops-card">
            <h2 className="ops-section-title">포지션</h2>
            <div className="ops-kpi-grid">
              <div className="ops-kpi-tile">
                <p className="ops-kpi-label">초안</p>
                <p className="ops-kpi-value">{stats.positions.byStatus.DRAFT.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile ops-kpi-amber">
                <p className="ops-kpi-label">검수 대기</p>
                <p className="ops-kpi-value">{stats.positions.byStatus.PENDING_REVIEW.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile ops-kpi-green">
                <p className="ops-kpi-label">모집 중</p>
                <p className="ops-kpi-value">{stats.positions.byStatus.OPEN.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile">
                <p className="ops-kpi-label">일시 중단</p>
                <p className="ops-kpi-value">{stats.positions.byStatus.PAUSED.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile">
                <p className="ops-kpi-label">마감</p>
                <p className="ops-kpi-value">{stats.positions.byStatus.CLOSED.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile">
                <p className="ops-kpi-label">반려</p>
                <p className="ops-kpi-value">{stats.positions.byStatus.REJECTED.toLocaleString()}</p>
              </div>
            </div>
            <p className="ops-card-subtle" style={{ marginTop: 8 }}>최근 7일 신규 등록: <strong>{stats.positions.last7Days.toLocaleString()}</strong>건</p>
          </article>

          <article className="ops-card">
            <h2 className="ops-section-title">지원 → 합격 퍼널</h2>
            <div className="ops-funnel-grid">
              <div className="ops-kpi-tile">
                <p className="ops-kpi-label">검토 중</p>
                <p className="ops-kpi-value">{stats.applications.byStatus.SUBMITTED.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile ops-kpi-blue">
                <p className="ops-kpi-label">면접 예정</p>
                <p className="ops-kpi-value">{stats.applications.byStatus.INTERVIEW.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile ops-kpi-green">
                <p className="ops-kpi-label">합격</p>
                <p className="ops-kpi-value">{stats.applications.byStatus.ACCEPTED.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile">
                <p className="ops-kpi-label">불합격</p>
                <p className="ops-kpi-value">{stats.applications.byStatus.REJECTED.toLocaleString()}</p>
              </div>
            </div>
            <p className="ops-card-subtle" style={{ marginTop: 8 }}>최근 7일 신규 지원: <strong>{stats.applications.last7Days.toLocaleString()}</strong>건</p>
          </article>

          <article className="ops-card">
            <h2 className="ops-section-title">프로그램 · 발급물</h2>
            <div className="ops-funnel-grid">
              <div className="ops-kpi-tile ops-kpi-blue">
                <p className="ops-kpi-label">진행 중 프로그램</p>
                <p className="ops-kpi-value">{stats.programs.byStatus.ACTIVE.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile ops-kpi-green">
                <p className="ops-kpi-label">완료된 프로그램</p>
                <p className="ops-kpi-value">{stats.programs.byStatus.COMPLETED.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile ops-kpi-green">
                <p className="ops-kpi-label">발급 수료증</p>
                <p className="ops-kpi-value">{stats.artifacts.certificates.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile ops-kpi-blue">
                <p className="ops-kpi-label">발급 추천서</p>
                <p className="ops-kpi-value">{stats.artifacts.recommendations.toLocaleString()}</p>
              </div>
            </div>
          </article>

          <article className="ops-card">
            <h2 className="ops-section-title">포지션별 상세 ({positions.length})</h2>
            {positions.length === 0 ? (
              <p className="ops-card-subtle" style={{ margin: 0 }}>등록된 포지션이 없습니다.</p>
            ) : (
              <article className="ops-table-card" style={{ marginTop: 12 }}>
                <table>
                  <colgroup>
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "8%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>포지션</th>
                      <th>상태</th>
                      <th>지원</th>
                      <th>검토</th>
                      <th>면접</th>
                      <th>합격</th>
                      <th>불합격</th>
                      <th>합격률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p) => (
                      <tr key={p.id}>
                        <td className="ops-row-strong">{p.title}</td>
                        <td>
                          <span className={`ops-pill ${POSITION_STATUS_PILL[p.status] ?? "ops-pill-gray"}`}>
                            {POSITION_STATUS_KO[p.status] ?? p.status}
                          </span>
                        </td>
                        <td className="ops-row-strong">{p.applicationsTotal.toLocaleString()}</td>
                        <td>{p.byStatus.SUBMITTED.toLocaleString()}</td>
                        <td>{p.byStatus.INTERVIEW.toLocaleString()}</td>
                        <td style={{ color: "#047857", fontWeight: 600 }}>{p.byStatus.ACCEPTED.toLocaleString()}</td>
                        <td>{p.byStatus.REJECTED.toLocaleString()}</td>
                        <td className="ops-row-sub">{p.acceptanceRate}%</td>
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
