"use client";

// v2 이력서 목록 — 기존 ResumesScreen 과 같은 데이터(useTalentSnapshot·기본 정보 게이트)와 같은 생성 흐름
// (경험 선택 → 직무 → 역량 → 초안 생성(mock) → 결과)을 v2 모양으로. 생성 흐름은 아래에서 올라오는 시트.
import { useState } from "react";
import { V2Shell } from "../V2Shell";
import { Sheet } from "../sheets";
import { Button, Empty, Masthead, MastheadSkeleton, Page, PrimaryButton, Row, Section, SectionSkeleton, Spinner } from "../ui";
import { V2_INPUT_CLS } from "./V2ResumeParts";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { basicInfoChecklist, isBasicInfoComplete, useBasicInfo } from "../../../lib/talent/basic-info";
import { useResumeFlowSteps, useResumeStatusLabel } from "../../../lib/talent/labels";
import { useTalentLanding } from "../../../lib/talent/landing-content";
import type { Resume, ResumeStatus, TalentSnapshot } from "../../../lib/talent/types";
import { usePlatformT } from "../../../lib/i18n";

/** 상태 표시 색 — 다 된 것만 초록, 나머지는 회색 단계(v2 는 색을 아낀다). */
const statusCls: Record<ResumeStatus, string> = {
  none: "bg-[color:var(--v2-band)] text-[color:var(--v2-muted)]",
  draft: "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]",
  improving: "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]",
  ready: "bg-[#e8f8f1] text-[color:var(--v2-good)]"
};

export function V2ResumesScreen() {
  return (
    <V2Shell requireAuth>
      <Body />
    </V2Shell>
  );
}

