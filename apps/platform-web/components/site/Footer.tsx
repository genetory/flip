"use client";

import { Sparkles } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";

export const Footer = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).footer;

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-dark text-accent">
              <Sparkles className="h-4 w-4" />
            </span>
            Flip
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">{copy.brandDescription}</p>
        </div>
        {copy.columns.map((col) => (
          <div key={col.title}>
            <p className="mb-3 text-sm font-semibold">{col.title}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {col.items.map((item) => (
                <li key={item} className="cursor-pointer transition-colors hover:text-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container flex flex-col items-start justify-between gap-2 py-5 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} Flip. {copy.rights}
          </p>
          <p>{copy.tagline}</p>
        </div>
      </div>
    </footer>
  );
};
