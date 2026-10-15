"use client";

// 포인트 코드 — 쿠폰·리딤·이벤트 코드를 만들고(직접 지정 또는 랜덤 N개), 사용 현황을 보고, 사용 중지한다.
// 사용자는 /talent/payments(코드 등록) 또는 충전 창의 '쿠폰·이벤트 코드가 있나요?'에서 넣는다.
// 이벤트 링크: /talent/payments?code=코드 — 코드 칸이 미리 채워진다.
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

const input: React.CSSProperties = { height: 40, borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", padding: "0 12px", width: "100%" };
const label: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, fontWeight: 700, color: "var(--ink-faint)" };
const smallBtn: React.CSSProperties = { height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontWeight: 700, padding: "0 10px", cursor: "pointer" };

function statusOf(r: CodeRow): { text: string; color: string } {
  if (!r.active) return { text: "중지", color: "var(--ink-faint)" };
  if (r.expiresAt && new Date(r.expiresAt).getTime() < Date.now()) return { text: "만료", color: "var(--ink-faint)" };
  if (r.usedCount >= r.maxUses) return { text: "소진", color: "var(--ink-faint)" };
  return { text: "사용 가능", color: "var(--accent-ink)" };
}

export default function OpsPointCodesPage() {
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const authHeader = () => ({ Authorization: `Bearer ${readCookie("ops_admin_token")}` });
  const [items, setItems] = useState<CodeRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 만들기 폼
  const [mode, setMode] = useState<"custom" | "random">("custom");
  const [code, setCode] = useState("");
  const [count, setCount] = useState("10");
  const [prefix, setPrefix] = useState("APLY");
  const [points, setPoints] = useState("500");
  const [maxUses, setMaxUses] = useState("1000");
  const [expires, setExpires] = useState("");
  const [memo, setMemo] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<string[] | null>(null);

  const fetchList = async (query: string): Promise<CodeRow[]> => {
    const res = await fetch(`${apiBaseUrl}/ops/point-codes${query ? `?q=${encodeURIComponent(query)}` : ""}`, { headers: authHeader() });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; items?: CodeRow[]; message?: string } | null;
    if (!res.ok || data?.ok !== true) throw new Error(data?.message ?? "불러오지 못했어요.");
    return data.items ?? [];
  };
  const applyList = (p: Promise<CodeRow[]>) =>
    p
      .then((rows) => setItems(rows))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "불러오지 못했어요."))
      .finally(() => setLoading(false));
  const load = (query = "") => {
    setLoading(true);
    setError("");
    void applyList(fetchList(query));
  };

  useEffect(() => {
    void applyList(fetchList(""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async () => {
    const p = Math.floor(Number(points));
    const m = Math.floor(Number(maxUses));
    if (!Number.isFinite(p) || p < 1) return window.alert("포인트는 1 이상이어야 해요.");
    if (!Number.isFinite(m) || m < 1) return window.alert("사용 횟수는 1 이상이어야 해요.");
    if (mode === "custom" && !/^[A-Za-z0-9_-]{3,40}$/.test(code.trim())) return window.alert("코드는 영문·숫자·-·_ 3~40자로 입력하세요.");
    const body: Record<string, unknown> = { points: p, maxUses: m };
    if (mode === "custom") body.code = code.trim();
    else {
      const n = Math.floor(Number(count));
      if (!Number.isFinite(n) || n < 1 || n > 500) return window.alert("개수는 1~500 사이로 입력하세요.");
      body.count = n;
      body.prefix = prefix.trim();
    }
    if (memo.trim()) body.memo = memo.trim();
    // 만료일은 그날 KST 23:59:59 까지
    if (expires) body.expiresAt = `${expires}T23:59:59+09:00`;
    setCreating(true);
    setCreated(null);
    try {
      const res = await fetch(`${apiBaseUrl}/ops/point-codes`, { method: "POST", headers: { ...authHeader(), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; codes?: string[]; message?: string } | null;
      if (!res.ok || data?.ok !== true) throw new Error(data?.message ?? "만들지 못했어요.");
      setCreated(data.codes ?? []);
      setCode("");
      void load(q.trim());
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "만들지 못했어요.");
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (r: CodeRow) => {
    if (r.active && !window.confirm(`${r.code} 코드를 사용 중지할까요? 이미 충전된 포인트는 그대로예요.`)) return;
    try {
      const res = await fetch(`${apiBaseUrl}/ops/point-codes/${encodeURIComponent(r.id)}`, { method: "PATCH", headers: { ...authHeader(), "Content-Type": "application/json" }, body: JSON.stringify({ active: !r.active }) });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!res.ok || data?.ok !== true) throw new Error(data?.message ?? "바꾸지 못했어요.");
      setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, active: !r.active } : x)));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "바꾸지 못했어요.");
    }
  };

  const copy = (text: string) => {
    void navigator.clipboard?.writeText(text).catch(() => {});
  };
  const linkOf = (c: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/talent/payments?code=${encodeURIComponent(c)}`;

  return (
    <div className="ops-page">
      <header className="ops-page-head">
        <h1 className="ops-page-title">포인트 코드</h1>
        <p className="ops-page-desc">쿠폰·이벤트 코드를 만들면, 사용자가 결제 화면에서 코드를 넣는 즉시 AI 포인트가 충전돼요. 계정당 같은 코드는 한 번만 쓸 수 있어요.</p>
      </header>

      {/* 만들기 */}
      <section style={{ margin: "16px 0", border: "1px solid var(--line)", borderRadius: 12, background: "var(--surface)", padding: 16 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {(["custom", "random"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{ ...smallBtn, height: 34, padding: "0 14px", ...(mode === m ? { background: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--accent-ink)" } : {}) }}
            >
              {m === "custom" ? "이벤트 코드 (직접 지정·여럿이 같이 씀)" : "랜덤 코드 N개 (1인 1코드)"}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {mode === "custom" ? (
            <label style={label}>
              코드
              <input style={{ ...input, textTransform: "uppercase" }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="예: FALL2026" />
            </label>
          ) : (
            <>
              <label style={label}>
                개수 (최대 500)
                <input style={input} inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
              </label>
              <label style={label}>
                앞글자
                <input style={{ ...input, textTransform: "uppercase" }} value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="APLY" />
              </label>
            </>
          )}
          <label style={label}>
            충전 포인트 (P)
            <input style={input} inputMode="numeric" value={points} onChange={(e) => setPoints(e.target.value)} />
          </label>
          <label style={label}>
            {mode === "custom" ? "전체 사용 횟수(선착순)" : "코드당 사용 횟수"}
            <input style={input} inputMode="numeric" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
          </label>
          <label style={label}>
            만료일 (비우면 무기한)
            <input style={input} type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </label>
          <label style={{ ...label, gridColumn: "1 / -1" }}>
            메모 (운영용, 사용자에겐 안 보임)
            <input style={input} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: 2026 가을 박람회 부스" maxLength={200} />
          </label>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
          <button type="button" onClick={() => void create()} disabled={creating} style={{ height: 40, borderRadius: 10, background: "var(--accent)", color: "#fff", fontWeight: 700, padding: "0 18px", border: "none", cursor: "pointer" }}>
            {creating ? "만드는 중…" : "코드 만들기"}
          </button>
          <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>1P = 10원 기준 · 만료일은 그날 23:59(KST)까지</span>
        </div>
        {created && created.length ? (
          <div style={{ marginTop: 14, borderRadius: 10, background: "var(--accent-soft)", padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <b style={{ fontSize: 13, color: "var(--accent-ink)" }}>{created.length}개 만들었어요</b>
              <button type="button" style={smallBtn} onClick={() => copy(created.join("\n"))}>
                전체 복사
              </button>
            </div>
            <pre style={{ marginTop: 8, maxHeight: 160, overflowY: "auto", fontSize: 12.5, lineHeight: 1.6, color: "var(--ink)", whiteSpace: "pre-wrap" }}>{created.join("\n")}</pre>
          </div>
        ) : null}
      </section>

      {/* 목록 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load(q.trim());
        }}
        style={{ display: "flex", gap: 8, margin: "16px 0" }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="코드·메모로 검색" style={{ ...input, flex: 1, maxWidth: 320 }} />
        <button type="submit" style={{ height: 40, borderRadius: 10, background: "var(--accent)", color: "#fff", fontWeight: 700, padding: "0 16px", border: "none" }}>
          검색
        </button>
      </form>

      {error ? <p style={{ color: "var(--danger)", fontWeight: 600 }}>{error}</p> : null}

      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 12, background: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--ink-faint)", borderBottom: "1px solid var(--line)" }}>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>코드</th>
              <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "right" }}>포인트</th>
              <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "right" }}>사용</th>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>만료</th>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>메모</th>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>상태</th>
              <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "right" }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--ink-faint)" }}>불러오는 중…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--ink-faint)" }}>아직 코드가 없어요.</td></tr>
            ) : (
              items.map((r) => {
                const st = statusOf(r);
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--line)", color: "var(--ink)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 800, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{r.code}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{r.points.toLocaleString()}P</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      {r.usedCount.toLocaleString()} / {r.maxUses.toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap", color: "var(--ink-faint)" }}>{r.expiresAt ? new Date(r.expiresAt).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) : "무기한"}</td>
                    <td style={{ padding: "10px 14px", color: "var(--ink-faint)", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.memo || r.groupKey || "-"}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: st.color, whiteSpace: "nowrap" }}>{st.text}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <button type="button" style={smallBtn} onClick={() => copy(r.code)}>
                          코드 복사
                        </button>
                        <button type="button" style={smallBtn} onClick={() => copy(linkOf(r.code))}>
                          링크 복사
                        </button>
                        <button type="button" style={{ ...smallBtn, color: r.active ? "var(--danger)" : "var(--accent-ink)" }} onClick={() => void toggle(r)}>
                          {r.active ? "중지" : "재개"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 12, fontSize: 12, color: "var(--ink-faint)" }}>최근 200개 · 링크 복사 = 결제 화면에 코드가 미리 채워진 주소(사용자가 등록 버튼을 눌러야 충전돼요).</p>
    </div>
  );
}
