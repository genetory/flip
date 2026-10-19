"use client";

// 나의 결과물 — 이력서·자기소개서를 실제 A4 미니 프리뷰 2컬럼으로 보여주고,
// 위에는 목표 직무, 아래에는 면접 준비 요약. 프리뷰 컴포넌트는 컨테이너 폭에 맞춰 자동 스케일.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, PencilSimpleLine, Microphone } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../components/AplyFooter";
import { DashboardSection, ErrorState, CardSkeleton } from "../../../components/launch/dashboard-states";
import { ResumePreview } from "../../../components/resume-maker/ResumePreview";
import { DEFAULT_DESIGN } from "../../../lib/resume-maker-types";
import { toResumeContent } from "../../../components/launch/resume-render";
import { CoverRender } from "../../../components/launch/cover-render";
import { fetchResumeData, hasResumeContent, type ResumeData } from "../../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent, type CoverData } from "../../../lib/launch/cover-data";
import { fetchResumeScore, fetchCoverScore } from "../../../lib/launch/feedback-client";
import { fetchProgress } from "../../../lib/launch/progress-client";
import { useLaunchT } from "../../../lib/launch/i18n";
import { getEditorLink, linkEditor, type EditorKind } from "../../../lib/launch/editor-link";
import { LAUNCH_COVER_EDITOR, LAUNCH_RESUME_EDITOR } from "../../../lib/launch-editor-context";
import { Sheet } from "../../../components/v2/sheets";
import { Spinner } from "../../../components/v2/ui";

type LaunchT = ReturnType<typeof useLaunchT>;

function scoreVar(s: number): string {
  return s >= 75 ? "var(--v2-good)" : s >= 50 ? "var(--v2-accent)" : "#C77700";
}

