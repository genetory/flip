"use client";

// 커리어런치 지원 현황 — 결과물로 실제 지원하고, 결과까지 기록해 다음 지원을 더 잘하게.
//  ① 지원 흐름(지원 → 서류 통과 → 면접 → 합격) 숫자
//  ② 이번 주 추천 공고(목표 직무·내 이력서 기준) → [지원 목록에 담기]
//  ③ 내 지원 — 단계 바꾸기, [공고 분석](강조할 점·부족한 점·예상 질문), 불합격이면 [불합격 회고] → 오답노트로 연습
// AI(공고 분석·회고)는 프로그램 기능이라 수강 중이면 포인트 없이 쓴다.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Plus, Sparkle, Trash } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../components/AplyFooter";
import { DashboardSection, ErrorState, CardSkeleton } from "../../../components/launch/dashboard-states";
import { Sheet } from "../../../components/v2/sheets";
import { Spinner } from "../../../components/v2/ui";
import { useLaunchT } from "../../../lib/launch/i18n";
import {
  APP_STAGES,
  addApplication,
  analyzeApplication,
  deleteApplication,
  fetchApplications,
  fetchJobRecs,
  retroApplication,
  updateApplication,
  type AppRecord,
  type AppStage,
  type AppSummary,
  type JobRec
} from "../../../lib/launch/applications";

type T = ReturnType<typeof useLaunchT>;

function stageLabel(t: T, s: AppStage): string {
  const L: Record<AppStage, [string, string, string, string, string, string]> = {
    planned: ["지원 예정", "Planned", "计划投递", "Dự định", "応募予定", "Rencana"],
    applied: ["지원 완료", "Applied", "已投递", "Đã nộp", "応募済み", "Dilamar"],
    doc_passed: ["서류 통과", "Passed screening", "简历通过", "Qua hồ sơ", "書類通過", "Lolos berkas"],
    interview: ["면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara"],
    offer: ["합격", "Offer", "录用", "Trúng tuyển", "内定", "Diterima"],
    rejected: ["불합격", "Rejected", "未通过", "Không đạt", "不合格", "Ditolak"],
    withdrawn: ["지원 취소", "Withdrawn", "已撤回", "Đã rút", "辞退", "Dibatalkan"]
  };
  return t(...L[s]);
}
const stageTone = (s: AppStage) =>
  s === "offer" ? "bg-[#effaf4] text-[color:var(--v2-good)]" : s === "rejected" || s === "withdrawn" ? "bg-[color:var(--v2-fill)] text-[color:var(--v2-muted)]" : s === "planned" ? "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-3)]" : "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]";

