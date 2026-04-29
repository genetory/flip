import "dotenv/config";
import { randomBytes, randomInt } from "crypto";
import cors from "cors";
import express from "express";
import nodemailer from "nodemailer";
import OpenAI from "openai";
import swaggerUi from "swagger-ui-express";
import {
  Prisma,
  MemberRole,
  CandidateVisaType,
  CandidateEducationType,
  CandidateEducationStatus,
  CandidateLanguageType,
  CandidateLanguageLevel,
  CandidateActivityType,
  CommunityPostCategory,
  PositionStatus,
  PartnerIndustry,
  PartnerOrgUserRole,
  PartnerType,
  PrismaClient
} from "@prisma/client";
import { z } from "zod";
import {
  authenticate,
  hashPassword,
  hashToken,
  requireRoles,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyPassword,
  verifyRefreshToken
} from "./auth";
import {
  SUPPORTED_EMAIL_LOCALES,
  type EmailLocale,
  renderVerificationEmailTemplate
} from "./email/verification-template";

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.API_PORT ?? 4000);
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const openaiMatchingModel = process.env.OPENAI_MATCHING_MODEL ?? "gpt-5.4";
const openaiTranslationModel = process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-5.4-mini";
const openaiMatchingMaxPool = Number(process.env.OPENAI_MATCHING_MAX_POOL ?? 120);
const openaiMatchingPrefilterMultiplier = Math.max(1, Number(process.env.OPENAI_MATCHING_PREFILTER_MULTIPLIER ?? 4));
const openaiMatchingMinCompletionPercent = Math.max(0, Math.min(100, Number(process.env.OPENAI_MATCHING_MIN_COMPLETION_PERCENT ?? 45)));
const openaiMatchingHighCompletionBonus = Math.max(0, Number(process.env.OPENAI_MATCHING_HIGH_COMPLETION_BONUS ?? 6));
const openaiMatchingLowCompletionPenalty = Math.max(0, Number(process.env.OPENAI_MATCHING_LOW_COMPLETION_PENALTY ?? 8));
const openaiMatchingTextMax = Number(process.env.OPENAI_MATCHING_TEXT_MAX ?? 280);
const refreshTokenTtlDays = Math.max(1, Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30));
const platformWebUrl = process.env.PLATFORM_WEB_URL ?? "http://localhost:3000";
const partnerAdminUrl = process.env.PARTNER_ADMIN_URL ?? "http://localhost:3001";
const opsAdminUrl = process.env.OPS_ADMIN_URL ?? "http://localhost:3002";
const emailVerificationTtlHours = Math.max(1, Number(process.env.EMAIL_VERIFICATION_TTL_HOURS ?? 24));
const emailVerificationBaseUrl = process.env.EMAIL_VERIFICATION_BASE_URL ?? `${platformWebUrl}/verify-email`;
const emailFromAddress = process.env.EMAIL_FROM?.trim() ?? "";
const smtpHost = process.env.SMTP_HOST?.trim() ?? "";
const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const smtpUser = process.env.SMTP_USER?.trim() ?? "";
const smtpPass = process.env.SMTP_PASS ?? "";
const smtpSecure = String(process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";
const signupEmailVerificationCodeTtlMinutes = Math.max(1, Number(process.env.SIGNUP_EMAIL_VERIFICATION_CODE_TTL_MINUTES ?? 10));
const allowedOrigins = [platformWebUrl, partnerAdminUrl, opsAdminUrl];
const refreshCookieName = "flip_refresh_token";
const isProduction = process.env.NODE_ENV === "production";
const publicEmailDomains = new Set([
  "gmail.com",
  "googlemail.com",
  "naver.com",
  "hanmail.net",
  "daum.net",
  "kakao.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "yahoo.com",
  "yahoo.co.kr",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "msn.com"
]);

type AuthTokenUser = {
  id: string;
  role: MemberRole;
  partnerType: PartnerType | null;
};

type AuthErrorCode =
  | "INVALID_REQUEST"
  | "BUSINESS_EMAIL_REQUIRED"
  | "EMAIL_ALREADY_EXISTS"
  | "EMAIL_PREVERIFICATION_REQUIRED"
  | "EMAIL_VERIFICATION_REQUIRED"
  | "INVALID_EMAIL_VERIFICATION_TOKEN"
  | "EXPIRED_EMAIL_VERIFICATION_TOKEN"
  | "INVALID_EMAIL_PREVERIFICATION_CODE"
  | "EXPIRED_EMAIL_PREVERIFICATION_CODE"
  | "REGISTRATION_FAILED"
  | "INVALID_CREDENTIALS"
  | "MISSING_REFRESH_TOKEN"
  | "INVALID_REFRESH_TOKEN"
  | "REFRESH_TOKEN_REVOKED"
  | "USER_NOT_FOUND"
  | "PARTNER_AFFILIATION_REQUIRED";

async function issueAuthTokens(user: AuthTokenUser) {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    partnerType: user.partnerType
  });

  const refreshTokenId = randomBytes(16).toString("hex");
  const refreshToken = signRefreshToken({
    sub: user.id,
    jti: refreshTokenId
  });
  const expiresAt = new Date(Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      id: refreshTokenId,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt
    }
  });

  return { accessToken, refreshToken };
}

function sendAuthError(
  res: express.Response,
  status: number,
  code: AuthErrorCode,
  message: string,
  extras?: Record<string, unknown>
) {
  return res.status(status).json({
    ok: false,
    code,
    message,
    ...extras
  });
}

let smtpTransporter: nodemailer.Transporter | null = null;
let smtpInitialized = false;

function getSmtpTransporter() {
  if (smtpInitialized) return smtpTransporter;
  smtpInitialized = true;
  if (!smtpHost || !emailFromAddress) return null;

  smtpTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined
  });
  return smtpTransporter;
}

function buildEmailVerificationUrl(token: string) {
  const hasQuery = emailVerificationBaseUrl.includes("?");
  return `${emailVerificationBaseUrl}${hasQuery ? "&" : "?"}token=${encodeURIComponent(token)}`;
}

async function createEmailVerificationToken(userId: string) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + emailVerificationTtlHours * 60 * 60 * 1000);

  await prisma.emailVerificationToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() }
  });

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  return {
    token: rawToken,
    expiresAt
  };
}

function createSixDigitCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

async function createSignupEmailPreverificationCode(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const code = createSixDigitCode();
  const codeHash = hashToken(code);
  const expiresAt = new Date(Date.now() + signupEmailVerificationCodeTtlMinutes * 60 * 1000);

  await prisma.emailPreverificationToken.updateMany({
    where: { email: normalizedEmail, usedAt: null },
    data: { usedAt: new Date() }
  });

  await prisma.emailPreverificationToken.create({
    data: {
      email: normalizedEmail,
      codeHash,
      expiresAt
    }
  });

  return {
    email: normalizedEmail,
    code,
    expiresAt
  };
}

async function sendSignupEmailPreverificationCode(email: string, code: string, locale: EmailLocale) {
  const transporter = getSmtpTransporter();
  const subject = locale === "ko" ? "[Flip] 회원가입 이메일 인증 코드" : "[Flip] Signup email verification code";
  const text =
    locale === "ko"
      ? `아래 인증 코드를 입력해 주세요.\n\n인증코드: ${code}\n\n코드는 ${signupEmailVerificationCodeTtlMinutes}분 후 만료됩니다.`
      : `Please enter the verification code below.\n\nCode: ${code}\n\nThis code expires in ${signupEmailVerificationCodeTtlMinutes} minutes.`;
  const html =
    locale === "ko"
      ? `<div style="font-family:'Apple SD Gothic Neo','Malgun Gothic',Arial,sans-serif;line-height:1.6;color:#111827"><h2 style="margin:0 0 16px">이메일 인증 코드</h2><p style="margin:0 0 12px">아래 코드를 입력해 이메일 인증을 완료해 주세요.</p><p style="margin:16px 0;font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p style="margin:0;color:#6b7280;font-size:13px">코드는 ${signupEmailVerificationCodeTtlMinutes}분 후 만료됩니다.</p></div>`
      : `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827"><h2 style="margin:0 0 16px">Email verification code</h2><p style="margin:0 0 12px">Enter the code below to verify your email.</p><p style="margin:16px 0;font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p style="margin:0;color:#6b7280;font-size:13px">This code expires in ${signupEmailVerificationCodeTtlMinutes} minutes.</p></div>`;

  if (transporter) {
    await transporter.sendMail({
      from: emailFromAddress,
      to: email,
      subject,
      text,
      html
    });
    return { delivery: "smtp" as const, code };
  }

  console.info(`[auth][signup-email-preverification][${locale}] ${email} -> ${code}`);
  return { delivery: "log" as const, code };
}

function normalizeEmailLocale(value: string | null | undefined): EmailLocale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.startsWith("ko")) return "ko";
  if (normalized.startsWith("en")) return "en";
  return null;
}

function resolveEmailLocale(req: express.Request, preferredLocale?: string | null): EmailLocale {
  const fromBody = normalizeEmailLocale(preferredLocale);
  if (fromBody) return fromBody;

  const header = req.headers["accept-language"];
  const headerValue = Array.isArray(header) ? header.join(",") : header;
  if (!headerValue) return "ko";
  const candidates = headerValue.split(",");
  for (const candidate of candidates) {
    const locale = normalizeEmailLocale(candidate);
    if (locale) return locale;
  }
  return "ko";
}

function renderVerificationEmail(locale: EmailLocale, verifyUrl: string) {
  return renderVerificationEmailTemplate({
    locale,
    verifyUrl,
    ttlHours: emailVerificationTtlHours
  });
}

async function sendVerificationEmail(email: string, token: string, locale: EmailLocale) {
  const verifyUrl = buildEmailVerificationUrl(token);
  const transporter = getSmtpTransporter();
  const content = renderVerificationEmail(locale, verifyUrl);

  if (transporter) {
    await transporter.sendMail({
      from: emailFromAddress,
      to: email,
      subject: content.subject,
      text: content.text,
      html: content.html
    });
    return { delivery: "smtp" as const, verifyUrl, locale };
  }

  console.info(`[auth][email-verification][${locale}] ${email} -> ${verifyUrl}`);
  return { delivery: "log" as const, verifyUrl, locale };
}

function logMatchingEvent(event: string, payload?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  if (payload) {
    console.info(`[matching][${timestamp}] ${event}`, payload);
    return;
  }
  console.info(`[matching][${timestamp}] ${event}`);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function summarizePartnerPositionBody(body: unknown) {
  if (!body || typeof body !== "object") return body;
  const record = body as Record<string, unknown>;
  const thumbnailImages = Array.isArray(record.thumbnailImages)
    ? (record.thumbnailImages as unknown[])
    : null;
  const thumbnailImageLengths = thumbnailImages
    ? thumbnailImages
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.length)
    : undefined;

  return {
    ...record,
    thumbnailImages: thumbnailImages
      ? `${thumbnailImages.length} item(s)`
      : record.thumbnailImages,
    thumbnailImageLengths,
    eligibleVisas: Array.isArray(record.eligibleVisas)
      ? `${record.eligibleVisas.length} item(s)`
      : record.eligibleVisas,
    preferredNationalities: Array.isArray(record.preferredNationalities)
      ? `${record.preferredNationalities.length} item(s)`
      : record.preferredNationalities,
    communicationLanguages: Array.isArray(record.communicationLanguages)
      ? `${record.communicationLanguages.length} item(s)`
      : record.communicationLanguages
  };
}

function getMatchingHistoryDelegate() {
  return (prisma as unknown as {
    matchingRunHistory?: {
      create: (args: unknown) => Promise<unknown>;
      findFirst?: (args: unknown) => Promise<unknown | null>;
      findMany: (args: unknown) => Promise<unknown[]>;
      count: (args?: unknown) => Promise<number>;
    };
  }).matchingRunHistory;
}

function truncateText(value: string | null | undefined, maxLength = openaiMatchingTextMax) {
  if (!value) return null;
  const text = value.trim();
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function compactArray(values: Array<string | null | undefined>, maxItems: number) {
  return values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0)
    .slice(0, maxItems);
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function parseCookies(cookieHeader: string | undefined) {
  if (!cookieHeader) return {} as Record<string, string>;
  return cookieHeader.split(";").reduce<Record<string, string>>((acc, chunk) => {
    const [rawKey, ...rest] = chunk.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function getEmailDomain(email: string) {
  const normalized = email.trim().toLowerCase();
  const atIndex = normalized.lastIndexOf("@");
  return atIndex >= 0 ? normalized.slice(atIndex + 1) : "";
}

function isBusinessEmail(email: string) {
  const domain = getEmailDomain(email);
  return Boolean(domain) && !publicEmailDomains.has(domain);
}

function getRefreshTokenFromRequest(req: express.Request) {
  const fromCookie = parseCookies(req.headers.cookie)[refreshCookieName];
  if (fromCookie) return fromCookie;
  if (req.body && typeof req.body === "object" && "refreshToken" in req.body && typeof req.body.refreshToken === "string") {
    return req.body.refreshToken;
  }
  return null;
}

function setRefreshTokenCookie(res: express.Response, refreshToken: string) {
  const maxAge = refreshTokenTtlDays * 24 * 60 * 60;
  const parts = [
    `${refreshCookieName}=${encodeURIComponent(refreshToken)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`
  ];
  if (isProduction) {
    parts.push("Secure");
  }
  res.append("Set-Cookie", parts.join("; "));
}

function clearRefreshTokenCookie(res: express.Response) {
  const parts = [
    `${refreshCookieName}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0"
  ];
  if (isProduction) {
    parts.push("Secure");
  }
  res.append("Set-Cookie", parts.join("; "));
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json({ limit: "12mb" }));

type ApiDocEndpoint = {
  method: "get" | "post" | "patch" | "delete";
  path: string;
  summary: string;
  tag: string;
  secure?: boolean;
  requestBody?: boolean;
  requestSchemaRef?: string;
  successStatus?: "200" | "201";
  successSchemaRef?: string;
};

const apiDocEndpoints: ApiDocEndpoint[] = [
  { method: "get", path: "/openapi.json", summary: "OpenAPI JSON", tag: "System" },
  { method: "get", path: "/health", summary: "Health check", tag: "System" },
  { method: "get", path: "/", summary: "Root endpoint", tag: "System" },
  { method: "get", path: "/members/meta", summary: "Members metadata", tag: "Members" },
  { method: "get", path: "/positions", summary: "Public positions list", tag: "Positions" },
  { method: "get", path: "/community/posts", summary: "Public community posts list", tag: "Community" },
  { method: "post", path: "/community/posts", summary: "Create community post", tag: "Community", secure: true, requestBody: true, successStatus: "201" },
  { method: "patch", path: "/community/posts/:postId", summary: "Update my community post", tag: "Community", secure: true, requestBody: true },
  { method: "delete", path: "/community/posts/:postId", summary: "Delete my community post", tag: "Community", secure: true },
  { method: "post", path: "/community/posts/:postId/like", summary: "Like community post", tag: "Community", secure: true },
  { method: "delete", path: "/community/posts/:postId/like", summary: "Unlike community post", tag: "Community", secure: true },
  { method: "get", path: "/community/posts/:postId/comments", summary: "List community post comments", tag: "Community" },
  { method: "post", path: "/community/posts/:postId/comments", summary: "Create community post comment", tag: "Community", secure: true, requestBody: true, successStatus: "201" },
  { method: "post", path: "/community/translate", summary: "Translate text to Korean or English", tag: "Community", requestBody: true },
  { method: "get", path: "/positions/premium-banners", summary: "Public premium position banners", tag: "Positions" },
  { method: "get", path: "/positions/:id", summary: "Public position detail", tag: "Positions" },
  { method: "get", path: "/positions/meta", summary: "Public positions metadata", tag: "Positions" },
  { method: "patch", path: "/members/me", summary: "Update my member basics", tag: "Members", secure: true, requestBody: true },
  { method: "get", path: "/members/me/partner-organization", summary: "Get my partner organization", tag: "Members", secure: true },
  { method: "patch", path: "/members/me/partner-organization", summary: "Update my partner organization basics", tag: "Members", secure: true, requestBody: true },
  { method: "get", path: "/members/me/profile", summary: "Get my candidate profile", tag: "Members", secure: true },
  { method: "patch", path: "/members/me/profile", summary: "Update my candidate profile", tag: "Members", secure: true, requestBody: true },
  { method: "get", path: "/members/me/positions/favorites", summary: "Get my favorite positions", tag: "Members", secure: true },
  { method: "post", path: "/members/me/positions/:positionId/favorite", summary: "Add my favorite position", tag: "Members", secure: true },
  { method: "delete", path: "/members/me/positions/:positionId/favorite", summary: "Remove my favorite position", tag: "Members", secure: true },
  { method: "get", path: "/members/me/positions/applied", summary: "Get my applied positions", tag: "Members", secure: true },
  { method: "post", path: "/members/me/positions/:positionId/apply", summary: "Apply to position", tag: "Members", secure: true },
  { method: "delete", path: "/members/me/positions/:positionId/apply", summary: "Cancel my applied position", tag: "Members", secure: true },
  { method: "post", path: "/members/me/educations", summary: "Create my education", tag: "Members", secure: true, requestBody: true, successStatus: "201" },
  { method: "patch", path: "/members/me/educations/:educationId", summary: "Update my education", tag: "Members", secure: true, requestBody: true },
  { method: "delete", path: "/members/me/educations/:educationId", summary: "Delete my education", tag: "Members", secure: true },
  { method: "post", path: "/members/me/language-skills", summary: "Create my language skill", tag: "Members", secure: true, requestBody: true, successStatus: "201" },
  { method: "patch", path: "/members/me/language-skills/:languageSkillId", summary: "Update my language skill", tag: "Members", secure: true, requestBody: true },
  { method: "delete", path: "/members/me/language-skills/:languageSkillId", summary: "Delete my language skill", tag: "Members", secure: true },
  { method: "post", path: "/members/me/careers", summary: "Create my career", tag: "Members", secure: true, requestBody: true, successStatus: "201" },
  { method: "patch", path: "/members/me/careers/:careerId", summary: "Update my career", tag: "Members", secure: true, requestBody: true },
  { method: "delete", path: "/members/me/careers/:careerId", summary: "Delete my career", tag: "Members", secure: true },
  { method: "post", path: "/members/me/activity-experiences", summary: "Create my activity experience", tag: "Members", secure: true, requestBody: true, successStatus: "201" },
  { method: "patch", path: "/members/me/activity-experiences/:activityExperienceId", summary: "Update my activity experience", tag: "Members", secure: true, requestBody: true },
  { method: "delete", path: "/members/me/activity-experiences/:activityExperienceId", summary: "Delete my activity experience", tag: "Members", secure: true },
  { method: "post", path: "/auth/register", summary: "Register user", tag: "Auth", requestBody: true, requestSchemaRef: "#/components/schemas/RegisterRequest", successStatus: "201", successSchemaRef: "#/components/schemas/GenericObjectResponse" },
  { method: "post", path: "/auth/business-email/send-verification", summary: "Send business signup email verification code", tag: "Auth", requestBody: true, requestSchemaRef: "#/components/schemas/BusinessEmailSendVerificationRequest", successSchemaRef: "#/components/schemas/GenericObjectResponse" },
  { method: "post", path: "/auth/business-email/verify", summary: "Verify business signup email code", tag: "Auth", requestBody: true, requestSchemaRef: "#/components/schemas/BusinessEmailVerifyRequest", successSchemaRef: "#/components/schemas/GenericObjectResponse" },
  { method: "post", path: "/auth/login", summary: "Login", tag: "Auth", requestBody: true, requestSchemaRef: "#/components/schemas/LoginRequest", successSchemaRef: "#/components/schemas/AuthSuccessResponse" },
  { method: "post", path: "/auth/verify-email", summary: "Verify email address", tag: "Auth", requestBody: true, requestSchemaRef: "#/components/schemas/EmailVerificationRequest", successSchemaRef: "#/components/schemas/AuthSuccessResponse" },
  { method: "post", path: "/auth/resend-verification", summary: "Resend verification email", tag: "Auth", requestBody: true, requestSchemaRef: "#/components/schemas/ResendVerificationRequest", successSchemaRef: "#/components/schemas/GenericObjectResponse" },
  { method: "post", path: "/auth/refresh", summary: "Refresh access token", tag: "Auth", requestBody: true, requestSchemaRef: "#/components/schemas/RefreshTokenRequest", successSchemaRef: "#/components/schemas/AuthSuccessResponse" },
  { method: "post", path: "/auth/logout", summary: "Logout and revoke refresh token", tag: "Auth", requestBody: true, requestSchemaRef: "#/components/schemas/RefreshTokenRequest" },
  { method: "get", path: "/auth/me", summary: "Get current user", tag: "Auth", secure: true },

  { method: "get", path: "/members", summary: "List members", tag: "Members", secure: true },
  { method: "post", path: "/members", summary: "Create member", tag: "Members", secure: true, requestBody: true },
  { method: "get", path: "/partner/dashboard", summary: "Partner dashboard summary", tag: "Partner", secure: true },
  { method: "post", path: "/partner/positions", summary: "Create partner position", tag: "Partner", secure: true, requestBody: true, successStatus: "201" },
  { method: "get", path: "/partner/positions/:id", summary: "Get my partner position detail", tag: "Partner", secure: true },
  { method: "patch", path: "/partner/positions/:id", summary: "Update my partner position", tag: "Partner", secure: true, requestBody: true },

  { method: "get", path: "/ops/dashboard", summary: "Ops dashboard summary", tag: "Ops Dashboard", secure: true },
  { method: "get", path: "/ops/partners/meta", summary: "Partner metadata", tag: "Ops Partners", secure: true },
  { method: "get", path: "/ops/positions/meta", summary: "Position metadata", tag: "Ops Positions", secure: true },
  { method: "get", path: "/ops/partners", summary: "List partners", tag: "Ops Partners", secure: true },
  { method: "get", path: "/ops/partners/:id", summary: "Get partner detail", tag: "Ops Partners", secure: true },
  { method: "post", path: "/ops/partners", summary: "Create partner", tag: "Ops Partners", secure: true, requestBody: true, successStatus: "201" },
  { method: "patch", path: "/ops/partners/:id", summary: "Update partner", tag: "Ops Partners", secure: true, requestBody: true },
  { method: "post", path: "/ops/partners/:id/members", summary: "Create partner member", tag: "Ops Partners", secure: true, requestBody: true, successStatus: "201" },
  { method: "delete", path: "/ops/partners/:id/members/:memberId", summary: "Delete partner member", tag: "Ops Partners", secure: true },
  { method: "get", path: "/ops/partner-users", summary: "List partner users", tag: "Ops Partners", secure: true },
  { method: "patch", path: "/ops/partner-users/:id/admin-memo", summary: "Update partner user admin memo", tag: "Ops Partners", secure: true, requestBody: true },

  { method: "post", path: "/ops/matching/run", summary: "Run matching", tag: "Ops Matching", secure: true, requestBody: true },
  { method: "get", path: "/ops/matching/history", summary: "List matching history", tag: "Ops Matching", secure: true },

  { method: "get", path: "/ops/positions", summary: "List positions", tag: "Ops Positions", secure: true },
  { method: "post", path: "/ops/positions", summary: "Create position", tag: "Ops Positions", secure: true, requestBody: true, successStatus: "201" },
  { method: "patch", path: "/ops/positions/:id", summary: "Update position", tag: "Ops Positions", secure: true, requestBody: true },
  { method: "get", path: "/ops/positions/premium-banners", summary: "List premium position banners", tag: "Ops Positions", secure: true },
  { method: "patch", path: "/ops/positions/:id/premium-banner", summary: "Update position premium banner", tag: "Ops Positions", secure: true, requestBody: true },
  { method: "patch", path: "/ops/positions/:id/status", summary: "Update position status", tag: "Ops Positions", secure: true, requestBody: true },
  { method: "post", path: "/ops/positions/:id/participants", summary: "Add position participant", tag: "Ops Positions", secure: true, requestBody: true, successStatus: "201" },
  { method: "delete", path: "/ops/positions/:id/participants/:participantId", summary: "Delete position participant", tag: "Ops Positions", secure: true },
  { method: "post", path: "/ops/positions/:id/logs", summary: "Add position progress log", tag: "Ops Positions", secure: true, requestBody: true, successStatus: "201" },

  { method: "post", path: "/ops/candidates", summary: "Create candidate", tag: "Ops Candidates", secure: true, requestBody: true, successStatus: "201" },
  { method: "patch", path: "/ops/candidates/:id", summary: "Update candidate", tag: "Ops Candidates", secure: true, requestBody: true },
  { method: "patch", path: "/ops/candidates/:id/admin-memo", summary: "Update candidate admin memo", tag: "Ops Candidates", secure: true, requestBody: true },
  { method: "get", path: "/ops/candidates/:id/profile", summary: "Get candidate profile", tag: "Ops Candidates", secure: true },
  { method: "patch", path: "/ops/candidates/:id/profile", summary: "Update candidate profile", tag: "Ops Candidates", secure: true, requestBody: true },
  { method: "patch", path: "/ops/candidates/:id/email-verified", summary: "Update candidate email-verified status", tag: "Ops Candidates", secure: true, requestBody: true },
  { method: "post", path: "/ops/candidates/sync-users", summary: "Sync candidate users", tag: "Ops Candidates", secure: true, requestBody: true },
  { method: "post", path: "/ops/candidates/:id/educations", summary: "Create education", tag: "Ops Candidates", secure: true, requestBody: true, successStatus: "201" },
  { method: "patch", path: "/ops/candidates/:id/educations/:educationId", summary: "Update education", tag: "Ops Candidates", secure: true, requestBody: true },
  { method: "delete", path: "/ops/candidates/:id/educations/:educationId", summary: "Delete education", tag: "Ops Candidates", secure: true },
  { method: "post", path: "/ops/candidates/:id/language-skills", summary: "Create language skill", tag: "Ops Candidates", secure: true, requestBody: true, successStatus: "201" },
  { method: "patch", path: "/ops/candidates/:id/language-skills/:languageSkillId", summary: "Update language skill", tag: "Ops Candidates", secure: true, requestBody: true },
  { method: "delete", path: "/ops/candidates/:id/language-skills/:languageSkillId", summary: "Delete language skill", tag: "Ops Candidates", secure: true },
  { method: "post", path: "/ops/candidates/:id/careers", summary: "Create career", tag: "Ops Candidates", secure: true, requestBody: true, successStatus: "201" },
  { method: "patch", path: "/ops/candidates/:id/careers/:careerId", summary: "Update career", tag: "Ops Candidates", secure: true, requestBody: true },
  { method: "delete", path: "/ops/candidates/:id/careers/:careerId", summary: "Delete career", tag: "Ops Candidates", secure: true },
  { method: "post", path: "/ops/candidates/:id/activity-experiences", summary: "Create activity experience", tag: "Ops Candidates", secure: true, requestBody: true, successStatus: "201" },
  { method: "patch", path: "/ops/candidates/:id/activity-experiences/:activityExperienceId", summary: "Update activity experience", tag: "Ops Candidates", secure: true, requestBody: true },
  { method: "delete", path: "/ops/candidates/:id/activity-experiences/:activityExperienceId", summary: "Delete activity experience", tag: "Ops Candidates", secure: true }
];

const genericJsonObjectSchema = {
  type: "object",
  additionalProperties: true
} as const;

const defaultErrorResponses = {
  "400": {
    description: "Bad request",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" }
      }
    }
  },
  "401": {
    description: "Unauthorized",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" }
      }
    }
  },
  "403": {
    description: "Forbidden",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" }
      }
    }
  },
  "404": {
    description: "Not found",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" }
      }
    }
  },
  "500": {
    description: "Internal server error",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" }
      }
    }
  }
} as const;

const generatedPaths = apiDocEndpoints.reduce<Record<string, Record<string, unknown>>>((acc, endpoint) => {
  const openApiPath = endpoint.path.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
  const pathParamNames = [...endpoint.path.matchAll(/:([A-Za-z0-9_]+)/g)].map((match) => match[1]);
  const successStatus = endpoint.successStatus ?? "200";
  const successSchema = endpoint.successSchemaRef
    ? { $ref: endpoint.successSchemaRef }
    : genericJsonObjectSchema;

  const operation: Record<string, unknown> = {
    tags: [endpoint.tag],
    summary: endpoint.summary,
    responses: {
      [successStatus]: {
        description: "Success",
        content: {
          "application/json": {
            schema: successSchema
          }
        }
      },
      ...defaultErrorResponses
    }
  };

  if (endpoint.secure) {
    operation.security = [{ bearerAuth: [] }];
  }
  if (endpoint.requestBody) {
    operation.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: endpoint.requestSchemaRef
            ? { $ref: endpoint.requestSchemaRef }
            : genericJsonObjectSchema
        }
      }
    };
  }
  if (pathParamNames.length > 0) {
    operation.parameters = pathParamNames.map((name) => ({
      name,
      in: "path",
      required: true,
      schema: { type: "string" }
    }));
  }

  if (!acc[openApiPath]) {
    acc[openApiPath] = {};
  }
  acc[openApiPath][endpoint.method] = operation;
  return acc;
}, {});

const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Flip API",
    version: "0.1.0",
    description: "Flip backend API documentation"
  },
  servers: [
    { url: `http://localhost:${port}`, description: "Local development" }
  ],
  tags: [
    { name: "System" },
    { name: "Auth" },
    { name: "Members" },
    { name: "Partner" },
    { name: "Ops Dashboard" },
    { name: "Ops Matching" },
    { name: "Ops Positions" },
    { name: "Ops Candidates" },
    { name: "Ops Partners" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: false },
          code: { type: "string", example: "INVALID_CREDENTIALS" },
          message: { type: "string", example: "invalid request" }
        }
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password", "accountType"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          name: { type: "string", nullable: true, example: "홍길동" },
          phoneNumber: { type: "string", nullable: true, example: "+82-10-1234-5678" },
          accountType: { type: "string", enum: ["GENERAL", "BUSINESS"], example: "GENERAL" },
          role: { type: "string", nullable: true, example: "STUDENT" },
          partnerOrganizationName: { type: "string", nullable: true, example: "Flip Inc." },
          partnerOrganizationIndustry: { type: "string", enum: Object.values(PartnerIndustry), nullable: true, example: "IT" },
          partnerOrganizationCompanySize: {
            type: "string",
            enum: ["SIZE_1_10", "SIZE_UNDER_30", "SIZE_UNDER_50", "SIZE_OVER_100"],
            nullable: true,
            example: "SIZE_UNDER_30"
          },
          locale: { type: "string", enum: SUPPORTED_EMAIL_LOCALES, nullable: true, example: "ko" },
          password: { type: "string", minLength: 8, example: "password123" }
        }
      },
      BusinessEmailSendVerificationRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "partner@company.com" },
          locale: { type: "string", enum: SUPPORTED_EMAIL_LOCALES, nullable: true, example: "ko" }
        }
      },
      BusinessEmailVerifyRequest: {
        type: "object",
        required: ["email", "code"],
        properties: {
          email: { type: "string", format: "email", example: "partner@company.com" },
          code: { type: "string", minLength: 6, maxLength: 6, example: "123456" }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", minLength: 8, example: "password123" }
        }
      },
      RefreshTokenRequest: {
        type: "object",
        properties: {
          refreshToken: { type: "string", example: "eyJhbGciOi..." }
        }
      },
      EmailVerificationRequest: {
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string", example: "0a1b2c..." }
        }
      },
      ResendVerificationRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          locale: { type: "string", enum: SUPPORTED_EMAIL_LOCALES, nullable: true, example: "ko" }
        }
      },
      AuthSuccessResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: true },
          token: { type: "string", example: "eyJhbGciOi..." },
          accessToken: { type: "string", example: "eyJhbGciOi..." },
          user: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              email: { type: "string", format: "email" },
              role: { type: "string" }
            }
          }
        }
      },
      GenericObjectResponse: {
        type: "object",
        additionalProperties: true
      }
    }
  },
  paths: generatedPaths
} as const;

