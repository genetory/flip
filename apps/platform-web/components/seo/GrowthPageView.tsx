"use client";

// 공개 페이지 진입 계측 — 서버 컴포넌트에서 한 줄로 끼워 넣기 위한 얇은 클라이언트 래퍼.
// 개인정보는 보내지 않는다(공개 식별자와 화면 종류만).
import { useEffect, useRef } from "react";
import { trackContentView, trackJobDetailView, trackJobListView, trackLandingView, type GrowthSurface } from "../../lib/analytics";

type Props =
  | { kind: "landing"; surface: GrowthSurface }
  | { kind: "job_list"; count: number }
  | { kind: "job_detail"; positionId: string; closed?: boolean; external?: boolean }
  | { kind: "content"; surface: GrowthSurface; slug: string };

export function GrowthPageView(props: Props) {
  // 라우트당 1회만 — 리렌더로 중복 집계되지 않게 한다.
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    if (props.kind === "landing") trackLandingView(props.surface);
    else if (props.kind === "job_list") trackJobListView({ count: props.count });
    else if (props.kind === "job_detail") trackJobDetailView(props.positionId, { closed: props.closed, external: props.external });
    else trackContentView(props.surface, props.slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
