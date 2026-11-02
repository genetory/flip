"use client";

// APLY PARTNERS 기업 제휴 문의(/premium-partners) — 목록 · 검색(회사·담당자·이메일·직무) · 제휴 방식·채용 계획·외국인 채용·상태 필터 ·
// 문의일 정렬 · 상태 변경과 운영 메모 · CSV 내려받기(걸린 필터 그대로). 영업 연락·미팅은 운영팀이 직접 하고 여기엔 기록만 남긴다.
import { useCallback, useEffect, useState } from "react";
import { Chips, Field, KpiGrid, Modal, PageHead, SearchBox, dt, opsToken, useOpsApi } from "../../system/_billing/shared";

type Item = {
  id: string;
  companyName: string;
  contactName: string;
  contactTitle: string | null;
  email: string;
  phone: string | null;
  website: string | null;
  companySize: string;
  industry: string | null;
  partnershipModels: string[];
  hiringPlan: string;
  roles: string;
  headcount: string;
  duration: string;
  workConditions: string | null;
  foreignHiring: string;
  conversion: string;
  message: string | null;
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
    byStatus: Record<string, number>;
    byHiring: Record<string, number>;
    byForeign: Record<string, number>;
    byModel: Record<string, number>;
  };
};

const STATUS: Record<string, { label: string; cls: string }> = {
  NEW: { label: "신규", cls: "ops-pill ops-pill-blue" },
  CONTACTED: { label: "연락 완료", cls: "ops-pill ops-pill-violet" },
  MEETING: { label: "미팅", cls: "ops-pill ops-pill-amber" },
  NEGOTIATING: { label: "조건 협의", cls: "ops-pill ops-pill-amber" },
  AGREED: { label: "협약 체결", cls: "ops-pill ops-pill-green" },
  ON_HOLD: { label: "보류", cls: "ops-pill ops-pill-gray" },
  EXCLUDED: { label: "제외", cls: "ops-pill ops-pill-gray" }
};
const STATUS_KEYS = Object.keys(STATUS);
const MODEL: Record<string, string> = { REFERRAL: "인재 추천형", INTERNSHIP: "인턴십 채용형", PROJECT: "프로젝트 협력형" };
const SIZE: Record<string, string> = { S1_9: "1–9명", S10_49: "10–49명", S50_299: "50–299명", S300_PLUS: "300명 이상" };
const HIRING: Record<string, string> = { NOW: "지금 계획 있음", WITHIN_6M: "6개월 안", CONSIDERING: "검토 중", NO_PLAN: "아직 없음" };
const HEADCOUNT: Record<string, string> = { H1: "1명", H2_3: "2–3명", H4_5: "4–5명", H6_PLUS: "6명 이상", UNDECIDED: "미정" };
const DURATION: Record<string, string> = { W4: "4주", W8: "8주", W12: "12주", M3_PLUS: "3개월 이상", NEGOTIABLE: "협의" };
const FOREIGN: Record<string, string> = { YES: "가능", VISA_DEPENDENT: "체류자격에 따라", NO: "어려움", UNSURE: "잘 모름" };
const CONVERSION: Record<string, string> = { YES: "있음", POSSIBLE: "성과에 따라", NO: "없음", UNDECIDED: "미정" };
const LOCALE: Record<string, string> = { ko: "한국어", en: "English", "zh-CN": "中文", vi: "Tiếng Việt", ja: "日本語", id: "Indonesia" };

type Filters = { status: string; model: string; hiring: string; foreign: string; sort: "newest" | "oldest"; q: string };
const INITIAL: Filters = { status: "", model: "", hiring: "", foreign: "", sort: "newest", q: "" };
const PAGE = 50;

function toParams(f: Filters, skip = 0) {
  const p = new URLSearchParams();
  if (f.status) p.set("status", f.status);
  if (f.model) p.set("model", f.model);
  if (f.hiring) p.set("hiring", f.hiring);
  if (f.foreign) p.set("foreign", f.foreign);
  if (f.sort !== "newest") p.set("sort", f.sort);
  if (f.q.trim()) p.set("q", f.q.trim());
  if (skip) p.set("skip", String(skip));
  p.set("take", String(PAGE));
  return p;
}

