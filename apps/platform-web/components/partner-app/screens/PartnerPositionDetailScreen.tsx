"use client";

// 파트너 공고 상세 — 지원자(탤런트)에게 보이는 공고 내용을 미리보기 + 관리 액션(수정/마감/삭제).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PencilSimple, ArrowSquareOut } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TLoading, TError } from "../../talent/ui/primitives";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { PARTNER_POSITION_STATUS } from "../../../lib/partner/labels";
import { getMyPartnerPositionById, updateMyPartnerPosition, deleteMyPartnerPosition, type PartnerPosition } from "../../../lib/member-profile-client";

const EMPLOYMENT_LABEL: Record<PartnerPosition["employmentType"], string> = {
  FULL_TIME: "정규직",
  INTERN: "인턴",
  PART_TIME: "파트타임",
  UNPAID_INTERN: "무급 인턴"
};
const WORKTYPE_LABEL: Record<string, string> = { "On-site": "출근", Hybrid: "하이브리드", Remote: "재택" };

export function PartnerPositionDetailScreen({ positionId }: { positionId: string }) {
  const router = useRouter();
  const toast = useTalentPopup();
  const [p, setP] = useState<PartnerPosition | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);

  function load() {
    setStatus("loading");
    getMyPartnerPositionById(positionId)
      .then((d) => {
        setP(d);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionId]);

  function close() {
    if (busy || !p || p.status === "CLOSED") return;
    if (!window.confirm("이 공고를 마감할까요? 지원자에게 더 이상 노출되지 않아요.")) return;
    setBusy(true);
    updateMyPartnerPosition(positionId, { status: "CLOSED" })
      .then((d) => {
        setP(d);
        toast.success("공고를 마감했어요");
      })
      .catch(() => toast.error("마감에 실패했어요."))
      .finally(() => setBusy(false));
  }
  function remove() {
    if (busy) return;
    if (!window.confirm("이 공고를 삭제할까요? 되돌릴 수 없어요.")) return;
    setBusy(true);
    deleteMyPartnerPosition(positionId)
      .then(() => {
        toast.success("공고를 삭제했어요");
        router.push(partnerRoutes.positions);
      })
      .catch(() => toast.error("삭제에 실패했어요."))
      .finally(() => setBusy(false));
  }

  const meta = p ? [EMPLOYMENT_LABEL[p.employmentType], p.workType ? WORKTYPE_LABEL[p.workType] ?? p.workType : "", p.workLocation].filter(Boolean).join(" · ") : "";
  const thumbs = Array.isArray(p?.thumbnailImages) ? p!.thumbnailImages : [];

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-4" />
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" && p ? (
        <div className="flex flex-col gap-6">
          {/* 히어로 */}
          <div>
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${PARTNER_POSITION_STATUS[p.status].cls}`}>{PARTNER_POSITION_STATUS[p.status].label}</span>
              <a href={`/talent/jobs/${p.id}`} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-[12px] font-bold text-[#0B46E8] hover:underline">
                지원자 화면으로 보기 <ArrowSquareOut className="h-3.5 w-3.5" />
              </a>
            </div>
            <h1 className="mt-2 text-[22px] font-black tracking-[-0.02em] text-[#0B1227]">{p.title || "제목 없는 공고"}</h1>
            {meta ? <p className="mt-1 text-[13.5px] text-[#8B95A1]">{meta}</p> : null}
          </div>

          {/* 사진 */}
          {thumbs.length ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {thumbs.map((src, i) => (
                <div key={`${i}-${src.slice(0, 24)}`} className="aspect-[4/3] overflow-hidden rounded-2xl border border-[#EEF1F5] bg-[#F2F4F6]">
                  <Image src={src} alt={`공고 사진 ${i + 1}`} width={240} height={180} className="h-full w-full object-cover" unoptimized />
                </div>
              ))}
            </div>
          ) : null}

          {/* 모집 정보 */}
          <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
            <h2 className="text-[15px] font-bold text-[#191F28]">모집 정보</h2>
            <dl className="mt-3 flex flex-col gap-2.5">
              <Row label="고용 형태" value={EMPLOYMENT_LABEL[p.employmentType]} />
              <Row label="근무 형태" value={p.workType ? WORKTYPE_LABEL[p.workType] ?? p.workType : null} />
              <Row label="근무지" value={p.workLocation} />
              <Row label="채용 인원" value={p.hiringCount != null ? `${p.hiringCount}명` : null} />
              <Row label="근무 시간" value={p.workingHours} />
              <Row label="입사 예정일" value={p.startDate ? p.startDate.slice(0, 10) : null} />
              <Row label="선호 직무" value={p.preferredJobRole} />
            </dl>
          </section>

          {/* 상세 */}
          {p.mainResponsibilities ? <DocSection title="주요 업무" text={p.mainResponsibilities} /> : null}
          {p.requiredQualifications ? <DocSection title="자격 요건" text={p.requiredQualifications} /> : null}
          {p.preferredQualifications ? <DocSection title="우대 사항" text={p.preferredQualifications} /> : null}
          {p.hiringProcess ? <DocSection title="채용 절차" text={p.hiringProcess} /> : null}
          {p.additionalNotes ? <DocSection title="추가 안내" text={p.additionalNotes} /> : null}

          {/* 액션 */}
          <div className="flex flex-wrap justify-end gap-2.5 border-t border-[#F2F4F6] pt-5">
            <button type="button" onClick={remove} disabled={busy} className="inline-flex h-[46px] min-w-[100px] items-center justify-center rounded-2xl bg-[#FDECEE] px-5 text-[14px] font-bold text-[#F04452] transition hover:bg-[#FBDDE1] disabled:opacity-50">삭제</button>
            {p.status !== "CLOSED" ? (
              <button type="button" onClick={close} disabled={busy} className="inline-flex h-[46px] min-w-[100px] items-center justify-center rounded-2xl bg-[#F2F4F6] px-5 text-[14px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">마감</button>
            ) : null}
            <Link href={`${partnerRoutes.positions}/${p.id}/edit`} className="inline-flex h-[46px] min-w-[120px] items-center justify-center gap-1.5 rounded-2xl bg-[#0B46E8] px-6 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
              <PencilSimple className="h-4 w-4" weight="bold" /> 수정하기
            </Link>
          </div>
        </div>
      ) : null}
    </PartnerAppShell>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="w-[80px] shrink-0 text-[12.5px] text-[#8B95A1]">{label}</dt>
      <dd className="min-w-0 flex-1 break-keep text-[13.5px] text-[#191F28]">{value || "-"}</dd>
    </div>
  );
}

function DocSection({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
      <h2 className="text-[15px] font-bold text-[#191F28]">{title}</h2>
      <p className="mt-2 whitespace-pre-wrap break-keep text-[13.5px] leading-relaxed text-[#4E5968]">{text}</p>
    </section>
  );
}
