"use client";

// v2 자기소개서 목록 — 기존 CoverLettersScreen 과 같은 데이터(useTalentSnapshot 의 coverLetters)·같은 흐름을 v2 모양으로.
// 기본 / 공고 맞춤 두 유형. 빈 편집기 대신 질문에 답하는 흐름(CoverFlow)을 먼저 보여 준다.
// 기본 정보(실명·이메일·연락처·주소)가 비어 있으면 먼저 프로필로 안내한다(ProfileGate 와 같은 조건).
// 실제 계정 자기소개서(모듈형 편집기)로 가는 길도 함께 둔다.
import { useEffect, useState } from "react";
import { V2Shell } from "../V2Shell";
import { Button, Masthead, Page, PageSkeleton, Row, Section } from "../ui";
import { Sheet } from "../sheets";
import { setFabInset, clearFabInset } from "../../../lib/talent/fab-inset";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { basicInfoChecklist, isBasicInfoComplete, useBasicInfo } from "../../../lib/talent/basic-info";
import { coverCompleteness, useCoverDoc } from "../../../lib/talent/cover-doc";
import { useTailoredCoverQuestions } from "../../../lib/talent/labels";
import type { CoverLetter, CoverLetterType, TalentSnapshot } from "../../../lib/talent/types";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";

const R = {
  editor: "/talent/career/cover/editor",
  preview: "/talent/career/cover/preview",
  profile: "/talent/career/profile"
} as const;

function basicQuestions(t: PlatformT): string[] {
  return [
    t("나를 한 문장으로 소개한다면?", "If you introduced yourself in one sentence?", "用一句话介绍自己？", "Giới thiệu bản thân trong một câu?", "自分を一文で紹介するなら？", "Perkenalkan dirimu dalam satu kalimat?"),
    t("가장 자신 있는 강점은 무엇인가요?", "What's your greatest strength?", "你最有信心的优势是什么？", "Điểm mạnh nhất của bạn là gì?", "一番自信のある強みは何ですか？", "Apa kelebihan terbesarmu?"),
    t("앞으로 어떤 일을 하고 싶나요?", "What kind of work do you want to do?", "将来想做什么样的工作？", "Bạn muốn làm công việc gì trong tương lai?", "これからどんな仕事をしたいですか？", "Pekerjaan apa yang ingin kamu lakukan?")
  ];
}

const typeLabel = (t: PlatformT, type: CoverLetterType) =>
  type === "tailored" ? t("공고 맞춤 자기소개서", "Tailored cover letter", "职位定制求职信", "Thư theo tin tuyển", "求人特化の自己PR", "Surat sesuai lowongan") : t("기본 자기소개서", "Basic cover letter", "基础求职信", "Thư xin việc cơ bản", "基本の自己PR", "Surat lamaran dasar");

export function V2CoverLettersScreen() {
  return (
    <V2Shell requireAuth>
      <Body />
    </V2Shell>
  );
}

