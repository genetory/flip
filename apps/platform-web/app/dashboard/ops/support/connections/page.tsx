"use client";

import { useEffect, useState } from "react";
import { Handshake, ChatCircleDots, Warning } from "@phosphor-icons/react";
import { readAccessToken } from "../../../../../lib/auth-client";

type Tracking = {
  funnel: { total: number; submitted: number; interview: number; accepted: number; rejected: number; withdrawn: number; reachedInterview: number };
  attention: { staleApplications: number; staleThresholdDays: number; pendingInterviewSelect: number; selectThresholdDays: number };
  partners: { orgId: string; name: string; applied: number; interview: number; accepted: number; rejected: number; stale: number; reachedInterview: number }[];
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 1000) / 10;
}

export default function ConnectionsTrackingPage() {
  const [data, setData] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const token = readAccessToken();
        const res = await fetch(`${apiBase()}/ops/connections/tracking`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store"
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = (await res.json()) as { ok?: boolean } & Tracking;
        if (payload.ok) setData(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="ops-content-section">
      <header>
        <h1>커넥션 트래킹</h1>
        <p>회사↔지원자 연결의 전체 흐름과 지금 챙겨야 할 정체 건을 한눈에 봅니다.</p>
      </header>

      {loading ? (
        <div className="ops-empty-card">불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : !data ? (
        <div className="ops-empty-card">아직 데이터가 없습니다.</div>
      ) : (
        <>
          {/* 지금 챙길 것 */}
          <article className="ops-partner-list-card">
            <div className="ops-partner-list-top">
              <h2>지금 챙길 것</h2>
            </div>
            <div className="ops-report-kpi-strip">
              <div className="ops-report-kpi">
                <div className="ops-report-kpi-head">
                  <span className="icon" aria-hidden><Warning size={16} /></span>
                  <span>방치된 지원 ({data.attention.staleThresholdDays}일+ 미검토)</span>
                </div>
                <p className="value">{data.attention.staleApplications.toLocaleString()}</p>
                <p className={`delta ${data.attention.staleApplications > 0 ? "is-down" : "is-muted"}`}>
                  {data.attention.staleApplications > 0 ? "회사에 자동 넛지 발송됨" : "정체 없음"}
                </p>
              </div>
              <div className="ops-report-kpi">
                <div className="ops-report-kpi-head">
                  <span className="icon" aria-hidden><ChatCircleDots size={16} /></span>
                  <span>미선택 면접 ({data.attention.selectThresholdDays}일+ 미응답)</span>
                </div>
                <p className="value">{data.attention.pendingInterviewSelect.toLocaleString()}</p>
                <p className={`delta ${data.attention.pendingInterviewSelect > 0 ? "is-down" : "is-muted"}`}>
                  {data.attention.pendingInterviewSelect > 0 ? "지원자에게 자동 넛지 발송됨" : "정체 없음"}
                </p>
              </div>
            </div>
          </article>

          {/* 전체 퍼널 */}
          <article className="ops-partner-list-card">
            <div className="ops-partner-list-top">
              <h2>전체 커넥션 퍼널</h2>
              <span className="ops-card-subtle">전체 지원 {data.funnel.total.toLocaleString()}건 기준</span>
            </div>
            <div className="ops-report-kpi-strip">
              <div className="ops-report-kpi">
                <div className="ops-report-kpi-head"><span className="icon" aria-hidden><Handshake size={16} /></span><span>지원</span></div>
                <p className="value">{data.funnel.total.toLocaleString()}</p>
                <p className="delta is-muted">검토 대기 {data.funnel.submitted.toLocaleString()}</p>
              </div>
              <div className="ops-report-kpi">
                <div className="ops-report-kpi-head"><span className="icon" aria-hidden><Handshake size={16} /></span><span>면접 도달</span></div>
                <p className="value">{data.funnel.reachedInterview.toLocaleString()}</p>
                <p className="delta">{pct(data.funnel.reachedInterview, data.funnel.total)}% 전환</p>
              </div>
              <div className="ops-report-kpi">
                <div className="ops-report-kpi-head"><span className="icon" aria-hidden><Handshake size={16} /></span><span>합격</span></div>
                <p className="value">{data.funnel.accepted.toLocaleString()}</p>
                <p className="delta">{pct(data.funnel.accepted, data.funnel.total)}% 전환</p>
              </div>
            </div>
          </article>

          {/* 파트너별 성과 */}
          <article className="ops-partner-list-card">
            <div className="ops-partner-list-top">
              <h2>파트너별 성과</h2>
              <span className="ops-card-subtle">지원 많은 순 · 상위 30</span>
            </div>
            <div className="ops-partner-table-wrap">
              <table className="ops-partner-table">
                <thead>
                  <tr>
                    <th>파트너</th>
                    <th className="ops-num">지원</th>
                    <th className="ops-num">면접 도달</th>
                    <th className="ops-num">합격</th>
                    <th className="ops-num">합격률</th>
                    <th className="ops-num">방치</th>
                  </tr>
                </thead>
                <tbody>
                  {data.partners.length === 0 ? (
                    <tr><td colSpan={6} className="ops-table-empty">아직 지원이 없습니다.</td></tr>
                  ) : (
                    data.partners.map((p) => (
                      <tr key={p.orgId}>
                        <td className="ops-row-strong">{p.name}</td>
                        <td className="ops-num">{p.applied.toLocaleString()}</td>
                        <td className="ops-num">{p.reachedInterview.toLocaleString()}</td>
                        <td className="ops-num">{p.accepted.toLocaleString()}</td>
                        <td className="ops-num">{pct(p.accepted, p.applied)}%</td>
                        <td className="ops-num">
                          {p.stale > 0 ? <span className="ops-pill ops-pill-red">{p.stale}</span> : "0"}
                        </td>
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
