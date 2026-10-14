"use client";

// v2 회사 — Aply에 등록해 직접 채용 중인 회사 목록. 회사 목록 API 가 따로 없어 직접 채용 공고(INTERNAL)를 읽어 회사별로 묶는다.
// 공고 수 많은 순, 이름으로 찾기(화면 안에서). 누르면 회사 상세로.
import { useEffect, useState } from "react";
import { V2Shell } from "../V2Shell";
import { Chip, Empty, Masthead, Page, Row, RowsSkeleton, SearchField, Section } from "../ui";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT } from "../../../lib/i18n";
import { getPublicPositionsPage } from "../../../lib/member-profile-client";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";

type Company = { name: string; industry?: string; count: number; photo: string | null };

export function V2CompaniesScreen() {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const map = new Map<string, Company>();
      // 한 번에 100개까지 — 최대 5쪽(500개)만 읽는다.
      for (let page = 1; page <= 5; page++) {
        const p = await getPublicPositionsPage({ page, limit: 100, sourceProviders: ["INTERNAL"], locale }).catch(() => null);
        if (!p) break;
        for (const j of p.items) {
          const org = j.partnerOrganization;
          if (!org?.name) continue;
          const e = map.get(org.name) ?? { name: org.name, industry: org.industry ? partnerIndustryLabel(org.industry) : undefined, count: 0, photo: org.officePhotoImageData || org.companyLogoImageData || null };
          e.count += 1;
          map.set(org.name, e);
        }
        if (p.items.length < 100) break;
      }
      if (alive) setCompanies([...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)));
    })();
    return () => {
      alive = false;
    };
  }, [locale]);

  const industries = [...new Set((companies ?? []).map((c) => c.industry).filter((x): x is string => !!x))];
  const term = q.trim().toLowerCase();
  const shown = (companies ?? []).filter((c) => (!industry || c.industry === industry) && (!term || c.name.toLowerCase().includes(term)));

  return (
    <V2Shell>
      <Page>
        <Masthead
          eyebrow={t("회사", "Companies", "公司", "Công ty", "企業", "Perusahaan")}
          title={t("Aply에서 채용 중인 회사", "Companies hiring on Aply", "在 Aply 招聘的公司", "Công ty tuyển trên Aply", "Aplyで採用中の企業", "Perusahaan di Aply")}
          lede={companies ? t(`${companies.length}곳이 직접 채용하고 있어요.`, `${companies.length} companies hiring directly.`, `${companies.length} 家公司直接招聘。`, `${companies.length} công ty tuyển trực tiếp.`, `${companies.length}社が直接採用中です。`, `${companies.length} perusahaan merekrut langsung.`) : undefined}
        />
        <div className="px-5 pb-4">
          <SearchField
            value={q}
            onChange={setQ}
            onSubmit={() => undefined}
            onClear={() => setQ("")}
            submitLabel={t("찾기", "Search", "搜索", "Tìm", "検索", "Cari")}
            clearLabel={t("지우기", "Clear", "清除", "Xóa", "クリア", "Hapus")}
            placeholder={t("회사 이름으로 찾기", "Search by company name", "按公司名称搜索", "Tìm theo tên công ty", "会社名で探す", "Cari nama perusahaan")}
          />
          {industries.length > 1 ? (
            <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">
              <Chip active={!industry} onClick={() => setIndustry(null)}>
                {t("전체", "All", "全部", "Tất cả", "すべて", "Semua")}
              </Chip>
              {industries.map((i) => (
                <Chip key={i} active={industry === i} onClick={() => setIndustry(industry === i ? null : i)}>
                  {i}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
        <Section title={t("회사 목록", "Companies", "公司列表", "Danh sách", "企業一覧", "Daftar")} aside={companies ? <span className="text-[14px] text-[color:var(--v2-muted)]">{shown.length}</span> : undefined}>
          {companies === null ? (
            <RowsSkeleton count={6} />
          ) : shown.length ? (
            shown.map((c) => (
              <Row
                key={c.name}
                href={`/talent/company/${encodeURIComponent(c.name)}`}
                thumb={{ src: c.photo, fallback: c.name }}
                title={c.name}
                meta={[c.industry, t(`채용 중 ${c.count}`, `${c.count} open`, `在招 ${c.count}`, `${c.count} vị trí`, `募集中 ${c.count}`, `${c.count} lowongan`)].filter(Boolean).join(" · ")}
              />
            ))
          ) : (
            <Empty>{t("맞는 회사가 없어요.", "No matching companies.", "没有匹配的公司。", "Không có công ty phù hợp.", "該当する企業がありません。", "Tidak ada yang cocok.")}</Empty>
          )}
        </Section>
      </Page>
    </V2Shell>
  );
}
