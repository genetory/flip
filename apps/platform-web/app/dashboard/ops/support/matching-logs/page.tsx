"use client";

import { useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";

type MatchingLog = {
  id: string;
  mode: string;
  source: string | null;
  positionId: string | null;
  candidateId: string | null;
  positionTitle: string | null;
  candidateLabel: string | null;
  resultCount: number;
  ranAt: string;
  createdAt: string;
};

type MatchingLogDetail = MatchingLog & {
  results: unknown;
};

type ModeStat = { mode: string; count: number };

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export default function MatchingLogsPage() {
  const [items, setItems] = useState<MatchingLog[]>([]);
  const [modeStats, setModeStats] = useState<ModeStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modeFilter, setModeFilter] = useState<string>("ALL");
  const [selected, setSelected] = useState<MatchingLogDetail | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ limit: "200" });
        if (modeFilter !== "ALL") params.set("mode", modeFilter);
        const response = await fetch(`${apiBase()}/ops/matching-logs?${params.toString()}`, {
          headers: authHeaders(),
          cache: "no-store"
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { items?: MatchingLog[]; modeStats?: ModeStat[] };
        setItems(payload.items ?? []);
        if (payload.modeStats) setModeStats(payload.modeStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "매칭 로그를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [modeFilter]);

  async function openDetail(id: string) {
    try {
      const response = await fetch(`${apiBase()}/ops/matching-logs/${id}`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { item?: MatchingLogDetail };
      if (payload.item) setSelected(payload.item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그 상세 조회 실패");
    }
  }

  const totalCount = useMemo(() => modeStats.reduce((acc, m) => acc + m.count, 0), [modeStats]);

  return (
    <section className="ops-content-section">
      <header>
        <h1>매칭 로그</h1>
        <p>매칭 엔진의 실행 기록을 모드별로 확인하고 결과를 검사하세요.</p>
      </header>

      <article className="ops-card">
        <div className="ops-filter-chip-row">
          <button
            type="button"
            className={`ops-filter-chip ${modeFilter === "ALL" ? "is-active" : ""}`}
            onClick={() => setModeFilter("ALL")}
          >
            전체 <span className="ops-filter-chip-count">{totalCount}</span>
          </button>
          {modeStats.map((m) => (
            <button
              key={m.mode}
              type="button"
              className={`ops-filter-chip ${modeFilter === m.mode ? "is-active" : ""}`}
              onClick={() => setModeFilter(m.mode)}
            >
              {m.mode} <span className="ops-filter-chip-count">{m.count}</span>
            </button>
          ))}
        </div>
      </article>

      {loading ? (
        <div className="ops-empty-card">매칭 로그를 불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : items.length === 0 ? (
        <div className="ops-empty-card">해당 모드의 매칭 로그가 없습니다.</div>
      ) : (
        <article className="ops-table-card">
          <table>
            <colgroup>
              <col style={{ width: "18%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "6%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>실행 시점</th>
                <th>모드</th>
                <th>소스</th>
                <th>포지션</th>
                <th>후보자</th>
                <th>결과 수</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="ops-row-sub">{formatDateTime(it.ranAt)}</td>
                  <td>
                    <span className="ops-pill ops-pill-blue">{it.mode}</span>
                  </td>
                  <td className="ops-row-sub">{it.source ?? "-"}</td>
                  <td>{it.positionTitle ?? "-"}</td>
                  <td>{it.candidateLabel ?? "-"}</td>
                  <td className="ops-row-strong">{it.resultCount}</td>
                  <td>
                    <button type="button" className="ops-btn" onClick={() => void openDetail(it.id)}>
                      상세
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      )}

      {selected ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11,18,39,0.55)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 24px 48px rgba(11,18,39,0.25)"
            }}
          >
            <div className="ops-card-header" style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>매칭 로그 상세</h2>
              <button type="button" className="ops-btn" onClick={() => setSelected(null)}>
                닫기
              </button>
            </div>
            <dl className="ops-list-card-meta" style={{ marginBottom: 12 }}>
              <dt>모드</dt>
              <dd>{selected.mode}</dd>
              <dt>실행 시점</dt>
              <dd>{formatDateTime(selected.ranAt)}</dd>
              <dt>소스</dt>
              <dd>{selected.source ?? "-"}</dd>
              <dt>포지션</dt>
              <dd>{selected.positionTitle ?? "-"} {selected.positionId ? `(${selected.positionId})` : ""}</dd>
              <dt>후보자</dt>
              <dd>{selected.candidateLabel ?? "-"} {selected.candidateId ? `(${selected.candidateId})` : ""}</dd>
              <dt>결과 수</dt>
              <dd>{selected.resultCount}</dd>
            </dl>
            <p className="ops-form-label">결과 JSON</p>
            <pre
              style={{
                background: "var(--surface-2)",
                borderRadius: 8,
                padding: 12,
                fontSize: 11,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: 360,
                overflow: "auto",
                margin: 0
              }}
            >
              {JSON.stringify(selected.results, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </section>
  );
}
