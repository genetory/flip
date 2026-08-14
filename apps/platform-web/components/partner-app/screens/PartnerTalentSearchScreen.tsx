"use client";

// 파트너 인재 검색 — aply 인재풀(이력서 등록 + 공개 동의)에서 키워드/AI로 후보를 찾는다.
import { useEffect, useState } from "react";
import Link from "next/link";
import { MagnifyingGlass, X, Sparkle, GraduationCap, Globe, Translate, Briefcase, BookmarkSimple, ShieldCheck } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { usePlatformT } from "../../../lib/i18n";
import { TListSkeleton, TError } from "../../talent/ui/primitives";
import { PartnerEmptyCard } from "../ui/cards";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { getPartnerCandidates, searchPartnerCandidatesAI, getSavedCandidates, saveCandidate, unsaveCandidate, type PartnerCandidateCard } from "../../../lib/member-profile-client";

type Mode = "keyword" | "ai" | "saved";

export function PartnerTalentSearchScreen() {
  const t = usePlatformT();
  const toast = useTalentPopup();
  const [mode, setMode] = useState<Mode>("keyword");
  const [query, setQuery] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<PartnerCandidateCard[]>([]);
  const [total, setTotal] = useState(0);
  const [aiUsed, setAiUsed] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  // 처음 진입 시 최신 인재풀 + 관심 인재 목록 로드.
  useEffect(() => {
    void getSavedCandidates().then((list) => setSavedIds(new Set(list.map((c) => c.candidateUserId)))).catch(() => {});
    run("keyword", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function run(m: Mode, q: string) {
    setStatus("loading");
    const p =
      m === "ai"
        ? searchPartnerCandidatesAI(q).then((r) => {
            setItems(r.items);
            setTotal(r.items.length);
            setAiUsed(r.ai);
          })
        : m === "saved"
          ? getSavedCandidates().then((list) => {
              setItems(list);
              setTotal(list.length);
              setAiUsed(false);
              setSavedIds(new Set(list.map((c) => c.candidateUserId)));
            })
          : getPartnerCandidates({ q: q || undefined }).then((r) => {
              setItems(r.items);
              setTotal(r.total);
              setAiUsed(false);
            });
    p.then(() => setStatus("ready")).catch(() => setStatus("error"));
  }

  // 관심 인재 저장/해제(낙관적).
  function toggleSave(id: string) {
    const willSave = !savedIds.has(id);
    setSavedIds((prev) => {
      const n = new Set(prev);
      if (willSave) n.add(id);
      else n.delete(id);
      return n;
    });
    const req = willSave ? saveCandidate(id) : unsaveCandidate(id);
    void req.catch(() => {
      setSavedIds((prev) => {
        const n = new Set(prev);
        if (willSave) n.delete(id);
        else n.add(id);
        return n;
      });
      toast.error(t("저장에 실패했어요", "Couldn't save", "保存失败", "Không thể lưu", "保存に失敗しました", "Gagal menyimpan"));
    });
    if (!willSave && mode === "saved") setItems((prev) => prev.filter((c) => c.candidateUserId !== id));
  }

  function submit() {
    if (mode === "ai" && !query.trim()) return;
    run(mode, query.trim());
  }

  return (
    <PartnerAppShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t("인재 검색", "Talent search", "人才搜索", "Tìm nhân tài", "人材検索", "Cari talenta")}</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t("Aply에 이력서를 등록하고 공개에 동의한 인재를 찾아보세요.", "Find talent who registered a resume on Aply and agreed to be listed.", "查找在 Aply 上传简历并同意公开的人才。", "Tìm nhân tài đã đăng hồ sơ trên Aply và đồng ý công khai.", "Aplyに履歴書を登録し公開に同意した人材を探しましょう。", "Temukan talenta yang mendaftar resume di Aply dan setuju ditampilkan.")}</p>
        </div>

        {/* 블라인드 안내 — 편견 없는 능력 기반 열람 */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0B46E8]" weight="fill" />
          <p className="break-keep text-[12.5px] leading-relaxed text-[#4E5968]">{t("이름·사진·성별·국적은 가려지고 스킬·경험·언어 능력만 보여요. 관심 인재로 저장하면 후보에게 관심이 전해지고, 연결을 수락하면 신원과 연락처가 공개돼요.", "Names, photos, gender, and nationality are hidden — you see only skills, experience, and language. Saving a candidate signals your interest; identity and contact are revealed once they accept your connection.", "姓名、照片、性别、国籍均隐藏，仅显示技能、经验和语言能力。收藏人才即向其传达关注；对方接受连接后公开身份与联系方式。", "Tên, ảnh, giới tính, quốc tịch được ẩn — chỉ hiện kỹ năng, kinh nghiệm, ngôn ngữ. Lưu ứng viên sẽ gửi tín hiệu quan tâm; danh tính và liên hệ hiện khi họ chấp nhận kết nối.", "名前・写真・性別・国籍は隠され、スキル・経験・語学力のみ表示。人材を保存すると関心が伝わり、接続を承諾すると身元と連絡先が公開されます。", "Nama, foto, gender, dan kebangsaan disembunyikan — hanya keahlian, pengalaman, dan bahasa yang terlihat. Menyimpan kandidat menandakan minat; identitas dan kontak muncul saat mereka menerima koneksi.")}</p>
        </div>

        {/* 검색 모드 */}
        <div className="flex items-center gap-1 self-start rounded-full bg-[#F2F4F6] p-0.5">
          {([["keyword", t("키워드", "Keyword", "关键词", "Từ khóa", "キーワード", "Kata kunci")], ["ai", t("AI 검색", "AI search", "AI搜索", "Tìm AI", "AI検索", "Cari AI")], ["saved", t("관심 인재", "Saved", "收藏", "Đã lưu", "保存済み", "Tersimpan")]] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setMode(key);
                if (key === "saved") run("saved", "");
                else if (key === "keyword") run("keyword", query.trim());
              }}
              className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition ${mode === key ? "bg-white text-[#191F28] shadow-[0_1px_4px_rgba(11,18,39,0.08)]" : "text-[#8B95A1]"}`}
            >
              {key === "ai" ? <Sparkle className="h-3.5 w-3.5" weight="fill" /> : key === "saved" ? <BookmarkSimple className="h-3.5 w-3.5" weight="fill" /> : null}
              {label}
            </button>
          ))}
        </div>

        {/* 검색 입력 — 관심 인재 모드에서는 숨김 */}
        {mode !== "saved" ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#B0B8C1]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder={mode === "ai" ? t("예: 중국어 가능한 마케터, 개발 인턴 경험 있는 사람", "e.g. Marketer who speaks Chinese, someone with dev internship experience", "例：会中文的市场营销、有开发实习经验的人", "VD: Marketer biết tiếng Trung, người có kinh nghiệm thực tập lập trình", "例：中国語ができるマーケター、開発インターン経験者", "Mis: Marketer yang bisa bahasa Mandarin, orang dengan pengalaman magang dev") : t("이름·학교·전공·직무·스킬·국적 검색", "Search name, school, major, role, skill, nationality", "搜索姓名·学校·专业·职务·技能·国籍", "Tìm tên·trường·chuyên ngành·vị trí·kỹ năng·quốc tịch", "名前·学校·専攻·職務·スキル·国籍で検索", "Cari nama·sekolah·jurusan·posisi·skill·kebangsaan")}
              className="w-full rounded-2xl border border-[#EEF1F5] bg-white py-3 pl-11 pr-10 text-[14px] text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label={t("지우기", "Clear", "清除", "Xóa", "クリア", "Hapus")} className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#B0B8C1] transition hover:bg-[#F2F4F6]">
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <button type="button" onClick={submit} className="shrink-0 rounded-2xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">{t("검색", "Search", "搜索", "Tìm kiếm", "検索", "Cari")}</button>
        </div>
        ) : null}

        {status === "loading" ? <TListSkeleton /> : null}
        {status === "error" ? <TError onRetry={() => run(mode, query.trim())} /> : null}

        {status === "ready" ? (
          items.length === 0 ? (
            mode === "saved" ? (
              <PartnerEmptyCard emoji="⭐" title={t("저장한 관심 인재가 없어요", "No saved talent yet", "还没有收藏的人才", "Chưa có nhân tài đã lưu", "保存した人材がありません", "Belum ada talenta tersimpan")} desc={t("키워드·AI 검색에서 마음에 드는 인재의 별을 눌러 모아보세요.", "Tap the star on talent you like in keyword or AI search to collect them.", "在关键词或AI搜索中点击喜欢人才的星标即可收藏。", "Nhấn dấu sao trên nhân tài bạn thích trong tìm kiếm từ khóa hoặc AI để lưu lại.", "キーワード·AI検索で気になる人材の星を押して集めましょう。", "Ketuk bintang pada talenta yang Anda suka di pencarian kata kunci atau AI untuk menyimpannya.")} />
            ) : (
              <PartnerEmptyCard emoji="🔍" title={t("검색 결과가 없어요", "No results", "没有搜索结果", "Không có kết quả", "検索結果がありません", "Tidak ada hasil")} desc={mode === "ai" ? t("다른 표현으로 다시 검색해보세요.", "Try searching with different wording.", "换个说法再搜索。", "Thử tìm với cách diễn đạt khác.", "別の表現で再検索してみてください。", "Coba cari dengan kata lain.") : t("다른 키워드로 다시 검색해보세요.", "Try searching with different keywords.", "换个关键词再搜索。", "Thử tìm với từ khóa khác.", "別のキーワードで再検索してみてください。", "Coba cari dengan kata kunci lain.")} />
            )
          ) : (
            <>
              <p className="text-[12.5px] text-[#8B95A1]">
                {aiUsed ? t("AI가 적합도 순으로 정렬했어요 · ", "AI sorted by match · ", "AI已按匹配度排序 · ", "AI đã sắp xếp theo độ phù hợp · ", "AIが適合度順に並べ替えました · ", "AI mengurutkan berdasarkan kecocokan · ") : ""}{t(`인재 ${items.length}명`, `${items.length} talent`, `${items.length}位人才`, `${items.length} nhân tài`, `${items.length}名の人材`, `${items.length} talenta`)}{items.length !== total ? t(` (전체 ${total})`, ` (of ${total})`, ` (共 ${total})`, ` (trên ${total})`, ` (全${total})`, ` (dari ${total})`) : ""}
              </p>
              <div className="flex flex-col gap-2.5">
                {items.map((c) => (
                  <CandidateCard key={c.candidateUserId} c={c} saved={savedIds.has(c.candidateUserId)} onToggleSave={() => toggleSave(c.candidateUserId)} />
                ))}
              </div>
            </>
          )
        ) : null}
      </div>
    </PartnerAppShell>
  );
}

function CandidateCard({ c, saved, onToggleSave }: { c: PartnerCandidateCard; saved: boolean; onToggleSave: () => void }) {
  const t = usePlatformT();
  const edu = [c.school, c.major].filter(Boolean).join(" · ");
  return (
    <Link href={`${partnerRoutes.talent}/${encodeURIComponent(c.candidateUserId)}`} className="rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
      <div className="flex items-start gap-3.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[17px] font-black text-[#0B46E8]">{(c.name ?? "?").slice(0, 1)}</span>
        <button
          type="button"
          aria-label={saved ? t("관심 인재 해제", "Unsave", "取消收藏", "Bỏ lưu", "保存解除", "Batal simpan") : t("관심 인재로 저장", "Save talent", "收藏人才", "Lưu nhân tài", "人材を保存", "Simpan talenta")}
          aria-pressed={saved}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSave();
          }}
          className={`order-last shrink-0 rounded-full p-1.5 transition ${saved ? "text-[#0B46E8]" : "text-[#C4CAD2] hover:text-[#4E5968]"}`}
        >
          <BookmarkSimple className="h-5 w-5" weight={saved ? "fill" : "regular"} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-[15px] font-bold text-[#191F28]">{c.name ?? t("이름 비공개", "Name hidden", "姓名保密", "Ẩn tên", "名前非公開", "Nama disembunyikan")}</p>
            {typeof c.score === "number" ? <span className="rounded-md bg-[#EDF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">{t(`적합 ${c.score}`, `Match ${c.score}`, `匹配 ${c.score}`, `Phù hợp ${c.score}`, `適合 ${c.score}`, `Cocok ${c.score}`)}</span> : null}
            {c.connectionStatus === "ACCEPTED" ? (
              <span className="rounded-md bg-[#E7F8EF] px-2.5 py-0.5 text-[11px] font-bold text-[#0A9B59]">{t("연결됨", "Connected", "已连接", "Đã kết nối", "接続済み", "Terhubung")}</span>
            ) : c.connectionStatus === "PENDING" ? (
              <span className="rounded-md bg-[#F2F4F6] px-2.5 py-0.5 text-[11px] font-bold text-[#8B95A1]">{t("요청 보냄", "Requested", "已请求", "Đã gửi", "送信済み", "Diminta")}</span>
            ) : null}
          </div>
          {c.desiredJobRole ? <p className="mt-1 truncate text-[13px] font-semibold text-[#4E5968]">{c.desiredJobRole}</p> : null}

          <div className="mt-2 flex flex-col gap-1">
            {edu ? <span className="flex items-center gap-1.5 text-[12.5px] text-[#8B95A1]"><GraduationCap className="h-4 w-4 shrink-0 text-[#B0B8C1]" /> <span className="truncate">{edu}</span></span> : null}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {c.nationality ? <span className="flex items-center gap-1.5 text-[12.5px] text-[#8B95A1]"><Globe className="h-4 w-4 shrink-0 text-[#B0B8C1]" /> {c.nationality}</span> : null}
              {c.languages.length ? <span className="flex items-center gap-1.5 text-[12.5px] text-[#8B95A1]"><Translate className="h-4 w-4 shrink-0 text-[#B0B8C1]" /> <span className="truncate">{c.languages.slice(0, 2).join(", ")}</span></span> : null}
              {c.careerCount > 0 ? <span className="flex items-center gap-1.5 text-[12.5px] text-[#8B95A1]"><Briefcase className="h-4 w-4 shrink-0 text-[#B0B8C1]" /> {t(`경력 ${c.careerCount}`, `Career ${c.careerCount}`, `经历 ${c.careerCount}`, `Kinh nghiệm ${c.careerCount}`, `経歴 ${c.careerCount}`, `Pengalaman ${c.careerCount}`)}</span> : null}
            </div>
          </div>

          {c.skills.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {c.skills.slice(0, 6).map((s) => (
                <span key={s} className="rounded-md bg-[#F5F7FA] px-2.5 py-0.5 text-[11px] font-medium text-[#4E5968]">{s}</span>
              ))}
            </div>
          ) : null}

          {c.resumeBullets && c.resumeBullets.length ? (
            <div className="mt-2 rounded-lg bg-[#F8FAFB] px-3 py-2">
              <p className="flex items-center gap-1 text-[10.5px] font-bold text-[#8B95A1]"><Sparkle className="h-3 w-3 text-[#0B46E8]" weight="fill" /> {t("AI 이력서 요약", "AI resume summary", "AI简历摘要", "Tóm tắt hồ sơ AI", "AI履歴書要約", "Ringkasan resume AI")}</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {c.resumeBullets.slice(0, 3).map((b, i) => (
                  <li key={i} className="flex gap-1.5 text-[12px] leading-relaxed text-[#4E5968]">
                    <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[#0B46E8]" aria-hidden />
                    <span className="min-w-0 flex-1 break-keep">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {c.reason ? <p className="mt-2 break-keep rounded-lg bg-[#F5F8FF] px-2.5 py-1.5 text-[12px] leading-relaxed text-[#0B46E8]">{c.reason}</p> : null}
        </div>
      </div>
    </Link>
  );
}
