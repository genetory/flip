"use client";

// AI 포인트 — 포인트 흐름 요약(남은 포인트·충전·무료 적립·사용, 7일/30일) · 기능별 사용 · 날짜별 추이 ·
// 학생 지갑(검색·잔액순) · 내역 · 지급/회수. 1P = 10원.
// 지급·회수는 원장에 '운영자 조정'(ops_grant)으로 남고, 회수는 잔액까지만 된다.
import { useCallback, useEffect, useState } from "react";
import { BarList, Chips, Field, KpiGrid, Modal, PageHead, SearchBox, card, day, dt, pts, ptsWon, reasonLabel, useOpsApi } from "../_billing/shared";

type Wallet = { userId: string; email: string; name: string | null; balance: number | null; interviewCredits: number | null; updatedAt: string | null; joinedAt?: string };
type Log = { id: string; amount: number; reason: string; createdAt: string };
type Summary = {
  enabled: boolean;
  days: number;
  outstanding: number;
  walletsWithBalance: number;
  used: number;
  purchased: number;
  free: number;
  activeUsers: number;
  features: { feature: string; points: number; count: number }[];
  daily: { day: string; used: number; purchased: number }[];
};

export default function OpsAiPointsPage() {
  const api = useOpsApi();
  const [days, setDays] = useState<"7" | "30">("7");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [wallets, setWallets] = useState<Wallet[] | null>(null);
  const [sort, setSort] = useState<"recent" | "balance">("recent");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [logsFor, setLogsFor] = useState<Wallet | null>(null);
  const [adjustFor, setAdjustFor] = useState<Wallet | null>(null);

  const loadSummary = useCallback(
    async (d = days) => {
      try {
        setSummary(await api.call<Summary>(`/ops/ai-points/summary?days=${d}`));
      } catch (e) {
        setError(e instanceof Error ? e.message : "요약을 불러오지 못했어요.");
      }
    },
    [api, days]
  );
  const loadWallets = useCallback(
    async (next?: { sort?: "recent" | "balance"; q?: string }) => {
      const params = new URLSearchParams();
      const so = next?.sort ?? sort;
      const query = (next?.q ?? q).trim();
      if (so === "balance") params.set("sort", "balance");
      if (query) params.set("q", query);
      try {
        const r = await api.call<{ items: Wallet[] }>(`/ops/ai-wallets${params.size ? `?${params}` : ""}`);
        setWallets(r.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : "지갑을 불러오지 못했어요.");
        setWallets((w) => w ?? []);
      }
    },
    [api, sort, q]
  );

  useEffect(() => {
    // 처음 한 번 서버에서 읽어 온다(응답이 오면 상태를 채운다).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSummary();
    void loadWallets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = summary;
  return (
    <div className="ops-page">
      <PageHead
        title="AI 포인트"
        desc="포인트가 얼마나 충전되고 쓰이는지 보고, 회원별 잔액을 확인하거나 지급·회수해요. 1P = 10원."
        right={
          <>
            <span className={s?.enabled ? "ops-pill ops-pill-blue" : "ops-pill ops-pill-gray"}>{s ? (s.enabled ? "포인트 차감 켜짐" : "포인트 차감 꺼짐") : "…"}</span>
            <Chips
              value={days}
              onChange={(v) => {
                setDays(v);
                void loadSummary(v);
              }}
              options={[
                { key: "7", label: "최근 7일" },
                { key: "30", label: "최근 30일" }
              ]}
            />
          </>
        }
      />

      {error ? <p className="ops-form-error" style={{ marginBottom: 12 }}>{error}</p> : null}

      <KpiGrid
        items={[
          { label: "회원이 가진 포인트", value: s ? pts(s.outstanding) : "–", sub: s ? `${s.walletsWithBalance.toLocaleString()}명 · ${ptsWon(s.outstanding)} 어치` : undefined, tone: "blue" },
          { label: `사용 (${days}일)`, value: s ? pts(s.used) : "–", sub: s ? `${s.activeUsers.toLocaleString()}명이 사용` : undefined, tone: "green" },
          { label: `충전 (${days}일)`, value: s ? pts(s.purchased) : "–", sub: s ? `결제로 들어온 포인트` : undefined, tone: "green" },
          { label: `무료 적립 (${days}일)`, value: s ? pts(s.free) : "–", sub: "가입·매일·코드·운영자 지급", tone: "amber" }
        ]}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 28 }}>
        <section style={card}>
          <h2 className="ops-section-title">기능별 사용</h2>
          <BarList rows={(s?.features ?? []).map((f) => ({ label: reasonLabel(f.feature), value: f.points, sub: `${f.count.toLocaleString()}회` }))} format={pts} />
        </section>
        <section style={card}>
          <h2 className="ops-section-title">날짜별 사용 · 충전</h2>
          <DailyBars rows={s?.daily ?? []} />
        </section>
      </div>

      <h2 className="ops-section-title">회원 지갑</h2>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <Chips
          value={sort}
          onChange={(v) => {
            setSort(v);
            void loadWallets({ sort: v });
          }}
          options={[
            { key: "recent", label: "최근 가입순" },
            { key: "balance", label: "잔액 많은 순" }
          ]}
        />
        <SearchBox value={q} onChange={setQ} onSubmit={() => void loadWallets()} placeholder="이메일 또는 이름" />
      </div>
      <div className="ops-table-card">
        <table>
          <colgroup>
            <col />
            <col style={{ width: 140 }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 200 }} />
          </colgroup>
          <thead>
            <tr>
              <th>회원</th>
              <th style={{ textAlign: "right" }}>잔액</th>
              <th>가입</th>
              <th style={{ textAlign: "right" }}></th>
            </tr>
          </thead>
          <tbody>
            {wallets === null ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 28 }}>불러오는 중…</td>
              </tr>
            ) : !wallets.length ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 28 }}>결과가 없어요.</td>
              </tr>
            ) : (
              wallets.map((w) => (
                <tr key={w.userId}>
                  <td>
                    <div className="ops-row-strong">{w.name || w.email}</div>
                    <div className="ops-row-sub">{w.name ? w.email : ""}</div>
                  </td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {w.balance == null ? <span className="ops-row-sub">아직 안 씀</span> : <span className="ops-row-strong" style={{ fontWeight: 700 }}>{pts(w.balance)}</span>}
                    {w.interviewCredits ? <div className="ops-row-sub">전환 대기 이용권 {w.interviewCredits}개</div> : null}
                  </td>
                  <td>
                    <span className="ops-row-sub">{day(w.joinedAt)}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <button type="button" className="ops-btn" onClick={() => setLogsFor(w)}>
                        내역
                      </button>
                      <button type="button" className="ops-btn ops-btn-primary" onClick={() => setAdjustFor(w)}>
                        지급·회수
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="ops-row-sub" style={{ marginTop: 10 }}>학생 100명까지 · 처음 쓰는 회원은 지급할 때 지갑이 만들어지며 가입 보너스도 함께 들어가요. 남은 모의 면접 이용권은 다음 이용 때 포인트로 자동 전환돼요.</p>

      {logsFor ? <LogsModal wallet={logsFor} onClose={() => setLogsFor(null)} /> : null}
      {adjustFor ? (
        <AdjustModal
          wallet={adjustFor}
          onClose={() => setAdjustFor(null)}
          onDone={(balance) => {
            setWallets((prev) => (prev ?? []).map((r) => (r.userId === adjustFor.userId ? { ...r, balance } : r)));
            setAdjustFor(null);
            void loadSummary();
          }}
        />
      ) : null}
    </div>
  );
}

function DailyBars({ rows }: { rows: { day: string; used: number; purchased: number }[] }) {
  if (!rows.length) return <p className="ops-empty-card" style={{ padding: "24px 0" }}>아직 기록이 없어요.</p>;
  const max = Math.max(1, ...rows.map((r) => Math.max(r.used, r.purchased)));
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
        {rows.map((r) => (
          <div key={r.day} title={`${r.day} · 사용 ${pts(r.used)} · 충전 ${pts(r.purchased)}`} style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 1, height: "100%" }}>
            <div style={{ flex: 1, height: `${(r.used / max) * 100}%`, minHeight: r.used ? 2 : 0, borderRadius: 3, background: "var(--accent)" }} />
            <div style={{ flex: 1, height: `${(r.purchased / max) * 100}%`, minHeight: r.purchased ? 2 : 0, borderRadius: 3, background: "var(--line-strong)" }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--ink-faint)" }}>
        <span>{rows[0].day.slice(5)}</span>
        <span style={{ display: "inline-flex", gap: 10 }}>
          <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "var(--accent)", marginRight: 4 }} />사용</span>
          <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "var(--line-strong)", marginRight: 4 }} />충전</span>
        </span>
        <span>{rows[rows.length - 1].day.slice(5)}</span>
      </div>
    </div>
  );
}

