"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchOpsStudents, studentProgress, type OpsStudent } from "../../../../lib/launch/ops-client";
import { useLaunchT } from "../../../../lib/launch/i18n";

// 운영자 리포트 — 학생 진행 데이터(실데이터)로 기수별 집계.
// 화면은 세 덩어리: (1) 집계 대상 + 핵심 지표, (2) 진행 퍼널(단계별 인원·완료율·이탈),
// (3) 기수별 비교. 예전엔 '단계별 완료율' 표와 '참여 퍼널'이 같은 수치를 두 번 보여줘서
// 하나로 합치고, 퍼널의 핵심인 '직전 단계 대비 이탈'을 더했다.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const avgDiag = diag.length ? Math.round(diag.reduce((n, s) => n + (s.diagnosisPercent ?? 0), 0) / diag.length) : 0;
    const avgProgress = total ? Math.round(filtered.reduce((n, s) => n + studentProgress(s).percent, 0) / total) : 0;
    const completed = filtered.filter((s) => s.interviewPracticed >= 3).length;
    const notStarted = filtered.filter((s) => studentProgress(s).done === 0).length;
    return { total, diag: diag.length, avgDiag, avgProgress, completed, notStarted };
  }, [filtered]);

  // 진행 퍼널 — 순서대로, 각 단계에 도달한 인원.
  const funnel = useMemo(() => {
    const f = filtered;
    const steps = [
      { id: "started", label: t("이용 시작", "Started", "开始使用", "Bắt đầu", "利用開始", "Mulai"), value: f.length },
      { id: "diagnosis", label: t("진단", "Diagnosis", "诊断", "Chẩn đoán", "診断", "Diagnosis"), value: f.filter((s) => s.diagnosisPercent !== null).length },
      { id: "jobs", label: t("직무 선정", "Job selection", "职务选定", "Chọn vị trí", "職務選定", "Pemilihan posisi"), value: f.filter((s) => s.selectedJobs > 0).length },
      { id: "materials", label: t("직무 정리", "Job info", "职务整理", "Tổng hợp công việc", "職務整理", "Rangkuman pekerjaan"), value: f.filter((s) => s.materials > 0).length },
      { id: "resume", label: t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"), value: f.filter((s) => s.hasResume).length },
      { id: "cover", label: t("자기소개서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter"), value: f.filter((s) => s.coverItems > 0).length },
      { id: "interviewAny", label: t("모의면접 시작", "Interview started", "开始模拟面试", "Bắt đầu phỏng vấn", "模擬面接 開始", "Wawancara dimulai"), value: f.filter((s) => s.interviewPracticed > 0).length },
      { id: "interviewAll", label: t("완주(면접 3라운드)", "Completed (3 rounds)", "完成(3轮)", "Hoàn thành (3 vòng)", "完走(3ラウンド)", "Selesai (3 ronde)"), value: f.filter((s) => s.interviewPracticed >= 3).length }
    ];
    const base = Math.max(1, steps[0].value);
    return steps.map((s, i) => {
      const prev = i === 0 ? s.value : steps[i - 1].value;
      const dropped = i === 0 ? 0 : Math.max(0, prev - s.value);
      return {
        ...s,
        rate: Math.round((s.value / base) * 100), // 전체 대비 도달률
        dropped,
        dropRate: i === 0 || prev === 0 ? 0 : Math.round((dropped / prev) * 100) // 직전 단계 대비 이탈률
      };
    });
  }, [filtered, t]);

  // 기수별 비교 — 전체 보기일 때만 의미가 있다.
  const cohortRows = useMemo(() => {
    const rows = cohorts.map((c) => {
      const list = students.filter((s) => s.cohort?.id === c.id);
      const n = list.length;
      const avg = n ? Math.round(list.reduce((acc, s) => acc + studentProgress(s).percent, 0) / n) : 0;
      return {
        id: c.id,
        label: `${c.university} · ${c.name}`,
        total: n,
        avg,
        resume: list.filter((s) => s.hasResume).length,
        cover: list.filter((s) => s.coverItems > 0).length,
        completed: list.filter((s) => s.interviewPracticed >= 3).length
      };
    });
    const unassigned = students.filter((s) => !s.cohort);
    if (unassigned.length) {
      const n = unassigned.length;
      rows.push({
        id: "none",
        label: t("미등록", "Unassigned", "未分配", "Chưa xếp khóa", "未登録", "Belum ditetapkan"),
        total: n,
        avg: Math.round(unassigned.reduce((acc, s) => acc + studentProgress(s).percent, 0) / n),
        resume: unassigned.filter((s) => s.hasResume).length,
        cover: unassigned.filter((s) => s.coverItems > 0).length,
        completed: unassigned.filter((s) => s.interviewPracticed >= 3).length
      });
    }
    return rows.sort((a, b) => b.avg - a.avg); // 진행률 높은 기수부터
  }, [cohorts, students, t]);

  const downloadCsv = () => {
    const head = [
      t("이름", "Name", "姓名", "Tên", "氏名", "Nama"),
      t("이메일", "Email", "邮箱", "Email", "メール", "Email"),
      t("기수", "Cohort", "期数", "Khóa", "コホート", "Batch"),
      t("진행률(%)", "Progress (%)", "进度(%)", "Tiến độ (%)", "進捗(%)", "Progres (%)"),
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
        studentProgress(s).percent,
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
    { id: "total", k: t("학생", "Students", "学生", "Sinh viên", "学生", "Siswa"), v: `${stats.total}${unit}`, tone: "ops-kpi-blue" },
    { id: "avg", k: t("평균 진행률", "Avg progress", "平均进度", "Tiến độ TB", "平均進捗", "Progres rata"), v: `${stats.avgProgress}%`, tone: "ops-kpi-blue" },
    { id: "notStarted", k: t("미시작", "Not started", "未开始", "Chưa bắt đầu", "未着手", "Belum mulai"), v: `${stats.notStarted}${unit}`, tone: "ops-kpi-amber" },
    { id: "completed", k: t("완주", "Completed", "已完成", "Hoàn thành", "完走", "Selesai"), v: `${stats.completed}${unit}`, tone: "ops-kpi-green" }
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
            {/* 1. 집계 대상 + 핵심 지표 */}
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
                    <button key={c.id} type="button" className={`ops-filter-chip ${filter === c.id ? "is-active" : ""}`} onClick={() => setFilter(c.id)}>
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
                <div className="ops-kpi-grid">
                  {summaryCards.map((s) => (
                    <div key={s.id} className={`ops-kpi-tile ${s.tone}`}>
                      <p className="ops-kpi-label">{s.k}</p>
                      <p className="ops-kpi-value">{s.v}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>

            {filtered.length > 0 ? (
              <>
                {/* 2. 진행 퍼널 — 단계별 인원·도달률·직전 대비 이탈 */}
                <article className="ops-partner-list-card">
                  <div className="ops-partner-list-top">
                    <h2>{t("진행 퍼널", "Progress funnel", "进度漏斗", "Phễu tiến độ", "進捗ファネル", "Funnel progres")}</h2>
                    <span className="ops-card-subtle">
                      {t("어느 단계에서 이탈하는지 확인하세요", "See where students drop off", "查看学生在哪一步流失", "Xem sinh viên rời bỏ ở bước nào", "どの段階で離脱するか確認しましょう", "Lihat di tahap mana siswa berhenti")}
                    </span>
                  </div>
                  <div className="ops-partner-table-wrap">
                    <table className="ops-partner-table">
                      <thead>
                        <tr>
                          <th>{t("단계", "Step", "步骤", "Bước", "ステップ", "Langkah")}</th>
                          <th>{t("인원", "Students", "人数", "Số người", "人数", "Siswa")}</th>
                          <th style={{ width: "45%" }}>{t("도달률(전체 대비)", "Reach (of all)", "到达率(占全部)", "Tỷ lệ đạt (trên tổng)", "到達率(全体比)", "Jangkauan (dari total)")}</th>
                          <th>{t("직전 단계 대비 이탈", "Drop-off from previous", "较上一步流失", "Rời bỏ so với bước trước", "前段階からの離脱", "Drop-off dari langkah sebelumnya")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {funnel.map((f, i) => {
                          const last = i === funnel.length - 1;
                          return (
                            <tr key={f.id}>
                              <td>
                                <strong style={{ color: last ? "#047857" : "#111827" }}>{f.label}</strong>
                              </td>
                              <td>
                                <strong>{f.value}</strong>
                                {unit}
                              </td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200 }}>
                                  <div style={{ flex: 1, height: 10, borderRadius: 999, background: "#f3f4f6", overflow: "hidden" }}>
                                    <div
                                      style={{
                                        width: `${f.rate}%`,
                                        height: "100%",
                                        borderRadius: 999,
                                        background: last ? "#047857" : "#1d4ed8"
                                      }}
                                    />
                                  </div>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "#111827", minWidth: 34, textAlign: "right" }}>{f.rate}%</span>
                                </div>
                              </td>
                              <td>
                                {i === 0 ? (
                                  <span style={{ color: "#9ca3af" }}>–</span>
                                ) : f.dropped === 0 ? (
                                  <span className="ops-status-badge ops-status-approved">
                                    {t("이탈 없음", "No drop-off", "无流失", "Không rời bỏ", "離脱なし", "Tidak ada")}
                                  </span>
                                ) : (
                                  <span className={`ops-status-badge ${f.dropRate >= 30 ? "ops-status-rejected" : "ops-status-pending"}`}>
                                    -{f.dropped}
                                    {unit} ({f.dropRate}%)
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </article>

                {/* 3. 기수별 비교 — 전체 보기일 때만 */}
                {filter === "all" && cohortRows.length > 1 ? (
                  <article className="ops-partner-list-card">
                    <div className="ops-partner-list-top">
                      <h2>{t("기수별 비교", "Cohort comparison", "各期对比", "So sánh theo khóa", "期別比較", "Perbandingan angkatan")}</h2>
                      <span className="ops-card-subtle">
                        {t("평균 진행률이 높은 기수부터", "Highest average progress first", "按平均进度从高到低", "Tiến độ trung bình cao nhất trước", "平均進捗の高い期から", "Progres rata-rata tertinggi dahulu")}
                      </span>
                    </div>
                    <div className="ops-partner-table-wrap">
                      <table className="ops-partner-table">
                        <thead>
                          <tr>
                            <th>{t("기수", "Cohort", "期数", "Khóa", "コホート", "Angkatan")}</th>
                            <th>{t("학생", "Students", "学生", "Sinh viên", "学生", "Siswa")}</th>
                            <th style={{ width: "30%" }}>{t("평균 진행률", "Avg progress", "平均进度", "Tiến độ TB", "平均進捗", "Progres rata")}</th>
                            <th>{t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")}</th>
                            <th>{t("자소서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter")}</th>
                            <th>{t("완주", "Completed", "已完成", "Hoàn thành", "完走", "Selesai")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cohortRows.map((r) => (
                            <tr key={r.id} className="ops-clickable-row" onClick={() => setFilter(r.id)}>
                              <td>
                                <strong>{r.label}</strong>
                              </td>
                              <td>
                                {r.total}
                                {unit}
                              </td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 140 }}>
                                  <div style={{ flex: 1, height: 8, borderRadius: 999, background: "#f3f4f6", overflow: "hidden" }}>
                                    <div style={{ width: `${r.avg}%`, height: "100%", borderRadius: 999, background: "#1d4ed8" }} />
                                  </div>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "#111827", minWidth: 34, textAlign: "right" }}>{r.avg}%</span>
                                </div>
                              </td>
                              <td>
                                {r.resume}/{r.total}
                              </td>
                              <td>
                                {r.cover}/{r.total}
                              </td>
                              <td>
                                <span className={`ops-status-badge ${r.completed > 0 ? "ops-status-approved" : "ops-status-draft"}`}>
                                  {r.completed}/{r.total}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
