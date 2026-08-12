"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RichText } from "../../../components/launch/rich-text";
import { STUDENT } from "../../../lib/launch/data";
import { requestMaterialChat, type JobChatMsg } from "../../../lib/launch/job-chat-client";
import { fetchProgress, patchProgress } from "../../../lib/launch/progress-client";
import { trackCareerStepComplete } from "../../../lib/analytics";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../components/AplyFooter";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../lib/launch/i18n";

// Week 1 스텝3 — 선택한 직무·프로필을 참고해 AI 코치가 그 직무를 깊이 이해하도록 대화로 이끈다.
// 선정 직무·정리한 직무정보는 백엔드(progress)에 저장 → 기기 간 동기화.
type Msg = { role: "bot" | "user"; text: string };

export default function LaunchMaterialsPage() {
  const t = useLaunchT();
  const { user, isReady } = useAuthSession();
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  const startedRef = useRef(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
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

  const endRef = useRef<HTMLDivElement>(null);

  const saveMaterials = (list: string[]) => {
    void patchProgress({ materials: list }).catch(() => {
      // 저장 실패해도 화면 상태 유지
    });
  };

  // 정리한 직무 정보는 대화가 이어져도 지우지 않고 계속 쌓는다(중복 제외).
  const mergeMaterials = (prev: string[], next: string[]) => {
    const seen = new Set(prev.map((m) => m.trim()));
    const merged = [...prev];
    for (const item of next) {
      const t = item.trim();
      if (t && !seen.has(t)) {
        seen.add(t);
        merged.push(item);
      }
    }
    return merged;
  };

  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    // ?restart=1 이면 정리한 정보를 비우고 처음부터(선정 직무는 그대로 두고).
    const restart = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("restart") === "1";
    void (async () => {
      // 선정 직무 + 이전에 정리해둔 직무 정보를 백엔드에서 복원해 이어서 쌓는다.
      let sel: string[] = [];
      let initialMats: string[] = [];
      try {
        const { selectedJobs, materials: savedMat } = await fetchProgress();
        if (Array.isArray(selectedJobs)) sel = selectedJobs;
        setSelected(sel);
        if (restart) {
          setMaterials([]);
          saveMaterials([]); // 백엔드도 비워 진짜 처음부터
        } else if (Array.isArray(savedMat) && savedMat.length) {
          initialMats = savedMat;
          setMaterials(savedMat);
        }
      } catch {
        // 무시
      }
      try {
        // 이미 정리한 정보를 함께 보내 AI가 같은 걸 다시 묻지 않고 이어가게 한다.
        const { reply, materials: mats } = await requestMaterialChat([], sel, initialMats);
        if (mats.length) setMaterials((prev) => mergeMaterials(prev, mats));
        setMessages([{ role: "bot", text: reply || t(`${displayName}님, 반가워요 👋 선정한 직무를 함께 자세히 알아볼까요?`, `Hi ${displayName} 👋 Shall we explore your selected jobs in detail together?`, `${displayName}，你好 👋 我们一起来详细了解你选定的职务吧？`, `Chào ${displayName} 👋 Cùng tìm hiểu chi tiết về công việc bạn đã chọn nhé?`, `${displayName}さん、こんにちは 👋 選んだ職務を一緒に詳しく調べてみましょうか？`, `Hai ${displayName} 👋 Yuk kita pelajari pekerjaan pilihanmu lebih detail bersama?`) }]);
      } catch {
        setMessages([{ role: "bot", text: t("지금은 대화를 시작하기 어려워요 😥 잠시 후 다시 들어와줄래요?", "We can't start the chat right now 😥 Could you come back in a moment?", "现在无法开始对话 😥 请稍后再进来好吗？", "Hiện chưa thể bắt đầu trò chuyện 😥 Bạn quay lại sau một lát nhé?", "今は会話を開始できません 😥 少し経ってからもう一度来ていただけますか？", "Saat ini belum bisa memulai obrolan 😥 Bisa kembali lagi sebentar lagi?") }]);
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
        const history: JobChatMsg[] = nextMsgs.map((m) => ({ role: m.role, text: m.text }));
        const { reply, materials: mats, done: isDone } = await requestMaterialChat(history, selected, materials);
        const merged = mats.length ? mergeMaterials(materials, mats) : materials;
        if (mats.length) {
          setMaterials(merged);
          saveMaterials(merged); // 대화 도중에도 계속 저장해 쌓아둔다.
        }
        setMessages((m) => [...m, { role: "bot", text: reply }]);
        if (isDone) {
          saveMaterials(merged);
          trackCareerStepComplete("materials");
          setDone(true);
        }
      } catch {
        setMessages((m) => [...m, { role: "bot", text: t("잠시 문제가 생겼어요 😥 다시 한 번 말해줄래요?", "Something went wrong 😥 Could you say that once more?", "出了点问题 😥 可以再说一次吗？", "Có chút trục trặc 😥 Bạn nói lại một lần nữa nhé?", "少し問題が発生しました 😥 もう一度言っていただけますか？", "Ada sedikit masalah 😥 Bisa ulangi sekali lagi?") }]);
      } finally {
        setLoading(false);
      }
    })();
  };

  const finishNow = () => {
    saveMaterials(materials);
    trackCareerStepComplete("materials");
    setDone(true);
    setMessages((m) => [...m, { role: "bot", text: t(`좋아요! 지금까지 정리한 직무 정보 ${materials.length}개를 저장했어요. 다음 주엔 이 방향으로 이력서를 만들어봐요 🙌`, `Great! We've saved the ${materials.length} job insights you've gathered so far. Next week let's build your resume in this direction 🙌`, `太好了！已保存你目前整理的 ${materials.length} 条职务信息。下周就朝这个方向来做简历吧 🙌`, `Tuyệt! Đã lưu ${materials.length} thông tin công việc bạn tổng hợp đến giờ. Tuần sau hãy làm CV theo hướng này nhé 🙌`, `いいですね！これまで整理した職務情報${materials.length}件を保存しました。来週はこの方向で履歴書を作ってみましょう 🙌`, `Bagus! Kami sudah menyimpan ${materials.length} info pekerjaan yang kamu kumpulkan. Minggu depan mari buat resume ke arah ini 🙌`) }]);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CareerLaunchHeader />
      <main className="flex-1">
        <div className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-5xl flex-col px-5 pb-4 pt-4 md:pt-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/career-launch/week/1" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
              ← {t("1주차", "Week 1", "第1周", "Tuần 1", "1週目", "Minggu 1")}
            </Link>
            <Link href="/career-launch/week/1" className="rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">{t("종료하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</Link>
            <div className="flex items-center gap-2.5">
              <span className="text-[12px] font-bold text-[#0B46E8]">{t(`정리한 정보 ${materials.length}개`, `${materials.length} insights gathered`, `已整理 ${materials.length} 条信息`, `${materials.length} thông tin đã tổng hợp`, `整理した情報${materials.length}件`, `${materials.length} info terkumpul`)}</span>
              {!done ? (
                <button
                  type="button"
                  onClick={() => send("이 직무는 여기까지 하고 다음으로 넘어갈게요.")}
                  disabled={loading}
                  className="rounded-full border border-[#D7DCE3] bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8] hover:text-[#0B46E8] disabled:opacity-40"
                >
                  {t("넘어가기", "Skip", "跳过", "Bỏ qua", "スキップ", "Lewati")} ⏭
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#E5E8EB]"><img src="/img_logo.webp" alt="Aply" className="h-full w-full object-contain p-1.5" /></span>
            <div>
              <p className="text-[15px] font-black text-[#0B1227]">{t("선정 직무 깊이 알기", "Get to Know Your Selected Jobs", "深入了解选定的职务", "Hiểu sâu công việc đã chọn", "選定した職務を深く知る", "Kenali Pekerjaan Pilihanmu Lebih Dalam")}</p>
              <p className="text-[12px] text-[#8B95A1]">{t("AI 코치와 대화하며 선정 직무를 깊이 이해해요", "Chat with the AI coach to deeply understand your selected jobs", "与 AI 教练对话，深入了解选定的职务", "Trò chuyện với huấn luyện viên AI để hiểu sâu công việc đã chọn", "AIコーチと話しながら選定した職務を深く理解します", "Mengobrol dengan pelatih AI untuk memahami pekerjaan pilihanmu lebih dalam")} · ⏱ {t("약 10분", "About 10 min", "约 10 分钟", "Khoảng 10 phút", "約10分", "Sekitar 10 menit")}</p>
            </div>
          </div>

          {/* 대화 */}
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
            {/* 지금까지 모은 재료 미리보기 */}
            {materials.length > 0 ? (
              <div className="flex items-start gap-2">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#EAFFD1] text-[13px]">📋</span>
                <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-[#D9F2B8] bg-[#F6FFE9] px-3.5 py-3">
                  <p className="text-[11.5px] font-bold text-[#3A6B00]">{t("정리한 직무 정보", "Job insights gathered", "整理的职务信息", "Thông tin công việc đã tổng hợp", "整理した職務情報", "Info pekerjaan terkumpul")}</p>
                  <ul className="mt-1.5 space-y-1">
                    {materials.map((mat, i) => (
                      <li key={i} className="flex gap-1.5 text-[12.5px] leading-relaxed text-[#333D4B]">
                        <span className="text-[#3A6B00]">•</span>
                        {mat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
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

          {/* 입력 / 완료 */}
          {done ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setDone(false)}
                className="flex h-[46px] items-center justify-center rounded-xl border border-[#D7DCE3] bg-white px-4 text-[13.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40"
              >
                {t("계속 정리하기", "Keep gathering", "继续整理", "Tiếp tục tổng hợp", "続けて整理する", "Lanjut mengumpulkan")}
              </button>
            </div>
          ) : (
            <div className="mt-3">
              {/* 할 말이 없어 막힐 때를 위한 빠른 응답 — 대화가 끊기지 않게 */}
              {messages.length > 0 && !loading ? (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {[
                    { label: t("잘 모르겠어요", "I'm not sure", "我不太清楚", "Tôi không chắc", "よく分かりません", "Saya kurang yakin"), send: "잘 모르겠어요" },
                    { label: t("더 자세히 알려주세요", "Tell me more", "请告诉我更多", "Cho tôi biết thêm", "もっと詳しく教えてください", "Beri tahu lebih detail"), send: "더 자세히 알려주세요" },
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
              {materials.length >= 3 ? (
                <button
                  type="button"
                  onClick={finishNow}
                  className="h-[46px] shrink-0 rounded-xl bg-[#B7FF5A] px-4 text-[13.5px] font-black text-[#111] transition hover:brightness-105"
                >
                  {t("정리 완료", "Done gathering", "整理完成", "Hoàn tất tổng hợp", "整理完了", "Selesai")}
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
