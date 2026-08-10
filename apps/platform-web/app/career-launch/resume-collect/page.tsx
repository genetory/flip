"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RichText } from "../../../components/launch/rich-text";
import { ResumeSectionPreview } from "../../../components/launch/resume-section-preview";
import { STUDENT } from "../../../lib/launch/data";
import { requestResumeChat, fetchResumeData, resetResumeData, hasResumeContent, type ResumeChatMsg, type ResumeData, type ResumeSection } from "../../../lib/launch/resume-data";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { trackCareerStepComplete } from "../../../lib/analytics";
import { useLaunchT } from "../../../lib/launch/i18n";

// Week 2 — 별도 빌더로 가지 않고 AI와 대화하며 이력서 데이터를 쌓는다. 백엔드에 자동 저장.
type Msg = { role: "bot" | "user"; text: string };

export default function ResumeCollectPage() {
  const t = useLaunchT();
  const { user, isReady } = useAuthSession();
  // 현재 채우는 섹션 표시용 라벨.
  const SECTION_LABEL: Record<ResumeSection, string> = {
    basic: t("기본정보·한줄소개", "Basic info & one-line intro", "基本信息·一句话介绍", "Thông tin cơ bản & giới thiệu ngắn", "基本情報・一言紹介", "Info dasar & perkenalan singkat"),
    edu: t("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan"),
    exp: t("경력 (회사 경력)", "Work experience", "工作经历", "Kinh nghiệm làm việc", "職歴（会社経歴）", "Pengalaman kerja"),
    expOther: t("활동·프로젝트", "Activities & projects", "活动·项目", "Hoạt động·Dự án", "活動・プロジェクト", "Aktivitas·Proyek"),
    skill: t("스킬", "Skills", "技能", "Kỹ năng", "スキル", "Keahlian"),
    lang: t("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa")
  };
  // 스텝별 입력 예시 — 학생이 무엇을 어떻게 답할지 바로 감 잡도록 placeholder 로 보여준다.
  const PLACEHOLDER: Record<ResumeSection, string> = {
    basic: t("예: 응우옌 마이, 고려대 경영학과, 마케팅 직무 준비 중", "e.g., Nguyen Mai, Korea Univ. Business, aiming for marketing", "例：阮梅，高丽大学经营学，准备市场营销岗位", "VD: Nguyen Mai, ĐH Korea ngành Kinh doanh, hướng marketing", "例：グエン・マイ、高麗大経営学科、マーケティング志望", "Cth: Nguyen Mai, Korea Univ. Bisnis, incar marketing"),
    edu: t("예: 고려대학교 경영학과 학사, 2021.03~2025.02", "e.g., Korea Univ., B.A. in Business, 2021.03–2025.02", "例：高丽大学经营学学士，2021.03~2025.02", "VD: ĐH Korea, Cử nhân Kinh doanh, 2021.03–2025.02", "例：高麗大学 経営学 学士、2021.03〜2025.02", "Cth: Korea Univ., S1 Bisnis, 2021.03–2025.02"),
    exp: t("예: 스타트업 A에서 3개월 마케팅 인턴, SNS 캠페인 운영", "e.g., 3-month marketing intern at Startup A, ran SNS campaigns", "例：在初创A做3个月市场营销实习，运营社媒活动", "VD: Thực tập marketing 3 tháng tại Startup A, chạy chiến dịch SNS", "例：スタートアップAで3ヶ月マーケインターン、SNS運用", "Cth: Magang marketing 3 bln di Startup A, kelola kampanye SNS"),
    expOther: t("예: 교내 창업동아리 팀장, 데모데이 발표·수상", "e.g., Led a startup club, presented & won at demo day", "例：校内创业社团组长，Demo Day发表并获奖", "VD: Trưởng nhóm CLB khởi nghiệp, thuyết trình & đoạt giải demo day", "例：学内起業サークル代表、デモデイ発表・受賞", "Cth: Ketua klub startup, presentasi & menang demo day"),
    skill: t("예: Python, SQL, Figma, 포토샵", "e.g., Python, SQL, Figma, Photoshop", "例：Python、SQL、Figma、Photoshop", "VD: Python, SQL, Figma, Photoshop", "例：Python、SQL、Figma、Photoshop", "Cth: Python, SQL, Figma, Photoshop"),
    lang: t("예: 한국어 TOPIK 5급, 영어 TOEIC 900", "e.g., Korean TOPIK 5, English TOEIC 900", "例：韩语TOPIK5级，英语TOEIC900", "VD: Tiếng Hàn TOPIK 5, Tiếng Anh TOEIC 900", "例：韓国語TOPIK5級、英語TOEIC900", "Cth: Korea TOPIK 5, Inggris TOEIC 900")
  };
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  const startedRef = useRef(false);
  const [data, setData] = useState<ResumeData>({});
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // 전송 완료(loading true→false) 시 입력창 포커스를 되돌려, 채팅 중 포커스가 풀리지 않게 한다.
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !loading) inputRef.current?.focus();
    prevLoadingRef.current = loading;
  }, [loading]);
  const [done, setDone] = useState(false);
  const [focus, setFocus] = useState<ResumeSection | undefined>(undefined); // 이 스텝이 집중할 섹션
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    // ?section=basic|edu|exp|skill|lang 이 스텝의 집중 섹션(= 리셋 스코프). ?restart=1 이면 그 섹션만 초기화.
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const restart = params.get("restart") === "1";
    const sectionRaw = params.get("section");
    const section = (["basic", "edu", "exp", "expOther", "skill", "lang"] as const).find((s) => s === sectionRaw);
    setFocus(section);
    void (async () => {
      let seed: ResumeData = {};
      if (restart) {
        try {
          await resetResumeData(section);
        } catch {
          // 초기화 실패해도 남은 데이터로 진행
        }
      }
      // 초기화 후에도 남은 섹션(부분 초기화 시)은 seed 로 이어간다. 전체 초기화면 빈 seed.
      try {
        const saved = await fetchResumeData();
        seed = saved.data ?? {};
        setData(seed);
      } catch {
        // 저장분 없거나 조회 실패 — 빈 데이터로 시작
      }
      // 이어하기(저장분 있음) — 스피너만 보이지 않게 즉시 반기고 미리보기를 띄운다.
      const continuing = hasResumeContent(seed);
      if (continuing) {
        setMessages([{ role: "bot", text: t(`${displayName}님, 다시 오셨네요 👋 이어서 마저 채워볼게요!`, `Welcome back, ${displayName} 👋 Let's pick up where we left off!`, `${displayName}，欢迎回来 👋 我们接着把剩下的填完吧！`, `Chào mừng trở lại, ${displayName} 👋 Cùng tiếp tục hoàn thiện nhé!`, `${displayName}さん、おかえりなさい 👋 続きを一緒に埋めていきましょう！`, `Selamat datang kembali, ${displayName} 👋 Ayo lanjutkan yang belum selesai!`) }]);
      }
      try {
        const { reply, data: merged } = await requestResumeChat([], seed, section);
        setData(merged);
        setMessages((m) =>
          continuing
            ? [...m, { role: "bot", text: reply }]
            : [{ role: "bot", text: reply || t(`${displayName}님, 반가워요 👋 대화하면서 이력서를 함께 채워볼까요?`, `Hi ${displayName} 👋 Shall we fill out your resume together through a chat?`, `${displayName}，你好 👋 我们边聊边一起完成简历吧？`, `Chào ${displayName} 👋 Cùng trò chuyện và hoàn thiện CV của bạn nhé?`, `${displayName}さん、こんにちは 👋 会話しながら履歴書を一緒に埋めていきましょうか？`, `Hai ${displayName} 👋 Yuk kita isi resume-mu bersama sambil mengobrol?`) }]
        );
      } catch {
        setMessages((m) => (continuing ? [...m, { role: "bot", text: t("잠시 문제가 생겼어요 😥 다시 한 번 시도해줄래요?", "Something went wrong 😥 Could you try once more?", "出了点问题 😥 可以再试一次吗？", "Có chút trục trặc 😥 Bạn thử lại một lần nữa nhé?", "少し問題が発生しました 😥 もう一度試していただけますか？", "Ada sedikit masalah 😥 Bisa coba sekali lagi?") }] : [{ role: "bot", text: t("지금은 대화를 시작하기 어려워요 😥 잠시 후 다시 들어와줄래요?", "We can't start the chat right now 😥 Could you come back in a moment?", "现在无法开始对话 😥 请稍后再进来好吗？", "Hiện chưa thể bắt đầu trò chuyện 😥 Bạn quay lại sau một lát nhé?", "今は会話を開始できません 😥 少し経ってからもう一度来ていただけますか？", "Saat ini belum bisa memulai obrolan 😥 Bisa kembali lagi sebentar lagi?") }]));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const send = (raw: string) => {
    const a = raw.trim();
    if (!a || loading || done) return;
    setInput("");
    const nextMsgs: Msg[] = [...messages, { role: "user", text: a }];
    setMessages(nextMsgs);
    setLoading(true);
    void (async () => {
      try {
        const history: ResumeChatMsg[] = nextMsgs.map((m) => ({ role: m.role, text: m.text }));
        const { reply, data: merged, done: isDone } = await requestResumeChat(history, data, focus);
        setData(merged);
        setMessages((m) => [...m, { role: "bot", text: reply }]);
        if (isDone) {
          trackCareerStepComplete("resume");
          setDone(true);
        }
      } catch {
        setMessages((m) => [...m, { role: "bot", text: t("잠시 문제가 생겼어요 😥 다시 한 번 말해줄래요?", "Something went wrong 😥 Could you say that once more?", "出了点问题 😥 可以再说一次吗？", "Có chút trục trặc 😥 Bạn nói lại một lần nữa nhé?", "少し問題が発生しました 😥 もう一度言っていただけますか？", "Ada sedikit masalah 😥 Bisa ulangi sekali lagi?") }]);
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CareerLaunchHeader />
      <main className="flex-1">
        <div className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-3xl flex-col px-5 pb-4 pt-4 md:pt-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/career-launch/week/2" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
              ← {t("2주차", "Week 2", "第2周", "Tuần 2", "2週目", "Minggu 2")}
            </Link>
            <Link href="/career-launch/week/2" className="rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">{t("종료하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</Link>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#E5E8EB]"><img src="/img_logo.webp" alt="Aply" className="h-full w-full object-contain p-1.5" /></span>
            <div>
              <p className="text-[12px] font-bold text-[#0B46E8]">{t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")}{focus ? t(" 작성 중", " in progress", " 编写中", " đang viết", " 作成中", " sedang dibuat") : ""}</p>
              <p className="text-[15px] font-black text-[#0B1227]">{focus ? SECTION_LABEL[focus] : t("대화로 이력서 채우기", "Build your resume through a chat", "边聊边填写简历", "Hoàn thiện CV qua trò chuyện", "会話で履歴書を埋める", "Isi resume lewat obrolan")}</p>
            </div>
          </div>

          {/* 답변을 토대로 이력서에 담길 내용을 이력서답게 정리해 실시간으로 보여준다. */}
          <ResumeSectionPreview data={data} focus={focus} />

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[#EEF1F5] bg-[#F8FAFC] p-4">
            {messages.map((m, i) =>
              m.role === "bot" ? (
                <div key={i} className="flex items-end gap-2">
                  <span className="flex h-7 w-7 flex-none items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#E5E8EB]"><img src="/img_logo.webp" alt="Aply" className="h-full w-full object-contain p-1" /></span>
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28] shadow-[0_1px_2px_rgba(17,24,39,0.05)]">
                    <RichText text={m.text} />
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#0B46E8] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white"><RichText text={m.text} /></div>
                </div>
              )
            )}
            {loading ? (
              <div className="flex items-end gap-2">
                <span className="flex h-7 w-7 flex-none items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#E5E8EB]"><img src="/img_logo.webp" alt="Aply" className="h-full w-full object-contain p-1" /></span>
                <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(17,24,39,0.05)]">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9CDD2] [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9CDD2] [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9CDD2]" />
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
          <p className="mt-2 text-center text-[11.5px] text-[#B0B8C1]">{t("💬 편하게 모국어로 답해도 돼요 · 💾 진행 내용은 자동 저장돼요", "💬 Feel free to answer in your own language · 💾 Your progress saves automatically", "💬 可以用你的母语回答 · 💾 进度会自动保存", "💬 Bạn có thể trả lời bằng tiếng mẹ đẻ · 💾 Tiến trình được lưu tự động", "💬 母国語で答えても大丈夫です · 💾 進行内容は自動保存されます", "💬 Boleh menjawab dalam bahasa ibumu · 💾 Progres tersimpan otomatis")}</p>

          {done ? (
            <div className="mt-3">
              <div className="mb-2 flex items-center gap-2.5 rounded-2xl border border-[#A6EF3F] bg-[#EAFFD1] px-4 py-3">
                <span className="text-[22px]">🎉</span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-black text-[#0B1227]">{t(`${focus ? SECTION_LABEL[focus] : t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")} 정리 완료!`, `${focus ? SECTION_LABEL[focus] : "Resume"} done!`, `${focus ? SECTION_LABEL[focus] : "简历"} 整理完成！`, `Hoàn thành ${focus ? SECTION_LABEL[focus] : "CV"}!`, `${focus ? SECTION_LABEL[focus] : "履歴書"} 整理完了！`, `${focus ? SECTION_LABEL[focus] : "Resume"} selesai!`)}</p>
                  <p className="mt-0.5 text-[12px] text-[#3A6B00]">{t("잘하고 있어요 — 다음 단계로 이어가 볼까요?", "Great work — ready for the next step?", "做得很好 — 继续下一步吧？", "Làm tốt lắm — sang bước tiếp theo nhé?", "その調子です — 次のステップに進みましょうか？", "Kerja bagus — lanjut ke langkah berikutnya?")}</p>
                </div>
              </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setDone(false)}
                className="flex h-[46px] items-center justify-center rounded-xl border border-[#D7DCE3] bg-white px-4 text-[13.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40"
              >
                {t("계속 작성하기", "Keep writing", "继续编写", "Tiếp tục viết", "続けて作成する", "Lanjut menulis")}
              </button>
              <Link
                href="/career-launch/week/2"
                className="flex h-[46px] flex-1 items-center justify-center rounded-xl bg-[#0B46E8] text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]"
              >
                {t("2주차 페이지로", "To Week 2 page", "前往第2周页面", "Đến trang Tuần 2", "2週目のページへ", "Ke halaman Minggu 2")} →
              </Link>
            </div>
            <Link href="/career-launch/resume-preview" target="_blank" rel="noopener noreferrer" className="mt-2.5 block text-center text-[12.5px] font-bold text-[#0B46E8] underline">
              {t("완성된 이력서 전체 보기 · PDF ↗", "View & download full resume · PDF ↗", "查看完整简历 · PDF ↗", "Xem toàn bộ CV · PDF ↗", "完成した履歴書を全体表示 · PDF ↗", "Lihat resume lengkap · PDF ↗")}
            </Link>
            </div>
          ) : (
            <div className="mt-3">
              {messages.length > 0 && !loading ? (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {[
                    { label: t("잘 모르겠어요", "I'm not sure", "我不太清楚", "Tôi không chắc", "よく分かりません", "Saya kurang yakin"), send: "잘 모르겠어요" },
                    { label: t("예시를 보여주세요", "Show me an example", "给我看个例子", "Cho tôi xem ví dụ", "例を見せてください", "Tunjukkan contohnya"), send: "예시를 보여주세요" },
                    { label: t("다음으로 넘어갈래요", "Move to the next", "我想进入下一步", "Tôi muốn sang bước tiếp theo", "次に進みたいです", "Lanjut ke berikutnya") , send: "다음으로 넘어갈래요" }
                  ].map((q) => (
                    <button
                      key={q.send}
                      type="button"
                      onClick={() => send(q.send)}
                      className="rounded-full border border-[#D7DCE3] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8] hover:text-[#0B46E8]"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="flex items-end gap-2">
                <form
                  className="flex flex-1 items-end gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(input);
                  }}
                >
                  <textarea ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    rows={1}
                    placeholder={focus ? PLACEHOLDER[focus] : t("편하게 답해주세요", "Feel free to answer", "请随意回答", "Cứ thoải mái trả lời", "気軽に答えてください", "Jawab dengan santai")}
                    disabled={loading}
                    className="max-h-32 min-h-[46px] flex-1 resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:outline-none disabled:bg-[#F8FAFC]"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className={`h-[46px] shrink-0 rounded-xl px-4 text-[14px] font-bold transition ${
                      input.trim() && !loading ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"
                    }`}
                  >
                    {t("보내기", "Send", "发送", "Gửi", "送信", "Kirim")}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
