"use client";

// Week 4 공고별 모의면접 — 가고 싶은 공고를 골라 그 공고 기준으로 면접을 연습(무제한 반복).
// 공고 출처: 우리 공고 데이터(관심 직무 추천) / 검색 / 외부 링크.
import { useEffect, useRef, useState } from "react";
import { CircleNotch, Sparkle, MagnifyingGlass, Buildings, ClockCounterClockwise, CaretRight } from "@phosphor-icons/react";
import { Card, SectionTitle } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";
import { trackCareerFunnel } from "../../lib/analytics";
import { getPublicPositionsPage, getRecommendedPositions, type PublicPositionListItem } from "../../lib/member-profile-client";
import { RECOMMENDED_JOBS } from "../../lib/launch/data";
import { fetchJobPosting } from "../../lib/resume-maker-client";
import { fetchProgress, type PostingInterviewLog } from "../../lib/launch/progress-client";
import type { InterviewJobPosting } from "../../lib/launch/interview";
import { CareerChatModal } from "./CareerChatModal";
import { PostingInterviewChat } from "./PostingInterviewChat";
import { PostingInterviewLogView } from "./PostingInterviewLogView";

type Mode = "reco" | "search" | "url";

const posCompany = (p: PublicPositionListItem) => p.partnerOrganization?.name || p.sourceCompanyName || "";
const posThumb = (p: PublicPositionListItem) => p.thumbnailImages?.[0] || p.partnerOrganization?.companyLogoImageData || undefined;
// 공고를 대략 파악할 수 있게 요약 불렛 3개 — 주요업무/자격요건을 줄·구분자·문장 기준으로 쪼갠다.
function posBullets(p: PublicPositionListItem): string[] {
  const raw = [p.mainResponsibilities, p.requiredQualifications].filter(Boolean).join("\n").trim();
  if (!raw) return p.preferredJobRole ? [p.preferredJobRole.trim()] : [];
  let parts = raw.split(/\r?\n|[•·▪‣∙・]|;|,\s/).map((s) => s.replace(/^[-*\s]+/, "").replace(/\s+/g, " ").trim()).filter((s) => s.length > 1);
  if (parts.length < 2) parts = raw.split(/(?<=[.!?。])\s+/).map((s) => s.replace(/\s+/g, " ").trim()).filter((s) => s.length > 1);
  return parts.slice(0, 3).map((s) => s.slice(0, 70));
}

function positionToPosting(p: PublicPositionListItem): InterviewJobPosting {
  return {
    title: p.title,
    company: posCompany(p),
    description: [p.mainResponsibilities, p.requiredQualifications, p.preferredQualifications].filter(Boolean).join("\n\n") || undefined,
    requirements: p.requiredQualifications ? [p.requiredQualifications] : undefined
  };
}

