"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchOpsStudents, type OpsStudent } from "../../../../lib/launch/ops-client";
import { useLaunchT } from "../../../../lib/launch/i18n";

// 운영자 리포트 — 학생 진행 데이터(실데이터)로 기수별 집계.
export default function LaunchOpsReportPage() {
  const t = useLaunchT();
  const [students, setStudents] = useState<OpsStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const list = await fetchOpsStudents();
        if (alive) setStudents(list);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : t("불러오지 못했어요.", "Couldn't load.", "加载失败。", "Không thể tải.", "読み込めませんでした。", "Gagal memuat."));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const cohorts = useMemo(() => {
    const map = new Map<string, { id: string; university: string; name: string }>();
    for (const s of students) if (s.cohort) map.set(s.cohort.id, s.cohort);
    return [...map.values()].sort((a, b) => `${a.university}${a.name}`.localeCompare(`${b.university}${b.name}`));
  }, [students]);

  const filtered = useMemo(() => {
    if (filter === "all") return students;
    if (filter === "none") return students.filter((s) => !s.cohort);
    return students.filter((s) => s.cohort?.id === filter);
  }, [students, filter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const diag = filtered.filter((s) => s.diagnosisPercent !== null);
    const jobs = filtered.filter((s) => s.selectedJobs > 0).length;
    const mats = filtered.filter((s) => s.materials > 0).length;
    const resume = filtered.filter((s) => s.hasResume).length;
    const cover = filtered.filter((s) => s.coverItems > 0).length;
    const interviewAny = filtered.filter((s) => s.interviewPracticed > 0).length;
    const interviewAll = filtered.filter((s) => s.interviewPracticed >= 3).length;
    const avgDiag = diag.length ? Math.round(diag.reduce((n, s) => n + (s.diagnosisPercent ?? 0), 0) / diag.length) : 0;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
    return { total, diag: diag.length, jobs, mats, resume, cover, interviewAny, interviewAll, avgDiag, pct };
  }, [filtered]);

  const funnel = [
    { id: "started", label: t("이용 시작", "Started", "开始使用", "Bắt đầu", "利用開始", "Mulai"), value: stats.total },
    { id: "diagnosis", label: t("진단", "Diagnosis", "诊断", "Chẩn đoán", "診断", "Diagnosis"), value: stats.diag },
    { id: "jobs", label: t("직무 선정", "Job selection", "职务选定", "Chọn vị trí", "職務選定", "Pemilihan posisi"), value: stats.jobs },
    { id: "materials", label: t("직무 정리", "Job info", "职务整理", "Tổng hợp công việc", "職務整理", "Rangkuman pekerjaan"), value: stats.mats },
    { id: "resume", label: t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"), value: stats.resume },
    { id: "cover", label: t("자기소개서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter"), value: stats.cover },
    { id: "interview", label: t("모의면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi"), value: stats.interviewAny }
  ];
  const maxFunnel = Math.max(1, funnel[0].value);

  // 단계별 완료율 테이블용 행 — 위 stats 집계를 그대로 사용한다.
  const stepRows = [
    { id: "diagnosis", label: t("진단", "Diagnosis", "诊断", "Chẩn đoán", "診断", "Diagnosis"), done: stats.diag },
    { id: "jobs", label: t("직무 선정", "Job selection", "职务选定", "Chọn vị trí", "職務選定", "Pemilihan posisi"), done: stats.jobs },
    { id: "materials", label: t("직무 정리", "Job info", "职务整理", "Tổng hợp công việc", "職務整理", "Rangkuman pekerjaan"), done: stats.mats },
    { id: "resume", label: t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"), done: stats.resume },
    { id: "cover", label: t("자기소개서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter"), done: stats.cover },
    { id: "interviewAny", label: t("모의면접(1라운드+)", "Mock interview (1+ round)", "模拟面试(1轮以上)", "Phỏng vấn thử (1 vòng trở lên)", "模擬面接(1ラウンド以上)", "Wawancara simulasi (1+ ronde)"), done: stats.interviewAny },
    { id: "interviewAll", label: t("완주(3라운드)", "Completed (3 rounds)", "完成(3轮)", "Hoàn thành (3 vòng)", "完走(3ラウンド)", "Selesai (3 ronde)"), done: stats.interviewAll }
  ];

  const downloadCsv = () => {
    const head = [
      t("이름", "Name", "姓名", "Tên", "氏名", "Nama"),
      t("이메일", "Email", "邮箱", "Email", "メール", "Email"),
      t("기수", "Cohort", "期数", "Khóa", "コホート", "Batch"),
      t("진단(%)", "Diagnosis (%)", "诊断(%)", "Chẩn đoán (%)", "診断(%)", "Diagnosis (%)"),
      t("직무", "Jobs", "职务", "Vị trí", "職務", "Posisi"),
      t("직무정리", "Job info", "职务整理", "Tổng hợp công việc", "職務整理", "Rangkuman pekerjaan"),
      t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"),
      t("자소서문항", "Cover letter items", "自我介绍题项", "Mục thư xin việc", "自己PR項目", "Item cover letter"),
      t("면접라운드", "Interview rounds", "面试轮次", "Vòng phỏng vấn", "面接ラウンド", "Ronde wawancara"),
      t("완료스텝", "Completed steps", "已完成步骤", "Bước hoàn thành", "完了ステップ", "Langkah selesai")
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = filtered.map((s) =>
      [
        s.name ?? "",
        s.email,
        s.cohort ? `${s.cohort.university} ${s.cohort.name}` : t("미등록", "Unassigned", "未分配", "Chưa xếp khóa", "未登録", "Belum ditetapkan"),
        s.diagnosisPercent ?? "",
        s.selectedJobs,
        s.materials,
        s.hasResume ? "O" : "",
        s.coverItems,
        `${s.interviewPracticed}/3`,
        s.doneSteps
      ].map(esc).join(",")
    );
    const csv = "﻿" + [head.map(esc).join(","), ...rows].join("\n"); // BOM(엑셀 한글)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const label = filter === "all" ? t("전체", "All", "全部", "TatCa", "全体", "Semua") : filter === "none" ? t("미등록", "Unassigned", "未分配", "ChuaXepKhoa", "未登録", "BelumDitetapkan") : cohorts.find((c) => c.id === filter)?.name ?? t("기수", "Cohort", "期数", "Khoa", "コホート", "Batch");
    a.href = url;
    a.download = `career-launch_${label}_${t("학생현황", "students", "学生情况", "sinh-vien", "学生状況", "siswa")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const unit = t("명", "", "人", "", "名", "");

  const summaryCards = [
    { id: "total", k: t("학생", "Students", "学生", "Sinh viên", "学生", "Siswa"), v: `${stats.total}${unit}` },
    { id: "completed", k: t("완주(면접 3라운드)", "Completed (3 interview rounds)", "完成（面试3轮）", "Hoàn thành (3 vòng phỏng vấn)", "完走(面接3ラウンド)", "Selesai (3 ronde wawancara)"), v: `${stats.interviewAll}${unit}` },
    { id: "resume_cover", k: t("이력서·자소서", "Resume · Cover letter", "简历·自我介绍", "CV · Thư xin việc", "履歴書・自己PR", "Resume · Cover letter"), v: `${stats.resume}·${stats.cover}${unit}` },
    { id: "avg", k: t("평균 준비도", "Avg. readiness", "平均准备度", "Mức sẵn sàng TB", "平均準備度", "Rata-rata kesiapan"), v: `${stats.avgDiag}%` }
  ];

  return (
    <main className="pb-16 pt-6 md:pt-10">
      <section className="ops-content-section">
        <header>
          <h1>{t("결과 리포트", "Results report", "结果报告", "Báo cáo kết quả", "結果レポート", "Laporan hasil")}</h1>
          <p>{t("Career Launch 실사용 데이터로 집계한 지표예요.", "Metrics compiled from real Career Launch usage data.", "根据 Career Launch 实际使用数据汇总的指标。", "Chỉ số tổng hợp từ dữ liệu sử dụng thực tế của Career Launch.", "Career Launch の実利用データで集計した指標です。", "Metrik yang dirangkum dari data penggunaan Career Launch yang sebenarnya.")}</p>
        </header>

        {loading ? (
          <div className="ops-empty-card">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</div>
        ) : error ? (
          <div className="ops-empty-card">
            <p className="ops-form-error">{error}</p>
          </div>
        ) : (
          <>
            <article className="ops-partner-list-card">
              <div className="ops-partner-list-top">
                <h2>{t("집계 대상", "Report scope", "统计范围", "Phạm vi thống kê", "集計対象", "Cakupan laporan")}</h2>
                {filtered.length > 0 ? (
                  <button type="button" className="ops-btn ops-btn-primary" onClick={downloadCsv}>
                    {t("CSV 내보내기", "Export CSV", "导出 CSV", "Xuất CSV", "CSV エクスポート", "Ekspor CSV")}
                  </button>
                ) : null}
              </div>

              {cohorts.length > 0 ? (
                <div className="ops-filter-chip-row">
                  <button type="button" className={`ops-filter-chip ${filter === "all" ? "is-active" : ""}`} onClick={() => setFilter("all")}>
                    {t("전체", "All", "全部", "Tất cả", "全体", "Semua")}
                    <span className="ops-filter-chip-count">{students.length}</span>
                  </button>
                  {cohorts.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`ops-filter-chip ${filter === c.id ? "is-active" : ""}`}
                      onClick={() => setFilter(c.id)}
                    >
                      {c.university} · {c.name}
                      <span className="ops-filter-chip-count">{students.filter((s) => s.cohort?.id === c.id).length}</span>
                    </button>
                  ))}
                  {students.some((s) => !s.cohort) ? (
                    <button type="button" className={`ops-filter-chip ${filter === "none" ? "is-active" : ""}`} onClick={() => setFilter("none")}>
                      {t("미등록", "Unassigned", "未分配", "Chưa xếp khóa", "未登録", "Belum ditetapkan")}
                      <span className="ops-filter-chip-count">{students.filter((s) => !s.cohort).length}</span>
                    </button>
                  ) : null}
                </div>
              ) : null}

              {filtered.length === 0 ? (
                <div className="ops-empty-card">{t("집계할 학생이 없어요.", "No students to report on.", "没有可统计的学生。", "Không có sinh viên để thống kê.", "集計対象の学生がいません。", "Tidak ada siswa untuk dilaporkan.")}</div>
              ) : (
                <div className="ops-card-grid">
                  {summaryCards.map((s) => (
                    <article key={s.id} className="ops-card">
                      <h3 className="ops-section-title">{s.k}</h3>
                      <p style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.01em", color: "#111827" }}>{s.v}</p>
                    </article>
                  ))}
                </div>
              )}
            </article>

            {filtered.length > 0 ? (
              <>
                <article className="ops-partner-list-card">
                  <div className="ops-partner-list-top">
                    <h2>{t("단계별 완료율", "Completion rate by step", "各步骤完成率", "Tỷ lệ hoàn thành theo bước", "ステップ別完了率", "Tingkat penyelesaian per langkah")}</h2>
                  </div>
                  <div className="ops-partner-table-wrap">
                    <table className="ops-partner-table">
                      <thead>
                        <tr>
                          <th>{t("단계", "Step", "步骤", "Bước", "ステップ", "Langkah")}</th>
                          <th>{t("완료 인원", "Completed", "完成人数", "Đã hoàn thành", "完了人数", "Selesai")}</th>
                          <th>{t("전체", "Total", "全部", "Tổng", "全体", "Total")}</th>
                          <th>{t("완료율", "Completion rate", "完成率", "Tỷ lệ hoàn thành", "完了率", "Tingkat penyelesaian")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stepRows.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="ops-table-empty">
                              {t("데이터가 없어요.", "No data.", "暂无数据。", "Không có dữ liệu.", "データがありません。", "Tidak ada data.")}
                            </td>
                          </tr>
                        ) : (
                          stepRows.map((row) => {
                            const p = stats.pct(row.done);
                            return (
                              <tr key={row.id}>
                                <td>{row.label}</td>
                                <td>
                                  {row.done}
                                  {unit}
                                </td>
                                <td>
                                  {stats.total}
                                  {unit}
                                </td>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 180 }}>
                                    <div style={{ flex: 1, height: 8, borderRadius: 999, background: "#f3f4f6", overflow: "hidden" }}>
                                      <div style={{ width: `${p}%`, height: "100%", borderRadius: 999, background: "#111827" }} />
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111827", minWidth: 34, textAlign: "right" }}>{p}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="ops-partner-list-card">
                  <div className="ops-partner-list-top">
                    <h2>{t("참여 퍼널", "Participation funnel", "参与漏斗", "Phễu tham gia", "参加ファネル", "Funnel partisipasi")}</h2>
                    <span className="ops-status-badge ops-status-draft">
                      {t("이용 → 진단 → 직무 → 이력서 → 자소서 → 면접", "Start → Diagnosis → Jobs → Resume → Cover letter → Interview", "开始 → 诊断 → 职务 → 简历 → 自我介绍 → 面试", "Bắt đầu → Chẩn đoán → Vị trí → CV → Thư xin việc → Phỏng vấn", "利用 → 診断 → 職務 → 履歴書 → 自己PR → 面接", "Mulai → Diagnosis → Posisi → Resume → Cover letter → Wawancara")}
                    </span>
                  </div>
                  <div className="ops-detail-sections">
                    <section className="ops-detail-section">
                      <h3>{t("단계별 인원", "Users by stage", "各阶段人数", "Số người theo giai đoạn", "段階別人数", "Pengguna per tahap")}</h3>
                      <div style={{ display: "grid", gap: 12 }}>
                        {funnel.map((f) => (
                          <div key={f.id}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                              <span style={{ fontWeight: 600, color: "#4b5563" }}>{f.label}</span>
                              <span style={{ fontWeight: 700, color: "#111827" }}>
                                {f.value}
                                {unit}
                              </span>
                            </div>
                            <div style={{ height: 24, width: "100%", borderRadius: 8, background: "#f3f4f6", overflow: "hidden" }}>
                              <div
                                style={{
                                  width: `${Math.max(12, (f.value / maxFunnel) * 100)}%`,
                                  height: "100%",
                                  borderRadius: 8,
                                  background: "#111827",
                                  color: "#fff",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  paddingRight: 8
                                }}
                              >
                                {Math.round((f.value / maxFunnel) * 100)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </article>
              </>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