function Body() {
  const t = usePlatformT();
  const { snapshot, status, reload } = useTalentSnapshot();
  const info = useBasicInfo();
  const ready = isBasicInfoComplete(info);
  const [choosing, setChoosing] = useState(false);
  const [flowType, setFlowType] = useState<CoverLetterType | null>(null);

  if (status === "loading" || (status === "ready" && !snapshot)) return <PageSkeleton />;
  if (status === "error") {
    return (
      <Page>
        <Masthead
          title={t("불러오지 못했어요", "Couldn't load", "加载失败", "Không tải được", "読み込めませんでした", "Gagal memuat")}
          lede={t("잠시 후 다시 시도해 주세요.", "Please try again shortly.", "请稍后再试。", "Vui lòng thử lại sau.", "しばらくしてから再度お試しください。", "Coba lagi sebentar lagi.")}
          action={<Button onClick={reload}>{t("다시 시도", "Retry", "重试", "Thử lại", "再試行", "Coba lagi")}</Button>}
        />
      </Page>
    );
  }
  if (!snapshot) return null;
  if (!ready) return <ProfileNeeded t={t} />;

  const list = snapshot.coverLetters;
  return (
    <Page>
      <Masthead
        eyebrow={t("내 커리어", "My career", "我的职业", "Sự nghiệp", "マイキャリア", "Karier")}
        title={t("자기소개서", "Cover letter", "求职信", "Thư xin việc", "自己PR", "Surat lamaran")}
        lede={t("질문에 답하다 보면 막막한 자기소개서도 하나씩 채워져요.", "Answer the questions and even a daunting cover letter fills in bit by bit.", "一边回答问题，让人发愁的求职信也会逐渐完成。", "Trả lời câu hỏi, thư xin việc nan giải cũng dần hoàn thành.", "質問に答えるうちに、難しい自己PRも少しずつ埋まります。", "Jawab pertanyaan, surat lamaran yang rumit pun terisi sedikit demi sedikit.")}
        action={<Button onClick={() => setChoosing(true)}>+ {t("새로 쓰기", "New", "新建", "Viết mới", "新規作成", "Tulis baru")}</Button>}
      />

      <MyCoverDoc t={t} />

      <Section title={t("질문으로 쓴 자기소개서", "From questions", "按问题撰写", "Viết theo câu hỏi", "質問で書いた自己PR", "Dari pertanyaan")}>
        {list.length === 0 ? (
          <div className="rounded-3xl bg-[color:var(--v2-fill)] px-5 py-8 text-center">
            <p className="text-[17px] font-bold text-[color:var(--v2-ink)]">{t("아직 자기소개서가 없어요", "No cover letter yet", "还没有求职信", "Chưa có thư xin việc", "まだ自己PRがありません", "Belum ada surat lamaran")}</p>
            <p className="mt-1.5 text-[15px] leading-[1.6] text-[color:var(--v2-muted)]">{t("기본 자기소개서부터 시작하거나, 지원할 공고에 맞춰 작성할 수 있어요.", "Start with a basic cover letter, or tailor it to a specific job posting.", "可以从基础求职信开始，也可以针对具体职位撰写。", "Bắt đầu bằng thư cơ bản, hoặc viết theo tin tuyển dụng cụ thể.", "基本の自己PRから始めるか、応募先に合わせて作成できます。", "Mulai dari surat dasar, atau sesuaikan dengan lowongan tertentu.")}</p>
            <div className="mt-5">
              <Button variant="secondary" onClick={() => setChoosing(true)}>
                {t("자기소개서 시작하기", "Start cover letter", "开始求职信", "Bắt đầu thư", "自己PRを始める", "Mulai surat")}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {list.map((c) => (
              <CoverRow key={c.id} t={t} cover={c} />
            ))}
          </div>
        )}
      </Section>

      {choosing ? (
        <TypeChooser
          t={t}
          onClose={() => setChoosing(false)}
          onPick={(type) => {
            setChoosing(false);
            setFlowType(type);
          }}
        />
      ) : null}
      {flowType ? <CoverFlow t={t} type={flowType} snapshot={snapshot} onClose={() => setFlowType(null)} /> : null}
    </Page>
  );
}

/** 계정에 저장되는 자기소개서(모듈형 편집기) — 완성도와 함께 편집·미리보기로. */
function MyCoverDoc({ t }: { t: PlatformT }) {
  const doc = useCoverDoc();
  const pct = coverCompleteness(doc);
  return (
    <Section band={false} title={t("내 자기소개서", "My cover letter", "我的求职信", "Thư của tôi", "マイ自己PR", "Surat saya")}>
      <Row
        href={R.editor}
        lead="✍️"
        title={t("자기소개서 편집기", "Cover letter editor", "求职信编辑器", "Trình sửa thư", "自己PRエディター", "Editor surat")}
        meta={doc ? t(`채운 문항 ${pct}% · 에피소드 ${doc.items.length}개`, `${pct}% filled · ${doc.items.length} episodes`, `已填 ${pct}% · 经历 ${doc.items.length} 个`, `Đã điền ${pct}% · ${doc.items.length} đoạn`, `入力 ${pct}% · エピソード ${doc.items.length}件`, `Terisi ${pct}% · ${doc.items.length} episode`) : t("에피소드를 문항에 넣어 회사별로 저장해요", "Build answers from episodes, save per company", "用经历组成答案，按公司保存", "Ghép đoạn kể thành câu trả lời, lưu theo công ty", "エピソードで回答を作り、会社別に保存", "Susun jawaban dari episode, simpan per perusahaan")}
      />
      {doc ? <Row href={R.preview} lead="📄" title={t("미리보기 · PDF", "Preview · PDF", "预览 · PDF", "Xem trước · PDF", "プレビュー · PDF", "Pratinjau · PDF")} meta={t("A4 모양으로 보고 내려받아요", "See it as A4 and download", "以 A4 查看并下载", "Xem dạng A4 và tải về", "A4で見てダウンロード", "Lihat A4 dan unduh")} /> : null}
    </Section>
  );
}

