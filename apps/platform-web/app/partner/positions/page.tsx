"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { Button } from "../../../components/ui/button";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { getMyPartnerOrganization, getPublicPositions, type PublicPositionListItem } from "../../../lib/member-profile-client";

type PositionStatusFilter = "ALL" | "DRAFT" | "OPEN" | "MATCHING" | "CLOSED";

function extractDomainFromEmail(email?: string | null) {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

function statusLabel(status: PublicPositionListItem["status"]) {
  if (status === "DRAFT") return "임시저장";
  if (status === "OPEN") return "모집 중";
  if (status === "MATCHING") return "매칭 진행";
  return "마감";
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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container py-10 md:py-14">
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-black tracking-[-0.02em] text-foreground md:text-3xl">포지션 관리</h1>
              <p className="mt-2 text-sm text-muted-foreground">등록한 포지션 상태를 확인하고 수정/마감할 수 있습니다.</p>
            </div>
            <Button asChild>
              <Link href="/partner/positions/new">포지션 등록</Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {([
              ["ALL", "전체"],
              ["DRAFT", "임시저장"],
              ["OPEN", "모집 중"],
              ["MATCHING", "매칭 진행"],
              ["CLOSED", "마감"]
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${filter === key ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
            <div className="grid grid-cols-12 border-b border-border/70 px-4 py-3 text-xs font-semibold text-muted-foreground">
              <div className="col-span-4">포지션명</div>
              <div className="col-span-2">분야</div>
              <div className="col-span-1">상태</div>
              <div className="col-span-1">지원자</div>
              <div className="col-span-2">등록일</div>
              <div className="col-span-2 text-right">액션</div>
            </div>

            {loading ? (
              <div className="px-4 py-8 text-sm text-muted-foreground">불러오는 중...</div>
            ) : error ? (
              <div className="px-4 py-8 text-sm text-destructive">{error}</div>
            ) : filteredItems.length === 0 ? (
              <div className="px-4 py-8 text-sm text-muted-foreground">해당 상태의 포지션이 없습니다.</div>
            ) : (
              <div>
                {filteredItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 items-center border-b border-border/60 px-4 py-3 text-sm last:border-b-0">
                    <div className="col-span-4 font-medium text-foreground">{item.title}</div>
                    <div className="col-span-2 text-muted-foreground">{item.preferredJobRole || "-"}</div>
                    <div className="col-span-1">{statusLabel(item.status)}</div>
                    <div className="col-span-1">{item.matchingParticipantsCount ?? 0}</div>
                    <div className="col-span-2 text-muted-foreground">{formatDate(item.createdAt)}</div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/positions/${item.id}`}>미리보기</Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/partner/positions/${item.id}/edit`}>수정</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
