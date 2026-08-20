"use client";

// 선정한 관심 직무의 '지금 열린 실제 채용 공고' 미리보기 — 정적 추천을 라이브 공고 데이터로 잇는다.
// 각 직무의 검색어(RECOMMENDED_JOBS.query, 없으면 직무명)로 공개 공고를 조회해 몇 개만 보여준다.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase } from "@phosphor-icons/react";
import { getPublicPositionsPage, type PublicPositionListItem } from "../../lib/member-profile-client";
import { RECOMMENDED_JOBS } from "../../lib/launch/data";
import { useLaunchT } from "../../lib/launch/i18n";

export function RealOpeningsPreview({ roles }: { roles: string[] }) {
  const t = useLaunchT();
  const [items, setItems] = useState<PublicPositionListItem[] | null>(null);
  const key = roles.join("|");

  useEffect(() => {
    if (roles.length === 0) {
      setItems([]);
      return;
    }
    let alive = true;
    void (async () => {
      const queries = roles.map((r) => RECOMMENDED_JOBS.find((j) => j.role === r)?.query || r);
      const pages = await Promise.all(queries.map((q) => getPublicPositionsPage({ search: q, limit: 3 }).catch(() => null)));
      if (!alive) return;
      const seen = new Set<string>();
      const merged: PublicPositionListItem[] = [];
      for (const p of pages) {
        for (const it of p?.items ?? []) {
          if (seen.has(it.id) || merged.length >= 6) continue;
          seen.add(it.id);
          merged.push(it);
        }
      }
      setItems(merged);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 로딩 중이거나 매칭 공고가 없으면 조용히 숨긴다(빈 카드로 방해하지 않음).
  if (items === null || items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0B46E8]">
        {t("지금 열린 실제 채용 공고", "Live openings for your picks", "现在正在招聘的实际职位", "Tin tuyển dụng thật đang mở", "今開いている実際の求人", "Lowongan nyata yang sedang dibuka")}
      </p>
      <p className="mt-1 break-keep text-[12px] leading-relaxed text-[#8B95A1]">
        {t("선정한 직무로 지금 채용 중인 공고예요. 4주 뒤 완성한 서류로 바로 지원해봐요.", "These are hiring right now for your chosen roles. In 4 weeks, apply with your finished docs.", "这些是你所选职务当前正在招聘的职位。4周后用完成的材料直接申请吧。", "Đây là các tin đang tuyển cho nghề bạn chọn. Sau 4 tuần, hãy ứng tuyển bằng hồ sơ hoàn thiện.", "選んだ職種で今採用中の求人です。4週間後に完成した書類でそのまま応募しましょう。", "Ini sedang merekrut untuk peran pilihanmu. Setelah 4 minggu, lamar dengan dokumen jadimu.")}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {items.map((it) => {
          const company = it.partnerOrganization?.name || it.sourceCompanyName || "";
          return (
            <Link
              key={it.id}
              href={`/talent/jobs/${it.id}`}
              className="flex items-center gap-3 rounded-xl border border-[#EEF1F5] bg-[#F8FAFC] px-3 py-2.5 transition hover:border-[#0B46E8]/40 hover:bg-white"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EDF1FD] text-[#0B46E8]">
                <Briefcase className="h-4 w-4" weight="fill" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-[#191F28]">{it.title}</p>
                {company ? <p className="truncate text-[11.5px] text-[#8B95A1]">{company}</p> : null}
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
