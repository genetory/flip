"use client";

// v2 모의 면접 세션 — 예전 팝업(MockInterviewModal)의 v2 모양. 다른 연습 팝업과 같은 크기(tall 시트).
// 질문 유형 고르기 → (AI가 한 문항씩 만들고) 한 문항 연습 시트로 답하기·피드백 → [다음 질문].
// 답 기록: Aply·원티드 공고 → 서버 연습 기록 / 가져온 공고(ext-…) → 계정의 가져온 공고 / 내 서류 → 내 연습 기록(self-mock).
import { useState } from "react";
import { Sheet } from "./sheets";
import { Spinner } from "./ui";
import { PracticeSheet, type PracticeQuestion } from "./practice";
import { companyOf } from "./lib";
import { useLanguage } from "../i18n/LanguageProvider";
import { usePlatformT } from "../../lib/i18n";
import { aiInterviewQuestions, recordMockInterviewPractice, type InterviewFeedback, type InterviewQuestion, type PublicPositionListItem } from "../../lib/member-profile-client";
import { useResumeDoc } from "../../lib/talent/resume-doc";
import { useCoverDoc, type CoverDoc } from "../../lib/talent/cover-doc";
import { useBasicInfo } from "../../lib/talent/basic-info";
import { saveSelfMockAnswer } from "../../lib/talent/self-mock";
import { recordImportedPractice } from "../../lib/talent/imported-jobs";
import { mockCategoryLabelOf } from "../../lib/talent/career-labels";
import { resumeToText } from "../talent/jobs/MockInterviewModal";
import { isInterviewPaywallError, openInterviewPaywall, useInterviewCredits } from "../../lib/interview-credits";

function coverToText(doc: CoverDoc | null): string {
  return (doc?.items ?? [])
    .filter((it) => it.text.trim())
    .map((it) => `- [${it.question}] ${it.text.trim()}`)
    .join("\n")
    .slice(0, 6000);
}
function jobToText(item: PublicPositionListItem): string {
  return [`공고: ${item.title}`, item.preferredJobRole ? `직무: ${item.preferredJobRole}` : "", item.mockInterviewIntent ? `면접 포커스: ${item.mockInterviewIntent}` : "", item.mainResponsibilities ? `주요 업무: ${item.mainResponsibilities}` : "", item.requiredQualifications ? `자격 요건: ${item.requiredQualifications}` : ""]
    .filter(Boolean)
    .join("\n")
    .slice(0, 6000);
}

type Cat = "job" | "authored" | "intro" | "competency" | "experience" | "weakness";

