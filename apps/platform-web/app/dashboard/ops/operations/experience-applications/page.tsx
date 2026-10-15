"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CaretDown, X } from "@phosphor-icons/react/dist/ssr";
import { readAccessToken } from "../../../../../lib/auth-client";

// ---------------------------------------------------------------------------
// /dashboard/ops/operations/experience-applications — "내 경험이 스펙이 되는 순간"
// 자소서 경험 발굴 캠페인(/experience) 신청 관리. sgc-applications 와 같은 ops 패턴
// (검색 + 단계 필터 + 페이지네이션 + status 카운트 + 인라인 단계 변경 + 상세 모달 메모).
// 주간 운영: 월 검토 → 화 2명 선정·개별 연락 → 수~금 상담. 연락은 운영팀이 직접(자동 발송 없음).
// ---------------------------------------------------------------------------

type ExpStatus = "RECEIVED" | "REVIEWING" | "SELECTED" | "DONE" | "DECLINED";
type ConsultMethod = "ONLINE" | "OFFLINE" | "ANY";

type Application = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  nationality: string | null;
  desiredRole: string;
  // v1 신청(텍스트)만 값이 있다 — v2부터는 파일 첨부.
  experience: string | null;
  coverLetter: string | null;
  resumeUrl: string | null;
  resumeFileName: string | null;
  coverLetterUrl: string | null;
  coverLetterFileName: string | null;
  consultMethod: ConsultMethod;
  consentPrivacyAt: string;
  consentVersion: string;
  consentCaseStudy: boolean;
  status: ExpStatus;
  opsNote: string | null;
  selectedWeek: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  referrer: string | null;
  locale: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Payload = {
  ok: boolean;
  total: number;
  take: number;
  skip: number;
  totalAll: number;
  statusCounts: Record<string, number>;
  applications: Application[];
};

type UpdatePayload = { status?: ExpStatus; opsNote?: string | null; selectedWeek?: string | null };

const STATUS_LABEL: Record<ExpStatus, string> = {
  RECEIVED: "접수",
  REVIEWING: "검토 중",
  SELECTED: "선정",
  DONE: "상담 완료",
  DECLINED: "미선정·종료"
};

const STATUS_PILL_CLASS: Record<ExpStatus, string> = {
  RECEIVED: "ops-pill ops-pill-blue",
  REVIEWING: "ops-pill ops-pill-violet",
  SELECTED: "ops-pill ops-pill-green",
  DONE: "ops-pill ops-pill-gray",
  DECLINED: "ops-pill ops-pill-gray"
};

const METHOD_LABEL: Record<ConsultMethod, string> = {
  ONLINE: "온라인",
  OFFLINE: "오프라인",
  ANY: "상관없음"
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ko-KR");
  } catch {
    return "-";
  }
}

