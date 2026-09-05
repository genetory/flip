"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "@phosphor-icons/react";
import { fetchOpsStudentDetail, resetStudentStep, saveStudentMemo, nudgeStudents, type OpsStudentDetail, type OpsResetTarget } from "../../../../../lib/launch/ops-client";
import { hasResumeContent } from "../../../../../lib/launch/resume-data";
import { hasCoverContent } from "../../../../../lib/launch/cover-data";
import { RECOMMENDED_JOBS } from "../../../../../lib/launch/data";
import { RichText } from "../../../../../components/launch/rich-text";
import { useLaunchT } from "../../../../../lib/launch/i18n";
import { useToast } from "../../../../../components/toast/ToastProvider";
import { useJobReason, useStepText } from "../../../../../lib/launch/data-i18n";

type Tab = "overview" | "growth" | "docs" | "interview" | "ops";

// 리뉴얼 산출물(점수화) — 얕은 CareerProgress 타입이 노출하지 않는 세부 필드를 로컬로 캐스팅.
type ReportData = {
  total?: number;
  areas?: { direction?: number; experience?: number; competency?: number; resume?: number; cover?: number; interview?: number };
  why?: string;
  strengths?: string[];
  gaps?: string[];
  roadmap?: { targetRole?: string; targetCompanies?: string[]; recommendedExperience?: string[]; toImprove?: string[] };
};
type ScoreData = { total?: number; why?: string; tips?: string[] };

