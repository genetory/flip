"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";

// 한패스 × Aply 설문 이벤트 응답 관리. /ops/hanpass/survey 와 1:1.
// createdAt 오름차순(먼저 응답한 순) — 상단 행이 선착순 1순위.

type SurveyResponse = {
  rank: number;
  id: string;
  name: string;
  phone: string;
  email: string;
  jobIntent: string;
  availableFrom: string;
  jobFields: string[];
  jobFieldOther: string | null;
  visaType: string;
  wantsConsulting: string;
  consultLanguages: string[];
  privacyConsent: boolean;
  locale: string;
  createdAt: string;
  updatedAt: string;
};

type SurveyPayload = {
  ok: boolean;
  total: number;
  take: number;
  skip: number;
  summary: { total: number; applicants: number; infoOnly: number; unsure: number };
  responses: SurveyResponse[];
};

const JOB_INTENT_LABEL: Record<string, string> = {
  active_seeking: "적극 구직",
  open_to_offers: "기회되면 이직",
  not_seeking: "의향 없음",
  unsure: "미정"
};

const AVAILABLE_FROM_LABEL: Record<string, string> = {
  immediately: "즉시",
  within_1m: "1개월 내",
  within_3m: "3개월 내",
  undecided: "미정",
  not_available: "불가"
};

const JOB_FIELD_LABEL: Record<string, string> = {
  manufacturing: "제조/생산",
  logistics: "물류/창고",
  service: "서비스/매장",
  office: "사무/관리",
  translation: "통번역",
  it: "IT/개발",
  design_marketing: "디자인/마케팅",
  research: "연구/전문직",
  other: "기타"
};

const VISA_LABEL: Record<string, string> = {
  "D-2": "D-2 유학",
  "D-4": "D-4 어학연수",
  "D-10": "D-10 구직",
  "E-7": "E-7 특정활동",
  "F-2": "F-2 거주",
  "F-4": "F-4 재외동포",
  "F-5": "F-5 영주",
  "F-6": "F-6 결혼이민",
  other: "기타",
  unsure: "모름"
};

const WANTS_LABEL: Record<string, string> = {
  yes: "신청",
  info_only: "정보만",
  unsure: "미정"
};

const LANGUAGE_LABEL: Record<string, string> = { ko: "한국어", en: "영어" };

