"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import {
  getMyPartnerOrganization,
  isMemberNotFoundError,
  isPartnerOrganizationProfileComplete,
  isPartnerOrganizationVerificationComplete
} from "../../lib/member-profile-client";

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isReady, isAuthenticated, user } = useAuthSession();

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "PARTNER") {
      router.replace("/profile");
      return;
    }

    let mounted = true;
    void (async () => {
      try {
        const org = await getMyPartnerOrganization();
        if (!mounted) return;
        const profileDone = isPartnerOrganizationProfileComplete(org);
        const verified = isPartnerOrganizationVerificationComplete(org);
        const isOnboarding = pathname.startsWith("/partner/onboarding");

        // Gate: onboarding must be completed before entering partner admin flows.
        if ((!profileDone || !verified) && !isOnboarding) {
          router.replace("/partner/onboarding");
          return;
        }
        if (profileDone && verified && isOnboarding) {
          router.replace("/partner/dashboard");
        }
      } catch (error) {
        if (!mounted) return;
        if (isMemberNotFoundError(error)) {
          if (!pathname.startsWith("/partner/onboarding")) {
            router.replace("/partner/onboarding");
          }
          return;
        }
        router.replace("/partner/onboarding");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, isReady, pathname, router, user]);

  return <>{children}</>;
}

