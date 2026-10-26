"use client";

// 결제 — 매출 요약(오늘·이번 달·환불) · 주문 목록(상태·PG·검색) · 주문 상세와 환불.
// 회원별 포인트 잔액·지급·회수는 'AI 포인트' 메뉴에서 한다(예전엔 여기 아래에 같이 있었다).
// 환불: 일부 금액도 가능, 회수할 양을 정한다(포인트 주문은 포인트, 예전 주문은 이용권 · 잔액이 모자라면 남은 만큼만).
// PG 취소 → 회수 → 원장 기록은 서버가 한 번에. 정산이 끝난 페이앱 결제는 취소 요청으로 넘어가고 사유에 표시된다.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Chips, Field, KpiGrid, Modal, PageHead, SearchBox, dt, pts, useOpsApi, won } from "../_billing/shared";

type Order = {
  id: string;
  userId: string;
  email: string | null;
  name: string | null;
  orderName: string;
  amount: number;
  credits: number;
  status: string;
  provider?: string;
  paymentKey?: string | null;
  method: string | null;
  approvedAt: string | null;
  failReason: string | null;
  canceledAt: string | null;
  canceledAmount: number | null;
  cancelReason: string | null;
  createdAt: string;
  kind?: "points" | "interview";
};
type Summary = { today: { net: number; count: number }; month: { net: number; count: number }; refundsMonth: { amount: number; count: number } };
type OrdersRes = { items: Order[]; summary?: Summary; pointsEnabled?: boolean; provider?: "payapp" | "toss" | null };

const STATUS: Record<string, { label: string; cls: string }> = {
  DONE: { label: "결제 완료", cls: "ops-pill ops-pill-green" },
  PARTIAL_CANCELED: { label: "일부 환불", cls: "ops-pill ops-pill-amber" },
  CANCELED: { label: "환불", cls: "ops-pill ops-pill-gray" },
  FAILED: { label: "실패", cls: "ops-pill ops-pill-red" },
  READY: { label: "결제 대기", cls: "ops-pill ops-pill-gray" }
};
type StatusKey = "paid" | "DONE" | "PARTIAL_CANCELED" | "CANCELED" | "FAILED" | "READY";
const STATUS_TABS: { key: StatusKey; label: string }[] = [
  { key: "paid", label: "전체" },
  { key: "DONE", label: "결제 완료" },
  { key: "PARTIAL_CANCELED", label: "일부 환불" },
  { key: "CANCELED", label: "환불" },
  { key: "FAILED", label: "실패" },
  { key: "READY", label: "결제 대기" }
];
const REFUND_REASONS = ["고객 요청", "중복 결제", "서비스 오류", "테스트 결제"];
const pgName = (p?: string) => (p === "payapp" ? "페이앱" : p === "toss" ? "토스" : "-");
const creditsText = (o: Order) => (o.kind === "points" ? pts(o.credits) : `이용권 ${o.credits}개`);

