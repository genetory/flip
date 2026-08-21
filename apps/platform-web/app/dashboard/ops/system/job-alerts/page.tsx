"use client";

// 직무 알림(B2) 운영 — 스케줄러 설정 + 발송 집계 + 최근 발송 목록.
import { useEffect, useMemo, useState } from "react";

function readCookie(key: string) {
  if (typeof document === "undefined") return "";
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${key}=`));
  if (entry) return decodeURIComponent(entry.split("=")[1] ?? "");
  try {
    return window.localStorage.getItem("platform_access_token") || "";
  } catch {
    return "";
  }
}

type RecentAlert = { id: string; title: string; company: string | null; sentAt: string | null };
type Summary = {
  config: { enabled: boolean; hourKst: number; minuteKst: number; runOnBoot: boolean };
  totalSent: number;
  last24h: number;
  recent: RecentAlert[];
};

export default function OpsJobAlertsPage() {
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${apiBaseUrl}/ops/job-alerts/summary`, { headers: { Authorization: `Bearer ${readCookie("ops_admin_token")}` } });
        const d = (await res.json().catch(() => null)) as ({ ok?: boolean; message?: string } & Summary) | null;
        if (!res.ok || d?.ok !== true) throw new Error(d?.message ?? "불러오지 못했어요.");
        if (alive) setData(d);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "불러오지 못했어요.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [apiBaseUrl]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="ops-page">
      <header className="ops-page-head">
        <h1 className="ops-page-title">직무 알림</h1>
        <p className="ops-page-desc">공고 오픈 시 지원자에게 발송되는 직무 알림(B2)의 스케줄러 상태와 발송 현황이에요.</p>
      </header>

      {error ? <p style={{ color: "var(--danger)", fontWeight: 600, marginTop: 16 }}>{error}</p> : null}

      {loading ? (
        <p style={{ padding: "24px 0", color: "var(--ink-faint)" }}>불러오는 중…</p>
      ) : !data ? null : (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 상태 카드 3개 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--surface)", padding: 16 }}>
              <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>스케줄러</p>
              <p style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: data.config.enabled ? "var(--accent-ink)" : "var(--danger)" }}>
                {data.config.enabled ? "동작 중" : "꺼짐"}
              </p>
              <p style={{ marginTop: 2, fontSize: 12, color: "var(--ink-faint)" }}>
                매일 {pad(data.config.hourKst)}:{pad(data.config.minuteKst)} KST
              </p>
            </div>
            <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--surface)", padding: 16 }}>
              <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>최근 24시간 발송</p>
              <p style={{ marginTop: 4, fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{data.last24h.toLocaleString()}</p>
              <p style={{ marginTop: 2, fontSize: 12, color: "var(--ink-faint)" }}>건</p>
            </div>
            <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--surface)", padding: 16 }}>
              <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>누적 발송 공고</p>
              <p style={{ marginTop: 4, fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{data.totalSent.toLocaleString()}</p>
              <p style={{ marginTop: 2, fontSize: 12, color: "var(--ink-faint)" }}>건</p>
            </div>
          </div>

          {/* 최근 발송 목록 */}
          <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--surface)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--ink-faint)", borderBottom: "1px solid var(--line)" }}>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>공고</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>회사</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "right" }}>발송 시각</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: 24, textAlign: "center", color: "var(--ink-faint)" }}>아직 발송된 알림이 없어요.</td></tr>
                ) : (
                  data.recent.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--line)", color: "var(--ink)" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 600 }}>{r.title || "-"}</td>
                      <td style={{ padding: "12px 14px", color: "var(--ink-soft)" }}>{r.company || "-"}</td>
                      <td style={{ padding: "12px 14px", textAlign: "right", color: "var(--ink-faint)", fontVariantNumeric: "tabular-nums" }}>
                        {r.sentAt ? r.sentAt.slice(0, 16).replace("T", " ") : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>
            발송 중복은 공고별 <code>jobAlertSentAt</code> 로 방지돼요. 스케줄러 On/Off는 환경변수 <code>JOB_ALERT_SCHEDULER_ENABLED</code> 로 제어합니다.
          </p>
        </div>
      )}
    </div>
  );
}
