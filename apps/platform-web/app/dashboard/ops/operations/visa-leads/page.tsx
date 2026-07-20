"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";

// ---------------------------------------------------------------------------
// /dashboard/ops/operations/visa-leads — Visa 이벤트 funnel 의 익명 리드를
// 검토하는 페이지. saju-leads 와 같은 구조(필터 + 페이지네이션 + 단계 카운트
// + funnel 통계) 이지만 visa 맞춤 컬럼.
// ---------------------------------------------------------------------------

type Lead = {
  id: string;
  name: string | null;
  shareSlug: string | null;
  contact: string | null;
  contactType: string | null;
  nationality: string | null;
  currentVisa: string | null;
  expectedJoinDate: string | null;
  graduationDate: string | null;
  university: string | null;
  major: string | null;
  preferredJobRole: string | null;
  koreanLevel: string | null;
  englishLevel: string | null;
  poolStage: string;
  tags: string[];
  consentCareer: boolean;
  consentRecommend: boolean;
  consentContact: boolean;
  userId: string | null;
  locale: string;
  createdAt: string;
  educationLevel: string | null;
  majorCategory: string | null;
  workYears: number | null;
  targetRole: string | null;
};

type LeadsPayload = {
  ok: boolean;
  total: number;
  take: number;
  skip: number;
  stageCounts: Record<string, number>;
  funnel: {
    checksTotal: number;
    leadsTotal: number;
    leadsConverted: number;
  };
  leads: Lead[];
};

// 결과 본 사람 raw pool — funnel form 까지 가지 않은 익명 진단 데이터.
type VisaCheck = {
  id: string;
  name: string | null;
  nationality: string;
  currentVisa: string | null;
  educationLevel: string;
  majorCategory: string | null;
  koreanLevel: string;
  workYears: number;
  targetRole: string | null;
  inKorea: boolean | null;
  hasJobOffer: boolean | null;
  graduationStatus: string | null;
  recommendedPositionCount: number;
  shareSlug: string;
  userId: string | null;
  locale: string;
  createdAt: string;
  claimedAt: string | null;
  hasLead: boolean;
};

type ChecksPayload = {
  ok: boolean;
  total: number;
  take: number;
  skip: number;
  claimedTotal: number;
  checks: VisaCheck[];
};

const GRAD_LABEL: Record<string, string> = {
  not_applicable: "해당 없음",
  completed: "졸업 완료",
  within_6mo: "6개월 이내",
  within_1y: "1년 이내",
  later: "그 이후"
};

const STAGE_LABEL: Record<string, string> = {
  PROFILE: "Profile Pool",
  VERIFIED: "Verified Pool",
  RECOMMENDABLE: "추천 가능 Pool"
};

const STAGE_SHORT_LABEL: Record<string, string> = {
  PROFILE: "Profile",
  VERIFIED: "Verified",
  RECOMMENDABLE: "추천 가능"
};

const LEVEL_LABEL: Record<string, string> = {
  NONE: "없음",
  BEGINNER: "초급",
  INTERMEDIATE: "중급",
  ADVANCED: "고급",
  NATIVE: "원어민"
};

const EDU_LABEL: Record<string, string> = {
  HIGH_SCHOOL: "고졸",
  BACHELOR: "학사",
  MASTER: "석사",
  PHD: "박사"
};

function localeLabel(locale: string | null | undefined) {
  if (!locale) return "-";
  return locale.toUpperCase();
}

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 운영자가 한 번 더 클릭하지 않고 바로 연락할 수 있게 채널별 deep link.
// 이메일은 mailto, 전화는 tel, 그 외는 평문 링크.
function contactHref(contactType: string | null, contact: string): string | null {
  const raw = contact.trim();
  switch (contactType) {
    case "email":
      return `mailto:${raw}`;
    case "phone":
      return `tel:${raw.replace(/[^+\d]/g, "")}`;
    case "messenger":
      return null;
    default:
      return raw.includes("@") ? `mailto:${raw}` : null;
  }
}

