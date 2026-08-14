"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  clearAccessToken,
  logoutPlatformSession,
  readAccessToken,
  refreshPlatformSession
} from "../../lib/auth-client";
import { clearAllAdvisorChats } from "../../lib/talent/career-advisor-store";

type SessionUser = {
  id: string;
  email: string;
  emailVerified?: boolean;
  // 인증됐고 실제 도달 가능한 이메일이면 true. false면 연락처 인증 배너/소프트 게이트 대상.
  contactVerified?: boolean;
  realName?: string | null;
  name?: string | null;
  phoneNumber?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  role: "STUDENT" | "PARTNER" | "OPERATOR";
  authProvider?: "EMAIL" | "NAVER" | "KAKAO" | "GOOGLE";
  profileImageUrl?: string | null;
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
    // Clear local state immediately so the UI flips to logged-out before the
    // server roundtrip — feels instant. Server-side session invalidation runs
    // in the background; even if it fails, the access token is already cleared
    // on the next request via the fire-and-forget call inside logoutPlatformSession.
    setUser(null);
    // 액세스 토큰을 *동기적으로* 먼저 지운다. logoutPlatformSession 은 서버 왕복이
    // 끝난 뒤에야 토큰을 지우는데, 아래 전체 새로고침이 그보다 먼저 일어나면 리로드된
    // 메인 랜딩(CommonLanding)이 아직 남은 토큰으로 세션을 복구해 다시 앱으로 튕겨낸다.
    clearAccessToken();
    // 이 기기에 남은 AI 상담 대화 기록 제거(기기 공유 시 다음 사용자에게 새지 않게).
    clearAllAdvisorChats();
    void logoutPlatformSession();
    // replace 로 이동해 로그아웃 후 뒤로가기가 인증된 앱 화면으로 돌아가지 않게 한다.
    window.location.replace("/");
  }, []);

  const setAuthenticatedUser = useCallback((nextUser: SessionUser) => {
    setUser(nextUser);
    setIsReady(true);
  }, []);

  const getAccountUrl = useCallback(() => {
    if (!user) return "/login";
    // 리뉴얼 앱의 모던 프로필로 — 레거시 /profile 로 새지 않게.
    if (user.role === "PARTNER") return "/partner/profile";
    if (user.role === "OPERATOR") return "/dashboard/ops";
    return "/talent/career/profile";
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!readAccessToken()) {
      setIsReady(true);
      return;
    }
    void refreshSession();
  }, [refreshSession]);

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
