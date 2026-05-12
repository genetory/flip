"use client";

import { useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";

type ProviderRow = Record<string, Record<"STUDENT" | "PARTNER" | "OPERATOR", number>>;

type InflowPayload = {
  byProvider: ProviderRow;
  topAffiliations: { affiliation: string | null; count: number }[];
  weekly: { week: string; STUDENT: number; PARTNER: number; OPERATOR: number }[];
};

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

export default function InflowPage() {
  const [data, setData] = useState<InflowPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const weeklyMax = useMemo(() => {
    if (!data) return 0;
    return data.weekly.reduce(
      (acc, w) => Math.max(acc, w.STUDENT + w.PARTNER + w.OPERATOR),
      0
    );
  }, [data]);

  return (
    <section className="ops-content-section">
      <header>
        <h1>유입 경로 관리</h1>
        <p>가입 채널(이메일·소셜)과 학교/소속 기준 유입 분포를 추적하고, 주간 신규 가입 추이를 확인하세요.</p>
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
            <h2 className="ops-section-title">주간 신규 가입 추이 (최근 12주)</h2>
            {data.weekly.length === 0 ? (
              <p className="ops-card-subtle" style={{ margin: 0 }}>최근 12주 내 신규 가입자가 없습니다.</p>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 180, marginTop: 12 }}>
                {data.weekly.map((w) => {
                  const total = w.STUDENT + w.PARTNER + w.OPERATOR;
                  const totalPct = weeklyMax > 0 ? (total / weeklyMax) * 100 : 0;
                  const studentH = total > 0 ? (w.STUDENT / total) * totalPct : 0;
                  const partnerH = total > 0 ? (w.PARTNER / total) * totalPct : 0;
                  const operatorH = total > 0 ? (w.OPERATOR / total) * totalPct : 0;
                  return (
                    <div key={w.week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div
                        style={{ width: "100%", height: 150, position: "relative", display: "flex", flexDirection: "column-reverse" }}
                        title={`${w.week}: 학생 ${w.STUDENT}, 파트너 ${w.PARTNER}, 운영자 ${w.OPERATOR}`}
                      >
                        <div style={{ background: "#3b82f6", height: `${studentH}%`, width: "100%", borderRadius: studentH > 0 ? "4px 4px 0 0" : 0 }} />
                        <div style={{ background: "#8b5cf6", height: `${partnerH}%`, width: "100%" }} />
                        <div style={{ background: "#f59e0b", height: `${operatorH}%`, width: "100%", borderRadius: operatorH > 0 ? "4px 4px 0 0" : 0 }} />
                      </div>
                      <span style={{ fontSize: 10, color: "#6b7280" }}>{w.week.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            )}
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