// 이번 주 ISO 주차 ("2026-W43") — 선정 주차 기본값.
function currentIsoWeek(): string {
  const d = new Date();
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export default function ExperienceApplicationsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ExpStatus | "">("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 40 | 100>(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedApplication = useMemo(
    () => data?.applications.find((a) => a.id === selectedId) ?? null,
    [data, selectedId]
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${apiBase()}/ops/experience-applications`);
      if (status) url.searchParams.set("status", status);
      if (debouncedQ) url.searchParams.set("q", debouncedQ);
      url.searchParams.set("take", String(pageSize));
      url.searchParams.set("skip", String((page - 1) * pageSize));
      const response = await fetch(url.toString(), { headers: authHeaders(), cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setData((await response.json()) as Payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "신청 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [status, debouncedQ, page, pageSize]);

  useEffect(() => {
    // 필터가 바뀔 때마다 서버에서 다시 읽는다(응답이 오면 상태를 채운다).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // 단계·메모·선정 주차 변경 — 응답 후 row 만 갈아끼움. 단계가 바뀌면 카운트는 reload 로 보정.
  async function updateApplication(id: string, payload: UpdatePayload) {
    try {
      const response = await fetch(`${apiBase()}/ops/experience-applications/${id}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (payload.status !== undefined) {
        await load();
        return;
      }
      setData((prev) =>
        prev
          ? { ...prev, applications: prev.applications.map((a) => (a.id === id ? { ...a, ...payload } : a)) }
          : prev
      );
    } catch {
      await load();
    }
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageButtons = useMemo(() => {
    const maxVisible = 7;
    const pages: number[] = [];
    const start = Math.max(1, page - 3);
    const end = Math.min(totalPages, start + maxVisible - 1);
    const normalizedStart = Math.max(1, end - maxVisible + 1);
    for (let i = normalizedStart; i <= end; i += 1) pages.push(i);
    return pages;
  }, [page, totalPages]);

  const anyFilterActive = Boolean(status || q.trim());

  return (
    <section className="ops-content-section">
      <header>
        <h1>자소서 경험 발굴 캠페인</h1>
        <p>
          &ldquo;내 경험이 스펙이 되는 순간&rdquo;(/experience) 신청자입니다. 매주 월요일 검토, 화요일 2명 선정 후 개별 연락,
          수~금 상담을 진행하세요. 선정·연락은 자동 발송되지 않으니 단계 변경 후 직접 연락해 주세요.
        </p>
      </header>

      {data ? (
        <article className="ops-card">
          <h2 className="ops-section-title">전체 신청 현황</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
              marginTop: 12
            }}
          >
            <div style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)" }}>
              <div className="ops-row-sub" style={{ marginBottom: 4 }}>총 신청</div>
              <div className="ops-row-strong" style={{ fontSize: 20 }}>{data.totalAll.toLocaleString()}명</div>
            </div>
            {(Object.keys(STATUS_LABEL) as ExpStatus[]).map((s) => (
              <div
                key={s}
                style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)" }}
              >
                <div className="ops-row-sub" style={{ marginBottom: 4 }}>{STATUS_LABEL[s]}</div>
                <div className="ops-row-strong" style={{ fontSize: 20 }}>{(data.statusCounts[s] ?? 0).toLocaleString()}명</div>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>신청자</h2>
        </div>

        <div className="ops-partner-filters ops-partner-filters--multi">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="이름 / 이메일 / 지원 직무 검색"
            className="ops-partner-filter-search"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ExpStatus | "");
              setPage(1);
            }}
            aria-label="단계 필터"
          >
            <option value="">전체 단계</option>
            {(Object.keys(STATUS_LABEL) as ExpStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <select
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(Number(e.target.value) as 20 | 40 | 100);
              setPage(1);
            }}
            aria-label="페이지 크기"
          >
            <option value="20">20개</option>
            <option value="40">40개</option>
            <option value="100">100개</option>
          </select>
          {anyFilterActive ? (
            <button
              type="button"
              className="ops-partner-filter-reset"
              onClick={() => {
                setQ("");
                setStatus("");
                setPage(1);
              }}
            >
              필터 초기화
            </button>
          ) : null}
        </div>

        {error ? <p className="ops-form-error">{error}</p> : null}

        <div className="ops-partner-table-wrap">
          <table className="ops-partner-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>지원 직무</th>
                <th>국적</th>
                <th>이메일</th>
                <th>상담 방식</th>
                <th>사례 공개</th>
                <th>유입</th>
                <th>단계</th>
                <th>선정 주차</th>
                <th>신청일</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="ops-table-empty">목록을 불러오는 중입니다...</td>
                </tr>
              ) : !data || data.applications.length === 0 ? (
                <tr>
                  <td colSpan={11} className="ops-table-empty">조건에 맞는 신청자가 없습니다.</td>
                </tr>
              ) : (
                data.applications.map((a) => (
                  <tr key={a.id}>
                    <td className="ops-row-strong">{a.name}</td>
                    <td>{a.desiredRole}</td>
                    <td>{a.nationality ?? "-"}</td>
                    <td className="ops-row-sub">
                      <a href={`mailto:${a.email}`} style={{ color: "var(--accent-ink)" }}>{a.email}</a>
                    </td>
                    <td>{METHOD_LABEL[a.consultMethod] ?? a.consultMethod}</td>
                    <td>{a.consentCaseStudy ? "동의" : "-"}</td>
                    <td className="ops-row-sub">{a.utmSource ?? (a.referrer ? "referrer" : "-")}</td>
                    <td>
                      <StatusSelect
                        value={a.status}
                        onChange={(next) => {
                          // 선정으로 바꿀 때 선정 주차가 비어 있으면 이번 주로 같이 기록.
                          const payload: UpdatePayload = { status: next };
                          if (next === "SELECTED" && !a.selectedWeek) payload.selectedWeek = currentIsoWeek();
                          void updateApplication(a.id, payload);
                        }}
                      />
                    </td>
                    <td className="ops-row-sub">{a.selectedWeek ?? "-"}</td>
                    <td className="ops-row-sub">{formatDate(a.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedId(a.id)}
                        className="ops-partner-filter-reset"
                        style={{ padding: "8px 14px", fontSize: 13, height: 36, minWidth: 64 }}
                      >
                        보기
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="ops-pagination">
          <span>총 {total}개 · {page}/{totalPages} 페이지</span>
          <div className="ops-pagination-numbers">
            {pageButtons.map((num) => (
              <button
                key={num}
                type="button"
                className={num === page ? "is-active" : ""}
                onClick={() => setPage(num)}
              >
                {num}
              </button>
            ))}
          </div>
          <span />
        </div>
      </article>

      {selectedApplication ? (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedId(null)}
          onUpdate={(payload) => updateApplication(selectedApplication.id, payload)}
        />
      ) : null}
    </section>
  );
}

function StatusSelect({ value, onChange }: { value: ExpStatus; onChange: (next: ExpStatus) => void }) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <select
        value={value}
        onChange={(e) => {
          const next = e.target.value as ExpStatus;
          if (next !== value) onChange(next);
        }}
        aria-label="단계 변경"
        className={STATUS_PILL_CLASS[value]}
        style={{
          padding: "8px 30px 8px 14px",
          fontSize: 13,
          height: 36,
          minWidth: 110,
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          backgroundImage: "none"
        }}
      >
        {(Object.keys(STATUS_LABEL) as ExpStatus[]).map((s) => (
          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
        ))}
      </select>
      <CaretDown
        weight="bold"
        aria-hidden
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          width: 12,
          height: 12,
          pointerEvents: "none",
          color: "currentColor",
          opacity: 0.7
        }}
      />
    </div>
  );
}