export default function VisaLeadsPage() {
  const [data, setData] = useState<LeadsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poolStage, setPoolStage] = useState("");
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
      const url = new URL(`${apiBase()}/ops/visa/leads`);
      if (poolStage) url.searchParams.set("poolStage", poolStage);
      if (debouncedQ) url.searchParams.set("q", debouncedQ);
      url.searchParams.set("take", String(pageSize));
      url.searchParams.set("skip", String((page - 1) * pageSize));
      const response = await fetch(url.toString(), { headers: authHeaders(), cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as LeadsPayload;
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "후보 Pool을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [poolStage, debouncedQ, page, pageSize]);

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

  const anyFilterActive = Boolean(poolStage || q.trim());

  return (
    <section className="ops-content-section">
      <header>
        <h1>비자 이벤트</h1>
        <p>
          비자 진단 이벤트의 회원가입 퍼널에서 모인 익명 리드를 관리합니다. 국적·비자·희망 직무 태그로 필터링하고,
          연락 가능한 후보에게 직접 추천 회사를 매칭하세요.
        </p>
      </header>

      {data?.funnel ? (
        <article className="ops-card">
          <h2 className="ops-section-title">비자 이벤트</h2>
          <p className="ops-card-subtle" style={{ margin: "4px 0 12px" }}>
            비자 진단 받음 → 추가 정보 입력 → 가입 전환. 비-인증 사용자는 익명 ipHash 로 카운트됩니다.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12
            }}
          >
            <div style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)" }}>
              <div className="ops-row-sub" style={{ marginBottom: 4 }}>비자 진단 받은 사람</div>
              <div className="ops-row-strong" style={{ fontSize: 20 }}>
                {data.funnel.checksTotal.toLocaleString()}명
              </div>
            </div>
            <div style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)" }}>
              <div className="ops-row-sub" style={{ marginBottom: 4 }}>추가 정보 입력</div>
              <div className="ops-row-strong" style={{ fontSize: 20 }}>
                {data.funnel.leadsTotal.toLocaleString()}명
              </div>
              <div className="ops-row-sub" style={{ marginTop: 4, fontSize: 11 }}>
                진단 받은 사람 중{" "}
                {data.funnel.checksTotal > 0
                  ? Math.round((data.funnel.leadsTotal / data.funnel.checksTotal) * 1000) / 10
                  : 0}
                %
              </div>
            </div>
            <div style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)" }}>
              <div className="ops-row-sub" style={{ marginBottom: 4 }}>가입 전환</div>
              <div className="ops-row-strong" style={{ fontSize: 20 }}>
                {data.funnel.leadsConverted.toLocaleString()}명
              </div>
              <div className="ops-row-sub" style={{ marginTop: 4, fontSize: 11 }}>
                추가 입력 중{" "}
                {data.funnel.leadsTotal > 0
                  ? Math.round((data.funnel.leadsConverted / data.funnel.leadsTotal) * 1000) / 10
                  : 0}
                %
              </div>
            </div>
          </div>
        </article>
      ) : null}

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>후보 Pool 목록</h2>
          {data ? (
            <div className="ops-tag-row">
              {Object.entries(data.stageCounts).map(([stage, count]) => (
                <span key={stage} className="ops-pill ops-pill-violet">
                  {STAGE_LABEL[stage] ?? stage}: {count}
                </span>
              ))}
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
            placeholder="이름 / 대학 / 전공 / 연락처 검색"
            className="ops-partner-filter-search"
          />
          <select
            value={poolStage}
            onChange={(e) => {
              setPoolStage(e.target.value);
              setPage(1);
            }}
            aria-label="Pool 단계 필터"
          >
            <option value="">전체 Pool 단계</option>
            <option value="PROFILE">Profile Pool</option>
            <option value="VERIFIED">Verified Pool</option>
            <option value="RECOMMENDABLE">추천 가능 Pool</option>
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
                setPoolStage("");
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
                <th>국적</th>
                <th>학력</th>
                <th>대학 / 전공</th>
                <th>현재 비자</th>
                <th>한국어</th>
                <th>희망 직무</th>
                <th>희망 입사</th>
                <th>졸업</th>
                <th>연락처</th>
                <th>연락동의</th>
                <th>Pool 단계</th>
                <th>응답 언어</th>
                <th>등록일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} className="ops-table-empty">목록을 불러오는 중입니다...</td>
                </tr>
              ) : !data || data.leads.length === 0 ? (
                <tr>
                  <td colSpan={14} className="ops-table-empty">조건에 맞는 후보가 없습니다.</td>
                </tr>
              ) : data.leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="ops-row-strong">{lead.name ?? "-"}</td>
                  <td>{lead.nationality ?? "-"}</td>
                  <td>{lead.educationLevel ? EDU_LABEL[lead.educationLevel] ?? lead.educationLevel : "-"}</td>
                  <td className="ops-row-sub">
                    {[lead.university, lead.major].filter(Boolean).join(" · ") || "-"}
                  </td>
                  <td>{lead.currentVisa ?? "-"}</td>
                  <td>{lead.koreanLevel ? LEVEL_LABEL[lead.koreanLevel] ?? lead.koreanLevel : "-"}</td>
                  <td>{lead.preferredJobRole ?? lead.targetRole ?? "-"}</td>
                  <td className="ops-row-sub">{lead.expectedJoinDate ?? "-"}</td>
                  <td className="ops-row-sub">{lead.graduationDate ?? "-"}</td>
                  <td className="ops-row-sub">
                    {lead.contact ? (
                      (() => {
                        const href = contactHref(lead.contactType, lead.contact);
                        const prefix = lead.contactType ? `[${lead.contactType}] ` : "";
                        return href ? (
                          <a
                            href={href}
                            rel="noopener noreferrer"
                            style={{ color: "var(--accent-ink)" }}
                          >
                            {prefix}
                            {lead.contact}
                          </a>
                        ) : (
                          <span>
                            {prefix}
                            {lead.contact}
                          </span>
                        );
                      })()
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {lead.consentContact ? (
                      <span className="ops-pill ops-pill-blue">동의</span>
                    ) : (
                      <span className="ops-row-sub">-</span>
                    )}
                  </td>
                  <td>
                    <span className="ops-pill ops-pill-violet">
                      {STAGE_SHORT_LABEL[lead.poolStage] ?? lead.poolStage}
                    </span>
                  </td>
                  <td>{localeLabel(lead.locale)}</td>
                  <td className="ops-row-sub">{new Date(lead.createdAt).toLocaleDateString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ops-pagination">
          <span>
            총 {total}개 · {page}/{totalPages} 페이지
          </span>
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

      {/* 결과 본 사람 (Raw Pool) — funnel form 까지 가지 않은 익명 진단 데이터.
          Lead 화면 위에서 보이는 "checksTotal" 의 row 단위 조회. 비회원 데이터
          포함. 별도 카드/필터로 두어 Lead 표와 동시 비교 가능. */}
      <VisaChecksSection />
    </section>
  );
}

// 결과 본 사람 raw pool 카드. 자체 fetch + 페이지네이션 + 필터 갖는 독립 섹션.
function VisaChecksSection() {
  const [data, setData] = useState<ChecksPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [gradStatus, setGradStatus] = useState("");
  const [claimed, setClaimed] = useState<"" | "claimed" | "unclaimed">("");
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
      const url = new URL(`${apiBase()}/ops/visa/checks`);
      if (debouncedQ) url.searchParams.set("q", debouncedQ);
      if (gradStatus) url.searchParams.set("graduationStatus", gradStatus);
      if (claimed) url.searchParams.set("claimed", claimed);
      url.searchParams.set("take", String(pageSize));
      url.searchParams.set("skip", String((page - 1) * pageSize));
      const response = await fetch(url.toString(), { headers: authHeaders(), cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as ChecksPayload;
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "결과 본 사람 Pool 을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, gradStatus, claimed, page, pageSize]);

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

  const anyFilterActive = Boolean(gradStatus || claimed || q.trim());

  return (
    <article className="ops-partner-list-card">
      <div className="ops-partner-list-top">
        <h2>결과 본 사람 (Raw Pool)</h2>
        {data ? (
          <div className="ops-tag-row">
            <span className="ops-pill ops-pill-blue">전체: {data.total}</span>
            <span className="ops-pill ops-pill-blue">가입 전환: {data.claimedTotal}</span>
          </div>
        ) : null}
      </div>
      <p className="ops-card-subtle" style={{ margin: "0 0 12px" }}>
        Aply 결과 페이지를 본 모든 사람 (funnel form 안 채운 익명 포함). 결과 슬러그 + 입력값 + 추천 포지션 수 단위로 정렬.
      </p>

      <div className="ops-partner-filters ops-partner-filters--multi">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="이름 / 국적 / 희망 직무 검색"
          className="ops-partner-filter-search"
        />
        <select
          value={gradStatus}
          onChange={(e) => {
            setGradStatus(e.target.value);
            setPage(1);
          }}
          aria-label="졸업 상태 필터"
        >
          <option value="">전체 졸업 상태</option>
          <option value="not_applicable">해당 없음</option>
          <option value="completed">졸업 완료</option>
          <option value="within_6mo">6개월 이내</option>
          <option value="within_1y">1년 이내</option>
          <option value="later">그 이후</option>
        </select>
        <select
          value={claimed}
          onChange={(e) => {
            setClaimed(e.target.value as "" | "claimed" | "unclaimed");
            setPage(1);
          }}
          aria-label="가입 전환 필터"
        >
          <option value="">전체 가입 전환</option>
          <option value="claimed">가입 완료</option>
          <option value="unclaimed">미가입</option>
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
              setGradStatus("");
              setClaimed("");
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
              <th>국적</th>
              <th>학력</th>
              <th>현재 비자</th>
              <th>한국어</th>
              <th>경력</th>
              <th>희망 직무</th>
              <th>한국 거주</th>
              <th>채용 제안</th>
              <th>졸업 상태</th>
              <th>추천 공고</th>
              <th>전환</th>
              <th>응답 언어</th>
              <th>등록일</th>
              <th>결과</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={15} className="ops-table-empty">목록을 불러오는 중입니다...</td>
              </tr>
            ) : !data || data.checks.length === 0 ? (
              <tr>
                <td colSpan={15} className="ops-table-empty">조건에 맞는 결과가 없습니다.</td>
              </tr>
            ) : data.checks.map((c) => (
              <tr key={c.id}>
                <td className="ops-row-strong">{c.name ?? "익명"}</td>
                <td>{c.nationality}</td>
                <td>{EDU_LABEL[c.educationLevel] ?? c.educationLevel}</td>
                <td>{c.currentVisa ?? "-"}</td>
                <td>{LEVEL_LABEL[c.koreanLevel] ?? c.koreanLevel}</td>
                <td className="ops-row-sub">{c.workYears ? `${c.workYears}년` : "-"}</td>
                <td>{c.targetRole ?? "-"}</td>
                <td>{c.inKorea === null ? "-" : c.inKorea ? "예" : "아니오"}</td>
                <td>{c.hasJobOffer === null ? "-" : c.hasJobOffer ? "예" : "아니오"}</td>
                <td>{c.graduationStatus ? GRAD_LABEL[c.graduationStatus] ?? c.graduationStatus : "-"}</td>
                <td className="ops-row-sub">{c.recommendedPositionCount}개</td>
                <td>
                  {c.userId ? (
                    <span className="ops-pill ops-pill-blue">가입</span>
                  ) : c.hasLead ? (
                    <span className="ops-pill ops-pill-violet">Lead</span>
                  ) : (
                    <span className="ops-row-sub">-</span>
                  )}
                </td>
                <td>{localeLabel(c.locale)}</td>
                <td className="ops-row-sub">{new Date(c.createdAt).toLocaleDateString("ko-KR")}</td>
                <td>
                  <a
                    href={`/events/visa/result/${c.shareSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--accent-ink)", fontSize: 12 }}
                  >
                    열기 ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ops-pagination">
        <span>
          총 {total}개 · {page}/{totalPages} 페이지
        </span>
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
  );
}
