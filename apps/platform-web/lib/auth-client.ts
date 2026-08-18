import { resolveAuthErrorMessage } from "./auth-messages";
import {
  trackAccountDeleted,
  trackEmailVerified,
  trackLogin,
  trackSignUp,
  type SignupMethod
} from "./analytics";

export const PLATFORM_ACCESS_TOKEN_KEY = "platform_access_token";

type AuthUser = {
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

type AuthSuccessPayload = {
  ok: true;
  token?: string;
  accessToken?: string;
  user: AuthUser;
};

type SignupSuccessPayload = {
  ok: true;
  requiresEmailVerification: boolean;
  email: string;
  token?: string;
  accessToken?: string;
  user?: AuthUser;
  verificationDelivery?: "smtp" | "log";
  verifyUrl?: string;
};

type AuthErrorPayload = {
  ok?: false;
  code?: string;
  message?: string;
  detail?: string;
};

export class AuthApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "AuthApiError";
    this.code = code;
  }
}

type AccountType = "GENERAL" | "BUSINESS";
export type EmailLocale = "ko" | "en";

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

async function authFetch(input: string, init: RequestInit) {
  try {
    return await fetch(input, init);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new AuthApiError("서버에 연결하지 못했습니다. API 서버 실행 상태와 NEXT_PUBLIC_API_URL 설정을 확인해주세요.");
    }
    throw error;
  }
}

export function storeAccessToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLATFORM_ACCESS_TOKEN_KEY, token);
}

export function readAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PLATFORM_ACCESS_TOKEN_KEY);
}

export function clearAccessToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PLATFORM_ACCESS_TOKEN_KEY);
}

type PartnerDashboardSuccessPayload = {
  ok: true;
};

type PartnerDashboardErrorPayload = {
  ok?: false;
  code?: string;
  message?: string;
};

async function parseAuthResponse(response: Response) {
  const payload = (await response.json()) as AuthSuccessPayload | AuthErrorPayload;
  if (!response.ok || payload.ok !== true) {
    const fallback = "message" in payload && typeof payload.message === "string" ? payload.message : undefined;
    const code = "code" in payload && typeof payload.code === "string" ? payload.code : undefined;
    const message = resolveAuthErrorMessage(code, fallback);
    throw new AuthApiError(message, code);
  }

  const accessToken = payload.accessToken ?? payload.token;
  if (!accessToken) {
    throw new Error("액세스 토큰이 응답에 없습니다.");
  }

  storeAccessToken(accessToken);
  return { accessToken, user: payload.user };
}

export async function loginWithEmail(input: { email: string; password: string }) {
  const response = await authFetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input)
  });

  const result = await parseAuthResponse(response);
  trackLogin("email");
  return result;
}

export type SocialProvider = "naver" | "google" | "kakao";

export async function finalizeSocialSignup(input: {
  provider: SocialProvider;
  ctx: string;
  accountType: AccountType;
  realName?: string; // provider 가 실명을 주지 않을 때 가입 화면에서 입력받은 값
  email?: string; // provider 가 이메일을 주지 않을 때만 사용
}) {
  const response = await authFetch(`${getApiBaseUrl()}/auth/${input.provider}/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      ctx: input.ctx,
      accountType: input.accountType,
      ...(input.realName?.trim() ? { realName: input.realName.trim() } : {}),
      ...(input.email?.trim() ? { email: input.email.trim() } : {})
    })
  });

  const result = await parseAuthResponse(response);
  // Provider signup completion = both an account creation event and the first login.
  trackSignUp(input.provider as SignupMethod);
  trackLogin(input.provider as SignupMethod);
  return result;
}

export async function signupWithEmail(input: {
  name: string;
  email: string;
  password: string;
  accountType: AccountType;
  phoneNumber?: string;
  partnerOrganizationName?: string;
  partnerOrganizationIndustry?: string;
  partnerOrganizationCompanySize?: string;
  locale?: EmailLocale;
}) {
  const localeHeader = input.locale ?? "ko";
  const response = await authFetch(`${getApiBaseUrl()}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": localeHeader
    },
    credentials: "include",
    body: JSON.stringify(input)
  });
  const payload = (await response.json()) as SignupSuccessPayload | AuthErrorPayload;
  if (!response.ok || payload.ok !== true) {
    const fallback = "message" in payload && typeof payload.message === "string" ? payload.message : undefined;
    const code = "code" in payload && typeof payload.code === "string" ? payload.code : undefined;
    const detail = "detail" in payload && typeof payload.detail === "string" ? payload.detail : undefined;
    const baseMessage = resolveAuthErrorMessage(code, fallback);
    const message = code === "REGISTRATION_FAILED" && detail ? `${baseMessage} (${detail})` : baseMessage;
    throw new AuthApiError(message, code);
  }
  if (payload.requiresEmailVerification === false) {
    const accessToken = payload.accessToken ?? payload.token;
    if (accessToken) {
      storeAccessToken(accessToken);
    }
  }
  trackSignUp("email");
  return payload;
}