// 상세 보기 모달 — 경험 소개·기존 자소서 원문, 동의·유입 정보, 단계/선정 주차/메모 편집.
function ApplicationDetailModal({
  application,
  onClose,
  onUpdate
}: {
  application: Application;
  onClose: () => void;
  onUpdate: (payload: UpdatePayload) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const utm = [
    ["source", application.utmSource],
    ["medium", application.utmMedium],
    ["campaign", application.utmCampaign],
    ["content", application.utmContent],
    ["term", application.utmTerm]
  ].filter(([, v]) => v);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(2px)"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: "90vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 48px -12px rgba(15, 23, 42, 0.25)",
          padding: 24
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div>
            <p className="ops-row-sub" style={{ fontSize: 11, fontWeight: 600 }}>자소서 경험 발굴 캠페인 — 신청 상세</p>
            <h3 style={{ margin: 0, marginTop: 4, fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>{application.name}</h3>
            <p className="ops-row-sub" style={{ marginTop: 2, fontSize: 12 }}>
              <a href={`mailto:${application.email}`} style={{ color: "var(--accent-ink)" }}>{application.email}</a>
              {application.phone ? ` · ${application.phone}` : ""}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusSelect
              value={application.status}
              onChange={(next) => {
                const payload: UpdatePayload = { status: next };
                if (next === "SELECTED" && !application.selectedWeek) payload.selectedWeek = currentIsoWeek();
                onUpdate(payload);
              }}
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              style={{
                width: 36,
                height: 36,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: "#fff",
                cursor: "pointer"
              }}
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            padding: 12,
            background: "var(--surface-2)",
            borderRadius: 10,
            marginBottom: 20
          }}
        >
          <DetailMeta label="지원 직무" value={application.desiredRole} />
          <DetailMeta label="국적" value={application.nationality || "-"} />
          <DetailMeta label="상담 방식" value={METHOD_LABEL[application.consultMethod] ?? application.consultMethod} />
          <DetailMeta label="사례 공개 동의" value={application.consentCaseStudy ? "동의 (익명 Before/After)" : "동의하지 않음"} />
          <DetailMeta label="개인정보 동의" value={`${formatDate(application.consentPrivacyAt)} · ${application.consentVersion}`} />
          <DetailMeta label="화면 언어" value={application.locale} />
          <DetailMeta label="회원 연결" value={application.userId ? "로그인 상태로 신청" : "비회원"} />
          <DetailMeta label="신청일" value={formatDate(application.createdAt)} />
        </div>

        <DetailBlock title="첨부 파일">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13.5 }}>
            <FileLink label="이력서" url={application.resumeUrl} fileName={application.resumeFileName} />
            <FileLink label="자기소개서" url={application.coverLetterUrl} fileName={application.coverLetterFileName} />
          </div>
        </DetailBlock>

        {/* 예전(v1) 신청 — 텍스트로 받던 경험 소개·자기소개서가 있을 때만 */}
        {application.experience ? (
          <DetailBlock title="경험 소개 (이전 양식)">
            <p style={{ whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink)", margin: 0 }}>
              {application.experience}
            </p>
          </DetailBlock>
        ) : null}

        {application.coverLetter ? (
          <DetailBlock title="기존 자기소개서 (이전 양식)">
            <p style={{ whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink)", margin: 0 }}>
              {application.coverLetter}
            </p>
          </DetailBlock>
        ) : null}

        <DetailBlock title="유입 경로">
          <p style={{ fontSize: 13, color: "var(--ink)", margin: 0, wordBreak: "break-all" }}>
            {utm.length ? utm.map(([k, v]) => `${k}=${v}`).join(" · ") : "UTM 없음"}
            {application.referrer ? ` · referrer: ${application.referrer}` : ""}
          </p>
        </DetailBlock>

        <DetailBlock title="선정 주차 (예: 2026-W43)">
          {/* 저장된 값이 바뀌면 key 로 편집기를 새로 만든다(effect 동기화 대신). */}
          <WeekEditor key={application.selectedWeek ?? ""} value={application.selectedWeek ?? ""} onSave={(w) => onUpdate({ selectedWeek: w || null })} />
        </DetailBlock>

        <DetailBlock title="운영 메모 (운영자만 보임)">
          <NoteEditor key={application.opsNote ?? ""} value={application.opsNote ?? ""} onSave={(memo) => onUpdate({ opsNote: memo || null })} />
        </DetailBlock>
      </div>
    </div>
  );
}

