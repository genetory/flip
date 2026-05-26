"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { Building2, GraduationCap } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { getSiteMessages } from "../../lib/site-messages";
import { Reveal } from "./Reveal";
import { paperlogy } from "../../lib/fonts";

export const FinalCTA = () => {
  const { locale } = useLanguage();
  const { isAuthenticated } = useAuthSession();
  const copy = getSiteMessages(locale).finalCta;
  const partnerHref = isAuthenticated ? "/profile" : "/login";
  // "취업 모험"(/matching-probability) is temporarily hidden — point the
  // student CTA at the profile/signup instead so this card stays functional.
  const studentHref = isAuthenticated ? "/profile" : "/signup";

  return (
    <section className="bg-[#F3F7FF] py-20">
      <div className="container grid max-w-[1200px] gap-5 md:grid-cols-2">
        <Reveal className="relative overflow-hidden rounded-3xl bg-gradient-dark p-10 text-background" y="sm">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
          <Building2 className="mb-5 h-8 w-8 text-accent" />
          <h3 className={`${paperlogy.className} text-3xl font-black tracking-[-0.03em] md:text-5xl`}>
            <span className="block">{copy.companyTitleTop}</span>
            <span className="mt-2 block">{copy.companyTitleBottom}</span>
          </h3>
          <p className="mt-3 max-w-md text-background/70">{copy.companyDescription}</p>
          <Button variant="hero" size="xl" className="mt-7" asChild>
            <Link href={partnerHref}>{copy.companyCta}</Link>
          </Button>
        </Reveal>
        <Reveal className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 shadow-card" delayMs={120} y="sm">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/40 blur-3xl" />
          <GraduationCap className="mb-5 h-8 w-8" />
          <h3 className={`${paperlogy.className} text-3xl font-black tracking-[-0.03em] md:text-5xl`}>
            <span className="block">{copy.studentTitleTop}</span>
            <span className="mt-2 block">{copy.studentTitleBottom}</span>
          </h3>
          <p className="mt-3 max-w-md text-muted-foreground">{copy.studentDescription}</p>
          <Button variant="dark" size="xl" className="mt-7" asChild>
            <Link href={studentHref}>{copy.studentCta}</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
};
