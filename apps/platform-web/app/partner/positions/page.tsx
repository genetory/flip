"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { Button } from "../../../components/ui/button";
import { PartnerAdminTwoColumn } from "../../../components/partner/PartnerAdminTwoColumn";
import { PartnerPositionCreatePage } from "../../../components/pages/PartnerPositionCreatePage";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { getMyPartnerOrganization, getPublicPositions, type PublicPositionListItem } from "../../../lib/member-profile-client";

type PositionStatusFilter = "ALL" | "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "OPEN" | "PAUSED" | "MATCHING" | "CLOSED" | "REJECTED";

function extractDomainFromEmail(email?: string | null) {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

function statusLabel(status: PublicPositionListItem["status"]) {
  if (status === "DRAFT") return "임시저장";
  if (status === "PENDING_REVIEW") return "승인 대기";
  if (status === "APPROVED") return "승인 완료";
  if (status === "OPEN") return "모집 중";
  if (status === "PAUSED") return "일시중지";
  if (status === "MATCHING") return "매칭 진행";
  if (status === "REJECTED") return "반려";
  return "마감";
}

function statusBadgeClass(status: PublicPositionListItem["status"]) {
  if (status === "DRAFT") return "bg-slate-100 text-slate-700 ring-slate-200";
  if (status === "PENDING_REVIEW") return "bg-amber-100 text-amber-800 ring-amber-200";
  if (status === "APPROVED") return "bg-sky-100 text-sky-800 ring-sky-200";
  if (status === "OPEN") return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  if (status === "PAUSED") return "bg-zinc-100 text-zinc-700 ring-zinc-200";
  if (status === "MATCHING") return "bg-violet-100 text-violet-800 ring-violet-200";
  if (status === "REJECTED") return "bg-rose-100 text-rose-800 ring-rose-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function filterBadgeClass(filterKey: PositionStatusFilter) {
  if (filterKey === "ALL") return "bg-slate-100 text-slate-700 ring-slate-200";
  return statusBadgeClass(filterKey);
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR");
}

export default function PartnerPositionsPage() {
  const { user } = useAuthSession();
  const [items, setItems] = useState<PublicPositionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PositionStatusFilter>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [org, all] = await Promise.all([getMyPartnerOrganization(), getPublicPositions()]);
        if (!mounted) return;
        const domain = org?.domain?.toLowerCase() ?? extractDomainFromEmail(user?.email) ?? "";
        const mine = all.filter((item) => item.partnerOrganization?.domain?.toLowerCase() === domain);
        setItems(mine);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "포지션 목록을 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.email]);

  const filteredItems = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((item) => item.status === filter);
  }, [filter, items]);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="container py-10 md:py-14">
        <PartnerAdminTwoColumn>
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-black tracking-[-0.02em] text-foreground md:text-3xl">포지션 관리</h1>
              <p className="mt-2 text-sm text-muted-foreground">등록한 포지션 상태를 확인하고 수정/마감할 수 있습니다.</p>
            </div>
            <Button
              type="button"
              className="rounded-xl bg-[#b7ff5a] font-semibold text-[#111111] hover:bg-[#a8ee4d]"
              onClick={() => setIsCreateOpen(true)}
            >
              포지션 등록
            </Button>
          </div>
          <div className="space-y-5">
            <div className="rounded-2xl bg-white p-4 md:p-5">
              <p className="text-sm font-bold text-[#0B1227]">상태 필터</p>
              <p className="mt-1 text-xs text-slate-500">보고 싶은 모집 상태만 선택해서 확인해보세요.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {([
                ["ALL", "전체"],
                ["DRAFT", "임시저장"],
                ["PENDING_REVIEW", "승인 대기"],
                ["APPROVED", "승인 완료"],
                ["OPEN", "모집 중"],
                ["PAUSED", "일시중지"],
                ["MATCHING", "매칭 진행"],
                ["CLOSED", "마감"],
                ["REJECTED", "반려"]
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`inline-flex h-9 items-center whitespace-nowrap rounded-full border px-3 text-sm transition-colors ${
                    filter === key
                      ? "border-foreground bg-foreground font-semibold text-background"
                      : "border-border bg-background font-medium text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            </div>

            <div className="rounded-2xl bg-white p-4 md:p-5">
              <section className="overflow-hidden">
                <div className="grid grid-cols-12 border-b border-border px-2 py-3 text-xs font-semibold text-muted-foreground">
                  <div className="col-span-3">포지션명</div>
                  <div className="col-span-2">분야</div>
                  <div className="col-span-2">상태</div>
                  <div className="col-span-1">지원자</div>
                  <div className="col-span-2">등록일</div>
                  <div className="col-span-2 text-right">액션</div>
                </div>

                {loading ? (
                  <div className="px-2 py-8 text-sm text-muted-foreground">불러오는 중...</div>
                ) : error ? (
                  <div className="px-2 py-8 text-sm text-destructive">{error}</div>
                ) : filteredItems.length === 0 ? (
                  <div className="px-2 py-8 text-sm text-muted-foreground">해당 상태의 포지션이 없습니다.</div>
                ) : (
                  <div>
                    {filteredItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 items-center border-b border-border/60 px-2 py-3.5 text-sm last:border-b-0">
                        <div className="col-span-3 truncate pr-3 font-medium text-foreground" title={item.title}>{item.title}</div>
                        <div className="col-span-2 truncate pr-3 text-muted-foreground" title={item.preferredJobRole || "-"}>{item.preferredJobRole || "-"}</div>
                        <div className="col-span-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${statusBadgeClass(item.status)}`}>
                            {statusLabel(item.status)}
                          </span>
                        </div>
                        <div className="col-span-1">{item.matchingParticipantsCount ?? 0}</div>
                        <div className="col-span-2 text-muted-foreground">{formatDate(item.createdAt)}</div>
                        <div className="col-span-2 flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="border-0 bg-slate-100 text-slate-700 hover:bg-slate-200" asChild>
                            <Link href={`/positions/${item.id}`}>미리보기</Link>
                          </Button>
                          <Button size="sm" className="bg-[#b7ff5a] font-semibold text-[#111111] hover:bg-[#a8ee4d]" asChild>
                            <Link href={`/partner/positions/${item.id}/edit`}>수정</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
        </PartnerAdminTwoColumn>
      </main>
      <Footer />
      {isCreateOpen ? <PartnerPositionCreatePage embedded onEmbeddedClose={() => setIsCreateOpen(false)} /> : null}
    </div>
  );
}
