"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users, GraduationCap, ChartBar as BarChart3, SlidersHorizontal, ArrowRight } from "@phosphor-icons/react";
import { fetchOpsStudents, studentProgress, type OpsStudent } from "../../../lib/launch/ops-client";
import { fetchCohorts, type OpsCohort } from "../../../lib/launch/enrollment-client";
import { useLaunchT } from "../../../lib/launch/i18n";

// Career Launch 운영 콘솔 대표 홈 — 핵심 지표 요약 + 섹션 바로가기 + 진행이 더딘 학생.
export default function LaunchOpsHomePage() {
  const t = useLaunchT();
  const [students, setStudents] = useState<OpsStudent[]>([]);
  const [cohorts, setCohorts] = useState<OpsCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [s, c] = await Promise.all([fetchOpsStudents(), fetchCohorts().catch(() => [] as OpsCohort[])]);
        if (alive) {
          setStudents(s);
          setCohorts(c);
        }
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

  const stats = useMemo(() => {
    const activeCohorts = cohorts.filter((c) => c.status === "active").length;
    const total = students.length;
    const avgProgress = total ? Math.round(students.reduce((n, s) => n + studentProgress(s).percent, 0) / total) : 0;
    const completed = students.filter((s) => studentProgress(s).done === studentProgress(s).total).length;
    const notStarted = students.filter((s) => studentProgress(s).done === 0).length;
    return { activeCohorts, cohortTotal: cohorts.length, total, avgProgress, completed, notStarted };
  }, [students, cohorts]);

  // 진행이 더딘 학생 — 아직 완주하지 않은 학생을 진행률 낮은 순으로.
  const attention = useMemo(
    () =>
      students
        .filter((s) => studentProgress(s).done < studentProgress(s).total)
        .sort((a, b) => studentProgress(a).done - studentProgress(b).done)
        .slice(0, 6),
    [students]
  );
  const behindCount = students.filter((s) => studentProgress(s).done < studentProgress(s).total).length;

  const navCards = [
    {
      href: "/career-launch/ops/students",
      icon: Users,
      title: t("학생 관리", "Students", "学生管理", "Quản lý sinh viên", "学生管理", "Manajemen siswa"),
      desc: t("진행률과 산출물을 보고 개입해요", "See progress and deliverables", "查看进度与产出并介入", "Xem tiến độ và sản phẩm", "進捗と成果物を確認して対応", "Lihat progres dan hasil"),
      badge: `${stats.total}${t("명", "", "人", "", "名", "")}`,
      tone: "ops-pill-blue"
    },
    {
      href: "/career-launch/ops/cohorts",
      icon: GraduationCap,
      title: t("기수 관리", "Cohorts", "期次管理", "Quản lý khóa", "期の管理", "Manajemen angkatan"),
      desc: t("대학·기수와 초대코드를 관리해요", "Manage cohorts and invite codes", "管理院校期次与邀请码", "Quản lý khóa và mã mời", "大学・期と招待コードを管理", "Kelola angkatan dan kode undangan"),
      badge: t(`활성 ${stats.activeCohorts}`, `${stats.activeCohorts} active`, `活跃${stats.activeCohorts}`, `${stats.activeCohorts} hoạt động`, `稼働${stats.activeCohorts}`, `${stats.activeCohorts} aktif`),
      tone: "ops-pill-blue"
    },
    {
      href: "/career-launch/ops/report",
      icon: BarChart3,
      title: t("리포트", "Report", "报告", "Báo cáo", "レポート", "Laporan"),
      desc: t("기수별 단계 완료율을 봐요", "Stage completion by cohort", "按期查看阶段完成率", "Tỷ lệ hoàn thành theo khóa", "期別の完了率を確認", "Tingkat penyelesaian per angkatan"),
      badge: t(`평균 ${stats.avgProgress}%`, `avg ${stats.avgProgress}%`, `平均${stats.avgProgress}%`, `TB ${stats.avgProgress}%`, `平均${stats.avgProgress}%`, `rata ${stats.avgProgress}%`),
      tone: "ops-pill-blue"
    },
    {
      href: "/career-launch/ops/prompts",
      icon: SlidersHorizontal,
      title: t("프롬프트", "Prompts", "提示词", "Prompt", "プロンプト", "Prompt"),
      desc: t("AI 코치의 말투와 기준을 조정해요", "Tune the AI coach prompts", "调整AI教练的提示词", "Điều chỉnh prompt AI", "AIコーチのプロンプト調整", "Sesuaikan prompt AI"),
      badge: t("편집", "Edit", "编辑", "Sửa", "編集", "Edit"),
      tone: "ops-pill-gray"
    }
  ];

  const summaryCards = [
    { k: t("학생", "Students", "学生", "Sinh viên", "学生", "Siswa"), v: stats.total, tone: "ops-kpi-blue" },
    { k: t("평균 진행률", "Avg progress", "平均进度", "Tiến độ TB", "平均進捗", "Progres rata"), v: `${stats.avgProgress}%`, tone: "ops-kpi-blue" },
    { k: t("미시작", "Not started", "未开始", "Chưa bắt đầu", "未着手", "Belum mulai"), v: stats.notStarted, tone: "ops-kpi-amber" },
    { k: t("완주", "Completed", "已完成", "Hoàn thành", "完走", "Selesai"), v: stats.completed, tone: "ops-kpi-green" }
  ];

  return (
    <main className="pb-16 pt-6 md:pt-10">
      <section className="ops-content-section">
        <header>
          <h1>{t("Launch 운영 콘솔", "Launch admin console", "Launch 运营控制台", "Bảng quản trị Launch", "Launch 運営コンソール", "Konsol admin Launch")}</h1>
          <p>{t("기수·학생·피드백을 한곳에서 관리하고, 오늘 챙길 일을 바로 확인하세요.", "Manage cohorts, students, and feedback in one place, and see what needs attention today.", "在一处管理期次、学生与反馈，并查看今天要处理的事。", "Quản lý khóa, sinh viên và phản hồi ở một nơi, xem việc cần làm hôm nay.", "期・学生・フィードバックを一元管理し、今日やるべきことを確認しましょう。", "Kelola angkatan, siswa, dan umpan balik di satu tempat, lihat yang perlu ditangani hari ini.")}</p>
        </header>

        {error ? (
          <p className="ops-error-card">
            {error} · {t("운영자 계정으로 로그인했는지 확인해 주세요.", "Please check that you're signed in as an operator.", "请确认已以运营者账号登录。", "Vui lòng kiểm tra bạn đã đăng nhập bằng tài khoản quản trị.", "運営者アカウントでログインしているか確認してください。", "Pastikan Anda masuk sebagai operator.")}
          </p>
        ) : null}

        {/* 요약 지표 */}
        <article className="ops-partner-list-card">
          <div className="ops-partner-list-top">
            <h2>{t("한눈에 보기", "At a glance", "总览", "Tổng quan", "ひと目で確認", "Sekilas")}</h2>
            <Link href="/career-launch/dashboard" className="ops-btn">
              {t("학생 화면 체험", "Try student view", "体验学生界面", "Xem giao diện sinh viên", "学生画面を体験", "Coba tampilan siswa")}
            </Link>
          </div>
          <div className="ops-kpi-grid">
            {summaryCards.map((s, i) => (
              <div key={i} className={`ops-kpi-tile ${s.tone}`}>
                <p className="ops-kpi-label">{s.k}</p>
                <p className="ops-kpi-value">{loading ? "–" : s.v}</p>
              </div>
            ))}
          </div>
        </article>

        {/* 섹션 바로가기 */}
        <article className="ops-partner-list-card">
          <div className="ops-partner-list-top">
            <h2>{t("바로가기", "Quick links", "快速入口", "Lối tắt", "クイックリンク", "Akses cepat")}</h2>
            <span className="ops-card-subtle">{t("원하는 작업을 눌러 이동하세요", "Tap a section to jump in", "点击进入对应功能", "Nhấn để đi đến mục", "セクションをタップして移動", "Ketuk untuk masuk ke bagian")}</span>
          </div>
          <div className="ops-card-grid">
            {navCards.map((c) => {
              const Icon = c.icon;
              return (
                <Link key={c.href} href={c.href} className="ops-list-card">
                  <div className="ops-list-card-head">
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, background: "var(--accent-soft)", flex: "none" }}>
                      <Icon size={18} color="var(--accent-ink)" />
                    </span>
                    <span className={`ops-pill ${c.tone}`}>{loading ? "…" : c.badge}</span>
                  </div>
                  <div>
                    <p className="ops-list-card-title" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {c.title} <ArrowRight size={14} color="var(--ink-faint)" />
                    </p>
                    <p className="ops-list-card-sub">{c.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </article>

        {/* 진행이 더딘 학생 */}
        <article className="ops-partner-list-card">
          <div className="ops-partner-list-top">
            <h2>{t("진행이 더딘 학생", "Students falling behind", "进度落后的学生", "Sinh viên chậm tiến độ", "進捗が遅れている学生", "Siswa yang tertinggal")}</h2>
            {!loading && behindCount > attention.length ? (
              <Link href="/career-launch/ops/students" className="ops-btn">
                {t(`+${behindCount - attention.length}명 더 보기`, `See ${behindCount - attention.length} more`, `查看更多${behindCount - attention.length}人`, `Xem thêm ${behindCount - attention.length}`, `他${behindCount - attention.length}名を見る`, `Lihat ${behindCount - attention.length} lagi`)}
              </Link>
            ) : null}
          </div>
          <p className="ops-card-subtle">{t("아직 완주하지 않은 학생을 진행률이 낮은 순으로 보여줘요", "Students who haven't finished yet, lowest progress first", "尚未完成的学生，按进度从低到高排列", "Sinh viên chưa hoàn thành, tiến độ thấp trước", "まだ完走していない学生を進捗が低い順に表示します", "Siswa yang belum selesai, progres terendah dahulu")}</p>

          <div className="ops-partner-table-wrap">
            <table className="ops-partner-table">
              <thead>
                <tr>
                  <th>{t("학생", "Student", "学生", "Sinh viên", "学生", "Siswa")}</th>
                  <th>{t("기수", "Cohort", "期次", "Khóa", "期", "Angkatan")}</th>
                  <th>{t("진행률", "Progress", "进度", "Tiến độ", "進捗", "Progres")}</th>
                  <th>{t("상태", "Status", "状态", "Trạng thái", "ステータス", "Status")}</th>
                  <th>{t("상세", "Detail", "详情", "Chi tiết", "詳細", "Detail")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="ops-table-empty">
                      {t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}
                    </td>
                  </tr>
                ) : attention.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="ops-table-empty">
                      {t("모든 학생이 완주했어요. 👍", "Every student has finished. 👍", "所有学生都已完成。👍", "Tất cả sinh viên đã hoàn thành. 👍", "全ての学生が完走しました。👍", "Semua siswa telah selesai. 👍")}
                    </td>
                  </tr>
                ) : (
                  attention.map((st) => {
                    const prog = studentProgress(st);
                    return (
                      <tr key={st.userId} className="ops-clickable-row">
                        <td>
                          <strong>{st.name ?? st.email}</strong>
                          {st.name ? <div style={{ color: "var(--ink-faint)", fontSize: 12 }}>{st.email}</div> : null}
                        </td>
                        <td>{st.cohort ? `${st.cohort.university} · ${st.cohort.name}` : "-"}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
                            <span style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--line)", overflow: "hidden", display: "block" }}>
                              <span style={{ display: "block", height: "100%", width: `${prog.percent}%`, borderRadius: 999, background: "var(--accent-ink)" }} />
                            </span>
                            <span style={{ flex: "none", fontSize: 12, color: "var(--ink-faint)", fontWeight: 600 }}>
                              {prog.done}/{prog.total}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`ops-status-badge ${prog.done === 0 ? "ops-status-pending" : "ops-status-draft"}`}>
                            {prog.done === 0
                              ? t("미시작", "Not started", "未开始", "Chưa bắt đầu", "未着手", "Belum mulai")
                              : t("진행 중", "In progress", "进行中", "Đang thực hiện", "進行中", "Sedang berjalan")}
                          </span>
                        </td>
                        <td>
                          <Link href={`/career-launch/ops/students/${st.userId}`} className="ops-detail-button">
                            {t("상세보기", "View", "查看", "Xem", "詳細", "Lihat")}
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
