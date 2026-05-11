export const PLATFORM_LOCALE_STORAGE_KEY = "platform_locale";
export const DEFAULT_PLATFORM_LOCALE = "ko";
export const PLATFORM_LOCALES = ["ko", "en", "zh-CN", "vi", "ja", "id"] as const;
export type PlatformLocale = (typeof PLATFORM_LOCALES)[number];

const authErrorMessages = {
  ko: {
    BUSINESS_EMAIL_REQUIRED: "이 이메일로는 가입을 진행할 수 없습니다.",
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
    BUSINESS_EMAIL_REQUIRED: "This email cannot be used for signup.",
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
  },
  "zh-CN": {
    BUSINESS_EMAIL_REQUIRED: "此邮箱无法用于注册。",
    EMAIL_ALREADY_EXISTS: "该邮箱已注册。",
    EMAIL_PREVERIFICATION_REQUIRED: "请先完成工作邮箱验证。",
    EMAIL_VERIFICATION_REQUIRED: "需要邮箱验证，请查看收件箱中的验证链接。",
    INVALID_EMAIL_VERIFICATION_TOKEN: "验证链接无效。",
    EXPIRED_EMAIL_VERIFICATION_TOKEN: "验证链接已过期，请重新请求验证邮件。",
    INVALID_EMAIL_PREVERIFICATION_CODE: "邮箱验证码无效。",
    EXPIRED_EMAIL_PREVERIFICATION_CODE: "邮箱验证码已过期，请重新验证。",
    INVALID_CREDENTIALS: "邮箱或密码不正确。",
    INVALID_REQUEST: "请检查输入内容后重试。",
    MISSING_REFRESH_TOKEN: "会话已过期，请重新登录。",
    INVALID_REFRESH_TOKEN: "会话无效，请重新登录。",
    REFRESH_TOKEN_REVOKED: "会话已过期，请重新登录。",
    USER_NOT_FOUND: "未找到该账号。",
    REGISTRATION_FAILED: "注册失败。"
  },
  vi: {
    BUSINESS_EMAIL_REQUIRED: "Email này không thể dùng để đăng ký.",
    EMAIL_ALREADY_EXISTS: "Email này đã được đăng ký.",
    EMAIL_PREVERIFICATION_REQUIRED: "Vui lòng xác minh email công việc trước.",
    EMAIL_VERIFICATION_REQUIRED: "Cần xác minh email. Vui lòng kiểm tra hộp thư.",
    INVALID_EMAIL_VERIFICATION_TOKEN: "Liên kết xác minh không hợp lệ.",
    EXPIRED_EMAIL_VERIFICATION_TOKEN: "Liên kết xác minh đã hết hạn. Vui lòng yêu cầu lại.",
    INVALID_EMAIL_PREVERIFICATION_CODE: "Mã xác minh email không hợp lệ.",
    EXPIRED_EMAIL_PREVERIFICATION_CODE: "Mã xác minh email đã hết hạn. Vui lòng xác minh lại.",
    INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng.",
    INVALID_REQUEST: "Vui lòng kiểm tra lại thông tin đã nhập.",
    MISSING_REFRESH_TOKEN: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    INVALID_REFRESH_TOKEN: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
    REFRESH_TOKEN_REVOKED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    USER_NOT_FOUND: "Không tìm thấy tài khoản.",
    REGISTRATION_FAILED: "Đăng ký thất bại."
  },
  ja: {
    BUSINESS_EMAIL_REQUIRED: "このメールアドレスでは登録できません。",
    EMAIL_ALREADY_EXISTS: "このメールアドレスは既に登録されています。",
    EMAIL_PREVERIFICATION_REQUIRED: "先にビジネスメールの認証を完了してください。",
    EMAIL_VERIFICATION_REQUIRED: "メール認証が必要です。受信トレイの認証リンクをご確認ください。",
    INVALID_EMAIL_VERIFICATION_TOKEN: "認証リンクが無効です。",
    EXPIRED_EMAIL_VERIFICATION_TOKEN: "認証リンクの有効期限が切れました。認証メールを再度ご請求ください。",
    INVALID_EMAIL_PREVERIFICATION_CODE: "メール認証コードが正しくありません。",
    EXPIRED_EMAIL_PREVERIFICATION_CODE: "メール認証コードの有効期限が切れました。再度認証してください。",
    INVALID_CREDENTIALS: "メールアドレスまたはパスワードが正しくありません。",
    INVALID_REQUEST: "入力内容をもう一度ご確認ください。",
    MISSING_REFRESH_TOKEN: "セッションの有効期限が切れました。再度ログインしてください。",
    INVALID_REFRESH_TOKEN: "セッションが無効です。再度ログインしてください。",
    REFRESH_TOKEN_REVOKED: "セッションの有効期限が切れました。再度ログインしてください。",
    USER_NOT_FOUND: "アカウントが見つかりません。",
    REGISTRATION_FAILED: "会員登録に失敗しました。"
  },
  id: {
    BUSINESS_EMAIL_REQUIRED: "Email ini tidak dapat digunakan untuk pendaftaran.",
    EMAIL_ALREADY_EXISTS: "Email ini sudah terdaftar.",
    EMAIL_PREVERIFICATION_REQUIRED: "Harap verifikasi email kerja Anda terlebih dahulu.",
    EMAIL_VERIFICATION_REQUIRED: "Verifikasi email diperlukan. Silakan periksa kotak masuk Anda.",
    INVALID_EMAIL_VERIFICATION_TOKEN: "Tautan verifikasi tidak valid.",
    EXPIRED_EMAIL_VERIFICATION_TOKEN: "Tautan verifikasi telah kedaluwarsa. Silakan minta tautan baru.",
    INVALID_EMAIL_PREVERIFICATION_CODE: "Kode verifikasi email tidak valid.",
    EXPIRED_EMAIL_PREVERIFICATION_CODE: "Kode verifikasi email telah kedaluwarsa. Silakan verifikasi ulang.",
    INVALID_CREDENTIALS: "Email atau kata sandi salah.",
    INVALID_REQUEST: "Silakan periksa kembali input Anda.",
    MISSING_REFRESH_TOKEN: "Sesi Anda telah berakhir. Silakan masuk lagi.",
    INVALID_REFRESH_TOKEN: "Sesi Anda tidak valid. Silakan masuk lagi.",
    REFRESH_TOKEN_REVOKED: "Sesi Anda telah berakhir. Silakan masuk lagi.",
    USER_NOT_FOUND: "Akun tidak ditemukan.",
    REGISTRATION_FAILED: "Pendaftaran gagal."
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
      businessHelperText: "가입에 사용할 이메일을 입력해주세요.",
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
      businessHelperText: "Enter the email you want to use for signup.",
      generalHelperText: "You can sign in after completing email verification.",
      submitIdle: "Sign up",
      submitPending: "Signing up...",
      submitFallbackError: "Failed to sign up.",
      loginPrompt: "Already have an account?",
      loginLink: "Sign in"
    }
  },
  "zh-CN": {
    login: {
      emailLabel: "邮箱",
      passwordLabel: "密码",
      emailPlaceholder: "you@example.com",
      passwordPlaceholder: "请输入密码",
      helperText: "使用邮箱和密码登录。",
      submitIdle: "登录",
      submitPending: "登录中...",
      submitFallbackError: "登录失败。",
      signupPrompt: "还没有账号？",
      signupLink: "注册"
    },
    signup: {
      accountTypeLabel: "账号类型",
      accountTypeGeneral: "普通用户",
      accountTypeBusiness: "企业用户",
      nameLabel: "姓名",
      emailLabel: "邮箱",
      passwordLabel: "密码",
      namePlaceholder: "张三",
      emailPlaceholder: "you@example.com",
      passwordPlaceholder: "请输入至少8个字符",
      businessHelperText: "请输入用于注册的邮箱。",
      generalHelperText: "完成邮箱验证后即可登录。",
      submitIdle: "注册",
      submitPending: "注册中...",
      submitFallbackError: "注册失败。",
      loginPrompt: "已有账号？",
      loginLink: "登录"
    }
  },
  vi: {
    login: {
      emailLabel: "Email",
      passwordLabel: "Mật khẩu",
      emailPlaceholder: "you@example.com",
      passwordPlaceholder: "Nhập mật khẩu",
      helperText: "Đăng nhập bằng email và mật khẩu.",
      submitIdle: "Đăng nhập",
      submitPending: "Đang đăng nhập...",
      submitFallbackError: "Đăng nhập thất bại.",
      signupPrompt: "Chưa có tài khoản?",
      signupLink: "Đăng ký"
    },
    signup: {
      accountTypeLabel: "Loại tài khoản",
      accountTypeGeneral: "Người dùng",
      accountTypeBusiness: "Doanh nghiệp",
      nameLabel: "Tên",
      emailLabel: "Email",
      passwordLabel: "Mật khẩu",
      namePlaceholder: "Nguyen Van A",
      emailPlaceholder: "you@example.com",
      passwordPlaceholder: "Nhập ít nhất 8 ký tự",
      businessHelperText: "Nhập email bạn muốn dùng để đăng ký.",
      generalHelperText: "Bạn có thể đăng nhập sau khi xác minh email.",
      submitIdle: "Đăng ký",
      submitPending: "Đang đăng ký...",
      submitFallbackError: "Đăng ký thất bại.",
      loginPrompt: "Đã có tài khoản?",
      loginLink: "Đăng nhập"
    }
  },
  ja: {
    login: {
      emailLabel: "メールアドレス",
      passwordLabel: "パスワード",
      emailPlaceholder: "you@example.com",
      passwordPlaceholder: "パスワードを入力してください",
      helperText: "メールアドレスとパスワードでログインします。",
      submitIdle: "ログイン",
      submitPending: "ログイン中...",
      submitFallbackError: "ログインに失敗しました。",
      signupPrompt: "アカウントをお持ちでない方は",
      signupLink: "会員登録"
    },
    signup: {
      accountTypeLabel: "会員タイプ",
      accountTypeGeneral: "一般会員",
      accountTypeBusiness: "パートナー会員",
      nameLabel: "お名前",
      emailLabel: "メールアドレス",
      passwordLabel: "パスワード",
      namePlaceholder: "山田 太郎",
      emailPlaceholder: "you@example.com",
      passwordPlaceholder: "8文字以上で入力してください",
      businessHelperText: "登録に使用するメールアドレスを入力してください。",
      generalHelperText: "登録後、メール認証を完了するとログインできます。",
      submitIdle: "会員登録",
      submitPending: "登録中...",
      submitFallbackError: "会員登録に失敗しました。",
      loginPrompt: "既にアカウントをお持ちの方は",
      loginLink: "ログイン"
    }
  },
  id: {
    login: {
      emailLabel: "Email",
      passwordLabel: "Kata sandi",
      emailPlaceholder: "you@example.com",
      passwordPlaceholder: "Masukkan kata sandi Anda",
      helperText: "Masuk dengan email dan kata sandi Anda.",
      submitIdle: "Masuk",
      submitPending: "Sedang masuk...",
      submitFallbackError: "Gagal masuk.",
      signupPrompt: "Belum punya akun?",
      signupLink: "Daftar"
    },
    signup: {
      accountTypeLabel: "Tipe akun",
      accountTypeGeneral: "Umum",
      accountTypeBusiness: "Mitra",
      nameLabel: "Nama",
      emailLabel: "Email",
      passwordLabel: "Kata sandi",
      namePlaceholder: "Budi Santoso",
      emailPlaceholder: "you@example.com",
      passwordPlaceholder: "Masukkan minimal 8 karakter",
      businessHelperText: "Masukkan email yang akan digunakan untuk pendaftaran.",
      generalHelperText: "Anda dapat masuk setelah menyelesaikan verifikasi email.",
      submitIdle: "Daftar",
      submitPending: "Sedang mendaftar...",
      submitFallbackError: "Pendaftaran gagal.",
      loginPrompt: "Sudah punya akun?",
      loginLink: "Masuk"
    }
  }
} as const;

