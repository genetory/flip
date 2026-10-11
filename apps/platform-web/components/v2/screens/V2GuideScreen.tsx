"use client";

// v2 취업 가이드 — 직무 알아보기 · 취업 노하우 · 외국인 비자 · 한 줄 팁. 게스트도 본다.
// 글은 기존 콘텐츠(insights-content·home-content)를 그대로 쓰고, 본문은 기존 가이드 팝업(GuideModal)으로 연다.
import { useState } from "react";
import { V2Shell } from "../V2Shell";
import { Masthead, Page, Row, Section } from "../ui";
import { usePlatformT } from "../../../lib/i18n";
import { roleInsights, jobHunting, jobVisas } from "../../../lib/talent/insights-content";
import { homeTips, type CareerGuide } from "../../../lib/talent/home-content";
import { VISA_DETAILS } from "../../../lib/visa-details";
import { GuideModal } from "../../talent/screens/HomeScreen";

export function V2GuideScreen() {
  return (
    <V2Shell>
      <Guide />
    </V2Shell>
  );
}

function Guide() {
  const t = usePlatformT();
  const [open, setOpen] = useState<CareerGuide | null>(null);
  const oneLine = (s: string) => s.replace(/\n/g, " ");

  return (
    <Page>
      <Masthead
        eyebrow={t("취업 가이드", "Career guide", "求职指南", "Hướng dẫn", "就活ガイド", "Panduan karier")}
        title={t("한국 취업, 이것부터 알아 두세요", "What to know first about working in Korea", "在韩国就业，先了解这些", "Làm việc ở Hàn Quốc, hãy biết điều này trước", "韓国での就職、まずはこれを", "Kerja di Korea, ketahui ini dulu")}
        lede={t("직무, 지원 노하우, 비자까지 짧게 정리했어요.", "Roles, application know-how, and visas — in short.", "简要整理了职位、求职技巧和签证。", "Tóm tắt ngắn về nghề, bí quyết ứng tuyển và visa.", "職種・応募のコツ・ビザまで短くまとめました。", "Ringkas: peran, tips melamar, dan visa.")}
      />

      <Section title={t("직무 알아보기", "Explore roles", "了解职位", "Tìm hiểu nghề", "職種を知る", "Kenali peran")}>
        {roleInsights(t).map((g) => (
          <Row key={g.title} onClick={() => setOpen(g)} lead={g.emoji} title={oneLine(g.title)} meta={g.desc} />
        ))}
      </Section>

      <Section title={t("취업 노하우", "Job-hunting know-how", "求职技巧", "Bí quyết xin việc", "就活ノウハウ", "Tips melamar kerja")}>
        {jobHunting(t).map((g) => (
          <Row key={g.title} onClick={() => setOpen(g)} lead={g.emoji} title={oneLine(g.title)} meta={g.desc} />
        ))}
      </Section>

      <Section title={t("외국인을 위한 비자", "Visas for foreigners", "外国人签证", "Visa cho người nước ngoài", "外国人のためのビザ", "Visa untuk WNA")}>
        {jobVisas(t).map((v) => (
          <Row key={v.code} href={VISA_DETAILS[v.code] ? `/talent/visa/${v.code}` : undefined} lead={<span className="text-[13px] font-bold">{v.code}</span>} title={v.label} meta={v.desc} />
        ))}
        <p className="pb-2 pt-3 text-[13px] leading-[1.6] text-[color:var(--v2-faint)]">
          {t("비자 조건은 바뀔 수 있어요. 정확한 내용은 하이코리아·출입국사무소에서 확인하세요.", "Visa rules can change. Check HiKorea or the Immigration Office for details.", "签证条件可能变化，请在 HiKorea 或出入境事务所确认。", "Điều kiện visa có thể thay đổi. Hãy kiểm tra tại HiKorea hoặc Sở Xuất nhập cảnh.", "ビザの条件は変わることがあります。ハイコリア・出入国事務所でご確認ください。", "Aturan visa bisa berubah. Cek di HiKorea atau Kantor Imigrasi.")}
        </p>
      </Section>

      <Section title={t("한 줄 팁", "Quick tips", "一句话贴士", "Mẹo nhanh", "ひとことヒント", "Tips singkat")}>
        <ul>
          {homeTips(t).map((tip) => (
            <li key={tip.title} className="border-b border-[color:var(--v2-line)] py-4 last:border-b-0">
              <p className="text-[16px] font-semibold leading-[1.5] text-[color:var(--v2-ink)]">{tip.title}</p>
              <p className="mt-1 text-[15px] leading-[1.65] text-[color:var(--v2-muted)]">{tip.desc}</p>
            </li>
          ))}
        </ul>
      </Section>

      {open ? <GuideModal guide={open} onClose={() => setOpen(null)} /> : null}
    </Page>
  );
}
