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
import { OperatorResumeFeedback } from "../../../../../components/launch/operator-resume-feedback";
import { RichText } from "../../../../../components/launch/rich-text";
import { Card, LaunchContainer, Pill, SectionTitle } from "../../../../../components/launch/ui";
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

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-6xl pt-6 md:pt-10">
        <Link href="/career-launch/ops/students" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
          {t("← 학생 목록", "← Student list", "← 学生列表", "← Danh sách sinh viên", "← 学生一覧", "← Daftar siswa")}
        </Link>

        {loading ? (
          <Card className="mt-4 !p-6 text-center text-[14px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</Card>
        ) : error || !detail ? (
          <Card className="mt-4 !p-6 text-center text-[14px] text-red-600">{error || t("학생을 찾을 수 없어요.", "Student not found.", "找不到学生。", "Không tìm thấy sinh viên.", "学生が見つかりません。", "Siswa tidak ditemukan.")}</Card>
        ) : (
          <>
            {/* 헤더 */}
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-[#0B46E8] text-[18px] font-black text-white">
                {name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-[19px] font-black tracking-[-0.01em] text-[#0B1227]">{name}</h1>
                <p className="truncate text-[12.5px] text-[#8B95A1]">
                  {detail.user.email}
                  {detail.user.phoneNumber ? ` · ${detail.user.phoneNumber}` : ""}
                </p>
                {detail.cohort ? (
                  <p className="mt-0.5 truncate text-[12px] font-semibold text-[#0B46E8]">🎓 {detail.cohort.university} · {detail.cohort.name}</p>
                ) : (
                  <p className="mt-0.5 text-[12px] font-semibold text-[#C9CDD2]">{t("기수 미등록", "Not assigned to a cohort", "未分配期数", "Chưa xếp khóa", "コホート未登録", "Belum ditetapkan ke batch")}</p>
                )}
              </div>
            </div>

            <div className="mt-7 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start lg:gap-8">
              {/* 왼쪽: 진행 상태 + 이력서 */}
              <div>
            {/* 진단 결과 */}
            <div className="mt-6 first:mt-0">
              <SectionTitle>{t("취업 준비 진단", "Job-readiness diagnosis", "求职准备诊断", "Chẩn đoán mức độ sẵn sàng xin việc", "就活準備の診断", "Diagnosis kesiapan kerja")}</SectionTitle>
              {diag && typeof diag.percent === "number" ? (
                <Card className="!p-4">
                  <p className="text-[14px] font-bold text-[#191F28]">
                    {t("준비도", "Readiness", "准备度", "Mức độ sẵn sàng", "準備度", "Kesiapan")} <span className="text-[#0B46E8]">{diag.percent}%</span>
                    {diag.level ? <span className="ml-1.5 text-[13px] font-normal text-[#4E5968]">· {diag.level}</span> : null}
                  </p>
                  {diag.strengths?.length ? (
                    <div className="mt-2">
                      <p className="text-[11.5px] font-bold text-[#3A6B00]">{t("강점", "Strengths", "优势", "Điểm mạnh", "強み", "Kelebihan")}</p>
                      <ul className="mt-1 space-y-0.5">
                        {diag.strengths.map((x, i) => (
                          <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#333D4B]"><span className="text-[#3A6B00]">✓</span>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {diag.improvements?.length ? (
                    <div className="mt-2">
                      <p className="text-[11.5px] font-bold text-[#8B95A1]">{t("보완점", "Areas to improve", "待改进点", "Điểm cần cải thiện", "改善点", "Hal yang perlu diperbaiki")}</p>
                      <ul className="mt-1 space-y-0.5">
                        {diag.improvements.map((x, i) => (
                          <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#4E5968]"><span className="text-[#B0B8C1]">•</span>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </Card>
              ) : (
                <Card className="!p-4 text-[13px] text-[#8B95A1]">{t("아직 진단하지 않았어요.", "Not diagnosed yet.", "尚未进行诊断。", "Chưa chẩn đoán.", "まだ診断していません。", "Belum didiagnosis.")}</Card>
              )}
            </div>

            {/* 선정 직무 */}
            <div className="mt-6">
              <SectionTitle>{t("선정 직무", "Selected jobs", "已选职务", "Vị trí đã chọn", "選定した職務", "Posisi terpilih")} {jobs.length > 0 ? `(${jobs.length})` : ""}</SectionTitle>
              {jobs.length ? (
                <Card className="!p-4">
                  <ul className="space-y-2">
                    {jobs.map((role) => {
                      const job = RECOMMENDED_JOBS.find((x) => x.role === role);
                      return (
                        <li key={role} className="rounded-lg bg-[#F8FAFC] p-2.5">
                          <p className="text-[13px] font-bold text-[#191F28]">{role}</p>
                          {job?.reason ? <p className="mt-1 break-keep text-[12px] text-[#4E5968]">{jobReason(job.id)}</p> : null}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              ) : (
                <Card className="!p-4 text-[13px] text-[#8B95A1]">{t("아직 선정하지 않았어요.", "Not selected yet.", "尚未选择。", "Chưa chọn.", "まだ選定していません。", "Belum dipilih.")}</Card>
              )}
            </div>

            {/* 정리한 직무 정보 */}
            {materials.length ? (
              <div className="mt-6">
                <SectionTitle>{t("정리한 직무 정보", "Organized job info", "整理的职务信息", "Thông tin công việc đã tổng hợp", "整理した職務情報", "Info pekerjaan yang dirangkum")} ({materials.length})</SectionTitle>
                <Card className="!p-4">
                  <ul className="space-y-1.5">
                    {materials.map((m, i) => (
                      <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#333D4B]"><span className="text-[#3A6B00]">•</span>{m}</li>
                    ))}
                  </ul>
                </Card>
              </div>
            ) : null}

            {/* 완료 스텝 */}
            {doneSteps.length ? (
              <div className="mt-6">
                <SectionTitle>{t("완료 스텝", "Completed steps", "已完成步骤", "Bước đã hoàn thành", "完了ステップ", "Langkah selesai")} ({doneSteps.length})</SectionTitle>
                <Card className="!p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {doneSteps.map((s) => (
                      <Pill key={s} tone="green">{s}</Pill>
                    ))}
                  </div>
                </Card>
              </div>
            ) : null}

            {/* 대화로 만든 이력서 */}
            <div className="mt-6">
              <SectionTitle>{t("대화로 만든 이력서", "Resume built through chat", "通过对话生成的简历", "CV được tạo qua trò chuyện", "対話で作った履歴書", "Resume yang dibuat lewat obrolan")}</SectionTitle>
              {hasResumeContent(detail.resume) ? (
                <ResumeRender data={detail.resume} />
              ) : (
                <Card className="!p-4 text-[13px] text-[#8B95A1]">{t("아직 이력서를 만들지 않았어요.", "No resume created yet.", "尚未生成简历。", "Chưa tạo CV.", "まだ履歴書を作っていません。", "Belum membuat resume.")}</Card>
              )}
            </div>

            {/* 대화로 만든 자기소개서 */}
            <div className="mt-6">
              <SectionTitle>{t("대화로 만든 자기소개서", "Cover letter built through chat", "通过对话生成的自我介绍", "Thư xin việc được tạo qua trò chuyện", "対話で作った自己PR", "Cover letter yang dibuat lewat obrolan")}</SectionTitle>
              {hasCoverContent(detail.cover) ? (
                <CoverRender data={detail.cover} />
              ) : (
                <Card className="!p-4 text-[13px] text-[#8B95A1]">{t("아직 자기소개서를 만들지 않았어요.", "No cover letter created yet.", "尚未生成自我介绍。", "Chưa tạo thư xin việc.", "まだ自己PRを作っていません。", "Belum membuat cover letter.")}</Card>
              )}
            </div>

            {/* 모의면접 */}
            <div className="mt-6">
              <SectionTitle>{t("모의면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")} {interviewPracticed.length > 0 ? `(${interviewPracticed.length}/3)` : ""}</SectionTitle>
              <Card className="!p-4">
                <div className="flex flex-wrap gap-1.5">
                  {(["self", "job", "fit"] as const).map((tp) => (
                    <Pill key={tp} tone={interviewPracticed.includes(tp) ? "green" : "grey"}>{INTERVIEW_LABEL[tp]}</Pill>
                  ))}
                </div>
                {interviewPracticed.length === 0 ? <p className="mt-2 text-[12.5px] text-[#8B95A1]">{t("아직 모의면접을 연습하지 않았어요.", "No mock interview practiced yet.", "尚未练习模拟面试。", "Chưa luyện phỏng vấn thử.", "まだ模擬面接を練習していません。", "Belum berlatih wawancara simulasi.")}</p> : null}
              </Card>
            </div>

            {/* 최종 피드백 */}
            {finalFeedbackText ? (
              <div className="mt-6">
                <SectionTitle>{t("최종 피드백", "Final feedback", "最终反馈", "Phản hồi cuối cùng", "最終フィードバック", "Umpan balik akhir")}</SectionTitle>
                <Card className="!p-4">
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#333D4B]"><RichText text={finalFeedbackText} /></p>
                </Card>
              </div>
            ) : null}

            {/* 운영자 개입 — 단계 초기화(재진행 유도) */}
            <div className="mt-6">
              <SectionTitle sub={t("학생이 다시 진행하도록 해당 단계 데이터를 초기화해요", "Reset a step's data so the student can redo it", "重置该步骤数据，让学生重新完成", "Đặt lại dữ liệu bước để sinh viên làm lại", "学生が再度進められるようそのステップのデータを初期化します", "Reset data langkah agar siswa dapat mengulanginya")}>{t("운영자 개입", "Operator actions", "运营者操作", "Thao tác của quản trị", "運営者による操作", "Tindakan operator")}</SectionTitle>
              <Card className="!p-4">
                <div className="flex flex-wrap gap-1.5">
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
                      className="rounded-lg border border-[#E5484D]/25 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#E5484D] transition hover:bg-[#FFF1F1] disabled:opacity-40"
                    >
                      {resetting === r.t ? t("초기화 중…", "Resetting…", "重置中…", "Đang đặt lại…", "初期化中…", "Mereset…") : t(`${r.l} 초기화`, `Reset ${r.l}`, `重置${r.l}`, `Đặt lại ${r.l}`, `${r.l}を初期化`, `Reset ${r.l}`)}
                    </button>
                  ))}
                </div>
              </Card>
            </div>

              </div>
              {/* 오른쪽: 피드백 (데스크탑에서 고정) */}
              <div className="lg:sticky lg:top-6">
                <SectionTitle>{t("피드백", "Feedback", "反馈", "Phản hồi", "フィードバック", "Umpan balik")}</SectionTitle>
                <Card className="!p-4">
                  <OperatorResumeFeedback studentUserId={detail.user.id} allowDocTypeSelect studentName={name} />
                </Card>
              </div>
            </div>
          </>
        )}
      </LaunchContainer>
    </main>
  );
}
