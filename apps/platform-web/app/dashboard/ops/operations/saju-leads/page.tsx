"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";
import { translateRole } from "../../../../../lib/saju-taxonomy";

type Lead = {
  id: string;
  name: string | null;
  shareSlug: string | null;
  nationality: string | null;
  school: string | null;
  major: string | null;
  visaType: string | null;
  koreanLevel: string | null;
  englishLevel: string | null;
  preferredJobRole: string | null;
  workType: string | null;
  contact: string | null;
  contactType: string | null;
  hasResume: boolean | null;
  recommendedRoles: string[];
  improvements: string[];
  recommendStatus: string | null;
  poolStage: string;
  tags: string[];
  consentCareer: boolean;
  consentRecommend: boolean;
  consentContact: boolean;
  userId: string | null;
  locale: string;
  createdAt: string;
  birthDate: string | null;
  gender: string | null;
};

type LeadsPayload = {
  ok: boolean;
  total: number;
  take: number;
  skip: number;
  stageCounts: Record<string, number>;
  funnel: {
    predictionsTotal: number;
    leadsTotal: number;
    leadsConverted: number;
  };
  leads: Lead[];
};

// 결과 본 사람 raw pool — funnel form 까지 가지 않은 익명 사주 예측 데이터.
type SajuPredictionRow = {
  id: string;
  name: string;
  gender: string;
  birthDate: string;
  birthTime: string | null;
  calendarType: string;
  recommendedRoleNames: string[];
  recommendedPositionCount: number;
  shareSlug: string;
  userId: string | null;
  locale: string;
  createdAt: string;
  claimedAt: string | null;
  hasLead: boolean;
};

type PredictionsPayload = {
  ok: boolean;
  total: number;
  take: number;
  skip: number;
  claimedTotal: number;
  predictions: SajuPredictionRow[];
};

const STAGE_LABEL: Record<string, string> = {
  PROFILE: "Profile Pool",
  VERIFIED: "Verified Pool",
  RECOMMENDABLE: "추천 가능 Pool"
};

const WORK_LABEL: Record<string, string> = {
  INTERN: "인턴",
  PART_TIME: "파트타임",
  PROJECT: "프로젝트",
  FULL_TIME: "정규직"
};

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "초급",
  INTERMEDIATE: "중급",
  ADVANCED: "고급",
  NATIVE: "원어민"
};

// Compact pool-stage label for the table cell. The chip counts at the top use
// the longer `STAGE_LABEL` form ("Profile Pool" etc.) — inside a row we want
// something narrower so the cell doesn't dominate horizontal space.
const STAGE_SHORT_LABEL: Record<string, string> = {
  PROFILE: "Profile",
  VERIFIED: "Verified",
  RECOMMENDABLE: "추천 가능"
};

// Two-letter locale codes the saju funnel emits. Uppercased so the cell reads
// as a compact tag rather than a sentence fragment.
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

// Build a one-tap follow-up link for the operator based on the channel the
// candidate gave. KakaoTalk has no reliable web deep-link, so it falls back
// to copy-only.
function contactHref(contactType: string | null, contact: string): string | null {
  const raw = contact.trim();
  switch (contactType) {
    case "EMAIL":
      return `mailto:${raw}`;
    case "PHONE":
      return `tel:${raw.replace(/[^+\d]/g, "")}`;
    case "WHATSAPP":
      return `https://wa.me/${raw.replace(/\D/g, "")}`;
    case "KAKAO":
      return null;
    default:
      return raw.includes("@") ? `mailto:${raw}` : null;
  }
}

export default function SajuLeadsPage() {
  const [data, setData] = useState<LeadsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poolStage, setPoolStage] = useState("");
  const [recommendStatus, setRecommendStatus] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 40 | 100>(20);
  // Mirror the all-users page debounce: type in the search input and the
  // server query fires 400ms after the last keystroke. No separate button.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${apiBase()}/ops/saju/leads`);
      if (poolStage) url.searchParams.set("poolStage", poolStage);
      if (recommendStatus) url.searchParams.set("recommendStatus", recommendStatus);
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
  }, [poolStage, recommendStatus, debouncedQ, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  // Pagination derivations mirror the all-users page so the footer looks /
  // behaves identically.
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

  const anyFilterActive = Boolean(poolStage || recommendStatus || q.trim());

  return (
    <section className="ops-content-section">
      <header>
        <h1>사주 이벤트</h1>
        <p>
          사주 이벤트에서 커리어 정보를 입력한 후보를 관리합니다. 국적·직무·비자·언어 태그로 필터링하고, 추천 가능
          상태(미검증 / 보완 필요 / 추천 가능)별로 분류해 기업 추천 후보를 발굴하세요.
        </p>
      </header>

      {data?.funnel ? (
        <article className="ops-card">
          <h2 className="ops-section-title">사주 이벤트</h2>
          <p className="ops-card-subtle" style={{ margin: "4px 0 12px" }}>
            사주 봤음 → 커리어 정보 입력 → 가입 전환. 비-인증 사용자는 익명 ipHash로 카운트됩니다.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12
            }}
          >
            <div style={{ padding: "12px 14px", border: "1px solid #eef0f3", borderRadius: 10, background: "#fcfcfd" }}>
              <div className="ops-row-sub" style={{ marginBottom: 4 }}>사주 본 사람</div>
              <div className="ops-row-strong" style={{ fontSize: 20 }}>
                {data.funnel.predictionsTotal.toLocaleString()}명
              </div>
            </div>
            <div style={{ padding: "12px 14px", border: "1px solid #eef0f3", borderRadius: 10, background: "#fcfcfd" }}>
              <div className="ops-row-sub" style={{ marginBottom: 4 }}>커리어 정보 입력</div>
              <div className="ops-row-strong" style={{ fontSize: 20 }}>
                {data.funnel.leadsTotal.toLocaleString()}명
              </div>
              <div className="ops-row-sub" style={{ marginTop: 4, fontSize: 11 }}>
                사주 본 사람 중{" "}
                {data.funnel.predictionsTotal > 0
                  ? Math.round((data.funnel.leadsTotal / data.funnel.predictionsTotal) * 1000) / 10
                  : 0}
                %
              </div>
            </div>
            <div style={{ padding: "12px 14px", border: "1px solid #eef0f3", borderRadius: 10, background: "#fcfcfd" }}>
              <div className="ops-row-sub" style={{ marginBottom: 4 }}>가입 전환</div>
              <div className="ops-row-strong" style={{ fontSize: 20 }}>
                {data.funnel.leadsConverted.toLocaleString()}명
              </div>
              <div className="ops-row-sub" style={{ marginTop: 4, fontSize: 11 }}>
                커리어 입력 중{" "}
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
            placeholder="이름 / 학교 / 전공 / 연락처 검색"
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
            value={recommendStatus}
            onChange={(e) => {
              setRecommendStatus(e.target.value);
              setPage(1);
            }}
            aria-label="추천 상태 필터"
          >
            <option value="">전체 추천 상태</option>
            <option value="UNVERIFIED">미검증</option>
            <option value="NEEDS_WORK">보완 필요</option>
            <option value="RECOMMENDABLE">추천 가능</option>
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
                setRecommendStatus("");
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
                <th>학교 / 전공</th>
                <th>비자</th>
                <th>한국어</th>
                <th>희망 직무</th>
                <th>근무</th>
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
                  <td colSpan={12} className="ops-table-empty">목록을 불러오는 중입니다...</td>
                </tr>
              ) : !data || data.leads.length === 0 ? (
                <tr>
                  <td colSpan={12} className="ops-table-empty">조건에 맞는 후보가 없습니다.</td>
                </tr>
              ) : data.leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="ops-row-strong">{lead.name ?? "-"}</td>
                  <td>{lead.nationality ?? "-"}</td>
                  <td className="ops-row-sub">
                    {[lead.school, lead.major].filter(Boolean).join(" · ") || "-"}
                  </td>
                  <td>{lead.visaType ? lead.visaType.replace(/_/g, " ") : "-"}</td>
                  <td>{lead.koreanLevel ? LEVEL_LABEL[lead.koreanLevel] ?? lead.koreanLevel : "-"}</td>
                  <td>{lead.preferredJobRole ? translateRole(lead.preferredJobRole, "ko") : "-"}</td>
                  <td>{lead.workType ? WORK_LABEL[lead.workType] ?? lead.workType : "-"}</td>
                  <td className="ops-row-sub">
                    {lead.contact ? (
                      (() => {
                        const href = contactHref(lead.contactType, lead.contact);
                        const prefix = lead.contactType ? `[${lead.contactType}] ` : "";
                        return href ? (
                          <a
                            href={href}
                            target={lead.contactType === "WHATSAPP" ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            style={{ color: "#1d4ed8" }}
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

      {/* 결과 본 사람 (Raw Pool) — funnel form 안 채운 익명 사주 예측까지 포함.
          /ops/saju/leads 가 보여주는 lead pool 의 상위 단계. */}
      <SajuPredictionsSection />
    </section>
  );
}

function SajuPredictionsSection() {
  const [data, setData] = useState<PredictionsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [gender, setGender] = useState<"" | "male" | "female">("");
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
      const url = new URL(`${apiBase()}/ops/saju/predictions`);
      if (debouncedQ) url.searchParams.set("q", debouncedQ);
      if (gender) url.searchParams.set("gender", gender);
      if (claimed) url.searchParams.set("claimed", claimed);
      url.searchParams.set("take", String(pageSize));
      url.searchParams.set("skip", String((page - 1) * pageSize));
      const response = await fetch(url.toString(), { headers: authHeaders(), cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as PredictionsPayload;
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "결과 본 사람 Pool 을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, gender, claimed, page, pageSize]);

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

  const anyFilterActive = Boolean(gender || claimed || q.trim());

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
        Aply 사주 결과 페이지를 본 모든 사람 (funnel form 안 채운 익명 포함). 이름·생년월일·성별 + 추천 직무 단위로 정렬.
      </p>

      <div className="ops-partner-filters ops-partner-filters--multi">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="이름 검색"
          className="ops-partner-filter-search"
        />
        <select
          value={gender}
          onChange={(e) => {
            setGender(e.target.value as "" | "male" | "female");
            setPage(1);
          }}
          aria-label="성별 필터"
        >
          <option value="">전체 성별</option>
          <option value="male">남자</option>
          <option value="female">여자</option>
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
              setGender("");
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
              <th>성별</th>
              <th>생년월일</th>
              <th>출생 시</th>
              <th>달력</th>
              <th>추천 직무</th>
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
                <td colSpan={11} className="ops-table-empty">목록을 불러오는 중입니다...</td>
              </tr>
            ) : !data || data.predictions.length === 0 ? (
              <tr>
                <td colSpan={11} className="ops-table-empty">조건에 맞는 결과가 없습니다.</td>
              </tr>
            ) : data.predictions.map((p) => (
              <tr key={p.id}>
                <td className="ops-row-strong">{p.name}</td>
                <td>{p.gender === "male" ? "남" : p.gender === "female" ? "여" : p.gender}</td>
                <td className="ops-row-sub">{p.birthDate}</td>
                <td className="ops-row-sub">{p.birthTime ?? "-"}</td>
                <td className="ops-row-sub">{p.calendarType === "lunar" ? "음력" : "양력"}</td>
                <td className="ops-row-sub">
                  {p.recommendedRoleNames.slice(0, 3).map((r) => translateRole(r, "ko") ?? r).join(" · ") || "-"}
                </td>
                <td className="ops-row-sub">{p.recommendedPositionCount}개</td>
                <td>
                  {p.userId ? (
                    <span className="ops-pill ops-pill-blue">가입</span>
                  ) : p.hasLead ? (
                    <span className="ops-pill ops-pill-violet">Lead</span>
                  ) : (
                    <span className="ops-row-sub">-</span>
                  )}
                </td>
                <td>{localeLabel(p.locale)}</td>
                <td className="ops-row-sub">{new Date(p.createdAt).toLocaleDateString("ko-KR")}</td>
                <td>
                  <a
                    href={`/events/saju/result/${p.shareSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#1d4ed8", fontSize: 12 }}
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
