"use client";

// Week 2 '실제 지원 가능한 서류 완성'(Phase 5) 핵심 흐름 카드 —
// 기준 공고 → 요구역량 분석 → 공고맞춤 이력서·자소서(문장별 근거) → 일관성 검사 → 점수/Readiness → 최종 확정 → Week3 예상 질문.
// 기존 디자인 토큰/카드 패턴 재사용. 재진입 시 fetchWeek2Status 로 상태 복원.
import { useEffect, useRef, useState } from "react";
import { CircleNotch, Sparkle, CheckCircle, Warning, ShieldCheck } from "@phosphor-icons/react";
import { Card, Pill, SectionTitle } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";
import { trackCareerFunnel } from "../../lib/analytics";
import {
  fetchWeek2Status,
  createApplicationTarget,
  structureTarget,
  analyzeTarget,
  generateResumeVersion,
  fetchCoverPrompts,
  generateCoverVersion,
  runConsistencyCheck,
  resolveConsistency,
  computeScores,
  finalizePackage,
  generateInterviewQuestions,
  type Week2Status,
  type ApplicationTarget,
  type ConsistencyFinding,
  type ScoreData
} from "../../lib/launch/week2";
import { getMyFavoritePositions, getMyAppliedPositions, getPublicPositionsPage, type PublicPositionListItem } from "../../lib/member-profile-client";
import { fetchJobPosting } from "../../lib/resume-maker-client";

