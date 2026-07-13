"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users, MessageSquare, GraduationCap, BarChart3, SlidersHorizontal, ArrowRight, AlertCircle } from "lucide-react";
import { fetchOpsStudents, studentProgress, type OpsStudent } from "../../../lib/launch/ops-client";
import { fetchCohorts, type OpsCohort } from "../../../lib/launch/enrollment-client";
import { Card, LaunchContainer, SectionTitle } from "../../../components/launch/ui";
import { useLaunchT } from "../../../lib/launch/i18n";

// Career Launch 운영 콘솔 대표 홈 — 핵심 지표 요약 + 섹션 바로가기 + 오늘 챙길 학생.
export default function LaunchOpsHomePage() {
  const t = useLaunchT();
  const [students, setStudents] = useState<OpsStudent[]>([]);
  const [cohorts, setCohorts] = useState<OpsCohort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [s, c] = await Promise.all([fetchOpsStudents(), fetchCohorts().catch(() => [] as OpsCohort[])]);
        if (alive) {
          setStudents(s);
          setCohorts(c);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const activeCohorts = cohorts.filter((c) => c.status === "active").length;
    const total = students.length;
    const avgProgress = total ? Math.round(students.reduce((n, s) => n + studentProgress(s).percent, 0) / total) : 0;
    const hasSubmission = (s: OpsStudent) => s.hasResume || s.coverItems > 0 || s.interviewPracticed > 0;
    const needFeedback = students.filter((s) => hasSubmission(s) && s.feedbackTotal === 0);
    const unread = students.reduce((n, s) => n + s.feedbackUnread, 0);
    const completed = students.filter((s) => studentProgress(s).done === studentProgress(s).total).length;
    return { activeCohorts, cohortTotal: cohorts.length, total, avgProgress, needFeedback, unread, completed };
  }, [students, cohorts]);

  // 오늘 챙길 학생 — 피드백 필요 우선, 그다음 진행률 낮은 순.
  const attention = useMemo(() => {
    const need = stats.needFeedback.slice(0, 6);
    return need;
  }, [stats.needFeedback]);

  const navCards = [
    {
      href: "/career-launch/ops/students",
      icon: Users,
      title: t("학생 관리", "Students", "学生管理", "Quản lý sinh viên", "学生管理", "Manajemen siswa"),
      desc: t("진행률과 산출물을 보고 개입해요", "See progress and deliverables", "查看进度与产出并介入", "Xem tiến độ và sản phẩm", "進捗と成果物を確認して対応", "Lihat progres dan hasil"),
      badge: `${stats.total}${t("명", "", "人", "", "名", "")}`,
      tone: "text-[#0B46E8]"
    },
    {
      href: "/career-launch/ops/submissions",
      icon: MessageSquare,
      title: t("피드백", "Feedback", "反馈", "Phản hồi", "フィードバック", "Umpan balik"),
      desc: t("제출물에 피드백을 전달해요", "Deliver feedback on submissions", "对提交物给出反馈", "Gửi phản hồi cho bài nộp", "提出物にフィードバック", "Beri umpan balik kiriman"),
      badge: stats.needFeedback.length > 0 ? t(`${stats.needFeedback.length} 필요`, `${stats.needFeedback.length} to do`, `需${stats.needFeedback.length}`, `${stats.needFeedback.length} cần`, `${stats.needFeedback.length}件`, `${stats.needFeedback.length} perlu`) : t("모두 완료", "All done", "全部完成", "Đã xong", "全て完了", "Selesai"),
      tone: stats.needFeedback.length > 0 ? "text-amber-600" : "text-[#3A6B00]"
    },
    {
      href: "/career-launch/ops/cohorts",
      icon: GraduationCap,
      title: t("기수 관리", "Cohorts", "期次管理", "Quản lý khóa", "期の管理", "Manajemen angkatan"),
      desc: t("대학·기수와 초대코드를 관리해요", "Manage cohorts and invite codes", "管理院校期次与邀请码", "Quản lý khóa và mã mời", "大学・期と招待コードを管理", "Kelola angkatan dan kode undangan"),
      badge: t(`활성 ${stats.activeCohorts}`, `${stats.activeCohorts} active`, `活跃${stats.activeCohorts}`, `${stats.activeCohorts} hoạt động`, `稼働${stats.activeCohorts}`, `${stats.activeCohorts} aktif`),
      tone: "text-[#0B46E8]"
    },
    {
      href: "/career-launch/ops/report",
      icon: BarChart3,
      title: t("리포트", "Report", "报告", "Báo cáo", "レポート", "Laporan"),
      desc: t("기수별 단계 완료율을 봐요", "Stage completion by cohort", "按期查看阶段完成率", "Tỷ lệ hoàn thành theo khóa", "期別の完了率を確認", "Tingkat penyelesaian per angkatan"),
      badge: t(`평균 ${stats.avgProgress}%`, `avg ${stats.avgProgress}%`, `平均${stats.avgProgress}%`, `TB ${stats.avgProgress}%`, `平均${stats.avgProgress}%`, `rata ${stats.avgProgress}%`),
      tone: "text-[#0B46E8]"
    },
    {
      href: "/career-launch/ops/prompts",
      icon: SlidersHorizontal,
      title: t("프롬프트", "Prompts", "提示词", "Prompt", "プロンプト", "Prompt"),
      desc: t("AI 코치의 말투와 기준을 조정해요", "Tune the AI coach prompts", "调整AI教练的提示词", "Điều chỉnh prompt AI", "AIコーチのプロンプト調整", "Sesuaikan prompt AI"),
      badge: t("편집", "Edit", "编辑", "Sửa", "編集", "Edit"),
      tone: "text-[#8B95A1]"
    }
  ];

  const summaryCards = [
    { k: t("학생", "Students", "学生", "Sinh viên", "学生", "Siswa"), v: stats.total, tone: "text-[#0B46E8]" },
    { k: t("평균 진행률", "Avg progress", "平均进度", "Tiến độ TB", "平均進捗", "Progres rata"), v: `${stats.avgProgress}%`, tone: "text-[#0B46E8]" },
    { k: t("피드백 필요", "Needs feedback", "需反馈", "Cần phản hồi", "要対応", "Perlu umpan balik"), v: stats.needFeedback.length, tone: "text-amber-600" },
    { k: t("완주", "Completed", "已完成", "Hoàn thành", "完走", "Selesai"), v: stats.completed, tone: "text-[#3A6B00]" }
  ];

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-6xl pt-6 md:pt-10">
        {/* 헤더 */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[26px]">{t("Launch 운영 콘솔", "Launch admin console", "Launch 运营控制台", "Bảng quản trị Launch", "Launch 運営コンソール", "Konsol admin Launch")}</h1>
            <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t("기수·학생·피드백을 한곳에서 관리하고, 오늘 챙길 일을 바로 확인하세요.", "Manage cohorts, students, and feedback in one place, and see what needs attention today.", "在一处管理期次、学生与反馈，并查看今天要处理的事。", "Quản lý khóa, sinh viên và phản hồi ở một nơi, xem việc cần làm hôm nay.", "期・学生・フィードバックを一元管理し、今日やるべきことを確認しましょう。", "Kelola angkatan, siswa, dan umpan balik di satu tempat, lihat yang perlu ditangani hari ini.")}</p>
          </div>
          <Link
            href="/career-launch/dashboard"
            className="inline-flex flex-none items-center gap-1.5 rounded-xl border border-[#0B46E8]/25 bg-white px-3.5 py-2 text-[13px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]"
          >
            {t("학생 화면 체험 →", "Try student view →", "体验学生界面 →", "Xem giao diện sinh viên →", "学生画面を体験 →", "Coba tampilan siswa →")}
          </Link>
        </div>

        {/* 요약 지표 */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {summaryCards.map((s, i) => (
            <Card key={i} className="!p-4 text-center">
              <p className={`text-[24px] font-black ${s.tone}`}>{loading ? "–" : s.v}</p>
              <p className="mt-0.5 text-[11.5px] text-[#8B95A1]">{s.k}</p>
            </Card>
          ))}
        </div>

        {/* 섹션 바로가기 */}
        <div className="mt-8">
          <SectionTitle sub={t("원하는 작업을 눌러 이동하세요", "Tap a section to jump in", "点击进入对应功能", "Nhấn để đi đến mục", "セクションをタップして移動", "Ketuk untuk masuk ke bagian")}>{t("바로가기", "Quick links", "快速入口", "Lối tắt", "クイックリンク", "Akses cepat")}</SectionTitle>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {navCards.map((c) => {
              const Icon = c.icon;
              return (
                <Link key={c.href} href={c.href} className="block">
                  <Card className="h-full !p-4 transition hover:border-[#0B46E8]/40 hover:shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#EDF1FD]">
                        <Icon className="h-5 w-5 text-[#0B46E8]" />
                      </span>
                      <span className={`rounded-full bg-[#F2F4F6] px-2.5 py-1 text-[11.5px] font-bold ${c.tone}`}>{loading ? "…" : c.badge}</span>
                    </div>
                    <p className="mt-3 flex items-center gap-1 text-[15px] font-black text-[#191F28]">
                      {c.title} <ArrowRight className="h-3.5 w-3.5 text-[#C9CDD2]" />
                    </p>
                    <p className="mt-1 break-keep text-[12.5px] text-[#8B95A1]">{c.desc}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 오늘 챙길 학생 */}
        <div className="mt-8">
          <SectionTitle sub={t("제출했지만 아직 피드백을 못 받은 학생이에요", "Students who submitted but have no feedback yet", "已提交但尚未获得反馈的学生", "Sinh viên đã nộp nhưng chưa có phản hồi", "提出済みだがフィードバック未受領の学生", "Siswa yang sudah kirim tapi belum ada umpan balik")}>{t("지금 챙길 학생", "Needs your attention", "需要关注", "Cần chú ý", "今チェックすべき学生", "Perlu perhatian")}</SectionTitle>
          {loading ? (
            <Card className="!p-6 text-center text-[14px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</Card>
          ) : attention.length === 0 ? (
            <Card className="!p-6 text-center text-[14px] text-[#8B95A1]">{t("지금 바로 챙길 학생은 없어요. 👍", "Nothing needs attention right now. 👍", "目前没有需要处理的学生。👍", "Hiện không có gì cần xử lý. 👍", "今すぐ対応が必要な学生はいません。👍", "Tidak ada yang perlu ditangani sekarang. 👍")}</Card>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {attention.map((st) => {
                const prog = studentProgress(st);
                return (
                  <Link key={st.userId} href={`/career-launch/ops/students/${st.userId}`} className="block">
                    <Card className="h-full !p-4 transition hover:border-amber-300">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-amber-50 text-[13px] font-black text-amber-600">
                          {(st.name ?? st.email).charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-bold text-[#191F28]">{st.name ?? st.email}</p>
                          {st.cohort ? (
                            <p className="truncate text-[11.5px] font-semibold text-[#0B46E8]">🎓 {st.cohort.university} · {st.cohort.name}</p>
                          ) : (
                            <p className="truncate text-[11.5px] text-[#8B95A1]">{st.email}</p>
                          )}
                        </div>
                        <span className="flex flex-none items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-600">
                          <AlertCircle className="h-3 w-3" />{t("피드백", "Feedback", "反馈", "Phản hồi", "FB", "FB")}
                        </span>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEF1F5]">
                          <div className="h-full rounded-full bg-[#0B46E8]" style={{ width: `${prog.percent}%` }} />
                        </div>
                        <span className="flex-none text-[11px] font-bold text-[#8B95A1]">{prog.done}/{prog.total}</span>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
          {!loading && stats.needFeedback.length > attention.length ? (
            <Link href="/career-launch/ops/submissions" className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-[#0B46E8]">
              {t(`+${stats.needFeedback.length - attention.length}명 더 보기`, `See ${stats.needFeedback.length - attention.length} more`, `查看更多${stats.needFeedback.length - attention.length}人`, `Xem thêm ${stats.needFeedback.length - attention.length}`, `他${stats.needFeedback.length - attention.length}名を見る`, `Lihat ${stats.needFeedback.length - attention.length} lagi`)} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </LaunchContainer>
    </main>
  );
}
