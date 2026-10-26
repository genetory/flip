"use client";

// Week 4 공고별 모의면접(카드형) — 공고 기반 질문을 한 문제씩 카드로 답변 → 점수·모범답안 →
// 마지막에 결과 리스트(오답노트 재도전). 종료 시 progress.postingInterviews 에 저장.
// 문항은 탤런트 모의 면접과 같은 연습 시트(실전 모드 60초·말로 답하기·피드백). 말하기 리포트·꼬리 질문은 3주차 기본 면접과 같다(career-practice).
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CaretLeft, X, CircleNotch } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "./CareerLaunchHeader";
import { AplyFooter } from "../AplyFooter";
import { PostingResultList } from "./PostingResultList";
import { requestPostingQuestions, scorePostingAnswer } from "../../lib/launch/posting-interview";
import { fetchProgress, patchProgress, type PostingInterviewItem } from "../../lib/launch/progress-client";
import type { InterviewJobPosting } from "../../lib/launch/interview";
import { trackCareerFunnel } from "../../lib/analytics";
import { useLaunchT } from "../../lib/launch/i18n";
import { CareerPracticeSheet } from "./career-practice";

export function PostingInterviewSession({ posting, embedded = false, onClose }: { posting: InterviewJobPosting; embedded?: boolean; onClose?: () => void }) {
  const t = useLaunchT();
  const startedRef = useRef(false);
  const savedRef = useRef(false);
  const [phase, setPhase] = useState<"loading" | "answering" | "results" | "error">("loading");
  const [questions, setQuestions] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [items, setItems] = useState<PostingInterviewItem[]>([]);
  const itemsRef = useRef<PostingInterviewItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  // 질문 자리(idx) → 결과 목록(items)의 몇 번째인지 — '고쳐서 다시 답하기'·말하기 리포트는 같은 칸을 바꿔 쓴다.
  const posAt = useRef<Record<number, number>>({});
  const record = (at: number, item: PostingInterviewItem) => {
    const pos = posAt.current[at];
    if (pos === undefined) {
      posAt.current[at] = itemsRef.current.length;
      itemsRef.current = [...itemsRef.current, item];
    } else {
      itemsRef.current = itemsRef.current.map((x, i) => (i === pos ? item : x));
    }
    setItems(itemsRef.current);
  };
  const [follow, setFollow] = useState<Record<number, { depth: number; intent: string }>>({});
  const depthAt = (i: number) => follow[i]?.depth ?? 0;
  const askFollowUp = (q: string, intent: string) => {
    const at = idx + 1;
    setQuestions((prev) => [...prev.slice(0, at), q, ...prev.slice(at)]);
    // 뒤에 있던 질문 자리가 한 칸씩 밀린다 — 이미 기록된 꼬리 질문 표시·답한 칸도 같이 민다
    setFollow((prev) => {
      const nx: Record<number, { depth: number; intent: string }> = {};
      for (const [k, v] of Object.entries(prev)) nx[Number(k) >= at ? Number(k) + 1 : Number(k)] = v;
      nx[at] = { depth: depthAt(idx) + 1, intent };
      return nx;
    });
    posAt.current = Object.fromEntries(Object.entries(posAt.current).map(([k, v]) => [Number(k) >= at ? Number(k) + 1 : Number(k), v]));
    setIdx(at);
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackCareerFunnel("career_posting_interview_started");
    void (async () => {
      try {
        const qs = await requestPostingQuestions(posting, 6);
        if (qs.length === 0) {
          setPhase("error");
          return;
        }
        setQuestions(qs);
        setPhase("answering");
      } catch {
        setPhase("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = [posting.company, posting.title].filter(Boolean).join(" · ") || t("붙여넣은 공고", "Pasted posting", "粘贴的公告", "Tin đã dán", "貼付した求人", "Lowongan ditempel");

  // 시트를 닫으면 결과로(답한 게 없으면 진행 화면에 그대로 — 다시 열 수 있다).
  const [sheetOpen, setSheetOpen] = useState(true);
  const finish = () => {
    if (itemsRef.current.length) setPhase("results");
    else setSheetOpen(false);
  };
  const next = () => {
    if (idx < questions.length - 1) setIdx(idx + 1);
    else finish();
  };

  const saveLog = async () => {
    if (savedRef.current) return;
    const its = itemsRef.current;
    if (its.length === 0) return;
    savedRef.current = true;
    const entry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      company: posting.company,
      title: posting.title,
      at: new Date().toISOString(),
      posting,
      items: its
    };
    try {
      trackCareerFunnel("career_posting_interview_completed", { count: its.length });
      const prog = await fetchProgress();
      const prev = Array.isArray(prog.postingInterviews) ? prog.postingInterviews : [];
      await patchProgress({ postingInterviews: [entry, ...prev].slice(0, 30) });
    } catch {
      savedRef.current = false;
    }
  };
  const handleClose = () => {
    void saveLog();
    onClose?.();
  };

  const total = questions.length;

  return (
    <div className={embedded ? "flex h-[100dvh] flex-col bg-white" : "flex min-h-screen flex-col bg-white"}>
      {embedded ? (
        <div className="flex items-center justify-between gap-3 border-b border-[color:var(--v2-line)] px-5 py-3">
          <p className="min-w-0 truncate text-[14px] font-bold tracking-[-0.01em] text-[color:var(--v2-ink)]">{t("공고별 모의면접", "Posting mock interview", "公告模拟面试", "Phỏng vấn theo tin", "求人別模擬面接", "Wawancara per lowongan")}</p>
          <button type="button" onClick={handleClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-fill)]"><X className="h-5 w-5" weight="bold" /></button>
        </div>
      ) : (
        <CareerLaunchHeader />
      )}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-4 md:pt-8">
          {embedded ? null : (
            <div className="flex items-center justify-between gap-3">
              <Link href="/career-launch/week/4" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--v2-faint)] transition hover:text-[color:var(--v2-ink)]"><CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("Step 4", "Step 4", "Step 4", "Step 4", "Step 4", "Step 4")}</Link>
              <Link href="/career-launch/week/4" className="rounded-xl bg-[color:var(--v2-band)] px-3 py-1.5 text-[12px] font-semibold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-line)]">{t("종료하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</Link>
            </div>
          )}

          <div className="mt-3.5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[color:var(--v2-accent)]">{t("Step 4 · 공고별 모의면접", "Step 4 · Posting mock interview", "Step 4 · 公告模拟面试", "Step 4 · Phỏng vấn theo tin", "Step 4 · 求人別模擬面接", "Step 4 · Wawancara per lowongan")}</p>
            <h1 className="mt-1.5 break-keep text-[20px] font-bold leading-[1.2] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[24px]">{label}</h1>
          </div>

          {phase === "loading" ? (
            <div className="mt-8 flex flex-col items-center gap-2 py-10 text-center">
              <CircleNotch className="h-6 w-6 animate-spin text-[color:var(--v2-accent)]" weight="bold" />
              <p className="text-[13px] text-[color:var(--v2-faint)]">{t("이 공고에 맞는 면접 질문을 준비하고 있어요…", "Preparing interview questions for this posting…", "正在准备针对该公告的面试问题…", "Đang chuẩn bị câu hỏi cho tin này…", "この求人に合う面接質問を準備中…", "Menyiapkan pertanyaan untuk lowongan ini…")}</p>
            </div>
          ) : phase === "error" ? (
            <div className="mt-8 rounded-3xl bg-[color:var(--v2-band)] p-6 text-center">
              <p className="text-[13px] text-[color:var(--v2-faint)]">{t("질문을 준비하지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't prepare questions. Please try again shortly.", "无法准备问题，请稍后再试。", "Không chuẩn bị được câu hỏi. Thử lại sau.", "質問を準備できませんでした。少し後にお試しください。", "Gagal menyiapkan pertanyaan. Coba lagi.")}</p>
              <button type="button" onClick={() => (onClose ? onClose() : (window.location.href = "/career-launch/program"))} className="mt-3 rounded-xl bg-white px-4 py-2 text-[12.5px] font-bold text-[color:var(--v2-ink-3)]">{t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}</button>
            </div>
          ) : phase === "answering" ? (
            <div className="mt-5">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--v2-band)]"><div className="h-full rounded-full bg-[color:var(--v2-accent)] transition-[width]" style={{ width: `${total ? (Math.min(items.length, total) / total) * 100 : 0}%` }} /></div>
                <span className="shrink-0 text-[12px] font-bold tabular-nums text-[color:var(--v2-faint)]">{idx + 1} / {total}</span>
              </div>
              {/* 문항은 탤런트 모의 면접과 같은 연습 시트로 — 실전 모드(60초)·말로 답하기·피드백 */}
              <div className="rounded-3xl bg-[color:var(--v2-band)] p-6">
                <p className="break-keep text-[16px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">{questions[idx]}</p>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setSheetOpen(true)} className="rounded-2xl bg-[color:var(--v2-accent)] px-5 py-2.5 text-[14px] font-bold text-white transition hover:opacity-90">{t("이어서 답하기", "Continue", "继续作答", "Tiếp tục", "続けて答える", "Lanjutkan")}</button>
                  <button type="button" onClick={() => (items.length ? setPhase("results") : handleClose())} className="rounded-2xl bg-white px-5 py-2.5 text-[14px] font-bold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-line)]">{items.length ? t("결과 보기", "See results", "查看结果", "Xem kết quả", "結果を見る", "Lihat hasil") : t("나가기", "Exit", "退出", "Thoát", "終了", "Keluar")}</button>
                </div>
              </div>
              {sheetOpen ? (
                <CareerPracticeSheet
                  key={`${idx}-${questions[idx]}`}
                  heading={label}
                  progress={`${idx + 1} / ${total}`}
                  question={questions[idx] ?? ""}
                  category="job"
                  depth={depthAt(idx)}
                  intent={follow[idx]?.intent}
                  context={label}
                  score={(q, a) => scorePostingAnswer(posting, q, a)}
                  onRecord={(item) => record(idx, item)}
                  onFollowUp={askFollowUp}
                  onNext={next}
                  onFinish={finish}
                />
              ) : null}
            </div>
          ) : (
            // results
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[14px] font-bold text-[color:var(--v2-ink)]">{t("면접 결과", "Interview results", "面试结果", "Kết quả phỏng vấn", "面接結果", "Hasil wawancara")}</p>
                {items.length ? <span className="rounded-full bg-[color:var(--v2-accent-weak)] px-2.5 py-1 text-[12px] font-bold text-[color:var(--v2-accent)]">{t("평균", "Avg", "平均", "TB", "平均", "Rata")} {Math.round(items.reduce((s, it) => s + it.score, 0) / items.length)}</span> : null}
              </div>
              <PostingResultList items={items} rescore={(q, a) => scorePostingAnswer(posting, q, a)} onItemsChange={setItems} />
              <div className="mt-4 flex items-center justify-between gap-3 rounded-3xl bg-[color:var(--v2-band)] p-4">
                <p className="break-keep text-[12.5px] leading-relaxed text-[color:var(--v2-ink-3)]">{t("점수가 낮은 문항을 '다시 답하기'로 오답노트처럼 연습해요. 기록은 저장돼요.", "Retry low-scoring questions like a review note. Your record is saved.", "对低分题用'重新作答'像错题本一样练习。记录会保存。", "Luyện lại câu điểm thấp bằng 'Trả lời lại' như sổ sửa lỗi. Bản ghi được lưu.", "点数の低い問題は「もう一度答える」で復習ノートのように練習。記録は保存されます。", "Latih lagi soal berskor rendah seperti catatan. Rekaman tersimpan.")}</p>
                <button type="button" onClick={handleClose} className="shrink-0 rounded-xl bg-[color:var(--v2-accent)] px-4 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90">{t("저장하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</button>
              </div>
            </div>
          )}
        </div>
      </main>
      {embedded ? null : <AplyFooter />}
    </div>
  );
}