app.get("/openapi.json", (_req, res) => {
  return res.json(openApiDocument);
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

const memberRoleEnum = z.nativeEnum(MemberRole);
const partnerTypeEnum = z.nativeEnum(PartnerType);
const partnerIndustryEnum = z.nativeEnum(PartnerIndustry);
const partnerCompanySizeEnum = z.enum(["SIZE_1_10", "SIZE_UNDER_30", "SIZE_UNDER_50", "SIZE_OVER_100"]);
const partnerOrgUserRoleEnum = z.nativeEnum(PartnerOrgUserRole);
const positionStatusEnum = z.nativeEnum(PositionStatus);
const positionWorkTypeEnum = z.enum(["On-site", "Hybrid", "Remote"]);
const candidateVisaTypeEnum = z.nativeEnum(CandidateVisaType);
const candidateEducationTypeEnum = z.nativeEnum(CandidateEducationType);
const candidateEducationStatusEnum = z.nativeEnum(CandidateEducationStatus);
const candidateLanguageTypeEnum = z.nativeEnum(CandidateLanguageType);
const candidateLanguageLevelEnum = z.nativeEnum(CandidateLanguageLevel);
const candidateActivityTypeEnum = z.nativeEnum(CandidateActivityType);
const candidateProgramDurationEnum = z.enum([
  "WEEKS_6",
  "WEEKS_8",
  "WEEKS_10",
  "WEEKS_12",
  "WEEKS_14",
  "WEEKS_16",
  "NEGOTIABLE"
]);
const candidateProgramStartOptionEnum = z.enum(["ASAP", "SPECIFIC_DATE"]);
const candidatePreferredJobRoleEnum = z.enum([
  "SOFTWARE_DEVELOPMENT",
  "FRONTEND_DEVELOPMENT",
  "BACKEND_DEVELOPMENT",
  "DATA_ANALYSIS_SCIENCE",
  "UI_UX_DESIGN",
  "PRODUCT_MANAGER",
  "MARKETING",
  "SALES",
  "HR",
  "FINANCE_ACCOUNTING",
  "OPERATIONS_PLANNING",
  "OTHER"
]);

const baseMemberShape = {
  email: z.string().email(),
  realName: z.string().trim().min(1).max(120).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  phoneNumber: z.string().trim().max(30).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  role: memberRoleEnum.optional(),
  accountType: z.enum(["GENERAL", "BUSINESS"]).optional(),
  partnerType: partnerTypeEnum.optional(),
  partnerOrgRole: partnerOrgUserRoleEnum.optional(),
  partnerOrganizationName: z.string().trim().min(1).max(200).optional(),
  partnerOrganizationIndustry: partnerIndustryEnum.optional(),
  partnerOrganizationCompanySize: partnerCompanySizeEnum.optional()
};

function withPartnerValidation<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((value: z.infer<typeof schema>, ctx) => {
    const data = value as {
      role?: MemberRole;
      accountType?: "GENERAL" | "BUSINESS";
      partnerType?: PartnerType;
      partnerOrgRole?: PartnerOrgUserRole;
      email?: string;
      partnerOrganizationName?: string;
      partnerOrganizationIndustry?: PartnerIndustry;
      partnerOrganizationCompanySize?: z.infer<typeof partnerCompanySizeEnum>;
    };
    const resolvedRole = data.role ?? (data.accountType === "BUSINESS" ? MemberRole.PARTNER : MemberRole.STUDENT);

    if (data.accountType === "BUSINESS" && data.email && !isBusinessEmail(data.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "business account requires a company email"
      });
    }

    if (resolvedRole !== MemberRole.PARTNER && data.partnerType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["partnerType"],
        message: "partnerType is only allowed when role is PARTNER"
      });
    }

    if (resolvedRole !== MemberRole.PARTNER && data.partnerOrgRole) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["partnerOrgRole"],
        message: "partnerOrgRole is only allowed when role is PARTNER"
      });
    }

    if (resolvedRole === MemberRole.PARTNER) {
      if (!data.partnerOrganizationName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["partnerOrganizationName"],
          message: "partner organization name is required for business account"
        });
      }
      if (!data.partnerOrganizationIndustry) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["partnerOrganizationIndustry"],
          message: "partner organization industry is required for business account"
        });
      }
      if (!data.partnerOrganizationCompanySize) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["partnerOrganizationCompanySize"],
          message: "partner organization company size is required for business account"
        });
      }
    }
  });
}

const registerSchema = withPartnerValidation(
  z.object({
    ...baseMemberShape,
    locale: z.enum(SUPPORTED_EMAIL_LOCALES).optional(),
    password: z.string().min(8).max(72)
  })
);

const businessEmailSendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  locale: z.enum(SUPPORTED_EMAIL_LOCALES).optional()
});

const businessEmailVerifySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().regex(/^\d{6}$/, "invalid verification code")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72)
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20).max(4000)
});
const emailVerificationSchema = z.object({
  token: z.string().trim().min(32).max(512)
});
const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  locale: z.enum(SUPPORTED_EMAIL_LOCALES).optional()
});

const createMemberSchema = withPartnerValidation(
  z.object({
    ...baseMemberShape,
    role: memberRoleEnum,
    password: z.string().min(8).max(72)
  })
);
const createPartnerOrganizationSchema = z.object({
  partnerType: partnerTypeEnum,
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "invalid domain format"),
  name: z.string().trim().min(1).max(200),
  companySize: partnerCompanySizeEnum.optional(),
  officeAddress: z.string().trim().max(300).optional(),
  website: z.string().trim().url().max(240).optional(),
  socialMedia: z.string().trim().max(240).optional(),
  industry: partnerIndustryEnum,
  description: z.string().trim().max(2000).optional(),
  strengths: z.string().trim().max(2000).optional(),
  adminMemo: z.string().trim().max(4000).optional(),
  businessRegistrationDocumentData: z.string().trim().max(4_000_000).optional(),
  fourInsuranceSubscriberListData: z.string().trim().max(4_000_000).optional(),
  companyLogoImageData: z.string().trim().max(4_000_000).optional(),
  officePhotoImageData: z.string().trim().max(4_000_000).optional()
});

const listPartnerOrganizationsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  sortBy: z.enum(["name", "domain", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().refine((v) => [20, 40, 100].includes(v), "pageSize must be one of 20,40,100").optional()
});
const listPartnerUsersQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .max(120)
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "invalid domain format")
    .optional(),
  sortBy: z.enum(["email", "name", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().refine((v) => [20, 40, 100].includes(v), "pageSize must be one of 20,40,100").optional()
});

const updatePartnerOrganizationSchema = z.object({
  partnerType: partnerTypeEnum,
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "invalid domain format"),
  name: z.string().trim().min(1).max(200),
  companySize: partnerCompanySizeEnum.optional(),
  officeAddress: z.string().trim().max(300).optional(),
  website: z.string().trim().url().max(240).optional(),
  socialMedia: z.string().trim().max(240).optional(),
  industry: partnerIndustryEnum,
  description: z.string().trim().max(2000).optional(),
  strengths: z.string().trim().max(2000).optional(),
  adminMemo: z.string().trim().max(4000).optional(),
  businessRegistrationDocumentData: z.string().trim().max(4_000_000).nullable().optional(),
  fourInsuranceSubscriberListData: z.string().trim().max(4_000_000).nullable().optional(),
  companyLogoImageData: z.string().trim().max(4_000_000).nullable().optional(),
  officePhotoImageData: z.string().trim().max(4_000_000).nullable().optional()
});

const createPartnerMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  realName: z.string().trim().min(1).max(120).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  phoneNumber: z.string().trim().max(30).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  partnerOrgRole: partnerOrgUserRoleEnum.default(PartnerOrgUserRole.MEMBER),
  locale: z.enum(SUPPORTED_EMAIL_LOCALES).optional(),
  password: z.string().min(8).max(72).optional()
});

const updatePartnerUserAdminMemoSchema = z.object({
  adminMemo: z.string().trim().max(4000).optional()
});

const createCandidateSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  realName: z.string().trim().min(1).max(120).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  phoneNumber: z.string().trim().max(30).optional(),
  nationality: z.string().trim().max(120).optional(),
  affiliation: z.string().trim().max(240).optional(),
  birthDate: z.string().datetime().optional(),
  gender: z.string().trim().max(40).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  password: z.string().min(8).max(72).optional()
});

const updateCandidateSchema = z.object({
  realName: z.string().trim().min(1).max(120).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  phoneNumber: z.string().trim().max(30).optional(),
  nationality: z.string().trim().max(120).optional(),
  affiliation: z.string().trim().max(240).optional(),
  birthDate: z.string().datetime().optional(),
  gender: z.string().trim().max(40).optional(),
  jobTitle: z.string().trim().max(120).optional()
});

const updateMyBasicInfoSchema = z.object({
  realName: z.string().trim().min(1).max(120).nullable().optional(),
  name: z.string().trim().min(1).max(120).optional(),
  phoneNumber: z.string().trim().max(30).nullable().optional(),
  birthDate: z.string().datetime().nullable().optional(),
  gender: z.string().trim().max(40).nullable().optional()
});

const updateMyPartnerOrganizationBasicSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  industry: partnerIndustryEnum.optional(),
  website: z.string().trim().url().max(240).nullable().optional(),
  officeAddress: z.string().trim().max(300).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  businessRegistrationDocumentData: z.string().trim().max(4_000_000).nullable().optional(),
  fourInsuranceSubscriberListData: z.string().trim().max(4_000_000).nullable().optional(),
  companyLogoImageData: z.string().trim().max(4_000_000).nullable().optional(),
  officePhotoImageData: z.string().trim().max(4_000_000).nullable().optional()
});

const updateCandidateProfileSchema = z.object({
  workPermit: z.boolean().nullable().optional(),
  visaType: candidateVisaTypeEnum.nullable().optional(),
  visaExpiryDate: z.string().datetime().nullable().optional(),
  livesInKorea: z.boolean().nullable().optional(),
  hasAccommodation: z.boolean().nullable().optional(),
  residenceProvince: z.string().trim().max(120).nullable().optional(),
  residenceDistrict: z.string().trim().max(120).nullable().optional(),
  residenceAddress: z.string().trim().max(240).nullable().optional(),
  preferredProgramDuration: candidateProgramDurationEnum.nullable().optional(),
  programStartOption: candidateProgramStartOptionEnum.nullable().optional(),
  programStartDate: z.string().datetime().nullable().optional(),
  preferredIndustries: z.array(partnerIndustryEnum).max(50).optional(),
  preferredJobRoles: z.array(candidatePreferredJobRoleEnum).max(50).optional(),
  skills: z.array(z.string().trim().min(1).max(120)).max(100).optional(),
  selfIntroduction: z.string().trim().max(4000).nullable().optional(),
  programMotivation: z.string().trim().max(4000).nullable().optional(),
  preferenceConditionNote: z.string().trim().max(4000).nullable().optional(),
  capabilityNote: z.string().trim().max(4000).nullable().optional(),
  additionalInfoNote: z.string().trim().max(4000).nullable().optional(),
  emergencyContactName: z.string().trim().max(120).nullable().optional(),
  emergencyContactRelation: z.string().trim().max(120).nullable().optional(),
  emergencyContactPhone: z.string().trim().max(40).nullable().optional(),
  emergencyContactEmail: z.string().trim().email().max(200).nullable().optional(),
  emergencyContactAddress: z.string().trim().max(400).nullable().optional(),
  matchingResultNote: z.string().trim().max(4000).nullable().optional()
});

const createCandidateEducationSchema = z.object({
  schoolName: z.string().trim().min(1).max(200),
  educationType: candidateEducationTypeEnum,
  major: z.string().trim().max(200).nullable().optional(),
  status: candidateEducationStatusEnum,
  country: z.string().trim().max(120).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  isKoreanSchool: z.boolean().nullable().optional()
});

const createCandidateLanguageSkillSchema = z.object({
  language: candidateLanguageTypeEnum,
  level: candidateLanguageLevelEnum,
  testName: z.string().trim().max(120).nullable().optional(),
  score: z.string().trim().max(120).nullable().optional()
});

const createCandidateCareerSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  position: z.string().trim().min(1).max(200),
  department: z.string().trim().max(200).nullable().optional(),
  isCurrent: z.boolean().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional()
});

const createCandidateActivityExperienceSchema = z.object({
  title: z.string().trim().min(1).max(200),
  activityType: candidateActivityTypeEnum,
  organization: z.string().trim().max(200).nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(120)).max(50).optional()
});

const updateCandidateEmailVerifiedSchema = z.object({
  emailVerified: z.boolean()
});

const lineArraySchema = z.array(z.string().trim().min(1).max(200)).max(200).optional();

const createPositionSchema = z.object({
  partnerOrganizationId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  status: positionStatusEnum.optional(),
  workType: positionWorkTypeEnum.optional(),
  thumbnailImages: z.array(z.string().trim().min(1).max(5_000_000)).max(5).optional(),
  eligibleVisas: z.array(z.string().trim().min(1).max(20)).max(20).optional(),
  matchingParticipants: lineArraySchema,
  postingProgressLogs: lineArraySchema,
  preferredNationalities: lineArraySchema,
  communicationLanguages: lineArraySchema,
  hiringProcess: z.string().trim().max(2000).optional(),
  preferredJobRole: z.string().trim().max(120).optional(),
  hiringCount: z.coerce.number().int().min(1).max(999).optional(),
  workingHours: z.string().trim().max(240).optional(),
  workLocation: z.string().trim().max(240).optional(),
  startDate: z.string().datetime().nullable().optional(),
  mainResponsibilities: z.string().trim().max(4000).optional(),
  requiredQualifications: z.string().trim().max(4000).optional(),
  preferredQualifications: z.string().trim().max(4000).optional(),
  dressCode: z.string().trim().max(240).optional(),
  wantsPreTraining: z.boolean().optional(),
  additionalNotes: z.string().trim().max(4000).optional(),
  adminMemo: z.string().trim().max(4000).optional()
});

const createPartnerPositionSchema = createPositionSchema
  .omit({
    partnerOrganizationId: true,
    matchingParticipants: true,
    postingProgressLogs: true,
    adminMemo: true
  })
  .extend({
    status: z.enum(["DRAFT", "OPEN"]).optional()
  });
const updatePartnerPositionSchema = createPartnerPositionSchema.partial();

const updatePositionSchema = createPositionSchema.partial();
const updatePositionPremiumBannerSchema = z.object({
  enabled: z.boolean(),
  bannerImageUrl: z.string().trim().max(5_000_000).nullable().optional(),
  bannerTitle: z.string().trim().max(120).nullable().optional(),
  bannerSubtitle: z.string().trim().max(200).nullable().optional(),
  priority: z.coerce.number().int().min(0).max(9_999).nullable().optional()
});

const updatePositionStatusSchema = z.object({
  status: positionStatusEnum,
  note: z.string().trim().max(500).optional()
});

const addPositionParticipantSchema = z.object({
  name: z.string().trim().min(1).max(120),
  note: z.string().trim().max(500).optional()
});

const addPositionProgressLogSchema = z.object({
  message: z.string().trim().min(1).max(1000)
});

const listPositionsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: positionStatusEnum.optional(),
  partnerOrganizationId: z.string().uuid().optional(),
  partnerIndustry: z.nativeEnum(PartnerIndustry).optional(),
  partnerCompanySize: partnerCompanySizeEnum.optional(),
  sortBy: z.enum(["title", "status", "hiringCount", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().refine((v) => [20, 40, 100].includes(v), "pageSize must be one of 20,40,100").optional()
});
const listPublicPositionsCursorQuerySchema = z.object({
  cursor: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});
const listCommunityPostsCursorQuerySchema = z.object({
  category: z.enum(["free", "career", "help"]).optional(),
  sortBy: z.enum(["latest", "popular"]).optional(),
  search: z.string().trim().max(120).optional(),
  cursor: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});
const createCommunityPostSchema = z.object({
  category: z.enum(["free", "career", "help"]),
  body: z.string().trim().min(1).max(5_000),
  imageUrls: z.array(z.string().trim().min(1).max(5_000_000)).max(5).optional()
});
const updateCommunityPostSchema = z.object({
  category: z.enum(["free", "career", "help"]).optional(),
  body: z.string().trim().min(1).max(5_000).optional(),
  imageUrls: z.array(z.string().trim().min(1).max(5_000_000)).max(5).optional()
});
const communityPostParamSchema = z.object({
  postId: z.string().uuid()
});
const createCommunityCommentSchema = z.object({
  body: z.string().trim().min(1).max(2_000)
});
const translateCommunityPostSchema = z.object({
  text: z.string().trim().min(1).max(10_000),
  targetLanguage: z.enum(["ko", "en"]),
  sourceLanguageHint: z.string().trim().max(40).optional()
});
const memberPositionActionParamSchema = z.object({
  positionId: z.string().uuid()
});

const runMatchingSchema = z
  .object({
    mode: z.enum(["position_to_candidates", "candidate_to_positions"]),
    positionId: z.string().uuid().optional(),
    candidateId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(30).optional()
  })
  .superRefine((value, ctx) => {
    if (value.mode === "position_to_candidates" && !value.positionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["positionId"],
        message: "positionId is required for position_to_candidates mode"
      });
    }
    if (value.mode === "candidate_to_positions" && !value.candidateId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["candidateId"],
        message: "candidateId is required for candidate_to_positions mode"
      });
    }
  });

const listMatchingHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional()
});

const syncCandidateUsersSchema = z.object({
  participants: z
    .array(
      z.object({
        email: z.string().trim().toLowerCase().email(),
        fullName: z.string().trim().min(1).max(120).nullable().optional(),
        nationality: z.string().trim().max(120).nullable().optional(),
        affiliation: z.string().trim().max(240).nullable().optional(),
        registrationSource: z.string().trim().max(240).nullable().optional(),
        source: z.string().trim().max(240).nullable().optional(),
        birthDate: z.string().datetime().nullable().optional(),
        gender: z.string().trim().max(40).nullable().optional()
      })
    )
    .max(5000)
});

type CommunityCategory = "free" | "career" | "help";

function toCommunityPostCategory(category: CommunityCategory): CommunityPostCategory {
  if (category === "career") return CommunityPostCategory.CAREER;
  if (category === "help") return CommunityPostCategory.HELP;
  return CommunityPostCategory.FREE;
}

function fromCommunityPostCategory(category: CommunityPostCategory): CommunityCategory {
  if (category === CommunityPostCategory.CAREER) return "career";
  if (category === CommunityPostCategory.HELP) return "help";
  return "free";
}