export function Week2PackageCard() {
  const t = useLaunchT();
  const [status, setStatus] = useState<Week2Status | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const alive = useRef(true);

  const reload = async () => {
    try {
      const s = await fetchWeek2Status();
      if (alive.current) {
        setStatus(s);
        setPhase("ready");
      }
    } catch {
      if (alive.current) setPhase("error");
    }
  };
  useEffect(() => {
    alive.current = true;
    trackCareerFunnel("career_week2_started");
    void reload();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "loading") return <Card><p className="flex items-center gap-2 py-6 text-[13px] text-[#8B95A1]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> {t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p></Card>;
  if (phase === "error" || !status) return <Card><p className="py-4 text-[13px] text-[#8B95A1]">{t("불러오지 못했어요.", "Couldn't load.", "加载失败。", "Không tải được.", "読み込めませんでした。", "Gagal memuat.")}</p><button type="button" onClick={() => void reload()} className="mt-2 rounded-lg border border-[#E5E8EB] px-3 py-1.5 text-[12px] font-semibold text-[#4E5968]">{t("다시 시도", "Retry", "重试", "Thử lại", "再試行", "Coba lagi")}</button></Card>;

  const target = status.targets[0] ?? null;

  return (
    <div className="space-y-4">
      {/* 진행 체크리스트 + Readiness */}
      <Card>
        <div className="flex items-center justify-between gap-2">
          <SectionTitle sub={t("실제 제출 가능한 지원서 한 세트", "One submittable application set", "一套可提交的申请材料", "Một bộ hồ sơ nộp được", "提出できる応募書類一式", "Satu set lamaran siap kirim")}>{t("지원 패키지 진행", "Application package", "申请材料进度", "Tiến độ bộ hồ sơ", "応募パッケージ進捗", "Progres paket lamaran")}</SectionTitle>
          <Pill tone={status.completion.complete ? "green" : "grey"}>{status.completion.doneCount}/11</Pill>
        </div>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {status.completion.checks.map((c) => (
            <li key={c.key} className="flex items-center gap-1.5 text-[12.5px]">
              <CheckCircle className={`h-4 w-4 shrink-0 ${c.done ? "text-[#0A9B59]" : "text-[#C9CDD2]"}`} weight={c.done ? "fill" : "regular"} />
              <span className={c.done ? "text-[#4E5968]" : "text-[#8B95A1]"}>{c.label}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* 기준 공고 */}
      <TargetSection target={target} onChanged={reload} />

      {/* 공고맞춤 서류 */}
      {target && target.status === "analyzed" ? <DocumentsSection status={status} target={target} onChanged={reload} /> : null}

      {/* 일관성 + 점수 + 확정 */}
      {target && status.versions.some((v) => v.documentType === "resume") ? <ReviewSection status={status} target={target} onChanged={reload} /> : null}
    </div>
  );
}

// ── 기준 공고(우리 공고 선택 / 검색 / 링크 / 붙여넣기 → 구조화 → 분석) ──
type TargetMode = "internal" | "search" | "url" | "paste";
function posCompany(p: PublicPositionListItem): string {
  return p.sourceCompanyName || p.partnerOrganization?.name || "";
}
// 내부 공고 → 분석 시드용 텍스트(서버가 Position 에서 구조화 못 하면 이 원문으로 폴백 구조화).
function posToRaw(p: PublicPositionListItem): string {
  return [
    p.title,
    posCompany(p),
    p.mainResponsibilities ? `주요업무:\n${p.mainResponsibilities}` : "",
    p.requiredQualifications ? `자격요건:\n${p.requiredQualifications}` : "",
    p.preferredQualifications ? `우대사항:\n${p.preferredQualifications}` : "",
    p.additionalNotes ? `기타:\n${p.additionalNotes}` : ""
  ].filter(Boolean).join("\n\n");
}
function TargetSection({ target, onChanged }: { target: ApplicationTarget | null; onChanged: () => Promise<void> }) {
  const t = useLaunchT();
  const [mode, setMode] = useState<TargetMode>("internal");
  const [raw, setRaw] = useState("");
  const [url, setUrl] = useState("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PublicPositionListItem[]>([]);
  const [mine, setMine] = useState<PublicPositionListItem[] | null>(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  // 내 공고(찜/지원) 지연 로드.
  useEffect(() => {
    if (target || mode !== "internal" || mine !== null) return;
    let alive = true;
    setBusy("mine");
    void (async () => {
      try {
        const [fav, applied] = await Promise.all([
          getMyFavoritePositions().catch(() => [] as PublicPositionListItem[]),
          getMyAppliedPositions().catch(() => [] as PublicPositionListItem[])
        ]);
        const map = new Map<string, PublicPositionListItem>();
        [...applied, ...fav].forEach((p) => map.set(p.id, p));
        if (alive) setMine(Array.from(map.values()));
      } finally {
        if (alive) setBusy("");
      }
    })();
    return () => {
      alive = false;
    };
  }, [target, mode, mine]);

  // 우리 공고 선택(내부) — 서버가 Position 에서 구조화 시드. 시드 실패 시 원문으로 폴백 구조화.
  const pickPosition = async (p: PublicPositionListItem) => {
    setBusy("create");
    setErr("");
    try {
      const created = await createApplicationTarget({ sourceType: "internal", positionId: p.id, companyName: posCompany(p), jobTitle: p.title, rawContent: posToRaw(p) });
      trackCareerFunnel("career_application_target_selected", { applicationTargetSource: "internal" });
      if (created.status !== "structured") await structureTarget(created.id);
      await onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy("");
    }
  };

  const runSearch = async () => {
    const kw = q.trim();
    if (!kw) return;
    setBusy("search");
    setErr("");
    try {
      const page = await getPublicPositionsPage({ search: kw, limit: 20 });
      setResults(page.items);
      if (page.items.length === 0) setErr(t("검색 결과가 없어요. 다른 키워드로 찾아보세요.", "No results. Try another keyword.", "无结果，换个关键词。", "Không có kết quả. Thử từ khóa khác.", "結果なし。別のキーワードで。", "Tidak ada hasil. Coba kata kunci lain."));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy("");
    }
  };

  const createFromUrl = async () => {
    const clean = url.trim();
    if (!clean) return;
    setBusy("url");
    setErr("");
    try {
      const text = await fetchJobPosting(clean);
      if (!text || text.trim().length < 30) {
        setErr(t("공고 내용을 불러오지 못했어요. 내용을 직접 붙여넣어 주세요.", "Couldn't read the posting. Paste the content directly.", "无法读取公告，请直接粘贴内容。", "Không đọc được tin. Hãy dán nội dung trực tiếp.", "求人を読み取れませんでした。内容を貼り付けてください。", "Tidak bisa membaca lowongan. Tempel isinya langsung."));
        return;
      }
      const created = await createApplicationTarget({ sourceType: "url", sourceUrl: clean, rawContent: text });
      trackCareerFunnel("career_application_target_selected", { applicationTargetSource: "url" });
      await structureTarget(created.id);
      await onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy("");
    }
  };

  const create = async () => {
    if (!raw.trim()) return;
    setBusy("create");
    setErr("");
    try {
      const created = await createApplicationTarget({ sourceType: "paste", rawContent: raw });
      trackCareerFunnel("career_application_target_selected", { applicationTargetSource: "paste" });
      await structureTarget(created.id);
      await onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy("");
    }
  };
  const analyze = async () => {
    if (!target) return;
    setBusy("analyze");
    setErr("");
    try {
      await analyzeTarget(target.id);
      trackCareerFunnel("career_job_posting_analyzed");
      await onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy("");
    }
  };

  const renderPos = (p: PublicPositionListItem) => (
    <button key={p.id} type="button" disabled={busy === "create"} onClick={() => void pickPosition(p)} className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#E5E8EB] px-3 py-2.5 text-left transition hover:border-[#0B46E8] disabled:opacity-50">
      <span className="min-w-0">
        <span className="block truncate text-[13.5px] font-bold text-[#191F28]">{p.title}</span>
        <span className="block truncate text-[12px] text-[#8B95A1]">{posCompany(p) || t("회사명 미정", "Company TBD", "公司待定", "Chưa rõ công ty", "会社未定", "Perusahaan TBD")}</span>
      </span>
      <span className="shrink-0 rounded-lg bg-[#F2F4F6] px-2.5 py-1 text-[11.5px] font-bold text-[#4E5968]">{t("선택", "Pick", "选择", "Chọn", "選択", "Pilih")}</span>
    </button>
  );

  return (
    <Card>
      <SectionTitle sub={t("우리 공고에서 고르거나 링크·붙여넣기로 가져오면 AI가 요구역량을 분석해요", "Pick from our postings or add via link/paste — AI analyzes the requirements", "从我们的公告中选择或用链接/粘贴导入，AI分析要求", "Chọn từ tin của chúng tôi hoặc thêm qua link/dán — AI phân tích yêu cầu", "求人から選ぶかリンク・貼付で取り込むとAIが要件を分析", "Pilih dari lowongan kami atau tambah via link/tempel — AI analisis syarat")}>{t("기준 채용공고", "Target job posting", "基准招聘公告", "Tin tuyển dụng mục tiêu", "基準求人", "Lowongan target")}</SectionTitle>
      {!target ? (
        <div className="mt-3">
          <div className="flex gap-1 rounded-xl bg-[#F2F4F6] p-1">
            {([
              ["internal", t("내 공고", "My postings", "我的公告", "Tin của tôi", "自分の求人", "Lowongan saya")],
              ["search", t("검색", "Search", "搜索", "Tìm", "検索", "Cari")],
              ["url", t("링크", "Link", "链接", "Link", "リンク", "Link")],
              ["paste", t("붙여넣기", "Paste", "粘贴", "Dán", "貼付", "Tempel")]
            ] as [TargetMode, string][]).map(([key, label]) => (
              <button key={key} type="button" onClick={() => { setMode(key); setErr(""); }} className={`flex-1 rounded-lg px-2 py-1.5 text-[12px] font-bold transition ${mode === key ? "bg-white text-[#191F28] shadow-sm" : "text-[#8B95A1]"}`}>{label}</button>
            ))}
          </div>

          <div className="mt-3">
            {mode === "internal" ? (
              busy === "mine" ? (
                <p className="flex items-center gap-2 py-4 text-[12.5px] text-[#8B95A1]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> {t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p>
              ) : mine && mine.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-[11.5px] text-[#8B95A1]">{t("찜하거나 지원한 공고에서 골라요", "Pick from postings you saved or applied to", "从收藏或已申请的公告中选择", "Chọn từ tin đã lưu hoặc đã ứng tuyển", "保存・応募した求人から選択", "Pilih dari lowongan yang disimpan/dilamar")}</p>
                  {mine.map((p) => renderPos(p))}
                </div>
              ) : (
                <p className="py-4 text-[12.5px] text-[#8B95A1]">{t("찜하거나 지원한 공고가 아직 없어요. '검색'이나 '링크'로 가져오세요.", "No saved or applied postings yet. Use Search or Link.", "还没有收藏或申请的公告，请用搜索或链接。", "Chưa có tin đã lưu/ứng tuyển. Dùng Tìm hoặc Link.", "保存・応募した求人がまだありません。検索かリンクを。", "Belum ada lowongan tersimpan/dilamar. Gunakan Cari atau Link.")}</p>
              )
            ) : null}

            {mode === "search" ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void runSearch(); }} placeholder={t("회사·직무로 검색", "Search company or role", "按公司/职位搜索", "Tìm theo công ty/vị trí", "会社・職種で検索", "Cari perusahaan/peran")} className="min-w-0 flex-1 rounded-xl border border-[#E5E8EB] px-3 py-2.5 text-[14px] outline-none focus:border-[#0B46E8]" />
                  <button type="button" onClick={() => void runSearch()} disabled={busy === "search" || !q.trim()} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
                    {busy === "search" ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : null}{t("검색", "Search", "搜索", "Tìm", "検索", "Cari")}
                  </button>
                </div>
                {results.length > 0 ? <div className="space-y-1.5">{results.map((p) => renderPos(p))}</div> : null}
              </div>
            ) : null}

            {mode === "url" ? (
              <div className="space-y-2">
                <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void createFromUrl(); }} placeholder={t("채용공고 링크 붙여넣기", "Paste job posting link", "粘贴招聘链接", "Dán link tin tuyển dụng", "求人リンクを貼付", "Tempel link lowongan")} className="w-full rounded-xl border border-[#E5E8EB] px-3 py-2.5 text-[14px] outline-none focus:border-[#0B46E8]" />
                <button type="button" onClick={() => void createFromUrl()} disabled={busy === "url" || !url.trim()} className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
                  {busy === "url" ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}{t("링크에서 가져오기", "Fetch from link", "从链接获取", "Lấy từ link", "リンクから取得", "Ambil dari link")}
                </button>
                <p className="text-[11.5px] text-[#8B95A1]">{t("일부 사이트는 로그인·차단으로 못 가져올 수 있어요. 그럴 땐 '붙여넣기'를 쓰세요.", "Some sites can't be read (login/blocking). Use Paste instead.", "部分网站因登录/拦截无法读取，请改用粘贴。", "Một số trang không đọc được (đăng nhập/chặn). Hãy dùng Dán.", "一部サイトはログイン等で取得不可。貼付をご利用ください。", "Beberapa situs tak terbaca. Gunakan Tempel.")}</p>
              </div>
            ) : null}

            {mode === "paste" ? (
              <div>
                <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={5} placeholder={t("채용공고 내용을 붙여넣어 주세요", "Paste the job posting here", "在此粘贴招聘公告", "Dán nội dung tin tuyển dụng", "求人内容を貼り付け", "Tempel isi lowongan")} className="w-full resize-none rounded-xl border border-[#E5E8EB] p-3 text-[16px] leading-relaxed outline-none focus:border-[#0B46E8]" />
                <button type="button" onClick={() => void create()} disabled={busy === "create" || !raw.trim()} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
                  {busy === "create" ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : null}{t("공고 등록", "Add posting", "登记公告", "Thêm tin", "求人を登録", "Tambah lowongan")}
                </button>
              </div>
            ) : null}

            {busy === "create" && (mode === "internal" || mode === "search") ? (
              <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#8B95A1]"><CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" /> {t("공고 등록 중…", "Adding…", "登记中…", "Đang thêm…", "登録中…", "Menambah…")}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[14px] font-black text-[#191F28]">{target.jobTitle || t("기준 공고", "Target posting", "基准公告", "Tin mục tiêu", "基準求人", "Lowongan")} {target.companyName ? <span className="text-[12px] font-semibold text-[#8B95A1]">· {target.companyName}</span> : null}</p>
            <Pill tone={target.status === "analyzed" ? "green" : "grey"}>{target.status === "analyzed" ? t("분석 완료", "Analyzed", "分析完成", "Đã phân tích", "分析完了", "Selesai dianalisis") : t("분석 전", "Not analyzed", "未分析", "Chưa phân tích", "未分析", "Belum dianalisis")}</Pill>
          </div>
          {target.status !== "analyzed" ? (
            <button type="button" onClick={() => void analyze()} disabled={busy === "analyze"} className="inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-60">
              {busy === "analyze" ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
              {t("요구역량 분석", "Analyze requirements", "分析要求", "Phân tích yêu cầu", "要件を分析", "Analisis syarat")}
            </button>
          ) : target.analysisData ? (
            <div className="space-y-1.5 rounded-xl bg-[#FAFBFC] p-3 text-[12.5px]">
              {target.analysisData.matched?.length ? <p><b className="text-[#3A6B00]">{t("이미 갖춘 부분", "Already have", "已具备", "Đã có", "既に持つ", "Sudah punya")}:</b> {target.analysisData.matched.map((m) => m.requirement).join(", ")}</p> : null}
              {target.analysisData.missing?.length ? <p><b className="text-[#C77700]">{t("부족한 부분", "Missing", "不足", "Thiếu", "不足", "Kurang")}:</b> {target.analysisData.missing.join(", ")}</p> : null}
              {target.analysisData.emphasizeInResume?.length ? <p><b className="text-[#0B46E8]">{t("이력서 강조", "Emphasize in resume", "简历强调", "Nhấn ở CV", "履歴書で強調", "Tekankan di resume")}:</b> {target.analysisData.emphasizeInResume.join(", ")}</p> : null}
              {target.analysisData.avoidOverclaiming?.length ? <p><b className="text-[#F04452]">{t("과장 금지", "Avoid overclaiming", "避免夸大", "Tránh phóng đại", "誇張禁止", "Hindari melebih-lebihkan")}:</b> {target.analysisData.avoidOverclaiming.join(", ")}</p> : null}
            </div>
          ) : null}
        </div>
      )}
      {err ? <p className="mt-2 text-[12px] text-[#F04452]">{err}</p> : null}
    </Card>
  );
}

// ── 공고맞춤 이력서·자소서 ──
function DocumentsSection({ status, target, onChanged }: { status: Week2Status; target: ApplicationTarget; onChanged: () => Promise<void> }) {
  const t = useLaunchT();
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [prompts, setPrompts] = useState<string[]>([]);
  const resumeV = status.versions.find((v) => v.documentType === "resume" && v.variant === "targeted");
  const coverV = status.versions.find((v) => v.documentType === "cover");

  const genResume = async () => {
    setBusy("resume");
    setErr("");
    try {
      await generateResumeVersion("targeted", target.id);
      trackCareerFunnel("career_targeted_resume_generated");
      await onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy("");
    }
  };
  const loadPrompts = async () => {
    setBusy("prompts");
    setErr("");
    try {
      const ps = await fetchCoverPrompts(target.id);
      setPrompts(ps.map((p) => p.prompt));
      trackCareerFunnel("career_cover_questions_created");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy("");
    }
  };
  const genCover = async () => {
    if (!prompts.length) return;
    setBusy("cover");
    setErr("");
    try {
      await generateCoverVersion(prompts, target.id);
      trackCareerFunnel("career_cover_draft_generated");
      await onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy("");
    }
  };

  return (
    <Card>
      <SectionTitle sub={t("대표 이력서는 덮어쓰지 않고 공고맞춤 버전을 만들어요", "Creates a targeted version without overwriting your master", "不覆盖代表简历，生成公告定制版", "Tạo bản tùy chỉnh mà không ghi đè bản chính", "代表版を上書きせず公告版を作成", "Buat versi khusus tanpa menimpa versi utama")}>{t("공고 맞춤 서류", "Targeted documents", "公告定制材料", "Hồ sơ tùy chỉnh", "公告向け書類", "Dokumen khusus")}</SectionTitle>
      <div className="mt-3 space-y-3">
        {/* 이력서 */}
        <DocBlock label={t("공고 맞춤 이력서", "Targeted resume", "定制简历", "CV tùy chỉnh", "公告向け履歴書", "Resume khusus")} version={resumeV} onGenerate={genResume} busy={busy === "resume"} generateLabel={resumeV ? t("다시 생성", "Regenerate", "重新生成", "Tạo lại", "再生成", "Buat ulang") : t("이력서 초안 생성", "Generate resume draft", "生成简历初稿", "Tạo bản nháp CV", "履歴書下書き生成", "Buat draf resume")} />
        {/* 자소서 */}
        {!coverV ? (
          <div className="rounded-2xl border border-[#EEF1F5] bg-white p-3.5">
            <p className="text-[13px] font-bold text-[#191F28]">{t("공고 맞춤 자기소개서", "Targeted cover letter", "定制自我介绍书", "Thư giới thiệu tùy chỉnh", "公告向け自己紹介書", "Surat lamaran khusus")}</p>
            {prompts.length === 0 ? (
              <button type="button" onClick={() => void loadPrompts()} disabled={busy === "prompts"} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#EDF1FD] px-4 py-2 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#DDE7FC] disabled:opacity-60">
                {busy === "prompts" ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : null}
                {t("문항 불러오기", "Load prompts", "加载题目", "Tải câu hỏi", "設問を読み込む", "Muat pertanyaan")}
              </button>
            ) : (
              <div className="mt-2 space-y-1.5">
                {prompts.map((p, i) => <p key={i} className="rounded-lg bg-[#FAFBFC] px-2.5 py-1.5 text-[12px] text-[#4E5968]">📝 {p}</p>)}
                <button type="button" onClick={() => void genCover()} disabled={busy === "cover"} className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-4 py-2 text-[12.5px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-60">
                  {busy === "cover" ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
                  {t("자소서 초안 생성", "Generate cover draft", "生成自我介绍初稿", "Tạo bản nháp thư", "自己紹介書下書き生成", "Buat draf surat")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <DocBlock label={t("공고 맞춤 자기소개서", "Targeted cover letter", "定制自我介绍书", "Thư giới thiệu tùy chỉnh", "公告向け自己紹介書", "Surat lamaran khusus")} version={coverV} onGenerate={genCover} busy={busy === "cover"} generateLabel={t("다시 생성", "Regenerate", "重新生成", "Tạo lại", "再生成", "Buat ulang")} />
        )}
      </div>
      {err ? <p className="mt-2 text-[12px] text-[#F04452]">{err}</p> : null}
    </Card>
  );
}

function DocBlock({ label, version, onGenerate, busy, generateLabel }: { label: string; version?: { validationData?: { counts?: Record<string, number> } | null; version: number } | null; onGenerate: () => void; busy: boolean; generateLabel: string }) {
  const t = useLaunchT();
  const counts = version?.validationData?.counts ?? {};
  const unsupported = (counts.unsupported ?? 0) + (counts.needs_confirmation ?? 0);
  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-bold text-[#191F28]">{label} {version ? <span className="text-[11px] font-semibold text-[#8B95A1]">v{version.version}</span> : null}</p>
        {version ? (counts.verified ?? 0) > 0 || unsupported > 0 ? <Pill tone={unsupported > 0 ? "amber" : "green"}>{t(`근거확인 ${unsupported}건`, `${unsupported} to verify`, `待核实 ${unsupported}`, `${unsupported} cần xác minh`, `要確認 ${unsupported}`, `${unsupported} verifikasi`)}</Pill> : null : null}
      </div>
      {version && unsupported > 0 ? <p className="mt-1 text-[11.5px] text-[#C77700]">⚠️ {t("근거가 약한 문장이 있어요. 확정 전 확인해 주세요.", "Some sentences lack evidence — review before finalizing.", "有依据不足的句子，请在最终确定前确认。", "Một số câu thiếu căn cứ — hãy xem lại.", "根拠が弱い文があります。確定前に確認を。", "Beberapa kalimat kurang bukti — tinjau dulu.")}</p> : null}
      <button type="button" onClick={onGenerate} disabled={busy} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-4 py-2 text-[12.5px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-60">
        {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
        {generateLabel}
      </button>
    </div>
  );
}

// ── 일관성 검사 + 점수 + 최종 확정 + 예상 질문 ──
function ReviewSection({ status, target, onChanged }: { status: Week2Status; target: ApplicationTarget; onChanged: () => Promise<void> }) {
  const t = useLaunchT();
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [scores, setScores] = useState<ScoreData | null>(status.package?.scoreData ?? null);
  const findings: ConsistencyFinding[] = status.package?.validationData?.findings ?? [];
  const criticalUnresolved = status.package?.validationData?.criticalUnresolved ?? 0;
  const finalized = status.package?.status === "finalized";
  const hasIq = Boolean(status.interviewQuestionSet);

  const run = async (fn: () => Promise<void>, key: string) => {
    setBusy(key);
    setErr("");
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy("");
    }
  };

  return (
    <Card>
      <SectionTitle sub={t("사실 검증·일관성·점수를 확인하고 확정해요", "Verify facts, consistency, scores, then finalize", "核实事实、一致性、分数后确定", "Kiểm tra sự thật, nhất quán, điểm rồi hoàn tất", "事実・整合性・点数を確認して確定", "Cek fakta, konsistensi, skor lalu selesaikan")}>{t("검토 & 최종 확정", "Review & finalize", "审核与确定", "Rà soát & hoàn tất", "レビュー＆確定", "Tinjau & selesaikan")}</SectionTitle>
      <div className="mt-3 space-y-3">
        {/* 일관성 */}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void run(async () => { const r = await runConsistencyCheck(target.id); trackCareerFunnel("career_consistency_check_completed", { criticalIssueCount: r.criticalUnresolved }); await onChanged(); }, "consistency")} disabled={busy === "consistency"} className="inline-flex items-center gap-1.5 rounded-xl bg-[#EDF1FD] px-3.5 py-2 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#DDE7FC] disabled:opacity-60">
            {busy === "consistency" ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <ShieldCheck className="h-4 w-4" weight="bold" />}
            {t("일관성 검사", "Consistency check", "一致性检查", "Kiểm tra nhất quán", "整合性チェック", "Cek konsistensi")}
          </button>
          <button type="button" onClick={() => void run(async () => { const s = await computeScores(target.id); setScores(s); await onChanged(); }, "scores")} disabled={busy === "scores"} className="inline-flex items-center gap-1.5 rounded-xl bg-[#EDF1FD] px-3.5 py-2 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#DDE7FC] disabled:opacity-60">
            {busy === "scores" ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
            {t("점수 계산", "Compute scores", "计算分数", "Tính điểm", "点数計算", "Hitung skor")}
          </button>
        </div>

        {/* 일관성 결과 */}
        {findings.length > 0 ? (
          <div className="space-y-1.5">
            {findings.filter((f) => f.severity !== "passed").map((f) => (
              <div key={f.id} className={`rounded-xl border p-2.5 text-[12px] ${f.severity === "critical" ? "border-[#F04452]/30 bg-[#FEF2F2]" : f.severity === "warning" ? "border-[#C77700]/30 bg-[#FFFBEB]" : "border-[#EEF1F5] bg-[#FAFBFC]"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-semibold ${f.severity === "critical" ? "text-[#F04452]" : f.severity === "warning" ? "text-[#C77700]" : "text-[#4E5968]"}`}>
                    {f.severity === "critical" ? <Warning className="mr-1 inline h-3.5 w-3.5" weight="fill" /> : null}{f.message}
                  </p>
                  {!f.resolved && !f.userAcknowledged ? (
                    <button type="button" onClick={() => void run(async () => { await resolveConsistency(target.id, f.id, { userAcknowledged: true }); await onChanged(); }, `resolve-${f.id}`)} className="shrink-0 rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-[#0B46E8]">{t("확인", "Acknowledge", "确认", "Xác nhận", "確認", "Konfirmasi")}</button>
                  ) : <span className="shrink-0 text-[11px] text-[#0A9B59]">✓</span>}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* 점수 / Readiness */}
        {scores?.readiness ? (
          <div className="rounded-2xl bg-[#191F28] p-3.5 text-white">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("지원 준비도", "Application readiness", "申请准备度", "Độ sẵn sàng", "応募準備度", "Kesiapan lamaran")}</p>
              <p className="text-[24px] font-black text-[#B7FF5A]">{scores.readiness.score}</p>
            </div>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5 text-center text-[11px]">
              {(["resume", "cover", "jdMatch", "verification"] as const).map((k) => (
                <div key={k} className="rounded-lg bg-white/10 px-1 py-1"><p className="text-white/60">{k === "jdMatch" ? "JD" : k === "verification" ? t("검증", "Verify", "验证", "XM", "検証", "Verif") : k === "resume" ? t("이력", "CV", "简历", "CV", "履歴", "CV") : t("자소", "CL", "自介", "TGT", "自己", "CL")}</p><p className="font-extrabold tabular-nums">{scores.readiness.breakdown[k]}</p></div>
              ))}
            </div>
            {scores.readiness.topImprovements.length ? <ul className="mt-2 space-y-0.5 text-[12px]">{scores.readiness.topImprovements.map((s, i) => <li key={i} className="flex gap-1.5"><span className="text-[#B7FF5A]">→</span>{s}</li>)}</ul> : null}
            {scores.readiness.criticalBlockers.length ? <p className="mt-1.5 text-[11.5px] text-[#FF8A8A]">⚠ {scores.readiness.criticalBlockers.join(" · ")}</p> : null}
          </div>
        ) : null}

        {/* 최종 확정 */}
        {!finalized ? (
          <button type="button" onClick={() => void run(async () => { try { await finalizePackage(target.id, false); } catch (e) { const err = e as { code?: string }; if (err.code === "critical_unresolved") { if (confirm(t("미해결 critical 항목이 있어요. 그래도 확정할까요?", "Critical issues remain. Finalize anyway?", "仍有critical问题。确定吗？", "Còn vấn đề critical. Vẫn hoàn tất?", "critical項目が残っています。確定しますか？", "Masih ada isu kritis. Tetap selesaikan?"))) await finalizePackage(target.id, true); else return; } else throw e; } trackCareerFunnel("career_application_package_finalized", { readinessScore: scores?.readiness.score }); await onChanged(); }, "finalize")} disabled={busy === "finalize"} className="w-full rounded-xl bg-[#0B46E8] px-4 py-3 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-60">
            {busy === "finalize" ? t("확정 중…", "Finalizing…", "确定中…", "Đang hoàn tất…", "確定中…", "Menyelesaikan…") : t("지원 패키지 최종 확정", "Finalize application package", "最终确定申请材料", "Hoàn tất bộ hồ sơ", "応募パッケージを確定", "Selesaikan paket lamaran")}
          </button>
        ) : (
          <div className="rounded-xl bg-[#E7F7EF] p-3 text-center">
            <p className="text-[13px] font-bold text-[#0A9B59]">✓ {t("지원 패키지 확정 완료", "Application package finalized", "申请材料已确定", "Đã hoàn tất bộ hồ sơ", "応募パッケージ確定完了", "Paket lamaran selesai")}</p>
          </div>
        )}

        {/* Week3 예상 질문 */}
        {finalized ? (
          !hasIq ? (
            <button type="button" onClick={() => void run(async () => { await generateInterviewQuestions(target.id); trackCareerFunnel("career_interview_questions_generated"); await onChanged(); }, "iq")} disabled={busy === "iq"} className="w-full rounded-xl bg-[#191F28] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-60">
              {busy === "iq" ? <CircleNotch className="mr-1 inline h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="mr-1 inline h-4 w-4" weight="fill" />}
              {t("Week 3 예상 면접 질문 생성", "Generate Week 3 interview questions", "生成第3周预测面试题", "Tạo câu hỏi PV Tuần 3", "Week3予想質問を生成", "Buat pertanyaan wawancara Minggu 3")}
            </button>
          ) : (
            <div className="rounded-xl bg-[#F5F8FF] p-3">
              <p className="text-[12.5px] font-bold text-[#0B46E8]">✓ {t(`Week 3 예상 질문 ${status.interviewQuestionSet?.questions.length ?? 0}개 준비됨`, `${status.interviewQuestionSet?.questions.length ?? 0} interview questions ready for Week 3`, `已准备 ${status.interviewQuestionSet?.questions.length ?? 0} 道第3周面试题`, `${status.interviewQuestionSet?.questions.length ?? 0} câu hỏi cho Tuần 3`, `Week3予想質問 ${status.interviewQuestionSet?.questions.length ?? 0}件`, `${status.interviewQuestionSet?.questions.length ?? 0} pertanyaan siap`)}</p>
            </div>
          )
        ) : null}
      </div>
      {err ? <p className="mt-2 text-[12px] text-[#F04452]">{err}</p> : null}
    </Card>
  );
}
