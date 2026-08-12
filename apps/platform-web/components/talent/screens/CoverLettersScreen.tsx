"use client";

// 자기소개서 — 기본 / 공고 맞춤 두 유형. 빈 편집기 대신 질문에 답하는 흐름을 먼저 제공한다.
import { useState } from "react";
import { Plus, X, ArrowLeft, PenNib, CheckCircle } from "@phosphor-icons/react";
import { CareerLayout } from "../career/CareerLayout";
import { ProfileGate } from "../career/ProfileGate";
import { TCard, TChip, TEmpty, TLoading, TError, TPageHeader } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { useBasicInfo, isBasicInfoComplete } from "../../../lib/talent/basic-info";
import { tailoredCoverQuestions } from "../../../lib/talent/labels";
import type { CoverLetter, CoverLetterType, TalentSnapshot } from "../../../lib/talent/types";
import { usePlatformT } from "../../../lib/i18n";

const basicQuestions = [
  "나를 한 문장으로 소개한다면?",
  "가장 자신 있는 강점은 무엇인가요?",
  "앞으로 어떤 일을 하고 싶나요?"
];

export function CoverLettersScreen() {
  const t = usePlatformT();
  const { snapshot, status, reload } = useTalentSnapshot();
  const ready = isBasicInfoComplete(useBasicInfo());
  const [choosing, setChoosing] = useState(false);
  const [flowType, setFlowType] = useState<CoverLetterType | null>(null);

  return (
    <CareerLayout>
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={reload} /> : null}
      {status === "ready" && snapshot && !ready ? <ProfileGate /> : null}

      {status === "ready" && snapshot && ready ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <TPageHeader title={t("자기소개서","Cover letter","求职信","Thư xin việc","自己PR","Surat lamaran")} description={t("질문에 답하다 보면 막막한 자기소개서도 하나씩 채워져요.","Answer the questions and even a daunting cover letter fills in bit by bit.","一边回答问题，让人发愁的求职信也会逐渐完成。","Trả lời câu hỏi, thư xin việc nan giải cũng dần hoàn thành.","質問に答えるうちに、難しい自己PRも少しずつ埋まります。","Jawab pertanyaan, surat lamaran yang rumit pun terisi sedikit demi sedikit.")} />
            {snapshot.coverLetters.length === 0 ? (
              <TalentButton onClick={() => setChoosing(true)} variant="primary" size="md" aria-label={t("자기소개서 시작","Start cover letter","开始求职信","Bắt đầu thư xin việc","自己PRを始める","Mulai surat lamaran")}>
                <Plus className="h-4 w-4" weight="bold" /> {t("새로 쓰기","New","新建","Viết mới","新規作成","Tulis baru")}
              </TalentButton>
            ) : null}
          </div>

          {snapshot.coverLetters.length === 0 ? (
            <TEmpty
              icon="📝"
              title={t("아직 자기소개서가 없어요","No cover letter yet","还没有求职信","Chưa có thư xin việc","まだ自己PRがありません","Belum ada surat lamaran")}
              description={t("기본 자기소개서부터 시작하거나, 지원할 공고에 맞춰 작성할 수 있어요.","Start with a basic cover letter, or tailor it to a specific job posting.","可以从基础求职信开始，也可以针对具体职位撰写。","Bắt đầu bằng thư cơ bản, hoặc viết theo tin tuyển dụng cụ thể.","基本の自己PRから始めるか、応募先に合わせて作成できます。","Mulai dari surat dasar, atau sesuaikan dengan lowongan tertentu.")}
              action={<TalentButton onClick={() => setChoosing(true)} variant="soft" size="md">{t("자기소개서 시작하기","Start cover letter","开始求职信","Bắt đầu thư xin việc","自己PRを始める","Mulai surat lamaran")}</TalentButton>}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {snapshot.coverLetters.map((c) => (
                <CoverRow key={c.id} cover={c} />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {choosing ? (
        <TypeChooser
          onClose={() => setChoosing(false)}
          onPick={(t) => {
            setChoosing(false);
            setFlowType(t);
          }}
        />
      ) : null}

      {flowType && snapshot ? (
        <CoverFlow type={flowType} snapshot={snapshot} onClose={() => setFlowType(null)} />
      ) : null}
    </CareerLayout>
  );
}

function CoverRow({ cover }: { cover: CoverLetter }) {
  const t = usePlatformT();
  return (
    <TCard className="flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD]">
        <PenNib className="h-5 w-5 text-[#0B46E8]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-[#191F28]">{cover.title}</p>
        <p className="mt-1 text-[12.5px] text-[#8B95A1]">{cover.type === "tailored" ? t("공고 맞춤","Tailored","职位定制","Theo tin tuyển","求人特化","Sesuai lowongan") : t("기본","Basic","基础","Cơ bản","基本","Dasar")} · {t("수정","Edited","修改","Sửa","更新","Diedit")} {cover.updatedAt}</p>
      </div>
      <TChip tone={cover.status === "ready" ? "lime" : "blue"}>{cover.status === "ready" ? t("완성","Done","完成","Xong","完成","Selesai") : t("작성 중","In progress","撰写中","Đang viết","作成中","Sedang dibuat")}</TChip>
    </TCard>
  );
}

function TypeChooser({ onClose, onPick }: { onClose: () => void; onPick: (type: CoverLetterType) => void }) {
  const t = usePlatformT();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1227]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-black text-[#0B1227]">{t("어떤 자기소개서를 쓸까요?","Which cover letter to write?","写哪种求职信？","Viết loại thư nào?","どの自己PRを書きますか？","Tulis surat lamaran yang mana?")}</h2>
          <button type="button" aria-label={t("닫기","Close","关闭","Đóng","閉じる","Tutup")} onClick={onClose} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          <button type="button" onClick={() => onPick("basic")} className="rounded-2xl border border-[#E5E8EB] bg-white p-4 text-left transition hover:border-[#0B46E8]">
            <p className="text-[15px] font-bold text-[#191F28]">{t("기본 자기소개서","Basic cover letter","基础求职信","Thư xin việc cơ bản","基本の自己PR","Surat lamaran dasar")}</p>
            <p className="mt-1 text-[13px] text-[#8B95A1]">{t("나를 소개하는 기본 문장을 먼저 만들어요.","Start with the basic lines that introduce you.","先写介绍自己的基础句子。","Bắt đầu bằng những câu giới thiệu bản thân.","まず自分を紹介する基本の文章を作ります。","Mulai dari kalimat dasar yang memperkenalkan dirimu.")}</p>
          </button>
          <button type="button" onClick={() => onPick("tailored")} className="rounded-2xl border border-[#E5E8EB] bg-white p-4 text-left transition hover:border-[#0B46E8]">
            <p className="text-[15px] font-bold text-[#191F28]">{t("공고 맞춤 자기소개서","Tailored cover letter","职位定制求职信","Thư xin việc theo tin tuyển","求人特化の自己PR","Surat lamaran sesuai lowongan")}</p>
            <p className="mt-1 text-[13px] text-[#8B95A1]">{t("지원할 공고에 맞춰 문항별로 작성해요.","Write question by question, tailored to the job posting.","按招聘信息逐题撰写。","Viết theo từng câu hỏi, phù hợp tin tuyển dụng.","応募先に合わせて設問ごとに作成します。","Tulis per pertanyaan sesuai lowongan.")}</p>
          </button>
        </div>
      </div>
    </div>
  );
}

function CoverFlow({ type, snapshot, onClose }: { type: CoverLetterType; snapshot: TalentSnapshot; onClose: () => void }) {
  const t = usePlatformT();
  const questions = type === "tailored" ? tailoredCoverQuestions : basicQuestions;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(questions.map(() => ""));
  const [done, setDone] = useState(false);

  const isLast = step === questions.length - 1;

  function setAnswer(v: string) {
    setAnswers((a) => a.map((x, i) => (i === step ? v : x)));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="sticky top-0 border-b border-[#EEF1F5] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          {step > 0 && !done ? (
            <button type="button" aria-label={t("이전","Back","上一步","Quay lại","戻る","Kembali")} onClick={() => setStep((s) => s - 1)} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <span className="w-8" />
          )}
          <p className="flex-1 text-center text-[13.5px] font-bold text-[#191F28]">{type === "tailored" ? t("공고 맞춤 자기소개서","Tailored cover letter","职位定制求职信","Thư xin việc theo tin tuyển","求人特化の自己PR","Surat lamaran sesuai lowongan") : t("기본 자기소개서","Basic cover letter","基础求职信","Thư xin việc cơ bản","基本の自己PR","Surat lamaran dasar")}</p>
          <button type="button" aria-label={t("닫기","Close","关闭","Đóng","閉じる","Tutup")} onClick={onClose} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-5 py-8">
        {done ? (
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAFFD1]">
              <CheckCircle className="h-8 w-8 text-[#3A6B00]" weight="fill" />
            </span>
            <h2 className="mt-5 text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t("초안이 완성됐어요","Draft is ready","初稿已完成","Bản nháp đã xong","下書きが完成しました","Draf sudah siap")}</h2>
            <p className="mt-2 text-[14px] text-[#4E5968]">{t("답변을 바탕으로 자기소개서 초안을 만들었어요. 이어서 다듬을 수 있어요.","We drafted your cover letter from your answers. You can keep refining it.","已根据你的回答生成求职信初稿，可以继续完善。","Chúng tôi đã tạo bản nháp thư từ câu trả lời của bạn. Bạn có thể tiếp tục chỉnh.","回答をもとに自己PRの下書きを作成しました。続けて整えられます。","Kami buat draf surat dari jawabanmu. Bisa terus diperbaiki.")}</p>
            <TCard className="mt-6 w-full p-5 text-left">
              {questions.map((qq, i) => (
                <div key={qq} className="border-b border-[#F2F4F6] py-3 last:border-0">
                  <p className="text-[12.5px] font-bold text-[#8B95A1]">{qq}</p>
                  <p className="mt-1 break-keep text-[13.5px] leading-relaxed text-[#191F28]">{answers[i] || "…"}</p>
                </div>
              ))}
            </TCard>
            <div className="mt-6 w-full">
              <TalentButton onClick={onClose} variant="primary" size="lg" fullWidth aria-label={t("저장하고 닫기","Save and close","保存并关闭","Lưu và đóng","保存して閉じる","Simpan dan tutup")}>{t("저장하고 계속하기","Save and continue","保存并继续","Lưu và tiếp tục","保存して続ける","Simpan dan lanjut")}</TalentButton>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-[13px] font-bold text-[#0B46E8]">{step + 1} / {questions.length}</p>
            <h2 className="mt-2 break-keep text-[20px] font-black leading-[1.35] tracking-[-0.02em] text-[#0B1227]">{questions[step]}</h2>
            {type === "tailored" && step === 0 ? (
              <p className="mt-2 text-[13.5px] text-[#8B95A1]">{t("지원할 공고를 떠올리며 답해보세요.","Answer with the job posting in mind.","请想着要申请的职位来回答。","Trả lời khi nghĩ đến tin tuyển dụng.","応募先の求人を思い浮かべて答えてください。","Jawab sambil membayangkan lowongannya.")} {snapshot.applications[0]?.company ?? ""}</p>
            ) : null}
            <textarea
              value={answers[step]}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={t("편하게 적어주세요. 문장이 어색해도 괜찮아요.","Write freely. It's okay if the wording feels off.","随意写就好，句子生硬也没关系。","Cứ viết thoải mái. Câu chữ vụng về cũng không sao.","気軽に書いてください。文章がぎこちなくても大丈夫です。","Tulis santai saja. Tak apa kalau kalimatnya kaku.")}
              rows={7}
              className="mt-5 w-full resize-none rounded-2xl border border-[#E5E8EB] bg-white px-4 py-3.5 text-[15px] leading-relaxed text-[#191F28] outline-none focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
            />
          </div>
        )}
      </main>

      {!done ? (
        <footer className="border-t border-[#EEF1F5] bg-white px-5 py-4">
          <div className="mx-auto max-w-xl">
            <TalentButton
              onClick={() => (isLast ? setDone(true) : setStep((s) => s + 1))}
              variant="primary"
              size="lg"
              fullWidth
              aria-label={isLast ? t("초안 만들기","Create draft","生成初稿","Tạo bản nháp","下書きを作る","Buat draf") : t("다음","Next","下一步","Tiếp","次へ","Lanjut")}
            >
              {isLast ? t("초안 만들기","Create draft","生成初稿","Tạo bản nháp","下書きを作る","Buat draf") : t("다음","Next","下一步","Tiếp","次へ","Lanjut")}
            </TalentButton>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
