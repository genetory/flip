import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Footer } from "../../../components/site/Footer";
import { Header } from "../../../components/site/Header";
import { CompanyPositionsSection } from "../../../components/pages/CompanyPositionsSection";
import { Button } from "../../../components/ui/button";
import { getPublicPositions } from "../../../lib/member-profile-client";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const items = await getPublicPositions();
    const positions = items.filter((item) => item.partnerOrganization?.id === id);
    const company = positions[0]?.partnerOrganization;
    if (!company) {
      return {
        title: "회사 정보를 찾을 수 없음",
        robots: { index: false }
      };
    }
    const openCount = positions.filter((p) => p.status === "OPEN").length;
    const title = `${company.name} 채용 정보`;
    const description = openCount > 0
      ? `${company.name}에서 진행 중인 ${openCount}개의 채용 포지션을 확인하세요. 외국인 인재를 위한 한국 기업 채용은 Aply에서.`
      : `${company.name}의 회사 소개와 채용 정보를 확인하세요.`;
    return {
      title,
      description,
      alternates: { canonical: `/companies/${id}` },
      openGraph: {
        type: "profile",
        title,
        description,
        url: `/companies/${id}`
      }
    };
  } catch {
    return { title: "회사 정보" };
  }
}

type Locale = "ko" | "en" | "zh-CN" | "vi" | "ja" | "id";

function pickLocale(acceptLanguage: string): Locale {
  const v = acceptLanguage.toLowerCase();
  if (v.includes("ko")) return "ko";
  if (v.includes("zh")) return "zh-CN";
  if (v.includes("vi")) return "vi";
  if (v.includes("ja")) return "ja";
  if (v.includes("id")) return "id";
  return "en";
}

