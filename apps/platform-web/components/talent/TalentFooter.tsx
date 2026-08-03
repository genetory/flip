import Link from "next/link";
import Image from "next/image";
import { footerContent, talentBrand } from "../../lib/talent/landing-content";

// Talent 랜딩 푸터. Partner 는 보조 링크로만, Admin 은 노출하지 않는다.

export function TalentFooter() {
  return (
    <footer className="border-t border-[#EEF1F5] bg-[#FAFBFC]">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 md:py-16">
        {/* Partner 보조 진입 */}
        <Link
          href={footerContent.partnerLink.href}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white px-4 py-3 text-[13px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/30 hover:text-[#0B46E8]"
        >
          {footerContent.partnerLink.label}
          <span aria-hidden>→</span>
        </Link>

        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Image src="/img_logo.webp" alt={talentBrand.name} width={84} height={28} className="h-6 w-auto" />
            <p className="mt-3 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{talentBrand.subSlogan}</p>
          </div>
          {footerContent.columns.map((col) => (
            <div key={col.title}>
              <p className="text-[13px] font-bold text-[#191F28]">{col.title}</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[13px] text-[#8B95A1] transition hover:text-[#4E5968]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 text-[12px] text-[#B0B8C1]">{footerContent.copyright}</p>
      </div>
    </footer>
  );
}
