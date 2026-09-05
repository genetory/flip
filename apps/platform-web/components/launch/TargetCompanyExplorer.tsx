"use client";

// Week 1 마지막 enrichment — 목표 기업 탐색.
// 정한 관심 직무로 '지금 채용 중인' 우리 플랫폼 기업을 추천하고, 검색으로도 찾아
// '내 목표 기업' 후보를 담는다(progress.state.targetCompanies). 2주차 지원 서류의 목표가 된다.
// 서버 스키마 변경 없음 — PATCH /progress 가 임의 키를 병합 저장한다.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CaretLeft, X, Buildings, Check, Plus, MagnifyingGlass, CircleNotch, ArrowUpRight, Target } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "./CareerLaunchHeader";
import { AplyFooter } from "../AplyFooter";
import { getPublicPositionsPage, type PublicPositionListItem } from "../../lib/member-profile-client";
import { RECOMMENDED_JOBS } from "../../lib/launch/data";
import { fetchProgress, patchProgress, type TargetCompany } from "../../lib/launch/progress-client";
import { trackCareerFunnel } from "../../lib/analytics";
import { useLaunchT } from "../../lib/launch/i18n";

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

export function TargetCompanyExplorer({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void }) {
  const t = useLaunchT();
  const [saved, setSaved] = useState<TargetCompany[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<PublicPositionListItem[] | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PublicPositionListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    trackCareerFunnel("career_target_company_started");
    void (async () => {
      try {
        const prog = await fetchProgress();
        if (!alive.current) return;
        setSaved(Array.isArray(prog.targetCompanies) ? prog.targetCompanies : []);
        const jobs = Array.isArray(prog.selectedJobs) ? prog.selectedJobs.filter((j) => j?.trim()) : [];
        setSelectedJobs(jobs);
        // 관심 직무별 검색어로 지금 열린 공고 → 기업 중복 제거해 추천.
        if (jobs.length) {
          const queries = jobs.map((r) => RECOMMENDED_JOBS.find((j) => j.role === r)?.query || r);
          const pages = await Promise.all(queries.map((s) => getPublicPositionsPage({ search: s, limit: 6 }).catch(() => null)));
          if (!alive.current) return;
          const seenCo = new Set<string>();
          const merged: PublicPositionListItem[] = [];
          for (const pg of pages) {
            for (const it of pg?.items ?? []) {
              const co = posCompany(it).trim().toLowerCase();
              if (!co || seenCo.has(co) || merged.length >= 12) continue;
              seenCo.add(co);
              merged.push(it);
            }
          }
          setSuggestions(merged);
        } else {
          setSuggestions([]);
        }
      } finally {
        if (alive.current) setLoaded(true);
      }
    })();
    return () => {
      alive.current = false;
    };
  }, []);

  const isSaved = (name: string) => saved.some((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());
  const persist = (next: TargetCompany[]) => {
    setSaved(next);
    void patchProgress({ targetCompanies: next }).catch(() => {});
  };
  const addFromPosition = (p: PublicPositionListItem) => {
    const name = posCompany(p);
    if (!name || isSaved(name)) return;
    trackCareerFunnel("career_target_company_saved", { source: "position" });
    persist([...saved, { name, role: p.title, positionId: p.id }]);
  };
  const remove = (name: string) => persist(saved.filter((c) => c.name.trim().toLowerCase() !== name.trim().toLowerCase()));

  const runSearch = async () => {
    const kw = q.trim();
    if (!kw) return;
    setSearching(true);
    try {
      const page = await getPublicPositionsPage({ search: kw, limit: 12 });
      // 기업 중복 제거.
      const seenCo = new Set<string>();
      const uniq: PublicPositionListItem[] = [];
      for (const it of page.items) {
        const co = posCompany(it).trim().toLowerCase();
        if (!co || seenCo.has(co)) continue;
        seenCo.add(co);
        uniq.push(it);
      }
      setResults(uniq);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const CompanyRow = ({ p }: { p: PublicPositionListItem }) => {
    const name = posCompany(p);
    const on = isSaved(name);
    const thumb = posThumb(p);
    const bullets = posBullets(p);
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[#EEF1F5] bg-white px-3 py-2.5">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-[#EEF1F5] object-cover" />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#EDF1FD] text-[#0B46E8]"><Buildings className="h-[18px] w-[18px]" weight="fill" /></span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-bold text-[#191F28]">{name || t("회사명 미정", "Company TBD", "公司待定", "Chưa rõ công ty", "会社未定", "Perusahaan TBD")}</p>
          <p className="truncate text-[11.5px] font-semibold text-[#4E5968]">{p.title}</p>
          {bullets.length ? (
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
        <div className="flex shrink-0 items-center gap-1.5">
          <Link href={`/talent/jobs/${p.id}`} target="_blank" rel="noopener noreferrer" aria-label={t("공고 보기", "View posting", "查看公告", "Xem tin", "求人を見る", "Lihat lowongan")} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B95A1] transition hover:bg-[#F2F4F6] hover:text-[#191F28]"><ArrowUpRight className="h-4 w-4" weight="bold" /></Link>
          <button type="button" onClick={() => (on ? remove(name) : addFromPosition(p))} disabled={!name} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11.5px] font-bold transition disabled:opacity-40 ${on ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "bg-[#EDF1FD] text-[#0B46E8] hover:bg-[#DDE7FC]"}`}>
            {on ? <><Check className="h-3.5 w-3.5" weight="bold" /> {t("담음", "Saved", "已收藏", "Đã lưu", "保存済", "Tersimpan")}</> : <><Plus className="h-3.5 w-3.5" weight="bold" /> {t("담기", "Save", "收藏", "Lưu", "保存", "Simpan")}</>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={embedded ? "flex h-[100dvh] flex-col bg-white" : "flex min-h-screen flex-col bg-white"}>
      {embedded ? (
        <div className="flex items-center justify-between gap-3 border-b border-[#EEF1F5] px-5 py-3">
          <p className="text-[14px] font-black tracking-[-0.01em] text-[#191F28]">{t("목표 기업 탐색", "Explore target companies", "探索目标企业", "Khám phá công ty mục tiêu", "目標企業を探す", "Jelajahi perusahaan target")}</p>
          <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 items-center justify-center rounded-full text-[#4E5968] transition hover:bg-[#F6F8FB]"><X className="h-5 w-5" weight="bold" /></button>
        </div>
      ) : (
        <CareerLaunchHeader />
      )}
      <main className={embedded ? "flex-1 overflow-y-auto" : "flex-1"}>
        <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-4 md:pt-8">
          {embedded ? null : (
            <div className="flex items-center justify-between gap-3">
              <Link href="/career-launch/week/1" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
                <CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("1주차", "Week 1", "第1周", "Tuần 1", "1週目", "Minggu 1")}
              </Link>
              <Link href="/career-launch/week/1" className="rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">{t("종료하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</Link>
            </div>
          )}

          <div className="mt-3.5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{t("1주차 · 목표 기업 탐색", "Week 1 · Target companies", "第1周 · 目标企业", "Tuần 1 · Công ty mục tiêu", "Week 1 · 目標企業", "Minggu 1 · Perusahaan target")}</p>
            <h1 className="mt-1.5 break-keep text-[20px] font-black leading-[1.2] tracking-[-0.02em] text-[#191F28] md:text-[24px]">{t("가고 싶은 기업을 정해봐요", "Pick the companies you want to join", "选定你想去的企业", "Chọn công ty bạn muốn vào", "行きたい企業を決めましょう", "Pilih perusahaan yang kamu tuju")}</h1>
            <p className="mt-1.5 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t("정한 직무로 지금 채용 중인 기업이에요. 도전·적정·안정을 섞어 3곳 정도 담아두면, 2주차 지원 서류를 그 기업에 맞춰 준비할 수 있어요.", "Companies hiring now for your role. Save about 3 — a mix of reach, match, and safe — so you can tailor your Week 2 documents to them.", "这些是你所选职务当前正在招聘的企业。混合冲刺·匹配·稳妥收藏约3家，第2周材料就能据此准备。", "Các công ty đang tuyển cho nghề của bạn. Lưu khoảng 3 (thử sức·phù hợp·an toàn) để chuẩn bị hồ sơ Tuần 2 theo họ.", "選んだ職種で今採用中の企業です。挑戦・適正・安定を混ぜて3社ほど保存すると、2週目の書類をその企業に合わせて準備できます。", "Perusahaan yang merekrut untuk peranmu. Simpan sekitar 3 (menantang, cocok, aman) agar bisa menyesuaikan dokumen Minggu 2.")}</p>
          </div>

          {/* 내 목표 기업 */}
          <div className="mt-5 rounded-2xl border border-[#E4EDFB] bg-gradient-to-br from-[#F5F8FF] to-[#EDF2FF] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 text-[13px] font-black text-[#0B1227]"><Target className="h-4 w-4 text-[#0B46E8]" weight="fill" /> {t("내 목표 기업", "My target companies", "我的目标企业", "Công ty mục tiêu của tôi", "私の目標企業", "Perusahaan targetku")}</p>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11.5px] font-bold text-[#0B46E8]">{saved.length}{t(" / 3곳", " / 3", " / 3家", " / 3", " / 3社", " / 3")}</span>
            </div>
            {saved.length === 0 ? (
              <p className="mt-2 break-keep text-[12.5px] leading-relaxed text-[#4E5968]">{t("아래에서 관심 가는 기업을 '담기'로 추가해보세요. 3곳 정도가 좋아요.", "Add companies below with 'Save'. About 3 is a good number.", "在下方用“收藏”添加感兴趣的企业，约3家为宜。", "Thêm công ty bên dưới bằng 'Lưu'. Khoảng 3 là tốt.", "下から気になる企業を「保存」で追加しましょう。3社ほどが目安です。", "Tambahkan perusahaan di bawah dengan 'Simpan'. Sekitar 3 ideal.")}</p>
            ) : (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {saved.map((c) => (
                  <span key={c.name} className="inline-flex items-center gap-1.5 rounded-full border border-[#CFE0FF] bg-white px-2.5 py-1 text-[12px] font-bold text-[#0B1227]">
                    {c.name}
                    <button type="button" onClick={() => remove(c.name)} aria-label={t("빼기", "Remove", "移除", "Bỏ", "外す", "Hapus")} className="text-[#8B95A1] transition hover:text-[#F04452]"><X className="h-3.5 w-3.5" weight="bold" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 추천 — 관심 직무로 채용 중인 기업 */}
          <div className="mt-6">
            <p className="text-[13.5px] font-bold text-[#191F28]">{t("관심 직무로 채용 중인 기업", "Companies hiring for your roles", "招聘你所选职务的企业", "Công ty đang tuyển nghề của bạn", "関心職種で採用中の企業", "Perusahaan yang merekrut peranmu")}</p>
            {!loaded ? (
              <p className="mt-3 flex items-center gap-2 text-[12.5px] text-[#8B95A1]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> {t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p>
            ) : selectedJobs.length === 0 ? (
              <div className="mt-2 rounded-xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-4 text-center">
                <p className="text-[12.5px] text-[#8B95A1]">{t("먼저 '관심 직무 3개 선정'을 마치면 맞춤 기업을 추천해드려요. 아래 검색으로도 찾을 수 있어요.", "Finish 'Pick 3 roles' first for tailored suggestions. You can also use search below.", "先完成“选定3个关注职务”即可获得推荐，也可用下方搜索。", "Hoàn thành 'Chọn 3 nghề' trước để có gợi ý. Bạn cũng có thể tìm bên dưới.", "先に「関心職種3つ選定」を終えると推薦できます。下の検索でも探せます。", "Selesaikan 'Pilih 3 peran' dulu untuk saran. Bisa juga pakai pencarian di bawah.")}</p>
                <Link href="/career-launch/jobs" className="mt-2 inline-block text-[12.5px] font-bold text-[#0B46E8] hover:underline">{t("관심 직무 정하러 가기 →", "Pick roles →", "去选职务 →", "Chọn nghề →", "職種を選ぶ →", "Peran →")}</Link>
              </div>
            ) : suggestions && suggestions.length > 0 ? (
              <div className="mt-2 flex flex-col gap-2">
                {suggestions.map((p) => <CompanyRow key={p.id} p={p} />)}
              </div>
            ) : (
              <p className="mt-2 text-[12.5px] text-[#8B95A1]">{t("지금은 매칭되는 공고가 적어요. 아래 검색으로 관심 기업을 직접 찾아보세요.", "Few matching openings right now. Use search below to find companies.", "目前匹配的公告较少，请用下方搜索查找企业。", "Hiện ít tin phù hợp. Dùng tìm kiếm bên dưới.", "今はマッチする求人が少ないです。下の検索で探してください。", "Sedikit lowongan cocok saat ini. Gunakan pencarian di bawah.")}</p>
            )}
          </div>

          {/* 검색 */}
          <div className="mt-6">
            <p className="text-[13.5px] font-bold text-[#191F28]">{t("기업·직무로 검색", "Search companies or roles", "按企业/职务搜索", "Tìm công ty/nghề", "企業・職種で検索", "Cari perusahaan/peran")}</p>
            <div className="mt-2 flex gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#E5E8EB] bg-white px-3 focus-within:border-[#0B46E8]">
                <MagnifyingGlass className="h-4 w-4 shrink-0 text-[#8B95A1]" weight="bold" />
                <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void runSearch(); }} placeholder={t("예: 마케팅, 토스, 외국계", "e.g. marketing, Toss", "如：营销、外企", "vd: marketing", "例: マーケ、外資", "cth: marketing")} className="min-w-0 flex-1 bg-transparent py-2.5 text-[14px] outline-none placeholder:text-[#B0B8C1]" />
              </div>
              <button type="button" onClick={() => void runSearch()} disabled={searching || !q.trim()} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
                {searching ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : null}{t("검색", "Search", "搜索", "Tìm", "検索", "Cari")}
              </button>
            </div>
            {results.length > 0 ? <div className="mt-2 flex flex-col gap-2">{results.map((p) => <CompanyRow key={p.id} p={p} />)}</div> : null}
          </div>

          {/* 마치기 */}
          <div className="mt-8 flex items-center justify-between gap-3 rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-4">
            <p className="break-keep text-[12.5px] leading-relaxed text-[#4E5968]">{saved.length > 0 ? t(`좋아요! 목표 기업 ${saved.length}곳을 담았어요. 2주차에서 이 기업들에 맞춰 서류를 준비해요.`, `Nice! ${saved.length} target companies saved. Tailor your Week 2 docs to them.`, `很好！已收藏 ${saved.length} 家目标企业。第2周据此准备材料。`, `Tuyệt! Đã lưu ${saved.length} công ty. Chuẩn bị hồ sơ Tuần 2 theo họ.`, `いいですね！目標企業を${saved.length}社保存しました。2週目で書類を合わせます。`, `Bagus! ${saved.length} perusahaan tersimpan. Sesuaikan dokumen Minggu 2.`) : t("관심 가는 기업을 하나 이상 담으면 이 단계가 완료돼요.", "Save at least one company to complete this step.", "至少收藏一家企业即可完成本步骤。", "Lưu ít nhất một công ty để hoàn thành bước này.", "1社以上保存するとこのステップが完了します。", "Simpan minimal satu perusahaan untuk menyelesaikan langkah ini.")}</p>
            {embedded ? (
              <button type="button" onClick={onClose} className="shrink-0 rounded-xl bg-[#191F28] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0B1227]">{t("정리하고 마치기", "Done", "整理并结束", "Xong", "まとめて終了", "Selesai")}</button>
            ) : (
              <Link href="/career-launch/week/1" className="shrink-0 rounded-xl bg-[#191F28] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0B1227]">{t("정리하고 마치기", "Done", "整理并结束", "Xong", "まとめて終了", "Selesai")}</Link>
            )}
          </div>
        </div>
      </main>
      {embedded ? null : <AplyFooter />}
    </div>
  );
}
