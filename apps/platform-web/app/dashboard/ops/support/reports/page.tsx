"use client";

import { useEffect, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";

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

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ReportsPage() {
  const [stats, setStats] = useState<ReportsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBase()}/ops/reports/overview`, {
          headers: authHeaders(),
          cache: "no-store"
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { stats?: ReportsOverview };
        setStats(payload.stats ?? null);
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
        <h1>리포트</h1>
        <p>플랫폼 전체의 사용자/포지션/지원/프로그램 등 주요 지표를 한눈에 확인하세요.</p>
      </header>

      {loading ? (
        <div className="ops-empty-card">리포트를 불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : !stats ? (
        <div className="ops-empty-card">아직 데이터가 없습니다.</div>
      ) : (
        <>
          <article className="ops-card">
            <h2 className="ops-section-title">사용자</h2>
            <div className="ops-funnel-grid">
              <div className="ops-kpi-tile ops-kpi-blue">
                <p className="ops-kpi-label">학생</p>
                <p className="ops-kpi-value">{stats.users.byRole.STUDENT.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile">
                <p className="ops-kpi-label">파트너</p>
                <p className="ops-kpi-value">{stats.users.byRole.PARTNER.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile ops-kpi-amber">
                <p className="ops-kpi-label">운영자</p>
                <p className="ops-kpi-value">{stats.users.byRole.OPERATOR.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile ops-kpi-green">
                <p className="ops-kpi-label">최근 7일 가입</p>
                <p className="ops-kpi-value">{stats.users.last7Days.toLocaleString()}</p>
              </div>
            </div>
            <p className="ops-card-subtle" style={{ marginTop: 8 }}>최근 30일 누적 가입: <strong>{stats.users.last30Days.toLocaleString()}</strong>명</p>
          </article>

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
                <p className="ops-kpi-label">진행 중</p>
                <p className="ops-kpi-value">{stats.programs.byStatus.ACTIVE.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile ops-kpi-green">
                <p className="ops-kpi-label">완료</p>
                <p className="ops-kpi-value">{stats.programs.byStatus.COMPLETED.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile">
                <p className="ops-kpi-label">취소</p>
                <p className="ops-kpi-value">{stats.programs.byStatus.CANCELLED.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile ops-kpi-green">
                <p className="ops-kpi-label">수료증 / 추천서</p>
                <p className="ops-kpi-value">{stats.artifacts.certificates.toLocaleString()} / {stats.artifacts.recommendations.toLocaleString()}</p>
              </div>
            </div>
          </article>

          <article className="ops-card">
            <h2 className="ops-section-title">이슈 리포트</h2>
            <div className="ops-funnel-grid">
              <div className="ops-kpi-tile">
                <p className="ops-kpi-label">신규</p>
                <p className="ops-kpi-value">{stats.issues.byStatus.OPEN.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile ops-kpi-amber">
                <p className="ops-kpi-label">처리 중</p>
                <p className="ops-kpi-value">{stats.issues.byStatus.IN_PROGRESS.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile ops-kpi-green">
                <p className="ops-kpi-label">해결</p>
                <p className="ops-kpi-value">{stats.issues.byStatus.RESOLVED.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile">
                <p className="ops-kpi-label">종료</p>
                <p className="ops-kpi-value">{stats.issues.byStatus.CLOSED.toLocaleString()}</p>
              </div>
            </div>
          </article>
        </>
      )}
    </section>
  );
}