function toSafeUser(user: {
  id: string;
  email: string;
  emailVerified: boolean;
  realName?: string | null;
  name: string | null;
  phoneNumber: string | null;
  nationality: string | null;
  affiliation: string | null;
  birthDate: Date | null;
  gender: string | null;
  jobTitle: string | null;
  adminMemo: string | null;
  role: MemberRole;
  partnerType: PartnerType | null;
  partnerOrgRole: PartnerOrgUserRole | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    realName: user.realName ?? null,
    name: user.name,
    phoneNumber: user.phoneNumber,
    nationality: user.nationality,
    affiliation: user.affiliation,
    birthDate: user.birthDate,
    gender: user.gender,
    jobTitle: user.jobTitle,
    adminMemo: user.adminMemo ?? null,
    role: user.role,
    partnerType: user.partnerType,
    partnerOrgRole: user.partnerOrgRole,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function toCandidateProfile(
  profile:
    | {
        id: string;
        userId: string;
        workPermit: boolean | null;
        visaType: CandidateVisaType | null;
        visaExpiryDate: Date | null;
        livesInKorea: boolean | null;
        hasAccommodation: boolean | null;
        residenceProvince: string | null;
        residenceDistrict: string | null;
        residenceAddress: string | null;
        preferredProgramDuration?: "WEEKS_6" | "WEEKS_8" | "WEEKS_10" | "WEEKS_12" | "WEEKS_14" | "WEEKS_16" | "NEGOTIABLE" | null;
        programStartOption?: "ASAP" | "SPECIFIC_DATE" | null;
        programStartDate?: Date | null;
        preferredIndustries?: PartnerIndustry[];
        preferredJobRoles?: Array<
          | "SOFTWARE_DEVELOPMENT"
          | "FRONTEND_DEVELOPMENT"
          | "BACKEND_DEVELOPMENT"
          | "DATA_ANALYSIS_SCIENCE"
          | "UI_UX_DESIGN"
          | "PRODUCT_MANAGER"
          | "MARKETING"
          | "SALES"
          | "HR"
          | "FINANCE_ACCOUNTING"
          | "OPERATIONS_PLANNING"
          | "OTHER"
        >;
        favoritePositionIds?: string[];
        appliedPositionIds?: string[];
        skills?: string[];
        selfIntroduction?: string | null;
        programMotivation?: string | null;
        preferenceConditionNote?: string | null;
        capabilityNote?: string | null;
        additionalInfoNote?: string | null;
        emergencyContactName?: string | null;
        emergencyContactRelation?: string | null;
        emergencyContactPhone?: string | null;
        emergencyContactEmail?: string | null;
        emergencyContactAddress?: string | null;
        matchingResultNote?: string | null;
        educations?: Array<{
          id: string;
          schoolName: string;
          educationType: CandidateEducationType;
          major: string | null;
          status: CandidateEducationStatus;
          country: string | null;
          city: string | null;
          startDate: Date | null;
          endDate: Date | null;
          isKoreanSchool: boolean | null;
          createdAt: Date;
          updatedAt: Date;
        }>;
        languageSkills?: Array<{
          id: string;
          language: CandidateLanguageType;
          level: CandidateLanguageLevel;
          testName: string | null;
          score: string | null;
          createdAt: Date;
          updatedAt: Date;
        }>;
        careers?: Array<{
          id: string;
          companyName: string;
          position: string;
          department: string | null;
          isCurrent: boolean;
          startDate: Date | null;
          endDate: Date | null;
          description: string | null;
          createdAt: Date;
          updatedAt: Date;
        }>;
        activityExperiences?: Array<{
          id: string;
          title: string;
          activityType: CandidateActivityType;
          organization: string | null;
          startDate: Date | null;
          endDate: Date | null;
          description: string | null;
          skills: string[];
          createdAt: Date;
          updatedAt: Date;
        }>;
        createdAt: Date;
        updatedAt: Date;
      }
    | null
) {
  if (!profile) {
    return {
      id: null,
      userId: null,
      workPermit: null,
      visaType: null,
      visaExpiryDate: null,
      livesInKorea: null,
      hasAccommodation: null,
      residenceProvince: null,
      residenceDistrict: null,
      residenceAddress: null,
      preferredProgramDuration: null,
      programStartOption: null,
      programStartDate: null,
      preferredIndustries: [],
      preferredJobRoles: [],
      favoritePositionIds: [],
      appliedPositionIds: [],
      skills: [],
      selfIntroduction: null,
      programMotivation: null,
      preferenceConditionNote: null,
      capabilityNote: null,
      additionalInfoNote: null,
      emergencyContactName: null,
      emergencyContactRelation: null,
      emergencyContactPhone: null,
      emergencyContactEmail: null,
      emergencyContactAddress: null,
      matchingResultNote: null,
      educations: [],
      languageSkills: [],
      careers: [],
      activityExperiences: [],
      createdAt: null,
      updatedAt: null
    };
  }

  return {
    id: profile.id,
    userId: profile.userId,
    workPermit: profile.workPermit,
    visaType: profile.visaType,
    visaExpiryDate: profile.visaExpiryDate,
    livesInKorea: profile.livesInKorea,
    hasAccommodation: profile.hasAccommodation,
    residenceProvince: profile.residenceProvince,
    residenceDistrict: profile.residenceDistrict,
    residenceAddress: profile.residenceAddress,
    preferredProgramDuration: profile.preferredProgramDuration ?? null,
    programStartOption: profile.programStartOption ?? null,
    programStartDate: profile.programStartDate ?? null,
    preferredIndustries: profile.preferredIndustries ?? [],
    preferredJobRoles: profile.preferredJobRoles ?? [],
    favoritePositionIds: profile.favoritePositionIds ?? [],
    appliedPositionIds: profile.appliedPositionIds ?? [],
    skills: profile.skills ?? [],
    selfIntroduction: profile.selfIntroduction ?? null,
    programMotivation: profile.programMotivation ?? null,
    preferenceConditionNote: profile.preferenceConditionNote ?? null,
    capabilityNote: profile.capabilityNote ?? null,
    additionalInfoNote: profile.additionalInfoNote ?? null,
    emergencyContactName: profile.emergencyContactName ?? null,
    emergencyContactRelation: profile.emergencyContactRelation ?? null,
    emergencyContactPhone: profile.emergencyContactPhone ?? null,
    emergencyContactEmail: profile.emergencyContactEmail ?? null,
    emergencyContactAddress: profile.emergencyContactAddress ?? null,
    matchingResultNote: profile.matchingResultNote ?? null,
    educations: (profile.educations ?? []).map((item) => ({
      id: item.id,
      schoolName: item.schoolName,
      educationType: item.educationType,
      major: item.major,
      status: item.status,
      country: item.country,
      city: item.city,
      startDate: item.startDate,
      endDate: item.endDate,
      isKoreanSchool: item.isKoreanSchool,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    })),
    languageSkills: (profile.languageSkills ?? []).map((item) => ({
      id: item.id,
      language: item.language,
      level: item.level,
      testName: item.testName,
      score: item.score,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    })),
    careers: (profile.careers ?? []).map((item) => ({
      id: item.id,
      companyName: item.companyName,
      position: item.position,
      department: item.department,
      isCurrent: item.isCurrent,
      startDate: item.startDate,
      endDate: item.endDate,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    })),
    activityExperiences: (profile.activityExperiences ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      activityType: item.activityType,
      organization: item.organization,
      startDate: item.startDate,
      endDate: item.endDate,
      description: item.description,
      skills: item.skills,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    })),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}

async function getOrCreateCandidateProfile(userId: string) {
  return prisma.candidateProfile.upsert({
    where: { userId },
    create: { userId },
    update: {}
  });
}

function toPartnerOrganization(item: {
  id: string;
  partnerType: PartnerType;
  domain: string;
  name: string;
  companySize?: string | null;
  officeAddress: string | null;
  website: string | null;
  socialMedia: string | null;
  industry: PartnerIndustry;
  description: string | null;
  strengths: string | null;
  adminMemo?: string | null;
  businessRegistrationDocumentData?: string | null;
  fourInsuranceSubscriberListData?: string | null;
  companyLogoImageData?: string | null;
  officePhotoImageData?: string | null;
  createdAt: Date;
  updatedAt: Date;
  memberCount?: number;
}, options?: { includeVerificationAssets?: boolean }) {
  const verificationAssets = {
    businessRegistrationDocumentData: item.businessRegistrationDocumentData ?? null,
    fourInsuranceSubscriberListData: item.fourInsuranceSubscriberListData ?? null,
    companyLogoImageData: item.companyLogoImageData ?? null,
    officePhotoImageData: item.officePhotoImageData ?? null
  };
  const missingItems = [
    !verificationAssets.businessRegistrationDocumentData ? "BUSINESS_REGISTRATION_DOCUMENT" : null,
    !verificationAssets.fourInsuranceSubscriberListData ? "FOUR_INSURANCE_SUBSCRIBER_LIST" : null,
    !verificationAssets.companyLogoImageData ? "COMPANY_LOGO_IMAGE" : null,
    !verificationAssets.officePhotoImageData ? "OFFICE_PHOTO_IMAGE" : null
  ].filter((itemName): itemName is string => Boolean(itemName));
  const uploadedCount = 4 - missingItems.length;
  const isVerified = missingItems.length === 0;

  return {
    id: item.id,
    partnerType: item.partnerType,
    domain: item.domain,
    name: item.name,
    companySize: item.companySize ?? null,
    officeAddress: item.officeAddress,
    website: item.website,
    socialMedia: item.socialMedia,
    industry: item.industry,
    description: item.description,
    strengths: item.strengths,
    adminMemo: item.adminMemo ?? null,
    memberCount: item.memberCount ?? 0,
    verification: {
      isVerified,
      uploadedCount,
      requiredCount: 4,
      missingItems
    },
    permissions: {
      canPostPositions: isVerified,
      canContactCandidates: isVerified
    },
    ...(options?.includeVerificationAssets ? verificationAssets : {}),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function normalizeStringArray(value?: string[]) {
  if (!value) return [];
  return value.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}

type PositionPremiumBannerMeta = {
  enabled: boolean;
  bannerImageUrl: string | null;
  bannerTitle: string | null;
  bannerSubtitle: string | null;
  priority: number | null;
};

const PREMIUM_BANNER_MEMO_PREFIX = "[[PREMIUM_BANNER]]";

function normalizePremiumBannerMeta(value: unknown): PositionPremiumBannerMeta | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const enabled = raw.enabled === true;
  const bannerImageUrl = typeof raw.bannerImageUrl === "string" && raw.bannerImageUrl.trim()
    ? raw.bannerImageUrl.trim()
    : null;
  const bannerTitle = typeof raw.bannerTitle === "string" && raw.bannerTitle.trim()
    ? raw.bannerTitle.trim()
    : null;
  const bannerSubtitle = typeof raw.bannerSubtitle === "string" && raw.bannerSubtitle.trim()
    ? raw.bannerSubtitle.trim()
    : null;
  const priority = typeof raw.priority === "number" && Number.isFinite(raw.priority)
    ? Math.max(0, Math.min(9_999, Math.floor(raw.priority)))
    : null;
  return { enabled, bannerImageUrl, bannerTitle, bannerSubtitle, priority };
}

function extractPremiumBannerMeta(adminMemo: string | null | undefined): PositionPremiumBannerMeta | null {
  if (!adminMemo?.trim()) return null;
  const line = adminMemo
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(PREMIUM_BANNER_MEMO_PREFIX));
  if (!line) return null;
  const jsonText = line.slice(PREMIUM_BANNER_MEMO_PREFIX.length).trim();
  if (!jsonText) return null;
  try {
    return normalizePremiumBannerMeta(JSON.parse(jsonText));
  } catch {
    return null;
  }
}

function stripPremiumBannerMeta(adminMemo: string | null | undefined) {
  if (!adminMemo?.trim()) return null;
  const plain = adminMemo
    .split("\n")
    .filter((entry) => !entry.trim().startsWith(PREMIUM_BANNER_MEMO_PREFIX))
    .join("\n")
    .trim();
  return plain.length > 0 ? plain : null;
}

function mergePremiumBannerMeta(adminMemo: string | null | undefined, meta: PositionPremiumBannerMeta | null) {
  const plain = stripPremiumBannerMeta(adminMemo);
  if (!meta) return plain;
  const payload = JSON.stringify({
    enabled: meta.enabled,
    bannerImageUrl: meta.bannerImageUrl,
    bannerTitle: meta.bannerTitle,
    bannerSubtitle: meta.bannerSubtitle,
    priority: meta.priority
  });
  const premiumLine = `${PREMIUM_BANNER_MEMO_PREFIX} ${payload}`;
  if (!plain) return premiumLine;
  return `${plain}\n${premiumLine}`.trim();
}

function toPosition(item: {
  id: string;
  partnerOrganizationId: string | null;
  title: string;
  status: PositionStatus;
  workType: string | null;
  thumbnailImages: string[];
  eligibleVisas: string[];
  preferredNationalities: string[];
  communicationLanguages: string[];
  hiringProcess: string | null;
  preferredJobRole: string | null;
  hiringCount: number | null;
  workingHours: string | null;
  workLocation: string | null;
  startDate: Date | null;
  mainResponsibilities: string | null;
  requiredQualifications: string | null;
  preferredQualifications: string | null;
  dressCode: string | null;
  wantsPreTraining: boolean | null;
  additionalNotes: string | null;
  adminMemo: string | null;
  createdAt: Date;
  updatedAt: Date;
  matchingParticipants?: Array<{
    id: string;
    name: string;
    note: string | null;
    createdAt: Date;
    createdBy: { id: string; name: string | null; email: string } | null;
  }>;
  progressLogs?: Array<{
    id: string;
    message: string;
    createdAt: Date;
    createdBy: { id: string; name: string | null; email: string } | null;
  }>;
  statusHistories?: Array<{
    id: string;
    fromStatus: PositionStatus | null;
    toStatus: PositionStatus;
    note: string | null;
    createdAt: Date;
    createdBy: { id: string; name: string | null; email: string } | null;
  }>;
  partnerOrganization?: {
    id: string;
    name: string;
    domain: string;
  } | null;
}) {
  return {
    id: item.id,
    partnerOrganizationId: item.partnerOrganizationId,
    title: item.title,
    status: item.status,
    workType: item.workType,
    thumbnailImages: item.thumbnailImages,
    eligibleVisas: item.eligibleVisas,
    preferredNationalities: item.preferredNationalities,
    communicationLanguages: item.communicationLanguages,
    hiringProcess: item.hiringProcess,
    preferredJobRole: item.preferredJobRole,
    hiringCount: item.hiringCount,
    workingHours: item.workingHours,
    workLocation: item.workLocation,
    startDate: item.startDate,
    mainResponsibilities: item.mainResponsibilities,
    requiredQualifications: item.requiredQualifications,
    preferredQualifications: item.preferredQualifications,
    dressCode: item.dressCode,
    wantsPreTraining: item.wantsPreTraining,
    additionalNotes: item.additionalNotes,
    adminMemo: stripPremiumBannerMeta(item.adminMemo),
    premiumBanner: extractPremiumBannerMeta(item.adminMemo),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    matchingParticipants: (item.matchingParticipants ?? []).map((participant) => ({
      id: participant.id,
      name: participant.name,
      note: participant.note,
      createdAt: participant.createdAt,
      createdBy: participant.createdBy
    })),
    postingProgressLogs: (item.progressLogs ?? []).map((log) => ({
      id: log.id,
      message: log.message,
      createdAt: log.createdAt,
      createdBy: log.createdBy
    })),
    statusHistories: (item.statusHistories ?? []).map((history) => ({
      id: history.id,
      fromStatus: history.fromStatus,
      toStatus: history.toStatus,
      note: history.note,
      createdAt: history.createdAt,
      createdBy: history.createdBy
    })),
    partnerOrganization: item.partnerOrganization ?? null
  };
}

function extractDomainFromEmail(email: string) {
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

async function resolvePublicViewer(req: express.Request): Promise<{ role: MemberRole; partnerDomain: string | null } | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const payload = verifyAccessToken(header.slice("Bearer ".length));
  if (!payload) return null;

  if (payload.role !== MemberRole.PARTNER) {
    return { role: payload.role, partnerDomain: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { email: true }
  });
  const partnerDomain = user ? extractDomainFromEmail(user.email) : null;
  return { role: payload.role, partnerDomain };
}

function resolvePublicViewerUserId(req: express.Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const payload = verifyAccessToken(header.slice("Bearer ".length));
  if (!payload?.sub) return null;
  return payload.sub;
}

function maskAdditionalNotesForPublic(
  additionalNotes: string | null,
  orgDomain: string | null | undefined,
  viewer: { role: MemberRole; partnerDomain: string | null } | null
) {
  if (!additionalNotes) return null;
  if (!viewer) return null;
  if (viewer.role === MemberRole.OPERATOR) return additionalNotes;
  if (viewer.role === MemberRole.PARTNER && viewer.partnerDomain && orgDomain?.toLowerCase() === viewer.partnerDomain) {
    return additionalNotes;
  }
  return null;
}

function toPublicPositionItem(
  item: {
    id: string;
    title: string;
    status: PositionStatus;
    workType: string | null;
    thumbnailImages: string[];
    eligibleVisas: string[];
    preferredNationalities: string[];
    communicationLanguages: string[];
    hiringProcess: string | null;
    preferredJobRole: string | null;
    hiringCount: number | null;
    workingHours: string | null;
    workLocation: string | null;
    startDate: Date | null;
    mainResponsibilities: string | null;
    requiredQualifications: string | null;
    preferredQualifications: string | null;
    dressCode: string | null;
    wantsPreTraining: boolean | null;
    additionalNotes: string | null;
    createdAt: Date;
    updatedAt: Date;
    partnerOrganization?: {
      id: string;
      name: string;
      domain: string;
      industry: PartnerIndustry;
      companySize: string | null;
      officeAddress: string | null;
    } | null;
    matchingParticipants: Array<{ id: string }>;
  },
  viewer: { role: MemberRole; partnerDomain: string | null } | null
) {
  return {
    id: item.id,
    title: item.title,
    status: item.status,
    workType: item.workType,
    thumbnailImages: item.thumbnailImages,
    eligibleVisas: item.eligibleVisas,
    preferredNationalities: item.preferredNationalities,
    communicationLanguages: item.communicationLanguages,
    hiringProcess: item.hiringProcess,
    preferredJobRole: item.preferredJobRole,
    hiringCount: item.hiringCount,
    workingHours: item.workingHours,
    workLocation: item.workLocation,
    startDate: item.startDate,
    mainResponsibilities: item.mainResponsibilities,
    requiredQualifications: item.requiredQualifications,
    preferredQualifications: item.preferredQualifications,
    dressCode: item.dressCode,
    wantsPreTraining: item.wantsPreTraining,
    additionalNotes: maskAdditionalNotesForPublic(item.additionalNotes, item.partnerOrganization?.domain, viewer),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    matchingParticipantsCount: item.matchingParticipants.length,
    partnerOrganization: item.partnerOrganization ?? null
  };
}

async function resolvePartnerAffiliation(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      partnerType: true,
      partnerOrgRole: true
    }
  });

  if (!user) return null;

  const domain = extractDomainFromEmail(user.email);
  if (!domain) {
    return { user, domain: null, organization: null as null };
  }

  const organization = await prisma.partnerOrganization.findUnique({
    where: { domain }
  });

  return { user, domain, organization };
}

function createTemporaryPassword() {
  return `Cb!${randomBytes(9).toString("base64url")}`;
}

type MatchingPosition = {
  id: string;
  title: string;
  status: PositionStatus;
  preferredNationalities: string[];
  communicationLanguages: string[];
  preferredJobRole: string | null;
  hiringCount: number | null;
  workingHours: string | null;
  requiredQualifications: string | null;
  preferredQualifications: string | null;
  mainResponsibilities: string | null;
  additionalNotes: string | null;
  matchingParticipants: Array<{ id: string }>;
  partnerOrganization: { id: string; name: string; domain: string; industry: PartnerIndustry } | null;
};

type MatchingCandidate = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  phoneNumber: string | null;
  nationality: string | null;
  birthDate: string | null;
  gender: string | null;
  jobTitle: string | null;
  affiliation: string | null;
  adminMemo: string | null;
  profile: {
    workPermit: boolean | null;
    visaType: CandidateVisaType | null;
    visaExpiryDate: string | null;
    livesInKorea: boolean | null;
    hasAccommodation: boolean | null;
    residenceProvince: string | null;
    residenceDistrict: string | null;
    residenceAddress: string | null;
    preferredProgramDuration: "WEEKS_6" | "WEEKS_8" | "WEEKS_10" | "WEEKS_12" | "WEEKS_14" | "WEEKS_16" | "NEGOTIABLE" | null;
    programStartOption: "ASAP" | "SPECIFIC_DATE" | null;
    programStartDate: string | null;
    preferredIndustries: PartnerIndustry[];
    preferredJobRoles: string[];
    skills: string[];
    selfIntroduction: string | null;
    programMotivation: string | null;
    languages: Array<{ language: CandidateLanguageType; level: CandidateLanguageLevel }>;
    educations: Array<{ educationType: CandidateEducationType; major: string | null; status: CandidateEducationStatus }>;
    careers: Array<{ companyName: string; position: string; description: string | null; startDate: string | null; endDate: string | null; isCurrent: boolean }>;
    activities: Array<{
      activityType: CandidateActivityType;
      title: string;
      organization: string | null;
      description: string | null;
      skills: string[];
      startDate: string | null;
      endDate: string | null;
    }>;
    emergencyContactName: string | null;
    emergencyContactRelation: string | null;
    emergencyContactPhone: string | null;
    emergencyContactEmail: string | null;
    emergencyContactAddress: string | null;
  };
};

type RuleMatch<T> = {
  item: T;
  score: number;
  reasons: string[];
  feedback: string[];
};

type MatchingScoreBreakdown = {
  industryFit: number;
  roleFit: number;
  skillFit: number;
  languageFit: number;
  qualificationFit: number;
  timeFit: number;
  penalty: number;
};

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeBreakdown(input: MatchingScoreBreakdown): MatchingScoreBreakdown {
  return {
    industryFit: clamp01(input.industryFit),
    roleFit: clamp01(input.roleFit),
    skillFit: clamp01(input.skillFit),
    languageFit: clamp01(input.languageFit),
    qualificationFit: clamp01(input.qualificationFit),
    timeFit: clamp01(input.timeFit),
    penalty: clamp01(input.penalty)
  };
}

function weightedScoreFromBreakdown(input: MatchingScoreBreakdown) {
  const b = normalizeBreakdown(input);
  const raw =
    (0.3 * b.industryFit +
      0.3 * b.roleFit +
      0.2 * b.skillFit +
      0.1 * b.languageFit +
      0.05 * b.qualificationFit +
      0.05 * b.timeFit -
      0.2 * b.penalty) *
    100;
  return Math.max(1, Math.min(99, Math.round(raw)));
}

function formatBreakdownLine(input: MatchingScoreBreakdown) {
  const b = normalizeBreakdown(input);
  return [
    `세부 점수`,
    `산업 ${Math.round(b.industryFit * 100)}`,
    `직무 ${Math.round(b.roleFit * 100)}`,
    `스킬 ${Math.round(b.skillFit * 100)}`,
    `언어 ${Math.round(b.languageFit * 100)}`,
    `요건 ${Math.round(b.qualificationFit * 100)}`,
    `기간 ${Math.round(b.timeFit * 100)}`,
    `패널티 ${Math.round(b.penalty * 100)}`
  ].join(" · ");
}

function matchingTokenize(value: string | null | undefined) {
  if (!value) return [];
  return value
    .toLowerCase()
    .split(/[\s,/()|_-]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1);
}

function toTokenSet(values: Array<string | null | undefined>) {
  const set = new Set<string>();
  values.forEach((value) => {
    matchingTokenize(value).forEach((token) => set.add(token));
  });
  return set;
}

function overlapRatio(base: Set<string>, target: Set<string>) {
  if (base.size === 0 || target.size === 0) return 0;
  let hit = 0;
  base.forEach((token) => {
    if (target.has(token)) hit += 1;
  });
  return hit / base.size;
}

function normalizeLanguageToken(value: string) {
  const token = value.trim().toLowerCase();
  if (!token) return "";
  if (token.includes("korean") || token.includes("한국")) return "korean";
  if (token.includes("english") || token.includes("영어")) return "english";
  if (token.includes("chinese") || token.includes("중국")) return "chinese";
  if (token.includes("japanese") || token.includes("일본")) return "japanese";
  if (token.includes("vietnam") || token.includes("베트남")) return "vietnamese";
  if (token.includes("indonesia") || token.includes("인도네시아")) return "indonesian";
  if (token.includes("thai") || token.includes("태국")) return "thai";
  if (token.includes("spanish") || token.includes("스페인")) return "spanish";
  if (token.includes("french") || token.includes("프랑스")) return "french";
  if (token.includes("german") || token.includes("독일")) return "german";
  return token;
}

function extractRequiredLanguages(position: MatchingPosition) {
  const set = new Set<string>();
  (position.communicationLanguages ?? []).forEach((language) => {
    const normalized = normalizeLanguageToken(language);
    if (normalized) set.add(normalized);
  });
  return set;
}

function extractCandidateLanguages(candidate: MatchingCandidate) {
  const set = new Set<string>();
  (candidate.profile.languages ?? []).forEach((item) => {
    const normalized = normalizeLanguageToken(String(item.language));
    if (normalized) set.add(normalized);
  });
  return set;
}

function computeIndustryFit(position: MatchingPosition, candidate: MatchingCandidate) {
  const preferred = candidate.profile.preferredIndustries ?? [];
  const companyIndustry = position.partnerOrganization?.industry ?? null;
  if (!companyIndustry) return preferred.length > 0 ? 0.4 : 0.5;
  if (preferred.length === 0) return 0.55;
  if (preferred.includes(companyIndustry)) return 1;
  const preferredTokens = toTokenSet(preferred.map((item) => String(item)));
  const companyTokens = toTokenSet([String(companyIndustry)]);
  const overlap = overlapRatio(preferredTokens, companyTokens);
  if (overlap >= 0.5) return 0.7;
  return 0.2;
}

function parseWeekCount(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  const matchedEnum = normalized.match(/WEEKS_(\d+)/);
  if (matchedEnum) return Number(matchedEnum[1]);
  const matchedText = normalized.match(/(\d+)\s*주/);
  if (matchedText) return Number(matchedText[1]);
  return null;
}

function computeTimeFit(position: MatchingPosition, candidate: MatchingCandidate) {
  const option = candidate.profile.programStartOption;
  const duration = parseWeekCount(candidate.profile.preferredProgramDuration ?? null);
  const workingHoursText = `${position.workingHours ?? ""} ${position.additionalNotes ?? ""}`;
  const positionWeeks = parseWeekCount(workingHoursText);

  let score = 0.5;
  if (option === "ASAP" && (position.status === PositionStatus.OPEN || position.status === PositionStatus.MATCHING)) score += 0.2;
  if (option === "SPECIFIC_DATE" && candidate.profile.programStartDate) score += 0.1;
  if (duration !== null && positionWeeks !== null) {
    const gap = Math.abs(duration - positionWeeks);
    if (gap === 0) score += 0.2;
    else if (gap <= 2) score += 0.1;
    else if (gap >= 6) score -= 0.2;
  }
  return clamp01(score);
}

function detectStrictIndustryOnly(candidate: MatchingCandidate) {
  const text = `${candidate.adminMemo ?? ""} ${candidate.profile.selfIntroduction ?? ""} ${candidate.profile.programMotivation ?? ""}`.toLowerCase();
  const hasOnlySignal = text.includes("만") || text.includes("only") || text.includes("필수") || text.includes("must");
  const industryKeywords = ["화장품", "코스메틱", "뷰티", "beauty", "cosmetic", "fashion"];
  const hasIndustrySignal = industryKeywords.some((keyword) => text.includes(keyword));
  return hasOnlySignal && hasIndustrySignal;
}

function normalizeGenderForCompletion(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "male" || normalized === "m" || normalized === "남성" || normalized === "남") return "male";
  if (normalized === "female" || normalized === "f" || normalized === "여성" || normalized === "여") return "female";
  if (normalized === "secret" || normalized === "unknown" || normalized === "prefer_not_to_say" || normalized === "비밀") return "secret";
  return normalized;
}

function calculateMatchingProfileCompletion(candidate: MatchingCandidate) {
  const checks: boolean[] = [
    Boolean(candidate.name?.trim()),
    Boolean(candidate.email?.trim()),
    Boolean(candidate.phoneNumber?.trim()),
    Boolean(candidate.affiliation?.trim()),
    Boolean(candidate.nationality?.trim()),
    Boolean(normalizeGenderForCompletion(candidate.gender)),
    Boolean(candidate.birthDate),
    Boolean(candidate.jobTitle?.trim()),
    candidate.profile.workPermit !== null,
    Boolean(candidate.profile.visaType),
    Boolean(candidate.profile.visaExpiryDate),
    candidate.profile.livesInKorea !== null,
    candidate.profile.hasAccommodation !== null,
    Boolean(candidate.profile.residenceProvince?.trim()),
    Boolean(candidate.profile.residenceDistrict?.trim()),
    Boolean(candidate.profile.residenceAddress?.trim()),
    candidate.profile.educations.length > 0,
    candidate.profile.languages.length > 0,
    candidate.profile.careers.length > 0,
    candidate.profile.activities.length > 0,
    Boolean(candidate.profile.preferredProgramDuration),
    Boolean(candidate.profile.programStartOption),
    candidate.profile.programStartOption !== "SPECIFIC_DATE" || Boolean(candidate.profile.programStartDate),
    candidate.profile.preferredIndustries.length > 0,
    candidate.profile.preferredJobRoles.length > 0,
    candidate.profile.skills.length > 0,
    Boolean(candidate.profile.selfIntroduction?.trim()),
    Boolean(candidate.profile.programMotivation?.trim()),
    Boolean(candidate.profile.emergencyContactName?.trim()),
    Boolean(candidate.profile.emergencyContactRelation?.trim()),
    Boolean(candidate.profile.emergencyContactPhone?.trim()),
    Boolean(candidate.profile.emergencyContactEmail?.trim()),
    Boolean(candidate.profile.emergencyContactAddress?.trim())
  ];
  const total = checks.length;
  const filled = checks.filter(Boolean).length;
  const percent = total > 0 ? Math.round((filled / total) * 100) : 0;
  return { percent, filled, total };
}

function scoreCandidateForPosition(position: MatchingPosition, candidate: MatchingCandidate): RuleMatch<MatchingCandidate> {
  const reasons: string[] = [];
  const completion = calculateMatchingProfileCompletion(candidate);
  const preferredRoleTokens = toTokenSet([position.preferredJobRole, position.mainResponsibilities]);
  const positionRequirementTokens = toTokenSet([position.requiredQualifications, position.preferredQualifications, position.mainResponsibilities]);
  const candidateRoleTokens = toTokenSet([
    candidate.jobTitle,
    ...candidate.profile.preferredJobRoles.map((item) => String(item)),
    ...candidate.profile.careers.map((career) => career.position),
    ...candidate.profile.activities.map((activity) => activity.title)
  ]);
  const candidateSkillTokens = toTokenSet([
    ...candidate.profile.skills,
    ...candidate.profile.activities.flatMap((activity) => activity.skills),
    ...candidate.profile.careers.map((career) => career.description ?? "")
  ]);
  const candidateQualificationTokens = toTokenSet([
    ...candidate.profile.educations.map((edu) => String(edu.educationType)),
    ...candidate.profile.educations.map((edu) => edu.major ?? ""),
    ...candidate.profile.educations.map((edu) => String(edu.status))
  ]);

  const industryFit = computeIndustryFit(position, candidate);
  const roleFit = preferredRoleTokens.size === 0 ? 0.5 : overlapRatio(preferredRoleTokens, candidateRoleTokens);
  const skillFit =
    positionRequirementTokens.size === 0
      ? 0.5
      : clamp01(Math.max(overlapRatio(positionRequirementTokens, candidateSkillTokens), overlapRatio(positionRequirementTokens, candidateRoleTokens)));

  const requiredLanguages = extractRequiredLanguages(position);
  const candidateLanguages = extractCandidateLanguages(candidate);
  const languageFit = requiredLanguages.size === 0 ? 0.5 : overlapRatio(requiredLanguages, candidateLanguages);

  const qualificationFit = positionRequirementTokens.size === 0 ? 0.5 : overlapRatio(positionRequirementTokens, candidateQualificationTokens);
  const timeFit = computeTimeFit(position, candidate);

  let penalty = 0;
  const strictIndustryOnly = detectStrictIndustryOnly(candidate);
  const exactIndustryMatch =
    !!position.partnerOrganization?.industry &&
    (candidate.profile.preferredIndustries ?? []).includes(position.partnerOrganization.industry);
  if (strictIndustryOnly && !exactIndustryMatch) penalty += 0.8;
  if (requiredLanguages.size > 0 && languageFit < 0.2) penalty += 0.35;
  if (preferredRoleTokens.size > 0 && roleFit < 0.15) penalty += 0.3;
  if (completion.percent < openaiMatchingMinCompletionPercent) {
    penalty += openaiMatchingLowCompletionPenalty / 100;
  }
  penalty = clamp01(penalty);

  const breakdown = normalizeBreakdown({
    industryFit,
    roleFit,
    skillFit,
    languageFit,
    qualificationFit,
    timeFit,
    penalty
  });

  let score = weightedScoreFromBreakdown(breakdown);
  if (candidate.emailVerified) score += 3;
  if (position.status === PositionStatus.OPEN || position.status === PositionStatus.MATCHING) score += 2;
  if (completion.percent >= 80) score += openaiMatchingHighCompletionBonus;
  else if (completion.percent >= 60) score += Math.round(openaiMatchingHighCompletionBonus * 0.5);
  const hiringTarget = Math.max(1, position.hiringCount ?? 1);
  const currentMatched = position.matchingParticipants.length;
  if (currentMatched < hiringTarget) score += Math.min(4, hiringTarget - currentMatched);
  const boundedScore = Math.max(1, Math.min(99, score));

  if (industryFit >= 0.8) reasons.push("선호 산업과 기업 산업이 높게 일치");
  if (roleFit >= 0.55) reasons.push("희망 직무/경험과 공고 직무가 밀접");
  if (skillFit >= 0.5) reasons.push("스킬/경력 키워드가 요구사항과 다수 일치");
  if (languageFit >= 0.5 && requiredLanguages.size > 0) reasons.push("언어 요구조건을 충족");
  if (qualificationFit >= 0.4) reasons.push("학력/전공/자격 요건과 연관성 확인");
  if (timeFit >= 0.6) reasons.push("희망 시작/기간 조건이 공고와 잘 맞음");
  if (completion.percent >= 80) reasons.push(`프로필 완성률이 높아 신뢰 가능한 매칭 판단 가능 (${completion.percent}%)`);
  else if (completion.percent < openaiMatchingMinCompletionPercent)
    reasons.push(`프로필 완성률이 낮아 1차 필터에서 감점 적용 (${completion.percent}%)`);
  if (penalty >= 0.5) reasons.push("필수 선호 또는 조건 충돌 리스크 존재");
  reasons.push(formatBreakdownLine(breakdown));
  if (reasons.length === 0) reasons.push("기본 매칭 조건 충족");
  return { item: candidate, score: boundedScore, reasons, feedback: [] };
}

function buildRuleMatchesForPosition(position: MatchingPosition, candidates: MatchingCandidate[]) {
  return candidates
    .map((candidate): RuleMatch<MatchingCandidate> => scoreCandidateForPosition(position, candidate))
    .sort((a, b) => b.score - a.score);
}

function buildRuleMatchesForCandidate(candidate: MatchingCandidate, positions: MatchingPosition[]) {
  return positions
    .map((position): RuleMatch<MatchingPosition> => {
      const scored = scoreCandidateForPosition(position, candidate);
      return {
        item: position,
        score: scored.score,
        reasons: scored.reasons,
        feedback: []
      };
    })
    .sort((a, b) => b.score - a.score);
}

