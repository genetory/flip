"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearAccessToken,
  logoutPlatformSession,
  refreshPlatformSession
} from "../../lib/auth-client";
import {
  getMyPartnerOrganization,
  isMemberNotFoundError,
  isPartnerOrganizationProfileComplete
} from "../../lib/member-profile-client";

type SessionUser = {
  id: string;
  email: string;
  realName?: string | null;
  name?: string | null;
  phoneNumber?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  role: "STUDENT" | "PARTNER" | "OPERATOR";
  partnerType?: "UNIVERSITY" | "COMPANY" | "AGENCY" | null;
  partnerOrgRole?: "OWNER" | "ADMIN" | "MEMBER" | null;
};

type AuthSessionContextValue = {
  user: SessionUser | null;
  isReady: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
  setAuthenticatedUser: (user: SessionUser) => void;
  logout: () => Promise<void>;
  getAccountUrl: () => string;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const result = await refreshPlatformSession();
      setUser(result?.user ?? null);
    } catch {
      clearAccessToken();
      setUser(null);
    } finally {
      setIsReady(true);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutPlatformSession();
    setUser(null);
    window.location.href = "/";
  }, []);

  const setAuthenticatedUser = useCallback((nextUser: SessionUser) => {
    setUser(nextUser);
    setIsReady(true);
  }, []);

  const getAccountUrl = useCallback(() => {
    if (!user) return "/login";
    if (user.role === "PARTNER") return "/profile";
    return "/profile";
  }, [user]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!isReady || !user || user.role !== "PARTNER") return;

    const allowedPaths = new Set([
      "/login",
      "/signup",
      "/signup/completed",
      "/signup/verify-email",
      "/verify-email",
      "/partner-profile/edit"
    ]);
    if (pathname && allowedPaths.has(pathname)) return;

    let cancelled = false;
    void (async () => {
      try {
        const org = await getMyPartnerOrganization();
        if (cancelled) return;
        if (!isPartnerOrganizationProfileComplete(org)) {
          router.replace("/partner-profile/edit?required=1");
        }
      } catch (error) {
        if (cancelled) return;
        if (isMemberNotFoundError(error)) {
          router.replace("/partner-profile/edit?required=1");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isReady, pathname, router, user]);

  const value = useMemo<AuthSessionContextValue>(() => ({
    user,
    isReady,
    isAuthenticated: Boolean(user),
    refreshSession,
    setAuthenticatedUser,
    logout,
    getAccountUrl
  }), [getAccountUrl, isReady, logout, refreshSession, setAuthenticatedUser, user]);

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return context;
}