function FileLink({ label, url, fileName }: { label: string; url: string | null; fileName: string | null }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "baseline", minWidth: 0 }}>
      <span style={{ flexShrink: 0, color: "var(--ink-soft)", width: 72 }}>{label}</span>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" download={fileName ?? undefined} style={{ color: "var(--accent-ink)", fontWeight: 600, wordBreak: "break-all" }}>
          {fileName || "파일 받기"}
        </a>
      ) : (
        <span style={{ color: "var(--ink)" }}>-</span>
      )}
    </div>
  );
}

function DetailMeta({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="ops-row-sub" style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 13, color: "var(--ink)", margin: 0 }}>{value ?? "-"}</p>
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p className="ops-row-sub" style={{ fontWeight: 600, marginBottom: 6, fontSize: 12 }}>{title}</p>
      {children}
    </div>
  );
}

function WeekEditor({ value, onSave }: { value: string; onSave: (week: string) => void }) {
  const [text, setText] = useState(value);
  const valid = text.trim() === "" || /^\d{4}-W\d{2}$/.test(text.trim());
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={currentIsoWeek()}
        style={{ height: 36, padding: "0 10px", borderRadius: 6, border: "1px solid var(--line-strong)", fontSize: 13, width: 140 }}
      />
      <button
        type="button"
        onClick={() => setText(currentIsoWeek())}
        className="ops-partner-filter-reset"
        style={{ padding: "8px 12px", fontSize: 13, height: 36 }}
      >
        이번 주
      </button>
      <button
        type="button"
        onClick={() => onSave(text.trim())}
        disabled={!valid || text.trim() === value}
        className="ops-partner-filter-reset"
        style={{ padding: "8px 16px", fontSize: 13, height: 36, minWidth: 80 }}
      >
        저장
      </button>
      {!valid ? <span style={{ fontSize: 11, color: "var(--danger)" }}>YYYY-Www 형식</span> : null}
    </div>
  );
}

// 메모 인라인 편집 — 명시적 저장.
function NoteEditor({ value, onSave }: { value: string; onSave: (memo: string) => void }) {
  const [text, setText] = useState(value);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (text === value) return;
    onSave(text);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="운영 메모 (상담 일정·연락 기록 등)"
        style={{
          width: "100%",
          minHeight: 80,
          padding: 8,
          borderRadius: 6,
          border: "1px solid var(--line-strong)",
          fontSize: 13,
          fontFamily: "inherit"
        }}
      />
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={text === value}
          className="ops-partner-filter-reset"
          style={{ padding: "8px 16px", fontSize: 13, height: 36, minWidth: 80 }}
        >
          저장
        </button>
        {saved ? <span style={{ fontSize: 11, color: "var(--accent-ink)" }}>저장됨</span> : null}
      </div>
    </div>
  );
}
