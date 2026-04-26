export const SUPPORTED_EMAIL_LOCALES = ["ko", "en"] as const;
export type EmailLocale = (typeof SUPPORTED_EMAIL_LOCALES)[number];

export type VerificationTemplateParams = {
  verifyUrl: string;
  ttlHours: number;
};

export type VerificationEmailContent = {
  subject: string;
  text: string;
  html: string;
};
