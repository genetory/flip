"use client";

// 회사 상세 — 포지션 상세의 회사 정보 카드 + 그 회사가 올린 피드 + 포지션 리스트.
import { useEffect, useMemo, useState } from "react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { TEmpty, TError, TLoading } from "../ui/primitives";
import { FeedPostList } from "../feed/FeedPostList";
import { PositionCard } from "../jobs/PositionCard";
import { TalentCipModal } from "../jobs/TalentCipModal";
import { CompanySection } from "./JobDetailScreen";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useSocialFeed } from "../../../lib/talent/social-feed";
import {
  getPublicPositionsPage,
  getMyFavoritePositions,
  addMyFavoritePosition,
  removeMyFavoritePosition,
  type PublicPositionListItem
} from "../../../lib/member-profile-client";
import { toPositionView } from "../../../lib/talent/positions-adapter";

export function CompanyDetailScreen({ name }: { name: string }) {
  const { locale } = useLanguage();
  const allPosts = useSocialFeed();
  const [positions, setPositions] = useState<PublicPositionListItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [cipOpen, setCipOpen] = useState(false);

  useEffect(() => {
    setStatus("loading");
    void getPublicPositionsPage({ search: name, limit: 100, locale })
      .then((page) => {
        // 검색은 제목/직무도 매칭하므로 회사명이 정확히 일치하는 공고만.
        const mine = page.items.filter((p) => (p.partnerOrganization?.name || p.sourceCompanyName) === name);
        setPositions(mine);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
    void getMyFavoritePositions()
      .then((list) => setSavedIds(new Set(list.map((p) => p.id))))
      .catch(() => {});
  }, [name, locale]);

  const companyItem = useMemo(() => positions.find((p) => p.partnerOrganization) ?? positions[0], [positions]);
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
      <div className="flex flex-col gap-5">
        <div>
          <TalentBackButton className="mb-3" />
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{name}</h1>
        </div>

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={() => setStatus("loading")} /> : null}

        {status === "ready" ? (
          <>
            {/* 회사 정보 — 포지션 상세와 동일한 카드 */}
            {companyItem ? <CompanySection item={companyItem} /> : null}

            {/* 회사가 올린 피드 */}
            <section className="flex flex-col gap-3">
              <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">회사 소식</h2>
              {companyPosts.length ? (
                <FeedPostList posts={companyPosts} />
              ) : (
                <TEmpty title="아직 올라온 소식이 없어요" description="이 회사가 피드에 글을 남기면 여기에 보여드릴게요." />
              )}
            </section>

            {/* 회사 포지션 */}
            <section className="flex flex-col gap-3">
              <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">포지션 {positions.length ? positions.length : ""}</h2>
              {positions.length ? (
                <div className="flex flex-col gap-3">
                  {positions.map((item) => (
                    <PositionCard key={item.id} view={toPositionView(item)} saved={savedIds.has(item.id)} onToggleSave={toggleSave} onShowCip={() => setCipOpen(true)} />
                  ))}
                </div>
              ) : (
                <TEmpty title="진행 중인 포지션이 없어요" description="새 포지션이 열리면 알림으로 알려드릴게요." />
              )}
            </section>
          </>
        ) : null}
      </div>

      {cipOpen ? <TalentCipModal locale={locale} onClose={() => setCipOpen(false)} /> : null}
    </TalentAppShell>
  );
}