export function PostingInterviewCard() {
  const t = useLaunchT();
  const [mode, setMode] = useState<Mode>("reco");
  const [recos, setRecos] = useState<PublicPositionListItem[] | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PublicPositionListItem[]>([]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [active, setActive] = useState<InterviewJobPosting | null>(null);
  const [logs, setLogs] = useState<PostingInterviewLog[]>([]);
  const [viewLog, setViewLog] = useState<PostingInterviewLog | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    void (async () => {
      try {
        const prog = await fetchProgress().catch(() => null);
        if (!alive.current) return;
        setLogs(Array.isArray(prog?.postingInterviews) ? prog!.postingInterviews! : []);

        // 우리 공고 데이터에서 관심 직무로 채용 중인 공고 추천(없으면 개인화 추천 폴백).
        const jobs = Array.isArray(prog?.selectedJobs) ? prog!.selectedJobs!.filter((j) => j?.trim()) : [];
        let reco: PublicPositionListItem[] = [];
        if (jobs.length) {
          const queries = jobs.map((r) => RECOMMENDED_JOBS.find((j) => j.role === r)?.query || r);
          const pages = await Promise.all(queries.map((s) => getPublicPositionsPage({ search: s, limit: 6 }).catch(() => null)));
          const seenId = new Set<string>();
          for (const pg of pages) {
            for (const it of pg?.items ?? []) {
              if (seenId.has(it.id) || reco.length >= 8) continue;
              seenId.add(it.id);
              reco.push(it);
            }
          }
        } else {
          reco = (await getRecommendedPositions({ limit: 8 }).catch(() => ({ items: [] as PublicPositionListItem[] }))).items;
        }
        if (alive.current) setRecos(reco);
      } catch {
        if (alive.current) setRecos([]);
      }
    })();
    return () => {
      alive.current = false;
    };
  }, []);

  const reloadLogs = async () => {
    try {
      const p = await fetchProgress();
      if (alive.current) setLogs(Array.isArray(p.postingInterviews) ? p.postingInterviews : []);
    } catch {
      /* 무시 */
    }
  };

  const startWith = (posting: InterviewJobPosting) => {
    trackCareerFunnel("career_posting_interview_started", { hasRequirements: Boolean(posting.requirements?.length) });
    setActive(posting);
  };
  const runSearch = async () => {
    const kw = q.trim();
    if (!kw) return;
    setBusy("search");
    setErr("");
    try {
      const page = await getPublicPositionsPage({ search: kw, limit: 12 });
      setResults(page.items);
      if (page.items.length === 0) setErr(t("검색 결과가 없어요.", "No results.", "无结果。", "Không có kết quả.", "結果なし。", "Tidak ada hasil."));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy("");
    }
  };
  const startFromUrl = async () => {
    const clean = url.trim();
    if (!clean) return;
    setBusy("url");
    setErr("");
    try {
      const text = await fetchJobPosting(clean);
      if (!text || text.trim().length < 30) {
        setErr(t("공고 내용을 불러오지 못했어요. 내용을 직접 붙여넣거나 검색을 써주세요.", "Couldn't read the posting. Use search instead.", "无法读取公告，请改用搜索。", "Không đọc được tin. Hãy dùng tìm kiếm.", "求人を読み取れませんでした。検索をご利用ください。", "Tidak bisa membaca lowongan. Gunakan pencarian."));
        return;
      }
      startWith({ description: text });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy("");
    }
  };

  const closeChat = () => {
    setActive(null);
    void reloadLogs(); // 방금 끝낸 면접이 기록에 반영되도록
  };
  const logDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return "";
    }
  };

  const startBtnCls = "inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#191F28] px-2.5 py-1.5 text-[11.5px] font-bold text-white transition hover:bg-[#0B1227]";
  const Row = ({ title, company, bullets, thumb, onStart, loading }: { title: string; company: string; bullets?: string[]; thumb?: string; onStart: () => void; loading?: boolean }) => (
    <div className="flex items-start gap-3 rounded-xl border border-[#EEF1F5] bg-white px-3 py-2.5">
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-[#EEF1F5] object-cover" />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#EDF1FD] text-[#0B46E8]"><Buildings className="h-[18px] w-[18px]" weight="fill" /></span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-bold text-[#191F28]">{title}</p>
        {company ? <p className="truncate text-[11.5px] font-semibold text-[#4E5968]">{company}</p> : null}
        {bullets && bullets.length ? (
          <ul className="mt-1 space-y-0.5">
            {bullets.map((b, i) => (
              <li key={i} className="flex gap-1.5 text-[11.5px] leading-[1.45] text-[#8B95A1]">
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[#C4CAD2]" />
                <span className="min-w-0 truncate">{b}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <button type="button" onClick={onStart} disabled={Boolean(loading)} className={`${startBtnCls} mt-0.5`}>
        {loading ? <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" /> : <Sparkle className="h-3.5 w-3.5" weight="fill" />}{t("이 공고로 면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara")}
      </button>
    </div>
  );

  return (
    <>
      {active ? <CareerChatModal onClose={closeChat}><PostingInterviewChat posting={active} embedded onClose={closeChat} /></CareerChatModal> : null}
      <Card>
        <SectionTitle sub={t("가고 싶은 공고를 골라 그 공고 기준으로 면접을 연습해요. 공고를 바꿔가며 계속 연습할 수 있어요.", "Pick a posting and practice an interview based on it — as many postings as you like.", "选一个公告，据此练习面试。可不断更换公告练习。", "Chọn một tin và luyện phỏng vấn theo tin đó — bao nhiêu tin tùy thích.", "求人を選んでその求人基準で面接練習。求人を変えて何度でも。", "Pilih lowongan dan latih wawancara sesuai lowongan itu — sebanyak yang kamu mau.")}>{t("공고별 모의면접", "Posting mock interview", "公告模拟面试", "Phỏng vấn theo tin", "求人別模擬面接", "Wawancara per lowongan")}</SectionTitle>

        <div className="mt-3 flex gap-1 rounded-xl bg-[#F2F4F6] p-1">
          {([
            ["reco", t("추천 공고", "Suggested", "推荐公告", "Gợi ý", "おすすめ", "Rekomendasi")],
            ["search", t("검색", "Search", "搜索", "Tìm", "検索", "Cari")],
            ["url", t("링크", "Link", "链接", "Link", "リンク", "Link")]
          ] as [Mode, string][]).map(([key, label]) => (
            <button key={key} type="button" onClick={() => { setMode(key); setErr(""); }} className={`flex-1 rounded-lg px-2 py-1.5 text-[12px] font-bold transition ${mode === key ? "bg-white text-[#191F28] shadow-sm" : "text-[#8B95A1]"}`}>{label}</button>
          ))}
        </div>

        <div className="mt-3">
          {mode === "reco" ? (
            recos === null ? (
              <p className="flex items-center gap-2 py-4 text-[12.5px] text-[#8B95A1]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> {t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p>
            ) : recos.length > 0 ? (
              <div className="flex flex-col gap-2">
                {recos.map((p) => <Row key={p.id} title={p.title} company={posCompany(p)} bullets={posBullets(p)} thumb={posThumb(p)} onStart={() => startWith(positionToPosting(p))} />)}
              </div>
            ) : (
              <p className="py-4 text-[12.5px] text-[#8B95A1]">{t("지금 관심 직무로 매칭되는 공고가 적어요. '검색'이나 '링크'로 찾아보세요.", "Few openings match your roles right now. Try Search or Link.", "目前与你所选职务匹配的公告较少，试试搜索或链接。", "Hiện ít tin phù hợp với nghề của bạn. Thử Tìm hoặc Link.", "今は関心職種にマッチする求人が少ないです。検索かリンクで。", "Sedikit lowongan cocok dengan peranmu. Coba Cari atau Link.")}</p>
            )
          ) : null}

          {mode === "search" ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#E5E8EB] bg-white px-3 focus-within:border-[#0B46E8]">
                  <MagnifyingGlass className="h-4 w-4 shrink-0 text-[#8B95A1]" weight="bold" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void runSearch(); }} placeholder={t("회사·직무로 검색", "Search company or role", "按公司/职务搜索", "Tìm theo công ty/nghề", "会社・職種で検索", "Cari perusahaan/peran")} className="min-w-0 flex-1 bg-transparent py-2.5 text-[14px] outline-none placeholder:text-[#B0B8C1]" />
                </div>
                <button type="button" onClick={() => void runSearch()} disabled={busy === "search" || !q.trim()} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">{busy === "search" ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : null}{t("검색", "Search", "搜索", "Tìm", "検索", "Cari")}</button>
              </div>
              {results.length > 0 ? <div className="flex flex-col gap-2">{results.map((p) => <Row key={p.id} title={p.title} company={posCompany(p)} bullets={posBullets(p)} thumb={posThumb(p)} onStart={() => startWith(positionToPosting(p))} />)}</div> : null}
            </div>
          ) : null}

          {mode === "url" ? (
            <div className="space-y-2">
              <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void startFromUrl(); }} placeholder={t("채용공고 링크 붙여넣기", "Paste job posting link", "粘贴招聘链接", "Dán link tin tuyển dụng", "求人リンクを貼付", "Tempel link lowongan")} className="w-full rounded-xl border border-[#E5E8EB] px-3 py-2.5 text-[14px] outline-none focus:border-[#0B46E8]" />
              <button type="button" onClick={() => void startFromUrl()} disabled={busy === "url" || !url.trim()} className="inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-50">{busy === "url" ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}{t("이 공고로 면접", "Interview with this", "以此面试", "Phỏng vấn tin này", "この求人で面接", "Wawancara ini")}</button>
              <p className="text-[11.5px] text-[#8B95A1]">{t("일부 사이트는 로그인·차단으로 못 가져올 수 있어요.", "Some sites can't be read (login/blocking).", "部分网站因登录/拦截无法读取。", "Một số trang không đọc được.", "一部サイトは取得不可な場合があります。", "Beberapa situs tak terbaca.")}</p>
            </div>
          ) : null}

          {err ? <p className="mt-2 text-[12px] text-[#F04452]">{err}</p> : null}
        </div>

        {/* 지난 면접 기록 — 질문·답변이 누적 저장돼 다시 볼 수 있다. */}
        {logs.length > 0 ? (
          <div className="mt-4 border-t border-[#EEF1F5] pt-3">
            <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#4E5968]"><ClockCounterClockwise className="h-4 w-4 text-[#8B95A1]" weight="bold" /> {t("지난 면접 기록", "Past interviews", "过往面试记录", "Phỏng vấn đã lưu", "過去の面接記録", "Riwayat wawancara")} <span className="text-[#8B95A1]">{logs.length}</span></p>
            <div className="mt-2 flex flex-col gap-1.5">
              {logs.map((l) => {
                const label = [l.company, l.title].filter(Boolean).join(" · ") || t("공고별 모의면접", "Posting mock interview", "公告模拟面试", "Phỏng vấn theo tin", "求人別模擬面接", "Wawancara per lowongan");
                const answers = l.messages.filter((m) => m.role === "user").length;
                return (
                  <button key={l.id} type="button" onClick={() => setViewLog(l)} className="flex items-center gap-3 rounded-xl border border-[#EEF1F5] bg-white px-3 py-2.5 text-left transition hover:border-[#0B46E8]/40">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-[#191F28]">{label}</p>
                      <p className="truncate text-[11.5px] text-[#8B95A1]">{logDate(l.at)}{answers ? ` · ${t(`답변 ${answers}개`, `${answers} answers`, `${answers} 个回答`, `${answers} câu trả lời`, `回答 ${answers}件`, `${answers} jawaban`)}` : ""}</p>
                    </div>
                    <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" weight="bold" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </Card>

      {viewLog ? <CareerChatModal onClose={() => setViewLog(null)}><PostingInterviewLogView log={viewLog} onClose={() => setViewLog(null)} /></CareerChatModal> : null}
    </>
  );
}