export async function sendBusinessEmailVerification(input: { email: string; locale?: EmailLocale }) {
  const localeHeader = input.locale ?? "ko";
  const response = await authFetch(`${getApiBaseUrl()}/auth/business-email/send-verification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": localeHeader
    },
    credentials: "include",
    body: JSON.stringify(input)
  });

  const payload = (await response.json()) as
    | { ok: true; sent: boolean; verificationDelivery?: "smtp" | "log"; verificationCode?: string }
    | AuthErrorPayload;

  if (!response.ok || payload.ok !== true) {
    const fallback = "message" in payload && typeof payload.message === "string" ? payload.message : undefined;
    const code = "code" in payload && typeof payload.code === "string" ? payload.code : undefined;
    const message = resolveAuthErrorMessage(code, fallback);
    throw new AuthApiError(message, code);
  }

  return payload;
}

export async function verifyBusinessEmailCode(input: { email: string; code: string }) {
  const response = await authFetch(`${getApiBaseUrl()}/auth/business-email/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input)
  });

  const payload = (await response.json()) as
    | { ok: true; verified: boolean }
    | AuthErrorPayload;

  if (!response.ok || payload.ok !== true) {
    const fallback = "message" in payload && typeof payload.message === "string" ? payload.message : undefined;
    const code = "code" in payload && typeof payload.code === "string" ? payload.code : undefined;
    const message = resolveAuthErrorMessage(code, fallback);
    throw new AuthApiError(message, code);
  }

  return payload;
}

export async function createPartnerSignupRequest(input: {
  companyName: string;
  companyIndustry: string;
  companySize: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
}) {
  const response = await authFetch(`${getApiBaseUrl()}/partner-signup-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input)
  });

  const payload = (await response.json()) as
    | { ok: true; item: { id: string; status: string; createdAt: string } }
    | AuthErrorPayload;

  if (!response.ok || payload.ok !== true) {
    const fallback = "message" in payload && typeof payload.message === "string" ? payload.message : undefined;
    const code = "code" in payload && typeof payload.code === "string" ? payload.code : undefined;
    const message = resolveAuthErrorMessage(code, fallback);
    throw new AuthApiError(message, code);
  }

  return payload.item;
}

export async function refreshPlatformSession() {
  const response = await authFetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: "POST",
    credentials: "include"
  });

  if (!response.ok) {
    clearAccessToken();
    return null;
  }

  return parseAuthResponse(response);
}

export async function getPartnerDashboardAccess() {
  let token = readAccessToken();
  if (!token) {
    await refreshPlatformSession();
    token = readAccessToken();
  }

  if (!token) {
    return { ok: false as const, code: "UNAUTHORIZED" as const };
  }

  const request = async (accessToken: string) =>
    authFetch(`${getApiBaseUrl()}/partner/dashboard`, {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

  let response = await request(token);
  if (response.status === 401) {
    await refreshPlatformSession();
    const refreshed = readAccessToken();
    if (!refreshed) return { ok: false as const, code: "UNAUTHORIZED" as const };
    response = await request(refreshed);
  }

  const payload = (await response.json()) as PartnerDashboardSuccessPayload | PartnerDashboardErrorPayload;
  if (response.ok && payload.ok === true) {
    return { ok: true as const };
  }

  return {
    ok: false as const,
    code: ("code" in payload && payload.code) || "UNKNOWN",
    message: ("message" in payload && payload.message) || "파트너 접근 권한을 확인하지 못했습니다."
  };
}

export async function verifyEmailToken(token: string) {
  const response = await authFetch(`${getApiBaseUrl()}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token })
  });

  const result = await parseAuthResponse(response);
  trackEmailVerified();
  return result;
}

