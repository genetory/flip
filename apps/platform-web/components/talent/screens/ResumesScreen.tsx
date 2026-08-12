"use client";

// 이력서 — 목록 + 생성 흐름(경험 선택 → 직무 → 역량 → 초안 생성(mock) → 수정 → 디자인 → 결과).
// 실제 AI 생성 전이라 UI/상태 구조를 먼저 구현하고 mock 결과를 사용한다.
import { useState } from "react";
import { Plus, X, ArrowLeft, ArrowRight, FileText, CheckCircle, Sparkle } from "@phosphor-icons/react";
import { CareerLayout } from "../career/CareerLayout";
import { ProfileGate } from "../career/ProfileGate";
import { TCard, TChip, TEmpty, TLoading, TError, TPageHeader } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { useBasicInfo, isBasicInfoComplete } from "../../../lib/talent/basic-info";
import { resumeFlowSteps, resumeStatusLabels } from "../../../lib/talent/labels";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { beforeAfterSection } from "../../../lib/talent/landing-content";
import type { Resume, ResumeStatus, TalentSnapshot } from "../../../lib/talent/types";
import { usePlatformT } from "../../../lib/i18n";

const statusTone: Record<ResumeStatus, "gray" | "blue" | "lime"> = {
  none: "gray",
  draft: "blue",
  improving: "blue",
  ready: "lime"
};

