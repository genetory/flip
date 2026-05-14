import type { VerificationEmailContent, VerificationTemplateParams } from "./verification-template.types";
import { renderEmailLayout, supportEmail, brandName, websiteUrl } from "./email-layout";

export function renderEnglishVerificationTemplate(params: VerificationTemplateParams): VerificationEmailContent {
  const { verifyUrl, ttlHours } = params;

  const subject = `Verify your ${brandName} email address`;

  const text = [
    `Hi, this is ${brandName}.`,
    "",
    `Thanks for signing up for ${brandName}. Please confirm your email address by opening the link below.`,
    "",
    `Verification link: ${verifyUrl}`,
    "",
    `Note: This link expires in ${ttlHours} hours.`,
    `If you did not sign up for ${brandName}, you can safely ignore this email — no further action is needed.`,
    "",
    `Support: ${supportEmail}`,
    `Website: ${websiteUrl}`,
    "",
    "Flippers Inc."
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#111827;">Hi, this is <strong>${brandName}</strong>.</p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;">
      Thanks for signing up for ${brandName}.<br />
      Please confirm your email address by clicking the button below.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
      <tr>
        <td align="center" bgcolor="#0B46E8" style="border-radius:10px;">
          <a href="${verifyUrl}"
             style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;background-color:#0B46E8;">
            Verify my email
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:14px;color:#4b5563;">If the button doesn't work, paste this link into your browser:</p>
    <p style="margin:0 0 24px;font-size:13px;color:#0B46E8;word-break:break-all;">
      <a href="${verifyUrl}" style="color:#0B46E8;text-decoration:underline;">${verifyUrl}</a>
    </p>
    <div style="margin:24px 0;padding:14px 16px;background:#F9FAFB;border-left:3px solid #0B46E8;border-radius:6px;font-size:13px;color:#4b5563;line-height:1.6;">
      <strong style="color:#111827;">Note</strong><br />
      • This link is valid for <strong>${ttlHours} hours</strong> from the time it was sent.<br />
      • If you did not sign up for ${brandName}, you can ignore this email — no further action is needed.<br />
      • If you believe someone is trying to use your email address, please contact <a href="mailto:${supportEmail}" style="color:#0B46E8;">${supportEmail}</a>.
    </div>
  `;

  return {
    subject,
    text,
    html: renderEmailLayout({
      locale: "en",
      previewText: `Confirm your ${brandName} email address. This link expires in ${ttlHours} hours.`,
      title: "Email verification",
      bodyHtml
    })
  };
}
