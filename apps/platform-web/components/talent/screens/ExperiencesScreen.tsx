"use client";

// 나의 경험 — 목록 + 단계형 추가 흐름(유형 선택 → 질문 → mock 요약 → 저장).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, ArrowLeft, Sparkle, PencilSimple } from "@phosphor-icons/react";
import { CareerLayout } from "../career/CareerLayout";
import { TCard, TChip, TEmpty, TLoading, TError, TPageHeader } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { getTalentRepository } from "../../../lib/talent/repository";
import { useExperienceQuestions, useExperienceTypeLabel, useExperienceTypeOptions } from "../../../lib/talent/labels";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import type { Experience, ExperienceQuestionKey, ExperienceType } from "../../../lib/talent/types";
import { usePlatformT } from "../../../lib/i18n";

export function ExperiencesScreen() {
  const t = usePlatformT();
  const experienceTypeLabel = useExperienceTypeLabel();
  const { snapshot, status, reload } = useTalentSnapshot();
  const [added, setAdded] = useState<Experience[]>([]);
  const [adding, setAdding] = useState(false);

  const experiences = [...(snapshot?.experiences ?? []), ...added];

  return (
    <CareerLayout>
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={reload} /> : null}
      {status === "ready" && snapshot ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <TPageHeader title={t("나의 경험","My Experience","我的经历","Kinh nghiệm của tôi","私の経験","Pengalamanku")} description={t("해본 일을 정리하면 이력서와 자기소개서의 재료가 돼요.","Organizing what you've done becomes material for your resume and cover letter.","整理做过的事，就成了简历和求职信的素材。","Sắp xếp những việc đã làm sẽ thành tư liệu cho CV và thư xin việc.","やったことを整理すると履歴書・自己PRの材料になります。","Menyusun yang pernah kamu lakukan jadi bahan CV dan surat lamaran.")} />
            <TalentButton onClick={() => setAdding(true)} variant="primary" size="md" aria-label={t("경험 추가","Add experience","添加经历","Thêm kinh nghiệm","経験を追加","Tambah pengalaman")}>
              <Plus className="h-4 w-4" weight="bold" /> {t("경험 추가","Add experience","添加经历","Thêm kinh nghiệm","経験を追加","Tambah pengalaman")}
            </TalentButton>
          </div>

          {experiences.length === 0 ? (
            <TEmpty
              icon="🗂️"
              title={t("아직 정리한 경험이 없어요","No experiences organized yet","还没有整理的经历","Chưa có kinh nghiệm nào","まだ整理した経験がありません","Belum ada pengalaman tersusun")}
              description={t("아르바이트, 프로젝트, 동아리처럼 작은 경험부터 시작해도 좋아요.","Start with small experiences like a part-time job, a project, or a club.","可以从兼职、项目、社团这样的小经历开始。","Bắt đầu từ kinh nghiệm nhỏ như làm thêm, dự án, câu lạc bộ.","アルバイト、プロジェクト、サークルなど小さな経験から始めて大丈夫です。","Mulai dari pengalaman kecil seperti kerja paruh waktu, proyek, atau klub.")}
              action={<TalentButton onClick={() => setAdding(true)} variant="soft" size="md">{t("첫 경험 정리하기","Organize first experience","整理第一段经历","Sắp xếp kinh nghiệm đầu","最初の経験を整理","Susun pengalaman pertama")}</TalentButton>}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {experiences.map((exp) => (
                <TCard key={exp.id} className="p-5">
                  <div className="flex items-center gap-2">
                    <TChip tone="blue">{experienceTypeLabel(exp.type)}</TChip>
                    {exp.period ? <span className="text-[12.5px] text-[#8B95A1]">{exp.period}</span> : null}
                    <span className="ml-auto">
                      <TChip tone={exp.summary ? "lime" : "gray"}>{exp.summary ? t("정리 완료","Organized","已整理","Đã sắp xếp","整理済み","Tersusun") : t("작성 중","In progress","撰写中","Đang viết","作成中","Sedang dibuat")}</TChip>
                    </span>
                  </div>
                  <p className="mt-2.5 text-[15px] font-bold text-[#191F28]">{exp.title}</p>
                  {exp.summary ? (
                    <p className="mt-2 flex items-start gap-1.5 break-keep text-[13.5px] leading-relaxed text-[#4E5968]">
                      <Sparkle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0B46E8]" weight="fill" />
                      {exp.summary}
                    </p>
                  ) : (
                    <p className="mt-2 text-[13px] text-[#B0B8C1]">{t("아직 정리되지 않았어요 · 질문에 답하면 취업 언어로 다듬어드려요.","Not organized yet · Answer the questions and we'll refine it into job-ready wording.","尚未整理 · 回答问题后会为你润色成求职语言。","Chưa sắp xếp · Trả lời câu hỏi để chỉnh thành ngôn ngữ ứng tuyển.","まだ整理されていません · 質問に答えると就活向けの言葉に整えます。","Belum tersusun · Jawab pertanyaan dan kami poles jadi bahasa lamaran.")}</p>
                  )}
                  {exp.skills?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {exp.skills.map((s) => (
                        <span key={s} className="rounded-lg bg-[#F2F4F6] px-2 py-0.5 text-[11.5px] font-medium text-[#4E5968]">{s}</span>
                      ))}
                    </div>
                  ) : null}
                </TCard>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {adding ? (
        <AddExperienceFlow
          onClose={() => setAdding(false)}
          onSaved={(exp) => {
            setAdded((prev) => [...prev, exp]);
            setAdding(false);
          }}
        />
      ) : null}
    </CareerLayout>
  );
}

/* 단계형 경험 추가 흐름 (오버레이) */
function AddExperienceFlow({ onClose, onSaved }: { onClose: () => void; onSaved: (exp: Experience) => void }) {
  const t = usePlatformT();
  const experienceTypeLabel = useExperienceTypeLabel();
  const experienceQuestions = useExperienceQuestions();
  const experienceTypeOptions = useExperienceTypeOptions();
  const toast = useTalentPopup();
  const router = useRouter();
  // step: -1 유형선택, 0..7 질문(8개), 8 검토
  const [step, setStep] = useState(-1);
  const [type, setType] = useState<ExperienceType | null>(null);
  const [answers, setAnswers] = useState<Partial<Record<ExperienceQuestionKey, string>>>({});
  const [draft, setDraft] = useState<Experience | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [summaryText, setSummaryText] = useState("");

  const q = step >= 0 && step < experienceQuestions.length ? experienceQuestions[step] : null;
  const isReview = step === experienceQuestions.length;

  async function goReview() {
    if (!type) return;
    setSaving(true);
    const title = answers.what?.slice(0, 24) || experienceTypeLabel(type);
    const result = await getTalentRepository().draftExperience({ type, title, answers });
    setDraft(result);
    setSummaryText(result.summary ?? "");
    setSaving(false);
    setStep(experienceQuestions.length);
  }

  function finish(useInResume: boolean) {
    if (!draft) return;
    onSaved({ ...draft, summary: summaryText.trim() || draft.summary });
    toast.success(useInResume ? t("경험을 이력서에 사용할 수 있어요","You can use this experience in your resume","可以在简历中使用该经历","Bạn có thể dùng kinh nghiệm này trong CV","この経験を履歴書に使えます","Kamu bisa pakai pengalaman ini di CV") : t("경험을 저장했어요","Experience saved","已保存经历","Đã lưu kinh nghiệm","経験を保存しました","Pengalaman disimpan"));
    if (useInResume) router.push(talentAppRoutes.resumes);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="sticky top-0 border-b border-[#EEF1F5] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          {step > -1 ? (
            <button type="button" aria-label={t("이전","Back","上一步","Quay lại","戻る","Kembali")} onClick={() => setStep((s) => s - 1)} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <span className="w-8" />
          )}
          <p className="flex-1 text-center text-[14px] font-bold text-[#191F28]">{t("경험 정리하기","Organize experience","整理经历","Sắp xếp kinh nghiệm","経験を整理","Susun pengalaman")}</p>
          <button type="button" aria-label={t("닫기","Close","关闭","Đóng","閉じる","Tutup")} onClick={onClose} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-5 py-8">
        {step === -1 ? (
          <div>
            <h2 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t("어떤 경험인가요?","What kind of experience?","是什么样的经历？","Kinh nghiệm loại gì?","どんな経験ですか？","Pengalaman jenis apa?")}</h2>
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {experienceTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setType(opt.value);
                    setStep(0);
                  }}
                  className="rounded-2xl border border-[#E5E8EB] bg-white px-3 py-4 text-[13.5px] font-semibold text-[#191F28] transition hover:border-[#0B46E8] hover:bg-[#F5F8FF]"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {q ? (
          <div>
            <p className="text-[13px] font-bold text-[#0B46E8]">{step + 1} / {experienceQuestions.length}</p>
            <h2 className="mt-2 text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{q.label}</h2>
            <textarea
              value={answers[q.key] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
              placeholder={q.placeholder}
              rows={5}
              className="mt-5 w-full resize-none rounded-2xl border border-[#E5E8EB] bg-white px-4 py-3.5 text-[15px] leading-relaxed text-[#191F28] outline-none transition focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
            />
            <div className="mt-6 flex flex-col gap-2">
              {step < experienceQuestions.length - 1 ? (
                <TalentButton onClick={() => setStep((s) => s + 1)} variant="primary" size="lg" fullWidth aria-label={t("다음","Next","下一步","Tiếp","次へ","Lanjut")}>
                  {t("다음","Next","下一步","Tiếp","次へ","Lanjut")}
                </TalentButton>
              ) : (
                <TalentButton onClick={goReview} disabled={saving} variant="primary" size="lg" fullWidth aria-label={t("정리 결과 보기","See the result","查看整理结果","Xem kết quả","整理結果を見る","Lihat hasil")}>
                  {saving ? t("정리하는 중…","Organizing…","整理中…","Đang sắp xếp…","整理中…","Menyusun…") : t("정리 결과 보기","See the result","查看整理结果","Xem kết quả","整理結果を見る","Lihat hasil")}
                </TalentButton>
              )}
              <button type="button" onClick={() => (step < experienceQuestions.length - 1 ? setStep((s) => s + 1) : goReview())} className="py-2 text-[13.5px] font-semibold text-[#8B95A1] hover:text-[#4E5968]">
                {t("건너뛰기","Skip","跳过","Bỏ qua","スキップ","Lewati")}
              </button>
            </div>
          </div>
        ) : null}

        {isReview && draft ? (
          <div>
            <div className="flex items-center gap-2">
              <Sparkle className="h-5 w-5 text-[#0B46E8]" weight="fill" />
              <h2 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t(`${draft.title} 경험이 정리됐어요`, `Your "${draft.title}" experience is organized`, `「${draft.title}」经历已整理`, `Kinh nghiệm "${draft.title}" đã được sắp xếp`, `「${draft.title}」の経験を整理しました`, `Pengalaman "${draft.title}" sudah tersusun`)}</h2>
            </div>

            {/* 핵심 역할 */}
            {draft.keyRole ? (
              <div className="mt-6">
                <p className="text-[12.5px] font-bold text-[#8B95A1]">{t("핵심 역할","Key role","核心角色","Vai trò chính","主な役割","Peran utama")}</p>
                <p className="mt-1.5 text-[15px] font-bold text-[#191F28]">{draft.keyRole}</p>
              </div>
            ) : null}

            {/* 활용할 수 있는 역량 */}
            {draft.skills?.length ? (
              <div className="mt-5">
                <p className="text-[12.5px] font-bold text-[#8B95A1]">{t("활용할 수 있는 역량","Usable strengths","可运用的能力","Thế mạnh có thể dùng","活かせる強み","Keunggulan yang bisa dipakai")}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {draft.skills.map((s) => (
                    <TChip key={s} tone="lime">{s}</TChip>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 이력서 문장 */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-bold text-[#8B95A1]">{t("이력서 문장","Resume line","简历句子","Câu CV","履歴書の文章","Kalimat CV")}</p>
                {!editing ? (
                  <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#0B46E8]">
                    <PencilSimple className="h-3.5 w-3.5" /> {t("문장 수정하기","Edit line","编辑句子","Sửa câu","文章を編集","Edit kalimat")}
                  </button>
                ) : null}
              </div>
              {editing ? (
                <textarea
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-2xl border border-[#0B46E8] bg-white px-4 py-3.5 text-[14.5px] leading-relaxed text-[#191F28] outline-none ring-2 ring-[#EDF1FD]"
                />
              ) : (
                <div className="mt-2 rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] px-4 py-3.5">
                  <p className="break-keep text-[14.5px] font-medium leading-relaxed text-[#191F28]">{summaryText || draft.summary}</p>
                </div>
              )}
            </div>

            <div className="mt-7 flex flex-col gap-2">
              <TalentButton onClick={() => finish(true)} variant="primary" size="lg" fullWidth aria-label={t("이력서에 사용하기","Use in resume","用于简历","Dùng trong CV","履歴書に使う","Pakai di CV")}>
                {t("이력서에 사용하기","Use in resume","用于简历","Dùng trong CV","履歴書に使う","Pakai di CV")}
              </TalentButton>
              <TalentButton onClick={() => finish(false)} variant="secondary" size="lg" fullWidth aria-label={t("저장만 하기","Just save","仅保存","Chỉ lưu","保存のみ","Simpan saja")}>
                {t("저장만 하기","Just save","仅保存","Chỉ lưu","保存のみ","Simpan saja")}
              </TalentButton>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
