"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchOpsStudents, type OpsStudent } from "../../../../lib/launch/ops-client";
import { Card, LaunchContainer, Pill, SectionTitle } from "../../../../components/launch/ui";
import { useLaunchT } from "../../../../lib/launch/i18n";

// 운영자 학생 관리 — 기수별로 필터해 진행 상태를 보고, 클릭 시 상세로 이동.
export default function LaunchOpsStudentsPage() {
  const t = useLaunchT();
  const [students, setStudents] = useState<OpsStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all"); // "all" | cohortId | "none"

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
    if (filter === "all") return students;
    if (filter === "none") return students.filter((s) => !s.cohort);
    return students.filter((s) => s.cohort?.id === filter);
  }, [students, filter]);

  const withResume = filtered.filter((s) => s.hasResume).length;
  const withCover = filtered.filter((s) => s.coverItems > 0).length;
  const diagDone = filtered.filter((s) => s.diagnosisPercent !== null).length;

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-6xl pt-6 md:pt-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">{t("학생 관리", "Student management", "学生管理", "Quản lý sinh viên", "学生管理", "Manajemen siswa")}</h1>
            <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t("기수별로 학생의 진행 상태를 보고 상세에서 피드백을 남겨요.", "View student progress by cohort and leave feedback on the detail page.", "按期数查看学生进度，并在详情页留下反馈。", "Xem tiến độ sinh viên theo khóa và để lại phản hồi ở trang chi tiết.", "コホート別に学生の進捗を確認し、詳細ページでフィードバックを残します。", "Lihat progres siswa per batch dan beri umpan balik di halaman detail.")}</p>
          </div>
          <Link
            href="/career-launch/dashboard"
            className="inline-flex flex-none items-center gap-1.5 rounded-xl border border-[#0B46E8]/25 bg-white px-3.5 py-2 text-[13px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]"
          >
            {t("학생 화면 체험하기 →", "Try the student view →", "体验学生界面 →", "Trải nghiệm giao diện sinh viên →", "学生画面を体験する →", "Coba tampilan siswa →")}
          </Link>
        </div>

        {/* 기수 필터 */}
        {!loading && (cohorts.length > 0 || hasUnassigned) ? (
          <div className="mb-5 flex flex-wrap gap-1.5">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>{t("전체", "All", "全部", "Tất cả", "全体", "Semua")} {students.length}</FilterChip>
            {cohorts.map((c) => (
              <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
                {c.university} · {c.name} {students.filter((s) => s.cohort?.id === c.id).length}
              </FilterChip>
            ))}
            {hasUnassigned ? (
              <FilterChip active={filter === "none"} onClick={() => setFilter("none")}>{t("미등록", "Unassigned", "未分配", "Chưa xếp khóa", "未登録", "Belum ditetapkan")} {students.filter((s) => !s.cohort).length}</FilterChip>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-4 gap-2.5 sm:max-w-lg">
          {[
            { id: "students", k: t("학생", "Students", "学生", "Sinh viên", "学生", "Siswa"), v: filtered.length },
            { id: "diagnosis", k: t("진단", "Diagnosis", "诊断", "Chẩn đoán", "診断", "Diagnosis"), v: diagDone },
            { id: "resume", k: t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"), v: withResume },
            { id: "cover", k: t("자소서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter"), v: withCover }
          ].map((s) => (
            <Card key={s.id} className="!p-4 text-center">
              <p className="text-[22px] font-black text-[#0B46E8]">{s.v}</p>
              <p className="mt-0.5 text-[11.5px] text-[#8B95A1]">{s.k}</p>
            </Card>
          ))}
        </div>

        <div className="mt-7">
          <SectionTitle sub={t("카드를 누르면 상세로 이동해요", "Tap a card to open the detail page", "点击卡片打开详情页", "Nhấn vào thẻ để mở trang chi tiết", "カードをタップすると詳細に移動します", "Ketuk kartu untuk membuka halaman detail")}>{t("학생 목록", "Student list", "学生列表", "Danh sách sinh viên", "学生一覧", "Daftar siswa")}</SectionTitle>
          {loading ? (
            <Card className="!p-6 text-center text-[14px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</Card>
          ) : error ? (
            <Card className="!p-6 text-center text-[14px] text-red-600">{error}</Card>
          ) : filtered.length === 0 ? (
            <Card className="!p-6 text-center text-[14px] text-[#8B95A1]">{t("해당 기수에 학생이 없어요.", "No students in this cohort.", "此期数没有学生。", "Không có sinh viên trong khóa này.", "このコホートに学生がいません。", "Tidak ada siswa di batch ini.")}</Card>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((st) => (
                <Link key={st.userId} href={`/career-launch/ops/students/${st.userId}`} className="block">
                  <Card className="h-full !p-4 transition hover:border-[#0B46E8]/40">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#EDF1FD] text-[13px] font-black text-[#0B46E8]">
                          {(st.name ?? st.email).charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold text-[#191F28]">{st.name ?? t("이름 미설정", "No name set", "未设置姓名", "Chưa đặt tên", "名前未設定", "Nama belum diatur")}</p>
                          <p className="truncate text-[12px] text-[#8B95A1]">{st.email}</p>
                        </div>
                      </div>
                      {st.diagnosisPercent !== null ? <Pill tone="blue">{t("진단", "Diagnosis", "诊断", "Chẩn đoán", "診断", "Diagnosis")} {st.diagnosisPercent}%</Pill> : null}
                    </div>
                    {st.cohort ? (
                      <p className="mt-2 truncate text-[11.5px] font-semibold text-[#0B46E8]">🎓 {st.cohort.university} · {st.cohort.name}</p>
                    ) : (
                      <p className="mt-2 text-[11.5px] font-semibold text-[#C9CDD2]">{t("기수 미등록", "Not assigned to a cohort", "未分配期数", "Chưa xếp khóa", "コホート未登録", "Belum ditetapkan ke batch")}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Sig on={st.selectedJobs > 0}>{t("직무", "Jobs", "职务", "Vị trí", "職務", "Posisi")} {st.selectedJobs}</Sig>
                      <Sig on={st.hasResume}>{t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")}</Sig>
                      <Sig on={st.coverItems > 0}>{t("자소서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter")} {st.coverItems}</Sig>
                      <Sig on={st.interviewPracticed > 0}>{t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara")} {st.interviewPracticed}/3</Sig>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </LaunchContainer>
    </main>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[12.5px] font-bold transition ${active ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E9ECF0]"}`}
    >
      {children}
    </button>
  );
}

// 진행 신호 배지 — 완료면 초록, 아니면 회색.
function Sig({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${on ? "bg-[#EAFFD1] text-[#3A6B00]" : "bg-[#F2F4F6] text-[#B0B8C1]"}`}>{children}</span>
  );
}
