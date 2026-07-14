"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchCohorts, createCohort, updateCohort, type OpsCohort } from "../../../../lib/launch/enrollment-client";
import { useLaunchT } from "../../../../lib/launch/i18n";

// 운영자 기수 관리 — 대학·기수 단위로 생성/관리. 등록된 학생만 프로그램에 접근한다.
export default function LaunchOpsCohortsPage() {
  const t = useLaunchT();
  const router = useRouter();
  const [cohorts, setCohorts] = useState<OpsCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [university, setUniversity] = useState("");
  const [name, setName] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

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

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied((prev) => (prev === code ? null : prev)), 1500);
    } catch {
      // 클립보드 접근 실패 시 조용히 무시 — 코드는 화면에 그대로 노출돼 있다.
    }
  };

  const fmt = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "—");

  return (
    <main className="pb-16 pt-6 md:pt-10">
      <section className="ops-content-section">
        <header>
          <h1>{t("기수 관리", "Cohort management", "期数管理", "Quản lý khóa", "コホート管理", "Manajemen batch")}</h1>
          <p>{t("대학·기수 단위로 운영해요. 등록된 학생만 Career Launch에 접근할 수 있어요.", "Run the program by university and cohort. Only enrolled students can access Career Launch.", "按大学和期数运营。只有已注册的学生才能访问 Career Launch。", "Vận hành theo trường và khóa. Chỉ sinh viên đã đăng ký mới có thể truy cập Career Launch.", "大学・コホート単位で運営します。登録された学生のみ Career Launch にアクセスできます。", "Kelola per universitas dan batch. Hanya siswa terdaftar yang dapat mengakses Career Launch.")}</p>
        </header>

        {/* 기수 생성 */}
        <article className="ops-partner-form-card">
          <h2>{t("새 기수 만들기", "Create new cohort", "创建新期数", "Tạo khóa mới", "新しいコホートを作成", "Buat batch baru")}</h2>
          <p>{t("대학명과 기수를 입력하면 초대코드가 자동 발급돼요", "Enter a university and cohort to auto-generate an invite code", "输入大学名称和期数即可自动生成邀请码", "Nhập tên trường và khóa để tự động tạo mã mời", "大学名とコホートを入力すると招待コードが自動発行されます", "Masukkan nama universitas dan batch untuk membuat kode undangan otomatis")}</p>
          <form onSubmit={submit} className="ops-partner-form">
            <div className="ops-partner-form-two-cols">
              <div className="ops-partner-form-field">
                <span className="ops-form-label">{t("대학명", "University", "大学名称", "Tên trường", "大学名", "Nama universitas")}</span>
                <input
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder={t("대학명 (예: 고려대학교)", "University (e.g., Korea University)", "大学名称（例：高丽大学）", "Tên trường (vd: Đại học Korea)", "大学名（例：高麗大学）", "Nama universitas (mis. Korea University)")}
                />
              </div>
              <div className="ops-partner-form-field">
                <span className="ops-form-label">{t("기수", "Cohort", "期数", "Khóa", "コホート", "Batch")}</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("기수 (예: 2기)", "Cohort (e.g., Batch 2)", "期数（例：第2期）", "Khóa (vd: Khóa 2)", "コホート（例：2期）", "Batch (mis. Batch 2)")}
                />
              </div>
            </div>
            <div className="ops-partner-form-two-cols">
              <div className="ops-partner-form-field">
                <span className="ops-form-label">{t("시작", "Start", "开始", "Bắt đầu", "開始", "Mulai")}</span>
                <input type="date" value={starts} onChange={(e) => setStarts(e.target.value)} />
              </div>
              <div className="ops-partner-form-field">
                <span className="ops-form-label">{t("종료", "End", "结束", "Kết thúc", "終了", "Selesai")}</span>
                <input type="date" value={ends} onChange={(e) => setEnds(e.target.value)} />
              </div>
            </div>
            {error ? <p className="ops-form-error">{error}</p> : null}
            <div>
              <button type="submit" className="ops-btn ops-btn-primary" disabled={!university.trim() || !name.trim() || creating}>
                {creating ? t("만드는 중…", "Creating…", "创建中…", "Đang tạo…", "作成中…", "Membuat…") : t("기수 만들기", "Create cohort", "创建期数", "Tạo khóa", "コホートを作成", "Buat batch")}
              </button>
            </div>
          </form>
        </article>

        {/* 기수 목록 */}
        <article className="ops-partner-list-card">
          <div className="ops-partner-list-top">
            <h2>{t("기수 목록", "Cohort list", "期数列表", "Danh sách khóa", "コホート一覧", "Daftar batch")}</h2>
            <span className="ops-card-subtle">{t("행을 누르면 상세·학생 등록으로 이동해요", "Click a row to view details and enroll students", "点击行查看详情并注册学生", "Nhấn vào hàng để xem chi tiết và đăng ký sinh viên", "行をクリックすると詳細・学生登録に移動します", "Klik baris untuk melihat detail dan mendaftarkan siswa")}</span>
          </div>

          <div className="ops-partner-table-wrap">
            <table className="ops-partner-table">
              <thead>
                <tr>
                  <th>{t("대학", "University", "大学", "Trường", "大学", "Universitas")}</th>
                  <th>{t("기수", "Cohort", "期数", "Khóa", "コホート", "Batch")}</th>
                  <th>{t("초대코드", "Invite code", "邀请码", "Mã mời", "招待コード", "Kode undangan")}</th>
                  <th>{t("등록 인원", "Enrolled", "已注册", "Đã đăng ký", "登録人数", "Terdaftar")}</th>
                  <th>{t("기간", "Period", "期间", "Thời gian", "期間", "Periode")}</th>
                  <th>{t("상태", "Status", "状态", "Trạng thái", "ステータス", "Status")}</th>
                  <th>{t("액션", "Actions", "操作", "Hành động", "アクション", "Aksi")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="ops-table-empty">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</td>
                  </tr>
                ) : cohorts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="ops-table-empty">{t("아직 기수가 없어요. 위에서 새 기수를 만들어 주세요.", "No cohorts yet. Create a new one above.", "还没有期数。请在上方创建一个新期数。", "Chưa có khóa nào. Hãy tạo khóa mới ở trên.", "まだコホートがありません。上で新しいコホートを作成してください。", "Belum ada batch. Buat batch baru di atas.")}</td>
                  </tr>
                ) : (
                  cohorts.map((c) => (
                    <tr key={c.id} className="ops-clickable-row" onClick={() => router.push(`/career-launch/ops/cohorts/${c.id}`)}>
                      <td>{c.university}</td>
                      <td>{c.name}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="ops-detail-button"
                          onClick={() => void copyCode(c.inviteCode)}
                          title={t("초대코드 복사", "Copy invite code", "复制邀请码", "Sao chép mã mời", "招待コードをコピー", "Salin kode undangan")}
                        >
                          {copied === c.inviteCode ? t("복사됨", "Copied", "已复制", "Đã sao chép", "コピー済み", "Tersalin") : c.inviteCode}
                        </button>
                      </td>
                      <td>{c.enrolledCount}</td>
                      <td>{fmt(c.startsAt)} — {fmt(c.endsAt)}</td>
                      <td>
                        {c.status === "active" ? (
                          <span className="ops-status-badge ops-status-approved">{t("진행 중", "Active", "进行中", "Đang diễn ra", "進行中", "Aktif")}</span>
                        ) : (
                          <span className="ops-status-badge ops-status-closed">{t("종료", "Ended", "已结束", "Đã kết thúc", "終了", "Selesai")}</span>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="ops-detail-button" onClick={() => void toggleStatus(c)}>
                          {c.status === "active" ? t("종료로 전환", "Mark as ended", "标记为结束", "Chuyển sang kết thúc", "終了に変更", "Tandai selesai") : t("다시 진행", "Reactivate", "重新激活", "Kích hoạt lại", "再開する", "Aktifkan lagi")}
                        </button>{" "}
                        <Link className="ops-detail-button" href={`/career-launch/ops/cohorts/${c.id}`}>
                          {t("상세", "Details", "详情", "Chi tiết", "詳細", "Detail")}
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  );
}
