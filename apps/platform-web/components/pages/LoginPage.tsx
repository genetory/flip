"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { Button } from "../ui/button";
import { AuthApiError, getPostLoginUrl, loginWithEmail } from "../../lib/auth-client";
import { getAuthPageMessages } from "../../lib/auth-messages";
import {
  getMyPartnerOrganization,
  isMemberNotFoundError,
  isPartnerOrganizationProfileComplete
} from "../../lib/member-profile-client";

export function LoginPage() {
  const router = useRouter();
  const { setAuthenticatedUser } = useAuthSession();
  const { locale } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const copy = useMemo(() => getAuthPageMessages(locale).login, [locale]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { user } = await loginWithEmail({ email, password });
      setAuthenticatedUser(user);

      if (user.role === "PARTNER") {
        try {
          const org = await getMyPartnerOrganization();
          if (!isPartnerOrganizationProfileComplete(org)) {
            router.push("/partner-profile/edit?required=1");
            router.refresh();
            return;
          }
        } catch (error) {
          if (isMemberNotFoundError(error)) {
            router.push("/partner-profile/edit?required=1");
            router.refresh();
            return;
          }
        }
      }

      const nextUrl = getPostLoginUrl(user.role);
      const referrer = typeof window !== "undefined" ? document.referrer : "";
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";

      try {
        if (referrer) {
          const parsed = new URL(referrer);
          if (parsed.origin === currentOrigin) {
            window.location.href = referrer;
            return;
          }
        }
      } catch {
        // Ignore invalid referrer and fallback to default path.
      }

      if (nextUrl.startsWith("http")) {
        window.location.href = nextUrl;
        return;
      }

      router.push(nextUrl);
      router.refresh();
    } catch (error) {
      if (error instanceof AuthApiError && error.code === "EMAIL_VERIFICATION_REQUIRED") {
        const params = new URLSearchParams();
        if (email.trim()) params.set("email", email.trim());
        router.push(`/signup/verify-email?${params.toString()}`);
        router.refresh();
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : copy.submitFallbackError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <section>
          <div className="mx-auto max-w-md rounded-2xl border border-border/60 bg-card p-6 md:p-8">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium">
                {copy.emailLabel}
                <input
                  type="email"
                  placeholder={copy.emailPlaceholder}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-input/60 bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                {copy.passwordLabel}
                <input
                  type="password"
                  placeholder={copy.passwordPlaceholder}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-input/60 bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
              </label>
              <p className="text-sm text-muted-foreground">{copy.helperText}</p>
              {errorMessage ? <p className="text-sm font-medium text-destructive">{errorMessage}</p> : null}
              <Button variant="dark" size="lg" className="mt-2 w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? copy.submitPending : <>{copy.submitIdle} <ArrowRight /></>}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {copy.signupPrompt}{" "}
              <Link href="/signup" className="font-semibold text-foreground">
                {copy.signupLink}
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
