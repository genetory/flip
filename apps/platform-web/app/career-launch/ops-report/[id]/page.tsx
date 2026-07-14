"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchCohortReport, type CohortReport } from "../../../../lib/launch/ops-client";
import { useAuthSession } from "../../../../components/auth/AuthSessionProvider";
import "./report-print.css";

// 기수별 성과 리포트 — 학교 제출용 A4 인쇄물.
// ops 세그먼트 바깥에 둬서 운영 콘솔의 사이드바/상단바가 인쇄물에 섞이지 않는다.
// 'PDF로 저장' 은 브라우저 인쇄(window.print) — 기존 이력서/자소서 PDF와 같은 방식.
export default function CohortOutcomeReportPage() {
  const { isReady } = useAuthSession();
  const params = useParams();
  const id = String((params as { id?: string })?.id ?? "");
  const [data, setData] = useState<CohortReport | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isReady || !id) return;
    void (async () => {
      try {
        setData(await fetchCohortReport(id));
      } catch (e) {
        setError(e instanceof Error ? e.message : "리포트를 불러오지 못했어요.");
      }
    })();
  }, [isReady, id]);

  if (error) return <main className="rp-state">{error}</main>;
  if (!data) return <main className="rp-state">불러오는 중…</main>;

  const { cohort, summary, students } = data;
  const period = [cohort.startsAt?.slice(0, 10), cohort.endsAt?.slice(0, 10)].filter(Boolean).join(" ~ ") || "-";
  const pct = (n: number) => (summary.enrolled ? Math.round((n / summary.enrolled) * 100) : 0);
  const today = new Date().toISOString().slice(0, 10);
  const completers = students.filter((s) => s.completed);

  const stages = [
    { label: "취업 준비 진단", n: summary.diagnosed },
    { label: "직무 선정", n: summary.jobsSelected },
    { label: "이력서 완성", n: summary.resumes },
    { label: "자기소개서 완성", n: summary.coverLetters },
    { label: "모의면접 참여", n: summary.interviewAny },
    { label: "모의면접 3라운드 완주", n: summary.interviewAll }
  ];

  return (
    <main className="rp">
      {/* 인쇄 시 숨겨지는 툴바 */}
      <div className="rp-toolbar">
        <button type="button" onClick={() => window.print()}>
          PDF로 저장 / 인쇄
        </button>
      </div>

      <article className="rp-sheet">
        {/* 표지 */}
        <header className="rp-head">
          <div className="rp-brand">Aply · Career Launch</div>
          <h1>성과 리포트</h1>
          <p className="rp-sub">
            {cohort.university} · {cohort.name}
          </p>
          <dl className="rp-meta">
            <div>
              <dt>운영 기간</dt>
              <dd>{period}</dd>
            </div>
            <div>
              <dt>참여 인원</dt>
              <dd>{summary.enrolled}명</dd>
            </div>
            <div>
              <dt>발행일</dt>
              <dd>{today}</dd>
            </div>
          </dl>
        </header>

        {/* 1. 핵심 성과 */}
        <section className="rp-sec">
          <h2>1. 핵심 성과</h2>
          <div className="rp-kpis">
            <div className="rp-kpi rp-kpi--hero">
              <span className="rp-kpi-label">취업 준비도 향상</span>
              {summary.measured > 0 ? (
                <>
                  <span className="rp-kpi-value">
                    {summary.avgBefore}% → {summary.avgAfter}%
                  </span>
                  <span className="rp-kpi-gain">{summary.avgGain >= 0 ? `+${summary.avgGain}%p` : `${summary.avgGain}%p`}</span>
                  <span className="rp-kpi-note">
                    사전·사후 진단을 모두 마친 {summary.measured}명 기준 · {summary.improved}명 향상
                  </span>
                </>
              ) : (
                <>
                  <span className="rp-kpi-value rp-kpi-value--muted">측정 전</span>
                  <span className="rp-kpi-note">수료 진단을 마친 학생이 아직 없어 향상도를 산출할 수 없습니다.</span>
                </>
              )}
            </div>
            <div className="rp-kpi">
              <span className="rp-kpi-label">완주</span>
              <span className="rp-kpi-value">
                {summary.completed}명 <em>({pct(summary.completed)}%)</em>
              </span>
              <span className="rp-kpi-note">이력서·자기소개서·모의면접 3라운드를 모두 마친 학생</span>
            </div>
            <div className="rp-kpi">
              <span className="rp-kpi-label">서류 완성</span>
              <span className="rp-kpi-value">
                {summary.resumes} / {summary.coverLetters}
              </span>
              <span className="rp-kpi-note">이력서 / 자기소개서 완성 인원</span>
            </div>
          </div>
        </section>

        {/* 2. 단계별 참여 */}
        <section className="rp-sec">
          <h2>2. 단계별 참여 현황</h2>
          <table className="rp-table">
            <thead>
              <tr>
                <th>단계</th>
                <th className="rp-num">인원</th>
                <th className="rp-num">비율</th>
                <th>달성률</th>
              </tr>
            </thead>
            <tbody>
              {stages.map((s) => (
                <tr key={s.label}>
                  <td>{s.label}</td>
                  <td className="rp-num">{s.n}명</td>
                  <td className="rp-num">{pct(s.n)}%</td>
                  <td>
                    <span className="rp-bar">
                      <span className="rp-bar-fill" style={{ width: `${pct(s.n)}%` }} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 3. 개인별 향상도 */}
        {summary.measured > 0 ? (
          <section className="rp-sec">
            <h2>3. 개인별 준비도 향상</h2>
            <table className="rp-table">
              <thead>
                <tr>
                  <th>학생</th>
                  <th className="rp-num">사전</th>
                  <th className="rp-num">사후</th>
                  <th className="rp-num">향상</th>
                </tr>
              </thead>
              <tbody>
                {students
                  .filter((s) => s.gain !== null)
                  .sort((a, b) => (b.gain ?? 0) - (a.gain ?? 0))
                  .map((s) => (
                    <tr key={s.userId}>
                      <td>{s.name || s.email}</td>
                      <td className="rp-num">{s.diagnosisBefore}%</td>
                      <td className="rp-num">{s.diagnosisAfter}%</td>
                      <td className={`rp-num ${(s.gain ?? 0) > 0 ? "rp-up" : ""}`}>
                        {(s.gain ?? 0) >= 0 ? `+${s.gain}` : s.gain}%p
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {/* 4. 수료자 명단 */}
        <section className="rp-sec rp-break">
          <h2>{summary.measured > 0 ? "4" : "3"}. 수료자 명단</h2>
          {completers.length === 0 ? (
            <p className="rp-empty">아직 완주한 학생이 없습니다.</p>
          ) : (
            <table className="rp-table">
              <thead>
                <tr>
                  <th className="rp-num">No.</th>
                  <th>학생</th>
                  <th>이메일</th>
                  <th className="rp-num">이력서</th>
                  <th className="rp-num">자기소개서</th>
                  <th className="rp-num">모의면접</th>
                </tr>
              </thead>
              <tbody>
                {completers.map((s, i) => (
                  <tr key={s.userId}>
                    <td className="rp-num">{i + 1}</td>
                    <td>{s.name || "-"}</td>
                    <td>{s.email}</td>
                    <td className="rp-num">완료</td>
                    <td className="rp-num">{s.coverItems}문항</td>
                    <td className="rp-num">{s.interviewPracticed}/3</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer className="rp-foot">
          <p>
            본 리포트는 Aply Career Launch 프로그램의 실제 학습 데이터를 기반으로 자동 생성되었습니다. · 발행일 {today}
          </p>
          <p>주식회사 플리퍼스 (Flippers Inc.) · aply.global</p>
        </footer>
      </article>
    </main>
  );
}
