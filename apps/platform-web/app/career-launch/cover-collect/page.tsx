"use client";

// Week 3 — 자기소개서 편집 빌더(탤런트 '내 커리어'와 동일한 형태).
// 4개 고정 문항(지원동기·성장과정·성격 장단점·입사 후 포부)을 직접 작성하고, 실시간 A4 미리보기.
// 변경은 디바운스 자동저장(PUT). 문항(question)은 백엔드 COVER_LABELS 와 매칭되도록 한국어 표준값으로 저장.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, CircleNotch, Eye, Sparkle, ArrowUpRight } from "@phosphor-icons/react";
import { CoverRender } from "../../../components/launch/cover-render";
import { SectionTitle } from "../../../components/launch/ui";
import { SectionChatModal } from "../../../components/launch/SectionChatModal";
import { fetchCoverData, saveCoverData, requestCoverChat, type CoverData, type CoverSection } from "../../../lib/launch/cover-data";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { LaunchAmbientBackground } from "../../../components/launch/LaunchAmbientBackground";
import { AplyFooter } from "../../../components/AplyFooter";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../lib/launch/i18n";

type SaveState = "idle" | "saving" | "saved";

// 백엔드 COVER_LABELS 와 정확히 일치해야 스텝 완료가 반영됨(문항 저장값=한국어 표준).
const SECTIONS: { key: CoverSection; ko: string }[] = [
  { key: "motive", ko: "지원 동기" },
  { key: "growth", ko: "성장 과정" },
  { key: "strength", ko: "성격의 장단점" },
  { key: "aspiration", ko: "입사 후 포부" }
];