function companySizeLabel(value: string | null | undefined, locale: Locale) {
  const pick = (ko: string, en: string, zh: string, vi: string, ja?: string, id?: string) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? (ja ?? en) : locale === "id" ? (id ?? en) : en;
  if (value === "SIZE_1_10") return pick("10인 이하", "Up to 10", "10人以下", "Tối đa 10", "10名以下", "Hingga 10");
  if (value === "SIZE_UNDER_30") return pick("30인 이하", "Up to 30", "30人以下", "Tối đa 30", "30名以下", "Hingga 30");
  if (value === "SIZE_UNDER_50") return pick("50인 이하", "Up to 50", "50人以下", "Tối đa 50", "50名以下", "Hingga 50");
  if (value === "SIZE_OVER_100") return pick("100인 이상", "100+", "100人以上", "Trên 100", "100名以上", "Lebih dari 100");
  return pick("미정", "TBD", "未定", "Chưa xác định", "未定", "Belum ditentukan");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${d}`;
}

function workTypeLabel(value: string | null | undefined, locale: Locale) {
  const normalized = (value ?? "").toLowerCase().replace(/[\s_-]/g, "");
  if (normalized === "remote") return "Remote";
  if (normalized === "hybrid") return "Hybrid";
  if (normalized === "onsite") return "On-site";
  const pick = (ko: string, en: string, zh: string, vi: string, ja?: string, id?: string) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? (ja ?? en) : locale === "id" ? (id ?? en) : en;
  return value?.trim() || pick("정보 없음", "No information", "无信息", "Không có thông tin", "情報なし", "Tidak ada informasi");
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language") ?? "";
  const locale = pickLocale(acceptLanguage);
  const isKo = locale === "ko";
  const isZh = locale === "zh-CN";
  const isVi = locale === "vi";
  const isJa = locale === "ja";
  const isId = locale === "id";
  const t = (ko: string, en: string, zh: string = en, vi: string = en, ja: string = en, id: string = en) =>
    isKo ? ko : isZh ? zh : isVi ? vi : isJa ? ja : isId ? id : en;
  const countSuffix = isKo ? "개" : isZh ? " 个" : isJa ? "件" : "";

  const referer = headerStore.get("referer");
  const backHref = referer && referer.trim() ? referer : "/positions";
  const { id } = await params;
  const companyId = decodeURIComponent(id).trim();

  let items: Awaited<ReturnType<typeof getPublicPositions>> = [];
  try {
    items = await getPublicPositions();
  } catch {
    items = [];
  }

  const companyPositions = items
    .filter((item) => item.partnerOrganization?.id === companyId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (companyPositions.length === 0) {
    notFound();
  }

  const company = companyPositions[0].partnerOrganization;
  const companyName = company?.name?.trim() || t("파트너 기업", "Partner company", "合作企业", "Doanh nghiệp đối tác", "パートナー企業", "Perusahaan mitra");
  const companyInitial = companyName[0]?.toUpperCase() ?? "C";
  const companyLogoSrc = companyPositions
    .flatMap((item) => item.thumbnailImages ?? [])
    .find((src) => typeof src === "string" && src.trim().length > 0) ?? null;
  const industryLabel = partnerIndustryLabel(company?.industry ?? "OTHER");
  const companySize = companySizeLabel(company?.companySize, locale);
  const officeAddress = company?.officeAddress?.trim() || t("주소 정보 없음", "No address info", "无地址信息", "Không có thông tin địa chỉ", "住所情報なし", "Tidak ada info alamat");
  const totalPositions = companyPositions.length;
  const activePositions = companyPositions.filter((item) => item.status === "OPEN").length;
  const latestPositionDate = formatDate(companyPositions[0]?.createdAt);
  const uniqueWorkLocations = Array.from(
    new Set(
      companyPositions
        .map((item) => item.workLocation?.trim() || item.partnerOrganization?.officeAddress?.trim() || "")
        .filter((value) => value.length > 0)
    )
  );
  const uniqueWorkTypes = Array.from(
    new Set(
      companyPositions
        .map((item) => workTypeLabel(item.workType, locale))
        .filter((value) => value.length > 0)
    )
  );

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href={backHref}>
                <ArrowLeft />
                {t("뒤로 가기", "Back", "返回", "Quay lại", "戻る", "Kembali")}
              </Link>
            </Button>
          </div>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Company</p>
            <div className="mt-3 mb-3">
              {companyLogoSrc ? (
                <img
                  src={companyLogoSrc}
                  alt={`${companyName} ${t("로고", "logo", "标志", "logo", "ロゴ", "logo")}`}
                  className="h-20 w-20 rounded-xl border border-border object-cover"
                />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-xl border border-border bg-muted font-display text-2xl font-bold text-muted-foreground">
                  {companyInitial}
                </div>
              )}
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold md:text-3xl">{companyName}</h1>

            <div className="mt-6 grid gap-3 text-sm md:grid-cols-2">
              <InfoRow label={t("산업군", "Industry", "行业", "Ngành", "業種", "Industri")} value={industryLabel} />
              <InfoRow label={t("회사 규모", "Company size", "公司规模", "Quy mô công ty", "会社規模", "Ukuran perusahaan")} value={companySize} />
              <InfoRow label={t("사무실 주소", "Office address", "办公地址", "Địa chỉ văn phòng", "オフィス所在地", "Alamat kantor")} value={officeAddress} />
              <InfoRow label={t("전체 포지션 수", "Total positions", "全部职位数", "Tổng số vị trí", "全ポジション数", "Total posisi")} value={`${totalPositions}${countSuffix}`} />
              <InfoRow label={t("진행 중 포지션", "Active positions", "进行中的职位", "Vị trí đang tuyển", "募集中のポジション", "Posisi aktif")} value={`${activePositions}${countSuffix}`} />
              <InfoRow label={t("최근 포지션 등록일", "Latest posting date", "最近发布日期", "Ngày đăng gần nhất", "最新登録日", "Tanggal posting terbaru")} value={latestPositionDate} />
              <InfoRow
                label={t("근무 지역", "Work location", "工作地区", "Khu vực làm việc", "勤務地", "Lokasi kerja")}
                value={uniqueWorkLocations.length > 0 ? uniqueWorkLocations.join(", ") : t("정보 없음", "No information", "无信息", "Không có thông tin", "情報なし", "Tidak ada informasi")}
              />
              <InfoRow
                label={t("근무 형태", "Work type", "工作形式", "Hình thức làm việc", "勤務形態", "Tipe kerja")}
                value={uniqueWorkTypes.length > 0 ? uniqueWorkTypes.join(", ") : t("정보 없음", "No information", "无信息", "Không có thông tin", "情報なし", "Tidak ada informasi")}
              />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold">{t("이 회사의 진행중인 포지션", "Open positions at this company", "该公司进行中的职位", "Vị trí đang tuyển tại công ty này", "この会社の募集中ポジション", "Posisi yang dibuka di perusahaan ini")}</h2>
            <CompanyPositionsSection items={companyPositions} />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}
