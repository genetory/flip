"use client";
import { CaretLeft } from "@phosphor-icons/react";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RichText } from "../../../components/launch/rich-text";
import { RECOMMENDED_JOBS, STUDENT, type RecommendedJob } from "../../../lib/launch/data";
import { requestJobChat, type JobChatMsg } from "../../../lib/launch/job-chat-client";
import { fetchProgress, patchProgress } from "../../../lib/launch/progress-client";
import { trackCareerStepComplete } from "../../../lib/analytics";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../components/AplyFooter";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../lib/launch/i18n";
import { useJobReason, useJobName, useJobSkills } from "../../../lib/launch/data-i18n";

// Week 1 — AI와 실제로 대화하며 관심 직무를 이끌어낸다. 백엔드(/career-launch/job-chat)가
// 대화를 이어받아 다음 질문 + 후보 풀에서 고른 추천 직무를 돌려주고, 채팅 안에서 바로
// 골라 마음에 드는 3개가 나올 때까지 대화한다. 선정 직무는 백엔드(progress)에 저장.
const MAX_PICK = 3;

type Msg =
  | { role: "bot" | "user"; kind: "text"; text: string }
  | { role: "bot"; kind: "jobs"; jobs: RecommendedJob[] };

export default function LaunchJobsPage() {
  const t = useLaunchT();
  const jobReason = useJobReason();
  const jobName = useJobName();
  const jobSkills = useJobSkills();
  const { user, isReady } = useAuthSession();
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  const startedRef = useRef(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [shownRoles, setShownRoles] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // 전송 완료(loading true→false) 시 입력창 포커스를 되돌려, 채팅 중 포커스가 풀리지 않게 한다.
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !loading) inputRef.current?.focus();
    prevLoadingRef.current = loading;
  }, [loading]);
  const [saved, setSaved] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState("");

  const endRef = useRef<HTMLDivElement>(null);

  const rolesToJobs = (roles: string[]): RecommendedJob[] =>
    roles.map((r) => RECOMMENDED_JOBS.find((j) => j.role === r)).filter((j): j is RecommendedJob => Boolean(j));

  const appendFromAi = (reply: string, recommend: string[]) => {
    setMessages((m) => {
      const add: Msg[] = [];
      if (reply) add.push({ role: "bot", kind: "text", text: reply });
      const jobs = rolesToJobs(recommend);
      if (jobs.length) add.push({ role: "bot", kind: "jobs", jobs });
      return [...m, ...add];
    });
    if (recommend.length) setShownRoles((prev) => Array.from(new Set([...prev, ...recommend])));
  };

  // 진입 — 세션 로딩 후 1회. AI에게 첫 인사·질문을 요청한다. ?restart=1 이면 선택 초기화.
  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;
    const restart = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("restart") === "1";
    setLoading(true);
    void (async () => {
      let sel: string[] = [];
      if (!restart) {
        try {
          const { selectedJobs } = await fetchProgress();
          if (Array.isArray(selectedJobs)) sel = selectedJobs;
        } catch {
          // 무시
        }
      }
      setSelected(sel);
      try {
        const { reply, recommend } = await requestJobChat([], sel);
        appendFromAi(reply || t(`${displayName}님, 반가워요 👋 어떤 일에 관심이 있는지 편하게 이야기해줄래요?`, `Hi ${displayName} 👋 Tell me freely what kind of work interests you?`, `${displayName}，你好 👋 可以随意告诉我你对什么样的工作感兴趣吗？`, `Chào ${displayName} 👋 Hãy thoải mái chia sẻ bạn quan tâm đến công việc nào nhé?`, `${displayName}さん、こんにちは 👋 どんな仕事に興味があるか気軽に教えてくれますか？`, `Hai ${displayName} 👋 Ceritakan dengan santai pekerjaan seperti apa yang kamu minati?`), recommend);
      } catch {
        setMessages([{ role: "bot", kind: "text", text: t("지금은 대화를 시작하기 어려워요 😥 잠시 후 다시 들어와줄래요?", "We can't start the chat right now 😥 Could you come back in a moment?", "现在无法开始对话 😥 请稍后再进来好吗？", "Hiện chưa thể bắt đầu trò chuyện 😥 Bạn quay lại sau một lát nhé?", "今は会話を開始できません 😥 少し経ってからもう一度来ていただけますか？", "Saat ini belum bisa memulai obrolan 😥 Bisa kembali lagi sebentar lagi?") }]);
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
    if (!a || loading) return;
    setInput("");
    const nextMsgs: Msg[] = [...messages, { role: "user", kind: "text", text: a }];
    setMessages(nextMsgs);
    setLoading(true);
    void (async () => {
      try {
        const history: JobChatMsg[] = nextMsgs
          .filter((m): m is Extract<Msg, { kind: "text" }> => m.kind === "text")
          .map((m) => ({ role: m.role, text: m.text }));
        const { reply, recommend } = await requestJobChat(history, selected, shownRoles);
        appendFromAi(reply, recommend);
      } catch (e) {
        const quota = e instanceof Error && /quota|402|포인트|ticket/i.test(e.message);
        setMessages((m) => [...m, { role: "bot", kind: "text", text: quota ? t("AI 포인트를 모두 사용했어요. 충전 후 다시 시도해 주세요.", "You've used all your AI points. Please recharge and try again.", "AI 积分已用完，请充值后再试。", "Bạn đã dùng hết điểm AI. Vui lòng nạp thêm và thử lại.", "AIポイントを使い切りました。チャージ後にもう一度お試しください。", "Poin AI habis. Silakan isi ulang lalu coba lagi.") : t("잠시 문제가 생겼어요 😥 다시 한 번 말해줄래요?", "Something went wrong 😥 Could you say that once more?", "出了点问题 😥 可以再说一次吗？", "Có chút trục trặc 😥 Bạn nói lại một lần nữa nhé?", "少し問題が発生しました 😥 もう一度言っていただけますか？", "Ada sedikit masalah 😥 Bisa ulangi sekali lagi?") }]);
      } finally {
        setLoading(false);
      }
    })();
  };

  const toggleJob = (role: string) => {
    setSaved(false);
    const has = selected.includes(role);
    if (!has && selected.length >= MAX_PICK) return;
    const next = has ? selected.filter((x) => x !== role) : [...selected, role];
    setSelected(next);
    if (!has && next.length === MAX_PICK) {
      setMessages((m) => [
        ...m,
        { role: "bot", kind: "text", text: t("좋아요! 마음에 드는 3개를 골랐어요 🎉 아래 ‘선정 완료’를 누르면 저장돼요.", "Great! You've picked your 3 favorites 🎉 Press 'Confirm selection' below to save.", "太好了！你已经选好了 3 个心仪的 🎉 点击下方的‘完成选择’即可保存。", "Tuyệt! Bạn đã chọn 3 công việc yêu thích 🎉 Nhấn 'Hoàn tất chọn' bên dưới để lưu.", "いいですね！お気に入りの3つを選びました 🎉 下の「選定完了」を押すと保存されます。", "Bagus! Kamu sudah memilih 3 favorit 🎉 Tekan 'Selesai memilih' di bawah untuk menyimpan.") }
      ]);
    }
  };

  // 추천에 마음에 드는 게 없을 때 — 직접 입력해 선택에 추가.
  const addCustom = () => {
    const r = custom.trim();
    if (!r || selected.includes(r) || selected.length >= MAX_PICK) return;
    setSaved(false);
    setSelected((prev) => [...prev, r]);
    setCustom("");
    setCustomOpen(false);
    setMessages((m) => [...m, { role: "bot", kind: "text", text: t(`‘${r}’를 관심 직무에 추가했어요 👍`, `Added '${r}' to your jobs of interest 👍`, `已将‘${r}’加入你的兴趣职务 👍`, `Đã thêm '${r}' vào công việc quan tâm 👍`, `「${r}」を関心のある職務に追加しました 👍`, `'${r}' ditambahkan ke pekerjaan yang kamu minati 👍`) }]);
  };

  const save = () => {
    void patchProgress({ selectedJobs: selected }).catch(() => {
      // 저장 실패해도 화면 상태 유지
    });
    trackCareerStepComplete("jobs");
    setSaved(true);
    setMessages((m) => [
      ...m,
      { role: "bot", kind: "text", text: t("선정 완료! 🙌 대시보드에 저장했어요. 다음 주엔 이 방향으로 이력서를 만들어봐요. 혹시 다시 골라보고 싶으면 아래에서 처음부터 다시 할 수 있어요.", "All set! 🙌 Saved to your dashboard. Next week let's build your resume in this direction. If you'd like to pick again, you can start over below.", "选择完成！🙌 已保存到仪表盘。下周就朝这个方向来做简历吧。如果想重新选择，可以在下方从头再来。", "Xong rồi! 🙌 Đã lưu vào bảng điều khiển. Tuần sau hãy làm CV theo hướng này nhé. Nếu muốn chọn lại, bạn có thể bắt đầu lại bên dưới.", "選定完了！🙌 ダッシュボードに保存しました。来週はこの方向で履歴書を作ってみましょう。もう一度選び直したい場合は、下から最初からやり直せます。", "Selesai! 🙌 Tersimpan di dasbormu. Minggu depan mari buat resume ke arah ini. Kalau mau memilih ulang, kamu bisa mulai lagi dari bawah.") }
    ]);
  };

  // 처음부터 다시 대화(선정 초기화 후 새 대화 시작).
  const restartChat = () => {
    setSaved(false);
    setSelected([]);
    setShownRoles([]);
    setInput("");
    setMessages([]);
    setLoading(true);
    void (async () => {
      try {
        const { reply, recommend } = await requestJobChat([], []);
        appendFromAi(reply || t(`${displayName}님, 다시 이야기 나눠볼까요? 어떤 일에 관심이 있는지 편하게 들려주세요 👋`, `Shall we chat again, ${displayName}? Tell me freely what kind of work interests you 👋`, `${displayName}，我们再聊聊吧？可以随意告诉我你对什么样的工作感兴趣 👋`, `Cùng trò chuyện lại nhé ${displayName}? Hãy thoải mái chia sẻ bạn quan tâm đến công việc nào 👋`, `${displayName}さん、もう一度話しましょうか？どんな仕事に興味があるか気軽に教えてください 👋`, `Yuk ngobrol lagi, ${displayName}? Ceritakan dengan santai pekerjaan seperti apa yang kamu minati 👋`), recommend);
      } catch {
        setMessages([{ role: "bot", kind: "text", text: t("지금은 대화를 시작하기 어려워요 😥 잠시 후 다시 들어와줄래요?", "We can't start the chat right now 😥 Could you come back in a moment?", "现在无法开始对话 😥 请稍后再进来好吗？", "Hiện chưa thể bắt đầu trò chuyện 😥 Bạn quay lại sau một lát nhé?", "今は会話を開始できません 😥 少し経ってからもう一度来ていただけますか？", "Saat ini belum bisa memulai obrolan 😥 Bisa kembali lagi sebentar lagi?") }]);
      } finally {
        setLoading(false);
      }
    })();
  };

  // 마지막 추천 묶음 인덱스 — 그 아래에만 '다른 직무 보기 / 직접 입력'을 붙인다.
  const lastJobsIdx = messages.reduce((acc, m, i) => (m.kind === "jobs" ? i : acc), -1);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CareerLaunchHeader />
      <main className="flex-1">
        <div className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-5xl flex-col px-5 pb-4 pt-4 md:pt-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between gap-3">
            <Link href="/career-launch/week/1" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
              <CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("1주차", "Week 1", "第1周", "Tuần 1", "1週目", "Minggu 1")}
            </Link>
            <Link href="/career-launch/week/1" className="rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">{t("종료하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</Link>
            <div className="flex items-center gap-2.5">
              <span className="text-[12px] font-bold text-[#0B46E8]">{selected.length}/{MAX_PICK} {t("선택", "selected", "已选", "đã chọn", "選択", "dipilih")}</span>
              {!saved ? (
                <button
                  type="button"
                  onClick={() => send("이 부분은 넘어가고 다음으로 진행해줘.")}
                  disabled={loading}
                  className="rounded-full border border-[#D7DCE3] bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8] hover:text-[#0B46E8] disabled:opacity-40"
                >
                  {t("넘어가기", "Skip", "跳过", "Bỏ qua", "スキップ", "Lewati")} ⏭
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-3.5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{t("1주차 · 관심 직무", "Week 1 · Jobs", "第1周 · 职务", "Tuần 1 · Công việc", "Week 1 · 職務", "Minggu 1 · Pekerjaan")}</p>
            <h1 className="mt-1.5 break-keep text-[20px] font-black leading-[1.2] tracking-[-0.02em] text-[#191F28] md:text-[24px]">{t("관심 직무 찾기", "Find Your Jobs of Interest", "寻找感兴趣的职务", "Tìm công việc bạn quan tâm", "興味のある職務を探す", "Temukan Pekerjaan yang Kamu Minati")}</h1>
            <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{t(`AI와 대화하며 마음에 드는 직무 ${MAX_PICK}개를 골라요`, `Chat with AI and pick your ${MAX_PICK} favorite jobs`, `与 AI 对话，挑选 ${MAX_PICK} 个你喜欢的职务`, `Trò chuyện với AI và chọn ${MAX_PICK} công việc bạn thích`, `AIと話しながらお気に入りの職務を${MAX_PICK}つ選びます`, `Mengobrol dengan AI dan pilih ${MAX_PICK} pekerjaan favoritmu`)} · ⏱ {t("약 10분", "About 10 min", "约 10 分钟", "Khoảng 10 phút", "約10分", "Sekitar 10 menit")}</p>
          </div>

          {/* 대화 */}
          <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[#EEF1F5] bg-[#F8FAFC] p-4">
            {messages.map((m, i) => {
              if (m.kind === "text") {
                return m.role === "bot" ? (
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
                );
              }
              // 추천 직무 묶음(채팅 안에서 바로 선택)
              return (
                <div key={i} className="flex items-start gap-2">
                  <span className="flex h-7 w-7 flex-none items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#E5E8EB]"><img src="/img_logo.webp" alt="Aply" className="h-full w-full object-contain p-1" /></span>
                  <div className="grid w-full max-w-[88%] gap-2">
                    {m.jobs.map((job) => {
                      const isSel = selected.includes(job.role);
                      const disabled = !isSel && selected.length >= MAX_PICK;
                      return (
                        <button
                          key={job.id}
                          type="button"
                          onClick={disabled ? undefined : () => toggleJob(job.role)}
                          className={`rounded-2xl border bg-white p-3.5 text-left transition ${
                            isSel ? "border-[#0B46E8] ring-1 ring-[#0B46E8]/30" : disabled ? "border-[#EEF1F5] opacity-55" : "border-[#EEF1F5] hover:border-[#0B46E8]/40"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 text-[11px] font-black ${
                                isSel ? "border-[#0B46E8] bg-[#0B46E8] text-white" : "border-[#C9CDD2] text-transparent"
                              }`}
                            >
                              ✓
                            </span>
                            <p className="text-[14.5px] font-bold text-[#191F28]">{jobName(job.role)}</p>
                          </div>
                          <p className="mt-1.5 pl-7 text-[12.5px] leading-relaxed text-[#4E5968]">{jobReason(job.id)}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5 pl-7">
                            {jobSkills(job.skills).map((s) => (
                              <span key={s} className="rounded-full bg-[#F2F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#4E5968]">
                                {s}
                              </span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                    {/* 추천이 마음에 안 들 때 — 리스트 바로 아래(채팅 안) */}
                    {i === lastJobsIdx && !saved ? (
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => send("추천해준 것 말고 다른 직무도 보고 싶어요")}
                          disabled={loading}
                          className="rounded-full border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8] disabled:opacity-50"
                        >
                          🔄 {t("다른 직무 보기", "See other jobs", "查看其他职务", "Xem công việc khác", "他の職務を見る", "Lihat pekerjaan lain")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomOpen((o) => !o)}
                          disabled={selected.length >= MAX_PICK}
                          className="rounded-full border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8] disabled:opacity-50"
                        >
                          ✏️ {t("직접 입력", "Enter manually", "手动输入", "Nhập trực tiếp", "自分で入力", "Masukkan sendiri")}
                        </button>
                        {customOpen ? (
                          <span className="inline-flex items-center gap-1.5">
                            <input
                              value={custom}
                              onChange={(e) => setCustom(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                                  e.preventDefault();
                                  addCustom();
                                }
                              }}
                              autoFocus
                              placeholder={t("예: UX 리서처", "e.g. UX Researcher", "例：UX 研究员", "VD: UX Researcher", "例：UXリサーチャー", "cth: UX Researcher")}
                              className="h-8 w-40 rounded-full border border-[#E5E8EB] bg-white px-3 text-[12px] text-[#191F28] placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={addCustom}
                              disabled={!custom.trim()}
                              className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${custom.trim() ? "bg-[#0B46E8] text-white" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"}`}
                            >
                              {t("추가", "Add", "添加", "Thêm", "追加", "Tambah")}
                            </button>
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
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
          <p className="mt-2 text-center text-[11.5px] text-[#B0B8C1]">{t("💬 편하게 모국어로 답해도 돼요 · 💾 자동 저장 · ⚡ 메시지당 AI 포인트 1개 소모", "💬 Feel free to answer in your own language · 💾 auto-saved · ⚡ 1 AI point per message", "💬 可以用你的母语回答 · 💾 自动保存 · ⚡ 每条消息消耗1个AI积分", "💬 Bạn có thể trả lời bằng tiếng mẹ đẻ · 💾 tự động lưu · ⚡ 1 điểm AI mỗi tin nhắn", "💬 母国語で答えてOK · 💾 自動保存 · ⚡ メッセージごとにAIポイント1", "💬 Boleh menjawab dalam bahasa ibumu · 💾 tersimpan otomatis · ⚡ 1 poin AI per pesan")}</p>

          {/* 저장 후엔 대화 종료 — 다시 선정 or 대시보드. 아니면 입력 + 선정 완료 */}
          {saved ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={restartChat}
                className="flex h-[46px] items-center justify-center rounded-xl border border-[#D7DCE3] bg-white px-4 text-[13.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40"
              >
                {t("처음부터 다시 선정", "Select again from scratch", "从头重新选择", "Chọn lại từ đầu", "最初から選び直す", "Pilih ulang dari awal")}
              </button>
            </div>
          ) : (
            <div className="mt-3">
              {/* 할 말이 없어 막힐 때를 위한 빠른 응답 — 대화가 끊기지 않게 */}
              {messages.length > 0 && !loading ? (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {[
                    { label: t("잘 모르겠어요", "I'm not sure", "我不太清楚", "Tôi không chắc", "よく分かりません", "Saya kurang yakin"), send: "잘 모르겠어요" },
                    { label: t("예시를 보여주세요", "Show me an example", "给我看个例子", "Cho tôi xem ví dụ", "例を見せてください", "Tunjukkan contohnya"), send: "예시를 보여주세요" },
                    { label: t("직무 추천해주세요", "Recommend jobs for me", "给我推荐职务", "Gợi ý công việc cho tôi", "職務を推薦してください", "Rekomendasikan pekerjaan") , send: "직무 추천해주세요" }
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
                    // 한글 IME 조합 중 Enter 는 무시(마지막 글자 중복 방지)
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  rows={1}
                  placeholder={t("편하게 답해주세요", "Feel free to answer", "请随意回答", "Cứ thoải mái trả lời", "気軽に答えてください", "Jawab dengan santai")}
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
              {selected.length > 0 ? (
                <button
                  type="button"
                  onClick={save}
                  className="h-[46px] shrink-0 rounded-xl bg-[#B7FF5A] px-4 text-[13.5px] font-black text-[#111] transition hover:brightness-105"
                >
                  {t("선정 완료", "Confirm selection", "完成选择", "Hoàn tất chọn", "選定完了", "Selesai memilih")} ({selected.length})
                </button>
              ) : null}
              </div>
            </div>
          )}
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
