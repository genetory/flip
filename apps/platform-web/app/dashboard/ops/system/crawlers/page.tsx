"use client";

import { useMemo, useState } from "react";

const TOKEN_COOKIE_KEY = "ops_admin_token";

type CrawlerRunSummary = {
  created?: number;
  updated?: number;
  skipped?: number;
  total?: number;
  sourceProvider?: string;
  sourcePlatform?: string;
};

type CrawlerSource = "all" | "kowork" | "buddies" | "wanted";

type CrawlerRunResult = {
  ok: boolean;
  startedAt: string;
  elapsedMs: number;
  source: CrawlerSource;
  kowork: CrawlerRunSummary | null;
  buddies: CrawlerRunSummary | null;
  wanted: CrawlerRunSummary | null;
  errorMessage?: string;
};

function readCookie(key: string) {
  if (typeof document === "undefined") return "";
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${key}=`));
  if (entry) return decodeURIComponent(entry.split("=")[1] ?? ""); try { return window.localStorage.getItem("platform_access_token") || ""; } catch { return ""; }
}

export default function CrawlersPage() {
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const [running, setRunning] = useState<CrawlerSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CrawlerRunResult | null>(null);

  const runCrawler = async (source: CrawlerSource) => {
    const token = readCookie(TOKEN_COOKIE_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
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
    }
  };

  return (
    <section className="ops-content-section">
      <header>
        <h1>크롤링</h1>
        <p>Kowork, Buddies, Wanted 채용 공고 크롤러를 개별 또는 전체로 실행합니다.</p>
      </header>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>수동 실행</h2>
        </div>
        <div className="ops-inline-actions" style={{ marginTop: 14 }}>
          <button type="button" className="ops-partner-add-button" onClick={() => void runCrawler("kowork")} disabled={running !== null}>
            {running === "kowork" ? "Kowork 실행 중..." : "Kowork 실행"}
          </button>
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
        {error ? <p style={{ marginTop: 14, color: "#b42318" }}>{error}</p> : null}
      </article>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>최근 실행 결과</h2>
        </div>
        {lastResult ? (
          <pre style={{ margin: "14px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#f8fafc", borderRadius: 10, padding: 14 }}>
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        ) : (
          <p style={{ marginTop: 14 }}>아직 실행 결과가 없습니다.</p>
        )}
      </article>
    </section>
  );
}
