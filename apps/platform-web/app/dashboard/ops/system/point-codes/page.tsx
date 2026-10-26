"use client";

// 포인트 코드 — 쿠폰·리딤·이벤트 코드. 요약(사용 가능 코드·사용 횟수·나간 포인트) · 상태별 목록 ·
// 코드 만들기(이벤트 코드 직접 지정 또는 1인 1코드 랜덤 N개) · 코드 상세(쓴 사람·복사·메모·중지/재개).
// 사용자는 /talent/payments(코드 등록) 또는 충전 창의 '쿠폰·이벤트 코드가 있나요?'에서 넣는다.
// 이벤트 링크: /talent/payments?code=코드 — 코드 칸이 미리 채워진다.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Chips, Field, KpiGrid, Modal, PageHead, SearchBox, day, dt, pts, ptsWon, useOpsApi } from "../_billing/shared";

type CodeRow = {
  id: string;
  code: string;
  points: number;
  maxUses: number;
  usedCount: number;
  groupKey: string | null;
  memo: string | null;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
};
type Redemption = { id: string; points: number; createdAt: string; userId: string; email: string; name: string | null };
type StatusKey = "all" | "live" | "used_up" | "expired" | "stopped";

function statusOf(r: CodeRow): { key: Exclude<StatusKey, "all">; label: string; cls: string } {
  if (!r.active) return { key: "stopped", label: "중지", cls: "ops-pill ops-pill-gray" };
  if (r.expiresAt && new Date(r.expiresAt).getTime() < Date.now()) return { key: "expired", label: "만료", cls: "ops-pill ops-pill-gray" };
  if (r.usedCount >= r.maxUses) return { key: "used_up", label: "소진", cls: "ops-pill ops-pill-amber" };
  return { key: "live", label: "사용 가능", cls: "ops-pill ops-pill-green" };
}
const copy = (text: string) => void navigator.clipboard?.writeText(text).catch(() => {});
const linkOf = (c: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/talent/payments?code=${encodeURIComponent(c)}`;

export default function OpsPointCodesPage() {
  const api = useOpsApi();
  const [items, setItems] = useState<CodeRow[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusKey>("all");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<CodeRow | null>(null);

  const load = useCallback(
    async (query = q) => {
      try {
        setError("");
        const r = await api.call<{ items: CodeRow[] }>(`/ops/point-codes${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
        setItems(r.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : "불러오지 못했어요.");
        setItems((x) => x ?? []);
      }
    },
    [api, q]
  );
  useEffect(() => {
    // 처음 한 번 서버에서 읽어 온다(응답이 오면 상태를 채운다).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => (items ?? []).map((r) => ({ ...r, st: statusOf(r) })), [items]);
  const count = (k: StatusKey) => (k === "all" ? rows.length : rows.filter((r) => r.st.key === k).length);
  const shown = status === "all" ? rows : rows.filter((r) => r.st.key === status);
  const usedTotal = rows.reduce((n, r) => n + r.usedCount, 0);
  const pointsOut = rows.reduce((n, r) => n + r.usedCount * r.points, 0);

  const patch = async (r: CodeRow, body: { active?: boolean; memo?: string | null }) => {
    await api.call(`/ops/point-codes/${encodeURIComponent(r.id)}`, { method: "PATCH", body });
    setItems((prev) => (prev ?? []).map((x) => (x.id === r.id ? { ...x, ...body } : x)));
    setOpen((o) => (o && o.id === r.id ? { ...o, ...body } : o));
  };

  return (
    <div className="ops-page">
      <PageHead
        title="포인트 코드"
        desc="쿠폰·이벤트 코드를 만들면, 사용자가 결제 화면에서 코드를 넣는 즉시 AI 포인트가 충전돼요. 계정당 같은 코드는 한 번만 쓸 수 있어요."
        right={
          <button type="button" className="ops-btn ops-btn-primary" style={{ height: 38, padding: "0 18px" }} onClick={() => setCreating(true)}>
            코드 만들기
          </button>
        }
      />

      <KpiGrid
        items={[
          { label: "사용 가능한 코드", value: items ? count("live").toLocaleString() : "–", sub: items ? `전체 ${rows.length.toLocaleString()}개` : undefined, tone: "blue" },
          { label: "사용 횟수", value: items ? usedTotal.toLocaleString() : "–", sub: "코드가 등록된 횟수", tone: "green" },
          { label: "코드로 나간 포인트", value: items ? pts(pointsOut) : "–", sub: items ? `${ptsWon(pointsOut)} 어치` : undefined, tone: "amber" }
        ]}
      />

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <Chips
          value={status}
          onChange={setStatus}
          options={[
            { key: "all", label: "전체", count: count("all") },
            { key: "live", label: "사용 가능", count: count("live") },
            { key: "used_up", label: "소진", count: count("used_up") },
            { key: "expired", label: "만료", count: count("expired") },
            { key: "stopped", label: "중지", count: count("stopped") }
          ]}
        />
        <SearchBox value={q} onChange={setQ} onSubmit={() => void load()} placeholder="코드·메모·그룹" />
      </div>

      {error ? <p className="ops-form-error" style={{ marginBottom: 12 }}>{error}</p> : null}

      <div className="ops-table-card">
        <table>
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 110 }} />
            <col />
            <col style={{ width: 96 }} />
          </colgroup>
          <thead>
            <tr>
              <th>코드</th>
              <th style={{ textAlign: "right" }}>포인트</th>
              <th>사용</th>
              <th>만료</th>
              <th>메모</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {items === null ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 28 }}>불러오는 중…</td>
              </tr>
            ) : !shown.length ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 28 }}>{rows.length ? "이 상태의 코드가 없어요." : "아직 코드가 없어요. 오른쪽 위 '코드 만들기'로 시작하세요."}</td>
              </tr>
            ) : (
              shown.map((r) => (
                <tr key={r.id} className="ops-clickable-row" style={{ cursor: "pointer" }} onClick={() => setOpen(r)}>
                  <td>
                    <div className="ops-row-strong" style={{ fontWeight: 800, letterSpacing: "0.04em" }}>{r.code}</div>
                    {r.groupKey ? <div className="ops-row-sub">그룹 {r.groupKey}</div> : null}
                  </td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{pts(r.points)}</td>
                  <td>
                    <div style={{ fontVariantNumeric: "tabular-nums", fontSize: 12.5 }}>
                      {r.usedCount.toLocaleString()} / {r.maxUses.toLocaleString()}
                    </div>
                    <div style={{ marginTop: 4, height: 5, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, (r.usedCount / Math.max(1, r.maxUses)) * 100)}%`, height: "100%", background: "var(--accent)" }} />
                    </div>
                  </td>
                  <td>
                    <span className="ops-row-sub">{r.expiresAt ? day(r.expiresAt) : "무기한"}</span>
                  </td>
                  <td>
                    <span className="ops-row-sub">{r.memo || "-"}</span>
                  </td>
                  <td>
                    <span className={r.st.cls}>{r.st.label}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="ops-row-sub" style={{ marginTop: 10 }}>최근 200개 · 코드를 누르면 쓴 사람·링크 복사·사용 중지를 할 수 있어요.</p>

      {creating ? (
        <CreateModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            void load();
          }}
        />
      ) : null}
      {open ? <CodeModal row={open} onClose={() => setOpen(null)} onPatch={(body) => patch(open, body)} /> : null}
    </div>
  );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const api = useOpsApi();
  const [mode, setMode] = useState<"custom" | "random">("custom");
  const [code, setCode] = useState("");
  const [count, setCount] = useState("10");
  const [prefix, setPrefix] = useState("APLY");
  const [points, setPoints] = useState("500");
  const [maxUses, setMaxUses] = useState("1000");
  const [expires, setExpires] = useState("");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [created, setCreated] = useState<string[] | null>(null);

  const submit = async () => {
    const p = Math.floor(Number(points));
    const m = Math.floor(Number(maxUses));
    if (!Number.isFinite(p) || p < 1) return setErr("포인트는 1 이상이어야 해요.");
    if (!Number.isFinite(m) || m < 1) return setErr("사용 횟수는 1 이상이어야 해요.");
    if (mode === "custom" && !/^[A-Za-z0-9_-]{3,40}$/.test(code.trim())) return setErr("코드는 영문·숫자·-·_ 3~40자로 입력하세요.");
    const body: Record<string, unknown> = { points: p, maxUses: m };
    if (mode === "custom") body.code = code.trim();
    else {
      const n = Math.floor(Number(count));
      if (!Number.isFinite(n) || n < 1 || n > 500) return setErr("개수는 1~500 사이로 입력하세요.");
      body.count = n;
      body.prefix = prefix.trim();
    }
    if (memo.trim()) body.memo = memo.trim();
    // 만료일은 그날 KST 23:59:59 까지
    if (expires) body.expiresAt = `${expires}T23:59:59+09:00`;
    setBusy(true);
    setErr("");
    try {
      const r = await api.call<{ codes: string[] }>(`/ops/point-codes`, { method: "POST", body });
      setCreated(r.codes ?? []);
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "만들지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <Modal
        title={`${created.length}개 만들었어요`}
        sub="사용자는 결제 화면에서 코드를 넣으면 바로 충전돼요."
        onClose={onClose}
        footer={
          <>
            <button type="button" className="ops-btn" style={{ height: 38, padding: "0 16px" }} onClick={() => copy(created.join("\n"))}>
              코드 전체 복사
            </button>
            {created.length === 1 ? (
              <button type="button" className="ops-btn" style={{ height: 38, padding: "0 16px" }} onClick={() => copy(linkOf(created[0]))}>
                링크 복사
              </button>
            ) : null}
            <button type="button" className="ops-btn ops-btn-primary" style={{ height: 38, padding: "0 18px" }} onClick={onClose}>
              완료
            </button>
          </>
        }
      >
        <pre style={{ margin: 0, maxHeight: 260, overflowY: "auto", borderRadius: 12, background: "var(--surface-2)", padding: 14, fontSize: 13, lineHeight: 1.7, color: "var(--ink)", whiteSpace: "pre-wrap", letterSpacing: "0.04em" }}>{created.join("\n")}</pre>
      </Modal>
    );
  }

  return (
    <Modal
      title="코드 만들기"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ops-btn" style={{ height: 38, padding: "0 16px" }} onClick={onClose} disabled={busy}>
            취소
          </button>
          <button type="button" className="ops-btn ops-btn-primary" style={{ height: 38, padding: "0 18px" }} onClick={() => void submit()} disabled={busy}>
            {busy ? "만드는 중…" : "만들기"}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Chips
          value={mode}
          onChange={setMode}
          options={[
            { key: "custom", label: "이벤트 코드 · 여럿이 같이 씀" },
            { key: "random", label: "랜덤 코드 N개 · 1인 1코드" }
          ]}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {mode === "custom" ? (
            <Field label="코드" hint="영문·숫자·-·_ 3~40자">
              <input className="ops-select" style={{ textTransform: "uppercase" }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="예: FALL2026" autoFocus />
            </Field>
          ) : (
            <>
              <Field label="개수" hint="최대 500개">
                <input className="ops-select" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value.replace(/[^\d]/g, ""))} />
              </Field>
              <Field label="앞글자" hint="예: APLY-XXXXXX">
                <input className="ops-select" style={{ textTransform: "uppercase" }} value={prefix} onChange={(e) => setPrefix(e.target.value)} />
              </Field>
            </>
          )}
          <Field label="충전 포인트(P)" hint={`${ptsWon(Math.floor(Number(points)) || 0)} 어치`}>
            <input className="ops-select" inputMode="numeric" value={points} onChange={(e) => setPoints(e.target.value.replace(/[^\d]/g, ""))} />
          </Field>
          <Field label={mode === "custom" ? "전체 사용 횟수" : "코드당 사용 횟수"} hint={mode === "custom" ? "선착순으로 이만큼 쓸 수 있어요" : "보통 1"}>
            <input className="ops-select" inputMode="numeric" value={maxUses} onChange={(e) => setMaxUses(e.target.value.replace(/[^\d]/g, ""))} />
          </Field>
          <Field label="만료일" hint="비우면 무기한 · 그날 23:59(KST)까지">
            <input className="ops-select" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </Field>
        </div>
        <Field label="메모" hint="운영용 — 사용자에게는 안 보여요">
          <input className="ops-select" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: 2026 가을 박람회 부스" maxLength={200} />
        </Field>
        {err ? <p className="ops-form-error" style={{ margin: 0 }}>{err}</p> : null}
      </div>
    </Modal>
  );
}

function CodeModal({ row: r, onClose, onPatch }: { row: CodeRow; onClose: () => void; onPatch: (body: { active?: boolean; memo?: string | null }) => Promise<void> }) {
  const api = useOpsApi();
  const st = statusOf(r);
  const [list, setList] = useState<Redemption[] | null>(null);
  const [memo, setMemo] = useState(r.memo ?? "");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<"" | "code" | "link">("");
  useEffect(() => {
    api
      .call<{ items: Redemption[] }>(`/ops/point-codes/${encodeURIComponent(r.id)}/redemptions`)
      .then((x) => setList(x.items))
      .catch(() => setList([]));
  }, [api, r.id]);

  const run = async (body: { active?: boolean; memo?: string | null }) => {
    if (body.active === false && !window.confirm(`${r.code} 코드를 사용 중지할까요? 이미 충전된 포인트는 그대로예요.`)) return;
    setBusy(true);
    try {
      await onPatch(body);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "바꾸지 못했어요.");
    } finally {
      setBusy(false);
    }
  };
  const doCopy = (kind: "code" | "link") => {
    copy(kind === "code" ? r.code : linkOf(r.code));
    setCopied(kind);
    window.setTimeout(() => setCopied(""), 1500);
  };

  return (
    <Modal
      title={r.code}
      sub={`${pts(r.points)} · ${r.usedCount.toLocaleString()} / ${r.maxUses.toLocaleString()}회 사용 · ${r.expiresAt ? `${day(r.expiresAt)} 만료` : "무기한"}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ops-btn" style={{ height: 38, padding: "0 16px" }} onClick={() => doCopy("code")}>
            {copied === "code" ? "복사했어요" : "코드 복사"}
          </button>
          <button type="button" className="ops-btn" style={{ height: 38, padding: "0 16px" }} onClick={() => doCopy("link")}>
            {copied === "link" ? "복사했어요" : "링크 복사"}
          </button>
          <button type="button" className={`ops-btn ${r.active ? "ops-btn-danger" : "ops-btn-primary"}`} style={{ height: 38, padding: "0 18px" }} disabled={busy} onClick={() => void run({ active: !r.active })}>
            {r.active ? "사용 중지" : "다시 사용"}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className={st.cls}>{st.label}</span>
          {r.groupKey ? <span className="ops-pill ops-pill-gray">그룹 {r.groupKey}</span> : null}
          <span className="ops-row-sub">만든 날 {day(r.createdAt)}</span>
        </div>
        <Field label="메모" hint="운영용 — 사용자에게는 안 보여요">
          <div style={{ display: "flex", gap: 6 }}>
            <input className="ops-select" value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={200} placeholder="어떤 이벤트·용도의 코드인지" />
            <button type="button" className="ops-btn" style={{ height: 38, flex: "none" }} disabled={busy || memo === (r.memo ?? "")} onClick={() => void run({ memo: memo.trim() || null })}>
              저장
            </button>
          </div>
        </Field>
        <div>
          <h3 className="ops-section-title" style={{ marginBottom: 8 }}>쓴 사람{list ? ` ${list.length.toLocaleString()}명` : ""}</h3>
          {list === null ? (
            <p className="ops-empty-card" style={{ padding: "18px 0" }}>불러오는 중…</p>
          ) : !list.length ? (
            <p className="ops-empty-card" style={{ padding: "18px 0" }}>아직 아무도 쓰지 않았어요.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", maxHeight: 280, overflowY: "auto" }}>
              {list.map((x) => (
                <li key={x.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 2px", borderBottom: "1px solid var(--line)", fontSize: 13 }}>
                  <span style={{ minWidth: 0, color: "var(--ink)" }}>
                    {x.name || x.email}
                    {x.name ? <span style={{ color: "var(--ink-faint)" }}> · {x.email}</span> : null}
                  </span>
                  <span style={{ flex: "none", color: "var(--ink-faint)", fontVariantNumeric: "tabular-nums" }}>{dt(x.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