// 운영자 학생 상세.
// 섹션이 11개까지 늘어 한 화면에 다 쌓으면 읽기 어려워, 콘솔의 탭 패턴(ops-detail-tabs)으로 나눈다.
//   개요   — 진행 현황 · 진단 · 선정 직무 · 직무 정보 · 완료 스텝
//   산출물 — 이력서 · 자기소개서 (각각 PDF)
//   면접   — 모의면접 진행 · 유형별 AI 총평 · 최종 피드백
//   운영   — 독려 메일 · 운영자 메모 · 단계 초기화
export default function LaunchOpsStudentDetailPage() {
  const t = useLaunchT();
  const toast = useToast();
  const jobReason = useJobReason();
  const stepText = useStepText();
  const INTERVIEW_LABEL: Record<string, string> = {
    self: t("자기소개 면접", "Self-intro interview", "自我介绍面试", "Phỏng vấn giới thiệu bản thân", "自己紹介面接", "Wawancara perkenalan diri"),
    job: t("직무 면접", "Job interview", "职务面试", "Phỏng vấn chuyên môn", "職務面接", "Wawancara pekerjaan"),
    fit: t("인성·컬처핏 면접", "Personality & culture-fit interview", "人格·文化契合面试", "Phỏng vấn tính cách & văn hóa", "人柄・カルチャーフィット面接", "Wawancara kepribadian & kecocokan budaya")
  };
  const params = useParams();
  const id = String((params as { id?: string })?.id ?? "");
  const [detail, setDetail] = useState<OpsStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [resetting, setResetting] = useState("");
  const [memo, setMemo] = useState("");
  const [memoSaving, setMemoSaving] = useState(false);
  const [memoSaved, setMemoSaved] = useState(false);
  const [nudging, setNudging] = useState(false);

  const load = async () => {
    try {
      const d = await fetchOpsStudentDetail(id);
      setDetail(d);
      setMemo(d.opsMemo ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("불러오지 못했어요.", "Couldn't load.", "加载失败。", "Không thể tải.", "読み込めませんでした。", "Gagal memuat."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const doReset = async (target: OpsResetTarget, label: string) => {
    if (resetting) return;
    if (!confirm(t(`이 학생의 '${label}'을(를) 초기화할까요? 되돌릴 수 없어요.`, `Reset this student's '${label}'? This can't be undone.`, `确定重置该学生的“${label}”吗？此操作无法撤销。`, `Đặt lại '${label}' của sinh viên này? Không thể hoàn tác.`, `この学生の「${label}」をリセットしますか？元に戻せません。`, `Reset '${label}' siswa ini? Tindakan ini tidak dapat dibatalkan.`))) return;
    setResetting(target);
    try {
      await resetStudentStep(id, target);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("초기화에 실패했어요.", "Failed to reset.", "重置失败。", "Đặt lại không thành công.", "リセットに失敗しました。", "Gagal mereset."));
    } finally {
      setResetting("");
    }
  };

  const doNudge = async () => {
    if (nudging) return;
    const message = window.prompt(
      t("독려 메일을 보냅니다. 덧붙일 한마디가 있으면 입력하세요(선택).", "Sending a reminder email. Add an optional note.", "将发送提醒邮件。可添加附言（可选）。", "Gửi email nhắc nhở. Thêm lời nhắn (tùy chọn).", "リマインダーメールを送ります。一言（任意）を入力してください。", "Mengirim email pengingat. Tambahkan catatan (opsional)."),
      ""
    );
    if (message === null) return;
    setNudging(true);
    try {
      const r = await nudgeStudents([id], message);
      await load();
      if (r.delivery === "smtp") {
        toast.success(t("독려 메일을 보냈어요.", "Reminder sent.", "已发送提醒邮件。", "Đã gửi email nhắc nhở.", "リマインダーを送信しました。", "Pengingat terkirim."));
      } else {
        toast.info(t("메일 서버(SMTP)가 설정되지 않아 실제 발송은 되지 않았어요(로그만 기록).", "SMTP isn't configured, so nothing was actually sent (logged only).", "未配置 SMTP，未实际发送（仅记录日志）。", "SMTP chưa cấu hình nên chưa gửi thật (chỉ ghi log).", "SMTPが未設定のため実際には送信されていません（ログのみ）。", "SMTP belum dikonfigurasi, jadi tidak terkirim (hanya dicatat)."));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("독려 메일 발송에 실패했어요.", "Failed to send reminder.", "发送提醒失败。", "Gửi nhắc nhở thất bại.", "リマインダー送信に失敗しました。", "Gagal mengirim pengingat."));
    } finally {
      setNudging(false);
    }
  };

  const submitMemo = async () => {
    if (memoSaving) return;
    setMemoSaving(true);
    setMemoSaved(false);
    try {
      await saveStudentMemo(id, memo);
      setMemoSaved(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("메모를 저장하지 못했어요.", "Couldn't save the memo.", "无法保存备注。", "Không thể lưu ghi chú.", "メモを保存できませんでした。", "Gagal menyimpan memo."));
    } finally {
      setMemoSaving(false);
    }
  };

  const diag = detail?.state.diagnosis ?? null;
  const diagBefore = detail?.state.diagnosisInitial?.percent ?? diag?.percent ?? null;
  const diagAfter = detail?.state.diagnosisFinal?.percent ?? null;
  const diagGain = diagBefore !== null && diagBefore !== undefined && diagAfter !== null && diagAfter !== undefined ? diagAfter - diagBefore : null;
  const jobs = detail?.state.selectedJobs ?? [];
  const materials = detail?.state.materials ?? [];
  const doneSteps = detail?.state.doneSteps ?? [];
  const interviewPracticed = detail?.state.interview?.practiced ?? [];
  const interviewResults = detail?.state.interview?.results ?? {};
  const finalFeedbackText = detail?.state.finalFeedback?.text ?? "";
  // 성장 리포트(리뉴얼 산출물) — Experience Bank 중심의 점수화 결과.
  const report = (detail?.state.careerReport?.data ?? null) as ReportData | null;
  const careerBefore = detail?.state.careerScoreBefore ?? null;
  const expBank = detail?.state.experienceBank ?? [];
  const scoreResume = detail?.state.scores?.resume?.data as ScoreData | undefined;
  const scoreCover = detail?.state.scores?.cover?.data as ScoreData | undefined;
  const scoreInterview = detail?.state.scores?.interview?.data as ScoreData | undefined;
  const storyCount = detail?.state.storyBank?.data?.stories?.length ?? 0;
  const answers = detail?.state.answerBank?.data?.answers ?? [];
  const jobRec = detail?.state.jobRecommendation?.data?.jobs ?? [];
  const jdMatchPct = detail?.state.jdMatch?.data?.matchPercent ?? null;
  const hasGrowth = Boolean(report) || expBank.length > 0 || Boolean(scoreResume) || Boolean(scoreCover) || Boolean(scoreInterview) || storyCount > 0 || answers.length > 0 || jobRec.length > 0;
  const name = detail?.user.name?.trim() || detail?.user.realName?.trim() || detail?.user.email || t("학생", "Student", "学生", "Sinh viên", "学生", "Siswa");
  const hasResume = detail ? hasResumeContent(detail.resume) : false;
  const hasCover = detail ? hasCoverContent(detail.cover) : false;

  // 진행 체크리스트 — 헤더 진행률과 개요 탭이 함께 쓴다.
  const checklist = useMemo(() => {
    if (!detail) return [];
    return [
      { l: t("취업 진단", "Diagnosis", "求职诊断", "Chẩn đoán", "就活診断", "Diagnosis"), done: Boolean(diag && typeof diag.percent === "number") },
      { l: t("직무 선정", "Job selection", "职务选择", "Chọn vị trí", "職務選定", "Pilih posisi"), done: jobs.length > 0 },
      { l: t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"), done: hasResume },
      { l: t("자기소개서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter"), done: hasCover },
      { l: INTERVIEW_LABEL.self, done: interviewPracticed.includes("self") },
      { l: INTERVIEW_LABEL.job, done: interviewPracticed.includes("job") },
      { l: INTERVIEW_LABEL.fit, done: interviewPracticed.includes("fit") },
      { l: t("최종 피드백", "Final feedback", "最终反馈", "Phản hồi cuối cùng", "最終フィードバック", "Umpan balik akhir"), done: Boolean(finalFeedbackText) }
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, diag, jobs, hasResume, hasCover, interviewPracticed, finalFeedbackText]);

  const doneCount = checklist.filter((c) => c.done).length;
  const percent = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0;
  const allDone = checklist.length > 0 && doneCount === checklist.length;
  const pending = checklist.filter((c) => !c.done).map((c) => c.l);

  const headerSub = detail
    ? [
        detail.user.email,
        detail.user.phoneNumber || "",
        detail.cohort ? `${detail.cohort.university} · ${detail.cohort.name}` : t("기수 미등록", "Not assigned to a cohort", "未分配期数", "Chưa xếp khóa", "コホート未登録", "Belum ditetapkan ke batch")
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: t("개요", "Overview", "概览", "Tổng quan", "概要", "Ikhtisar") },
    { key: "growth", label: t("성장 리포트", "Growth report", "成长报告", "Báo cáo tăng trưởng", "成長レポート", "Laporan pertumbuhan") },
    { key: "docs", label: t("산출물", "Documents", "产出", "Tài liệu", "成果物", "Dokumen") },
    { key: "interview", label: t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara") },
    { key: "ops", label: t("운영", "Operations", "运营", "Vận hành", "運営", "Operasi") }
  ];

  return (
    <main className="pb-16 pt-6 md:pt-10">
      <section className="ops-content-section">
        <Link href="/career-launch/ops/students" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--ink-faint)] transition hover:text-[var(--ink)]">
          <ArrowLeft size={13} weight="bold" aria-hidden />
          {t("학생 목록", "Student list", "学生列表", "Danh sách sinh viên", "学生一覧", "Daftar siswa")}
        </Link>

        <header className="mt-3">
          <h1>{loading ? t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…") : name}</h1>
          <p>{headerSub}</p>
        </header>

        {loading ? (
          <div className="ops-empty-card">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</div>
        ) : error || !detail ? (
          <div className="ops-error-card">{error || t("학생을 찾을 수 없어요.", "Student not found.", "找不到学生。", "Không tìm thấy sinh viên.", "学生が見つかりません。", "Siswa tidak ditemukan.")}</div>
        ) : (
          <article className="ops-partner-list-card">
            {/* 요약 바 — 진행률과 자주 쓰는 액션을 탭 위에 고정 */}
            <div className="ops-partner-list-top">
              <div style={{ minWidth: 220, flex: 1 }}>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-[var(--ink)]">
                    {t("진행률", "Progress", "进度", "Tiến độ", "進捗", "Progres")}{" "}
                    <span className={allDone ? "text-[var(--accent-ink)]" : "text-[var(--accent-ink)]"}>{percent}%</span>
                  </span>
                  <span className="text-[12px] text-[var(--ink-faint)]">
                    {doneCount}/{checklist.length}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                  <div className="h-full rounded-full" style={{ width: `${percent}%`, background: allDone ? "var(--accent-ink)" : "var(--accent)" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {hasResume ? (
                  <a href={`/career-launch/ops-print/${id}?doc=resume`} target="_blank" rel="noopener noreferrer" className="ops-detail-button">
                    {t("이력서 PDF", "Resume PDF", "简历 PDF", "PDF CV", "履歴書PDF", "PDF Resume")}
                  </a>
                ) : null}
                {hasCover ? (
                  <a href={`/career-launch/ops-print/${id}?doc=cover`} target="_blank" rel="noopener noreferrer" className="ops-detail-button">
                    {t("자소서 PDF", "Cover letter PDF", "自我介绍 PDF", "PDF thư xin việc", "自己PR PDF", "PDF Cover letter")}
                  </a>
                ) : null}
              </div>
            </div>

            {/* 탭 */}
            <div className="ops-detail-tabs" role="tablist" aria-label={t("학생 상세 탭", "Student detail tabs", "学生详情标签", "Tab chi tiết sinh viên", "学生詳細タブ", "Tab detail siswa")}>
              {TABS.map((tb) => (
                <button
                  key={tb.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === tb.key}
                  className={`ops-detail-tab ${tab === tb.key ? "is-active" : ""}`}
                  onClick={() => setTab(tb.key)}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            <div className="ops-detail-tab-panel">
              {/* ── 개요 ── */}
              {tab === "overview" ? (
                <div className="ops-detail-sections">
                  <section className="ops-detail-section">
                    <h3>{t("진행 현황", "Progress overview", "进度概览", "Tổng quan tiến độ", "進捗状況", "Ikhtisar progres")}</h3>
                    {/* 완료/미완료를 색·아이콘으로 구분해 한눈에 스캔되게. */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                      {checklist.map((c, i) => (
                        <div key={i} className={`flex items-center gap-2 text-[13px] ${c.done ? "text-[var(--ink)]" : "text-[var(--ink-faint)]"}`}>
                          <span
                            className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] font-bold ${
                              c.done ? "bg-[var(--accent-soft)] text-[var(--accent-ink)]" : "border border-[var(--line)] text-transparent"
                            }`}
                          >
                            <Check size={12} weight="bold" aria-hidden />
                          </span>
                          <span className={c.done ? "font-medium" : ""}>{c.l}</span>
                        </div>
                      ))}
                    </div>
                    {pending.length > 0 ? (
                      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-[var(--sand-soft)] px-3 py-2 text-[13px]">
                        <span className="font-bold text-[var(--sand)]">{t("다음 할 일", "Next up", "下一步", "Tiếp theo", "次のステップ", "Berikutnya")}</span>
                        <span className="break-keep text-[var(--sand)]">{pending.join(" · ")}</span>
                      </div>
                    ) : (
                      <p className="mt-3 font-semibold text-[var(--accent-ink)]">
                        {t("모든 단계를 완료했어요", "All steps complete", "已完成所有步骤", "Đã hoàn thành tất cả", "すべてのステップ完了", "Semua langkah selesai")}
                      </p>
                    )}
                  </section>

                  <section className="ops-detail-section">
                    <h3>{t("취업 준비 진단", "Job-readiness diagnosis", "求职准备诊断", "Chẩn đoán mức độ sẵn sàng xin việc", "就活準備の診断", "Diagnosis kesiapan kerja")}</h3>
                    {diag && typeof diag.percent === "number" ? (
                      <>
                        {diagAfter !== null && diagAfter !== undefined ? (
                          <p className="text-[15px] font-semibold text-[var(--ink)]">
                            {t("준비도", "Readiness", "准备度", "Mức độ sẵn sàng", "準備度", "Kesiapan")}{" "}
                            <span className="text-[var(--ink-faint)]">{diagBefore}%</span>
                            <span className="mx-1 text-[var(--ink-faint)]">→</span>
                            <span className="text-[var(--accent-ink)]">{diagAfter}%</span>
                            {diagGain !== null ? (
                              <span className="ml-2 rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[12.5px] font-bold text-[var(--accent-ink)]">
                                {diagGain >= 0 ? `+${diagGain}` : diagGain}%p
                              </span>
                            ) : null}
                            {diag.level ? <span className="ml-1.5 block text-[13px] font-normal text-[var(--ink-faint)]">{diag.level}</span> : null}
                          </p>
                        ) : (
                          <p className="text-[14px] font-semibold text-[var(--ink)]">
                            {t("준비도", "Readiness", "准备度", "Mức độ sẵn sàng", "準備度", "Kesiapan")} <span className="text-[var(--accent-ink)]">{diag.percent}%</span>
                            {diag.level ? <span className="ml-1.5 text-[13px] font-normal text-[var(--ink-faint)]">· {diag.level}</span> : null}
                          </p>
                        )}
                        {diag.strengths?.length ? (
                          <div>
                            <p className="text-[12px] font-semibold text-[var(--accent-ink)]">{t("강점", "Strengths", "优势", "Điểm mạnh", "強み", "Kelebihan")}</p>
                            <ul className="mt-1.5 space-y-1">
                              {diag.strengths.map((x, i) => (
                                <li key={i} className="flex gap-1.5 break-keep text-[13px] text-[var(--ink-soft)]">
                                  <span className="text-[var(--accent-ink)]"><Check size={12} weight="bold" aria-hidden /></span>
                                  {x}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {diag.improvements?.length ? (
                          <div>
                            <p className="text-[12px] font-semibold text-[var(--ink-faint)]">{t("보완점", "Areas to improve", "待改进点", "Điểm cần cải thiện", "改善点", "Hal yang perlu diperbaiki")}</p>
                            <ul className="mt-1.5 space-y-1">
                              {diag.improvements.map((x, i) => (
                                <li key={i} className="flex gap-1.5 break-keep text-[13px] text-[var(--ink-soft)]">
                                  <span className="text-[var(--ink-faint)]">•</span>
                                  {x}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="ops-detail-empty">{t("아직 진단하지 않았어요.", "Not diagnosed yet.", "尚未进行诊断。", "Chưa chẩn đoán.", "まだ診断していません。", "Belum didiagnosis.")}</p>
                    )}
                  </section>

                  <section className="ops-detail-section">
                    <h3>
                      {t("선정 직무", "Selected jobs", "已选职务", "Vị trí đã chọn", "選定した職務", "Posisi terpilih")} {jobs.length > 0 ? `(${jobs.length})` : ""}
                    </h3>
                    {jobs.length ? (
                      <div className="ops-card-grid">
                        {jobs.map((role) => {
                          const job = RECOMMENDED_JOBS.find((x) => x.role === role);
                          return (
                            <article key={role} className="ops-list-card">
                              <p className="text-[14px] font-semibold text-[var(--ink)]">{role}</p>
                              {job?.reason ? <p className="break-keep text-[13px] leading-relaxed text-[var(--ink-soft)]">{jobReason(job.id)}</p> : null}
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="ops-detail-empty">{t("아직 선정하지 않았어요.", "Not selected yet.", "尚未选择。", "Chưa chọn.", "まだ選定していません。", "Belum dipilih.")}</p>
                    )}
                  </section>

                  {materials.length ? (
                    <section className="ops-detail-section">
                      <h3>
                        {t("정리한 직무 정보", "Organized job info", "整理的职务信息", "Thông tin công việc đã tổng hợp", "整理した職務情報", "Info pekerjaan yang dirangkum")} ({materials.length})
                      </h3>
                      <ul className="space-y-1">
                        {materials.map((m, i) => (
                          <li key={i} className="flex gap-1.5 break-keep text-[13px] text-[var(--ink-soft)]">
                            <span className="text-[var(--ink-faint)]">•</span>
                            {m}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {doneSteps.length ? (
                    <section className="ops-detail-section">
                      <h3>
                        {t("완료 스텝", "Completed steps", "已完成步骤", "Bước đã hoàn thành", "完了ステップ", "Langkah selesai")} ({doneSteps.length}/21)
                      </h3>
                      {/* 21개 칩은 노이즈라 기본 접힘 — 필요할 때만 펼친다. */}
                      <details className="mt-1">
                        <summary className="cursor-pointer text-[13px] text-[var(--ink-faint)] transition hover:text-[var(--ink)]">
                          {t("세부 스텝 보기", "Show step details", "查看详细步骤", "Xem chi tiết các bước", "詳細ステップを表示", "Lihat detail langkah")}
                        </summary>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {doneSteps.map((s) => (
                            <span key={s} className="ops-status-badge ops-status-approved">
                              {/* 내부 스텝 id(w2s4 등) 대신 사람이 읽을 제목으로 */}
                              {stepText(s, "title") || s}
                            </span>
                          ))}
                        </div>
                      </details>
                    </section>
                  ) : null}
                </div>
              ) : null}

              {/* ── 성장 리포트 (리뉴얼 점수화 산출물) ── */}
              {tab === "growth" ? (
                <div className="ops-detail-sections">
                  {!hasGrowth ? (
                    <section className="ops-detail-section">
                      <p className="ops-detail-empty">
                        {t(
                          "아직 성장 리포트 데이터가 없어요. 학생이 커리어 스코어·경험 은행 등을 생성하면 여기에 표시됩니다.",
                          "No growth data yet. It appears once the student generates their career score, experience bank, etc.",
                          "暂无成长数据。学生生成职业评分、经历银行等后将显示于此。",
                          "Chưa có dữ liệu. Sẽ hiển thị khi sinh viên tạo điểm sự nghiệp, ngân hàng kinh nghiệm…",
                          "まだデータがありません。学生がキャリアスコアや経験バンクを生成すると表示されます。",
                          "Belum ada data. Muncul setelah siswa membuat skor karier, bank pengalaman, dll."
                        )}
                      </p>
                    </section>
                  ) : (
                    <>
                      {/* 커리어 스코어 */}
                      {report ? (
                        <section className="ops-detail-section">
                          <h3>{t("커리어 스코어", "Career score", "职业评分", "Điểm sự nghiệp", "キャリアスコア", "Skor karier")}</h3>
                          <p className="text-[15px] font-semibold text-[var(--ink)]">
                            {t("총점", "Total", "总分", "Tổng", "総合", "Total")}{" "}
                            {careerBefore !== null && careerBefore !== undefined && typeof report.total === "number" ? (
                              <>
                                <span className="text-[var(--ink-faint)]">{careerBefore}</span>
                                <span className="mx-1 text-[var(--ink-faint)]">→</span>
                                <span className="text-[var(--accent-ink)]">{report.total}</span>
                                <span className="ml-2 rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[12.5px] font-bold text-[var(--accent-ink)]">
                                  {report.total - careerBefore >= 0 ? `+${report.total - careerBefore}` : report.total - careerBefore}
                                </span>
                              </>
                            ) : (
                              <span className="text-[var(--accent-ink)]">{report.total ?? "-"}</span>
                            )}
                          </p>
                          {report.areas ? (
                            <div className="mt-3 space-y-1.5">
                              {(
                                [
                                  ["direction", t("방향성", "Direction", "方向", "Định hướng", "方向性", "Arah")],
                                  ["experience", t("경험", "Experience", "经历", "Kinh nghiệm", "経験", "Pengalaman")],
                                  ["competency", t("역량", "Competency", "能力", "Năng lực", "力量", "Kompetensi")],
                                  ["resume", t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")],
                                  ["cover", t("자소서", "Cover", "自我介绍", "Thư", "自己PR", "Cover")],
                                  ["interview", t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara")]
                                ] as const
                              ).map(([k, label]) => {
                                const v = report.areas?.[k as keyof NonNullable<ReportData["areas"]>] ?? 0;
                                return (
                                  <div key={k} className="flex items-center gap-2 text-[12.5px]">
                                    <span className="w-16 flex-none text-[var(--ink-faint)]">{label}</span>
                                    <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                                      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, v))}%`, background: "var(--accent)" }} />
                                    </div>
                                    <span className="w-8 flex-none text-right font-semibold tabular-nums text-[var(--ink)]">{v}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                          {report.why ? <p className="mt-3 break-keep text-[13px] leading-relaxed text-[var(--ink-soft)]">{report.why}</p> : null}
                          {report.strengths?.length ? (
                            <div className="mt-3">
                              <p className="text-[12px] font-semibold text-[var(--accent-ink)]">{t("강점", "Strengths", "优势", "Điểm mạnh", "強み", "Kelebihan")}</p>
                              <ul className="mt-1.5 space-y-1">
                                {report.strengths.map((x, i) => (
                                  <li key={i} className="flex gap-1.5 break-keep text-[13px] text-[var(--ink-soft)]"><span className="text-[var(--accent-ink)]"><Check size={12} weight="bold" aria-hidden /></span>{x}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {report.gaps?.length ? (
                            <div className="mt-3">
                              <p className="text-[12px] font-semibold text-[var(--ink-faint)]">{t("보완점", "Gaps", "待改进", "Cần cải thiện", "改善点", "Kekurangan")}</p>
                              <ul className="mt-1.5 space-y-1">
                                {report.gaps.map((x, i) => (
                                  <li key={i} className="flex gap-1.5 break-keep text-[13px] text-[var(--ink-soft)]"><span className="text-[var(--ink-faint)]">•</span>{x}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {report.roadmap && (report.roadmap.targetRole || report.roadmap.targetCompanies?.length) ? (
                            <div className="mt-3 rounded-lg bg-[var(--sand-soft)] px-3 py-2.5">
                              <p className="text-[12px] font-bold text-[var(--sand)]">{t("로드맵", "Roadmap", "路线图", "Lộ trình", "ロードマップ", "Peta jalan")}</p>
                              {report.roadmap.targetRole ? (
                                <p className="mt-1 break-keep text-[13px] text-[var(--sand)]">
                                  {t("목표 직무", "Target role", "目标职务", "Vị trí mục tiêu", "目標職務", "Target posisi")}: <span className="font-semibold">{report.roadmap.targetRole}</span>
                                </p>
                              ) : null}
                              {report.roadmap.targetCompanies?.length ? (
                                <p className="mt-1 break-keep text-[13px] text-[var(--sand)]">{t("목표 기업", "Target companies", "目标企业", "Công ty mục tiêu", "目標企業", "Target perusahaan")}: {report.roadmap.targetCompanies.join(", ")}</p>
                              ) : null}
                            </div>
                          ) : null}
                        </section>
                      ) : null}

                      {/* 개별 점수 — 이력서/자소서/면접 */}
                      {scoreResume || scoreCover || scoreInterview ? (
                        <section className="ops-detail-section">
                          <h3>{t("항목별 점수", "Item scores", "分项评分", "Điểm từng mục", "項目別スコア", "Skor per item")}</h3>
                          <div className="grid grid-cols-3 gap-3">
                            {(
                              [
                                [t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"), scoreResume],
                                [t("자소서", "Cover", "自我介绍", "Thư", "自己PR", "Cover"), scoreCover],
                                [t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara"), scoreInterview]
                              ] as const
                            ).map(([label, sc], i) => (
                              <div key={i} className="rounded-xl border border-[var(--line)] p-3 text-center">
                                <p className="text-[12px] text-[var(--ink-faint)]">{label}</p>
                                <p className="mt-1 text-[22px] font-extrabold tabular-nums text-[var(--ink)]">{typeof sc?.total === "number" ? sc.total : "–"}</p>
                              </div>
                            ))}
                          </div>
                          {[scoreResume, scoreCover, scoreInterview].some((s) => s?.why || s?.tips?.length) ? (
                            <div className="mt-3 space-y-2">
                              {(
                                [
                                  [t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"), scoreResume],
                                  [t("자소서", "Cover", "自我介绍", "Thư", "自己PR", "Cover"), scoreCover],
                                  [t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara"), scoreInterview]
                                ] as const
                              )
                                .filter(([, sc]) => sc?.why || sc?.tips?.length)
                                .map(([label, sc], i) => (
                                  <details key={i} className="rounded-lg border border-[var(--line)] p-3">
                                    <summary className="cursor-pointer text-[13px] font-semibold text-[var(--ink)]">{label}</summary>
                                    {sc?.why ? <p className="mt-2 break-keep text-[13px] leading-relaxed text-[var(--ink-soft)]">{sc.why}</p> : null}
                                    {sc?.tips?.length ? (
                                      <ul className="mt-2 space-y-1">
                                        {sc.tips.map((x, ti) => (
                                          <li key={ti} className="flex gap-1.5 break-keep text-[12.5px] text-[var(--ink-soft)]"><span className="text-[var(--ink-faint)]">•</span>{x}</li>
                                        ))}
                                      </ul>
                                    ) : null}
                                  </details>
                                ))}
                            </div>
                          ) : null}
                        </section>
                      ) : null}

                      {/* Experience Bank */}
                      {expBank.length ? (
                        <section className="ops-detail-section">
                          <h3>{t("경험 은행", "Experience bank", "经历银行", "Ngân hàng kinh nghiệm", "経験バンク", "Bank pengalaman")} ({expBank.length})</h3>
                          <div className="space-y-2.5">
                            {expBank.map((e) => (
                              <article key={e.id} className="rounded-xl border border-[var(--line)] p-4">
                                <p className="text-[13.5px] font-semibold text-[var(--ink)]">
                                  {e.experience || "-"}
                                  {e.role ? <span className="font-normal text-[var(--ink-faint)]"> · {e.role}</span> : null}
                                  {e.period ? <span className="ml-1 text-[12px] font-normal text-[var(--ink-faint)]">{e.period}</span> : null}
                                </p>
                                {e.actions?.length ? (
                                  <ul className="mt-1.5 space-y-0.5">
                                    {e.actions.map((a, ai) => (
                                      <li key={ai} className="flex gap-1.5 break-keep text-[12.5px] text-[var(--ink-soft)]"><span className="text-[var(--ink-faint)]">•</span>{a}</li>
                                    ))}
                                  </ul>
                                ) : null}
                                {e.results?.length ? (
                                  <ul className="mt-1 space-y-0.5">
                                    {e.results.map((r, ri) => (
                                      <li key={ri} className="flex gap-1.5 break-keep text-[12.5px] text-[var(--accent-ink)]"><span>↑</span>{r}</li>
                                    ))}
                                  </ul>
                                ) : null}
                                {(e.skills?.length || e.competencies?.length) ? (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {[...(e.skills ?? []), ...(e.competencies ?? [])].map((s, si) => (
                                      <span key={si} className="ops-status-badge ops-status-draft">{s}</span>
                                    ))}
                                  </div>
                                ) : null}
                              </article>
                            ))}
                          </div>
                        </section>
                      ) : null}

                      {/* 직무 추천 · JD 매치 */}
                      {jobRec.length || jdMatchPct !== null ? (
                        <section className="ops-detail-section">
                          <h3>{t("직무 추천", "Job recommendation", "职务推荐", "Gợi ý vị trí", "職務推薦", "Rekomendasi posisi")}</h3>
                          {jdMatchPct !== null ? (
                            <p className="text-[13px] text-[var(--ink-soft)]">{t("JD 적합도", "JD match", "JD 匹配", "Độ khớp JD", "JD適合度", "Kecocokan JD")}: <span className="font-bold text-[var(--accent-ink)]">{jdMatchPct}%</span></p>
                          ) : null}
                          {jobRec.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {jobRec.map((j, i) => (
                                <span key={i} className="ops-status-badge ops-status-approved">{j.role}{typeof j.fit === "number" ? ` · ${j.fit}%` : ""}</span>
                              ))}
                            </div>
                          ) : null}
                        </section>
                      ) : null}

                      {/* 스토리 · 답변 은행 */}
                      {storyCount > 0 || answers.length > 0 ? (
                        <section className="ops-detail-section">
                          <h3>{t("스토리·답변 은행", "Story & answer bank", "故事·回答银行", "Ngân hàng câu chuyện & câu trả lời", "ストーリー・回答バンク", "Bank cerita & jawaban")}</h3>
                          <p className="text-[13px] text-[var(--ink-soft)]">
                            {t("스토리", "Stories", "故事", "Câu chuyện", "ストーリー", "Cerita")} {storyCount} · {t("면접 답변", "Interview answers", "面试回答", "Câu trả lời", "面接回答", "Jawaban")} {answers.length}
                          </p>
                          {answers.length ? (
                            <div className="mt-2 space-y-2">
                              {answers.slice(0, 3).map((a, i) => (
                                <details key={i} className="rounded-lg border border-[var(--line)] p-3">
                                  <summary className="cursor-pointer text-[13px] font-semibold text-[var(--ink)]">{a.question}</summary>
                                  <p className="mt-2 whitespace-pre-wrap break-keep text-[12.5px] leading-relaxed text-[var(--ink-soft)]">{a.answer}</p>
                                </details>
                              ))}
                            </div>
                          ) : null}
                        </section>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}

              {/* ── 산출물 ── */}
              {/* A4 시트(ResumeRender/CoverRender)는 학생 미리보기용이라 내용이 짧아도
                  페이지 높이를 그대로 차지해 어드민에선 빈 여백만 커진다.
                  여기선 훑어보기 좋은 압축 뷰를 쓰고, 실제 문서는 'PDF 보기'로 넘긴다. */}
              {tab === "docs" ? (
                <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                  {/* 이력서 */}
                  <section className="ops-detail-section">
                    <div className="ops-partner-list-top">
                      <h3>{t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")}</h3>
                      {hasResume ? (
                        <a href={`/career-launch/ops-print/${id}?doc=resume`} target="_blank" rel="noopener noreferrer" className="ops-detail-button">
                          {t("PDF 보기", "View PDF", "查看 PDF", "Xem PDF", "PDFを見る", "Lihat PDF")}
                        </a>
                      ) : null}
                    </div>
                    {!hasResume ? (
                      <p className="ops-detail-empty">{t("아직 이력서를 만들지 않았어요.", "No resume created yet.", "尚未生成简历。", "Chưa tạo CV.", "まだ履歴書を作っていません。", "Belum membuat resume.")}</p>
                    ) : (
                      <div>
                        {detail.resume.basic?.summary ? (
                          <p className="break-keep text-[13px] leading-relaxed text-[var(--ink-soft)]">{detail.resume.basic.summary}</p>
                        ) : null}

                        {detail.resume.experiences?.length
                          ? (() => {
                              const exps = detail.resume.experiences ?? [];
                              const groups: { label: string; items: typeof exps }[] = [
                                { label: t("경력", "Experience", "经历", "Kinh nghiệm", "経歴", "Pengalaman"), items: exps.filter((e) => e.kind !== "other") },
                                { label: t("활동·프로젝트", "Activities & projects", "活动·项目", "Hoạt động·Dự án", "活動·プロジェクト", "Aktivitas·Proyek"), items: exps.filter((e) => e.kind === "other") }
                              ];
                              return groups
                                .filter((g) => g.items.length)
                                .map((g) => (
                                  <div key={g.label} className="mt-4">
                                    <p className="text-[12px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">{g.label}</p>
                                    <ul className="mt-2 space-y-3">
                                      {g.items.map((e, i) => (
                                        <li key={i}>
                                          <p className="text-[13.5px] font-semibold text-[var(--ink)]">
                                            {e.title || "-"}
                                            {e.org ? <span className="font-normal text-[var(--ink-faint)]"> · {e.org}</span> : null}
                                            {e.period ? <span className="ml-1 text-[12px] font-normal text-[var(--ink-faint)]">{e.period}</span> : null}
                                          </p>
                                          {e.bullets?.length ? (
                                            <ul className="mt-1 space-y-0.5">
                                              {e.bullets.map((b, bi) => (
                                                <li key={bi} className="flex gap-1.5 break-keep text-[12.5px] text-[var(--ink-soft)]">
                                                  <span className="text-[var(--ink-faint)]">•</span>
                                                  {b}
                                                </li>
                                              ))}
                                            </ul>
                                          ) : null}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ));
                            })()
                          : null}

                        {detail.resume.educations?.length ? (
                          <div className="mt-4">
                            <p className="text-[12px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
                              {t("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan")}
                            </p>
                            <ul className="mt-2 space-y-1">
                              {detail.resume.educations.map((e, i) => (
                                <li key={i} className="text-[13px] text-[var(--ink-soft)]">
                                  <span className="font-semibold text-[var(--ink)]">{e.school || "-"}</span>
                                  {e.major ? ` · ${e.major}` : ""}
                                  {e.degree ? ` · ${e.degree}` : ""}
                                  {e.period ? <span className="ml-1 text-[12px] text-[var(--ink-faint)]">{e.period}</span> : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {detail.resume.skills?.length ? (
                          <div className="mt-4">
                            <p className="text-[12px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
                              {t("스킬", "Skills", "技能", "Kỹ năng", "スキル", "Keahlian")}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {detail.resume.skills.map((sk, i) => (
                                <span key={i} className="ops-status-badge ops-status-draft">
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {detail.resume.languages?.length ? (
                          <div className="mt-4">
                            <p className="text-[12px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
                              {t("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa")}
                            </p>
                            <ul className="mt-2 space-y-1">
                              {detail.resume.languages.map((l, i) => (
                                <li key={i} className="text-[13px] text-[var(--ink-soft)]">
                                  <span className="font-semibold text-[var(--ink)]">{l.language || "-"}</span>
                                  {l.level ? <span className="text-[var(--ink-faint)]"> · {l.level}</span> : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </section>

                  {/* 자기소개서 */}
                  <section className="ops-detail-section">
                    <div className="ops-partner-list-top">
                      <h3>
                        {t("자기소개서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter")}
                        {detail.cover.items?.length ? <span className="ml-1 text-[12px] font-normal text-[var(--ink-faint)]">({detail.cover.items.length})</span> : null}
                      </h3>
                      {hasCover ? (
                        <a href={`/career-launch/ops-print/${id}?doc=cover`} target="_blank" rel="noopener noreferrer" className="ops-detail-button">
                          {t("PDF 보기", "View PDF", "查看 PDF", "Xem PDF", "PDFを見る", "Lihat PDF")}
                        </a>
                      ) : null}
                    </div>
                    {!hasCover ? (
                      <p className="ops-detail-empty">{t("아직 자기소개서를 만들지 않았어요.", "No cover letter created yet.", "尚未生成自我介绍。", "Chưa tạo thư xin việc.", "まだ自己PRを作っていません。", "Belum membuat cover letter.")}</p>
                    ) : (
                      <div className="space-y-3">
                        {(detail.cover.items ?? [])
                          .filter((it) => (it.answer ?? "").trim())
                          .map((it, i) => (
                            <details key={i} open={i === 0} className="rounded-xl border border-[var(--line)] p-4">
                              <summary className="cursor-pointer text-[13.5px] font-semibold text-[var(--ink)]">{it.question}</summary>
                              <p className="mt-2 whitespace-pre-wrap break-keep text-[13px] leading-relaxed text-[var(--ink-soft)]">{it.answer}</p>
                            </details>
                          ))}
                      </div>
                    )}
                  </section>
                </div>
              ) : null}

              {/* ── 면접 ── */}
              {tab === "interview" ? (
                <div className="ops-detail-sections">
                  {/* 유형별로 완료 상태 + AI 총평을 한 카드에 묶어 스캔하기 쉽게. */}
                  <section className="ops-detail-section">
                    <h3>
                      {t("모의면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")} ({interviewPracticed.length}/3)
                    </h3>
                    <div className="space-y-2.5">
                      {(["self", "job", "fit"] as const).map((tp) => {
                        const done = interviewPracticed.includes(tp);
                        const summary = interviewResults[tp];
                        return (
                          <article key={tp} className={`rounded-xl border p-4 ${done ? "border-[var(--line)]" : "border-[var(--surface-2)] bg-[var(--surface-2)]"}`}>
                            <div className="flex items-center gap-2">
                              <span
                                className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] font-bold ${
                                  done ? "bg-[var(--accent-soft)] text-[var(--accent-ink)]" : "border border-[var(--line)] text-transparent"
                                }`}
                              >
                                <Check size={12} weight="bold" aria-hidden />
                              </span>
                              <p className={`text-[13.5px] font-semibold ${done ? "text-[var(--ink)]" : "text-[var(--ink-faint)]"}`}>{INTERVIEW_LABEL[tp]}</p>
                              <span className={`ml-auto text-[12px] font-semibold ${done ? "text-[var(--accent-ink)]" : "text-[var(--ink-faint)]"}`}>
                                {done ? t("완료", "Done", "已完成", "Xong", "完了", "Selesai") : t("미진행", "Not started", "未进行", "Chưa làm", "未実施", "Belum")}
                              </span>
                            </div>
                            {summary ? (
                              <div className="mt-2.5 whitespace-pre-wrap break-keep border-t border-[var(--surface-2)] pt-2.5 text-[13px] leading-relaxed text-[var(--ink-soft)]">
                                <RichText text={summary} />
                              </div>
                            ) : done ? (
                              <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">{t("AI 총평이 없어요.", "No AI summary.", "无 AI 总评。", "Không có tổng kết AI.", "AI総評はありません。", "Tidak ada ringkasan AI.")}</p>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>
                  </section>

                  {finalFeedbackText ? (
                    <section className="ops-detail-section">
                      <h3>{t("최종 피드백", "Final feedback", "最终反馈", "Phản hồi cuối cùng", "最終フィードバック", "Umpan balik akhir")}</h3>
                      <div className="whitespace-pre-wrap break-keep text-[13px] leading-relaxed text-[var(--ink-soft)]">
                        <RichText text={finalFeedbackText} />
                      </div>
                    </section>
                  ) : null}
                </div>
              ) : null}

              {/* ── 운영 ── */}
              {tab === "ops" ? (
                <div className="ops-detail-sections">
                  <section className="ops-detail-section">
                    <h3>{t("독려 메일", "Reminder email", "提醒邮件", "Email nhắc nhở", "リマインダーメール", "Email pengingat")}</h3>
                    <p className="ops-detail-empty">
                      {detail.lastNudgedAt
                        ? t(
                            `마지막 발송 ${detail.lastNudgedAt.slice(0, 10)} · 총 ${detail.nudgeCount}회`,
                            `Last sent ${detail.lastNudgedAt.slice(0, 10)} · ${detail.nudgeCount} total`,
                            `最后发送 ${detail.lastNudgedAt.slice(0, 10)} · 共 ${detail.nudgeCount} 次`,
                            `Gửi lần cuối ${detail.lastNudgedAt.slice(0, 10)} · tổng ${detail.nudgeCount} lần`,
                            `最終送信 ${detail.lastNudgedAt.slice(0, 10)} · 計${detail.nudgeCount}回`,
                            `Terakhir ${detail.lastNudgedAt.slice(0, 10)} · total ${detail.nudgeCount}x`
                          )
                        : t("아직 독려 메일을 보내지 않았어요.", "No reminder sent yet.", "尚未发送提醒邮件。", "Chưa gửi email nhắc nhở.", "まだリマインダーを送っていません。", "Belum ada pengingat terkirim.")}
                    </p>
                    <div className="ops-detail-actions">
                      <button type="button" className="ops-btn ops-btn-primary" disabled={nudging} onClick={() => void doNudge()}>
                        {nudging
                          ? t("보내는 중…", "Sending…", "发送中…", "Đang gửi…", "送信中…", "Mengirim…")
                          : t("독려 메일 보내기", "Send reminder", "发送提醒邮件", "Gửi email nhắc", "リマインダーを送る", "Kirim pengingat")}
                      </button>
                    </div>
                  </section>

                  <section className="ops-detail-section">
                    <h3>{t("운영자 메모", "Operator memo", "运营者备注", "Ghi chú của quản trị", "運営者メモ", "Memo operator")}</h3>
                    <p className="ops-detail-empty">
                      {t("학생에게는 보이지 않아요. 상담 내용이나 특이사항을 남겨두세요.", "Not visible to the student. Keep notes on calls or anything notable.", "学生看不到。可记录咨询内容或特殊事项。", "Sinh viên không thấy được. Ghi lại nội dung tư vấn hoặc điểm đáng chú ý.", "学生には表示されません。相談内容や特記事項を残してください。", "Tidak terlihat oleh siswa. Catat hasil konsultasi atau hal penting.")}
                    </p>
                    <textarea
                      value={memo}
                      onChange={(e) => {
                        setMemo(e.target.value);
                        setMemoSaved(false);
                      }}
                      rows={4}
                      maxLength={4000}
                      className="w-full rounded-lg border border-[var(--line)] p-3 text-[13px] leading-relaxed"
                      placeholder={t("예) 3주차 이후 연락 두절, 담당 교수와 확인 필요", "e.g. Unreachable after week 3, need to check with the professor", "例）第3周后失联，需与教授确认", "VD) Mất liên lạc sau tuần 3, cần kiểm tra với giáo sư", "例）3週目以降 連絡が取れない、担当教授に確認が必要", "Contoh) Tidak bisa dihubungi setelah minggu 3, perlu cek ke dosen")}
                    />
                    <div className="ops-detail-actions">
                      {memoSaved ? <span className="ops-status-badge ops-status-approved">{t("저장됨", "Saved", "已保存", "Đã lưu", "保存済み", "Tersimpan")}</span> : null}
                      <button type="button" className="ops-btn ops-btn-primary" disabled={memoSaving} onClick={() => void submitMemo()}>
                        {memoSaving ? t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…") : t("메모 저장", "Save memo", "保存备注", "Lưu ghi chú", "メモを保存", "Simpan memo")}
                      </button>
                    </div>
                  </section>

                  <section className="ops-detail-section">
                    <h3>{t("단계 초기화", "Reset a step", "重置步骤", "Đặt lại bước", "ステップの初期化", "Reset langkah")}</h3>
                    <p className="ops-detail-empty">
                      {t("학생이 다시 진행하도록 해당 단계 데이터를 초기화해요. 되돌릴 수 없어요.", "Reset a step's data so the student can redo it. This can't be undone.", "重置该步骤数据，让学生重新完成。此操作无法撤销。", "Đặt lại dữ liệu bước để sinh viên làm lại. Không thể hoàn tác.", "学生が再度進められるようそのステップのデータを初期化します。元に戻せません。", "Reset data langkah agar siswa dapat mengulanginya. Tidak dapat dibatalkan.")}
                    </p>
                    <div className="ops-detail-actions" style={{ justifyContent: "flex-start" }}>
                      {(
                        [
                          { t: "diagnosis", l: t("진단", "Diagnosis", "诊断", "Chẩn đoán", "診断", "Diagnosis") },
                          { t: "jobs", l: t("선정 직무", "Selected jobs", "已选职务", "Vị trí đã chọn", "選定した職務", "Posisi terpilih") },
                          { t: "materials", l: t("직무 정리", "Job info", "职务整理", "Tổng hợp công việc", "職務整理", "Rangkuman pekerjaan") },
                          { t: "resume", l: t("이력서", "Resume", "简历", "CV", "履歴書", "Resume") },
                          { t: "cover", l: t("자기소개서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter") },
                          { t: "interview", l: t("모의면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi") },
                          { t: "final_feedback", l: t("최종 피드백", "Final feedback", "最终反馈", "Phản hồi cuối cùng", "最終フィードバック", "Umpan balik akhir") }
                        ] as const
                      ).map((r) => (
                        <button key={r.t} type="button" disabled={resetting !== ""} onClick={() => doReset(r.t, r.l)} className="ops-btn ops-btn-danger">
                          {resetting === r.t
                            ? t("초기화 중…", "Resetting…", "重置中…", "Đang đặt lại…", "初期化中…", "Mereset…")
                            : t(`${r.l} 초기화`, `Reset ${r.l}`, `重置${r.l}`, `Đặt lại ${r.l}`, `${r.l}を初期化`, `Reset ${r.l}`)}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              ) : null}
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
