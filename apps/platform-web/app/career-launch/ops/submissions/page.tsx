"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchOpsStudents, type OpsStudent } from "../../../../lib/launch/ops-client";
import { useLaunchT } from "../../../../lib/launch/i18n";

// 운영자 피드백 관리 — 기수별로 학생의 제출물과 피드백 전달 상태(보냄/미확인/미작성)를
// 한눈에 보고, 피드백이 필요한 학생을 먼저 찾아 상세에서 작성한다.
export default function LaunchOpsFeedbackPage() {
  const t = useLaunchT();
  const router = useRouter();
  const [students, setStudents] = useState<OpsStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all"); // "all" | cohortId | "none"
  const [needOnly, setNeedOnly] = useState(false);

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
  const hasUnassigned = students.some((s) => !s.cohort);

  const hasSubmission = (s: OpsStudent) => s.hasResume || s.coverItems > 0 || s.interviewPracticed > 0;
  const needsFeedback = (s: OpsStudent) => hasSubmission(s) && s.feedbackTotal === 0;

  const byCohort = useMemo(() => {
    if (filter === "all") return students;
    if (filter === "none") return students.filter((s) => !s.cohort);
    return students.filter((s) => s.cohort?.id === filter);
  }, [students, filter]);

  const filtered = useMemo(() => {
    const list = needOnly ? byCohort.filter(needsFeedback) : byCohort;
    // 피드백 필요 → 미확인 있음 → 나머지 순으로 정렬해 손이 필요한 학생을 위로.
    return [...list].sort((a, b) => {
      const rank = (s: OpsStudent) => (needsFeedback(s) ? 0 : s.feedbackUnread > 0 ? 1 : 2);
      const d = rank(a) - rank(b);
      if (d !== 0) return d;
      return String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? ""));
    });
  }, [byCohort, needOnly]);

  const submitted = byCohort.filter(hasSubmission).length;
  const needCount = byCohort.filter(needsFeedback).length;
  const unreadCount = byCohort.reduce((n, s) => n + s.feedbackUnread, 0);
  const sentCount = byCohort.reduce((n, s) => n + s.feedbackTotal, 0);

  const summary = [
    { id: "submitted", k: t("제출한 학생", "Submitted", "已提交", "Đã nộp", "提出済み", "Sudah kirim"), v: submitted, tone: "ops-kpi-blue" },
    { id: "need", k: t("피드백 필요", "Needs feedback", "需反馈", "Cần phản hồi", "要対応", "Butuh umpan balik"), v: needCount, tone: "ops-kpi-amber" },
    { id: "unread", k: t("미확인", "Unread", "未读", "Chưa đọc", "未読", "Belum dibaca"), v: unreadCount, tone: "ops-kpi-amber" },
    { id: "sent", k: t("보낸 피드백", "Feedback sent", "已发送", "Đã gửi", "送信済み", "Terkirim"), v: sentCount, tone: "ops-kpi-green" }
  ];

  return (
    <main className="pb-16 pt-6 md:pt-10">
      <section className="ops-content-section">
        <header>
          <h1>{t("피드백 관리", "Feedback management", "反馈管理", "Quản lý phản hồi", "フィードバック管理", "Manajemen umpan balik")}</h1>
          <p>{t("제출물과 피드백 전달 상태를 보고, 피드백이 필요한 학생을 먼저 챙기세요.", "Track submissions and delivery status, and prioritize students who still need feedback.", "查看提交物与反馈送达状态，优先处理仍需反馈的学生。", "Theo dõi bài nộp và trạng thái gửi phản hồi, ưu tiên sinh viên còn cần phản hồi.", "提出物とフィードバックの送達状況を確認し、フィードバックが必要な学生を優先しましょう。", "Pantau kiriman dan status pengiriman umpan balik, dahulukan siswa yang masih butuh umpan balik.")}</p>
        </header>

        <div className="ops-kpi-grid">
          {summary.map((s) => (
            <div key={s.id} className={`ops-kpi-tile ${s.tone}`}>
              <p className="ops-kpi-label">{s.k}</p>
              <p className="ops-kpi-value">{s.v}</p>
            </div>
          ))}
        </div>

        {/* 기수 필터 */}
        {!loading && (cohorts.length > 0 || hasUnassigned) ? (
          <div className="ops-filter-chip-row">
            <button type="button" className={`ops-filter-chip ${filter === "all" ? "is-active" : ""}`} onClick={() => setFilter("all")}>
              {t("전체", "All", "全部", "Tất cả", "全体", "Semua")} <span className="ops-filter-chip-count">{students.length}</span>
            </button>
            {cohorts.map((c) => (
              <button key={c.id} type="button" className={`ops-filter-chip ${filter === c.id ? "is-active" : ""}`} onClick={() => setFilter(c.id)}>
                {c.university} · {c.name} <span className="ops-filter-chip-count">{students.filter((s) => s.cohort?.id === c.id).length}</span>
              </button>
            ))}
            {hasUnassigned ? (
              <button type="button" className={`ops-filter-chip ${filter === "none" ? "is-active" : ""}`} onClick={() => setFilter("none")}>
                {t("미등록", "Unassigned", "未分配", "Chưa xếp khóa", "未登録", "Belum ditetapkan")} <span className="ops-filter-chip-count">{students.filter((s) => !s.cohort).length}</span>
              </button>
            ) : null}
          </div>
        ) : null}

        <article className="ops-partner-list-card">
          <div className="ops-partner-list-top">
            <h2>{t("학생별 피드백 현황", "Feedback by student", "各学生反馈状态", "Phản hồi theo sinh viên", "学生別フィードバック状況", "Umpan balik per siswa")}</h2>
            <button
              type="button"
              className="ops-detail-button"
              onClick={() => setNeedOnly((v) => !v)}
              style={needOnly ? { background: "#F59E0B", borderColor: "#F59E0B", color: "#fff" } : undefined}
            >
              {t("피드백 필요만", "Needs feedback only", "仅需反馈", "Chỉ cần phản hồi", "要対応のみ", "Hanya butuh umpan balik")} {needCount}
            </button>
          </div>

          {error ? <p className="ops-form-error">{error}</p> : null}

          <div className="ops-partner-table-wrap">
            <table className="ops-partner-table">
              <thead>
                <tr>
                  <th>{t("학생", "Student", "学生", "Sinh viên", "学生", "Siswa")}</th>
                  <th>{t("기수", "Cohort", "期数", "Khóa", "コホート", "Batch")}</th>
                  <th>{t("제출물", "Submissions", "提交物", "Bài nộp", "提出物", "Kiriman")}</th>
                  <th>{t("피드백 수", "Feedback", "反馈数", "Số phản hồi", "フィードバック数", "Jumlah umpan balik")}</th>
                  <th>{t("상태", "Status", "状态", "Trạng thái", "ステータス", "Status")}</th>
                  <th>{t("마지막 발송일", "Last sent", "最后发送日", "Gửi lần cuối", "最終送信日", "Terakhir dikirim")}</th>
                  <th>{t("상세", "Detail", "详情", "Chi tiết", "詳細", "Detail")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="ops-table-empty">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="ops-table-empty">
                      {needOnly
                        ? t("피드백이 필요한 학생이 없어요.", "No students need feedback.", "没有需要反馈的学生。", "Không có sinh viên cần phản hồi.", "対応が必要な学生はいません。", "Tidak ada siswa yang butuh umpan balik.")
                        : t("표시할 학생이 없어요.", "No students to show.", "没有可显示的学生。", "Không có sinh viên để hiển thị.", "表示する学生がいません。", "Tidak ada siswa untuk ditampilkan.")}
                    </td>
                  </tr>
                ) : (
                  filtered.map((st) => (
                    <tr
                      key={st.userId}
                      className="ops-clickable-row"
                      onClick={() => router.push(`/career-launch/ops/students/${st.userId}`)}
                    >
                      <td>
                        <div className="font-bold text-[#191F28]">{st.name ?? t("이름 미설정", "No name set", "未设置姓名", "Chưa đặt tên", "名前未設定", "Nama belum diatur")}</div>
                        <div className="text-[12px] text-[#8B95A1]">{st.email}</div>
                      </td>
                      <td>
                        {st.cohort
                          ? `${st.cohort.university} · ${st.cohort.name}`
                          : t("미등록", "Unassigned", "未分配", "Chưa xếp khóa", "未登録", "Belum ditetapkan")}
                      </td>
                      <td>
                        <span className="inline-flex flex-wrap gap-1">
                          <span className={`ops-status-badge ${st.hasResume ? "ops-status-approved" : "ops-status-draft"}`}>
                            {t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")}
                          </span>
                          <span className={`ops-status-badge ${st.coverItems > 0 ? "ops-status-approved" : "ops-status-draft"}`}>
                            {t("자소서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter")} {st.coverItems}
                          </span>
                          <span className={`ops-status-badge ${st.interviewPracticed > 0 ? "ops-status-approved" : "ops-status-draft"}`}>
                            {t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara")} {st.interviewPracticed}/3
                          </span>
                        </span>
                      </td>
                      <td>
                        {st.feedbackTotal > 0 ? (
                          <span>
                            {st.feedbackTotal}
                            {st.feedbackUnread > 0 ? (
                              <span className="ml-1 text-[12px] text-amber-600">
                                ({t("미확인", "Unread", "未读", "Chưa đọc", "未読", "Belum dibaca")} {st.feedbackUnread})
                              </span>
                            ) : (
                              <span className="ml-1 text-[12px] text-[#3A6B00]">
                                ({t("모두 읽음", "All read", "全部已读", "Đã đọc hết", "全て既読", "Semua dibaca")})
                              </span>
                            )}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {needsFeedback(st) ? (
                          <span className="ops-status-badge ops-status-pending">
                            {t("피드백 필요", "Needs feedback", "需反馈", "Cần phản hồi", "要対応", "Butuh")}
                          </span>
                        ) : st.feedbackUnread > 0 ? (
                          <span className="ops-status-badge ops-status-pending">
                            {t("미확인", "Unread", "未读", "Chưa đọc", "未読", "Belum")} {st.feedbackUnread}
                          </span>
                        ) : st.feedbackTotal > 0 ? (
                          <span className="ops-status-badge ops-status-approved">
                            {t("전달됨", "Delivered", "已送达", "Đã gửi", "送達済み", "Terkirim")}
                          </span>
                        ) : (
                          <span className="ops-status-badge ops-status-draft">
                            {t("제출물 없음", "No submissions", "无提交物", "Chưa có bài nộp", "提出物なし", "Belum ada kiriman")}
                          </span>
                        )}
                      </td>
                      <td>{st.feedbackLastAt ? st.feedbackLastAt.slice(0, 10) : "-"}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <Link href={`/career-launch/ops/students/${st.userId}`} className="ops-detail-button">
                          {t("상세보기", "View detail", "查看详情", "Xem chi tiết", "詳細を見る", "Lihat detail")}
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
