export const PLATFORM_LOCALE_STORAGE_KEY = "platform_locale";
export const DEFAULT_PLATFORM_LOCALE = "ko";

const authErrorMessages = {
  ko: {
    BUSINESS_EMAIL_REQUIRED: "파트너회원은 파트너 이메일로 가입해주세요.",
    EMAIL_ALREADY_EXISTS: "이미 가입된 이메일입니다.",
    EMAIL_PREVERIFICATION_REQUIRED: "업무용 이메일 인증을 먼저 완료해주세요.",
    EMAIL_VERIFICATION_REQUIRED: "이메일 인증이 필요합니다. 받은 편지함의 인증 링크를 확인해주세요.",
    INVALID_EMAIL_VERIFICATION_TOKEN: "인증 링크가 유효하지 않습니다.",
    EXPIRED_EMAIL_VERIFICATION_TOKEN: "인증 링크가 만료되었습니다. 인증 메일을 다시 요청해주세요.",
    INVALID_EMAIL_PREVERIFICATION_CODE: "이메일 인증 코드가 올바르지 않습니다.",
    EXPIRED_EMAIL_PREVERIFICATION_CODE: "이메일 인증 코드가 만료되었습니다. 다시 인증해주세요.",
    INVALID_CREDENTIALS: "이메일 또는 비밀번호가 올바르지 않습니다.",
    INVALID_REQUEST: "입력한 내용을 다시 확인해주세요.",
    MISSING_REFRESH_TOKEN: "세션이 만료되었습니다. 다시 로그인해주세요.",
    INVALID_REFRESH_TOKEN: "세션이 유효하지 않습니다. 다시 로그인해주세요.",
    REFRESH_TOKEN_REVOKED: "세션이 만료되었습니다. 다시 로그인해주세요.",
    USER_NOT_FOUND: "계정을 찾을 수 없습니다.",
    REGISTRATION_FAILED: "회원가입에 실패했습니다."
  },
  en: {
    BUSINESS_EMAIL_REQUIRED: "Business accounts require a company email.",
    EMAIL_ALREADY_EXISTS: "This email is already registered.",
    EMAIL_PREVERIFICATION_REQUIRED: "Please verify your work email first.",
    EMAIL_VERIFICATION_REQUIRED: "Email verification is required. Please check your inbox.",
    INVALID_EMAIL_VERIFICATION_TOKEN: "This verification link is invalid.",
    EXPIRED_EMAIL_VERIFICATION_TOKEN: "This verification link has expired. Please request a new one.",
    INVALID_EMAIL_PREVERIFICATION_CODE: "The email verification code is invalid.",
    EXPIRED_EMAIL_PREVERIFICATION_CODE: "The email verification code has expired. Please retry verification.",
    INVALID_CREDENTIALS: "Email or password is incorrect.",
    INVALID_REQUEST: "Please check your input and try again.",
    MISSING_REFRESH_TOKEN: "Your session has expired. Please sign in again.",
    INVALID_REFRESH_TOKEN: "Your session is invalid. Please sign in again.",
    REFRESH_TOKEN_REVOKED: "Your session has expired. Please sign in again.",
    USER_NOT_FOUND: "Account not found.",
    REGISTRATION_FAILED: "Registration failed."
  }
} as const;

