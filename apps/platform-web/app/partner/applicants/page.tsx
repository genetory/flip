"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { Button } from "../../../components/ui/button";
import { PartnerAdminTwoColumn } from "../../../components/partner/PartnerAdminTwoColumn";
import {
  getMyPartnerApplicants,
  type PartnerApplicantListItem,
  type PartnerApplicantStatus
} from "../../../lib/member-profile-client";
import { getApplicantStatusLabel, PARTNER_APPLICANTS_MOCK } from "../../../lib/partner-applicants-data";

type StatusFilter = "ALL" | PartnerApplicantStatus;

const STATUS_FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "APPLIED", label: "지원 완료" },
  { key: "REVIEWING", label: "검토 중" },
  { key: "INTERVIEW", label: "면접 요청" },
  { key: "OFFERED", label: "합격 제안" },
  { key: "REJECTED", label: "불합격" }
];

function statusBadgeClass(status: PartnerApplicantStatus) {
  if (status === "APPLIED") return "bg-slate-100 text-slate-700 ring-slate-200";
  if (status === "REVIEWING") return "bg-amber-100 text-amber-800 ring-amber-200";
  if (status === "INTERVIEW") return "bg-violet-100 text-violet-800 ring-violet-200";
  if (status === "OFFERED") return "bg-sky-100 text-sky-800 ring-sky-200";
  if (status === "REJECTED") return "bg-rose-100 text-rose-800 ring-rose-200";
  if (status === "ACCEPTED") return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  if (status === "WITHDRAWN") return "bg-zinc-100 text-zinc-700 ring-zinc-200";
  return "bg-cyan-100 text-cyan-800 ring-cyan-200";
}

function filterBadgeClass(filterKey: StatusFilter) {
  if (filterKey === "ALL") return "bg-slate-100 text-slate-700 ring-slate-200";
  return statusBadgeClass(filterKey);
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR");
}

export default function PartnerApplicantsPage() {
  const [rows, setRows] = useState<PartnerApplicantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("ALL");

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const items = await getMyPartnerApplicants();
        if (!mounted) return;
        setRows(items);
      } catch (e) {
        if (!mounted) return;
        const message = e instanceof Error ? e.message : "지원자 목록을 불러오지 못했습니다.";
        if (message.includes("findMany")) {
          setRows(
            PARTNER_APPLICANTS_MOCK.map((item) => ({
              id: item.id,
              name: item.name,
              nationality: item.nationality,
              email: item.email,
              positionId: item.positionId,
              positionTitle: item.positionTitle,
              languages: item.languages,
              school: item.school,
              major: item.major,
              residence: item.residence,
              appliedAt: item.appliedAt,
              recommendation: item.recommendation,
              status: item.status
            }))
          );
          setError("실데이터 조회 중 오류가 있어 임시 데이터를 표시 중입니다.");
        } else {
          setError(message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const items = useMemo(() => {
    if (filter === "ALL") return rows;
    return rows.filter((item) => item.status === filter);
  }, [filter, rows]);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="container py-10 md:py-14">
        <PartnerAdminTwoColumn>
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-black tracking-[-0.02em] text-foreground md:text-3xl">지원자 관리</h1>
              <p className="mt-2 text-sm text-muted-foreground">지원자를 검토하고 상태를 변경하세요.</p>
            </div>
            <Button variant="outline" className="border-0 bg-slate-100 text-slate-700 hover:bg-slate-200" asChild>
              <Link href="/partner/dashboard">대시보드로</Link>
            </Button>
          </div>
          <div className="space-y-5">
            <div className="rounded-2xl bg-white p-4 md:p-5">
              <p className="text-sm font-bold text-[#0B1227]">상태 필터</p>
              <p className="mt-1 text-xs text-slate-500">지원 진행 상태별로 빠르게 확인해보세요.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {STATUS_FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`inline-flex h-9 items-center whitespace-nowrap rounded-full border px-3 text-sm transition-colors ${
                    filter === item.key
                      ? "border-foreground bg-foreground font-semibold text-background"
                      : "border-border bg-background font-medium text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            </div>

            <div className="rounded-2xl bg-white p-4 md:p-5">
              <section className="overflow-hidden">
                <div className="grid grid-cols-12 border-b border-border px-2 py-3 text-xs font-semibold text-muted-foreground">
                  <div className="col-span-2">이름</div>
                  <div className="col-span-4">지원 포지션</div>
                  <div className="col-span-2">언어</div>
                  <div className="col-span-2">지원일</div>
                  <div className="col-span-1">상태</div>
                  <div className="col-span-1 text-right">액션</div>
                </div>

                {loading ? (
                  <div className="px-2 py-8 text-sm text-muted-foreground">불러오는 중...</div>
                ) : error && rows.length === 0 ? (
                  <div className="px-2 py-8 text-sm text-destructive">{error}</div>
                ) : items.length === 0 ? (
                  <div className="px-2 py-8 text-sm text-muted-foreground">해당 상태의 지원자가 없습니다.</div>
                ) : (
                  <div>
                    {error ? <div className="px-2 py-2 text-xs text-amber-700">{error}</div> : null}
                    {items.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 items-center border-b border-border/60 px-2 py-3.5 text-sm last:border-b-0">
                        <div className="col-span-2">
                          <p className="truncate font-medium text-foreground" title={item.name}>{item.name}</p>
                          <p className="truncate text-xs text-muted-foreground" title={item.nationality ?? "-"}>{item.nationality ?? "-"}</p>
                        </div>
                        <div className="col-span-4 truncate pr-3 text-muted-foreground" title={item.positionTitle}>{item.positionTitle}</div>
                        <div className="col-span-2 truncate pr-3 text-muted-foreground" title={item.languages[0] ?? "-"}>{item.languages[0] ?? "-"}</div>
                        <div className="col-span-2 text-muted-foreground">{item.appliedAt ? formatDate(item.appliedAt) : "-"}</div>
                        <div className="col-span-1">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${statusBadgeClass(item.status)}`}>
                            {getApplicantStatusLabel(item.status)}
                          </span>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button size="sm" className="bg-[#b7ff5a] font-semibold text-[#111111] hover:bg-[#a8ee4d]" asChild>
                            <Link href={`/partner/applicants/${item.id}`}>상세</Link>
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
    </div>
  );
}