export function getBrowserLocale(): PlatformLocale {
  if (typeof window === "undefined") return DEFAULT_PLATFORM_LOCALE;
  const storedLocale = window.localStorage.getItem(PLATFORM_LOCALE_STORAGE_KEY);
  if (storedLocale && (PLATFORM_LOCALES as readonly string[]).includes(storedLocale)) return storedLocale as PlatformLocale;
  const lang = window.navigator.language.toLowerCase();
  if (lang.startsWith("ko")) return "ko";
  if (lang.startsWith("zh")) return "zh-CN";
  if (lang.startsWith("vi")) return "vi";
  if (lang.startsWith("ja")) return "ja";
  if (lang.startsWith("id")) return "id";
  return "en";
}

export function resolveAuthErrorMessage(code?: string, fallback?: string, locale = getBrowserLocale()) {
  if (code && code in authErrorMessages[locale]) {
    return authErrorMessages[locale][code as keyof (typeof authErrorMessages)[typeof locale]];
  }

  if (fallback) return fallback;
  if (locale === "ko") return "요청을 처리하지 못했습니다.";
  if (locale === "zh-CN") return "无法处理该请求。";
  if (locale === "vi") return "Không thể xử lý yêu cầu.";
  if (locale === "ja") return "リクエストを処理できませんでした。";
  if (locale === "id") return "Tidak dapat memproses permintaan Anda.";
  return "Unable to process your request.";
}