async function rerankCandidateMatchesWithOpenAI(params: {
  position: MatchingPosition;
  baseMatches: Array<RuleMatch<MatchingCandidate>>;
  limit: number;
}) {
  const { position, baseMatches, limit } = params;
  const shortlist = baseMatches.slice(0, Math.max(limit * 3, 18));
  if (!openai || shortlist.length === 0) {
    return { source: "rule" as const, matches: baseMatches.slice(0, limit) };
  }

  const resultSchema = z.object({
    matches: z.array(
      z.object({
        candidateId: z.string(),
        score: z.number().min(0).max(100),
        reason: z.string().min(1).max(700),
        feedback: z.array(z.string().min(1).max(220)).min(1).max(3)
      })
    )
  });

  try {
    const response = await openai.responses.create({
      model: openaiMatchingModel,
      input: [
        {
          role: "system",
          content:
            "너는 채용 매칭 랭커다. 제공된 후보군만 재정렬하고, 반드시 사실 기반으로 판단해라. 결과는 JSON 스키마를 지켜라."
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "position_to_candidates_rerank",
            position,
            shortlist: shortlist.map((item) => ({
              candidateId: item.item.id,
              name: item.item.name,
              email: item.item.email,
              nationality: item.item.nationality,
              jobTitle: item.item.jobTitle,
              emailVerified: item.item.emailVerified,
              baseScore: item.score,
              baseReasons: item.reasons
            }))
          })
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "candidate_matching_rerank",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              matches: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    candidateId: { type: "string" },
                    score: { type: "number", minimum: 0, maximum: 100 },
                    reason: { type: "string", minLength: 1, maxLength: 300 }
                  },
                  required: ["candidateId", "score", "reason"]
                }
              }
            },
            required: ["matches"]
          },
          strict: true
        }
      }
    });

    const outputText = (response as { output_text?: string }).output_text;
    if (!outputText) throw new Error("empty output");
    const parsed = resultSchema.parse(JSON.parse(outputText));
    const baseById = new Map(shortlist.map((entry) => [entry.item.id, entry]));

    const reranked = parsed.matches
      .map((entry) => {
        const base = baseById.get(entry.candidateId);
        if (!base) return null;
        const blendedScore = Math.round(base.score * 0.35 + entry.score * 0.65);
        return {
          item: base.item,
          score: Math.max(1, Math.min(99, blendedScore)),
          reasons: [entry.reason, ...base.reasons].slice(0, 3),
          feedback: [] as string[]
        };
      })
      .filter((entry): entry is RuleMatch<MatchingCandidate> => Boolean(entry));

    const takenIds = new Set(reranked.map((entry) => entry.item.id));
    const missing = shortlist.filter((entry) => !takenIds.has(entry.item.id));
    const merged = [...reranked, ...missing].sort((a, b) => b.score - a.score).slice(0, limit);
    return { source: "openai" as const, matches: merged };
  } catch {
    return { source: "rule" as const, matches: baseMatches.slice(0, limit) };
  }
}

async function rerankPositionMatchesWithOpenAI(params: {
  candidate: MatchingCandidate;
  baseMatches: Array<RuleMatch<MatchingPosition>>;
  limit: number;
}) {
  const { candidate, baseMatches, limit } = params;
  const shortlist = baseMatches.slice(0, Math.max(limit * 3, 18));
  if (!openai || shortlist.length === 0) {
    return { source: "rule" as const, matches: baseMatches.slice(0, limit) };
  }

  const resultSchema = z.object({
    matches: z.array(
      z.object({
        positionId: z.string(),
        score: z.number().min(0).max(100),
        reason: z.string().min(1).max(700),
        feedback: z.array(z.string().min(1).max(220)).min(1).max(3)
      })
    )
  });

  try {
    const response = await openai.responses.create({
      model: openaiMatchingModel,
      input: [
        {
          role: "system",
          content:
            "너는 채용 매칭 랭커다. 제공된 공고 후보군만 재정렬하고, 반드시 사실 기반으로 판단해라. 결과는 JSON 스키마를 지켜라."
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "candidate_to_positions_rerank",
            candidate,
            shortlist: shortlist.map((item) => ({
              positionId: item.item.id,
              title: item.item.title,
              status: item.item.status,
              preferredJobRole: item.item.preferredJobRole,
              requiredQualifications: item.item.requiredQualifications,
              mainResponsibilities: item.item.mainResponsibilities,
              preferredNationalities: item.item.preferredNationalities,
              baseScore: item.score,
              baseReasons: item.reasons
            }))
          })
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "position_matching_rerank",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              matches: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    positionId: { type: "string" },
                    score: { type: "number", minimum: 0, maximum: 100 },
                    reason: { type: "string", minLength: 1, maxLength: 300 }
                  },
                  required: ["positionId", "score", "reason"]
                }
              }
            },
            required: ["matches"]
          },
          strict: true
        }
      }
    });

    const outputText = (response as { output_text?: string }).output_text;
    if (!outputText) throw new Error("empty output");
    const parsed = resultSchema.parse(JSON.parse(outputText));
    const baseById = new Map(shortlist.map((entry) => [entry.item.id, entry]));

    const reranked = parsed.matches
      .map((entry) => {
        const base = baseById.get(entry.positionId);
        if (!base) return null;
        const blendedScore = Math.round(base.score * 0.35 + entry.score * 0.65);
        return {
          item: base.item,
          score: Math.max(1, Math.min(99, blendedScore)),
          reasons: [entry.reason, ...base.reasons].slice(0, 3),
          feedback: [] as string[]
        };
      })
      .filter((entry): entry is RuleMatch<MatchingPosition> => Boolean(entry));

    const takenIds = new Set(reranked.map((entry) => entry.item.id));
    const missing = shortlist.filter((entry) => !takenIds.has(entry.item.id));
    const merged = [...reranked, ...missing].sort((a, b) => b.score - a.score).slice(0, limit);
    return { source: "openai" as const, matches: merged };
  } catch {
    return { source: "rule" as const, matches: baseMatches.slice(0, limit) };
  }
}

async function generateCandidateMatchesWithOpenAI(params: {
  position: MatchingPosition;
  candidates: MatchingCandidate[];
  limit: number;
}) {
  const { position, candidates, limit } = params;
  if (!openai) throw new Error("openai_unavailable");
  if (candidates.length === 0) return { source: "openai" as const, matches: [] as Array<RuleMatch<MatchingCandidate>> };
  const startedAt = Date.now();
  const prefilterCount = Math.min(openaiMatchingMaxPool, Math.max(limit, limit * openaiMatchingPrefilterMultiplier));
  const ruleMatches = buildRuleMatchesForPosition(position, candidates);
  const candidatePool = ruleMatches.slice(0, prefilterCount).map((entry) => entry.item);
  const ruleScoreByCandidateId = new Map(ruleMatches.map((entry) => [entry.item.id, entry.score]));

  const resultSchema = z.object({
    matches: z.array(
      z.object({
        candidateId: z.string(),
        score: z.number().min(0).max(100),
        reasonSummary: z.string().min(1).max(260),
        reasonPoints: z.array(z.string().min(1).max(220)).min(3).max(6),
        breakdown: z.object({
          industryFit: z.number().min(0).max(1),
          roleFit: z.number().min(0).max(1),
          skillFit: z.number().min(0).max(1),
          languageFit: z.number().min(0).max(1),
          qualificationFit: z.number().min(0).max(1),
          timeFit: z.number().min(0).max(1),
          penalty: z.number().min(0).max(1)
        }),
        feedback: z.array(z.string().min(1).max(220)).min(1).max(3)
      })
    )
  });

  logMatchingEvent("openai.request.start", {
    mode: "position_to_candidates",
    model: openaiMatchingModel,
    positionId: position.id,
    candidateCount: candidates.length,
    candidatePoolCount: candidatePool.length,
    prefilterCount,
    limit
  });

  try {
    const response = await openai.responses.create({
      model: openaiMatchingModel,
      input: [
        {
          role: "system",
          content: [
            "너는 채용 매칭 전문가다. 제공된 후보자 목록 내부에서만 상위 후보를 선별한다.",
            "반드시 2단계로 판단한다.",
            "1) 하드 필터(탈락 조건): 명시된 필수조건 충돌 시 제외하거나 강한 패널티를 준다.",
            "2) 소프트 스코어링: 아래 가중치로 0~100 점수화한다.",
            "Score = 0.30*IndustryFit + 0.30*RoleFit + 0.20*SkillFit + 0.10*LanguageFit + 0.05*QualificationFit + 0.05*TimeFit - 0.20*Penalty",
            "각 항목은 0~1로 정규화한다.",
            "IndustryFit: 후보자 선호 산업과 기업 산업의 적합도",
            "RoleFit: 후보자 희망 직무/경험과 공고 직무·주요업무 적합도",
            "SkillFit: 후보자 스킬/경력/활동과 공고 요구사항 적합도",
            "LanguageFit: 공고 언어 요구사항과 후보자 언어능력 적합도(미명시 시 중간값)",
            "QualificationFit: 학력/전공/자격과 요구사항 적합도",
            "TimeFit: 기간/시작시기/체류조건 적합도",
            "Penalty: 필수 선호 위반(예: 특정 산업만 선호), 큰 조건 불일치 리스크",
            "같은 입력이면 점수 분포와 순위를 최대한 일관되게 유지한다.",
            "reasonSummary에는 핵심 선택 이유를 한 문장으로 작성한다.",
            "reasonPoints에는 선택 근거를 가독성 좋은 불렛 문장으로 3~6개 작성한다.",
            "breakdown에는 각 세부항목을 0~1 숫자로 반드시 채운다.",
            "feedback에는 매칭 가능성을 높이기 위한 실행 가능한 개선 제안 1~3개를 한국어로 작성한다.",
            "사실 기반으로만 판단하고, 결과는 JSON 스키마를 반드시 지켜라."
          ].join("\n")
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "position_to_candidates_direct_match",
            limit,
            position,
            matchingPolicy: {
              process: ["hard_filter", "weighted_scoring", "top_n"],
              weights: {
                industryFit: 0.3,
                roleFit: 0.3,
                skillFit: 0.2,
                languageFit: 0.1,
                qualificationFit: 0.05,
                timeFit: 0.05,
                penalty: 0.2
              },
              note: "resume_coverletter_portfolio_file_content가 없으면 unknown으로 간주"
            },
            candidates: candidatePool.map((candidate) => ({
              candidateId: candidate.id,
              name: candidate.name,
              email: candidate.email,
              nationality: candidate.nationality,
              jobTitle: candidate.jobTitle,
              affiliation: candidate.affiliation,
              adminMemo: truncateText(candidate.adminMemo),
              emailVerified: candidate.emailVerified,
              profile: {
                visaType: candidate.profile.visaType,
                preferredProgramDuration: candidate.profile.preferredProgramDuration,
                programStartOption: candidate.profile.programStartOption,
                programStartDate: candidate.profile.programStartDate,
                preferredIndustries: candidate.profile.preferredIndustries.slice(0, 10),
                preferredJobRoles: candidate.profile.preferredJobRoles.slice(0, 10),
                skills: candidate.profile.skills.slice(0, 20),
                selfIntroduction: truncateText(candidate.profile.selfIntroduction),
                programMotivation: truncateText(candidate.profile.programMotivation),
                languages: candidate.profile.languages.slice(0, 8),
                educations: candidate.profile.educations.slice(0, 3),
                careers: candidate.profile.careers.slice(0, 3).map((career) => ({
                  companyName: career.companyName,
                  position: career.position,
                  description: truncateText(career.description),
                  startDate: career.startDate,
                  endDate: career.endDate,
                  isCurrent: career.isCurrent
                })),
                activities: candidate.profile.activities.slice(0, 3).map((activity) => ({
                  activityType: activity.activityType,
                  title: activity.title,
                  organization: activity.organization,
                  description: truncateText(activity.description),
                  skills: activity.skills.slice(0, 12),
                  startDate: activity.startDate,
                  endDate: activity.endDate
                }))
              }
            }))
          })
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "candidate_matching_direct",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              matches: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    candidateId: { type: "string" },
                    score: { type: "number", minimum: 0, maximum: 100 },
                    reasonSummary: { type: "string", minLength: 1, maxLength: 260 },
                    reasonPoints: {
                      type: "array",
                      minItems: 3,
                      maxItems: 6,
                      items: { type: "string", minLength: 1, maxLength: 220 }
                    },
                    breakdown: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        industryFit: { type: "number", minimum: 0, maximum: 1 },
                        roleFit: { type: "number", minimum: 0, maximum: 1 },
                        skillFit: { type: "number", minimum: 0, maximum: 1 },
                        languageFit: { type: "number", minimum: 0, maximum: 1 },
                        qualificationFit: { type: "number", minimum: 0, maximum: 1 },
                        timeFit: { type: "number", minimum: 0, maximum: 1 },
                        penalty: { type: "number", minimum: 0, maximum: 1 }
                      },
                      required: [
                        "industryFit",
                        "roleFit",
                        "skillFit",
                        "languageFit",
                        "qualificationFit",
                        "timeFit",
                        "penalty"
                      ]
                    },
                    feedback: {
                      type: "array",
                      minItems: 1,
                      maxItems: 3,
                      items: { type: "string", minLength: 1, maxLength: 220 }
                    }
                  },
                  required: ["candidateId", "score", "reasonSummary", "reasonPoints", "breakdown", "feedback"]
                }
              }
            },
            required: ["matches"]
          },
          strict: true
        }
      }
    });

    const outputText = (response as { output_text?: string }).output_text;
    if (!outputText) throw new Error("openai_empty_output");
    const parsed = resultSchema.parse(JSON.parse(outputText));

    const explanationById = new Map<
      string,
      {
        reasons: string[];
        feedback: string[];
      }
    >();
    parsed.matches.forEach((entry) => {
      if (explanationById.has(entry.candidateId)) return;
      const breakdown = normalizeBreakdown(entry.breakdown);
      explanationById.set(entry.candidateId, {
        reasons: [entry.reasonSummary, formatBreakdownLine(breakdown), ...entry.reasonPoints].slice(0, 6),
        feedback: entry.feedback
      });
    });

    const topRuleMatches = ruleMatches.slice(0, limit);
    const matches = topRuleMatches.map((base) => {
      const explanation = explanationById.get(base.item.id);
      return {
        item: base.item,
        score: base.score,
        reasons: explanation?.reasons ?? base.reasons,
        feedback: explanation?.feedback ?? ["프로필 상세(스킬/언어/경험)를 보강하면 매칭 근거 정확도가 높아집니다."]
      };
    });

    logMatchingEvent("openai.request.success", {
      mode: "position_to_candidates",
      model: openaiMatchingModel,
      positionId: position.id,
      matchedCount: matches.length,
      elapsedMs: Date.now() - startedAt
    });

    return { source: "openai" as const, matches };
  } catch (error) {
    logMatchingEvent("openai.request.error", {
      mode: "position_to_candidates",
      model: openaiMatchingModel,
      positionId: position.id,
      elapsedMs: Date.now() - startedAt,
      error: getErrorMessage(error)
    });
    throw error;
  }
}

async function generatePositionMatchesWithOpenAI(params: {
  candidate: MatchingCandidate;
  positions: MatchingPosition[];
  limit: number;
}) {
  const { candidate, positions, limit } = params;
  if (!openai) throw new Error("openai_unavailable");
  if (positions.length === 0) return { source: "openai" as const, matches: [] as Array<RuleMatch<MatchingPosition>> };
  const startedAt = Date.now();
  const prefilterCount = Math.min(openaiMatchingMaxPool, Math.max(limit, limit * openaiMatchingPrefilterMultiplier));
  const ruleMatches = buildRuleMatchesForCandidate(candidate, positions);
  const positionPool = ruleMatches.slice(0, prefilterCount).map((entry) => entry.item);
  const ruleScoreByPositionId = new Map(ruleMatches.map((entry) => [entry.item.id, entry.score]));

  const resultSchema = z.object({
    matches: z.array(
      z.object({
        positionId: z.string(),
        score: z.number().min(0).max(100),
        reasonSummary: z.string().min(1).max(260),
        reasonPoints: z.array(z.string().min(1).max(220)).min(3).max(6),
        breakdown: z.object({
          industryFit: z.number().min(0).max(1),
          roleFit: z.number().min(0).max(1),
          skillFit: z.number().min(0).max(1),
          languageFit: z.number().min(0).max(1),
          qualificationFit: z.number().min(0).max(1),
          timeFit: z.number().min(0).max(1),
          penalty: z.number().min(0).max(1)
        }),
        feedback: z.array(z.string().min(1).max(220)).min(1).max(3)
      })
    )
  });

  logMatchingEvent("openai.request.start", {
    mode: "candidate_to_positions",
    model: openaiMatchingModel,
    candidateId: candidate.id,
    positionCount: positions.length,
    positionPoolCount: positionPool.length,
    prefilterCount,
    limit
  });

  try {
    const response = await openai.responses.create({
      model: openaiMatchingModel,
      input: [
        {
          role: "system",
          content: [
            "너는 채용 매칭 전문가다. 제공된 공고 목록 내부에서만 상위 공고를 선별한다.",
            "반드시 2단계로 판단한다.",
            "1) 하드 필터(탈락 조건): 후보자 필수 선호/조건과 충돌하는 공고는 제외하거나 강한 패널티를 준다.",
            "2) 소프트 스코어링: 아래 가중치로 0~100 점수화한다.",
            "Score = 0.30*IndustryFit + 0.30*RoleFit + 0.20*SkillFit + 0.10*LanguageFit + 0.05*QualificationFit + 0.05*TimeFit - 0.20*Penalty",
            "각 항목은 0~1로 정규화한다.",
            "IndustryFit: 후보자 선호 산업과 기업 산업의 적합도",
            "RoleFit: 후보자 희망 직무/경험과 공고 직무·주요업무 적합도",
            "SkillFit: 후보자 스킬/경력/활동과 공고 요구사항 적합도",
            "LanguageFit: 공고 언어 요구사항과 후보자 언어능력 적합도(미명시 시 중간값)",
            "QualificationFit: 학력/전공/자격과 요구사항 적합도",
            "TimeFit: 기간/시작시기/체류조건 적합도",
            "Penalty: 필수 선호 위반(예: 특정 산업만 선호), 큰 조건 불일치 리스크",
            "같은 입력이면 점수 분포와 순위를 최대한 일관되게 유지한다.",
            "reasonSummary에는 핵심 선택 이유를 한 문장으로 작성한다.",
            "reasonPoints에는 선택 근거를 가독성 좋은 불렛 문장으로 3~6개 작성한다.",
            "breakdown에는 각 세부항목을 0~1 숫자로 반드시 채운다.",
            "feedback에는 매칭 가능성을 높이기 위한 실행 가능한 개선 제안 1~3개를 한국어로 작성한다.",
            "사실 기반으로만 판단하고, 결과는 JSON 스키마를 반드시 지켜라."
          ].join("\n")
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "candidate_to_positions_direct_match",
            limit,
            candidate,
            matchingPolicy: {
              process: ["hard_filter", "weighted_scoring", "top_n"],
              weights: {
                industryFit: 0.3,
                roleFit: 0.3,
                skillFit: 0.2,
                languageFit: 0.1,
                qualificationFit: 0.05,
                timeFit: 0.05,
                penalty: 0.2
              },
              note: "resume_coverletter_portfolio_file_content가 없으면 unknown으로 간주"
            },
            positions: positionPool.map((position) => ({
              positionId: position.id,
              title: position.title,
              status: position.status,
              communicationLanguages: position.communicationLanguages,
              preferredNationalities: position.preferredNationalities,
              preferredJobRole: position.preferredJobRole,
              hiringCount: position.hiringCount,
              workingHours: position.workingHours,
              requiredQualifications: position.requiredQualifications,
              preferredQualifications: position.preferredQualifications,
              mainResponsibilities: position.mainResponsibilities,
              additionalNotes: position.additionalNotes,
              partnerOrganization: position.partnerOrganization,
              summary: compactArray(
                [
                  position.preferredJobRole,
                  position.mainResponsibilities,
                  position.requiredQualifications,
                  position.preferredQualifications,
                  position.additionalNotes
                ],
                5
              ).map((item) => truncateText(item))
            }))
          })
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "position_matching_direct",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              matches: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    positionId: { type: "string" },
                    score: { type: "number", minimum: 0, maximum: 100 },
                    reasonSummary: { type: "string", minLength: 1, maxLength: 260 },
                    reasonPoints: {
                      type: "array",
                      minItems: 3,
                      maxItems: 6,
                      items: { type: "string", minLength: 1, maxLength: 220 }
                    },
                    breakdown: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        industryFit: { type: "number", minimum: 0, maximum: 1 },
                        roleFit: { type: "number", minimum: 0, maximum: 1 },
                        skillFit: { type: "number", minimum: 0, maximum: 1 },
                        languageFit: { type: "number", minimum: 0, maximum: 1 },
                        qualificationFit: { type: "number", minimum: 0, maximum: 1 },
                        timeFit: { type: "number", minimum: 0, maximum: 1 },
                        penalty: { type: "number", minimum: 0, maximum: 1 }
                      },
                      required: [
                        "industryFit",
                        "roleFit",
                        "skillFit",
                        "languageFit",
                        "qualificationFit",
                        "timeFit",
                        "penalty"
                      ]
                    },
                    feedback: {
                      type: "array",
                      minItems: 1,
                      maxItems: 3,
                      items: { type: "string", minLength: 1, maxLength: 220 }
                    }
                  },
                  required: ["positionId", "score", "reasonSummary", "reasonPoints", "breakdown", "feedback"]
                }
              }
            },
            required: ["matches"]
          },
          strict: true
        }
      }
    });

    const outputText = (response as { output_text?: string }).output_text;
    if (!outputText) throw new Error("openai_empty_output");
    const parsed = resultSchema.parse(JSON.parse(outputText));

    const explanationById = new Map<
      string,
      {
        reasons: string[];
        feedback: string[];
      }
    >();
    parsed.matches.forEach((entry) => {
      if (explanationById.has(entry.positionId)) return;
      const breakdown = normalizeBreakdown(entry.breakdown);
      explanationById.set(entry.positionId, {
        reasons: [entry.reasonSummary, formatBreakdownLine(breakdown), ...entry.reasonPoints].slice(0, 6),
        feedback: entry.feedback
      });
    });

    const topRuleMatches = ruleMatches.slice(0, limit);
    const matches = topRuleMatches.map((base) => {
      const explanation = explanationById.get(base.item.id);
      return {
        item: base.item,
        score: base.score,
        reasons: explanation?.reasons ?? base.reasons,
        feedback: explanation?.feedback ?? ["직무/스킬 키워드를 더 구체화하면 추천 정확도가 더 높아집니다."]
      };
    });

    logMatchingEvent("openai.request.success", {
      mode: "candidate_to_positions",
      model: openaiMatchingModel,
      candidateId: candidate.id,
      matchedCount: matches.length,
      elapsedMs: Date.now() - startedAt
    });

    return { source: "openai" as const, matches };
  } catch (error) {
    logMatchingEvent("openai.request.error", {
      mode: "candidate_to_positions",
      model: openaiMatchingModel,
      candidateId: candidate.id,
      elapsedMs: Date.now() - startedAt,
      error: getErrorMessage(error)
    });
    throw error;
  }
}

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, service: "api", db: "connected" });
  } catch {
    res.status(500).json({ ok: false, service: "api", db: "disconnected" });
  }
});

app.get("/", (_req, res) => {
  res.json({ ok: true, message: "Flip API is running" });
});

app.get("/members/meta", (_req, res) => {
  res.json({
    ok: true,
    roles: Object.values(MemberRole),
    partnerTypes: Object.values(PartnerType),
    partnerOrgUserRoles: Object.values(PartnerOrgUserRole),
    partnerCompanySizes: partnerCompanySizeEnum.options,
    partnerIndustries: Object.values(PartnerIndustry),
    candidateVisaTypes: Object.values(CandidateVisaType)
  });
});

app.get("/positions/meta", async (_req, res) => {
  const [partnerIndustries, partnerCompanySizes, rolesRaw, workTypesRaw, eligibleVisasRaw] = await Promise.all([
    prisma.partnerOrganization.findMany({
      where: { positions: { some: {} } },
      distinct: ["industry"],
      select: { industry: true }
    }),
    prisma.partnerOrganization.findMany({
      where: {
        companySize: { not: null },
        positions: { some: {} }
      },
      distinct: ["companySize"],
      select: { companySize: true }
    }),
    prisma.position.findMany({
      where: {
        preferredJobRole: {
          not: null
        }
      },
      select: {
        preferredJobRole: true
      }
    }),
    prisma.position.findMany({
      where: { workType: { not: null } },
      distinct: ["workType"],
      select: { workType: true }
    }),
    prisma.position.findMany({
      where: { eligibleVisas: { isEmpty: false } },
      select: { eligibleVisas: true }
    })
  ]);

  const jobRoles = Array.from(
    new Set(
      rolesRaw
        .map((item) => item.preferredJobRole?.trim() ?? "")
        .filter((value) => value.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b, "ko-KR"));

  res.json({
    ok: true,
    partnerIndustries: partnerIndustries.map((item) => item.industry),
    partnerCompanySizes: partnerCompanySizes
      .map((item) => item.companySize)
      .filter((value): value is z.infer<typeof partnerCompanySizeEnum> => Boolean(value)),
    jobRoles,
    candidateVisaTypes: Array.from(
      new Set(
        eligibleVisasRaw.flatMap((item) => item.eligibleVisas).map((value) => value.trim()).filter((value) => value.length > 0)
      )
    ),
    workTypes: Array.from(
      new Set(
        workTypesRaw
          .map((item) => item.workType?.trim() ?? "")
          .filter((value) => value.length > 0)
      )
    )
  });
});

app.get("/community/posts", async (req, res) => {
  const parsedQuery = listCommunityPostsCursorQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsedQuery.error.flatten() });
  }

  const limit = parsedQuery.data.limit ?? 20;
  const category = parsedQuery.data.category;
  const sortBy = parsedQuery.data.sortBy ?? "latest";
  const search = parsedQuery.data.search?.toLowerCase();
  const viewerUserId = resolvePublicViewerUserId(req);

  let cursorValue: { createdAt: Date; id: string } | null = null;
  if (parsedQuery.data.cursor) {
    try {
      const decoded = Buffer.from(parsedQuery.data.cursor, "base64").toString("utf8");
      const [createdAtRaw, idRaw] = decoded.split("|");
      const createdAt = createdAtRaw ? new Date(createdAtRaw) : null;
      const id = idRaw?.trim();
      if (!createdAt || Number.isNaN(createdAt.getTime()) || !id) {
        return res.status(400).json({ ok: false, message: "invalid cursor" });
      }
      cursorValue = { createdAt, id };
    } catch {
      return res.status(400).json({ ok: false, message: "invalid cursor" });
    }
  }

  const items = await prisma.communityPost.findMany({
    where: {
      ...(category ? { category: toCommunityPostCategory(category) } : {}),
      ...(search
        ? {
            OR: [
              { authorName: { contains: search, mode: "insensitive" } },
              { title: { contains: search, mode: "insensitive" } },
              { body: { contains: search, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(cursorValue
        ? {
            OR: [
              { createdAt: { lt: cursorValue.createdAt } },
              {
                AND: [
                  { createdAt: cursorValue.createdAt },
                  { id: { lt: cursorValue.id } }
                ]
              }
            ]
          }
        : {})
    },
    orderBy:
      sortBy === "popular"
        ? [{ likes: "desc" }, { comments: "desc" }, { createdAt: "desc" }, { id: "desc" }]
        : [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: viewerUserId
      ? {
          likedBy: {
            where: { userId: viewerUserId },
            select: { id: true },
            take: 1
          }
        }
      : undefined
  });

  const hasNext = items.length > limit;
  const pageItems = hasNext ? items.slice(0, limit) : items;
  const tail = pageItems[pageItems.length - 1];
  const nextCursor = hasNext && tail
    ? Buffer.from(`${tail.createdAt.toISOString()}|${tail.id}`, "utf8").toString("base64")
    : null;

  return res.json({
    ok: true,
    items: pageItems.map((item) => ({
      id: item.id,
      authorId: item.authorId,
      category: fromCommunityPostCategory(item.category),
      author: item.authorName,
      title: item.title,
      body: item.body,
      imageUrls: item.imageUrls,
      createdAt: item.createdAt.toISOString(),
      likes: item.likes,
      comments: item.comments,
      likedByMe: viewerUserId ? (item as { likedBy?: Array<{ id: string }> }).likedBy?.length === 1 : false
    })),
    nextCursor
  });
});

app.post("/community/posts", authenticate, requireRoles([MemberRole.STUDENT, MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  const parsedBody = createCommunityPostSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsedBody.error.flatten() });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: { id: true, name: true, realName: true, email: true }
  });
  if (!user) {
    return res.status(404).json({ ok: false, message: "user not found" });
  }

  const body = parsedBody.data.body.trim();
  const firstLine = body.split("\n").find((line) => line.trim().length > 0)?.trim() ?? body.slice(0, 60);
  const title = firstLine.length > 90 ? `${firstLine.slice(0, 90)}…` : firstLine;

  try {
    const created = await prisma.communityPost.create({
      data: {
        authorId: user.id,
        authorName: user.name?.trim() || user.realName?.trim() || user.email.split("@")[0] || "User",
        category: toCommunityPostCategory(parsedBody.data.category),
        title,
        body,
        imageUrls: parsedBody.data.imageUrls ?? [],
        likes: 0,
        comments: 0
      }
    });

    return res.status(201).json({
      ok: true,
      item: {
        id: created.id,
        authorId: created.authorId,
        category: fromCommunityPostCategory(created.category),
        author: created.authorName,
        title: created.title,
        body: created.body,
        imageUrls: created.imageUrls,
        createdAt: created.createdAt.toISOString(),
        likes: created.likes,
        comments: created.comments
      }
    });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to create community post" });
  }
});

app.patch("/community/posts/:postId", authenticate, requireRoles([MemberRole.STUDENT, MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  const parsedParam = communityPostParamSchema.safeParse(req.params);
  if (!parsedParam.success) {
    return res.status(400).json({ ok: false, message: "invalid params", errors: parsedParam.error.flatten() });
  }
  const parsedBody = updateCommunityPostSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsedBody.error.flatten() });
  }

  const existing = await prisma.communityPost.findUnique({
    where: { id: parsedParam.data.postId },
    select: { id: true, authorId: true, body: true, category: true, imageUrls: true }
  });
  if (!existing) return res.status(404).json({ ok: false, message: "post not found" });
  if (existing.authorId !== req.auth!.userId) {
    return res.status(403).json({ ok: false, message: "forbidden" });
  }

  const nextBody = parsedBody.data.body?.trim() ?? existing.body;
  const firstLine = nextBody.split("\n").find((line) => line.trim().length > 0)?.trim() ?? nextBody.slice(0, 60);
  const title = firstLine.length > 90 ? `${firstLine.slice(0, 90)}…` : firstLine;

  const updated = await prisma.communityPost.update({
    where: { id: parsedParam.data.postId },
    data: {
      category: parsedBody.data.category ? toCommunityPostCategory(parsedBody.data.category) : existing.category,
      body: nextBody,
      title,
      imageUrls: parsedBody.data.imageUrls ?? existing.imageUrls
    }
  });

  return res.json({
    ok: true,
    item: {
      id: updated.id,
      authorId: updated.authorId,
      category: fromCommunityPostCategory(updated.category),
      author: updated.authorName,
      title: updated.title,
      body: updated.body,
      imageUrls: updated.imageUrls,
      createdAt: updated.createdAt.toISOString(),
      likes: updated.likes,
      comments: updated.comments
    }
  });
});

