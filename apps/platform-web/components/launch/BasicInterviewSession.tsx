"use client";

// Week 3 기본 모의면접(카드형) — 내 이력서·자소서 기반, 유형별(self/job/fit/pressure).
// 문항은 탤런트 모의 면접과 같은 연습 시트(실전 모드 60초·말로 답하기·피드백) → 결과 리스트(오답노트 재도전). 공고별과 동일 구조.
// 말로 답하면 내용 점수와 함께 '말하기 리포트'를 준다(문항에 speakingData 로 저장). 채점은 커리어런치 엔드포인트(포인트 없음).
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CaretLeft, CircleNotch } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "./CareerLaunchHeader";
import { AplyFooter } from "../AplyFooter";
import { PostingResultList } from "./PostingResultList";
import { requestBasicQuestions, scoreBasicAnswer, type BasicFocus } from "../../lib/launch/basic-interview";
import { fetchProgress, patchProgress, type PostingInterviewItem } from "../../lib/launch/progress-client";
import { trackCareerFunnel } from "../../lib/analytics";
import { useLaunchT } from "../../lib/launch/i18n";
import { CareerPracticeSheet } from "./career-practice";

export function BasicInterviewSession({ focus, embedded = false, onClose }: { focus: BasicFocus; embedded?: boolean; onClose?: () => void }) {
  const t = useLaunchT();
  const startedRef = useRef(false);
  const savedRef = useRef(false);
  const [phase, setPhase] = useState<"loading" | "answering" | "results" | "error">("loading");
  const [questions, setQuestions] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [loadingNext, setLoadingNext] = useState(false); // 다음 질문 생성 중
  const [nextError, setNextError] = useState(false);
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
  // 꼬리 질문 — 질문 자리(idx)별 깊이·면접관 의도
  const [follow, setFollow] = useState<Record<number, { depth: number; intent: string }>>({});
  const depthAt = (i: number) => follow[i]?.depth ?? 0;
  const askFollowUp = (q: string, intent: string) => {
    const at = idx + 1;
    setQuestions((prev) => [...prev.slice(0, at), q, ...prev.slice(at)]);
    setFollow((prev) => ({ ...prev, [at]: { depth: depthAt(idx) + 1, intent } }));
    setIdx(at);
  };

  const focusLabel: Record<BasicFocus, string> = {
    self: t("자기소개 면접", "Self-Introduction Interview", "自我介绍面试", "Phỏng vấn giới thiệu", "自己紹介面接", "Wawancara Perkenalan"),
    job: t("직무 면접", "Job Interview", "职务面试", "Phỏng vấn chuyên môn", "職務面接", "Wawancara Pekerjaan"),
    fit: t("인성·컬처핏 면접", "Personality & Culture-Fit", "人品·文化契合面试", "Phỏng vấn tính cách & văn hóa", "人柄・カルチャーフィット面接", "Wawancara Kepribadian & Budaya"),
    pressure: t("압박 면접", "Pressure Interview", "压力面试", "Phỏng vấn áp lực", "圧迫面接", "Wawancara Tekanan"),
    global: t("외국인 지원자 면접", "Questions for international applicants", "外国申请者面试", "PV cho ứng viên nước ngoài", "外国人応募者面接", "Wawancara pelamar asing")
  };
  const label = focusLabel[focus];

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackCareerFunnel("career_basic_interview_started", { focus });
    void (async () => {
      try {
        // 갯수 고정 없음 — 첫 질문 하나만 생성하고, 다음 질문은 답변 제출 후 요청 시 생성.
        const qs = await requestBasicQuestions(focus, 1);
        if (qs.length === 0) {
          setPhase("error");
          return;
        }
        setQuestions(qs.slice(0, 1));
        setPhase("answering");
      } catch {
        setPhase("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 다음 질문 — 그때그때 생성(이전 질문과 겹치지 않게 asked 로 전달).
  const next = async () => {
    if (loadingNext) return;
    setLoadingNext(true);
    setNextError(false);
    try {
      const [q] = await requestBasicQuestions(focus, 1, questions);
      if (q) {
        setQuestions((prev) => [...prev, q]);
        setIdx((i) => i + 1);
      } else {
        setNextError(true);
      }
    } catch {
      setNextError(true);
    } finally {
      setLoadingNext(false);
    }
  };
  // 시트를 닫으면 결과로(답한 게 없으면 진행 화면에 그대로 — 다시 열 수 있다).
  const [sheetOpen, setSheetOpen] = useState(true);
  const finish = () => {
    if (itemsRef.current.length) setPhase("results");
    else setSheetOpen(false);
  };

  const saveLog = async () => {
    if (savedRef.current) return;
    const its = itemsRef.current;
    if (its.length === 0) return;
    savedRef.current = true;
    const entry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      title: label,
      at: new Date().toISOString(),
      source: "basic" as const,
      focus,
      items: its
    };
    try {
      trackCareerFunnel("career_basic_interview_completed", { focus, count: its.length });
      const prog = await fetchProgress();
      const prev = Array.isArray(prog.basicInterviews) ? prog.basicInterviews : [];
      await patchProgress({ basicInterviews: [entry, ...prev].slice(0, 40) });
    } catch {
      savedRef.current = false;
    }
  };
  const handleClose = () => {
    void saveLog();
    onClose?.();
  };

  return (
    <div className={embedded ? "flex h-[100dvh] flex-col bg-white" : "flex min-h-screen flex-col bg-white"}>
      {embedded ? (
        <div className="border-b border-[color:var(--v2-line)]">
          <div className="mx-auto w-full max-w-3xl px-5 py-3">
            <button type="button" onClick={handleClose} className="-ml-1.5 inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[13px] font-bold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-fill)]"><CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("뒤로", "Back", "返回", "Quay lại", "戻る", "Kembali")}</button>
            <p className="mt-1 truncate text-[17px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{label}</p>
          </div>
        </div>
      ) : (
        <CareerLaunchHeader />
      )}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-4 md:pt-8">
          {embedded ? null : (
            <div className="flex items-center justify-between gap-3">
              <Link href="/career-launch/week/3" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--v2-faint)] transition hover:text-[color:var(--v2-ink)]"><CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("Step 3", "Step 3", "Step 3", "Step 3", "Step 3", "Step 3")}</Link>
              <Link href="/career-launch/week/3" className="rounded-xl bg-[color:var(--v2-band)] px-3 py-1.5 text-[12px] font-semibold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-line)]">{t("종료하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</Link>
            </div>
          )}

          <div className="mt-3.5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[color:var(--v2-accent)]">{t("Step 3 · 기본 면접", "Step 3 · Basic interview", "Step 3 · 基础面试", "Step 3 · Phỏng vấn cơ bản", "Step 3 · 基本面接", "Step 3 · Wawancara dasar")}</p>
            <h1 className="mt-1.5 break-keep text-[20px] font-bold leading-[1.2] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[24px]">{label}</h1>
            <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-[color:var(--v2-faint)]">{t("내 이력서·자기소개서를 바탕으로 한 면접이에요", "Based on your resume and cover letter", "基于你的简历与自我介绍书", "Dựa trên CV và thư giới thiệu của bạn", "あなたの履歴書・自己紹介書に基づく面接です", "Berdasarkan resume dan surat lamaranmu")}</p>
          </div>

          {phase === "loading" ? (
            <div className="mt-8 flex flex-col items-center gap-2 py-10 text-center">
              <CircleNotch className="h-6 w-6 animate-spin text-[color:var(--v2-accent)]" weight="bold" />
              <p className="text-[13px] text-[color:var(--v2-faint)]">{t("내 서류에 맞는 면접 질문을 준비하고 있어요…", "Preparing interview questions from your documents…", "正在根据你的材料准备面试问题…", "Đang chuẩn bị câu hỏi từ hồ sơ của bạn…", "あなたの書類に合う面接質問を準備中…", "Menyiapkan pertanyaan dari dokumenmu…")}</p>
            </div>
          ) : phase === "error" ? (
            <div className="mt-8 rounded-3xl bg-[color:var(--v2-band)] p-6 text-center">
              <p className="text-[13px] text-[color:var(--v2-faint)]">{t("질문을 준비하지 못했어요. 이력서·자기소개서를 먼저 작성하면 더 잘 맞춰줘요.", "Couldn't prepare questions. Fill your resume/cover letter first for a better fit.", "无法准备问题。先完成简历/自我介绍书会更贴合。", "Không chuẩn bị được câu hỏi. Hãy điền CV/thư trước.", "質問を準備できませんでした。履歴書・自己紹介書を先に作成すると合わせやすいです。", "Gagal menyiapkan. Isi resume/surat dulu.")}</p>
              <button type="button" onClick={() => (onClose ? onClose() : (window.location.href = "/career-launch/program"))} className="mt-3 rounded-xl bg-white px-4 py-2 text-[12.5px] font-bold text-[color:var(--v2-ink-3)]">{t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}</button>
            </div>
          ) : phase === "answering" ? (
            <div className="mt-5">
              {/* 문항은 탤런트 모의 면접과 같은 연습 시트로 — 실전 모드(60초)·말로 답하기·피드백 */}
              <div className="rounded-3xl bg-[color:var(--v2-band)] p-6">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[color:var(--v2-ink-3)]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--v2-accent)]" aria-hidden />
                  {t("면접 진행 중", "Interview in progress", "面试进行中", "Đang phỏng vấn", "面接進行中", "Wawancara berlangsung")} · {t(`질문 ${idx + 1}`, `Q ${idx + 1}`, `问题 ${idx + 1}`, `Câu ${idx + 1}`, `質問 ${idx + 1}`, `Soal ${idx + 1}`)}
                </span>
                <p className="mt-2 break-keep text-[16px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">{questions[idx]}</p>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setSheetOpen(true)} className="rounded-2xl bg-[color:var(--v2-accent)] px-5 py-2.5 text-[14px] font-bold text-white transition hover:opacity-90">{t("이어서 답하기", "Continue", "继续作答", "Tiếp tục", "続けて答える", "Lanjutkan")}</button>
                  <button type="button" onClick={finish} className="rounded-2xl bg-white px-5 py-2.5 text-[14px] font-bold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-line)]">{t("결과 보기", "See results", "查看结果", "Xem kết quả", "結果を見る", "Lihat hasil")}</button>
                </div>
              </div>
              {sheetOpen ? (
                <CareerPracticeSheet
                  key={`${idx}-${questions[idx]}`}
                  heading={label}
                  progress={t(`질문 ${idx + 1}`, `Q${idx + 1}`, `问题 ${idx + 1}`, `Câu ${idx + 1}`, `質問 ${idx + 1}`, `Soal ${idx + 1}`)}
                  question={questions[idx] ?? ""}
                  category={focus}
                  depth={depthAt(idx)}
                  intent={follow[idx]?.intent}
                  context={label}
                  score={(q, a) => scoreBasicAnswer(focus, q, a)}
                  onRecord={(item) => record(idx, item)}
                  onFollowUp={askFollowUp}
                  onNext={() => void next()}
                  nextBusy={loadingNext}
                  nextError={nextError}
                  onFinish={finish}
                />
              ) : null}
            </div>
          ) : (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[14px] font-bold text-[color:var(--v2-ink)]">{t("면접 결과", "Interview results", "面试结果", "Kết quả phỏng vấn", "面接結果", "Hasil wawancara")}</p>
                {items.length ? <span className="rounded-full bg-[color:var(--v2-accent-weak)] px-2.5 py-1 text-[12px] font-bold text-[color:var(--v2-accent)]">{t("평균", "Avg", "平均", "TB", "平均", "Rata")} {Math.round(items.reduce((s, it) => s + it.score, 0) / items.length)}</span> : null}
              </div>
              <PostingResultList items={items} rescore={(q, a) => scoreBasicAnswer(focus, q, a)} onItemsChange={setItems} />
              <div className="mt-4 flex items-center justify-between gap-3 rounded-3xl bg-[color:var(--v2-band)] p-4">
                <p className="break-keep text-[12.5px] leading-relaxed text-[color:var(--v2-ink-3)]">{t("점수가 낮은 문항은 '다시 답하기'로 오답노트처럼 연습해요. 기록은 저장돼요.", "Retry low-scoring questions like a review note. Your record is saved.", "对低分题用'重新作答'像错题本一样练习。记录会保存。", "Luyện lại câu điểm thấp như sổ sửa lỗi. Bản ghi được lưu.", "点数の低い問題は「もう一度答える」で復習ノートのように練習。記録は保存されます。", "Latih lagi soal berskor rendah. Rekaman tersimpan.")}</p>
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
