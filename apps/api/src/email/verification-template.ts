import { renderEnglishVerificationTemplate } from "./verification-template.en";
import { renderKoreanVerificationTemplate } from "./verification-template.ko";
import {
  SUPPORTED_EMAIL_LOCALES,
  type EmailLocale,
  type VerificationEmailContent,
  type VerificationTemplateParams
} from "./verification-template.types";

type VerificationEmailTemplateInput = VerificationTemplateParams & {
  locale: EmailLocale;
};

export { SUPPORTED_EMAIL_LOCALES };
export type { EmailLocale };

export function renderVerificationEmailTemplate(input: VerificationEmailTemplateInput): VerificationEmailContent {
  const { locale, verifyUrl, ttlHours } = input;
  if (locale === "en") {
    return renderEnglishVerificationTemplate({ verifyUrl, ttlHours });
  }

  return renderKoreanVerificationTemplate({ verifyUrl, ttlHours });
}