app.delete("/community/posts/:postId", authenticate, requireRoles([MemberRole.STUDENT, MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  const parsedParam = communityPostParamSchema.safeParse(req.params);
  if (!parsedParam.success) {
    return res.status(400).json({ ok: false, message: "invalid params", errors: parsedParam.error.flatten() });
  }

  const existing = await prisma.communityPost.findUnique({
    where: { id: parsedParam.data.postId },
    select: { id: true, authorId: true }
  });
  if (!existing) return res.status(404).json({ ok: false, message: "post not found" });
  if (existing.authorId !== req.auth!.userId) {
    return res.status(403).json({ ok: false, message: "forbidden" });
  }

  await prisma.communityPost.delete({ where: { id: parsedParam.data.postId } });
  return res.json({ ok: true });
});

app.post("/community/posts/:postId/like", authenticate, requireRoles([MemberRole.STUDENT, MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  const parsedParam = communityPostParamSchema.safeParse(req.params);
  if (!parsedParam.success) {
    return res.status(400).json({ ok: false, message: "invalid params", errors: parsedParam.error.flatten() });
  }
  const post = await prisma.communityPost.findUnique({
    where: { id: parsedParam.data.postId },
    select: { id: true }
  });
  if (!post) return res.status(404).json({ ok: false, message: "post not found" });

  await prisma.$transaction(async (tx) => {
    await tx.communityPostLike.upsert({
      where: {
        postId_userId: {
          postId: parsedParam.data.postId,
          userId: req.auth!.userId
        }
      },
      update: {},
      create: {
        postId: parsedParam.data.postId,
        userId: req.auth!.userId
      }
    });

    const likeCount = await tx.communityPostLike.count({
      where: { postId: parsedParam.data.postId }
    });
    await tx.communityPost.update({
      where: { id: parsedParam.data.postId },
      data: { likes: likeCount }
    });
  });

  const updated = await prisma.communityPost.findUnique({
    where: { id: parsedParam.data.postId },
    select: { likes: true }
  });

  return res.json({ ok: true, likes: updated?.likes ?? 0, likedByMe: true });
});

app.delete("/community/posts/:postId/like", authenticate, requireRoles([MemberRole.STUDENT, MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  const parsedParam = communityPostParamSchema.safeParse(req.params);
  if (!parsedParam.success) {
    return res.status(400).json({ ok: false, message: "invalid params", errors: parsedParam.error.flatten() });
  }
  const post = await prisma.communityPost.findUnique({
    where: { id: parsedParam.data.postId },
    select: { id: true }
  });
  if (!post) return res.status(404).json({ ok: false, message: "post not found" });

  await prisma.$transaction(async (tx) => {
    await tx.communityPostLike.deleteMany({
      where: {
        postId: parsedParam.data.postId,
        userId: req.auth!.userId
      }
    });
    const likeCount = await tx.communityPostLike.count({
      where: { postId: parsedParam.data.postId }
    });
    await tx.communityPost.update({
      where: { id: parsedParam.data.postId },
      data: { likes: likeCount }
    });
  });

  const updated = await prisma.communityPost.findUnique({
    where: { id: parsedParam.data.postId },
    select: { likes: true }
  });

  return res.json({ ok: true, likes: updated?.likes ?? 0, likedByMe: false });
});

app.get("/community/posts/:postId/comments", async (req, res) => {
  const parsedParam = communityPostParamSchema.safeParse(req.params);
  if (!parsedParam.success) {
    return res.status(400).json({ ok: false, message: "invalid params", errors: parsedParam.error.flatten() });
  }

  const post = await prisma.communityPost.findUnique({
    where: { id: parsedParam.data.postId },
    select: { id: true }
  });
  if (!post) return res.status(404).json({ ok: false, message: "post not found" });

  const comments = await prisma.communityPostComment.findMany({
    where: { postId: parsedParam.data.postId },
    orderBy: [{ createdAt: "asc" }],
    take: 100
  });

  return res.json({
    ok: true,
    items: comments.map((item) => ({
      id: item.id,
      postId: item.postId,
      authorName: item.authorName,
      body: item.body,
      createdAt: item.createdAt.toISOString()
    }))
  });
});

app.post("/community/posts/:postId/comments", authenticate, requireRoles([MemberRole.STUDENT, MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  const parsedParam = communityPostParamSchema.safeParse(req.params);
  if (!parsedParam.success) {
    return res.status(400).json({ ok: false, message: "invalid params", errors: parsedParam.error.flatten() });
  }
  const parsedBody = createCommunityCommentSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsedBody.error.flatten() });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: { id: true, name: true, realName: true, email: true }
  });
  if (!user) {
    return res.status(404).json({ ok: false, message: "user not found" });
  }

  const post = await prisma.communityPost.findUnique({
    where: { id: parsedParam.data.postId },
    select: { id: true }
  });
  if (!post) return res.status(404).json({ ok: false, message: "post not found" });

  const created = await prisma.$transaction(async (tx) => {
    const comment = await tx.communityPostComment.create({
      data: {
        postId: parsedParam.data.postId,
        authorId: user.id,
        authorName: user.name?.trim() || user.realName?.trim() || user.email.split("@")[0] || "User",
        body: parsedBody.data.body.trim()
      }
    });
    const commentCount = await tx.communityPostComment.count({
      where: { postId: parsedParam.data.postId }
    });
    await tx.communityPost.update({
      where: { id: parsedParam.data.postId },
      data: { comments: commentCount }
    });
    return { comment, commentCount };
  });

  return res.status(201).json({
    ok: true,
    item: {
      id: created.comment.id,
      postId: created.comment.postId,
      authorName: created.comment.authorName,
      body: created.comment.body,
      createdAt: created.comment.createdAt.toISOString()
    },
    commentCount: created.commentCount
  });
});

app.post("/community/translate", async (req, res) => {
  const parsedBody = translateCommunityPostSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ ok: false, message: "invalid body", errors: parsedBody.error.flatten() });
  }
  if (!openai) {
    return res.status(503).json({ ok: false, message: "translation service unavailable" });
  }

  try {
    const response = await openai.responses.create({
      model: openaiTranslationModel,
      input: [
        {
          role: "system",
          content:
            "You are a translation assistant. Translate user text into the requested target language naturally. Preserve meaning, tone, and line breaks. Return strict JSON."
        },
        {
          role: "user",
          content: JSON.stringify({
            targetLanguage: parsedBody.data.targetLanguage,
            sourceLanguageHint: parsedBody.data.sourceLanguageHint ?? null,
            text: parsedBody.data.text
          })
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "community_translate_result",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              translatedText: { type: "string", minLength: 1, maxLength: 12000 },
              detectedLanguage: { type: "string", minLength: 2, maxLength: 40 }
            },
            required: ["translatedText", "detectedLanguage"]
          },
          strict: true
        }
      }
    });

    const outputText = (response as { output_text?: string }).output_text;
    if (!outputText) {
      return res.status(500).json({ ok: false, message: "empty translation output" });
    }
    const parsed = z
      .object({
        translatedText: z.string().min(1).max(12_000),
        detectedLanguage: z.string().min(2).max(40)
      })
      .safeParse(JSON.parse(outputText));
    if (!parsed.success) {
      return res.status(500).json({ ok: false, message: "invalid translation output" });
    }

    return res.json({
      ok: true,
      translatedText: parsed.data.translatedText,
      detectedLanguage: parsed.data.detectedLanguage
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "failed to translate",
      error: getErrorMessage(error)
    });
  }
});

app.get("/positions", async (req, res) => {
  const parsedQuery = listPublicPositionsCursorQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsedQuery.error.flatten() });
  }

  const limit = parsedQuery.data.limit ?? 20;
  let cursorValue: { createdAt: Date; id: string } | null = null;
  if (parsedQuery.data.cursor) {
    try {
      const decoded = Buffer.from(parsedQuery.data.cursor, "base64").toString("utf8");
      const [createdAtRaw, idRaw] = decoded.split("|");
      const createdAt = createdAtRaw ? new Date(createdAtRaw) : null;
      const id = idRaw?.trim();
      if (!createdAt || Number.isNaN(createdAt.getTime()) || !id) {
        return res.status(400).json({ ok: false, message: "invalid cursor" });
      }
      cursorValue = { createdAt, id };
    } catch {
      return res.status(400).json({ ok: false, message: "invalid cursor" });
    }
  }

  const viewer = await resolvePublicViewer(req);
  const items = await prisma.position.findMany({
    where: {
      status: { in: [PositionStatus.OPEN, PositionStatus.MATCHING] },
      ...(cursorValue
        ? {
            OR: [
              { createdAt: { lt: cursorValue.createdAt } },
              {
                AND: [
                  { createdAt: cursorValue.createdAt },
                  { id: { lt: cursorValue.id } }
                ]
              }
            ]
          }
        : {})
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: {
      partnerOrganization: {
        select: {
          id: true,
          name: true,
          domain: true,
          industry: true,
          companySize: true,
          officeAddress: true
        }
      },
      matchingParticipants: {
        select: { id: true }
      }
    }
  });

  const hasNext = items.length > limit;
  const pageItems = hasNext ? items.slice(0, limit) : items;
  const tail = pageItems[pageItems.length - 1];
  const nextCursor = hasNext && tail
    ? Buffer.from(`${tail.createdAt.toISOString()}|${tail.id}`, "utf8").toString("base64")
    : null;

  return res.json({
    ok: true,
    items: pageItems.map((item) => toPublicPositionItem(item, viewer)),
    nextCursor
  });
});

app.get("/positions/premium-banners", async (req, res) => {
  const viewer = await resolvePublicViewer(req);
  const items = await prisma.position.findMany({
    where: {
      status: { in: [PositionStatus.OPEN, PositionStatus.MATCHING] }
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      partnerOrganization: {
        select: {
          id: true,
          name: true,
          domain: true,
          industry: true,
          companySize: true,
          officeAddress: true
        }
      },
      matchingParticipants: {
        select: { id: true }
      }
    }
  });

  const premium = items
    .map((item) => {
      const meta = extractPremiumBannerMeta(item.adminMemo);
      if (!meta?.enabled) return null;
      const fallbackImage = item.thumbnailImages.find((image) => image.trim().length > 0) ?? null;
      const bannerImageUrl = meta.bannerImageUrl ?? fallbackImage;
      if (!bannerImageUrl) return null;
      return {
        id: item.id,
        positionId: item.id,
        bannerImageUrl,
        bannerTitle: meta.bannerTitle ?? item.title,
        bannerSubtitle: meta.bannerSubtitle ?? item.partnerOrganization?.name ?? null,
        priority: meta.priority ?? 9_999,
        position: toPublicPositionItem(item, viewer)
      };
    })
    .filter((entry): entry is {
      id: string;
      positionId: string;
      bannerImageUrl: string;
      bannerTitle: string;
      bannerSubtitle: string | null;
      priority: number;
      position: ReturnType<typeof toPublicPositionItem>;
    } => Boolean(entry))
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return new Date(b.position.createdAt).getTime() - new Date(a.position.createdAt).getTime();
    });

  return res.json({ ok: true, items: premium });
});

app.get("/positions/:id", async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid position id" });
  }

  const [viewer, item] = await Promise.all([
    resolvePublicViewer(req),
    prisma.position.findFirst({
      where: {
        id,
        status: { in: [PositionStatus.OPEN, PositionStatus.MATCHING] }
      },
      include: {
        partnerOrganization: {
          select: {
            id: true,
            name: true,
            domain: true,
            industry: true,
            companySize: true,
            officeAddress: true
          }
        },
        matchingParticipants: {
          select: { id: true }
        }
      }
    })
  ]);

  if (!item) {
    return res.status(404).json({ ok: false, message: "position not found" });
  }

  return res.json({
    ok: true,
    item: toPublicPositionItem(item, viewer)
  });
});

app.get("/ops/partners/meta", authenticate, requireRoles([MemberRole.OPERATOR]), (_req, res) => {
  res.json({
    ok: true,
    partnerTypes: Object.values(PartnerType),
    partnerCompanySizes: partnerCompanySizeEnum.options,
    partnerIndustries: Object.values(PartnerIndustry),
    sortableFields: ["name", "domain", "createdAt"]
  });
});

app.get("/ops/positions/meta", authenticate, requireRoles([MemberRole.OPERATOR]), async (_req, res) => {
  const partners = await prisma.partnerOrganization.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, domain: true, industry: true, companySize: true }
  });

  const usedPartnerIndustries = Array.from(
    new Set(partners.map((partner) => partner.industry).filter((value): value is PartnerIndustry => Boolean(value)))
  );
  const usedPartnerCompanySizes = Array.from(
    new Set(
      partners
        .map((partner) => partner.companySize)
        .filter((value): value is z.infer<typeof partnerCompanySizeEnum> => Boolean(value))
    )
  );

  res.json({
    ok: true,
    statuses: Object.values(PositionStatus),
    partners: partners.map((partner) => ({
      id: partner.id,
      name: partner.name,
      domain: partner.domain
    })),
    partnerIndustries: Object.values(PartnerIndustry),
    partnerCompanySizes: partnerCompanySizeEnum.options,
    usedPartnerIndustries,
    usedPartnerCompanySizes
  });
});

app.post("/ops/matching/run", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = runMatchingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }
  const requestStartedAt = Date.now();
  logMatchingEvent("run.request.received", {
    mode: parsed.data.mode,
    positionId: parsed.data.positionId ?? null,
    candidateId: parsed.data.candidateId ?? null,
    limit: parsed.data.limit ?? 10
  });

  const limit = parsed.data.limit ?? 10;
  const candidateSelect = {
    id: true,
    email: true,
    emailVerified: true,
    realName: true,
    name: true,
    phoneNumber: true,
    nationality: true,
    affiliation: true,
    birthDate: true,
    gender: true,
    jobTitle: true,
    adminMemo: true,
    role: true,
    partnerType: true,
    partnerOrgRole: true,
    createdAt: true,
    updatedAt: true,
    candidateProfile: {
      select: {
        workPermit: true,
        visaType: true,
        visaExpiryDate: true,
        livesInKorea: true,
        hasAccommodation: true,
        residenceProvince: true,
        residenceDistrict: true,
        residenceAddress: true,
        preferredProgramDuration: true,
        programStartOption: true,
        programStartDate: true,
        preferredIndustries: true,
        preferredJobRoles: true,
        skills: true,
        selfIntroduction: true,
        programMotivation: true,
        emergencyContactName: true,
        emergencyContactRelation: true,
        emergencyContactPhone: true,
        emergencyContactEmail: true,
        emergencyContactAddress: true,
        educations: {
          select: {
            educationType: true,
            major: true,
            status: true
          },
          orderBy: { createdAt: "desc" }
        },
        languageSkills: {
          select: {
            language: true,
            level: true
          }
        },
        careers: {
          select: {
            companyName: true,
            position: true,
            description: true,
            startDate: true,
            endDate: true,
            isCurrent: true
          },
          orderBy: { startDate: "desc" }
        },
        activityExperiences: {
          select: {
            activityType: true,
            title: true,
            organization: true,
            description: true,
            skills: true,
            startDate: true,
            endDate: true
          },
          orderBy: { startDate: "desc" }
        }
      }
    }
  } as const;

  try {
    if (!openai) {
      logMatchingEvent("run.request.rejected", {
        mode: parsed.data.mode,
        reason: "openai_unavailable"
      });
      return res.status(503).json({
        ok: false,
        message: "openai matching is not configured (set OPENAI_API_KEY in .env and restart api)"
      });
    }

    if (parsed.data.mode === "position_to_candidates") {
      const [positionRaw, candidateRaw] = await Promise.all([
        prisma.position.findUnique({
          where: { id: parsed.data.positionId! },
          include: {
            partnerOrganization: { select: { id: true, name: true, domain: true, industry: true } },
            matchingParticipants: { select: { id: true } }
          }
        }),
        prisma.user.findMany({
          where: { role: MemberRole.STUDENT },
          orderBy: { updatedAt: "desc" },
          select: candidateSelect
        })
      ]);

      if (!positionRaw) {
        return res.status(404).json({ ok: false, message: "position not found" });
      }

      const positionForMatch: MatchingPosition = {
        id: positionRaw.id,
        title: positionRaw.title,
        status: positionRaw.status,
        preferredNationalities: positionRaw.preferredNationalities,
        communicationLanguages: positionRaw.communicationLanguages,
        preferredJobRole: positionRaw.preferredJobRole,
        hiringCount: positionRaw.hiringCount,
        workingHours: positionRaw.workingHours,
        requiredQualifications: positionRaw.requiredQualifications,
        preferredQualifications: positionRaw.preferredQualifications,
        mainResponsibilities: positionRaw.mainResponsibilities,
        additionalNotes: positionRaw.additionalNotes,
        matchingParticipants: positionRaw.matchingParticipants,
        partnerOrganization: positionRaw.partnerOrganization
      };
      const candidatesForMatch: MatchingCandidate[] = candidateRaw.map((item) => ({
        id: item.id,
        email: item.email,
        emailVerified: item.emailVerified,
        name: item.name,
        phoneNumber: item.phoneNumber,
        nationality: item.nationality,
        birthDate: item.birthDate?.toISOString() ?? null,
        gender: item.gender,
        jobTitle: item.jobTitle,
        affiliation: item.affiliation,
        adminMemo: item.adminMemo,
        profile: {
          workPermit: item.candidateProfile?.workPermit ?? null,
          visaType: item.candidateProfile?.visaType ?? null,
          visaExpiryDate: item.candidateProfile?.visaExpiryDate?.toISOString() ?? null,
          livesInKorea: item.candidateProfile?.livesInKorea ?? null,
          hasAccommodation: item.candidateProfile?.hasAccommodation ?? null,
          residenceProvince: item.candidateProfile?.residenceProvince ?? null,
          residenceDistrict: item.candidateProfile?.residenceDistrict ?? null,
          residenceAddress: item.candidateProfile?.residenceAddress ?? null,
          preferredProgramDuration: item.candidateProfile?.preferredProgramDuration ?? null,
          programStartOption: item.candidateProfile?.programStartOption ?? null,
          programStartDate: item.candidateProfile?.programStartDate?.toISOString() ?? null,
          preferredIndustries: item.candidateProfile?.preferredIndustries ?? [],
          preferredJobRoles: (item.candidateProfile?.preferredJobRoles ?? []).map((role) => String(role)),
          skills: item.candidateProfile?.skills ?? [],
          selfIntroduction: item.candidateProfile?.selfIntroduction ?? null,
          programMotivation: item.candidateProfile?.programMotivation ?? null,
          languages: (item.candidateProfile?.languageSkills ?? []).map((lang) => ({
            language: lang.language,
            level: lang.level
          })),
          educations: (item.candidateProfile?.educations ?? []).map((edu) => ({
            educationType: edu.educationType,
            major: edu.major,
            status: edu.status
          })),
          careers: (item.candidateProfile?.careers ?? []).map((career) => ({
            companyName: career.companyName,
            position: career.position,
            description: career.description,
            startDate: career.startDate?.toISOString() ?? null,
            endDate: career.endDate?.toISOString() ?? null,
            isCurrent: career.isCurrent
          })),
          activities: (item.candidateProfile?.activityExperiences ?? []).map((activity) => ({
            activityType: activity.activityType,
            title: activity.title,
            organization: activity.organization,
            description: activity.description,
            skills: activity.skills,
            startDate: activity.startDate?.toISOString() ?? null,
            endDate: activity.endDate?.toISOString() ?? null
          })),
          emergencyContactName: item.candidateProfile?.emergencyContactName ?? null,
          emergencyContactRelation: item.candidateProfile?.emergencyContactRelation ?? null,
          emergencyContactPhone: item.candidateProfile?.emergencyContactPhone ?? null,
          emergencyContactEmail: item.candidateProfile?.emergencyContactEmail ?? null,
          emergencyContactAddress: item.candidateProfile?.emergencyContactAddress ?? null
        }
      }));

      const candidateById = new Map(candidateRaw.map((item) => [item.id, item]));

      const directMatches = await generateCandidateMatchesWithOpenAI({
        position: positionForMatch,
        candidates: candidatesForMatch,
        limit
      });

      const matches = directMatches.matches
        .map((entry) => {
          const found = candidateById.get(entry.item.id);
          if (!found) return null;
          return {
            candidate: toSafeUser(found),
            score: entry.score,
            reasons: entry.reasons,
            feedback: entry.feedback
          };
        })
        .filter(
          (entry): entry is { candidate: ReturnType<typeof toSafeUser>; score: number; reasons: string[]; feedback: string[] } =>
            Boolean(entry)
        );

      logMatchingEvent("run.request.succeeded", {
        mode: parsed.data.mode,
        source: directMatches.source,
        matchCount: matches.length,
        elapsedMs: Date.now() - requestStartedAt
      });

      try {
        const history = getMatchingHistoryDelegate();
        if (history?.create) {
          await history.create({
            data: {
              mode: parsed.data.mode,
              source: directMatches.source,
              positionId: positionRaw.id,
              positionTitle: positionRaw.title,
              resultCount: matches.length,
              ranAt: new Date(),
              results: matches.map((match) => ({
                candidateId: match.candidate.id,
                candidateName: match.candidate.name || match.candidate.email,
                candidateEmail: match.candidate.email,
                score: match.score,
                reasons: match.reasons,
                feedback: match.feedback
              }))
            }
          });
        } else {
          logMatchingEvent("history.save.skipped", {
            mode: parsed.data.mode,
            reason: "delegate_unavailable"
          });
        }
      } catch (historyError) {
        logMatchingEvent("history.save.failed", {
          mode: parsed.data.mode,
          error: getErrorMessage(historyError)
        });
      }

      return res.json({
        ok: true,
        mode: parsed.data.mode,
        source: directMatches.source,
        ranAt: new Date().toISOString(),
        position: {
          id: positionRaw.id,
          title: positionRaw.title,
          status: positionRaw.status,
          preferredJobRole: positionRaw.preferredJobRole,
          partnerOrganization: positionRaw.partnerOrganization
        },
        matches
      });
    }

    const [candidateRaw, openPositions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: parsed.data.candidateId! },
        select: candidateSelect
      }),
      prisma.position.findMany({
        where: { status: { in: [PositionStatus.OPEN, PositionStatus.MATCHING] } },
        orderBy: { updatedAt: "desc" },
        include: {
          partnerOrganization: { select: { id: true, name: true, domain: true, industry: true } },
          matchingParticipants: { select: { id: true } }
        }
      })
    ]);

    if (!candidateRaw || candidateRaw.role !== MemberRole.STUDENT) {
      return res.status(404).json({ ok: false, message: "candidate not found" });
    }

    const positionPool =
      openPositions.length > 0
        ? openPositions
        : await prisma.position.findMany({
            orderBy: { updatedAt: "desc" },
            include: {
              partnerOrganization: { select: { id: true, name: true, domain: true, industry: true } },
              matchingParticipants: { select: { id: true } }
            }
          });

    const positionsForMatch: MatchingPosition[] = positionPool.map((position) => ({
      id: position.id,
      title: position.title,
      status: position.status,
      preferredNationalities: position.preferredNationalities,
      communicationLanguages: position.communicationLanguages,
      preferredJobRole: position.preferredJobRole,
      hiringCount: position.hiringCount,
      workingHours: position.workingHours,
      requiredQualifications: position.requiredQualifications,
      preferredQualifications: position.preferredQualifications,
      mainResponsibilities: position.mainResponsibilities,
      additionalNotes: position.additionalNotes,
      matchingParticipants: position.matchingParticipants,
      partnerOrganization: position.partnerOrganization
    }));

    const candidateForMatch: MatchingCandidate = {
      id: candidateRaw.id,
      email: candidateRaw.email,
      emailVerified: candidateRaw.emailVerified,
      name: candidateRaw.name,
      phoneNumber: candidateRaw.phoneNumber,
      nationality: candidateRaw.nationality,
      birthDate: candidateRaw.birthDate?.toISOString() ?? null,
      gender: candidateRaw.gender,
      jobTitle: candidateRaw.jobTitle,
      affiliation: candidateRaw.affiliation,
      adminMemo: candidateRaw.adminMemo,
      profile: {
        workPermit: candidateRaw.candidateProfile?.workPermit ?? null,
        visaType: candidateRaw.candidateProfile?.visaType ?? null,
        visaExpiryDate: candidateRaw.candidateProfile?.visaExpiryDate?.toISOString() ?? null,
        livesInKorea: candidateRaw.candidateProfile?.livesInKorea ?? null,
        hasAccommodation: candidateRaw.candidateProfile?.hasAccommodation ?? null,
        residenceProvince: candidateRaw.candidateProfile?.residenceProvince ?? null,
        residenceDistrict: candidateRaw.candidateProfile?.residenceDistrict ?? null,
        residenceAddress: candidateRaw.candidateProfile?.residenceAddress ?? null,
        preferredProgramDuration: candidateRaw.candidateProfile?.preferredProgramDuration ?? null,
        programStartOption: candidateRaw.candidateProfile?.programStartOption ?? null,
        programStartDate: candidateRaw.candidateProfile?.programStartDate?.toISOString() ?? null,
        preferredIndustries: candidateRaw.candidateProfile?.preferredIndustries ?? [],
        preferredJobRoles: (candidateRaw.candidateProfile?.preferredJobRoles ?? []).map((role) => String(role)),
        skills: candidateRaw.candidateProfile?.skills ?? [],
        selfIntroduction: candidateRaw.candidateProfile?.selfIntroduction ?? null,
        programMotivation: candidateRaw.candidateProfile?.programMotivation ?? null,
        languages: (candidateRaw.candidateProfile?.languageSkills ?? []).map((lang) => ({
          language: lang.language,
          level: lang.level
        })),
        educations: (candidateRaw.candidateProfile?.educations ?? []).map((edu) => ({
          educationType: edu.educationType,
          major: edu.major,
          status: edu.status
        })),
        careers: (candidateRaw.candidateProfile?.careers ?? []).map((career) => ({
          companyName: career.companyName,
          position: career.position,
          description: career.description,
          startDate: career.startDate?.toISOString() ?? null,
          endDate: career.endDate?.toISOString() ?? null,
          isCurrent: career.isCurrent
        })),
        activities: (candidateRaw.candidateProfile?.activityExperiences ?? []).map((activity) => ({
          activityType: activity.activityType,
          title: activity.title,
          organization: activity.organization,
          description: activity.description,
          skills: activity.skills,
          startDate: activity.startDate?.toISOString() ?? null,
          endDate: activity.endDate?.toISOString() ?? null
        })),
        emergencyContactName: candidateRaw.candidateProfile?.emergencyContactName ?? null,
        emergencyContactRelation: candidateRaw.candidateProfile?.emergencyContactRelation ?? null,
        emergencyContactPhone: candidateRaw.candidateProfile?.emergencyContactPhone ?? null,
        emergencyContactEmail: candidateRaw.candidateProfile?.emergencyContactEmail ?? null,
        emergencyContactAddress: candidateRaw.candidateProfile?.emergencyContactAddress ?? null
      }
    };

    const positionById = new Map(positionPool.map((item) => [item.id, item]));

    const directMatches = await generatePositionMatchesWithOpenAI({
      candidate: candidateForMatch,
      positions: positionsForMatch,
      limit
    });

    const matches = directMatches.matches
      .map((entry) => {
        const found = positionById.get(entry.item.id);
        if (!found) return null;
        return {
          position: {
            id: found.id,
            title: found.title,
            status: found.status,
            preferredJobRole: found.preferredJobRole,
            partnerOrganization: found.partnerOrganization
          },
          score: entry.score,
          reasons: entry.reasons,
          feedback: entry.feedback
        };
      })
      .filter(
        (entry): entry is {
          position: {
            id: string;
            title: string;
            status: PositionStatus;
            preferredJobRole: string | null;
            partnerOrganization: { id: string; name: string; domain: string; industry: PartnerIndustry } | null;
          };
          score: number;
          reasons: string[];
          feedback: string[];
        } => Boolean(entry)
      );

    logMatchingEvent("run.request.succeeded", {
      mode: parsed.data.mode,
      source: directMatches.source,
      matchCount: matches.length,
      elapsedMs: Date.now() - requestStartedAt
    });

    try {
      const history = getMatchingHistoryDelegate();
      if (history?.create) {
        await history.create({
          data: {
            mode: parsed.data.mode,
            source: directMatches.source,
            candidateId: candidateRaw.id,
            candidateLabel: candidateRaw.name || candidateRaw.email,
            resultCount: matches.length,
            ranAt: new Date(),
            results: matches.map((match) => ({
              positionId: match.position.id,
              positionTitle: match.position.title,
              partnerName: match.position.partnerOrganization?.name ?? null,
              score: match.score,
              reasons: match.reasons,
              feedback: match.feedback
            }))
          }
        });
      } else {
        logMatchingEvent("history.save.skipped", {
          mode: parsed.data.mode,
          reason: "delegate_unavailable"
        });
      }
    } catch (historyError) {
      logMatchingEvent("history.save.failed", {
        mode: parsed.data.mode,
        error: getErrorMessage(historyError)
      });
    }

    return res.json({
      ok: true,
      mode: parsed.data.mode,
      source: directMatches.source,
      ranAt: new Date().toISOString(),
      candidate: toSafeUser(candidateRaw),
      matches
    });
  } catch (error) {
    logMatchingEvent("run.request.failed", {
      mode: parsed.data.mode,
      elapsedMs: Date.now() - requestStartedAt,
      error: getErrorMessage(error)
    });
    return res.status(500).json({ ok: false, message: `failed to run matching: ${getErrorMessage(error)}` });
  }
});

