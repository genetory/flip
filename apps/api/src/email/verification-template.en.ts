import type { VerificationEmailContent, VerificationTemplateParams } from "./verification-template.types";

export function renderEnglishVerificationTemplate(params: VerificationTemplateParams): VerificationEmailContent {
  const { verifyUrl, ttlHours } = params;
  return {
    subject: "[Flip] Verify your email",
    text: `Please verify your email by opening this link:\n${verifyUrl}\n\nThis link expires in ${ttlHours} hours.`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827"><h2 style="margin:0 0 16px">Verify your email</h2><p style="margin:0 0 12px">Thanks for signing up. Click the button below to verify your email address.</p><p style="margin:16px 0"><a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px">Verify Email</a></p><p style="margin:0 0 8px;color:#4b5563">If the button does not work, open this link:</p><p style="margin:0 0 12px"><a href="${verifyUrl}">${verifyUrl}</a></p><p style="margin:0;color:#6b7280;font-size:13px">This link expires in ${ttlHours} hours.</p></div>`
  };
}
