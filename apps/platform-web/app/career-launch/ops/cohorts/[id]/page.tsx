"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import { useParams, useRouter } from "next/navigation";
import { fetchCohort, enrollStudent, unenrollStudent, deleteCohort, setCohortWeek, type OpsCohortDetail, type CohortWeekOpen } from "../../../../../lib/launch/enrollment-client";
import { useLaunchT } from "../../../../../lib/launch/i18n";
import OutcomesPanel from "./OutcomesPanel";
import SeminarPanel from "./SeminarPanel";

// 운영자 기수 상세 — 초대코드 확인 + 학생 등록(이메일)/해제.
export default function LaunchOpsCohortDetailPage() {
  const t = useLaunchT();
  const params = useParams();
  const router = useRouter();
  const id = String((params as { id?: string })?.id ?? "");

  const [cohort, setCohort] = useState<OpsCohortDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<"students" | "seminar" | "outcome">("students");
  const [addErr, setAddErr] = useState("");

  const load = async () => {
    try {
      setCohort(await fetchCohort(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("불러오지 못했어요.", "Couldn't load.", "加载失败。", "Không thể tải.", "読み込めませんでした。", "Gagal memuat."));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (id) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || adding) return;
    setAdding(true);
    setAddErr("");
    try {
      await enrollStudent(id, email.trim());
      setEmail("");
      await load();
    } catch (e) {
      setAddErr(e instanceof Error ? e.message : t("등록에 실패했어요.", "Failed to enroll.", "注册失败。", "Đăng ký không thành công.", "登録に失敗しました。", "Gagal mendaftar."));
    } finally {
      setAdding(false);
    }
  };

  const remove = async (studentUserId: string) => {
    setCohort((prev) => (prev ? { ...prev, students: prev.students.filter((s) => s.studentUserId !== studentUserId) } : prev));
    try {
      await unenrollStudent(id, studentUserId);
    } catch {
      void load();
    }
  };

  const removeCohort = async () => {
    if (!confirm(t("이 기수를 삭제할까요? 등록 정보도 함께 삭제됩니다.", "Delete this cohort? Enrollment records will also be deleted.", "删除此期数吗？注册信息也将一并删除。", "Xóa khóa này? Thông tin đăng ký cũng sẽ bị xóa.", "このコホートを削除しますか？登録情報も一緒に削除されます。", "Hapus batch ini? Data pendaftaran juga akan dihapus."))) return;
    try {
      await deleteCohort(id);
      window.location.href = "/career-launch/ops/cohorts";
    } catch (e) {
      setError(e instanceof Error ? e.message : t("삭제에 실패했어요.", "Failed to delete.", "删除失败。", "Xóa không thành công.", "削除に失敗しました。", "Gagal menghapus."));
    }
  };

  const fmt = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "—");

  return (
    <main className="pb-16 pt-6 md:pt-10">
      <section className="ops-content-section">
        <header>
          <Link href="/career-launch/ops/cohorts" className="ops-card-subtle" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <ArrowLeft size={13} weight="bold" aria-hidden />
            {t("기수 관리", "Cohort management", "期数管理", "Quản lý khóa", "コホート管理", "Manajemen batch")}
          </Link>
          <h1>
            {cohort ? `${cohort.university} · ${cohort.name}` : t("기수 상세", "Cohort details", "期数详情", "Chi tiết khóa", "コホート詳細", "Detail batch")}
          </h1>
          <p>{t("초대코드로 학생이 자가등록할 수 있고, 이메일로 직접 등록할 수도 있어요.", "Students can self-enroll with the invite code, or you can enroll them directly by email.", "学生可用邀请码自行注册，也可以用邮箱直接注册。", "Sinh viên có thể tự đăng ký bằng mã mời, hoặc bạn có thể đăng ký trực tiếp bằng email.", "学生は招待コードで自己登録でき、メールで直接登録することもできます。", "Siswa dapat mendaftar sendiri dengan kode undangan, atau Anda dapat mendaftarkan langsung lewat email.")}</p>
        </header>

        {loading ? (
          <div className="ops-empty-card">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</div>
        ) : !cohort ? (
          <div className="ops-empty-card">{error || t("기수를 찾을 수 없어요.", "Cohort not found.", "找不到期数。", "Không tìm thấy khóa.", "コホートが見つかりません。", "Batch tidak ditemukan.")}</div>
        ) : (
          <>
            {/* 기수 정보 */}
            <article className="ops-partner-list-card">
              <div className="ops-partner-list-top">
                <h2>{t("기수 정보", "Cohort info", "期数信息", "Thông tin khóa", "コホート情報", "Info batch")}</h2>
                <button type="button" className="ops-btn ops-btn-danger" onClick={() => void removeCohort()}>
                  {t("기수 삭제", "Delete cohort", "删除期数", "Xóa khóa", "コホートを削除", "Hapus batch")}
                </button>
              </div>

              {error ? <p className="ops-form-error">{error}</p> : null}

              <div className="ops-detail-sections">
                <div className="ops-detail-section">
                  <div className="ops-detail-grid">
                    <div>
                      <span>{t("대학", "University", "大学", "Trường", "大学", "Universitas")}</span>
                      <strong>{cohort.university}</strong>
                    </div>
                    <div>
                      <span>{t("기수", "Cohort", "期数", "Khóa", "コホート", "Batch")}</span>
                      <strong>{cohort.name}</strong>
                    </div>
                    <div>
                      <span>{t("초대코드", "Invite code", "邀请码", "Mã mời", "招待コード", "Kode undangan")}</span>
                      <strong>{cohort.inviteCode}</strong>
                    </div>
                    <div>
                      <span>{t("기간", "Period", "期间", "Thời gian", "期間", "Periode")}</span>
                      <strong>{fmt(cohort.startsAt)} — {fmt(cohort.endsAt)}</strong>
                    </div>
                    <div>
                      <span>{t("상태", "Status", "状态", "Trạng thái", "ステータス", "Status")}</span>
                      <strong>
                        {cohort.status === "active" ? (
                          <span className="ops-status-badge ops-status-approved">{t("진행 중", "Active", "进行中", "Đang diễn ra", "進行中", "Aktif")}</span>
                        ) : (
                          <span className="ops-status-badge ops-status-closed">{t("종료", "Ended", "已结束", "Đã kết thúc", "終了", "Selesai")}</span>
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* 하위 탭 — 학생 / 세미나 / 성과 */}
            <div className="ops-detail-tabs" role="tablist" aria-label={t("기수 관리 탭", "Cohort tabs", "期数管理标签", "Tab quản lý khóa", "コホート管理タブ", "Tab manajemen batch")}>
              <button type="button" role="tab" aria-selected={tab === "students"} className={`ops-detail-tab ${tab === "students" ? "is-active" : ""}`} onClick={() => setTab("students")}>
                {t("학생", "Students", "学生", "Sinh viên", "学生", "Siswa")} ({cohort.students.length})
              </button>
              <button type="button" role="tab" aria-selected={tab === "seminar"} className={`ops-detail-tab ${tab === "seminar" ? "is-active" : ""}`} onClick={() => setTab("seminar")}>
                {t("세미나 일정", "Seminars", "研讨会", "Hội thảo", "セミナー", "Seminar")}
              </button>
              <button type="button" role="tab" aria-selected={tab === "outcome"} className={`ops-detail-tab ${tab === "outcome" ? "is-active" : ""}`} onClick={() => setTab("outcome")}>
                {t("성과 관리", "Outcomes", "成果管理", "Kết quả", "成果管理", "Hasil")}
              </button>
            </div>

            {tab === "students" ? (
              <>
            {/* 진행 요약 퍼널 */}
            <CohortFunnelCard students={cohort.students} />

            {/* 주차 오픈 일정 */}
            <WeekScheduleCard cohortId={id} weekSchedule={cohort.weekSchedule ?? []} />

            {/* 학생 등록 */}
            <article className="ops-partner-form-card">
              <h2>{t("학생 등록", "Enroll student", "注册学生", "Đăng ký sinh viên", "学生登録", "Daftarkan siswa")}</h2>
              <p>{t("가입된 회원의 이메일로 바로 등록해요", "Enroll instantly with a registered member's email", "使用已注册会员的邮箱直接注册", "Đăng ký ngay bằng email của thành viên đã đăng ký", "登録済み会員のメールアドレスですぐに登録します", "Daftarkan langsung dengan email anggota terdaftar")}</p>
              <form onSubmit={add} className="ops-partner-form">
                <div className="ops-partner-form-field">
                  <span className="ops-form-label">{t("학생 이메일", "Student email", "学生邮箱", "Email sinh viên", "学生のメール", "Email siswa")}</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder={t("학생 이메일", "Student email", "学生邮箱", "Email sinh viên", "学生のメール", "Email siswa")}
                  />
                </div>
                {addErr ? <p className="ops-form-error">{addErr}</p> : null}
                <div>
                  <button type="submit" className="ops-btn ops-btn-primary" disabled={!email.trim() || adding}>
                    {adding ? t("등록 중…", "Enrolling…", "注册中…", "Đang đăng ký…", "登録中…", "Mendaftar…") : t("등록하기", "Enroll", "注册", "Đăng ký", "登録する", "Daftarkan")}
                  </button>
                </div>
              </form>
            </article>

            {/* 등록 학생 목록 */}
            <article className="ops-partner-list-card">
              <div className="ops-partner-list-top">
                <h2>{t("등록 학생", "Enrolled students", "已注册学生", "Sinh viên đã đăng ký", "登録済み学生", "Siswa terdaftar")}</h2>
                <span className="ops-card-subtle">{cohort.students.length}</span>
              </div>

              <div className="ops-partner-table-wrap">
                <table className="ops-partner-table">
                  <thead>
                    <tr>
                      <th>{t("학생", "Student", "学生", "Sinh viên", "学生", "Siswa")}</th>
                      <th>{t("이메일", "Email", "邮箱", "Email", "メール", "Email")}</th>
                      <th>{t("등록일", "Enrolled at", "注册日", "Ngày đăng ký", "登録日", "Tanggal daftar")}</th>
                      <th>{t("진행", "Progress", "进度", "Tiến độ", "進捗", "Progres")}</th>
                      <th>{t("상태", "Status", "状态", "Trạng thái", "状態", "Status")}</th>
                      <th>{t("액션", "Actions", "操作", "Hành động", "アクション", "Aksi")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohort.students.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="ops-table-empty">{t("아직 등록된 학생이 없어요.", "No students enrolled yet.", "还没有注册的学生。", "Chưa có sinh viên nào đăng ký.", "まだ登録された学生がいません。", "Belum ada siswa yang terdaftar.")}</td>
                      </tr>
                    ) : (
                      cohort.students.map((s) => {
                        const pr = s.progress;
                        const steps = pr
                          ? [
                              { label: t("진단", "Diag", "诊断", "Chẩn", "診断", "Diag"), done: pr.diagnosed },
                              { label: t("이력서", "Resume", "简历", "CV", "履歴", "CV"), done: pr.hasResume },
                              { label: t("자소서", "Cover", "自荐", "Thư", "自己PR", "Surat"), done: pr.hasCover },
                              { label: `${t("면접", "Interview", "面试", "PV", "面接", "Wwc")} ${pr.interviewPracticed}/3`, done: pr.interviewPracticed > 0 }
                            ]
                          : [];
                        return (
                        <tr
                          key={s.studentUserId}
                          className="ops-clickable-row"
                          onClick={() => router.push(`/career-launch/ops/students/${s.studentUserId}`)}
                        >
                          <td>{s.name ?? s.email}</td>
                          <td>{s.email}</td>
                          <td>{fmt(s.enrolledAt)}</td>
                          <td>
                            {pr ? (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {steps.map((c, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      padding: "2px 7px",
                                      borderRadius: 999,
                                      background: c.done ? "#ecfdf5" : "#f3f4f6",
                                      color: c.done ? "#047857" : "#9ca3af",
                                      whiteSpace: "nowrap"
                                    }}
                                  >
                                    {c.done ? "✓ " : "· "}
                                    {c.label}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="ops-card-subtle">-</span>
                            )}
                          </td>
                          <td>
                            {pr?.completed ? (
                              <span className="ops-status-badge ops-status-approved">{t("완주", "Completed", "完成", "Hoàn tất", "完走", "Selesai")}</span>
                            ) : (
                              <span className="ops-status-badge">
                                {t("진행 중", "In progress", "进行中", "Đang tiến hành", "進行中", "Berlangsung")}
                                {pr ? ` · ${pr.weeksCompleted}/4${t("주", "w", "周", "t", "週", "mg")}` : ""}
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                              <Link className="ops-detail-button" href={`/career-launch/ops/students/${s.studentUserId}`}>
                                {t("상세", "Detail", "详情", "Chi tiết", "詳細", "Detail")}
                              </Link>
                              <button type="button" className="ops-detail-button" onClick={() => void remove(s.studentUserId)}>
                                {t("해제", "Remove", "解除", "Gỡ bỏ", "解除", "Lepaskan")}
                              </button>
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
              </>
            ) : null}

            {/* 세미나 일정 */}
            {tab === "seminar" ? <SeminarPanel cohortId={id} seminars={cohort.seminars} /> : null}

            {/* 성과 관리 — 취업·만족도·수료증 */}
            {tab === "outcome" ? <OutcomesPanel cohortId={id} /> : null}
          </>
        )}
      </section>
    </main>
  );
}

// ISO(UTC) → datetime-local 입력값(브라우저 로컬 시각). 한국 운영자는 브라우저가 KST라 그대로 KST.
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 기수 주차 오픈 일정 — 각 주차 오픈일 지정 + 강제 오픈 토글.
function WeekScheduleCard({ cohortId, weekSchedule }: { cohortId: string; weekSchedule: CohortWeekOpen[] }) {
  const t = useLaunchT();
  const initial: Record<number, { opensAt: string; forceOpen: boolean }> = {};
  for (const w of [1, 2, 3, 4]) {
    const e = weekSchedule.find((x) => x.week === w);
    initial[w] = { opensAt: toLocalInput(e?.opensAt ?? null), forceOpen: e?.forceOpen ?? false };
  }
  const [rows, setRows] = useState(initial);
  const [savingWeek, setSavingWeek] = useState<number | null>(null);
  const [savedWeek, setSavedWeek] = useState<number | null>(null);

  const save = async (week: number) => {
    setSavingWeek(week);
    setSavedWeek(null);
    try {
      const r = rows[week];
      await setCohortWeek(cohortId, week, {
        opensAt: r.opensAt ? new Date(r.opensAt).toISOString() : null,
        forceOpen: r.forceOpen
      });
      setSavedWeek(week);
      setTimeout(() => setSavedWeek((v) => (v === week ? null : v)), 2000);
    } catch {
      // 무시
    } finally {
      setSavingWeek(null);
    }
  };

  return (
    <article className="ops-partner-form-card">
      <h2>{t("주차 오픈 일정", "Week open schedule", "周次开放日程", "Lịch mở tuần", "週次オープン日程", "Jadwal buka minggu")}</h2>
      <p>{t("주차별 오픈일을 정하면 그 날짜에 자동으로 열려요. '지금 열기'로 즉시 열 수도 있어요.", "Set an open date per week to auto-unlock; use 'Open now' to unlock immediately.", "设置每周开放日期后将自动开放；也可用“立即开放”。", "Đặt ngày mở cho từng tuần để tự mở; hoặc 'Mở ngay'.", "週ごとにオープン日を設定すると自動で開きます。「今すぐ開く」で即時オープンも可能。", "Atur tanggal buka per minggu; atau 'Buka sekarang'.")}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
        {[1, 2, 3, 4].map((w) => (
          <div key={w} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ minWidth: 52, fontWeight: 700, fontSize: 13 }}>{t(`${w}주차`, `Week ${w}`, `第${w}周`, `Tuần ${w}`, `${w}週`, `Minggu ${w}`)}</span>
            <input
              type="datetime-local"
              value={rows[w].opensAt}
              onChange={(e) => setRows((prev) => ({ ...prev, [w]: { ...prev[w], opensAt: e.target.value } }))}
              disabled={rows[w].forceOpen}
              className="ops-input"
              style={{ maxWidth: 220 }}
            />
            <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#4E5968" }}>
              <input
                type="checkbox"
                checked={rows[w].forceOpen}
                onChange={(e) => setRows((prev) => ({ ...prev, [w]: { ...prev[w], forceOpen: e.target.checked } }))}
              />
              {t("지금 열기(강제)", "Open now (force)", "立即开放", "Mở ngay", "今すぐ開く", "Buka sekarang")}
            </label>
            <button type="button" className="ops-btn ops-btn-primary" onClick={() => void save(w)} disabled={savingWeek === w}>
              {savingWeek === w ? t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…") : t("저장", "Save", "保存", "Lưu", "保存", "Simpan")}
            </button>
            {savedWeek === w ? <span style={{ fontSize: 12, color: "#15C47E", fontWeight: 600 }}>✓ {t("저장됨", "Saved", "已保存", "Đã lưu", "保存済み", "Tersimpan")}</span> : null}
          </div>
        ))}
      </div>
    </article>
  );
}

// 기수 진행 요약 퍼널 — 등록 → 진단 → 직무선정 → 이력서 → 자소서 → 모의면접 → 완주 단계별 인원/비율.
function CohortFunnelCard({ students }: { students: OpsCohortDetail["students"] }) {
  const t = useLaunchT();
  const n = students.length;
  const has = (fn: (p: NonNullable<OpsCohortDetail["students"][number]["progress"]>) => boolean) =>
    students.filter((s) => s.progress && fn(s.progress)).length;
  const steps = [
    { label: t("등록", "Enrolled", "注册", "Đăng ký", "登録", "Terdaftar"), count: n },
    { label: t("취업 진단", "Diagnosis", "求职诊断", "Chẩn đoán", "就活診断", "Diagnosis"), count: has((p) => p.diagnosed) },
    { label: t("직무 선정", "Job select", "职务选定", "Chọn vị trí", "職務選定", "Pilih posisi"), count: has((p) => p.selectedJobs > 0) },
    { label: t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"), count: has((p) => p.hasResume) },
    { label: t("자기소개서", "Cover", "自荐信", "Thư", "自己PR", "Surat"), count: has((p) => p.hasCover) },
    { label: t("모의면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara"), count: has((p) => p.interviewPracticed > 0) },
    { label: t("완주", "Completed", "完成", "Hoàn tất", "完走", "Selesai"), count: has((p) => p.completed) }
  ];
  const pct = (c: number) => (n ? Math.round((c / n) * 100) : 0);
  return (
    <article className="ops-partner-list-card">
      <div className="ops-partner-list-top">
        <h2>{t("진행 요약", "Funnel", "进度概览", "Tổng quan", "進捗サマリー", "Ringkasan")}</h2>
        <span className="ops-card-subtle">{t(`등록 ${n}명`, `${n} enrolled`, `注册 ${n} 人`, `${n} đăng ký`, `登録 ${n}名`, `${n} terdaftar`)}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${steps.length}, minmax(0,1fr))`, gap: 8, marginTop: 6 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ border: "1px solid #eef1f5", borderRadius: 10, padding: "12px 10px", textAlign: "center", background: "#fbfcfe" }}>
            <div style={{ fontSize: 11.5, color: "#8B95A1", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#191F28", marginTop: 4, lineHeight: 1.1 }}>{s.count}</div>
            <div style={{ fontSize: 11, color: "#0B46E8", fontWeight: 700 }}>{pct(s.count)}%</div>
            <div style={{ height: 4, borderRadius: 999, background: "#eef1f5", marginTop: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct(s.count)}%`, background: "#0B46E8" }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