app.get("/ops/matching/history", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = listMatchingHistoryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsed.error.flatten() });
  }

  const page = parsed.data.page ?? 1;
  const pageSize = parsed.data.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  try {
    const history = getMatchingHistoryDelegate();
    if (!history?.findMany || !history?.count) {
      return res.json({
        ok: true,
        items: [],
        pagination: { page, pageSize, total: 0, totalPages: 1 }
      });
    }
    const [items, total] = await Promise.all([
      history.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize
      }),
      history.count()
    ]);

    return res.json({
      ok: true,
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to fetch matching history" });
  }
});

app.get("/ops/positions", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = listPositionsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsed.error.flatten() });
  }

  const {
    search,
    status,
    partnerOrganizationId,
    partnerIndustry,
    partnerCompanySize,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    pageSize = 20
  } = parsed.data;

  const orderByMap = {
    title: { title: sortOrder },
    status: { status: sortOrder },
    hiringCount: { hiringCount: sortOrder },
    createdAt: { createdAt: sortOrder }
  } as const;
  const orderBy = orderByMap[sortBy];

  const where: Prisma.PositionWhereInput = {
    ...(status ? { status } : {}),
    ...(partnerOrganizationId ? { partnerOrganizationId } : {}),
    ...(partnerIndustry || partnerCompanySize
      ? {
          partnerOrganization: {
            ...(partnerIndustry ? { industry: partnerIndustry } : {}),
            ...(partnerCompanySize ? { companySize: partnerCompanySize } : {})
          }
        }
      : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { preferredJobRole: { contains: search, mode: Prisma.QueryMode.insensitive } },
            {
              partnerOrganization: {
                name: { contains: search, mode: Prisma.QueryMode.insensitive }
              }
            }
          ]
        }
      : {})
  };

  const [total, items] = await Promise.all([
    prisma.position.count({ where }),
    prisma.position.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        partnerOrganization: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        },
        matchingParticipants: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        progressLogs: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        statusHistories: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })
  ]);

  return res.json({
    ok: true,
    items: items.map(toPosition),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  });
});

app.post("/ops/positions", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = createPositionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const created = await prisma.position.create({
      data: {
        partnerOrganizationId: parsed.data.partnerOrganizationId,
        title: parsed.data.title,
        status: parsed.data.status ?? PositionStatus.DRAFT,
        workType: parsed.data.workType ?? "On-site",
        thumbnailImages: normalizeStringArray(parsed.data.thumbnailImages).slice(0, 5),
        eligibleVisas: normalizeStringArray(parsed.data.eligibleVisas),
        preferredNationalities: normalizeStringArray(parsed.data.preferredNationalities),
        communicationLanguages: normalizeStringArray(parsed.data.communicationLanguages),
        hiringProcess: parsed.data.hiringProcess,
        preferredJobRole: parsed.data.preferredJobRole,
        hiringCount: parsed.data.hiringCount,
        workingHours: parsed.data.workingHours,
        workLocation: parsed.data.workLocation,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        mainResponsibilities: parsed.data.mainResponsibilities,
        requiredQualifications: parsed.data.requiredQualifications,
        preferredQualifications: parsed.data.preferredQualifications,
        dressCode: parsed.data.dressCode,
        wantsPreTraining: parsed.data.wantsPreTraining,
        additionalNotes: parsed.data.additionalNotes,
        adminMemo: parsed.data.adminMemo,
        matchingParticipants: {
          create: normalizeStringArray(parsed.data.matchingParticipants).map((name) => ({
            name,
            createdByUserId: req.auth!.userId
          }))
        },
        progressLogs: {
          create: normalizeStringArray(parsed.data.postingProgressLogs).map((message) => ({
            message,
            createdByUserId: req.auth!.userId
          }))
        },
        statusHistories: {
          create: {
            fromStatus: null,
            toStatus: parsed.data.status ?? PositionStatus.DRAFT,
            note: "공고 생성",
            createdByUserId: req.auth!.userId
          }
        }
      },
      include: {
        partnerOrganization: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        },
        matchingParticipants: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        progressLogs: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        statusHistories: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    return res.status(201).json({ ok: true, item: toPosition(created) });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2003") {
      return res.status(400).json({ ok: false, message: "invalid partner organization" });
    }
    return res.status(500).json({ ok: false, message: "failed to create position" });
  }
});

app.patch("/ops/positions/:id", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid position id" });
  }

  const parsed = updatePositionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const current = await prisma.position.findUnique({
      where: { id },
      select: { status: true, adminMemo: true }
    });
    if (!current) {
      return res.status(404).json({ ok: false, message: "position not found" });
    }

    const nextStatus = parsed.data.status;
    const shouldWriteStatusHistory = nextStatus !== undefined && nextStatus !== current.status;

    const updated = await prisma.position.update({
      where: { id },
      data: {
        ...(parsed.data.partnerOrganizationId !== undefined ? { partnerOrganizationId: parsed.data.partnerOrganizationId } : {}),
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(parsed.data.workType !== undefined ? { workType: parsed.data.workType } : {}),
        ...(parsed.data.thumbnailImages !== undefined
          ? { thumbnailImages: normalizeStringArray(parsed.data.thumbnailImages).slice(0, 5) }
          : {}),
        ...(parsed.data.eligibleVisas !== undefined
          ? { eligibleVisas: normalizeStringArray(parsed.data.eligibleVisas) }
          : {}),
        ...(parsed.data.preferredNationalities !== undefined
          ? { preferredNationalities: normalizeStringArray(parsed.data.preferredNationalities) }
          : {}),
        ...(parsed.data.communicationLanguages !== undefined
          ? { communicationLanguages: normalizeStringArray(parsed.data.communicationLanguages) }
          : {}),
        ...(parsed.data.hiringProcess !== undefined ? { hiringProcess: parsed.data.hiringProcess } : {}),
        ...(parsed.data.preferredJobRole !== undefined ? { preferredJobRole: parsed.data.preferredJobRole } : {}),
        ...(parsed.data.hiringCount !== undefined ? { hiringCount: parsed.data.hiringCount } : {}),
        ...(parsed.data.workingHours !== undefined ? { workingHours: parsed.data.workingHours } : {}),
        ...(parsed.data.workLocation !== undefined ? { workLocation: parsed.data.workLocation } : {}),
        ...(parsed.data.startDate !== undefined
          ? { startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null }
          : {}),
        ...(parsed.data.mainResponsibilities !== undefined ? { mainResponsibilities: parsed.data.mainResponsibilities } : {}),
        ...(parsed.data.requiredQualifications !== undefined ? { requiredQualifications: parsed.data.requiredQualifications } : {}),
        ...(parsed.data.preferredQualifications !== undefined ? { preferredQualifications: parsed.data.preferredQualifications } : {}),
        ...(parsed.data.dressCode !== undefined ? { dressCode: parsed.data.dressCode } : {}),
        ...(parsed.data.wantsPreTraining !== undefined ? { wantsPreTraining: parsed.data.wantsPreTraining } : {}),
        ...(parsed.data.additionalNotes !== undefined ? { additionalNotes: parsed.data.additionalNotes } : {}),
        ...(parsed.data.adminMemo !== undefined
          ? {
              adminMemo: mergePremiumBannerMeta(
                parsed.data.adminMemo,
                extractPremiumBannerMeta(current.adminMemo)
              )
            }
          : {}),
        ...(shouldWriteStatusHistory
          ? {
              statusHistories: {
                create: {
                  fromStatus: current.status,
                  toStatus: nextStatus!,
                  note: "상태 변경",
                  createdByUserId: req.auth!.userId
                }
              }
            }
          : {})
      },
      include: {
        partnerOrganization: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        },
        matchingParticipants: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        progressLogs: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        statusHistories: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });
    return res.json({ ok: true, item: toPosition(updated) });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2025") {
      return res.status(404).json({ ok: false, message: "position not found" });
    }
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2003") {
      return res.status(400).json({ ok: false, message: "invalid partner organization" });
    }
    return res.status(500).json({ ok: false, message: "failed to update position" });
  }
});

app.get("/ops/positions/premium-banners", authenticate, requireRoles([MemberRole.OPERATOR]), async (_req, res) => {
  const items = await prisma.position.findMany({
    where: {
      status: { in: [PositionStatus.OPEN, PositionStatus.MATCHING] }
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      partnerOrganization: {
        select: {
          id: true,
          name: true,
          domain: true
        }
      }
    }
  });

  return res.json({
    ok: true,
    items: items
      .map((item) => {
        const premiumBanner = extractPremiumBannerMeta(item.adminMemo);
        return {
          id: item.id,
          title: item.title,
          status: item.status,
          createdAt: item.createdAt,
          partnerOrganization: item.partnerOrganization,
          premiumBanner
        };
      })
      .filter((item) => item.premiumBanner?.enabled)
      .sort((a, b) => {
        const aPriority = a.premiumBanner?.priority ?? 9_999;
        const bPriority = b.premiumBanner?.priority ?? 9_999;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
  });
});

app.patch("/ops/positions/:id/premium-banner", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid position id" });
  }

  const parsed = updatePositionPremiumBannerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const current = await prisma.position.findUnique({
      where: { id },
      select: { adminMemo: true }
    });
    if (!current) {
      return res.status(404).json({ ok: false, message: "position not found" });
    }

    const normalizedMeta: PositionPremiumBannerMeta = {
      enabled: parsed.data.enabled,
      bannerImageUrl: parsed.data.bannerImageUrl?.trim() || null,
      bannerTitle: parsed.data.bannerTitle?.trim() || null,
      bannerSubtitle: parsed.data.bannerSubtitle?.trim() || null,
      priority: parsed.data.priority ?? null
    };

    const mergedAdminMemo = parsed.data.enabled
      ? mergePremiumBannerMeta(current.adminMemo, normalizedMeta)
      : mergePremiumBannerMeta(current.adminMemo, null);

    const updated = await prisma.position.update({
      where: { id },
      data: {
        adminMemo: mergedAdminMemo
      },
      include: {
        partnerOrganization: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        },
        matchingParticipants: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        progressLogs: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        statusHistories: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    return res.json({ ok: true, item: toPosition(updated) });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to update premium banner" });
  }
});

app.patch("/ops/positions/:id/status", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid position id" });
  }

  const parsed = updatePositionStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const current = await prisma.position.findUnique({
      where: { id },
      select: { status: true }
    });
    if (!current) {
      return res.status(404).json({ ok: false, message: "position not found" });
    }

    const updated = await prisma.position.update({
      where: { id },
      data: {
        status: parsed.data.status,
        statusHistories: {
          create: {
            fromStatus: current.status,
            toStatus: parsed.data.status,
            note: parsed.data.note,
            createdByUserId: req.auth!.userId
          }
        }
      },
      include: {
        partnerOrganization: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        },
        matchingParticipants: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        progressLogs: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        statusHistories: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });
    return res.json({ ok: true, item: toPosition(updated) });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to update position status" });
  }
});

app.post("/ops/positions/:id/participants", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid position id" });
  }

  const parsed = addPositionParticipantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const created = await prisma.positionMatchingParticipant.create({
      data: {
        positionId: id,
        name: parsed.data.name,
        note: parsed.data.note,
        createdByUserId: req.auth!.userId
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    return res.status(201).json({ ok: true, item: created });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to add participant" });
  }
});

app.delete("/ops/positions/:id/participants/:participantId", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const positionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const participantId = Array.isArray(req.params.participantId) ? req.params.participantId[0] : req.params.participantId;
  if (!positionId || !participantId) {
    return res.status(400).json({ ok: false, message: "invalid request" });
  }

  try {
    await prisma.positionMatchingParticipant.deleteMany({
      where: { id: participantId, positionId }
    });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to remove participant" });
  }
});

app.post("/ops/positions/:id/logs", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid position id" });
  }

  const parsed = addPositionProgressLogSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const created = await prisma.positionProgressLog.create({
      data: {
        positionId: id,
        message: parsed.data.message,
        createdByUserId: req.auth!.userId
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    return res.status(201).json({ ok: true, item: created });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to add progress log" });
  }
});

app.post("/auth/business-email/send-verification", async (req, res) => {
  const parsed = businessEmailSendVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendAuthError(res, 400, "INVALID_REQUEST", "invalid request", { errors: parsed.error.flatten() });
  }

  if (!isBusinessEmail(parsed.data.email)) {
    return sendAuthError(res, 400, "BUSINESS_EMAIL_REQUIRED", "business account requires a company email");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true }
  });
  if (existingUser) {
    return sendAuthError(res, 409, "EMAIL_ALREADY_EXISTS", "email already exists");
  }

  const locale = resolveEmailLocale(req, parsed.data.locale);
  const { email, code } = await createSignupEmailPreverificationCode(parsed.data.email);
  const delivery = await sendSignupEmailPreverificationCode(email, code, locale);

  return res.json({
    ok: true,
    sent: true,
    verificationDelivery: delivery.delivery,
    ...(isProduction ? {} : { verificationCode: delivery.code })
  });
});

app.post("/auth/business-email/verify", async (req, res) => {
  const parsed = businessEmailVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    return sendAuthError(res, 400, "INVALID_REQUEST", "invalid request", { errors: parsed.error.flatten() });
  }

  const token = await prisma.emailPreverificationToken.findFirst({
    where: {
      email: parsed.data.email,
      usedAt: null
    },
    orderBy: { createdAt: "desc" }
  });
  if (!token) {
    return sendAuthError(res, 400, "INVALID_EMAIL_PREVERIFICATION_CODE", "invalid business email verification code");
  }
  if (token.expiresAt.getTime() < Date.now()) {
    return sendAuthError(res, 400, "EXPIRED_EMAIL_PREVERIFICATION_CODE", "expired business email verification code");
  }

  const inputHash = hashToken(parsed.data.code);
  if (inputHash !== token.codeHash) {
    return sendAuthError(res, 400, "INVALID_EMAIL_PREVERIFICATION_CODE", "invalid business email verification code");
  }

  await prisma.emailPreverificationToken.update({
    where: { id: token.id },
    data: { verifiedAt: new Date() }
  });

  return res.json({ ok: true, verified: true });
});

app.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const hasBusinessEmailIssue = parsed.error.issues.some((issue) => issue.message === "business account requires a company email");
    return sendAuthError(
      res,
      400,
      hasBusinessEmailIssue ? "BUSINESS_EMAIL_REQUIRED" : "INVALID_REQUEST",
      hasBusinessEmailIssue ? "business account requires a company email" : "invalid request",
      { errors: parsed.error.flatten() }
    );
  }

  const resolvedRole = parsed.data.role ?? (parsed.data.accountType === "BUSINESS" ? MemberRole.PARTNER : MemberRole.STUDENT);
  const resolvedPartnerType = resolvedRole === MemberRole.PARTNER ? PartnerType.COMPANY : null;
  const resolvedPartnerOrgRole =
    resolvedRole === MemberRole.PARTNER ? (parsed.data.partnerOrgRole ?? PartnerOrgUserRole.MEMBER) : null;
  const passwordHash = await hashPassword(parsed.data.password);
  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true }
  });
  if (existingUser) {
    return sendAuthError(res, 409, "EMAIL_ALREADY_EXISTS", "email already exists");
  }

  let preverifiedTokenId: string | null = null;
  if (resolvedRole === MemberRole.PARTNER) {
    const preverified = await prisma.emailPreverificationToken.findFirst({
      where: {
        email: normalizedEmail,
        verifiedAt: { not: null },
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { verifiedAt: "desc" }
    });
    if (!preverified) {
      return sendAuthError(
        res,
        403,
        "EMAIL_PREVERIFICATION_REQUIRED",
        "business email verification is required before registration"
      );
    }
    preverifiedTokenId = preverified.id;
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          emailVerified: resolvedRole === MemberRole.PARTNER,
          realName: parsed.data.realName?.trim() || null,
          name: parsed.data.name,
          phoneNumber: parsed.data.phoneNumber,
          jobTitle: parsed.data.jobTitle,
          passwordHash,
          role: resolvedRole,
          partnerType: resolvedPartnerType,
          partnerOrgRole: resolvedPartnerOrgRole
        }
      });

      if (resolvedRole === MemberRole.PARTNER) {
        const domain = extractDomainFromEmail(normalizedEmail);
        if (domain) {
          await tx.partnerOrganization.upsert({
            where: { domain },
            update: {},
            create: {
              partnerType: PartnerType.COMPANY,
              domain,
              name: parsed.data.partnerOrganizationName?.trim() || "",
              industry: parsed.data.partnerOrganizationIndustry ?? PartnerIndustry.IT,
              companySize: parsed.data.partnerOrganizationCompanySize,
              adminMemo: "Auto-created from partner registration."
            }
          });
        }
        if (preverifiedTokenId) {
          await tx.emailPreverificationToken.update({
            where: { id: preverifiedTokenId },
            data: { usedAt: new Date() }
          });
        }
      }

      return user;
    });

    if (created.emailVerified) {
      const { accessToken, refreshToken } = await issueAuthTokens(created);
      setRefreshTokenCookie(res, refreshToken);
      return res.status(201).json({
        ok: true,
        requiresEmailVerification: false,
        email: created.email,
        token: accessToken,
        accessToken,
        user: toSafeUser(created)
      });
    }

    const { token } = await createEmailVerificationToken(created.id);
    const locale = resolveEmailLocale(req, parsed.data.locale);
    const delivery = await sendVerificationEmail(created.email, token, locale);

    return res.status(201).json({
      ok: true,
      requiresEmailVerification: true,
      email: created.email,
      verificationDelivery: delivery.delivery,
      ...(isProduction ? {} : { verifyUrl: delivery.verifyUrl })
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return sendAuthError(res, 409, "EMAIL_ALREADY_EXISTS", "email already exists");
      }
      if (error.code === "P2025") {
        return sendAuthError(
          res,
          403,
          "EMAIL_PREVERIFICATION_REQUIRED",
          "business email verification is required before registration"
        );
      }
    }
    const detail = getErrorMessage(error);
    console.error("[auth/register] failed", error);
    return sendAuthError(
      res,
      500,
      "REGISTRATION_FAILED",
      "failed to register",
      isProduction ? undefined : { detail }
    );
  }
});

app.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendAuthError(res, 400, "INVALID_REQUEST", "invalid request", { errors: parsed.error.flatten() });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return sendAuthError(res, 401, "INVALID_CREDENTIALS", "invalid credentials");
  }

  const matched = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!matched) {
    return sendAuthError(res, 401, "INVALID_CREDENTIALS", "invalid credentials");
  }
  if (!user.emailVerified) {
    return sendAuthError(res, 403, "EMAIL_VERIFICATION_REQUIRED", "email verification is required", {
      email: user.email
    });
  }

  const { accessToken, refreshToken } = await issueAuthTokens(user);
  setRefreshTokenCookie(res, refreshToken);
  return res.json({
    ok: true,
    token: accessToken,
    accessToken,
    user: toSafeUser(user)
  });
});

app.post("/auth/verify-email", async (req, res) => {
  const parsed = emailVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendAuthError(res, 400, "INVALID_REQUEST", "invalid request", { errors: parsed.error.flatten() });
  }

  const tokenHash = hashToken(parsed.data.token);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });
  if (!record || record.usedAt) {
    return sendAuthError(res, 400, "INVALID_EMAIL_VERIFICATION_TOKEN", "invalid email verification token");
  }
  if (record.expiresAt.getTime() < Date.now()) {
    return sendAuthError(res, 400, "EXPIRED_EMAIL_VERIFICATION_TOKEN", "expired email verification token");
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: record.userId },
      data: { emailVerified: true }
    });

    await tx.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() }
    });
    await tx.emailVerificationToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() }
    });

    return user;
  });

  const { accessToken, refreshToken } = await issueAuthTokens(updatedUser);
  setRefreshTokenCookie(res, refreshToken);

  return res.json({
    ok: true,
    token: accessToken,
    accessToken,
    user: toSafeUser(updatedUser)
  });
});

app.post("/auth/resend-verification", async (req, res) => {
  const parsed = resendVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendAuthError(res, 400, "INVALID_REQUEST", "invalid request", { errors: parsed.error.flatten() });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  });

  if (!user) {
    return res.json({ ok: true, sent: false });
  }
  if (user.emailVerified) {
    return res.json({ ok: true, sent: false, alreadyVerified: true });
  }

  const { token } = await createEmailVerificationToken(user.id);
  const locale = resolveEmailLocale(req, parsed.data.locale);
  const delivery = await sendVerificationEmail(user.email, token, locale);

  return res.json({
    ok: true,
    sent: true,
    verificationDelivery: delivery.delivery,
    ...(isProduction ? {} : { verifyUrl: delivery.verifyUrl })
  });
});

app.post("/auth/refresh", async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  if (!refreshToken) {
    return sendAuthError(res, 401, "MISSING_REFRESH_TOKEN", "missing refresh token");
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    return sendAuthError(res, 401, "INVALID_REFRESH_TOKEN", "invalid refresh token");
  }

  const storedToken = await prisma.refreshToken.findUnique({ where: { id: decoded.jti } });
  const hashed = hashToken(refreshToken);

  if (
    !storedToken ||
    storedToken.userId !== decoded.sub ||
    storedToken.tokenHash !== hashed ||
    storedToken.revokedAt ||
    storedToken.expiresAt.getTime() <= Date.now()
  ) {
    return sendAuthError(res, 401, "REFRESH_TOKEN_REVOKED", "refresh token expired or revoked");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user) {
    return sendAuthError(res, 404, "USER_NOT_FOUND", "user not found");
  }
  if (!user.emailVerified) {
    return sendAuthError(res, 403, "EMAIL_VERIFICATION_REQUIRED", "email verification is required", {
      email: user.email
    });
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() }
  });

  const { accessToken, refreshToken: nextRefreshToken } = await issueAuthTokens(user);
  setRefreshTokenCookie(res, nextRefreshToken);
  return res.json({
    ok: true,
    token: accessToken,
    accessToken,
    user: toSafeUser(user)
  });
});

app.post("/auth/logout", async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  if (!refreshToken) {
    clearRefreshTokenCookie(res);
    return res.json({ ok: true });
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    clearRefreshTokenCookie(res);
    return res.json({ ok: true });
  }

  const hashed = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: {
      id: decoded.jti,
      userId: decoded.sub,
      tokenHash: hashed,
      revokedAt: null
    },
    data: { revokedAt: new Date() }
  });

  clearRefreshTokenCookie(res);
  return res.json({ ok: true });
});

app.get("/auth/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) {
    return res.status(404).json({ ok: false, message: "user not found" });
  }

  return res.json({ ok: true, user: toSafeUser(user) });
});

app.patch("/members/me", authenticate, requireRoles([MemberRole.STUDENT, MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  const id = req.auth!.userId;
  const parsed = updateMyBasicInfoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(parsed.data.realName !== undefined ? { realName: parsed.data.realName?.trim() || null } : {}),
        ...(parsed.data.name !== undefined ? { name: parsed.data.name?.trim() || null } : {}),
        ...(parsed.data.phoneNumber !== undefined ? { phoneNumber: parsed.data.phoneNumber?.trim() || null } : {}),
        ...(parsed.data.birthDate !== undefined ? { birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null } : {}),
        ...(parsed.data.gender !== undefined ? { gender: parsed.data.gender?.trim() || null } : {})
      }
    });

    return res.json({ ok: true, item: toSafeUser(updated) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ ok: false, message: "user not found" });
    }
    return res.status(500).json({ ok: false, message: "failed to update my profile" });
  }
});

app.get("/members/me/partner-organization", authenticate, requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: { email: true }
  });

  if (!user) {
    return res.status(404).json({ ok: false, message: "user not found" });
  }

  const domain = extractDomainFromEmail(user.email);
  if (!domain) {
    return res.json({ ok: true, item: null });
  }

  const item = await prisma.partnerOrganization.findUnique({
    where: { domain }
  });

  if (!item) {
    return res.json({ ok: true, item: null });
  }

  const memberCount = await prisma.user.count({
    where: {
      role: MemberRole.PARTNER,
      email: { endsWith: `@${item.domain}` }
    }
  });

  return res.json({ ok: true, item: toPartnerOrganization({ ...item, memberCount }, { includeVerificationAssets: true }) });
});

app.patch("/members/me/partner-organization", authenticate, requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  const parsed = updateMyPartnerOrganizationBasicSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: { email: true }
  });

  if (!user) {
    return res.status(404).json({ ok: false, message: "user not found" });
  }

  const domain = extractDomainFromEmail(user.email);
  if (!domain) {
    return res.status(404).json({ ok: false, message: "partner organization not found" });
  }

  try {
    const orgByDomain = await prisma.partnerOrganization.findUnique({
      where: { domain },
      select: { id: true }
    });

    // If organization does not exist yet, bootstrap it from partner account domain.
    const updated = await prisma.partnerOrganization.upsert({
      where: { domain },
      update: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
        ...(parsed.data.industry !== undefined ? { industry: parsed.data.industry } : {}),
        ...(parsed.data.website !== undefined ? { website: parsed.data.website?.trim() || null } : {}),
        ...(parsed.data.officeAddress !== undefined ? { officeAddress: parsed.data.officeAddress?.trim() || null } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description?.trim() || null } : {}),
        ...(parsed.data.businessRegistrationDocumentData !== undefined
          ? { businessRegistrationDocumentData: parsed.data.businessRegistrationDocumentData?.trim() || null }
          : {}),
        ...(parsed.data.fourInsuranceSubscriberListData !== undefined
          ? { fourInsuranceSubscriberListData: parsed.data.fourInsuranceSubscriberListData?.trim() || null }
          : {}),
        ...(parsed.data.companyLogoImageData !== undefined
          ? { companyLogoImageData: parsed.data.companyLogoImageData?.trim() || null }
          : {}),
        ...(parsed.data.officePhotoImageData !== undefined
          ? { officePhotoImageData: parsed.data.officePhotoImageData?.trim() || null }
          : {})
      },
      create: {
        partnerType: PartnerType.COMPANY,
        domain,
        name: parsed.data.name?.trim() || "",
        industry: parsed.data.industry ?? PartnerIndustry.IT,
        website: parsed.data.website?.trim() || null,
        officeAddress: parsed.data.officeAddress?.trim() || null,
        description: parsed.data.description?.trim() || null,
        businessRegistrationDocumentData: parsed.data.businessRegistrationDocumentData?.trim() || null,
        fourInsuranceSubscriberListData: parsed.data.fourInsuranceSubscriberListData?.trim() || null,
        companyLogoImageData: parsed.data.companyLogoImageData?.trim() || null,
        officePhotoImageData: parsed.data.officePhotoImageData?.trim() || null,
        adminMemo: orgByDomain ? undefined : "Auto-created from partner profile edit."
      }
    });

    const memberCount = await prisma.user.count({
      where: {
        role: MemberRole.PARTNER,
        email: { endsWith: `@${updated.domain}` }
      }
    });

    return res.json({ ok: true, item: toPartnerOrganization({ ...updated, memberCount }, { includeVerificationAssets: true }) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ ok: false, message: "partner organization not found" });
    }
    return res.status(500).json({ ok: false, message: "failed to update partner organization" });
  }
});

app.get("/members/me/profile", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const id = req.auth!.userId;

  try {
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: id },
      include: {
        educations: {
          orderBy: { createdAt: "desc" }
        },
        languageSkills: {
          orderBy: { createdAt: "desc" }
        },
        careers: {
          orderBy: { createdAt: "desc" }
        },
        activityExperiences: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    return res.json({ ok: true, item: toCandidateProfile(profile) });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to load my candidate profile" });
  }
});

