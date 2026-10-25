"use client";

// Week 1 강점 스토리 — 경험을 면접·자소서용 짧은 '강점 이야기'(상황·행동·결과 + 강점)로 만든다.
// 페이지·모달 공용. embedded=true 면 헤더·푸터 없이 모달 셸에 맞춰 렌더하고 닫기는 onClose.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CaretLeft, PaperPlaneRight } from "@phosphor-icons/react";
import { RichText } from "./rich-text";
import { STUDENT } from "../../lib/launch/data";
import { requestStrengthStory, type ExpMiningMsg } from "../../lib/launch/experience";
import { fetchProgress, type StrengthStory } from "../../lib/launch/progress-client";
import { CareerLaunchHeader } from "./CareerLaunchHeader";
import { AplyFooter } from "../AplyFooter";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLaunchT } from "../../lib/launch/i18n";

type Msg = { role: "bot" | "user"; text: string };

export function StrengthStoryChat({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void }) {
  const t = useLaunchT();
  const { user, isReady } = useAuthSession();
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stories, setStories] = useState<StrengthStory[]>([]);
  const [savedFlash, setSavedFlash] = useState(false);
  const [choices, setChoices] = useState<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !loading) inputRef.current?.focus();
    prevLoadingRef.current = loading;
  }, [loading]);

  const startChat = () => {
    setSavedFlash(false);
    setChoices([]);
    setMessages([]);
    setLoading(true);
    void (async () => {
      try {
        const { reply, choices: ch } = await requestStrengthStory([]);
        setChoices(ch);
        setMessages([{ role: "bot", text: reply || t(`${displayName}님, 반가워요 👋 정리한 경험 중 하나로 '강점이 드러난 이야기'를 같이 만들어볼까요? 없으면 강점이 나왔던 순간을 하나 떠올려봐요.`, `Hi ${displayName} 👋 Let's turn one of your experiences into a short story that shows a strength. No experience saved yet? Just recall a moment you showed a strength.`, `${displayName}，你好 👋 我们把你的一段经验变成一个能体现优势的小故事吧？还没有的话，就回想一个展现优势的瞬间。`, `Chào ${displayName} 👋 Cùng biến một kinh nghiệm thành câu chuyện ngắn thể hiện điểm mạnh nhé? Chưa có thì hãy nhớ một khoảnh khắc bạn thể hiện điểm mạnh.`, `${displayName}さん、こんにちは 👋 経験の一つを「強みが伝わる短い話」にしてみましょう。まだなければ、強みが出た瞬間を一つ思い出してみて。`, `Hai ${displayName} 👋 Yuk ubah satu pengalamanmu jadi cerita singkat yang menunjukkan kelebihan. Belum ada? Ingat satu momen kamu menunjukkan kelebihan.`) }]);
      } catch {
        setMessages([{ role: "bot", text: t("지금은 시작하기 어려워요 😥 잠시 후 다시 들어와줄래요?", "We can't start right now 😥 Could you come back in a moment?", "现在无法开始 😥 请稍后再进来好吗？", "Hiện chưa thể bắt đầu 😥 Bạn quay lại sau một lát nhé?", "今は開始できません 😥 少し経ってからもう一度来ていただけますか？", "Saat ini belum bisa memulai 😥 Bisa kembali lagi sebentar lagi?") }]);
      } finally {
        setLoading(false);
      }
    })();
  };

  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;
    void (async () => {
      try {
        const { strengthStories } = await fetchProgress();
        if (Array.isArray(strengthStories)) setStories(strengthStories);
      } catch {
        /* 무시 */
      }
      startChat();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [messages, loading, savedFlash]);

  // 적당한 지점에서 사용자가 직접 마무리 — 지금까지 내용으로 정리(결과 생성)를 요청한다.
  const finishNow = () => {
    if (loading || savedFlash) return;
    send(t("이제 충분해요. 더 묻지 말고, 지금까지 이야기한 내용만으로 강점 스토리를 정리해 주세요.", "That's enough. Please finalize the strength story with what we've discussed so far — no more questions.", "够了。请不要再提问，用目前聊到的内容整理出优势故事。", "Đủ rồi. Đừng hỏi thêm, hãy chốt câu chuyện điểm mạnh với những gì đã trao đổi.", "もう十分です。これ以上聞かず、今までの内容で強みストーリーをまとめてください。", "Sudah cukup. Tanpa bertanya lagi, rangkum cerita kelebihan dari yang sudah kita bahas."));
  };

  const send = (raw: string) => {
    const a = raw.trim();
    if (!a || loading || savedFlash) return;
    setInput("");
    setChoices([]);
    const nextMsgs: Msg[] = [...messages, { role: "user", text: a }];
    setMessages(nextMsgs);
    setLoading(true);
    void (async () => {
      try {
        const history: ExpMiningMsg[] = nextMsgs.map((m) => ({ role: m.role, text: m.text }));
        const { reply, done, strengthStories, choices: ch } = await requestStrengthStory(history);
        setChoices(done ? [] : ch);
        setMessages((m) => [...m, { role: "bot", text: reply }]);
        if (done) {
          if (Array.isArray(strengthStories)) setStories(strengthStories);
          setSavedFlash(true);
        }
      } catch (e) {
        const quota = e instanceof Error && /quota|402|포인트|ticket/i.test(e.message);
        setMessages((m) => [...m, { role: "bot", text: quota ? t("지금은 AI 사용이 많아요. 잠시 후 다시 시도해 주세요.", "AI is busy right now. Please try again in a moment.", "AI 当前繁忙，请稍后再试。", "AI đang bận. Vui lòng thử lại sau giây lát.", "現在AIの利用が集中しています。少し後にお試しください。", "AI sedang sibuk. Silakan coba lagi sesaat lagi.") : t("잠시 문제가 생겼어요 😥 다시 한 번 말해줄래요?", "Something went wrong 😥 Could you say that once more?", "出了点问题 😥 可以再说一次吗？", "Có chút trục trặc 😥 Bạn nói lại một lần nữa nhé?", "少し問題が発生しました 😥 もう一度言っていただけますか？", "Ada sedikit masalah 😥 Bisa ulangi sekali lagi?") }]);
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className={embedded ? "flex h-[100dvh] flex-col bg-white" : "flex min-h-screen flex-col bg-white"}>
      {embedded ? (
        <div className="border-b border-[color:var(--v2-line)]">
          <div className="mx-auto w-full max-w-5xl px-5 py-3">
            <button type="button" onClick={onClose} className="-ml-1.5 inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[13px] font-bold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-fill)]"><CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("뒤로", "Back", "返回", "Quay lại", "戻る", "Kembali")}</button>
            <p className="mt-1 text-[17px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{t("강점 스토리 만들기", "Build a strength story", "打造优势故事", "Tạo câu chuyện điểm mạnh", "強みストーリー作成", "Buat cerita kelebihan")}</p>
          </div>
        </div>
      ) : (
        <CareerLaunchHeader />
      )}
      <main className={embedded ? "flex-1 overflow-y-auto" : "flex-1 pb-16"}>
        <div className="mx-auto w-full max-w-5xl px-5 pb-28 pt-6 md:pb-40 md:pt-10">
          {embedded ? null : (
            <div className="flex items-center justify-between gap-3">
              <Link href="/career-launch/week/1" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--v2-faint)] transition hover:text-[color:var(--v2-ink)]">
                <CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("Step 1", "Step 1", "Step 1", "Step 1", "Step 1", "Step 1")}
              </Link>
              <Link href="/career-launch/week/1" className="rounded-xl bg-[color:var(--v2-band)] px-3 py-1.5 text-[12px] font-semibold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-line)]">{t("종료하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</Link>
            </div>
          )}

          <div className="mt-3.5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[color:var(--v2-accent)]">{t("Step 1 · 강점 스토리", "Step 1 · Strength Story", "Step 1 · 优势故事", "Step 1 · Câu chuyện điểm mạnh", "Step 1 · 強みストーリー", "Step 1 · Cerita Kelebihan")}</p>
            <h1 className="mt-1.5 break-keep text-[20px] font-bold leading-[1.2] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[24px]">{t("강점 스토리 만들기", "Build a Strength Story", "打造优势故事", "Tạo câu chuyện điểm mạnh", "強みストーリーを作る", "Buat Cerita Kelebihan")}</h1>
            <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-[color:var(--v2-faint)]">{t("경험 하나를 상황·행동·결과가 담긴 짧은 이야기로. 면접·자기소개서에서 그대로 써먹어요.", "Turn an experience into a short situation–action–result story — ready for interviews and cover letters.", "把一段经验变成含情境·行动·结果的小故事，面试和自我介绍直接可用。", "Biến một kinh nghiệm thành câu chuyện ngắn tình huống–hành động–kết quả, dùng ngay cho phỏng vấn và thư.", "経験を状況・行動・結果の短い話に。面接や自己紹介書でそのまま使えます。", "Ubah pengalaman jadi cerita singkat situasi–aksi–hasil, siap untuk wawancara dan surat.")} · ⏱ {t("약 10분", "About 10 min", "约 10 分钟", "Khoảng 10 phút", "約10分", "Sekitar 10 menit")}</p>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* ── 좌: 대화 ── */}
            <div className="flex min-w-0 flex-col">
              <div className="min-h-[42vh] space-y-4 rounded-3xl bg-white py-4 md:py-5">
                {messages.map((m, i) =>
                  m.role === "bot" ? (
                    <div key={i} className="flex items-end gap-2">
                      <span className="flex h-8 w-8 flex-none items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[color:var(--v2-line)]"><img src="/img_logo.webp" alt="Aply" className="h-full w-full object-contain p-1" /></span>
                      <div className="max-w-[84%] whitespace-pre-wrap break-keep rounded-[22px] rounded-bl-md bg-[color:var(--v2-band)] px-4 py-3 text-[15px] leading-relaxed text-[color:var(--v2-ink)]">
                        <RichText text={m.text} />
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[84%] whitespace-pre-wrap break-keep rounded-[22px] rounded-br-md bg-[color:var(--v2-accent)] px-4 py-3 text-[15px] leading-relaxed text-white"><RichText text={m.text} /></div>
                    </div>
                  )
                )}
                {loading ? (
                  <div className="flex items-end gap-2">
                    <span className="flex h-8 w-8 flex-none items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[color:var(--v2-line)]"><img src="/img_logo.webp" alt="Aply" className="h-full w-full object-contain p-1" /></span>
                    <div className="inline-flex items-center gap-1 rounded-[22px] rounded-bl-md bg-[color:var(--v2-band)] px-4 py-3.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--v2-faint)] [animation-delay:-0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--v2-faint)] [animation-delay:-0.1s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--v2-faint)]" />
                    </div>
                  </div>
                ) : null}
                {/* AI 선택형 질문의 보기 — 말풍선 아래에 탭 버튼으로 */}
                {choices.length > 0 && !loading ? (
                  <div className="flex flex-wrap gap-2 pl-10">
                    {choices.map((c) => (
                      <button key={c} type="button" onClick={() => send(c)} className="rounded-full bg-[color:var(--v2-accent-weak)] px-3.5 py-2 text-[13px] font-bold text-[color:var(--v2-accent)] transition hover:opacity-80">
                        {c}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div ref={endRef} />
              </div>
              <p className="mt-2 text-center text-[11.5px] text-[color:var(--v2-faint)]">{t("💬 편하게 모국어로 답해도 돼요 · 💾 자동 저장", "💬 Feel free to answer in your own language · 💾 auto-saved", "💬 可以用你的母语回答 · 💾 自动保存", "💬 Bạn có thể trả lời bằng tiếng mẹ đẻ · 💾 tự động lưu", "💬 母国語で答えてOK · 💾 自動保存", "💬 Boleh menjawab dalam bahasa ibumu · 💾 tersimpan otomatis")}</p>

              {savedFlash ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-[#F1FBF5] px-4 py-3">
                  <span className="text-[13.5px] font-bold text-[color:var(--v2-good)]">✅ {t("강점 스토리를 저장했어요!", "Strength story saved!", "优势故事已保存！", "Đã lưu câu chuyện điểm mạnh!", "強みストーリーを保存しました！", "Cerita kelebihan tersimpan!")}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {embedded ? (
                      <button type="button" onClick={() => onClose?.()} className="rounded-lg bg-[color:var(--v2-accent)] px-3.5 py-2 text-[13px] font-bold text-white transition hover:opacity-90">{t("나가기", "Done", "退出", "Thoát", "終了", "Keluar")}</button>
                    ) : (
                      <Link href="/career-launch/week/1" className="rounded-lg bg-[color:var(--v2-accent)] px-3.5 py-2 text-[13px] font-bold text-white transition hover:opacity-90">{t("나가기", "Done", "退出", "Thoát", "終了", "Keluar")}</Link>
                    )}
                    <button type="button" onClick={() => startChat()} className="rounded-xl bg-white px-3.5 py-2 text-[13px] font-bold text-[color:var(--v2-good)] transition hover:bg-[#F1FBF5]">{t("스토리 더 만들기", "Add another story", "再做一个故事", "Tạo thêm chuyện", "もう一つ作る", "Buat cerita lagi")}</button>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  {messages.length > 0 && !loading ? (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {[
                        { label: t("잘 모르겠어요", "I'm not sure", "我不太清楚", "Tôi không chắc", "よく分かりません", "Saya kurang yakin"), send: "잘 모르겠어요" },
                        { label: t("예시를 보여주세요", "Show me an example", "给我看个例子", "Cho tôi xem ví dụ", "例を見せてください", "Tunjukkan contohnya"), send: "예시를 보여주세요" }
                      ].map((q) => (
                        <button key={q.send} type="button" onClick={() => send(q.send)} className="rounded-full bg-[color:var(--v2-band)] px-4 py-2.5 text-[12.5px] font-semibold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-line)]">
                          {q.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <form
                    className="flex items-end gap-1.5 rounded-2xl bg-[color:var(--v2-band)] p-1.5 ring-[color:var(--v2-accent)] transition focus-within:bg-white focus-within:ring-2"
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
                      placeholder={t("편하게 답해주세요", "Feel free to answer", "请随意回答", "Cứ thoải mái trả lời", "気軽に答えてください", "Jawab dengan santai")}
                      disabled={loading}
                      className="max-h-32 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-3 py-3 text-[16px] leading-[1.35] text-[color:var(--v2-ink)] placeholder:text-[color:var(--v2-faint)] focus:outline-none focus:ring-0 disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || loading}
                      aria-label={t("보내기", "Send", "发送", "Gửi", "送信", "Kirim")}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${input.trim() && !loading ? "bg-[color:var(--v2-accent)] text-white hover:opacity-90" : "cursor-not-allowed bg-[color:var(--v2-band)] text-[color:var(--v2-faint)]"}`}
                    >
                      <PaperPlaneRight className="h-5 w-5" weight="fill" aria-hidden />
                    </button>
                  </form>
                  {messages.length > 1 && !loading ? (
                    <button type="button" onClick={finishNow} className="mt-2 w-full rounded-xl bg-[color:var(--v2-band)] px-4 py-2.5 text-[12.5px] font-bold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-line)]">
                      {t("이 정도면 충분해요 · 정리하고 마치기", "That's enough · wrap up now", "够了 · 整理并结束", "Đủ rồi · chốt lại", "十分です · まとめて終了", "Cukup · rangkum & selesai")}
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            {/* ── 우: 만든 강점 스토리 ── */}
            <div>
              <div className="lg:sticky lg:top-20">
                <p className="mb-2.5 flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-[color:var(--v2-faint)]">
                  {t("내 강점 스토리", "My strength stories", "我的优势故事", "Câu chuyện điểm mạnh", "私の強みストーリー", "Cerita kelebihanku")} <span className="rounded-full bg-[color:var(--v2-accent-weak)] px-1.5 py-0.5 text-[10.5px] font-bold text-[color:var(--v2-accent)]">{stories.length}</span>
                </p>
                {stories.length === 0 ? (
                  <div className="rounded-3xl bg-[color:var(--v2-band)] p-6 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--v2-band)] text-[22px]" aria-hidden>✨</span>
                    <p className="mt-3 text-[13.5px] font-bold text-[color:var(--v2-ink)]">{t("만든 스토리가 여기 쌓여요", "Your stories appear here", "做好的故事会在这里", "Câu chuyện đã tạo hiện ở đây", "作った話がここに", "Cerita yang dibuat muncul di sini")}</p>
                    <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-[color:var(--v2-faint)]">{t("대화를 마치면 상황·행동·결과와 강점으로 정리돼 저장돼요.", "When the chat ends, each story is saved as situation, action, result, and strength.", "对话结束后，会按情境·行动·结果与优势整理保存。", "Khi trò chuyện xong, chuyện được lưu theo tình huống, hành động, kết quả và điểm mạnh.", "会話が終わると状況・行動・結果と強みで整理されて保存されます。", "Setelah obrolan selesai, cerita disimpan sebagai situasi, aksi, hasil, dan kelebihan.")}</p>
                  </div>
                ) : (
                  <div className="flex max-h-[62vh] flex-col gap-3 overflow-y-auto">
                    {stories.map((s) => (
                      <div key={s.id} className="rounded-3xl bg-[color:var(--v2-band)] p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 break-keep text-[14px] font-bold text-[color:var(--v2-ink)]">{s.title}</p>
                          {s.strength ? <span className="shrink-0 rounded-full bg-[color:var(--v2-accent-weak)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--v2-accent)]">{s.strength}</span> : null}
                        </div>
                        {s.result ? <p className="mt-2 break-keep text-[12.5px] leading-relaxed text-[color:var(--v2-ink-2)]">→ {s.result}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      {embedded ? null : <AplyFooter />}
    </div>
  );
}