export async function resendVerificationEmail(email: string, locale: EmailLocale = "ko") {
  const response = await authFetch(`${getApiBaseUrl()}/auth/resend-verification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": locale
    },
    credentials: "include",
    body: JSON.stringify({ email, locale })
  });
  const payload = (await response.json()) as
    | { ok: true; sent?: boolean; verificationDelivery?: "smtp" | "log"; verifyUrl?: string; alreadyVerified?: boolean }
    | AuthErrorPayload;

  if (!response.ok || payload.ok !== true) {
    const fallback = "message" in payload && typeof payload.message === "string" ? payload.message : undefined;
    const code = "code" in payload && typeof payload.code === "string" ? payload.code : undefined;
    const message = resolveAuthErrorMessage(code, fallback);
    throw new AuthApiError(message, code);
  }

  return payload;
}

export async function logoutPlatformSession() {
  try {
    await authFetch(`${getApiBaseUrl()}/auth/logout`, {
      method: "POST",
      credentials: "include"
    });
  } finally {
    clearAccessToken();
  }
}

export function getPostLoginUrl(role: AuthUser["role"]) {
  if (role === "PARTNER") return "/partner/home"; // 파트너 앱 홈
  return "/talent/home"; // 학생·운영자 → 탤런트 앱
}

export async function reauthWithPassword(password: string) {
  const token = readAccessToken();
  if (!token) throw new AuthApiError("로그인이 필요합니다.");
  const response = await authFetch(`${getApiBaseUrl()}/auth/reauth/password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    credentials: "include",
    body: JSON.stringify({ password, purpose: "delete_account" })
  });
  const payload = (await response.json()) as
    | { ok: true; reauthToken: string; expiresInMs: number }
    | AuthErrorPayload;
  if (!response.ok || payload.ok !== true) {
    const fallback = "message" in payload && typeof payload.message === "string" ? payload.message : undefined;
    const code = "code" in payload && typeof payload.code === "string" ? payload.code : undefined;
    throw new AuthApiError(resolveAuthErrorMessage(code, fallback), code);
  }
  return payload;
}

export async function startOAuthReauth(provider: SocialProvider) {
  const token = readAccessToken();
  if (!token) throw new AuthApiError("로그인이 필요합니다.");
  const response = await authFetch(`${getApiBaseUrl()}/auth/${provider}/reauth/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include"
  });
  const payload = (await response.json()) as
    | { ok: true; authorizeUrl: string }
    | AuthErrorPayload;
  if (!response.ok || payload.ok !== true) {
    const fallback = "message" in payload && typeof payload.message === "string" ? payload.message : undefined;
    const code = "code" in payload && typeof payload.code === "string" ? payload.code : undefined;
    throw new AuthApiError(resolveAuthErrorMessage(code, fallback), code);
  }
  return payload.authorizeUrl;
}

export async function deleteMyAccount(reauthToken: string) {
  const token = readAccessToken();
  if (!token) throw new AuthApiError("로그인이 필요합니다.");
  const response = await authFetch(`${getApiBaseUrl()}/members/me/account`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Reauth-Token": reauthToken
    },
    credentials: "include"
  });
  if (!response.ok) {
    let code: string | undefined;
    let message: string | undefined;
    try {
      const body = (await response.json()) as AuthErrorPayload;
      code = typeof body.code === "string" ? body.code : undefined;
      message = typeof body.message === "string" ? body.message : undefined;
    } catch {
      // ignore
    }
    throw new AuthApiError(resolveAuthErrorMessage(code, message), code);
  }
  trackAccountDeleted();
  clearAccessToken();
}