export default function PremiumPartnersOpsPage() {
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
        setData(await api.call<Res>(`/ops/premium-partners?${toParams(next, nextSkip)}`));
        setSkip(nextSkip);
      } catch (e) {
        setError(e instanceof Error ? e.message : "문의를 불러오지 못했어요.");
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
      const res = await fetch(`${base}/ops/premium-partners/export?${params}`, { headers: { Authorization: `Bearer ${opsToken()}` } });
      if (!res.ok) throw new Error("CSV 를 만들지 못했어요.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `premium-partners-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "CSV 를 만들지 못했어요.");
    } finally {
      setExporting(false);
    }
  };

  const s = data?.summary;
  const active = s ? (s.byStatus.CONTACTED ?? 0) + (s.byStatus.MEETING ?? 0) + (s.byStatus.NEGOTIATING ?? 0) : 0;

  return (
    <section className="ops-content-section">
      <PageHead
        title="APLY PARTNERS 기업 제휴"
        desc="/premium-partners 에서 들어온 기업 제휴 문의와 인턴십 수요예요. 눌러서 내용을 보고 진행 상태와 메모를 남겨요."
        right={
          <>
            <a className="ops-btn" href="/premium-partners" target="_blank" rel="noreferrer" style={{ height: 38, display: "inline-flex", alignItems: "center", padding: "0 14px" }}>
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
          { label: "전체 문의", value: s ? `${s.totalAll.toLocaleString()}곳` : "–", sub: s ? `신규 ${s.byStatus.NEW ?? 0}곳` : undefined, tone: "blue" },
          { label: "진행 중", value: s ? `${active}곳` : "–", sub: "연락·미팅·조건 협의" },
          { label: "협약 체결", value: s ? `${s.byStatus.AGREED ?? 0}곳` : "–", tone: "green" },
          { label: "지금 채용 계획", value: s ? `${s.byHiring.NOW ?? 0}곳` : "–", sub: s ? `6개월 안 ${s.byHiring.WITHIN_6M ?? 0}곳` : undefined, tone: "amber" },
          { label: "외국인 채용 가능", value: s ? `${s.byForeign.YES ?? 0}곳` : "–", sub: s ? `체류자격에 따라 ${s.byForeign.VISA_DEPENDENT ?? 0}곳` : undefined }
        ]}
      />

      <div style={{ marginBottom: 12 }}>
        <Chips
          value={f.status}
          onChange={(v) => apply({ status: v })}
          options={[{ key: "", label: "전체", count: s?.totalAll }, ...STATUS_KEYS.map((k) => ({ key: k, label: STATUS[k].label, count: s?.byStatus[k] ?? 0 }))]}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <select className="ops-select" style={{ width: 160 }} value={f.model} onChange={(e) => apply({ model: e.target.value })} aria-label="제휴 방식">
          <option value="">제휴 방식 전체</option>
          {Object.entries(MODEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v} ({s?.byModel[k] ?? 0})
            </option>
          ))}
        </select>
        <select className="ops-select" style={{ width: 160 }} value={f.hiring} onChange={(e) => apply({ hiring: e.target.value })} aria-label="채용 계획">
          <option value="">채용 계획 전체</option>
          {Object.entries(HIRING).map(([k, v]) => (
            <option key={k} value={k}>
              {v} ({s?.byHiring[k] ?? 0})
            </option>
          ))}
        </select>
        <select className="ops-select" style={{ width: 170 }} value={f.foreign} onChange={(e) => apply({ foreign: e.target.value })} aria-label="외국인 채용">
          <option value="">외국인 채용 전체</option>
          {Object.entries(FOREIGN).map(([k, v]) => (
            <option key={k} value={k}>
              {v} ({s?.byForeign[k] ?? 0})
            </option>
          ))}
        </select>
        <select className="ops-select" style={{ width: 130 }} value={f.sort} onChange={(e) => apply({ sort: e.target.value as Filters["sort"] })} aria-label="정렬">
          <option value="newest">최근 문의순</option>
          <option value="oldest">오래된 순</option>
        </select>
        <div style={{ flex: "1 1 260px", display: "flex", justifyContent: "flex-end" }}>
          <SearchBox value={q} onChange={setQ} onSubmit={() => apply({ q })} placeholder="회사·담당자·이메일·직무" />
        </div>
      </div>

      {error ? <p className="ops-form-error" style={{ marginBottom: 12 }}>{error}</p> : null}

      <div className="ops-table-card">
        <table>
          <colgroup>
            <col style={{ width: 150 }} />
            <col />
            <col style={{ width: "24%" }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 100 }} />
          </colgroup>
          <thead>
            <tr>
              <th>문의일</th>
              <th>회사 · 담당자</th>
              <th>필요 직무</th>
              <th>인원 · 기간</th>
              <th>채용 계획</th>
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
                <td colSpan={6} className="ops-table-empty" style={{ textAlign: "center", padding: 28 }}>조건에 맞는 문의가 없어요.</td>
              </tr>
            ) : (
              data.items.map((a) => (
                <tr key={a.id} className="ops-clickable-row" onClick={() => setOpen(a)} style={{ cursor: "pointer" }}>
                  <td>
                    <div className="ops-row-strong">{dt(a.createdAt)}</div>
                  </td>
                  <td>
                    <div className="ops-row-strong">
                      {a.companyName} <span className="ops-row-sub">· {SIZE[a.companySize] ?? a.companySize}</span>
                    </div>
                    <div className="ops-row-sub">
                      {a.contactName}
                      {a.contactTitle ? ` (${a.contactTitle})` : ""} · {a.email}
                    </div>
                  </td>
                  <td>
                    <div className="ops-row-strong">{a.roles}</div>
                    <div className="ops-row-sub">{a.partnershipModels.map((m) => MODEL[m] ?? m).join(" · ")}</div>
                  </td>
                  <td>
                    <div className="ops-row-strong">{HEADCOUNT[a.headcount] ?? a.headcount}</div>
                    <div className="ops-row-sub">{DURATION[a.duration] ?? a.duration}</div>
                  </td>
                  <td>
                    <div className="ops-row-strong">{HIRING[a.hiringPlan] ?? a.hiringPlan}</div>
                    <div className="ops-row-sub">외국인 {FOREIGN[a.foreignHiring] ?? a.foreignHiring}</div>
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
      await api.call(`/ops/premium-partners/${item.id}`, { method: "PATCH", body: { status, opsNote: note.trim() || null } });
      onSaved({ id: item.id, status, opsNote: note.trim() || null });
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  const rows: [string, string | null][] = [
    ["담당자", `${item.contactName}${item.contactTitle ? ` (${item.contactTitle})` : ""}`],
    ["이메일", item.email],
    ["연락처", item.phone],
    ["웹사이트", item.website],
    ["규모 · 업종", `${SIZE[item.companySize] ?? item.companySize}${item.industry ? ` · ${item.industry}` : ""}`],
    ["제휴 방식", item.partnershipModels.map((m) => MODEL[m] ?? m).join(", ")],
    ["채용 계획", HIRING[item.hiringPlan] ?? item.hiringPlan],
    ["필요 직무", item.roles],
    ["수용 인원", HEADCOUNT[item.headcount] ?? item.headcount],
    ["근무 기간", DURATION[item.duration] ?? item.duration],
    ["급여·근무 조건", item.workConditions],
    ["외국인 채용", FOREIGN[item.foreignHiring] ?? item.foreignHiring],
    ["정규직 전환", CONVERSION[item.conversion] ?? item.conversion],
    ["요청 사항", item.message],
    ["개인정보 동의", `${dt(item.privacyConsentAt)} · ${item.consentVersion}`],
    ["마케팅 수신", item.marketingConsentAt ? `동의 (${dt(item.marketingConsentAt)})` : "미동의"],
    ["화면 언어", LOCALE[item.locale] ?? item.locale],
    ["유입", [item.utmSource, item.utmMedium, item.utmCampaign].filter(Boolean).join(" / ") || item.referrer || null]
  ];

  return (
    <Modal
      title={item.companyName}
      sub={`${dt(item.createdAt)} 문의`}
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
        <Field label="진행 상태">
          <div className="ops-filter-chip-row">
            {STATUS_KEYS.map((k) => (
              <button key={k} type="button" className={`ops-filter-chip ${status === k ? "is-active" : ""}`} onClick={() => setStatus(k)}>
                {STATUS[k].label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="운영 메모" hint="미팅 내용·협의 조건 등. 기업에는 보이지 않아요.">
          <textarea className="ops-input" rows={4} value={note} onChange={(e) => setNote(e.target.value)} maxLength={4000} style={{ height: "auto", padding: 10 }} />
        </Field>
        {error ? <p className="ops-form-error">{error}</p> : null}
      </div>
    </Modal>
  );
}