function CoverRow({ t, cover }: { t: PlatformT; cover: CoverLetter }) {
  const done = cover.status === "ready";
  return (
    <Row
      lead="📝"
      title={cover.title}
      meta={`${cover.type === "tailored" ? t("공고 맞춤", "Tailored", "职位定制", "Theo tin tuyển", "求人特化", "Sesuai lowongan") : t("기본", "Basic", "基础", "Cơ bản", "基本", "Dasar")} · ${t("수정", "Edited", "修改", "Sửa", "更新", "Diedit")} ${cover.updatedAt}`}
      right={
        <span className={`rounded-full px-2.5 py-1 text-[13px] font-bold ${done ? "bg-[#e8f8f1] text-[color:var(--v2-good)]" : "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]"}`}>
          {done ? t("완성", "Done", "完成", "Xong", "完成", "Selesai") : t("작성 중", "Writing", "撰写中", "Đang viết", "作成中", "Ditulis")}
        </span>
      }
    />
  );
}

/** 기본 정보 미등록 — 이력서·자기소개서에 그대로 쓰이므로 먼저 채우게 한다. */
function ProfileNeeded({ t }: { t: PlatformT }) {
  const info = useBasicInfo();
  const items = basicInfoChecklist(info, t);
  return (
    <Page>
      <Masthead
        eyebrow={t("시작하기 전에", "Before you start", "开始之前", "Trước khi bắt đầu", "始める前に", "Sebelum mulai")}
        title={t("기본 정보를 등록해주세요", "Add your basic info", "请填写基本信息", "Vui lòng nhập thông tin cơ bản", "基本情報を登録してください", "Isi info dasar Anda")}
        lede={t("실명·이메일·연락처·주소는 이력서와 자기소개서에 그대로 쓰여요. 한 번만 등록하면 이후엔 자동으로 반영돼요.", "Your name, email, phone, and address go straight into your resume and cover letter. Enter them once and they apply automatically.", "真实姓名、邮箱、联系方式和地址将直接用于简历和求职信。填写一次后会自动沿用。", "Họ tên, email, số điện thoại và địa chỉ sẽ được dùng trực tiếp trong CV và thư xin việc. Chỉ nhập một lần và tự động áp dụng về sau.", "氏名・メール・連絡先・住所は履歴書と自己紹介書にそのまま使われます。一度登録すれば以降は自動で反映されます。", "Nama, email, kontak, dan alamat langsung dipakai di resume dan surat lamaran. Isi sekali, otomatis diterapkan.")}
        action={<Button href={R.profile}>{t("기본 정보 등록하기", "Add basic info", "填写基本信息", "Nhập thông tin", "基本情報を登録", "Isi info dasar")}</Button>}
      />
      <Section title={t("채울 항목", "To fill in", "待填项目", "Cần điền", "入力する項目", "Yang perlu diisi")}>
        <ul>
          {items.map((it) => (
            <li key={it.key} className="flex items-center gap-3 py-3">
              <span aria-hidden className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${it.done ? "bg-[color:var(--v2-accent)] text-white" : "bg-[color:var(--v2-band)] text-transparent"}`}>
                ✓
              </span>
              <span className={`min-w-0 flex-1 text-[16px] ${it.done ? "text-[color:var(--v2-faint)] line-through" : "font-semibold text-[color:var(--v2-ink-2)]"}`}>{it.label}</span>
              {it.optional ? <span className="text-[13px] text-[color:var(--v2-faint)]">{t("선택", "Optional", "可选", "Tùy chọn", "任意", "Opsional")}</span> : null}
            </li>
          ))}
        </ul>
      </Section>
    </Page>
  );
}

function TypeChooser({ t, onClose, onPick }: { t: PlatformT; onClose: () => void; onPick: (type: CoverLetterType) => void }) {
  const option = "w-full rounded-3xl bg-[color:var(--v2-band)] p-5 text-left transition hover:bg-[color:var(--v2-line)]";
  return (
    <Sheet title={t("어떤 자기소개서를 쓸까요?", "Which cover letter to write?", "写哪种求职信？", "Viết loại thư nào?", "どの自己PRを書きますか？", "Tulis surat yang mana?")} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <button type="button" onClick={() => onPick("basic")} className={option}>
          <span className="block text-[17px] font-bold text-[color:var(--v2-ink)]">{typeLabel(t, "basic")}</span>
          <span className="mt-1 block text-[15px] leading-[1.6] text-[color:var(--v2-muted)]">{t("나를 소개하는 기본 문장을 먼저 만들어요.", "Start with the basic lines that introduce you.", "先写介绍自己的基础句子。", "Bắt đầu bằng những câu giới thiệu bản thân.", "まず自分を紹介する基本の文章を作ります。", "Mulai dari kalimat dasar yang memperkenalkan dirimu.")}</span>
        </button>
        <button type="button" onClick={() => onPick("tailored")} className={option}>
          <span className="block text-[17px] font-bold text-[color:var(--v2-ink)]">{typeLabel(t, "tailored")}</span>
          <span className="mt-1 block text-[15px] leading-[1.6] text-[color:var(--v2-muted)]">{t("지원할 공고에 맞춰 문항별로 작성해요.", "Write question by question, tailored to the job posting.", "按招聘信息逐题撰写。", "Viết theo từng câu hỏi, phù hợp tin tuyển dụng.", "応募先に合わせて設問ごとに作成します。", "Tulis per pertanyaan sesuai lowongan.")}</span>
        </button>
      </div>
    </Sheet>
  );
}

/** 질문에 하나씩 답하는 전체 화면 흐름 — 마지막에 답변을 모아 초안으로 보여 준다(기존과 같이 화면 안에서만 산다). */
function CoverFlow({ t, type, snapshot, onClose }: { t: PlatformT; type: CoverLetterType; snapshot: TalentSnapshot; onClose: () => void }) {
  const tailoredCoverQuestions = useTailoredCoverQuestions();
  const questions = type === "tailored" ? tailoredCoverQuestions : basicQuestions(t);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ""));
  const [done, setDone] = useState(false);
  const isLast = step === questions.length - 1;
  useLockBodyScroll();
  // 아래 고정 버튼 높이만큼 전역 피드백 버튼을 올린다(덮지 않게).
  useEffect(() => {
    setFabInset("v2-cover-flow", 88);
    return () => clearFabInset("v2-cover-flow");
  }, []);

  const setAnswer = (v: string) => setAnswers((a) => a.map((x, i) => (i === step ? v : x)));
  const iconBtn = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[22px] leading-none text-[color:var(--v2-faint)] transition hover:bg-[color:var(--v2-band)]";

  return (
    <div className="v2 fixed inset-0 z-[80] flex !min-h-0 flex-col bg-white" role="dialog" aria-modal="true" aria-label={typeLabel(t, type)}>
      <header className="flex h-14 shrink-0 items-center gap-2 px-3">
        {step > 0 && !done ? (
          <button type="button" aria-label={t("이전", "Back", "上一步", "Quay lại", "戻る", "Kembali")} onClick={() => setStep((s) => s - 1)} className={iconBtn}>
            ‹
          </button>
        ) : (
          <span className="w-10 shrink-0" />
        )}
        <p className="min-w-0 flex-1 truncate text-center text-[16px] font-bold text-[color:var(--v2-ink)]">{typeLabel(t, type)}</p>
        <button type="button" aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} onClick={onClose} className={iconBtn}>
          ×
        </button>
      </header>
      {!done ? (
        <div className="h-1 w-full shrink-0 bg-[color:var(--v2-band)]" aria-hidden>
          <div className="h-full bg-[color:var(--v2-accent)] transition-[width]" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-[640px] flex-1 overflow-y-auto px-5 py-8">
        {done ? (
          <div>
            <p className="text-[15px] font-semibold text-[color:var(--v2-good)]">{t("완성", "Done", "完成", "Xong", "完成", "Selesai")}</p>
            <h2 className="mt-1.5 text-[26px] font-bold leading-[1.38] tracking-[-0.02em] text-[color:var(--v2-ink)]">{t("초안이 완성됐어요", "Draft is ready", "初稿已完成", "Bản nháp đã xong", "下書きが完成しました", "Draf sudah siap")}</h2>
            <p className="mt-2.5 text-[17px] leading-[1.6] text-[color:var(--v2-ink-3)]">{t("답변을 바탕으로 자기소개서 초안을 만들었어요. 이어서 다듬을 수 있어요.", "We drafted your cover letter from your answers. You can keep refining it.", "已根据你的回答生成求职信初稿，可以继续完善。", "Chúng tôi đã tạo bản nháp thư từ câu trả lời của bạn. Bạn có thể tiếp tục chỉnh.", "回答をもとに自己PRの下書きを作成しました。続けて整えられます。", "Kami buat draf surat dari jawabanmu. Bisa terus diperbaiki.")}</p>
            <ul className="mt-6 flex flex-col gap-3">
              {questions.map((qq, i) => (
                <li key={qq} className="rounded-3xl bg-[color:var(--v2-band)] p-5">
                  <p className="text-[14px] font-semibold text-[color:var(--v2-muted)]">{qq}</p>
                  <p className="mt-1.5 whitespace-pre-line text-[16px] leading-[1.65] text-[color:var(--v2-ink)]">{answers[i] || "…"}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <p className="text-[15px] font-semibold text-[color:var(--v2-accent)]">
              {step + 1} / {questions.length}
            </p>
            <h2 className="mt-1.5 text-[24px] font-bold leading-[1.4] tracking-[-0.02em] text-[color:var(--v2-ink)]">{questions[step]}</h2>
            {type === "tailored" && step === 0 ? (
              <p className="mt-2 text-[15px] text-[color:var(--v2-muted)]">
                {t("지원할 공고를 떠올리며 답해보세요.", "Answer with the job posting in mind.", "请想着要申请的职位来回答。", "Trả lời khi nghĩ đến tin tuyển dụng.", "応募先の求人を思い浮かべて答えてください。", "Jawab sambil membayangkan lowongannya.")} {snapshot.applications[0]?.company ?? ""}
              </p>
            ) : null}
            <textarea
              value={answers[step]}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={t("편하게 적어주세요. 문장이 어색해도 괜찮아요.", "Write freely. It's okay if the wording feels off.", "随意写就好，句子生硬也没关系。", "Cứ viết thoải mái. Câu chữ vụng về cũng không sao.", "気軽に書いてください。文章がぎこちなくても大丈夫です。", "Tulis santai saja. Tak apa kalau kalimatnya kaku.")}
              rows={8}
              className="mt-6 w-full resize-none rounded-2xl bg-[color:var(--v2-fill)] px-4 py-3.5 text-[16px] leading-[1.65] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] transition placeholder:text-[color:var(--v2-faint)] focus:bg-white focus:ring-2"
            />
          </div>
        )}
      </main>

      <footer className="shrink-0 bg-white px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-[640px]">
          {done ? (
            <Button full onClick={onClose}>
              {t("저장하고 계속하기", "Save and continue", "保存并继续", "Lưu và tiếp tục", "保存して続ける", "Simpan dan lanjut")}
            </Button>
          ) : (
            <Button full onClick={() => (isLast ? setDone(true) : setStep((s) => s + 1))}>
              {isLast ? t("초안 만들기", "Create draft", "生成初稿", "Tạo bản nháp", "下書きを作る", "Buat draf") : t("다음", "Next", "下一步", "Tiếp", "次へ", "Lanjut")}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

