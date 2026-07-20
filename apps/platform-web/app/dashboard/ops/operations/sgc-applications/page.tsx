"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CaretDown, Trash, X } from "@phosphor-icons/react/dist/ssr";
import { readAccessToken } from "../../../../../lib/auth-client";

// ---------------------------------------------------------------------------
// /dashboard/ops/operations/sgc-applications — SGC × Aply 6주 일경험 프로그램
// 지원 풀 관리. visa-leads / saju-leads 와 동일 ops 패턴 (필터 + 페이지
// 네이션 + status 카운트 + 인라인 단계 변경 + 메모 저장).
// ---------------------------------------------------------------------------

type SgcVisaType = "D-2" | "D-10" | "OTHER";
type SgcDesiredJob = "MARKETING" | "SALES" | "TRANSLATION" | "DEV" | "OTHER";
type SgcStatus = "SUBMITTED" | "INTERVIEW" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";

type Application = {
  id: string;
  status: SgcStatus;
  applicantName: string | null;
  birthDate: string | null;
  gender: string | null;
  nationality: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  koreaStayDuration: string | null;
  university: string | null;
  major: string | null;
  grade: string | null;
  expectedGraduation: string | null;
  topikLevel: string | null;
  referralSource: string | null;
  referralOther: string | null;
  visaType: SgcVisaType;
  visaOther: string | null;
  healthNote: string;
  desiredJob: SgcDesiredJob;
  desiredJobOther: string | null;
  motivation: string;
  marketingOptIn: boolean;
  preTrainingConsent: boolean | null;
  locale: string;
  adminMemo: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    phoneNumber: string | null;
    nationality: string | null;
  } | null;
  resume: {
    id: string;
    title: string;
    shareSlug: string;
    updatedAt: string;
  } | null;
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

const STATUS_LABEL: Record<SgcStatus, string> = {
  SUBMITTED: "접수 완료",
  INTERVIEW: "면접 진행",
  ACCEPTED: "합격",
  REJECTED: "불합격",
  WITHDRAWN: "지원 취소"
};

const STATUS_PILL_CLASS: Record<SgcStatus, string> = {
  SUBMITTED: "ops-pill ops-pill-blue",
  INTERVIEW: "ops-pill ops-pill-violet",
  ACCEPTED: "ops-pill ops-pill-green",
  REJECTED: "ops-pill ops-pill-gray",
  WITHDRAWN: "ops-pill ops-pill-gray"
};

const VISA_LABEL: Record<SgcVisaType, string> = {
  "D-2": "D-2 (유학)",
  "D-10": "D-10 (구직)",
  OTHER: "기타"
};

const JOB_LABEL: Record<SgcDesiredJob, string> = {
  MARKETING: "마케팅",
  SALES: "세일즈",
  TRANSLATION: "통번역",
  DEV: "개발",
  OTHER: "기타"
};