app.patch("/members/me/profile", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const id = req.auth!.userId;

  const parsed = updateCandidateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const data = {
      ...(parsed.data.workPermit !== undefined ? { workPermit: parsed.data.workPermit } : {}),
      ...(parsed.data.visaType !== undefined ? { visaType: parsed.data.visaType } : {}),
      ...(parsed.data.visaExpiryDate !== undefined
        ? { visaExpiryDate: parsed.data.visaExpiryDate ? new Date(parsed.data.visaExpiryDate) : null }
        : {}),
      ...(parsed.data.livesInKorea !== undefined ? { livesInKorea: parsed.data.livesInKorea } : {}),
      ...(parsed.data.hasAccommodation !== undefined ? { hasAccommodation: parsed.data.hasAccommodation } : {}),
      ...(parsed.data.residenceProvince !== undefined
        ? { residenceProvince: parsed.data.residenceProvince?.trim() || null }
        : {}),
      ...(parsed.data.residenceDistrict !== undefined
        ? { residenceDistrict: parsed.data.residenceDistrict?.trim() || null }
        : {}),
      ...(parsed.data.residenceAddress !== undefined
        ? { residenceAddress: parsed.data.residenceAddress?.trim() || null }
        : {}),
      ...(parsed.data.preferredProgramDuration !== undefined
        ? { preferredProgramDuration: parsed.data.preferredProgramDuration }
        : {}),
      ...(parsed.data.programStartOption !== undefined ? { programStartOption: parsed.data.programStartOption } : {}),
      ...(parsed.data.programStartDate !== undefined
        ? { programStartDate: parsed.data.programStartDate ? new Date(parsed.data.programStartDate) : null }
        : {}),
      ...(parsed.data.preferredIndustries !== undefined ? { preferredIndustries: parsed.data.preferredIndustries } : {}),
      ...(parsed.data.preferredJobRoles !== undefined ? { preferredJobRoles: parsed.data.preferredJobRoles } : {}),
      ...(parsed.data.skills !== undefined
        ? {
            skills: Array.from(
              new Set(
                parsed.data.skills
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            )
          }
        : {}),
      ...(parsed.data.selfIntroduction !== undefined ? { selfIntroduction: parsed.data.selfIntroduction?.trim() || null } : {}),
      ...(parsed.data.programMotivation !== undefined ? { programMotivation: parsed.data.programMotivation?.trim() || null } : {}),
      ...(parsed.data.preferenceConditionNote !== undefined
        ? { preferenceConditionNote: parsed.data.preferenceConditionNote?.trim() || null }
        : {}),
      ...(parsed.data.capabilityNote !== undefined ? { capabilityNote: parsed.data.capabilityNote?.trim() || null } : {}),
      ...(parsed.data.additionalInfoNote !== undefined
        ? { additionalInfoNote: parsed.data.additionalInfoNote?.trim() || null }
        : {}),
      ...(parsed.data.emergencyContactName !== undefined
        ? { emergencyContactName: parsed.data.emergencyContactName?.trim() || null }
        : {}),
      ...(parsed.data.emergencyContactRelation !== undefined
        ? { emergencyContactRelation: parsed.data.emergencyContactRelation?.trim() || null }
        : {}),
      ...(parsed.data.emergencyContactPhone !== undefined
        ? { emergencyContactPhone: parsed.data.emergencyContactPhone?.trim() || null }
        : {}),
      ...(parsed.data.emergencyContactEmail !== undefined
        ? { emergencyContactEmail: parsed.data.emergencyContactEmail?.trim() || null }
        : {}),
      ...(parsed.data.emergencyContactAddress !== undefined
        ? { emergencyContactAddress: parsed.data.emergencyContactAddress?.trim() || null }
        : {}),
      ...(parsed.data.matchingResultNote !== undefined
        ? { matchingResultNote: parsed.data.matchingResultNote?.trim() || null }
        : {})
    };

    const updated = await prisma.candidateProfile.upsert({
      where: { userId: id },
      create: {
        userId: id,
        ...data
      },
      update: data
    });

    return res.json({ ok: true, item: toCandidateProfile(updated) });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to update my candidate profile" });
  }
});

app.get("/members/me/positions/favorites", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const userId = req.auth!.userId;
  try {
    const profile = await getOrCreateCandidateProfile(userId);
    const ids = profile.favoritePositionIds ?? [];
    if (ids.length === 0) {
      return res.json({ ok: true, items: [] });
    }
    const items = await prisma.position.findMany({
      where: { id: { in: ids } },
      include: {
        partnerOrganization: {
          select: {
            id: true,
            name: true,
            domain: true,
            industry: true,
            companySize: true,
            officeAddress: true
          }
        },
        matchingParticipants: { select: { id: true } }
      }
    });
    const byId = new Map(items.map((item) => [item.id, item]));
    const ordered = ids.map((id) => byId.get(id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
    return res.json({
      ok: true,
      items: ordered.map((item) => toPublicPositionItem(item, { role: MemberRole.STUDENT, partnerDomain: null }))
    });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to load favorite positions" });
  }
});

app.get("/members/me/positions/applied", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const userId = req.auth!.userId;
  try {
    const profile = await getOrCreateCandidateProfile(userId);
    const ids = profile.appliedPositionIds ?? [];
    if (ids.length === 0) {
      return res.json({ ok: true, items: [] });
    }
    const items = await prisma.position.findMany({
      where: { id: { in: ids } },
      include: {
        partnerOrganization: {
          select: {
            id: true,
            name: true,
            domain: true,
            industry: true,
            companySize: true,
            officeAddress: true
          }
        },
        matchingParticipants: { select: { id: true } }
      }
    });
    const byId = new Map(items.map((item) => [item.id, item]));
    const ordered = ids.map((id) => byId.get(id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
    return res.json({
      ok: true,
      items: ordered.map((item) => toPublicPositionItem(item, { role: MemberRole.STUDENT, partnerDomain: null }))
    });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to load applied positions" });
  }
});

app.post("/members/me/positions/:positionId/favorite", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const userId = req.auth!.userId;
  const parsed = memberPositionActionParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid position id", errors: parsed.error.flatten() });
  }
  const position = await prisma.position.findUnique({
    where: { id: parsed.data.positionId },
    select: { id: true }
  });
  if (!position) return res.status(404).json({ ok: false, message: "position not found" });

  try {
    const profile = await getOrCreateCandidateProfile(userId);
    const set = new Set(profile.favoritePositionIds ?? []);
    set.add(parsed.data.positionId);
    const next = Array.from(set);
    await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: { favoritePositionIds: next }
    });
    return res.json({ ok: true, ids: next });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to add favorite position" });
  }
});

app.delete("/members/me/positions/:positionId/favorite", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const userId = req.auth!.userId;
  const parsed = memberPositionActionParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid position id", errors: parsed.error.flatten() });
  }
  try {
    const profile = await getOrCreateCandidateProfile(userId);
    const next = (profile.favoritePositionIds ?? []).filter((id) => id !== parsed.data.positionId);
    await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: { favoritePositionIds: next }
    });
    return res.json({ ok: true, ids: next });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to remove favorite position" });
  }
});

app.post("/members/me/positions/:positionId/apply", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const userId = req.auth!.userId;
  const parsed = memberPositionActionParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid position id", errors: parsed.error.flatten() });
  }
  const position = await prisma.position.findUnique({
    where: { id: parsed.data.positionId },
    select: { id: true, status: true }
  });
  if (!position) return res.status(404).json({ ok: false, message: "position not found" });
  if (position.status === PositionStatus.DRAFT) {
    return res.status(400).json({ ok: false, message: "cannot apply to draft position" });
  }

  try {
    const profile = await getOrCreateCandidateProfile(userId);
    const set = new Set(profile.appliedPositionIds ?? []);
    set.add(parsed.data.positionId);
    const next = Array.from(set);
    await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: { appliedPositionIds: next }
    });
    return res.json({ ok: true, ids: next });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to apply position" });
  }
});

app.delete("/members/me/positions/:positionId/apply", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const userId = req.auth!.userId;
  const parsed = memberPositionActionParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid position id", errors: parsed.error.flatten() });
  }
  try {
    const profile = await getOrCreateCandidateProfile(userId);
    const next = (profile.appliedPositionIds ?? []).filter((id) => id !== parsed.data.positionId);
    await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: { appliedPositionIds: next }
    });
    return res.json({ ok: true, ids: next });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to cancel applied position" });
  }
});

app.post("/members/me/educations", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const id = req.auth!.userId;

  const parsed = createCandidateEducationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const profile = await getOrCreateCandidateProfile(id);
    const created = await prisma.candidateEducation.create({
      data: {
        candidateProfileId: profile.id,
        schoolName: parsed.data.schoolName,
        educationType: parsed.data.educationType,
        major: parsed.data.major?.trim() || null,
        status: parsed.data.status,
        country: parsed.data.country?.trim() || null,
        city: parsed.data.city?.trim() || null,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        isKoreanSchool: parsed.data.isKoreanSchool ?? null
      }
    });
    return res.status(201).json({ ok: true, item: created });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to create my education" });
  }
});

app.patch("/members/me/educations/:educationId", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const id = req.auth!.userId;
  const educationId = Array.isArray(req.params.educationId) ? req.params.educationId[0] : req.params.educationId;
  if (!educationId) return res.status(400).json({ ok: false, message: "invalid request" });

  const parsed = createCandidateEducationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: id }, select: { id: true } });
    if (!profile) return res.status(404).json({ ok: false, message: "candidate profile not found" });
    const updated = await prisma.candidateEducation.updateMany({
      where: { id: educationId, candidateProfileId: profile.id },
      data: {
        schoolName: parsed.data.schoolName,
        educationType: parsed.data.educationType,
        major: parsed.data.major?.trim() || null,
        status: parsed.data.status,
        country: parsed.data.country?.trim() || null,
        city: parsed.data.city?.trim() || null,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        isKoreanSchool: parsed.data.isKoreanSchool ?? null
      }
    });
    if (updated.count === 0) return res.status(404).json({ ok: false, message: "education not found" });
    const item = await prisma.candidateEducation.findUnique({ where: { id: educationId } });
    return res.json({ ok: true, item });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to update my education" });
  }
});

app.delete("/members/me/educations/:educationId", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const id = req.auth!.userId;
  const educationId = Array.isArray(req.params.educationId) ? req.params.educationId[0] : req.params.educationId;
  if (!educationId) return res.status(400).json({ ok: false, message: "invalid request" });

  try {
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: id }, select: { id: true } });
    if (!profile) return res.status(404).json({ ok: false, message: "candidate profile not found" });
    await prisma.candidateEducation.deleteMany({ where: { id: educationId, candidateProfileId: profile.id } });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to delete my education" });
  }
});

app.post("/members/me/language-skills", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const id = req.auth!.userId;

  const parsed = createCandidateLanguageSkillSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const profile = await getOrCreateCandidateProfile(id);
    const created = await prisma.candidateLanguageSkill.create({
      data: {
        candidateProfileId: profile.id,
        language: parsed.data.language,
        level: parsed.data.level,
        testName: parsed.data.testName?.trim() || null,
        score: parsed.data.score?.trim() || null
      }
    });
    return res.status(201).json({ ok: true, item: created });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to create my language skill" });
  }
});

app.patch("/members/me/language-skills/:languageSkillId", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const id = req.auth!.userId;
  const languageSkillId = Array.isArray(req.params.languageSkillId) ? req.params.languageSkillId[0] : req.params.languageSkillId;
  if (!languageSkillId) return res.status(400).json({ ok: false, message: "invalid request" });

  const parsed = createCandidateLanguageSkillSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: id }, select: { id: true } });
    if (!profile) return res.status(404).json({ ok: false, message: "candidate profile not found" });
    const updated = await prisma.candidateLanguageSkill.updateMany({
      where: { id: languageSkillId, candidateProfileId: profile.id },
      data: {
        language: parsed.data.language,
        level: parsed.data.level,
        testName: parsed.data.testName?.trim() || null,
        score: parsed.data.score?.trim() || null
      }
    });
    if (updated.count === 0) return res.status(404).json({ ok: false, message: "language skill not found" });
    const item = await prisma.candidateLanguageSkill.findUnique({ where: { id: languageSkillId } });
    return res.json({ ok: true, item });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to update my language skill" });
  }
});

app.delete("/members/me/language-skills/:languageSkillId", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const id = req.auth!.userId;
  const languageSkillId = Array.isArray(req.params.languageSkillId) ? req.params.languageSkillId[0] : req.params.languageSkillId;
  if (!languageSkillId) return res.status(400).json({ ok: false, message: "invalid request" });

  try {
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: id }, select: { id: true } });
    if (!profile) return res.status(404).json({ ok: false, message: "candidate profile not found" });
    await prisma.candidateLanguageSkill.deleteMany({ where: { id: languageSkillId, candidateProfileId: profile.id } });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to delete my language skill" });
  }
});

app.post("/members/me/careers", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const id = req.auth!.userId;

  const parsed = createCandidateCareerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const profile = await getOrCreateCandidateProfile(id);
    const isCurrent = parsed.data.isCurrent ?? false;
    const created = await prisma.candidateCareer.create({
      data: {
        candidateProfileId: profile.id,
        companyName: parsed.data.companyName,
        position: parsed.data.position,
        department: parsed.data.department?.trim() || null,
        isCurrent,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: isCurrent ? null : parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        description: parsed.data.description?.trim() || null
      }
    });
    return res.status(201).json({ ok: true, item: created });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to create my career" });
  }
});

app.patch("/members/me/careers/:careerId", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const id = req.auth!.userId;
  const careerId = Array.isArray(req.params.careerId) ? req.params.careerId[0] : req.params.careerId;
  if (!careerId) return res.status(400).json({ ok: false, message: "invalid request" });

  const parsed = createCandidateCareerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: id }, select: { id: true } });
    if (!profile) return res.status(404).json({ ok: false, message: "candidate profile not found" });
    const isCurrent = parsed.data.isCurrent ?? false;
    const updated = await prisma.candidateCareer.updateMany({
      where: { id: careerId, candidateProfileId: profile.id },
      data: {
        companyName: parsed.data.companyName,
        position: parsed.data.position,
        department: parsed.data.department?.trim() || null,
        isCurrent,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: isCurrent ? null : parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        description: parsed.data.description?.trim() || null
      }
    });
    if (updated.count === 0) return res.status(404).json({ ok: false, message: "career not found" });
    const item = await prisma.candidateCareer.findUnique({ where: { id: careerId } });
    return res.json({ ok: true, item });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to update my career" });
  }
});

app.delete("/members/me/careers/:careerId", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const id = req.auth!.userId;
  const careerId = Array.isArray(req.params.careerId) ? req.params.careerId[0] : req.params.careerId;
  if (!careerId) return res.status(400).json({ ok: false, message: "invalid request" });

  try {
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: id }, select: { id: true } });
    if (!profile) return res.status(404).json({ ok: false, message: "candidate profile not found" });
    await prisma.candidateCareer.deleteMany({ where: { id: careerId, candidateProfileId: profile.id } });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to delete my career" });
  }
});

app.post("/members/me/activity-experiences", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const id = req.auth!.userId;

  const parsed = createCandidateActivityExperienceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const profile = await getOrCreateCandidateProfile(id);
    const created = await prisma.candidateActivityExperience.create({
      data: {
        candidateProfileId: profile.id,
        title: parsed.data.title,
        activityType: parsed.data.activityType,
        organization: parsed.data.organization?.trim() || null,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        description: parsed.data.description?.trim() || null,
        skills: parsed.data.skills ?? []
      }
    });
    return res.status(201).json({ ok: true, item: created });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to create my activity experience" });
  }
});

app.patch(
  "/members/me/activity-experiences/:activityExperienceId",
  authenticate,
  requireRoles([MemberRole.STUDENT]),
  async (req, res) => {
    const id = req.auth!.userId;
    const activityExperienceId = Array.isArray(req.params.activityExperienceId)
      ? req.params.activityExperienceId[0]
      : req.params.activityExperienceId;
    if (!activityExperienceId) return res.status(400).json({ ok: false, message: "invalid request" });

    const parsed = createCandidateActivityExperienceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }

    try {
      const profile = await prisma.candidateProfile.findUnique({ where: { userId: id }, select: { id: true } });
      if (!profile) return res.status(404).json({ ok: false, message: "candidate profile not found" });
      const updated = await prisma.candidateActivityExperience.updateMany({
        where: { id: activityExperienceId, candidateProfileId: profile.id },
        data: {
          title: parsed.data.title,
          activityType: parsed.data.activityType,
          organization: parsed.data.organization?.trim() || null,
          startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
          endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
          description: parsed.data.description?.trim() || null,
          skills: parsed.data.skills ?? []
        }
      });
      if (updated.count === 0) return res.status(404).json({ ok: false, message: "activity experience not found" });
      const item = await prisma.candidateActivityExperience.findUnique({ where: { id: activityExperienceId } });
      return res.json({ ok: true, item });
    } catch {
      return res.status(500).json({ ok: false, message: "failed to update my activity experience" });
    }
  }
);

app.delete(
  "/members/me/activity-experiences/:activityExperienceId",
  authenticate,
  requireRoles([MemberRole.STUDENT]),
  async (req, res) => {
    const id = req.auth!.userId;
    const activityExperienceId = Array.isArray(req.params.activityExperienceId)
      ? req.params.activityExperienceId[0]
      : req.params.activityExperienceId;
    if (!activityExperienceId) return res.status(400).json({ ok: false, message: "invalid request" });

    try {
      const profile = await prisma.candidateProfile.findUnique({ where: { userId: id }, select: { id: true } });
      if (!profile) return res.status(404).json({ ok: false, message: "candidate profile not found" });
      await prisma.candidateActivityExperience.deleteMany({
        where: { id: activityExperienceId, candidateProfileId: profile.id }
      });
      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ ok: false, message: "failed to delete my activity experience" });
    }
  }
);

app.get("/members", authenticate, requireRoles([MemberRole.OPERATOR]), async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  res.json({ ok: true, items: users.map(toSafeUser) });
});

app.patch("/ops/candidates/:id/admin-memo", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid user id" });
  }

  const parsed = updatePartnerUserAdminMemoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        adminMemo: parsed.data.adminMemo?.trim() || null
      },
      select: {
        id: true,
        role: true,
        adminMemo: true
      }
    });

    if (updated.role !== MemberRole.STUDENT) {
      return res.status(400).json({ ok: false, message: "target user is not a candidate" });
    }

    return res.json({ ok: true, item: { id: updated.id, adminMemo: updated.adminMemo } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ ok: false, message: "user not found" });
    }
    return res.status(500).json({ ok: false, message: "failed to update candidate admin memo" });
  }
});

app.post("/ops/candidates", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = createCandidateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  const plainPassword = parsed.data.password?.trim() || createTemporaryPassword();
  const passwordHash = await hashPassword(plainPassword);

  try {
    const created = await prisma.user.create({
      data: {
        email: parsed.data.email,
        realName: parsed.data.realName?.trim() || null,
        name: parsed.data.name?.trim() || null,
        phoneNumber: parsed.data.phoneNumber?.trim() || null,
        nationality: parsed.data.nationality?.trim() || null,
        affiliation: parsed.data.affiliation?.trim() || null,
        birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
        gender: parsed.data.gender?.trim() || null,
        jobTitle: parsed.data.jobTitle?.trim() || null,
        passwordHash,
        role: MemberRole.STUDENT
      }
    });

    return res.status(201).json({
      ok: true,
      item: toSafeUser(created)
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
      return res.status(409).json({ ok: false, message: "email already exists" });
    }
    return res.status(500).json({ ok: false, message: "failed to create candidate" });
  }
});

app.patch("/ops/candidates/:id", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid user id" });
  }

  const parsed = updateCandidateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(parsed.data.realName !== undefined ? { realName: parsed.data.realName.trim() || null } : {}),
        ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() || null } : {}),
        ...(parsed.data.phoneNumber !== undefined ? { phoneNumber: parsed.data.phoneNumber.trim() || null } : {}),
        ...(parsed.data.nationality !== undefined ? { nationality: parsed.data.nationality.trim() || null } : {}),
        ...(parsed.data.affiliation !== undefined ? { affiliation: parsed.data.affiliation.trim() || null } : {}),
        ...(parsed.data.birthDate !== undefined ? { birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null } : {}),
        ...(parsed.data.gender !== undefined ? { gender: parsed.data.gender.trim() || null } : {}),
        ...(parsed.data.jobTitle !== undefined ? { jobTitle: parsed.data.jobTitle.trim() || null } : {})
      },
      select: {
        id: true,
        role: true,
        email: true,
        emailVerified: true,
        realName: true,
        name: true,
        phoneNumber: true,
        nationality: true,
        affiliation: true,
        birthDate: true,
        gender: true,
        jobTitle: true,
        adminMemo: true,
        partnerType: true,
        partnerOrgRole: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (updated.role !== MemberRole.STUDENT) {
      return res.status(400).json({ ok: false, message: "target user is not a candidate" });
    }

    return res.json({ ok: true, item: toSafeUser(updated) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ ok: false, message: "user not found" });
    }
    return res.status(500).json({ ok: false, message: "failed to update candidate" });
  }
});

app.get("/ops/candidates/:id/profile", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid user id" });
  }

  try {
    const candidate = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    });

    if (!candidate || candidate.role !== MemberRole.STUDENT) {
      return res.status(404).json({ ok: false, message: "candidate not found" });
    }

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: id },
      include: {
        educations: {
          orderBy: { createdAt: "desc" }
        },
        languageSkills: {
          orderBy: { createdAt: "desc" }
        },
        careers: {
          orderBy: { createdAt: "desc" }
        },
        activityExperiences: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    return res.json({ ok: true, item: toCandidateProfile(profile) });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to load candidate profile" });
  }
});

app.patch("/ops/candidates/:id/profile", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid user id" });
  }

  const parsed = updateCandidateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const candidate = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    });

    if (!candidate || candidate.role !== MemberRole.STUDENT) {
      return res.status(404).json({ ok: false, message: "candidate not found" });
    }

    const data = {
      ...(parsed.data.workPermit !== undefined ? { workPermit: parsed.data.workPermit } : {}),
      ...(parsed.data.visaType !== undefined ? { visaType: parsed.data.visaType } : {}),
      ...(parsed.data.visaExpiryDate !== undefined
        ? { visaExpiryDate: parsed.data.visaExpiryDate ? new Date(parsed.data.visaExpiryDate) : null }
        : {}),
      ...(parsed.data.livesInKorea !== undefined ? { livesInKorea: parsed.data.livesInKorea } : {}),
      ...(parsed.data.hasAccommodation !== undefined ? { hasAccommodation: parsed.data.hasAccommodation } : {}),
      ...(parsed.data.residenceProvince !== undefined
        ? { residenceProvince: parsed.data.residenceProvince?.trim() || null }
        : {}),
      ...(parsed.data.residenceDistrict !== undefined
        ? { residenceDistrict: parsed.data.residenceDistrict?.trim() || null }
        : {}),
      ...(parsed.data.residenceAddress !== undefined
        ? { residenceAddress: parsed.data.residenceAddress?.trim() || null }
        : {}),
      ...(parsed.data.preferredProgramDuration !== undefined
        ? { preferredProgramDuration: parsed.data.preferredProgramDuration }
        : {}),
      ...(parsed.data.programStartOption !== undefined ? { programStartOption: parsed.data.programStartOption } : {}),
      ...(parsed.data.programStartDate !== undefined
        ? { programStartDate: parsed.data.programStartDate ? new Date(parsed.data.programStartDate) : null }
        : {}),
      ...(parsed.data.preferredIndustries !== undefined ? { preferredIndustries: parsed.data.preferredIndustries } : {}),
      ...(parsed.data.preferredJobRoles !== undefined ? { preferredJobRoles: parsed.data.preferredJobRoles } : {}),
      ...(parsed.data.skills !== undefined
        ? {
            skills: Array.from(
              new Set(
                parsed.data.skills
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            )
          }
        : {}),
      ...(parsed.data.selfIntroduction !== undefined ? { selfIntroduction: parsed.data.selfIntroduction?.trim() || null } : {}),
      ...(parsed.data.programMotivation !== undefined ? { programMotivation: parsed.data.programMotivation?.trim() || null } : {}),
      ...(parsed.data.preferenceConditionNote !== undefined
        ? { preferenceConditionNote: parsed.data.preferenceConditionNote?.trim() || null }
        : {}),
      ...(parsed.data.capabilityNote !== undefined ? { capabilityNote: parsed.data.capabilityNote?.trim() || null } : {}),
      ...(parsed.data.additionalInfoNote !== undefined
        ? { additionalInfoNote: parsed.data.additionalInfoNote?.trim() || null }
        : {}),
      ...(parsed.data.emergencyContactName !== undefined
        ? { emergencyContactName: parsed.data.emergencyContactName?.trim() || null }
        : {}),
      ...(parsed.data.emergencyContactRelation !== undefined
        ? { emergencyContactRelation: parsed.data.emergencyContactRelation?.trim() || null }
        : {}),
      ...(parsed.data.emergencyContactPhone !== undefined
        ? { emergencyContactPhone: parsed.data.emergencyContactPhone?.trim() || null }
        : {}),
      ...(parsed.data.emergencyContactEmail !== undefined
        ? { emergencyContactEmail: parsed.data.emergencyContactEmail?.trim() || null }
        : {}),
      ...(parsed.data.emergencyContactAddress !== undefined
        ? { emergencyContactAddress: parsed.data.emergencyContactAddress?.trim() || null }
        : {}),
      ...(parsed.data.matchingResultNote !== undefined
        ? { matchingResultNote: parsed.data.matchingResultNote?.trim() || null }
        : {})
    };

    const updated = await prisma.candidateProfile.upsert({
      where: { userId: id },
      create: {
        userId: id,
        ...data
      },
      update: data
    });

    return res.json({ ok: true, item: toCandidateProfile(updated) });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to update candidate profile" });
  }
});

app.post("/ops/candidates/:id/educations", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ ok: false, message: "invalid user id" });

  const parsed = createCandidateEducationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const candidate = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!candidate || candidate.role !== MemberRole.STUDENT) {
      return res.status(404).json({ ok: false, message: "candidate not found" });
    }
    const profile = await getOrCreateCandidateProfile(id);
    const created = await prisma.candidateEducation.create({
      data: {
        candidateProfileId: profile.id,
        schoolName: parsed.data.schoolName,
        educationType: parsed.data.educationType,
        major: parsed.data.major?.trim() || null,
        status: parsed.data.status,
        country: parsed.data.country?.trim() || null,
        city: parsed.data.city?.trim() || null,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        isKoreanSchool: parsed.data.isKoreanSchool ?? null
      }
    });
    return res.status(201).json({ ok: true, item: created });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to create education" });
  }
});

app.delete("/ops/candidates/:id/educations/:educationId", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const educationId = Array.isArray(req.params.educationId) ? req.params.educationId[0] : req.params.educationId;
  if (!id || !educationId) return res.status(400).json({ ok: false, message: "invalid request" });

  try {
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: id }, select: { id: true } });
    if (!profile) return res.status(404).json({ ok: false, message: "candidate profile not found" });
    await prisma.candidateEducation.deleteMany({ where: { id: educationId, candidateProfileId: profile.id } });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to delete education" });
  }
});

app.patch("/ops/candidates/:id/educations/:educationId", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const educationId = Array.isArray(req.params.educationId) ? req.params.educationId[0] : req.params.educationId;
  if (!id || !educationId) return res.status(400).json({ ok: false, message: "invalid request" });

  const parsed = createCandidateEducationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: id }, select: { id: true } });
    if (!profile) return res.status(404).json({ ok: false, message: "candidate profile not found" });
    const updated = await prisma.candidateEducation.updateMany({
      where: { id: educationId, candidateProfileId: profile.id },
      data: {
        schoolName: parsed.data.schoolName,
        educationType: parsed.data.educationType,
        major: parsed.data.major?.trim() || null,
        status: parsed.data.status,
        country: parsed.data.country?.trim() || null,
        city: parsed.data.city?.trim() || null,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        isKoreanSchool: parsed.data.isKoreanSchool ?? null
      }
    });
    if (updated.count === 0) return res.status(404).json({ ok: false, message: "education not found" });
    const item = await prisma.candidateEducation.findUnique({ where: { id: educationId } });
    return res.json({ ok: true, item });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to update education" });
  }
});

app.post("/ops/candidates/:id/language-skills", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ ok: false, message: "invalid user id" });

  const parsed = createCandidateLanguageSkillSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const candidate = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!candidate || candidate.role !== MemberRole.STUDENT) {
      return res.status(404).json({ ok: false, message: "candidate not found" });
    }
    const profile = await getOrCreateCandidateProfile(id);
    const created = await prisma.candidateLanguageSkill.create({
      data: {
        candidateProfileId: profile.id,
        language: parsed.data.language,
        level: parsed.data.level,
        testName: parsed.data.testName?.trim() || null,
        score: parsed.data.score?.trim() || null
      }
    });
    return res.status(201).json({ ok: true, item: created });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to create language skill" });
  }
});

