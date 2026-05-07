"use client";

import { useEffect, useMemo, useState } from "react";

const TOKEN_COOKIE_KEY = "ops_admin_token";

type PositionItem = {
  id: string;
  createdAt: string;
  position: {
    id: string;
    title: string;
    status: "DRAFT" | "PENDING_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "REJECTED";
  };
  partnerOrganization: { id: string; name: string } | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote?: string | null;
};

function readCookie(key: string) {
  if (typeof document === "undefined") return "";
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${key}=`));
  return entry ? decodeURIComponent(entry.split("=")[1] ?? "") : "";
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR");
}

function requestTypeLabel(item: PositionItem) {
  return "수정 요청";
}

export default function PositionRevisionManagementPage() {
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const [items, setItems] = useState<PositionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const reload = async () => {
    const token = readCookie(TOKEN_COOKIE_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("status", "PENDING");
      params.set("pageSize", "100");
      const response = await fetch(`${apiBaseUrl}/ops/position-revisions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as { ok?: boolean; items?: PositionItem[]; message?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? "요청 목록을 불러오지 못했습니다.");
      setItems(payload.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [apiBaseUrl]);

  const review = async (id: string, action: "approve" | "reject") => {
    const token = readCookie(TOKEN_COOKIE_KEY);
    if (!token) return;
    try {
      setActingId(id);
      const response = await fetch(`${apiBaseUrl}/ops/position-revisions/${encodeURIComponent(id)}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({})
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? "처리에 실패했습니다.");
      if (action === "approve") {
        window.alert("승인 완료: 수정사항이 반영되었습니다. 파트너는 이제 공개/정지/마감 상태를 변경할 수 있습니다.");
      } else {
        window.alert("반려 완료: 파트너가 수정 요청을 다시 제출해야 합니다.");
      }
      await reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "처리에 실패했습니다.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <section className="ops-content-section">
      <header>
        <h1>포지션 수정 관리</h1>
        <p>파트너의 포지션 수정 요청을 어드민이 승인/반려합니다. 승인되면 수정사항이 반영되고, 이후 파트너가 공개/정지/마감을 조정할 수 있습니다.</p>
      </header>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>어드민 승인 대기 요청</h2>
        </div>
        <div className="ops-partner-table-wrap ops-position-list-table-wrap">
          <table className="ops-partner-table ops-position-list-table">
            <colgroup>
              <col style={{ width: "28%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>포지션명</th>
                <th>파트너사</th>
                <th>요청 유형</th>
                <th>요청 시각</th>
                <th>처리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="ops-table-empty">불러오는 중...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="ops-table-empty">{error}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="ops-table-empty">어드민 승인 대기 중인 포지션 수정 요청이 없습니다.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td><span className="ops-cell-clamp-3">{item.position?.title ?? "-"}</span></td>
                    <td><span className="ops-cell-clamp-3">{item.partnerOrganization?.name ?? "-"}</span></td>
                    <td><span className="ops-cell-clamp-3">{requestTypeLabel(item)}</span></td>
                    <td><span className="ops-cell-clamp-3">{formatDateTime(item.createdAt)}</span></td>
                    <td>
                      <div className="ops-inline-actions">
                        <button type="button" className="ops-partner-add-button" onClick={() => void review(item.id, "approve")} disabled={actingId === item.id}>
                          수정 승인
                        </button>
                        <button type="button" className="ops-detail-button" onClick={() => void review(item.id, "reject")} disabled={actingId === item.id}>
                          수정 반려
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
