"use client";

// 결제 / 정산 — 모의 면접 이용권 결제(토스페이먼츠) 주문 목록 · 환불, 사용자별 이용권 지급·회수·내역.
// 환불: 일부 금액도 가능, 회수할 이용권 수를 정한다(잔액이 모자라면 남은 만큼만). 토스 취소 → 이용권 회수 → 원장 기록은 서버가 한 번에.
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

type Order = {
  id: string;
  userId: string;
  email: string | null;
  name: string | null;
  orderName: string;
  amount: number;
  credits: number;
  status: string;
  method: string | null;
  approvedAt: string | null;
  failReason: string | null;
  canceledAt: string | null;
  canceledAmount: number | null;
  cancelReason: string | null;
  createdAt: string;
};
type Wallet = { userId: string; email: string; name: string | null; credits: number | null; updatedAt: string | null };
type CreditLog = { id: string; amount: number; reason: string; orderId: string | null; createdAt: string };

const STATUS: Record<string, { label: string; cls: string }> = {
  DONE: { label: "결제 완료", cls: "ops-pill ops-pill-green" },
  CANCELED: { label: "환불", cls: "ops-pill ops-pill-gray" },
  PARTIAL_CANCELED: { label: "일부 환불", cls: "ops-pill ops-pill-amber" },
  FAILED: { label: "실패", cls: "ops-pill ops-pill-red" },
  READY: { label: "결제 대기", cls: "ops-pill ops-pill-gray" }
};
const REASON: Record<string, string> = { free_trial: "가입 첫 1회", purchase: "결제", refund: "환불", ops_grant: "운영자 지급", feedback: "답변 피드백", prep: "예상 질문" };
const dt = (s: string | null) => (s ? s.slice(0, 16).replace("T", " ") : "-");

const cell = { padding: "11px 12px" } as const;
const btn = { height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontWeight: 700, padding: "0 10px", cursor: "pointer" } as const;

