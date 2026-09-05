"use client";

// Week 4 공고별 모의면접 — 특정 채용공고(JD·요구역량)를 기준으로 직무 면접을 진행한다.
// 화면은 공용 InterviewChatShell 로 통일(다른 면접과 동일). 공고를 바꿔가며 무제한 반복 연습.
import { useEffect, useRef, useState } from "react";
import { STUDENT } from "../../lib/launch/data";
import { requestInterviewChat, type InterviewChatMsg, type InterviewJobPosting, type InterviewReport } from "../../lib/launch/interview";
import { InterviewChatShell, type InterviewShellMsg } from "./InterviewChatShell";
import { fetchProgress, patchProgress } from "../../lib/launch/progress-client";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { trackCareerFunnel } from "../../lib/analytics";
import { useLaunchT } from "../../lib/launch/i18n";

export function PostingInterviewChat({ posting, embedded = false, onClose }: { posting: InterviewJobPosting; embedded?: boolean; onClose?: () => void }) {
  const t = useLaunchT();
  const { user, isReady } = useAuthSession();
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;
  const startedRef = useRef(false);
  const [messages, setMessages] = useState<InterviewShellMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [report, setReport] = useState<InterviewReport | null>(null);
  // 대화 저장(누적 기록)용 — 최신 messages 참조 + 중복 저장 방지.
  const messagesRef = useRef<InterviewShellMsg[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const savedRef = useRef(false);

  // 이 면접의 질문·답변을 progress.state.postingInterviews 에 누적 저장(최근 30개).
  const saveLog = async (rep: InterviewReport | null) => {
    if (savedRef.current) return;
    const msgs = messagesRef.current;
    if (!msgs.some((m) => m.role === "user")) return; // 답변이 하나도 없으면 저장 안 함
    savedRef.current = true;
    const entry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      company: posting.company,
      title: posting.title,
      at: new Date().toISOString(),
      messages: msgs.map((m) => ({ role: m.role, text: m.text })),
      report: rep
    };
    try {
      const prog = await fetchProgress();
      const prev = Array.isArray(prog.postingInterviews) ? prog.postingInterviews : [];
      await patchProgress({ postingInterviews: [entry, ...prev].slice(0, 30) });
    } catch {
      savedRef.current = false; // 실패 시 다음 종료에서 재시도
    }
  };
  const handleClose = () => {
    void saveLog(report);
    onClose?.();
  };

  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    trackCareerFunnel("career_posting_interview_started");
    void (async () => {
      try {
        const { reply } = await requestInterviewChat([], "job", posting);
        setMessages([{ role: "bot", text: reply || t(`${displayName}님, 이 공고로 면접을 시작해볼까요? 그럼 먼저 간단히 자기소개 부탁드립니다.`, `${displayName}, shall we start the interview for this posting? First, a brief self-introduction please.`, `${displayName}，我们就这个公告开始面试吧？先请简单自我介绍。`, `${displayName}, bắt đầu phỏng vấn cho tin này nhé? Trước hết, hãy giới thiệu ngắn gọn.`, `${displayName}さん、この求人で面接を始めましょうか？まず簡単に自己紹介をお願いします。`, `${displayName}, mulai wawancara untuk lowongan ini ya? Perkenalkan diri singkat dulu.`) }]);
      } catch {
        setMessages([{ role: "bot", text: t("지금은 면접을 시작하기 어려워요 😥 잠시 후 다시 시도해줄래요?", "We can't start the interview right now 😥 Please try again shortly.", "现在无法开始面试 😥 请稍后再试。", "Hiện chưa thể bắt đầu phỏng vấn 😥 Thử lại sau nhé.", "今は面接を開始できません 😥 少し後にお試しください。", "Saat ini belum bisa memulai 😥 Coba lagi sebentar lagi.") }]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const send = (raw: string) => {
    const a = raw.trim();
    if (!a || loading || done) return;
    const nextMsgs: InterviewShellMsg[] = [...messages, { role: "user", text: a }];
    setMessages(nextMsgs);
    setLoading(true);
    void (async () => {
      try {
        const history: InterviewChatMsg[] = nextMsgs.map((m) => ({ role: m.role, text: m.text }));
        const { reply, done: isDone, report: rep } = await requestInterviewChat(history, "job", posting);
        setMessages((m) => [...m, { role: "bot", text: reply }]);
        if (isDone) {
          trackCareerFunnel("career_posting_interview_completed");
          setDone(true);
          setReport(rep);
          void saveLog(rep);
        }
      } catch (e) {
        const quota = e instanceof Error && /quota|402|포인트|ticket/i.test(e.message);
        setMessages((m) => [...m, { role: "bot", text: quota ? t("지금은 AI 사용이 많아요. 잠시 후 다시 시도해 주세요.", "AI is busy right now. Please try again in a moment.", "AI 当前繁忙，请稍后再试。", "AI đang bận. Vui lòng thử lại sau giây lát.", "現在AIの利用が集中しています。少し後にお試しください。", "AI sedang sibuk. Silakan coba lagi sesaat lagi.") : t("잠시 문제가 생겼어요 😥 다시 한 번 말해줄래요?", "Something went wrong 😥 Could you say that once more?", "出了点问题 😥 可以再说一次吗？", "Có chút trục trặc 😥 Bạn nói lại một lần nữa nhé?", "少し問題が発生しました 😥 もう一度言っていただけますか？", "Ada sedikit masalah 😥 Bisa ulangi sekali lagi?") }]);
      } finally {
        setLoading(false);
      }
    })();
  };

  const label = [posting.company, posting.title].filter(Boolean).join(" · ") || t("붙여넣은 공고", "Pasted posting", "粘贴的公告", "Tin đã dán", "貼付した求人", "Lowongan ditempel");

  const completion = (
    <div className="flex flex-col gap-3">
      {report && (report.strengths.length > 0 || report.improvements.length > 0 || report.modelAnswer) ? (
        <div className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0B46E8]">{t("이 공고 면접 준비도 리포트", "Readiness report for this posting", "本公告面试准备度报告", "Báo cáo sẵn sàng cho tin này", "この求人の準備度レポート", "Laporan kesiapan lowongan ini")}</p>
          {report.strengths.length > 0 ? (
            <div className="mt-3">
              <p className="text-[12.5px] font-bold text-[#0A9B59]">💪 {t("잘한 점", "Strengths", "做得好", "Điểm mạnh", "良かった点", "Kelebihan")}</p>
              <ul className="mt-1 space-y-1">{report.strengths.map((s, i) => <li key={i} className="break-keep text-[13px] leading-relaxed text-[#333D4B]">· {s}</li>)}</ul>
            </div>
          ) : null}
          {report.improvements.length > 0 ? (
            <div className="mt-3">
              <p className="text-[12.5px] font-bold text-[#C77700]">✏️ {t("더 다듬을 점", "To improve", "可改进", "Cần cải thiện", "改善点", "Perlu diperbaiki")}</p>
              <ul className="mt-1 space-y-1">{report.improvements.map((s, i) => <li key={i} className="break-keep text-[13px] leading-relaxed text-[#333D4B]">· {s}</li>)}</ul>
            </div>
          ) : null}
          {report.modelAnswer ? (
            <div className="mt-3 rounded-xl bg-[#F8FAFF] p-3">
              <p className="text-[12.5px] font-bold text-[#0B46E8]">🧭 {t("모범 답변 방향", "Model answer direction", "范例答案方向", "Hướng trả lời mẫu", "模範解答の方向", "Arah jawaban contoh")}</p>
              <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#333D4B]">{report.modelAnswer}</p>
            </div>
          ) : null}
        </div>
      ) : null}
      <button type="button" onClick={handleClose} className="flex h-[46px] items-center justify-center rounded-xl bg-[#191F28] px-4 text-[13.5px] font-bold text-white transition hover:bg-[#0B1227]">
        {t("다른 공고로 연습하기", "Practice another posting", "换个公告练习", "Luyện tin khác", "別の求人で練習", "Latih lowongan lain")}
      </button>
    </div>
  );

  return (
    <InterviewChatShell
      embedded={embedded}
      onClose={handleClose}
      backHref="/career-launch/week/4"
      weekLabel={t("4주차", "Week 4", "第4周", "Tuần 4", "4週目", "Minggu 4")}
      embeddedTitle={t("공고별 모의면접", "Posting mock interview", "公告模拟面试", "Phỏng vấn theo tin", "求人別模擬面接", "Wawancara per lowongan")}
      eyebrow={t("4주차 · 공고별 모의면접", "Week 4 · Posting mock interview", "第4周 · 公告模拟面试", "Tuần 4 · Phỏng vấn theo tin", "Week 4 · 求人別模擬面接", "Minggu 4 · Wawancara per lowongan")}
      title={label}
      sub={t("이 공고의 요구역량 기준으로 실무 면접을 봐요", "A practical interview based on this posting's requirements", "以本公告的要求进行实务面试", "Phỏng vấn thực tế theo yêu cầu của tin này", "この求人の要件を基準に実務面接", "Wawancara praktis sesuai syarat lowongan ini")}
      messages={messages}
      loading={loading}
      note={t("💬 편하게 모국어로 답해도 돼요 · 💾 자동 저장", "💬 Feel free to answer in your own language · 💾 auto-saved", "💬 可以用你的母语回答 · 💾 自动保存", "💬 Bạn có thể trả lời bằng tiếng mẹ đẻ · 💾 tự động lưu", "💬 母国語で答えてOK · 💾 自動保存", "💬 Boleh menjawab dalam bahasa ibumu · 💾 tersimpan otomatis")}
      placeholder={t("면접관의 질문에 답해보세요", "Answer the interviewer's question", "请回答面试官的问题", "Hãy trả lời câu hỏi của người phỏng vấn", "面接官の質問に答えてみましょう", "Jawab pertanyaan pewawancara")}
      quickReplies={[
        { label: t("모범 답변 보기", "See a model answer", "查看范例答案", "Xem câu trả lời mẫu", "模範解答を見る", "Lihat jawaban contoh"), value: "모범 답변 보기" },
        { label: t("잘 모르겠어요", "I'm not sure", "我不太清楚", "Tôi không chắc", "よく分かりません", "Saya kurang yakin"), value: "잘 모르겠어요" },
        { label: t("다시 답해볼게요", "Let me answer again", "我再回答一次", "Tôi trả lời lại", "もう一度答えてみます", "Saya jawab lagi"), value: "다시 답해볼게요" }
      ]}
      finished={done}
      completion={completion}
      onSend={send}
    />
  );
}
