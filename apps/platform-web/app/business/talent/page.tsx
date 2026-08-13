"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkle, X, MapPin, GraduationCap, Briefcase, EnvelopeSimple, Phone } from "@phosphor-icons/react";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import {
  searchPartnerCandidates,
  aiSearchCandidates,
  getPartnerCandidate,
  requestPartnerConnect,
  type PartnerCandidateCard,
  type PartnerCandidateDetail,
  type ConnectionStatus
} from "../../../lib/candidate-connect-client";
import { ResumePreview } from "../../../components/resume-maker/ResumePreview";
import { DEFAULT_DESIGN } from "../../../lib/resume-maker-types";
import type { ResumeContent } from "../../../lib/member-profile-client";
import { usePlatformT } from "../../../lib/i18n";

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const t = usePlatformT();
  if (!status) return null;
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: t("요청함", "Requested", "已请求", "Đã gửi", "申請済み", "Diminta"), cls: "bg-amber-50 text-amber-700 ring-amber-200" },
    ACCEPTED: { label: t("연결됨", "Connected", "已连接", "Đã kết nối", "接続済み", "Terhubung"), cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    DECLINED: { label: t("거절됨", "Declined", "已拒绝", "Đã từ chối", "拒否", "Ditolak"), cls: "bg-gray-100 text-gray-500 ring-gray-200" }
  };
  const m = map[status];
  if (!m) return null;
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${m.cls}`}>{m.label}</span>;
}

export default function BusinessTalentPage() {
  const { user, isReady, isAuthenticated } = useAuthSession();
  const t = usePlatformT();
  const canView = isAuthenticated && (user?.role === "PARTNER" || user?.role === "OPERATOR");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header variant="business" />
      <main className="flex-1">
        {/* 배너 — 포지션 탐색과 유사한 히어로 */}
        <section className="border-b border-[#EEF1F5] bg-gradient-to-br from-[#EDF1FD] to-[#F6F8FB]">
          <div className="mx-auto w-full max-w-6xl px-5 py-10 md:py-14">
            <p className="text-[13px] font-bold text-[#0B46E8]">{t("인재 탐색", "Talent search", "人才搜索", "Tìm nhân tài", "人材探索", "Cari talenta")}</p>
            <h1 className="mt-1.5 text-[26px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[32px]">{t("우리 회사에 맞는 글로벌 인재를 직접 찾아보세요", "Find the global talent that fits your company", "直接寻找适合贵公司的全球人才", "Tìm nhân tài toàn cầu phù hợp với công ty bạn", "御社に合うグローバル人材を直接探しましょう", "Temukan talenta global yang cocok untuk perusahaan Anda")}</h1>
            <p className="mt-2 max-w-2xl break-keep text-[14px] leading-relaxed text-[#4E5968]">
              {t("인재풀 등록에 동의한 후보자의 대표 이력서를 검색하고, 관심 있는 인재에게 연결을 요청할 수 있어요. 연락처는 후보자가 수락하면 공개됩니다.", "Search the representative resumes of candidates who opted into the talent pool, and request a connection with those you're interested in. Contact details are revealed once the candidate accepts.", "搜索已同意加入人才库的候选人的代表简历，并向感兴趣的人才发送连接请求。候选人接受后即公开联系方式。", "Tìm hồ sơ đại diện của ứng viên đã đồng ý tham gia nguồn nhân tài, và gửi yêu cầu kết nối tới người bạn quan tâm. Thông tin liên hệ được hiển thị khi ứng viên chấp nhận.", "人材プールへの登録に同意した候補者の代表履歴書を検索し、関心のある人材に連携をリクエストできます。連絡先は候補者が承諾すると公開されます。", "Cari resume perwakilan kandidat yang setuju masuk kumpulan talenta, dan kirim permintaan koneksi ke yang Anda minati. Kontak ditampilkan setelah kandidat menyetujui.")}
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-5 py-6 md:py-8">
          {!isReady ? (
            <p className="py-16 text-center text-[13px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p>
          ) : !canView ? (
            <AccessNotice authenticated={isAuthenticated} />
          ) : (
            <TalentSearch />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function AccessNotice({ authenticated }: { authenticated: boolean }) {
  const t = usePlatformT();
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-[#E5E8EB] bg-white p-8 text-center">
      <p className="text-[18px] font-black text-[#0B1227]">{t("파트너 전용 기능이에요", "Partner-only feature", "合作伙伴专属功能", "Tính năng chỉ dành cho đối tác", "パートナー専用機能です", "Fitur khusus mitra")}</p>
      <p className="mt-2 break-keep text-[13.5px] leading-relaxed text-[#4E5968]">
        {t("인재 탐색은 검증된 파트너(기업)만 이용할 수 있어요.", "Talent search is available only to verified partners (companies).", "人才搜索仅供已验证的合作伙伴（企业）使用。", "Tìm nhân tài chỉ dành cho đối tác (doanh nghiệp) đã xác minh.", "人材探索は検証済みのパートナー（企業）のみ利用できます。", "Cari talenta hanya tersedia untuk mitra (perusahaan) terverifikasi.")} {authenticated ? t("파트너 계정으로 로그인하거나 파트너 등록을 완료해 주세요.", "Please log in with a partner account or complete partner registration.", "请使用合作伙伴账户登录或完成合作伙伴注册。", "Vui lòng đăng nhập bằng tài khoản đối tác hoặc hoàn tất đăng ký đối tác.", "パートナーアカウントでログインするか、パートナー登録を完了してください。", "Silakan masuk dengan akun mitra atau selesaikan pendaftaran mitra.") : t("파트너 계정으로 로그인해 주세요.", "Please log in with a partner account.", "请使用合作伙伴账户登录。", "Vui lòng đăng nhập bằng tài khoản đối tác.", "パートナーアカウントでログインしてください。", "Silakan masuk dengan akun mitra.")}
      </p>
      <div className="mt-5 flex justify-center gap-2">
        {!authenticated ? (
          <Link href="/login" className="rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">{t("로그인", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk")}</Link>
        ) : null}
        <Link href="/business" className="rounded-xl border border-[#D7DCE3] bg-white px-5 py-2.5 text-[14px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40">{t("파트너 소개 보기", "About partners", "查看合作伙伴介绍", "Giới thiệu đối tác", "パートナー紹介を見る", "Tentang mitra")}</Link>
      </div>
    </div>
  );
}

function TalentSearch() {
  const t = usePlatformT();
  const PAGE_SIZE = 20;
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PartnerCandidateCard[]>([]); // 전체 목록(비-AI) 누적
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [aiMode, setAiMode] = useState(false);
  const [aiAll, setAiAll] = useState<PartnerCandidateCard[]>([]); // AI 매칭 전체
  const [visible, setVisible] = useState(PAGE_SIZE); // AI 결과 노출 개수
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    setAiMode(false);
    setPage(1);
    try {
      const r = await searchPartnerCandidates({ page: 1 });
      setItems(r.items);
      setTotal(r.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("인재 목록을 불러오지 못했어요.", "Couldn't load the talent list.", "无法加载人才列表。", "Không thể tải danh sách nhân tài.", "人材リストを読み込めませんでした。", "Tidak dapat memuat daftar talenta."));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreBrowse = useCallback(async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const r = await searchPartnerCandidates({ page: next });
      setItems((prev) => [...prev, ...r.items]);
      setTotal(r.total);
      setPage(next);
    } catch {
      // 무시 — 재시도 가능
    } finally {
      setLoadingMore(false);
    }
  }, [page]);

  const runAi = useCallback(async (qStr: string) => {
    setLoading(true);
    setError("");
    setAiMode(true);
    setVisible(PAGE_SIZE);
    try {
      const r = await aiSearchCandidates(qStr);
      setAiAll(r.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("AI 검색에 실패했어요.", "AI search failed.", "AI 搜索失败。", "Tìm kiếm AI thất bại.", "AI検索に失敗しました。", "Pencarian AI gagal."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const patchStatus = (candidateUserId: string, status: ConnectionStatus) => {
    const upd = (c: PartnerCandidateCard) => (c.candidateUserId === candidateUserId ? { ...c, connectionStatus: status } : c);
    setItems((prev) => prev.map(upd));
    setAiAll((prev) => prev.map(upd));
  };

  const list = aiMode ? aiAll.slice(0, visible) : items;
  const shownTotal = aiMode ? aiAll.length : total;
  const hasMore = aiMode ? visible < aiAll.length : items.length < total;
  const onLoadMore = () => {
    if (aiMode) setVisible((v) => v + PAGE_SIZE);
    else void loadMoreBrowse();
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) void runAi(query.trim());
          else void loadAll();
        }}
        className="mb-2 flex items-center gap-2 rounded-2xl border border-border/60 bg-white p-2 shadow-sm"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("원하는 인재상을 문장으로 (예: React 잘하고 스타트업 경험 있는 프론트엔드, 한국어 가능)", "Describe your ideal candidate (e.g. front-end dev strong in React with startup experience, Korean OK)", "用一句话描述理想人才（例如：精通 React、有创业经验的前端，会韩语）", "Mô tả ứng viên lý tưởng (vd: lập trình front-end giỏi React, có kinh nghiệm startup, biết tiếng Hàn)", "理想の人材を文章で（例：Reactが得意でスタートアップ経験のあるフロントエンド、韓国語可）", "Jelaskan kandidat ideal Anda (mis. dev front-end kuat di React dengan pengalaman startup, bisa bahasa Korea)")}
          className="h-11 min-w-0 flex-1 rounded-xl bg-transparent px-3 text-[14px] text-slate-800 outline-none placeholder:text-slate-400"
        />
        <button type="submit" className="inline-flex h-11 flex-none items-center justify-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
          <Sparkle className="h-4 w-4" weight="fill" /> {t("AI 검색", "AI search", "AI 搜索", "Tìm AI", "AI検索", "Cari AI")}
        </button>
      </form>
      <p className="mb-4 px-1 text-[12px] text-[#8B95A1]">{t("문장으로 검색하면 AI가 인재풀에서 적합도 순으로 찾아줘요. 비워두고 검색하면 전체 목록을 봅니다.", "Search with a sentence and AI finds candidates from the talent pool by fit. Search empty to see the full list.", "用一句话搜索，AI 会按匹配度从人才库中查找。留空搜索则查看完整列表。", "Tìm bằng một câu, AI sẽ tìm ứng viên theo độ phù hợp. Để trống rồi tìm để xem toàn bộ danh sách.", "文章で検索するとAIが人材プールから適合度順に探します。空欄で検索すると全リストを表示します。", "Cari dengan kalimat dan AI menemukan kandidat berdasarkan kesesuaian. Cari kosong untuk melihat seluruh daftar.")}</p>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#E5E8EB] border-t-[#0B46E8]" />
          <p className="text-[13px] font-medium text-[#8B95A1]">{aiMode ? t("AI가 적합한 인재를 찾는 중…", "AI is finding the best-fit talent…", "AI 正在寻找匹配人才…", "AI đang tìm nhân tài phù hợp…", "AIが最適な人材を探しています…", "AI sedang mencari talenta terbaik…") : t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p>
        </div>
      ) : error ? (
        <p className="py-16 text-center text-[13px] text-rose-600">{error}</p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D7DCE3] bg-[#FAFBFC] py-16 text-center">
          <p className="text-[14px] font-semibold text-[#4E5968]">{t("조건에 맞는 인재가 없어요.", "No matching talent found.", "没有符合条件的人才。", "Không có nhân tài phù hợp.", "条件に合う人材がいません。", "Tidak ada talenta yang cocok.")}</p>
          <p className="mt-1 text-[12.5px] text-[#8B95A1]">{t("인재풀 등록에 동의한 후보자만 표시됩니다. 검색어를 바꿔보세요.", "Only candidates who opted into the talent pool are shown. Try changing your search.", "仅显示已同意加入人才库的候选人。请尝试更换搜索词。", "Chỉ hiển thị ứng viên đã đồng ý tham gia nguồn nhân tài. Hãy đổi từ khóa.", "人材プール登録に同意した候補者のみ表示されます。検索語を変えてみてください。", "Hanya kandidat yang setuju masuk kumpulan talenta yang ditampilkan. Coba ubah pencarian.")}</p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12.5px] font-semibold text-[#8B95A1]">{aiMode ? <span className="text-[#0B46E8]">{t(`✨ AI 매칭 ${shownTotal}명 · 적합도 순`, `✨ ${shownTotal} AI matches · by fit`, `✨ AI 匹配 ${shownTotal} 人 · 按适合度`, `✨ ${shownTotal} kết quả AI · theo độ phù hợp`, `✨ AIマッチ ${shownTotal}名 · 適合度順`, `✨ ${shownTotal} kecocokan AI · sesuai`)}</span> : t(`총 ${shownTotal}명`, `${shownTotal} total`, `共 ${shownTotal} 人`, `Tổng ${shownTotal}`, `全 ${shownTotal}名`, `Total ${shownTotal}`)}</p>
            {aiMode ? <button type="button" onClick={() => { setQuery(""); void loadAll(); }} className="text-[12px] text-[#8B95A1] underline hover:text-[#4E5968]">{t("전체 보기", "View all", "查看全部", "Xem tất cả", "すべて表示", "Lihat semua")}</button> : null}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {list.map((c) => (
              <button
                key={c.candidateUserId}
                type="button"
                onClick={() => setDetailId(c.candidateUserId)}
                className="group relative flex h-full flex-col rounded-xl border border-border/60 bg-card p-4 text-left transition hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[15.5px] font-black text-[#0B1227]">{c.name ?? t("이름 비공개", "Name hidden", "姓名不公开", "Ẩn tên", "名前非公開", "Nama disembunyikan")}</p>
                    {c.nationality ? <p className="mt-0.5 flex items-center gap-1 truncate text-[12.5px] text-[#8B95A1]"><MapPin className="h-3.5 w-3.5" />{c.nationality}</p> : null}
                  </div>
                  <div className="flex flex-none flex-col items-end gap-1">
                    {typeof c.score === "number" ? <span className="rounded-lg bg-[#0B46E8] px-2 py-0.5 text-[13px] font-black text-white">{c.score}</span> : null}
                    <StatusBadge status={c.connectionStatus} />
                  </div>
                </div>
                {c.school || c.major ? (
                  <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-[#4E5968]"><GraduationCap className="h-4 w-4 text-[#8B95A1]" />{[c.school, c.major].filter(Boolean).join(" · ")}</p>
                ) : null}
                {c.desiredJobRole ? (
                  <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-[#4E5968]"><Briefcase className="h-4 w-4 text-[#8B95A1]" />{c.desiredJobRole}{c.workType ? ` · ${c.workType}` : ""}</p>
                ) : null}
                {c.skills.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.skills.slice(0, 6).map((s, i) => (
                      <span key={i} className="rounded-full bg-[#EDF1FD] px-2 py-0.5 text-[11px] font-semibold text-[#0B46E8]">{s}</span>
                    ))}
                  </div>
                ) : null}
                {c.reason ? (
                  <p className="mt-2 rounded-lg bg-[#F6F8FB] px-2.5 py-1.5 text-[11.5px] leading-relaxed text-[#4E5968]">💡 {c.reason}</p>
                ) : c.summary ? (
                  <p className="mt-2 line-clamp-2 break-keep text-[12px] leading-relaxed text-[#8B95A1]">{c.summary}</p>
                ) : null}
                {c.languages.length ? <p className="mt-1.5 truncate text-[11.5px] text-[#8B95A1]">🗣 {c.languages.join(" · ")}</p> : null}
                <p className="mt-1 text-[11.5px] text-[#B0B8C1]">{t("경력", "Career", "经历", "Kinh nghiệm", "経歴", "Karier")} {c.careerCount} · {t("활동", "Activities", "活动", "Hoạt động", "活動", "Aktivitas")} {c.activityCount}{c.visa ? ` · ${c.visa}` : ""}</p>
              </button>
            ))}
          </div>
          {hasMore ? (
            <div className="mt-8 flex items-center justify-center">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="rounded-xl border border-border bg-white px-6 py-2.5 text-[14px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8] disabled:opacity-50"
              >
                {loadingMore ? t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…") : t("더보기", "Load more", "查看更多", "Xem thêm", "もっと見る", "Muat lagi")}
              </button>
            </div>
          ) : null}
        </>
      )}

      {detailId ? <CandidateDetailModal candidateUserId={detailId} onClose={() => setDetailId(null)} onStatusChange={(s) => patchStatus(detailId, s)} /> : null}
    </>
  );
}

function CandidateDetailModal({
  candidateUserId,
  onClose,
  onStatusChange
}: {
  candidateUserId: string;
  onClose: () => void;
  onStatusChange: (status: ConnectionStatus) => void;
}) {
  const t = usePlatformT();
  const [mounted, setMounted] = useState(false);
  const [detail, setDetail] = useState<PartnerCandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [docTab, setDocTab] = useState<"resume" | "cover">("resume");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    void getPartnerCandidate(candidateUserId)
      .then((d) => {
        if (alive) setDetail(d);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : t("후보자 정보를 불러오지 못했어요.", "Couldn't load candidate details.", "无法加载候选人信息。", "Không thể tải thông tin ứng viên.", "候補者情報を読み込めませんでした。", "Tidak dapat memuat info kandidat."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [candidateUserId]);

  const connect = async () => {
    setConnecting(true);
    try {
      await requestPartnerConnect(candidateUserId, message);
      setDetail((d) => (d ? { ...d, connectionStatus: "PENDING" } : d));
      onStatusChange("PENDING");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("연결 요청에 실패했어요.", "Connection request failed.", "连接请求失败。", "Yêu cầu kết nối thất bại.", "連携リクエストに失敗しました。", "Permintaan koneksi gagal."));
    } finally {
      setConnecting(false);
    }
  };

  if (!mounted) return null;
  const status = detail?.connectionStatus ?? null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 p-4 md:p-8" onClick={onClose}>
      <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-5 py-3.5">
          <p className="text-[15px] font-black text-[#0B1227]">{detail?.name ?? t("후보자", "Candidate", "候选人", "Ứng viên", "候補者", "Kandidat")}</p>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[68vh] overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-12 text-center text-[13px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p>
          ) : error && !detail ? (
            <p className="py-12 text-center text-[13px] text-rose-600">{error}</p>
          ) : detail ? (
            <>
              {status === "ACCEPTED" && detail.contact ? (
                <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                  <p className="text-[12.5px] font-bold text-emerald-700">{t("✅ 연결 완료 — 연락처", "✅ Connected — contact", "✅ 已连接 — 联系方式", "✅ Đã kết nối — liên hệ", "✅ 連携完了 — 連絡先", "✅ Terhubung — kontak")}</p>
                  <div className="mt-1.5 space-y-0.5 text-[13px] text-[#191F28]">
                    {detail.contact.email ? <p className="flex items-center gap-1.5"><EnvelopeSimple className="h-4 w-4 text-[#8B95A1]" />{detail.contact.email}</p> : null}
                    {detail.contact.phone ? <p className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-[#8B95A1]" />{detail.contact.phone}</p> : null}
                  </div>
                </div>
              ) : (
                <div className="mb-3 rounded-xl bg-[#F8FAFC] p-3 text-[12px] text-[#8B95A1]">{t("🔒 연락처는 후보자가 연결을 수락하면 공개됩니다.", "🔒 Contact details are revealed once the candidate accepts.", "🔒 候选人接受连接后即公开联系方式。", "🔒 Thông tin liên hệ sẽ hiển thị khi ứng viên chấp nhận kết nối.", "🔒 連絡先は候補者が連携を承諾すると公開されます。", "🔒 Kontak ditampilkan setelah kandidat menerima koneksi.")}</div>
              )}
              {/* 이력서 / 자기소개서 탭 */}
              <div className="mb-3 flex gap-1 rounded-xl bg-[#F2F4F6] p-1">
                <button type="button" onClick={() => setDocTab("resume")} className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-bold transition ${docTab === "resume" ? "bg-white text-[#0B1227] shadow-sm" : "text-[#8B95A1]"}`}>{t("이력서", "Resume", "简历", "Hồ sơ", "履歴書", "Resume")}</button>
                <button type="button" onClick={() => setDocTab("cover")} className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-bold transition ${docTab === "cover" ? "bg-white text-[#0B1227] shadow-sm" : "text-[#8B95A1]"}`}>{t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己紹介書", "Surat lamaran")}{detail.coverLetter ? "" : t(" (없음)", " (none)", "（无）", " (không)", "（なし）", " (tidak ada)")}</button>
              </div>
              {docTab === "resume" ? (
                <div className="overflow-hidden rounded-xl border border-[#EEF1F5] [&_*]:!shadow-none">
                  <ResumePreview content={detail.content as ResumeContent} design={DEFAULT_DESIGN} />
                </div>
              ) : detail.coverLetter ? (
                <div className="rounded-xl border border-[#EEF1F5] p-4">
                  {detail.coverLetter.company ? <p className="mb-2 text-[12px] font-semibold text-[#0B46E8]">{detail.coverLetter.company}</p> : null}
                  <div className="space-y-3.5">
                    {detail.coverLetter.items.map((it, i) => (
                      <div key={i}>
                        {it.prompt ? <p className="text-[13px] font-bold text-[#191F28]">{it.prompt}</p> : null}
                        <p className="mt-1 whitespace-pre-wrap break-keep text-[13px] leading-relaxed text-[#4E5968]">{it.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#D7DCE3] bg-[#FAFBFC] py-10 text-center text-[13px] text-[#8B95A1]">{t("아직 등록된 자기소개서가 없어요.", "No cover letter added yet.", "尚未添加自我介绍。", "Chưa có thư giới thiệu.", "まだ自己紹介書が登録されていません。", "Belum ada surat lamaran.")}</div>
              )}
            </>
          ) : null}
        </div>
        {detail ? (
          <div className="border-t border-[#EEF1F5] px-5 py-3.5">
            {error && detail ? <p className="mb-2 text-[12px] text-rose-600">{error}</p> : null}
            {!status ? (
              <div className="space-y-2">
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder={t("후보자에게 전할 메시지 (선택) — 우리 회사·포지션을 소개해보세요", "Message to the candidate (optional) — introduce your company and role", "给候选人的留言（选填）— 介绍您的公司和职位", "Tin nhắn gửi ứng viên (tùy chọn) — giới thiệu công ty và vị trí", "候補者へのメッセージ（任意）— 会社やポジションを紹介しましょう", "Pesan untuk kandidat (opsional) — perkenalkan perusahaan dan posisi Anda")} className="w-full resize-none rounded-xl border border-[#E5E8EB] px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#0B46E8]" />
                <button type="button" onClick={() => void connect()} disabled={connecting} className="w-full rounded-xl bg-[#0B46E8] py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
                  {connecting ? t("요청 중…", "Requesting…", "请求中…", "Đang gửi…", "リクエスト中…", "Meminta…") : t("연결 요청 보내기", "Send connection request", "发送连接请求", "Gửi yêu cầu kết nối", "連携リクエストを送る", "Kirim permintaan koneksi")}
                </button>
              </div>
            ) : status === "PENDING" ? (
              <p className="text-center text-[13px] font-semibold text-amber-700">{t("연결 요청을 보냈어요. 후보자의 수락을 기다리는 중입니다.", "Connection request sent. Waiting for the candidate to accept.", "已发送连接请求。正在等待候选人接受。", "Đã gửi yêu cầu kết nối. Đang chờ ứng viên chấp nhận.", "連携リクエストを送りました。候補者の承諾を待っています。", "Permintaan koneksi terkirim. Menunggu kandidat menerima.")}</p>
            ) : status === "DECLINED" ? (
              <p className="text-center text-[13px] text-[#8B95A1]">{t("후보자가 이 연결 요청을 거절했어요.", "The candidate declined this connection request.", "候选人拒绝了此连接请求。", "Ứng viên đã từ chối yêu cầu kết nối này.", "候補者がこの連携リクエストを拒否しました。", "Kandidat menolak permintaan koneksi ini.")}</p>
            ) : (
              <p className="text-center text-[13px] font-semibold text-emerald-700">{t("연결된 후보자입니다.", "This candidate is connected.", "已连接的候选人。", "Ứng viên đã kết nối.", "連携済みの候補者です。", "Kandidat ini sudah terhubung.")}</p>
            )}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
