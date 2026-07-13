"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCohorts, createCohort, updateCohort, type OpsCohort } from "../../../../lib/launch/enrollment-client";
import { Card, LaunchContainer, Pill, SectionTitle } from "../../../../components/launch/ui";
import { useLaunchT } from "../../../../lib/launch/i18n";

// 운영자 기수 관리 — 대학·기수 단위로 생성/관리. 등록된 학생만 프로그램에 접근한다.
export default function LaunchOpsCohortsPage() {
  const t = useLaunchT();
  const [cohorts, setCohorts] = useState<OpsCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [university, setUniversity] = useState("");
  const [name, setName] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      setCohorts(await fetchCohorts());
    } catch (e) {
      setError(e instanceof Error ? e.message : t("불러오지 못했어요.", "Couldn't load.", "加载失败。", "Không thể tải.", "読み込めませんでした。", "Gagal memuat."));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!university.trim() || !name.trim() || creating) return;
    setCreating(true);
    setError("");
    try {
      await createCohort({
        university: university.trim(),
        name: name.trim(),
        startsAt: starts ? new Date(starts).toISOString() : undefined,
        endsAt: ends ? new Date(ends).toISOString() : undefined
      });
      setUniversity("");
      setName("");
      setStarts("");
      setEnds("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("생성에 실패했어요.", "Failed to create.", "创建失败。", "Tạo không thành công.", "作成に失敗しました。", "Gagal membuat."));
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (c: OpsCohort) => {
    const next = c.status === "active" ? "ended" : "active";
    setCohorts((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: next } : x)));
    try {
      await updateCohort(c.id, { status: next });
    } catch {
      void load();
    }
  };

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-6xl pt-6 md:pt-10">
        <div className="mb-6">
          <h1 className="text-[20px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">{t("기수 관리", "Cohort management", "期数管理", "Quản lý khóa", "コホート管理", "Manajemen batch")}</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t("대학·기수 단위로 운영해요. 등록된 학생만 Career Launch에 접근할 수 있어요.", "Run the program by university and cohort. Only enrolled students can access Career Launch.", "按大学和期数运营。只有已注册的学生才能访问 Career Launch。", "Vận hành theo trường và khóa. Chỉ sinh viên đã đăng ký mới có thể truy cập Career Launch.", "大学・コホート単位で運営します。登録された学生のみ Career Launch にアクセスできます。", "Kelola per universitas dan batch. Hanya siswa terdaftar yang dapat mengakses Career Launch.")}</p>
        </div>

        {/* 기수 생성 */}
        <Card className="mb-7 md:!p-6">
          <SectionTitle sub={t("대학명과 기수를 입력하면 초대코드가 자동 발급돼요", "Enter a university and cohort to auto-generate an invite code", "输入大学名称和期数即可自动生成邀请码", "Nhập tên trường và khóa để tự động tạo mã mời", "大学名とコホートを入力すると招待コードが自動発行されます", "Masukkan nama universitas dan batch untuk membuat kode undangan otomatis")}>{t("새 기수 만들기", "Create new cohort", "创建新期数", "Tạo khóa mới", "新しいコホートを作成", "Buat batch baru")}</SectionTitle>
          <form onSubmit={submit} className="grid gap-2.5 sm:grid-cols-2">
            <input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder={t("대학명 (예: 고려대학교)", "University (e.g., Korea University)", "大学名称（例：高丽大学）", "Tên trường (vd: Đại học Korea)", "大学名（例：高麗大学）", "Nama universitas (mis. Korea University)")} className="rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[14px] focus:border-[#0B46E8] focus:outline-none" />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("기수 (예: 2기)", "Cohort (e.g., Batch 2)", "期数（例：第2期）", "Khóa (vd: Khóa 2)", "コホート（例：2期）", "Batch (mis. Batch 2)")} className="rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[14px] focus:border-[#0B46E8] focus:outline-none" />
            <label className="flex items-center gap-2 text-[12.5px] text-[#8B95A1]">{t("시작", "Start", "开始", "Bắt đầu", "開始", "Mulai")}<input type="date" value={starts} onChange={(e) => setStarts(e.target.value)} className="flex-1 rounded-xl border border-[#E5E8EB] bg-white px-3 py-2.5 text-[13px] focus:border-[#0B46E8] focus:outline-none" /></label>
            <label className="flex items-center gap-2 text-[12.5px] text-[#8B95A1]">{t("종료", "End", "结束", "Kết thúc", "終了", "Selesai")}<input type="date" value={ends} onChange={(e) => setEnds(e.target.value)} className="flex-1 rounded-xl border border-[#E5E8EB] bg-white px-3 py-2.5 text-[13px] focus:border-[#0B46E8] focus:outline-none" /></label>
            <div className="sm:col-span-2">
              <button type="submit" disabled={!university.trim() || !name.trim() || creating} className={`rounded-xl px-5 py-2.5 text-[13.5px] font-bold transition ${university.trim() && name.trim() && !creating ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"}`}>
                {creating ? t("만드는 중…", "Creating…", "创建中…", "Đang tạo…", "作成中…", "Membuat…") : t("기수 만들기", "Create cohort", "创建期数", "Tạo khóa", "コホートを作成", "Buat batch")}
              </button>
            </div>
          </form>
        </Card>

        <SectionTitle sub={t("카드를 누르면 상세·학생 등록으로 이동해요", "Tap a card to view details and enroll students", "点击卡片查看详情并注册学生", "Nhấn vào thẻ để xem chi tiết và đăng ký sinh viên", "カードをタップすると詳細・学生登録に移動します", "Ketuk kartu untuk melihat detail dan mendaftarkan siswa")}>{t("기수 목록", "Cohort list", "期数列表", "Danh sách khóa", "コホート一覧", "Daftar batch")}</SectionTitle>
        {error ? <p className="mb-3 text-[13px] text-[#E5484D]">{error}</p> : null}
        {loading ? (
          <Card className="!p-6 text-center text-[13px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</Card>
        ) : cohorts.length === 0 ? (
          <Card className="!p-6 text-center text-[14px] text-[#8B95A1]">{t("아직 기수가 없어요. 위에서 새 기수를 만들어 주세요.", "No cohorts yet. Create a new one above.", "还没有期数。请在上方创建一个新期数。", "Chưa có khóa nào. Hãy tạo khóa mới ở trên.", "まだコホートがありません。上で新しいコホートを作成してください。", "Belum ada batch. Buat batch baru di atas.")}</Card>
        ) : (
          <div className="space-y-2.5">
            {cohorts.map((c) => (
              <Card key={c.id} className="!p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link href={`/career-launch/ops/cohorts/${c.id}`} className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15px] font-black text-[#0B1227]">{c.university} · {c.name}</p>
                      {c.status === "active" ? <Pill tone="green">{t("진행 중", "Active", "进行中", "Đang diễn ra", "進行中", "Aktif")}</Pill> : <Pill tone="grey">{t("종료", "Ended", "已结束", "Đã kết thúc", "終了", "Selesai")}</Pill>}
                    </div>
                    <p className="mt-1 text-[12.5px] text-[#8B95A1]">
                      {t("초대코드", "Invite code", "邀请码", "Mã mời", "招待コード", "Kode undangan")} <span className="font-bold tracking-[0.08em] text-[#0B46E8]">{c.inviteCode}</span> · {t("등록", "Enrolled", "已注册", "Đã đăng ký", "登録", "Terdaftar")} {c.enrolledCount}{t("명", "", "人", "", "名", "")}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => toggleStatus(c)} className="rounded-lg border border-[#D7DCE3] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40">
                      {c.status === "active" ? t("종료로 전환", "Mark as ended", "标记为结束", "Chuyển sang kết thúc", "終了に変更", "Tandai selesai") : t("다시 진행", "Reactivate", "重新激活", "Kích hoạt lại", "再開する", "Aktifkan lagi")}
                    </button>
                    <Link href={`/career-launch/ops/cohorts/${c.id}`} className="rounded-lg bg-[#EDF1FD] px-3 py-1.5 text-[12.5px] font-bold text-[#0B46E8]">{t("관리 →", "Manage →", "管理 →", "Quản lý →", "管理 →", "Kelola →")}</Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </LaunchContainer>
    </main>
  );
}