export default function CoverCollectPage() {
  const t = useLaunchT();
  const { isReady } = useAuthSession();
  const params = useSearchParams();
  const focus = (params.get("section") as CoverSection | null) ?? null;

  const label: Record<CoverSection, string> = {
    motive: t("지원 동기", "Motivation", "申请动机", "Động lực ứng tuyển", "志望動機", "Motivasi melamar"),
    growth: t("성장 과정", "Background", "成长经历", "Quá trình trưởng thành", "成長過程", "Latar belakang"),
    strength: t("성격의 장단점", "Strengths & weaknesses", "性格优缺点", "Điểm mạnh & yếu", "性格の長所・短所", "Kelebihan & kekurangan"),
    aspiration: t("입사 후 포부", "Goals after joining", "入职后的抱负", "Mục tiêu sau khi vào", "入社後の抱負", "Aspirasi setelah bergabung")
  };
  const hint: Record<CoverSection, string> = {
    motive: t("이 회사·직무에 지원하는 이유를 구체적으로 적어요.", "Why you're applying to this company and role.", "具体写出申请该公司和岗位的理由。", "Lý do bạn ứng tuyển công ty và vị trí này.", "この会社・職務に応募する理由を具体的に。", "Alasan kamu melamar perusahaan dan posisi ini."),
    growth: t("경험을 통해 어떻게 성장했는지 이야기해요.", "How you grew through your experiences.", "讲述你通过经历如何成长。", "Bạn đã trưởng thành thế nào qua trải nghiệm.", "経験を通してどう成長したか。", "Bagaimana kamu tumbuh lewat pengalaman."),
    strength: t("강점과 보완할 점을 솔직하게 적어요.", "Your strengths and areas to improve.", "坦诚写出优点与需改进之处。", "Điểm mạnh và điều cần cải thiện.", "強みと補うべき点を率直に。", "Kelebihan dan hal yang perlu diperbaiki."),
    aspiration: t("입사 후 이루고 싶은 목표를 적어요.", "What you want to achieve after joining.", "写出入职后想实现的目标。", "Mục tiêu bạn muốn đạt sau khi vào.", "入社後に成し遂げたい目標を。", "Tujuan yang ingin dicapai setelah bergabung.")
  };

  const [company, setCompany] = useState("");
  const [answers, setAnswers] = useState<Record<CoverSection, string>>({ motive: "", growth: "", strength: "", aspiration: "" });
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [showPreview, setShowPreview] = useState(false);
  const [chatFocus, setChatFocus] = useState<CoverSection | null>(null);

  useEffect(() => {
    if (!isReady) return;
    let alive = true;
    void (async () => {
      try {
        const { data } = await fetchCoverData();
        if (!alive) return;
        setCompany(data.company ?? "");
        const items = data.items ?? [];
        const next: Record<CoverSection, string> = { motive: "", growth: "", strength: "", aspiration: "" };
        SECTIONS.forEach((s, idx) => {
          const match = items.find((it) => (it.question ?? "").trim() === s.ko) ?? items[idx];
          next[s.key] = match?.answer ?? "";
        });
        setAnswers(next);
      } catch {
        // 빈 상태
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isReady]);

  useEffect(() => {
    if (!loaded || !focus) return;
    const el = document.getElementById(`sec-${focus}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loaded, focus]);

  const buildData = (c: string, a: Record<CoverSection, string>): CoverData => ({
    company: c.trim() || null,
    items: SECTIONS.map((s) => ({ question: s.ko, answer: a[s.key] }))
  });

  const preview: CoverData = buildData(company, answers);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSave = (c: string, a: Record<CoverSection, string>) => {
    if (!loaded) return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await saveCoverData(buildData(c, a));
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    }, 700);
  };

  const setAnswer = (key: CoverSection, v: string) => {
    const next = { ...answers, [key]: v };
    setAnswers(next);
    scheduleSave(company, next);
  };
  const setCompanyVal = (v: string) => {
    setCompany(v);
    scheduleSave(v, answers);
  };

  const aiLabel = t("AI로 채우기", "Fill with AI", "用AI填写", "Điền bằng AI", "AIで埋める", "Isi dengan AI");
  // AI 챗 — 해당 문항 focus 로 대화하고, 갱신된 답변을 반영 + 저장(스텝 완료).
  const chatRequest = async (history: { role: "bot" | "user"; text: string }[]) => {
    const focus = chatFocus ?? "motive";
    const { reply, data: d, done } = await requestCoverChat(history, buildData(company, answers), focus);
    const items = d.items ?? [];
    const nextAnswers = { ...answers };
    // 정식 질문(question === s.ko) 매칭만 — 포커스 문항만 온 경우 다른 문항 오염 방지.
    SECTIONS.forEach((s) => {
      const match = items.find((it) => (it.question ?? "").trim() === s.ko);
      if (match && typeof match.answer === "string") nextAnswers[s.key] = match.answer;
    });
    const nextCompany = d.company ?? company;
    setCompany(nextCompany);
    setAnswers(nextAnswers);
    void saveCoverData(buildData(nextCompany, nextAnswers)).catch(() => {});
    return { reply, done };
  };

  if (!isReady || !loaded) {
    return (
      <div className="isolate flex min-h-screen flex-col bg-white">
        <LaunchAmbientBackground />
        <CareerLaunchHeader />
        <main className="flex flex-1 items-center justify-center">
          <span className="text-[13px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</span>
        </main>
        <AplyFooter />
      </div>
    );
  }

  const taClass = "min-h-[120px] w-full resize-y rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[14px] leading-relaxed text-[#191F28] outline-none transition placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          <div className="flex items-center justify-between gap-3">
            <Link href="/career-launch/week/3" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
              {t("← 3주차", "← Week 3", "← 第3周", "← Tuần 3", "← Week 3", "← Minggu 3")}
            </Link>
            <div className="flex items-center gap-3">
              <SaveIndicator state={saveState} t={t} />
              <button type="button" onClick={() => setShowPreview((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8] lg:hidden">
                <Eye className="h-4 w-4" weight="bold" /> {t("미리보기", "Preview", "预览", "Xem trước", "プレビュー", "Pratinjau")}
              </button>
            </div>
          </div>

          <div className="mt-3.5">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{t("자기소개서", "Cover letter", "自我介绍书", "Thư giới thiệu", "自己紹介書", "Surat lamaran")}</p>
            <h1 className="mt-2 break-keep text-[24px] font-black leading-[1.2] tracking-[-0.03em] text-[#191F28] md:text-[30px]">{focus ? label[focus] : t("내 자기소개서 작성", "Write your cover letter", "撰写我的自我介绍书", "Viết thư giới thiệu", "自己紹介書を作成", "Tulis surat lamaran")}</h1>
            <p className="mt-2 break-keep text-[14px] leading-relaxed text-[#8B95A1] md:text-[14.5px]">{focus ? t("이 문항만 작성하면 돼요. 직접 쓰거나 'AI로 채우기'로 대화하며 완성하세요.", "Just write this section — type it or use 'Fill with AI' to complete it by chatting.", "只需撰写此文项。可直接输入，或用“用AI填写”对话完成。", "Chỉ cần viết mục này — tự viết hoặc dùng 'Điền bằng AI' để hoàn thành qua trò chuyện.", "この項目だけ書けばOK。直接書くか『AIで埋める』で会話しながら完成させましょう。", "Cukup tulis bagian ini — ketik langsung atau pakai 'Isi dengan AI' lewat percakapan.") : t("네 문항을 직접 작성하면 오른쪽 미리보기에 바로 반영돼요. 내용은 자동 저장됩니다.", "Write the four sections and they update the preview instantly. Everything saves automatically.", "撰写四个部分，右侧预览即时更新。内容自动保存。", "Viết bốn mục và bản xem trước cập nhật ngay. Mọi thứ được lưu tự động.", "4つの項目を書くと右のプレビューに即反映。内容は自動保存されます。", "Tulis empat bagian dan pratinjau langsung diperbarui. Semua tersimpan otomatis.")}</p>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex flex-col gap-8">
              {/* 지원 회사(선택) — 특정 문항으로 진입 시엔 숨김 */}
              {!focus ? (
                <div>
                  <SectionTitle>{t("지원 회사", "Target company", "目标公司", "Công ty ứng tuyển", "応募先", "Perusahaan tujuan")}</SectionTitle>
                  <input value={company} onChange={(e) => setCompanyVal(e.target.value)} placeholder={t("예: OO전자 (선택)", "e.g., OO Corp (optional)", "例：OO电子（可选）", "VD: Công ty OO (tùy chọn)", "例：OO電子（任意）", "Cth: OO Corp (opsional)")} className="w-full rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[14px] text-[#191F28] outline-none transition placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]" />
                </div>
              ) : null}

              {SECTIONS.map((s, i) => ({ s, i })).filter(({ s }) => !focus || focus === s.key).map(({ s, i }) => (
                <section key={s.key} id={`sec-${s.key}`}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-[13px] font-black tabular-nums text-[#0B46E8]">{String(i + 1).padStart(2, "0")}</span>
                      <h2 className="text-[17px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[18px]">{label[s.key]}</h2>
                    </div>
                    <button type="button" onClick={() => setChatFocus(s.key)} className="inline-flex items-center gap-1 rounded-lg bg-[#191F28] px-3 py-1.5 text-[12.5px] font-bold text-white transition hover:bg-[#0B1227]">
                      <Sparkle className="h-3.5 w-3.5" weight="fill" /> {aiLabel}
                    </button>
                  </div>
                  <p className="mb-2.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{hint[s.key]}</p>
                  <textarea value={answers[s.key]} onChange={(e) => setAnswer(s.key, e.target.value)} rows={5} placeholder={hint[s.key]} className={taClass} />
                </section>
              ))}

            </div>

            {/* 실시간 A4 미리보기 */}
            <div className={`${showPreview ? "block" : "hidden"} lg:block`}>
              <div className="lg:sticky lg:top-20">
                <p className="mb-2.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("실시간 미리보기", "Live preview", "实时预览", "Xem trước trực tiếp", "リアルタイムプレビュー", "Pratinjau langsung")}</p>
                <div className="max-h-[calc(100vh-9rem)] overflow-y-auto rounded-2xl bg-[#F2F4F6] p-3">
                  <CoverRender data={preview} />
                </div>
                <Link href="/career-launch/cover-preview" target="_blank" rel="noopener noreferrer" className="mt-3 block text-center text-[12.5px] font-bold text-[#0B46E8] transition hover:underline">
                  {t("전체 화면으로 보기", "Open full screen", "全屏查看", "Xem toàn màn hình", "全画面で見る", "Lihat layar penuh")} <ArrowUpRight className="inline h-3.5 w-3.5 align-text-bottom" weight="bold" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <AplyFooter />
      {chatFocus ? (
        <SectionChatModal
          title={`${label[chatFocus]} · ${t("대화로 채우기", "Fill by chat", "对话填写", "Điền qua chat", "会話で入力", "Isi via chat")}`}
          request={chatRequest}
          onClose={() => setChatFocus(null)}
        />
      ) : null}
    </div>
  );
}

function SaveIndicator({ state, t }: { state: SaveState; t: ReturnType<typeof useLaunchT> }) {
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#8B95A1]">
        <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" /> {t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…")}
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#12B76A]">
        <Check className="h-3.5 w-3.5" weight="bold" /> {t("저장됨", "Saved", "已保存", "Đã lưu", "保存済み", "Tersimpan")}
      </span>
    );
  }
  return null;
}
