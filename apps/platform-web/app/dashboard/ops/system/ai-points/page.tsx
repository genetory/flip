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

type PointLog = { id: string; amount: number; reason: string; createdAt: string };

function roleLabel(role: WalletRow["role"]) {
  if (role === "OPERATOR") return "운영자";
  if (role === "PARTNER") return "파트너";
  return "일반회원";
}

// 소모 내역의 reason 은 기능 키(feature) 또는 적립 사유. 사람이 읽을 라벨로 매핑.
const REASON_LABEL: Record<string, string> = {
  ops_grant: "운영자 지급",
  welcome: "가입 보너스",
  daily: "일일 적립",
  coupon: "쿠폰 적립",
  career_report: "커리어 스코어",
  resume_score: "이력서 점수",
  cover_score: "자소서 점수",
  interview_score: "면접 점수",
  experience_mining: "경험 채굴",
  jd_match: "JD 매칭",
  story_bank: "스토리 은행",
  answer_bank: "답변 은행",
  chat: "AI 채팅",
  resume_maker: "이력서 생성",
  cover_maker: "자소서 생성",
  interview: "모의면접"
};
function reasonText(reason: string) {
  return REASON_LABEL[reason] ?? reason;
}

export default function OpsAiPointsPage() {
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const [items, setItems] = useState<WalletRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [grantingId, setGrantingId] = useState<string | null>(null);
  const [logRow, setLogRow] = useState<WalletRow | null>(null);
  const [logs, setLogs] = useState<PointLog[] | null>(null);
  const [logLoading, setLogLoading] = useState(false);

  const authHeader = () => ({ Authorization: `Bearer ${readCookie("ops_admin_token")}` });

  const openLogs = async (row: WalletRow) => {
    setLogRow(row);
    setLogs(null);
    setLogLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/ops/ai-wallets/${encodeURIComponent(row.userId)}/logs`, { headers: authHeader() });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; items?: PointLog[] } | null;
      if (!res.ok || data?.ok !== true) throw new Error("불러오지 못했어요.");
      setLogs(data.items ?? []);
    } catch {
      setLogs([]);
    } finally {
      setLogLoading(false);
    }
  };

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
              <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "right" }}>내역 / 지급</th>
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
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => void openLogs(r)}
                        style={{ height: 32, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontWeight: 700, padding: "0 12px", cursor: "pointer" }}
                      >
                        내역
                      </button>
                      <button
                        type="button"
                        onClick={() => void grant(r)}
                        disabled={grantingId === r.userId}
                        style={{ height: 32, borderRadius: 8, border: "1px solid var(--accent)", background: "var(--accent-soft)", color: "var(--accent-ink)", fontWeight: 700, padding: "0 12px", cursor: "pointer" }}
                      >
                        {grantingId === r.userId ? "지급 중…" : "포인트 지급"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 12, fontSize: 12, color: "var(--ink-faint)" }}>최근 가입 50명(검색 시 조건 일치) · 지급 내역은 포인트 원장(ops_grant)에 기록됩니다.</p>

      {/* 포인트 내역 모달 — 적립(양수)·소모(음수) 최근 100건 */}
      {logRow ? (
        <div
          onClick={() => setLogRow(null)}
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 460, maxHeight: "80vh", overflowY: "auto", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: 20 }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>포인트 내역</h2>
                <p style={{ marginTop: 2, fontSize: 12.5, color: "var(--ink-faint)" }}>{logRow.email} · 잔액 {logRow.balance.toLocaleString()}P</p>
              </div>
              <button type="button" onClick={() => setLogRow(null)} style={{ height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontWeight: 700, padding: "0 12px", cursor: "pointer" }}>
                닫기
              </button>
            </div>

            <div style={{ marginTop: 14 }}>
              {logLoading ? (
                <p style={{ padding: "20px 0", textAlign: "center", color: "var(--ink-faint)" }}>불러오는 중…</p>
              ) : !logs || logs.length === 0 ? (
                <p style={{ padding: "20px 0", textAlign: "center", color: "var(--ink-faint)" }}>내역이 없어요.</p>
              ) : (
                <ul style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {logs.map((l) => (
                    <li key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 4px", borderBottom: "1px solid var(--line)" }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{reasonText(l.reason)}</p>
                        <p style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{l.createdAt.slice(0, 16).replace("T", " ")}</p>
                      </div>
                      <span
                        style={{
                          flex: "none",
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 800,
                          fontSize: 13.5,
                          color: l.amount >= 0 ? "var(--accent-ink)" : "var(--danger)"
                        }}
                      >
                        {l.amount >= 0 ? `+${l.amount}` : l.amount}P
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
