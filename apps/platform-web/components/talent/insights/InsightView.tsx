"use client";

// 가이드 열람 1회 계측. 화면에는 아무것도 그리지 않는다.
import { useEffect, useRef } from "react";
import { useLanguage } from "../../i18n/LanguageProvider";
import { trackInsightView } from "../../../lib/analytics";

export function InsightView({ slug, category }: { slug: string; category: string }) {
  const { locale } = useLanguage();
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackInsightView(slug, category, locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