export function ResumesScreen() {
  const t = usePlatformT();
  const { snapshot, status, reload } = useTalentSnapshot();
  const ready = isBasicInfoComplete(useBasicInfo());
  const [flowOpen, setFlowOpen] = useState(false);

  return (
    <CareerLayout>
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={reload} /> : null}
      {status === "ready" && snapshot && !ready ? <ProfileGate /> : null}

      {status === "ready" && snapshot && ready ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <TPageHeader title={t("이력서","Resume","简历","CV","履歴書","CV")} description={t("정리한 경험으로 나의 이력서 한 부를 완성해요.","Turn your organized experiences into a complete resume.","用整理好的经历完成一份简历。","Biến kinh nghiệm đã sắp xếp thành một CV hoàn chỉnh.","整理した経験で履歴書を一部完成させましょう。","Ubah pengalamanmu jadi satu CV lengkap.")} />
            {snapshot.resumes.length === 0 ? (
              <TalentButton onClick={() => setFlowOpen(true)} variant="primary" size="md" aria-label={t("이력서 만들기","Create resume","制作简历","Tạo CV","履歴書を作る","Buat CV")}>
                <Plus className="h-4 w-4" weight="bold" /> {t("이력서 만들기","Create resume","制作简历","Tạo CV","履歴書を作る","Buat CV")}
              </TalentButton>
            ) : null}
          </div>

          {/* 경험 → 이력서 문장 변환(차별점) 미리보기 */}
          <TCard className="border-[#DCE7FB] bg-[#F5F8FF] p-6">
            <div className="flex items-center gap-1.5">
              <Sparkle className="h-4 w-4 text-[#0B46E8]" weight="fill" />
              <h2 className="text-[14.5px] font-bold text-[#0B1227]">{t("경험만 있으면, 문장은 APLY가","Bring the experience, APLY writes the lines","有经历就好，句子交给 APLY","Chỉ cần kinh nghiệm, câu chữ để APLY lo","経験があれば、文章はAPLYが","Cukup pengalaman, kalimatnya APLY")}</h2>
            </div>
            <div className="mt-4 grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
                <p className="text-[11.5px] font-bold text-[#8B95A1]">{beforeAfterSection.beforeLabel}</p>
                <p className="mt-2 whitespace-pre-line break-keep text-[13px] leading-relaxed text-[#8B95A1]">{beforeAfterSection.before}</p>
              </div>
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-2xl bg-[#0B46E8] text-white sm:h-9 sm:w-9" aria-hidden>
                <ArrowRight className="h-4 w-4" weight="bold" />
              </div>
              <div className="rounded-2xl border border-[#0B46E8]/15 bg-white p-4">
                <p className="text-[11.5px] font-bold text-[#0B46E8]">{beforeAfterSection.afterLabel}</p>
                <p className="mt-2 whitespace-pre-line break-keep text-[13px] font-medium leading-relaxed text-[#191F28]">{beforeAfterSection.after}</p>
              </div>
            </div>
          </TCard>

          {snapshot.resumes.length === 0 ? (
            <TEmpty
              icon="📄"
              title={t("아직 이력서가 없어요","No resume yet","还没有简历","Chưa có CV","まだ履歴書がありません","Belum ada CV")}
              description={t("질문에 답하다 보면 첫 이력서 한 부가 완성돼요. 약 3분이면 충분해요.","Just answer the questions and your first resume takes shape. About 3 minutes.","回答问题的过程中，第一份简历就完成了。约 3 分钟即可。","Chỉ cần trả lời câu hỏi, CV đầu tiên sẽ hoàn thành. Khoảng 3 phút.","質問に答えるうちに最初の履歴書が完成します。約3分です。","Cukup jawab pertanyaan, CV pertamamu jadi. Sekitar 3 menit.")}
              action={
                <TalentButton onClick={() => setFlowOpen(true)} variant="soft" size="md" aria-label={t("첫 이력서 만들기","Create first resume","制作第一份简历","Tạo CV đầu tiên","最初の履歴書を作る","Buat CV pertama")}>
                  {t("첫 이력서 만들기","Create first resume","制作第一份简历","Tạo CV đầu tiên","最初の履歴書を作る","Buat CV pertama")}
                </TalentButton>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {snapshot.resumes.map((r) => (
                <ResumeRow key={r.id} resume={r} />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {flowOpen && snapshot ? <ResumeFlow snapshot={snapshot} onClose={() => setFlowOpen(false)} /> : null}
    </CareerLayout>
  );
}

function ResumeRow({ resume }: { resume: Resume }) {
  const t = usePlatformT();
  return (
    <TCard className="flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD]">
        <FileText className="h-5 w-5 text-[#0B46E8]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-[#191F28]">{resume.title}</p>
        <p className="mt-1 text-[12.5px] text-[#8B95A1]">{resume.targetRole ? `${resume.targetRole} · ` : ""}{t("수정","Edited","修改","Sửa","更新","Diedit")} {resume.updatedAt}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <TChip tone={statusTone[resume.status]}>{resumeStatusLabels[resume.status]}</TChip>
        <TalentButton href={`${talentAppRoutes.resumes}/${resume.id}`} variant="secondary" size="md" aria-label={t("이어서 다듬기","Keep refining","继续完善","Tiếp tục hoàn thiện","続けて整える","Lanjut perbaiki")}>{t("이어서 다듬기","Keep refining","继续完善","Tiếp tục hoàn thiện","続けて整える","Lanjut perbaiki")}</TalentButton>
      </div>
    </TCard>
  );
}

/* 생성 흐름 오버레이 */
function ResumeFlow({ snapshot, onClose }: { snapshot: TalentSnapshot; onClose: () => void }) {
  const t = usePlatformT();
  const [step, setStep] = useState(0);
  const [selectedExp, setSelectedExp] = useState<string[]>(snapshot.experiences.map((e) => e.id));
  const [role, setRole] = useState(snapshot.profile.interests[0] ?? "");
  const [skills, setSkills] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const skillPool = snapshot.profile.skills ?? [];

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  function generate() {
    setGenerating(true);
    // mock: 실제 생성 대신 지연 후 완료 처리.
    window.setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
      setStep(4);
    }, 1200);
  }

  const canNext =
    (step === 0 && selectedExp.length > 0) ||
    (step === 1 && role.trim().length > 0) ||
    step === 2;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="sticky top-0 border-b border-[#EEF1F5] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          {step > 0 && !generating ? (
            <button type="button" aria-label={t("이전","Back","上一步","Quay lại","戻る","Kembali")} onClick={() => setStep((s) => Math.max(0, s - 1))} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <span className="w-8" />
          )}
          <p className="flex-1 text-center text-[13.5px] font-bold text-[#191F28]">
            {resumeFlowSteps[Math.min(step, resumeFlowSteps.length - 1)]}
          </p>
          <button type="button" aria-label={t("닫기","Close","关闭","Đóng","閉じる","Tutup")} onClick={onClose} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mx-auto mt-2 flex max-w-xl gap-1">
          {resumeFlowSteps.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-[#0B46E8]" : "bg-[#EEF1F5]"}`} />
          ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-5 py-8">
        {generating ? (
          <TLoading label={t("이력서 초안을 만들고 있어요…","Creating your resume draft…","正在生成简历初稿…","Đang tạo bản nháp CV…","履歴書ドラフトを作成中…","Membuat draf CV…")} />
        ) : (
          <>
            {step === 0 ? (
              <StepBlock title={t("어떤 경험을 사용할까요?","Which experiences to use?","使用哪些经历？","Dùng kinh nghiệm nào?","どの経験を使いますか？","Pakai pengalaman yang mana?")} desc={t("이력서에 담을 경험을 선택해주세요.","Choose the experiences for your resume.","请选择要放入简历的经历。","Chọn kinh nghiệm cho CV của bạn.","履歴書に載せる経験を選んでください。","Pilih pengalaman untuk CV-mu.")}>
                <div className="flex flex-col gap-2.5">
                  {snapshot.experiences.map((e) => {
                    const on = selectedExp.includes(e.id);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelectedExp((l) => toggle(l, e.id))}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${on ? "border-[#0B46E8] bg-[#F5F8FF]" : "border-[#E5E8EB] bg-white"}`}
                      >
                        <span className={`flex h-5 w-5 items-center justify-center rounded-md ${on ? "bg-[#0B46E8] text-white" : "border-2 border-[#D7DCE3]"}`}>{on ? "✓" : ""}</span>
                        <span className="text-[14px] font-semibold text-[#191F28]">{e.title}</span>
                      </button>
                    );
                  })}
                  {snapshot.experiences.length === 0 ? <p className="text-[13.5px] text-[#B0B8C1]">{t("먼저 경험을 정리해주세요.","Organize your experiences first.","请先整理你的经历。","Hãy sắp xếp kinh nghiệm trước.","まず経験を整理してください。","Susun pengalamanmu dulu.")}</p> : null}
                </div>
              </StepBlock>
            ) : null}

            {step === 1 ? (
              <StepBlock title={t("어떤 직무에 지원하나요?","Which role are you applying for?","申请什么职位？","Ứng tuyển vị trí nào?","どの職種に応募しますか？","Melamar posisi apa?")} desc={t("지원 직무에 맞춰 이력서를 다듬어드려요.","We'll tailor your resume to the role.","我们会根据申请职位完善简历。","Chúng tôi sẽ điều chỉnh CV theo vị trí.","応募職種に合わせて履歴書を整えます。","Kami sesuaikan CV dengan posisinya.")}>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder={t("예) 콘텐츠 마케팅","e.g. Content Marketing","例）内容营销","VD) Tiếp thị nội dung","例）コンテンツマーケティング","Cth) Content Marketing")}
                  className="w-full rounded-2xl border border-[#E5E8EB] bg-white px-4 py-3.5 text-[15px] text-[#191F28] outline-none focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
                />
              </StepBlock>
            ) : null}

            {step === 2 ? (
              <StepBlock title={t("강조하고 싶은 역량이 있나요?","Any strengths to highlight?","有想强调的能力吗？","Có thế mạnh nào muốn nêu bật?","強調したい強みはありますか？","Ada keunggulan yang ingin ditonjolkan?")} desc={t("선택은 자유예요. 없으면 바로 넘어가도 좋아요.","Optional. Skip if you'd like.","可选。没有的话可直接跳过。","Tùy chọn. Không có thì bỏ qua.","任意です。なければスキップでも大丈夫です。","Opsional. Lewati saja jika tidak ada.")}>
                <div className="flex flex-wrap gap-2">
                  {(skillPool.length ? skillPool : [t("문제 해결","Problem-solving","解决问题","Giải quyết vấn đề","問題解決","Pemecahan masalah"), t("소통","Communication","沟通","Giao tiếp","コミュニケーション","Komunikasi"), t("성실함","Diligence","踏实","Chăm chỉ","誠実さ","Ketekunan")]).map((s) => {
                    const on = skills.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSkills((l) => toggle(l, s))}
                        className={`rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition ${on ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#4E5968]"}`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </StepBlock>
            ) : null}

            {step === 3 ? (
              <StepBlock title={t("이제 초안을 만들어볼까요?","Ready to create the draft?","现在开始生成初稿吧？","Tạo bản nháp nhé?","さっそくドラフトを作りましょうか？","Siap membuat draf?")} desc={t("선택한 경험과 직무로 첫 이력서 초안을 만들어드려요.","We'll draft your first resume from the chosen experiences and role.","将根据所选经历和职位生成第一份简历初稿。","Chúng tôi tạo bản nháp CV đầu tiên từ kinh nghiệm và vị trí đã chọn.","選んだ経験と職種で最初の履歴書ドラフトを作成します。","Kami buat draf CV pertama dari pengalaman dan posisi terpilih.")}>
                <TalentButton onClick={generate} variant="primary" size="lg" fullWidth aria-label={t("이력서 초안 생성","Generate resume draft","生成简历初稿","Tạo bản nháp CV","履歴書ドラフト生成","Buat draf CV")}>
                  {t("이력서 초안 생성하기","Generate resume draft","生成简历初稿","Tạo bản nháp CV","履歴書ドラフトを生成","Buat draf CV")}
                </TalentButton>
              </StepBlock>
            ) : null}

            {step === 4 && generated ? (
              <div className="flex flex-col items-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAFFD1]">
                  <CheckCircle className="h-8 w-8 text-[#3A6B00]" weight="fill" />
                </span>
                <h2 className="mt-5 text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{resumeStatusLabels.draft}</h2>
                <p className="mt-2 text-[14px] text-[#4E5968]">{t(`${role || "지원 직무"} 이력서 초안이 준비됐어요.`, `Your ${role || "target role"} resume draft is ready.`, `你的${role || "目标职位"}简历初稿已准备好。`, `Bản nháp CV ${role || "vị trí ứng tuyển"} đã sẵn sàng.`, `${role || "応募職種"}の履歴書ドラフトが完成しました。`, `Draf CV ${role || "posisi dilamar"} sudah siap.`)}</p>
                <TCard className="mt-6 w-full p-5 text-left">
                  <p className="text-[13px] font-bold text-[#8B95A1]">{t("미리보기","Preview","预览","Xem trước","プレビュー","Pratinjau")}</p>
                  <p className="mt-2 text-[15px] font-bold text-[#191F28]">{snapshot.greetingName} · {role || t("지원 직무","target role","目标职位","vị trí ứng tuyển","応募職種","posisi dilamar")}</p>
                  <p className="mt-2 break-keep text-[13.5px] leading-relaxed text-[#4E5968]">
                    {snapshot.experiences[0]?.summary ?? t("선택한 경험을 바탕으로 정리된 이력서 초안이에요.","A resume draft organized from your chosen experiences.","这是根据所选经历整理的简历初稿。","Bản nháp CV được sắp xếp từ kinh nghiệm bạn chọn.","選んだ経験をもとに整理した履歴書ドラフトです。","Draf CV yang disusun dari pengalaman pilihanmu.")}
                  </p>
                </TCard>
                <div className="mt-6 w-full">
                  <TalentButton onClick={onClose} variant="primary" size="lg" fullWidth aria-label={t("이력서 저장하고 닫기","Save resume and close","保存简历并关闭","Lưu CV và đóng","履歴書を保存して閉じる","Simpan CV dan tutup")}>
                    {t("저장하고 계속하기","Save and continue","保存并继续","Lưu và tiếp tục","保存して続ける","Simpan dan lanjut")}
                  </TalentButton>
                </div>
              </div>
            ) : null}
          </>
        )}
      </main>

      {!generating && step < 4 ? (
        <footer className="border-t border-[#EEF1F5] bg-white px-5 py-4">
          <div className="mx-auto max-w-xl">
            {step < 3 ? (
              <TalentButton onClick={() => setStep((s) => s + 1)} disabled={!canNext} variant="primary" size="lg" fullWidth aria-label={t("다음","Next","下一步","Tiếp","次へ","Lanjut")}>
                {t("다음","Next","下一步","Tiếp","次へ","Lanjut")}
              </TalentButton>
            ) : null}
          </div>
        </footer>
      ) : null}
    </div>
  );
}

function StepBlock({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
      {desc ? <p className="mt-2 break-keep text-[14px] leading-relaxed text-[#4E5968]">{desc}</p> : null}
      <div className="mt-6">{children}</div>
    </div>
  );
}
