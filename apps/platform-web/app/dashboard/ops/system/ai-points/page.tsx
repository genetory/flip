"use client";

// AI 포인트 운영 — 사용자별 지갑 잔액 조회 + 운영자 수동 지급.
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

type WalletRow = {
  userId: string;
  email: string;
  name: string | null;
  role: "STUDENT" | "PARTNER" | "OPERATOR";
  balance: number;
  updatedAt: string | null;
};

function roleLabel(role: WalletRow["role"]) {
  if (role === "OPERATOR") return "운영자";
  if (role === "PARTNER") return "파트너";
  return "일반회원";
}

export default function OpsAiPointsPage() {
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const [items, setItems] = useState<WalletRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [grantingId, setGrantingId] = useState<string | null>(null);

  const authHeader = () => ({ Authorization: `Bearer ${readCookie("ops_admin_token")}` });

  const load = async (query = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBaseUrl}/ops/ai-wallets${query ? `?q=${encodeURIComponent(query)}` : ""}`, { headers: authHeader() });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; items?: WalletRow[]; message?: string } | null;
      if (!res.ok || data?.ok !== true) throw new Error(data?.message ?? "불러오지 못했어요.");
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grant = async (row: WalletRow) => {
    const input = window.prompt(`${row.email} 님에게 지급할 AI 포인트 수를 입력하세요.`, "100");
    if (input == null) return;
    const amount = Math.floor(Number(input));
    if (!Number.isFinite(amount) || amount < 1) {
      window.alert("1 이상의 숫자를 입력하세요.");
      return;
    }
    setGrantingId(row.userId);
    try {
      const res = await fetch(`${apiBaseUrl}/ops/ai-wallets/${encodeURIComponent(row.userId)}/grant`, {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reason: "ops_grant" })
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; balance?: number; message?: string } | null;
      if (!res.ok || data?.ok !== true) throw new Error(data?.message ?? "지급에 실패했어요.");
      setItems((prev) => prev.map((r) => (r.userId === row.userId ? { ...r, balance: data.balance ?? r.balance } : r)));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "지급에 실패했어요.");
    } finally {
      setGrantingId(null);
    }
  };

  return (
    <div className="ops-page">
      <header className="ops-page-head">
        <h1 className="ops-page-title">AI 포인트</h1>
        <p className="ops-page-desc">사용자별 AI 포인트 지갑 잔액을 확인하고, 필요하면 수동으로 지급할 수 있어요.</p>
      </header>

      <form
        className="ops-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          void load(q.trim());
        }}
        style={{ display: "flex", gap: 8, margin: "16px 0" }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이메일 또는 이름으로 검색"
          className="ops-input"
          style={{ flex: 1, maxWidth: 320, height: 40, borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", padding: "0 12px" }}
        />
        <button type="submit" className="ops-btn ops-btn--primary" style={{ height: 40, borderRadius: 10, background: "var(--accent)", color: "#fff", fontWeight: 700, padding: "0 16px", border: "none" }}>
          검색
        </button>
      </form>

      {error ? <p style={{ color: "var(--danger)", fontWeight: 600 }}>{error}</p> : null}

      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 12, background: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--ink-faint)", borderBottom: "1px solid var(--line)" }}>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>이메일</th>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>이름</th>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>역할</th>
              <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "right" }}>잔액</th>
              <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "right" }}>지급</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "var(--ink-faint)" }}>불러오는 중…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "var(--ink-faint)" }}>결과가 없어요.</td></tr>
            ) : (
              items.map((r) => (
                <tr key={r.userId} style={{ borderBottom: "1px solid var(--line)", color: "var(--ink)" }}>
                  <td style={{ padding: "12px 14px" }}>{r.email}</td>
                  <td style={{ padding: "12px 14px" }}>{r.name || "-"}</td>
                  <td style={{ padding: "12px 14px" }}>{roleLabel(r.role)}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{r.balance.toLocaleString()} P</td>
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => void grant(r)}
                      disabled={grantingId === r.userId}
                      style={{ height: 32, borderRadius: 8, border: "1px solid var(--accent)", background: "var(--accent-soft)", color: "var(--accent-ink)", fontWeight: 700, padding: "0 12px", cursor: "pointer" }}
                    >
                      {grantingId === r.userId ? "지급 중…" : "포인트 지급"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 12, fontSize: 12, color: "var(--ink-faint)" }}>최근 가입 50명(검색 시 조건 일치) · 지급 내역은 포인트 원장(ops_grant)에 기록됩니다.</p>
    </div>
  );
}
