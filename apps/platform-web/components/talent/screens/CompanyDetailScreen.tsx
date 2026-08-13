"use client";

// 회사 상세 — 포지션 상세의 회사 정보 카드 + 그 회사가 올린 피드 + 포지션 리스트.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { TEmpty, TError, TLoading } from "../ui/primitives";
import { FeedPostList } from "../feed/FeedPostList";
import { PositionCard } from "../jobs/PositionCard";
import { TalentCipModal } from "../jobs/TalentCipModal";
import { CompanySection, CompanyHeader } from "./JobDetailScreen";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT } from "../../../lib/i18n";
import { useSocialFeed } from "../../../lib/talent/social-feed";
import {
  getPublicPositionsPage,
  getPublicPositionById,
  getMyFavoritePositions,
  addMyFavoritePosition,
  removeMyFavoritePosition,
  type PublicPositionListItem
} from "../../../lib/member-profile-client";
import { toPositionView } from "../../../lib/talent/positions-adapter";
import { notifySavedPosition } from "../../../lib/talent/activity-log";

// 구어체 섹션 헤더 — 제목 + 한 줄 설명으로 섹션을 부드럽게 구분.
function SectionHead({ title, desc }: { title: string; desc: ReactNode }) {
  return (
    <div>
      <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
      <p className="mt-1 text-[13px] text-[#8B95A1]">{desc}</p>
    </div>
  );
}

export function CompanyDetailScreen({ name }: { name: string }) {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const allPosts = useSocialFeed();
  const [positions, setPositions] = useState<PublicPositionListItem[]>([]);
  const [companyItem, setCompanyItem] = useState<PublicPositionListItem | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [cipOpen, setCipOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    setCompanyItem(null);
    void getPublicPositionsPage({ company: name, limit: 100, locale })
      .then(async (page) => {
        if (!alive) return;
        // 서버가 company 필터를 적용(배포 후)하면 no-op, 미배포면 클라 안전 필터.
        const mine = page.items.filter((p) => (p.partnerOrganization?.name || p.sourceCompanyName) === name);
        setPositions(mine);
        setStatus("ready");
        // 회사 정보 카드는 사무실 사진 등 완전한 org 위해 대표 공고 상세를 가져온다(목록엔 일부 필드 없음).
        const rep = mine.find((p) => p.partnerOrganization) ?? mine[0];
        if (rep) {
          const full = await getPublicPositionById(rep.id, { locale }).catch(() => null);
          if (alive) setCompanyItem(full ?? rep);
        }
      })
      .catch(() => alive && setStatus("error"));
    void getMyFavoritePositions()
      .then((list) => alive && setSavedIds(new Set(list.map((p) => p.id))))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [name, locale]);
  const companyPosts = useMemo(
    () => allPosts.filter((p) => p.authorRole === "PARTNER" && p.authorName === name),
    [allPosts, name]
  );

  function toggleSave(id: string) {
    const willSave = !savedIds.has(id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (willSave) next.add(id);
      else next.delete(id);
      return next;
    });
    if (willSave) notifySavedPosition(t, id);
    const req = willSave ? addMyFavoritePosition(id) : removeMyFavoritePosition(id);
    void req.catch(() => {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (willSave) next.delete(id);
        else next.add(id);
        return next;
      });
    });
  }

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-10">
        <div>
          <TalentBackButton className="mb-3" />
          {/* 썸네일·회사명·관심 회사 — 맨 상단 헤더 */}
          {companyItem ? (
            <CompanyHeader item={companyItem} large />
          ) : (
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{name}</h1>
          )}
        </div>

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={() => setStatus("loading")} /> : null}

        {status === "ready" ? (
          <>
            {/* 회사 정보 — 포지션 상세와 동일한 카드(헤더 제외) */}
            {companyItem ? <CompanySection item={companyItem} /> : null}

            {/* 회사가 올린 피드 */}
            <section className="flex flex-col gap-3">
              <SectionHead title={t("이 회사, 요즘 이런 이야기를 나눠요", "What this company is talking about", "这家公司最近在聊什么", "Công ty này đang chia sẻ điều gì", "この会社の最近の話題", "Apa yang dibicarakan perusahaan ini")} desc={t("회사가 피드에 남긴 소식을 모았어요.", "News the company shared on its feed.", "汇集了公司在动态中分享的消息。", "Tin công ty đăng trên feed.", "会社がフィードに残した最新情報です。", "Kabar yang dibagikan perusahaan di feed.")} />
              {companyPosts.length ? (
                <FeedPostList posts={companyPosts} />
              ) : (
                <TEmpty title={t("아직 올라온 소식이 없어요", "No news yet", "还没有消息", "Chưa có tin nào", "まだ投稿がありません", "Belum ada kabar")} description={t("이 회사가 피드에 글을 남기면 여기에 보여드릴게요.", "When this company posts, it'll show here.", "这家公司发布动态后会显示在这里。", "Khi công ty này đăng bài, sẽ hiện ở đây.", "この会社が投稿するとここに表示されます。", "Saat perusahaan ini memposting, akan muncul di sini.")} />
              )}
            </section>

            {/* 회사 포지션 */}
            <section className="flex flex-col gap-3">
              <SectionHead
                title={t("지금 이런 사람을 찾고 있어요", "Who they're hiring now", "他们正在招聘这样的人", "Họ đang tìm người như bạn", "今こんな人を探しています", "Siapa yang mereka cari sekarang")}
                desc={<>{t("열어둔 포지션", "Open positions", "开放职位", "Vị trí đang tuyển", "募集中のポジション", "Posisi terbuka")} <span className="font-bold text-[#191F28]">{positions.length}</span>{t("개 · 바로 지원해볼 수 있어요.", " · Apply right away.", " 个 · 可立即申请。", " · Ứng tuyển ngay.", "件 · すぐ応募できます。", " · Lamar sekarang.")}</>}
              />
              {positions.length ? (
                <div className="flex flex-col gap-3">
                  {positions.map((item) => (
                    <PositionCard key={item.id} view={toPositionView(item, t)} saved={savedIds.has(item.id)} onToggleSave={toggleSave} onShowCip={() => setCipOpen(true)} />
                  ))}
                </div>
              ) : (
                <TEmpty title={t("진행 중인 포지션이 없어요", "No open positions", "没有进行中的职位", "Không có vị trí đang tuyển", "進行中のポジションはありません", "Tidak ada posisi terbuka")} description={t("새 포지션이 열리면 알림으로 알려드릴게요.", "We'll notify you when a new position opens.", "有新职位开放时会通知你。", "Chúng tôi sẽ báo khi có vị trí mới.", "新しいポジションが開いたらお知らせします。", "Kami beri tahu saat ada posisi baru.")} />
              )}
            </section>
          </>
        ) : null}
      </div>

      {cipOpen ? <TalentCipModal locale={locale} onClose={() => setCipOpen(false)} /> : null}
    </TalentAppShell>
  );
}
