import type { VerificationEmailContent, VerificationTemplateParams } from "./verification-template.types";
import { renderEmailLayout, supportEmail, brandName, websiteUrl } from "./email-layout";

export function renderKoreanVerificationTemplate(params: VerificationTemplateParams): VerificationEmailContent {
  const { verifyUrl, ttlHours } = params;

  const subject = `${brandName} 이메일 인증 안내`;

  const text = [
    `안녕하세요. ${brandName}입니다.`,
    "",
    `${brandName} 회원가입을 신청해 주셔서 감사합니다. 아래 링크를 열어 이메일 인증을 완료해 주세요.`,
    "",
    `인증 링크: ${verifyUrl}`,
    "",
    `※ 이 링크는 ${ttlHours}시간 후 만료됩니다.`,
    "※ 회원가입을 신청하지 않으셨다면 이 메일을 무시하시면 됩니다. 별도의 조치는 필요하지 않습니다.",
    "",
    `문의: ${supportEmail}`,
    `웹사이트: ${websiteUrl}`,
    "",
    "주식회사 플리퍼스 (Flippers Inc.)"
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#111827;">안녕하세요. <strong>${brandName}</strong>입니다.</p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;">
      ${brandName} 회원가입을 신청해 주셔서 감사합니다.<br />
      아래 버튼을 눌러 이메일 인증을 완료해 주세요.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
      <tr>
        <td align="center" bgcolor="#0B46E8" style="border-radius:10px;">
          <a href="${verifyUrl}"
             style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;background-color:#0B46E8;">
            이메일 인증하기
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:14px;color:#4b5563;">버튼이 동작하지 않으면 아래 링크를 브라우저 주소창에 붙여넣어 주세요.</p>
    <p style="margin:0 0 24px;font-size:13px;color:#0B46E8;word-break:break-all;">
      <a href="${verifyUrl}" style="color:#0B46E8;text-decoration:underline;">${verifyUrl}</a>
    </p>
    <div style="margin:24px 0;padding:14px 16px;background:#F9FAFB;border-left:3px solid #0B46E8;border-radius:6px;font-size:13px;color:#4b5563;line-height:1.6;">
      <strong style="color:#111827;">안내</strong><br />
      • 이 링크는 발송 시점부터 <strong>${ttlHours}시간</strong> 동안만 유효합니다.<br />
      • 회원가입을 신청하지 않으셨다면 이 메일을 무시하셔도 됩니다. 별도의 조치는 필요하지 않습니다.<br />
      • 다른 사람이 회원님의 이메일로 회원가입을 시도했을 가능성이 있으니, 의심스러운 경우 <a href="mailto:${supportEmail}" style="color:#0B46E8;">${supportEmail}</a>으로 알려주세요.
    </div>
  `;

  return {
    subject,
    text,
    html: renderEmailLayout({
      locale: "ko",
      previewText: `${brandName} 이메일 인증을 완료해 주세요. 이 링크는 ${ttlHours}시간 후 만료됩니다.`,
      title: "이메일 인증",
      bodyHtml
    })
  };
}