export function getAuthPageMessages(locale = getBrowserLocale()) {
  return authPageMessages[locale];
}

const headerMessages = {
  ko: {
    brand: "Aply",
    nav: {
      positions: "포지션 탐색",
      matching: "취업 모험",
      community: "커뮤니티",
      resources: "자료실",
      pricing: "맞춤 지원",
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
      en: "English",
      "zh-CN": "简体中文",
      vi: "Tiếng Việt",
      ja: "日本語",
      id: "Bahasa Indonesia"
    }
  },
  en: {
    brand: "Aply",
    nav: {
      positions: "Positions",
      matching: "Readiness Score",
      community: "Community",
      resources: "Resources",
      pricing: "Customized Support",
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
      en: "English",
      "zh-CN": "简体中文",
      vi: "Tiếng Việt",
      ja: "日本語",
      id: "Bahasa Indonesia"
    }
  },
  "zh-CN": {
    brand: "Aply",
    nav: {
      positions: "职位探索",
      matching: "就业可能性",
      community: "社区",
      resources: "资料库",
      pricing: "定制支持",
      how: "运行方式",
      cases: "案例"
    },
    auth: {
      login: "登录",
      signup: "注册",
      myAccount: "我的信息",
      account: "账号",
      logout: "退出登录",
      rolePartner: "合作企业",
      roleOperator: "运营",
      greetingSuffix: ""
    },
    menuOpenLabel: "打开菜单",
    languageLabel: "选择语言",
    languageOptions: {
      ko: "한국어",
      en: "English",
      "zh-CN": "简体中文",
      vi: "Tiếng Việt",
      ja: "日本語",
      id: "Bahasa Indonesia"
    }
  },
  vi: {
    brand: "Aply",
    nav: {
      positions: "Khám phá vị trí",
      matching: "Khả năng việc làm",
      community: "Cộng đồng",
      resources: "Tài liệu",
      pricing: "Hỗ trợ tùy chỉnh",
      how: "Cách vận hành",
      cases: "Case study"
    },
    auth: {
      login: "Đăng nhập",
      signup: "Đăng ký",
      myAccount: "Tài khoản của tôi",
      account: "Tài khoản",
      logout: "Đăng xuất",
      rolePartner: "Đối tác",
      roleOperator: "Vận hành",
      greetingSuffix: ""
    },
    menuOpenLabel: "Mở menu",
    languageLabel: "Chọn ngôn ngữ",
    languageOptions: {
      ko: "한국어",
      en: "English",
      "zh-CN": "简体中文",
      vi: "Tiếng Việt"
    }
  },
  ja: {
    brand: "Aply",
    nav: {
      positions: "ポジション検索",
      matching: "就職可能性",
      community: "コミュニティ",
      resources: "資料室",
      pricing: "カスタムサポート",
      how: "運営方法",
      cases: "成功事例"
    },
    auth: {
      login: "ログイン",
      signup: "会員登録",
      myAccount: "マイページ",
      account: "アカウント",
      logout: "ログアウト",
      rolePartner: "パートナー会員",
      roleOperator: "運営者",
      greetingSuffix: "様"
    },
    menuOpenLabel: "メニューを開く",
    languageLabel: "言語を選択",
    languageOptions: {
      ko: "한국어",
      en: "English",
      "zh-CN": "简体中文",
      vi: "Tiếng Việt",
      ja: "日本語",
      id: "Bahasa Indonesia"
    }
  },
  id: {
    brand: "Aply",
    nav: {
      positions: "Cari Posisi",
      matching: "Peluang Karier",
      community: "Komunitas",
      resources: "Sumber Daya",
      pricing: "Dukungan Khusus",
      how: "Cara Kerja",
      cases: "Studi Kasus"
    },
    auth: {
      login: "Masuk",
      signup: "Daftar",
      myAccount: "Akun Saya",
      account: "Akun",
      logout: "Keluar",
      rolePartner: "Mitra",
      roleOperator: "Operator",
      greetingSuffix: ""
    },
    menuOpenLabel: "Buka menu",
    languageLabel: "Pilih bahasa",
    languageOptions: {
      ko: "한국어",
      en: "English",
      "zh-CN": "简体中文",
      vi: "Tiếng Việt",
      ja: "日本語",
      id: "Bahasa Indonesia"
    }
  }
} as const;

export function getHeaderMessages(locale = getBrowserLocale()) {
  return headerMessages[locale];
}