export function InterviewSession({ item, onClose }: { item?: PublicPositionListItem | null; onClose: () => void }) {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const resume = useResumeDoc();
  const cover = useCoverDoc();
  const info = useBasicInfo();
  const [cat, setCat] = useState<Cat | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authored = (item?.mockInterviewQuestions ?? []).filter(Boolean);
  // 유료화가 켜져 있고 이용권이 없으면 질문을 만들기 전에 결제 창부터.
  const credits = useInterviewCredits();
  const noCredits = Boolean(credits?.paywall) && (credits?.credits ?? 0) < 1;
  const company = item ? companyOf(item) : "";

  const generate = async (category: Cat, asked: string[]): Promise<InterviewQuestion[]> => {
    const qs = await aiInterviewQuestions({
      resumeText: resumeToText(resume, info),
      coverLetterText: coverToText(cover) || undefined,
      jobText: item ? jobToText(item) : undefined,
      desiredJobRole: item?.preferredJobRole ?? resume?.targetRole ?? undefined,
      askedQuestions: asked,
      count: 1,
      category: category === "job" ? undefined : category,
      locale
    });
    return qs.filter((q) => q.question && !asked.includes(q.question));
  };
  const fail = (e: unknown) => {
    if (isInterviewPaywallError(e)) {
      openInterviewPaywall("needed");
      return;
    }
    setError(
      (e as { status?: number })?.status === 429
        ? t("오늘 AI 이용 한도에 도달했어요. 내일 다시 해 주세요.", "Today's AI limit was reached. Try tomorrow.", "今天的 AI 使用已达上限。", "Đã hết lượt AI hôm nay.", "本日のAI上限に達しました。", "Batas AI hari ini tercapai.")
        : t("질문을 만들지 못했어요. 잠시 후 다시 해 보세요.", "Couldn't create a question. Try again soon.", "无法生成问题，请稍后再试。", "Không tạo được câu hỏi.", "質問を作れませんでした。", "Gagal membuat pertanyaan.")
    );
  };

  const pick = async (c: Cat) => {
    if (noCredits) {
      openInterviewPaywall("needed");
      return;
    }
    setCat(c);
    setError(null);
    setIdx(0);
    if (c === "authored") {
      setQuestions(authored.map((q) => ({ question: q, intent: "", category: "other" })));
      return;
    }
    setBusy(true);
    try {
      const qs = await generate(c, []);
      if (!qs.length) throw new Error("empty");
      setQuestions(qs);
    } catch (e) {
      fail(e);
      setCat(null);
    } finally {
      setBusy(false);
    }
  };
  const next = async () => {
    if (idx + 1 < questions.length) return setIdx(idx + 1);
    if (cat === "authored") return onClose(); // 회사 대표 질문을 다 풀었다
    setBusy(true);
    try {
      const qs = await generate(cat!, questions.map((q) => q.question));
      if (!qs.length) throw new Error("empty");
      setQuestions((cur) => [...cur, ...qs]);
      setIdx(idx + 1);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };
  const save = (q: PracticeQuestion, answer: string, fb: InterviewFeedback) => {
    if (item?.id?.startsWith("ext-")) recordImportedPractice(item.id, { question: q.ko, answer, score: fb.score });
    else if (item?.id) void recordMockInterviewPractice(item.id, { question: q.ko, answer, score: fb.score }).catch(() => {});
    else saveSelfMockAnswer({ question: q.ko, category: q.category, answer, score: fb.score, feedback: { score: fb.score, strengths: fb.strengths, improvements: fb.improvements, sampleAnswer: fb.sampleAnswer } });
  };

  const heading = item ? item.title : t("내 서류로 모의 면접", "Mock interview with my documents", "用我的材料模拟面试", "Phỏng vấn thử từ hồ sơ", "自分の書類で模擬面接", "Simulasi dari dokumenku");
  const catLabel = (c: Cat) => (c === "job" ? t("이 공고 맞춤", "Tailored to this job", "此职位定制", "Theo tin này", "この求人向け", "Sesuai lowongan") : c === "authored" ? t("회사 대표 질문", "Company's questions", "公司提供的问题", "Câu hỏi của công ty", "会社の質問", "Pertanyaan perusahaan") : mockCategoryLabelOf(t, c));

  // 질문 유형 고르기(또는 첫 질문 만드는 중)
  if (!cat || (busy && !questions.length)) {
    const options: { c: Cat; icon: string; tone: string; desc: string }[] = [
      ...(item ? [{ c: "job" as Cat, icon: "📌", tone: "bg-[#edf1fd]", desc: t("주요 업무·자격 요건에 근거한 질문", "Based on duties & requirements", "基于工作内容和要求", "Dựa trên công việc & yêu cầu", "業務・応募資格に基づく質問", "Berdasarkan tugas & syarat") }] : []),
      ...(authored.length ? [{ c: "authored" as Cat, icon: "🏢", tone: "bg-[#f3eeff]", desc: t(`회사가 준비한 질문 ${authored.length}개`, `${authored.length} from the company`, `公司准备的 ${authored.length} 题`, `${authored.length} câu từ công ty`, `会社が用意した${authored.length}問`, `${authored.length} dari perusahaan`) }] : []),
      { c: "intro", icon: "🙋", tone: "bg-[#fff4e8]", desc: t("자기소개·지원 동기", "Intro & motivation", "自我介绍·动机", "Giới thiệu & động lực", "自己紹介・志望動機", "Perkenalan & motivasi") },
      { c: "competency", icon: "💼", tone: "bg-[#e8f8f1]", desc: t("직무 역량·문제 해결", "Skills & problem solving", "能力·解决问题", "Năng lực & giải quyết vấn đề", "職務能力・問題解決", "Kompetensi & solusi") },
      { c: "experience", icon: "📂", tone: "bg-[#fff0f3]", desc: t("경험을 깊게 파고들기", "Deep dive into experience", "深挖经历", "Đào sâu kinh nghiệm", "経験の深掘り", "Gali pengalaman") },
      { c: "weakness", icon: "🧭", tone: "bg-[color:var(--v2-band)]", desc: t("인성·상황 대처", "Character & situations", "人品·情境应对", "Tính cách & tình huống", "人柄・状況対応", "Karakter & situasi") }
    ];
    return (
      <Sheet tall title={heading} subtitle={company || undefined} onClose={onClose}>
        <p className="text-[19px] font-bold leading-[1.45] text-[color:var(--v2-ink)]">{t("어떤 질문으로 연습할까요?", "What would you like to practice?", "想练习哪类问题？", "Bạn muốn luyện loại nào?", "どの質問で練習しますか？", "Mau latihan pertanyaan apa?")}</p>
        <p className="mt-1 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{t("고르면 AI가 한 문항씩 만들어요. 답하면 바로 피드백, [다음 질문]으로 이어서.", "Pick one — AI writes questions one by one; you get feedback after each.", "选择后 AI 逐题出题，每题回答后立即反馈。", "Chọn — AI tạo từng câu, phản hồi sau mỗi câu.", "選ぶとAIが1問ずつ作ります。答えるとすぐフィードバック。", "Pilih — AI membuat pertanyaan satu per satu.")}</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {options.map((o) => (
            <button key={o.c} type="button" disabled={busy} onClick={() => void pick(o.c)} className={`flex min-h-[112px] flex-col justify-between rounded-3xl p-4 text-left transition hover:-translate-y-0.5 disabled:opacity-60 ${o.tone}`}>
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-[18px]" aria-hidden>
                {busy && cat === o.c ? <Spinner className="h-4 w-4 text-[color:var(--v2-accent)]" /> : o.icon}
              </span>
              <span className="mt-2 block">
                <span className="block text-[15px] font-bold text-[color:var(--v2-ink)]">{catLabel(o.c)}</span>
                <span className="mt-0.5 block text-[12px] leading-[1.45] text-[color:var(--v2-muted)]">{o.desc}</span>
              </span>
            </button>
          ))}
        </div>
        {error ? <p className="mt-3 rounded-2xl bg-[#fff4e8] px-4 py-3 text-[14px] text-[#c2410c]">{error}</p> : null}
      </Sheet>
    );
  }

  const q = questions[idx];
  return (
    <PracticeSheet
      key={`${cat}-${idx}`}
      heading={heading}
      progress={`Q${idx + 1} · ${catLabel(cat)}${company ? ` · ${company}` : ""}`}
      question={{ ko: q.question, shown: q.question, category: cat === "job" || cat === "authored" ? q.category || "job" : cat }}
      intent={q.intent || undefined}
      onSave={save}
      onNext={() => void next()}
      nextBusy={busy}
      onClose={onClose}
    />
  );
}
