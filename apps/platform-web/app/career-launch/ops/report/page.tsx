"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchOpsStudents, type OpsStudent } from "../../../../lib/launch/ops-client";
import { Card, LaunchContainer, ProgressBar, SectionTitle } from "../../../../components/launch/ui";
import { useLaunchT } from "../../../../lib/launch/i18n";

// 운영자 리포트 — 학생 진행 데이터(실데이터)로 기수별 집계.
export default function LaunchOpsReportPage() {
  const t = useLaunchT();
  const [students, setStudents] = useState<OpsStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");

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

  const filtered = useMemo(() => {
    if (filter === "all") return students;
    if (filter === "none") return students.filter((s) => !s.cohort);
    return students.filter((s) => s.cohort?.id === filter);
  }, [students, filter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const diag = filtered.filter((s) => s.diagnosisPercent !== null);
    const jobs = filtered.filter((s) => s.selectedJobs > 0).length;
    const mats = filtered.filter((s) => s.materials > 0).length;
    const resume = filtered.filter((s) => s.hasResume).length;
    const cover = filtered.filter((s) => s.coverItems > 0).length;
    const interviewAny = filtered.filter((s) => s.interviewPracticed > 0).length;
    const interviewAll = filtered.filter((s) => s.interviewPracticed >= 3).length;
    const avgDiag = diag.length ? Math.round(diag.reduce((n, s) => n + (s.diagnosisPercent ?? 0), 0) / diag.length) : 0;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
    return { total, diag: diag.length, jobs, mats, resume, cover, interviewAny, interviewAll, avgDiag, pct };
  }, [filtered]);

  const funnel = [
    { id: "started", label: t("이용 시작", "Started", "开始使用", "Bắt đầu", "利用開始", "Mulai"), value: stats.total },
    { id: "diagnosis", label: t("진단", "Diagnosis", "诊断", "Chẩn đoán", "診断", "Diagnosis"), value: stats.diag },
    { id: "jobs", label: t("직무 선정", "Job selection", "职务选定", "Chọn vị trí", "職務選定", "Pemilihan posisi"), value: stats.jobs },
    { id: "materials", label: t("직무 정리", "Job info", "职务整理", "Tổng hợp công việc", "職務整理", "Rangkuman pekerjaan"), value: stats.mats },
    { id: "resume", label: t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"), value: stats.resume },
    { id: "cover", label: t("자기소개서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter"), value: stats.cover },
    { id: "interview", label: t("모의면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi"), value: stats.interviewAny }
  ];
  const maxFunnel = Math.max(1, funnel[0].value);

  const downloadCsv = () => {
    const head = [
      t("이름", "Name", "姓名", "Tên", "氏名", "Nama"),
      t("이메일", "Email", "邮箱", "Email", "メール", "Email"),
      t("기수", "Cohort", "期数", "Khóa", "コホート", "Batch"),
      t("진단(%)", "Diagnosis (%)", "诊断(%)", "Chẩn đoán (%)", "診断(%)", "Diagnosis (%)"),
      t("직무", "Jobs", "职务", "Vị trí", "職務", "Posisi"),
      t("직무정리", "Job info", "职务整理", "Tổng hợp công việc", "職務整理", "Rangkuman pekerjaan"),
      t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"),
      t("자소서문항", "Cover letter items", "自我介绍题项", "Mục thư xin việc", "自己PR項目", "Item cover letter"),
      t("면접라운드", "Interview rounds", "面试轮次", "Vòng phỏng vấn", "面接ラウンド", "Ronde wawancara"),
      t("완료스텝", "Completed steps", "已完成步骤", "Bước hoàn thành", "完了ステップ", "Langkah selesai")
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = filtered.map((s) =>
      [
        s.name ?? "",
        s.email,
        s.cohort ? `${s.cohort.university} ${s.cohort.name}` : t("미등록", "Unassigned", "未分配", "Chưa xếp khóa", "未登録", "Belum ditetapkan"),
        s.diagnosisPercent ?? "",
        s.selectedJobs,
        s.materials,
        s.hasResume ? "O" : "",
        s.coverItems,
        `${s.interviewPracticed}/3`,
        s.doneSteps
      ].map(esc).join(",")
    );
    const csv = "﻿" + [head.map(esc).join(","), ...rows].join("\n"); // BOM(엑셀 한글)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const label = filter === "all" ? t("전체", "All", "全部", "TatCa", "全体", "Semua") : filter === "none" ? t("미등록", "Unassigned", "未分配", "ChuaXepKhoa", "未登録", "BelumDitetapkan") : cohorts.find((c) => c.id === filter)?.name ?? t("기수", "Cohort", "期数", "Khoa", "コホート", "Batch");
    a.href = url;
    a.download = `career-launch_${label}_${t("학생현황", "students", "学生情况", "sinh-vien", "学生状況", "siswa")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-6xl pt-6 md:pt-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">{t("결과 리포트", "Results report", "结果报告", "Báo cáo kết quả", "結果レポート", "Laporan hasil")}</h1>
            <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t("Career Launch 실사용 데이터로 집계한 지표예요.", "Metrics compiled from real Career Launch usage data.", "根据 Career Launch 实际使用数据汇总的指标。", "Chỉ số tổng hợp từ dữ liệu sử dụng thực tế của Career Launch.", "Career Launch の実利用データで集計した指標です。", "Metrik yang dirangkum dari data penggunaan Career Launch yang sebenarnya.")}</p>
          </div>
          {!loading && filtered.length > 0 ? (
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex flex-none items-center gap-1.5 rounded-xl border border-[#0B46E8]/25 bg-white px-3.5 py-2 text-[13px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]"
            >
              {t("CSV 내보내기 ↓", "Export CSV ↓", "导出 CSV ↓", "Xuất CSV ↓", "CSV エクスポート ↓", "Ekspor CSV ↓")}
            </button>
          ) : null}
        </div>

        {!loading && cohorts.length > 0 ? (
          <div className="mb-5 flex flex-wrap gap-1.5">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>{t("전체", "All", "全部", "Tất cả", "全体", "Semua")}</Chip>
            {cohorts.map((c) => (
              <Chip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>{c.university} · {c.name}</Chip>
            ))}
            {students.some((s) => !s.cohort) ? <Chip active={filter === "none"} onClick={() => setFilter("none")}>{t("미등록", "Unassigned", "未分配", "Chưa xếp khóa", "未登録", "Belum ditetapkan")}</Chip> : null}
          </div>
        ) : null}

        {loading ? (
          <Card className="!p-6 text-center text-[14px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</Card>
        ) : error ? (
          <Card className="!p-6 text-center text-[14px] text-red-600">{error}</Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { id: "total", k: t("학생", "Students", "学生", "Sinh viên", "学生", "Siswa"), v: `${stats.total}${t("명", "", "人", "", "名", "")}`, tone: "text-[#0B46E8]" },
                { id: "completed", k: t("완주(면접 3라운드)", "Completed (3 interview rounds)", "完成（面试3轮）", "Hoàn thành (3 vòng phỏng vấn)", "完走(面接3ラウンド)", "Selesai (3 ronde wawancara)"), v: `${stats.interviewAll}${t("명", "", "人", "", "名", "")}`, tone: "text-emerald-600" },
                { id: "resume_cover", k: t("이력서·자소서", "Resume · Cover letter", "简历·自我介绍", "CV · Thư xin việc", "履歴書・自己PR", "Resume · Cover letter"), v: `${stats.resume}·${stats.cover}${t("명", "", "人", "", "名", "")}`, tone: "text-[#0B46E8]" },
                { id: "avg", k: t("평균 준비도", "Avg. readiness", "平均准备度", "Mức sẵn sàng TB", "平均準備度", "Rata-rata kesiapan"), v: `${stats.avgDiag}%`, tone: "text-[#3A6B00]" }
              ].map((s) => (
                <Card key={s.id} className="!p-4">
                  <p className={`text-[22px] font-black ${s.tone}`}>{s.v}</p>
                  <p className="mt-0.5 text-[12px] text-[#8B95A1]">{s.k}</p>
                </Card>
              ))}
            </div>

            <div className="mt-7 grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
              <div>
                <SectionTitle>{t("단계별 완료율", "Completion rate by step", "各步骤完成率", "Tỷ lệ hoàn thành theo bước", "ステップ別完了率", "Tingkat penyelesaian per langkah")}</SectionTitle>
                <Card className="space-y-4">
                  <Metric label={t("진단", "Diagnosis", "诊断", "Chẩn đoán", "診断", "Diagnosis")} value={stats.pct(stats.diag)} />
                  <Metric label={t("직무 선정", "Job selection", "职务选定", "Chọn vị trí", "職務選定", "Pemilihan posisi")} value={stats.pct(stats.jobs)} />
                  <Metric label={t("직무 정리", "Job info", "职务整理", "Tổng hợp công việc", "職務整理", "Rangkuman pekerjaan")} value={stats.pct(stats.mats)} />
                  <Metric label={t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")} value={stats.pct(stats.resume)} />
                  <Metric label={t("자기소개서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter")} value={stats.pct(stats.cover)} />
                  <Metric label={t("모의면접(1라운드+)", "Mock interview (1+ round)", "模拟面试(1轮以上)", "Phỏng vấn thử (1 vòng trở lên)", "模擬面接(1ラウンド以上)", "Wawancara simulasi (1+ ronde)")} value={stats.pct(stats.interviewAny)} />
                  <Metric label={t("완주(3라운드)", "Completed (3 rounds)", "完成(3轮)", "Hoàn thành (3 vòng)", "完走(3ラウンド)", "Selesai (3 ronde)")} value={stats.pct(stats.interviewAll)} />
                </Card>
              </div>

              <div>
                <SectionTitle sub={t("이용 → 진단 → 직무 → 이력서 → 자소서 → 면접", "Start → Diagnosis → Jobs → Resume → Cover letter → Interview", "开始 → 诊断 → 职务 → 简历 → 自我介绍 → 面试", "Bắt đầu → Chẩn đoán → Vị trí → CV → Thư xin việc → Phỏng vấn", "利用 → 診断 → 職務 → 履歴書 → 自己PR → 面接", "Mulai → Diagnosis → Posisi → Resume → Cover letter → Wawancara")}>{t("참여 퍼널", "Participation funnel", "参与漏斗", "Phễu tham gia", "参加ファネル", "Funnel partisipasi")}</SectionTitle>
                <Card className="space-y-3">
                  {funnel.map((f) => (
                    <div key={f.id}>
                      <div className="mb-1 flex items-center justify-between text-[12.5px]">
                        <span className="font-semibold text-[#4E5968]">{f.label}</span>
                        <span className="font-bold text-[#191F28]">{f.value}{t("명", "", "人", "", "名", "")}</span>
                      </div>
                      <div className="h-7 w-full overflow-hidden rounded-lg bg-[#F2F4F6]">
                        <div
                          className="flex h-full items-center justify-end rounded-lg pr-2 text-[11px] font-bold text-white"
                          style={{ width: `${Math.max(12, (f.value / maxFunnel) * 100)}%`, background: "#0B46E8" }}
                        >
                          {Math.round((f.value / maxFunnel) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          </>
        )}
      </LaunchContainer>
    </main>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className="font-semibold text-[#4E5968]">{label}</span>
        <span className="font-black text-[#0B46E8]">{value}%</span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}