export default function PaymentManagementPage() {
  const api = useOpsApi();
  const [data, setData] = useState<OrdersRes | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<StatusKey>("paid");
  const [provider, setProvider] = useState<"" | "payapp" | "toss">("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Order | null>(null);

  const load = useCallback(
    async (next?: { status?: StatusKey; provider?: string; q?: string }) => {
      const st = next?.status ?? status;
      const pv = next?.provider ?? provider;
      const query = next?.q ?? q;
      const params = new URLSearchParams();
      if (st !== "paid") params.set("status", st);
      if (pv) params.set("provider", pv);
      if (query.trim()) params.set("q", query.trim());
      try {
        setError("");
        setData(await api.call<OrdersRes>(`/ops/payment-orders${params.size ? `?${params}` : ""}`));
      } catch (e) {
        setError(e instanceof Error ? e.message : "주문을 불러오지 못했어요.");
        setData((d) => d ?? { items: [] });
      }
    },
    [api, status, provider, q]
  );

  useEffect(() => {
    // 처음 한 번 서버에서 읽어 온다(응답이 오면 상태를 채운다).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = data?.summary;
  const pgReady = data?.provider ?? null;

  return (
    <section className="ops-content-section">
      <PageHead
        title="결제"
        desc="포인트 충전·모의 면접 이용권 결제를 보고, 주문을 눌러 상세와 환불을 처리해요."
        right={
          <>
            <span className={pgReady ? "ops-pill ops-pill-green" : "ops-pill ops-pill-red"}>{pgReady ? `PG ${pgName(pgReady)} 연결됨` : "PG 미설정"}</span>
            <span className={data?.pointsEnabled ? "ops-pill ops-pill-blue" : "ops-pill ops-pill-gray"}>{data?.pointsEnabled ? "AI 포인트 차감 켜짐" : "AI 포인트 차감 꺼짐"}</span>
          </>
        }
      />

      <KpiGrid
        items={[
          { label: "오늘 매출", value: s ? won(s.today.net) : "–", sub: s ? `${s.today.count}건 · 환불 뺀 금액` : undefined, tone: "blue" },
          { label: "이번 달 매출", value: s ? won(s.month.net) : "–", sub: s ? `${s.month.count}건 · 환불 뺀 금액` : undefined, tone: "green" },
          { label: "이번 달 환불", value: s ? won(s.refundsMonth.amount) : "–", sub: s ? `${s.refundsMonth.count}건` : undefined, tone: "amber" }
        ]}
      />

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <Chips
          value={status}
          onChange={(v) => {
            setStatus(v);
            void load({ status: v });
          }}
          options={STATUS_TABS}
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: "1 1 460px", justifyContent: "flex-end", maxWidth: 560 }}>
          <select
            className="ops-select"
            style={{ width: 120 }}
            value={provider}
            onChange={(e) => {
              const v = e.target.value as "" | "payapp" | "toss";
              setProvider(v);
              void load({ provider: v });
            }}
            aria-label="PG"
          >
            <option value="">PG 전체</option>
            <option value="payapp">페이앱</option>
            <option value="toss">토스</option>
          </select>
          <SearchBox value={q} onChange={setQ} onSubmit={() => void load()} placeholder="이메일·이름·주문번호·결제요청번호" />
        </div>
      </div>

      {error ? <p className="ops-form-error" style={{ marginBottom: 12 }}>{error}</p> : null}

      <div className="ops-table-card">
        <table>
          <colgroup>
            <col style={{ width: 150 }} />
            <col />
            <col style={{ width: "24%" }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 104 }} />
            <col style={{ width: 120 }} />
          </colgroup>
          <thead>
            <tr>
              <th>일시</th>
              <th>회원</th>
              <th>상품</th>
              <th style={{ textAlign: "right" }}>금액</th>
              <th>상태</th>
              <th>결제</th>
            </tr>
          </thead>
          <tbody>
            {data === null ? (
              <tr>
                <td colSpan={6} className="ops-table-empty" style={{ textAlign: "center", padding: 28 }}>불러오는 중…</td>
              </tr>
            ) : !data.items.length ? (
              <tr>
                <td colSpan={6} className="ops-table-empty" style={{ textAlign: "center", padding: 28 }}>조건에 맞는 주문이 없어요.</td>
              </tr>
            ) : (
              data.items.map((o) => (
                <tr key={o.id} className="ops-clickable-row" onClick={() => setOpen(o)} style={{ cursor: "pointer" }}>
                  <td>
                    <div className="ops-row-strong">{dt(o.approvedAt ?? o.createdAt)}</div>
                  </td>
                  <td>
                    <div className="ops-row-strong">{o.name || o.email || o.userId}</div>
                    <div className="ops-row-sub">{o.name ? o.email : ""}</div>
                  </td>
                  <td>
                    <div className="ops-row-strong">{o.orderName}</div>
                    <div className="ops-row-sub">{creditsText(o)}</div>
                  </td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    <div className="ops-row-strong" style={{ fontWeight: 700 }}>{won(o.amount)}</div>
                    {o.canceledAmount ? <div className="ops-row-sub" style={{ color: "var(--danger)" }}>-{won(o.canceledAmount)}</div> : null}
                  </td>
                  <td>
                    <span className={STATUS[o.status]?.cls ?? "ops-pill ops-pill-gray"}>{STATUS[o.status]?.label ?? o.status}</span>
                  </td>
                  <td>
                    <div className="ops-row-strong">{o.method ?? "-"}</div>
                    <div className="ops-row-sub">{pgName(o.provider)}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 10, fontSize: 12, lineHeight: 1.6, color: "var(--ink-faint)" }}>
        최근 200건 · 결제 대기는 결제창만 열고 내지 않은 주문이에요. 회원별 포인트 지급·회수는 <Link href="/dashboard/ops/system/ai-points" style={{ color: "var(--accent-ink)", fontWeight: 700 }}>AI 포인트</Link>에서 해요.
      </p>

      {open ? (
        <OrderModal
          order={open}
          onClose={() => setOpen(null)}
          onRefunded={() => {
            setOpen(null);
            void load();
          }}
        />
      ) : null}
    </section>
  );
}

function OrderModal({ order: o, onClose, onRefunded }: { order: Order; onClose: () => void; onRefunded: () => void }) {
  const api = useOpsApi();
  const refundable = o.status === "DONE";
  const [refunding, setRefunding] = useState(false);
  const [amount, setAmount] = useState(String(o.amount));
  const [deduct, setDeduct] = useState(String(o.credits));
  const [reason, setReason] = useState(REFUND_REASONS[0]);
  const [reasonText, setReasonText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const isPts = o.kind === "points";

  const submit = async () => {
    const cancelAmount = Math.floor(Number(amount));
    const deductCredits = Math.max(0, Math.floor(Number(deduct)) || 0);
    const why = [reason, reasonText.trim()].filter(Boolean).join(" · ");
    if (!Number.isFinite(cancelAmount) || cancelAmount < 1 || cancelAmount > o.amount) return setErr(`환불 금액은 1원 ~ ${won(o.amount)} 사이로 입력하세요.`);
    if (!window.confirm(`${o.email ?? o.userId}\n${won(cancelAmount)} 환불하고 ${isPts ? pts(deductCredits) : `이용권 ${deductCredits}개`}를 회수할까요?`)) return;
    setBusy(true);
    setErr("");
    try {
      const r = await api.call<{ refunded?: number; deducted?: number }>(`/ops/payment-orders/${encodeURIComponent(o.id)}/cancel`, { method: "POST", body: { reason: why, cancelAmount, deductCredits } });
      window.alert(`${won(r.refunded ?? 0)} 환불, ${isPts ? pts(r.deducted ?? 0) : `이용권 ${r.deducted ?? 0}개`} 회수했어요.`);
      onRefunded();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "환불하지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  const rows: [string, React.ReactNode][] = [
    ["회원", <>{o.name || "-"}<span style={{ color: "var(--ink-faint)" }}> · {o.email ?? o.userId}</span></>],
    ["상품", `${o.orderName} (${creditsText(o)})`],
    ["결제 금액", won(o.amount)],
    ["상태", <span key="st" className={STATUS[o.status]?.cls ?? "ops-pill ops-pill-gray"}>{STATUS[o.status]?.label ?? o.status}</span>],
    ["결제 수단", `${o.method ?? "-"} · ${pgName(o.provider)}`],
    ["결제 시각", dt(o.approvedAt)],
    ["주문 만든 시각", dt(o.createdAt)],
    ["주문번호", <code key="id" style={{ fontSize: 12 }}>{o.id}</code>],
    ...(o.paymentKey ? ([[o.provider === "payapp" ? "페이앱 결제요청번호" : "결제 키", <code key="pk" style={{ fontSize: 12 }}>{o.paymentKey}</code>]] as [string, React.ReactNode][]) : []),
    ...(o.failReason ? ([["실패 사유", o.failReason]] as [string, React.ReactNode][]) : []),
    ...(o.canceledAt ? ([["환불", `${won(o.canceledAmount ?? 0)} · ${dt(o.canceledAt)}${o.cancelReason ? ` · ${o.cancelReason}` : ""}`]] as [string, React.ReactNode][]) : [])
  ];

  return (
    <Modal
      title="주문 상세"
      sub={o.orderName}
      onClose={onClose}
      footer={
        refunding ? (
          <>
            <button type="button" className="ops-btn" style={{ height: 38, padding: "0 16px" }} onClick={() => setRefunding(false)} disabled={busy}>
              취소
            </button>
            <button type="button" className="ops-btn ops-btn-danger" style={{ height: 38, padding: "0 18px" }} onClick={() => void submit()} disabled={busy}>
              {busy ? "환불하는 중…" : "환불하기"}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="ops-btn" style={{ height: 38, padding: "0 16px" }} onClick={onClose}>
              닫기
            </button>
            {refundable ? (
              <button type="button" className="ops-btn ops-btn-danger" style={{ height: 38, padding: "0 18px" }} onClick={() => setRefunding(true)}>
                환불
              </button>
            ) : null}
          </>
        )
      }
    >
      {!refunding ? (
        <dl style={{ display: "grid", gridTemplateColumns: "140px 1fr", rowGap: 10, columnGap: 12, margin: 0, fontSize: 13 }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: "contents" }}>
              <dt style={{ color: "var(--ink-faint)" }}>{k}</dt>
              <dd style={{ margin: 0, color: "var(--ink)", wordBreak: "break-all" }}>{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="환불 금액(원)" hint={`최대 ${won(o.amount)} · 일부 금액도 돼요`}>
            <div style={{ display: "flex", gap: 6 }}>
              <input className="ops-input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} />
              <button type="button" className="ops-btn" style={{ height: 38, flex: "none" }} onClick={() => setAmount(String(o.amount))}>
                전액
              </button>
            </div>
          </Field>
          <Field label={isPts ? "회수할 포인트(P)" : "회수할 이용권(개)"} hint={`이 결제로 받은 양: ${creditsText(o)} · 잔액이 모자라면 남은 만큼만 회수돼요`}>
            <div style={{ display: "flex", gap: 6 }}>
              <input className="ops-input" inputMode="numeric" value={deduct} onChange={(e) => setDeduct(e.target.value.replace(/[^\d]/g, ""))} />
              <button type="button" className="ops-btn" style={{ height: 38, flex: "none" }} onClick={() => setDeduct(String(o.credits))}>
                전부
              </button>
              <button type="button" className="ops-btn" style={{ height: 38, flex: "none" }} onClick={() => setDeduct("0")}>
                회수 안 함
              </button>
            </div>
          </Field>
          <Field label="환불 사유">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {REFUND_REASONS.map((r) => (
                <button key={r} type="button" className={`ops-filter-chip ${reason === r ? "is-active" : ""}`} onClick={() => setReason(r)}>
                  {r}
                </button>
              ))}
            </div>
            <input className="ops-input" value={reasonText} onChange={(e) => setReasonText(e.target.value)} placeholder="자세한 내용(선택)" maxLength={120} />
          </Field>
          {err ? <p className="ops-form-error" style={{ margin: 0 }}>{err}</p> : null}
        </div>
      )}
    </Modal>
  );
}
