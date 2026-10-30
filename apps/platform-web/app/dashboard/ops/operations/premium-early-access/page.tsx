"use client";

// APLY PREMIUM 얼리 액세스 신청자(/premium) — 목록 · 검색(이름·이메일) · 상품·체류자격·졸업 시기·상태 필터 · 신청일 정렬 ·
// 신청 상태 변경과 운영 메모 · CSV 내려받기(걸린 필터 그대로). 연락·상담은 운영팀이 직접 하고 여기엔 기록만 남긴다.
import { useCallback, useEffect, useState } from "react";
import { Chips, Field, KpiGrid, Modal, PageHead, SearchBox, dt, opsToken, useOpsApi } from "../../system/_billing/shared";

type Item = {
  id: string;
  name: string;
  email: string;
  nationality: string;
  degreeLevel: string;
  visaStatus: string;
  graduationPeriod: string;
  desiredRole: string;
  interestedPlan: string;
  phoneOrMessenger: string | null;
  careerChallenge: string | null;
  additionalRequests: string | null;
  privacyConsentAt: string;
  consentVersion: string;
  marketingConsentAt: string | null;
  status: string;
  opsNote: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  locale: string;
  userId: string | null;
  createdAt: string;
};
type Res = {
  items: Item[];
  total: number;
  summary: {
    totalAll: number;
    last7: number;
    marketing: number;
    byStatus: Record<string, number>;
    byPlan: Record<string, number>;
    byVisa: Record<string, number>;
    byGraduation: Record<string, number>;
  };
};

const STATUS: Record<string, { label: string; cls: string }> = {
  NEW: { label: "신규", cls: "ops-pill ops-pill-blue" },
  CONTACTED: { label: "연락 완료", cls: "ops-pill ops-pill-violet" },
  CONSULT_SCHEDULED: { label: "상담 예정", cls: "ops-pill ops-pill-amber" },
  CONSULTED: { label: "상담 완료", cls: "ops-pill ops-pill-green" },
  CONVERTED: { label: "전환", cls: "ops-pill ops-pill-green" },
  EXCLUDED: { label: "제외", cls: "ops-pill ops-pill-gray" }
};
const STATUS_KEYS = Object.keys(STATUS);
const PLAN: Record<string, string> = { START: "START", PRO: "PRO", GUARANTEE: "GUARANTEE", UNDECIDED: "미정" };
const VISA: Record<string, string> = { D2: "D-2", D10: "D-10", F: "F 계열", E7: "E-7", OTHER: "기타", UNKNOWN: "모름" };
const DEGREE: Record<string, string> = { BACHELOR: "학사", MASTER: "석사", DOCTORATE: "박사", GRADUATED: "졸업", OTHER: "기타" };
const LOCALE: Record<string, string> = { ko: "한국어", en: "English", "zh-CN": "中文", vi: "Tiếng Việt", ja: "日本語", id: "Indonesia" };
const gradLabel = (g: string) => {
  if (g === "GRADUATED") return "이미 졸업";
  if (g === "LATER") return "그 이후";
  const m = /^(\d{4})-H([12])$/.exec(g);
  return m ? `${m[1]} ${m[2] === "1" ? "상반기" : "하반기"}` : g;
};

type Filters = { status: string; plan: string; visa: string; graduation: string; sort: "newest" | "oldest"; q: string };
const INITIAL: Filters = { status: "", plan: "", visa: "", graduation: "", sort: "newest", q: "" };
const PAGE = 50;

function toParams(f: Filters, skip = 0) {
  const p = new URLSearchParams();
  if (f.status) p.set("status", f.status);
  if (f.plan) p.set("plan", f.plan);
  if (f.visa) p.set("visa", f.visa);
  if (f.graduation) p.set("graduation", f.graduation);
  if (f.sort !== "newest") p.set("sort", f.sort);
  if (f.q.trim()) p.set("q", f.q.trim());
  if (skip) p.set("skip", String(skip));
  p.set("take", String(PAGE));
  return p;
}

