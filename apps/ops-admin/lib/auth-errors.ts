const authErrorMessages = {
  ko: {
    INVALID_CREDENTIALS: "이메일 또는 비밀번호가 올바르지 않습니다.",
    INVALID_REQUEST: "입력한 내용을 다시 확인해주세요.",
    USER_NOT_FOUND: "계정을 찾을 수 없습니다."
  },
  en: {
    INVALID_CREDENTIALS: "Email or password is incorrect.",
    INVALID_REQUEST: "Please check your input and try again.",
    USER_NOT_FOUND: "Account not found."
  }
} as const;

type Locale = keyof typeof authErrorMessages;

function getBrowserLocale(): Locale {
  if (typeof window === "undefined") return "ko";
  return window.navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en";
}

export function resolveAdminAuthErrorMessage(code?: string, fallback?: string) {
  const locale = getBrowserLocale();

  if (code && code in authErrorMessages[locale]) {
    return authErrorMessages[locale][code as keyof (typeof authErrorMessages)[typeof locale]];
  }

  return fallback ?? (locale === "ko" ? "로그인에 실패했습니다. 계정을 확인해주세요." : "Unable to sign in.");
}
