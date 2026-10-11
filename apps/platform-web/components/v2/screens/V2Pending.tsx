"use client";

import { V2Shell } from "../V2Shell";
import { Masthead, Page, TextLink } from "../ui";
import { usePlatformT } from "../../../lib/i18n";

// v2 경로 → 지금(기존) 화면. 아직 옮기지 않은 메뉴를 눌렀을 때 길을 잃지 않게.
const CURRENT: Record<string, string> = {
  career: "/talent/career",
  jobs: "/talent/jobs",
  interviews: "/talent/career/interviews",
  applications: "/talent/applications",
  guide: "/talent/insights"
};

export function V2Pending({ slug }: { slug: string }) {
  const t = usePlatformT();
  const current = CURRENT[slug.split("/")[0]] ?? "/talent/home";
  return (
    <V2Shell>
      <Page>
        <Masthead
          eyebrow={t("리뉴얼 중", "Being redesigned", "改版中", "Đang làm mới", "リニューアル中", "Sedang didesain ulang")}
          title={t("이 화면은 새로 만드는 중이에요", "This page is being rebuilt", "此页面正在重新制作", "Trang này đang được làm lại", "この画面は作り直し中です", "Halaman ini sedang dibuat ulang")}
          lede={t("그동안은 지금 화면에서 이용할 수 있어요.", "Meanwhile, you can use the current version.", "在此期间可使用当前版本。", "Trong lúc này, bạn có thể dùng phiên bản hiện tại.", "それまでは今の画面をご利用ください。", "Sementara itu, pakai versi saat ini.")}
          action={<TextLink href={current}>{t("지금 화면으로 가기", "Go to the current page", "前往当前页面", "Đến trang hiện tại", "今の画面へ", "Ke halaman saat ini")}</TextLink>}
        />
      </Page>
    </V2Shell>
  );
}
