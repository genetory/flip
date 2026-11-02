"use client";

// 결제 · AI 포인트 · 포인트 코드 운영 화면이 같이 쓰는 것 — API 호출, 사유·기능 이름, 숫자 표기, 모달·KPI.
// 운영 콘솔 공통 클래스(ops-kpi-*, ops-table-card, ops-modal-*, ops-filter-chip, ops-btn, ops-pill)를 쓴다.
import { useMemo, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

/** 운영자 토큰 — 파일 내려받기처럼 useOpsApi 로 못 하는 요청에 쓴다. */
export const opsToken = () => readCookie("ops_admin_token");

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

/** 운영 API — 실패하면 서버 메시지로 throw. */
export function useOpsApi() {
  const base = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  return useMemo(() => {
    const call = async <T,>(path: string, init?: { method?: string; body?: unknown }): Promise<T> => {
      const res = await fetch(`${base}${path}`, {
        method: init?.method ?? "GET",
        headers: { Authorization: `Bearer ${readCookie("ops_admin_token")}`, ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}) },
        ...(init?.body !== undefined ? { body: JSON.stringify(init.body) } : {})
      });
      const data = (await res.json().catch(() => null)) as (T & { ok?: boolean; message?: string }) | null;
      if (!res.ok || data?.ok !== true) throw new Error(data?.message ?? "처리하지 못했어요.");
      return data;
    };
    return { call };
  }, [base]);
}

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
export const pts = (n: number) => `${n.toLocaleString("ko-KR")}P`;
/** 1P = 10원 */
export const ptsWon = (n: number) => won(n * 10);
export const dt = (s: string | null | undefined) => (s ? new Date(s).toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 16) : "-");
export const day = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) : "-");

/** 포인트 원장 사유(적립 사유 또는 사용한 기능 키) → 사람이 읽는 이름. */
const POINT_REASON: Record<string, string> = {
  // 적립·조정
  welcome: "가입 보너스",
  daily: "매일 적립",
  coupon: "포인트 코드",
  purchase: "충전(결제)",
  refund: "환불 회수",
  ops_grant: "운영자 조정",
  growth_bonus: "그로스 보너스",
  interview_credit_convert: "면접 이용권 전환",
  // 예전 모의 면접 이용권 원장
  free_trial: "가입 첫 1회",
  feedback: "답변 피드백",
  prep: "예상 질문",
  convert_to_points: "포인트로 전환",
  // 기능 사용
  import_resume: "이력서 불러오기",
  import_cover_letter: "자소서 불러오기",
  interview_questions: "모의 면접 질문",
  interview_prep: "면접 준비",
  interview_feedback: "면접 답변 피드백",
  tailor_analyze: "공고 맞춤 분석",
  draft_intro: "자기소개 초안",
  generate_english_intro: "영문 자기소개",
  cover_letter: "자소서 생성",
  review_resume: "이력서 점검",
  review_cover: "자소서 점검",
  polish_resume_items: "이력서 다듬기",
  draft_resume_text: "이력서 문장",
  experience_interview: "경험 인터뷰",
  experience_bullets: "경험 문장",
  experience_title: "경험 제목",
  experience_tasks: "경험 업무",
  polish_intro: "자기소개 다듬기",
  polish_experience: "경험 다듬기",
  summarize_intro: "자기소개 요약",
  suggest_skills: "스킬 추천",
  translate_texts: "번역",
  role_checklist: "내 서류와 비교",
  import_job: "공고 불러오기",
  career_strengths: "강점 찾기"
};
export const reasonLabel = (r: string) => POINT_REASON[r] ?? r;

export function PageHead({ title, desc, right }: { title: string; desc: string; right?: ReactNode }) {
  return (
    // 운영 콘솔 공통 머리(ops-content-section > header 의 h1·p 스타일을 그대로 받는다)
    <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <div style={{ minWidth: 0 }}>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {right ? <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{right}</div> : null}
    </header>
  );
}

export type KpiItem = { label: string; value: string; sub?: string; tone?: "blue" | "green" | "amber" };
export function KpiGrid({ items }: { items: KpiItem[] }) {
  return (
    <div className="ops-kpi-grid" style={{ margin: "16px 0 24px" }}>
      {items.map((k) => (
        <div key={k.label} className={`ops-kpi-tile ${k.tone ? `ops-kpi-${k.tone}` : ""}`}>
          <p className="ops-kpi-label">{k.label}</p>
          <p className="ops-kpi-value">{k.value}</p>
          {k.sub ? <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "var(--ink-faint)" }}>{k.sub}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function Chips<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { key: T; label: string; count?: number }[] }) {
  return (
    <div className="ops-filter-chip-row">
      {options.map((o) => (
        <button key={o.key} type="button" className={`ops-filter-chip ${value === o.key ? "is-active" : ""}`} onClick={() => onChange(o.key)}>
          {o.label}
          {o.count !== undefined ? <span className="ops-filter-chip-count">{o.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function SearchBox({ value, onChange, onSubmit, placeholder }: { value: string; onChange: (v: string) => void; onSubmit: () => void; placeholder: string }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      style={{ display: "flex", gap: 8, flex: "1 1 260px", maxWidth: 380 }}
    >
      <input className="ops-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <button type="submit" className="ops-btn ops-btn-primary" style={{ height: 38, padding: "0 16px", flex: "none" }}>
        검색
      </button>
    </form>
  );
}

export function Modal({ title, sub, onClose, children, footer, size = "md" }: { title: string; sub?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg" }) {
  return (
    <div className="ops-modal-backdrop" onClick={onClose}>
      <div className={`ops-modal-panel ops-modal-panel--${size}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="ops-modal-panel-header">
          <div style={{ minWidth: 0 }}>
            <h2>{title}</h2>
            {sub ? <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--ink-faint)" }}>{sub}</p> : null}
          </div>
          <button type="button" className="ops-modal-close" onClick={onClose} aria-label="닫기">
            <X size={16} weight="bold" aria-hidden />
          </button>
        </div>
        <div className="ops-modal-panel-body">{children}</div>
        {footer ? <div className="ops-modal-panel-footer" style={{ gap: 8 }}>{footer}</div> : null}
      </div>
    </div>
  );
}

/** 폼 칸 — 라벨 + 입력 + 도움말 */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)" }}>
      {label}
      {children}
      {hint ? <span style={{ fontSize: 11.5, fontWeight: 500, color: "var(--ink-faint)" }}>{hint}</span> : null}
    </label>
  );
}

/** 가로 막대 — 기능별 사용량 같은 순위 */
export function BarList({ rows, format }: { rows: { label: string; value: number; sub?: string }[]; format: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="ops-empty-card" style={{ padding: "24px 0" }}>아직 기록이 없어요.</p>;
  return (
    <ul style={{ display: "flex", flexDirection: "column", gap: 10, margin: 0, padding: 0, listStyle: "none" }}>
      {rows.map((r) => (
        <li key={r.label}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12.5 }}>
            <span style={{ color: "var(--ink)", fontWeight: 600 }}>{r.label}</span>
            <span style={{ color: "var(--ink-soft)", fontVariantNumeric: "tabular-nums" }}>
              {format(r.value)}
              {r.sub ? <span style={{ color: "var(--ink-faint)" }}> · {r.sub}</span> : null}
            </span>
          </div>
          <div style={{ marginTop: 4, height: 6, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
            <div style={{ width: `${(r.value / max) * 100}%`, height: "100%", borderRadius: 999, background: "var(--accent)" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 18 };
export const numInput: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };
