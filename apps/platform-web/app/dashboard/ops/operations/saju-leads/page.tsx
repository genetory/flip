"use client";

import { useCallback, useEffect, useState } from "react";
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
  leads: Lead[];
};

const STAGE_LABEL: Record<string, string> = {
  PROFILE: "Profile Pool",
  VERIFIED: "Verified Pool",
  RECOMMENDABLE: "추천 가능 Pool"
};

const STATUS_LABEL: Record<string, string> = {
  UNVERIFIED: "미검증",
  NEEDS_WORK: "보완 필요",
  RECOMMENDABLE: "추천 가능"
};

const STATUS_PILL: Record<string, string> = {
  UNVERIFIED: "ops-pill",
  NEEDS_WORK: "ops-pill ops-pill-amber",
  RECOMMENDABLE: "ops-pill ops-pill-blue"
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

const IMPROVEMENT_LABEL: Record<string, string> = {
  RESUME: "이력서",
  KOREAN: "한국어",
  VISA: "비자",
  CONTACT: "연락처",
  PORTFOLIO: "포트폴리오",
  ENGLISH: "영어"
};

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
  const [appliedQ, setAppliedQ] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyContact(id: string, value: string) {
    void navigator.clipboard?.writeText(value).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    });
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${apiBase()}/ops/saju/leads`);
      if (poolStage) url.searchParams.set("poolStage", poolStage);
      if (recommendStatus) url.searchParams.set("recommendStatus", recommendStatus);
      if (appliedQ) url.searchParams.set("q", appliedQ);
      url.searchParams.set("take", "100");
      const response = await fetch(url.toString(), { headers: authHeaders(), cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as LeadsPayload;
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "후보 Pool을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [poolStage, recommendStatus, appliedQ]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="ops-content-section">
      <header>
        <h1>사주 이벤트 후보 Pool</h1>
        <p>
          사주 이벤트에서 커리어 정보를 입력한 후보를 관리합니다. 국적·직무·비자·언어 태그로 필터링하고, 추천 가능
          상태(미검증 / 보완 필요 / 추천 가능)별로 분류해 기업 추천 후보를 발굴하세요.
        </p>
      </header>

      {data ? (
        <div className="ops-tag-row" style={{ marginBottom: 4 }}>
          {Object.entries(data.stageCounts).map(([stage, count]) => (
            <span key={stage} className="ops-pill ops-pill-violet">
              {STAGE_LABEL[stage] ?? stage}: {count}
            </span>
          ))}
        </div>
      ) : null}

      <article className="ops-card">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            <span className="ops-row-sub">Pool 단계</span>
            <select value={poolStage} onChange={(e) => setPoolStage(e.target.value)} className="ops-select">
              <option value="">전체</option>
              <option value="PROFILE">Profile Pool</option>
              <option value="VERIFIED">Verified Pool</option>
              <option value="RECOMMENDABLE">추천 가능 Pool</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            <span className="ops-row-sub">추천 상태</span>
            <select value={recommendStatus} onChange={(e) => setRecommendStatus(e.target.value)} className="ops-select">
              <option value="">전체</option>
              <option value="UNVERIFIED">미검증</option>
              <option value="NEEDS_WORK">보완 필요</option>
              <option value="RECOMMENDABLE">추천 가능</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, flex: 1, minWidth: 180 }}>
            <span className="ops-row-sub">검색 (이름/학교/전공/연락처)</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setAppliedQ(q.trim());
              }}
              placeholder="검색어 입력 후 Enter"
              className="ops-input"
            />
          </label>
          <button type="button" className="ops-btn ops-btn-primary" onClick={() => setAppliedQ(q.trim())}>
            검색
          </button>
        </div>
      </article>

      {loading ? (
        <div className="ops-empty-card">불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : !data || data.leads.length === 0 ? (
        <div className="ops-empty-card">조건에 맞는 후보가 없습니다.</div>
      ) : (
        <article className="ops-table-card">
          <table>
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
                <th>이력서</th>
                <th>보완</th>
                <th>추천 상태</th>
                <th>연락동의</th>
                <th>가입</th>
                <th>등록일</th>
              </tr>
            </thead>
            <tbody>
              {data.leads.map((lead) => (
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
                        return (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            {href ? (
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
                            )}
                            <button
                              type="button"
                              className="ops-btn"
                              style={{ padding: "1px 6px", fontSize: 11 }}
                              onClick={() => copyContact(lead.id, lead.contact!)}
                            >
                              {copiedId === lead.id ? "복사됨" : "복사"}
                            </button>
                          </span>
                        );
                      })()
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{lead.hasResume === true ? "O" : lead.hasResume === false ? "X" : "-"}</td>
                  <td className="ops-row-sub" style={{ fontSize: 11 }}>
                    {lead.improvements.length > 0
                      ? lead.improvements.map((c) => IMPROVEMENT_LABEL[c] ?? c).join(", ")
                      : "-"}
                  </td>
                  <td>
                    {lead.recommendStatus ? (
                      <span className={STATUS_PILL[lead.recommendStatus] ?? "ops-pill"}>
                        {STATUS_LABEL[lead.recommendStatus] ?? lead.recommendStatus}
                      </span>
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
                  <td>{lead.userId ? "✓" : "-"}</td>
                  <td className="ops-row-sub">{new Date(lead.createdAt).toLocaleDateString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      )}
    </section>
  );
}