export default function PaymentManagementPage() {
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const authHeader = () => ({ Authorization: `Bearer ${readCookie("ops_admin_token")}` });
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [wallets, setWallets] = useState<Wallet[] | null>(null);
  const [perSession, setPerSession] = useState(5);
  const [q, setQ] = useState("");
  const [logFor, setLogFor] = useState<Wallet | null>(null);
  const [logs, setLogs] = useState<CreditLog[] | null>(null);
  const [error, setError] = useState("");

  // 다시 불러오는 동안엔 지난 목록을 그대로 둔다(처음엔 null = 불러오는 중).
  const loadOrders = async (all = showAll) => {
    try {
      const res = await fetch(`${apiBaseUrl}/ops/payment-orders${all ? "?all=1" : ""}`, { headers: authHeader() });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; items?: Order[]; message?: string } | null;
      if (!res.ok || data?.ok !== true) throw new Error(data?.message ?? "주문을 불러오지 못했어요.");
      setOrders(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "주문을 불러오지 못했어요.");
      setOrders([]);
    }
  };
  const loadWallets = async (query = "") => {
    try {
      const res = await fetch(`${apiBaseUrl}/ops/interview-wallets${query ? `?q=${encodeURIComponent(query)}` : ""}`, { headers: authHeader() });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; items?: Wallet[]; perSession?: number } | null;
      if (!res.ok || data?.ok !== true) throw new Error("이용권 지갑을 불러오지 못했어요.");
      setWallets(data.items ?? []);
      if (data.perSession) setPerSession(data.perSession);
    } catch (e) {
      setError(e instanceof Error ? e.message : "이용권 지갑을 불러오지 못했어요.");
      setWallets([]);
    }
  };

  useEffect(() => {
    // 처음 한 번 서버에서 읽어 온다(응답이 오면 상태를 채운다).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOrders(false);
    void loadWallets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refund = async (o: Order) => {
    const amountIn = window.prompt(`환불 금액(원) — 전액은 ${o.amount.toLocaleString()}`, String(o.amount));
    if (amountIn == null) return;
    const cancelAmount = Math.floor(Number(amountIn));
    if (!Number.isFinite(cancelAmount) || cancelAmount < 1 || cancelAmount > o.amount) return window.alert("1원 이상, 결제 금액 이하로 입력하세요.");
    const deductIn = window.prompt(`회수할 이용권(답변 수) — 이 결제분은 ${o.credits}개. 잔액이 모자라면 남은 만큼만 회수돼요.`, String(o.credits));
    if (deductIn == null) return;
    const deductCredits = Math.max(0, Math.floor(Number(deductIn)) || 0);
    const reason = window.prompt("환불 사유(필수)", "고객 요청");
    if (!reason?.trim()) return;
    if (!window.confirm(`${o.email ?? o.userId} · ${cancelAmount.toLocaleString()}원 환불, 이용권 ${deductCredits}개 회수할까요?`)) return;
    try {
      const res = await fetch(`${apiBaseUrl}/ops/payment-orders/${encodeURIComponent(o.id)}/cancel`, {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim(), cancelAmount, deductCredits })
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; refunded?: number; deducted?: number; message?: string } | null;
      if (!res.ok || data?.ok !== true) throw new Error(data?.message ?? "환불하지 못했어요.");
      window.alert(`${(data.refunded ?? 0).toLocaleString()}원 환불, 이용권 ${data.deducted ?? 0}개 회수했어요.`);
      void loadOrders();
      void loadWallets(q.trim());
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "환불하지 못했어요.");
    }
  };

  const grant = async (w: Wallet, sign: 1 | -1) => {
    const input = window.prompt(`${w.email} — ${sign > 0 ? "지급" : "회수"}할 이용권(답변 수, 1회 = ${perSession}개)`, String(perSession));
    if (input == null) return;
    const n = Math.floor(Number(input));
    if (!Number.isFinite(n) || n < 1 || n > 500) return window.alert("1~500 사이로 입력하세요.");
    try {
      const res = await fetch(`${apiBaseUrl}/ops/interview-credits/${encodeURIComponent(w.userId)}/grant`, {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ credits: n * sign })
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; credits?: number; message?: string } | null;
      if (!res.ok || data?.ok !== true) throw new Error(data?.message ?? "처리하지 못했어요.");
      setWallets((prev) => (prev ?? []).map((r) => (r.userId === w.userId ? { ...r, credits: data.credits ?? r.credits } : r)));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "처리하지 못했어요.");
    }
  };

  const openLogs = async (w: Wallet) => {
    setLogFor(w);
    setLogs(null);
    try {
      const res = await fetch(`${apiBaseUrl}/ops/interview-credits/${encodeURIComponent(w.userId)}/logs`, { headers: authHeader() });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; items?: CreditLog[] } | null;
      setLogs(res.ok && data?.ok ? data.items ?? [] : []);
    } catch {
      setLogs([]);
    }
  };

  const doneSum = (orders ?? []).filter((o) => o.status === "DONE" || o.status === "PARTIAL_CANCELED").reduce((n, o) => n + o.amount - (o.canceledAmount ?? 0), 0);

  return (
    <div className="ops-page">
      <header className="ops-page-head">
        <h1 className="ops-page-title">결제 / 정산</h1>
        <p className="ops-page-desc">모의 면접 이용권 결제(토스페이먼츠) 주문을 보고 환불하고, 사용자별 이용권을 지급·회수할 수 있어요.</p>
      </header>
      {error ? <p style={{ color: "var(--danger)", fontWeight: 600 }}>{error}</p> : null}

      <h2 className="ops-section-title" style={{ marginTop: 20 }}>결제 주문</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 12px", fontSize: 13, color: "var(--ink-soft)" }}>
        <span>
          최근 100건 · 실매출(환불 제외) <b style={{ color: "var(--ink)" }}>{doneSum.toLocaleString()}원</b>
        </span>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => {
              setShowAll(e.target.checked);
              void loadOrders(e.target.checked);
            }}
          />
          결제 대기(결제창만 연 주문)도 보기
        </label>
      </div>
      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 12, background: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--ink-faint)", borderBottom: "1px solid var(--line)" }}>
              {["일시", "사용자", "상품", "금액", "상태", "결제수단", ""].map((h) => (
                <th key={h} style={{ ...cell, fontWeight: 700 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders === null ? (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--ink-faint)" }}>불러오는 중…</td></tr>
            ) : !orders.length ? (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--ink-faint)" }}>주문이 없어요.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: "1px solid var(--line)", color: "var(--ink)" }}>
                  <td style={cell}>{dt(o.approvedAt ?? o.createdAt)}</td>
                  <td style={cell}>
                    {o.email ?? o.userId}
                    {o.name ? <span style={{ color: "var(--ink-faint)" }}> · {o.name}</span> : null}
                  </td>
                  <td style={cell}>
                    {o.orderName}
                    <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{o.id}</div>
                  </td>
                  <td style={{ ...cell, fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
                    {o.amount.toLocaleString()}원
                    {o.canceledAmount ? <div style={{ fontSize: 11.5, color: "var(--danger)" }}>-{o.canceledAmount.toLocaleString()}원</div> : null}
                  </td>
                  <td style={cell}>
                    <span className={STATUS[o.status]?.cls ?? "ops-pill ops-pill-gray"}>{STATUS[o.status]?.label ?? o.status}</span>
                    {o.failReason ? <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{o.failReason}</div> : null}
                    {o.cancelReason ? <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{o.cancelReason}</div> : null}
                  </td>
                  <td style={cell}>{o.method ?? "-"}</td>
                  <td style={{ ...cell, textAlign: "right" }}>
                    {o.status === "DONE" ? (
                      <button type="button" style={{ ...btn, color: "var(--danger)" }} onClick={() => void refund(o)}>
                        환불
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="ops-section-title" style={{ marginTop: 32 }}>모의 면접 이용권</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void loadWallets(q.trim());
        }}
        style={{ display: "flex", gap: 8, margin: "8px 0 12px" }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이메일 또는 이름으로 검색" style={{ flex: 1, maxWidth: 320, height: 40, borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", padding: "0 12px" }} />
        <button type="submit" style={{ height: 40, borderRadius: 10, background: "var(--accent)", color: "#fff", fontWeight: 700, padding: "0 16px", border: "none" }}>
          검색
        </button>
      </form>
      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 12, background: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--ink-faint)", borderBottom: "1px solid var(--line)" }}>
              <th style={{ ...cell, fontWeight: 700 }}>이메일</th>
              <th style={{ ...cell, fontWeight: 700 }}>이름</th>
              <th style={{ ...cell, fontWeight: 700, textAlign: "right" }}>남은 이용권(답변)</th>
              <th style={{ ...cell, fontWeight: 700, textAlign: "right" }}>내역 / 지급 / 회수</th>
            </tr>
          </thead>
          <tbody>
            {wallets === null ? (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "var(--ink-faint)" }}>불러오는 중…</td></tr>
            ) : !wallets.length ? (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "var(--ink-faint)" }}>결과가 없어요.</td></tr>
            ) : (
              wallets.map((w) => (
                <tr key={w.userId} style={{ borderBottom: "1px solid var(--line)", color: "var(--ink)" }}>
                  <td style={cell}>{w.email}</td>
                  <td style={cell}>{w.name || "-"}</td>
                  <td style={{ ...cell, textAlign: "right", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{w.credits == null ? <span style={{ color: "var(--ink-faint)", fontWeight: 600 }}>아직 안 씀</span> : `${w.credits}개`}</td>
                  <td style={{ ...cell, textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <button type="button" style={btn} onClick={() => void openLogs(w)}>
                        내역
                      </button>
                      <button type="button" style={{ ...btn, border: "1px solid var(--accent)", background: "var(--accent-soft)", color: "var(--accent-ink)" }} onClick={() => void grant(w, 1)}>
                        지급
                      </button>
                      <button type="button" style={btn} onClick={() => void grant(w, -1)}>
                        회수
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 12, fontSize: 12, color: "var(--ink-faint)" }}>1회 = 답변 {perSession}개. 지급·회수는 이용권 원장(ops_grant)에 기록돼요. 처음 쓰는 사용자는 지급할 때 지갑이 만들어지며 가입 첫 1회도 함께 들어가요.</p>

      {logFor ? (
        <div onClick={() => setLogFor(null)} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, maxHeight: "80vh", overflowY: "auto", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>이용권 내역</h2>
                <p style={{ marginTop: 2, fontSize: 12.5, color: "var(--ink-faint)" }}>{logFor.email}</p>
              </div>
              <button type="button" onClick={() => setLogFor(null)} style={btn}>
                닫기
              </button>
            </div>
            <ul style={{ marginTop: 14, display: "flex", flexDirection: "column" }}>
              {logs === null ? (
                <li style={{ padding: "20px 0", textAlign: "center", color: "var(--ink-faint)" }}>불러오는 중…</li>
              ) : !logs.length ? (
                <li style={{ padding: "20px 0", textAlign: "center", color: "var(--ink-faint)" }}>내역이 없어요.</li>
              ) : (
                logs.map((l) => (
                  <li key={l.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 4px", borderBottom: "1px solid var(--line)" }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{REASON[l.reason] ?? l.reason}</p>
                      <p style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
                        {dt(l.createdAt)}
                        {l.orderId ? ` · ${l.orderId}` : ""}
                      </p>
                    </div>
                    <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 800, color: l.amount >= 0 ? "var(--accent-ink)" : "var(--danger)" }}>{l.amount >= 0 ? `+${l.amount}` : l.amount}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
