"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";

export const FAQ = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).faq;

  return (
    <section className="bg-muted/40 py-20">
      <div className="container grid max-w-[1200px] gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">{copy.sectionLabel}</p>
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{copy.title}</h2>
          <p className="mt-3 text-muted-foreground">{copy.description}</p>
        </div>
        <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-5 shadow-card">
          {copy.items.map((item, index) => (
            <AccordionItem key={item.question} value={`item-${index}`} className="border-border last:border-b-0">
              <AccordionTrigger className="text-left font-semibold">{item.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
