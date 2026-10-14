"use client";

// v2 경험 정리 — 기존 나의 경험(ExperiencesScreen)과 같은 데이터·흐름을 v2 모양으로.
// 목록 + 단계형 추가(유형 고르기 → 질문 8개 → 정리 결과 → 저장). 추가 흐름은 아래에서 올라오는 시트(PC 는 가운데 창).
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { V2Shell } from "../V2Shell";
import { Sheet } from "../sheets";
import { Button, Empty, Masthead, Page, RowsSkeleton, Section, Spinner } from "../ui";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { readPersona } from "../../../lib/talent/persona-state";
import { getTalentRepository } from "../../../lib/talent/repository";
import { useExperienceQuestions, useExperienceTypeLabel, useExperienceTypeOptions } from "../../../lib/talent/labels";
import type { Experience, ExperienceQuestionKey, ExperienceType } from "../../../lib/talent/types";
import { usePlatformT } from "../../../lib/i18n";

type LoadStatus = "loading" | "ready" | "error";

const R = {
  career: "/talent/career",
  resume: "/talent/career/resume/editor"
};

/** 경험 목록 — 기존 useTalentSnapshot 과 같은 저장소(getSnapshot·persona)를 읽는다.
 *  useTalentSnapshot 은 load 가 매 렌더 새로 만들어지는 t 에 묶여 있어 불러오기가 끝없이 되풀이되므로(늘 로딩),
 *  여기선 t 를 ref 로 들고 처음 한 번(+다시 불러오기)만 부른다. */
function useExperienceList() {
  const t = usePlatformT();
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  // 불러오기 — 처음엔 status 가 이미 loading 이라 effect 안에선 결과만 넣는다.
  const fetchList = useCallback(async () => {
    try {
      const data = await getTalentRepository().getSnapshot(readPersona(), tRef.current);
      setExperiences(data.experiences ?? []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);
  useEffect(() => {
    void fetchList();
  }, [fetchList]);
  const load = () => {
    setStatus("loading");
    void fetchList();
  };
  return { experiences, status, reload: load };
}

export function V2ExperiencesScreen() {
  const t = usePlatformT();
  const { experiences: loaded, status, reload } = useExperienceList();
  // 기존 화면과 같이 — 새로 정리한 경험은 이 화면 안에서만 목록에 붙는다(저장소 연동은 기존과 동일하게 mock).
  const [added, setAdded] = useState<Experience[]>([]);
  const [adding, setAdding] = useState(false);
  const experiences = [...loaded, ...added];
  const addLabel = t("경험 추가", "Add experience", "添加经历", "Thêm kinh nghiệm", "経験を追加", "Tambah pengalaman");

  return (
    <V2Shell requireAuth>
      <Page>
        <BackLink />
        <Masthead
          eyebrow={t("내 커리어", "My career", "我的职业", "Sự nghiệp", "マイキャリア", "Karierku")}
          title={t("경험 정리", "Experiences", "经历整理", "Kinh nghiệm", "経験の整理", "Pengalaman")}
          lede={t("해본 일을 정리하면 이력서와 자기소개서의 재료가 돼요.", "What you've done becomes material for your resume and cover letter.", "整理做过的事，就成了简历和求职信的素材。", "Việc đã làm sẽ thành tư liệu cho CV và thư xin việc.", "やったことを整理すると履歴書・自己PRの材料になります。", "Yang pernah kamu lakukan jadi bahan CV dan surat lamaran.")}
          action={
            status === "ready" ? (
              <Button onClick={() => setAdding(true)}>
                <span aria-hidden className="text-[18px] leading-none">+</span> {addLabel}
              </Button>
            ) : undefined
          }
        />

        {status === "loading" ? (
          <div className="px-5">
            <RowsSkeleton count={3} thumb={false} />
          </div>
        ) : null}

        {status === "error" ? (
          <div className="px-5 text-center">
            <Empty>{t("불러오지 못했어요. 잠시 후 다시 해 주세요.", "Couldn't load. Try again soon.", "加载失败，请稍后再试。", "Không tải được. Thử lại sau.", "読み込めませんでした。", "Gagal memuat.")}</Empty>
            <Button variant="neutral" size="sm" onClick={reload}>
              {t("다시 불러오기", "Retry", "重试", "Thử lại", "再読み込み", "Coba lagi")}
            </Button>
          </div>
        ) : null}

        {status === "ready" ? (
          experiences.length === 0 ? (
            <Section title={t("내 경험", "My experiences", "我的经历", "Kinh nghiệm của tôi", "私の経験", "Pengalamanku")}>
              <div className="rounded-2xl bg-[color:var(--v2-fill)] px-5 py-10 text-center">
                <span aria-hidden className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--v2-band)] text-[26px]">🧩</span>
                <p className="mt-4 text-[17px] font-bold text-[color:var(--v2-ink)]">{t("아직 정리한 경험이 없어요", "No experiences yet", "还没有整理的经历", "Chưa có kinh nghiệm nào", "まだ整理した経験がありません", "Belum ada pengalaman")}</p>
                <p className="mt-1.5 text-[15px] leading-[1.6] text-[color:var(--v2-muted)]">{t("아르바이트, 프로젝트, 동아리처럼 작은 경험부터 시작해도 좋아요.", "Start small — a part-time job, a project, or a club.", "可以从兼职、项目、社团这样的小经历开始。", "Bắt đầu từ việc nhỏ như làm thêm, dự án, câu lạc bộ.", "アルバイト、プロジェクト、サークルなど小さな経験から始めて大丈夫です。", "Mulai dari kerja paruh waktu, proyek, atau klub.")}</p>
                <div className="mt-5">
                  <Button variant="secondary" onClick={() => setAdding(true)}>
                    {t("첫 경험 정리하기", "Add first one", "整理第一段经历", "Thêm cái đầu tiên", "最初の経験を整理", "Tambah pertama")}
                  </Button>
                </div>
              </div>
            </Section>
          ) : (
            <Section title={t(`내 경험 ${experiences.length}`, `My experiences ${experiences.length}`, `我的经历 ${experiences.length}`, `Kinh nghiệm ${experiences.length}`, `私の経験 ${experiences.length}`, `Pengalamanku ${experiences.length}`)}>
              <div className="flex flex-col gap-3 pb-2">
                {experiences.map((exp) => (
                  <ExperienceCard key={exp.id} exp={exp} />
                ))}
              </div>
            </Section>
          )
        ) : null}
      </Page>

      {adding ? (
        <AddExperienceSheet
          onClose={() => setAdding(false)}
          onSaved={(exp) => {
            setAdded((prev) => [...prev, exp]);
            setAdding(false);
          }}
        />
      ) : null}
    </V2Shell>
  );
}

/** 뒤로 — 들어온 곳으로(바로 열었으면 내 커리어로). */
function BackLink() {
  const t = usePlatformT();
  const router = useRouter();
  return (
    <div className="px-5 pt-5">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? router.back() : router.push(R.career))}
        className="-ml-1.5 inline-flex h-9 items-center gap-0.5 rounded-lg pl-1 pr-2.5 text-[15px] font-semibold text-[color:var(--v2-muted)] transition hover:bg-[color:var(--v2-band)] hover:text-[color:var(--v2-ink-3)]"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 18l-6-6 6-6" />
        </svg>
        {t("뒤로", "Back", "返回", "Quay lại", "戻る", "Kembali")}
      </button>
    </div>
  );
}

