"use client";

// Talent 퍼널 — TalentEvent(행동 원장) 기반 전환 측정. North Star: Verified→Interview→Hire.
// 단계별 고유 Talent 수 + 이벤트 수 + 단계 간 전환율.
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

type Stage = { key: string; label: string; talents: number; events: number };

export default function OpsTalentFunnelPage() {
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const [stages, setStages] = useState<Stage[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/ops/talent-funnel`, { headers: { Authorization: `Bearer ${readCookie("ops_admin_token")}` } });
        const d = (await res.json().catch(() => null)) as { ok?: boolean; message?: string; stages?: Stage[]; totalEvents?: number } | null;
        if (!res.ok || d?.ok !== true) throw new Error(d?.message ?? "불러오지 못했어요.");
        if (alive) {
          setStages(d.stages ?? []);
          setTotalEvents(d.totalEvents ?? 0);
        }
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

  const maxT = stages.reduce((m, s) => Math.max(m, s.talents), 0) || 1;

  return (
    <div className="ops-page">
      <header className="ops-page-head">
        <h1 className="ops-page-title">Talent 퍼널</h1>
        <p className="ops-page-desc">행동 원장(TalentEvent) 기반 전환 측정 — 진단부터 채용까지 각 단계의 고유 인원과 전환율이에요.</p>
      </header>

      {error ? <p style={{ color: "var(--danger)", fontWeight: 600, marginTop: 16 }}>{error}</p> : null}

      {loading ? (
        <p style={{ padding: "24px 0", color: "var(--ink-faint)" }}>불러오는 중…</p>
      ) : (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 16 }}>
            총 이벤트 <b style={{ color: "var(--ink)" }}>{totalEvents.toLocaleString()}</b>건 기록됨
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stages.map((s, i) => {
              const prev = i > 0 ? stages[i - 1] : null;
              const conv = prev && prev.talents > 0 ? Math.round((s.talents / prev.talents) * 100) : null;
              const width = Math.max(4, Math.round((s.talents / maxT) * 100));
              const isHire = s.key === "hired";
              return (
                <div key={s.key} style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--surface)", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-faint)", fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{s.label}</span>
                      {conv !== null ? (
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: conv >= 50 ? "#0A9B59" : "var(--ink-faint)" }}>
                          ↓ {conv}%
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontVariantNumeric: "tabular-nums", fontSize: 12.5, color: "var(--ink-faint)" }}>
                      <b style={{ fontSize: 18, color: isHire ? "#0A9B59" : "var(--ink)" }}>{s.talents.toLocaleString()}</b> 명
                      <span style={{ marginLeft: 8 }}>· {s.events.toLocaleString()} 이벤트</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, height: 8, borderRadius: 999, background: "var(--surface-2, #F2F4F6)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${width}%`, borderRadius: 999, background: isHire ? "linear-gradient(90deg,#0A9B59,#12B76A)" : "linear-gradient(90deg,#0B46E8,#3A6BFF)" }} />
                  </div>
                </div>
              );
            })}
          </div>

          <p style={{ marginTop: 16, fontSize: 12, color: "var(--ink-faint)" }}>
            단계별 숫자는 <b>고유 Talent 수</b>(한 명이 여러 번 해도 1명), 이벤트는 발생 총횟수예요. 전환율은 직전 단계 대비 진입률.
          </p>
        </div>
      )}
    </div>
  );
}
