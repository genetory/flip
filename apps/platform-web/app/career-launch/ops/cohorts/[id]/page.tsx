"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchCohort, enrollStudent, unenrollStudent, deleteCohort, type OpsCohortDetail } from "../../../../../lib/launch/enrollment-client";
import { Card, LaunchContainer, Pill, SectionTitle } from "../../../../../components/launch/ui";
import { useLaunchT } from "../../../../../lib/launch/i18n";

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

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-6xl pt-6 md:pt-10">
        <Link href="/career-launch/ops/cohorts" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">{t("← 기수 관리", "← Cohort management", "← 期数管理", "← Quản lý khóa", "← コホート管理", "← Manajemen batch")}</Link>

        {loading ? (
          <Card className="mt-4 !p-6 text-center text-[13px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</Card>
        ) : !cohort ? (
          <Card className="mt-4 !p-6 text-center text-[14px] text-[#8B95A1]">{error || t("기수를 찾을 수 없어요.", "Cohort not found.", "找不到期数。", "Không tìm thấy khóa.", "コホートが見つかりません。", "Batch tidak ditemukan.")}</Card>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <h1 className="text-[20px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">{cohort.university} · {cohort.name}</h1>
                {cohort.status === "active" ? <Pill tone="green">{t("진행 중", "Active", "进行中", "Đang diễn ra", "進行中", "Aktif")}</Pill> : <Pill tone="grey">{t("종료", "Ended", "已结束", "Đã kết thúc", "終了", "Selesai")}</Pill>}
              </div>
              <button type="button" onClick={removeCohort} className="text-[12.5px] font-semibold text-[#E5484D] transition hover:underline">{t("기수 삭제", "Delete cohort", "删除期数", "Xóa khóa", "コホートを削除", "Hapus batch")}</button>
            </div>
            <p className="mt-1.5 text-[13.5px] text-[#4E5968]">
              {t("초대코드", "Invite code", "邀请码", "Mã mời", "招待コード", "Kode undangan")} <span className="font-black tracking-[0.1em] text-[#0B46E8]">{cohort.inviteCode}</span>
              <span className="ml-2 text-[12.5px] text-[#8B95A1]">{t("— 학생이 이 코드로 자가등록할 수 있어요", "— Students can self-enroll with this code", "— 学生可用此码自行注册", "— Sinh viên có thể tự đăng ký bằng mã này", "— 学生はこのコードで自己登録できます", "— Siswa dapat mendaftar sendiri dengan kode ini")}</span>
            </p>

            <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_1.4fr] lg:gap-8">
              {/* 학생 등록 */}
              <div>
                <SectionTitle sub={t("가입된 회원의 이메일로 바로 등록해요", "Enroll instantly with a registered member's email", "使用已注册会员的邮箱直接注册", "Đăng ký ngay bằng email của thành viên đã đăng ký", "登録済み会員のメールアドレスですぐに登録します", "Daftarkan langsung dengan email anggota terdaftar")}>{t("학생 등록", "Enroll student", "注册学生", "Đăng ký sinh viên", "学生登録", "Daftarkan siswa")}</SectionTitle>
                <Card className="md:!p-6">
                  <form onSubmit={add} className="space-y-2">
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={t("학생 이메일", "Student email", "学生邮箱", "Email sinh viên", "学生のメール", "Email siswa")} className="w-full rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[14px] focus:border-[#0B46E8] focus:outline-none" />
                    {addErr ? <p className="text-[12.5px] text-[#E5484D]">{addErr}</p> : null}
                    <button type="submit" disabled={!email.trim() || adding} className={`w-full rounded-xl py-2.5 text-[13.5px] font-bold transition ${email.trim() && !adding ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"}`}>
                      {adding ? t("등록 중…", "Enrolling…", "注册中…", "Đang đăng ký…", "登録中…", "Mendaftar…") : t("등록하기", "Enroll", "注册", "Đăng ký", "登録する", "Daftarkan")}
                    </button>
                  </form>
                </Card>
              </div>

              {/* 등록 학생 목록 */}
              <div>
                <SectionTitle>{t("등록 학생", "Enrolled students", "已注册学生", "Sinh viên đã đăng ký", "登録済み学生", "Siswa terdaftar")} <span className="text-[#0B46E8]">{cohort.students.length}{t("명", "", "人", "", "名", "")}</span></SectionTitle>
                {cohort.students.length === 0 ? (
                  <Card className="!p-6 text-center text-[13px] text-[#8B95A1]">{t("아직 등록된 학생이 없어요.", "No students enrolled yet.", "还没有注册的学生。", "Chưa có sinh viên nào đăng ký.", "まだ登録された学生がいません。", "Belum ada siswa yang terdaftar.")}</Card>
                ) : (
                  <div className="space-y-2">
                    {cohort.students.map((s) => (
                      <Card key={s.studentUserId} className="flex items-center justify-between !p-3.5">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold text-[#191F28]">{s.name ?? s.email}</p>
                          <p className="truncate text-[12.5px] text-[#8B95A1]">{s.email}</p>
                        </div>
                        <button type="button" onClick={() => remove(s.studentUserId)} className="shrink-0 rounded-lg border border-[#D7DCE3] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#8B95A1] transition hover:border-[#E5484D]/40 hover:text-[#E5484D]">
                          {t("해제", "Remove", "解除", "Gỡ bỏ", "解除", "Lepaskan")}
                        </button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </LaunchContainer>
    </main>
  );
}
