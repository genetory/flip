"use client";

// 커리어런치 홈 — 운영진에게 직접 묻는 창구.
// AI가 답할 수 없는 것(기수 일정, 제출 기한, 계정 문제)을 사람에게 묻는 자리다.
// 질문을 보내면 서버가 Discord 로 알려 운영진이 바로 답한다.
import { useEffect, useState } from "react";
import { CaretDown, ChatCircleDots, CheckCircle, CircleNotch, PaperPlaneRight } from "@phosphor-icons/react";
import { Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";
import { fetchMyQuestions, askQuestion, markQuestionRead, QUESTION_MAX_CHARS, type LaunchQuestion } from "../../lib/launch/question-client";

function when(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function AskOpsCard({ currentWeek }: { currentWeek?: number }) {
  const t = useLaunchT();
  const [items, setItems] = useState<LaunchQuestion[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const reload = async () => {
    try {
      const r = await fetchMyQuestions();
      setItems(r.items);
      setUnread(r.unread);
    } catch {
      // 미등록·비로그인 등 — 카드는 질문 입력만 남긴다.
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void reload();
  }, []);

  // 답변을 펼치면 읽음 처리 — 배지가 계속 남지 않게.
  const toggle = (q: LaunchQuestion) => {
    const next = openId === q.id ? null : q.id;
    setOpenId(next);
    if (next && q.answered && !q.readAt) {
      setItems((prev) => prev.map((x) => (x.id === q.id ? { ...x, readAt: new Date().toISOString() } : x)));
      setUnread((n) => Math.max(0, n - 1));
      void markQuestionRead(q.id).catch(() => {});
    }
  };

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setMsg("");
    try {
      const created = await askQuestion(body, currentWeek ?? null);
      setItems((prev) => [created, ...prev]);
      setDraft("");
      setMsg(t("질문을 보냈어요. 운영진이 확인하면 여기에 답변이 달려요.", "Sent. The team's reply will appear here.", "已发送。运营团队的回复会显示在这里。", "Đã gửi. Câu trả lời sẽ xuất hiện ở đây.", "送信しました。運営の回答はここに表示されます。", "Terkirim. Jawaban tim akan muncul di sini."));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("보내지 못했어요.", "Couldn't send.", "发送失败。", "Không gửi được.", "送信できませんでした。", "Gagal mengirim."));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[15px] font-black tracking-[-0.01em] text-[#191F28]">
            <ChatCircleDots size={18} weight="fill" className="shrink-0 text-[#0B46E8]" />
            {t("운영진에게 질문하기", "Ask the team", "向运营团队提问", "Hỏi ban vận hành", "運営に質問する", "Tanya tim")}
            {unread > 0 ? <span className="rounded-full bg-[#F04452] px-1.5 py-0.5 text-[10.5px] font-bold leading-none text-white">{t(`답변 ${unread}`, `${unread} new`, `回复 ${unread}`, `${unread} trả lời`, `回答 ${unread}`, `${unread} baru`)}</span> : null}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#8B95A1]">
            {t("일정·제출 기한·계정처럼 AI가 답할 수 없는 건 운영진이 직접 답해드려요.", "For schedules, deadlines or account issues, the team replies in person.", "日程、截止时间、账号问题由运营团队亲自答复。", "Lịch, hạn chót, tài khoản — ban vận hành trả lời trực tiếp.", "日程・締切・アカウントなどは運営が直接お答えします。", "Jadwal, tenggat, akun — tim menjawab langsung.")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl bg-[#F5F8FF] p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, QUESTION_MAX_CHARS))}
          rows={3}
          placeholder={t("예: 3주차 모의면접은 언제까지 마쳐야 하나요?", "e.g. When is the Week 3 mock interview due?", "例：第3周模拟面试的截止时间是？", "VD: Phỏng vấn thử tuần 3 hạn khi nào?", "例：3週目の模擬面接はいつまでですか？", "Mis: Kapan tenggat wawancara pekan 3?")}
          className="w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:border-[#0B46E8]"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] tabular-nums text-[#8B95A1]">
            {draft.trim().length.toLocaleString()} / {QUESTION_MAX_CHARS.toLocaleString()}
          </span>
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || !draft.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B46E8] px-3.5 py-2 text-[13px] font-bold leading-none text-white transition hover:bg-[#0A3ECB] disabled:cursor-default disabled:opacity-50"
          >
            {sending ? <CircleNotch size={14} weight="bold" className="animate-spin" /> : <PaperPlaneRight size={14} weight="fill" />}
            {t("질문 보내기", "Send", "发送提问", "Gửi câu hỏi", "質問を送る", "Kirim")}
          </button>
        </div>
      </div>
      {msg ? <p className="text-[12px] leading-relaxed text-[#4E5968]">{msg}</p> : null}

      {loading ? (
        <p className="flex items-center gap-1.5 text-[12.5px] text-[#8B95A1]">
          <CircleNotch size={14} weight="bold" className="animate-spin" /> {t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}
        </p>
      ) : items.length === 0 ? null : (
        <ul className="flex flex-col gap-1.5">
          {items.map((q) => (
            <li key={q.id} className="overflow-hidden rounded-xl border border-[#EEF1F5]">
              <button type="button" onClick={() => toggle(q)} className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition hover:bg-[#FAFBFC]">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-[#191F28]">{q.body}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#8B95A1]">
                    {when(q.createdAt)}
                    {q.answered ? (
                      <span className="inline-flex items-center gap-0.5 font-bold text-[#0A9B59]">
                        <CheckCircle size={12} weight="fill" /> {t("답변 완료", "Answered", "已回复", "Đã trả lời", "回答済み", "Dijawab")}
                      </span>
                    ) : (
                      <span className="font-bold text-[#C77700]">{t("답변 대기중", "Waiting", "等待回复", "Đang chờ", "回答待ち", "Menunggu")}</span>
                    )}
                    {q.answered && !q.readAt ? <span className="h-1.5 w-1.5 rounded-full bg-[#F04452]" /> : null}
                  </span>
                </span>
                <CaretDown size={14} weight="bold" className={`mt-0.5 shrink-0 text-[#B0B8C1] transition ${openId === q.id ? "rotate-180" : ""}`} />
              </button>
              {openId === q.id ? (
                <div className="border-t border-[#EEF1F5] bg-[#FAFBFC] px-3 py-2.5">
                  <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-[#4E5968]">{q.body}</p>
                  {q.answer ? (
                    <div className="mt-2 rounded-xl bg-white p-2.5">
                      <p className="text-[11px] font-bold text-[#0B46E8]">{t("운영진 답변", "Team reply", "运营答复", "Ban vận hành trả lời", "運営の回答", "Jawaban tim")}</p>
                      <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-[#191F28]">{q.answer}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11.5px] text-[#8B95A1]">{t("아직 답변이 달리지 않았어요.", "No reply yet.", "还没有回复。", "Chưa có câu trả lời.", "まだ回答はありません。", "Belum ada jawaban.")}</p>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
