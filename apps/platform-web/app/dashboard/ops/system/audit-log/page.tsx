"use client";

import { useEffect, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";

type AuditLogItem = {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  actor: { id: string; name: string | null; email: string; role: string } | null;
  actorRole: string | null;
};

const ACTION_LABEL: Record<string, string> = {
  USER_SUSPENDED: "사용자 정지",
  USER_REACTIVATED: "사용자 활성화",
  USER_ROLE_CHANGED: "사용자 역할 변경",
  USER_SELF_DELETED: "회원 탈퇴",
  NOTIFICATIONS_CLEANED: "알림 일괄 삭제"
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "medium" });
}

export default function AuditLogPage() {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [resourceFilter, setResourceFilter] = useState<string>("ALL");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (actionFilter !== "ALL") params.set("action", actionFilter);
      if (resourceFilter !== "ALL") params.set("resource", resourceFilter);
      const response = await fetch(`${apiBase()}/ops/audit-logs?${params.toString()}`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { items?: AuditLogItem[] };
      setItems(payload.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "감사 로그를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [actionFilter, resourceFilter]);

  const uniqueActions = Array.from(new Set(items.map((i) => i.action)));
  const uniqueResources = Array.from(new Set(items.map((i) => i.resource)));

  return (
    <section className="ops-content-section">
      <header>
        <h1>감사 로그</h1>
        <p>운영자 계정 변경, 사용자 정지, 시스템 작업 등 주요 액션 이력을 추적합니다.</p>
      </header>

      <article className="ops-card">
        <div className="ops-row" style={{ flexWrap: "wrap" }}>
          <label className="ops-form-label">
            액션
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="ops-select" style={{ marginTop: 4, minWidth: 200 }}>
              <option value="ALL">전체</option>
              {uniqueActions.map((a) => (
                <option key={a} value={a}>{ACTION_LABEL[a] ?? a}</option>
              ))}
            </select>
          </label>
          <label className="ops-form-label">
            리소스
            <select value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)} className="ops-select" style={{ marginTop: 4, minWidth: 200 }}>
              <option value="ALL">전체</option>
              {uniqueResources.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>
      </article>

      {loading ? (
        <div className="ops-empty-card">불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : items.length === 0 ? (
        <div className="ops-empty-card">해당 조건의 감사 로그가 없습니다.</div>
      ) : (
        <article className="ops-table-card">
          <table>
            <colgroup>
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "22%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>시점</th>
                <th>작업자</th>
                <th>액션</th>
                <th>리소스</th>
                <th>IP</th>
                <th>메타데이터</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="ops-row-sub">{formatDateTime(it.createdAt)}</td>
                  <td>
                    {it.actor ? (
                      <>
                        <div className="ops-row-strong">{it.actor.name ?? it.actor.email}</div>
                        <div className="ops-row-sub">{it.actor.email}</div>
                      </>
                    ) : (
                      <span className="ops-row-sub">시스템</span>
                    )}
                  </td>
                  <td>
                    <span className="ops-pill ops-pill-blue">{ACTION_LABEL[it.action] ?? it.action}</span>
                  </td>
                  <td>
                    <div>{it.resource}</div>
                    {it.resourceId ? <div className="ops-row-sub">{it.resourceId.slice(0, 8)}…</div> : null}
                  </td>
                  <td className="ops-row-sub">{it.ipAddress ?? "-"}</td>
                  <td>
                    {it.metadata && Object.keys(it.metadata).length > 0 ? (
                      <pre style={{ margin: 0, fontSize: 10, fontFamily: "ui-monospace, Menlo, monospace", whiteSpace: "pre-wrap", color: "var(--ink-soft)" }}>
                        {JSON.stringify(it.metadata)}
                      </pre>
                    ) : (
                      <span className="ops-row-sub">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      )}
    </section>
  );
}