app.delete("/ops/candidates/:id/language-skills/:languageSkillId", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const languageSkillId = Array.isArray(req.params.languageSkillId) ? req.params.languageSkillId[0] : req.params.languageSkillId;
  if (!id || !languageSkillId) return res.status(400).json({ ok: false, message: "invalid request" });

  try {
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: id }, select: { id: true } });
    if (!profile) return res.status(404).json({ ok: false, message: "candidate profile not found" });
    await prisma.candidateLanguageSkill.deleteMany({ where: { id: languageSkillId, candidateProfileId: profile.id } });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to delete language skill" });
  }
});

app.patch("/ops/candidates/:id/language-skills/:languageSkillId", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const languageSkillId = Array.isArray(req.params.languageSkillId) ? req.params.languageSkillId[0] : req.params.languageSkillId;
  if (!id || !languageSkillId) return res.status(400).json({ ok: false, message: "invalid request" });

  const parsed = createCandidateLanguageSkillSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: id }, select: { id: true } });
    if (!profile) return res.status(404).json({ ok: false, message: "candidate profile not found" });
    const updated = await prisma.candidateLanguageSkill.updateMany({
      where: { id: languageSkillId, candidateProfileId: profile.id },
      data: {
        language: parsed.data.language,
        level: parsed.data.level,
        testName: parsed.data.testName?.trim() || null,
        score: parsed.data.score?.trim() || null
      }
    });
    if (updated.count === 0) return res.status(404).json({ ok: false, message: "language skill not found" });
    const item = await prisma.candidateLanguageSkill.findUnique({ where: { id: languageSkillId } });
    return res.json({ ok: true, item });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to update language skill" });
  }
});

app.post("/ops/candidates/:id/careers", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ ok: false, message: "invalid user id" });

  const parsed = createCandidateCareerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const candidate = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!candidate || candidate.role !== MemberRole.STUDENT) {
      return res.status(404).json({ ok: false, message: "candidate not found" });
    }
    const profile = await getOrCreateCandidateProfile(id);
    const isCurrent = parsed.data.isCurrent ?? false;
    const created = await prisma.candidateCareer.create({
      data: {
        candidateProfileId: profile.id,
        companyName: parsed.data.companyName,
        position: parsed.data.position,
        department: parsed.data.department?.trim() || null,
        isCurrent,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: isCurrent ? null : parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        description: parsed.data.description?.trim() || null
      }
    });
    return res.status(201).json({ ok: true, item: created });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to create career" });
  }
});

app.delete("/ops/candidates/:id/careers/:careerId", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const careerId = Array.isArray(req.params.careerId) ? req.params.careerId[0] : req.params.careerId;
  if (!id || !careerId) return res.status(400).json({ ok: false, message: "invalid request" });

  try {
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: id }, select: { id: true } });
    if (!profile) return res.status(404).json({ ok: false, message: "candidate profile not found" });
    await prisma.candidateCareer.deleteMany({ where: { id: careerId, candidateProfileId: profile.id } });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to delete career" });
  }
});

app.patch("/ops/candidates/:id/careers/:careerId", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const careerId = Array.isArray(req.params.careerId) ? req.params.careerId[0] : req.params.careerId;
  if (!id || !careerId) return res.status(400).json({ ok: false, message: "invalid request" });

  const parsed = createCandidateCareerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: id }, select: { id: true } });
    if (!profile) return res.status(404).json({ ok: false, message: "candidate profile not found" });
    const isCurrent = parsed.data.isCurrent ?? false;
    const updated = await prisma.candidateCareer.updateMany({
      where: { id: careerId, candidateProfileId: profile.id },
      data: {
        companyName: parsed.data.companyName,
        position: parsed.data.position,
        department: parsed.data.department?.trim() || null,
        isCurrent,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: isCurrent ? null : parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        description: parsed.data.description?.trim() || null
      }
    });
    if (updated.count === 0) return res.status(404).json({ ok: false, message: "career not found" });
    const item = await prisma.candidateCareer.findUnique({ where: { id: careerId } });
    return res.json({ ok: true, item });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to update career" });
  }
});

app.post("/ops/candidates/:id/activity-experiences", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ ok: false, message: "invalid user id" });

  const parsed = createCandidateActivityExperienceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const candidate = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!candidate || candidate.role !== MemberRole.STUDENT) {
      return res.status(404).json({ ok: false, message: "candidate not found" });
    }
    const profile = await getOrCreateCandidateProfile(id);
    const created = await prisma.candidateActivityExperience.create({
      data: {
        candidateProfileId: profile.id,
        title: parsed.data.title,
        activityType: parsed.data.activityType,
        organization: parsed.data.organization?.trim() || null,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        description: parsed.data.description?.trim() || null,
        skills: parsed.data.skills ?? []
      }
    });
    return res.status(201).json({ ok: true, item: created });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to create activity experience" });
  }
});

app.delete(
  "/ops/candidates/:id/activity-experiences/:activityExperienceId",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const activityExperienceId = Array.isArray(req.params.activityExperienceId)
      ? req.params.activityExperienceId[0]
      : req.params.activityExperienceId;
    if (!id || !activityExperienceId) return res.status(400).json({ ok: false, message: "invalid request" });

    try {
      const profile = await prisma.candidateProfile.findUnique({ where: { userId: id }, select: { id: true } });
      if (!profile) return res.status(404).json({ ok: false, message: "candidate profile not found" });
      await prisma.candidateActivityExperience.deleteMany({
        where: { id: activityExperienceId, candidateProfileId: profile.id }
      });
      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ ok: false, message: "failed to delete activity experience" });
    }
  }
);

app.patch(
  "/ops/candidates/:id/activity-experiences/:activityExperienceId",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const activityExperienceId = Array.isArray(req.params.activityExperienceId)
      ? req.params.activityExperienceId[0]
      : req.params.activityExperienceId;
    if (!id || !activityExperienceId) return res.status(400).json({ ok: false, message: "invalid request" });

    const parsed = createCandidateActivityExperienceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }

    try {
      const profile = await prisma.candidateProfile.findUnique({ where: { userId: id }, select: { id: true } });
      if (!profile) return res.status(404).json({ ok: false, message: "candidate profile not found" });
      const updated = await prisma.candidateActivityExperience.updateMany({
        where: { id: activityExperienceId, candidateProfileId: profile.id },
        data: {
          title: parsed.data.title,
          activityType: parsed.data.activityType,
          organization: parsed.data.organization?.trim() || null,
          startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
          endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
          description: parsed.data.description?.trim() || null,
          skills: parsed.data.skills ?? []
        }
      });
      if (updated.count === 0) return res.status(404).json({ ok: false, message: "activity experience not found" });
      const item = await prisma.candidateActivityExperience.findUnique({ where: { id: activityExperienceId } });
      return res.json({ ok: true, item });
    } catch {
      return res.status(500).json({ ok: false, message: "failed to update activity experience" });
    }
  }
);

app.patch("/ops/candidates/:id/email-verified", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid user id" });
  }

  const parsed = updateCandidateEmailVerifiedSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        emailVerified: parsed.data.emailVerified
      },
      select: {
        id: true,
        role: true,
        email: true,
        emailVerified: true,
        realName: true,
        name: true,
        phoneNumber: true,
        nationality: true,
        affiliation: true,
        birthDate: true,
        gender: true,
        jobTitle: true,
        adminMemo: true,
        partnerType: true,
        partnerOrgRole: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (updated.role !== MemberRole.STUDENT) {
      return res.status(400).json({ ok: false, message: "target user is not a candidate" });
    }

    return res.json({ ok: true, item: toSafeUser(updated) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ ok: false, message: "user not found" });
    }
    return res.status(500).json({ ok: false, message: "failed to update candidate email verified" });
  }
});

app.post("/ops/candidates/sync-users", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = syncCandidateUsersSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  const normalizedParticipants = parsed.data.participants;
  if (normalizedParticipants.length === 0) {
    return res.json({ ok: true, created: 0, updated: 0, skipped: 0, total: 0 });
  }

  const uniqueByEmail = new Map<
    string,
    {
      email: string;
      fullName?: string | null;
      nationality?: string | null;
      affiliation?: string | null;
      birthDate?: string | null;
      gender?: string | null;
    }
  >();
  for (const participant of normalizedParticipants) {
    const email = participant.email.trim().toLowerCase();
    if (!email) continue;
    if (!uniqueByEmail.has(email)) {
      uniqueByEmail.set(email, {
        email,
        fullName: participant.fullName ?? null,
        nationality: participant.nationality ?? null,
        affiliation: participant.affiliation ?? participant.registrationSource ?? participant.source ?? null,
        birthDate: participant.birthDate ?? null,
        gender: participant.gender ?? null
      });
    }
  }

  const candidateEmails = [...uniqueByEmail.keys()];
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: candidateEmails } },
    select: { id: true, email: true, role: true, realName: true, name: true }
  });
  const existingByEmail = new Map(existingUsers.map((user) => [user.email.toLowerCase(), user]));

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const [email, participant] of uniqueByEmail.entries()) {
    const existing = existingByEmail.get(email);
    if (existing) {
      if (existing.role === MemberRole.STUDENT) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            ...(existing.realName ? {} : participant.fullName ? { realName: participant.fullName } : {}),
            ...(existing.name ? {} : participant.fullName ? { name: participant.fullName } : {}),
            ...(participant.nationality ? { nationality: participant.nationality } : {}),
            ...(participant.affiliation ? { affiliation: participant.affiliation } : {}),
            ...(participant.birthDate ? { birthDate: new Date(participant.birthDate) } : {}),
            ...(participant.gender ? { gender: participant.gender } : {})
          }
        });
        updated += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    const tempPassword = createTemporaryPassword();
    const passwordHash = await hashPassword(tempPassword);
    await prisma.user.create({
      data: {
        email,
        realName: participant.fullName ?? null,
        name: participant.fullName ?? null,
        nationality: participant.nationality ?? null,
        affiliation: participant.affiliation ?? null,
        birthDate: participant.birthDate ? new Date(participant.birthDate) : null,
        gender: participant.gender ?? null,
        passwordHash,
        role: MemberRole.STUDENT
      }
    });
    created += 1;
  }

  return res.json({
    ok: true,
    created,
    updated,
    skipped,
    total: uniqueByEmail.size
  });
});

app.post("/members", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = createMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    const created = await prisma.user.create({
      data: {
        email: parsed.data.email,
        realName: parsed.data.realName?.trim() || null,
        name: parsed.data.name,
        phoneNumber: parsed.data.phoneNumber,
        jobTitle: parsed.data.jobTitle,
        passwordHash,
        role: parsed.data.role,
        partnerType: parsed.data.partnerType,
        partnerOrgRole: parsed.data.partnerOrgRole
      }
    });

    return res.status(201).json({ ok: true, item: toSafeUser(created) });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
      return res.status(409).json({ ok: false, message: "email already exists" });
    }

    return res.status(500).json({ ok: false, message: "failed to create member" });
  }
});

app.get("/partner/dashboard", authenticate, requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  if (req.auth!.role === MemberRole.OPERATOR) {
    return res.json({
      ok: true,
      message: "partner dashboard accessible",
      auth: req.auth
    });
  }

  const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
  if (!affiliation || !affiliation.domain || !affiliation.organization) {
    return sendAuthError(
      res,
      403,
      "PARTNER_AFFILIATION_REQUIRED",
      "partner affiliation is required. use a company email domain."
    );
  }

  return res.json({
    ok: true,
    message: "partner dashboard accessible",
    auth: req.auth,
    partnerOrganization: toPartnerOrganization(affiliation.organization)
  });
});

app.post("/partner/positions", authenticate, requireRoles([MemberRole.PARTNER]), async (req, res) => {
  console.info("[partner/positions][create][request]", {
    userId: req.auth?.userId,
    body: summarizePartnerPositionBody(req.body)
  });
  const parsed = createPartnerPositionSchema.safeParse(req.body);
  if (!parsed.success) {
    console.error("[partner/positions][create][validation-failed]", {
      userId: req.auth?.userId,
      errors: parsed.error.flatten(),
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message
      }))
    });
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
  if (!affiliation?.domain || !affiliation.organization) {
    return sendAuthError(
      res,
      403,
      "PARTNER_AFFILIATION_REQUIRED",
      "partner affiliation is required. use a company email domain."
    );
  }

  try {
    const created = await prisma.position.create({
      data: {
        partnerOrganizationId: affiliation.organization.id,
        title: parsed.data.title,
        status: parsed.data.status ?? PositionStatus.DRAFT,
        workType: parsed.data.workType ?? "On-site",
        thumbnailImages: normalizeStringArray(parsed.data.thumbnailImages).slice(0, 5),
        eligibleVisas: normalizeStringArray(parsed.data.eligibleVisas),
        preferredNationalities: normalizeStringArray(parsed.data.preferredNationalities),
        communicationLanguages: normalizeStringArray(parsed.data.communicationLanguages),
        hiringProcess: parsed.data.hiringProcess,
        preferredJobRole: parsed.data.preferredJobRole,
        hiringCount: parsed.data.hiringCount,
        workingHours: parsed.data.workingHours,
        workLocation: parsed.data.workLocation,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        mainResponsibilities: parsed.data.mainResponsibilities,
        requiredQualifications: parsed.data.requiredQualifications,
        preferredQualifications: parsed.data.preferredQualifications,
        dressCode: parsed.data.dressCode,
        wantsPreTraining: parsed.data.wantsPreTraining,
        additionalNotes: parsed.data.additionalNotes,
        statusHistories: {
          create: {
            fromStatus: null,
            toStatus: parsed.data.status ?? PositionStatus.DRAFT,
            note: "파트너 공고 생성",
            createdByUserId: req.auth!.userId
          }
        }
      },
      include: {
        partnerOrganization: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        },
        matchingParticipants: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        progressLogs: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        statusHistories: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    return res.status(201).json({ ok: true, item: toPosition(created) });
  } catch (error) {
    console.error("[partner/positions][create][failed]", {
      userId: req.auth?.userId,
      message: getErrorMessage(error)
    });
    return res.status(500).json({ ok: false, message: "failed to create partner position" });
  }
});

app.get("/partner/positions/:id", authenticate, requireRoles([MemberRole.PARTNER]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid position id" });
  }

  const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
  if (!affiliation?.organization) {
    return sendAuthError(
      res,
      403,
      "PARTNER_AFFILIATION_REQUIRED",
      "partner affiliation is required. use a company email domain."
    );
  }

  const item = await prisma.position.findFirst({
    where: {
      id,
      partnerOrganizationId: affiliation.organization.id
    },
    include: {
      partnerOrganization: {
        select: {
          id: true,
          name: true,
          domain: true
        }
      },
      matchingParticipants: {
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      progressLogs: {
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      statusHistories: {
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    }
  });

  if (!item) {
    return res.status(404).json({ ok: false, message: "position not found" });
  }

  return res.json({ ok: true, item: toPosition(item) });
});

app.patch("/partner/positions/:id", authenticate, requireRoles([MemberRole.PARTNER]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid position id" });
  }

  console.info("[partner/positions][update][request]", {
    positionId: id,
    userId: req.auth?.userId,
    body: summarizePartnerPositionBody(req.body)
  });

  const parsed = updatePartnerPositionSchema.safeParse(req.body);
  if (!parsed.success) {
    console.error("[partner/positions][update][validation-failed]", {
      positionId: id,
      userId: req.auth?.userId,
      errors: parsed.error.flatten(),
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message
      }))
    });
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
  if (!affiliation?.organization) {
    return sendAuthError(
      res,
      403,
      "PARTNER_AFFILIATION_REQUIRED",
      "partner affiliation is required. use a company email domain."
    );
  }

  const current = await prisma.position.findFirst({
    where: {
      id,
      partnerOrganizationId: affiliation.organization.id
    },
    select: {
      id: true,
      status: true
    }
  });
  if (!current) {
    return res.status(404).json({ ok: false, message: "position not found" });
  }

  const nextStatus = parsed.data.status;
  const shouldWriteStatusHistory = nextStatus !== undefined && nextStatus !== current.status;

  try {
    const updated = await prisma.position.update({
      where: { id: current.id },
      data: {
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(parsed.data.workType !== undefined ? { workType: parsed.data.workType } : {}),
        ...(parsed.data.thumbnailImages !== undefined
          ? { thumbnailImages: normalizeStringArray(parsed.data.thumbnailImages).slice(0, 5) }
          : {}),
        ...(parsed.data.eligibleVisas !== undefined
          ? { eligibleVisas: normalizeStringArray(parsed.data.eligibleVisas) }
          : {}),
        ...(parsed.data.preferredNationalities !== undefined
          ? { preferredNationalities: normalizeStringArray(parsed.data.preferredNationalities) }
          : {}),
        ...(parsed.data.communicationLanguages !== undefined
          ? { communicationLanguages: normalizeStringArray(parsed.data.communicationLanguages) }
          : {}),
        ...(parsed.data.hiringProcess !== undefined ? { hiringProcess: parsed.data.hiringProcess } : {}),
        ...(parsed.data.preferredJobRole !== undefined ? { preferredJobRole: parsed.data.preferredJobRole } : {}),
        ...(parsed.data.hiringCount !== undefined ? { hiringCount: parsed.data.hiringCount } : {}),
        ...(parsed.data.workingHours !== undefined ? { workingHours: parsed.data.workingHours } : {}),
        ...(parsed.data.workLocation !== undefined ? { workLocation: parsed.data.workLocation } : {}),
        ...(parsed.data.startDate !== undefined
          ? { startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null }
          : {}),
        ...(parsed.data.mainResponsibilities !== undefined ? { mainResponsibilities: parsed.data.mainResponsibilities } : {}),
        ...(parsed.data.requiredQualifications !== undefined ? { requiredQualifications: parsed.data.requiredQualifications } : {}),
        ...(parsed.data.preferredQualifications !== undefined ? { preferredQualifications: parsed.data.preferredQualifications } : {}),
        ...(parsed.data.dressCode !== undefined ? { dressCode: parsed.data.dressCode } : {}),
        ...(parsed.data.wantsPreTraining !== undefined ? { wantsPreTraining: parsed.data.wantsPreTraining } : {}),
        ...(parsed.data.additionalNotes !== undefined ? { additionalNotes: parsed.data.additionalNotes } : {}),
        ...(shouldWriteStatusHistory
          ? {
              statusHistories: {
                create: {
                  fromStatus: current.status,
                  toStatus: nextStatus!,
                  note: "파트너 공고 수정",
                  createdByUserId: req.auth!.userId
                }
              }
            }
          : {})
      },
      include: {
        partnerOrganization: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        },
        matchingParticipants: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        progressLogs: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        statusHistories: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    return res.json({ ok: true, item: toPosition(updated) });
  } catch (error) {
    console.error("[partner/positions][update][failed]", {
      positionId: id,
      userId: req.auth?.userId,
      message: getErrorMessage(error)
    });
    return res.status(500).json({ ok: false, message: "failed to update partner position" });
  }
});

app.get("/ops/dashboard", authenticate, requireRoles([MemberRole.OPERATOR]), (req, res) => {
  res.json({
    ok: true,
    message: "ops dashboard accessible",
    auth: req.auth
  });
});

app.get("/ops/partners", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = listPartnerOrganizationsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsed.error.flatten() });
  }

  const { search, sortBy = "createdAt", sortOrder = "desc", page = 1, pageSize = 20 } = parsed.data;
  const orderByMap = {
    name: { name: sortOrder },
    domain: { domain: sortOrder },
    createdAt: { createdAt: sortOrder }
  } as const;
  const orderBy = orderByMap[sortBy];

  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { domain: { contains: search, mode: Prisma.QueryMode.insensitive } }
          ]
        }
      : {})
  };

  const [total, items] = await Promise.all([
    prisma.partnerOrganization.count({ where }),
    prisma.partnerOrganization.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);

  const memberCounts = await Promise.all(
    items.map((item) =>
      prisma.user.count({
        where: {
          role: MemberRole.PARTNER,
          email: {
            endsWith: `@${item.domain}`
          }
        }
      })
    )
  );

  return res.json({
    ok: true,
    items: items.map((item, index) => toPartnerOrganization({ ...item, memberCount: memberCounts[index] })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  });
});

app.get("/ops/partners/:id", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid partner id" });
  }

  const item = await prisma.partnerOrganization.findUnique({
    where: { id }
  });
  if (!item) {
    return res.status(404).json({ ok: false, message: "partner not found" });
  }

  const memberCount = await prisma.user.count({
    where: {
      role: MemberRole.PARTNER,
      email: { endsWith: `@${item.domain}` }
    }
  });

  return res.json({
    ok: true,
    item: toPartnerOrganization({ ...item, memberCount })
  });
});

app.get("/ops/partner-users", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = listPartnerUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsed.error.flatten() });
  }

  const { search, domain, sortBy = "createdAt", sortOrder = "desc", page = 1, pageSize = 20 } = parsed.data;
  const orderByMap = {
    email: { email: sortOrder },
    name: { name: sortOrder },
    createdAt: { createdAt: sortOrder }
  } as const;
  const orderBy = orderByMap[sortBy];

  let matchingPartnerDomains: string[] = [];
  if (search) {
    const partnerMatches = await prisma.partnerOrganization.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { domain: { contains: search, mode: Prisma.QueryMode.insensitive } }
        ]
      },
      select: { domain: true }
    });
    matchingPartnerDomains = partnerMatches.map((item) => item.domain.toLowerCase());
  }

  const where: Prisma.UserWhereInput = {
    role: MemberRole.PARTNER,
    ...(domain ? {} : { partnerType: PartnerType.COMPANY }),
    ...(domain ? { email: { endsWith: `@${domain}` } } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            ...matchingPartnerDomains.map((matchedDomain) => ({
              email: { endsWith: `@${matchedDomain}` }
            }))
          ]
        }
      : {})
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        emailVerified: true,
        name: true,
        phoneNumber: true,
        jobTitle: true,
        adminMemo: true,
        role: true,
        partnerType: true,
        partnerOrgRole: true,
        createdAt: true
      }
    })
  ]);

  const domains = Array.from(
    new Set(users.map((user) => extractDomainFromEmail(user.email)).filter((domain): domain is string => Boolean(domain)))
  );
  const partners = domains.length
    ? await prisma.partnerOrganization.findMany({
        where: { domain: { in: domains } }
      })
    : [];
  const partnerByDomain = new Map(partners.map((item) => [item.domain.toLowerCase(), item]));

  return res.json({
    ok: true,
    items: users.map((user) => {
      const domain = extractDomainFromEmail(user.email);
      const partner = domain ? partnerByDomain.get(domain) : null;
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        phoneNumber: user.phoneNumber,
        jobTitle: user.jobTitle,
        adminMemo: user.adminMemo,
        role: user.role,
        partnerType: user.partnerType,
        partnerOrgRole: user.partnerOrgRole,
        createdAt: user.createdAt,
        domain,
        partnerName: partner?.name ?? "-"
        ,
        partner: partner
          ? {
              id: partner.id,
              domain: partner.domain,
              name: partner.name,
              companySize: partner.companySize ?? null,
              partnerType: partner.partnerType,
              industry: partner.industry,
              officeAddress: partner.officeAddress,
              website: partner.website,
              socialMedia: partner.socialMedia,
              description: partner.description,
              strengths: partner.strengths,
              adminMemo: partner.adminMemo ?? null,
              createdAt: partner.createdAt
            }
          : null
      };
    }),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  });
});

app.patch("/ops/partner-users/:id/admin-memo", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid user id" });
  }

  const parsed = updatePartnerUserAdminMemoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        adminMemo: parsed.data.adminMemo?.trim() || null
      },
      select: {
        id: true,
        adminMemo: true
      }
    });
    return res.json({ ok: true, item: updated });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2025") {
      return res.status(404).json({ ok: false, message: "user not found" });
    }
    return res.status(500).json({ ok: false, message: "failed to update user admin memo" });
  }
});

app.post("/ops/partners/:id/members", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid partner id" });
  }

  const parsed = createPartnerMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  const partner = await prisma.partnerOrganization.findUnique({
    where: { id },
    select: { id: true, domain: true, partnerType: true, name: true }
  });
  if (!partner) {
    return res.status(404).json({ ok: false, message: "partner not found" });
  }

  const domain = extractDomainFromEmail(parsed.data.email);
  if (!domain || domain !== partner.domain.toLowerCase()) {
    return res.status(400).json({
      ok: false,
      message: `email domain must match partner domain (${partner.domain})`
    });
  }

  const plainPassword = parsed.data.password ?? createTemporaryPassword();
  const passwordHash = await hashPassword(plainPassword);

  try {
    const created = await prisma.user.create({
      data: {
        email: parsed.data.email,
        realName: parsed.data.realName?.trim() || null,
        name: parsed.data.name,
        phoneNumber: parsed.data.phoneNumber,
        jobTitle: parsed.data.jobTitle,
        passwordHash,
        role: MemberRole.PARTNER,
        partnerType: partner.partnerType,
        partnerOrgRole: parsed.data.partnerOrgRole,
        emailVerified: false
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        name: true,
        phoneNumber: true,
        jobTitle: true,
        role: true,
        partnerType: true,
        partnerOrgRole: true,
        createdAt: true
      }
    });
    const { token } = await createEmailVerificationToken(created.id);
    const locale = resolveEmailLocale(req, parsed.data.locale);
    const delivery = await sendVerificationEmail(created.email, token, locale);

    return res.status(201).json({
      ok: true,
      item: {
        ...created,
        domain,
        partnerName: partner.name
      },
      verificationDelivery: delivery.delivery,
      ...(isProduction ? {} : { verifyUrl: delivery.verifyUrl }),
      ...(parsed.data.password ? {} : { temporaryPassword: plainPassword })
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
      return res.status(409).json({ ok: false, message: "email already exists" });
    }
    return res.status(500).json({ ok: false, message: "failed to create partner member" });
  }
});

app.delete("/ops/partners/:id/members/:memberId", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const memberId = Array.isArray(req.params.memberId) ? req.params.memberId[0] : req.params.memberId;
  if (!id || !memberId) {
    return res.status(400).json({ ok: false, message: "invalid request" });
  }

  const partner = await prisma.partnerOrganization.findUnique({
    where: { id },
    select: { domain: true }
  });
  if (!partner) {
    return res.status(404).json({ ok: false, message: "partner not found" });
  }

  const member = await prisma.user.findFirst({
    where: {
      id: memberId,
      role: MemberRole.PARTNER,
      email: { endsWith: `@${partner.domain}` }
    },
    select: { id: true }
  });
  if (!member) {
    return res.status(404).json({ ok: false, message: "member not found in this partner" });
  }

  await prisma.user.delete({ where: { id: member.id } });
  return res.json({ ok: true });
});

app.post("/ops/partners", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = createPartnerOrganizationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const created = await prisma.partnerOrganization.create({
      data: {
        partnerType: parsed.data.partnerType,
        domain: parsed.data.domain,
        name: parsed.data.name,
        companySize: parsed.data.companySize,
        officeAddress: parsed.data.officeAddress,
        website: parsed.data.website,
        socialMedia: parsed.data.socialMedia,
        industry: parsed.data.industry,
        description: parsed.data.description,
        strengths: parsed.data.strengths,
        adminMemo: parsed.data.adminMemo,
        businessRegistrationDocumentData: parsed.data.businessRegistrationDocumentData,
        fourInsuranceSubscriberListData: parsed.data.fourInsuranceSubscriberListData,
        companyLogoImageData: parsed.data.companyLogoImageData,
        officePhotoImageData: parsed.data.officePhotoImageData
      }
    });

    return res.status(201).json({ ok: true, item: toPartnerOrganization(created) });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
      return res.status(409).json({ ok: false, message: "domain already exists" });
    }

    return res.status(500).json({ ok: false, message: "failed to create partner organization" });
  }
});

app.patch("/ops/partners/:id", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = updatePartnerOrganizationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid partner id" });
  }

  try {
    const updated = await prisma.partnerOrganization.update({
      where: { id },
      data: {
        partnerType: parsed.data.partnerType,
        domain: parsed.data.domain,
        name: parsed.data.name,
        companySize: parsed.data.companySize,
        officeAddress: parsed.data.officeAddress,
        website: parsed.data.website,
        socialMedia: parsed.data.socialMedia,
        industry: parsed.data.industry,
        description: parsed.data.description,
        strengths: parsed.data.strengths,
        adminMemo: parsed.data.adminMemo,
        businessRegistrationDocumentData: parsed.data.businessRegistrationDocumentData?.trim() || null,
        fourInsuranceSubscriberListData: parsed.data.fourInsuranceSubscriberListData?.trim() || null,
        companyLogoImageData: parsed.data.companyLogoImageData?.trim() || null,
        officePhotoImageData: parsed.data.officePhotoImageData?.trim() || null
      }
    });

    return res.json({ ok: true, item: toPartnerOrganization(updated) });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
      return res.status(409).json({ ok: false, message: "domain already exists" });
    }
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2025") {
      return res.status(404).json({ ok: false, message: "partner not found" });
    }

    return res.status(500).json({ ok: false, message: "failed to update partner organization" });
  }
});

if (process.env.VERCEL !== "1") {
  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
}

export default app;