/** 경험 카드 — 유형·기간·상태 한 줄, 굵은 제목, 이력서 문장, 역량 칩. 테두리 대신 연회색 바탕. */
function ExperienceCard({ exp }: { exp: Experience }) {
  const t = usePlatformT();
  const typeLabel = useExperienceTypeLabel();
  return (
    <article className="rounded-2xl bg-[color:var(--v2-fill)] p-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="rounded-full bg-[color:var(--v2-accent-weak)] px-2.5 py-1 text-[13px] font-bold text-[color:var(--v2-accent)]">{typeLabel(exp.type)}</span>
        {exp.period ? <span className="text-[14px] text-[color:var(--v2-faint)]">{exp.period}</span> : null}
        <span className="ml-auto">
          {exp.summary ? (
            <span className="rounded-full bg-[#e8f8f1] px-2.5 py-1 text-[13px] font-bold text-[color:var(--v2-good)]">{t("정리 완료", "Done", "已整理", "Xong", "整理済み", "Selesai")}</span>
          ) : (
            <span className="rounded-full bg-[color:var(--v2-band)] px-2.5 py-1 text-[13px] font-bold text-[color:var(--v2-muted)]">{t("작성 중", "Draft", "撰写中", "Đang viết", "作成中", "Draf")}</span>
          )}
        </span>
      </div>
      <p className="mt-3 text-[18px] font-bold leading-[1.4] tracking-[-0.01em] text-[color:var(--v2-ink)]">{exp.title}</p>
      {exp.summary ? (
        <p className="mt-2 text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{exp.summary}</p>
      ) : (
        <p className="mt-2 text-[14px] leading-[1.6] text-[color:var(--v2-faint)]">{t("아직 정리되지 않았어요 · 질문에 답하면 취업 언어로 다듬어 드려요.", "Not organized yet · answer the questions and we'll turn it into job-ready wording.", "尚未整理 · 回答问题后会为你润色成求职语言。", "Chưa sắp xếp · trả lời câu hỏi để chỉnh thành ngôn ngữ ứng tuyển.", "まだ整理されていません · 質問に答えると就活向けの言葉に整えます。", "Belum tersusun · jawab pertanyaan dan kami poles jadi bahasa lamaran.")}</p>
      )}
      {exp.skills?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {exp.skills.map((s) => (
            <span key={s} className="rounded-lg bg-white px-2.5 py-1 text-[13px] font-semibold text-[color:var(--v2-ink-3)]">
              {s}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

/** 단계형 경험 추가 — 기존 AddExperienceFlow 와 같은 단계·저장소 호출. */
function AddExperienceSheet({ onClose, onSaved }: { onClose: () => void; onSaved: (exp: Experience) => void }) {
  const t = usePlatformT();
  const typeLabel = useExperienceTypeLabel();
  const questions = useExperienceQuestions();
  const typeOptions = useExperienceTypeOptions();
  const toast = useTalentPopup();
  const router = useRouter();
  // step: -1 유형 고르기, 0..n-1 질문, n 정리 결과
  const [step, setStep] = useState(-1);
  const [type, setType] = useState<ExperienceType | null>(null);
  const [answers, setAnswers] = useState<Partial<Record<ExperienceQuestionKey, string>>>({});
  const [draft, setDraft] = useState<Experience | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [summaryText, setSummaryText] = useState("");

  const q = step >= 0 && step < questions.length ? questions[step] : null;
  const isLastQuestion = step === questions.length - 1;
  const isReview = step === questions.length;

  async function goReview() {
    if (!type || saving) return;
    setSaving(true);
    try {
      const title = answers.what?.slice(0, 24) || typeLabel(type);
      const result = await getTalentRepository().draftExperience({ type, title, answers }, t);
      setDraft(result);
      setSummaryText(result.summary ?? "");
      setStep(questions.length);
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (isLastQuestion) void goReview();
    else setStep((s) => s + 1);
  }

  function finish(useInResume: boolean) {
    if (!draft) return;
    onSaved({ ...draft, summary: summaryText.trim() || draft.summary });
    toast.success(
      useInResume
        ? t("경험을 이력서에 사용할 수 있어요", "You can use this in your resume", "可以在简历中使用该经历", "Bạn có thể dùng trong CV", "この経験を履歴書に使えます", "Bisa dipakai di CV")
        : t("경험을 저장했어요", "Experience saved", "已保存经历", "Đã lưu kinh nghiệm", "経験を保存しました", "Pengalaman disimpan")
    );
    if (useInResume) router.push(R.resume);
  }

  const resultLabel = t("정리 결과 보기", "See result", "查看结果", "Xem kết quả", "結果を見る", "Lihat hasil");
  const footer = q ? (
    <div className="flex flex-col gap-1">
      <Button full onClick={next} disabled={saving}>
        {saving ? (
          <>
            <Spinner /> {t("정리하는 중…", "Organizing…", "整理中…", "Đang sắp xếp…", "整理中…", "Menyusun…")}
          </>
        ) : isLastQuestion ? (
          resultLabel
        ) : (
          t("다음", "Next", "下一步", "Tiếp", "次へ", "Lanjut")
        )}
      </Button>
      <button type="button" onClick={next} disabled={saving} className="h-10 text-[15px] font-semibold text-[color:var(--v2-faint)] transition hover:text-[color:var(--v2-ink-3)] disabled:opacity-40">
        {t("건너뛰기", "Skip", "跳过", "Bỏ qua", "スキップ", "Lewati")}
      </button>
    </div>
  ) : isReview && draft ? (
    <div className="flex flex-col gap-2">
      <Button full onClick={() => finish(true)}>
        {t("이력서에 사용하기", "Use in resume", "用于简历", "Dùng trong CV", "履歴書に使う", "Pakai di CV")}
      </Button>
      <Button full variant="neutral" onClick={() => finish(false)}>
        {t("저장만 하기", "Just save", "仅保存", "Chỉ lưu", "保存のみ", "Simpan saja")}
      </Button>
    </div>
  ) : undefined;

  return (
    <Sheet tall title={t("경험 정리하기", "Organize experience", "整理经历", "Sắp xếp kinh nghiệm", "経験を整理", "Susun pengalaman")} subtitle={type ? typeLabel(type) : undefined} onClose={onClose} footer={footer}>
      {step > -1 ? (
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setStep((s) => s - 1);
          }}
          disabled={saving}
          className="-ml-1.5 mb-2 inline-flex h-9 items-center gap-0.5 rounded-lg pl-1 pr-2.5 text-[15px] font-semibold text-[color:var(--v2-muted)] transition hover:bg-[color:var(--v2-band)] disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t("이전", "Back", "上一步", "Quay lại", "戻る", "Kembali")}
        </button>
      ) : null}

      {step === -1 ? (
        <div className="pt-2">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{t("어떤 경험인가요?", "What kind of experience?", "是什么样的经历？", "Kinh nghiệm loại gì?", "どんな経験ですか？", "Pengalaman jenis apa?")}</h2>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setType(opt.value);
                  setStep(0);
                }}
                className={`min-h-[56px] rounded-2xl px-3 py-3 text-[16px] font-semibold transition active:scale-[0.98] ${type === opt.value ? "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-2)] hover:bg-[color:var(--v2-line)]"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {q ? (
        <div>
          {/* 진행 — 숫자 + 얇은 막대 */}
          <div className="flex items-center gap-3">
            <p className="shrink-0 text-[14px] font-bold text-[color:var(--v2-accent)]">
              {step + 1} / {questions.length}
            </p>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--v2-band)]" aria-hidden>
              <div className="h-full rounded-full bg-[color:var(--v2-accent)] transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
            </div>
          </div>
          <h2 className="mt-4 text-[22px] font-bold leading-[1.4] tracking-[-0.02em] text-[color:var(--v2-ink)]">{q.label}</h2>
          <textarea
            key={q.key}
            autoFocus
            value={answers[q.key] ?? ""}
            onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
            placeholder={q.placeholder}
            rows={6}
            className="mt-5 w-full resize-none rounded-2xl bg-[color:var(--v2-fill)] px-4 py-3.5 text-[16px] leading-[1.6] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] transition placeholder:text-[color:var(--v2-faint)] focus:bg-white focus:ring-2"
          />
        </div>
      ) : null}

      {isReview && draft ? (
        <div className="pt-1">
          <p className="text-[14px] font-bold text-[color:var(--v2-accent)]">{t("정리 완료", "Done", "已整理", "Xong", "整理済み", "Selesai")}</p>
          <h2 className="mt-1 text-[22px] font-bold leading-[1.4] tracking-[-0.02em] text-[color:var(--v2-ink)]">
            {t(`${draft.title} 경험이 정리됐어요`, `"${draft.title}" is organized`, `「${draft.title}」经历已整理`, `"${draft.title}" đã được sắp xếp`, `「${draft.title}」の経験を整理しました`, `"${draft.title}" sudah tersusun`)}
          </h2>

          {draft.keyRole ? (
            <div className="mt-6">
              <p className="text-[14px] font-semibold text-[color:var(--v2-muted)]">{t("핵심 역할", "Key role", "核心角色", "Vai trò chính", "主な役割", "Peran utama")}</p>
              <p className="mt-1 text-[17px] font-bold text-[color:var(--v2-ink)]">{draft.keyRole}</p>
            </div>
          ) : null}

          {draft.skills?.length ? (
            <div className="mt-5">
              <p className="text-[14px] font-semibold text-[color:var(--v2-muted)]">{t("활용할 수 있는 역량", "Usable strengths", "可运用的能力", "Thế mạnh có thể dùng", "活かせる強み", "Keunggulan")}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {draft.skills.map((s) => (
                  <span key={s} className="rounded-full bg-[color:var(--v2-accent-weak)] px-3 py-1.5 text-[14px] font-semibold text-[color:var(--v2-accent)]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[14px] font-semibold text-[color:var(--v2-muted)]">{t("이력서 문장", "Resume line", "简历句子", "Câu CV", "履歴書の文章", "Kalimat CV")}</p>
              {!editing ? (
                <button type="button" onClick={() => setEditing(true)} className="text-[14px] font-semibold text-[color:var(--v2-accent)] hover:opacity-70">
                  {t("문장 고치기", "Edit", "编辑", "Sửa", "編集", "Edit")}
                </button>
              ) : null}
            </div>
            {editing ? (
              <textarea
                autoFocus
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                rows={5}
                className="mt-2 w-full resize-none rounded-2xl bg-white px-4 py-3.5 text-[16px] leading-[1.6] text-[color:var(--v2-ink)] outline-none ring-2 ring-[color:var(--v2-accent)]"
              />
            ) : (
              <p className="mt-2 rounded-2xl bg-[color:var(--v2-fill)] px-4 py-3.5 text-[16px] font-medium leading-[1.6] text-[color:var(--v2-ink)]">{summaryText || draft.summary}</p>
            )}
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}