export default function PremiumEarlyAccessPage() {
  const api = useOpsApi();
  const [data, setData] = useState<Res | null>(null);
  const [error, setError] = useState("");
  const [f, setF] = useState<Filters>(INITIAL);
  const [q, setQ] = useState("");
  const [skip, setSkip] = useState(0);
  const [open, setOpen] = useState<Item | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(
    async (next: Filters, nextSkip = 0) => {
      try {
        setError("");
        setData(await api.call<Res>(`/ops/premium-early-access?${toParams(next, nextSkip)}`));
        setSkip(nextSkip);
      } catch (e) {
        setError(e instanceof Error ? e.message : "신청자를 불러오지 못했어요.");
      }
    },
    [api]
  );

  useEffect(() => {
    // 처음 한 번 서버에서 읽어 온다(응답이 오면 상태를 채운다).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(INITIAL);
  }, [load]);

  const apply = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch };
    setF(next);
    void load(next);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const params = toParams(f);
      params.delete("take");
      const res = await fetch(`${base}/ops/premium-early-access/export?${params}`, { headers: { Authorization: `Bearer ${opsToken()}` } });
      if (!res.ok) throw new Error("CSV 를 만들지 못했어요.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `premium-early-access-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "CSV 를 만들지 못했어요.");
    } finally {
      setExporting(false);
    }
  };

  const s = data?.summary;
  const pct = (n: number) => (s && s.totalAll ? `${Math.round((n / s.totalAll) * 100)}%` : "–");
  const graduations = Object.keys(s?.byGraduation ?? {}).sort();

  return (
    <section className="ops-content-section">
      <PageHead
        title="APLY PREMIUM 얼리 액세스"
        desc="/premium 에서 들어온 신청자예요. 눌러서 내용을 보고 상태와 메모를 남겨요. 연락은 운영팀이 직접 해요."
        right={
          <>
            <a className="ops-btn" href="/premium" target="_blank" rel="noreferrer" style={{ height: 38, display: "inline-flex", alignItems: "center", padding: "0 14px" }}>
              페이지 열기
            </a>
            <button type="button" className="ops-btn ops-btn-primary" style={{ height: 38, padding: "0 16px" }} onClick={() => void exportCsv()} disabled={exporting || !data?.total}>
              {exporting ? "만드는 중…" : `CSV 내려받기${data ? ` (${data.total.toLocaleString()})` : ""}`}
            </button>
          </>
        }
      />

      <KpiGrid
        items={[
          { label: "전체 신청", value: s ? `${s.totalAll.toLocaleString()}명` : "–", sub: s ? `최근 7일 +${s.last7}` : undefined, tone: "blue" },
          { label: "PRO", value: s ? `${s.byPlan.PRO ?? 0}명` : "–", sub: s ? pct(s.byPlan.PRO ?? 0) : undefined },
          { label: "GUARANTEE", value: s ? `${s.byPlan.GUARANTEE ?? 0}명` : "–", sub: s ? pct(s.byPlan.GUARANTEE ?? 0) : undefined, tone: "amber" },
          { label: "START", value: s ? `${s.byPlan.START ?? 0}명` : "–", sub: s ? `미정 ${s.byPlan.UNDECIDED ?? 0}명` : undefined },
          { label: "마케팅 수신 동의", value: s ? `${s.marketing}명` : "–", sub: s ? pct(s.marketing) : undefined, tone: "green" }
        ]}
      />

      <div style={{ marginBottom: 12 }}>
        <Chips
          value={f.status}
          onChange={(v) => apply({ status: v })}
          options={[
            { key: "", label: "전체", count: s?.totalAll },
            ...STATUS_KEYS.map((k) => ({ key: k, label: STATUS[k].label, count: s?.byStatus[k] ?? 0 }))
          ]}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <select className="ops-select" style={{ width: 140 }} value={f.plan} onChange={(e) => apply({ plan: e.target.value })} aria-label="관심 상품">
          <option value="">상품 전체</option>
          {Object.entries(PLAN).map(([k, v]) => (
            <option key={k} value={k}>
              {v} ({s?.byPlan[k] ?? 0})
            </option>
          ))}
        </select>
        <select className="ops-select" style={{ width: 140 }} value={f.visa} onChange={(e) => apply({ visa: e.target.value })} aria-label="체류자격">
          <option value="">체류자격 전체</option>
          {Object.entries(VISA).map(([k, v]) => (
            <option key={k} value={k}>
              {v} ({s?.byVisa[k] ?? 0})
            </option>
          ))}
        </select>
        <select className="ops-select" style={{ width: 150 }} value={f.graduation} onChange={(e) => apply({ graduation: e.target.value })} aria-label="졸업 시기">
          <option value="">졸업 시기 전체</option>
          {graduations.map((g) => (
            <option key={g} value={g}>
              {gradLabel(g)} ({s?.byGraduation[g] ?? 0})
            </option>
          ))}
        </select>
        <select className="ops-select" style={{ width: 130 }} value={f.sort} onChange={(e) => apply({ sort: e.target.value as Filters["sort"] })} aria-label="정렬">
          <option value="newest">최근 신청순</option>
          <option value="oldest">오래된 순</option>
        </select>
        <div style={{ flex: "1 1 260px", display: "flex", justifyContent: "flex-end" }}>
          <SearchBox value={q} onChange={setQ} onSubmit={() => apply({ q })} placeholder="이름·이메일" />
        </div>
      </div>

      {error ? <p className="ops-form-error" style={{ marginBottom: 12 }}>{error}</p> : null}

      <div className="ops-table-card">
        <table>
          <colgroup>
            <col style={{ width: 150 }} />
            <col />
            <col style={{ width: 110 }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 100 }} />
          </colgroup>
          <thead>
            <tr>
              <th>신청일</th>
              <th>신청자</th>
              <th>관심 상품</th>
              <th>희망 직무</th>
              <th>체류자격 · 졸업</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {data === null ? (
              <tr>
                <td colSpan={6} className="ops-table-empty" style={{ textAlign: "center", padding: 28 }}>불러오는 중…</td>
              </tr>
            ) : !data.items.length ? (
              <tr>
                <td colSpan={6} className="ops-table-empty" style={{ textAlign: "center", padding: 28 }}>조건에 맞는 신청자가 없어요.</td>
              </tr>
            ) : (
              data.items.map((a) => (
                <tr key={a.id} className="ops-clickable-row" onClick={() => setOpen(a)} style={{ cursor: "pointer" }}>
                  <td>
                    <div className="ops-row-strong">{dt(a.createdAt)}</div>
                  </td>
                  <td>
                    <div className="ops-row-strong">
                      {a.name} <span className="ops-row-sub">· {a.nationality}</span>
                    </div>
                    <div className="ops-row-sub">{a.email}</div>
                  </td>
                  <td>
                    <span className={a.interestedPlan === "GUARANTEE" ? "ops-pill ops-pill-amber" : a.interestedPlan === "PRO" ? "ops-pill ops-pill-blue" : "ops-pill ops-pill-gray"}>
                      {PLAN[a.interestedPlan] ?? a.interestedPlan}
                    </span>
                  </td>
                  <td>
                    <div className="ops-row-strong">{a.desiredRole}</div>
                    <div className="ops-row-sub">{DEGREE[a.degreeLevel] ?? a.degreeLevel}</div>
                  </td>
                  <td>
                    <div className="ops-row-strong">{VISA[a.visaStatus] ?? a.visaStatus}</div>
                    <div className="ops-row-sub">{gradLabel(a.graduationPeriod)}</div>
                  </td>
                  <td>
                    <span className={STATUS[a.status]?.cls ?? "ops-pill ops-pill-gray"}>{STATUS[a.status]?.label ?? a.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.total > PAGE ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 14 }}>
          <button type="button" className="ops-btn" disabled={skip === 0} onClick={() => void load(f, Math.max(0, skip - PAGE))}>
            이전
          </button>
          <span className="ops-row-sub">
            {skip + 1}–{Math.min(skip + PAGE, data.total)} / {data.total.toLocaleString()}
          </span>
          <button type="button" className="ops-btn" disabled={skip + PAGE >= data.total} onClick={() => void load(f, skip + PAGE)}>
            다음
          </button>
        </div>
      ) : null}

      {open ? (
        <Detail
          item={open}
          onClose={() => setOpen(null)}
          onSaved={(u) => {
            setOpen(null);
            setData((d) => (d ? { ...d, items: d.items.map((x) => (x.id === u.id ? { ...x, ...u } : x)) } : d));
            void load(f, skip);
          }}
        />
      ) : null}
    </section>
  );
}

