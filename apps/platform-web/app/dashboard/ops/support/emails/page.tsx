"use client";

import { useEffect, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";

type EmailStats = {
  totalUsers: number;
  verifiedUsers: number;
  verificationRate: number;
  verifyTokensLast7: number;
  verifyTokensLast30: number;
  preverifyTokensLast7: number;
};

type RecentToken = {
  id: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  email: string | null;
  name: string | null;
  role: string | null;
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export default function EmailManagementPage() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [tokens, setTokens] = useState<RecentToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBase()}/ops/email-stats`, {
          headers: authHeaders(),
          cache: "no-store"
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { stats?: EmailStats; recentTokens?: RecentToken[] };
        setStats(payload.stats ?? null);
        setTokens(payload.recentTokens ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "이메일 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <section className="ops-content-section">
      <header>
        <h1>이메일 관리</h1>
        <p>플랫폼이 발송한 인증 이메일 통계와 최근 인증 토큰 발급 이력을 확인하세요.</p>
      </header>

      {loading ? (
        <div className="ops-empty-card">불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : !stats ? (
        <div className="ops-empty-card">데이터가 없습니다.</div>
      ) : (
        <>
          <article className="ops-card">
            <h2 className="ops-section-title">이메일 인증 현황</h2>
            <div className="ops-funnel-grid">
              <div className="ops-kpi-tile">
                <p className="ops-kpi-label">전체 사용자</p>
                <p className="ops-kpi-value">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile ops-kpi-green">
                <p className="ops-kpi-label">인증 완료</p>
                <p className="ops-kpi-value">{stats.verifiedUsers.toLocaleString()}</p>
              </div>
              <div className="ops-kpi-tile ops-kpi-blue">
                <p className="ops-kpi-label">인증률</p>
                <p className="ops-kpi-value">{stats.verificationRate}%</p>
              </div>
              <div className="ops-kpi-tile ops-kpi-amber">
                <p className="ops-kpi-label">최근 7일 인증 발송</p>
                <p className="ops-kpi-value">{stats.verifyTokensLast7.toLocaleString()}</p>
              </div>
            </div>
            <p className="ops-card-subtle" style={{ marginTop: 8 }}>
              최근 30일 인증 토큰 발급: <strong>{stats.verifyTokensLast30.toLocaleString()}</strong>건 ·
              최근 7일 가입 전 사전 인증 토큰: <strong>{stats.preverifyTokensLast7.toLocaleString()}</strong>건
            </p>
          </article>

          <article className="ops-card">
            <h2 className="ops-section-title">최근 인증 토큰 발급 ({tokens.length}건)</h2>
            {tokens.length === 0 ? (
              <p className="ops-card-subtle" style={{ margin: 0 }}>최근 발급된 인증 토큰이 없습니다.</p>
            ) : (
              <article className="ops-table-card" style={{ marginTop: 12 }}>
                <table>
                  <colgroup>
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "32%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "18%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>발급 시점</th>
                      <th>대상</th>
                      <th>역할</th>
                      <th>만료</th>
                      <th>사용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map((t) => (
                      <tr key={t.id}>
                        <td className="ops-row-sub">{formatDateTime(t.createdAt)}</td>
                        <td>
                          <div className="ops-row-strong">{t.name ?? "-"}</div>
                          <div className="ops-row-sub">{t.email ?? "-"}</div>
                        </td>
                        <td>
                          <span className={`ops-pill ${t.role === "STUDENT" ? "ops-pill-blue" : t.role === "PARTNER" ? "ops-pill-violet" : t.role === "OPERATOR" ? "ops-pill-amber" : "ops-pill-gray"}`}>
                            {t.role === "STUDENT" ? "학생" : t.role === "PARTNER" ? "파트너" : t.role === "OPERATOR" ? "운영자" : "-"}
                          </span>
                        </td>
                        <td className="ops-row-sub">{formatDateTime(t.expiresAt)}</td>
                        <td>
                          {t.usedAt ? (
                            <span className="ops-pill ops-pill-green">{formatDateTime(t.usedAt)}</span>
                          ) : new Date(t.expiresAt).getTime() < Date.now() ? (
                            <span className="ops-pill ops-pill-gray">만료</span>
                          ) : (
                            <span className="ops-pill ops-pill-amber">대기</span>
                          )}
                        </td>
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
