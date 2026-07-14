"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchOpsStudents, studentProgress, type OpsStudent } from "../../../../lib/launch/ops-client";
import { useLaunchT } from "../../../../lib/launch/i18n";

// 운영자 학생 관리 — 기수별로 필터해 진행 상태를 보고, 클릭 시 상세로 이동.
export default function LaunchOpsStudentsPage() {
  const t = useLaunchT();
  const router = useRouter();
  const [students, setStudents] = useState<OpsStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all"); // "all" | cohortId | "none"
  const [sort, setSort] = useState<"recent" | "progress">("recent");

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

  // 학생들에게서 나타난 기수 목록(필터용).
  const cohorts = useMemo(() => {
    const map = new Map<string, { id: string; university: string; name: string }>();
    for (const s of students) if (s.cohort) map.set(s.cohort.id, s.cohort);
    return [...map.values()].sort((a, b) => `${a.university}${a.name}`.localeCompare(`${b.university}${b.name}`));
  }, [students]);
  const hasUnassigned = students.some((s) => !s.cohort);

  const filtered = useMemo(() => {
    const base =
      filter === "all" ? students : filter === "none" ? students.filter((s) => !s.cohort) : students.filter((s) => s.cohort?.id === filter);
    if (sort === "progress") {
      // 진행률 낮은 순 — 뒤처진 학생을 위로.
      return [...base].sort((a, b) => studentProgress(a).done - studentProgress(b).done);
    }
    return base; // 기본: 백엔드가 최근 활동순으로 정렬해 반환.
  }, [students, filter, sort]);

  const withResume = filtered.filter((s) => s.hasResume).length;
  const withCover = filtered.filter((s) => s.coverItems > 0).length;
  const diagDone = filtered.filter((s) => s.diagnosisPercent !== null).length;

  const summary = [
    { id: "students", k: t("학생", "Students", "学生", "Sinh viên", "学生", "Siswa"), v: filtered.length, tone: "ops-kpi-blue" },
    { id: "diagnosis", k: t("진단", "Diagnosis", "诊断", "Chẩn đoán", "診断", "Diagnosis"), v: diagDone, tone: "ops-kpi-blue" },
    { id: "resume", k: t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"), v: withResume, tone: "ops-kpi-green" },
    { id: "cover", k: t("자소서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter"), v: withCover, tone: "ops-kpi-green" }
  ];

  const detailLabel = t("상세정보", "Details", "详情", "Chi tiết", "詳細", "Detail");

  return (
    <main className="pb-16 pt-6 md:pt-10">
      <section className="ops-content-section">
        <header>
          <h1>{t("학생 관리", "Student management", "学生管理", "Quản lý sinh viên", "学生管理", "Manajemen siswa")}</h1>
          <p>{t("기수별로 학생의 진행 상태를 보고 상세에서 피드백을 남겨요.", "View student progress by cohort and leave feedback on the detail page.", "按期数查看学生进度，并在详情页留下反馈。", "Xem tiến độ sinh viên theo khóa và để lại phản hồi ở trang chi tiết.", "コホート別に学生の進捗を確認し、詳細ページでフィードバックを残します。", "Lihat progres siswa per batch dan beri umpan balik di halaman detail.")}</p>
        </header>

        <div className="ops-kpi-grid">
          {summary.map((s) => (
            <div key={s.id} className={`ops-kpi-tile ${s.tone}`}>
              <p className="ops-kpi-label">{s.k}</p>
              <p className="ops-kpi-value">{s.v}</p>
            </div>
          ))}
        </div>

        <article className="ops-partner-list-card">
          <div className="ops-partner-list-top">
            <h2>{t("학생 목록", "Student list", "学生列表", "Danh sách sinh viên", "学生一覧", "Daftar siswa")}</h2>
            <button
              type="button"
              className="ops-detail-button"
              onClick={() => setSort((s) => (s === "recent" ? "progress" : "recent"))}
            >
              {sort === "progress" ? t("진행률 낮은 순", "Least progress first", "进度最低优先", "Tiến độ thấp trước", "進捗が低い順", "Progres terendah dahulu") : t("최근 활동순", "Recent activity", "最近活动", "Hoạt động gần đây", "最近の活動順", "Aktivitas terbaru")}
            </button>
          </div>

          {/* 기수 필터 */}
          {!loading && (cohorts.length > 0 || hasUnassigned) ? (
            <div className="ops-filter-chip-row">
              <button
                type="button"
                className={`ops-filter-chip ${filter === "all" ? "is-active" : ""}`}
                onClick={() => setFilter("all")}
              >
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
              {hasUnassigned ? (
                <button
                  type="button"
                  className={`ops-filter-chip ${filter === "none" ? "is-active" : ""}`}
                  onClick={() => setFilter("none")}
                >
                  {t("미등록", "Unassigned", "未分配", "Chưa xếp khóa", "未登録", "Belum ditetapkan")}
                  <span className="ops-filter-chip-count">{students.filter((s) => !s.cohort).length}</span>
                </button>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="ops-form-error">{error}</p> : null}

          <div className="ops-partner-table-wrap">
            <table className="ops-partner-table">
              <thead>
                <tr>
                  <th>{t("학생", "Student", "学生", "Sinh viên", "学生", "Siswa")}</th>
                  <th>{t("기수", "Cohort", "期数", "Khóa", "コホート", "Batch")}</th>
                  <th>{t("진행률", "Progress", "进度", "Tiến độ", "進捗", "Progres")}</th>
                  <th>{t("진단", "Diagnosis", "诊断", "Chẩn đoán", "診断", "Diagnosis")}</th>
                  <th>{t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")}</th>
                  <th>{t("자소서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter")}</th>
                  <th>{t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara")}</th>
                  <th>{detailLabel}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="ops-table-empty">
                      {t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="ops-table-empty">{error}</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="ops-table-empty">
                      {t("해당 기수에 학생이 없어요.", "No students in this cohort.", "此期数没有学生。", "Không có sinh viên trong khóa này.", "このコホートに学生がいません。", "Tidak ada siswa di batch ini.")}
                    </td>
                  </tr>
                ) : (
                  filtered.map((st) => {
                    const prog = studentProgress(st);
                    const done = prog.done === prog.total;
                    return (
                      <tr
                        key={st.userId}
                        className="ops-clickable-row"
                        onClick={() => router.push(`/career-launch/ops/students/${st.userId}`)}
                      >
                        <td>
                          <span className="block font-bold text-[#191F28]">
                            {st.name ?? t("이름 미설정", "No name set", "未设置姓名", "Chưa đặt tên", "名前未設定", "Nama belum diatur")}
                          </span>
                          <span className="block text-[12px] text-[#8B95A1]">{st.email}</span>
                        </td>
                        <td>
                          {st.cohort ? (
                            `${st.cohort.university} · ${st.cohort.name}`
                          ) : (
                            <span className="ops-status-badge ops-status-draft">
                              {t("기수 미등록", "Not assigned to a cohort", "未分配期数", "Chưa xếp khóa", "コホート未登録", "Belum ditetapkan ke batch")}
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
                            <span
                              style={{
                                position: "relative",
                                display: "block",
                                flex: 1,
                                height: 6,
                                borderRadius: 999,
                                background: "#EEF1F5",
                                overflow: "hidden"
                              }}
                            >
                              <span
                                style={{
                                  display: "block",
                                  height: "100%",
                                  width: `${prog.percent}%`,
                                  borderRadius: 999,
                                  background: done ? "#3A6B00" : "#0B46E8"
                                }}
                              />
                            </span>
                            <span style={{ flex: "none", fontWeight: 700, color: "#4E5968" }}>
                              {prog.done}/{prog.total}
                            </span>
                          </span>
                        </td>
                        <td>
                          <span className={`ops-status-badge ${st.diagnosisPercent !== null ? "ops-status-approved" : "ops-status-draft"}`}>
                            {st.diagnosisPercent !== null
                              ? t("완료", "Done", "已完成", "Hoàn thành", "完了", "Selesai")
                              : t("미완료", "Not done", "未完成", "Chưa xong", "未完了", "Belum")}
                          </span>
                        </td>
                        <td>
                          <span className={`ops-status-badge ${st.hasResume ? "ops-status-approved" : "ops-status-draft"}`}>
                            {st.hasResume
                              ? t("완료", "Done", "已完成", "Hoàn thành", "完了", "Selesai")
                              : t("미완료", "Not done", "未完成", "Chưa xong", "未完了", "Belum")}
                          </span>
                        </td>
                        <td>
                          <span className={`ops-status-badge ${st.coverItems > 0 ? "ops-status-approved" : "ops-status-draft"}`}>
                            {st.coverItems > 0
                              ? `${t("완료", "Done", "已完成", "Hoàn thành", "完了", "Selesai")} ${st.coverItems}`
                              : t("미완료", "Not done", "未完成", "Chưa xong", "未完了", "Belum")}
                          </span>
                        </td>
                        <td>
                          <span className={`ops-status-badge ${st.interviewPracticed > 0 ? "ops-status-approved" : "ops-status-draft"}`}>
                            {st.interviewPracticed}/3
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <Link className="ops-detail-button" href={`/career-launch/ops/students/${st.userId}`}>
                            {detailLabel}
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  );
}
