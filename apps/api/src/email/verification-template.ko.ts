import type { VerificationEmailContent, VerificationTemplateParams } from "./verification-template.types";

export function renderKoreanVerificationTemplate(params: VerificationTemplateParams): VerificationEmailContent {
  const { verifyUrl, ttlHours } = params;
  return {
    subject: "[Flip] 이메일 인증을 완료해 주세요",
    text: `아래 링크를 열어 이메일 인증을 완료해 주세요:\n${verifyUrl}\n\n이 링크는 ${ttlHours}시간 후 만료됩니다.`,
    html: `<div style="font-family:'Apple SD Gothic Neo','Malgun Gothic',Arial,sans-serif;line-height:1.6;color:#111827"><h2 style="margin:0 0 16px">이메일 인증이 필요합니다</h2><p style="margin:0 0 12px">가입을 완료하려면 아래 버튼을 눌러 이메일 인증을 진행해 주세요.</p><p style="margin:16px 0"><a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px">이메일 인증하기</a></p><p style="margin:0 0 8px;color:#4b5563">버튼이 동작하지 않으면 아래 링크를 브라우저에 붙여넣어 주세요:</p><p style="margin:0 0 12px"><a href="${verifyUrl}">${verifyUrl}</a></p><p style="margin:0;color:#6b7280;font-size:13px">이 링크는 ${ttlHours}시간 후 만료됩니다.</p></div>`
  };
}
