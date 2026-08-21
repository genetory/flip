"use client";
import { CaretLeft, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RichText } from "./rich-text";
import { STUDENT } from "../../lib/launch/data";
import { requestExperienceMining, type ExpMiningMsg } from "../../lib/launch/experience";
import { fetchProgress, patchProgress, type ExperienceEntry } from "../../lib/launch/progress-client";
import { CareerLaunchHeader } from "./CareerLaunchHeader";
import { AplyFooter } from "../AplyFooter";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLaunchT } from "../../lib/launch/i18n";

type Msg = { role: "bot" | "user"; text: string };

// 페이지·모달 공용. embedded=true 면 헤더·푸터 없이 모달 셸에 맞춰 렌더하고 닫기는 onClose.
export function ExperienceChat({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void }) {
  const t = useLaunchT();
  const { user, isReady } = useAuthSession();
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  const startedRef = useRef(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bank, setBank] = useState<ExperienceEntry[]>([]);
  const [savedFlash, setSavedFlash] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !loading) inputRef.current?.focus();
    prevLoadingRef.current = loading;
  }, [loading]);
  const endRef = useRef<HTMLDivElement>(null);

  const startChat = (greetOverride?: string) => {
    setSavedFlash(false);
    setMessages([]);
    setLoading(true);
    void (async () => {
      try {
        const { reply } = await requestExperienceMining([]);
        setMessages([{ role: "bot", text: reply || greetOverride || t(`${displayName}님, 반가워요 👋 대학생활 중 가장 많은 시간을 쏟은 활동을 하나 들려줄래요?`, `Hi ${displayName} 👋 Tell me about an activity you spent the most time on in school?`, `${displayName}，你好 👋 说说你大学期间投入时间最多的一项活动吧？`, `Chào ${displayName} 👋 Kể tôi nghe hoạt động bạn dành nhiều thời gian nhất thời sinh viên nhé?`, `${displayName}さん、こんにちは 👋 学生時代に一番時間をかけた活動を一つ教えてくれますか？`, `Hai ${displayName} 👋 Ceritakan satu kegiatan yang paling menyita waktumu saat kuliah?`) }]);
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
        const { experienceBank } = await fetchProgress();
        if (Array.isArray(experienceBank)) setBank(experienceBank);
      } catch {
        /* 무시 */
      }
      startChat();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  useEffect(() => {
    const _sc = endRef.current?.parentElement;
    if (_sc) _sc.scrollTo({ top: _sc.scrollHeight, behavior: "smooth" });
  }, [messages, loading, savedFlash]);

  const send = (raw: string) => {
    const a = raw.trim();
    if (!a || loading || savedFlash) return;
    setInput("");
    const nextMsgs: Msg[] = [...messages, { role: "user", text: a }];
    setMessages(nextMsgs);
    setLoading(true);
    void (async () => {
      try {
        const history: ExpMiningMsg[] = nextMsgs.map((m) => ({ role: m.role, text: m.text }));
        const { reply, done, experienceBank } = await requestExperienceMining(history);
        setMessages((m) => [...m, { role: "bot", text: reply }]);
        if (done) {
          if (Array.isArray(experienceBank)) setBank(experienceBank);
          setSavedFlash(true);
        }
      } catch (e) {
        const quota = e instanceof Error && /quota|402|포인트|ticket/i.test(e.message);
        setMessages((m) => [...m, { role: "bot", text: quota ? t("AI 포인트를 모두 사용했어요. 충전 후 다시 시도해 주세요.", "You've used all your AI points. Please recharge and try again.", "AI 积分已用完，请充值后再试。", "Bạn đã dùng hết điểm AI. Vui lòng nạp thêm và thử lại.", "AIポイントを使い切りました。チャージ後にもう一度お試しください。", "Poin AI habis. Silakan isi ulang lalu coba lagi.") : t("잠시 문제가 생겼어요 😥 다시 한 번 말해줄래요?", "Something went wrong 😥 Could you say that once more?", "出了点问题 😥 可以再说一次吗？", "Có chút trục trặc 😥 Bạn nói lại một lần nữa nhé?", "少し問題が発生しました 😥 もう一度言っていただけますか？", "Ada sedikit masalah 😥 Bisa ulangi sekali lagi?") }]);
      } finally {
        setLoading(false);
      }
    })();
  };

  const removeEntry = (id: string) => {
    const next = bank.filter((e) => e.id !== id);
    setBank(next);
    void patchProgress({ experienceBank: next }).catch(() => setBank(bank));
  };

  return (
    <div className={embedded ? "flex h-[100dvh] flex-col bg-white" : "flex min-h-screen flex-col bg-white"}>
      {embedded ? (
        <div className="flex items-center justify-between gap-3 border-b border-[#EEF1F5] px-5 py-3">
          <p className="text-[14px] font-black tracking-[-0.01em] text-[#191F28]">{t("내 경험 찾아보기", "Find my experiences", "发掘我的经验", "Tìm kinh nghiệm của tôi", "自分の経験を見つける", "Temukan pengalamanku")}</p>
          <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 items-center justify-center rounded-full text-[#4E5968] transition hover:bg-[#F6F8FB]"><X className="h-5 w-5" weight="bold" /></button>
        </div>
      ) : (
        <CareerLaunchHeader />
      )}
      <main className={embedded ? "flex-1 overflow-y-auto" : "flex-1 pb-16"}>
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          {embedded ? null : (
          <div className="flex items-center justify-between gap-3">
            <Link href="/career-launch/week/1" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
              <CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("1주차", "Week 1", "第1周", "Tuần 1", "1週目", "Minggu 1")}
            </Link>
            <Link href="/career-launch/week/1" className="rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">{t("종료하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</Link>
          </div>
          )}

          <div className="mt-3.5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{t("1주차 · 경험 채굴", "Week 1 · Experience Mining", "第1周 · 经验挖掘", "Tuần 1 · Khai thác kinh nghiệm", "Week 1 · 経験の発掘", "Minggu 1 · Penggalian Pengalaman")}</p>
            <h1 className="mt-1.5 break-keep text-[20px] font-black leading-[1.2] tracking-[-0.02em] text-[#191F28] md:text-[24px]">{t("내 경험 찾아보기", "Find my experiences", "发掘我的经验", "Tìm kinh nghiệm của tôi", "自分の経験を見つける", "Temukan pengalamanku")}</h1>
            <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{t("사소해 보여도 경험 하나하나에서 강점을 찾아 Experience Bank에 쌓아요. 이 경험은 이력서·자소서·면접에서 계속 쓰여요.", "Even small experiences hold strengths — we mine them into your Experience Bank, reused across your resume, cover letter, and interviews.", "即使看似微不足道，每段经验都藏着优势——我们把它整理进经验库，贯穿简历、自我介绍与面试。", "Dù nhỏ, mỗi kinh nghiệm đều có điểm mạnh — chúng tôi đưa vào Experience Bank, tái sử dụng cho CV, thư và phỏng vấn.", "小さな経験にも強みがあります。Experience Bankに蓄積し、履歴書・自己紹介書・面接で活用します。", "Sekecil apa pun, tiap pengalaman punya kelebihan — kami kumpulkan ke Experience Bank, dipakai di resume, surat, dan wawancara.")}</p>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* ── 좌: 채굴 대화 ── */}
            <div className="flex min-w-0 flex-col">
              <div className="h-[52vh] space-y-3 overflow-y-auto rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-4 lg:h-[58vh]">
                {messages.map((m, i) =>
                  m.role === "bot" ? (
                    <div key={i} className="flex items-end gap-2">
                      <span className="flex h-7 w-7 flex-none items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#E5E8EB]"><img src="/img_logo.webp" alt="Aply" className="h-full w-full object-contain p-1" /></span>
                      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28] shadow-[0_1px_2px_rgba(17,24,39,0.05)]">
                        <RichText text={m.text} />
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#0B46E8] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white"><RichText text={m.text} /></div>
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
              <p className="mt-2 text-center text-[11.5px] text-[#B0B8C1]">{t("💬 편하게 모국어로 답해도 돼요 · 💾 자동 저장", "💬 Feel free to answer in your own language · 💾 auto-saved", "💬 可以用你的母语回答 · 💾 自动保存", "💬 Bạn có thể trả lời bằng tiếng mẹ đẻ · 💾 tự động lưu", "💬 母国語で答えてOK · 💾 自動保存", "💬 Boleh menjawab dalam bahasa ibumu · 💾 tersimpan otomatis")}</p>

              {savedFlash ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#D8F3E3] bg-[#F1FBF5] px-4 py-3">
                  <span className="text-[13.5px] font-bold text-[#0A9B59]">✅ {t("경험을 저장했어요!", "Saved to your Experience Bank!", "已存入经验库！", "Đã lưu vào Experience Bank!", "Experience Bankに保存しました！", "Tersimpan di Experience Bank!")}</span>
                  <button type="button" onClick={() => startChat()} className="ml-auto rounded-lg bg-[#0B46E8] px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]">
                    {t("다른 경험 더 찾기", "Find another experience", "再找一段经验", "Tìm kinh nghiệm khác", "別の経験を探す", "Cari pengalaman lain")}
                  </button>
                </div>
              ) : (
                <div className="mt-5">
                  {messages.length > 0 && !loading ? (
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      {[
                        { label: t("아르바이트 경험", "Part-time job", "兼职经验", "Việc làm thêm", "アルバイト", "Kerja paruh waktu"), send: "아르바이트 경험을 이야기할게요." },
                        { label: t("동아리/팀 프로젝트", "Club / team project", "社团/团队项目", "CLB / dự án nhóm", "サークル・チーム", "Klub / proyek tim"), send: "동아리나 팀 프로젝트 경험을 이야기할게요." },
                        { label: t("잘 모르겠어요", "I'm not sure", "我不太清楚", "Tôi không chắc", "よく分かりません", "Saya kurang yakin"), send: "잘 모르겠어요" }
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
                  <form
                    className="flex items-end gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      send(input);
                    }}
                  >
                    <textarea
                      ref={inputRef}
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
                      className="max-h-32 min-h-[46px] flex-1 resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[16px] text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:outline-none disabled:bg-[#F8FAFC]"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || loading}
                      className={`h-[46px] shrink-0 rounded-xl px-4 text-[14px] font-bold transition ${input.trim() && !loading ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"}`}
                    >
                      {t("보내기", "Send", "发送", "Gửi", "送信", "Kirim")}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* ── 우: Experience Bank ── */}
            <div>
              <div className="lg:sticky lg:top-20">
                <p className="mb-2.5 flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">
                  Experience Bank <span className="rounded-full bg-[#EDF1FD] px-1.5 py-0.5 text-[10.5px] font-black text-[#0B46E8]">{bank.length}</span>
                </p>
                {bank.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-6 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F4F6] text-[22px]" aria-hidden>💎</span>
                    <p className="mt-3 text-[13.5px] font-bold text-[#191F28]">{t("정리한 경험이 여기 쌓여요", "Your mined experiences appear here", "整理好的经验会在这里", "Kinh nghiệm đã sắp xếp hiện ở đây", "整理した経験がここに", "Pengalaman tersusun muncul di sini")}</p>
                    <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{t("대화를 마치면 경험이 역할·성과·역량으로 구조화돼 저장돼요.", "When the chat ends, each experience is structured into role, results, and competencies.", "对话结束后，经验会按角色·成果·能力结构化保存。", "Khi trò chuyện xong, kinh nghiệm được cấu trúc theo vai trò, thành quả, năng lực.", "会話が終わると経験が役割・成果・力に構造化されて保存されます。", "Setelah obrolan selesai, pengalaman terstruktur jadi peran, hasil, kompetensi.")}</p>
                  </div>
                ) : (
                  <div className="flex max-h-[62vh] flex-col gap-3 overflow-y-auto">
                    {bank.map((e) => (
                      <div key={e.id} className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-bold text-[#191F28]">{e.experience}</p>
                            <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">{[e.role, e.period].filter(Boolean).join(" · ")}</p>
                          </div>
                          <button type="button" onClick={() => removeEntry(e.id)} aria-label={t("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")} className="shrink-0 rounded-lg p-1 text-[#C4CAD2] transition hover:bg-[#F6F8FB] hover:text-[#F04452]">
                            <X className="h-4 w-4" weight="bold" />
                          </button>
                        </div>
                        {e.results.length > 0 ? (
                          <ul className="mt-2 space-y-0.5">
                            {e.results.slice(0, 3).map((r, i) => (
                              <li key={i} className="break-keep text-[12.5px] leading-relaxed text-[#333D4B]">· {r}</li>
                            ))}
                          </ul>
                        ) : null}
                        {e.competencies.length > 0 ? (
                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {e.competencies.slice(0, 5).map((c, i) => (
                              <span key={i} className="rounded-full bg-[#EDF1FD] px-2 py-0.5 text-[11px] font-semibold text-[#0B46E8]">{c}</span>
                            ))}
                          </div>
                        ) : null}
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

