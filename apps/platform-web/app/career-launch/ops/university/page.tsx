"use client";

// University Dashboard — 대학 B2B 판매·재계약용. 기수(대학 프로그램)별로
// University → Talent → Company → Hire 퍼널과 학생 성과 표를 한 화면에.
// 데이터는 기존 fetchCohortReport(성과 리포트)를 재사용하고 Verified(Talent Passport)만 얹었다.
import { useEffect, useMemo, useState } from "react";
import { fetchCohortReport, type CohortReport, type CohortReportStudent } from "../../../../lib/launch/ops-client";
import { fetchCohorts, type OpsCohort } from "../../../../lib/launch/enrollment-client";
import { useLaunchT } from "../../../../lib/launch/i18n";

function resultLabel(s: CohortReportStudent, t: ReturnType<typeof useLaunchT>): { text: string; bg: string; ink: string } {
  if (s.hired) return { text: t("입사", "Hired", "入职", "Đã tuyển", "入社", "Direkrut"), bg: "#E7F8EF", ink: "#0A9B59" };
  if (s.reachedOffer) return { text: t("오퍼", "Offer", "录用", "Offer", "オファー", "Offer"), bg: "#FBF2D6", ink: "#A97B00" };
  if (s.reachedInterview) return { text: t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara"), bg: "#EDF1FD", ink: "#0B46E8" };
  if (s.applications > 0) return { text: t("지원", "Applied", "已申请", "Ứng tuyển", "応募", "Melamar"), bg: "#F2F4F6", ink: "#4E5968" };
  return { text: "—", bg: "transparent", ink: "#B0B8C1" };
}

// 여러 기수 리포트를 대학 단위로 합산 — 화면이 쓰는 summary 합계 + 학생 concat.
function aggregateReports(reports: CohortReport[], university: string, isAll: boolean): CohortReport | null {
  if (!reports.length) return null;
  if (reports.length === 1 && !isAll) return reports[0];
  const students = reports.flatMap((r) => r.students);
  const sum = (f: keyof CohortReport["summary"]) => reports.reduce((a, r) => a + (Number(r.summary[f]) || 0), 0);
  const enrolled = sum("enrolled");
  const summary: CohortReport["summary"] = {
    ...reports[0].summary,
    enrolled,
    diagnosed: sum("diagnosed"),
    jobsSelected: sum("jobsSelected"),
    resumes: sum("resumes"),
    coverLetters: sum("coverLetters"),
    interviewAny: sum("interviewAny"),
    interviewAll: sum("interviewAll"),
    completed: sum("completed"),
    verified: sum("verified"),
    measured: sum("measured"),
    tracked: sum("tracked"),
    totalApplications: sum("totalApplications"),
    interviewedCount: sum("interviewedCount"),
    offerCount: sum("offerCount"),
    hiredCount: sum("hiredCount"),
    hireRate: enrolled ? Math.round((sum("hiredCount") / enrolled) * 100) : 0
  };
  return {
    ...reports[0],
    cohort: { id: "ALL", university, name: `전체 기수 (${reports.length})`, startsAt: null, endsAt: null, status: "active" },
    summary,
    students
  };
}

export default function UniversityDashboardPage() {
  const t = useLaunchT();
  const [cohorts, setCohorts] = useState<OpsCohort[]>([]);
  const [university, setUniversity] = useState<string>("");
  const [cohortId, setCohortId] = useState<string>("ALL"); // "ALL" = 대학 전체 롤업, 또는 특정 기수 id
  const [report, setReport] = useState<CohortReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const universities = useMemo(() => Array.from(new Set(cohorts.map((c) => c.university))).sort(), [cohorts]);
  const uniCohorts = useMemo(() => cohorts.filter((c) => c.university === university), [cohorts, university]);

  useEffect(() => {
    void fetchCohorts()
      .then((list) => {
        setCohorts(list);
        if (list.length) setUniversity(list[0].university);
      })
      .catch(() => setError(t("기수를 불러오지 못했어요.", "Couldn't load cohorts.", "无法加载期数。", "Không tải được khóa.", "コホートを読み込めませんでした。", "Gagal memuat batch.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 대학을 바꾸면 기본은 '전체 기수' 롤업.
  useEffect(() => {
    if (university) setCohortId("ALL");
  }, [university]);

  useEffect(() => {
    if (!university) return;
    const targets = cohortId === "ALL" ? uniCohorts.map((c) => c.id) : cohortId ? [cohortId] : [];
    if (!targets.length) {
      setReport(null);
      return;
    }
    setLoading(true);
    setError("");
    void Promise.all(targets.map((id) => fetchCohortReport(id)))
      .then((reports) => setReport(aggregateReports(reports, university, cohortId === "ALL")))
      .catch(() => setError(t("리포트를 불러오지 못했어요.", "Couldn't load the report.", "无法加载报告。", "Không tải được báo cáo.", "レポートを読み込めませんでした。", "Gagal memuat laporan.")))
      .finally(() => setLoading(false));
  }, [cohortId, university, uniCohorts]); // eslint-disable-line react-hooks/exhaustive-deps

  const funnel = useMemo(() => {
    if (!report) return [];
    const s = report.summary;
    return [
      { key: "students", label: t("학생", "Students", "学生", "Sinh viên", "学生", "Siswa"), value: s.enrolled, accent: false },
      { key: "started", label: t("진단 시작", "Started", "已开始", "Đã bắt đầu", "開始", "Mulai"), value: s.diagnosed, accent: false },
      { key: "completed", label: t("완주", "Completed", "已完成", "Hoàn thành", "完走", "Selesai"), value: s.completed, accent: false },
      { key: "verified", label: "Verified Talent", value: s.verified, accent: true },
      { key: "applications", label: t("지원", "Applications", "申请", "Ứng tuyển", "応募", "Lamaran"), value: s.totalApplications, accent: false },
      { key: "interviews", label: t("면접", "Interviews", "面试", "Phỏng vấn", "面接", "Wawancara"), value: s.interviewedCount, accent: false },
      { key: "offers", label: t("오퍼", "Offers", "录用", "Offer", "オファー", "Offer"), value: s.offerCount, accent: false },
      { key: "hired", label: t("입사", "Hired", "入职", "Đã tuyển", "入社", "Direkrut"), value: s.hiredCount, accent: true }
    ];
  }, [report, t]);

  return (
    <main className="pb-16 pt-6 md:pt-10">
      <section className="ops-content-section">
        <header className="mb-5">
          <h1>University Dashboard</h1>
          <p>{t("대학별 취업 성과를 한눈에 — 참여부터 검증·지원·면접·채용까지.", "Your university's outcomes at a glance — from participation to verification, applications, interviews, and hires.", "一览大学的就业成果——从参与到验证、申请、面试与录用。", "Kết quả của trường trong một cái nhìn — từ tham gia đến xác minh, ứng tuyển, phỏng vấn, tuyển dụng.", "大学の就職成果を一目で — 参加から検証・応募・面接・採用まで。", "Hasil universitas sekilas — dari partisipasi hingga verifikasi, lamaran, wawancara, dan rekrutmen.")}</p>
        </header>

        {/* 대학 + 기수(전체 롤업 포함) 선택 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 20 }}>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-faint)" }}>{t("대학", "University", "大学", "Trường", "大学", "Universitas")}</label>
          <select
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            style={{ height: 40, borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", padding: "0 12px", fontSize: 13.5, fontWeight: 600, minWidth: 200 }}
          >
            {universities.length === 0 ? <option value="">{t("대학 없음", "No universities", "无大学", "Không có trường", "大学なし", "Tidak ada")}</option> : null}
            {universities.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-faint)" }}>{t("기수", "Cohort", "期数", "Khóa", "コホート", "Batch")}</label>
          <select
            value={cohortId}
            onChange={(e) => setCohortId(e.target.value)}
            style={{ height: 40, borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", padding: "0 12px", fontSize: 13.5, fontWeight: 600, minWidth: 180 }}
          >
            <option value="ALL">{t("전체 기수", "All cohorts", "全部期数", "Tất cả khóa", "全コホート", "Semua batch")}</option>
            {uniCohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.enrolledCount})
              </option>
            ))}
          </select>
        </div>

        {error ? <p style={{ color: "var(--danger)", fontWeight: 600 }}>{error}</p> : null}
        {loading ? (
          <div className="ops-empty-card">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</div>
        ) : report ? (
          <>
            {/* 퍼널 — University → Talent → Company → Hire */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 24 }}>
              {funnel.map((f) => (
                <div
                  key={f.key}
                  style={{
                    borderRadius: 14,
                    border: `1px solid ${f.accent ? "rgba(11,70,232,0.25)" : "var(--line)"}`,
                    background: f.accent ? "var(--accent-soft)" : "var(--surface)",
                    padding: "14px 16px"
                  }}
                >
                  <p style={{ fontSize: 11.5, fontWeight: 700, color: f.accent ? "var(--accent-ink)" : "var(--ink-faint)" }}>{f.label}</p>
                  <p style={{ marginTop: 4, fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: f.accent ? "var(--accent-ink)" : "var(--ink)" }}>{f.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* 전환율 요약 */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24, fontSize: 12.5, color: "var(--ink-faint)" }}>
              <span>{t("완주율", "Completion", "完成率", "Tỷ lệ hoàn thành", "完走率", "Penyelesaian")}: <b style={{ color: "var(--ink)" }}>{report.summary.enrolled ? Math.round((report.summary.completed / report.summary.enrolled) * 100) : 0}%</b></span>
              <span>{t("검증율", "Verified rate", "验证率", "Tỷ lệ xác minh", "検証率", "Verifikasi")}: <b style={{ color: "var(--accent-ink)" }}>{report.summary.enrolled ? Math.round((report.summary.verified / report.summary.enrolled) * 100) : 0}%</b></span>
              <span>{t("채용율", "Hire rate", "录用率", "Tỷ lệ tuyển", "採用率", "Rekrut")}: <b style={{ color: "#0A9B59" }}>{report.summary.hireRate}%</b></span>
            </div>

            {/* 학생 성과 표 */}
            <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 12, background: "var(--surface)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--ink-faint)", borderBottom: "1px solid var(--line)" }}>
                    <th style={{ padding: "12px 14px", fontWeight: 700 }}>{t("학생", "Student", "学生", "Sinh viên", "学生", "Siswa")}</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700 }}>Career Launch</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "center" }}>Readiness</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "center" }}>{t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")}</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "center" }}>{t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara")}</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "center" }}>{t("지원", "Apply", "申请", "Ứng tuyển", "応募", "Lamar")}</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700 }}>{t("결과", "Result", "结果", "Kết quả", "結果", "Hasil")}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.students.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--ink-faint)" }}>{t("등록된 학생이 없어요.", "No enrolled students.", "无注册学生。", "Chưa có sinh viên.", "登録された学生がいません。", "Belum ada siswa.")}</td></tr>
                  ) : (
                    report.students.map((s) => {
                      const r = resultLabel(s, t);
                      return (
                        <tr key={s.userId} style={{ borderBottom: "1px solid var(--line)", color: "var(--ink)" }}>
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{ fontWeight: 600 }}>{s.name || "—"}</span>
                            {s.verified ? <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 6, background: "#E7F8EF", color: "#0A9B59", fontSize: 10.5, fontWeight: 800 }}>✓ Verified</span> : null}
                          </td>
                          <td style={{ padding: "11px 14px", color: "var(--ink-soft)" }}>{s.completed ? t("완주", "Completed", "完成", "Hoàn thành", "完走", "Selesai") : `${s.weeksCompleted}/4`}</td>
                          <td style={{ padding: "11px 14px", textAlign: "center", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{s.readiness}</td>
                          <td style={{ padding: "11px 14px", textAlign: "center", color: "var(--ink-soft)" }}>{s.hasResume ? "✓" : "—"}</td>
                          <td style={{ padding: "11px 14px", textAlign: "center", color: "var(--ink-soft)", fontVariantNumeric: "tabular-nums" }}>{s.interviewPracticed}/3</td>
                          <td style={{ padding: "11px 14px", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{s.applications}</td>
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{ padding: "2px 8px", borderRadius: 6, background: r.bg, color: r.ink, fontSize: 11.5, fontWeight: 800 }}>{r.text}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <p style={{ marginTop: 12, fontSize: 12, color: "var(--ink-faint)" }}>
              {t("Verified = Career Launch로 검증된(진단·이력서·경험 + Readiness) 인재. 기업에 추천 가능한 상태.", "Verified = talent validated via Career Launch (diagnosis·resume·experience + Readiness), ready to be shown to companies.", "Verified = 通过 Career Launch 验证的人才，可推荐给企业。", "Verified = nhân tài đã xác minh qua Career Launch, sẵn sàng giới thiệu cho doanh nghiệp.", "Verified = Career Launchで検証された人材。企業に推薦可能。", "Verified = talenta tervalidasi via Career Launch, siap ditunjukkan ke perusahaan.")}
            </p>
          </>
        ) : null}
      </section>
    </main>
  );
}
