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

  const { cohort, summary, students, testimonials } = data;
  const period = [cohort.startsAt?.slice(0, 10), cohort.endsAt?.slice(0, 10)].filter(Boolean).join(" ~ ") || "-";
  const pct = (n: number) => (summary.enrolled ? Math.round((n / summary.enrolled) * 100) : 0);
  const today = new Date().toISOString().slice(0, 10);
  const completers = students.filter((s) => s.completed);

  // 섹션 번호는 데이터 유무에 따라 유동적이라 순서대로 매긴다.
  // 리포트는 '취업 성공 가능성 향상'이 핵심 — 실제 취업 결과는 다루지 않는다(직접 알선이 아니므로).
  const showSatisfaction = summary.satisfactionCount > 0;
  const showIndividual = summary.measured > 0;
  let no = 0;
  const secNo = {
    core: ++no,
    satisfaction: showSatisfaction ? ++no : 0,
    stages: ++no,
    individual: showIndividual ? ++no : 0,
    completers: ++no
  };

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
          <h2>{secNo.core}. 핵심 성과</h2>
          <div className="rp-kpis rp-kpis--3">
            <div className="rp-kpi rp-kpi--hero">
              <span className="rp-kpi-label">취업 성공 가능성</span>
              {summary.measured > 0 ? (
                <>
                  <span className="rp-kpi-value">
                    {summary.avgSuccessBefore}% → {summary.avgSuccessAfter}%
                  </span>
                  <span className="rp-kpi-gain">{summary.avgSuccessGain >= 0 ? `+${summary.avgSuccessGain}%p` : `${summary.avgSuccessGain}%p`}</span>
                  <span className="rp-kpi-note">취업 준비도 + 프로그램 완성도 기반 추정 · {summary.measured}명 기준</span>
                </>
              ) : (
                <>
                  <span className="rp-kpi-value rp-kpi-value--muted">측정 전</span>
                  <span className="rp-kpi-note">수료 진단을 마친 학생이 아직 없어 산출할 수 없습니다.</span>
                </>
              )}
            </div>
            <div className="rp-kpi">
              <span className="rp-kpi-label">취업 준비도 향상 (근거)</span>
              {summary.measured > 0 ? (
                <>
                  <span className="rp-kpi-value">
                    {summary.avgBefore}% → {summary.avgAfter}%
                  </span>
                  <span className="rp-kpi-note">
                    사전·사후 진단 {summary.measured}명 · +{summary.avgGain}%p ({summary.improved}명 향상)
                  </span>
                </>
              ) : (
                <span className="rp-kpi-value rp-kpi-value--muted">측정 전</span>
              )}
            </div>
            <div className="rp-kpi">
              <span className="rp-kpi-label">완주</span>
              <span className="rp-kpi-value">
                {summary.completed}명 <em>({pct(summary.completed)}%)</em>
              </span>
              <span className="rp-kpi-note">이력서·자기소개서·모의면접 3라운드 완주</span>
            </div>
            <div className="rp-kpi">
              <span className="rp-kpi-label">서류 완성</span>
              <span className="rp-kpi-value">
                {summary.resumes} / {summary.coverLetters}
              </span>
              <span className="rp-kpi-note">이력서 / 자기소개서 완성 인원</span>
            </div>
          </div>
          {summary.measured > 0 ? (
            <div className="rp-method">
              <p className="rp-method-title">산출 근거 · 방법론</p>
              <ul className="rp-method-list">
                <li>
                  <strong>취업 준비도</strong>는 AI 취업 준비도 측정(경력 · 어학 · 비자 · 직무 이해 · 서류 · 면접 준비)으로 <strong>사전 · 사후 2회 측정</strong>합니다. 학생들이 4주 커리큘럼(취업 진단 → 직무 선정 → 이력서 → 자기소개서 → 모의면접 3라운드)을 완주하며{" "}
                  <strong>
                    {summary.avgBefore}% → {summary.avgAfter}% (+{summary.avgGain}%p)
                  </strong>{" "}
                  향상되었습니다. 개인별 향상 내역은 아래 <strong>‘개인별 준비도 향상’</strong>에서 확인할 수 있습니다.
                </li>
                <li>
                  <strong>취업 성공 가능성</strong> = 취업 준비도 × 0.65 + 준비 단계 완성도 × 0.35 로 산출합니다. 준비 단계 완성도는 진단 · 직무 선정 · 이력서 · 자기소개서 · 모의면접(3종)의 <strong>완주율</strong>이며, 프로그램 시작 시점 0% → 수료 시 평균 {summary.avgPrepCompletion}% 입니다. 결과:{" "}
                  <strong>
                    {summary.avgSuccessBefore}% → {summary.avgSuccessAfter}% (+{summary.avgSuccessGain}%p)
                  </strong>
                  .
                </li>
              </ul>
              <p className="rp-method-note">※ 본 지표는 준비 완성도 기반 추정치입니다. Aply는 학생의 취업 준비도를 높일 뿐, 직접 채용을 알선하지 않습니다.</p>
            </div>
          ) : null}
        </section>

        {/* 만족도 & 추천 */}
        {showSatisfaction ? (
          <section className="rp-sec">
            <h2>{secNo.satisfaction}. 만족도 &amp; 추천</h2>
            <div className="rp-kpis">
              <div className="rp-kpi rp-kpi--hero">
                <span className="rp-kpi-label">평균 만족도</span>
                <span className="rp-kpi-value">
                  {summary.avgSatisfaction} <em>/ 5</em>
                </span>
                <span className="rp-kpi-note">{summary.satisfactionCount}명 응답</span>
              </div>
              {summary.nps !== null ? (
                <div className="rp-kpi">
                  <span className="rp-kpi-label">추천 지수 (NPS)</span>
                  <span className="rp-kpi-value">{summary.nps > 0 ? `+${summary.nps}` : summary.nps}</span>
                  <span className="rp-kpi-note">{summary.npsCount}명 기준 · 0~10 추천 점수</span>
                </div>
              ) : null}
              <div className="rp-kpi">
                <span className="rp-kpi-label">수료증 발급</span>
                <span className="rp-kpi-value">{summary.certificatesIssued}건</span>
                <span className="rp-kpi-note">프로그램 수료 인증</span>
              </div>
            </div>
            {testimonials.length > 0 ? (
              <div className="rp-quotes">
                {testimonials.slice(0, 6).map((t, i) => (
                  <blockquote key={i} className="rp-quote">
                    <p>“{t.comment}”</p>
                    <cite>
                      — {t.name || "수료생"}
                      {t.rating ? ` · 만족도 ${t.rating}/5` : ""}
                    </cite>
                  </blockquote>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* 단계별 참여 */}
        <section className="rp-sec">
          <h2>{secNo.stages}. 단계별 참여 현황 <span style={{ fontSize: "13px", fontWeight: 400, color: "#8b95a1" }}>— 취업 성공 가능성 향상의 근거</span></h2>
          <p className="rp-sec-lead">학생들이 아래 준비 단계를 실제로 완주했기에 취업 성공 가능성이 올랐습니다.</p>
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
            <h2>{secNo.individual}. 개인별 준비도 향상 · 근거</h2>
            <p className="rp-sec-lead">
              학생마다 <strong>사전→사후 점수가 왜 그렇게 나왔는지</strong>를 ① 완주한 준비 단계(관찰 가능한 사실)와 ② AI 진단 평가로 함께 제시합니다.
            </p>
            <div className="rp-cards">
              {students
                .filter((s) => s.gain !== null)
                .sort((a, b) => (b.gain ?? 0) - (a.gain ?? 0))
                .map((s) => {
                  const steps = [
                    { label: "취업 진단", done: s.diagnosisBefore !== null },
                    { label: "직무 선정", done: s.selectedJobs > 0 },
                    { label: "이력서", done: s.hasResume },
                    { label: "자기소개서", done: s.coverItems > 0 },
                    { label: `모의면접 ${s.interviewPracticed}/3`, done: s.interviewPracticed > 0 }
                  ];
                  // 산출물 정량 근거 — 실제로 만들어낸 결과물의 수치를 함께 제시(자료를 풍부하게).
                  const facts: { label: string; value: string }[] = [
                    ...(s.successBefore !== null && s.successAfter !== null
                      ? [{ label: "취업 성공 가능성", value: `${s.successBefore}% → ${s.successAfter}%${s.successGain !== null ? ` (${s.successGain >= 0 ? "+" : ""}${s.successGain}%p)` : ""}` }]
                      : []),
                    { label: "준비 완성도", value: `${s.prepCompletion}%` },
                    { label: "주차 진행", value: `${s.weeksCompleted}/4주 완료 · 총 ${s.doneStepsCount}단계` },
                    ...(s.activityDays !== null ? [{ label: "활동 기간", value: `${s.activityDays}일` }] : []),
                    ...(s.selectedJobTitles.length > 0
                      ? [{ label: "선정 직무", value: s.selectedJobTitles.join(", ") }]
                      : s.selectedJobs > 0
                        ? [{ label: "선정 직무", value: `${s.selectedJobs}개` }]
                        : []),
                    ...(s.hasResume
                      ? [{ label: "이력서 구성", value: `학력 ${s.resumeEducations} · 경력 ${s.resumeExperiences} · 스킬 ${s.resumeSkills} · 어학 ${s.resumeLanguages}` }]
                      : []),
                    ...(s.coverItems > 0 ? [{ label: "자기소개서", value: `${s.coverItems}문항 · ${s.coverChars.toLocaleString()}자` }] : []),
                    ...(s.coverItemChars.length > 0 ? [{ label: "자소서 문항별 글자수", value: `${s.coverItemChars.join(" · ")}자` }] : []),
                    ...(s.interviewPracticed > 0
                      ? [{ label: "모의면접", value: `${s.interviewRounds.length > 0 ? s.interviewRounds.join(" · ") : ""}${s.interviewRounds.length > 0 ? " " : ""}(${s.interviewPracticed}/3)` }]
                      : []),
                    ...(s.materialsCount > 0 ? [{ label: "생성 자료", value: `${s.materialsCount}건` }] : []),
                    { label: "등록일", value: s.enrolledAt ? s.enrolledAt.slice(0, 10) : "-" }
                  ];
                  return (
                    <div key={s.userId} className="rp-card">
                      <div className="rp-card-head">
                        <span className="rp-card-name">{s.name || s.email}</span>
                        <span className="rp-card-score">
                          <em>취업 준비도</em> {s.diagnosisBefore}% <span className="rp-card-arrow">→</span>{" "}
                          <strong>{s.diagnosisAfter}%</strong>
                          <span className={`rp-card-gain ${(s.gain ?? 0) > 0 ? "rp-up" : ""}`}>
                            {(s.gain ?? 0) >= 0 ? `+${s.gain}` : s.gain}%p
                          </span>
                        </span>
                      </div>
                      <div className="rp-card-basis">
                        <p className="rp-card-blabel">완주한 준비 단계 (사후 점수의 근거)</p>
                        <div className="rp-steps">
                          {steps.map((st, i) => (
                            <span key={i} className={`rp-step ${st.done ? "rp-step--done" : ""}`}>
                              {st.done ? "✓ " : "· "}
                              {st.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="rp-card-basis">
                        <p className="rp-card-blabel">활동 산출물 (정량 근거)</p>
                        <div className="rp-facts">
                          {facts.map((f, i) => (
                            <div key={i} className="rp-fact">
                              <span>{f.label}</span>
                              <strong>{f.value}</strong>
                            </div>
                          ))}
                        </div>
                        <div className="rp-weeks">
                          {s.weekDone.map((done, i) => (
                            <span key={i} className={`rp-week ${done ? "rp-week--done" : ""}`}>
                              {done ? "✓ " : "· "}
                              {i + 1}주차
                            </span>
                          ))}
                        </div>
                      </div>
                      {s.diagLevel || s.diagStrengths.length > 0 || s.diagImprovements.length > 0 ? (
                        <div className="rp-card-basis">
                          <p className="rp-card-blabel">AI 진단 평가</p>
                          {s.diagLevel ? <p className="rp-card-level">{s.diagLevel}</p> : null}
                          {s.diagStrengths.length > 0 ? (
                            <ul className="rp-card-list">
                              {s.diagStrengths.map((t, i) => (
                                <li key={i} className="rp-card-str">
                                  {t}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          {s.diagImprovements.length > 0 ? (
                            <ul className="rp-card-list rp-card-list--imp">
                              {s.diagImprovements.map((t, i) => (
                                <li key={i} className="rp-card-imp">
                                  {t}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
            </div>
          </section>
        ) : null}

        {/* 4. 수료자 명단 */}
        <section className="rp-sec rp-break">
          <h2>{secNo.completers}. 수료자 명단</h2>
          {completers.length === 0 ? (
            <p className="rp-empty">아직 완주한 학생이 없습니다.</p>
          ) : (
            <table className="rp-table">
              <thead>
                <tr>
                  <th className="rp-num">No.</th>
                  <th>학생</th>
                  <th className="rp-num">모의면접</th>
                  <th className="rp-num">성공 가능성</th>
                  <th className="rp-num">수료증</th>
                </tr>
              </thead>
              <tbody>
                {completers.map((s, i) => (
                  <tr key={s.userId}>
                    <td className="rp-num">{i + 1}</td>
                    <td>{s.name || s.email}</td>
                    <td className="rp-num">{s.interviewPracticed}/3</td>
                    <td className={`rp-num ${s.successAfter !== null ? "rp-up" : ""}`}>{s.successAfter !== null ? `${s.successAfter}%` : "-"}</td>
                    <td className="rp-num">{s.certificateNo ? "발급" : "-"}</td>
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

        {/* 인쇄 전용 러닝 푸터 — 이력서/자소서 PDF처럼 매 페이지 하단에 로고 + 슬로건.
            (브라우저 기본 머리글/바닥글은 @page margin:0 으로 제거) */}
        <div className="rp-print-footer" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img_logo.webp" alt="Aply" />
          <span>커리어의 시작 · aply.global</span>
        </div>
      </article>
    </main>
  );
}
