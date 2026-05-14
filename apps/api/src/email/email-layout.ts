import type { EmailLocale } from "./verification-template.types";

export const brandName = "Aply";
export const companyLegalName = "주식회사 플리퍼스 (Flippers Inc.)";
export const supportEmail = process.env.EMAIL_SUPPORT_ADDRESS?.trim() || "info@flip-ers.com";
export const websiteUrl = process.env.EMAIL_BRAND_URL?.trim() || "https://aply.global";

type LayoutInput = {
  locale: EmailLocale;
  previewText: string;
  title: string;
  bodyHtml: string;
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderFooter(locale: EmailLocale) {
  if (locale === "ko") {
    return `
      <p style="margin:0 0 6px;font-size:12px;color:#6b7280;line-height:1.6;">
        본 메일은 회원가입 인증 목적으로 발송되는 트랜잭션 메일입니다. 광고/마케팅 정보는 포함되어 있지 않습니다.
      </p>
      <p style="margin:0 0 12px;font-size:12px;color:#6b7280;line-height:1.6;">
        문의: <a href="mailto:${supportEmail}" style="color:#6b7280;text-decoration:underline;">${supportEmail}</a>
        &nbsp;·&nbsp;
        <a href="${websiteUrl}" style="color:#6b7280;text-decoration:underline;">${websiteUrl}</a>
      </p>
      <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
        ${companyLegalName}<br />
        © ${new Date().getFullYear()} Flippers Inc. All rights reserved.
      </p>
    `;
  }
  return `
    <p style="margin:0 0 6px;font-size:12px;color:#6b7280;line-height:1.6;">
      This is a transactional email sent for account verification only. No marketing content is included.
    </p>
    <p style="margin:0 0 12px;font-size:12px;color:#6b7280;line-height:1.6;">
      Support: <a href="mailto:${supportEmail}" style="color:#6b7280;text-decoration:underline;">${supportEmail}</a>
      &nbsp;·&nbsp;
      <a href="${websiteUrl}" style="color:#6b7280;text-decoration:underline;">${websiteUrl}</a>
    </p>
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
      ${companyLegalName}<br />
      © ${new Date().getFullYear()} Flippers Inc. All rights reserved.
    </p>
  `;
}

export function renderEmailLayout({ locale, previewText, title, bodyHtml }: LayoutInput): string {
  const lang = locale === "ko" ? "ko" : "en";
  const safePreview = escapeHtml(previewText);
  const safeTitle = escapeHtml(title);
  return `<!DOCTYPE html>
<html lang="${lang}" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:'Apple SD Gothic Neo','Malgun Gothic','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<!-- Preview text (hidden in body, shown in inbox preview) -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#F3F4F6;">${safePreview}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F3F4F6;padding:32px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(15,23,42,0.06);">
        <!-- Header -->
        <tr>
          <td style="padding:24px 32px;border-bottom:1px solid #E5E7EB;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <a href="${websiteUrl}" style="text-decoration:none;color:#0B1227;font-size:22px;font-weight:800;letter-spacing:-0.02em;">
                    ${brandName}
                  </a>
                </td>
                <td align="right" style="font-size:12px;color:#9ca3af;">
                  ${locale === "ko" ? "인증 메일" : "Account verification"}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;color:#111827;font-size:15px;line-height:1.6;">
            ${bodyHtml}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background-color:#FAFAFA;border-top:1px solid #E5E7EB;">
            ${renderFooter(locale)}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