function Detail({ item, onClose, onSaved }: { item: Item; onClose: () => void; onSaved: (u: Pick<Item, "id" | "status" | "opsNote">) => void }) {
  const api = useOpsApi();
  const [status, setStatus] = useState(item.status);
  const [note, setNote] = useState(item.opsNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await api.call(`/ops/premium-early-access/${item.id}`, { method: "PATCH", body: { status, opsNote: note.trim() || null } });
      onSaved({ id: item.id, status, opsNote: note.trim() || null });
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  const rows: [string, string | null][] = [
    ["이메일", item.email],
    ["연락처·메신저", item.phoneOrMessenger],
    ["국적", item.nationality],
    ["학위 과정", DEGREE[item.degreeLevel] ?? item.degreeLevel],
    ["체류자격", VISA[item.visaStatus] ?? item.visaStatus],
    ["졸업 시기", gradLabel(item.graduationPeriod)],
    ["희망 직무", item.desiredRole],
    ["관심 상품", PLAN[item.interestedPlan] ?? item.interestedPlan],
    ["가장 어려운 점", item.careerChallenge],
    ["추가로 원하는 서비스", item.additionalRequests],
    ["개인정보 동의", `${dt(item.privacyConsentAt)} · ${item.consentVersion}`],
    ["마케팅 수신", item.marketingConsentAt ? `동의 (${dt(item.marketingConsentAt)})` : "미동의"],
    ["화면 언어", LOCALE[item.locale] ?? item.locale],
    ["유입", [item.utmSource, item.utmMedium, item.utmCampaign].filter(Boolean).join(" / ") || item.referrer || null],
    ["회원", item.userId ? "가입 회원" : "비회원"]
  ];

  return (
    <Modal
      title={item.name}
      sub={`${dt(item.createdAt)} 신청`}
      onClose={onClose}
      size="md"
      footer={
        <>
          <button type="button" className="ops-btn" onClick={onClose}>
            닫기
          </button>
          <button type="button" className="ops-btn ops-btn-primary" onClick={() => void save()} disabled={saving}>
            {saving ? "저장 중…" : "저장"}
          </button>
        </>
      }
    >
      <dl style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "8px 12px", margin: 0, fontSize: 13 }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "contents" }}>
            <dt style={{ color: "var(--ink-faint)", fontWeight: 600 }}>{k}</dt>
            <dd style={{ margin: 0, color: "var(--ink)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{v || "-"}</dd>
          </div>
        ))}
      </dl>
      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <Field label="신청 상태">
          <div className="ops-filter-chip-row">
            {STATUS_KEYS.map((k) => (
              <button key={k} type="button" className={`ops-filter-chip ${status === k ? "is-active" : ""}`} onClick={() => setStatus(k)}>
                {STATUS[k].label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="운영 메모" hint="신청자에게는 보이지 않아요.">
          <textarea className="ops-input" rows={4} value={note} onChange={(e) => setNote(e.target.value)} maxLength={4000} style={{ height: "auto", padding: 10 }} />
        </Field>
        {error ? <p className="ops-form-error">{error}</p> : null}
      </div>
    </Modal>
  );
}