const authPageMessages = {
  ko: {
    login: {
      emailLabel: "이메일",
      passwordLabel: "비밀번호",
      emailPlaceholder: "you@example.com",
      passwordPlaceholder: "비밀번호를 입력해주세요",
      helperText: "이메일과 비밀번호로 로그인합니다.",
      submitIdle: "로그인",
      submitPending: "로그인 중...",
      submitFallbackError: "로그인에 실패했습니다.",
      signupPrompt: "계정이 없으신가요?",
      signupLink: "회원가입"
    },
    signup: {
      accountTypeLabel: "회원 유형",
      accountTypeGeneral: "일반회원",
      accountTypeBusiness: "파트너회원",
      nameLabel: "이름",
      emailLabel: "이메일",
      passwordLabel: "비밀번호",
      namePlaceholder: "홍길동",
      emailPlaceholder: "you@example.com",
      passwordPlaceholder: "8자 이상 입력해주세요",
      businessHelperText: "파트너회원은 파트너 도메인 이메일로 가입해주세요.",
      generalHelperText: "가입 후 이메일 인증을 완료하면 로그인할 수 있습니다.",
      submitIdle: "회원가입",
      submitPending: "가입 중...",
      submitFallbackError: "회원가입에 실패했습니다.",
      loginPrompt: "이미 계정이 있으신가요?",
      loginLink: "로그인"
    }
  },
  en: {
    login: {
      emailLabel: "Email",
      passwordLabel: "Password",
      emailPlaceholder: "you@example.com",
      passwordPlaceholder: "Enter your password",
      helperText: "Sign in with your email and password.",
      submitIdle: "Sign in",
      submitPending: "Signing in...",
      submitFallbackError: "Failed to sign in.",
      signupPrompt: "Don't have an account?",
      signupLink: "Sign up"
    },
    signup: {
      accountTypeLabel: "Account type",
      accountTypeGeneral: "General",
      accountTypeBusiness: "Business",
      nameLabel: "Name",
      emailLabel: "Email",
      passwordLabel: "Password",
      namePlaceholder: "Jane Doe",
      emailPlaceholder: "you@example.com",
      passwordPlaceholder: "Enter at least 8 characters",
      businessHelperText: "Business accounts require a company email domain.",
      generalHelperText: "You can sign in after completing email verification.",
      submitIdle: "Sign up",
      submitPending: "Signing up...",
      submitFallbackError: "Failed to sign up.",
      loginPrompt: "Already have an account?",
      loginLink: "Sign in"
    }
  }
} as const;

export type PlatformLocale = keyof typeof authErrorMessages;

export function getBrowserLocale(): PlatformLocale {
  if (typeof window === "undefined") return DEFAULT_PLATFORM_LOCALE;
  const storedLocale = window.localStorage.getItem(PLATFORM_LOCALE_STORAGE_KEY);
  if (storedLocale === "ko" || storedLocale === "en") return storedLocale;
  return window.navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en";
}

export function resolveAuthErrorMessage(code?: string, fallback?: string, locale = getBrowserLocale()) {
  if (code && code in authErrorMessages[locale]) {
    return authErrorMessages[locale][code as keyof (typeof authErrorMessages)[typeof locale]];
  }

  return fallback ?? (locale === "ko" ? "요청을 처리하지 못했습니다." : "Unable to process your request.");
}

export function getAuthPageMessages(locale = getBrowserLocale()) {
  return authPageMessages[locale];
}

const headerMessages = {
  ko: {
    brand: "Aply",
    nav: {
      positions: "포지션 탐색",
      matching: "매칭 가능성",
      community: "커뮤니티",
      pricing: "프리미엄 케어",
      how: "운영 방식",
      cases: "사례"
    },
    auth: {
      login: "로그인",
      signup: "회원가입",
      myAccount: "내 정보",
      account: "계정",
      logout: "로그아웃",
      rolePartner: "파트너회원",
      roleOperator: "운영자",
      greetingSuffix: "님"
    },
    menuOpenLabel: "메뉴 열기",
    languageLabel: "언어 선택",
    languageOptions: {
      ko: "한국어",
      en: "English"
    }
  },
  en: {
    brand: "Aply",
    nav: {
      positions: "Positions",
      matching: "Match Score",
      community: "Community",
      pricing: "Premium Care",
      how: "How It Works",
      cases: "Success Stories"
    },
    auth: {
      login: "Sign in",
      signup: "Sign up",
      myAccount: "My account",
      account: "Account",
      logout: "Sign out",
      rolePartner: "Partner",
      roleOperator: "Operator",
      greetingSuffix: ""
    },
    menuOpenLabel: "Open menu",
    languageLabel: "Choose language",
    languageOptions: {
      ko: "한국어",
      en: "English"
    }
  }
} as const;

export function getHeaderMessages(locale = getBrowserLocale()) {
  return headerMessages[locale];
}
