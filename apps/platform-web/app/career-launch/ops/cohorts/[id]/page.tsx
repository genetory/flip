"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchCohort, enrollStudent, unenrollStudent, deleteCohort, type OpsCohortDetail } from "../../../../../lib/launch/enrollment-client";
import { useLaunchT } from "../../../../../lib/launch/i18n";
import OutcomesPanel from "./OutcomesPanel";
import SeminarPanel from "./SeminarPanel";

// 운영자 기수 상세 — 초대코드 확인 + 학생 등록(이메일)/해제.
export default function LaunchOpsCohortDetailPage() {
  const t = useLaunchT();
  const params = useParams();
  const id = String((params as { id?: string })?.id ?? "");

  const [cohort, setCohort] = useState<OpsCohortDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
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
          <Link href="/career-launch/ops/cohorts" className="ops-card-subtle">
            {t("← 기수 관리", "← Cohort management", "← 期数管理", "← Quản lý khóa", "← コホート管理", "← Manajemen batch")}
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
                      <th>{t("액션", "Actions", "操作", "Hành động", "アクション", "Aksi")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohort.students.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="ops-table-empty">{t("아직 등록된 학생이 없어요.", "No students enrolled yet.", "还没有注册的学生。", "Chưa có sinh viên nào đăng ký.", "まだ登録された学生がいません。", "Belum ada siswa yang terdaftar.")}</td>
                      </tr>
                    ) : (
                      cohort.students.map((s) => (
                        <tr key={s.studentUserId}>
                          <td>{s.name ?? s.email}</td>
                          <td>{s.email}</td>
                          <td>{fmt(s.enrolledAt)}</td>
                          <td>
                            <button type="button" className="ops-detail-button" onClick={() => void remove(s.studentUserId)}>
                              {t("해제", "Remove", "解除", "Gỡ bỏ", "解除", "Lepaskan")}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            {/* 세미나 일정 */}
            <SeminarPanel cohortId={id} seminars={cohort.seminars} />

            {/* 성과 관리 — 취업·만족도·수료증 */}
            <OutcomesPanel cohortId={id} />
          </>
        )}
      </section>
    </main>
  );
}