function label(map: Record<string, string>, code: string | null | undefined) {
  if (!code) return "-";
  return map[code] ?? code;
}

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function HanpassSurveyPage() {
  const [data, setData] = useState<SurveyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wantsConsulting, setWantsConsulting] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 40 | 100>(20);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${apiBase()}/ops/hanpass/survey`);
      if (wantsConsulting) url.searchParams.set("wantsConsulting", wantsConsulting);
      if (debouncedQ) url.searchParams.set("q", debouncedQ);
      url.searchParams.set("take", String(pageSize));
      url.searchParams.set("skip", String((page - 1) * pageSize));
      const response = await fetch(url.toString(), { headers: authHeaders(), cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as SurveyPayload;
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "설문 응답을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [wantsConsulting, debouncedQ, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const anyFilterActive = Boolean(wantsConsulting || q.trim());

  return (
    <section className="ops-content-section">
      <header>
        <h1>한패스 × Aply 설문 이벤트</h1>
        <p>
          한패스 이용자 취업 지원 설문 응답을 관리합니다. 먼저 응답한 순서(선착순)로 정렬되며, 첨삭 신청자 중 상단
          10명이 우선 안내 대상입니다. 첨삭 신청 여부로 필터링해 명단을 추려보세요.
        </p>
      </header>

      {data?.summary ? (
        <article className="ops-card">
          <h2 className="ops-section-title">응답 요약</h2>
          <p className="ops-card-subtle" style={{ margin: "4px 0 12px" }}>
            같은 전화번호로 다시 응답하면 기존 응답이 갱신됩니다(1인 1행, 최초 응답 시각 유지).
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <div style={{ padding: "12px 14px", border: "1px solid #eef0f3", borderRadius: 10, background: "#fcfcfd" }}>
              <div className="ops-row-sub" style={{ marginBottom: 4 }}>전체 응답</div>
              <div className="ops-row-strong" style={{ fontSize: 20 }}>{data.summary.total.toLocaleString()}명</div>
            </div>
            <div style={{ padding: "12px 14px", border: "1px solid #d8e2ff", borderRadius: 10, background: "#f5f8ff" }}>
              <div className="ops-row-sub" style={{ marginBottom: 4 }}>첨삭·컨설팅 신청</div>
              <div className="ops-row-strong" style={{ fontSize: 20, color: "#1d4ed8" }}>
                {data.summary.applicants.toLocaleString()}명
              </div>
              <div className="ops-row-sub" style={{ marginTop: 4, fontSize: 11 }}>상단 10명이 우선 대상</div>
            </div>
            <div style={{ padding: "12px 14px", border: "1px solid #eef0f3", borderRadius: 10, background: "#fcfcfd" }}>
              <div className="ops-row-sub" style={{ marginBottom: 4 }}>정보만 희망</div>
              <div className="ops-row-strong" style={{ fontSize: 20 }}>{data.summary.infoOnly.toLocaleString()}명</div>
            </div>
            <div style={{ padding: "12px 14px", border: "1px solid #eef0f3", borderRadius: 10, background: "#fcfcfd" }}>
              <div className="ops-row-sub" style={{ marginBottom: 4 }}>미정</div>
              <div className="ops-row-strong" style={{ fontSize: 20 }}>{data.summary.unsure.toLocaleString()}명</div>
            </div>
          </div>
        </article>
      ) : null}

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>설문 응답 목록</h2>
          {data ? (
            <div className="ops-tag-row">
              <span className="ops-pill ops-pill-blue">필터 결과: {data.total}</span>
            </div>
          ) : null}
        </div>

        <div className="ops-partner-filters ops-partner-filters--multi">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="이름 / 전화번호 / 이메일 검색"
            className="ops-partner-filter-search"
          />
          <select
            value={wantsConsulting}
            onChange={(e) => {
              setWantsConsulting(e.target.value);
              setPage(1);
            }}
            aria-label="첨삭 신청 여부 필터"
          >
            <option value="">전체 첨삭 신청 여부</option>
            <option value="yes">신청함</option>
            <option value="info_only">정보만</option>
            <option value="unsure">미정</option>
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
                setWantsConsulting("");
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
                <th>순번</th>
                <th>이름</th>
                <th>연락처</th>
                <th>이메일</th>
                <th>구직 의향</th>
                <th>근무 가능</th>
                <th>희망 분야</th>
                <th>비자</th>
                <th>첨삭 신청</th>
                <th>상담 언어</th>
                <th>응답일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="ops-table-empty">목록을 불러오는 중입니다...</td>
                </tr>
              ) : !data || data.responses.length === 0 ? (
                <tr>
                  <td colSpan={11} className="ops-table-empty">조건에 맞는 응답이 없습니다.</td>
                </tr>
              ) : (
                data.responses.map((r) => {
                  const fields = r.jobFields.map((c) => label(JOB_FIELD_LABEL, c));
                  if (r.jobFieldOther && r.jobFieldOther.trim()) fields.push(`기타: ${r.jobFieldOther.trim()}`);
                  return (
                    <tr key={r.id}>
                      <td className="ops-row-sub">{r.rank}</td>
                      <td className="ops-row-strong">{r.name}</td>
                      <td className="ops-row-sub">
                        <a href={`tel:${r.phone.replace(/[^+\d]/g, "")}`} style={{ color: "#1d4ed8" }}>{r.phone}</a>
                      </td>
                      <td className="ops-row-sub">
                        <a href={`mailto:${r.email}`} style={{ color: "#1d4ed8" }}>{r.email}</a>
                      </td>
                      <td>{label(JOB_INTENT_LABEL, r.jobIntent)}</td>
                      <td>{label(AVAILABLE_FROM_LABEL, r.availableFrom)}</td>
                      <td className="ops-row-sub">{fields.join(", ") || "-"}</td>
                      <td>{label(VISA_LABEL, r.visaType)}</td>
                      <td>
                        {r.wantsConsulting === "yes" ? (
                          <span className="ops-pill ops-pill-blue">{WANTS_LABEL.yes}</span>
                        ) : (
                          <span className="ops-row-sub">{label(WANTS_LABEL, r.wantsConsulting)}</span>
                        )}
                      </td>
                      <td className="ops-row-sub">
                        {r.consultLanguages.map((c) => label(LANGUAGE_LABEL, c)).join(", ") || "-"}
                      </td>
                      <td className="ops-row-sub">{new Date(r.createdAt).toLocaleDateString("ko-KR")}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ops-pagination">
          <span>
            총 {total}개 · {page}/{totalPages} 페이지
          </span>
          <div className="ops-pagination-numbers">
            {pageButtons.map((num) => (
              <button key={num} type="button" className={num === page ? "is-active" : ""} onClick={() => setPage(num)}>
                {num}
              </button>
            ))}
          </div>
          <span />
        </div>
      </article>
    </section>
  );
}
