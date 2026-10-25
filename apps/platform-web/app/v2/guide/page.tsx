import { V2GuideScreen } from "../../../components/v2/screens/V2GuideScreen";
import { JsonLd } from "../../../components/seo/JsonLd";
import { breadcrumbJsonLd } from "../../../lib/seo-jsonld";

// 검색 노출(title·description·canonical)은 기존 취업 가이드 목록과 같다.
export { metadata } from "../../talent/insights/page";

export default function V2GuideRoute() {
  const crumbs = breadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "취업 가이드", path: "/talent/insights" }
  ]);
  return (
    <>
      {crumbs ? <JsonLd data={crumbs} /> : null}
      <V2GuideScreen />
    </>
  );
}
