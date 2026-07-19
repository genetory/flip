"use client";

import { useEffect, useState } from "react";
import {
  fetchCohortReport,
  createEmploymentOutcome,
  saveSatisfaction,
  issueCertificate,
  revokeCertificate,
  type CohortReport,
  type CohortReportStudent,
  type EmploymentOutcomeStatus
} from "../../../../../lib/launch/ops-client";

// 기수 성과 관리 — 운영자가 학생별 취업 성과·만족도·수료증을 입력한다.
// 여기 입력한 값이 학교 제출용 성과 리포트에 그대로 반영된다.
const OUTCOME_OPTIONS: { value: EmploymentOutcomeStatus; label: string }[] = [
  { value: "APPLIED", label: "지원" },
  { value: "INTERVIEW", label: "면접" },
  { value: "OFFER", label: "합격(오퍼)" },
  { value: "HIRED", label: "입사" },
  { value: "REJECTED", label: "불합격" }
];

type Draft = { company: string; status: EmploymentOutcomeStatus; rating: string; nps: string; comment: string };

function statusBadge(s: CohortReportStudent): string {
  if (s.hired) return "입사";
  if (s.reachedOffer) return "합격";
  if (s.reachedInterview) return "면접";
  if (s.applications > 0) return "지원";
  return "-";
}

export default function OutcomesPanel({ cohortId }: { cohortId: string }) {
  const [report, setReport] = useState<CohortReport | null>(null);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await fetchCohortReport(cohortId);
      setReport(r);
      setDrafts((prev) => {
        const next = { ...prev };
        for (const s of r.students) {
          if (!next[s.userId]) {
            next[s.userId] = {
              company: "",
              status: "HIRED",
              rating: s.satisfactionRating ? String(s.satisfactionRating) : "",
              nps: s.npsScore !== null ? String(s.npsScore) : "",
              comment: s.comment ?? ""
            };
          }
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "성과 데이터를 불러오지 못했어요.");
    }
  };
  useEffect(() => {
    if (cohortId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cohortId]);

  const patch = (uid: string, p: Partial<Draft>) => setDrafts((d) => ({ ...d, [uid]: { ...d[uid], ...p } }));

  const addOutcome = async (uid: string) => {
    const d = drafts[uid];
    if (!d?.company.trim()) return;
    setBusy(uid + ":outcome");
    try {
      await createEmploymentOutcome({ studentUserId: uid, cohortId, status: d.status, companyName: d.company.trim() });
      patch(uid, { company: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(null);
    }
  };

  const saveSat = async (uid: string) => {
    const d = drafts[uid];
    const rating = Number(d?.rating);
    if (!rating || rating < 1 || rating > 5) {
      setError("만족도는 1~5 사이여야 해요.");
      return;
    }
    setBusy(uid + ":sat");
    try {
      await saveSatisfaction({
        studentUserId: uid,
        cohortId,
        rating,
        npsScore: d.nps === "" ? null : Number(d.nps),
        comment: d.comment.trim() || null
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(null);
    }
  };

  const toggleCert = async (s: CohortReportStudent) => {
    setBusy(s.userId + ":cert");
    try {
      if (s.certificateNo) await revokeCertificate(cohortId, s.userId);
      else await issueCertificate(cohortId, s.userId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "처리 실패");
    } finally {
      setBusy(null);
    }
  };

  if (!report) return <article className="ops-partner-list-card">{error || "불러오는 중…"}</article>;

  return (
    <article className="ops-partner-list-card">
      <div className="ops-partner-list-top">
        <h2>성과 관리 (취업 · 만족도 · 수료증)</h2>
        <span className="ops-card-subtle">입력하면 학교 제출용 리포트에 반영돼요</span>
      </div>
      {error ? <p className="ops-form-error">{error}</p> : null}

      <div className="ops-partner-table-wrap">
        <table className="ops-partner-table">
          <thead>
            <tr>
              <th>학생</th>
              <th>취업 성과</th>
              <th>만족도 · 후기</th>
              <th>수료증</th>
            </tr>
          </thead>
          <tbody>
            {report.students.length === 0 ? (
              <tr>
                <td colSpan={4} className="ops-table-empty">등록된 학생이 없어요.</td>
              </tr>
            ) : (
              report.students.map((s) => {
                const d = drafts[s.userId] ?? { company: "", status: "HIRED", rating: "", nps: "", comment: "" };
                return (
                  <tr key={s.userId}>
                    <td>
                      <div className="op-cell">
                        <strong>{s.name || s.email}</strong>
                        <div className="ops-card-subtle op-sub">
                          현재: {statusBadge(s)}
                          {s.placementCompany ? ` · ${s.placementCompany}` : ""}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="op-cell">
                        <div className="op-row">
                          <input className="ops-input op-company" placeholder="기업명" value={d.company} onChange={(e) => patch(s.userId, { company: e.target.value })} />
                          <select className="ops-input op-sel" value={d.status} onChange={(e) => patch(s.userId, { status: e.target.value as EmploymentOutcomeStatus })}>
                            {OUTCOME_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                          <button type="button" className="ops-btn" disabled={!d.company.trim() || busy === s.userId + ":outcome"} onClick={() => void addOutcome(s.userId)}>
                            기록
                          </button>
                        </div>
                        <div className="ops-card-subtle op-sub">지원 {s.applications}건</div>
                      </div>
                    </td>
                    <td>
                      <div className="op-cell">
                        <div className="op-row">
                          <select className="ops-input op-sel" value={d.rating} onChange={(e) => patch(s.userId, { rating: e.target.value })}>
                            <option value="">만족도</option>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>{n}점</option>
                            ))}
                          </select>
                          <select className="ops-input op-sel" value={d.nps} onChange={(e) => patch(s.userId, { nps: e.target.value })}>
                            <option value="">NPS</option>
                            {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                          <button type="button" className="ops-btn" disabled={busy === s.userId + ":sat"} onClick={() => void saveSat(s.userId)}>
                            저장
                          </button>
                        </div>
                        <input className="ops-input op-comment" placeholder="후기 / 추천사 (리포트에 인용)" value={d.comment} onChange={(e) => patch(s.userId, { comment: e.target.value })} />
                      </div>
                    </td>
                    <td>
                      <div className="op-cell">
                        <button
                          type="button"
                          className={`ops-btn ${s.certificateNo ? "ops-btn-danger" : "ops-btn-primary"}`}
                          disabled={busy === s.userId + ":cert"}
                          onClick={() => void toggleCert(s)}
                        >
                          {s.certificateNo ? "회수" : "발급"}
                        </button>
                        {s.certificateNo ? <div className="ops-card-subtle op-sub">{s.certificateNo}</div> : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        /* 셀 내부 세로 리듬 — 컨트롤 행과 보조 텍스트 사이 8px 로 통일 */
        .op-cell {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .op-row {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .op-company {
          width: 128px;
        }
        .op-sel {
          width: 92px;
        }
        .op-comment {
          width: 100%;
          min-width: 220px;
        }
        .op-sub {
          margin: 0;
        }
      `}</style>
    </article>
  );
}