export default function CareerApplicationsPage() {
  const t = useLaunchT();
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [items, setItems] = useState<AppRecord[]>([]);
  const [summary, setSummary] = useState<AppSummary | null>(null);
  const [recs, setRecs] = useState<{ role: string; items: JobRec[]; reason?: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [retroFor, setRetroFor] = useState<AppRecord | null>(null);
  const [jdFor, setJdFor] = useState<AppRecord | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fail = t("잠시 후 다시 해 보세요.", "Please try again soon.", "请稍后再试。", "Vui lòng thử lại sau.", "少し後でお試しください。", "Coba lagi nanti.");
  const reload = useCallback(() => {
    fetchApplications()
      .then((r) => {
        setItems(r.items);
        setSummary(r.summary);
        setPhase("ready");
      })
      .catch(() => setPhase("error"));
    fetchJobRecs()
      .then(setRecs)
      .catch(() => setRecs({ role: "", items: [], reason: "error" }));
  }, []);
  useEffect(() => {
    let alive = true;
    Promise.all([fetchApplications(), fetchJobRecs().catch(() => ({ role: "", items: [] as JobRec[], reason: "error" }))])
      .then(([a, r]) => {
        if (!alive) return;
        setItems(a.items);
        setSummary(a.summary);
        setRecs(r);
        setPhase("ready");
      })
      .catch(() => alive && setPhase("error"));
    return () => {
      alive = false;
    };
  }, []);

  const replace = (row: AppRecord) => setItems((prev) => [row, ...prev.filter((x) => x.id !== row.id)]);
  const run = async (key: string, job: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await job();
    } catch (e) {
      setError((e as { message?: string })?.message || fail);
    } finally {
      setBusy(null);
    }
  };

  const save = (rec: JobRec) =>
    run(`rec-${rec.id}`, async () => {
      replace(await addApplication({ positionId: rec.id }));
      setRecs((r) => (r ? { ...r, items: r.items.filter((x) => x.id !== rec.id) } : r));
      reload();
    });
  const setStage = (row: AppRecord, stage: AppStage) =>
    run(`stage-${row.id}`, async () => {
      const updated = await updateApplication(row.id, { stage });
      replace(updated);
      if (stage === "rejected") setRetroFor(updated);
      reload();
    });
  const analyze = (row: AppRecord, jdText?: string) =>
    run(`an-${row.id}`, async () => {
      if (!row.positionId && !jdText) {
        setJdFor(row);
        return;
      }
      replace(await analyzeApplication(row.id, jdText));
      setJdFor(null);
    });
  const remove = (row: AppRecord) =>
    run(`del-${row.id}`, async () => {
      if (!window.confirm(t("이 지원 기록을 지울까요?", "Delete this record?", "删除这条记录？", "Xóa mục này?", "この記録を削除しますか？", "Hapus catatan ini?"))) return;
      await deleteApplication(row.id);
      setItems((p) => p.filter((x) => x.id !== row.id));
      reload();
    });

  return (
    <div className="cl-surface flex min-h-screen flex-col bg-[color:var(--v2-bg,#fff)]">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          <p className="text-[15px] font-semibold text-[color:var(--v2-muted)]">Career Launch</p>
          <h1 className="mt-1.5 text-[26px] font-bold leading-[1.38] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[30px]">{t("지원 현황", "Applications", "投递进度", "Ứng tuyển", "応募状況", "Lamaran")}</h1>
          <p className="mt-2.5 max-w-[52ch] break-keep text-[17px] leading-[1.6] text-[color:var(--v2-ink-3)]">
            {t("완성한 서류로 실제 지원하고, 결과까지 기록해요. 떨어져도 원인을 짚고 다음 지원을 더 잘 준비해요.", "Apply with the documents you built and track results. If it doesn't work out, find out why and prepare better.", "用完成的材料真正投递并记录结果。即使未通过，也找出原因，更好地准备下一次。", "Ứng tuyển bằng hồ sơ đã làm và ghi lại kết quả. Nếu trượt, tìm nguyên nhân để chuẩn bị tốt hơn.", "完成した書類で実際に応募し、結果まで記録。不合格でも原因を探り、次に備えます。", "Lamar dengan dokumen yang kamu buat dan catat hasilnya. Jika gagal, cari penyebab dan bersiap lebih baik.")}
          </p>
          <hr className="mt-6 h-px border-0 bg-[color:var(--v2-line)]" />

          {phase === "loading" ? (
            <div className="mt-6 flex flex-col gap-3">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : phase === "error" ? (
            <div className="mt-6">
              <ErrorState onRetry={reload} />
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-8">
              {summary ? <Funnel t={t} s={summary} /> : null}
              {error ? <p className="-mt-4 text-[14px] text-[#f04452]">{error}</p> : null}

              {/* 이번 주 추천 공고 */}
              <DashboardSection
                title={t("이번 주 추천 공고", "Picks for this week", "本周推荐职位", "Gợi ý tuần này", "今週のおすすめ求人", "Rekomendasi minggu ini")}
                sub={recs?.role ? t(`${recs.role} · 내 이력서 기준`, `For ${recs.role} · based on your resume`, `${recs.role} · 基于我的简历`, `${recs.role} · theo CV của bạn`, `${recs.role}・履歴書基準`, `${recs.role} · dari resume-mu`) : t("내 이력서 기준", "Based on your resume", "基于我的简历", "Theo CV của bạn", "履歴書基準", "Dari resume-mu")}
              >
                {!recs ? (
                  <CardSkeleton />
                ) : recs.items.length === 0 ? (
                  <div className="rounded-3xl bg-[color:var(--v2-band)] px-5 py-6 text-center">
                    <p className="break-keep text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">
                      {recs.reason === "no_profile"
                        ? t("목표 직무를 정하거나 이력서를 쓰면 맞는 공고를 골라 드려요.", "Set a target role or write your resume to get picks.", "确定目标岗位或撰写简历后即可推荐。", "Chọn vị trí mục tiêu hoặc viết CV để nhận gợi ý.", "目標職種か履歴書があればおすすめします。", "Tentukan target atau tulis resume untuk rekomendasi.")
                        : t("지금은 맞는 공고가 없어요. 새 공고가 올라오면 다시 골라 드릴게요.", "No matching jobs right now. We'll pick again as new jobs come in.", "暂时没有合适的职位，有新职位会再推荐。", "Chưa có tin phù hợp. Sẽ gợi ý khi có tin mới.", "今は合う求人がありません。新着があればまたおすすめします。", "Belum ada yang cocok. Kami cari lagi saat ada lowongan baru.")}
                    </p>
                    {recs.reason === "no_profile" ? (
                      <Link href="/career-launch/program" className="mt-3 inline-flex h-9 items-center gap-1 rounded-lg bg-white px-3.5 text-[14px] font-semibold text-[color:var(--v2-accent)]">
                        {t("프로그램으로", "Go to program", "前往项目", "Đến chương trình", "プログラムへ", "Ke program")} <ArrowRight className="h-3.5 w-3.5" weight="bold" />
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <ul className="grid gap-3 md:grid-cols-2">
                    {recs.items.map((r) => (
                      <li key={r.id} className="flex flex-col rounded-3xl bg-[color:var(--v2-band)] p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-[color:var(--v2-muted)]">{r.companyName || t("회사 미상", "Company", "公司", "Công ty", "企業", "Perusahaan")}</p>
                            <p className="mt-0.5 line-clamp-2 break-keep text-[16px] font-bold leading-[1.4] text-[color:var(--v2-ink)]">{r.title}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[13px] font-bold tabular-nums text-[color:var(--v2-accent)]">{r.matchScore}%</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {r.foreignerFriendly ? <Chip>{t("외국인 지원 가능", "Foreigner-friendly", "可外国人投递", "Nhận người nước ngoài", "外国人応募可", "Ramah WNA")}</Chip> : null}
                          {r.external ? <Chip>{t("외부 공고", "External", "外部职位", "Tin bên ngoài", "外部求人", "Eksternal")}</Chip> : null}
                          {r.workLocation ? <Chip>{r.workLocation.slice(0, 16)}</Chip> : null}
                        </div>
                        <div className="mt-4 flex gap-2">
                          <a href={`/talent/jobs/${encodeURIComponent(r.id)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl bg-white text-[14px] font-semibold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-line)]">
                            {t("공고 보기", "View job", "查看职位", "Xem tin", "求人を見る", "Lihat")} <ArrowUpRight className="h-3.5 w-3.5" weight="bold" />
                          </a>
                          <button type="button" disabled={busy === `rec-${r.id}`} onClick={() => void save(r)} className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl bg-[color:var(--v2-accent)] text-[14px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
                            {busy === `rec-${r.id}` ? <Spinner /> : <Plus className="h-3.5 w-3.5" weight="bold" />} {t("지원 목록에 담기", "Add to list", "加入列表", "Thêm vào danh sách", "リストに追加", "Tambah")}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </DashboardSection>

              {/* 내 지원 */}
              <DashboardSection title={t("내 지원", "My applications", "我的投递", "Đơn của tôi", "私の応募", "Lamaranku")} sub={t("단계를 바꾸면 흐름에 반영돼요", "Change the stage as things progress", "随进展更新阶段", "Cập nhật giai đoạn theo tiến độ", "進み具合に合わせて段階を変更", "Ubah tahap sesuai progres")}>
                <div className="flex flex-col gap-3">
                  {items.map((row) => (
                    <AppCard key={row.id} t={t} row={row} busy={busy} onStage={(s) => void setStage(row, s)} onAnalyze={() => void analyze(row)} onRetro={() => setRetroFor(row)} onDelete={() => void remove(row)} />
                  ))}
                  <button type="button" onClick={() => setAdding(true)} className="flex h-14 items-center justify-center gap-1.5 rounded-3xl border-2 border-dashed border-[color:var(--v2-line)] text-[15px] font-semibold text-[color:var(--v2-muted)] transition hover:border-[color:var(--v2-accent)] hover:text-[color:var(--v2-accent)]">
                    <Plus className="h-4 w-4" weight="bold" /> {t("다른 곳에 지원한 것도 기록하기", "Log an application from elsewhere", "记录其他平台的投递", "Ghi đơn ở nơi khác", "他サイトの応募も記録", "Catat lamaran dari tempat lain")}
                  </button>
                </div>
              </DashboardSection>
            </div>
          )}
        </div>
      </main>

      {adding ? <AddSheet t={t} onClose={() => setAdding(false)} onAdded={(row) => { replace(row); setAdding(false); reload(); }} /> : null}
      {jdFor ? <JdSheet t={t} row={jdFor} busy={busy === `an-${jdFor.id}`} onClose={() => setJdFor(null)} onSubmit={(text) => void analyze(jdFor, text)} /> : null}
      {retroFor ? <RetroSheet t={t} row={retroFor} onClose={() => setRetroFor(null)} onDone={(row) => { replace(row); setRetroFor(null); }} /> : null}
      <AplyFooter />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-[color:var(--v2-ink-3)]">{children}</span>;
}

/** 지원 흐름 숫자 — 지원 → 서류 통과 → 면접 → 합격. */
function Funnel({ t, s }: { t: T; s: AppSummary }) {
  const cells = [
    { label: t("지원", "Applied", "投递", "Đã nộp", "応募", "Dilamar"), n: s.applied },
    { label: t("서류 통과", "Screening", "简历通过", "Qua hồ sơ", "書類通過", "Lolos berkas"), n: s.docPassed },
    { label: t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara"), n: s.interview },
    { label: t("합격", "Offer", "录用", "Trúng tuyển", "内定", "Diterima"), n: s.offer }
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {cells.map((c, i) => (
        <div key={c.label} className={`rounded-2xl px-2 py-4 text-center ${i === 3 && c.n > 0 ? "bg-[#effaf4]" : "bg-[color:var(--v2-band)]"}`}>
          <p className={`text-[26px] font-bold tabular-nums leading-none ${i === 3 && c.n > 0 ? "text-[color:var(--v2-good)]" : "text-[color:var(--v2-ink)]"}`}>{c.n}</p>
          <p className="mt-1.5 truncate text-[12.5px] font-semibold text-[color:var(--v2-muted)]">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

function List({ title, items, tone = "plain" }: { title: string; items: string[]; tone?: "good" | "bad" | "plain" }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className={`text-[13px] font-bold ${tone === "good" ? "text-[color:var(--v2-good)]" : tone === "bad" ? "text-[color:var(--v2-attention)]" : "text-[color:var(--v2-ink-2)]"}`}>{title}</p>
      <ul className="mt-1 flex flex-col gap-1">
        {items.map((x, i) => (
          <li key={i} className="flex gap-1.5 break-keep text-[14px] leading-[1.55] text-[color:var(--v2-ink-3)]">
            <span aria-hidden>·</span>
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AppCard({ t, row, busy, onStage, onAnalyze, onRetro, onDelete }: { t: T; row: AppRecord; busy: string | null; onStage: (s: AppStage) => void; onAnalyze: () => void; onRetro: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const a = row.analysis;
  const r = row.retro;
  return (
    <article className="rounded-3xl bg-[color:var(--v2-band)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[color:var(--v2-muted)]">{row.companyName || "—"}</p>
          <p className="mt-0.5 break-keep text-[17px] font-bold leading-[1.4] text-[color:var(--v2-ink)]">{row.jobTitle || "—"}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[13px] font-bold ${stageTone(row.stage)}`}>
          {stageLabel(t, row.stage)}
          {row.stage === "rejected" && row.rejectedAtStage ? ` · ${row.rejectedAtStage === "doc" ? t("서류", "Docs", "简历", "Hồ sơ", "書類", "Berkas") : t("면접", "Interview", "面试", "PV", "面接", "Wawancara")}` : ""}
        </span>
      </div>

      {/* 단계 — 칩으로 바로 바꾸기 */}
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {APP_STAGES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy === `stage-${row.id}`}
            onClick={() => s !== row.stage && onStage(s)}
            aria-pressed={s === row.stage}
            className={`h-8 shrink-0 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold transition ${s === row.stage ? "bg-[color:var(--v2-ink)] text-white" : "bg-white text-[color:var(--v2-ink-3)] hover:bg-[color:var(--v2-line)]"}`}
          >
            {stageLabel(t, s)}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {a ? (
          <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex h-9 items-center gap-1 rounded-lg bg-white px-3 text-[14px] font-semibold text-[color:var(--v2-accent)]">
            <Sparkle className="h-3.5 w-3.5" weight="fill" /> {open ? t("분석 접기", "Hide analysis", "收起分析", "Ẩn phân tích", "分析を閉じる", "Tutup") : t("공고 분석 보기", "View analysis", "查看分析", "Xem phân tích", "分析を見る", "Lihat analisis")}
          </button>
        ) : (
          <button type="button" disabled={busy === `an-${row.id}`} onClick={onAnalyze} className="inline-flex h-9 items-center gap-1 rounded-lg bg-white px-3 text-[14px] font-semibold text-[color:var(--v2-accent)] disabled:opacity-60">
            {busy === `an-${row.id}` ? <Spinner /> : <Sparkle className="h-3.5 w-3.5" weight="fill" />} {t("이 공고에 맞춰 분석", "Analyze for this job", "按此职位分析", "Phân tích theo tin", "この求人で分析", "Analisis lowongan")}
          </button>
        )}
        {row.stage === "rejected" && !r ? (
          <button type="button" onClick={onRetro} className="inline-flex h-9 items-center gap-1 rounded-lg bg-[color:var(--v2-ink)] px-3 text-[14px] font-semibold text-white">
            {t("불합격 회고하기", "Review the rejection", "复盘未通过", "Rút kinh nghiệm", "不合格を振り返る", "Evaluasi")}
          </button>
        ) : null}
        {row.sourceUrl ? (
          <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[14px] font-semibold text-[color:var(--v2-muted)] hover:text-[color:var(--v2-ink-3)]">
            {t("공고", "Job", "职位", "Tin", "求人", "Lowongan")} <ArrowUpRight className="h-3.5 w-3.5" weight="bold" />
          </a>
        ) : row.positionId ? (
          <a href={`/talent/jobs/${encodeURIComponent(row.positionId)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[14px] font-semibold text-[color:var(--v2-muted)] hover:text-[color:var(--v2-ink-3)]">
            {t("공고", "Job", "职位", "Tin", "求人", "Lowongan")} <ArrowUpRight className="h-3.5 w-3.5" weight="bold" />
          </a>
        ) : null}
        <button type="button" onClick={onDelete} aria-label={t("지우기", "Delete", "删除", "Xóa", "削除", "Hapus")} className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--v2-faint)] hover:text-[#f04452]">
          <Trash className="h-4 w-4" />
        </button>
      </div>

      {a && open ? (
        <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-white p-4">
          {a.fit ? <p className="break-keep text-[15px] font-semibold leading-[1.55] text-[color:var(--v2-ink-2)]">{a.fit}</p> : null}
          <List title={t("이미 갖춘 것", "You already have", "已具备", "Bạn đã có", "すでにあるもの", "Sudah dimiliki")} items={a.matched} tone="good" />
          <List title={t("부족한 것", "Gaps", "不足之处", "Còn thiếu", "足りないもの", "Kekurangan")} items={a.missing} tone="bad" />
          <List title={t("이력서에서 강조", "Emphasize in resume", "简历中强调", "Nhấn mạnh trong CV", "履歴書で強調", "Tonjolkan di resume")} items={a.emphasizeInResume} />
          <List title={t("자기소개서에서 강조", "Emphasize in cover letter", "自我介绍中强调", "Nhấn mạnh trong thư", "自己紹介書で強調", "Tonjolkan di surat")} items={a.emphasizeInCover} />
          <List title={t("면접 예상 질문", "Likely interview questions", "面试预测问题", "Câu hỏi dự kiến", "想定質問", "Pertanyaan wawancara")} items={a.likelyInterview} />
          <Link href="/career-launch/deliverables" className="inline-flex h-9 w-fit items-center gap-1 rounded-lg bg-[color:var(--v2-accent-weak)] px-3 text-[14px] font-semibold text-[color:var(--v2-accent)]">
            {t("내 서류 고치러 가기", "Edit my documents", "去修改材料", "Sửa hồ sơ", "書類を直す", "Edit dokumen")} <ArrowRight className="h-3.5 w-3.5" weight="bold" />
          </Link>
        </div>
      ) : null}

      {r ? (
        <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-white p-4">
          <p className="text-[13px] font-bold text-[color:var(--v2-ink-2)]">{t("불합격 회고", "Rejection review", "未通过复盘", "Rút kinh nghiệm", "不合格の振り返り", "Evaluasi")}</p>
          {r.summary ? <p className="break-keep text-[15px] font-semibold leading-[1.55] text-[color:var(--v2-ink-2)]">{r.summary}</p> : null}
          <List title={t("짐작되는 원인", "Possible causes", "可能原因", "Nguyên nhân có thể", "考えられる原因", "Kemungkinan penyebab")} items={r.likelyCauses} tone="bad" />
          <List title={t("다음 지원 전에 할 것", "Before your next application", "下次投递前要做的", "Trước lần nộp tới", "次の応募までに", "Sebelum melamar lagi")} items={r.nextActions} tone="good" />
          {r.correctionIds?.length ? (
            <Link href="/career-launch/corrections" className="inline-flex h-9 w-fit items-center gap-1 rounded-lg bg-[color:var(--v2-ink)] px-3 text-[14px] font-semibold text-white">
              {t(`오답노트에서 ${r.correctionIds.length}문항 연습하기`, `Practice ${r.correctionIds.length} in review notes`, `在错题本练习 ${r.correctionIds.length} 题`, `Luyện ${r.correctionIds.length} câu`, `復習ノートで${r.correctionIds.length}問練習`, `Latih ${r.correctionIds.length} soal`)} <ArrowRight className="h-3.5 w-3.5" weight="bold" />
            </Link>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

const inputCls = "h-12 w-full rounded-xl bg-[color:var(--v2-fill)] px-4 text-[16px] text-[color:var(--v2-ink)] outline-none ring-1 ring-transparent transition placeholder:text-[color:var(--v2-faint)] focus:bg-white focus:ring-2 focus:ring-[color:var(--v2-accent)]";
const areaCls = "w-full resize-none rounded-xl bg-[color:var(--v2-fill)] p-4 text-[15px] leading-[1.6] text-[color:var(--v2-ink)] outline-none ring-1 ring-transparent transition placeholder:text-[color:var(--v2-faint)] focus:bg-white focus:ring-2 focus:ring-[color:var(--v2-accent)]";
function PrimaryBtn({ onClick, disabled, busy, children }: { onClick: () => void; disabled?: boolean; busy?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled || busy} className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-[color:var(--v2-accent)] text-[16px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
      {busy ? <Spinner /> : null}
      {children}
    </button>
  );
}

/** 다른 곳에 지원한 것 기록 — 회사·직무·링크·단계. */
function AddSheet({ t, onClose, onAdded }: { t: T; onClose: () => void; onAdded: (row: AppRecord) => void }) {
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [stage, setStage] = useState<AppStage>("applied");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      onAdded(await addApplication({ companyName: company.trim(), jobTitle: title.trim(), sourceUrl: url.trim() || undefined, stage }));
    } catch (e) {
      setErr((e as { message?: string })?.message || null);
      setBusy(false);
    }
  };
  return (
    <Sheet title={t("지원 기록하기", "Log an application", "记录投递", "Ghi đơn ứng tuyển", "応募を記録", "Catat lamaran")} onClose={onClose} footer={<PrimaryBtn onClick={() => void submit()} disabled={!company.trim() && !title.trim()} busy={busy}>{t("기록하기", "Save", "保存", "Lưu", "記録する", "Simpan")}</PrimaryBtn>}>
      <div className="flex flex-col gap-3">
        <input className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t("회사 이름", "Company", "公司名称", "Tên công ty", "会社名", "Perusahaan")} maxLength={120} />
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("직무", "Role", "岗位", "Vị trí", "職種", "Posisi")} maxLength={160} />
        <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t("공고 링크(선택)", "Job link (optional)", "职位链接（可选）", "Link tin (tùy chọn)", "求人リンク（任意）", "Tautan (opsional)")} maxLength={500} inputMode="url" />
        <div className="flex flex-wrap gap-1.5">
          {(["planned", "applied", "doc_passed", "interview"] as AppStage[]).map((s) => (
            <button key={s} type="button" onClick={() => setStage(s)} aria-pressed={s === stage} className={`h-9 rounded-full px-3.5 text-[14px] font-semibold ${s === stage ? "bg-[color:var(--v2-ink)] text-white" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-3)]"}`}>
              {stageLabel(t, s)}
            </button>
          ))}
        </div>
        {err ? <p className="text-[14px] text-[#f04452]">{err}</p> : null}
      </div>
    </Sheet>
  );
}

/** 외부 공고 분석 — 공고 본문 붙여 넣기. */
function JdSheet({ t, row, busy, onClose, onSubmit }: { t: T; row: AppRecord; busy: boolean; onClose: () => void; onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <Sheet title={t("공고 내용 붙여 넣기", "Paste the job posting", "粘贴职位内容", "Dán nội dung tin", "求人内容を貼り付け", "Tempel lowongan")} subtitle={[row.companyName, row.jobTitle].filter(Boolean).join(" · ")} onClose={onClose} footer={<PrimaryBtn onClick={() => onSubmit(text.trim())} disabled={text.trim().length < 40} busy={busy}>{t("분석하기", "Analyze", "分析", "Phân tích", "分析する", "Analisis")}</PrimaryBtn>}>
      <textarea className={areaCls} rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("주요 업무·자격 요건·우대 사항을 붙여 넣어 주세요.", "Paste responsibilities, requirements and preferred qualifications.", "请粘贴主要职责、任职要求和优先条件。", "Dán mô tả công việc, yêu cầu và ưu tiên.", "業務内容・応募資格・歓迎条件を貼り付けてください。", "Tempel tugas, syarat, dan nilai tambah.")} />
    </Sheet>
  );
}

/** 불합격 회고 — 어느 단계였는지 · 메모 · (면접이면) 받은 질문 → AI 회고 + 오답노트. */
function RetroSheet({ t, row, onClose, onDone }: { t: T; row: AppRecord; onClose: () => void; onDone: (row: AppRecord) => void }) {
  const [at, setAt] = useState<"doc" | "interview">(row.rejectedAtStage ?? "doc");
  const [memo, setMemo] = useState("");
  const [qs, setQs] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (at !== row.rejectedAtStage) await updateApplication(row.id, { rejectedAtStage: at });
      const questions = at === "interview" ? qs.split("\n").map((x) => x.trim()).filter((x) => x.length >= 2).slice(0, 8) : [];
      const r = await retroApplication(row.id, { memo: memo.trim() || undefined, questions });
      onDone(r.item);
    } catch (e) {
      setErr((e as { message?: string })?.message || t("회고를 만들지 못했어요. 잠시 후 다시 해 보세요.", "Couldn't create the review. Try again soon.", "无法生成复盘，请稍后再试。", "Không tạo được. Thử lại sau.", "作成できませんでした。", "Gagal membuat evaluasi."));
      setBusy(false);
    }
  };
  return (
    <Sheet
      tall
      title={t("불합격 회고", "Rejection review", "未通过复盘", "Rút kinh nghiệm", "不合格の振り返り", "Evaluasi")}
      subtitle={t("떨어진 이유를 짚고 다음 지원을 준비해요", "Find out why and prepare for next time", "找出原因，准备下一次", "Tìm nguyên nhân, chuẩn bị lần sau", "原因を探り次に備える", "Cari penyebab, siapkan berikutnya")}
      onClose={onClose}
      footer={<PrimaryBtn onClick={() => void submit()} busy={busy}>{t("AI 회고 받기", "Get AI review", "获取 AI 复盘", "Nhận đánh giá AI", "AIの振り返り", "Dapatkan evaluasi AI")}</PrimaryBtn>}
    >
      <p className="text-[15px] font-bold text-[color:var(--v2-ink)]">{t("어느 단계에서 떨어졌나요?", "At which stage?", "在哪个阶段未通过？", "Trượt ở giai đoạn nào?", "どの段階で？", "Di tahap mana?")}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {(["doc", "interview"] as const).map((v) => (
          <button key={v} type="button" onClick={() => setAt(v)} aria-pressed={at === v} className={`h-11 rounded-xl text-[15px] font-semibold ${at === v ? "bg-[color:var(--v2-ink)] text-white" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-3)]"}`}>
            {v === "doc" ? t("서류", "Documents", "简历", "Hồ sơ", "書類", "Berkas") : t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara")}
          </button>
        ))}
      </div>
      {at === "interview" ? (
        <>
          <p className="mt-5 text-[15px] font-bold text-[color:var(--v2-ink)]">{t("면접에서 받은 질문 (기억나는 만큼)", "Questions you were asked", "面试中被问到的问题", "Câu hỏi đã được hỏi", "面接で聞かれた質問", "Pertanyaan yang ditanyakan")}</p>
          <textarea className={`${areaCls} mt-2`} rows={4} value={qs} onChange={(e) => setQs(e.target.value)} placeholder={t("한 줄에 하나씩 — 오답노트에서 다시 연습하게 돼요.", "One per line — you'll practice them in review notes.", "每行一个——会加入错题本练习。", "Mỗi dòng một câu — sẽ luyện lại trong sổ.", "1行に1つ — 復習ノートで練習します。", "Satu per baris — akan dilatih lagi.")} />
        </>
      ) : null}
      <p className="mt-5 text-[15px] font-bold text-[color:var(--v2-ink)]">{t("메모 (선택)", "Notes (optional)", "备注（可选）", "Ghi chú (tùy chọn)", "メモ（任意）", "Catatan (opsional)")}</p>
      <textarea className={`${areaCls} mt-2`} rows={3} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder={t("받은 피드백, 아쉬웠던 점 등", "Feedback you got, what felt off, etc.", "收到的反馈、遗憾之处等", "Phản hồi nhận được, điều chưa tốt…", "もらったフィードバック、心残りなど", "Masukan yang diterima, dll.")} />
      {err ? <p className="mt-3 text-[14px] text-[#f04452]">{err}</p> : null}
    </Sheet>
  );
}
