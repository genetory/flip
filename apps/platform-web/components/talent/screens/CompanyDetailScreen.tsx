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
              <SectionHead title="이 회사, 요즘 이런 이야기를 나눠요" desc="회사가 피드에 남긴 소식을 모았어요." />
              {companyPosts.length ? (
                <FeedPostList posts={companyPosts} />
              ) : (
                <TEmpty title="아직 올라온 소식이 없어요" description="이 회사가 피드에 글을 남기면 여기에 보여드릴게요." />
              )}
            </section>

            {/* 회사 포지션 */}
            <section className="flex flex-col gap-3">
              <SectionHead
                title="지금 이런 사람을 찾고 있어요"
                desc={<>열어둔 포지션 <span className="font-bold text-[#191F28]">{positions.length}</span>개 · 바로 지원해볼 수 있어요.</>}
              />
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