// 포스터 폼 enum 라벨 (운영 콘솔 표시용). 도입 전 지원은 null → "-".
const GENDER_LABEL: Record<string, string> = { FEMALE: "여성", MALE: "남성" };
const GRADE_LABEL: Record<string, string> = {
  UNDERGRAD_4: "학부 재학",
  GRAD: "대학원 재학",
  GRADUATED: "졸업"
};
const KOREA_STAY_LABEL: Record<string, string> = {
  LT_1Y: "1년 미만",
  Y1_2: "1~2년",
  Y2_3: "2~3년",
  Y3_5: "3~5년",
  GTE_5Y: "5년 이상"
};
const REFERRAL_LABEL: Record<string, string> = {
  FRIEND: "지인 추천",
  SNS: "SNS",
  SCHOOL: "학교/교내 공지",
  SEARCH: "인터넷 검색",
  OTHER: "기타"
};
const labelOrDash = (map: Record<string, string>, key: string | null) =>
  key ? map[key] ?? key : "-";

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function contactHref(emailOrPhone: string | null | undefined, kind: "email" | "phone"): string | null {
  if (!emailOrPhone) return null;
  const raw = emailOrPhone.trim();
  if (!raw) return null;
  return kind === "email" ? `mailto:${raw}` : `tel:${raw.replace(/[^+\d]/g, "")}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ko-KR");
  } catch {
    return "-";
  }
}

export default function SgcApplicationsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SgcStatus | "">("");
  const [visaType, setVisaType] = useState<SgcVisaType | "">("");
  const [desiredJob, setDesiredJob] = useState<SgcDesiredJob | "">("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 40 | 100>(20);
  // 상세 모달을 띄울 application id. null 이면 모달 닫힘. 이전엔 inline expanded
  // row 였는데 운영자 입장에서 본문/메모를 편하게 읽고 쓰려면 모달 폼이 더 적합.
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
      const url = new URL(`${apiBase()}/ops/sgc/applications`);
      if (status) url.searchParams.set("status", status);
      if (visaType) url.searchParams.set("visaType", visaType);
      if (desiredJob) url.searchParams.set("desiredJob", desiredJob);
      if (debouncedQ) url.searchParams.set("q", debouncedQ);
      url.searchParams.set("take", String(pageSize));
      url.searchParams.set("skip", String((page - 1) * pageSize));
      const response = await fetch(url.toString(), { headers: authHeaders(), cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as Payload;
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "지원 풀을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [status, visaType, desiredJob, debouncedQ, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  // 단계 변경 — 옵티미스틱하게 응답 후 row 만 갈아끼움. 실패 시 reload.
  async function updateApplication(id: string, payload: { status?: SgcStatus; adminMemo?: string | null }) {
    try {
      const response = await fetch(`${apiBase()}/ops/sgc/applications/${id}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setData((prev) =>
        prev
          ? {
              ...prev,
              applications: prev.applications.map((a) =>
                a.id === id
                  ? {
                      ...a,
                      ...(payload.status !== undefined ? { status: payload.status } : {}),
                      ...(payload.adminMemo !== undefined ? { adminMemo: payload.adminMemo } : {})
                    }
                  : a
              )
            }
          : prev
      );
    } catch {
      await load();
    }
  }

  // 지원 삭제 — 주로 테스트(같은 유저로 재신청 시험)와 명백한 오등록 정리.
  // 삭제 후엔 status 카운트도 1 줄여야 화면 위 카드가 어긋나지 않는다.
  async function deleteApplication(id: string, currentStatus: SgcStatus) {
    try {
      const response = await fetch(`${apiBase()}/ops/sgc/applications/${id}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setSelectedId(null);
      setData((prev) =>
        prev
          ? {
              ...prev,
              total: Math.max(0, prev.total - 1),
              totalAll: Math.max(0, prev.totalAll - 1),
              statusCounts: {
                ...prev.statusCounts,
                [currentStatus]: Math.max(0, (prev.statusCounts[currentStatus] ?? 0) - 1)
              },
              applications: prev.applications.filter((a) => a.id !== id)
            }
          : prev
      );
    } catch {
      // 옵티미스틱 갱신이 깨졌을 가능성 — reload 로 한 번에 진실 보정.
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

  const anyFilterActive = Boolean(status || visaType || desiredJob || q.trim());

  return (
    <section className="ops-content-section">
      <header>
        <h1>SGC × Aply 일경험 이벤트</h1>
        <p>
          서울글로벌센터 × Aply 6주 일경험 프로그램의 지원 풀입니다. 단계(접수 → 면접 → 합격/불합격) 별로 관리하고
          이력서를 확인하세요. 신규 지원은 디스코드 채널로도 즉시 알림이 전송됩니다.
        </p>
      </header>

      {data ? (
        <article className="ops-card">
          <h2 className="ops-section-title">전체 지원 현황</h2>
          <p className="ops-card-subtle" style={{ margin: "4px 0 12px" }}>
            현재 단계별 지원자 수와 누적 합계.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12
            }}
          >
            <div style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)" }}>
              <div className="ops-row-sub" style={{ marginBottom: 4 }}>총 지원자</div>
              <div className="ops-row-strong" style={{ fontSize: 20 }}>{data.totalAll.toLocaleString()}명</div>
            </div>
            {(Object.keys(STATUS_LABEL) as SgcStatus[]).map((s) => (
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
          <h2>지원자 풀</h2>
        </div>

        <div className="ops-partner-filters ops-partner-filters--multi">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="이름 / 이메일 검색"
            className="ops-partner-filter-search"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as SgcStatus | "");
              setPage(1);
            }}
            aria-label="단계 필터"
          >
            <option value="">전체 단계</option>
            {(Object.keys(STATUS_LABEL) as SgcStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <select
            value={visaType}
            onChange={(e) => {
              setVisaType(e.target.value as SgcVisaType | "");
              setPage(1);
            }}
            aria-label="체류자격 필터"
          >
            <option value="">전체 체류자격</option>
            <option value="D-2">D-2 (유학)</option>
            <option value="D-10">D-10 (구직)</option>
            <option value="OTHER">기타</option>
          </select>
          <select
            value={desiredJob}
            onChange={(e) => {
              setDesiredJob(e.target.value as SgcDesiredJob | "");
              setPage(1);
            }}
            aria-label="희망 직무 필터"
          >
            <option value="">전체 희망 직무</option>
            <option value="MARKETING">마케팅</option>
            <option value="SALES">세일즈</option>
            <option value="TRANSLATION">통번역</option>
            <option value="DEV">개발</option>
            <option value="OTHER">기타</option>
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
                setVisaType("");
                setDesiredJob("");
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
                <th>체류자격</th>
                <th>희망 직무</th>
                <th>이메일</th>
                <th>전화</th>
                <th>이력서</th>
                <th>단계</th>
                <th>등록일</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="ops-table-empty">목록을 불러오는 중입니다...</td>
                </tr>
              ) : !data || data.applications.length === 0 ? (
                <tr>
                  <td colSpan={10} className="ops-table-empty">조건에 맞는 지원자가 없습니다.</td>
                </tr>
              ) : data.applications.map((a) => {
                const visaLabel =
                  a.visaType === "OTHER" && a.visaOther ? `기타 — ${a.visaOther}` : VISA_LABEL[a.visaType];
                const jobLabel =
                  a.desiredJob === "OTHER" && a.desiredJobOther ? `기타 — ${a.desiredJobOther}` : JOB_LABEL[a.desiredJob];
                const emailHref = contactHref(a.user?.email, "email");
                const phoneHref = contactHref(a.user?.phoneNumber, "phone");
                return (
                  <tr key={a.id}>
                    <td className="ops-row-strong">{a.user?.name ?? "-"}</td>
                    <td>{a.user?.nationality ?? "-"}</td>
                    <td>{visaLabel}</td>
                    <td>{jobLabel}</td>
                    <td className="ops-row-sub">
                      {emailHref ? (
                        <a href={emailHref} style={{ color: "var(--accent-ink)" }}>{a.user?.email}</a>
                      ) : (
                        a.user?.email ?? "-"
                      )}
                    </td>
                    <td className="ops-row-sub">
                      {phoneHref ? (
                        <a href={phoneHref} style={{ color: "var(--accent-ink)" }}>{a.user?.phoneNumber}</a>
                      ) : (
                        a.user?.phoneNumber ?? "-"
                      )}
                    </td>
                    <td>
                      {a.resume ? (
                        <a
                          href={`/resume/share/${a.resume.shareSlug}?view=preview`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--accent-ink)", fontSize: 12 }}
                        >
                          {a.resume.title} ↗
                        </a>
                      ) : (
                        <span className="ops-row-sub">-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ position: "relative", display: "inline-block" }}>
                        <select
                          value={a.status}
                          // 단계 변경은 사용자에게 알림이 발송되는 비가역 액션이라
                          // 한 번 더 확인. 같은 값으로 선택했으면 그냥 무시(no-op).
                          // 사용자가 취소하면 select 의 controlled value 가 그대로
                          // a.status 이므로 자동으로 이전 표시로 돌아간다.
                          onChange={(e) => {
                            const next = e.target.value as SgcStatus;
                            if (next === a.status) return;
                            const applicantLabel = a.user?.name?.trim() || a.user?.email || "지원자";
                            const ok = window.confirm(
                              `${applicantLabel} 의 단계를 변경할까요?\n\n` +
                              `[${STATUS_LABEL[a.status]}] → [${STATUS_LABEL[next]}]\n\n` +
                              `※ 변경 시 사용자에게 in-app 알림이 즉시 전송됩니다.`
                            );
                            if (!ok) {
                              // 변경 취소 — controlled value 가 a.status 라 자동 복귀.
                              return;
                            }
                            void updateApplication(a.id, { status: next });
                          }}
                          aria-label="단계 변경"
                          className={STATUS_PILL_CLASS[a.status]}
                          // appearance: none 으로 브라우저 기본 화살표 제거 → 우측에
                          // phosphor CaretDown 오버레이로 일관된 톤. paddingRight 는
                          // CaretDown 자리를 비워두기 위해 30px 로 더 줌.
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
                          {(Object.keys(STATUS_LABEL) as SgcStatus[]).map((s) => (
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
                    </td>
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
                );
              })}
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
          onSaveMemo={(memo) => updateApplication(selectedApplication.id, { adminMemo: memo || null })}
          onDelete={() => deleteApplication(selectedApplication.id, selectedApplication.status)}
        />
      ) : null}
    </section>
  );
}

// 상세 보기 모달 — backdrop 클릭 또는 ESC 로 닫힘. 본문 길이가 길어도 내부
// 스크롤로 처리.
function ApplicationDetailModal({
  application,
  onClose,
  onSaveMemo,
  onDelete
}: {
  application: Application;
  onClose: () => void;
  onSaveMemo: (memo: string) => void;
  onDelete: () => void;
}) {
  // ESC 로 닫기 + body scroll lock — 모달 열려 있는 동안만.
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

  const visaLabel =
    application.visaType === "OTHER" && application.visaOther
      ? `기타 — ${application.visaOther}`
      : VISA_LABEL[application.visaType];
  const jobLabel =
    application.desiredJob === "OTHER" && application.desiredJobOther
      ? `기타 — ${application.desiredJobOther}`
      : JOB_LABEL[application.desiredJob];

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
        {/* Header — 이름 + 단계 pill + close 버튼 */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16
          }}
        >
          <div>
            <p className="ops-row-sub" style={{ fontSize: 11, fontWeight: 600 }}>SGC × Aply 일경험 — 지원 상세</p>
            <h3
              style={{
                margin: 0,
                marginTop: 4,
                fontSize: 20,
                fontWeight: 700,
                color: "var(--ink)"
              }}
            >
              {application.user?.name ?? "익명"}
            </h3>
            <p className="ops-row-sub" style={{ marginTop: 2, fontSize: 12 }}>
              {application.user?.email ?? "-"}
              {application.user?.phoneNumber ? ` · ${application.user.phoneNumber}` : ""}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={STATUS_PILL_CLASS[application.status]} style={{ padding: "6px 12px", fontSize: 12 }}>
              {STATUS_LABEL[application.status]}
            </span>
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

        {/* 메타 그리드 — 체류자격 / 희망 직무 / 등록일 */}
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
          <DetailMeta label="이름" value={application.applicantName || application.user?.name || "-"} />
          <DetailMeta label="생년월일" value={application.birthDate || "-"} />
          <DetailMeta label="성별" value={labelOrDash(GENDER_LABEL, application.gender)} />
          <DetailMeta label="국적" value={application.nationality || application.user?.nationality || "-"} />
          <DetailMeta label="휴대폰" value={application.phone || application.user?.phoneNumber || "-"} />
          <DetailMeta label="이메일" value={application.email || application.user?.email || "-"} />
          <DetailMeta label="한국 거주 기간" value={labelOrDash(KOREA_STAY_LABEL, application.koreaStayDuration)} />
          <DetailMeta label="주소" value={application.address || "-"} />
          <DetailMeta label="대학교" value={application.university || "-"} />
          <DetailMeta label="전공" value={application.major || "-"} />
          <DetailMeta label="학적 구분" value={labelOrDash(GRADE_LABEL, application.grade)} />
          <DetailMeta label="졸업/졸업예정" value={application.expectedGraduation || "-"} />
          <DetailMeta label="TOPIK" value={application.topikLevel ? `${application.topikLevel}급` : "-"} />
          <DetailMeta label="체류자격" value={visaLabel} />
          <DetailMeta label="희망 직무" value={jobLabel} />
          <DetailMeta
            label="알게 된 경로"
            value={
              application.referralSource
                ? `${labelOrDash(REFERRAL_LABEL, application.referralSource)}${
                    application.referralOther ? ` — ${application.referralOther}` : ""
                  }`
                : "-"
            }
          />
          <DetailMeta label="등록일" value={formatDate(application.createdAt)} />
        </div>

        {/* 이력서 바로가기 */}
        {application.resume ? (
          <div style={{ marginBottom: 20 }}>
            <p className="ops-row-sub" style={{ fontWeight: 600, marginBottom: 6, fontSize: 12 }}>
              지원 이력서
            </p>
            <a
              href={`/resume/share/${application.resume.shareSlug}?view=preview`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: "#fff",
                fontSize: 13,
                color: "var(--accent-ink)",
                textDecoration: "none"
              }}
            >
              {application.resume.title} ↗
            </a>
          </div>
        ) : null}

        {/* 신청 동기 */}
        <DetailBlock title="신청 동기">
          <p style={{ whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink)", margin: 0 }}>
            {application.motivation || "-"}
          </p>
        </DetailBlock>

        {/* 건강상 특이사항 */}
        <DetailBlock title="건강상 특이사항">
          <p style={{ whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink)", margin: 0 }}>
            {application.healthNote || "-"}
          </p>
        </DetailBlock>

        {/* 사전 교육 참여 동의 — 신규 폼 필드. 도입 전 지원은 null(-). */}
        <DetailBlock title="사전 교육 필수 참여 동의">
          <p style={{ fontSize: 13.5, color: "var(--ink)", margin: 0 }}>
            {application.preTrainingConsent == null
              ? "-"
              : application.preTrainingConsent
                ? "참여 가능 · 합격 시 참여 동의"
                : "미동의"}
          </p>
        </DetailBlock>

        {/* SGC 정보 수신 */}
        <DetailBlock title="SGC 정보 수신 동의">
          <p style={{ fontSize: 13.5, color: "var(--ink)", margin: 0 }}>
            {application.marketingOptIn ? "동의" : "동의하지 않음"}
          </p>
        </DetailBlock>

        {/* 운영 메모 */}
        <DetailBlock title="운영 메모 (운영자만 보임)">
          <AdminMemoEditor value={application.adminMemo ?? ""} onSave={onSaveMemo} />
        </DetailBlock>

        {/* 위험 영역 — 지원 삭제. 테스트(같은 계정 재신청)나 명백한 오등록
            정리 용도. 사용자 본인이 자발적으로 취소하는 케이스는 단계 변경에서
            "취소" 로 처리. window.confirm 으로 한 번 더 묻고, 사용자 이름까지
            문장에 박아 실수 방지. */}
        <div
          style={{
            marginTop: 24,
            padding: 14,
            borderRadius: 10,
            border: "1px solid var(--danger-soft)",
            background: "#fff5f5"
          }}
        >
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--danger)" }}>
            위험 — 지원 삭제
          </p>
          <p style={{ margin: "4px 0 10px", fontSize: 12, color: "var(--danger)", lineHeight: 1.5 }}>
            이 지원 행 자체를 삭제합니다. 같은 사용자로 다시 신청 가능해지며 운영 풀에서도 사라집니다.
            테스트나 명백한 오등록 정리 용도로만 사용하세요. 실제 거절은 단계 변경(불합격)으로 처리.
          </p>
          <button
            type="button"
            onClick={() => {
              const who = application.user?.name || application.user?.email || "이 지원";
              if (!window.confirm(`${who} 의 지원을 정말 삭제할까요?\n복구할 수 없습니다.`)) return;
              onDelete();
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              height: 36,
              borderRadius: 8,
              border: "1px solid var(--danger)",
              background: "var(--danger)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <Trash size={14} weight="bold" />
            지원 삭제
          </button>
        </div>
      </div>
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

// 메모 인라인 편집 — 변경 시점에만 PATCH. autosave 가 아니라 명시적 저장.
function AdminMemoEditor({ value, onSave }: { value: string; onSave: (memo: string) => void }) {
  const [text, setText] = useState(value);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setText(value);
  }, [value]);

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
        placeholder="운영 메모 (운영자만 보임)"
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
