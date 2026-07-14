"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchOpsStudentDetail, resetStudentStep, type OpsStudentDetail, type OpsResetTarget } from "../../../../../lib/launch/ops-client";
import { hasResumeContent } from "../../../../../lib/launch/resume-data";
import { hasCoverContent } from "../../../../../lib/launch/cover-data";
import { RECOMMENDED_JOBS } from "../../../../../lib/launch/data";
import { ResumeRender } from "../../../../../components/launch/resume-render";
import { CoverRender } from "../../../../../components/launch/cover-render";
import { RichText } from "../../../../../components/launch/rich-text";
import { useLaunchT } from "../../../../../lib/launch/i18n";
import { useJobReason } from "../../../../../lib/launch/data-i18n";

// 운영자 학생 상세 — 진행 상태 + 대화로 만든 이력서 + 피드백 작성.
export default function LaunchOpsStudentDetailPage() {
  const t = useLaunchT();
  const jobReason = useJobReason();
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
  const [resetting, setResetting] = useState("");

  const load = async () => {
    try {
      const d = await fetchOpsStudentDetail(id);
      setDetail(d);
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
      alert(e instanceof Error ? e.message : t("초기화에 실패했어요.", "Failed to reset.", "重置失败。", "Đặt lại không thành công.", "リセットに失敗しました。", "Gagal mereset."));
    } finally {
      setResetting("");
    }
  };

  const diag = detail?.state.diagnosis ?? null;
  const jobs = detail?.state.selectedJobs ?? [];
  const materials = detail?.state.materials ?? [];
  const doneSteps = detail?.state.doneSteps ?? [];
  const interviewPracticed = detail?.state.interview?.practiced ?? [];
  const finalFeedbackText = detail?.state.finalFeedback?.text ?? "";
  const name = detail?.user.name?.trim() || detail?.user.realName?.trim() || detail?.user.email || t("학생", "Student", "学生", "Sinh viên", "学生", "Siswa");

  const headerSub = detail
    ? [
        detail.user.email,
        detail.user.phoneNumber || "",
        detail.cohort ? `${detail.cohort.university} · ${detail.cohort.name}` : t("기수 미등록", "Not assigned to a cohort", "未分配期数", "Chưa xếp khóa", "コホート未登録", "Belum ditetapkan ke batch")
      ]
        .filter(Boolean)
        .join(" · ")
    : t("학생 진행 상황과 제출물을 확인하고 피드백을 남겨요.", "Review the student's progress and submissions, then leave feedback.", "查看学生的进度与提交物并留下反馈。", "Xem tiến độ và bài nộp của sinh viên rồi để lại phản hồi.", "学生の進捗と提出物を確認してフィードバックを残します。", "Tinjau progres dan kiriman siswa lalu beri umpan balik.");

  return (
    <main className="pb-16 pt-6 md:pt-10">
      <section className="ops-content-section">
        <Link href="/career-launch/ops/students" className="text-[13px] font-semibold text-[#6b7280] transition hover:text-[#111827]">
          {t("← 학생 목록", "← Student list", "← 学生列表", "← Danh sách sinh viên", "← 学生一覧", "← Daftar siswa")}
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
          <div>
            <div className="ops-detail-sections">
              {/* 진행 체크리스트 — 무엇이 됐고 무엇이 안 됐는지 한눈에 */}
              {(() => {
                const checklist = [
                  { l: t("취업 진단", "Diagnosis", "求职诊断", "Chẩn đoán", "就活診断", "Diagnosis"), done: Boolean(diag && typeof diag.percent === "number") },
                  { l: t("직무 선정", "Job selection", "职务选择", "Chọn vị trí", "職務選定", "Pilih posisi"), done: jobs.length > 0 },
                  { l: t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"), done: hasResumeContent(detail.resume) },
                  { l: t("자기소개서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter"), done: hasCoverContent(detail.cover) },
                  { l: INTERVIEW_LABEL.self, done: interviewPracticed.includes("self") },
                  { l: INTERVIEW_LABEL.job, done: interviewPracticed.includes("job") },
                  { l: INTERVIEW_LABEL.fit, done: interviewPracticed.includes("fit") },
                  { l: t("최종 피드백", "Final feedback", "最终反馈", "Phản hồi cuối cùng", "最終フィードバック", "Umpan balik akhir"), done: Boolean(finalFeedbackText) }
                ];
                const doneCount = checklist.filter((c) => c.done).length;
                const percent = Math.round((doneCount / checklist.length) * 100);
                const allDone = doneCount === checklist.length;
                const pending = checklist.filter((c) => !c.done).map((c) => c.l);
                return (
                  <section className="ops-detail-section">
                    <h3>{t("진행 현황", "Progress overview", "进度概览", "Tổng quan tiến độ", "進捗状況", "Ikhtisar progres")}</h3>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-semibold text-[#111827]">
                        {t("진행률", "Progress", "进度", "Tiến độ", "進捗", "Progres")} <span className={allDone ? "text-[#15803d]" : "text-[#1d4ed8]"}>{percent}%</span>
                      </span>
                      <span className="text-[12px] text-[#6b7280]">{doneCount}/{checklist.length}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: "#f3f4f6" }}>
                      <div className="h-full rounded-full" style={{ width: `${percent}%`, background: allDone ? "#15803d" : "#111827" }} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {checklist.map((c, i) => (
                        <span key={i} className={`ops-status-badge ${c.done ? "ops-status-approved" : "ops-status-draft"}`}>
                          {c.l}
                        </span>
                      ))}
                    </div>
                    {pending.length > 0 ? (
                      <p className="ops-detail-empty mt-3 border-t border-[#f3f4f6] pt-3">
                        <span className="font-semibold text-[#92400e]">{t("미완료", "Not done", "未完成", "Chưa xong", "未完了", "Belum selesai")}</span> · {pending.join(" · ")}
                      </p>
                    ) : (
                      <p className="ops-detail-empty mt-3 border-t border-[#f3f4f6] pt-3 font-semibold" style={{ color: "#15803d" }}>
                        {t("모든 단계를 완료했어요 🎉", "All steps complete 🎉", "已完成所有步骤 🎉", "Đã hoàn thành tất cả 🎉", "すべてのステップ完了 🎉", "Semua langkah selesai 🎉")}
                      </p>
                    )}
                  </section>
                );
              })()}

              {/* 진단 결과 */}
              <section className="ops-detail-section">
                <h3>{t("취업 준비 진단", "Job-readiness diagnosis", "求职准备诊断", "Chẩn đoán mức độ sẵn sàng xin việc", "就活準備の診断", "Diagnosis kesiapan kerja")}</h3>
                {diag && typeof diag.percent === "number" ? (
                  <>
                    <p className="text-[14px] font-semibold text-[#111827]">
                      {t("준비도", "Readiness", "准备度", "Mức độ sẵn sàng", "準備度", "Kesiapan")} <span className="text-[#1d4ed8]">{diag.percent}%</span>
                      {diag.level ? <span className="ml-1.5 text-[13px] font-normal text-[#6b7280]">· {diag.level}</span> : null}
                    </p>
                    {diag.strengths?.length ? (
                      <div className="mt-3">
                        <p className="text-[12px] font-semibold text-[#15803d]">{t("강점", "Strengths", "优势", "Điểm mạnh", "強み", "Kelebihan")}</p>
                        <ul className="mt-1.5 space-y-1">
                          {diag.strengths.map((x, i) => (
                            <li key={i} className="flex gap-1.5 break-keep text-[13px] text-[#374151]">
                              <span className="text-[#15803d]">✓</span>
                              {x}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {diag.improvements?.length ? (
                      <div className="mt-3">
                        <p className="text-[12px] font-semibold text-[#6b7280]">{t("보완점", "Areas to improve", "待改进点", "Điểm cần cải thiện", "改善点", "Hal yang perlu diperbaiki")}</p>
                        <ul className="mt-1.5 space-y-1">
                          {diag.improvements.map((x, i) => (
                            <li key={i} className="flex gap-1.5 break-keep text-[13px] text-[#4b5563]">
                              <span className="text-[#9ca3af]">•</span>
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

              {/* 선정 직무 */}
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
                          <p className="text-[14px] font-semibold text-[#111827]">{role}</p>
                          {job?.reason ? <p className="break-keep text-[13px] leading-relaxed text-[#4b5563]">{jobReason(job.id)}</p> : null}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="ops-detail-empty">{t("아직 선정하지 않았어요.", "Not selected yet.", "尚未选择。", "Chưa chọn.", "まだ選定していません。", "Belum dipilih.")}</p>
                )}
              </section>

              {/* 정리한 직무 정보 */}
              {materials.length ? (
                <section className="ops-detail-section">
                  <h3>
                    {t("정리한 직무 정보", "Organized job info", "整理的职务信息", "Thông tin công việc đã tổng hợp", "整理した職務情報", "Info pekerjaan yang dirangkum")} ({materials.length})
                  </h3>
                  <ul className="space-y-1">
                    {materials.map((m, i) => (
                      <li key={i} className="flex gap-1.5 break-keep text-[13px] text-[#374151]">
                        <span className="text-[#9ca3af]">•</span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {/* 완료 스텝 */}
              {doneSteps.length ? (
                <section className="ops-detail-section">
                  <h3>
                    {t("완료 스텝", "Completed steps", "已完成步骤", "Bước đã hoàn thành", "完了ステップ", "Langkah selesai")} ({doneSteps.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {doneSteps.map((s) => (
                      <span key={s} className="ops-status-badge ops-status-approved">
                        {s}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}

              {/* 대화로 만든 이력서 */}
              <section className="ops-detail-section">
                <h3>{t("대화로 만든 이력서", "Resume built through chat", "通过对话生成的简历", "CV được tạo qua trò chuyện", "対話で作った履歴書", "Resume yang dibuat lewat obrolan")}</h3>
                {hasResumeContent(detail.resume) ? (
                  <ResumeRender data={detail.resume} />
                ) : (
                  <p className="ops-detail-empty">{t("아직 이력서를 만들지 않았어요.", "No resume created yet.", "尚未生成简历。", "Chưa tạo CV.", "まだ履歴書を作っていません。", "Belum membuat resume.")}</p>
                )}
              </section>

              {/* 대화로 만든 자기소개서 */}
              <section className="ops-detail-section">
                <h3>{t("대화로 만든 자기소개서", "Cover letter built through chat", "通过对话生成的自我介绍", "Thư xin việc được tạo qua trò chuyện", "対話で作った自己PR", "Cover letter yang dibuat lewat obrolan")}</h3>
                {hasCoverContent(detail.cover) ? (
                  <CoverRender data={detail.cover} />
                ) : (
                  <p className="ops-detail-empty">{t("아직 자기소개서를 만들지 않았어요.", "No cover letter created yet.", "尚未生成自我介绍。", "Chưa tạo thư xin việc.", "まだ自己PRを作っていません。", "Belum membuat cover letter.")}</p>
                )}
              </section>

              {/* 모의면접 */}
              <section className="ops-detail-section">
                <h3>
                  {t("모의면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")} {interviewPracticed.length > 0 ? `(${interviewPracticed.length}/3)` : ""}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(["self", "job", "fit"] as const).map((tp) => (
                    <span key={tp} className={`ops-status-badge ${interviewPracticed.includes(tp) ? "ops-status-approved" : "ops-status-draft"}`}>
                      {INTERVIEW_LABEL[tp]}
                    </span>
                  ))}
                </div>
                {interviewPracticed.length === 0 ? (
                  <p className="ops-detail-empty mt-3">{t("아직 모의면접을 연습하지 않았어요.", "No mock interview practiced yet.", "尚未练习模拟面试。", "Chưa luyện phỏng vấn thử.", "まだ模擬面接を練習していません。", "Belum berlatih wawancara simulasi.")}</p>
                ) : null}
              </section>

              {/* 최종 피드백 */}
              {finalFeedbackText ? (
                <section className="ops-detail-section">
                  <h3>{t("최종 피드백", "Final feedback", "最终反馈", "Phản hồi cuối cùng", "最終フィードバック", "Umpan balik akhir")}</h3>
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#374151]">
                    <RichText text={finalFeedbackText} />
                  </p>
                </section>
              ) : null}

              {/* 운영자 개입 — 단계 초기화(재진행 유도) */}
              <section className="ops-detail-section">
                <h3>{t("운영자 개입", "Operator actions", "运营者操作", "Thao tác của quản trị", "運営者による操作", "Tindakan operator")}</h3>
                <p className="ops-detail-empty mb-3">
                  {t("학생이 다시 진행하도록 해당 단계 데이터를 초기화해요", "Reset a step's data so the student can redo it", "重置该步骤数据，让学生重新完成", "Đặt lại dữ liệu bước để sinh viên làm lại", "学生が再度進められるようそのステップのデータを初期化します", "Reset data langkah agar siswa dapat mengulanginya")}
                </p>
                <div className="ops-detail-actions" style={{ justifyContent: "flex-start" }}>
                  {([
                    { t: "diagnosis", l: t("진단", "Diagnosis", "诊断", "Chẩn đoán", "診断", "Diagnosis") },
                    { t: "jobs", l: t("선정 직무", "Selected jobs", "已选职务", "Vị trí đã chọn", "選定した職務", "Posisi terpilih") },
                    { t: "materials", l: t("직무 정리", "Job info", "职务整理", "Tổng hợp công việc", "職務整理", "Rangkuman pekerjaan") },
                    { t: "resume", l: t("이력서", "Resume", "简历", "CV", "履歴書", "Resume") },
                    { t: "cover", l: t("자기소개서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter") },
                    { t: "interview", l: t("모의면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi") },
                    { t: "final_feedback", l: t("최종 피드백", "Final feedback", "最终反馈", "Phản hồi cuối cùng", "最終フィードバック", "Umpan balik akhir") }
                  ] as const).map((r) => (
                    <button
                      key={r.t}
                      type="button"
                      disabled={resetting !== ""}
                      onClick={() => doReset(r.t, r.l)}
                      className="ops-btn ops-btn-danger"
                    >
                      {resetting === r.t ? t("초기화 중…", "Resetting…", "重置中…", "Đang đặt lại…", "初期化中…", "Mereset…") : t(`${r.l} 초기화`, `Reset ${r.l}`, `重置${r.l}`, `Đặt lại ${r.l}`, `${r.l}を初期化`, `Reset ${r.l}`)}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