function DocCard({
  label,
  score,
  empty,
  emptyHint,
  openHref,
  onEdit,
  editing,
  preview,
  t
}: {
  label: string;
  score: number | null;
  empty: boolean;
  emptyHint: string;
  openHref: string;
  /** 탤런트 에디터로 편집(커리어런치에서 열면 에디터 AI 를 포인트 없이). */
  onEdit: () => void;
  editing: boolean;
  preview: React.ReactNode;
  t: LaunchT;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl bg-[color:var(--v2-band)]">
      {/* A4 미니 프리뷰 */}
      <Link href={openHref} target="_blank" rel="noopener noreferrer" className="relative m-3 mb-0 block h-[260px] overflow-hidden rounded-2xl bg-white">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="text-[26px]" aria-hidden>📄</span>
            <p className="break-keep text-[12.5px] leading-relaxed text-[color:var(--v2-faint)]">{emptyHint}</p>
          </div>
        ) : (
          <>
            <div className="p-3">{preview}</div>
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white to-transparent" />
          </>
        )}
      </Link>
      {/* 하단 정보 */}
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="min-w-0">
          <p className="text-[16px] font-bold text-[color:var(--v2-ink)]">{label}</p>
          {score != null ? (
            <span className="mt-1 inline-flex items-baseline gap-0.5 text-[12px] font-bold tabular-nums" style={{ color: scoreVar(score) }}>{score}<span className="text-[10px] font-bold text-[color:var(--v2-faint)]">/100</span></span>
          ) : (
            <span className="mt-1 block text-[12px] font-semibold text-[color:var(--v2-faint)]">{empty ? t("아직 작성 전", "Not started", "尚未开始", "Chưa bắt đầu", "未作成", "Belum mulai") : t("작성됨", "Written", "已撰写", "Đã viết", "作成済み", "Sudah ditulis")}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={onEdit} disabled={editing} className="inline-flex h-9 items-center gap-1 rounded-lg bg-white px-3 text-[14px] font-semibold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-line)] disabled:opacity-60">
            {editing ? <Spinner /> : <PencilSimpleLine className="h-3.5 w-3.5" weight="bold" />} {t("에디터로 편집", "Edit in editor", "在编辑器中编辑", "Sửa trong trình soạn", "エディタで編集", "Edit di editor")}
          </button>
          <Link href={openHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1 rounded-lg bg-[color:var(--v2-accent)] px-3 text-[14px] font-semibold text-white transition hover:opacity-90">{t("열기", "Open", "打开", "Mở", "開く", "Buka")} <ArrowUpRight className="h-3.5 w-3.5" weight="bold" /></Link>
        </div>
      </div>
    </div>
  );
}

export default function DeliverablesPage() {
  const t = useLaunchT();
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [resume, setResume] = useState<ResumeData>({});
  const [cover, setCover] = useState<CoverData>({});
  const [rScore, setRScore] = useState<number | null>(null);
  const [cScore, setCScore] = useState<number | null>(null);
  const [iv, setIv] = useState<{ avg: number; count: number } | null>(null);

  const load = () => {
    setPhase("loading");
    void Promise.all([
      fetchResumeData().catch(() => ({ data: {} as ResumeData })),
      fetchCoverData().catch(() => ({ data: {} as CoverData })),
      fetchResumeScore({ generate: false }).catch(() => ({ score: null })),
      fetchCoverScore({ generate: false }).catch(() => ({ score: null })),
      fetchProgress().catch(() => null)
    ])
      .then(([r, c, rs, cs, prog]) => {
        setResume(r.data ?? {});
        setCover(c.data ?? {});
        setRScore(rs.score?.total ?? null);
        setCScore(cs.score?.total ?? null);
        // 기본(내 서류) + 공고별 면접 모두 포함.
        const logs = [...(Array.isArray(prog?.basicInterviews) ? prog!.basicInterviews! : []), ...(Array.isArray(prog?.postingInterviews) ? prog!.postingInterviews! : [])];
        const items = logs.flatMap((l) => l.items ?? []).filter((it) => typeof it.score === "number");
        setIv(items.length ? { avg: Math.round(items.reduce((s, it) => s + it.score, 0) / items.length), count: items.length } : null);
        setPhase("ready");
      })
      .catch(() => setPhase("error"));
  };
  useEffect(load, []);

  const resumeEmpty = !hasResumeContent(resume);
  const coverEmpty = !hasCoverContent(cover);

  // 에디터로 편집 — 탤런트 에디터와 '하나의 문서'로 연결하고 연다(커리어런치에서 열면 에디터 AI 를 포인트 없이).
  // 처음이면 연결: 한쪽에만 내용이 있으면 그쪽으로, 둘 다 있으면 어느 내용으로 시작할지 묻는다.
  const [editing, setEditing] = useState<EditorKind | null>(null);
  const [choose, setChoose] = useState<EditorKind | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const goEditor = (kind: EditorKind) => {
    window.location.href = kind === "resume" ? LAUNCH_RESUME_EDITOR : LAUNCH_COVER_EDITOR;
  };
  const failText = t("에디터를 열지 못했어요. 잠시 후 다시 해 보세요.", "Couldn't open the editor. Try again soon.", "无法打开编辑器，请稍后再试。", "Không mở được trình soạn. Thử lại sau.", "エディタを開けませんでした。", "Gagal membuka editor. Coba lagi.");
  const openEditor = async (kind: EditorKind) => {
    setEditing(kind);
    setEditError(null);
    try {
      const st = (await getEditorLink())[kind];
      if (st.linked) return goEditor(kind);
      if (st.launchHasContent && st.talentHasContent) {
        setChoose(kind);
        setEditing(null);
        return;
      }
      await linkEditor(kind, st.launchHasContent || !st.talentHasContent ? "launch" : "talent");
      goEditor(kind);
    } catch {
      setEditError(failText);
      setEditing(null);
    }
  };
  const pick = async (use: "launch" | "talent") => {
    if (!choose) return;
    const kind = choose;
    setEditing(kind);
    try {
      await linkEditor(kind, use);
      goEditor(kind);
    } catch {
      setEditError(failText);
      setEditing(null);
      setChoose(null);
    }
  };

  return (
    <div className="cl-surface flex min-h-screen flex-col bg-[color:var(--v2-bg,#fff)]">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-8">
          <p className="text-[15px] font-semibold text-[color:var(--v2-muted)]">Career Launch</p>
          <h1 className="mt-1.5 text-[26px] font-bold leading-[1.38] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[30px]">{t("나의 결과물", "My deliverables", "我的成果", "Kết quả của tôi", "私の成果物", "Hasil saya")}</h1>
          <p className="mt-2.5 max-w-[52ch] text-[17px] leading-[1.6] text-[color:var(--v2-ink-3)]">{t("4단계에 걸쳐 만든 이력서·자기소개서와 면접 준비 결과를 한곳에서 확인해요.", "See the resume, cover letter, and interview prep you built across four steps, all in one place.", "在一处查看你通过4个步骤完成的简历、自我介绍书和面试准备成果。", "Xem CV, thư giới thiệu và chuẩn bị phỏng vấn bạn đã làm qua 4 bước, tại một nơi.", "4ステップで作った履歴書・自己紹介書と面接準備の成果を一か所で確認します。", "Lihat resume, surat lamaran, dan persiapan wawancara yang kamu buat dalam 4 langkah, di satu tempat.")}</p>

          <hr className="mt-6 h-px border-0 bg-[color:var(--v2-line)]" />

          {phase === "loading" ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <CardSkeleton height={340} />
              <CardSkeleton height={340} />
            </div>
          ) : phase === "error" ? (
            <div className="mt-6"><ErrorState onRetry={load} /></div>
          ) : (
            <div className="mt-6 flex flex-col gap-7">
              {/* 지원 서류 — 2컬럼 문서 프리뷰 */}
              <DashboardSection title={t("지원 서류", "Application documents", "申请材料", "Giấy tờ ứng tuyển", "応募書類", "Dokumen lamaran")} sub={t("실제 지원할 이력서·자기소개서", "The resume & cover letter you'll apply with", "实际投递的简历与自我介绍", "CV & thư để ứng tuyển", "実際に応募する履歴書・自己紹介書", "Resume & surat untuk melamar")}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DocCard
                    t={t}
                    label={t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")}
                    score={rScore}
                    empty={resumeEmpty}
                    emptyHint={t("Step 2에서 이력서를 작성하면 여기에 미리보기가 나타나요.", "Build your resume in Step 2 to see a preview here.", "在Step 2撰写简历后，这里会显示预览。", "Tạo CV ở Step 2 để xem bản xem trước tại đây.", "Step 2で履歴書を作成するとここにプレビューが表示されます。", "Buat resume di Step 2 untuk melihat pratinjau di sini.")}
                    openHref="/career-launch/resume-preview"
                    onEdit={() => void openEditor("resume")}
                    editing={editing === "resume"}
                    preview={<ResumePreview content={toResumeContent(resume)} design={DEFAULT_DESIGN} preserveOrder />}
                  />
                  <DocCard
                    t={t}
                    label={t("자기소개서", "Cover letter", "自我介绍书", "Thư giới thiệu", "自己紹介書", "Surat lamaran")}
                    score={cScore}
                    empty={coverEmpty}
                    emptyHint={t("Step 2에서 자기소개서를 작성하면 여기에 미리보기가 나타나요.", "Write your cover letter in Step 2 to see a preview here.", "在Step 2撰写自我介绍后，这里会显示预览。", "Viết thư giới thiệu ở Step 2 để xem bản xem trước tại đây.", "Step 2で自己紹介書を作成するとここにプレビューが表示されます。", "Tulis surat lamaran di Step 2 untuk melihat pratinjau di sini.")}
                    openHref="/career-launch/cover-preview"
                    onEdit={() => void openEditor("cover")}
                    editing={editing === "cover"}
                    preview={<CoverRender data={cover} />}
                  />
                </div>
              </DashboardSection>

              {editError ? <p className="-mt-4 text-[14px] text-[#f04452]">{editError}</p> : null}
              {/* 면접 준비 요약 */}
              <DashboardSection title={t("면접 준비", "Interview prep", "面试准备", "Chuẩn bị phỏng vấn", "面接準備", "Persiapan wawancara")} sub={t("모의면접 연습 결과", "Your mock interview results", "模拟面试结果", "Kết quả phỏng vấn thử", "模擬面接の結果", "Hasil wawancara simulasi")}>
                <div className="flex items-center gap-3.5 rounded-3xl bg-[color:var(--v2-band)] p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[color:var(--v2-accent)]"><Microphone className="h-5 w-5" weight="duotone" aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    {iv ? (
                      <>
                        <p className="text-[14px] font-bold text-[color:var(--v2-ink)]">{t(`평균 ${iv.avg}점 · ${iv.count}문항 연습`, `Avg ${iv.avg} · ${iv.count} questions`, `平均 ${iv.avg}分 · 练习 ${iv.count} 题`, `TB ${iv.avg} · ${iv.count} câu`, `平均 ${iv.avg}点 · ${iv.count}問`, `Rata ${iv.avg} · ${iv.count} soal`)}</p>
                        <p className="mt-0.5 text-[12px] text-[color:var(--v2-faint)]">{t("면접 히스토리와 피드백을 확인해요.", "Review your interview history and feedback.", "查看面试记录与反馈。", "Xem lịch sử và phản hồi phỏng vấn.", "面接履歴とフィードバックを確認します。", "Lihat riwayat dan umpan balik wawancara.")}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[14px] font-bold text-[color:var(--v2-ink)]">{t("아직 모의면접 기록이 없어요", "No mock interviews yet", "还没有模拟面试记录", "Chưa có phỏng vấn thử", "まだ模擬面接の記録がありません", "Belum ada wawancara simulasi")}</p>
                        <p className="mt-0.5 text-[12px] text-[color:var(--v2-faint)]">{t("Step 3에서 모의면접을 연습해 보세요.", "Practice mock interviews in Step 3.", "在Step 3练习模拟面试。", "Luyện phỏng vấn thử ở Step 3.", "Step 3で模擬面接を練習しましょう。", "Berlatih wawancara di Step 3.")}</p>
                      </>
                    )}
                  </div>
                  <Link href={iv ? "/career-launch/corrections" : "/career-launch/program?week=3"} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-[color:var(--v2-accent)] px-3.5 text-[14px] font-semibold text-white transition hover:opacity-90">{iv ? t("오답노트", "Review notes", "错题本", "Sổ lỗi", "復習ノート", "Catatan") : t("연습하기", "Practice", "练习", "Luyện", "練習", "Berlatih")} <ArrowRight className="h-3.5 w-3.5" weight="bold" /></Link>
                </div>
              </DashboardSection>
            </div>
          )}
        </div>
      </main>
      {choose ? (
        <Sheet
          title={t("어떤 내용으로 시작할까요?", "Which version to start from?", "从哪个版本开始？", "Bắt đầu từ bản nào?", "どちらの内容で始めますか？", "Mulai dari versi mana?")}
          subtitle={t("이제 내 이력서와 한 문서가 돼요", "Now one doc with My resume", "将与我的简历合为一份", "Gộp thành một với CV", "マイ履歴書と1つの文書に", "Jadi satu dengan resume")}
          onClose={() => setChoose(null)}
        >
          <div className="flex flex-col gap-2.5">
            <button type="button" disabled={editing !== null} onClick={() => void pick("launch")} className="rounded-2xl bg-[color:var(--v2-accent-weak)] px-4 py-4 text-left transition hover:opacity-90 disabled:opacity-60">
              <span className="block text-[16px] font-bold text-[color:var(--v2-ink)]">{t("커리어런치에서 쓴 내용", "What I wrote in Career Launch", "在 Career Launch 写的内容", "Nội dung viết ở Career Launch", "Career Launchで書いた内容", "Isi dari Career Launch")}</span>
              <span className="mt-0.5 block text-[14px] text-[color:var(--v2-muted)]">{t("프로그램에서 만든 내용으로 내 이력서를 채워요. 자격증·수상처럼 프로그램에 없는 항목은 그대로 둬요.", "Fill My resume with the program's version. Items the program doesn't have, like certificates, stay.", "用项目内容填充我的简历，证书、奖项等项目没有的条目保留。", "Điền CV của tôi bằng bản trong chương trình. Mục chương trình không có (chứng chỉ…) được giữ.", "プログラムの内容でマイ履歴書を埋めます。資格・受賞などは残します。", "Isi resume saya dengan versi program. Item seperti sertifikat tetap ada.")}</span>
            </button>
            <button type="button" disabled={editing !== null} onClick={() => void pick("talent")} className="rounded-2xl bg-[color:var(--v2-fill)] px-4 py-4 text-left transition hover:bg-[color:var(--v2-band)] disabled:opacity-60">
              <span className="block text-[16px] font-bold text-[color:var(--v2-ink)]">{t("내 이력서에 있던 내용", "What's already in My resume", "我的简历里已有的内容", "Nội dung có sẵn trong CV", "マイ履歴書の内容", "Isi resume saya yang ada")}</span>
              <span className="mt-0.5 block text-[14px] text-[color:var(--v2-muted)]">{t("에디터에서 쓰던 내용을 그대로 쓰고, 커리어런치 결과물도 그 내용으로 바뀌어요.", "Keep the editor's version; your Career Launch deliverable updates to match.", "沿用编辑器里的内容，Career Launch 成果也会随之更新。", "Giữ bản trong trình soạn; kết quả Career Launch cập nhật theo.", "エディタの内容をそのまま使い、Career Launchの成果物もそれに合わせます。", "Pakai versi editor; hasil Career Launch ikut diperbarui.")}</span>
            </button>
            {editing ? (
              <div className="flex justify-center py-2 text-[color:var(--v2-muted)]">
                <Spinner />
              </div>
            ) : null}
          </div>
        </Sheet>
      ) : null}
      <AplyFooter />
    </div>
  );
}
