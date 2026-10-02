// 취업 가이드 목록. 화면은 기존 InsightsScreen 그대로이고, 여기서는 metadata 와
// 셸 안 하단의 가이드 링크 목록(검색엔진·사용자 모두가 주소로 접근할 수 있게)을 더한다.
import type { Metadata } from "next";
import Link from "next/link";
import { InsightsScreen } from "../../../components/talent/screens/InsightsScreen";
import { JsonLd } from "../../../components/seo/JsonLd";
import { breadcrumbJsonLd } from "../../../lib/seo-jsonld";
import { pageSeo } from "../../../lib/seo";
import { INSIGHTS, INSIGHT_CATEGORIES, categoryLabelKo, insightPath, insightsByCategory } from "../../../lib/insights/catalog";

export const metadata: Metadata = pageSeo({
  path: "/talent/insights",
  title: "취업 가이드 — 직무·이력서·면접·비자",
  description:
    "개발자·마케터는 무슨 일을 하는지, 경력이 없을 때 무엇을 어필하는지, 면접은 무엇을 준비하는지 정리했어요."
});

export default function TalentInsightsRoute() {
  const crumbs = breadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "취업 가이드", path: "/talent/insights" }
  ]);

  return (
    <>
      {crumbs ? <JsonLd data={crumbs} /> : null}
      <InsightsScreen
        seoSlot={
          INSIGHTS.length > 0 ? (
            <nav aria-label="가이드 전체 목록">
              <h2 className="text-[13px] font-bold text-[#8B95A1]">가이드 전체 보기</h2>
              <div className="mt-2 flex flex-col gap-4">
                {INSIGHT_CATEGORIES.map((c) => {
                  const items = insightsByCategory(c);
                  if (items.length === 0) return null;
                  return (
                    <section key={c} id={c}>
                      <h3 className="text-[12.5px] font-bold text-[#4E5968]">{categoryLabelKo(c)}</h3>
                      <ul className="mt-1 flex flex-col gap-1">
                        {items.map((x) => (
                          <li key={x.slug} className="text-[13px] leading-relaxed">
                            <Link href={insightPath(x)} className="text-[#4E5968] underline-offset-2 hover:underline">
                              {x.titleKo}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            </nav>
          ) : undefined
        }
      />
    </>
  );
}