function LogsModal({ wallet: w, onClose }: { wallet: Wallet; onClose: () => void }) {
  const api = useOpsApi();
  const [logs, setLogs] = useState<Log[] | null>(null);
  useEffect(() => {
    api
      .call<{ items: Log[] }>(`/ops/ai-points/${encodeURIComponent(w.userId)}/logs`)
      .then((r) => setLogs(r.items))
      .catch(() => setLogs([]));
  }, [api, w.userId]);
  return (
    <Modal title="포인트 내역" sub={`${w.name ? `${w.name} · ` : ""}${w.email} · 잔액 ${pts(w.balance ?? 0)}`} onClose={onClose} size="sm">
      {logs === null ? (
        <p className="ops-empty-card" style={{ padding: "24px 0" }}>불러오는 중…</p>
      ) : !logs.length ? (
        <p className="ops-empty-card" style={{ padding: "24px 0" }}>내역이 없어요.</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {logs.map((l) => (
            <li key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 2px", borderBottom: "1px solid var(--line)" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{reasonLabel(l.reason)}</p>
                <p style={{ margin: 0, fontSize: 11.5, color: "var(--ink-faint)" }}>{dt(l.createdAt)}</p>
              </div>
              <span style={{ flex: "none", fontVariantNumeric: "tabular-nums", fontWeight: 800, fontSize: 13.5, color: l.amount >= 0 ? "var(--accent-ink)" : "var(--danger)" }}>
                {l.amount >= 0 ? `+${pts(l.amount)}` : `-${pts(-l.amount)}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function AdjustModal({ wallet: w, onClose, onDone }: { wallet: Wallet; onClose: () => void; onDone: (balance: number) => void }) {
  const api = useOpsApi();
  const [sign, setSign] = useState<"grant" | "revoke">("grant");
  const [amount, setAmount] = useState("100");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const n = Math.floor(Number(amount)) || 0;
  const balance = w.balance ?? 0;
  const after = sign === "grant" ? balance + n : Math.max(0, balance - n);

  const submit = async () => {
    if (n < 1 || n > 100000) return setErr("1 ~ 100,000P 사이로 입력하세요.");
    setBusy(true);
    setErr("");
    try {
      const r = await api.call<{ balance: number; applied: number }>(`/ops/ai-points/${encodeURIComponent(w.userId)}/grant`, { method: "POST", body: { points: sign === "grant" ? n : -n } });
      onDone(r.balance);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "처리하지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="포인트 지급·회수"
      sub={`${w.name ? `${w.name} · ` : ""}${w.email}`}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button type="button" className="ops-btn" style={{ height: 38, padding: "0 16px" }} onClick={onClose} disabled={busy}>
            취소
          </button>
          <button type="button" className={`ops-btn ${sign === "grant" ? "ops-btn-primary" : "ops-btn-danger"}`} style={{ height: 38, padding: "0 18px" }} onClick={() => void submit()} disabled={busy || n < 1}>
            {busy ? "처리 중…" : sign === "grant" ? `${pts(n)} 지급` : `${pts(n)} 회수`}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Chips
          value={sign}
          onChange={setSign}
          options={[
            { key: "grant", label: "지급" },
            { key: "revoke", label: "회수" }
          ]}
        />
        <Field label="포인트(P)" hint={`${ptsWon(n)} 어치${sign === "revoke" ? " · 잔액까지만 회수돼요" : ""}`}>
          <input className="ops-select" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} autoFocus />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[100, 500, 1000, 5000].map((v) => (
              <button key={v} type="button" className="ops-filter-chip" onClick={() => setAmount(String(v))}>
                {pts(v)}
              </button>
            ))}
          </div>
        </Field>
        <div style={{ display: "flex", justifyContent: "space-between", borderRadius: 12, background: "var(--surface-2)", padding: "12px 14px", fontSize: 13 }}>
          <span style={{ color: "var(--ink-soft)" }}>지금 {pts(balance)}</span>
          <span style={{ fontWeight: 800, color: "var(--ink)" }}>→ {pts(after)}</span>
        </div>
        {err ? <p className="ops-form-error" style={{ margin: 0 }}>{err}</p> : null}
      </div>
    </Modal>
  );
}
