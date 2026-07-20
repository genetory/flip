"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";

type CrawlerRunSummary = {
  created?: number;
  updated?: number;
  skipped?: number;
  total?: number;
  sourceProvider?: string;
  sourcePlatform?: string;
};

type CrawlerSource = "all" | "buddies" | "wanted";

type CrawlerRunResult = {
  ok: boolean;
  startedAt: string;
  elapsedMs: number;
  source: CrawlerSource;
  buddies: CrawlerRunSummary | null;
  wanted: CrawlerRunSummary | null;
  errorMessage?: string;
};

type HistoryRow = {
  id: string;
  source: CrawlerSource | string;
  triggeredBy: "manual" | "scheduler" | string;
  startedAt: string;
  finishedAt: string | null;
  elapsedMs: number;
  ok: boolean;
  errorMessage: string | null;
  buddiesResult: CrawlerRunSummary | null;
  wantedResult: CrawlerRunSummary | null;
};

function formatKstDateTime(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "medium" });
}

function formatElapsed(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "-";
  if (ms < 1000) return `${ms}ms`;
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const min = Math.floor(sec / 60);
  const remSec = Math.round(sec - min * 60);
  return `${min}분 ${remSec}초`;
}

function summarizeResult(summary: CrawlerRunSummary | null) {
  if (!summary) return "-";
  const parts: string[] = [];
  if (typeof summary.created === "number") parts.push(`+${summary.created.toLocaleString()}`);
  if (typeof summary.updated === "number") parts.push(`~${summary.updated.toLocaleString()}`);
  if (typeof summary.skipped === "number") parts.push(`(${summary.skipped.toLocaleString()} skip)`);
  return parts.length > 0 ? parts.join(" ") : "-";
}

const SOURCE_LABEL: Record<string, string> = {
  all: "전체",
  buddies: "Buddies",
  wanted: "Wanted"
};

const TRIGGER_LABEL: Record<string, string> = {
  manual: "수동",
  scheduler: "자동"
};

export default function CrawlersPage() {
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const [running, setRunning] = useState<CrawlerSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CrawlerRunResult | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    const token = readAccessToken();
    if (!token) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/ops/crawlers/history?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as { ok?: boolean; items?: HistoryRow[]; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "이력 조회에 실패했습니다.");
      }
      setHistory(payload.items ?? []);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "이력 조회에 실패했습니다.");
    } finally {
      setHistoryLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const runCrawler = async (source: CrawlerSource) => {
    const token = readAccessToken();
    if (!token) {
      setError("로그인이 필요합니다. 운영자 계정으로 다시 로그인 후 시도해주세요.");
      return;
    }

    const path = source === "all" ? "/ops/crawlers/run" : `/ops/crawlers/run/${source}`;
    try {
      setRunning(source);
      setError(null);
      const response = await fetch(`${apiBaseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const payload = (await response.json()) as { ok?: boolean; result?: CrawlerRunResult; message?: string };
      if (!response.ok || !payload.ok || !payload.result) {
        throw new Error(payload.message ?? payload.result?.errorMessage ?? "크롤링 실행에 실패했습니다.");
      }
      setLastResult(payload.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "크롤링 실행에 실패했습니다.");
    } finally {
      setRunning(null);
      void loadHistory();
    }
  };

  return (
    <section className="ops-content-section">
      <header>
        <h1>크롤링</h1>
        <p>Buddies, Wanted 채용 공고 크롤러를 개별 또는 전체로 실행합니다. 매일 KST 00:00에 자동 실행되며, 이력은 아래에서 확인할 수 있습니다.</p>
      </header>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>수동 실행</h2>
        </div>
        <div className="ops-inline-actions" style={{ marginTop: 14 }}>
          <button type="button" className="ops-partner-add-button" onClick={() => void runCrawler("buddies")} disabled={running !== null}>
            {running === "buddies" ? "Buddies 실행 중..." : "Buddies 실행"}
          </button>
          <button type="button" className="ops-partner-add-button" onClick={() => void runCrawler("wanted")} disabled={running !== null}>
            {running === "wanted" ? "Wanted 실행 중..." : "Wanted 실행"}
          </button>
          <button type="button" className="ops-detail-button" onClick={() => void runCrawler("all")} disabled={running !== null}>
            {running === "all" ? "전체 실행 중..." : "전체 실행"}
          </button>
        </div>
        {error ? <p style={{ marginTop: 14, color: "var(--danger)" }}>{error}</p> : null}
      </article>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>최근 실행 결과</h2>
        </div>
        {lastResult ? (
          <pre style={{ margin: "14px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word", background: "var(--surface-2)", borderRadius: 10, padding: 14 }}>
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        ) : (
          <p style={{ marginTop: 14 }}>이번 세션에서 직접 실행한 결과가 없습니다. 아래 이력 참고하세요.</p>
        )}
      </article>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>실행 이력 (최근 50건)</h2>
          <button type="button" className="ops-detail-button" onClick={() => void loadHistory()} disabled={historyLoading}>
            {historyLoading ? "새로고침 중..." : "새로고침"}
          </button>
        </div>
        {historyError ? <p style={{ marginTop: 12, color: "var(--danger)" }}>{historyError}</p> : null}
        <div className="ops-partner-table-wrap" style={{ marginTop: 12 }}>
          <table className="ops-partner-table">
            <thead>
              <tr>
                <th>시작 시점</th>
                <th>대상</th>
                <th>트리거</th>
                <th>소요</th>
                <th>상태</th>
                <th>Buddies</th>
                <th>Wanted</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading && history.length === 0 ? (
                <tr><td colSpan={8} className="ops-table-empty">불러오는 중...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={8} className="ops-table-empty">실행 이력이 없습니다.</td></tr>
              ) : history.map((row) => (
                <tr key={row.id}>
                  <td>{formatKstDateTime(row.startedAt)}</td>
                  <td>{SOURCE_LABEL[row.source] ?? row.source}</td>
                  <td>{TRIGGER_LABEL[row.triggeredBy] ?? row.triggeredBy}</td>
                  <td className="ops-row-sub">{formatElapsed(row.elapsedMs)}</td>
                  <td>
                    {row.finishedAt == null ? (
                      <span className="ops-pill">진행 중</span>
                    ) : row.ok ? (
                      <span className="ops-pill ops-pill-blue">성공</span>
                    ) : (
                      <span className="ops-pill ops-pill-amber">실패</span>
                    )}
                  </td>
                  <td className="ops-row-sub" style={{ fontVariantNumeric: "tabular-nums" }}>{summarizeResult(row.buddiesResult)}</td>
                  <td className="ops-row-sub" style={{ fontVariantNumeric: "tabular-nums" }}>{summarizeResult(row.wantedResult)}</td>
                  <td className="ops-row-sub" style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.errorMessage ?? ""}>
                    {row.errorMessage ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