function Body() {
  const t = usePlatformT();
  const { beforeAfter } = useTalentLanding();
  const { snapshot, status, reload } = useTalentSnapshot();
  const info = useBasicInfo();
  const ready = isBasicInfoComplete(info);
  const [flowOpen, setFlowOpen] = useState(false);

  if (status === "loading" || !snapshot) {
    if (status === "error") return <LoadError onRetry={reload} />;
    return (
      <Page>
        <MastheadSkeleton />
        <SectionSkeleton />
      </Page>
    );
  }
  if (status === "error") return <LoadError onRetry={reload} />;
  if (!ready) return <ProfileGate />;

  const none = snapshot.resumes.length === 0;
  const createLabel = t("이력서 만들기", "Create resume", "制作简历", "Tạo CV", "履歴書を作る", "Buat CV");

  return (
    <Page>
      <Masthead
        eyebrow={t("내 이력서", "My resume", "我的简历", "CV của tôi", "履歴書", "CV saya")}
        title={t("이력서", "Resume", "简历", "CV", "履歴書", "CV")}
        lede={t("정리한 경험으로 나의 이력서 한 부를 완성해요.", "Turn your organized experiences into a complete resume.", "用整理好的经历完成一份简历。", "Biến kinh nghiệm đã sắp xếp thành một CV hoàn chỉnh.", "整理した経験で履歴書を一部完成させましょう。", "Ubah pengalamanmu jadi satu CV lengkap.")}
        action={none ? <PrimaryButton onClick={() => setFlowOpen(true)}>+ {createLabel}</PrimaryButton> : undefined}
      />

      {/* 경험 → 이력서 문장 변환(차별점) 미리보기 */}
      <div className="px-5 pb-8">
        <div className="rounded-3xl bg-[color:var(--v2-band)] p-5 md:p-6">
          <p className="text-[17px] font-bold tracking-[-0.01em] text-[color:var(--v2-ink)]">
            {t("경험만 있으면, 문장은 어플라이가", "Bring the experience, Aply writes the lines", "有经历就好，句子交给 Aply", "Chỉ cần kinh nghiệm, câu chữ để Aply lo", "経験があれば、文章はアプライが", "Cukup pengalaman, kalimatnya Aply")}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-[13px] font-bold text-[color:var(--v2-faint)]">{beforeAfter.beforeLabel}</p>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-[1.6] text-[color:var(--v2-muted)]">{beforeAfter.before}</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-[13px] font-bold text-[color:var(--v2-accent)]">{beforeAfter.afterLabel}</p>
              <p className="mt-2 whitespace-pre-line text-[15px] font-medium leading-[1.6] text-[color:var(--v2-ink)]">{beforeAfter.after}</p>
            </div>
          </div>
        </div>
      </div>

      <Section title={t("내 이력서", "My resumes", "我的简历", "CV của tôi", "履歴書一覧", "CV saya")}>
        {none ? (
          <div className="pb-2">
            <Empty>
              {t("질문에 답하다 보면 첫 이력서 한 부가 완성돼요. 약 3분이면 충분해요.", "Just answer the questions and your first resume takes shape. About 3 minutes.", "回答问题的过程中，第一份简历就完成了。约 3 分钟即可。", "Chỉ cần trả lời câu hỏi, CV đầu tiên sẽ hoàn thành. Khoảng 3 phút.", "質問に答えるうちに最初の履歴書が完成します。約3分です。", "Cukup jawab pertanyaan, CV pertamamu jadi. Sekitar 3 menit.")}
            </Empty>
            <Button variant="secondary" full onClick={() => setFlowOpen(true)}>
              {t("첫 이력서 만들기", "Create first resume", "制作第一份简历", "Tạo CV đầu tiên", "最初の履歴書を作る", "Buat CV pertama")}
            </Button>
          </div>
        ) : (
          snapshot.resumes.map((r) => <ResumeRow key={r.id} resume={r} />)
        )}
      </Section>

      <Section title={t("바로 고치기", "Edit now", "直接修改", "Sửa ngay", "すぐ編集", "Edit langsung")}>
        <Row href="/v2/resume" lead="✏️" title={t("이력서 편집", "Edit resume", "编辑简历", "Sửa CV", "履歴書を編集", "Edit CV")} meta={t("항목을 고르고 순서를 바꿔요", "Pick items and reorder them", "选择条目并调整顺序", "Chọn mục và đổi thứ tự", "項目を選び並べ替え", "Pilih item dan urutkan")} />
        <Row href="/v2/resume/preview" lead="📄" title={t("미리보기·PDF", "Preview · PDF", "预览·PDF", "Xem trước · PDF", "プレビュー・PDF", "Pratinjau · PDF")} meta={t("회사에 내는 모습 그대로", "Exactly as companies see it", "公司看到的样子", "Đúng như công ty thấy", "企業に出すそのまま", "Persis seperti dilihat perusahaan")} />
      </Section>

      {flowOpen ? <ResumeFlow snapshot={snapshot} onClose={() => setFlowOpen(false)} /> : null}
    </Page>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  const t = usePlatformT();
  return (
    <Page>
      <Masthead
        eyebrow={t("내 이력서", "My resume", "我的简历", "CV của tôi", "履歴書", "CV saya")}
        title={t("불러오지 못했어요", "Couldn't load", "加载失败", "Không tải được", "読み込めませんでした", "Gagal memuat")}
        lede={t("잠시 후 다시 시도해 주세요.", "Please try again shortly.", "请稍后再试。", "Vui lòng thử lại sau.", "しばらくして再度お試しください。", "Coba lagi sebentar lagi.")}
        action={<PrimaryButton onClick={onRetry}>{t("다시 시도", "Retry", "重试", "Thử lại", "再試行", "Coba lagi")}</PrimaryButton>}
      />
    </Page>
  );
}

/** 기본 정보 미등록 게이트 — 실명·이메일·연락처·주소가 없으면 이력서로 진행할 수 없다(기존 ProfileGate 와 같은 규칙). */
function ProfileGate() {
  const t = usePlatformT();
  const items = basicInfoChecklist(useBasicInfo(), t);
  return (
    <Page>
      <Masthead
        eyebrow={t("시작하기 전에", "Before you start", "开始之前", "Trước khi bắt đầu", "始める前に", "Sebelum mulai")}
        title={t("기본 정보를 등록해 주세요", "Add your basic info", "请填写基本信息", "Vui lòng nhập thông tin cơ bản", "基本情報を登録してください", "Isi info dasar Anda")}
        lede={t("실명·이메일·연락처·주소는 이력서와 자기소개서에 그대로 쓰여요. 한 번만 등록하면 돼요.", "Your name, email, phone, and address go straight into your resume and cover letter. Enter them once.", "真实姓名、邮箱、联系方式和地址将直接用于简历和求职信。只需填写一次。", "Họ tên, email, số điện thoại và địa chỉ dùng trực tiếp trong CV và thư. Chỉ cần nhập một lần.", "氏名・メール・連絡先・住所は履歴書と自己PRにそのまま使われます。一度登録すればOKです。", "Nama, email, kontak, dan alamat langsung dipakai di CV dan surat. Cukup isi sekali.")}
      />
      <div className="px-5">
        <ul className="rounded-3xl bg-[color:var(--v2-fill)] px-5 py-2">
          {items.map((it) => (
            <li key={it.key} className="flex items-center gap-3 py-3">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${it.done ? "bg-[color:var(--v2-accent)] text-white" : "bg-[color:var(--v2-line)] text-transparent"}`} aria-hidden>
                ✓
              </span>
              <span className={`text-[16px] font-semibold ${it.done ? "text-[color:var(--v2-faint)] line-through" : "text-[color:var(--v2-ink)]"}`}>{it.label}</span>
              {it.optional ? <span className="ml-auto text-[13px] text-[color:var(--v2-faint)]">{t("선택", "Optional", "可选", "Tùy chọn", "任意", "Opsional")}</span> : null}
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <Button full href="/v2/profile">
            {t("기본 정보 등록하기", "Add basic info", "填写基本信息", "Nhập thông tin cơ bản", "基本情報を登録する", "Isi info dasar")}
          </Button>
        </div>
      </div>
    </Page>
  );
}

function ResumeRow({ resume }: { resume: Resume }) {
  const t = usePlatformT();
  const statusLabel = useResumeStatusLabel();
  return (
    <Row
      href={`/v2/resumes/${encodeURIComponent(resume.id)}`}
      lead="📄"
      title={resume.title}
      meta={`${resume.targetRole ? `${resume.targetRole} · ` : ""}${t("수정", "Edited", "修改", "Sửa", "更新", "Diedit")} ${resume.updatedAt}`}
      right={<span className={`rounded-full px-2.5 py-1 text-[13px] font-bold ${statusCls[resume.status]}`}>{statusLabel(resume.status)}</span>}
    />
  );
}

/* 생성 흐름 — 기존과 같은 단계·같은 mock 생성(지연 후 완료). */
function ResumeFlow({ snapshot, onClose }: { snapshot: TalentSnapshot; onClose: () => void }) {
  const t = usePlatformT();
  const statusLabel = useResumeStatusLabel();
  const steps = useResumeFlowSteps();
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
    // mock: 실제 생성 대신 지연 후 완료 처리(기존과 같다).
    window.setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
      setStep(4);
    }, 1200);
  }
  const canNext = (step === 0 && selectedExp.length > 0) || (step === 1 && role.trim().length > 0) || step === 2;
  const roleText = role || t("지원 직무", "target role", "目标职位", "vị trí ứng tuyển", "応募職種", "posisi dilamar");

  const footer =
    !generating && step < 3 ? (
      <div className="flex gap-2">
        {step > 0 ? (
          <Button variant="neutral" onClick={() => setStep((s) => Math.max(0, s - 1))}>
            {t("이전", "Back", "上一步", "Quay lại", "戻る", "Kembali")}
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <Button full onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            {t("다음", "Next", "下一步", "Tiếp", "次へ", "Lanjut")}
          </Button>
        </div>
      </div>
    ) : !generating && step === 3 ? (
      <div className="flex gap-2">
        <Button variant="neutral" onClick={() => setStep(2)}>
          {t("이전", "Back", "上一步", "Quay lại", "戻る", "Kembali")}
        </Button>
        <div className="min-w-0 flex-1">
          <Button full onClick={generate}>
            {t("초안 만들기", "Create draft", "生成初稿", "Tạo bản nháp", "ドラフト作成", "Buat draf")}
          </Button>
        </div>
      </div>
    ) : step === 4 && generated ? (
      <Button full onClick={onClose}>
        {t("저장하고 계속하기", "Save and continue", "保存并继续", "Lưu và tiếp tục", "保存して続ける", "Simpan dan lanjut")}
      </Button>
    ) : undefined;

  return (
    <Sheet tall title={steps[Math.min(step, steps.length - 1)]} onClose={onClose} footer={footer}>
      <div className="mb-6 flex gap-1" aria-hidden>
        {steps.map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-[color:var(--v2-accent)]" : "bg-[color:var(--v2-band)]"}`} />
        ))}
      </div>

      {generating ? (
        <div className="flex flex-col items-center gap-3 py-16 text-[color:var(--v2-muted)]">
          <Spinner className="h-7 w-7 text-[color:var(--v2-accent)]" />
          <p className="text-[15px]">{t("이력서 초안을 만들고 있어요…", "Creating your resume draft…", "正在生成简历初稿…", "Đang tạo bản nháp CV…", "履歴書ドラフトを作成中…", "Membuat draf CV…")}</p>
        </div>
      ) : (
        <>
          {step === 0 ? (
            <StepBlock title={t("어떤 경험을 쓸까요?", "Which experiences to use?", "使用哪些经历？", "Dùng kinh nghiệm nào?", "どの経験を使いますか？", "Pakai pengalaman yang mana?")} desc={t("이력서에 담을 경험을 골라 주세요.", "Choose the experiences for your resume.", "请选择要放入简历的经历。", "Chọn kinh nghiệm cho CV của bạn.", "履歴書に載せる経験を選んでください。", "Pilih pengalaman untuk CV-mu.")}>
              <div className="flex flex-col gap-2">
                {snapshot.experiences.map((e) => {
                  const on = selectedExp.includes(e.id);
                  return (
                    <button key={e.id} type="button" onClick={() => setSelectedExp((l) => toggle(l, e.id))} aria-pressed={on} className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition ${on ? "bg-[color:var(--v2-accent-weak)]" : "bg-[color:var(--v2-band)]"}`}>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold ${on ? "bg-[color:var(--v2-accent)] text-white" : "bg-white text-transparent"}`} aria-hidden>
                        ✓
                      </span>
                      <span className="min-w-0 text-[16px] font-semibold text-[color:var(--v2-ink)]">{e.title}</span>
                    </button>
                  );
                })}
                {snapshot.experiences.length === 0 ? <Empty>{t("먼저 경험을 정리해 주세요.", "Organize your experiences first.", "请先整理你的经历。", "Hãy sắp xếp kinh nghiệm trước.", "まず経験を整理してください。", "Susun pengalamanmu dulu.")}</Empty> : null}
              </div>
            </StepBlock>
          ) : null}

          {step === 1 ? (
            <StepBlock title={t("어떤 직무에 지원하나요?", "Which role are you applying for?", "申请什么职位？", "Ứng tuyển vị trí nào?", "どの職種に応募しますか？", "Melamar posisi apa?")} desc={t("지원 직무에 맞춰 이력서를 다듬어 드려요.", "We'll tailor your resume to the role.", "我们会根据申请职位完善简历。", "Chúng tôi sẽ điều chỉnh CV theo vị trí.", "応募職種に合わせて履歴書を整えます。", "Kami sesuaikan CV dengan posisinya.")}>
              <input value={role} onChange={(e) => setRole(e.target.value)} placeholder={t("예) 콘텐츠 마케팅", "e.g. Content Marketing", "例）内容营销", "VD) Tiếp thị nội dung", "例）コンテンツマーケティング", "Cth) Content Marketing")} className={`${V2_INPUT_CLS} h-12`} />
            </StepBlock>
          ) : null}

          {step === 2 ? (
            <StepBlock title={t("강조하고 싶은 역량이 있나요?", "Any strengths to highlight?", "有想强调的能力吗？", "Có thế mạnh nào muốn nêu bật?", "強調したい強みはありますか？", "Ada keunggulan yang ingin ditonjolkan?")} desc={t("고르지 않아도 돼요. 없으면 바로 넘어가요.", "Optional. Skip if you'd like.", "可选。没有的话可直接跳过。", "Tùy chọn. Không có thì bỏ qua.", "任意です。なければスキップでOK。", "Opsional. Lewati saja jika tidak ada.")}>
              <div className="flex flex-wrap gap-2">
                {(skillPool.length ? skillPool : [t("문제 해결", "Problem-solving", "解决问题", "Giải quyết vấn đề", "問題解決", "Pemecahan masalah"), t("소통", "Communication", "沟通", "Giao tiếp", "コミュニケーション", "Komunikasi"), t("성실함", "Diligence", "踏实", "Chăm chỉ", "誠実さ", "Ketekunan")]).map((s) => {
                  const on = skills.includes(s);
                  return (
                    <button key={s} type="button" onClick={() => setSkills((l) => toggle(l, s))} aria-pressed={on} className={`inline-flex h-10 items-center rounded-full px-4 text-[15px] font-semibold transition ${on ? "bg-[color:var(--v2-ink)] text-white" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-3)]"}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </StepBlock>
          ) : null}

          {step === 3 ? (
            <StepBlock title={t("이제 초안을 만들어 볼까요?", "Ready to create the draft?", "现在开始生成初稿吧？", "Tạo bản nháp nhé?", "さっそくドラフトを作りましょうか？", "Siap membuat draf?")} desc={t("고른 경험과 직무로 첫 이력서 초안을 만들어 드려요.", "We'll draft your first resume from the chosen experiences and role.", "将根据所选经历和职位生成第一份简历初稿。", "Chúng tôi tạo bản nháp CV đầu tiên từ kinh nghiệm và vị trí đã chọn.", "選んだ経験と職種で最初の履歴書ドラフトを作成します。", "Kami buat draf CV pertama dari pengalaman dan posisi terpilih.")}>
              <div className="rounded-2xl bg-[color:var(--v2-fill)] p-4 text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">
                <p>
                  {t("경험", "Experiences", "经历", "Kinh nghiệm", "経験", "Pengalaman")} · <b className="text-[color:var(--v2-ink)]">{selectedExp.length}</b>
                </p>
                <p>
                  {t("직무", "Role", "职位", "Vị trí", "職種", "Posisi")} · <b className="text-[color:var(--v2-ink)]">{roleText}</b>
                </p>
              </div>
            </StepBlock>
          ) : null}

          {step === 4 && generated ? (
            <div className="flex flex-col items-center pt-4 text-center">
              <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f8f1] text-[26px] text-[color:var(--v2-good)]">
                ✓
              </span>
              <h2 className="mt-5 text-[22px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{statusLabel("draft")}</h2>
              <p className="mt-2 text-[15px] text-[color:var(--v2-ink-3)]">
                {t(`${roleText} 이력서 초안이 준비됐어요.`, `Your ${roleText} resume draft is ready.`, `你的${roleText}简历初稿已准备好。`, `Bản nháp CV ${roleText} đã sẵn sàng.`, `${roleText}の履歴書ドラフトが完成しました。`, `Draf CV ${roleText} sudah siap.`)}
              </p>
              <div className="mt-6 w-full rounded-2xl bg-[color:var(--v2-fill)] p-5 text-left">
                <p className="text-[13px] font-bold text-[color:var(--v2-faint)]">{t("미리보기", "Preview", "预览", "Xem trước", "プレビュー", "Pratinjau")}</p>
                <p className="mt-2 text-[16px] font-bold text-[color:var(--v2-ink)]">
                  {snapshot.greetingName} · {roleText}
                </p>
                <p className="mt-2 text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">
                  {snapshot.experiences[0]?.summary ?? t("고른 경험을 바탕으로 정리한 이력서 초안이에요.", "A resume draft organized from your chosen experiences.", "这是根据所选经历整理的简历初稿。", "Bản nháp CV được sắp xếp từ kinh nghiệm bạn chọn.", "選んだ経験をもとに整理した履歴書ドラフトです。", "Draf CV yang disusun dari pengalaman pilihanmu.")}
                </p>
              </div>
            </div>
          ) : null}
        </>
      )}
    </Sheet>
  );
}

function StepBlock({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[22px] font-bold leading-[1.4] tracking-[-0.02em] text-[color:var(--v2-ink)]">{title}</h2>
      {desc ? <p className="mt-2 text-[15px] leading-[1.6] text-[color:var(--v2-muted)]">{desc}</p> : null}
      <div className="mt-6">{children}</div>
    </div>
  );
}
