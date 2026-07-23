"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fetchOpsStudents,
  studentProgress,
  bulkResetStudents,
  bulkMoveCohort,
  nudgeStudents,
  type OpsStudent,
  type OpsResetTarget
} from "../../../../lib/launch/ops-client";
import { useLaunchT } from "../../../../lib/launch/i18n";

const PAGE_SIZE = 25;

type StatusFilter = "all" | "notStarted" | "inProgress" | "completed";

// 운영자 학생 관리 — 검색·기수·상태로 좁혀 보고, 선택해 일괄 처리한다.
export default function LaunchOpsStudentsPage() {
  const t = useLaunchT();
  const router = useRouter();
  const [students, setStudents] = useState<OpsStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all"); // "all" | cohortId | "none"
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "progress">("recent");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const list = await fetchOpsStudents();
      setStudents(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("불러오지 못했어요.", "Couldn't load.", "加载失败。", "Không thể tải.", "読み込めませんでした。", "Gagal memuat."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 학생들에게서 나타난 기수 목록(필터·이동 대상).
  const cohorts = useMemo(() => {
    const map = new Map<string, { id: string; university: string; name: string }>();
    for (const s of students) if (s.cohort) map.set(s.cohort.id, s.cohort);
    return [...map.values()].sort((a, b) => `${a.university}${a.name}`.localeCompare(`${b.university}${b.name}`));
  }, [students]);
  const hasUnassigned = students.some((s) => !s.cohort);

  const statusOf = (s: OpsStudent): StatusFilter => {
    const p = studentProgress(s);
    if (p.done === 0) return "notStarted";
    if (p.done === p.total) return "completed";
    return "inProgress";
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let base =
      filter === "all" ? students : filter === "none" ? students.filter((s) => !s.cohort) : students.filter((s) => s.cohort?.id === filter);
    if (status !== "all") base = base.filter((s) => statusOf(s) === status);
    if (needle) {
      base = base.filter(
        (s) =>
          (s.name ?? "").toLowerCase().includes(needle) ||
          s.email.toLowerCase().includes(needle) ||
          (s.phone ?? "").replace(/-/g, "").includes(needle.replace(/-/g, ""))
      );
    }
    if (sort === "progress") {
      // 진행률 낮은 순 — 뒤처진 학생을 위로.
      return [...base].sort((a, b) => studentProgress(a).done - studentProgress(b).done);
    }
    return base; // 기본: 백엔드가 최근 활동순으로 정렬해 반환.
  }, [students, filter, status, q, sort]);

  // 필터가 바뀌면 1페이지로, 화면에서 사라진 선택은 해제.
  useEffect(() => {
    setPage(1);
  }, [filter, status, q, sort]);
  useEffect(() => {
    setSelected((prev) => {
      const visible = new Set(filtered.map((s) => s.userId));
      const next = new Set([...prev].filter((id) => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allOnPageSelected = pageItems.length > 0 && pageItems.every((s) => selected.has(s.userId));
  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageItems.forEach((s) => next.delete(s.userId));
      else pageItems.forEach((s) => next.add(s.userId));
      return next;
    });
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const ids = [...selected];

  const doBulkReset = async (target: OpsResetTarget, label: string) => {
    if (!ids.length || busy) return;
    if (!confirm(t(`선택한 ${ids.length}명의 '${label}'을(를) 초기화할까요? 되돌릴 수 없어요.`, `Reset '${label}' for ${ids.length} selected students? This can't be undone.`, `确定重置所选 ${ids.length} 名学生的“${label}”吗？无法撤销。`, `Đặt lại '${label}' cho ${ids.length} sinh viên đã chọn? Không thể hoàn tác.`, `選択した${ids.length}名の「${label}」をリセットしますか？元に戻せません。`, `Reset '${label}' untuk ${ids.length} siswa terpilih? Tidak dapat dibatalkan.`))) return;
    setBusy(true);
    try {
      await bulkResetStudents(ids, target);
      setSelected(new Set());
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : t("일괄 처리에 실패했어요.", "Bulk action failed.", "批量处理失败。", "Xử lý hàng loạt thất bại.", "一括処理に失敗しました。", "Aksi massal gagal."));
    } finally {
      setBusy(false);
    }
  };

  const doBulkMove = async (cohortId: string) => {
    if (!ids.length || !cohortId || busy) return;
    const c = cohorts.find((x) => x.id === cohortId);
    const label = c ? `${c.university} · ${c.name}` : "";
    if (!confirm(t(`선택한 ${ids.length}명을 '${label}' 기수로 옮길까요?`, `Move ${ids.length} selected students to '${label}'?`, `将所选 ${ids.length} 名学生移至“${label}”期？`, `Chuyển ${ids.length} sinh viên đã chọn sang khóa '${label}'?`, `選択した${ids.length}名を「${label}」期に移動しますか？`, `Pindahkan ${ids.length} siswa terpilih ke '${label}'?`))) return;
    setBusy(true);
    try {
      await bulkMoveCohort(ids, cohortId);
      setSelected(new Set());
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : t("기수 이동에 실패했어요.", "Failed to move cohort.", "移动期数失败。", "Chuyển khóa thất bại.", "コホート移動に失敗しました。", "Gagal memindahkan angkatan."));
    } finally {
      setBusy(false);
    }
  };

  const doNudge = async () => {
    if (!ids.length || busy) return;
    const message = window.prompt(
      t(
        `선택한 ${ids.length}명에게 독려 메일을 보냅니다.\n덧붙일 한마디가 있으면 입력하세요(선택).`,
        `Sending a reminder email to ${ids.length} students.\nAdd an optional note.`,
        `将向所选 ${ids.length} 名学生发送提醒邮件。\n可添加附言（可选）。`,
        `Gửi email nhắc nhở tới ${ids.length} sinh viên.\nThêm lời nhắn (tùy chọn).`,
        `選択した${ids.length}名にリマインダーメールを送ります。\n一言（任意）を入力してください。`,
        `Mengirim email pengingat ke ${ids.length} siswa.\nTambahkan catatan (opsional).`
      ),
      ""
    );
    if (message === null) return; // 취소
    setBusy(true);
    try {
      const r = await nudgeStudents(ids, message);
      setSelected(new Set());
      await load();
      alert(
        r.delivery === "smtp"
          ? t(`${r.sent}명에게 독려 메일을 보냈어요.`, `Reminder sent to ${r.sent} students.`, `已向 ${r.sent} 名学生发送提醒。`, `Đã gửi nhắc nhở tới ${r.sent} sinh viên.`, `${r.sent}名にリマインダーを送信しました。`, `Pengingat terkirim ke ${r.sent} siswa.`)
          : t(`메일 서버(SMTP)가 설정되지 않아 실제 발송은 되지 않았어요. ${r.sent}명 대상 로그만 남겼습니다.`, `SMTP isn't configured, so nothing was actually sent. Logged ${r.sent} recipients.`, `未配置 SMTP，未实际发送。已记录 ${r.sent} 名收件人。`, `SMTP chưa cấu hình nên chưa gửi thật. Đã ghi log ${r.sent} người nhận.`, `SMTPが未設定のため実際には送信されていません。${r.sent}名分をログに記録しました。`, `SMTP belum dikonfigurasi, jadi tidak benar-benar terkirim. ${r.sent} penerima dicatat.`)
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : t("독려 메일 발송에 실패했어요.", "Failed to send reminder.", "发送提醒失败。", "Gửi nhắc nhở thất bại.", "リマインダー送信に失敗しました。", "Gagal mengirim pengingat."));
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const target = ids.length ? filtered.filter((s) => selected.has(s.userId)) : filtered;
    const head = [
      t("이름", "Name", "姓名", "Tên", "氏名", "Nama"),
      t("실명", "Legal name", "真实姓名", "Họ tên thật", "本名", "Nama asli"),
      t("이메일", "Email", "邮箱", "Email", "メール", "Email"),
      t("전화번호", "Phone", "电话", "Số điện thoại", "電話番号", "Telepon"),
      t("기수", "Cohort", "期数", "Khóa", "コホート", "Batch"),
      t("진행률(%)", "Progress (%)", "进度(%)", "Tiến độ (%)", "進捗(%)", "Progres (%)"),
      t("진단(%)", "Diagnosis (%)", "诊断(%)", "Chẩn đoán (%)", "診断(%)", "Diagnosis (%)"),
      t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"),
      t("자소서문항", "Cover letter items", "自我介绍题项", "Mục thư xin việc", "自己PR項目", "Item cover letter"),
      t("면접라운드", "Interview rounds", "面试轮次", "Vòng phỏng vấn", "面接ラウンド", "Ronde wawancara")
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = target.map((s) =>
      [
        s.name ?? "",
        s.realName ?? "",
        s.email,
        s.phone ?? "",
        s.cohort ? `${s.cohort.university} ${s.cohort.name}` : t("미등록", "Unassigned", "未分配", "Chưa xếp khóa", "未登録", "Belum ditetapkan"),
        studentProgress(s).percent,
        s.diagnosisPercent ?? "",
        s.hasResume ? "O" : "",
        s.coverItems,
        `${s.interviewPracticed}/3`
      ].map(esc).join(",")
    );
    const csv = "﻿" + [head.map(esc).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `career-launch_${t("학생", "students", "学生", "sinh-vien", "学生", "siswa")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const withResume = filtered.filter((s) => s.hasResume).length;
  const withCover = filtered.filter((s) => s.coverItems > 0).length;
  const diagDone = filtered.filter((s) => s.diagnosisPercent !== null).length;

  const summary = [
    { id: "students", k: t("학생", "Students", "学生", "Sinh viên", "学生", "Siswa"), v: filtered.length, tone: "ops-kpi-blue" },
    { id: "diagnosis", k: t("진단", "Diagnosis", "诊断", "Chẩn đoán", "診断", "Diagnosis"), v: diagDone, tone: "ops-kpi-blue" },
    { id: "resume", k: t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"), v: withResume, tone: "ops-kpi-green" },
    { id: "cover", k: t("자소서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter"), v: withCover, tone: "ops-kpi-green" }
  ];

  const statusChips: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t("전체", "All", "全部", "Tất cả", "全体", "Semua") },
    { key: "notStarted", label: t("미시작", "Not started", "未开始", "Chưa bắt đầu", "未着手", "Belum mulai") },
    { key: "inProgress", label: t("진행 중", "In progress", "进行中", "Đang thực hiện", "進行中", "Berjalan") },
    { key: "completed", label: t("완주", "Completed", "已完成", "Hoàn thành", "完走", "Selesai") }
  ];
  const statusCount = (k: StatusFilter) => {
    const base = filter === "all" ? students : filter === "none" ? students.filter((s) => !s.cohort) : students.filter((s) => s.cohort?.id === filter);
    return k === "all" ? base.length : base.filter((s) => statusOf(s) === k).length;
  };

  const detailLabel = t("상세정보", "Details", "详情", "Chi tiết", "詳細", "Detail");
  const doneLabel = t("완료", "Done", "已完成", "Hoàn thành", "完了", "Selesai");
  const notDoneLabel = t("미완료", "Not done", "未完成", "Chưa xong", "未完了", "Belum");

  return (
    <main className="pb-16 pt-6 md:pt-10">
      <section className="ops-content-section">
        <header>
          <h1>{t("학생 관리", "Student management", "学生管理", "Quản lý sinh viên", "学生管理", "Manajemen siswa")}</h1>
          <p>{t("검색·기수·상태로 좁혀 보고, 선택해 일괄 처리하세요.", "Narrow by search, cohort, and status — then act on a selection in bulk.", "按搜索、期数与状态筛选，并批量处理所选学生。", "Lọc theo tìm kiếm, khóa và trạng thái — rồi xử lý hàng loạt.", "検索・コホート・状態で絞り込み、選択して一括処理できます。", "Saring dengan pencarian, angkatan, dan status — lalu proses massal.")}</p>
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
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="ops-detail-button" onClick={exportCsv}>
                {ids.length
                  ? t(`선택 ${ids.length}명 CSV`, `CSV (${ids.length} selected)`, `导出所选 ${ids.length} 人`, `CSV (${ids.length} đã chọn)`, `選択${ids.length}名をCSV`, `CSV (${ids.length} dipilih)`)
                  : t("CSV 내보내기", "Export CSV", "导出 CSV", "Xuất CSV", "CSV エクスポート", "Ekspor CSV")}
              </button>
              <button type="button" className="ops-detail-button" onClick={() => setSort((s) => (s === "recent" ? "progress" : "recent"))}>
                {sort === "progress"
                  ? t("진행률 낮은 순", "Least progress first", "进度最低优先", "Tiến độ thấp trước", "進捗が低い順", "Progres terendah dahulu")
                  : t("최근 활동순", "Recent activity", "最近活动", "Hoạt động gần đây", "最近の活動順", "Aktivitas terbaru")}
              </button>
            </div>
          </div>

          {/* 검색 */}
          <div className="ops-partner-filters">
            <input
              className="ops-partner-filter-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("이름 또는 이메일 검색", "Search by name or email", "按姓名或邮箱搜索", "Tìm theo tên hoặc email", "氏名またはメールで検索", "Cari nama atau email")}
            />
            <button type="button" className="ops-partner-filter-reset" onClick={() => { setQ(""); setFilter("all"); setStatus("all"); }}>
              {t("초기화", "Reset", "重置", "Đặt lại", "リセット", "Reset")}
            </button>
          </div>

          {/* 기수 필터 */}
          {!loading && (cohorts.length > 0 || hasUnassigned) ? (
            <div className="ops-filter-chip-row">
              <button type="button" className={`ops-filter-chip ${filter === "all" ? "is-active" : ""}`} onClick={() => setFilter("all")}>
                {t("전체 기수", "All cohorts", "全部期数", "Tất cả khóa", "全コホート", "Semua angkatan")}
                <span className="ops-filter-chip-count">{students.length}</span>
              </button>
              {cohorts.map((c) => (
                <button key={c.id} type="button" className={`ops-filter-chip ${filter === c.id ? "is-active" : ""}`} onClick={() => setFilter(c.id)}>
                  {c.university} · {c.name}
                  <span className="ops-filter-chip-count">{students.filter((s) => s.cohort?.id === c.id).length}</span>
                </button>
              ))}
              {hasUnassigned ? (
                <button type="button" className={`ops-filter-chip ${filter === "none" ? "is-active" : ""}`} onClick={() => setFilter("none")}>
                  {t("미등록", "Unassigned", "未分配", "Chưa xếp khóa", "未登録", "Belum ditetapkan")}
                  <span className="ops-filter-chip-count">{students.filter((s) => !s.cohort).length}</span>
                </button>
              ) : null}
            </div>
          ) : null}

          {/* 상태 필터 */}
          {!loading ? (
            <div className="ops-filter-chip-row">
              {statusChips.map((c) => (
                <button key={c.key} type="button" className={`ops-filter-chip ${status === c.key ? "is-active" : ""}`} onClick={() => setStatus(c.key)}>
                  {c.label}
                  <span className="ops-filter-chip-count">{statusCount(c.key)}</span>
                </button>
              ))}
            </div>
          ) : null}

          {/* 일괄 작업 바 — 선택이 있을 때만 */}
          {ids.length > 0 ? (
            <div className="ops-bulk-actionbar">
              <strong>
                {t(`${ids.length}명 선택됨`, `${ids.length} selected`, `已选 ${ids.length} 人`, `Đã chọn ${ids.length}`, `${ids.length}名を選択`, `${ids.length} dipilih`)}
              </strong>
              <div className="ops-bulk-actionbar-buttons">
                {cohorts.length > 0 ? (
                  <select
                    className="ops-detail-button"
                    disabled={busy}
                    defaultValue=""
                    onChange={(e) => {
                      const v = e.target.value;
                      e.target.value = "";
                      if (v) void doBulkMove(v);
                    }}
                  >
                    <option value="">{t("기수 이동…", "Move to cohort…", "移动到期数…", "Chuyển khóa…", "コホートへ移動…", "Pindah angkatan…")}</option>
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.university} · {c.name}
                      </option>
                    ))}
                  </select>
                ) : null}
                <select
                  className="ops-detail-button"
                  disabled={busy}
                  defaultValue=""
                  onChange={(e) => {
                    const v = e.target.value as OpsResetTarget | "";
                    const label = e.target.selectedOptions[0]?.text ?? "";
                    e.target.value = "";
                    if (v) void doBulkReset(v, label);
                  }}
                >
                  <option value="">{t("일괄 초기화…", "Bulk reset…", "批量重置…", "Đặt lại hàng loạt…", "一括初期化…", "Reset massal…")}</option>
                  <option value="diagnosis">{t("진단", "Diagnosis", "诊断", "Chẩn đoán", "診断", "Diagnosis")}</option>
                  <option value="jobs">{t("선정 직무", "Selected jobs", "已选职务", "Vị trí đã chọn", "選定した職務", "Posisi terpilih")}</option>
                  <option value="resume">{t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")}</option>
                  <option value="cover">{t("자기소개서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter")}</option>
                  <option value="interview">{t("모의면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")}</option>
                  <option value="final_feedback">{t("최종 피드백", "Final feedback", "最终反馈", "Phản hồi cuối cùng", "最終フィードバック", "Umpan balik akhir")}</option>
                </select>
                <button type="button" className="ops-btn ops-btn-primary" disabled={busy} onClick={() => void doNudge()}>
                  {t("독려 메일 보내기", "Send reminder", "发送提醒邮件", "Gửi email nhắc", "リマインダー送信", "Kirim pengingat")}
                </button>
                <button type="button" className="ops-detail-button" disabled={busy} onClick={() => setSelected(new Set())}>
                  {t("선택 해제", "Clear selection", "取消选择", "Bỏ chọn", "選択解除", "Batal pilih")}
                </button>
              </div>
            </div>
          ) : null}

          {error ? <p className="ops-form-error">{error}</p> : null}

          <div className="ops-partner-table-wrap">
            <table className="ops-partner-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} aria-label="select all" />
                  </th>
                  <th>{t("학생", "Student", "学生", "Sinh viên", "学生", "Siswa")}</th>
                  <th>{t("연락처", "Contact", "联系方式", "Liên hệ", "連絡先", "Kontak")}</th>
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
                    <td colSpan={10} className="ops-table-empty">
                      {t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={10} className="ops-table-empty">{error}</td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="ops-table-empty">
                      {q.trim()
                        ? t("검색 결과가 없어요.", "No matching students.", "没有匹配的学生。", "Không có sinh viên phù hợp.", "該当する学生がいません。", "Tidak ada siswa yang cocok.")
                        : t("조건에 맞는 학생이 없어요.", "No students match the filters.", "没有符合条件的学生。", "Không có sinh viên khớp bộ lọc.", "条件に合う学生がいません。", "Tidak ada siswa yang cocok dengan filter.")}
                    </td>
                  </tr>
                ) : (
                  pageItems.map((st) => {
                    const prog = studentProgress(st);
                    const done = prog.done === prog.total;
                    return (
                      <tr key={st.userId} className="ops-clickable-row" onClick={() => router.push(`/career-launch/ops/students/${st.userId}`)}>
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.has(st.userId)}
                            onChange={() => toggleOne(st.userId)}
                            aria-label={st.email}
                          />
                        </td>
                        <td>
                          <span className="block font-bold text-[var(--ink)]">
                            {st.name ?? t("이름 미설정", "No name set", "未设置姓名", "Chưa đặt tên", "名前未設定", "Nama belum diatur")}
                          </span>
                          {/* 실명이 없으면 SNS 닉네임을 쓰고 있다는 뜻 — 연락·서류에 문제가 되니 눈에 띄게 알린다. */}
                          {!st.realName ? (
                            <span className="ops-status-badge ops-status-pending">
                              {t("실명 미등록", "No legal name", "未登记真实姓名", "Chưa có tên thật", "本名未登録", "Nama asli belum ada")}
                            </span>
                          ) : null}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <a href={`mailto:${st.email}`} className="block text-[12.5px] text-[var(--accent-ink)]">
                            {st.email}
                          </a>
                          {st.phone ? (
                            <a href={`tel:${st.phone}`} className="block text-[12.5px] text-[var(--ink-soft)]">
                              {st.phone}
                            </a>
                          ) : (
                            <span className="block text-[12px] text-[var(--ink-faint)]">
                              {t("전화번호 없음", "No phone", "无电话", "Không có SĐT", "電話番号なし", "Tidak ada telepon")}
                            </span>
                          )}
                        </td>
                        <td>
                          {st.cohort ? (
                            `${st.cohort.university} · ${st.cohort.name}`
                          ) : (
                            <span className="ops-status-badge ops-status-draft">
                              {t("미등록", "Unassigned", "未分配", "Chưa xếp khóa", "未登録", "Belum ditetapkan")}
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
                            <span style={{ position: "relative", display: "block", flex: 1, height: 6, borderRadius: 999, background: "var(--line)", overflow: "hidden" }}>
                              <span
                                style={{
                                  display: "block",
                                  height: "100%",
                                  width: `${prog.percent}%`,
                                  borderRadius: 999,
                                  background: done ? "var(--accent-ink)" : "var(--accent)"
                                }}
                              />
                            </span>
                            <span style={{ flex: "none", fontWeight: 700, color: "var(--ink-soft)" }}>
                              {prog.done}/{prog.total}
                            </span>
                          </span>
                        </td>
                        <td>
                          <span className={`ops-status-badge ${st.diagnosisPercent !== null ? "ops-status-approved" : "ops-status-draft"}`}>
                            {st.diagnosisPercent !== null ? doneLabel : notDoneLabel}
                          </span>
                        </td>
                        <td>
                          <span className={`ops-status-badge ${st.hasResume ? "ops-status-approved" : "ops-status-draft"}`}>
                            {st.hasResume ? doneLabel : notDoneLabel}
                          </span>
                        </td>
                        <td>
                          <span className={`ops-status-badge ${st.coverItems > 0 ? "ops-status-approved" : "ops-status-draft"}`}>
                            {st.coverItems > 0 ? `${doneLabel} ${st.coverItems}` : notDoneLabel}
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

          {/* 페이지네이션 */}
          {!loading && totalPages > 1 ? (
            <div className="ops-pagination">
              <button type="button" className="ops-detail-button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                {t("이전", "Prev", "上一页", "Trước", "前へ", "Sebelumnya")}
              </button>
              <span style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>
                {page} / {totalPages}
              </span>
              <button type="button" className="ops-detail-button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                {t("다음", "Next", "下一页", "Sau", "次へ", "Berikutnya")}
              </button>
            </div>
          ) : null}
        </article>
      </section>
    </main>
  );
}
