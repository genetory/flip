// Career Launch 공개 소개(서버). 예전에는 이 경로가 바로 로그인 화면이라 검색으로 들어온
// 방문자가 프로그램 내용을 보기 전에 로그인을 요구받았다. 로그인·초대코드 분기는
// /career-launch/start 로 옮겼다(기존 동작 그대로).
import type { Metadata } from "next";
import { CareerLaunchPublicLanding } from "../../components/launch/CareerLaunchPublicLanding";
import { LaunchEnrolledRedirect } from "../../components/launch/LaunchEnrolledRedirect";
import { JsonLd } from "../../components/seo/JsonLd";
import { breadcrumbJsonLd } from "../../lib/seo-jsonld";
import { pageSeo } from "../../lib/seo";

export const metadata: Metadata = pageSeo({
  path: "/career-launch",
  title: "Career Launch — 4주 취업 준비 프로그램",
  description:
    "4주 동안 강점 발견부터 한국식 이력서·자기소개서와 실전 모의면접까지. 외국인 구직자를 위한 무료 취업 준비 프로그램."
});

export default function CareerLaunchLandingRoute() {
  const crumbs = breadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "Career Launch", path: "/career-launch" }
  ]);
  return (
    <>
      {crumbs ? <JsonLd data={crumbs} /> : null}
      {/* 이미 수강 중인 사용자는 대시보드로 보낸다 — 기존 사용자의 동선을 바꾸지 않는다. */}
      <LaunchEnrolledRedirect />
      <CareerLaunchPublicLanding />
    </>
  );
}
