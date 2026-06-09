import { config as loadDotenv } from "dotenv";
import path from "path";
loadDotenv({ path: path.resolve(process.cwd(), ".env") });
loadDotenv({ path: path.resolve(process.cwd(), "../../.env") });
import { spawn } from "child_process";
import { createHmac, randomBytes, randomInt } from "crypto";
import cors from "cors";
import express from "express";
import multer from "multer";
import nodemailer from "nodemailer";
import OpenAI from "openai";
import swaggerUi from "swagger-ui-express";
import {
  Prisma,
  AuthProvider,
  MemberRole,
  CandidateVisaType,
  CandidateEducationType,
  CandidateEducationStatus,
  CandidateLanguageType,
  CandidateLanguageLevel,
  CandidatePreferredJobRole,
  CandidateActivityType,
  CommunityPostCategory,
  ApplicationCommentVisibility,
  PositionEmploymentType,
  PositionSourceKind,
  PositionSourceProvider,
  PositionStatus,
  PositionRevisionStatus,
  PartnerCompanySize,
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
import { renderEmailLayout } from "./email/email-layout";
import { checkEmailDeliverable } from "./email/deliverability";
import {
  embedAndSavePosition,
  embedQueryCached,
  expandQueryCandidates,
  keywordScore,
  toPgVector
} from "./embedding/position-embedding";
import { generateSajuPrediction, translateSajuContent, type SajuDetails, type SajuTranslatableContent } from "./saju/saju-llm";
import {
  MBTI_PROFILE,
  MBTI_QUIZ_QUESTIONS,
  MBTI_TYPES,
  computeMbtiFromQuiz,
  getMatchReason,
  isMbtiType,
  type MbtiType,
  type RoleCode as MbtiRoleCode
} from "./mbti/mbti-data";
import { evaluateVisa } from "./visa/visa-rules";
import {
  getPositionTranslation,
  getPositionTranslationsBatch,
  shouldTranslateForLocale,
  type PositionTranslatableFields
} from "./positions/position-translate";
import { generateCommunityContent, seedForeignCandidates, deleteNonOperatorCommunityPosts } from "./community/autogen";
import { createHash } from "crypto";

const app = express();
// Behind Azure App Service / Front Door — honor X-Forwarded-For so req.ip
// resolves to the real client IP instead of the proxy. Without this every
// signup logs as the platform's edge IP and forensics are useless.
app.set("trust proxy", true);
const prisma = new PrismaClient();

async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  message?: string | null;
  linkPath?: string | null;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message ?? null,
        linkPath: input.linkPath ?? null
      }
    });
  } catch (error) {
    console.error("[notification][create] failed", error);
  }
}

async function notifyOperators(input: { type: string; title: string; message?: string | null; linkPath?: string | null }) {
  const ops = await prisma.user.findMany({ where: { role: MemberRole.OPERATOR }, select: { id: true } });
  await Promise.all(ops.map((u) => createNotification({ ...input, userId: u.id })));
}

async function writeAuditLog(
  req: express.Request | undefined,
  input: {
    action: string;
    resource: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    const ip = req
      ? (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        null
      : null;
    await prisma.auditLog.create({
      data: {
        actorUserId: req?.auth?.userId ?? null,
        actorRole: req?.auth?.role ?? null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? null,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress: ip
      }
    });
  } catch (err) {
    console.error("[audit][write] failed", err);
  }
}
const port = Number(process.env.API_PORT ?? 4000);
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const openaiMatchingModel = process.env.OPENAI_MATCHING_MODEL ?? "gpt-4o";
const openaiTranslationModel = process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-4o-mini";
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
const getTrimmedEnvOrFallback = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : fallback;
};
const discordCompanyConsultationWebhookUrl = process.env.DISCORD_COMPANY_CONSULTATION_WEBHOOK_URL?.trim() ?? "";
const discordSignupWebhookUrl = process.env.SIGNUP_DISCORD_WEBHOOK_URL?.trim() ?? "";
const discordCommunityPostWebhookUrl = process.env.DISCORD_COMMUNITY_POST_WEBHOOK_URL?.trim() ?? "";
const errorDiscordWebhookUrl = process.env.ERROR_DISCORD_WEBHOOK_URL?.trim() ?? "";

// In-memory dedup for error notifications. Last-N seconds per fingerprint so
// a burst of the same error doesn't flood Discord.
const ERROR_DEDUP_WINDOW_MS = 60_000;
const recentErrorFingerprints = new Map<string, number>();

type ErrorSource = "api" | "web";

async function postErrorToDiscord(input: {
  title: string;
  source: ErrorSource;
  path?: string;
  method?: string;
  userAgent?: string;
  stack?: string;
}) {
  if (!errorDiscordWebhookUrl) return;
  const fingerprint = `${input.source}|${input.title}|${input.path ?? ""}`;
  const now = Date.now();
  const last = recentErrorFingerprints.get(fingerprint);
  if (last && now - last < ERROR_DEDUP_WINDOW_MS) return;
  recentErrorFingerprints.set(fingerprint, now);
  if (recentErrorFingerprints.size > 256) {
    const cutoff = now - ERROR_DEDUP_WINDOW_MS;
    for (const [key, ts] of recentErrorFingerprints) {
      if (ts < cutoff) recentErrorFingerprints.delete(key);
    }
  }
  const env = process.env.NODE_ENV === "production" ? "production" : "staging";
  const truncate = (text: string, maxLength: number) =>
    text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 14))}\n...[truncated]` : text;

  const fields: Array<{ name: string; value: string; inline: boolean }> = [
    { name: "Source", value: input.source.toUpperCase(), inline: true },
    { name: "Env", value: env, inline: true }
  ];
  if (input.path) {
    fields.push({
      name: "Path",
      value: truncate(`${input.method ?? "GET"} ${input.path}`, 256),
      inline: false
    });
  }
  if (input.userAgent) {
    fields.push({ name: "User Agent", value: truncate(input.userAgent, 256), inline: false });
  }
  if (input.stack) {
    fields.push({ name: "Stack", value: "```\n" + truncate(input.stack, 900) + "\n```", inline: false });
  }

  const isWeb = input.source === "web";
  const payload = {
    content: "",
    embeds: [
      {
        color: isWeb ? 0x3b82f6 : 0xe11d48,
        title: `${isWeb ? "🟦" : "🟥"} ${isWeb ? "Web" : "API"} 에러`,
        description: truncate(input.title, 1500),
        fields,
        footer: { text: "Aply • Error" },
        timestamp: new Date().toISOString()
      }
    ]
  };
  try {
    const response = await fetch(errorDiscordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const responseBody = await response.text().catch(() => "");
      console.error("error_discord_webhook_failed", {
        status: response.status,
        statusText: response.statusText,
        body: responseBody.slice(0, 500)
      });
    }
  } catch (error) {
    console.error("error_discord_webhook_error", {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
const discordPositionApplyWebhookUrl =
  getTrimmedEnvOrFallback(
    process.env.DISCORD_POSITION_APPLY_WEBHOOK_URL,
    "https://discord.com/api/webhooks/1501413270341554287/p2IEy5KPZqOy6nnMNHWO-wxAhpe5OixHBeJCDMzLfokse-kSwxIAONxTBVh6hQKO-XeY"
  );
const discordPositionCreateWebhookUrl =
  getTrimmedEnvOrFallback(
    process.env.DISCORD_POSITION_CREATE_WEBHOOK_URL,
    "https://discord.com/api/webhooks/1501417599416799337/Viilar1RgIH0ID5Ok1HdxzGX8wR06mQMWuMn-extrtvgRC22rnAKQJVHZ9mrGss7bWJg"
  );
const companyConsultationDiscordTestToken = process.env.COMPANY_CONSULTATION_DISCORD_TEST_TOKEN?.trim() ?? "";
const emailFromAddress = process.env.EMAIL_FROM?.trim() ?? "";
const emailReplyToAddress = process.env.EMAIL_REPLY_TO?.trim() || process.env.EMAIL_SUPPORT_ADDRESS?.trim() || "info@flip-ers.com";
const emailEnvelopeFrom = process.env.EMAIL_ENVELOPE_FROM?.trim() || process.env.SMTP_USER?.trim() || "";
const smtpHost = process.env.SMTP_HOST?.trim() ?? "";
const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const smtpUser = process.env.SMTP_USER?.trim() ?? "";
const smtpPass = process.env.SMTP_PASS ?? "";
const smtpSecure = String(process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";
const signupEmailVerificationCodeTtlMinutes = Math.max(1, Number(process.env.SIGNUP_EMAIL_VERIFICATION_CODE_TTL_MINUTES ?? 10));
const partnerJoinCodeTtlMinutesDefault = Math.max(5, Number(process.env.PARTNER_JOIN_CODE_TTL_MINUTES ?? 120));
const partnerJoinCodeTtlMinutesMax = Math.max(partnerJoinCodeTtlMinutesDefault, Number(process.env.PARTNER_JOIN_CODE_TTL_MAX_MINUTES ?? 10080));
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = [
  platformWebUrl,
  partnerAdminUrl,
  opsAdminUrl,
  "https://aply.global",
  "https://www.aply.global",
  "https://staging.aply.global"
]
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);
const allowedOriginHostSuffixes = (process.env.CORS_ALLOWED_ORIGIN_SUFFIXES ?? ".azurewebsites.net,.aply.global")
  .split(",")
  .map((item) => item.trim().toLowerCase())
  .filter((item) => item.length > 0)
  .map((item) => (item.startsWith(".") ? item : `.${item}`));
const refreshCookieName = "flip_refresh_token";
const oauthStateCookieName = "flip_oauth_state";
const oauthStateSecret = process.env.OAUTH_STATE_SECRET?.trim() || "dev-oauth-state-secret-change-me";
const naverOAuthClientId = process.env.NAVER_OAUTH_CLIENT_ID?.trim() ?? "";
const naverOAuthClientSecret = process.env.NAVER_OAUTH_CLIENT_SECRET?.trim() ?? "";
const naverOAuthRedirectUri = process.env.NAVER_OAUTH_REDIRECT_URI?.trim() || `http://localhost:${port}/auth/naver/callback`;
const googleOAuthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() ?? "";
const googleOAuthClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() ?? "";
const googleOAuthRedirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() || `http://localhost:${port}/auth/google/callback`;
const kakaoOAuthClientId = process.env.KAKAO_OAUTH_CLIENT_ID?.trim() ?? "";
const kakaoOAuthClientSecret = process.env.KAKAO_OAUTH_CLIENT_SECRET?.trim() ?? "";
const kakaoOAuthRedirectUri = process.env.KAKAO_OAUTH_REDIRECT_URI?.trim() || `http://localhost:${port}/auth/kakao/callback`;
const azureStorageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING?.trim() ?? "";
const azureStorageContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME?.trim() || "uploads";
const crawlSchedulerEnabled = String(process.env.CRAWL_SCHEDULER_ENABLED ?? "false").toLowerCase() === "true";
const crawlSchedulerHourKst = Math.max(0, Math.min(23, Number(process.env.CRAWL_SCHEDULER_HOUR_KST ?? 4)));
const crawlSchedulerMinuteKst = Math.max(0, Math.min(59, Number(process.env.CRAWL_SCHEDULER_MINUTE_KST ?? 10)));
const crawlSchedulerRunOnBoot = String(process.env.CRAWL_SCHEDULER_RUN_ON_BOOT ?? "false").toLowerCase() === "true";
const crawlerSummaryDiscordWebhookUrl =
  process.env.CRAWLER_SUMMARY_DISCORD_WEBHOOK_URL?.trim()
  || "https://discord.com/api/webhooks/1501899705385488455/27NCPq0khx4Cj8irz5s1VB0AWC7SKe5TzaI-C3oz78bWbic4zBplOx-vcul0UV_wyioR";

function resolveRuntimeEnvironment(): "Local" | "Staging" | "Production" {
  const appEnv = (process.env.APP_ENV ?? process.env.ENV ?? "").trim().toLowerCase();
  const nodeEnv = (process.env.NODE_ENV ?? "").trim().toLowerCase();
  if (appEnv === "production" || appEnv === "prod") return "Production";
  if (appEnv === "staging" || appEnv === "stage" || appEnv === "stg") return "Staging";
  if (nodeEnv === "production") {
    return appEnv ? "Staging" : "Production";
  }
  return "Local";
}

function getDatabaseTargetMeta() {
  const raw = process.env.DATABASE_URL ?? "";
  try {
    const parsed = new URL(raw);
    return {
      host: parsed.host,
      database: parsed.pathname.replace(/^\//, "") || null
    };
  } catch {
    return { host: null as string | null, database: null as string | null };
  }
}
type PartnerApplicantWorkflowStatus =
  | "APPLIED"
  | "REVIEWING"
  | "INTERVIEW"
  | "OFFERED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "COMPLETED";
type AuthTokenUser = {
  id: string;
  role: MemberRole;
  partnerType: PartnerType | null;
};

type AuthErrorCode =
  | "INVALID_REQUEST"
  | "BUSINESS_EMAIL_REQUIRED"
  | "EMAIL_ALREADY_EXISTS"
  | "EMAIL_REGISTERED_DIFFERENT_ROLE"
  | "EMAIL_DOMAIN_UNDELIVERABLE"
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
  | "PARTNER_AFFILIATION_REQUIRED"
  | "INVALID_SIGNUP_CONTEXT"
  | "EXPIRED_SIGNUP_CONTEXT"
  | "ACCOUNT_SUSPENDED";

const partnerApplicantStatusEnum = z.enum([
  "APPLIED",
  "REVIEWING",
  "INTERVIEW",
  "OFFERED",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "COMPLETED"
]);

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

async function sendCompanyConsultationDiscordNotification(input: {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  message: string;
  locale: string;
  source: string;
  createdAt: Date;
}) {
  if (!discordCompanyConsultationWebhookUrl) return;

  const truncateForDiscord = (text: string, maxLength: number) =>
    text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 14))}\n...[truncated]` : text;

  const safeCompanyName = truncateForDiscord(input.companyName || "-", 256);
  const safeContactName = truncateForDiscord(input.contactName || "-", 256);
  const safePhone = truncateForDiscord(input.phone ?? "-", 256);
  const safeEmail = truncateForDiscord(input.email || "-", 1024);
  const safeSource = truncateForDiscord(input.source || "-", 256);
  const safeLocale = truncateForDiscord(input.locale || "-", 256);
  const safeInquiryId = truncateForDiscord(input.id || "-", 256);
  const safeMessage = truncateForDiscord(input.message || "-", 1024);

  const payload = {
    content: "",
    embeds: [
      {
        color: 3447003,
        title: "📩 기업 상담 문의 접수",
        description: "담당자가 빠르게 확인이 필요한 신규 문의입니다.",
        fields: [
          { name: "기업명", value: safeCompanyName, inline: true },
          { name: "담당자", value: safeContactName, inline: true },
          { name: "연락처", value: safePhone, inline: true },
          { name: "이메일", value: safeEmail, inline: false },
          { name: "문의 ID", value: safeInquiryId, inline: true },
          { name: "언어", value: safeLocale, inline: true },
          { name: "유입경로", value: safeSource, inline: true },
          { name: "문의 내용", value: safeMessage, inline: false }
        ],
        footer: { text: "CareerBridge • Company Consultation" },
        timestamp: input.createdAt.toISOString()
      }
    ]
  };

  try {
    const response = await fetch(discordCompanyConsultationWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const responseBody = await response.text().catch(() => "");
      console.error("company_consultation_discord_webhook_failed", {
        status: response.status,
        statusText: response.statusText,
        body: responseBody.slice(0, 500)
      });
    }
  } catch (error) {
    console.error("company_consultation_discord_webhook_error", {
      error: getErrorMessage(error)
    });
  }
}

function getSignupRoleColor(role: MemberRole) {
  if (role === MemberRole.STUDENT) return 0x2563eb;
  if (role === MemberRole.PARTNER) return 0x10b981;
  if (role === MemberRole.OPERATOR) return 0xf59e0b;
  return 0x6b7280;
}

async function sendSignupDiscordNotification(input: {
  id: string;
  email: string;
  name: string | null;
  realName: string | null;
  role: MemberRole;
  partnerType: PartnerType | null;
  createdAt: Date;
}) {
  if (!discordSignupWebhookUrl) return;

  const truncateForDiscord = (text: string, maxLength: number) =>
    text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 14))}\n...[truncated]` : text;

  const safeName = truncateForDiscord((input.name ?? "").trim() || "-", 256);
  const safeRealName = truncateForDiscord((input.realName ?? "").trim() || "-", 256);
  const safeEmail = truncateForDiscord(input.email || "-", 1024);
  const safeRole = truncateForDiscord(input.role || "-", 256);
  const safePartnerType = truncateForDiscord(input.partnerType ?? "-", 256);
  const safeUserId = truncateForDiscord(input.id || "-", 256);

  const payload = {
    content: "",
    embeds: [
      {
        color: getSignupRoleColor(input.role),
        title: "✅ 신규 회원가입",
        description: "새 사용자가 가입했습니다.",
        fields: [
          { name: "Role", value: safeRole, inline: true },
          { name: "Partner Type", value: safePartnerType, inline: true },
          { name: "User ID", value: safeUserId, inline: true },
          { name: "이름", value: safeName, inline: true },
          { name: "실명", value: safeRealName, inline: true },
          { name: "이메일", value: safeEmail, inline: false }
        ],
        footer: { text: "CareerBridge • Signup" },
        timestamp: input.createdAt.toISOString()
      }
    ]
  };

  try {
    const response = await fetch(discordSignupWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const responseBody = await response.text().catch(() => "");
      console.error("signup_discord_webhook_failed", {
        status: response.status,
        statusText: response.statusText,
        body: responseBody.slice(0, 500)
      });
    }
  } catch (error) {
    console.error("signup_discord_webhook_error", {
      error: getErrorMessage(error)
    });
  }
}

async function sendCommunityPostDiscordNotification(input: {
  id: string;
  authorId: string | null;
  authorName: string | null;
  authorRole: MemberRole;
  category: string;
  title: string;
  body: string;
  imageUrls: string[];
  createdAt: Date;
}) {
  if (!discordCommunityPostWebhookUrl) return;

  const truncateForDiscord = (text: string, maxLength: number) =>
    text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 14))}\n...[truncated]` : text;

  const safeCategory = truncateForDiscord(input.category || "-", 256);
  const safeAuthor = truncateForDiscord(input.authorName || "-", 256);
  const safeAuthorRole = truncateForDiscord(input.authorRole || "-", 256);
  const safeAuthorId = truncateForDiscord(input.authorId || "-", 256);
  const safeBody = truncateForDiscord(input.body || "-", 1024);
  const safePostId = truncateForDiscord(input.id || "-", 256);
  const safeImageCount = String(input.imageUrls.length);
  const postUrl = `${platformWebUrl}/community?postId=${encodeURIComponent(input.id)}`;
  const safePostUrlField = truncateForDiscord(`[게시글 바로가기](${postUrl})`, 1024);

  const payload = {
    content: "",
    embeds: [
      {
        color: 0x8b5cf6,
        title: "📝 커뮤니티 새 글 등록",
        description: "새 커뮤니티 게시글이 작성되었습니다.",
        fields: [
          { name: "카테고리", value: safeCategory, inline: true },
          { name: "작성자", value: safeAuthor, inline: true },
          { name: "Role", value: safeAuthorRole, inline: true },
          { name: "작성자 ID", value: safeAuthorId, inline: true },
          { name: "게시글 ID", value: safePostId, inline: true },
          { name: "이미지 수", value: safeImageCount, inline: true },
          { name: "바로가기", value: safePostUrlField, inline: false },
          { name: "본문", value: safeBody, inline: false }
        ],
        footer: { text: "CareerBridge • Community" },
        timestamp: input.createdAt.toISOString()
      }
    ]
  };

  try {
    const response = await fetch(discordCommunityPostWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const responseBody = await response.text().catch(() => "");
      console.error("community_post_discord_webhook_failed", {
        status: response.status,
        statusText: response.statusText,
        body: responseBody.slice(0, 500)
      });
    }
  } catch (error) {
    console.error("community_post_discord_webhook_error", {
      error: getErrorMessage(error)
    });
  }
}

async function sendPositionApplyDiscordNotification(input: {
  positionId: string;
  positionTitle: string;
  applicantId: string;
  applicantName: string | null;
  applicantEmail: string;
  partnerName: string | null;
  appliedAt: Date;
}) {
  if (!discordPositionApplyWebhookUrl) return;

  const truncateForDiscord = (text: string, maxLength: number) =>
    text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 14))}\n...[truncated]` : text;

  const safePositionId = truncateForDiscord(input.positionId || "-", 256);
  const safePositionTitle = truncateForDiscord(input.positionTitle || "-", 256);
  const safeApplicantId = truncateForDiscord(input.applicantId || "-", 256);
  const safeApplicantName = truncateForDiscord((input.applicantName ?? "").trim() || "-", 256);
  const safeApplicantEmail = truncateForDiscord(input.applicantEmail || "-", 1024);
  const safePartnerName = truncateForDiscord(input.partnerName || "-", 256);
  const postUrl = `${platformWebUrl}/positions/${encodeURIComponent(input.positionId)}`;
  const safePostUrlField = truncateForDiscord(`[포지션 바로가기](${postUrl})`, 1024);

  const payload = {
    content: "",
    embeds: [
      {
        color: 0x0ea5e9,
        title: "📨 포지션 지원 접수",
        description: "새로운 포지션 지원이 접수되었습니다.",
        fields: [
          { name: "포지션", value: safePositionTitle, inline: true },
          { name: "파트너", value: safePartnerName, inline: true },
          { name: "지원자", value: safeApplicantName, inline: true },
          { name: "지원자 이메일", value: safeApplicantEmail, inline: false },
          { name: "지원자 ID", value: safeApplicantId, inline: true },
          { name: "포지션 ID", value: safePositionId, inline: true },
          { name: "바로가기", value: safePostUrlField, inline: false }
        ],
        footer: { text: "CareerBridge • Position Apply" },
        timestamp: input.appliedAt.toISOString()
      }
    ]
  };

  try {
    const response = await fetch(discordPositionApplyWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const responseBody = await response.text().catch(() => "");
      console.error("position_apply_discord_webhook_failed", {
        status: response.status,
        statusText: response.statusText,
        body: responseBody.slice(0, 500)
      });
    }
  } catch (error) {
    console.error("position_apply_discord_webhook_error", {
      error: getErrorMessage(error)
    });
  }
}

async function sendPositionCreateDiscordNotification(input: {
  positionId: string;
  positionTitle: string;
  partnerName: string | null;
  employmentType: string;
  employmentClassification?:
    | "UNPAID_INTERN_EXPERIENCE"
    | "UNPAID_INTERN_CONVERSION"
    | "PAID_INTERN_EXPERIENCE"
    | "PAID_INTERN_CONVERSION"
    | "PART_TIME"
    | "FULL_TIME"
    | null;
  workType: string | null;
  workLocation: string | null;
  createdByUserId: string;
  createdByUserName: string | null;
  createdByUserEmail: string | null;
  createdAt: Date;
}) {
  if (!discordPositionCreateWebhookUrl) return;
  const webhookTarget = (() => {
    try {
      const parsed = new URL(discordPositionCreateWebhookUrl);
      const parts = parsed.pathname.split("/").filter(Boolean);
      const webhookId = parts.length >= 2 ? parts[parts.length - 2] : "unknown";
      return `${parsed.host}/.../${webhookId}`;
    } catch {
      return "invalid_webhook_url";
    }
  })();

  const truncateForDiscord = (text: string, maxLength: number) =>
    text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 14))}\n...[truncated]` : text;
  const employmentTypeDisplayTitle = (() => {
    switch (input.employmentClassification) {
      case "UNPAID_INTERN_EXPERIENCE":
        return "무급 체험형 인턴";
      case "UNPAID_INTERN_CONVERSION":
        return "무급 전환형 인턴";
      case "PAID_INTERN_EXPERIENCE":
        return "유급 체험형 인턴";
      case "PAID_INTERN_CONVERSION":
        return "유급 전환형 인턴";
      case "PART_TIME":
        return "알바";
      case "FULL_TIME":
        return "정직원";
      default:
        break;
    }
    switch (input.employmentType) {
      case PositionEmploymentType.FULL_TIME:
        return "정직원";
      case PositionEmploymentType.INTERN:
        return "인턴";
      case PositionEmploymentType.PART_TIME:
        return "파트타임";
      case PositionEmploymentType.UNPAID_INTERN:
        return "무급 인턴";
      default:
        return input.employmentType || "-";
    }
  })();
  const workTypeDisplayTitle = (() => {
    switch ((input.workType ?? "").trim().toLowerCase()) {
      case "on-site":
      case "onsite":
        return "오피스 출근";
      case "hybrid":
        return "하이브리드";
      case "remote":
        return "원격";
      default:
        return input.workType || "-";
    }
  })();

  const safePositionId = truncateForDiscord(input.positionId || "-", 256);
  const safePositionTitle = truncateForDiscord(input.positionTitle || "-", 256);
  const safePartnerName = truncateForDiscord(input.partnerName || "-", 256);
  const safeEmploymentType = truncateForDiscord(employmentTypeDisplayTitle, 256);
  const safeWorkType = truncateForDiscord(workTypeDisplayTitle, 256);
  const safeWorkLocation = truncateForDiscord(input.workLocation || "-", 256);
  const safeCreatorId = truncateForDiscord(input.createdByUserId || "-", 256);
  const safeCreatorName = truncateForDiscord((input.createdByUserName ?? "").trim() || "-", 256);
  const safeCreatorEmail = truncateForDiscord(input.createdByUserEmail || "-", 1024);
  const postUrl = `${platformWebUrl}/positions/${encodeURIComponent(input.positionId)}`;
  const safePostUrlField = truncateForDiscord(`[포지션 바로가기](${postUrl})`, 1024);

  const payload = {
    content: "",
    embeds: [
      {
        color: 0x22c55e,
        title: "🆕 새로운 포지션 등록",
        description: "파트너가 새로운 포지션을 등록했습니다.",
        fields: [
          { name: "포지션", value: safePositionTitle, inline: true },
          { name: "파트너", value: safePartnerName, inline: true },
          { name: "고용 형태", value: safeEmploymentType, inline: true },
          { name: "근무 방식", value: safeWorkType, inline: true },
          { name: "근무 지역", value: safeWorkLocation, inline: true },
          { name: "포지션 ID", value: safePositionId, inline: true },
          { name: "등록자", value: safeCreatorName, inline: true },
          { name: "등록자 이메일", value: safeCreatorEmail, inline: true },
          { name: "등록자 ID", value: safeCreatorId, inline: true },
          { name: "바로가기", value: safePostUrlField, inline: false }
        ],
        footer: { text: "CareerBridge • Position Created" },
        timestamp: input.createdAt.toISOString()
      }
    ]
  };

  try {
    console.info("position_create_discord_webhook_attempt", {
      webhookTarget,
      positionId: input.positionId
    });
    const response = await fetch(discordPositionCreateWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const responseBody = await response.text().catch(() => "");
      console.error("position_create_discord_webhook_failed", {
        webhookTarget,
        status: response.status,
        statusText: response.statusText,
        body: responseBody.slice(0, 500)
      });
    }
  } catch (error) {
    console.error("position_create_discord_webhook_error", {
      webhookTarget,
      error: getErrorMessage(error)
    });
  }
}

function hasValidCompanyConsultationDiscordTestToken(req: express.Request) {
  if (!companyConsultationDiscordTestToken) return false;
  const token = req.header("x-internal-token")?.trim() ?? "";
  return token.length > 0 && token === companyConsultationDiscordTestToken;
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
  const ttl = signupEmailVerificationCodeTtlMinutes;
  const isKo = locale === "ko";

  const subject = isKo
    ? `Aply 회원가입 인증 코드 (${code})`
    : `Aply signup verification code (${code})`;

  const text = isKo
    ? [
        "안녕하세요. Aply입니다.",
        "",
        "Aply 회원가입을 위한 이메일 인증 코드입니다.",
        "",
        `인증 코드: ${code}`,
        "",
        `이 코드는 ${ttl}분 후 만료됩니다.`,
        "회원가입을 신청하지 않으셨다면 이 메일을 무시하시면 됩니다.",
        "",
        "문의: info@flip-ers.com",
        "웹사이트: https://aply.global",
        "",
        "주식회사 플리퍼스 (Flippers Inc.)"
      ].join("\n")
    : [
        "Hi, this is Aply.",
        "",
        "Use the code below to verify your email address for Aply signup.",
        "",
        `Verification code: ${code}`,
        "",
        `This code expires in ${ttl} minutes.`,
        "If you did not sign up for Aply, you can ignore this email.",
        "",
        "Support: info@flip-ers.com",
        "Website: https://aply.global",
        "",
        "Flippers Inc."
      ].join("\n");

  const bodyHtml = isKo
    ? `
      <p style="margin:0 0 16px;font-size:15px;color:#111827;">안녕하세요. <strong>Aply</strong>입니다.</p>
      <p style="margin:0 0 24px;font-size:15px;color:#374151;">
        아래 인증 코드를 회원가입 화면에 입력하여 이메일 인증을 완료해 주세요.
      </p>
      <div style="margin:24px 0;padding:20px 16px;text-align:center;background:#F3F7FF;border-radius:12px;">
        <p style="margin:0 0 8px;font-size:12px;color:#6b7280;letter-spacing:0.04em;">인증 코드</p>
        <p style="margin:0;font-size:32px;font-weight:800;letter-spacing:8px;color:#0B46E8;font-family:'SFMono-Regular','Consolas','Liberation Mono',monospace;">${code}</p>
      </div>
      <div style="margin:24px 0;padding:14px 16px;background:#F9FAFB;border-left:3px solid #0B46E8;border-radius:6px;font-size:13px;color:#4b5563;line-height:1.6;">
        <strong style="color:#111827;">안내</strong><br />
        • 이 코드는 발송 시점부터 <strong>${ttl}분</strong> 동안만 유효합니다.<br />
        • 회원가입을 신청하지 않으셨다면 이 메일을 무시하셔도 됩니다.<br />
        • 코드를 다른 사람과 공유하지 마세요.
      </div>
    `
    : `
      <p style="margin:0 0 16px;font-size:15px;color:#111827;">Hi, this is <strong>Aply</strong>.</p>
      <p style="margin:0 0 24px;font-size:15px;color:#374151;">
        Please enter the code below on the signup screen to verify your email address.
      </p>
      <div style="margin:24px 0;padding:20px 16px;text-align:center;background:#F3F7FF;border-radius:12px;">
        <p style="margin:0 0 8px;font-size:12px;color:#6b7280;letter-spacing:0.04em;">Verification code</p>
        <p style="margin:0;font-size:32px;font-weight:800;letter-spacing:8px;color:#0B46E8;font-family:'SFMono-Regular','Consolas','Liberation Mono',monospace;">${code}</p>
      </div>
      <div style="margin:24px 0;padding:14px 16px;background:#F9FAFB;border-left:3px solid #0B46E8;border-radius:6px;font-size:13px;color:#4b5563;line-height:1.6;">
        <strong style="color:#111827;">Note</strong><br />
        • This code is valid for <strong>${ttl} minutes</strong> from the time it was sent.<br />
        • If you did not sign up for Aply, you can ignore this email.<br />
        • Never share this code with anyone.
      </div>
    `;

  const html = renderEmailLayout({
    locale,
    previewText: isKo
      ? `Aply 회원가입 인증 코드: ${code} (${ttl}분 후 만료)`
      : `Your Aply verification code: ${code} (expires in ${ttl} minutes)`,
    title: isKo ? "회원가입 인증 코드" : "Signup verification code",
    bodyHtml
  });

  if (transporter) {
    await transporter.sendMail({
      from: emailFromAddress,
      to: email,
      replyTo: emailReplyToAddress,
      subject,
      text,
      html,
      envelope: emailEnvelopeFrom ? { from: emailEnvelopeFrom, to: email } : undefined,
      headers: {
        "X-Mailer": "Aply Mailer",
        "X-Auto-Response-Suppress": "OOF, AutoReply",
        "Auto-Submitted": "auto-generated"
      }
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
      replyTo: emailReplyToAddress,
      subject: content.subject,
      text: content.text,
      html: content.html,
      envelope: emailEnvelopeFrom ? { from: emailEnvelopeFrom, to: email } : undefined,
      headers: {
        "X-Mailer": "Aply Mailer",
        "X-Auto-Response-Suppress": "OOF, AutoReply",
        "Auto-Submitted": "auto-generated"
      }
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

function getRefreshTokenFromRequest(req: express.Request) {
  const fromCookie = parseCookies(req.headers.cookie)[refreshCookieName];
  if (fromCookie) return fromCookie;
  if (req.body && typeof req.body === "object" && "refreshToken" in req.body && typeof req.body.refreshToken === "string") {
    return req.body.refreshToken;
  }
  return null;
}

function slugifyPartnerOrganizationName(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "partner";
}

async function generateUniquePartnerOrganizationSlug(
  name: string,
  db: Pick<Prisma.TransactionClient, "partnerOrganization"> | Pick<PrismaClient, "partnerOrganization">
) {
  const base = slugifyPartnerOrganizationName(name);
  let candidate = base;
  let sequence = 2;

  while (true) {
    const exists = await db.partnerOrganization.findUnique({
      where: { slug: candidate },
      select: { id: true }
    });
    if (!exists) return candidate;
    candidate = `${base}-${sequence}`;
    sequence += 1;
  }
}

function generatePartnerJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const chars = Array.from({ length: 10 }, () => alphabet[randomInt(0, alphabet.length)]).join("");
  return `PJT-${chars.slice(0, 5)}-${chars.slice(5)}`;
}

function generateNicknameFromEmail(email?: string | null) {
  const localPart = (email ?? "").split("@")[0]?.toLowerCase() ?? "";
  const cleaned = localPart.replace(/[^a-z0-9]/g, "").slice(0, 12);
  const base = cleaned || "user";
  const suffix = randomInt(1000, 10000).toString();
  return `${base}${suffix}`;
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

function setOAuthStateCookie(res: express.Response, value: string) {
  const parts = [
    `${oauthStateCookieName}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=600"
  ];
  if (isProduction) parts.push("Secure");
  res.append("Set-Cookie", parts.join("; "));
}

function clearOAuthStateCookie(res: express.Response) {
  const parts = [
    `${oauthStateCookieName}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0"
  ];
  if (isProduction) parts.push("Secure");
  res.append("Set-Cookie", parts.join("; "));
}

function signOAuthState(payload: Record<string, unknown>) {
  const body = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const sig = createHmac("sha256", oauthStateSecret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifyOAuthState(value: string): Record<string, unknown> | null {
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", oauthStateSecret).update(body).digest("base64url");
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function buildOAuthReturnUrl(provider: "naver" | "google" | "kakao", params: Record<string, string>) {
  const fragment = new URLSearchParams(params).toString();
  return `${platformWebUrl}/auth/${provider}/return#${fragment}`;
}

const REAUTH_TOKEN_TTL_MS = 5 * 60 * 1000;

function signReauthToken(userId: string, purpose: "delete_account") {
  return signOAuthState({ kind: "reauth", userId, purpose, ts: Date.now() });
}

function verifyReauthToken(token: string, userId: string, purpose: "delete_account") {
  const data = verifyOAuthState(token);
  if (!data) return false;
  if (data.kind !== "reauth") return false;
  if (data.userId !== userId) return false;
  if (data.purpose !== purpose) return false;
  const ts = typeof data.ts === "number" ? data.ts : 0;
  if (!ts || Date.now() - ts > REAUTH_TOKEN_TTL_MS) return false;
  return true;
}

function buildOAuthErrorUrl(code: string, message?: string) {
  const params: Record<string, string> = { error: code };
  if (message) params.message = message;
  return `${platformWebUrl}/login?${new URLSearchParams(params).toString()}`;
}

function isAllowedCorsOrigin(origin: string) {
  if (allowedOrigins.includes(origin)) return true;
  if (allowedOriginHostSuffixes.length === 0) return false;
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return allowedOriginHostSuffixes.some((suffix) => hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

// Throttle "rejected origin" log so a single scraper can't flood stdout.
const recentRejectedOrigins = new Map<string, number>();
const REJECTED_ORIGIN_LOG_WINDOW_MS = 5 * 60 * 1000;

function logRejectedCorsOrigin(origin: string) {
  const now = Date.now();
  const last = recentRejectedOrigins.get(origin);
  if (last && now - last < REJECTED_ORIGIN_LOG_WINDOW_MS) return;
  recentRejectedOrigins.set(origin, now);
  if (recentRejectedOrigins.size > 256) {
    const cutoff = now - REJECTED_ORIGIN_LOG_WINDOW_MS;
    for (const [key, ts] of recentRejectedOrigins) {
      if (ts < cutoff) recentRejectedOrigins.delete(key);
    }
  }
  console.warn(`[cors] rejected origin: ${origin}`);
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || isAllowedCorsOrigin(origin)) {
      callback(null, true);
      return;
    }
    // Don't throw — that would 500 the request and spam Discord. Just deny
    // the CORS headers, which makes the browser block the response on its
    // side (correct behavior). Log the origin so we can spot recurring
    // patterns (real users vs. scrapers) in Azure container logs.
    logRejectedCorsOrigin(origin);
    callback(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: "12mb" }));

type RateLimitBucket = { count: number; resetAt: number };
const rateLimitStore = new Map<string, RateLimitBucket>();

function rateLimit(options: { windowMs: number; max: number; keyPrefix: string; message?: string }) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown";
    const key = `${options.keyPrefix}:${ip}`;
    const now = Date.now();
    const bucket = rateLimitStore.get(key);
    if (!bucket || bucket.resetAt < now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > options.max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        ok: false,
        message: options.message ?? "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
        retryAfterSeconds: retryAfter
      });
    }
    return next();
  };
}

// Cleanup expired buckets every 5 minutes to avoid memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (bucket.resetAt < now) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "auth", message: "로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요." });
const searchRateLimit = rateLimit({ windowMs: 60 * 1000, max: 60, keyPrefix: "search" });
const writeRateLimit = rateLimit({ windowMs: 60 * 1000, max: 120, keyPrefix: "write" });

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
  { method: "post", path: "/internal/company-consultations/discord-test", summary: "Trigger company consultation Discord webhook test", tag: "System", requestBody: false },
  { method: "get", path: "/members/meta", summary: "Members metadata", tag: "Members" },
  { method: "get", path: "/positions", summary: "Public positions list", tag: "Positions" },
  { method: "post", path: "/company-consultations", summary: "Create company consultation inquiry", tag: "Company Consultation", requestBody: true, successStatus: "201" },
  { method: "get", path: "/community/posts", summary: "Public community posts list", tag: "Community" },
  { method: "get", path: "/community/authors/:userId", summary: "Public community author profile", tag: "Community" },
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
  { method: "get", path: "/members/me/resumes", summary: "List my resumes", tag: "Members", secure: true },
  { method: "post", path: "/members/me/resumes", summary: "Create a resume", tag: "Members", secure: true, requestBody: true, successStatus: "201" },
  { method: "get", path: "/members/me/resumes/:resumeId", summary: "Get my resume", tag: "Members", secure: true },
  { method: "patch", path: "/members/me/resumes/:resumeId", summary: "Update my resume", tag: "Members", secure: true, requestBody: true },
  { method: "delete", path: "/members/me/resumes/:resumeId", summary: "Delete my resume", tag: "Members", secure: true },
  { method: "post", path: "/members/me/resumes/:resumeId/primary", summary: "Set my representative resume", tag: "Members", secure: true },
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
  { method: "delete", path: "/partner/positions/:id", summary: "Delete position (partner own / operator any)", tag: "Partner", secure: true },
  { method: "get", path: "/partner/applicants", summary: "List my partner applicants", tag: "Partner", secure: true },
  { method: "get", path: "/partner/applicants/:id", summary: "Get my partner applicant detail", tag: "Partner", secure: true },
  { method: "patch", path: "/partner/applicants/:id", summary: "Update my partner applicant state", tag: "Partner", secure: true, requestBody: true },

  { method: "get", path: "/ops/dashboard", summary: "Ops dashboard summary", tag: "Ops Dashboard", secure: true },
  { method: "get", path: "/ops/partners/meta", summary: "Partner metadata", tag: "Ops Partners", secure: true },
  { method: "get", path: "/ops/positions/meta", summary: "Position metadata", tag: "Ops Positions", secure: true },
  { method: "get", path: "/ops/partners", summary: "List partners", tag: "Ops Partners", secure: true },
  { method: "get", path: "/ops/partners/:id", summary: "Get partner detail", tag: "Ops Partners", secure: true },
  { method: "post", path: "/ops/partners", summary: "Create partner", tag: "Ops Partners", secure: true, requestBody: true, successStatus: "201" },
  { method: "patch", path: "/ops/partners/:id", summary: "Update partner", tag: "Ops Partners", secure: true, requestBody: true },
  { method: "post", path: "/ops/partners/:id/members", summary: "Create partner member", tag: "Ops Partners", secure: true, requestBody: true, successStatus: "201" },
  { method: "post", path: "/ops/partners/:id/join-codes", summary: "Create partner join code", tag: "Ops Partners", secure: true, requestBody: true, successStatus: "201" },
  { method: "delete", path: "/ops/partners/:id/members/:memberId", summary: "Delete partner member", tag: "Ops Partners", secure: true },
  { method: "get", path: "/ops/partner-users", summary: "List partner users", tag: "Ops Partners", secure: true },
  { method: "patch", path: "/ops/partner-users/:id/admin-memo", summary: "Update partner user admin memo", tag: "Ops Partners", secure: true, requestBody: true },
  { method: "get", path: "/ops/users", summary: "List all users", tag: "Ops Users", secure: true },
  { method: "patch", path: "/ops/users/:id/admin-memo", summary: "Update user admin memo", tag: "Ops Users", secure: true, requestBody: true },
  { method: "delete", path: "/ops/users/:id", summary: "Hard-delete user (super-admin only)", tag: "Ops Users", secure: true },
  { method: "get", path: "/ops/stale-unverified", summary: "Count + sample of email-unverified users older than 7 days", tag: "Ops Users", secure: true },
  { method: "post", path: "/ops/stale-unverified/wipe", summary: "Bulk-delete stale unverified users (require confirm=DELETE)", tag: "Ops Users", secure: true, requestBody: true },

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

function getRequestOrigin(req: express.Request) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : (forwardedProto?.split(",")[0]?.trim() || req.protocol);
  const host = req.get("host");
  return host ? `${proto}://${host}` : `http://localhost:${port}`;
}

app.get("/openapi.json", (req, res) => {
  const origin = getRequestOrigin(req);
  return res.json({
    ...openApiDocument,
    servers: [
      { url: origin, description: "Current environment" },
      { url: `http://localhost:${port}`, description: "Local development" }
    ]
  });
});
const swaggerUiHandler = swaggerUi.setup(undefined, {
  explorer: true,
  swaggerOptions: {
    url: "/openapi.json"
  }
});
app.use("/api-docs", swaggerUi.serve, swaggerUiHandler);
app.use("/swagger", swaggerUi.serve, swaggerUiHandler);
app.use("/docs", swaggerUi.serve, swaggerUiHandler);

const memberRoleEnum = z.nativeEnum(MemberRole);
const partnerTypeEnum = z.nativeEnum(PartnerType);
const partnerIndustryEnum = z.nativeEnum(PartnerIndustry);
const partnerCompanySizeEnum = z.enum(["SIZE_1_10", "SIZE_UNDER_30", "SIZE_UNDER_50", "SIZE_OVER_100"]);
const partnerOrgUserRoleEnum = z.nativeEnum(PartnerOrgUserRole);
const positionStatusEnum = z.nativeEnum(PositionStatus);
const positionWorkTypeEnum = z.enum(["On-site", "Hybrid", "Remote"]);
const positionEmploymentTypeEnum = z.nativeEnum(PositionEmploymentType);
const positionSourceKindEnum = z.nativeEnum(PositionSourceKind);
const positionSourceProviderEnum = z.nativeEnum(PositionSourceProvider);
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

    // Partner accounts may sign up first and create/join an organization later.
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
  // Operator slicing — every filter is server-side and combinable.
  partnerType: z.enum(["UNIVERSITY", "COMPANY", "AGENCY"]).optional(),
  companySize: z.enum(["SIZE_1_10", "SIZE_UNDER_30", "SIZE_UNDER_50", "SIZE_OVER_100"]).optional(),
  industry: z.string().trim().max(40).optional(),
  // Booleans arrive as "true" / "false" / "1" / "0" from query strings.
  verificationApproved: z
    .union([z.boolean(), z.enum(["true", "false", "1", "0"]).transform((v) => v === "true" || v === "1")])
    .optional(),
  sortBy: z.enum(["name", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().refine((v) => [20, 30, 40, 100].includes(v), "pageSize must be one of 20,30,40,100").optional()
});
const listPartnerUsersQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  partnerOrganizationId: z.string().uuid().optional(),
  // Ops filter: surface only verified or only unverified accounts. Accepts a
  // boolean coerced from query strings (e.g. "true" / "false" / "1" / "0").
  emailVerified: z
    .union([z.boolean(), z.enum(["true", "false", "1", "0"]).transform((v) => v === "true" || v === "1")])
    .optional(),
  // Only honored by `/ops/users` (all-users view). `/ops/partner-users`
  // hard-codes role = PARTNER and ignores this field.
  role: z.enum(["STUDENT", "PARTNER", "OPERATOR"]).optional(),
  // Signup channel — honored by both `/ops/users` and `/ops/partner-users`.
  authProvider: z.enum(["EMAIL", "NAVER", "KAKAO", "GOOGLE"]).optional(),
  // Partner org-internal role (OWNER / ADMIN / MEMBER). Only meaningful for
  // PARTNER users — `/ops/users` ignores this. `/ops/partner-users` honors it.
  partnerOrgRole: z.enum(["OWNER", "ADMIN", "MEMBER"]).optional(),
  sortBy: z.enum(["email", "name", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().refine((v) => [20, 30, 40, 100].includes(v), "pageSize must be one of 20,30,40,100").optional()
});

const updatePartnerOrganizationSchema = z.object({
  partnerType: partnerTypeEnum,
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
const updatePartnerVerificationApprovalSchema = z.object({
  approved: z.boolean()
});
const createPartnerSignupRequestSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  companyIndustry: z.string().trim().min(1).max(80),
  companySize: z.string().trim().min(1).max(80),
  requesterName: z.string().trim().min(1).max(120),
  requesterEmail: z.string().trim().toLowerCase().email().max(320),
  requesterPhone: z.string().trim().max(30).optional()
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

// More permissive validators for user-facing forms. The strict z.string().datetime()
// and z.string().url() reject inputs that users reasonably expect to work
// (date-only strings, URLs without scheme), which surfaces as "invalid request"
// in the UI with no actionable hint. These helpers accept the common cases and
// normalize them server-side.
const flexibleDateString = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (!value) return true;
      // Accept ISO datetime (2026-01-15T00:00:00.000Z), date-only
      // (2026-01-15), and any string Date can parse.
      return !Number.isNaN(new Date(value).getTime());
    },
    { message: "invalid date" }
  );

const flexibleUrlString = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (value) => {
      if (!value) return true;
      // Allow URLs with or without scheme. We prepend https:// before storing.
      const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
      try {
        const u = new URL(candidate);
        return !!u.hostname && u.hostname.includes(".");
      } catch {
        return false;
      }
    },
    { message: "invalid url" }
  );

// Image data URLs are base64-encoded, so ~33% larger than the binary. 8MB of
// base64 string ≈ 6MB of original photo, which is roughly the size of an
// iPhone photo after the client-side WebP conversion already does.
const IMAGE_DATA_URL_MAX = 8 * 1024 * 1024;
const DOCUMENT_DATA_URL_MAX = 12 * 1024 * 1024;

const updateMyBasicInfoSchema = z.object({
  realName: z.string().trim().min(1).max(120).nullable().optional(),
  name: z.string().trim().min(1).max(120).optional(),
  phoneNumber: z.string().trim().max(30).nullable().optional(),
  birthDate: flexibleDateString.nullable().optional(),
  gender: z.string().trim().max(40).nullable().optional(),
  profileImageData: z.string().max(IMAGE_DATA_URL_MAX).nullable().optional()
});

const updateMyPartnerOrganizationBasicSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  industry: partnerIndustryEnum.optional(),
  companySize: partnerCompanySizeEnum.nullable().optional(),
  website: flexibleUrlString.nullable().optional(),
  socialMedia: z.string().trim().max(2000).nullable().optional(),
  officeAddress: z.string().trim().max(300).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  strengths: z.string().trim().max(2000).nullable().optional(),
  businessRegistrationDocumentData: z.string().trim().max(DOCUMENT_DATA_URL_MAX).nullable().optional(),
  fourInsuranceSubscriberListData: z.string().trim().max(DOCUMENT_DATA_URL_MAX).nullable().optional(),
  companyLogoImageData: z.string().trim().max(IMAGE_DATA_URL_MAX).nullable().optional(),
  officePhotoImageData: z.string().trim().max(IMAGE_DATA_URL_MAX).nullable().optional()
});
const joinMyPartnerOrganizationSchema = z.object({
  code: z.string().trim().min(6).max(64)
});
const createPartnerJoinCodeSchema = z.object({
  expiresInMinutes: z.number().int().min(5).max(partnerJoinCodeTtlMinutesMax).optional()
});

const updateCandidateProfileSchema = z.object({
  workPermit: z.boolean().nullable().optional(),
  visaType: candidateVisaTypeEnum.nullable().optional(),
  visaExpiryDate: flexibleDateString.nullable().optional(),
  livesInKorea: z.boolean().nullable().optional(),
  hasAccommodation: z.boolean().nullable().optional(),
  residenceProvince: z.string().trim().max(120).nullable().optional(),
  residenceDistrict: z.string().trim().max(120).nullable().optional(),
  residenceAddress: z.string().trim().max(240).nullable().optional(),
  preferredProgramDuration: candidateProgramDurationEnum.nullable().optional(),
  programStartOption: candidateProgramStartOptionEnum.nullable().optional(),
  programStartDate: flexibleDateString.nullable().optional(),
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
  startDate: flexibleDateString.nullable().optional(),
  endDate: flexibleDateString.nullable().optional(),
  isKoreanSchool: z.boolean().nullable().optional()
});

// Resume content is a free-form structured document the builder owns; we
// validate the envelope (title + content object) and let the content shape
// evolve on the client without a schema migration.
const createResumeSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.record(z.string(), z.unknown()).optional()
});
const updateResumeSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  content: z.record(z.string(), z.unknown()).optional()
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
  startDate: flexibleDateString.nullable().optional(),
  endDate: flexibleDateString.nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional()
});

const createCandidateActivityExperienceSchema = z.object({
  title: z.string().trim().min(1).max(200),
  activityType: candidateActivityTypeEnum,
  organization: z.string().trim().max(200).nullable().optional(),
  startDate: flexibleDateString.nullable().optional(),
  endDate: flexibleDateString.nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(120)).max(50).optional()
});

const updateCandidateEmailVerifiedSchema = z.object({
  emailVerified: z.boolean()
});

const lineArraySchema = z.array(z.string().trim().min(1).max(200)).max(200).optional();
const employmentClassificationSchema = z.enum([
  "UNPAID_INTERN_EXPERIENCE",
  "UNPAID_INTERN_CONVERSION",
  "PAID_INTERN_EXPERIENCE",
  "PAID_INTERN_CONVERSION",
  "PART_TIME",
  "FULL_TIME"
]);

const createPositionSchema = z.object({
  partnerOrganizationId: z.string().uuid().optional(),
  sourceKind: positionSourceKindEnum.optional(),
  sourceProvider: positionSourceProviderEnum.optional(),
  sourceExternalId: z.string().trim().max(200).optional(),
  sourceUrl: z.string().trim().url().max(5000).optional(),
  sourceFetchedAt: z.string().datetime().optional(),
  title: z.string().trim().min(1).max(200),
  status: positionStatusEnum.optional(),
  workType: positionWorkTypeEnum.optional(),
  employmentType: positionEmploymentTypeEnum.optional(),
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
    status: z.enum(["DRAFT", "PENDING_REVIEW"]).optional(),
    employmentClassification: employmentClassificationSchema.optional()
  });
const updatePartnerPositionSchema = createPartnerPositionSchema.partial().extend({
  status: z.enum(["OPEN", "PAUSED", "CLOSED"]).optional()
});

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

const listPositionRevisionsQuerySchema = z.object({
  status: z.nativeEnum(PositionRevisionStatus).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional()
});

const reviewPositionRevisionSchema = z.object({
  note: z.string().trim().max(500).optional()
});

const listPositionsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: positionStatusEnum.optional(),
  partnerOrganizationId: z.string().uuid().optional(),
  partnerIndustry: z.nativeEnum(PartnerIndustry).optional(),
  partnerCompanySize: partnerCompanySizeEnum.optional(),
  sourceKind: positionSourceKindEnum.optional(),
  sourceProvider: positionSourceProviderEnum.optional(),
  sortBy: z.enum(["title", "status", "hiringCount", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().refine((v) => [20, 30, 40, 100].includes(v), "pageSize must be one of 20,30,40,100").optional()
});
const listPublicPositionsCursorQuerySchema = z.object({
  cursor: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(120).optional(),
  sourceProvider: z.union([positionSourceProviderEnum, z.array(positionSourceProviderEnum)]).optional(),
  jobRole: z.union([z.string().trim().min(1).max(120), z.array(z.string().trim().min(1).max(120))]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  sort: z.enum(["latest", "deadline"]).optional(),
  // Viewer locale — when non-Korean, INTERNAL postings are served in English
  // (cached per-position in Position.translations.en).
  locale: z.string().trim().min(2).max(8).optional()
});
const positionDetailQuerySchema = z.object({
  locale: z.string().trim().min(2).max(8).optional()
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
const sajuPredictSchema = z.object({
  name: z.string().trim().min(1).max(40),
  gender: z.enum(["male", "female"]),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  calendarType: z.enum(["solar", "lunar"]).optional(),
  locale: z.string().trim().min(2).max(8).optional()
});
const sajuResultParamSchema = z.object({
  slug: z.string().trim().min(1).max(80)
});
const sajuResultQuerySchema = z.object({
  locale: z.enum(["ko", "en", "zh-CN", "vi", "ja", "id"]).optional()
});
// Career info collected AFTER the free saju result, before signup. All
// optional except a couple of anchors so the funnel can save a partial
// lead; the recommendation engine downgrades the pool stage when fields
// are missing.
const sajuLeadSchema = z.object({
  shareSlug: z.string().trim().min(1).max(80),
  nationality: z.string().trim().max(80).optional(),
  school: z.string().trim().max(120).optional(),
  major: z.string().trim().max(120).optional(),
  visaType: z.string().trim().max(40).optional(),
  koreanLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "NATIVE"]).optional(),
  englishLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "NATIVE"]).optional(),
  preferredJobRole: z.string().trim().max(40).optional(),
  workType: z.enum(["INTERN", "PART_TIME", "PROJECT", "FULL_TIME"]).optional(),
  contact: z.string().trim().max(120).optional(),
  contactType: z.enum(["EMAIL", "PHONE", "KAKAO", "WHATSAPP"]).optional(),
  hasResume: z.boolean().optional(),
  consentCareer: z.boolean().optional(),
  consentRecommend: z.boolean().optional(),
  consentContact: z.boolean().optional(),
  locale: z.string().trim().min(2).max(8).optional()
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
  profileImageUrl?: string | null;
  adminMemo: string | null;
  role: MemberRole;
  authProvider?: AuthProvider;
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
    profileImageUrl: user.profileImageUrl ?? null,
    adminMemo: user.adminMemo ?? null,
    role: user.role,
    authProvider: user.authProvider ?? AuthProvider.EMAIL,
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
        resumeUrl?: string | null;
        resumeFileName?: string | null;
        coverLetterUrl?: string | null;
        coverLetterFileName?: string | null;
        portfolioUrl?: string | null;
        portfolioFileName?: string | null;
        passportImageUrl?: string | null;
        passportImageFileName?: string | null;
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
      resumeUrl: null,
      resumeFileName: null,
      coverLetterUrl: null,
      coverLetterFileName: null,
      portfolioUrl: null,
      portfolioFileName: null,
      passportImageUrl: null,
      passportImageFileName: null,
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
    resumeUrl: profile.resumeUrl ?? null,
    resumeFileName: profile.resumeFileName ?? null,
    coverLetterUrl: profile.coverLetterUrl ?? null,
    coverLetterFileName: profile.coverLetterFileName ?? null,
    portfolioUrl: profile.portfolioUrl ?? null,
    portfolioFileName: profile.portfolioFileName ?? null,
    passportImageUrl: profile.passportImageUrl ?? null,
    passportImageFileName: profile.passportImageFileName ?? null,
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
  name: string;
  slug?: string | null;
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
  verificationApproved?: boolean;
  verificationApprovedAt?: Date | null;
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
    !verificationAssets.fourInsuranceSubscriberListData ? "FOUR_INSURANCE_SUBSCRIBER_LIST" : null
  ].filter((itemName): itemName is string => Boolean(itemName));
  const uploadedCount = 2 - missingItems.length;
  const hasRequiredDocuments = missingItems.length === 0;
  const isApproved = Boolean(item.verificationApproved);
  // 운영 상태는 운영자 승인 여부를 단일 기준으로 사용한다.
  const isVerified = isApproved;

  return {
    id: item.id,
    partnerType: item.partnerType,
    name: item.name,
    slug: item.slug ?? null,
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
      hasRequiredDocuments,
      isApproved,
      approvedAt: item.verificationApprovedAt ?? null,
      isVerified,
      uploadedCount,
      requiredCount: 2,
      missingItems
    },
    permissions: {
      canPostPositions: isApproved,
      canContactCandidates: isApproved
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

let azureContainerClientCache: any | null | undefined;

function getAzureContainerClient(): any | null {
  if (azureContainerClientCache !== undefined) return azureContainerClientCache;
  if (!azureStorageConnectionString) {
    azureContainerClientCache = null;
    return azureContainerClientCache;
  }
  // Lazy-load SDK to avoid hard failure when storage is not configured.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { BlobServiceClient } = require("@azure/storage-blob") as { BlobServiceClient: { fromConnectionString: (cs: string) => any } };
  const service = BlobServiceClient.fromConnectionString(azureStorageConnectionString);
  azureContainerClientCache = service.getContainerClient(azureStorageContainerName);
  return azureContainerClientCache;
}

function inferImageExtFromMime(mime: string): string {
  const normalized = mime.toLowerCase();
  if (normalized === "image/jpeg") return "jpg";
  if (normalized === "image/png") return "png";
  if (normalized === "image/webp") return "webp";
  if (normalized === "image/gif") return "gif";
  if (normalized === "image/svg+xml") return "svg";
  if (normalized === "image/heic") return "heic";
  return "bin";
}

async function uploadDataUrlImageIfNeeded(value: string, prefix: string): Promise<string> {
  const raw = value.trim();
  // Policy:
  // - Keep bundled/static/remote URLs as-is.
  // - Upload only real user-upload payloads (data URLs) to Blob.
  if (
    raw.startsWith("/")
    || raw.startsWith("./")
    || raw.startsWith("../")
    || /^https?:\/\//i.test(raw)
  ) {
    return raw;
  }
  if (!/^data:image\//i.test(raw)) return raw;

  const match = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i);
  if (!match) return raw;

  const container = getAzureContainerClient();
  if (!container) return raw;

  await container.createIfNotExists({ access: "blob" });
  const mime = match[1]!;
  const base64Data = match[2]!;
  const content = Buffer.from(base64Data, "base64");
  const ext = inferImageExtFromMime(mime);
  const blobName = `${prefix}/${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;
  const client = container.getBlockBlobClient(blobName);
  await client.uploadData(content, {
    blobHTTPHeaders: {
      blobContentType: mime,
      blobCacheControl: "public, max-age=31536000, immutable"
    }
  });
  return client.url;
}

async function uploadImageArrayIfNeeded(values: string[] | undefined, prefix: string): Promise<string[]> {
  const items = normalizeStringArray(values);
  const out: string[] = [];
  for (const item of items) {
    out.push(await uploadDataUrlImageIfNeeded(item, prefix));
  }
  return out;
}

// ---- candidate document upload (multipart/form-data) ----------------------
// Used for resume, cover letter, portfolio, passport image — files too large
// or non-image to ride the data-URL pipeline.

const CANDIDATE_DOCUMENT_ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const candidateDocumentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (CANDIDATE_DOCUMENT_ALLOWED_MIME.has(file.mimetype.toLowerCase())) return cb(null, true);
    return cb(new Error("Unsupported file type"));
  }
});

function inferDocumentExt(mime: string): string {
  const m = mime.toLowerCase();
  if (m === "application/pdf") return "pdf";
  if (m === "application/msword") return "doc";
  if (m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  if (m === "image/jpeg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  return "bin";
}

async function uploadCandidateDocumentToBlob(
  file: Express.Multer.File,
  prefix: string
): Promise<string> {
  const container = getAzureContainerClient();
  if (!container) {
    throw new Error("Azure Blob storage is not configured (AZURE_STORAGE_CONNECTION_STRING missing).");
  }
  await container.createIfNotExists({ access: "blob" });
  const ext = inferDocumentExt(file.mimetype);
  const blobName = `${prefix}/${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;
  const client = container.getBlockBlobClient(blobName);
  await client.uploadData(file.buffer, {
    blobHTTPHeaders: {
      blobContentType: file.mimetype,
      blobContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.originalname)}`
    }
  });
  return client.url;
}

type CandidateDocumentKind = "resume" | "coverLetter" | "portfolio" | "passportImage";

const CANDIDATE_DOCUMENT_FIELDS: Record<
  CandidateDocumentKind,
  { urlField: string; nameField: string }
> = {
  resume: { urlField: "resumeUrl", nameField: "resumeFileName" },
  coverLetter: { urlField: "coverLetterUrl", nameField: "coverLetterFileName" },
  portfolio: { urlField: "portfolioUrl", nameField: "portfolioFileName" },
  passportImage: { urlField: "passportImageUrl", nameField: "passportImageFileName" }
};

type CrawlerRunSummary = {
  sourceProvider?: string;
  sourcePlatform?: string;
  created?: number;
  updated?: number;
  skipped?: number;
  total?: number;
  [key: string]: unknown;
};

function extractLastJsonObject(text: string): CrawlerRunSummary | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const firstBrace = trimmed.lastIndexOf("\n{");
  const candidate = (firstBrace >= 0 ? trimmed.slice(firstBrace + 1) : trimmed).trim();
  try {
    return JSON.parse(candidate) as CrawlerRunSummary;
  } catch {
    return null;
  }
}

function nextRunAtKst(hour: number, minute: number): Date {
  const now = new Date();
  const nowKst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = nowKst.getUTCFullYear();
  const m = nowKst.getUTCMonth();
  const d = nowKst.getUTCDate();
  const runKst = new Date(Date.UTC(y, m, d, hour, minute, 0, 0));
  const nextKst = runKst.getTime() > nowKst.getTime()
    ? runKst
    : new Date(Date.UTC(y, m, d + 1, hour, minute, 0, 0));
  return new Date(nextKst.getTime() - 9 * 60 * 60 * 1000);
}

async function runCrawlerScript(scriptPath: string): Promise<CrawlerRunSummary | null> {
  return await new Promise<CrawlerRunSummary | null>((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", scriptPath], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdoutText = "";
    let stderrText = "";
    child.stdout.on("data", (chunk: Buffer | string) => {
      const text = chunk.toString();
      stdoutText += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      const text = chunk.toString();
      stderrText += text;
      process.stderr.write(text);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(extractLastJsonObject(stdoutText));
        return;
      }
      reject(
        new Error(
          `${scriptPath} exited with code ${code ?? "unknown"}`
          + (stderrText.trim() ? ` / stderr: ${stderrText.trim().slice(0, 300)}` : "")
        )
      );
    });
  });
}

async function sendCrawlerSummaryDiscordNotification(input: {
  startedAt: Date;
  elapsedMs: number;
  buddies: CrawlerRunSummary | null;
  wanted: CrawlerRunSummary | null;
  ok: boolean;
  errorMessage?: string;
}) {
  if (!crawlerSummaryDiscordWebhookUrl) return;
  const asNum = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
  const [storedBuddiesCount, storedWantedCount] = await Promise.all([
    prisma.position.count({ where: { sourceProvider: PositionSourceProvider.BUDDIES } }),
    prisma.position.count({ where: { sourceProvider: PositionSourceProvider.WANTED } })
  ]);
  const runtimeEnv = resolveRuntimeEnvironment();
  const envColor =
    runtimeEnv === "Production"
      ? 0xdc2626
      : runtimeEnv === "Staging"
        ? 0xf59e0b
        : 0x2563eb;
  const sourceMeta = (summary: CrawlerRunSummary | null, fallbackProvider: string, fallbackPlatform: string) => {
    const provider = typeof summary?.sourceProvider === "string" && summary.sourceProvider.trim()
      ? summary.sourceProvider.trim()
      : fallbackProvider;
    const platform = typeof summary?.sourcePlatform === "string" && summary.sourcePlatform.trim()
      ? summary.sourcePlatform.trim()
      : fallbackPlatform;
    return `${provider}/${platform}`;
  };
  const sourceDetail = (summary: CrawlerRunSummary | null, fallbackProvider: string, fallbackPlatform: string) => {
    if (!summary) return "이번 실행 제외";
    const created = asNum(summary.created);
    const updated = asNum(summary.updated);
    const total = asNum(summary.total);
    const imported = created + updated;
    return `${sourceMeta(summary, fallbackProvider, fallbackPlatform)}\n신규 ${created}건 / 업데이트 ${updated}건 / 반영 ${imported}건 / DB 총 ${total}건`;
  };

  const bCreated = asNum(input.buddies?.created);
  const bUpdated = asNum(input.buddies?.updated);
  const wCreated = asNum(input.wanted?.created);
  const wUpdated = asNum(input.wanted?.updated);
  const totalAdded = bCreated + wCreated;
  const totalUpdated = bUpdated + wUpdated;
  const description = input.ok
    ? [
        `실제 반영: 신규 ${totalAdded}건 / 업데이트 ${totalUpdated}건`,
        `소스별 현재 저장: Buddies ${storedBuddiesCount}건, Wanted ${storedWantedCount}건`
      ].join("\n")
    : `오류: ${input.errorMessage ?? "unknown error"}`;

  const embeds = [
    {
      title: input.ok ? "크롤러 실행 완료" : "크롤러 실행 실패",
      description,
      color: envColor,
      fields: [
        {
          name: "실행 환경",
          value: runtimeEnv,
          inline: true
        },
        {
          name: "Buddies",
          value: `${sourceDetail(input.buddies, "buddies", "BUDDIES")}\n현재 저장: ${storedBuddiesCount}건`,
          inline: false
        },
        {
          name: "Wanted",
          value: `${sourceDetail(input.wanted, "wanted", "WANTED")}\n현재 저장: ${storedWantedCount}건`,
          inline: false
        },
        {
          name: "실행 정보",
          value: `시작: ${input.startedAt.toISOString()}\n소요: ${Math.round(input.elapsedMs / 1000)}s`,
          inline: false
        }
      ],
      timestamp: new Date().toISOString()
    }
  ];

  try {
    await fetch(crawlerSummaryDiscordWebhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ embeds })
    });
  } catch (error) {
    console.error("[crawler-scheduler] discord webhook failed", {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

type CrawlerSource = "all" | "buddies" | "wanted";

type DailyCrawlerRunResult = {
  ok: boolean;
  startedAt: string;
  elapsedMs: number;
  buddies: CrawlerRunSummary | null;
  wanted: CrawlerRunSummary | null;
  source: CrawlerSource;
  errorMessage?: string;
};

let crawlerRunInProgress = false;

async function runExternalCrawlers(
  source: CrawlerSource,
  triggeredBy: "manual" | "scheduler" = "manual"
): Promise<DailyCrawlerRunResult> {
  if (crawlerRunInProgress) {
    return {
      ok: false,
      startedAt: new Date().toISOString(),
      elapsedMs: 0,
      buddies: null,
      wanted: null,
      source,
      errorMessage: "crawler run already in progress"
    };
  }
  crawlerRunInProgress = true;
  const startedAt = new Date();
  console.info("[crawler-scheduler] started", { source, triggeredBy });

  // Persist a row immediately so the run shows up in /ops/crawlers/history
  // even if the API process is killed mid-run; we update with results on
  // completion. Failures to insert are non-fatal (DB hiccup shouldn't block
  // the actual crawl).
  let runRowId: string | null = null;
  try {
    const row = await prisma.crawlerRun.create({
      data: { source, triggeredBy, startedAt }
    });
    runRowId = row.id;
  } catch (e) {
    console.error("[crawler-scheduler] failed to insert CrawlerRun row", e);
  }

  try {
    const buddies = source === "all" || source === "buddies"
      ? await runCrawlerScript("scripts/import-buddies-job-postings.ts")
      : null;
    const wanted = source === "all" || source === "wanted"
      ? await runCrawlerScript("scripts/import-wanted-job-postings.ts")
      : null;
    const elapsedMs = Date.now() - startedAt.getTime();
    console.info("[crawler-scheduler] completed", { elapsedMs, source, triggeredBy });

    if (runRowId) {
      try {
        await prisma.crawlerRun.update({
          where: { id: runRowId },
          data: {
            ok: true,
            finishedAt: new Date(),
            elapsedMs,
            buddiesResult: (buddies ?? Prisma.DbNull) as Prisma.InputJsonValue,
            wantedResult: (wanted ?? Prisma.DbNull) as Prisma.InputJsonValue
          }
        });
      } catch (e) {
        console.error("[crawler-scheduler] failed to update CrawlerRun row (success)", e);
      }
    }

    await sendCrawlerSummaryDiscordNotification({
      startedAt,
      elapsedMs,
      buddies,
      wanted,
      ok: true
    });
    return {
      ok: true,
      startedAt: startedAt.toISOString(),
      elapsedMs,
      buddies,
      wanted,
      source
    };
  } catch (error) {
    const elapsedMs = Date.now() - startedAt.getTime();
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[crawler-scheduler] failed", {
      elapsedMs,
      source,
      triggeredBy,
      error: errorMessage
    });

    if (runRowId) {
      try {
        await prisma.crawlerRun.update({
          where: { id: runRowId },
          data: {
            ok: false,
            finishedAt: new Date(),
            elapsedMs,
            errorMessage
          }
        });
      } catch (e) {
        console.error("[crawler-scheduler] failed to update CrawlerRun row (failure)", e);
      }
    }

    await sendCrawlerSummaryDiscordNotification({
      startedAt,
      elapsedMs,
      buddies: null,
      wanted: null,
      ok: false,
      errorMessage
    });
    return {
      ok: false,
      startedAt: startedAt.toISOString(),
      elapsedMs,
      buddies: null,
      wanted: null,
      source,
      errorMessage
    };
  } finally {
    crawlerRunInProgress = false;
  }
}

async function runDailyExternalCrawlers(): Promise<DailyCrawlerRunResult> {
  return runExternalCrawlers("all", "scheduler");
}

function startCrawlerScheduler() {
  if (!crawlSchedulerEnabled) return;
  let timer: NodeJS.Timeout | null = null;

  const scheduleNext = () => {
    const next = nextRunAtKst(crawlSchedulerHourKst, crawlSchedulerMinuteKst);
    const delay = Math.max(1_000, next.getTime() - Date.now());
    console.info("[crawler-scheduler] next run scheduled", {
      kstHour: crawlSchedulerHourKst,
      kstMinute: crawlSchedulerMinuteKst,
      nextRunAt: next.toISOString(),
      delayMs: delay
    });
    timer = setTimeout(async () => {
      await runDailyExternalCrawlers();
      scheduleNext();
    }, delay);
  };

  if (crawlSchedulerRunOnBoot) {
    void runDailyExternalCrawlers();
  }
  scheduleNext();

  const shutdown = () => {
    if (timer) clearTimeout(timer);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

type PositionPremiumBannerMeta = {
  enabled: boolean;
  bannerImageUrl: string | null;
  bannerTitle: string | null;
  bannerSubtitle: string | null;
  priority: number | null;
};

const PREMIUM_BANNER_MEMO_PREFIX = "[[PREMIUM_BANNER]]";
const EMPLOYMENT_CLASSIFICATION_MEMO_PREFIX = "[[EMPLOYMENT_CLASSIFICATION]]";

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

function extractEmploymentClassificationMeta(adminMemo: string | null | undefined) {
  if (!adminMemo?.trim()) return null;
  const line = adminMemo
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(EMPLOYMENT_CLASSIFICATION_MEMO_PREFIX));
  if (!line) return null;
  const value = line.slice(EMPLOYMENT_CLASSIFICATION_MEMO_PREFIX.length).trim();
  if (!value) return null;
  const parsed = employmentClassificationSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function stripEmploymentClassificationMeta(adminMemo: string | null | undefined) {
  if (!adminMemo?.trim()) return null;
  const plain = adminMemo
    .split("\n")
    .filter((entry) => !entry.trim().startsWith(EMPLOYMENT_CLASSIFICATION_MEMO_PREFIX))
    .join("\n")
    .trim();
  return plain.length > 0 ? plain : null;
}

function mergeEmploymentClassificationMeta(
  adminMemo: string | null | undefined,
  employmentClassification?: z.infer<typeof employmentClassificationSchema> | null
) {
  const plain = stripEmploymentClassificationMeta(adminMemo);
  if (!employmentClassification) return plain;
  const line = `${EMPLOYMENT_CLASSIFICATION_MEMO_PREFIX} ${employmentClassification}`;
  if (!plain) return line;
  return `${plain}\n${line}`.trim();
}

function toPosition(item: {
  id: string;
  partnerOrganizationId: string | null;
  sourceKind: PositionSourceKind;
  sourceProvider: PositionSourceProvider;
  sourceExternalId: string | null;
  sourceUrl: string | null;
  sourceFetchedAt: Date | null;
  title: string;
  status: PositionStatus;
  workType: string | null;
  employmentType: PositionEmploymentType;
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
  viewCount?: number;
  externalClickCount?: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    applications?: number;
  };
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
  } | null;
}) {
  return {
    id: item.id,
    partnerOrganizationId: item.partnerOrganizationId,
    sourceKind: item.sourceKind,
    sourceProvider: item.sourceProvider,
    sourceExternalId: item.sourceExternalId,
    sourceUrl: item.sourceUrl,
    sourceFetchedAt: item.sourceFetchedAt,
    title: item.title,
    status: item.status,
    workType: item.workType,
    employmentType: item.employmentType,
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
    employmentClassification: extractEmploymentClassificationMeta(item.adminMemo),
    adminMemo: stripEmploymentClassificationMeta(stripPremiumBannerMeta(item.adminMemo)),
    premiumBanner: extractPremiumBannerMeta(item.adminMemo),
    viewCount: item.viewCount ?? 0,
    externalClickCount: item.externalClickCount ?? 0,
    applicationCount: item._count?.applications ?? 0,
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

function extractSourceCompanyName(additionalNotes: string | null): string | null {
  if (!additionalNotes) return null;
  const line = additionalNotes
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("sourceCompanyName:"));
  if (!line) return null;
  const value = line.slice("sourceCompanyName:".length).trim();
  return value.length > 0 ? value : null;
}

function extractSourceDeadlineDate(additionalNotes: string | null): string | null {
  if (!additionalNotes) return null;
  const line = additionalNotes
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("sourceDeadlineDate:"));
  if (!line) return null;
  const value = line.slice("sourceDeadlineDate:".length).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function extractSourceDeadlineRolling(additionalNotes: string | null): boolean {
  if (!additionalNotes) return false;
  return additionalNotes
    .split("\n")
    .map((entry) => entry.trim().toLowerCase())
    .some((entry) => entry === "sourcedeadlinerolling: true");
}

function toPublicPositionItem(
  item: {
    id: string;
    sourceKind: PositionSourceKind;
    sourceProvider: PositionSourceProvider;
    sourceExternalId: string | null;
    sourceUrl: string | null;
    sourceFetchedAt: Date | null;
    title: string;
    status: PositionStatus;
    workType: string | null;
    employmentType: PositionEmploymentType;
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
    sourceDeadlineDate?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    partnerOrganization?: {
      id: string;
      name: string;
      industry: PartnerIndustry;
      companySize: string | null;
      officeAddress: string | null;
      description?: string | null;
      strengths?: string | null;
      website?: string | null;
      socialMedia?: string | null;
      companyLogoImageData?: string | null;
      officePhotoImageData?: string | null;
    } | null;
    matchingParticipants: Array<{ id: string }>;
  },
  viewer: { role: MemberRole; partnerDomain: string | null } | null,
  // Optional per-locale translation override. When provided (only for INTERNAL
  // postings served to non-Korean viewers), the user-visible free-text fields
  // are swapped with the translated copy. Source-metadata extraction still
  // runs against the original additionalNotes so deadline/company info is
  // unaffected.
  translation?: PositionTranslatableFields | null
) {
  const t = translation ?? null;
  // Mask first on the ORIGINAL additionalNotes so embedded source-metadata
  // (sourceCompanyName / sourceDeadlineDate) is stripped consistently; if a
  // translation exists, replace the masked body with the translated version
  // (which carries no metadata patterns because INTERNAL posts never had them).
  const maskedOriginalNotes = maskAdditionalNotesForPublic(item.additionalNotes, null, viewer);
  const additionalNotesOut = t && t.additionalNotes != null ? t.additionalNotes : maskedOriginalNotes;
  return {
    id: item.id,
    sourceKind: item.sourceKind,
    sourceProvider: item.sourceProvider,
    sourceExternalId: item.sourceExternalId,
    sourceUrl: item.sourceUrl,
    sourceFetchedAt: item.sourceFetchedAt,
    sourceCompanyName: extractSourceCompanyName(item.additionalNotes),
    sourceDeadlineDate: item.sourceDeadlineDate
      ? item.sourceDeadlineDate.toISOString().slice(0, 10)
      : extractSourceDeadlineDate(item.additionalNotes),
    sourceDeadlineRolling: extractSourceDeadlineRolling(item.additionalNotes),
    title: t?.title ?? item.title,
    status: item.status,
    workType: t?.workType ?? item.workType,
    employmentType: item.employmentType,
    employmentClassification: extractEmploymentClassificationMeta(item.adminMemo),
    thumbnailImages: item.thumbnailImages,
    eligibleVisas: item.eligibleVisas,
    preferredNationalities: item.preferredNationalities,
    communicationLanguages: item.communicationLanguages,
    hiringProcess: t?.hiringProcess ?? item.hiringProcess,
    preferredJobRole: item.preferredJobRole,
    hiringCount: item.hiringCount,
    workingHours: t?.workingHours ?? item.workingHours,
    workLocation: t?.workLocation ?? item.workLocation,
    startDate: item.startDate,
    mainResponsibilities: t?.mainResponsibilities ?? item.mainResponsibilities,
    requiredQualifications: t?.requiredQualifications ?? item.requiredQualifications,
    preferredQualifications: t?.preferredQualifications ?? item.preferredQualifications,
    dressCode: t?.dressCode ?? item.dressCode,
    wantsPreTraining: item.wantsPreTraining,
    additionalNotes: additionalNotesOut,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    matchingParticipantsCount: item.matchingParticipants.length,
    partnerOrganization: item.partnerOrganization
      ? {
          id: item.partnerOrganization.id,
          name: item.partnerOrganization.name,
          industry: item.partnerOrganization.industry,
          companySize: item.partnerOrganization.companySize ?? null,
          officeAddress: item.partnerOrganization.officeAddress ?? null,
          description: item.partnerOrganization.description ?? null,
          strengths: item.partnerOrganization.strengths ?? null,
          website: item.partnerOrganization.website ?? null,
          socialMedia: item.partnerOrganization.socialMedia ?? null,
          companyLogoImageData: item.partnerOrganization.companyLogoImageData ?? null,
          officePhotoImageData: item.partnerOrganization.officePhotoImageData ?? null
        }
      : null
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
      partnerOrgRole: true,
      partnerOrganizationId: true
    }
  });

  if (!user) return null;

  if (!user.partnerOrganizationId) {
    return { user, organization: null as null };
  }
  const organization = await prisma.partnerOrganization.findUnique({ where: { id: user.partnerOrganizationId } });
  return { user, organization };
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
  partnerOrganization: { id: string; name: string; industry: PartnerIndustry } | null;
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
  if (option === "ASAP" && position.status === PositionStatus.OPEN) score += 0.2;
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
  if (position.status === PositionStatus.OPEN) score += 2;
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

type CareerReadinessProfile = {
  user: {
    realName: string | null;
    name: string | null;
    nationality: string | null;
    affiliation: string | null;
    birthDate: Date | null;
    gender: string | null;
    jobTitle: string | null;
  };
  profile: {
    visaType: CandidateVisaType | null;
    visaExpiryDate: Date | null;
    workPermit: boolean | null;
    livesInKorea: boolean | null;
    residenceProvince: string | null;
    programStartOption: string | null;
    programStartDate: Date | null;
    skills: string[];
    selfIntroduction: string | null;
    programMotivation: string | null;
    preferenceConditionNote: string | null;
    additionalInfoNote: string | null;
    educations: Array<{ school: string | null; major: string | null; status: string | null }>;
    languageSkills: Array<{ language: string | null; level: string | null }>;
    careers: Array<{ companyName: string | null; jobTitle: string | null; description: string | null }>;
    activityExperiences: Array<{ title: string | null; description: string | null }>;
  } | null;
};

const WORKABLE_VISAS = new Set(["F2_RESIDENCE", "F4_OVERSEAS_KOREAN", "F5_PERMANENT_RESIDENCE", "F6_MARRIAGE_IMMIGRATION", "E7_SPECIFIC_ACTIVITY", "H1_WORKING_HOLIDAY", "D10_JOB_SEEKING"]);
const LIMITED_VISAS = new Set(["D2_STUDENT", "D4_GENERAL_TRAINING"]);

function computeCareerReadinessScore(input: CareerReadinessProfile) {
  const { user, profile } = input;
  let score = 0;

  // Profile completeness (30 pts)
  let completeness = 0;
  if (user.name?.trim()) completeness += 4;
  if (user.birthDate) completeness += 3;
  if (user.gender?.trim()) completeness += 3;
  if (profile?.residenceProvince?.trim()) completeness += 2;
  if ((profile?.educations.length ?? 0) > 0) completeness += 4;
  if ((profile?.careers.length ?? 0) > 0) completeness += 4;
  if ((profile?.activityExperiences.length ?? 0) > 0) completeness += 3;
  if ((profile?.skills.length ?? 0) >= 3) completeness += 3;
  if ((profile?.selfIntroduction?.trim().length ?? 0) >= 120) completeness += 2;
  if ((profile?.programMotivation?.trim().length ?? 0) >= 120) completeness += 2;
  score += Math.min(completeness, 30);

  // Visa eligibility (25 pts)
  if (profile?.visaType) {
    if (WORKABLE_VISAS.has(profile.visaType)) score += 25;
    else if (LIMITED_VISAS.has(profile.visaType)) score += 12;
    else score += 6;
  }

  // Language (25 pts) — Korean weighted higher
  const languageSkills = profile?.languageSkills ?? [];
  let languageScore = 0;
  for (const skill of languageSkills) {
    const lang = (skill.language ?? "").toLowerCase();
    const level = (skill.level ?? "").toUpperCase();
    const isKorean = lang.includes("korean") || lang.includes("한국") || lang.includes("ko");
    const isEnglish = lang.includes("english") || lang.includes("영어") || lang.includes("en");
    let levelPoints = 0;
    if (level.includes("NATIVE") || level === "C2" || level.includes("ADVANCED")) levelPoints = 15;
    else if (level === "C1" || level.includes("UPPER") || level.includes("FLUENT")) levelPoints = 12;
    else if (level === "B2" || level.includes("INTERMEDIATE")) levelPoints = 8;
    else if (level === "B1" || level.includes("BASIC")) levelPoints = 4;
    else levelPoints = 2;
    if (isKorean) languageScore += levelPoints;
    else if (isEnglish) languageScore += Math.round(levelPoints * 0.7);
    else languageScore += Math.round(levelPoints * 0.4);
  }
  score += Math.min(languageScore, 25);

  // Experience & narrative (20 pts)
  let exp = 0;
  if ((profile?.careers.length ?? 0) >= 1) exp += 8;
  if ((profile?.careers.length ?? 0) >= 2) exp += 2;
  if ((profile?.activityExperiences.length ?? 0) >= 1) exp += 4;
  if ((profile?.skills.length ?? 0) >= 5) exp += 3;
  if ((profile?.selfIntroduction?.trim().length ?? 0) >= 200) exp += 2;
  if ((profile?.programMotivation?.trim().length ?? 0) >= 200) exp += 1;
  score += Math.min(exp, 20);

  return Math.max(0, Math.min(100, Math.round(score)));
}

const careerReadinessNarrativeSchema = z.object({
  strengths: z.array(z.string().min(1).max(160)).min(2).max(5),
  improvements: z.array(z.string().min(1).max(160)).min(2).max(5),
  recommendedRoles: z.array(z.string().min(1).max(80)).min(2).max(5)
});

async function generateCareerReadinessNarrative(input: CareerReadinessProfile, score: number, locale: "ko" | "en" | "zh-CN" | "vi" | "ja" | "id") {
  if (!openai) throw new Error("openai_unavailable");

  const localeName =
    locale === "ko" ? "Korean"
      : locale === "zh-CN" ? "Simplified Chinese"
        : locale === "vi" ? "Vietnamese"
          : locale === "ja" ? "Japanese"
            : locale === "id" ? "Indonesian"
              : "English";
  const summary = {
    score,
    user: {
      nationality: input.user.nationality,
      birthDate: input.user.birthDate?.toISOString() ?? null,
      jobTitle: input.user.jobTitle
    },
    profile: input.profile
      ? {
          visaType: input.profile.visaType,
          workPermit: input.profile.workPermit,
          livesInKorea: input.profile.livesInKorea,
          residenceProvince: input.profile.residenceProvince,
          programStartOption: input.profile.programStartOption,
          skills: input.profile.skills,
          selfIntroduction: input.profile.selfIntroduction?.slice(0, 600) ?? null,
          programMotivation: input.profile.programMotivation?.slice(0, 600) ?? null,
          educations: input.profile.educations,
          languageSkills: input.profile.languageSkills,
          careers: input.profile.careers.map((c) => ({ ...c, description: c.description?.slice(0, 240) ?? null })),
          activityExperiences: input.profile.activityExperiences.map((a) => ({ ...a, description: a.description?.slice(0, 240) ?? null }))
        }
      : null
  };

  const response = await openai.responses.create({
    model: openaiMatchingModel,
    input: [
      {
        role: "system",
        content: [
          "You are a Korea-employment career coach helping international students plan their job search in Korea.",
          "Given a candidate snapshot and an overall readiness score (0-100), produce constructive feedback.",
          "Strengths: 3-5 short bullets highlighting what the candidate already has going for them in the Korean job market.",
          "Improvements: 3-5 short bullets pointing out concrete, actionable gaps.",
          "RecommendedRoles: 3-5 specific role titles realistic for this candidate (e.g., 'Global Marketing Assistant', 'Market Research Intern', 'Translation Support').",
          `All bullets must be written in ${localeName}.`,
          "Keep each bullet under 120 characters and avoid generic platitudes."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({ task: "career_readiness_report", ...summary })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "career_readiness_report",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["strengths", "improvements", "recommendedRoles"],
          properties: {
            strengths: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
            improvements: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
            recommendedRoles: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 }
          }
        }
      }
    }
  });

  const raw = response.output_text;
  const parsed = careerReadinessNarrativeSchema.parse(JSON.parse(raw));
  return parsed;
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

// Receive client-side errors from the web app and forward to Discord.
// Web app's ErrorReporter posts here via fetch / sendBeacon. The endpoint
// is intentionally permissive (no auth) — only the message shape is
// validated and rate limiting comes from the dedup window inside
// postErrorToDiscord.
const clientErrorReportSchema = z.object({
  message: z.string().min(1).max(500),
  url: z.string().max(500).optional(),
  userAgent: z.string().max(300).optional(),
  stack: z.string().max(4000).optional()
});

app.post("/errors/client", async (req, res) => {
  const parsed = clientErrorReportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid payload" });
  }
  void postErrorToDiscord({
    title: parsed.data.message,
    source: "web",
    path: parsed.data.url,
    userAgent: parsed.data.userAgent,
    stack: parsed.data.stack
  });
  return res.status(204).end();
});

app.get("/health", async (_req, res) => {
  const emailDeliveryMode = smtpHost && emailFromAddress ? "smtp" : "log";
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      ok: true,
      service: "api",
      db: "connected",
      emailDeliveryMode,
      dbTarget: getDatabaseTargetMeta(),
      crawlerScheduler: {
        enabled: crawlSchedulerEnabled,
        hourKst: crawlSchedulerHourKst,
        minuteKst: crawlSchedulerMinuteKst,
        runOnBoot: crawlSchedulerRunOnBoot
      }
    });
  } catch {
    res.status(500).json({
      ok: false,
      service: "api",
      db: "disconnected",
      emailDeliveryMode,
      dbTarget: getDatabaseTargetMeta(),
      crawlerScheduler: {
        enabled: crawlSchedulerEnabled,
        hourKst: crawlSchedulerHourKst,
        minuteKst: crawlSchedulerMinuteKst,
        runOnBoot: crawlSchedulerRunOnBoot
      }
    });
  }
});

app.get("/", (_req, res) => {
  res.json({ ok: true, message: "Flip API is running" });
});

app.post("/ops/crawlers/run", authenticate, requireRoles([MemberRole.OPERATOR]), async (_req, res) => {
  const result = await runDailyExternalCrawlers();
  return res.status(result.ok ? 200 : 409).json({
    ok: result.ok,
    result
  });
});

app.post("/ops/crawlers/run/buddies", authenticate, requireRoles([MemberRole.OPERATOR]), async (_req, res) => {
  const result = await runExternalCrawlers("buddies");
  return res.status(result.ok ? 200 : 409).json({
    ok: result.ok,
    result
  });
});

app.post("/ops/crawlers/run/wanted", authenticate, requireRoles([MemberRole.OPERATOR]), async (_req, res) => {
  const result = await runExternalCrawlers("wanted");
  return res.status(result.ok ? 200 : 409).json({
    ok: result.ok,
    result
  });
});

// Paginated history — most recent first. 50 default, 100 max.
app.get("/ops/crawlers/history", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const limitRaw = Number.parseInt(typeof req.query.limit === "string" ? req.query.limit : "", 10);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 && limitRaw <= 100 ? limitRaw : 50;
  try {
    const [items, total] = await Promise.all([
      prisma.crawlerRun.findMany({
        orderBy: { startedAt: "desc" },
        take: limit
      }),
      prisma.crawlerRun.count()
    ]);
    return res.json({
      ok: true,
      total,
      items: items.map((row) => ({
        id: row.id,
        source: row.source,
        triggeredBy: row.triggeredBy,
        startedAt: row.startedAt.toISOString(),
        finishedAt: row.finishedAt ? row.finishedAt.toISOString() : null,
        elapsedMs: row.elapsedMs,
        ok: row.ok,
        errorMessage: row.errorMessage,
        buddiesResult: row.buddiesResult,
        wantedResult: row.wantedResult
      }))
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

// ---- ops data management (destructive) ------------------------------------
// Wipes that operators run from the ops dashboard's "데이터 관리" page. Test
// seed accounts (test@test.com, partner@test.com, student@test.com, and any
// other @test.com address) are preserved so seed-dev-users can re-import.
const dataManagementConfirmPhrase = "DELETE";
const dataManagementBodySchema = z
  .object({ confirm: z.string() })
  .refine((data) => data.confirm === dataManagementConfirmPhrase, {
    message: `confirm must equal "${dataManagementConfirmPhrase}"`
  });

app.post(
  "/ops/data/delete-all-positions",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (req, res) => {
    const parsed = dataManagementBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: parsed.error.issues[0]?.message ?? "Invalid body" });
    }
    const before = await prisma.position.count();
    const result = await prisma.position.deleteMany({});
    await writeAuditLog(req, {
      action: "DELETE_ALL_POSITIONS",
      resource: "Position",
      metadata: { before, deleted: result.count }
    });
    return res.status(200).json({ ok: true, before, deleted: result.count });
  }
);

app.post(
  "/ops/data/delete-non-seed-users",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (req, res) => {
    const parsed = dataManagementBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: parsed.error.issues[0]?.message ?? "Invalid body" });
    }
    const callerUserId = req.auth?.userId ?? null;
    const before = await prisma.user.count();
    const result = await prisma.user.deleteMany({
      where: {
        AND: [
          { NOT: { email: { endsWith: "@test.com" } } },
          callerUserId ? { NOT: { id: callerUserId } } : {}
        ]
      }
    });
    const preserved = await prisma.user.count();
    await writeAuditLog(req, {
      action: "DELETE_NON_SEED_USERS",
      resource: "User",
      metadata: { before, deleted: result.count, preserved, callerPreserved: !!callerUserId }
    });
    return res.status(200).json({ ok: true, before, deleted: result.count, preserved });
  }
);

const communityGenerateSchema = z.object({
  posts: z.number().int().min(1).max(100),
  commentsMin: z.number().int().min(0).max(20),
  commentsMax: z.number().int().min(0).max(20),
  daysBack: z.number().int().min(0).max(365)
});

app.post("/ops/community/generate", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = communityGenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid body", errors: parsed.error.flatten() });
  }
  try {
    const result = await generateCommunityContent(prisma, parsed.data);
    await writeAuditLog(req, {
      action: "GENERATE_COMMUNITY_CONTENT",
      resource: "CommunityPost",
      metadata: { ...parsed.data, ...result }
    });
    return res.status(200).json({ ok: true, ...result });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to generate community content" });
  }
});

app.post("/ops/community/seed-candidates", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  try {
    const result = await seedForeignCandidates(prisma);
    await writeAuditLog(req, { action: "SEED_FOREIGN_CANDIDATES", resource: "User", metadata: result });
    return res.status(200).json({ ok: true, ...result });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to seed candidates" });
  }
});

app.post("/ops/community/delete-non-operator", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  try {
    const result = await deleteNonOperatorCommunityPosts(prisma);
    await writeAuditLog(req, { action: "DELETE_NON_OPERATOR_POSTS", resource: "CommunityPost", metadata: result });
    return res.status(200).json({ ok: true, ...result });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to delete posts" });
  }
});

// Saju event "후보 Pool" admin list. Filterable by pool stage, nationality,
// preferred role, visa, and recommendation status (the auto-generated tags).
const opsSajuLeadsQuerySchema = z.object({
  poolStage: z.enum(["PROFILE", "VERIFIED", "RECOMMENDABLE"]).optional(),
  recommendStatus: z.enum(["UNVERIFIED", "NEEDS_WORK", "RECOMMENDABLE"]).optional(),
  nationality: z.string().trim().max(80).optional(),
  preferredJobRole: z.string().trim().max(40).optional(),
  visaType: z.string().trim().max(40).optional(),
  q: z.string().trim().max(120).optional(),
  take: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional()
});

app.get("/ops/saju/leads", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = opsSajuLeadsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsed.error.flatten() });
  }
  const f = parsed.data;
  const where: Prisma.SajuLeadWhereInput = {
    ...(f.poolStage ? { poolStage: f.poolStage } : {}),
    ...(f.recommendStatus ? { recommendStatus: f.recommendStatus } : {}),
    ...(f.nationality ? { nationality: { contains: f.nationality, mode: "insensitive" } } : {}),
    ...(f.preferredJobRole ? { preferredJobRole: f.preferredJobRole } : {}),
    ...(f.visaType ? { visaType: f.visaType } : {}),
    ...(f.q
      ? {
          OR: [
            { name: { contains: f.q, mode: "insensitive" } },
            { school: { contains: f.q, mode: "insensitive" } },
            { major: { contains: f.q, mode: "insensitive" } },
            { contact: { contains: f.q, mode: "insensitive" } }
          ]
        }
      : {})
  };
  const take = f.take ?? 50;
  const skip = f.skip ?? 0;
  const [leads, total, stageCounts, predictionsTotal, leadsTotalAll, leadsConverted] = await Promise.all([
    prisma.sajuLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        prediction: {
          select: { shareSlug: true, birthDate: true, gender: true, recommendedRoleNames: true }
        }
      }
    }),
    prisma.sajuLead.count({ where }),
    prisma.sajuLead.groupBy({ by: ["poolStage"], _count: { _all: true } }),
    // Funnel summary — unfiltered totals so the header card stays meaningful
    // regardless of the operator's pool-stage / search filters.
    prisma.sajuPrediction.count(),
    prisma.sajuLead.count(),
    prisma.sajuLead.count({ where: { userId: { not: null } } })
  ]);
  return res.json({
    ok: true,
    total,
    take,
    skip,
    stageCounts: Object.fromEntries(stageCounts.map((s) => [s.poolStage, s._count._all])),
    funnel: {
      predictionsTotal,
      leadsTotal: leadsTotalAll,
      leadsConverted
    },
    leads: leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      shareSlug: lead.shareSlug,
      nationality: lead.nationality,
      school: lead.school,
      major: lead.major,
      visaType: lead.visaType,
      koreanLevel: lead.koreanLevel,
      englishLevel: lead.englishLevel,
      preferredJobRole: lead.preferredJobRole,
      workType: lead.workType,
      contact: lead.contact,
      contactType: lead.contactType,
      hasResume: lead.hasResume,
      recommendedRoles: lead.recommendedRoles,
      improvements: lead.improvements,
      recommendStatus: lead.recommendStatus,
      poolStage: lead.poolStage,
      tags: lead.tags,
      consentCareer: lead.consentCareer,
      consentRecommend: lead.consentRecommend,
      consentContact: lead.consentContact,
      userId: lead.userId,
      locale: lead.locale,
      createdAt: lead.createdAt.toISOString(),
      birthDate: lead.prediction?.birthDate ? lead.prediction.birthDate.toISOString().slice(0, 10) : null,
      gender: lead.prediction?.gender ?? null
    }))
  });
});

// GET /ops/visa/leads — visa funnel 의 익명 lead 풀 관리. saju 와 동일한 모양
// (총계 + 단계 카운트 + 검색/필터) 이지만 컬럼 셋이 visa 맞춤.
const opsVisaLeadsQuerySchema = z.object({
  poolStage: z.enum(["PROFILE", "VERIFIED", "RECOMMENDABLE"]).optional(),
  nationality: z.string().trim().max(80).optional(),
  preferredJobRole: z.string().trim().max(60).optional(),
  q: z.string().trim().max(120).optional(),
  take: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional()
});

app.get("/ops/visa/leads", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = opsVisaLeadsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsed.error.flatten() });
  }
  const f = parsed.data;
  const where: Prisma.VisaLeadWhereInput = {
    ...(f.poolStage ? { poolStage: f.poolStage } : {}),
    ...(f.nationality ? { nationality: { contains: f.nationality, mode: "insensitive" } } : {}),
    ...(f.preferredJobRole ? { preferredJobRole: { contains: f.preferredJobRole, mode: "insensitive" } } : {}),
    ...(f.q
      ? {
          OR: [
            { name: { contains: f.q, mode: "insensitive" } },
            { university: { contains: f.q, mode: "insensitive" } },
            { major: { contains: f.q, mode: "insensitive" } },
            { contact: { contains: f.q, mode: "insensitive" } }
          ]
        }
      : {})
  };
  const take = f.take ?? 50;
  const skip = f.skip ?? 0;
  const [leads, total, stageCounts, checksTotal, leadsTotalAll, leadsConverted] = await Promise.all([
    prisma.visaLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        visaResult: {
          select: { shareSlug: true, educationLevel: true, majorCategory: true, workYears: true, targetRole: true }
        }
      }
    }),
    prisma.visaLead.count({ where }),
    prisma.visaLead.groupBy({ by: ["poolStage"], _count: { _all: true } }),
    prisma.visaCheckResult.count(),
    prisma.visaLead.count(),
    prisma.visaLead.count({ where: { userId: { not: null } } })
  ]);
  return res.json({
    ok: true,
    total,
    take,
    skip,
    stageCounts: Object.fromEntries(stageCounts.map((s) => [s.poolStage, s._count._all])),
    funnel: {
      checksTotal,
      leadsTotal: leadsTotalAll,
      leadsConverted
    },
    leads: leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      shareSlug: lead.shareSlug,
      contact: lead.contact,
      contactType: lead.contactType,
      nationality: lead.nationality,
      currentVisa: lead.currentVisa,
      expectedJoinDate: lead.expectedJoinDate,
      graduationDate: lead.graduationDate,
      university: lead.university,
      major: lead.major,
      preferredJobRole: lead.preferredJobRole,
      koreanLevel: lead.koreanLevel,
      englishLevel: lead.englishLevel,
      poolStage: lead.poolStage,
      tags: lead.tags,
      consentCareer: lead.consentCareer,
      consentRecommend: lead.consentRecommend,
      consentContact: lead.consentContact,
      userId: lead.userId,
      locale: lead.locale,
      createdAt: lead.createdAt.toISOString(),
      educationLevel: lead.visaResult?.educationLevel ?? null,
      majorCategory: lead.visaResult?.majorCategory ?? null,
      workYears: lead.visaResult?.workYears ?? null,
      targetRole: lead.visaResult?.targetRole ?? null
    }))
  });
});

// ---------------------------------------------------------------------------
// Raw-pool endpoints — funnel form 을 채우지 않고 "결과만 본 사람"의 익명
// 데이터까지 ops 콘솔에서 직접 조회할 수 있게 한다. /ops/visa/leads 와
// /ops/saju/leads 가 보여주는 "전환된 lead" 의 상위 단계 pool.
// ---------------------------------------------------------------------------

const opsVisaChecksQuerySchema = z.object({
  nationality: z.string().trim().max(80).optional(),
  currentVisa: z.string().trim().max(20).optional(),
  educationLevel: z.enum(["HIGH_SCHOOL", "BACHELOR", "MASTER", "PHD"]).optional(),
  koreanLevel: z.enum(["NONE", "BEGINNER", "INTERMEDIATE", "ADVANCED", "NATIVE"]).optional(),
  graduationStatus: z.enum(["not_applicable", "completed", "within_6mo", "within_1y", "later"]).optional(),
  inKorea: z.coerce.boolean().optional(),
  hasJobOffer: z.coerce.boolean().optional(),
  claimed: z.enum(["any", "claimed", "unclaimed"]).optional(),
  q: z.string().trim().max(120).optional(),
  take: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional()
});

app.get("/ops/visa/checks", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = opsVisaChecksQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsed.error.flatten() });
  }
  const f = parsed.data;
  const where: Prisma.VisaCheckResultWhereInput = {
    ...(f.nationality ? { nationality: { contains: f.nationality, mode: "insensitive" } } : {}),
    ...(f.currentVisa ? { currentVisa: f.currentVisa } : {}),
    ...(f.educationLevel ? { educationLevel: f.educationLevel } : {}),
    ...(f.koreanLevel ? { koreanLevel: f.koreanLevel } : {}),
    ...(f.graduationStatus ? { graduationStatus: f.graduationStatus } : {}),
    ...(f.inKorea !== undefined ? { inKorea: f.inKorea } : {}),
    ...(f.hasJobOffer !== undefined ? { hasJobOffer: f.hasJobOffer } : {}),
    ...(f.claimed === "claimed" ? { userId: { not: null } } : {}),
    ...(f.claimed === "unclaimed" ? { userId: null } : {}),
    ...(f.q
      ? {
          OR: [
            { name: { contains: f.q, mode: "insensitive" } },
            { targetRole: { contains: f.q, mode: "insensitive" } },
            { nationality: { contains: f.q, mode: "insensitive" } }
          ]
        }
      : {})
  };
  const take = f.take ?? 50;
  const skip = f.skip ?? 0;
  const [checks, total, claimedCount] = await Promise.all([
    prisma.visaCheckResult.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        name: true,
        nationality: true,
        currentVisa: true,
        educationLevel: true,
        majorCategory: true,
        koreanLevel: true,
        workYears: true,
        targetRole: true,
        inKorea: true,
        hasJobOffer: true,
        graduationStatus: true,
        recommendedPositionIds: true,
        shareSlug: true,
        userId: true,
        locale: true,
        createdAt: true,
        claimedAt: true,
        leads: { select: { id: true } }
      }
    }),
    prisma.visaCheckResult.count({ where }),
    prisma.visaCheckResult.count({ where: { userId: { not: null } } })
  ]);
  return res.json({
    ok: true,
    total,
    take,
    skip,
    claimedTotal: claimedCount,
    checks: checks.map((c) => ({
      id: c.id,
      name: c.name,
      nationality: c.nationality,
      currentVisa: c.currentVisa,
      educationLevel: c.educationLevel,
      majorCategory: c.majorCategory,
      koreanLevel: c.koreanLevel,
      workYears: c.workYears,
      targetRole: c.targetRole,
      inKorea: c.inKorea,
      hasJobOffer: c.hasJobOffer,
      graduationStatus: c.graduationStatus,
      recommendedPositionCount: c.recommendedPositionIds.length,
      shareSlug: c.shareSlug,
      userId: c.userId,
      locale: c.locale,
      createdAt: c.createdAt.toISOString(),
      claimedAt: c.claimedAt?.toISOString() ?? null,
      hasLead: c.leads.length > 0
    }))
  });
});

const opsSajuPredictionsQuerySchema = z.object({
  gender: z.enum(["male", "female"]).optional(),
  claimed: z.enum(["any", "claimed", "unclaimed"]).optional(),
  q: z.string().trim().max(120).optional(),
  take: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional()
});

app.get("/ops/saju/predictions", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = opsSajuPredictionsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsed.error.flatten() });
  }
  const f = parsed.data;
  const where: Prisma.SajuPredictionWhereInput = {
    ...(f.gender ? { gender: f.gender } : {}),
    ...(f.claimed === "claimed" ? { userId: { not: null } } : {}),
    ...(f.claimed === "unclaimed" ? { userId: null } : {}),
    ...(f.q ? { name: { contains: f.q, mode: "insensitive" } } : {})
  };
  const take = f.take ?? 50;
  const skip = f.skip ?? 0;
  const [predictions, total, claimedCount] = await Promise.all([
    prisma.sajuPrediction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        name: true,
        gender: true,
        birthDate: true,
        birthTime: true,
        calendarType: true,
        recommendedRoleNames: true,
        recommendedPositionIds: true,
        shareSlug: true,
        userId: true,
        locale: true,
        createdAt: true,
        claimedAt: true,
        leads: { select: { id: true } }
      }
    }),
    prisma.sajuPrediction.count({ where }),
    prisma.sajuPrediction.count({ where: { userId: { not: null } } })
  ]);
  return res.json({
    ok: true,
    total,
    take,
    skip,
    claimedTotal: claimedCount,
    predictions: predictions.map((p) => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
      birthDate: p.birthDate.toISOString().slice(0, 10),
      birthTime: p.birthTime,
      calendarType: p.calendarType,
      recommendedRoleNames: p.recommendedRoleNames,
      recommendedPositionCount: p.recommendedPositionIds.length,
      shareSlug: p.shareSlug,
      userId: p.userId,
      locale: p.locale,
      createdAt: p.createdAt.toISOString(),
      claimedAt: p.claimedAt?.toISOString() ?? null,
      hasLead: p.leads.length > 0
    }))
  });
});

const companyConsultationCreateSchema = z.object({
  companyName: z.string().trim().min(1).max(120),
  contactName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(1).max(4000),
  locale: z.enum(["ko", "en"]).optional(),
  source: z.string().trim().max(80).optional()
});

app.post("/company-consultations", async (req, res) => {
  const parsed = companyConsultationCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      message: "Invalid request body",
      issues: parsed.error.flatten()
    });
  }

  const payload = parsed.data;
  const created = await prisma.companyConsultationInquiry.create({
    data: {
      companyName: payload.companyName,
      contactName: payload.contactName,
      email: payload.email,
      phone: payload.phone || null,
      message: payload.message,
      locale: payload.locale ?? "ko",
      source: payload.source ?? "platform-web"
    }
  });

  await sendCompanyConsultationDiscordNotification({
    id: created.id,
    companyName: created.companyName,
    contactName: created.contactName,
    email: created.email,
    phone: created.phone,
    message: created.message,
    locale: created.locale,
    source: created.source,
    createdAt: created.createdAt
  });

  return res.status(201).json({
    ok: true,
    message: "Consultation inquiry created",
    item: {
      id: created.id,
      createdAt: created.createdAt
    }
  });
});

app.post("/internal/company-consultations/discord-test", async (req, res) => {
  if (!companyConsultationDiscordTestToken) {
    return res.status(503).json({
      ok: false,
      message: "Test token is not configured (set COMPANY_CONSULTATION_DISCORD_TEST_TOKEN)"
    });
  }
  if (!hasValidCompanyConsultationDiscordTestToken(req)) {
    return res.status(401).json({
      ok: false,
      message: "Unauthorized"
    });
  }
  if (!discordCompanyConsultationWebhookUrl) {
    return res.status(503).json({
      ok: false,
      message: "Discord webhook is not configured (set DISCORD_COMPANY_CONSULTATION_WEBHOOK_URL)"
    });
  }

  const now = new Date();
  await sendCompanyConsultationDiscordNotification({
    id: `test-${now.getTime()}`,
    companyName: "Webhook Healthcheck",
    contactName: "System",
    email: "noreply@flip-ers.com",
    phone: null,
    message: "This is a test notification from /internal/company-consultations/discord-test",
    locale: "ko",
    source: "internal-test",
    createdAt: now
  });

  return res.status(200).json({
    ok: true,
    message: "Discord test notification attempted. Check API logs for delivery errors."
  });
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

// Minimal public profile of a community author for the click-to-view popup.
// Exposes only safe, non-contact fields.
app.get("/community/authors/:userId", async (req, res) => {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  if (!userId) return res.status(400).json({ ok: false, message: "invalid request" });
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        realName: true,
        nationality: true,
        role: true,
        profileImageUrl: true,
        candidateProfile: {
          select: {
            preferredJobRoles: true,
            preferredIndustries: true,
            selfIntroduction: true,
            visaType: true,
            residenceProvince: true
          }
        }
      }
    });
    if (!user) return res.status(404).json({ ok: false, message: "not found" });
    const cp = user.candidateProfile;
    return res.json({
      ok: true,
      author: {
        id: user.id,
        name: user.name ?? user.realName ?? "",
        nationality: user.nationality ?? null,
        role: user.role,
        profileImageUrl: user.profileImageUrl ?? null,
        jobRoles: cp?.preferredJobRoles ?? [],
        industries: cp?.preferredIndustries ?? [],
        visaType: cp?.visaType ?? null,
        residence: cp?.residenceProvince ?? null,
        intro: cp?.selfIntroduction ? cp.selfIntroduction.slice(0, 200) : null
      }
    });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to load author" });
  }
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
    const imageUrls = await uploadImageArrayIfNeeded(parsedBody.data.imageUrls, "community/posts");
    const created = await prisma.communityPost.create({
      data: {
        authorId: user.id,
        authorName: user.name?.trim() || user.realName?.trim() || user.email.split("@")[0] || "User",
        category: toCommunityPostCategory(parsedBody.data.category),
        title,
        body,
        imageUrls,
        likes: 0,
        comments: 0
      }
    });

    await sendCommunityPostDiscordNotification({
      id: created.id,
      authorId: created.authorId,
      authorName: created.authorName,
      authorRole: req.auth!.role,
      category: fromCommunityPostCategory(created.category),
      title: created.title,
      body: created.body,
      imageUrls: created.imageUrls ?? [],
      createdAt: created.createdAt
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
  if (existing.authorId !== req.auth!.userId && req.auth!.role !== MemberRole.OPERATOR) {
    return res.status(403).json({ ok: false, message: "forbidden" });
  }

  const nextBody = parsedBody.data.body?.trim() ?? existing.body;
  const firstLine = nextBody.split("\n").find((line) => line.trim().length > 0)?.trim() ?? nextBody.slice(0, 60);
  const title = firstLine.length > 90 ? `${firstLine.slice(0, 90)}…` : firstLine;

  const nextImageUrls = parsedBody.data.imageUrls
    ? await uploadImageArrayIfNeeded(parsedBody.data.imageUrls, "community/posts")
    : existing.imageUrls;

  const updated = await prisma.communityPost.update({
    where: { id: parsedParam.data.postId },
    data: {
      category: parsedBody.data.category ? toCommunityPostCategory(parsedBody.data.category) : existing.category,
      body: nextBody,
      title,
      imageUrls: nextImageUrls
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
  if (existing.authorId !== req.auth!.userId && req.auth!.role !== MemberRole.OPERATOR) {
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

// Saju (오행 사주) viral landing — anonymous create, claim-on-signup.
// Rate-limited per IP because each request hits OpenAI.
app.post(
  "/saju/predict",
  rateLimit({ windowMs: 60_000, max: 8, keyPrefix: "saju-predict", message: "잠시 후 다시 시도해 주세요." }),
  async (req, res) => {
    const parsed = sajuPredictSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid input", errors: parsed.error.flatten() });
    }

    // Deterministic dedupe: same person (same identity fields) ALWAYS
    // resolves to the same prediction regardless of which language they
    // submit in. The reading is always generated in Korean (the
    // canonical saju language); other locales are served via the
    // lazy-translation cache in /saju/result. This ensures one person =
    // one saju across all languages.
    const requestedLocale = parsed.data.locale ?? "ko";
    const calendarType = parsed.data.calendarType ?? "solar";
    const inputHash = createHash("sha256")
      .update(
        [
          parsed.data.name.trim().toLowerCase(),
          parsed.data.gender,
          parsed.data.birthDate,
          parsed.data.birthTime ?? "",
          calendarType
        ].join("|")
      )
      .digest("hex");

    const existing = await prisma.sajuPrediction.findUnique({
      where: { inputHash },
      select: { id: true, shareSlug: true }
    });
    if (existing) {
      return res.json({ ok: true, id: existing.id, shareSlug: existing.shareSlug, cached: true });
    }

    const locale = "ko";
    const llm = await generateSajuPrediction({
      name: parsed.data.name,
      gender: parsed.data.gender,
      birthDate: parsed.data.birthDate,
      birthTime: parsed.data.birthTime,
      calendarType: parsed.data.calendarType,
      locale
    });
    if (!llm) {
      return res.status(503).json({ ok: false, message: "사주 풀이 서비스를 잠시 사용할 수 없습니다." });
    }
    // Match positions to the LLM's specific role titles via pgvector
    // semantic search — "프로덕트 디자이너 / 콘텐츠 마케터" finds postings
    // that actually use those titles, not just anything tagged "디자인".
    // Fall back to the broad category filter when embeddings are
    // unavailable (no OpenAI key / transient failure).
    const searchTerms = [...llm.details.specificRoles, ...llm.recommendedRoleNames]
      .filter((t) => t && t.trim().length > 0);
    let recommendedPositionIds: string[] = [];
    if (searchTerms.length > 0) {
      const semanticQuery = searchTerms.join(" ");
      const queryVector = await embedQueryCached(semanticQuery);
      if (queryVector) {
        const vectorLiteral = toPgVector(queryVector);
        const annRows = await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT "id"
          FROM "Position"
          WHERE "status" = 'OPEN'
            AND "embedding" IS NOT NULL
          ORDER BY "embedding" <=> ${vectorLiteral}::vector
          LIMIT 6
        `;
        recommendedPositionIds = annRows.map((r) => r.id);
      }
    }
    if (recommendedPositionIds.length === 0) {
      const fallback = await prisma.position.findMany({
        where: {
          status: PositionStatus.OPEN,
          preferredJobRole: { in: llm.recommendedRoleNames }
        },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true }
      });
      recommendedPositionIds = fallback.map((p) => p.id);
    }

    const ipRaw =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "";
    const ipHash = ipRaw
      ? createHash("sha256").update(`${ipRaw}|saju-pred`).digest("hex").slice(0, 32)
      : null;

    // Race-safe upsert: if another request lost the dedupe check by a
    // few ms (e.g. the visitor double-tapped submit), the unique index
    // on inputHash funnels both into the same row.
    const prediction = await prisma.sajuPrediction.upsert({
      where: { inputHash },
      create: {
        name: parsed.data.name,
        gender: parsed.data.gender,
        birthDate: new Date(`${parsed.data.birthDate}T00:00:00.000Z`),
        birthTime: parsed.data.birthTime ?? null,
        calendarType,
        interpretation: llm.interpretation,
        details: llm.details as unknown as Prisma.InputJsonValue,
        recommendedRoleNames: llm.recommendedRoleNames,
        recommendedPositionIds,
        locale,
        ipHash,
        inputHash
      },
      update: {},
      select: { id: true, shareSlug: true }
    });

    return res.json({ ok: true, id: prediction.id, shareSlug: prediction.shareSlug });
  }
);

app.get("/saju/result/:slug", async (req, res) => {
  const parsed = sajuResultParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid slug" });
  }
  const queryParsed = sajuResultQuerySchema.safeParse(req.query);
  const requestedLocale = queryParsed.success ? queryParsed.data.locale ?? null : null;
  const prediction = await prisma.sajuPrediction.findUnique({
    where: { shareSlug: parsed.data.slug }
  });
  if (!prediction) return res.status(404).json({ ok: false, message: "not found" });

  // Claim on first authenticated visit so the user "owns" this prediction
  // afterwards (lets us key follow-up emails / dashboard widgets to it).
  const viewer = await resolvePublicViewer(req);
  if (viewer && !prediction.userId && req.auth?.userId) {
    try {
      await prisma.sajuPrediction.update({
        where: { id: prediction.id },
        data: { userId: req.auth.userId, claimedAt: new Date() }
      });
      prediction.userId = req.auth.userId;
      prediction.claimedAt = new Date();
    } catch {
      // claim is best-effort
    }
  }
  // Link any pre-signup career lead to this freshly-authenticated user and
  // prefill their profile. Runs on first auth visit (after the claim above);
  // best-effort so a prefill failure never blocks rendering the result.
  if (req.auth?.userId) {
    try {
      await linkSajuLeadToUser(prediction.id, req.auth.userId);
    } catch (err) {
      console.error("[saju] lead linkage failed", err);
    }
  }

  // Fetch the linked positions in their preserved recommendation order,
  // plus a corpus-wide prediction count for the social-proof line on
  // the result page ("이미 N명이 봤어요").
  const [positions, totalPredictions] = await Promise.all([
    prediction.recommendedPositionIds.length
      ? prisma.position.findMany({
          where: { id: { in: prediction.recommendedPositionIds }, status: PositionStatus.OPEN },
          include: {
            partnerOrganization: {
              select: {
                id: true,
                name: true,
                industry: true,
                companySize: true,
                officeAddress: true,
                companyLogoImageData: true
              }
            },
            matchingParticipants: { select: { id: true } }
          }
        })
      : Promise.resolve([]),
    prisma.sajuPrediction.count()
  ]);
  const orderedPositions = prediction.recommendedPositionIds
    .map((id) => positions.find((p) => p.id === id))
    .filter((p): p is (typeof positions)[number] => Boolean(p));

  // If the viewer's locale differs from the locale the prediction was
  // generated in, serve a cached translation (or generate + cache one
  // on demand). Same-locale viewers skip this branch entirely — UNLESS
  // we detect Korean characters lingering in the content for a non-ko
  // viewer (LLM occasionally ignores the language directive at
  // creation time), in which case we force a translation pass.
  let interpretationOut = prediction.interpretation;
  let detailsOut = prediction.details as SajuDetails | null;
  const koreanCharRegex = /[가-힯ᄀ-ᇿ㄰-㆏]/;
  const hasKoreanLeak = (() => {
    if (!requestedLocale || requestedLocale === "ko") return false;
    const probe: string[] = [interpretationOut];
    if (detailsOut) {
      probe.push(detailsOut.cautionAdvice ?? "");
      probe.push(...(detailsOut.strengths ?? []));
      probe.push(...(detailsOut.workEnvironment ?? []));
      probe.push(...(detailsOut.specificRoles ?? []));
      probe.push(...((detailsOut.roleReasonings ?? []).map((r) => r.reason ?? "")));
    }
    return probe.some((t) => koreanCharRegex.test(t));
  })();
  const needsTranslation = requestedLocale && (requestedLocale !== prediction.locale || hasKoreanLeak);
  if (needsTranslation && requestedLocale) {
    const cache = (prediction.translations ?? {}) as Record<string, SajuTranslatableContent>;
    const cached = cache[requestedLocale];
    if (cached && !koreanCharRegex.test(JSON.stringify(cached))) {
      interpretationOut = cached.interpretation;
      detailsOut = cached.details;
    } else if (detailsOut) {
      const translated = await translateSajuContent(
        { interpretation: prediction.interpretation, details: detailsOut },
        requestedLocale
      );
      if (translated) {
        interpretationOut = translated.interpretation;
        detailsOut = translated.details;
        const nextCache = { ...cache, [requestedLocale]: translated };
        // Fire and forget — translation render shouldn't block on persistence.
        prisma.sajuPrediction
          .update({
            where: { id: prediction.id },
            data: { translations: nextCache as unknown as Prisma.InputJsonValue }
          })
          .catch((err) => console.error("[saju] translation cache write failed", err));
      }
    }
  }

  return res.json({
    ok: true,
    prediction: {
      id: prediction.id,
      shareSlug: prediction.shareSlug,
      name: prediction.name,
      gender: prediction.gender,
      birthDate: prediction.birthDate.toISOString().slice(0, 10),
      birthTime: prediction.birthTime,
      calendarType: prediction.calendarType,
      interpretation: interpretationOut,
      details: detailsOut,
      recommendedRoleNames: prediction.recommendedRoleNames,
      isAuthenticated: Boolean(viewer),
      isClaimed: Boolean(prediction.userId),
      createdAt: prediction.createdAt.toISOString()
    },
    positions: orderedPositions.map((item) => toPublicPositionItem(item, viewer)),
    totalPredictions
  });
});

// Visa types that allow working in Korea (vs. study-only / unset). Used by
// the saju lead recommendation engine to decide whether to flag "비자 확인".
const SAJU_WORK_CAPABLE_VISA = new Set([
  "D10_JOB_SEEKING",
  "F2_RESIDENCE",
  "F4_OVERSEAS_KOREAN",
  "F5_PERMANENT_RESIDENCE",
  "F6_MARRIAGE_IMMIGRATION",
  "E7_SPECIFIC_ACTIVITY",
  "H1_WORKING_HOLIDAY"
]);

type SajuLeadInput = z.infer<typeof sajuLeadSchema>;
type SajuLeadRecommendation = {
  recommendedRoles: string[];
  improvements: string[];
  status: "UNVERIFIED" | "NEEDS_WORK" | "RECOMMENDABLE";
};

// Rule-based (no LLM cost) "추천 가능성" engine. Combines the person's
// declared preferred role with the saju-derived roles, flags the gaps that
// keep them out of the recommendable pool, and grades their readiness.
function computeSajuLeadRecommendation(
  input: SajuLeadInput,
  predictionRoles: string[]
): SajuLeadRecommendation {
  const roles: string[] = [];
  if (input.preferredJobRole) roles.push(input.preferredJobRole);
  for (const r of predictionRoles) if (r && !roles.includes(r)) roles.push(r);
  const recommendedRoles = roles.slice(0, 3);

  const workCapableVisa = Boolean(input.visaType && SAJU_WORK_CAPABLE_VISA.has(input.visaType));
  const koreanOk = Boolean(input.koreanLevel && input.koreanLevel !== "BEGINNER");
  const contactOk = Boolean(input.contact && input.contact.trim());
  const hasResume = input.hasResume === true;

  const improvements: string[] = [];
  if (!hasResume) improvements.push("RESUME");
  if (!koreanOk) improvements.push("KOREAN");
  if (!workCapableVisa) improvements.push("VISA");
  if (!contactOk) improvements.push("CONTACT");
  if (recommendedRoles.some((r) => r === "디자인" || r === "개발")) improvements.push("PORTFOLIO");

  let status: SajuLeadRecommendation["status"];
  if (hasResume && koreanOk && workCapableVisa && contactOk) status = "RECOMMENDABLE";
  else if (contactOk && (koreanOk || workCapableVisa)) status = "NEEDS_WORK";
  else status = "UNVERIFIED";

  return { recommendedRoles, improvements, status };
}

// Auto-generated, namespaced filter tags for the ops candidate console.
function buildSajuLeadTags(input: SajuLeadInput): string[] {
  const tags: string[] = [];
  if (input.nationality?.trim()) tags.push(`nat:${input.nationality.trim()}`);
  if (input.preferredJobRole) tags.push(`role:${input.preferredJobRole}`);
  if (input.visaType) tags.push(`visa:${input.visaType}`);
  if (input.koreanLevel) tags.push(`ko:${input.koreanLevel}`);
  if (input.workType) tags.push(`work:${input.workType}`);
  return tags;
}

// Korean saju taxonomy → CandidatePreferredJobRole enum, for best-effort
// profile prefill when an event lead signs up. Unmapped categories fall to
// OTHER so we never drop the intent entirely.
const SAJU_ROLE_TO_PROFILE_ENUM: Record<string, CandidatePreferredJobRole> = {
  "개발": CandidatePreferredJobRole.SOFTWARE_DEVELOPMENT,
  "디자인": CandidatePreferredJobRole.UI_UX_DESIGN,
  "기획·전략": CandidatePreferredJobRole.OPERATIONS_PLANNING,
  "마케팅·광고": CandidatePreferredJobRole.MARKETING,
  "영업": CandidatePreferredJobRole.SALES,
  "HR·인사": CandidatePreferredJobRole.HR,
  "금융": CandidatePreferredJobRole.FINANCE_ACCOUNTING,
  "연구·R&D": CandidatePreferredJobRole.DATA_ANALYSIS_SCIENCE
};

// When an event lead signs up, link their captured career info to the new
// account and prefill the candidate profile — but only fields that are
// still empty, so we never clobber anything the user later edits. Entirely
// best-effort: any failure here must not block the result page.
async function linkSajuLeadToUser(predictionId: string, userId: string): Promise<void> {
  const lead = await prisma.sajuLead.findFirst({
    where: { predictionId, userId: null },
    orderBy: { createdAt: "desc" }
  });
  if (!lead) return;

  await prisma.sajuLead.update({
    where: { id: lead.id },
    data: { userId, poolStage: lead.hasResume ? "VERIFIED" : "PROFILE" }
  });

  let profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: { educations: { select: { id: true } }, languageSkills: { select: { id: true } } }
  });
  if (!profile) {
    profile = await prisma.candidateProfile.create({
      data: { userId },
      include: { educations: { select: { id: true } }, languageSkills: { select: { id: true } } }
    });
  }

  const profileUpdates: Prisma.CandidateProfileUpdateInput = {};
  if (!profile.visaType && lead.visaType && lead.visaType in CandidateVisaType) {
    profileUpdates.visaType = lead.visaType as CandidateVisaType;
  }
  if (profile.preferredJobRoles.length === 0 && lead.preferredJobRole) {
    const mapped = SAJU_ROLE_TO_PROFILE_ENUM[lead.preferredJobRole] ?? CandidatePreferredJobRole.OTHER;
    profileUpdates.preferredJobRoles = [mapped];
  }
  if (Object.keys(profileUpdates).length > 0) {
    await prisma.candidateProfile.update({ where: { userId }, data: profileUpdates });
  }

  if (lead.nationality) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { nationality: true } });
    if (u && !u.nationality) {
      await prisma.user.update({ where: { id: userId }, data: { nationality: lead.nationality } });
    }
  }

  if (profile.educations.length === 0 && (lead.school || lead.major)) {
    await prisma.candidateEducation.create({
      data: {
        candidateProfileId: profile.id,
        schoolName: lead.school ?? "—",
        educationType: CandidateEducationType.BACHELOR,
        major: lead.major ?? null,
        status: CandidateEducationStatus.ENROLLED
      }
    });
  }

  if (profile.languageSkills.length === 0) {
    const skills: Array<{ language: CandidateLanguageType; level: CandidateLanguageLevel }> = [];
    if (lead.koreanLevel && lead.koreanLevel in CandidateLanguageLevel) {
      skills.push({ language: CandidateLanguageType.KOREAN, level: lead.koreanLevel as CandidateLanguageLevel });
    }
    if (lead.englishLevel && lead.englishLevel in CandidateLanguageLevel) {
      skills.push({ language: CandidateLanguageType.ENGLISH, level: lead.englishLevel as CandidateLanguageLevel });
    }
    for (const s of skills) {
      await prisma.candidateLanguageSkill.create({
        data: { candidateProfileId: profile.id, language: s.language, level: s.level }
      });
    }
  }
}

// POST /saju/lead — anonymous "Profile Pool" capture. Called after the user
// has seen the free saju result and chosen to check their real-CV fit.
app.post(
  "/saju/lead",
  rateLimit({ windowMs: 60_000, max: 12, keyPrefix: "saju-lead", message: "잠시 후 다시 시도해 주세요." }),
  async (req, res) => {
    const parsed = sajuLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid input", errors: parsed.error.flatten() });
    }
    const input = parsed.data;
    const prediction = await prisma.sajuPrediction.findUnique({
      where: { shareSlug: input.shareSlug },
      select: { id: true, name: true, recommendedRoleNames: true }
    });
    if (!prediction) return res.status(404).json({ ok: false, message: "prediction not found" });

    const recommendation = computeSajuLeadRecommendation(input, prediction.recommendedRoleNames);
    const tags = buildSajuLeadTags(input);

    const ipRaw =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "";
    const ipHash = ipRaw
      ? createHash("sha256").update(`${ipRaw}|saju-lead`).digest("hex").slice(0, 32)
      : null;

    const data = {
      predictionId: prediction.id,
      shareSlug: input.shareSlug,
      name: prediction.name,
      nationality: input.nationality ?? null,
      school: input.school ?? null,
      major: input.major ?? null,
      visaType: input.visaType ?? null,
      koreanLevel: input.koreanLevel ?? null,
      englishLevel: input.englishLevel ?? null,
      preferredJobRole: input.preferredJobRole ?? null,
      workType: input.workType ?? null,
      contact: input.contact ?? null,
      contactType: input.contactType ?? null,
      hasResume: input.hasResume ?? null,
      recommendedRoles: recommendation.recommendedRoles,
      improvements: recommendation.improvements,
      recommendStatus: recommendation.status,
      poolStage: "PROFILE",
      tags,
      consentCareer: input.consentCareer ?? false,
      consentRecommend: input.consentRecommend ?? false,
      consentContact: input.consentContact ?? false,
      locale: input.locale ?? "ko",
      ipHash
    };

    // One lead per prediction — a person can refine their answers, so
    // update the existing row instead of piling up duplicates.
    const existing = await prisma.sajuLead.findFirst({
      where: { predictionId: prediction.id },
      select: { id: true, userId: true }
    });
    let leadId: string;
    if (existing) {
      await prisma.sajuLead.update({ where: { id: existing.id }, data });
      leadId = existing.id;
    } else {
      const created = await prisma.sajuLead.create({ data, select: { id: true } });
      leadId = created.id;
    }

    return res.json({ ok: true, leadId, recommendation });
  }
);

// ---------------------------------------------------------------------------
// MBTI × 한국 직장 매칭 이벤트 ----------------------------------------------
// ---------------------------------------------------------------------------

// Either `mbtiType` (direct 4-letter pick from sliders) OR `quizAnswers`
// (12 answers from mini quiz). The result is normalized to a valid type
// before we query positions.
const mbtiPredictSchema = z
  .object({
    mbtiType: z.string().toUpperCase().optional(),
    quizAnswers: z
      .array(z.object({ id: z.string(), code: z.string() }))
      .max(20)
      .optional(),
    name: z.string().trim().max(80).optional(),
    nationality: z.string().trim().max(80).optional(),
    locale: z.enum(["ko", "en", "zh-CN", "vi", "ja", "id"]).optional()
  })
  .refine((v) => Boolean(v.mbtiType || v.quizAnswers?.length), {
    message: "mbtiType or quizAnswers is required"
  });

app.post("/mbti/predict", async (req, res) => {
  const parsed = mbtiPredictSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  // Resolve to a valid MBTI type. Prefer explicit `mbtiType` if present
  // (slider mode); otherwise tally the quiz answers.
  let mbtiType: MbtiType | null = null;
  if (parsed.data.mbtiType && isMbtiType(parsed.data.mbtiType)) {
    mbtiType = parsed.data.mbtiType as MbtiType;
  } else if (parsed.data.quizAnswers?.length) {
    mbtiType = computeMbtiFromQuiz(parsed.data.quizAnswers);
  }
  if (!mbtiType) {
    return res.status(400).json({ ok: false, message: "could not determine mbti type" });
  }
  const profile = MBTI_PROFILE[mbtiType];

  // Find OPEN positions in the recommended role categories. Sort by recency;
  // take top 5. Skip translations for now — the result page only displays
  // title + partner + role label.
  const positionRows = await prisma.position.findMany({
    where: {
      status: PositionStatus.OPEN,
      preferredJobRole: { in: profile.roles as CandidatePreferredJobRole[] }
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, preferredJobRole: true, createdAt: true }
  });
  const byRole = new Map<string, string[]>();
  for (const row of positionRows) {
    const code = row.preferredJobRole ?? "OTHER";
    const list = byRole.get(code) ?? [];
    list.push(row.id);
    byRole.set(code, list);
  }
  // Round-robin pick by priority role so each top role gets a slot before
  // any one role takes them all.
  const recommendedPositionIds: string[] = [];
  for (let i = 0; recommendedPositionIds.length < 5 && i < 5; i += 1) {
    for (const role of profile.roles) {
      const list = byRole.get(role);
      if (list && list[i]) {
        recommendedPositionIds.push(list[i]);
        if (recommendedPositionIds.length >= 5) break;
      }
    }
  }

  const ipRaw =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress || "";
  const ipHash = ipRaw
    ? createHash("sha256").update(`${ipRaw}|mbti-pred`).digest("hex").slice(0, 32)
    : null;

  const created = await prisma.mbtiPrediction.create({
    data: {
      mbtiType,
      name: parsed.data.name ?? null,
      nationality: parsed.data.nationality ?? null,
      recommendedRoleNames: profile.roles,
      recommendedPositionIds,
      cultureSummary: profile.culture,
      interpretation: profile.interpretation,
      locale: parsed.data.locale ?? "ko",
      ipHash
    },
    select: { id: true, shareSlug: true }
  });

  return res.json({ ok: true, id: created.id, shareSlug: created.shareSlug });
});

app.get("/mbti/result/:slug", async (req, res) => {
  const slug = typeof req.params.slug === "string" ? req.params.slug : "";
  if (!slug) return res.status(400).json({ ok: false, message: "missing slug" });
  const prediction = await prisma.mbtiPrediction.findUnique({ where: { shareSlug: slug } });
  if (!prediction) return res.status(404).json({ ok: false, message: "not found" });

  const positions = prediction.recommendedPositionIds.length
    ? await prisma.position.findMany({
        where: { id: { in: prediction.recommendedPositionIds }, status: PositionStatus.OPEN },
        include: { partnerOrganization: { select: { id: true, name: true } } }
      })
    : [];
  // Preserve the ranked order we stored.
  const byId = new Map(positions.map((p) => [p.id, p]));
  // Static reasons live in the data module; resolve at read time so old
  // predictions get the latest copy without a migration.
  const isType = isMbtiType(prediction.mbtiType);
  const mbtiType = isType ? (prediction.mbtiType as MbtiType) : null;
  const orderedPositions = prediction.recommendedPositionIds
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      id: p.id,
      title: p.title,
      preferredJobRole: p.preferredJobRole,
      partnerOrganization: p.partnerOrganization
        ? { id: p.partnerOrganization.id, name: p.partnerOrganization.name }
        : null,
      matchReason: mbtiType ? getMatchReason(mbtiType, p.preferredJobRole as MbtiRoleCode | null) : null
    }));

  // Rich profile fields are static per-type, so we read them out of the
  // catalog at response time rather than persisting them in the row.
  const richProfile = mbtiType ? MBTI_PROFILE[mbtiType] : null;

  return res.json({
    ok: true,
    prediction: {
      id: prediction.id,
      mbtiType: prediction.mbtiType,
      name: prediction.name,
      nationality: prediction.nationality,
      recommendedRoleNames: prediction.recommendedRoleNames,
      cultureSummary: prediction.cultureSummary,
      interpretation: prediction.interpretation,
      strengths: richProfile?.strengths ?? [],
      koreanWorkplaceChallenges: richProfile?.koreanWorkplaceChallenges ?? [],
      companySizeFit: richProfile?.companySizeFit ?? "",
      teamVibe: richProfile?.teamVibe ?? "",
      interviewTips: richProfile?.interviewTips ?? [],
      famousKoreans: richProfile?.famousKoreans ?? [],
      goodMatchMbtis: richProfile?.goodMatchMbtis ?? [],
      greenFlags: richProfile?.greenFlags ?? [],
      redFlags: richProfile?.redFlags ?? [],
      shareSlug: prediction.shareSlug,
      locale: prediction.locale,
      createdAt: prediction.createdAt.toISOString()
    },
    positions: orderedPositions
  });
});

// Expose the quiz questions so the client can render them without
// duplicating the catalog. Keep this in sync with computeMbtiFromQuiz.
app.get("/mbti/quiz", (_req, res) => {
  return res.json({ ok: true, questions: MBTI_QUIZ_QUESTIONS });
});

// ---------------------------------------------------------------------------
// 비자 가능성 체크 이벤트 ---------------------------------------------------
// ---------------------------------------------------------------------------

const visaCheckSchema = z.object({
  name: z.string().trim().max(80).optional(),
  nationality: z.string().trim().min(1).max(80),
  currentVisa: z.string().trim().max(20).optional(),
  educationLevel: z.enum(["HIGH_SCHOOL", "BACHELOR", "MASTER", "PHD"]),
  // 자유 입력으로 변경 — 추천 분기에 쓰이지 않고 단순 저장용. 프론트에서
  // 카테고리 옵션을 늘려도 백엔드 enum 을 매번 동기화할 필요가 없음.
  majorCategory: z.string().trim().max(40).optional(),
  koreanLevel: z.enum(["NONE", "BEGINNER", "INTERMEDIATE", "ADVANCED", "NATIVE"]),
  workYears: z.coerce.number().int().min(0).max(50),
  targetRole: z.string().trim().max(80).optional(),
  locale: z.enum(["ko", "en", "zh-CN", "vi", "ja", "id"]).optional(),
  // Phase 1 신규 — 결과의 5단계 상태 분류 / 로드맵 우선순위 hint 에 사용.
  // 모두 optional 이라 기존 호출자/저장 기록 호환.
  inKorea: z.boolean().optional(),
  hasJobOffer: z.boolean().optional(),
  graduationStatus: z
    .enum(["not_applicable", "completed", "within_6mo", "within_1y", "later"])
    .optional()
});

app.post("/visa/check", async (req, res) => {
  const parsed = visaCheckSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }
  const input = parsed.data;
  // Phase 1: evaluateVisa() = eligibleVisas + roadmap + nextSteps. roadmap/
  // nextSteps 는 새 필드로 같은 Json 컬럼(`eligibleVisas`) 에 묶어 저장 —
  // 스키마 변경 없이 결과 페이지가 즉시 활용 가능.
  const evaluation = evaluateVisa({
    nationality: input.nationality,
    currentVisa: input.currentVisa ?? null,
    educationLevel: input.educationLevel,
    majorCategory: input.majorCategory ?? null,
    koreanLevel: input.koreanLevel,
    workYears: input.workYears,
    targetRole: input.targetRole ?? null,
    inKorea: input.inKorea,
    hasJobOffer: input.hasJobOffer,
    graduationStatus: input.graduationStatus
  });
  const eligibleVisas = evaluation.eligibleVisas;

  // 사용자 입력(비자 / 국적 / 전공 / 한국어 / targetRole) 기반 매칭 점수로
  // 추천 포지션 5개 선정. 룰 기반·즉시 계산이라 임베딩 비용 없음. 후보 풀
  // 은 최근 OPEN 60개 — 점수 차이 명확히 나오기에 충분.
  const candidates = await prisma.position.findMany({
    where: { status: PositionStatus.OPEN },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      title: true,
      eligibleVisas: true,
      preferredNationalities: true,
      communicationLanguages: true,
      preferredJobRole: true
    }
  });

  // 결과로 나온 비자 코드 set — fit=high/medium 만으로 한정해 후원 가능성
  // 시그널을 정확하게 잡음 (low 는 가산점 대상에서 제외).
  const userVisaCodes = new Set(
    eligibleVisas
      .filter((v) => v.fit === "high" || v.fit === "medium")
      .map((v) => v.code.toUpperCase())
  );

  // 전공 → 직무 키워드 매핑(heuristic). preferredJobRole / title 에 키워드
  // 가 포함되면 매칭으로 본다. 한국어/영어 키워드 함께 둬서 다국어 공고도 잡힘.
  const majorRoleKeywords: Record<string, string[]> = {
    IT: ["software", "engineer", "developer", "개발자", "엔지니어", "frontend", "backend"],
    IT_SOFTWARE: ["software", "engineer", "developer", "개발자", "엔지니어", "frontend", "backend"],
    AI_DATA: ["data", "ai", "ml", "데이터", "분석", "analyst", "scientist"],
    ENGINEERING: ["engineer", "엔지니어"],
    MECHANICAL: ["mechanical", "기계"],
    ELECTRICAL: ["electrical", "electronics", "전기", "전자"],
    CIVIL: ["civil", "architect", "건축", "토목"],
    CHEMICAL: ["chemical", "화학", "소재"],
    BUSINESS: ["business", "manager", "경영", "운영", "operations"],
    ECONOMICS: ["finance", "economic", "재무", "금융"],
    MARKETING: ["marketing", "growth", "마케팅", "광고"],
    DESIGN: ["design", "ux", "ui", "디자인", "designer"],
    ART: ["art", "music", "film", "video", "예술", "영상"],
    HUMANITIES: ["content", "writer", "editor", "콘텐츠"],
    KOREAN_STUDIES: ["korean", "한국어", "통역", "번역"],
    EDUCATION: ["teacher", "instructor", "교사", "강사", "education"],
    LAW: ["legal", "law", "법무", "compliance"],
    SOCIAL_SCIENCE: ["research", "policy", "리서치"],
    SCIENCE: ["research", "scientist", "lab", "연구"],
    MEDICINE: ["medical", "nursing", "health", "의료", "간호", "보건"],
    AGRICULTURE: ["food", "agri", "농업", "식품"],
    TOURISM: ["tourism", "hotel", "hospitality", "관광", "호텔"],
    COMMUNICATIONS: ["media", "journalism", "pr", "미디어", "홍보"],
    INTERNATIONAL: ["international", "global", "외교"]
  };
  const majorKeywords =
    input.majorCategory && majorRoleKeywords[input.majorCategory]
      ? majorRoleKeywords[input.majorCategory].map((k) => k.toLowerCase())
      : [];

  const targetKeywords = input.targetRole
    ? input.targetRole
        .toLowerCase()
        .split(/[\s,/·]+/)
        .filter((w) => w.length >= 2)
    : [];

  const koreanScoreMap: Record<string, number> = {
    NONE: 0, BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3, NATIVE: 4
  };
  const userKoreanScore = koreanScoreMap[input.koreanLevel] ?? 2;
  const userNatUpper = input.nationality.toUpperCase();

  type Scored = { id: string; score: number };
  const scored: Scored[] = candidates.map((p) => {
    let score = 0;

    // 1) 비자 후원 매칭 — 가장 강력한 시그널.
    const posVisas = (p.eligibleVisas ?? []).map((v) => v.toUpperCase());
    if (posVisas.length > 0 && userVisaCodes.size > 0) {
      const hasMatch = posVisas.some((pv) =>
        Array.from(userVisaCodes).some((uv) => pv.includes(uv) || uv.includes(pv))
      );
      if (hasMatch) score += 40;
      else score -= 10; // 후원 안 되는 곳은 감점
    }

    // 2) 국적 매칭 — preferredNationalities 에 명시됐으면 +.
    const posNat = (p.preferredNationalities ?? []).map((n) => n.toUpperCase());
    if (posNat.length > 0 && posNat.includes(userNatUpper)) score += 20;

    // 3) 전공 → 직무 키워드 매칭.
    const haystack = `${p.title} ${p.preferredJobRole ?? ""}`.toLowerCase();
    if (majorKeywords.length > 0 && majorKeywords.some((kw) => haystack.includes(kw))) {
      score += 25;
    }

    // 4) targetRole 직접 매칭 — 사용자가 명시한 게 가장 신호 강함.
    if (targetKeywords.length > 0) {
      const matchCount = targetKeywords.filter((kw) => haystack.includes(kw)).length;
      if (matchCount > 0) score += 15 * matchCount;
    }

    // 5) 한국어 ↔ 포지션 언어 요구.
    const posLangs = (p.communicationLanguages ?? []).map((l) => l.toLowerCase());
    const requiresKorean = posLangs.some((l) => l.includes("kor") || l.includes("한국") || l === "ko");
    const onlyEnglish = posLangs.length > 0 && posLangs.every((l) => l.includes("en"));
    if (requiresKorean && userKoreanScore < 2) score -= 15;
    if (onlyEnglish) score += 5;

    return { id: p.id, score };
  });

  // 점수 내림차순. 동점은 원래 순서(최근) 유지.
  scored.sort((a, b) => b.score - a.score);
  const recommendedPositionIds = scored.slice(0, 5).map((s) => s.id);

  const ipRaw =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress || "";
  const ipHash = ipRaw
    ? createHash("sha256").update(`${ipRaw}|visa-check`).digest("hex").slice(0, 32)
    : null;

  // eligibleVisas 컬럼(Json) 안에 visas + roadmap + nextSteps 함께 저장.
  // 기존 레코드는 array 형태 → 읽을 때 Array.isArray 로 분기 (호환 유지).
  const visaPayload = {
    visas: eligibleVisas,
    roadmap: evaluation.roadmap,
    nextSteps: evaluation.nextSteps,
    // 입력 컨텍스트 — 결과 페이지에서 status 분기 표시에 활용.
    inputContext: {
      inKorea: input.inKorea ?? null,
      hasJobOffer: input.hasJobOffer ?? null,
      graduationStatus: input.graduationStatus ?? null
    }
  };
  const created = await prisma.visaCheckResult.create({
    data: {
      name: input.name ?? null,
      nationality: input.nationality,
      currentVisa: input.currentVisa ?? null,
      educationLevel: input.educationLevel,
      majorCategory: input.majorCategory ?? null,
      koreanLevel: input.koreanLevel,
      workYears: input.workYears,
      targetRole: input.targetRole ?? null,
      // Phase 1 신규 입력 — top-level 컬럼에도 함께 기록해 ops raw-pool
      // 필터링/정렬을 가능하게 한다. JSON 안 inputContext 도 같이 유지하여
      // 결과 조회/legacy 호환을 깨지 않는다.
      inKorea: input.inKorea ?? null,
      hasJobOffer: input.hasJobOffer ?? null,
      graduationStatus: input.graduationStatus ?? null,
      eligibleVisas: visaPayload as unknown as Prisma.InputJsonValue,
      recommendedPositionIds,
      locale: input.locale ?? "ko",
      ipHash
    },
    select: { id: true, shareSlug: true }
  });

  return res.json({ ok: true, id: created.id, shareSlug: created.shareSlug });
});

app.get("/visa/result/:slug", async (req, res) => {
  const slug = typeof req.params.slug === "string" ? req.params.slug : "";
  if (!slug) return res.status(400).json({ ok: false, message: "missing slug" });
  const result = await prisma.visaCheckResult.findUnique({ where: { shareSlug: slug } });
  if (!result) return res.status(404).json({ ok: false, message: "not found" });

  const positions = result.recommendedPositionIds.length
    ? await prisma.position.findMany({
        where: { id: { in: result.recommendedPositionIds }, status: PositionStatus.OPEN },
        include: { partnerOrganization: { select: { id: true, name: true } } }
      })
    : [];
  const byId = new Map(positions.map((p) => [p.id, p]));
  const orderedPositions = result.recommendedPositionIds
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      id: p.id,
      title: p.title,
      preferredJobRole: p.preferredJobRole,
      partnerOrganization: p.partnerOrganization
        ? { id: p.partnerOrganization.id, name: p.partnerOrganization.name }
        : null
    }));

  // 저장된 eligibleVisas 는 두 형태 — legacy(array) 또는 Phase 1 wrapper
  // (`{ visas, roadmap, nextSteps, inputContext }`). 응답은 항상 wrapper 모양
  // 으로 통일해 프론트가 한 코드 경로로 처리하게 한다.
  const stored = result.eligibleVisas as unknown;
  const isLegacy = Array.isArray(stored);
  type StoredPayload = {
    visas?: unknown;
    roadmap?: unknown;
    nextSteps?: unknown;
    inputContext?: unknown;
  };
  const payload: StoredPayload = isLegacy ? { visas: stored } : ((stored ?? {}) as StoredPayload);

  return res.json({
    ok: true,
    result: {
      id: result.id,
      name: result.name,
      nationality: result.nationality,
      currentVisa: result.currentVisa,
      educationLevel: result.educationLevel,
      majorCategory: result.majorCategory,
      koreanLevel: result.koreanLevel,
      workYears: result.workYears,
      targetRole: result.targetRole,
      eligibleVisas: payload.visas ?? [],
      roadmap: payload.roadmap ?? null,
      nextSteps: payload.nextSteps ?? [],
      inputContext: payload.inputContext ?? null,
      shareSlug: result.shareSlug,
      locale: result.locale,
      createdAt: result.createdAt.toISOString()
    },
    positions: orderedPositions
  });
});

// POST /visa/lead — VisaResultPage 의 회원가입 퍼널에서 익명으로 모으는
// 리드. SajuLead 와 동일한 pool 패턴 + visa 맞춤 필드(희망 입사일·졸업일·
// 대학·전공) 를 추가. 한 result 당 한 lead — 사용자가 단계별로 보완할 수
// 있게 기존 row 를 update 하는 upsert 흐름.
const visaLeadSchema = z.object({
  shareSlug: z.string().min(1),
  name: z.string().trim().max(80).optional(),
  contact: z.string().trim().max(200).optional(),
  contactType: z.enum(["email", "phone", "messenger"]).optional(),
  nationality: z.string().trim().max(80).optional(),
  currentVisa: z.string().trim().max(20).optional(),
  expectedJoinDate: z.string().trim().max(20).optional(),
  graduationDate: z.string().trim().max(20).optional(),
  university: z.string().trim().max(120).optional(),
  major: z.string().trim().max(120).optional(),
  preferredJobRole: z.string().trim().max(120).optional(),
  koreanLevel: z.string().trim().max(20).optional(),
  englishLevel: z.string().trim().max(20).optional(),
  consentCareer: z.boolean().optional(),
  consentRecommend: z.boolean().optional(),
  consentContact: z.boolean().optional(),
  locale: z.enum(["ko", "en", "zh-CN", "vi", "ja", "id"]).optional()
});

// 익명 lead 의 분류 태그 — 운영 콘솔에서 필터링용. 국적/직무/비자/언어 등
// 4-5 차원의 단순 키를 자동으로 생성.
function buildVisaLeadTags(input: z.infer<typeof visaLeadSchema>): string[] {
  const tags: string[] = [];
  if (input.nationality) tags.push(`nat:${input.nationality}`);
  if (input.currentVisa) tags.push(`visa:${input.currentVisa.toUpperCase()}`);
  if (input.preferredJobRole) tags.push(`role:${input.preferredJobRole}`);
  if (input.koreanLevel) tags.push(`ko:${input.koreanLevel}`);
  if (input.englishLevel) tags.push(`en:${input.englishLevel}`);
  return tags.slice(0, 10);
}

app.post(
  "/visa/lead",
  rateLimit({ windowMs: 60_000, max: 12, keyPrefix: "visa-lead", message: "잠시 후 다시 시도해 주세요." }),
  async (req, res) => {
    const parsed = visaLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid input", errors: parsed.error.flatten() });
    }
    const input = parsed.data;
    const visaResult = await prisma.visaCheckResult.findUnique({
      where: { shareSlug: input.shareSlug },
      select: { id: true, name: true, nationality: true }
    });
    if (!visaResult) return res.status(404).json({ ok: false, message: "result not found" });

    const tags = buildVisaLeadTags(input);
    const ipRaw =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "";
    const ipHash = ipRaw
      ? createHash("sha256").update(`${ipRaw}|visa-lead`).digest("hex").slice(0, 32)
      : null;

    const data = {
      visaResultId: visaResult.id,
      shareSlug: input.shareSlug,
      // 결과 페이지의 이름이 있으면 그대로 들고 옴. funnel 에서 새 이름을
      // 입력하면 그게 우선.
      name: input.name ?? visaResult.name,
      contact: input.contact ?? null,
      contactType: input.contactType ?? null,
      nationality: input.nationality ?? visaResult.nationality,
      currentVisa: input.currentVisa ?? null,
      expectedJoinDate: input.expectedJoinDate ?? null,
      graduationDate: input.graduationDate ?? null,
      university: input.university ?? null,
      major: input.major ?? null,
      preferredJobRole: input.preferredJobRole ?? null,
      koreanLevel: input.koreanLevel ?? null,
      englishLevel: input.englishLevel ?? null,
      poolStage: "PROFILE",
      tags,
      consentCareer: input.consentCareer ?? false,
      consentRecommend: input.consentRecommend ?? false,
      consentContact: input.consentContact ?? false,
      locale: input.locale ?? "ko",
      ipHash
    };

    const existing = await prisma.visaLead.findFirst({
      where: { visaResultId: visaResult.id },
      select: { id: true }
    });
    let leadId: string;
    if (existing) {
      await prisma.visaLead.update({ where: { id: existing.id }, data });
      leadId = existing.id;
    } else {
      const created = await prisma.visaLead.create({ data, select: { id: true } });
      leadId = created.id;
    }

    return res.json({ ok: true, leadId });
  }
);

// Response cache for /positions, anonymous viewers only. Authenticated
// users skip the cache so per-viewer flags (saved/applied/etc.) stay
// accurate. TTL-only with no manual invalidation: 60s is short enough
// that new positions appear within a minute and stale data is bounded.
type PositionsCacheEntry = { body: unknown; expiresAt: number };
const POSITIONS_CACHE_MAX = 100;
const POSITIONS_CACHE_TTL_MS = 60 * 1000;
const positionsResponseCache = new Map<string, PositionsCacheEntry>();

function positionsCacheKey(params: {
  search: string;
  limit: number;
  cursor: string | undefined;
  sortMode: string;
  sortOrder: string;
  jobRoles: string[];
  sourceProviders: string[];
  // Korean vs. translated-English response must not share a cache slot.
  locale: string;
}): string {
  return JSON.stringify({
    s: params.search,
    l: params.limit,
    c: params.cursor ?? "",
    sm: params.sortMode,
    so: params.sortOrder,
    j: [...params.jobRoles].sort(),
    p: [...params.sourceProviders].sort(),
    loc: params.locale
  });
}

app.get("/positions", async (req, res) => {
  const parsedQuery = listPublicPositionsCursorQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsedQuery.error.flatten() });
  }

  const limit = parsedQuery.data.limit ?? 20;
  const search = parsedQuery.data.search?.trim();
  const sourceProviders = parsedQuery.data.sourceProvider
    ? Array.from(new Set(Array.isArray(parsedQuery.data.sourceProvider) ? parsedQuery.data.sourceProvider : [parsedQuery.data.sourceProvider]))
    : [];
  const jobRoles = parsedQuery.data.jobRole
    ? Array.from(new Set(Array.isArray(parsedQuery.data.jobRole) ? parsedQuery.data.jobRole : [parsedQuery.data.jobRole]))
    : [];
  const sortMode = parsedQuery.data.sort ?? "latest";
  const sortOrder = parsedQuery.data.sortOrder ?? "desc";
  // Non-Korean viewers get INTERNAL postings translated to English. Normalize
  // the locale dimension to "en" or "ko" so the response cache only forks two
  // ways regardless of how many BCP47 codes the caller sends.
  const wantTranslation = shouldTranslateForLocale(parsedQuery.data.locale);
  const localeKey = wantTranslation ? "en" : "ko";

  // Check the anonymous-viewer response cache before doing any work.
  // We resolve the viewer first to gate the cache lookup; that's still
  // cheap (~1ms) compared to the ANN query.
  const cacheKey = positionsCacheKey({
    search: search ?? "",
    limit,
    cursor: parsedQuery.data.cursor,
    sortMode,
    sortOrder,
    jobRoles,
    sourceProviders: sourceProviders.map((p) => String(p)),
    locale: localeKey
  });

  // Cursor encodes the keyset for the active sort mode.
  // - latest: `${createdAtISO}|${id}` (desc; older or same-createdAt-with-smaller-id)
  // - deadline: `${deadlineISOorNULL}|${id}` (deadline asc, NULLs last)
  let latestCursor: { createdAt: Date; id: string } | null = null;
  let deadlineCursor: { deadline: Date | null; id: string } | null = null;
  if (parsedQuery.data.cursor) {
    try {
      const decoded = Buffer.from(parsedQuery.data.cursor, "base64").toString("utf8");
      const [headRaw, idRaw] = decoded.split("|");
      const id = idRaw?.trim();
      if (!id) {
        return res.status(400).json({ ok: false, message: "invalid cursor" });
      }
      if (sortMode === "deadline") {
        const head = headRaw?.trim() ?? "";
        if (head === "NULL") {
          deadlineCursor = { deadline: null, id };
        } else {
          const parsed = head ? new Date(head) : null;
          if (!parsed || Number.isNaN(parsed.getTime())) {
            return res.status(400).json({ ok: false, message: "invalid cursor" });
          }
          deadlineCursor = { deadline: parsed, id };
        }
      } else {
        const createdAt = headRaw ? new Date(headRaw) : null;
        if (!createdAt || Number.isNaN(createdAt.getTime())) {
          return res.status(400).json({ ok: false, message: "invalid cursor" });
        }
        latestCursor = { createdAt, id };
      }
    } catch {
      return res.status(400).json({ ok: false, message: "invalid cursor" });
    }
  }

  const viewer = await resolvePublicViewer(req);

  // Anonymous-only cache lookup. Skip for authenticated viewers because
  // toPublicPositionItem masks fields based on viewer.role.
  const now = Date.now();
  if (!viewer) {
    const hit = positionsResponseCache.get(cacheKey);
    if (hit && hit.expiresAt > now) {
      positionsResponseCache.delete(cacheKey);
      positionsResponseCache.set(cacheKey, hit);
      res.setHeader("X-Cache", "HIT");
      return res.json(hit.body);
    }
    if (hit) positionsResponseCache.delete(cacheKey);
  }

  const sendAndMaybeCache = (body: Record<string, unknown>) => {
    if (!viewer) {
      if (positionsResponseCache.size >= POSITIONS_CACHE_MAX) {
        const oldestKey = positionsResponseCache.keys().next().value;
        if (oldestKey !== undefined) positionsResponseCache.delete(oldestKey);
      }
      positionsResponseCache.set(cacheKey, { body, expiresAt: now + POSITIONS_CACHE_TTL_MS });
      res.setHeader("X-Cache", "MISS");
    }
    return res.json(body);
  };

  // Hybrid search branch: pgvector HNSW ANN narrows the candidate pool
  // to the semantically nearest ~100, then we re-rank those by a blend
  // of semantic similarity and multi-field keyword score. User filters
  // (jobRole / sourceProvider) are applied inside the ANN query so the
  // HNSW scan only walks indices the user can actually see.
  // Cursor pagination is skipped — hybrid results are one-shot.
  const SEMANTIC_WEIGHT = 0.65;
  const KEYWORD_WEIGHT = 0.35;
  const ANN_POOL_SIZE = 100;
  const trimmedSearch = (search ?? "").trim();
  if (trimmedSearch && openai) {
    const queryVector = await embedQueryCached(trimmedSearch);
    if (queryVector) {
      const vectorLiteral = toPgVector(queryVector);
      const jobRoleFilter = jobRoles.length
        ? Prisma.sql`AND "preferredJobRole" = ANY(${jobRoles}::text[])`
        : Prisma.empty;
      const providerFilter = sourceProviders.length
        ? Prisma.sql`AND "sourceProvider"::text = ANY(${sourceProviders.map((p) => String(p))}::text[])`
        : Prisma.empty;

      const annResults = await prisma.$queryRaw<Array<{ id: string; distance: number }>>`
        SELECT "id", "embedding" <=> ${vectorLiteral}::vector AS distance
        FROM "Position"
        WHERE "status" = 'OPEN'
          AND "embedding" IS NOT NULL
          ${jobRoleFilter}
          ${providerFilter}
        ORDER BY "embedding" <=> ${vectorLiteral}::vector
        LIMIT ${ANN_POOL_SIZE}
      `;

      // Union pool: also pull lexical matches that the ANN may have
      // missed (e.g. a few Busan positions whose embeddings drift far
      // because their description happens to be very niche). Fetch
      // their actual semantic distance too so they compete on the
      // hybrid score, not just keyword.
      const queryCandidates = expandQueryCandidates(trimmedSearch);
      const distanceById = new Map<string, number>(
        annResults.map((r) => [r.id, Number(r.distance)])
      );
      if (queryCandidates.length > 0) {
        const annIds = annResults.map((r) => r.id);
        const annExclude = annIds.length
          ? Prisma.sql`AND p."id" <> ALL(${annIds}::text[])`
          : Prisma.empty;
        const qualifiedJobRoleFilter = jobRoles.length
          ? Prisma.sql`AND p."preferredJobRole" = ANY(${jobRoles}::text[])`
          : Prisma.empty;
        const qualifiedProviderFilter = sourceProviders.length
          ? Prisma.sql`AND p."sourceProvider"::text = ANY(${sourceProviders.map((p) => String(p))}::text[])`
          : Prisma.empty;
        // ILIKE on title/workLocation/preferredJobRole + partner org name via join.
        // %candidate% built server-side to keep parameter list small.
        const likePatterns = queryCandidates.map((c) => `%${c}%`);
        const keywordRows = await prisma.$queryRaw<Array<{ id: string; distance: number }>>`
          SELECT p."id", p."embedding" <=> ${vectorLiteral}::vector AS distance
          FROM "Position" p
          LEFT JOIN "PartnerOrganization" po ON po."id" = p."partnerOrganizationId"
          WHERE p."status" = 'OPEN'
            AND p."embedding" IS NOT NULL
            ${qualifiedJobRoleFilter}
            ${qualifiedProviderFilter}
            ${annExclude}
            AND (
              p."title" ILIKE ANY(${likePatterns}::text[])
              OR p."workLocation" ILIKE ANY(${likePatterns}::text[])
              OR p."preferredJobRole" ILIKE ANY(${likePatterns}::text[])
              OR po."name" ILIKE ANY(${likePatterns}::text[])
            )
          ORDER BY p."embedding" <=> ${vectorLiteral}::vector
          LIMIT 50
        `;
        for (const row of keywordRows) {
          if (!distanceById.has(row.id)) distanceById.set(row.id, Number(row.distance));
        }
      }

      // Graceful degradation: if no positions have embeddings yet
      // (fresh deploy before backfill runs, or transient state), skip
      // the hybrid path and let the keyword-search path below handle
      // it. Otherwise the user would see an empty page right after a
      // schema migration.
      if (distanceById.size > 0) {

      // Fetch full data only for the narrowed pool, then re-rank with
      // keyword scoring. This keeps the row payload to ~100-150
      // records regardless of corpus size.
      const candidateIds = Array.from(distanceById.keys());
      const candidates = await prisma.position.findMany({
        where: { id: { in: candidateIds } },
        include: {
          partnerOrganization: {
            select: {
              id: true,
              name: true,
              industry: true,
              companySize: true,
              officeAddress: true,
              description: true,
              strengths: true,
              website: true,
              socialMedia: true,
              companyLogoImageData: true,
              officePhotoImageData: true
            }
          },
          matchingParticipants: { select: { id: true } }
        }
      });

      const scored = candidates.map((item) => {
        const distance = distanceById.get(item.id) ?? 1;
        const semantic = Math.max(0, 1 - distance);
        const lexical = keywordScore(
          {
            title: item.title,
            preferredJobRole: item.preferredJobRole,
            workLocation: item.workLocation,
            mainResponsibilities: item.mainResponsibilities,
            requiredQualifications: item.requiredQualifications,
            preferredQualifications: item.preferredQualifications,
            partnerOrganizationName: item.partnerOrganization?.name ?? null
          },
          trimmedSearch
        );
        return { item, score: SEMANTIC_WEIGHT * semantic + KEYWORD_WEIGHT * lexical };
      });
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, limit).map((entry) => entry.item);

      const hybridTranslations = wantTranslation
        ? await getPositionTranslationsBatch(
            prisma,
            top.filter((i) => i.sourceKind === PositionSourceKind.INTERNAL)
          )
        : new Map<string, PositionTranslatableFields>();
      return sendAndMaybeCache({
        ok: true,
        items: top.map((item) => toPublicPositionItem(item, viewer, hybridTranslations.get(item.id) ?? null)),
        nextCursor: null,
        searchMode: "hybrid" as const
      });
      } // end of `if (distanceById.size > 0)`
    }
  }

  const baseWhere = {
    status: { in: [PositionStatus.OPEN] },
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { preferredJobRole: { contains: search, mode: "insensitive" as const } },
            { workLocation: { contains: search, mode: "insensitive" as const } },
            { partnerOrganization: { is: { name: { contains: search, mode: "insensitive" as const } } } }
          ]
        }
      : {}),
    ...(jobRoles.length ? { preferredJobRole: { in: jobRoles } } : {}),
    ...(sourceProviders.length ? { sourceProvider: { in: sourceProviders } } : {})
  };

  const cursorWhere = sortMode === "deadline"
    ? deadlineCursor
      ? deadlineCursor.deadline === null
        ? {
            // already in the NULL bucket: paginate by id within nulls
            sourceDeadlineDate: null,
            id: { gt: deadlineCursor.id }
          }
        : {
            // either a later deadline, the same deadline with greater id, or a NULL (NULLs last)
            OR: [
              { sourceDeadlineDate: { gt: deadlineCursor.deadline } },
              {
                AND: [
                  { sourceDeadlineDate: deadlineCursor.deadline },
                  { id: { gt: deadlineCursor.id } }
                ]
              },
              { sourceDeadlineDate: null }
            ]
          }
      : {}
    : latestCursor
      ? {
          OR: [
            { createdAt: { lt: latestCursor.createdAt } },
            {
              AND: [
                { createdAt: latestCursor.createdAt },
                { id: { lt: latestCursor.id } }
              ]
            }
          ]
        }
      : {};

  const items = await prisma.position.findMany({
    where: {
      ...baseWhere,
      ...cursorWhere
    },
    orderBy: sortMode === "deadline"
      ? [{ sourceDeadlineDate: { sort: "asc", nulls: "last" } }, { id: "asc" }]
      : [{ createdAt: sortOrder }, { id: sortOrder }],
    take: limit + 1,
    include: {
      partnerOrganization: {
        select: {
          id: true,
          name: true,
          industry: true,
          companySize: true,
          officeAddress: true,
          description: true,
          strengths: true,
          website: true,
          socialMedia: true,
          companyLogoImageData: true,
          officePhotoImageData: true
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
    ? sortMode === "deadline"
      ? Buffer.from(
          `${tail.sourceDeadlineDate ? tail.sourceDeadlineDate.toISOString() : "NULL"}|${tail.id}`,
          "utf8"
        ).toString("base64")
      : Buffer.from(`${tail.createdAt.toISOString()}|${tail.id}`, "utf8").toString("base64")
    : null;

  const pageTranslations = wantTranslation
    ? await getPositionTranslationsBatch(
        prisma,
        pageItems.filter((i) => i.sourceKind === PositionSourceKind.INTERNAL)
      )
    : new Map<string, PositionTranslatableFields>();

  return sendAndMaybeCache({
    ok: true,
    items: pageItems.map((item) => toPublicPositionItem(item, viewer, pageTranslations.get(item.id) ?? null)),
    nextCursor
  });
});

app.get("/positions/premium-banners", async (req, res) => {
  const viewer = await resolvePublicViewer(req);
  const items = await prisma.position.findMany({
    where: {
      status: { in: [PositionStatus.OPEN] }
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      partnerOrganization: {
        select: {
          id: true,
          name: true,
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
  const parsedDetailQuery = positionDetailQuerySchema.safeParse(req.query);
  const wantTranslation = shouldTranslateForLocale(
    parsedDetailQuery.success ? parsedDetailQuery.data.locale : null
  );

  const viewer = await resolvePublicViewer(req);
  const viewerUserId = resolvePublicViewerUserId(req);
  const viewerUser = viewerUserId
    ? await prisma.user.findUnique({
        where: { id: viewerUserId },
        select: { partnerOrganizationId: true }
      })
    : null;
  const viewerPartnerOrganizationId = viewerUser?.partnerOrganizationId ?? null;

  const where: Prisma.PositionWhereInput =
    viewer?.role === MemberRole.OPERATOR
      ? { id }
      : viewer?.role === MemberRole.PARTNER && viewerPartnerOrganizationId
        ? {
            id,
            OR: [
              { status: { in: [PositionStatus.OPEN] } },
              { partnerOrganizationId: viewerPartnerOrganizationId }
            ]
          }
        : {
            id,
            status: { in: [PositionStatus.OPEN] }
          };

  const item = await prisma.position.findFirst({
    where,
    include: {
      partnerOrganization: {
        select: {
          id: true,
          name: true,
          industry: true,
          companySize: true,
          officeAddress: true,
          description: true,
          strengths: true,
          website: true,
          socialMedia: true,
          companyLogoImageData: true,
          officePhotoImageData: true
        }
      },
      matchingParticipants: {
        select: { id: true }
      }
    }
  });

  if (!item) {
    return res.status(404).json({ ok: false, message: "position not found" });
  }

  const detailTranslation =
    wantTranslation && item.sourceKind === PositionSourceKind.INTERNAL
      ? await getPositionTranslation(prisma, item)
      : null;

  return res.json({
    ok: true,
    item: toPublicPositionItem(item, viewer, detailTranslation)
  });
});

// Anonymous engagement tracking — no auth needed. Both endpoints just
// atomically bump a counter on the position. Dedup is done client-side
// via localStorage (24h) so refreshing or revisiting the same day
// doesn't double-count. Worst case (bot spam, broken client) we get
// inflated numbers, which is fine for an internal ops dashboard.
app.post("/positions/:id/view", async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ ok: false, message: "invalid id" });
  try {
    await prisma.position.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });
    return res.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ ok: false, message: "position not found" });
    }
    return res.status(500).json({ ok: false, message: "failed to record view" });
  }
});

// Outbound click tracker — for external positions (WANTED / BUDDIES).
// Increments externalClickCount and 302 redirects to the
// source URL. Using a redirect (rather than sendBeacon on the client)
// guarantees counts even when ad blockers or page-unload races would
// drop client-side beacons.
app.get("/positions/:id/go", async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ ok: false, message: "invalid id" });

  const position = await prisma.position.findUnique({
    where: { id },
    select: { sourceUrl: true, sourceKind: true, status: true }
  });
  if (!position) return res.status(404).json({ ok: false, message: "position not found" });
  if (!position.sourceUrl) {
    return res.redirect(302, `${platformWebUrl}/positions/${encodeURIComponent(id)}`);
  }

  // Only allow http(s) targets so the redirect can't be used as an open
  // gateway to weird schemes.
  try {
    const parsed = new URL(position.sourceUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return res.status(400).json({ ok: false, message: "invalid source url" });
    }
  } catch {
    return res.status(400).json({ ok: false, message: "invalid source url" });
  }

  // Fire-and-forget the counter bump so a slow write never blocks the
  // user from reaching the external site.
  void prisma.position
    .update({ where: { id }, data: { externalClickCount: { increment: 1 } } })
    .catch((error) => {
      console.error("[positions/go] failed to increment", error);
    });

  return res.redirect(302, position.sourceUrl);
});

app.get("/ops/partners/meta", authenticate, requireRoles([MemberRole.OPERATOR]), (_req, res) => {
  res.json({
    ok: true,
    partnerTypes: Object.values(PartnerType),
    partnerCompanySizes: partnerCompanySizeEnum.options,
    partnerIndustries: Object.values(PartnerIndustry),
    sortableFields: ["name", "createdAt"]
  });
});

app.get("/ops/positions/meta", authenticate, requireRoles([MemberRole.OPERATOR]), async (_req, res) => {
  const partners = await prisma.partnerOrganization.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, industry: true, companySize: true }
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
      name: partner.name
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
            partnerOrganization: { select: { id: true, name: true, industry: true } },
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
        where: { status: { in: [PositionStatus.OPEN] } },
        orderBy: { updatedAt: "desc" },
        include: {
          partnerOrganization: { select: { id: true, name: true, industry: true } },
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
              partnerOrganization: { select: { id: true, name: true, industry: true } },
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
            partnerOrganization: { id: string; name: string; industry: PartnerIndustry } | null;
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
    sourceKind,
    sourceProvider,
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
    ...(sourceKind ? { sourceKind } : {}),
    ...(sourceProvider ? { sourceProvider } : {}),
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
            name: true
          }
        },
        _count: {
          select: { applications: true }
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
    const uploadedThumbnailImages = await uploadImageArrayIfNeeded(parsed.data.thumbnailImages, "positions/thumbnails");
    const created = await prisma.position.create({
      data: {
        partnerOrganizationId: parsed.data.partnerOrganizationId,
        sourceKind: parsed.data.sourceKind ?? PositionSourceKind.INTERNAL,
        sourceProvider: parsed.data.sourceProvider ?? PositionSourceProvider.INTERNAL,
        sourceExternalId: parsed.data.sourceExternalId,
        sourceUrl: parsed.data.sourceUrl,
        sourceFetchedAt: parsed.data.sourceFetchedAt ? new Date(parsed.data.sourceFetchedAt) : undefined,
        title: parsed.data.title,
        status: parsed.data.status ?? PositionStatus.DRAFT,
        workType: parsed.data.workType ?? "On-site",
        employmentType: parsed.data.employmentType ?? PositionEmploymentType.UNPAID_INTERN,
        thumbnailImages: uploadedThumbnailImages.slice(0, 5),
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
            name: true
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

    const creator = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: { id: true, name: true, email: true }
    });
    void sendPositionCreateDiscordNotification({
      positionId: created.id,
      positionTitle: created.title,
      partnerName: created.partnerOrganization?.name ?? null,
      employmentType: created.employmentType,
      workType: created.workType ?? null,
      workLocation: created.workLocation ?? null,
      createdByUserId: req.auth!.userId,
      createdByUserName: creator?.name ?? null,
      createdByUserEmail: creator?.email ?? null,
      createdAt: created.createdAt
    });
    void embedAndSavePosition(prisma, created.id);

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
    const uploadedThumbnailImages =
      parsed.data.thumbnailImages !== undefined
        ? await uploadImageArrayIfNeeded(parsed.data.thumbnailImages, "positions/thumbnails")
        : undefined;
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
        ...(parsed.data.sourceKind !== undefined ? { sourceKind: parsed.data.sourceKind } : {}),
        ...(parsed.data.sourceProvider !== undefined ? { sourceProvider: parsed.data.sourceProvider } : {}),
        ...(parsed.data.sourceExternalId !== undefined ? { sourceExternalId: parsed.data.sourceExternalId } : {}),
        ...(parsed.data.sourceUrl !== undefined ? { sourceUrl: parsed.data.sourceUrl } : {}),
        ...(parsed.data.sourceFetchedAt !== undefined
          ? { sourceFetchedAt: parsed.data.sourceFetchedAt ? new Date(parsed.data.sourceFetchedAt) : null }
          : {}),
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(parsed.data.workType !== undefined ? { workType: parsed.data.workType } : {}),
        ...(parsed.data.employmentType !== undefined ? { employmentType: parsed.data.employmentType } : {}),
        ...(uploadedThumbnailImages !== undefined
          ? { thumbnailImages: uploadedThumbnailImages.slice(0, 5) }
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
            name: true
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
    void embedAndSavePosition(prisma, updated.id);
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
      status: { in: [PositionStatus.OPEN] }
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      partnerOrganization: {
        select: {
          id: true,
          name: true
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
            name: true
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
            name: true
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

  const existingUser = await prisma.user.findUnique({
    where: { email_authProvider: { email: parsed.data.email, authProvider: AuthProvider.EMAIL } },
    select: { id: true }
  });
  if (existingUser) {
    return sendAuthError(res, 409, "EMAIL_ALREADY_EXISTS", "email already exists");
  }

  const deliverability = await checkEmailDeliverable(parsed.data.email);
  if (!deliverability.ok) {
    return sendAuthError(
      res,
      400,
      "EMAIL_DOMAIN_UNDELIVERABLE",
      "email domain cannot receive mail",
      { reason: deliverability.reason }
    );
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

app.post("/partner-signup-requests", async (req, res) => {
  const parsed = createPartnerSignupRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const created = await prisma.partnerSignupRequest.create({
      data: {
        companyName: parsed.data.companyName,
        companyIndustry: parsed.data.companyIndustry,
        companySize: parsed.data.companySize,
        requesterName: parsed.data.requesterName,
        requesterEmail: parsed.data.requesterEmail,
        requesterPhone: parsed.data.requesterPhone?.trim() || null
      }
    });

    return res.status(201).json({
      ok: true,
      item: {
        id: created.id,
        status: created.status,
        createdAt: created.createdAt
      }
    });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to create partner signup request" });
  }
});

app.post("/auth/register", authRateLimit, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendAuthError(res, 400, "INVALID_REQUEST", "invalid request", { errors: parsed.error.flatten() });
  }

  const resolvedRole = parsed.data.role ?? (parsed.data.accountType === "BUSINESS" ? MemberRole.PARTNER : MemberRole.STUDENT);
  const resolvedPartnerType = resolvedRole === MemberRole.PARTNER ? PartnerType.COMPANY : null;
  const resolvedPartnerOrgRole =
    resolvedRole === MemberRole.PARTNER ? (parsed.data.partnerOrgRole ?? PartnerOrgUserRole.MEMBER) : null;
  const passwordHash = await hashPassword(parsed.data.password);
  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email_authProvider: { email: normalizedEmail, authProvider: AuthProvider.EMAIL } },
    select: { id: true, role: true }
  });
  if (existingUser) {
    // If the existing account is registered under a different role than what
    // the visitor is trying to create now (e.g., already a STUDENT but
    // signing up as PARTNER), surface a specific code so the UI can show a
    // tailored "switch roles via support" message instead of the generic
    // duplicate-email error.
    if (existingUser.role !== resolvedRole) {
      return sendAuthError(
        res,
        409,
        "EMAIL_REGISTERED_DIFFERENT_ROLE",
        "email is already registered under a different role",
        { existingRole: existingUser.role }
      );
    }
    return sendAuthError(res, 409, "EMAIL_ALREADY_EXISTS", "email already exists");
  }

  const deliverability = await checkEmailDeliverable(normalizedEmail);
  if (!deliverability.ok) {
    return sendAuthError(
      res,
      400,
      "EMAIL_DOMAIN_UNDELIVERABLE",
      "email domain cannot receive mail",
      { reason: deliverability.reason }
    );
  }

  // Capture client metadata for forensic tracing of bot/spam signup waves.
  // Truncate to reasonable lengths so a malicious UA / Referer can't blow up
  // the row size.
  const rawIp = (req.ip ?? (req.socket.remoteAddress as string | undefined) ?? "").slice(0, 64) || null;
  const rawUa = (req.headers["user-agent"] as string | undefined)?.slice(0, 512) || null;
  const refererHeader = (req.headers.referer ?? req.headers.referrer) as string | string[] | undefined;
  const rawReferer = (Array.isArray(refererHeader) ? refererHeader[0] : refererHeader)?.slice(0, 512) || null;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          emailVerified: false,
          realName: parsed.data.realName?.trim() || null,
          name: parsed.data.name?.trim() || generateNicknameFromEmail(normalizedEmail),
          phoneNumber: parsed.data.phoneNumber,
          jobTitle: parsed.data.jobTitle,
          passwordHash,
          role: resolvedRole,
          partnerType: resolvedPartnerType,
          partnerOrgRole: resolvedPartnerOrgRole,
          partnerOrganizationName:
            resolvedRole === MemberRole.PARTNER
              ? parsed.data.partnerOrganizationName?.trim() || null
              : null,
          signupIp: rawIp,
          signupUserAgent: rawUa,
          signupReferer: rawReferer
        }
      });

      return user;
    });

    await sendSignupDiscordNotification({
      id: created.id,
      email: created.email,
      name: created.name,
      realName: created.realName,
      role: created.role,
      partnerType: created.partnerType,
      createdAt: created.createdAt
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
        return sendAuthError(res, 404, "USER_NOT_FOUND", "user not found");
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

app.post("/auth/login", authRateLimit, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendAuthError(res, 400, "INVALID_REQUEST", "invalid request", { errors: parsed.error.flatten() });
  }

  const user = await prisma.user.findUnique({
    where: { email_authProvider: { email: parsed.data.email, authProvider: AuthProvider.EMAIL } }
  });
  if (!user || !user.passwordHash) {
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
  if (!user.isActive) {
    return sendAuthError(res, 403, "ACCOUNT_SUSPENDED", "account is suspended", {
      reason: user.suspendedReason ?? null
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

// ---------- Naver OAuth ----------

app.get("/auth/naver/start", (req, res) => {
  if (!naverOAuthClientId || !naverOAuthClientSecret) {
    return res.redirect(buildOAuthErrorUrl("NAVER_NOT_CONFIGURED", "Naver OAuth client is not configured"));
  }
  const nonce = randomBytes(16).toString("hex");
  const next = typeof req.query.next === "string" ? req.query.next : "/";
  const state = signOAuthState({ nonce, next, ts: Date.now() });
  setOAuthStateCookie(res, state);

  const authorizeUrl = new URL("https://nid.naver.com/oauth2.0/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", naverOAuthClientId);
  authorizeUrl.searchParams.set("redirect_uri", naverOAuthRedirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("auth_type", "reauthenticate");
  return res.redirect(authorizeUrl.toString());
});

app.post("/auth/naver/reauth/start", authenticate, async (req, res) => {
  if (!naverOAuthClientId || !naverOAuthClientSecret) {
    return res.status(503).json({ ok: false, code: "NAVER_NOT_CONFIGURED", message: "Naver OAuth client is not configured" });
  }
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) return res.status(404).json({ ok: false, code: "USER_NOT_FOUND", message: "user not found" });
  if (user.authProvider !== AuthProvider.NAVER) {
    return res.status(400).json({ ok: false, code: "WRONG_AUTH_PROVIDER", message: "this account is not registered with Naver" });
  }
  const nonce = randomBytes(16).toString("hex");
  const state = signOAuthState({ nonce, purpose: "reauth", reauthUserId: user.id, ts: Date.now() });
  setOAuthStateCookie(res, state);

  const authorizeUrl = new URL("https://nid.naver.com/oauth2.0/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", naverOAuthClientId);
  authorizeUrl.searchParams.set("redirect_uri", naverOAuthRedirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("auth_type", "reauthenticate");
  return res.json({ ok: true, authorizeUrl: authorizeUrl.toString() });
});

app.get("/auth/naver/callback", async (req, res) => {
  const cookieState = parseCookies(req.headers.cookie)[oauthStateCookieName];
  clearOAuthStateCookie(res);

  const queryState = typeof req.query.state === "string" ? req.query.state : "";
  const code = typeof req.query.code === "string" ? req.query.code : "";

  if (typeof req.query.error === "string") {
    return res.redirect(buildOAuthErrorUrl("NAVER_AUTH_DENIED", req.query.error));
  }
  if (!cookieState || !queryState || cookieState !== queryState) {
    return res.redirect(buildOAuthErrorUrl("OAUTH_STATE_MISMATCH"));
  }
  const stateData = verifyOAuthState(queryState);
  if (!stateData) {
    return res.redirect(buildOAuthErrorUrl("OAUTH_STATE_INVALID"));
  }
  if (!code) {
    return res.redirect(buildOAuthErrorUrl("OAUTH_CODE_MISSING"));
  }

  try {
    // Exchange code for access token
    const tokenUrl = new URL("https://nid.naver.com/oauth2.0/token");
    tokenUrl.searchParams.set("grant_type", "authorization_code");
    tokenUrl.searchParams.set("client_id", naverOAuthClientId);
    tokenUrl.searchParams.set("client_secret", naverOAuthClientSecret);
    tokenUrl.searchParams.set("code", code);
    tokenUrl.searchParams.set("state", queryState);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenJson = (await tokenResponse.json()) as { access_token?: string; error?: string; error_description?: string };
    if (!tokenResponse.ok || !tokenJson.access_token) {
      console.error("[naver-oauth] token exchange failed", tokenJson);
      return res.redirect(buildOAuthErrorUrl("NAVER_TOKEN_EXCHANGE_FAILED", tokenJson.error_description ?? tokenJson.error));
    }

    // Fetch profile
    const profileResponse = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` }
    });
    const profileJson = (await profileResponse.json()) as {
      resultcode?: string;
      message?: string;
      response?: { id?: string; email?: string; name?: string; mobile?: string; profile_image?: string; birthday?: string; gender?: string };
    };
    if (!profileResponse.ok || profileJson.resultcode !== "00" || !profileJson.response?.id) {
      console.error("[naver-oauth] profile fetch failed", profileJson);
      return res.redirect(buildOAuthErrorUrl("NAVER_PROFILE_FAILED", profileJson.message));
    }

    const naverProfile = profileJson.response;
    const providerId = naverProfile.id!;
    const naverEmail = (naverProfile.email ?? "").trim().toLowerCase();
    const naverName = naverProfile.name?.trim() || null;
    const naverMobile = naverProfile.mobile?.trim() || null;

    // Find existing NAVER user by providerId
    const existingUser = await prisma.user.findUnique({
      where: { authProvider_providerId: { authProvider: AuthProvider.NAVER, providerId } }
    });

    if (stateData.purpose === "reauth") {
      const reauthUserId = typeof stateData.reauthUserId === "string" ? stateData.reauthUserId : "";
      if (!existingUser || existingUser.id !== reauthUserId) {
        return res.redirect(`${platformWebUrl}/account/delete?reauth_error=mismatch`);
      }
      const reauthToken = signReauthToken(existingUser.id, "delete_account");
      const fragment = new URLSearchParams({ reauth_token: reauthToken }).toString();
      return res.redirect(`${platformWebUrl}/account/delete#${fragment}`);
    }

    if (existingUser) {
      const { accessToken, refreshToken } = await issueAuthTokens(existingUser);
      setRefreshTokenCookie(res, refreshToken);

      const nextRaw = typeof stateData.next === "string" ? stateData.next : "/";
      const next = nextRaw.startsWith("/") ? nextRaw : "/";
      const returnUrl = buildOAuthReturnUrl("naver", { accessToken, next });
      return res.redirect(returnUrl);
    }

    // First-time sign in via Naver: defer user creation until account-type is chosen
    const signupContext = signOAuthState({
      type: "naver-signup",
      providerId,
      email: naverEmail,
      name: naverName,
      mobile: naverMobile,
      ts: Date.now()
    });
    const nextForSignup = typeof stateData.next === "string" && stateData.next.startsWith("/") ? stateData.next : "";
    const fragmentParams: Record<string, string> = { ctx: signupContext, provider: "naver" };
    if (nextForSignup) fragmentParams.next = nextForSignup;
    const ctxFragment = new URLSearchParams(fragmentParams).toString();
    return res.redirect(`${platformWebUrl}/signup/social-account-type#${ctxFragment}`);
  } catch (error) {
    console.error("[naver-oauth] callback failed", error);
    return res.redirect(buildOAuthErrorUrl("NAVER_CALLBACK_ERROR"));
  }
});

const naverFinalizeSchema = z.object({
  ctx: z.string().min(10).max(4000),
  accountType: z.enum(["GENERAL", "BUSINESS"])
});

app.post("/auth/naver/finalize", async (req, res) => {
  const parsed = naverFinalizeSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendAuthError(res, 400, "INVALID_REQUEST", "invalid request", { errors: parsed.error.flatten() });
  }

  const ctx = verifyOAuthState(parsed.data.ctx);
  if (!ctx || ctx.type !== "naver-signup") {
    return sendAuthError(res, 400, "INVALID_SIGNUP_CONTEXT", "invalid signup context");
  }
  const ts = typeof ctx.ts === "number" ? ctx.ts : 0;
  if (Date.now() - ts > 10 * 60 * 1000) {
    return sendAuthError(res, 400, "EXPIRED_SIGNUP_CONTEXT", "signup context expired");
  }

  const providerId = typeof ctx.providerId === "string" ? ctx.providerId : "";
  const ctxEmail = typeof ctx.email === "string" ? ctx.email.trim().toLowerCase() : "";
  const ctxName = typeof ctx.name === "string" ? ctx.name : null;
  const ctxMobile = typeof ctx.mobile === "string" ? ctx.mobile : null;
  if (!providerId) {
    return sendAuthError(res, 400, "INVALID_SIGNUP_CONTEXT", "missing providerId");
  }

  // Double-check: no existing NAVER user with this providerId (race protection)
  const alreadyExists = await prisma.user.findUnique({
    where: { authProvider_providerId: { authProvider: AuthProvider.NAVER, providerId } }
  });
  if (alreadyExists) {
    const { accessToken, refreshToken } = await issueAuthTokens(alreadyExists);
    setRefreshTokenCookie(res, refreshToken);
    return res.json({
      ok: true,
      token: accessToken,
      accessToken,
      user: toSafeUser(alreadyExists)
    });
  }

  const role = parsed.data.accountType === "BUSINESS" ? MemberRole.PARTNER : MemberRole.STUDENT;
  const partnerType = role === MemberRole.PARTNER ? PartnerType.COMPANY : null;
  const partnerOrgRole = role === MemberRole.PARTNER ? PartnerOrgUserRole.MEMBER : null;

  const created = await prisma.user.create({
    data: {
      email: ctxEmail || `naver-${providerId}@noemail.local`,
      emailVerified: true,
      name: ctxName?.trim() || generateNicknameFromEmail(ctxEmail),
      phoneNumber: ctxMobile,
      authProvider: AuthProvider.NAVER,
      providerId,
      passwordHash: null,
      role,
      partnerType,
      partnerOrgRole
    }
  });

  await sendSignupDiscordNotification({
    id: created.id,
    email: created.email,
    name: created.name,
    realName: created.realName,
    role: created.role,
    partnerType: created.partnerType,
    createdAt: created.createdAt
  }).catch((err) => console.error("[naver-oauth] discord signup notify failed", err));

  const { accessToken, refreshToken } = await issueAuthTokens(created);
  setRefreshTokenCookie(res, refreshToken);

  return res.json({
    ok: true,
    token: accessToken,
    accessToken,
    user: toSafeUser(created)
  });
});

// ---------- Google OAuth ----------

app.get("/auth/google/start", (req, res) => {
  if (!googleOAuthClientId || !googleOAuthClientSecret) {
    return res.redirect(buildOAuthErrorUrl("GOOGLE_NOT_CONFIGURED", "Google OAuth client is not configured"));
  }
  const nonce = randomBytes(16).toString("hex");
  const next = typeof req.query.next === "string" ? req.query.next : "/";
  const state = signOAuthState({ nonce, next, ts: Date.now() });
  setOAuthStateCookie(res, state);

  const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", googleOAuthClientId);
  authorizeUrl.searchParams.set("redirect_uri", googleOAuthRedirectUri);
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("access_type", "online");
  authorizeUrl.searchParams.set("prompt", "select_account");
  authorizeUrl.searchParams.set("state", state);
  return res.redirect(authorizeUrl.toString());
});

app.post("/auth/google/reauth/start", authenticate, async (req, res) => {
  if (!googleOAuthClientId || !googleOAuthClientSecret) {
    return res.status(503).json({ ok: false, code: "GOOGLE_NOT_CONFIGURED", message: "Google OAuth client is not configured" });
  }
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) return res.status(404).json({ ok: false, code: "USER_NOT_FOUND", message: "user not found" });
  if (user.authProvider !== AuthProvider.GOOGLE) {
    return res.status(400).json({ ok: false, code: "WRONG_AUTH_PROVIDER", message: "this account is not registered with Google" });
  }
  const nonce = randomBytes(16).toString("hex");
  const state = signOAuthState({ nonce, purpose: "reauth", reauthUserId: user.id, ts: Date.now() });
  setOAuthStateCookie(res, state);

  const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", googleOAuthClientId);
  authorizeUrl.searchParams.set("redirect_uri", googleOAuthRedirectUri);
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("access_type", "online");
  authorizeUrl.searchParams.set("prompt", "login");
  authorizeUrl.searchParams.set("state", state);
  return res.json({ ok: true, authorizeUrl: authorizeUrl.toString() });
});

app.get("/auth/google/callback", async (req, res) => {
  const cookieState = parseCookies(req.headers.cookie)[oauthStateCookieName];
  clearOAuthStateCookie(res);

  const queryState = typeof req.query.state === "string" ? req.query.state : "";
  const code = typeof req.query.code === "string" ? req.query.code : "";

  if (typeof req.query.error === "string") {
    return res.redirect(buildOAuthErrorUrl("GOOGLE_AUTH_DENIED", req.query.error));
  }
  if (!cookieState || !queryState || cookieState !== queryState) {
    return res.redirect(buildOAuthErrorUrl("OAUTH_STATE_MISMATCH"));
  }
  const stateData = verifyOAuthState(queryState);
  if (!stateData) {
    return res.redirect(buildOAuthErrorUrl("OAUTH_STATE_INVALID"));
  }
  if (!code) {
    return res.redirect(buildOAuthErrorUrl("OAUTH_CODE_MISSING"));
  }

  try {
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: googleOAuthClientId,
      client_secret: googleOAuthClientSecret,
      code,
      redirect_uri: googleOAuthRedirectUri
    });
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString()
    });
    const tokenJson = (await tokenResponse.json()) as { access_token?: string; error?: string; error_description?: string };
    if (!tokenResponse.ok || !tokenJson.access_token) {
      console.error("[google-oauth] token exchange failed", tokenJson);
      return res.redirect(buildOAuthErrorUrl("GOOGLE_TOKEN_EXCHANGE_FAILED", tokenJson.error_description ?? tokenJson.error));
    }

    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` }
    });
    const profileJson = (await profileResponse.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
      error?: string;
      error_description?: string;
    };
    if (!profileResponse.ok || !profileJson.sub) {
      console.error("[google-oauth] profile fetch failed", profileJson);
      return res.redirect(buildOAuthErrorUrl("GOOGLE_PROFILE_FAILED", profileJson.error_description ?? profileJson.error));
    }

    const providerId = profileJson.sub;
    const googleEmail = (profileJson.email ?? "").trim().toLowerCase();
    const googleEmailVerified = Boolean(profileJson.email_verified);
    const googleName = profileJson.name?.trim() || profileJson.given_name?.trim() || null;

    // Find existing GOOGLE user by providerId
    const existingUser = await prisma.user.findUnique({
      where: { authProvider_providerId: { authProvider: AuthProvider.GOOGLE, providerId } }
    });

    if (stateData.purpose === "reauth") {
      const reauthUserId = typeof stateData.reauthUserId === "string" ? stateData.reauthUserId : "";
      if (!existingUser || existingUser.id !== reauthUserId) {
        return res.redirect(`${platformWebUrl}/account/delete?reauth_error=mismatch`);
      }
      const reauthToken = signReauthToken(existingUser.id, "delete_account");
      const fragment = new URLSearchParams({ reauth_token: reauthToken }).toString();
      return res.redirect(`${platformWebUrl}/account/delete#${fragment}`);
    }

    if (existingUser) {
      const { accessToken, refreshToken } = await issueAuthTokens(existingUser);
      setRefreshTokenCookie(res, refreshToken);

      const nextRaw = typeof stateData.next === "string" ? stateData.next : "/";
      const next = nextRaw.startsWith("/") ? nextRaw : "/";
      const returnUrl = buildOAuthReturnUrl("google", { accessToken, next });
      return res.redirect(returnUrl);
    }

    // First-time sign in via Google: defer user creation until account-type is chosen
    const signupContext = signOAuthState({
      type: "google-signup",
      providerId,
      email: googleEmail,
      emailVerified: googleEmailVerified,
      name: googleName,
      ts: Date.now()
    });
    const nextForSignup = typeof stateData.next === "string" && stateData.next.startsWith("/") ? stateData.next : "";
    const fragmentParams: Record<string, string> = { ctx: signupContext, provider: "google" };
    if (nextForSignup) fragmentParams.next = nextForSignup;
    const ctxFragment = new URLSearchParams(fragmentParams).toString();
    return res.redirect(`${platformWebUrl}/signup/social-account-type#${ctxFragment}`);
  } catch (error) {
    console.error("[google-oauth] callback failed", error);
    return res.redirect(buildOAuthErrorUrl("GOOGLE_CALLBACK_ERROR"));
  }
});

const googleFinalizeSchema = z.object({
  ctx: z.string().min(10).max(4000),
  accountType: z.enum(["GENERAL", "BUSINESS"])
});

app.post("/auth/google/finalize", async (req, res) => {
  const parsed = googleFinalizeSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendAuthError(res, 400, "INVALID_REQUEST", "invalid request", { errors: parsed.error.flatten() });
  }

  const ctx = verifyOAuthState(parsed.data.ctx);
  if (!ctx || ctx.type !== "google-signup") {
    return sendAuthError(res, 400, "INVALID_SIGNUP_CONTEXT", "invalid signup context");
  }
  const ts = typeof ctx.ts === "number" ? ctx.ts : 0;
  if (Date.now() - ts > 10 * 60 * 1000) {
    return sendAuthError(res, 400, "EXPIRED_SIGNUP_CONTEXT", "signup context expired");
  }

  const providerId = typeof ctx.providerId === "string" ? ctx.providerId : "";
  const ctxEmail = typeof ctx.email === "string" ? ctx.email.trim().toLowerCase() : "";
  const ctxEmailVerified = Boolean(ctx.emailVerified);
  const ctxName = typeof ctx.name === "string" ? ctx.name : null;
  if (!providerId) {
    return sendAuthError(res, 400, "INVALID_SIGNUP_CONTEXT", "missing providerId");
  }

  const alreadyExists = await prisma.user.findUnique({
    where: { authProvider_providerId: { authProvider: AuthProvider.GOOGLE, providerId } }
  });
  if (alreadyExists) {
    const { accessToken, refreshToken } = await issueAuthTokens(alreadyExists);
    setRefreshTokenCookie(res, refreshToken);
    return res.json({
      ok: true,
      token: accessToken,
      accessToken,
      user: toSafeUser(alreadyExists)
    });
  }

  const role = parsed.data.accountType === "BUSINESS" ? MemberRole.PARTNER : MemberRole.STUDENT;
  const partnerType = role === MemberRole.PARTNER ? PartnerType.COMPANY : null;
  const partnerOrgRole = role === MemberRole.PARTNER ? PartnerOrgUserRole.MEMBER : null;

  const created = await prisma.user.create({
    data: {
      email: ctxEmail || `google-${providerId}@noemail.local`,
      emailVerified: true,
      name: ctxName?.trim() || generateNicknameFromEmail(ctxEmail),
      authProvider: AuthProvider.GOOGLE,
      providerId,
      passwordHash: null,
      role,
      partnerType,
      partnerOrgRole
    }
  });

  await sendSignupDiscordNotification({
    id: created.id,
    email: created.email,
    name: created.name,
    realName: created.realName,
    role: created.role,
    partnerType: created.partnerType,
    createdAt: created.createdAt
  }).catch((err) => console.error("[google-oauth] discord signup notify failed", err));

  const { accessToken, refreshToken } = await issueAuthTokens(created);
  setRefreshTokenCookie(res, refreshToken);

  return res.json({
    ok: true,
    token: accessToken,
    accessToken,
    user: toSafeUser(created)
  });
});

// ---------- Kakao OAuth ----------

app.get("/auth/kakao/start", (req, res) => {
  if (!kakaoOAuthClientId) {
    return res.redirect(buildOAuthErrorUrl("KAKAO_NOT_CONFIGURED", "Kakao OAuth client is not configured"));
  }
  const nonce = randomBytes(16).toString("hex");
  const next = typeof req.query.next === "string" ? req.query.next : "/";
  const state = signOAuthState({ nonce, next, ts: Date.now() });
  setOAuthStateCookie(res, state);

  const authorizeUrl = new URL("https://kauth.kakao.com/oauth/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", kakaoOAuthClientId);
  authorizeUrl.searchParams.set("redirect_uri", kakaoOAuthRedirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("prompt", "login");
  return res.redirect(authorizeUrl.toString());
});

app.post("/auth/kakao/reauth/start", authenticate, async (req, res) => {
  if (!kakaoOAuthClientId) {
    return res.status(503).json({ ok: false, code: "KAKAO_NOT_CONFIGURED", message: "Kakao OAuth client is not configured" });
  }
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) return res.status(404).json({ ok: false, code: "USER_NOT_FOUND", message: "user not found" });
  if (user.authProvider !== AuthProvider.KAKAO) {
    return res.status(400).json({ ok: false, code: "WRONG_AUTH_PROVIDER", message: "this account is not registered with Kakao" });
  }
  const nonce = randomBytes(16).toString("hex");
  const state = signOAuthState({ nonce, purpose: "reauth", reauthUserId: user.id, ts: Date.now() });
  setOAuthStateCookie(res, state);

  const authorizeUrl = new URL("https://kauth.kakao.com/oauth/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", kakaoOAuthClientId);
  authorizeUrl.searchParams.set("redirect_uri", kakaoOAuthRedirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("prompt", "login");
  return res.json({ ok: true, authorizeUrl: authorizeUrl.toString() });
});

app.get("/auth/kakao/callback", async (req, res) => {
  const cookieState = parseCookies(req.headers.cookie)[oauthStateCookieName];
  clearOAuthStateCookie(res);

  const queryState = typeof req.query.state === "string" ? req.query.state : "";
  const code = typeof req.query.code === "string" ? req.query.code : "";

  if (typeof req.query.error === "string") {
    return res.redirect(buildOAuthErrorUrl("KAKAO_AUTH_DENIED", req.query.error));
  }
  if (!cookieState || !queryState || cookieState !== queryState) {
    return res.redirect(buildOAuthErrorUrl("OAUTH_STATE_MISMATCH"));
  }
  const stateData = verifyOAuthState(queryState);
  if (!stateData) {
    return res.redirect(buildOAuthErrorUrl("OAUTH_STATE_INVALID"));
  }
  if (!code) {
    return res.redirect(buildOAuthErrorUrl("OAUTH_CODE_MISSING"));
  }

  try {
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: kakaoOAuthClientId,
      redirect_uri: kakaoOAuthRedirectUri,
      code
    });
    if (kakaoOAuthClientSecret) {
      tokenBody.set("client_secret", kakaoOAuthClientSecret);
    }
    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: tokenBody.toString()
    });
    const tokenJson = (await tokenResponse.json()) as { access_token?: string; error?: string; error_description?: string };
    if (!tokenResponse.ok || !tokenJson.access_token) {
      console.error("[kakao-oauth] token exchange failed", tokenJson);
      return res.redirect(buildOAuthErrorUrl("KAKAO_TOKEN_EXCHANGE_FAILED", tokenJson.error_description ?? tokenJson.error));
    }

    const profileResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` }
    });
    const profileJson = (await profileResponse.json()) as {
      id?: number | string;
      kakao_account?: {
        email?: string;
        is_email_verified?: boolean;
        email_needs_agreement?: boolean;
        profile?: { nickname?: string; profile_image_url?: string };
      };
      properties?: { nickname?: string; profile_image?: string };
      msg?: string;
      code?: number;
    };
    if (!profileResponse.ok || !profileJson.id) {
      console.error("[kakao-oauth] profile fetch failed", profileJson);
      return res.redirect(buildOAuthErrorUrl("KAKAO_PROFILE_FAILED", profileJson.msg));
    }

    const providerId = String(profileJson.id);
    const account = profileJson.kakao_account ?? {};
    const kakaoEmail = (account.email ?? "").trim().toLowerCase();
    const kakaoEmailVerified = Boolean(account.is_email_verified);
    const kakaoName = account.profile?.nickname?.trim() || profileJson.properties?.nickname?.trim() || null;

    const existingUser = await prisma.user.findUnique({
      where: { authProvider_providerId: { authProvider: AuthProvider.KAKAO, providerId } }
    });

    if (stateData.purpose === "reauth") {
      const reauthUserId = typeof stateData.reauthUserId === "string" ? stateData.reauthUserId : "";
      if (!existingUser || existingUser.id !== reauthUserId) {
        return res.redirect(`${platformWebUrl}/account/delete?reauth_error=mismatch`);
      }
      const reauthToken = signReauthToken(existingUser.id, "delete_account");
      const fragment = new URLSearchParams({ reauth_token: reauthToken }).toString();
      return res.redirect(`${platformWebUrl}/account/delete#${fragment}`);
    }

    if (existingUser) {
      const { accessToken, refreshToken } = await issueAuthTokens(existingUser);
      setRefreshTokenCookie(res, refreshToken);

      const nextRaw = typeof stateData.next === "string" ? stateData.next : "/";
      const next = nextRaw.startsWith("/") ? nextRaw : "/";
      const returnUrl = buildOAuthReturnUrl("kakao", { accessToken, next });
      return res.redirect(returnUrl);
    }

    // First-time sign in via Kakao: defer user creation until account-type is chosen
    const signupContext = signOAuthState({
      type: "kakao-signup",
      providerId,
      email: kakaoEmail,
      emailVerified: kakaoEmailVerified,
      name: kakaoName,
      ts: Date.now()
    });
    const nextForSignup = typeof stateData.next === "string" && stateData.next.startsWith("/") ? stateData.next : "";
    const fragmentParams: Record<string, string> = { ctx: signupContext, provider: "kakao" };
    if (nextForSignup) fragmentParams.next = nextForSignup;
    const ctxFragment = new URLSearchParams(fragmentParams).toString();
    return res.redirect(`${platformWebUrl}/signup/social-account-type#${ctxFragment}`);
  } catch (error) {
    console.error("[kakao-oauth] callback failed", error);
    return res.redirect(buildOAuthErrorUrl("KAKAO_CALLBACK_ERROR"));
  }
});

const kakaoFinalizeSchema = z.object({
  ctx: z.string().min(10).max(4000),
  accountType: z.enum(["GENERAL", "BUSINESS"])
});

app.post("/auth/kakao/finalize", async (req, res) => {
  const parsed = kakaoFinalizeSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendAuthError(res, 400, "INVALID_REQUEST", "invalid request", { errors: parsed.error.flatten() });
  }

  const ctx = verifyOAuthState(parsed.data.ctx);
  if (!ctx || ctx.type !== "kakao-signup") {
    return sendAuthError(res, 400, "INVALID_SIGNUP_CONTEXT", "invalid signup context");
  }
  const ts = typeof ctx.ts === "number" ? ctx.ts : 0;
  if (Date.now() - ts > 10 * 60 * 1000) {
    return sendAuthError(res, 400, "EXPIRED_SIGNUP_CONTEXT", "signup context expired");
  }

  const providerId = typeof ctx.providerId === "string" ? ctx.providerId : "";
  const ctxEmail = typeof ctx.email === "string" ? ctx.email.trim().toLowerCase() : "";
  const ctxEmailVerified = Boolean(ctx.emailVerified);
  const ctxName = typeof ctx.name === "string" ? ctx.name : null;
  if (!providerId) {
    return sendAuthError(res, 400, "INVALID_SIGNUP_CONTEXT", "missing providerId");
  }

  const alreadyExists = await prisma.user.findUnique({
    where: { authProvider_providerId: { authProvider: AuthProvider.KAKAO, providerId } }
  });
  if (alreadyExists) {
    const { accessToken, refreshToken } = await issueAuthTokens(alreadyExists);
    setRefreshTokenCookie(res, refreshToken);
    return res.json({
      ok: true,
      token: accessToken,
      accessToken,
      user: toSafeUser(alreadyExists)
    });
  }

  const role = parsed.data.accountType === "BUSINESS" ? MemberRole.PARTNER : MemberRole.STUDENT;
  const partnerType = role === MemberRole.PARTNER ? PartnerType.COMPANY : null;
  const partnerOrgRole = role === MemberRole.PARTNER ? PartnerOrgUserRole.MEMBER : null;

  const created = await prisma.user.create({
    data: {
      email: ctxEmail || `kakao-${providerId}@noemail.local`,
      emailVerified: true,
      name: ctxName?.trim() || generateNicknameFromEmail(ctxEmail),
      authProvider: AuthProvider.KAKAO,
      providerId,
      passwordHash: null,
      role,
      partnerType,
      partnerOrgRole
    }
  });

  await sendSignupDiscordNotification({
    id: created.id,
    email: created.email,
    name: created.name,
    realName: created.realName,
    role: created.role,
    partnerType: created.partnerType,
    createdAt: created.createdAt
  }).catch((err) => console.error("[kakao-oauth] discord signup notify failed", err));

  const { accessToken, refreshToken } = await issueAuthTokens(created);
  setRefreshTokenCookie(res, refreshToken);

  return res.json({
    ok: true,
    token: accessToken,
    accessToken,
    user: toSafeUser(created)
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
    where: { email_authProvider: { email: parsed.data.email, authProvider: AuthProvider.EMAIL } }
  });

  if (!user) {
    return res.json({ ok: true, sent: false });
  }
  if (user.emailVerified) {
    return res.json({ ok: true, sent: false, alreadyVerified: true });
  }

  try {
    const { token } = await createEmailVerificationToken(user.id);
    const locale = resolveEmailLocale(req, parsed.data.locale);
    const delivery = await sendVerificationEmail(user.email, token, locale);

    return res.json({
      ok: true,
      sent: true,
      verificationDelivery: delivery.delivery,
      ...(isProduction ? {} : { verifyUrl: delivery.verifyUrl })
    });
  } catch (error) {
    console.error("[auth/resend-verification] failed", {
      email: parsed.data.email,
      error: getErrorMessage(error)
    });
    return res.status(500).json({
      ok: false,
      message: "failed to resend verification email",
      ...(isProduction ? {} : { detail: getErrorMessage(error) })
    });
  }
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
  if (user.authProvider === AuthProvider.EMAIL && !user.emailVerified) {
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

const reauthPasswordSchema = z.object({
  password: z.string().min(1).max(72),
  purpose: z.enum(["delete_account"])
});

app.post("/auth/reauth/password", authenticate, async (req, res) => {
  const parsed = reauthPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, code: "INVALID_REQUEST", message: "invalid request" });
  }
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) {
    return res.status(404).json({ ok: false, code: "USER_NOT_FOUND", message: "user not found" });
  }
  if (user.authProvider !== AuthProvider.EMAIL || !user.passwordHash) {
    return res.status(400).json({ ok: false, code: "WRONG_AUTH_PROVIDER", message: "password reauth not available for this account" });
  }
  const matched = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!matched) {
    return res.status(401).json({ ok: false, code: "INVALID_CREDENTIALS", message: "invalid credentials" });
  }
  const reauthToken = signReauthToken(user.id, parsed.data.purpose);
  return res.json({ ok: true, reauthToken, expiresInMs: REAUTH_TOKEN_TTL_MS });
});

app.patch("/members/me", authenticate, requireRoles([MemberRole.STUDENT, MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  const id = req.auth!.userId;
  const parsed = updateMyBasicInfoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  let profileImageUrlUpdate: { profileImageUrl: string | null } | undefined;
  if (parsed.data.profileImageData !== undefined) {
    if (parsed.data.profileImageData === null || parsed.data.profileImageData.trim() === "") {
      profileImageUrlUpdate = { profileImageUrl: null };
    } else {
      try {
        const uploadedUrl = await uploadDataUrlImageIfNeeded(parsed.data.profileImageData.trim(), `members/${id}/profile`);
        if (/^https?:\/\//i.test(uploadedUrl)) {
          profileImageUrlUpdate = { profileImageUrl: uploadedUrl };
        } else if (/^data:image\//i.test(uploadedUrl)) {
          // Local dev fallback — Azure Blob isn't configured, so persist the
          // data URL directly. Production with AZURE_STORAGE_CONNECTION_STRING
          // set returns an https URL above and never falls through here.
          profileImageUrlUpdate = { profileImageUrl: uploadedUrl };
        } else {
          return res.status(503).json({ ok: false, message: "image storage is not configured" });
        }
      } catch (error) {
        console.error("[members/me] profile image upload failed", error);
        return res.status(500).json({ ok: false, message: "failed to upload profile image" });
      }
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(parsed.data.realName !== undefined ? { realName: parsed.data.realName?.trim() || null } : {}),
        ...(parsed.data.name !== undefined ? { name: parsed.data.name?.trim() || null } : {}),
        ...(parsed.data.phoneNumber !== undefined ? { phoneNumber: parsed.data.phoneNumber?.trim() || null } : {}),
        ...(parsed.data.birthDate !== undefined ? { birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null } : {}),
        ...(parsed.data.gender !== undefined ? { gender: parsed.data.gender?.trim() || null } : {}),
        ...(profileImageUrlUpdate ?? {})
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
    select: { partnerOrganizationId: true }
  });

  if (!user) {
    return res.status(404).json({ ok: false, message: "user not found" });
  }

  if (!user.partnerOrganizationId) {
    return res.json({ ok: true, item: null });
  }

  const item = await prisma.partnerOrganization.findUnique({
    where: { id: user.partnerOrganizationId }
  });

  if (!item) {
    return res.json({ ok: true, item: null });
  }

  const memberCount = await prisma.user.count({
    where: {
      role: MemberRole.PARTNER,
      partnerOrganizationId: item.id
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
    select: { email: true, partnerOrganizationId: true }
  });

  if (!user) {
    return res.status(404).json({ ok: false, message: "user not found" });
  }

  const currentOrganization = user.partnerOrganizationId
    ? await prisma.partnerOrganization.findUnique({
        where: { id: user.partnerOrganizationId },
        select: {
          id: true,
          businessRegistrationDocumentData: true,
          fourInsuranceSubscriberListData: true
        }
      })
    : null;

  const normalizeDocField = (value?: string | null) => (value?.trim() || null);
  const normalizeWebsite = (value?: string | null) => {
    const trimmed = value?.trim();
    if (!trimmed) return null;
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };
  const nextBusinessRegistrationDocumentData =
    parsed.data.businessRegistrationDocumentData !== undefined
      ? normalizeDocField(parsed.data.businessRegistrationDocumentData)
      : normalizeDocField(currentOrganization?.businessRegistrationDocumentData);
  const nextFourInsuranceSubscriberListData =
    parsed.data.fourInsuranceSubscriberListData !== undefined
      ? normalizeDocField(parsed.data.fourInsuranceSubscriberListData)
      : normalizeDocField(currentOrganization?.fourInsuranceSubscriberListData);

  const shouldResetVerificationApproval =
    currentOrganization
      ? (nextBusinessRegistrationDocumentData !== normalizeDocField(currentOrganization.businessRegistrationDocumentData)
        || nextFourInsuranceSubscriberListData !== normalizeDocField(currentOrganization.fourInsuranceSubscriberListData))
      : false;

  if (!currentOrganization && (!parsed.data.name?.trim() || !parsed.data.industry)) {
    return res.status(400).json({ ok: false, message: "name and industry are required to create partner organization" });
  }

  try {
    const companyLogoImageData =
      parsed.data.companyLogoImageData !== undefined
        ? (parsed.data.companyLogoImageData?.trim()
          ? await uploadDataUrlImageIfNeeded(parsed.data.companyLogoImageData.trim(), "partner/company-logo")
          : null)
        : undefined;
    const officePhotoImageData =
      parsed.data.officePhotoImageData !== undefined
        ? (parsed.data.officePhotoImageData?.trim()
          ? await uploadDataUrlImageIfNeeded(parsed.data.officePhotoImageData.trim(), "partner/office-photo")
          : null)
        : undefined;

    const updated = currentOrganization
      ? await prisma.partnerOrganization.update({
          where: { id: user.partnerOrganizationId! },
          data: {
            ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
            ...(parsed.data.industry !== undefined ? { industry: parsed.data.industry } : {}),
            ...(parsed.data.companySize !== undefined ? { companySize: parsed.data.companySize ?? null } : {}),
            ...(parsed.data.website !== undefined ? { website: normalizeWebsite(parsed.data.website) } : {}),
            ...(parsed.data.socialMedia !== undefined ? { socialMedia: parsed.data.socialMedia?.trim() || null } : {}),
            ...(parsed.data.officeAddress !== undefined ? { officeAddress: parsed.data.officeAddress?.trim() || null } : {}),
            ...(parsed.data.description !== undefined ? { description: parsed.data.description?.trim() || null } : {}),
            ...(parsed.data.strengths !== undefined ? { strengths: parsed.data.strengths?.trim() || null } : {}),
            ...(parsed.data.businessRegistrationDocumentData !== undefined
              ? { businessRegistrationDocumentData: parsed.data.businessRegistrationDocumentData?.trim() || null }
              : {}),
            ...(parsed.data.fourInsuranceSubscriberListData !== undefined
              ? { fourInsuranceSubscriberListData: parsed.data.fourInsuranceSubscriberListData?.trim() || null }
              : {}),
            ...(companyLogoImageData !== undefined
              ? { companyLogoImageData }
              : {}),
            ...(officePhotoImageData !== undefined
              ? { officePhotoImageData }
              : {}),
            ...(shouldResetVerificationApproval ? { verificationApproved: false, verificationApprovedAt: null } : {})
          }
        })
      : await prisma.$transaction(async (tx) => {
          const orgName = parsed.data.name!.trim();
          const created = await tx.partnerOrganization.create({
            data: {
              partnerType: PartnerType.COMPANY,
              name: orgName,
              slug: await generateUniquePartnerOrganizationSlug(orgName, tx),
              industry: parsed.data.industry!,
              companySize: parsed.data.companySize ?? null,
              website: normalizeWebsite(parsed.data.website),
              socialMedia: parsed.data.socialMedia?.trim() || null,
              officeAddress: parsed.data.officeAddress?.trim() || null,
              description: parsed.data.description?.trim() || null,
              strengths: parsed.data.strengths?.trim() || null,
              businessRegistrationDocumentData: parsed.data.businessRegistrationDocumentData?.trim() || null,
              fourInsuranceSubscriberListData: parsed.data.fourInsuranceSubscriberListData?.trim() || null,
              companyLogoImageData: companyLogoImageData ?? null,
              officePhotoImageData: officePhotoImageData ?? null,
              adminMemo: "Created by partner profile setup."
            }
          });
          await tx.user.update({
            where: { id: req.auth!.userId },
            data: {
              partnerOrganizationId: created.id,
              partnerOrgRole: PartnerOrgUserRole.OWNER
            }
          });
          return created;
        });

    const memberCount = await prisma.user.count({
      where: {
        role: MemberRole.PARTNER,
        partnerOrganizationId: updated.id
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

app.post("/members/me/partner-organization/join-codes", authenticate, requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  const parsed = createPartnerJoinCodeSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  const me = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: { partnerOrganizationId: true, partnerOrgRole: true }
  });
  if (!me?.partnerOrganizationId) {
    return res.status(400).json({ ok: false, message: "partner organization required" });
  }
  if (me.partnerOrgRole !== PartnerOrgUserRole.OWNER && me.partnerOrgRole !== PartnerOrgUserRole.ADMIN) {
    return res.status(403).json({ ok: false, message: "only owner/admin can create join code" });
  }

  const expiresInMinutes = parsed.data.expiresInMinutes ?? partnerJoinCodeTtlMinutesDefault;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);
  const code = generatePartnerJoinCode();

  await prisma.partnerOrganizationJoinCode.create({
    data: {
      partnerOrganizationId: me.partnerOrganizationId,
      createdByUserId: req.auth!.userId,
      codeHash: hashToken(code),
      expiresAt
    }
  });

  return res.status(201).json({
    ok: true,
    item: {
      code,
      expiresAt
    }
  });
});

app.post("/members/me/partner-organization/join", authenticate, requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  const parsed = joinMyPartnerOrganizationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  const hashed = hashToken(parsed.data.code.trim().toUpperCase());
  const invite = await prisma.partnerOrganizationJoinCode.findFirst({
    where: {
      codeHash: hashed,
      usedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: {
      partnerOrganization: true
    }
  });
  if (!invite) {
    return res.status(404).json({ ok: false, message: "invalid or expired join code" });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: req.auth!.userId },
      data: {
        partnerOrganizationId: invite.partnerOrganizationId,
        partnerOrgRole: PartnerOrgUserRole.ADMIN
      }
    }),
    prisma.partnerOrganizationJoinCode.update({
      where: { id: invite.id },
      data: { usedAt: new Date() }
    })
  ]);

  const memberCount = await prisma.user.count({
    where: { role: MemberRole.PARTNER, partnerOrganizationId: invite.partnerOrganizationId }
  });

  return res.json({
    ok: true,
    item: toPartnerOrganization({ ...invite.partnerOrganization, memberCount }, { includeVerificationAssets: true })
  });
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

// Upload a candidate document (resume / cover letter / portfolio / passport
// image). Accepts multipart/form-data with a single `file` field. Validates
// mime + size in candidateDocumentUpload middleware. Replaces any existing
// document of the same kind (old blob is left in storage — cleanup is async).
app.post(
  "/members/me/candidate-documents/:kind",
  authenticate,
  requireRoles([MemberRole.STUDENT]),
  candidateDocumentUpload.single("file"),
  async (req, res) => {
    const kindParam = req.params.kind as CandidateDocumentKind;
    const fieldDef = CANDIDATE_DOCUMENT_FIELDS[kindParam];
    if (!fieldDef) {
      return res.status(400).json({ ok: false, message: "Invalid document kind" });
    }
    if (!req.file) {
      return res.status(400).json({ ok: false, message: "file field is required" });
    }
    const userId = req.auth!.userId;
    try {
      await prisma.candidateProfile.upsert({
        where: { userId },
        create: { userId },
        update: {}
      });
      const url = await uploadCandidateDocumentToBlob(req.file, `members/${userId}/${kindParam}`);
      await prisma.candidateProfile.update({
        where: { userId },
        data: {
          [fieldDef.urlField]: url,
          [fieldDef.nameField]: req.file.originalname
        }
      });
      return res.status(200).json({
        ok: true,
        kind: kindParam,
        url,
        fileName: req.file.originalname
      });
    } catch (err) {
      console.error("[candidate-doc upload]", err);
      const message = err instanceof Error ? err.message : "failed to upload document";
      return res.status(500).json({ ok: false, message });
    }
  }
);

app.delete(
  "/members/me/candidate-documents/:kind",
  authenticate,
  requireRoles([MemberRole.STUDENT]),
  async (req, res) => {
    const kindParam = req.params.kind as CandidateDocumentKind;
    const fieldDef = CANDIDATE_DOCUMENT_FIELDS[kindParam];
    if (!fieldDef) {
      return res.status(400).json({ ok: false, message: "Invalid document kind" });
    }
    const userId = req.auth!.userId;
    try {
      await prisma.candidateProfile.update({
        where: { userId },
        data: {
          [fieldDef.urlField]: null,
          [fieldDef.nameField]: null
        }
      });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[candidate-doc delete]", err);
      return res.status(500).json({ ok: false, message: "failed to delete document" });
    }
  }
);

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

const careerReadinessLocaleSchema = z.object({
  locale: z.enum(["ko", "en", "zh-CN", "vi", "ja", "id"]).optional()
});

app.post("/members/me/career-readiness", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  if (!openai) {
    return res.status(503).json({ ok: false, message: "AI service is not configured" });
  }
  const userId = req.auth!.userId;
  const parsed = careerReadinessLocaleSchema.safeParse(req.body ?? {});
  const locale = parsed.success && parsed.data.locale ? parsed.data.locale : "ko";

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ ok: false, message: "user not found" });

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        educations: { select: { schoolName: true, major: true, status: true }, orderBy: { createdAt: "asc" } },
        languageSkills: { select: { language: true, level: true }, orderBy: { createdAt: "asc" } },
        careers: { select: { companyName: true, position: true, description: true }, orderBy: { createdAt: "desc" } },
        activityExperiences: { select: { title: true, description: true }, orderBy: { createdAt: "desc" } }
      }
    });

    const input: CareerReadinessProfile = {
      user: {
        realName: user.realName ?? null,
        name: user.name,
        nationality: user.nationality,
        affiliation: user.affiliation,
        birthDate: user.birthDate,
        gender: user.gender,
        jobTitle: user.jobTitle
      },
      profile: profile
        ? {
            visaType: profile.visaType,
            visaExpiryDate: profile.visaExpiryDate,
            workPermit: profile.workPermit,
            livesInKorea: profile.livesInKorea,
            residenceProvince: profile.residenceProvince,
            programStartOption: profile.programStartOption,
            programStartDate: profile.programStartDate,
            skills: profile.skills ?? [],
            selfIntroduction: profile.selfIntroduction,
            programMotivation: profile.programMotivation,
            preferenceConditionNote: profile.preferenceConditionNote,
            additionalInfoNote: profile.additionalInfoNote,
            educations: profile.educations.map((e) => ({ school: e.schoolName ?? null, major: e.major ?? null, status: e.status ?? null })),
            languageSkills: profile.languageSkills.map((l) => ({ language: l.language ?? null, level: l.level ?? null })),
            careers: profile.careers.map((c) => ({ companyName: c.companyName ?? null, jobTitle: c.position ?? null, description: c.description ?? null })),
            activityExperiences: profile.activityExperiences.map((a) => ({ title: a.title ?? null, description: a.description ?? null }))
          }
        : null
    };

    const score = computeCareerReadinessScore(input);
    const narrative = await generateCareerReadinessNarrative(input, score, locale);

    return res.json({
      ok: true,
      item: {
        score,
        strengths: narrative.strengths,
        improvements: narrative.improvements,
        recommendedRoles: narrative.recommendedRoles,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("[career-readiness] failed", error);
    return res.status(500).json({ ok: false, message: "failed to generate career readiness report" });
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
    select: {
      id: true,
      title: true,
      status: true,
      partnerOrganization: {
        select: {
          name: true
        }
      }
    }
  });
  if (!position) return res.status(404).json({ ok: false, message: "position not found" });
  if (position.status !== PositionStatus.OPEN) {
    return res.status(400).json({ ok: false, message: "현재 지원 가능한 포지션이 아닙니다." });
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

    // Create Application row, or reopen if previously WITHDRAWN
    const existing = await prisma.application.findUnique({
      where: { positionId_candidateUserId: { positionId: parsed.data.positionId, candidateUserId: userId } }
    });
    if (!existing) {
      const created = await prisma.application.create({
        data: {
          positionId: parsed.data.positionId,
          candidateUserId: userId,
          status: "SUBMITTED"
        }
      });
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: created.id,
          status: "SUBMITTED",
          changedByUserId: userId
        }
      });
    } else if (existing.status === "WITHDRAWN") {
      await prisma.application.update({
        where: { id: existing.id },
        data: { status: "SUBMITTED", withdrawnAt: null, submittedAt: new Date() }
      });
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: existing.id,
          status: "SUBMITTED",
          changedByUserId: userId,
          memo: "재지원"
        }
      });
    }
    const applicant = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });
    if (applicant) {
      void sendPositionApplyDiscordNotification({
        positionId: position.id,
        positionTitle: position.title,
        applicantId: applicant.id,
        applicantName: applicant.name,
        applicantEmail: applicant.email,
        partnerName: position.partnerOrganization?.name ?? null,
        appliedAt: new Date()
      });
    }
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

// ---- Resumes (multiple Korean-style resume versions per member) ---------
app.get("/members/me/resumes", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const userId = req.auth!.userId;
  try {
    const rows = await prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" }
    });
    // 코칭 진입 리스트에서 카드별 점수 배지를 보여주기 위해 응답에 score
    // 를 함께 실어 보냄. rule-based 라 row 당 sub-ms — 별도 호출보다 한 번에
    // 끝내는 게 UX 와 비용 양쪽에 유리. 기존 클라이언트는 score 필드를
    // 무시하면 되니 호환성 유지.
    const items = rows.map((row) => ({
      ...row,
      score: calcResumeScores(row.content)
    }));
    return res.json({ ok: true, items });
  } catch (err) {
    // 실제 원인이 묻히지 않도록 stderr 로 흘려 보냄. Prisma 의 컬럼 누락
    // (translations 추가 후 마이그레이션 미실행 등) 같은 흔한 케이스를
    // 콘솔에서 즉시 확인할 수 있어야 함.
    console.error("[GET /members/me/resumes] failed", err);
    return res.status(500).json({ ok: false, message: "failed to list resumes" });
  }
});

// If the incoming content carries a base64 data URL for `basicPhotoUrl`,
// upload it to Blob and swap in the public URL before persisting. Idempotent:
// pre-existing http(s) URLs pass straight through.
async function resolveResumePhoto(content: unknown): Promise<unknown> {
  if (!content || typeof content !== "object") return content;
  const obj = content as Record<string, unknown>;
  const raw = obj.basicPhotoUrl;
  if (typeof raw !== "string" || !raw.trim()) return content;
  try {
    const url = await uploadDataUrlImageIfNeeded(raw, "resumes/photos");
    return { ...obj, basicPhotoUrl: url };
  } catch {
    // Fall back to keeping the original value (the data URL would be
    // huge on the row but we still save valid JSON).
    return content;
  }
}

app.post("/members/me/resumes", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const userId = req.auth!.userId;
  const parsed = createResumeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }
  try {
    // 사용자의 첫 이력서면 자동으로 대표(primary)로 표시. 두 번째 이후는 기본 false.
    const existingCount = await prisma.resume.count({ where: { userId } });
    const isPrimary = existingCount === 0;
    const resolvedContent = await resolveResumePhoto(parsed.data.content ?? {});
    // 외국어 본문이 섞여 있으면 한국어 번역을 미리 캐시에 채워서 결과 화면
    // 어디서나 쌍으로 노출. LLM 호출 실패는 무시하고 원문만 저장 (UX 우선).
    const koTranslations = await buildKoreanTranslations(resolvedContent, null).catch(() => null);
    const created = await prisma.resume.create({
      data: {
        userId,
        title: parsed.data.title,
        content: resolvedContent as Prisma.InputJsonValue,
        translations: (koTranslations ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        isPrimary
      }
    });
    return res.status(201).json({ ok: true, item: created });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to create resume" });
  }
});

app.get("/members/me/resumes/:resumeId", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const userId = req.auth!.userId;
  const resumeId = Array.isArray(req.params.resumeId) ? req.params.resumeId[0] : req.params.resumeId;
  if (!resumeId) return res.status(400).json({ ok: false, message: "invalid request" });
  try {
    const item = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
    if (!item) return res.status(404).json({ ok: false, message: "resume not found" });
    return res.json({ ok: true, item });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to get resume" });
  }
});

app.patch("/members/me/resumes/:resumeId", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const userId = req.auth!.userId;
  const resumeId = Array.isArray(req.params.resumeId) ? req.params.resumeId[0] : req.params.resumeId;
  if (!resumeId) return res.status(400).json({ ok: false, message: "invalid request" });
  const parsed = updateResumeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }
  try {
    // 기존 row 의 content/translations 까지 함께 가져옴 — 본문이 바뀐 필드만
    // 재번역하고 변경 없는 단위는 기존 한국어를 그대로 들고 갈 수 있게.
    const existing = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
      select: { id: true, translations: true }
    });
    if (!existing) return res.status(404).json({ ok: false, message: "resume not found" });
    const resolvedContent = parsed.data.content !== undefined
      ? await resolveResumePhoto(parsed.data.content)
      : undefined;
    // content 가 변경된 경우에만 번역 재생성. 제목만 바꿨다면 기존 캐시 유지.
    let nextTranslations: ResumeTranslations | null | undefined = undefined;
    if (resolvedContent !== undefined) {
      const prev = (existing.translations ?? null) as ResumeTranslations | null;
      nextTranslations = await buildKoreanTranslations(resolvedContent, prev).catch(() => prev);
    }
    const item = await prisma.resume.update({
      where: { id: resumeId },
      data: {
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(resolvedContent !== undefined ? { content: resolvedContent as Prisma.InputJsonValue } : {}),
        ...(nextTranslations !== undefined
          ? { translations: (nextTranslations ?? Prisma.JsonNull) as Prisma.InputJsonValue }
          : {})
      }
    });
    return res.json({ ok: true, item });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to update resume" });
  }
});

app.delete("/members/me/resumes/:resumeId", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const userId = req.auth!.userId;
  const resumeId = Array.isArray(req.params.resumeId) ? req.params.resumeId[0] : req.params.resumeId;
  if (!resumeId) return res.status(400).json({ ok: false, message: "invalid request" });
  try {
    // 삭제 전에 이 이력서가 대표였는지 확인 — 대표를 삭제하면 남은 이력서
    // 중 가장 최근 수정본을 자동으로 새 대표로 승격시킴.
    const target = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
      select: { isPrimary: true }
    });
    await prisma.resume.deleteMany({ where: { id: resumeId, userId } });
    if (target?.isPrimary) {
      const remaining = await prisma.resume.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { id: true }
      });
      if (remaining[0]) {
        await prisma.resume.update({ where: { id: remaining[0].id }, data: { isPrimary: true } });
      }
    }
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to delete resume" });
  }
});

// Mark one resume as the member's representative (대표) resume. At most one
// primary per user, so we clear the others in the same transaction.
app.post("/members/me/resumes/:resumeId/primary", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const userId = req.auth!.userId;
  const resumeId = Array.isArray(req.params.resumeId) ? req.params.resumeId[0] : req.params.resumeId;
  if (!resumeId) return res.status(400).json({ ok: false, message: "invalid request" });
  try {
    const existing = await prisma.resume.findFirst({ where: { id: resumeId, userId }, select: { id: true } });
    if (!existing) return res.status(404).json({ ok: false, message: "resume not found" });
    const [, item] = await prisma.$transaction([
      prisma.resume.updateMany({ where: { userId, isPrimary: true }, data: { isPrimary: false } }),
      prisma.resume.update({ where: { id: resumeId }, data: { isPrimary: true } })
    ]);
    return res.json({ ok: true, item });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to set primary resume" });
  }
});

// ---------------------------------------------------------------------------
// Resume Coach — unified scoring + action items + position matching in a
// single response. Cheap to call (rule-based, ~10ms) so the frontend can
// re-fetch after every save without worrying about cost. LLM-backed text
// suggestions and free-form chat are split into separate endpoints so the
// expensive paths only run when the user explicitly asks.
// ---------------------------------------------------------------------------
app.get("/members/me/resumes/:resumeId/coach", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const userId = req.auth!.userId;
  const resumeId = Array.isArray(req.params.resumeId) ? req.params.resumeId[0] : req.params.resumeId;
  if (!resumeId) return res.status(400).json({ ok: false, message: "invalid request" });
  try {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
      select: { id: true, title: true, content: true, updatedAt: true }
    });
    if (!resume) return res.status(404).json({ ok: false, message: "resume not found" });

    const score = calcResumeScores(resume.content);
    const actions = generateResumeCoachActions(resume.content);
    const matches = await fetchResumeCoachPositionMatches(userId, resume.content);

    return res.json({
      ok: true,
      coach: {
        resumeId: resume.id,
        title: resume.title,
        score,
        actions,
        matches,
        updatedAt: resume.updatedAt
      }
    });
  } catch (err) {
    console.error("[coach] failed", err);
    return res.status(500).json({ ok: false, message: "failed to compute coach" });
  }
});

// POST /members/me/resumes/:resumeId/coach/suggest — LLM rewrite/expansion
// for a single resume section. Body specifies which section and which item
// (e.g. careers[2] description). Returns a single suggested rewrite the
// frontend can show inline with an [Apply] button. Cheap model so each
// click costs sub-cent. Falls back gracefully when OPENAI_API_KEY missing.
const coachSuggestSchema = z.object({
  targetSection: z.enum(["selfIntroduction", "summary", "careers", "activities"]),
  targetItemIndex: z.number().int().nonnegative().optional(),
  tone: z.enum(["formal", "concise", "impactful"]).optional()
});

app.post("/members/me/resumes/:resumeId/coach/suggest", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const userId = req.auth!.userId;
  const resumeId = Array.isArray(req.params.resumeId) ? req.params.resumeId[0] : req.params.resumeId;
  if (!resumeId) return res.status(400).json({ ok: false, message: "invalid request" });
  const parsed = coachSuggestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  if (!openai) return res.status(503).json({ ok: false, message: "ai unavailable" });

  try {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
      select: { content: true }
    });
    if (!resume) return res.status(404).json({ ok: false, message: "resume not found" });

    const c = (resume.content ?? {}) as Record<string, unknown>;
    const trimStr = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
    const isArr = (v: unknown): v is unknown[] => Array.isArray(v);
    const { targetSection, targetItemIndex, tone = "impactful" } = parsed.data;

    // Pull the source text the model should rewrite.
    let sourceText = "";
    let label = "";
    if (targetSection === "selfIntroduction" || targetSection === "summary") {
      sourceText = trimStr(c.selfIntroduction) || trimStr(c.summary);
      label = "자기소개";
    } else if (targetSection === "careers" && typeof targetItemIndex === "number" && isArr(c.careers)) {
      const item = c.careers[targetItemIndex];
      if (typeof item === "object" && item !== null) {
        const obj = item as Record<string, unknown>;
        sourceText = trimStr(obj.description);
        label = `${trimStr(obj.companyName) || "경력"} 설명`;
      }
    } else if (targetSection === "activities" && typeof targetItemIndex === "number" && isArr(c.activities)) {
      const item = c.activities[targetItemIndex];
      if (typeof item === "object" && item !== null) {
        const obj = item as Record<string, unknown>;
        sourceText = trimStr(obj.description);
        label = `${trimStr(obj.title) || "활동"} 설명`;
      }
    }
    if (!sourceText) {
      return res.status(400).json({ ok: false, message: "source text empty — write at least one sentence first" });
    }

    const toneNote = tone === "formal" ? "정중하고 격식 있는 어조" : tone === "concise" ? "간결하고 핵심만" : "임팩트 있고 구체적인 성과 중심";
    // 엄격한 ground-truth 규칙. 외국인 학생 입장에서는 AI 가 만들어낸 가짜
    // 경력이 가장 위험. 원문 사실만 활용해서 표현만 다듬도록 못 박는다.
    const systemPrompt =
      "당신은 한국 기업 채용을 돕는 이력서 코치입니다. 외국인 지원자의 이력서 한 단락을 더 임팩트 있게 다듬어 주세요.\n\n" +
      "엄격한 규칙:\n" +
      "1. 원문에 없는 새로운 사실(회사명·학교명·직책·날짜·기술·자격증·프로젝트 등)을 절대 만들어내지 마세요.\n" +
      "2. 원문의 숫자/수치는 그대로 유지하세요. 새 수치를 추가하거나 추정하지 마세요.\n" +
      "3. 표현만 더 명확하고 임팩트 있게 다듬으세요. 의미를 부풀리지 말고, 추측하지 마세요.\n" +
      "4. 원문 정보가 너무 빈약해서 다듬을 게 없다면, why 에 그렇게 솔직히 적고 rewrite 는 원문과 거의 동일하게 두세요.\n\n" +
      "JSON 한 개의 객체만 응답하세요. 형식: { \"rewrite\": string, \"why\": string }. why 는 1-2 문장으로 어떤 점이 개선됐는지 한국어로 설명.";
    const userPrompt = `다음 ${label}을(를) ${toneNote}로 다듬어 주세요:\n\n${sourceText}`;

    const completion = await openai.chat.completions.create({
      model: openaiTranslationModel,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });
    const raw = completion.choices?.[0]?.message?.content ?? "";
    let parsedJson: { rewrite?: unknown; why?: unknown } = {};
    try { parsedJson = JSON.parse(raw); } catch { /* fall through */ }
    const rewrite = typeof parsedJson.rewrite === "string" ? parsedJson.rewrite.trim() : "";
    const why = typeof parsedJson.why === "string" ? parsedJson.why.trim() : "";
    if (!rewrite) return res.status(502).json({ ok: false, message: "ai response empty" });

    return res.json({ ok: true, suggestion: { before: sourceText, after: rewrite, why, targetSection, targetItemIndex } });
  } catch (err) {
    console.error("[coach/suggest] failed", err);
    return res.status(500).json({ ok: false, message: "failed to generate suggestion" });
  }
});

// POST /members/me/resumes/:resumeId/coach/chat — free-form Q&A with the
// resume as context. Single-turn; the frontend keeps the conversation
// history client-side and sends the trailing N messages. Reasonable token
// caps keep cost predictable.
const coachChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000)
      })
    )
    .min(1)
    .max(12)
});

app.post("/members/me/resumes/:resumeId/coach/chat", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const userId = req.auth!.userId;
  const resumeId = Array.isArray(req.params.resumeId) ? req.params.resumeId[0] : req.params.resumeId;
  if (!resumeId) return res.status(400).json({ ok: false, message: "invalid request" });
  const parsed = coachChatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  if (!openai) return res.status(503).json({ ok: false, message: "ai unavailable" });

  try {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
      select: { content: true, title: true }
    });
    if (!resume) return res.status(404).json({ ok: false, message: "resume not found" });

    const scores = calcResumeScores(resume.content);
    // Compact JSON of the resume — trim to keep token usage bounded. The
    // chat is informational, not a full rewrite, so a summary is enough.
    const c = (resume.content ?? {}) as Record<string, unknown>;
    const resumeSummary = JSON.stringify({
      title: resume.title,
      qualityScore: scores.quality.total,
      readinessScore: scores.readiness.total,
      submissionLevel: scores.level,
      qualityDimensions: scores.quality.dimensions,
      readinessDimensions: scores.readiness.dimensions,
      hasName: Boolean((c.basicName ?? "") as string),
      hasVisa: Boolean((c.basicVisa ?? "") as string),
      summary: ((c.selfIntroduction ?? c.summary ?? "") as string).slice(0, 600),
      educationCount: Array.isArray(c.educations) ? c.educations.length : 0,
      careerCount: Array.isArray(c.careers) ? c.careers.length : 0,
      activityCount: Array.isArray(c.activities) ? c.activities.length : 0,
      skillCount: Array.isArray(c.skills) ? c.skills.length : 0,
      languageCount: Array.isArray(c.languages) ? c.languages.length : 0,
      certificationCount: Array.isArray(c.certifications) ? c.certifications.length : 0,
      linkCount: Array.isArray(c.links) ? c.links.length : 0
    });
    const systemPrompt =
      "당신은 Aply의 이력서 코치입니다. 외국인 지원자가 한국 기업에 더 매력적으로 보일 수 있도록 친근하고 구체적으로 조언하세요.\n" +
      "엄격한 규칙: 이력서에 없는 사실(회사명·학교명·직책·날짜·기술 등)을 절대 만들어내지 마세요. 모르는 것은 추측하지 말고 모른다고 답하세요. 사용자가 표현 개선을 요청하면 원문에 있는 사실만 활용해 표현만 다듬으세요.\n" +
      "한국어로 답변하며, 답변은 4-6 문장 이내로 간결하게 작성하세요.\n" +
      `사용자의 이력서 요약: ${resumeSummary}`;

    const completion = await openai.chat.completions.create({
      model: openaiTranslationModel,
      temperature: 0.6,
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        ...parsed.data.messages.map((m) => ({ role: m.role, content: m.content }))
      ]
    });
    const reply = completion.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) return res.status(502).json({ ok: false, message: "ai response empty" });
    return res.json({ ok: true, reply });
  } catch (err) {
    console.error("[coach/chat] failed", err);
    return res.status(500).json({ ok: false, message: "failed to chat" });
  }
});

// ---------------------------------------------------------------------------
// POST /members/me/ai/draft-resume-text — 편집 페이지의 textarea 옆에 붙는
// AI 작성 도우미. resume row 가 저장되기 전 상태의 임시 텍스트를 받아서
// 다듬거나(mode=improve), 사례를 더하거나(expand), 비어 있으면 키워드만으로
// 짧은 초안을 만들어(generate) 줌. 결과 적용 여부는 사용자가 매번 결정.
//
// 모든 모드에 동일하게: 사용자가 명시적으로 제공하지 않은 사실은 절대로
// 만들어내지 않음 (회사명·날짜·수치 등). 빈약하면 결과도 빈약해도 OK.
// ---------------------------------------------------------------------------
const draftResumeTextSchema = z.object({
  // 현재 입력된 텍스트. mode=generate 면 빈 문자열도 허용.
  currentText: z.string().max(5000),
  fieldType: z.enum(["selfIntroduction", "summary", "career", "activity"]),
  mode: z.enum(["improve", "expand", "generate"]).default("improve"),
  // 경력/활동의 경우 회사/직책/타이틀 같은 맥락. 자기소개는 보통 비워둠.
  context: z
    .object({
      companyName: z.string().max(120).optional(),
      position: z.string().max(120).optional(),
      title: z.string().max(120).optional()
    })
    .optional(),
  // 사용자가 키워드·뼈대를 줄 수 있는 자유 필드. mode=generate 일 때 특히 중요.
  hints: z.string().max(500).optional()
});

app.post("/members/me/ai/draft-resume-text", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  const parsed = draftResumeTextSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  if (!openai) return res.status(503).json({ ok: false, message: "ai unavailable" });

  const { currentText, fieldType, mode, context, hints } = parsed.data;
  // generate 모드는 빈 입력 OK, 그 외에는 currentText 또는 hints 중 하나는 있어야 함.
  if (mode !== "generate" && !currentText.trim()) {
    return res.status(400).json({ ok: false, message: "currentText empty — write at least one sentence or use mode=generate" });
  }
  if (mode === "generate" && !currentText.trim() && !hints?.trim()) {
    return res.status(400).json({ ok: false, message: "hints required when generating from empty" });
  }

  const fieldName = {
    selfIntroduction: "자기소개",
    summary: "요약",
    career: "경력 설명",
    activity: "활동·프로젝트 설명"
  }[fieldType];
  const modeNote =
    mode === "improve"
      ? "기존 표현을 더 명확하고 임팩트 있게 다듬으세요. 의미를 부풀리지 마세요."
      : mode === "expand"
      ? "기존 내용에 구체적 사례·수치(있다면)·맥락을 자연스럽게 더 적어주세요."
      : "사용자가 제공한 키워드·맥락만으로 적절한 길이의 초안을 작성하세요. 추측이 필요하면 추상적으로 두세요.";

  try {
    const systemPrompt =
      `당신은 한국 기업 채용을 돕는 이력서 코치입니다. 외국인 지원자의 ${fieldName}을(를) 작성/개선해 주세요.\n\n` +
      "엄격한 규칙:\n" +
      "1. 사용자가 명시적으로 제공하지 않은 새로운 사실(회사명·학교명·직책·날짜·수치·기술·자격증·프로젝트)을 절대 만들어내지 마세요.\n" +
      "2. 원문 또는 hints 에 적힌 숫자만 사용하고, 새 숫자를 추가/추정하지 마세요.\n" +
      "3. 의미를 부풀리거나 추측하지 마세요. 빈약한 입력은 빈약한 결과로 두는 게 정직합니다.\n" +
      "4. 한국어로 자연스럽고 정중하게 작성하세요.\n" +
      `5. ${fieldName} 으로서 적절한 길이로 작성하세요 (자기소개·요약은 200–500자, 경력·활동 설명은 60–200자 권장).\n\n` +
      "JSON 한 개의 객체만 응답: { \"text\": string, \"why\": string }. why 는 1-2 문장으로 어떤 점을 다듬었는지/생성했는지 한국어로 설명.";

    const userPromptParts: string[] = [`요청 모드: ${modeNote}`];
    if (context) {
      const ctxText = [
        context.companyName ? `회사명: ${context.companyName}` : null,
        context.position ? `직책: ${context.position}` : null,
        context.title ? `활동명: ${context.title}` : null
      ]
        .filter(Boolean)
        .join(", ");
      if (ctxText) userPromptParts.push(`맥락: ${ctxText}`);
    }
    if (hints?.trim()) userPromptParts.push(`사용자 키워드/요청: ${hints.trim()}`);
    userPromptParts.push(`현재 ${fieldName}:\n${currentText || "(비어있음)"}`);
    const userPrompt = userPromptParts.join("\n\n");

    const completion = await openai.chat.completions.create({
      model: openaiTranslationModel,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });
    const raw = completion.choices?.[0]?.message?.content ?? "";
    let parsedJson: { text?: unknown; why?: unknown } = {};
    try { parsedJson = JSON.parse(raw); } catch { /* fall through */ }
    const text = typeof parsedJson.text === "string" ? parsedJson.text.trim() : "";
    const why = typeof parsedJson.why === "string" ? parsedJson.why.trim() : "";
    if (!text) return res.status(502).json({ ok: false, message: "ai response empty" });

    return res.json({ ok: true, draft: { text, why, mode, fieldType } });
  } catch (err) {
    console.error("[ai/draft-resume-text] failed", err);
    return res.status(500).json({ ok: false, message: "failed to draft" });
  }
});

// ---------------------------------------------------------------------------
// Public, anonymous read of a shared resume. Anyone with the slug can view
// the read-only single-page rendering — no auth, no rate-limit beyond the
// global stack. We surface only the fields needed for the printable sheet
// (no email-internal flags, no admin memo) and join the owner's display
// name in case the resume's basicName is empty.
// ---------------------------------------------------------------------------
app.get("/resumes/share/:slug", async (req, res) => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ ok: false, message: "invalid slug" });
  }

  // Optional auth — if a valid Bearer token is presented and the role is
  // OPERATOR, surface the full record. Anonymous callers (i.e. recruiters
  // opening the share link directly) get a PII-stripped copy.
  let isOperator = false;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const payload = verifyAccessToken(authHeader.slice("Bearer ".length));
    if (payload?.role === MemberRole.OPERATOR) isOperator = true;
  }

  try {
    const resume = await prisma.resume.findUnique({
      where: { shareSlug: slug },
      select: {
        id: true,
        title: true,
        content: true,
        // 한국어 번역 캐시 — SharedResumePage 의 KoLine 이 외국어 문단 아래에
        // 한국어 번역을 그려주는 데 필요. 운영자/익명 양쪽 모두 노출.
        translations: true,
        isPrimary: true,
        shareSlug: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { name: true, realName: true, email: true, phoneNumber: true }
        }
      }
    });
    if (!resume) return res.status(404).json({ ok: false, message: "resume not found" });

    // 익명·일반 사용자에게는 이메일/전화/주소 같은 PII 를 응답에서 아예
    // 빼서 보냄. 클라이언트 인스펙터로도 볼 수 없게 서버 측에서 가림.
    if (!isOperator) {
      const raw = (resume.content ?? {}) as Record<string, unknown>;
      const sanitizedContent = { ...raw };
      delete sanitizedContent.basicEmail;
      delete sanitizedContent.basicPhone;
      delete sanitizedContent.basicResidence;
      const safeUser = resume.user
        ? { name: resume.user.name, realName: resume.user.realName }
        : null;
      return res.json({
        ok: true,
        item: {
          ...resume,
          content: sanitizedContent,
          user: safeUser,
          viewerScope: "public" as const
        }
      });
    }

    return res.json({
      ok: true,
      item: { ...resume, viewerScope: "operator" as const }
    });
  } catch {
    return res.status(500).json({ ok: false, message: "failed to load shared resume" });
  }
});

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

function parsePartnerApplicantCompositeId(value: string) {
  const idx = value.lastIndexOf(":");
  if (idx <= 0 || idx >= value.length - 1) return null;
  const candidateUserId = value.slice(0, idx);
  const positionId = value.slice(idx + 1);
  if (!candidateUserId || !positionId) return null;
  return { candidateUserId, positionId };
}

function buildPartnerApplicantCompositeId(candidateUserId: string, positionId: string) {
  return `${candidateUserId}:${positionId}`;
}

function languageLabel(language: CandidateLanguageType, level: CandidateLanguageLevel) {
  return `${language} (${level})`;
}

async function listPartnerApplicantsForUser(userId: string) {
  const affiliation = await resolvePartnerAffiliation(userId);
  if (!affiliation?.organization) return { affiliation: null, items: [] as any[] };

  const positions = await prisma.position.findMany({
    where: { partnerOrganizationId: affiliation.organization.id },
    select: { id: true, title: true }
  });
  const positionMap = new Map(positions.map((item) => [item.id, item.title]));
  const positionIds = positions.map((item) => item.id);
  if (positionIds.length === 0) return { affiliation, items: [] as any[] };

  const profiles = await prisma.candidateProfile.findMany({
    where: { appliedPositionIds: { hasSome: positionIds } },
    include: {
      user: {
        select: { id: true, name: true, realName: true, email: true, nationality: true }
      },
      languageSkills: {
        select: { language: true, level: true },
        orderBy: { createdAt: "desc" }
      },
      educations: {
        select: { schoolName: true, major: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  const items: Array<{
    id: string;
    candidateUserId: string;
    positionId: string;
    positionTitle: string;
    name: string;
    nationality: string | null;
    email: string;
    languages: string[];
    school: string | null;
    major: string | null;
    residence: string | null;
    appliedAt: string | null;
    recommendation: "HIGH" | "NORMAL" | "CHECK";
    status: PartnerApplicantWorkflowStatus;
    summary: string | null;
    motivation: string | null;
    portfolioUrl: string | null;
    availableStartDate: string | null;
    memo: string | null;
  }> = [];

  const workflows = await prisma.partnerApplicantWorkflow.findMany({
    where: { partnerUserId: userId, positionId: { in: positionIds } },
    select: { candidateUserId: true, positionId: true, status: true, memo: true }
  });
  const workflowMap = new Map(
    workflows.map((item) => [`${item.candidateUserId}:${item.positionId}`, item])
  );

  for (const profile of profiles) {
    const appliedPositionId = profile.appliedPositionIds.find((id) => positionMap.has(id));
    if (!appliedPositionId) continue;

    const stateKey = buildPartnerApplicantCompositeId(profile.userId, appliedPositionId);
    const state = workflowMap.get(stateKey);
    const latestEducation = profile.educations[0];
    const displayName = profile.user.realName?.trim() || profile.user.name?.trim() || "Unknown";
    const languages = profile.languageSkills.map((item) => languageLabel(item.language, item.level));

    items.push({
      id: stateKey,
      candidateUserId: profile.userId,
      positionId: appliedPositionId,
      positionTitle: positionMap.get(appliedPositionId) ?? "-",
      name: displayName,
      nationality: profile.user.nationality ?? null,
      email: profile.user.email,
      languages,
      school: latestEducation?.schoolName ?? null,
      major: latestEducation?.major ?? null,
      residence: profile.residenceProvince ?? null,
      appliedAt: profile.updatedAt?.toISOString?.() ?? null,
      recommendation: languages.length >= 2 ? "HIGH" : "NORMAL",
      status: (state?.status as PartnerApplicantWorkflowStatus | undefined) ?? "APPLIED",
      summary: profile.selfIntroduction ?? null,
      motivation: profile.programMotivation ?? null,
      portfolioUrl: null,
      availableStartDate: profile.programStartDate ? profile.programStartDate.toISOString().slice(0, 10) : null,
      memo: state?.memo ?? null
    });
  }

  return { affiliation, items };
}

app.get("/ops/activity", authenticate, requireRoles([MemberRole.OPERATOR]), async (_req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [signups, newPositions, statusChanges, newIssues, newPrograms, schoolCreditRequests] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, name: true, email: true, role: true, createdAt: true }
      }),
      prisma.position.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { partnerOrganization: { select: { id: true, name: true } } }
      }),
      prisma.applicationStatusHistory.findMany({
        orderBy: { changedAt: "desc" },
        take: 10,
        include: {
          application: {
            include: {
              candidateUser: { select: { id: true, name: true } },
              position: { select: { id: true, title: true, partnerOrganization: { select: { name: true } } } }
            }
          }
        }
      }),
      prisma.issueReport.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { reporter: { select: { id: true, name: true } } }
      }),
      prisma.program.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          application: {
            include: {
              candidateUser: { select: { id: true, name: true } },
              position: { select: { id: true, title: true } }
            }
          }
        }
      }),
      prisma.schoolCreditRequest.findMany({
        where: { status: "REQUESTED" },
        orderBy: { requestedAt: "desc" },
        take: 5
      })
    ]);

    type ActivityItem = {
      id: string;
      type: string;
      title: string;
      subtitle: string;
      linkPath: string;
      occurredAt: string;
    };
    const items: ActivityItem[] = [];

    const roleKo: Record<string, string> = { STUDENT: "학생", PARTNER: "파트너", OPERATOR: "운영자" };
    for (const u of signups) {
      items.push({
        id: `signup-${u.id}`,
        type: "USER_SIGNUP",
        title: `${u.name ?? u.email}님이 가입했어요`,
        subtitle: roleKo[u.role] ?? u.role,
        linkPath: `/dashboard/ops/system/admin-users/${u.id}`,
        occurredAt: u.createdAt.toISOString()
      });
    }
    for (const p of newPositions) {
      items.push({
        id: `position-${p.id}`,
        type: "POSITION_NEW",
        title: `새 포지션: ${p.title}`,
        subtitle: p.partnerOrganization?.name ?? "-",
        linkPath: `/dashboard/ops/operations/positions`,
        occurredAt: p.createdAt.toISOString()
      });
    }
    const statusKo: Record<string, string> = {
      SUBMITTED: "검토 중",
      INTERVIEW: "면접 예정",
      ACCEPTED: "합격",
      REJECTED: "불합격",
      WITHDRAWN: "철회"
    };
    for (const h of statusChanges) {
      items.push({
        id: `status-${h.id}`,
        type: "APPLICATION_STATUS",
        title: `${h.application.candidateUser.name ?? "-"} → '${statusKo[h.status] ?? h.status}'`,
        subtitle: `${h.application.position.partnerOrganization?.name ?? "-"} · ${h.application.position.title}`,
        linkPath: `/dashboard/ops/operations/applications/${h.applicationId}`,
        occurredAt: h.changedAt.toISOString()
      });
    }
    for (const i of newIssues) {
      items.push({
        id: `issue-${i.id}`,
        type: "ISSUE_NEW",
        title: `새 이슈: ${i.title}`,
        subtitle: `신고: ${i.reporter?.name ?? "-"}`,
        linkPath: `/dashboard/ops/operations/issues`,
        occurredAt: i.createdAt.toISOString()
      });
    }
    for (const p of newPrograms) {
      items.push({
        id: `program-${p.id}`,
        type: "PROGRAM_STARTED",
        title: `프로그램 시작: ${p.application.candidateUser.name ?? "-"}`,
        subtitle: p.application.position.title,
        linkPath: `/dashboard/ops/operations/programs/${p.id}`,
        occurredAt: p.createdAt.toISOString()
      });
    }
    for (const c of schoolCreditRequests) {
      items.push({
        id: `credit-${c.id}`,
        type: "SCHOOL_CREDIT",
        title: `학점 인정 요청: ${c.schoolName}`,
        subtitle: `${c.credits}학점`,
        linkPath: "/dashboard/ops/operations/school-credit",
        occurredAt: c.requestedAt.toISOString()
      });
    }

    items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    return res.json({ ok: true, items: items.slice(0, 30) });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

app.get("/partner/activity", authenticate, requireRoles([MemberRole.PARTNER]), async (req, res) => {
  try {
    const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
    if (!affiliation?.organization) {
      return sendAuthError(res, 403, "PARTNER_AFFILIATION_REQUIRED", "partner affiliation is required.");
    }
    const orgId = affiliation.organization.id;
    const [newApplications, statusChanges, recentSlots, newAssignments, newComments] = await Promise.all([
      prisma.application.findMany({
        where: { position: { partnerOrganizationId: orgId } },
        orderBy: { submittedAt: "desc" },
        take: 10,
        include: {
          candidateUser: { select: { id: true, name: true, email: true } },
          position: { select: { id: true, title: true } }
        }
      }),
      prisma.applicationStatusHistory.findMany({
        where: { application: { position: { partnerOrganizationId: orgId } } },
        orderBy: { changedAt: "desc" },
        take: 10,
        include: {
          application: {
            include: {
              candidateUser: { select: { id: true, name: true, email: true } },
              position: { select: { id: true, title: true } }
            }
          },
          changedBy: { select: { id: true, name: true, role: true } }
        }
      }),
      prisma.interviewSlot.findMany({
        where: {
          application: { position: { partnerOrganizationId: orgId } },
          OR: [{ status: "SELECTED" }, { status: "CANCELLED" }]
        },
        orderBy: { selectedAt: "desc" },
        take: 5,
        include: {
          application: {
            include: {
              candidateUser: { select: { id: true, name: true } },
              position: { select: { id: true, title: true } }
            }
          }
        }
      }),
      prisma.assignment.findMany({
        where: {
          application: { position: { partnerOrganizationId: orgId } },
          OR: [{ status: "SUBMITTED" }, { status: "REVIEWED" }]
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          application: {
            include: {
              candidateUser: { select: { id: true, name: true } },
              position: { select: { id: true, title: true } }
            }
          }
        }
      }),
      prisma.applicationComment.findMany({
        where: {
          application: { position: { partnerOrganizationId: orgId } },
          authorRole: { in: [MemberRole.STUDENT] }
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          application: {
            include: {
              candidateUser: { select: { id: true, name: true } },
              position: { select: { id: true, title: true } }
            }
          },
          author: { select: { id: true, name: true } }
        }
      })
    ]);

    type ActivityItem = {
      id: string;
      type: string;
      title: string;
      subtitle: string;
      linkPath: string;
      occurredAt: string;
    };

    const items: ActivityItem[] = [];
    for (const a of newApplications) {
      items.push({
        id: `app-new-${a.id}`,
        type: "APPLICATION_NEW",
        title: `${a.candidateUser.name ?? a.candidateUser.email}님이 지원했어요`,
        subtitle: a.position.title,
        linkPath: `/dashboard/partner/applicants/${a.id}`,
        occurredAt: a.submittedAt.toISOString()
      });
    }
    for (const h of statusChanges) {
      if (h.changedBy?.role === "PARTNER") continue;
      const statusKo: Record<string, string> = {
        SUBMITTED: "검토 중",
        INTERVIEW: "면접 예정",
        ACCEPTED: "합격",
        REJECTED: "불합격",
        WITHDRAWN: "철회"
      };
      items.push({
        id: `app-status-${h.id}`,
        type: "APPLICATION_STATUS",
        title: `${h.application.candidateUser.name ?? "-"} → '${statusKo[h.status] ?? h.status}'`,
        subtitle: h.application.position.title,
        linkPath: `/dashboard/partner/applicants/${h.applicationId}`,
        occurredAt: h.changedAt.toISOString()
      });
    }
    for (const s of recentSlots) {
      const when = s.selectedAt ?? s.cancelledAt ?? s.proposedAt;
      items.push({
        id: `slot-${s.id}`,
        type: s.status === "SELECTED" ? "INTERVIEW_SELECTED" : "INTERVIEW_CANCELLED",
        title: s.status === "SELECTED"
          ? `${s.application.candidateUser.name ?? "-"}님이 면접 일정 선택`
          : `${s.application.candidateUser.name ?? "-"}님 면접 취소`,
        subtitle: `${s.application.position.title} · ${new Date(s.startsAt).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}`,
        linkPath: `/dashboard/partner/applicants/${s.applicationId}`,
        occurredAt: when.toISOString()
      });
    }
    for (const as of newAssignments) {
      items.push({
        id: `asg-${as.id}-${as.status}`,
        type: as.status === "SUBMITTED" ? "ASSIGNMENT_SUBMITTED" : "ASSIGNMENT_REVIEWED",
        title: as.status === "SUBMITTED"
          ? `${as.application.candidateUser.name ?? "-"}님이 과제 제출`
          : `${as.application.candidateUser.name ?? "-"}님 과제 검토 완료`,
        subtitle: `${as.title} · ${as.application.position.title}`,
        linkPath: `/dashboard/partner/applicants/${as.applicationId}`,
        occurredAt: as.updatedAt.toISOString()
      });
    }
    for (const c of newComments) {
      items.push({
        id: `cmt-${c.id}`,
        type: "COMMENT_NEW",
        title: `${c.author.name ?? "지원자"}님이 댓글을 남겼어요`,
        subtitle: `${c.application.position.title}: ${c.content.slice(0, 60)}`,
        linkPath: `/dashboard/partner/applicants/${c.applicationId}`,
        occurredAt: c.createdAt.toISOString()
      });
    }

    items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    return res.json({ ok: true, items: items.slice(0, 20) });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
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
  if (!affiliation || !affiliation.organization) {
    return sendAuthError(
      res,
      403,
      "PARTNER_AFFILIATION_REQUIRED",
      "partner affiliation is required. request organization assignment."
    );
  }

  const orgId = affiliation.organization.id;
  try {
    const [totalPositions, openPositions, closedPositions, recentPositions] = await Promise.all([
      prisma.position.count({ where: { partnerOrganizationId: orgId } }),
      prisma.position.count({ where: { partnerOrganizationId: orgId, status: "OPEN" } }),
      prisma.position.count({ where: { partnerOrganizationId: orgId, status: "CLOSED" } }),
      prisma.position.findMany({
        where: { partnerOrganizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, createdAt: true }
      })
    ]);

    return res.json({
      ok: true,
      auth: req.auth,
      partnerOrganization: toPartnerOrganization(affiliation.organization),
      stats: {
        positions: { total: totalPositions, open: openPositions, closed: closedPositions }
      },
      recentPositions
    });
  } catch (error) {
    console.error("[partner/dashboard] failed", error);
    return res.status(500).json({ ok: false, message: "failed to load partner dashboard" });
  }
});

app.get("/partner/positions", authenticate, requireRoles([MemberRole.PARTNER]), async (req, res) => {
  const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
  if (!affiliation?.organization) {
    return sendAuthError(
      res,
      403,
      "PARTNER_AFFILIATION_REQUIRED",
      "partner affiliation is required. request organization assignment."
    );
  }
  const organizationId = affiliation.organization.id;

  try {
    const items = await prisma.position.findMany({
      where: { partnerOrganizationId: affiliation.organization.id },
      orderBy: { createdAt: "desc" },
      include: {
        partnerOrganization: {
          select: {
            id: true,
            name: true
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

    return res.json({
      ok: true,
      items: items.map((item) => toPosition(item))
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

app.post("/partner/positions/:id/clone", authenticate, requireRoles([MemberRole.PARTNER]), async (req, res) => {
  const sourceId = typeof req.params.id === "string" ? req.params.id : "";
  if (!sourceId) return res.status(400).json({ ok: false, message: "invalid id" });
  try {
    const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
    if (!affiliation?.organization) {
      return sendAuthError(res, 403, "PARTNER_AFFILIATION_REQUIRED", "partner affiliation is required.");
    }
    const source = await prisma.position.findUnique({ where: { id: sourceId } });
    if (!source) return res.status(404).json({ ok: false, message: "position not found" });
    if (source.partnerOrganizationId !== affiliation.organization.id) {
      return res.status(403).json({ ok: false, message: "forbidden" });
    }
    const created = await prisma.position.create({
      data: {
        partnerOrganizationId: source.partnerOrganizationId,
        sourceKind: "INTERNAL",
        sourceProvider: "INTERNAL",
        title: `${source.title} (복제)`,
        status: "DRAFT",
        workType: source.workType,
        employmentType: source.employmentType,
        thumbnailImages: source.thumbnailImages,
        eligibleVisas: source.eligibleVisas,
        preferredNationalities: source.preferredNationalities,
        communicationLanguages: source.communicationLanguages,
        hiringProcess: source.hiringProcess,
        preferredJobRole: source.preferredJobRole,
        hiringCount: source.hiringCount,
        workingHours: source.workingHours,
        workLocation: source.workLocation,
        startDate: source.startDate,
        mainResponsibilities: source.mainResponsibilities,
        requiredQualifications: source.requiredQualifications,
        preferredQualifications: source.preferredQualifications,
        dressCode: source.dressCode,
        wantsPreTraining: source.wantsPreTraining,
        additionalNotes: source.additionalNotes
      }
    });
    void embedAndSavePosition(prisma, created.id);
    return res.status(201).json({ ok: true, item: { id: created.id, title: created.title, status: created.status } });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

app.post("/partner/positions", authenticate, requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  console.info("[partner/positions][create][request]", {
    userId: req.auth?.userId,
    role: req.auth?.role,
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

  // Operators bypass partner-org affiliation + approval. The position is
  // created with no org (admin can later attach one in the ops dashboard)
  // and lands directly in OPEN so it shows up publicly without a review
  // round-trip.
  const isOperator = req.auth!.role === MemberRole.OPERATOR;
  let partnerOrganizationId: string | null = null;
  if (!isOperator) {
    const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
    if (!affiliation?.organization) {
      return sendAuthError(
        res,
        403,
        "PARTNER_AFFILIATION_REQUIRED",
        "partner affiliation is required. request organization assignment."
      );
    }
    const partnerAccess = toPartnerOrganization(affiliation.organization);
    if (!partnerAccess.permissions.canPostPositions) {
      return res.status(403).json({
        ok: false,
        message: "파트너 운영중이 승인되지 않으면 포지션을 등록할 수 없습니다"
      });
    }
    partnerOrganizationId = affiliation.organization.id;
  }

  try {
    const nextStatus = isOperator ? PositionStatus.OPEN : PositionStatus.PENDING_REVIEW;
    const uploadedThumbnailImages = await uploadImageArrayIfNeeded(parsed.data.thumbnailImages, "positions/thumbnails");
    const created = await prisma.position.create({
      data: {
        partnerOrganizationId,
        title: parsed.data.title,
        status: nextStatus,
        workType: parsed.data.workType ?? "On-site",
        employmentType: parsed.data.employmentType ?? PositionEmploymentType.UNPAID_INTERN,
        thumbnailImages: uploadedThumbnailImages.slice(0, 5),
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
        adminMemo: mergeEmploymentClassificationMeta(null, parsed.data.employmentClassification ?? null),
        statusHistories: {
          create: {
            fromStatus: null,
            toStatus: nextStatus,
            note: isOperator ? "운영자 공고 생성 (자동 승인)" : "파트너 공고 생성 (어드민 관리자 승인 대기)",
            createdByUserId: req.auth!.userId
          }
        }
      },
      include: {
        partnerOrganization: {
          select: {
            id: true,
            name: true
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

    const creator = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: { id: true, name: true, email: true }
    });
    void sendPositionCreateDiscordNotification({
      positionId: created.id,
      positionTitle: created.title,
      partnerName: created.partnerOrganization?.name ?? null,
      employmentType: created.employmentType,
      employmentClassification: parsed.data.employmentClassification ?? null,
      workType: created.workType ?? null,
      workLocation: created.workLocation ?? null,
      createdByUserId: req.auth!.userId,
      createdByUserName: creator?.name ?? null,
      createdByUserEmail: creator?.email ?? null,
      createdAt: created.createdAt
    });
    void embedAndSavePosition(prisma, created.id);

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
      "partner affiliation is required. request organization assignment."
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
          name: true
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

app.patch("/partner/positions/:id", authenticate, requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid position id" });
  }

  console.info("[partner/positions][update][request]", {
    positionId: id,
    userId: req.auth?.userId,
    role: req.auth?.role,
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

  const isOperator = req.auth!.role === MemberRole.OPERATOR;

  // Operators can edit any position directly (no revision, no review).
  if (isOperator) {
    const target = await prisma.position.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!target) {
      return res.status(404).json({ ok: false, message: "position not found" });
    }
    try {
      const uploadedThumbnailImages =
        parsed.data.thumbnailImages !== undefined
          ? await uploadImageArrayIfNeeded(parsed.data.thumbnailImages, "positions/thumbnails")
          : undefined;
      const updated = await prisma.position.update({
        where: { id },
        data: {
          ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
          ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
          ...(parsed.data.workType !== undefined ? { workType: parsed.data.workType } : {}),
          ...(parsed.data.employmentType !== undefined ? { employmentType: parsed.data.employmentType } : {}),
          ...(uploadedThumbnailImages !== undefined ? { thumbnailImages: uploadedThumbnailImages.slice(0, 5) } : {}),
          ...(parsed.data.eligibleVisas !== undefined ? { eligibleVisas: normalizeStringArray(parsed.data.eligibleVisas) } : {}),
          ...(parsed.data.preferredNationalities !== undefined ? { preferredNationalities: normalizeStringArray(parsed.data.preferredNationalities) } : {}),
          ...(parsed.data.communicationLanguages !== undefined ? { communicationLanguages: normalizeStringArray(parsed.data.communicationLanguages) } : {}),
          ...(parsed.data.hiringProcess !== undefined ? { hiringProcess: parsed.data.hiringProcess } : {}),
          ...(parsed.data.preferredJobRole !== undefined ? { preferredJobRole: parsed.data.preferredJobRole } : {}),
          ...(parsed.data.hiringCount !== undefined ? { hiringCount: parsed.data.hiringCount } : {}),
          ...(parsed.data.workingHours !== undefined ? { workingHours: parsed.data.workingHours } : {}),
          ...(parsed.data.workLocation !== undefined ? { workLocation: parsed.data.workLocation } : {}),
          ...(parsed.data.startDate !== undefined ? { startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null } : {}),
          ...(parsed.data.mainResponsibilities !== undefined ? { mainResponsibilities: parsed.data.mainResponsibilities } : {}),
          ...(parsed.data.requiredQualifications !== undefined ? { requiredQualifications: parsed.data.requiredQualifications } : {}),
          ...(parsed.data.preferredQualifications !== undefined ? { preferredQualifications: parsed.data.preferredQualifications } : {}),
          ...(parsed.data.dressCode !== undefined ? { dressCode: parsed.data.dressCode } : {}),
          ...(parsed.data.wantsPreTraining !== undefined ? { wantsPreTraining: parsed.data.wantsPreTraining } : {}),
          ...(parsed.data.additionalNotes !== undefined ? { additionalNotes: parsed.data.additionalNotes } : {}),
          statusHistories: {
            create: {
              fromStatus: target.status,
              toStatus: parsed.data.status ?? target.status,
              note: "운영자 직접 수정",
              createdByUserId: req.auth!.userId
            }
          }
        },
        include: {
          partnerOrganization: { select: { id: true, name: true } },
          matchingParticipants: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { id: true, name: true, email: true } } } },
          progressLogs: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { id: true, name: true, email: true } } } },
          statusHistories: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { id: true, name: true, email: true } } } }
        }
      });
      void embedAndSavePosition(prisma, updated.id);
      return res.json({ ok: true, item: toPosition(updated), message: "수정되었습니다." });
    } catch (error) {
      console.error("[partner/positions][update][failed][operator]", { positionId: id, message: getErrorMessage(error) });
      return res.status(500).json({ ok: false, message: "failed to update position" });
    }
  }

  const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
  if (!affiliation?.organization) {
    return sendAuthError(
      res,
      403,
      "PARTNER_AFFILIATION_REQUIRED",
      "partner affiliation is required. request organization assignment."
    );
  }
  const organizationId = affiliation.organization.id;

  const current = await prisma.position.findFirst({
    where: {
      id,
      partnerOrganizationId: affiliation.organization.id
    },
    select: {
      id: true,
      status: true,
      adminMemo: true
    }
  });
  if (!current) {
    return res.status(404).json({ ok: false, message: "position not found" });
  }

  try {
    const hasStatusUpdate = parsed.data.status !== undefined;
    const hasContentUpdate = Object.entries(parsed.data).some(([key, value]) => key !== "status" && value !== undefined);

    if (hasStatusUpdate) {
      if (hasContentUpdate) {
        return res.status(400).json({
          ok: false,
          message: "상태 변경과 내용 수정은 동시에 요청할 수 없습니다. 각각 따로 요청해주세요."
        });
      }

      if (current.status === PositionStatus.PENDING_REVIEW) {
        return res.status(403).json({
          ok: false,
          message: "승인 대기 상태에서는 파트너가 상태를 변경할 수 없습니다. 어드민 승인 후 변경 가능합니다."
        });
      }

      const nextStatus = parsed.data.status!;
      const partnerAllowedStatuses: PositionStatus[] = [PositionStatus.OPEN, PositionStatus.PAUSED, PositionStatus.CLOSED];
      if (!partnerAllowedStatuses.includes(nextStatus)) {
        return res.status(403).json({
          ok: false,
          message: "파트너는 공개/정지/마감 상태만 변경할 수 있습니다."
        });
      }

      if (nextStatus === current.status) {
        const same = await prisma.position.findUnique({
          where: { id: current.id },
          include: {
            partnerOrganization: { select: { id: true, name: true } },
            matchingParticipants: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { id: true, name: true, email: true } } } },
            progressLogs: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { id: true, name: true, email: true } } } },
            statusHistories: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { id: true, name: true, email: true } } } }
          }
        });
        if (!same) return res.status(404).json({ ok: false, message: "position not found" });
        return res.json({ ok: true, item: toPosition(same) });
      }

      const updated = await prisma.position.update({
        where: { id: current.id },
        data: {
          status: nextStatus,
          statusHistories: {
            create: {
              fromStatus: current.status,
              toStatus: nextStatus,
              note: "파트너 상태 변경",
              createdByUserId: req.auth!.userId
            }
          }
        },
        include: {
          partnerOrganization: { select: { id: true, name: true } },
          matchingParticipants: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { id: true, name: true, email: true } } } },
          progressLogs: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { id: true, name: true, email: true } } } },
          statusHistories: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { id: true, name: true, email: true } } } }
        }
      });
      return res.json({ ok: true, item: toPosition(updated), message: "상태가 변경되었습니다." });
    }

    if (!hasContentUpdate) {
      return res.status(400).json({ ok: false, message: "변경할 내용이 없습니다." });
    }

    const uploadedThumbnailImages =
      parsed.data.thumbnailImages !== undefined
        ? await uploadImageArrayIfNeeded(parsed.data.thumbnailImages, "positions/thumbnails")
        : undefined;

    const normalizedPayload = {
      ...parsed.data,
      ...(uploadedThumbnailImages !== undefined
        ? { thumbnailImages: uploadedThumbnailImages.slice(0, 5) }
        : {}),
      ...(parsed.data.eligibleVisas !== undefined ? { eligibleVisas: normalizeStringArray(parsed.data.eligibleVisas) } : {}),
      ...(parsed.data.preferredNationalities !== undefined
        ? { preferredNationalities: normalizeStringArray(parsed.data.preferredNationalities) }
        : {}),
      ...(parsed.data.communicationLanguages !== undefined
        ? { communicationLanguages: normalizeStringArray(parsed.data.communicationLanguages) }
        : {})
    };

    await prisma.$transaction(async (tx) => {
      await tx.positionRevision.updateMany({
        where: {
          positionId: current.id,
          partnerOrganizationId: organizationId,
          status: PositionRevisionStatus.PENDING
        },
        data: {
          status: PositionRevisionStatus.REJECTED,
          reviewNote: "새 수정요청으로 대체됨",
          reviewedByUserId: req.auth!.userId,
          reviewedAt: new Date()
        }
      });

      await tx.positionRevision.create({
        data: {
          positionId: current.id,
          partnerOrganizationId: organizationId,
          requestedByUserId: req.auth!.userId,
          status: PositionRevisionStatus.PENDING,
          payload: normalizedPayload
        }
      });

      await tx.positionStatusHistory.create({
        data: {
          positionId: current.id,
          fromStatus: current.status,
          toStatus: PositionStatus.PENDING_REVIEW,
          note: "파트너 공고 수정 요청 (어드민 관리자 승인 대기)",
          createdByUserId: req.auth!.userId
        }
      });
    });

    const latest = await prisma.position.findUnique({
      where: { id: current.id },
      include: {
        partnerOrganization: { select: { id: true, name: true } },
        matchingParticipants: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { id: true, name: true, email: true } } } },
        progressLogs: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { id: true, name: true, email: true } } } },
        statusHistories: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { id: true, name: true, email: true } } } }
      }
    });
    if (!latest) return res.status(404).json({ ok: false, message: "position not found" });
    return res.json({ ok: true, item: toPosition(latest), message: "수정 요청이 접수되었습니다. 어드민 관리자 승인 후 반영됩니다." });
  } catch (error) {
    console.error("[partner/positions][update][failed]", {
      positionId: id,
      userId: req.auth?.userId,
      message: getErrorMessage(error)
    });
    return res.status(500).json({ ok: false, message: "failed to update partner position" });
  }
});

// Delete a partner position. Operators can delete any; partners can only
// delete positions owned by their own organization. Cascade handled by
// Prisma onDelete rules in schema.
app.delete("/partner/positions/:id", authenticate, requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid position id" });
  }

  const isOperator = req.auth!.role === MemberRole.OPERATOR;
  const target = await prisma.position.findUnique({
    where: { id },
    select: { id: true, partnerOrganizationId: true }
  });
  if (!target) {
    return res.status(404).json({ ok: false, message: "position not found" });
  }

  if (!isOperator) {
    const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
    if (!affiliation?.organization) {
      return sendAuthError(res, 403, "PARTNER_AFFILIATION_REQUIRED", "partner affiliation is required");
    }
    if (target.partnerOrganizationId !== affiliation.organization.id) {
      return res.status(403).json({ ok: false, message: "포지션 소유자만 삭제할 수 있습니다." });
    }
  }

  try {
    await prisma.position.delete({ where: { id } });
    void writeAuditLog(req, {
      action: isOperator ? "OPS_POSITION_DELETED" : "PARTNER_POSITION_DELETED",
      resource: "position",
      resourceId: id
    });
    return res.json({ ok: true });
  } catch (error) {
    console.error("[partner/positions][delete][failed]", { positionId: id, message: getErrorMessage(error) });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ ok: false, message: "position not found" });
    }
    return res.status(500).json({ ok: false, message: "failed to delete position" });
  }
});

app.get("/ops/position-revisions", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = listPositionRevisionsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsed.error.flatten() });
  }

  const page = parsed.data.page ?? 1;
  const pageSize = parsed.data.pageSize ?? 50;
  const where = parsed.data.status ? { status: parsed.data.status } : {};

  try {
    const [total, items] = await Promise.all([
      prisma.positionRevision.count({ where }),
      prisma.positionRevision.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          position: { select: { id: true, title: true, status: true } },
          partnerOrganization: { select: { id: true, name: true } },
          requestedByUser: { select: { id: true, name: true, email: true } },
          reviewedByUser: { select: { id: true, name: true, email: true } }
        }
      })
    ]);
    return res.json({ ok: true, total, page, pageSize, items });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

app.post("/ops/position-revisions/:id/approve", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ ok: false, message: "invalid revision id" });
  const parsed = reviewPositionRevisionSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const reviewed = await prisma.$transaction(async (tx) => {
      const revision = await tx.positionRevision.findUnique({ where: { id } });
      if (!revision || revision.status !== PositionRevisionStatus.PENDING) return null;

      const current = await tx.position.findUnique({ where: { id: revision.positionId }, select: { status: true, adminMemo: true } });
      if (!current) return null;
      const payload = revision.payload as Record<string, unknown>;

      const updateData: Prisma.PositionUpdateInput = {
        ...(typeof payload.title === "string" ? { title: payload.title } : {}),
        ...(typeof payload.workType === "string" ? { workType: payload.workType } : {}),
        ...(typeof payload.employmentType === "string" ? { employmentType: payload.employmentType as PositionEmploymentType } : {}),
        ...(Array.isArray(payload.thumbnailImages) ? { thumbnailImages: normalizeStringArray(payload.thumbnailImages as string[]).slice(0, 5) } : {}),
        ...(Array.isArray(payload.eligibleVisas) ? { eligibleVisas: normalizeStringArray(payload.eligibleVisas as string[]) } : {}),
        ...(Array.isArray(payload.preferredNationalities) ? { preferredNationalities: normalizeStringArray(payload.preferredNationalities as string[]) } : {}),
        ...(Array.isArray(payload.communicationLanguages) ? { communicationLanguages: normalizeStringArray(payload.communicationLanguages as string[]) } : {}),
        ...(typeof payload.hiringProcess === "string" || payload.hiringProcess === null ? { hiringProcess: payload.hiringProcess as string | null } : {}),
        ...(typeof payload.preferredJobRole === "string" || payload.preferredJobRole === null ? { preferredJobRole: payload.preferredJobRole as string | null } : {}),
        ...(typeof payload.hiringCount === "number" || payload.hiringCount === null ? { hiringCount: payload.hiringCount as number | null } : {}),
        ...(typeof payload.workingHours === "string" || payload.workingHours === null ? { workingHours: payload.workingHours as string | null } : {}),
        ...(typeof payload.workLocation === "string" || payload.workLocation === null ? { workLocation: payload.workLocation as string | null } : {}),
        ...(typeof payload.startDate === "string" || payload.startDate === null
          ? { startDate: payload.startDate ? new Date(payload.startDate as string) : null }
          : {}),
        ...(typeof payload.mainResponsibilities === "string" || payload.mainResponsibilities === null ? { mainResponsibilities: payload.mainResponsibilities as string | null } : {}),
        ...(typeof payload.requiredQualifications === "string" || payload.requiredQualifications === null ? { requiredQualifications: payload.requiredQualifications as string | null } : {}),
        ...(typeof payload.preferredQualifications === "string" || payload.preferredQualifications === null ? { preferredQualifications: payload.preferredQualifications as string | null } : {}),
        ...(typeof payload.dressCode === "string" || payload.dressCode === null ? { dressCode: payload.dressCode as string | null } : {}),
        ...(typeof payload.wantsPreTraining === "boolean" || payload.wantsPreTraining === null ? { wantsPreTraining: payload.wantsPreTraining as boolean | null } : {}),
        ...(typeof payload.additionalNotes === "string" || payload.additionalNotes === null ? { additionalNotes: payload.additionalNotes as string | null } : {}),
        ...(payload.employmentClassification !== undefined
          ? {
              adminMemo: mergeEmploymentClassificationMeta(
                current.adminMemo,
                (payload.employmentClassification as
                  | "UNPAID_INTERN_EXPERIENCE"
                  | "UNPAID_INTERN_CONVERSION"
                  | "PAID_INTERN_EXPERIENCE"
                  | "PAID_INTERN_CONVERSION"
                  | "PART_TIME"
                  | "FULL_TIME"
                  | null
                ) ?? null
              )
            }
          : {}),
        statusHistories: {
          create: {
            fromStatus: current.status,
            toStatus: current.status,
            note: "포지션 수정요청 승인 반영",
            createdByUserId: req.auth!.userId
          }
        }
      };

      const updatedPosition = await tx.position.update({
        where: { id: revision.positionId },
        data: updateData
      });

      const updatedRevision = await tx.positionRevision.update({
        where: { id: revision.id },
        data: {
          status: PositionRevisionStatus.APPROVED,
          reviewNote: parsed.data.note ?? "수정요청 승인",
          reviewedByUserId: req.auth!.userId,
          reviewedAt: new Date()
        }
      });

      return { updatedRevision, updatedPosition };
    });

    if (!reviewed) return res.status(404).json({ ok: false, message: "pending revision not found" });
    void embedAndSavePosition(prisma, reviewed.updatedPosition.id);
    return res.json({ ok: true, item: reviewed.updatedRevision, position: reviewed.updatedPosition });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

app.post("/ops/position-revisions/:id/reject", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ ok: false, message: "invalid revision id" });
  const parsed = reviewPositionRevisionSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const updated = await prisma.positionRevision.updateMany({
      where: { id, status: PositionRevisionStatus.PENDING },
      data: {
        status: PositionRevisionStatus.REJECTED,
        reviewNote: parsed.data.note ?? "수정요청 반려",
        reviewedByUserId: req.auth!.userId,
        reviewedAt: new Date()
      }
    });
    if (updated.count === 0) return res.status(404).json({ ok: false, message: "pending revision not found" });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

app.get("/partner/applicants", authenticate, requireRoles([MemberRole.PARTNER]), async (req, res) => {
  try {
    const result = await listPartnerApplicantsForUser(req.auth!.userId);
    if (!result.affiliation?.organization) {
      return sendAuthError(
        res,
        403,
        "PARTNER_AFFILIATION_REQUIRED",
        "partner affiliation is required. request organization assignment."
      );
    }
    return res.json({
      ok: true,
      items: result.items.map((item) => ({
        id: item.id,
        name: item.name,
        nationality: item.nationality,
        email: item.email,
        positionId: item.positionId,
        positionTitle: item.positionTitle,
        languages: item.languages,
        school: item.school,
        major: item.major,
        residence: item.residence,
        appliedAt: item.appliedAt,
        recommendation: item.recommendation,
        status: item.status
      }))
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

const applicationStatusUpdateSchema = z.object({
  status: z.enum(["SUBMITTED", "INTERVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"]),
  memo: z.string().max(2000).optional()
});

app.get("/members/me/applications", authenticate, requireRoles([MemberRole.STUDENT]), async (req, res) => {
  try {
    const items = await prisma.application.findMany({
      where: { candidateUserId: req.auth!.userId },
      orderBy: { submittedAt: "desc" },
      include: {
        position: {
          select: {
            id: true,
            title: true,
            status: true,
            partnerOrganization: { select: { id: true, name: true } }
          }
        }
      }
    });
    return res.json({
      ok: true,
      items: items.map((a) => ({
        id: a.id,
        positionId: a.positionId,
        positionTitle: a.position.title,
        positionStatus: a.position.status,
        partnerOrganizationId: a.position.partnerOrganization?.id ?? null,
        partnerOrganizationName: a.position.partnerOrganization?.name ?? null,
        status: a.status,
        submittedAt: a.submittedAt,
        updatedAt: a.updatedAt
      }))
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

app.get("/partner/applications", authenticate, requireRoles([MemberRole.PARTNER]), async (req, res) => {
  try {
    const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
    if (!affiliation?.organization) {
      return sendAuthError(res, 403, "PARTNER_AFFILIATION_REQUIRED", "partner affiliation is required.");
    }
    const items = await prisma.application.findMany({
      where: { position: { partnerOrganizationId: affiliation.organization.id } },
      orderBy: { submittedAt: "desc" },
      include: {
        position: { select: { id: true, title: true, status: true } },
        candidateUser: { select: { id: true, name: true, email: true, nationality: true } }
      }
    });
    return res.json({
      ok: true,
      items: items.map((a) => ({
        id: a.id,
        positionId: a.positionId,
        positionTitle: a.position.title,
        candidateUserId: a.candidateUserId,
        candidateName: a.candidateUser.name,
        candidateEmail: a.candidateUser.email,
        candidateNationality: a.candidateUser.nationality,
        status: a.status,
        memo: a.memo,
        submittedAt: a.submittedAt,
        updatedAt: a.updatedAt
      }))
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

const opsListApplicationsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(["SUBMITTED", "INTERVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().refine((v) => [20, 30, 40, 100].includes(v), "pageSize must be one of 20,30,40,100").optional()
});

app.get("/ops/applications", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = opsListApplicationsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsed.error.flatten() });
  }
  const { search, status, page = 1, pageSize = 20 } = parsed.data;

  const where: Prisma.ApplicationWhereInput = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { candidateUser: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
            { candidateUser: { email: { contains: search, mode: Prisma.QueryMode.insensitive } } },
            { position: { title: { contains: search, mode: Prisma.QueryMode.insensitive } } },
            { position: { partnerOrganization: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } } }
          ]
        }
      : {})
  };

  try {
    const [total, items] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          position: {
            select: {
              id: true,
              title: true,
              preferredJobRole: true,
              sourceKind: true,
              sourceProvider: true,
              partnerOrganization: { select: { id: true, name: true } }
            }
          },
          candidateUser: {
            select: {
              id: true,
              name: true,
              email: true,
              nationality: true,
              candidateProfile: { select: { id: true } }
            }
          }
        }
      })
    ]);
    return res.json({
      ok: true,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      items: items.map((a) => ({
        id: a.id,
        positionId: a.positionId,
        positionTitle: a.position.title,
        positionPreferredJobRole: a.position.preferredJobRole,
        positionSourceKind: a.position.sourceKind,
        positionSourceProvider: a.position.sourceProvider,
        partnerOrganizationId: a.position.partnerOrganization?.id ?? null,
        partnerOrganizationName: a.position.partnerOrganization?.name ?? null,
        candidateUserId: a.candidateUserId,
        candidateName: a.candidateUser.name,
        candidateEmail: a.candidateUser.email,
        candidateNationality: a.candidateUser.nationality,
        status: a.status,
        memo: a.memo,
        submittedAt: a.submittedAt,
        updatedAt: a.updatedAt
      }))
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

app.get("/ops/applications/:id", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const applicationId = typeof req.params.id === "string" ? req.params.id : "";
  if (!applicationId) return res.status(400).json({ ok: false, message: "invalid id" });
  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidateUser: {
          select: { id: true, name: true, email: true, phoneNumber: true, nationality: true, affiliation: true, jobTitle: true, role: true, createdAt: true }
        },
        position: {
          select: {
            id: true,
            title: true,
            status: true,
            partnerOrganization: { select: { id: true, name: true } }
          }
        },
        statusHistories: {
          orderBy: { changedAt: "desc" },
          include: { changedBy: { select: { id: true, name: true, email: true, role: true } } }
        },
        interviewSlots: { orderBy: { startsAt: "asc" } },
        assignments: {
          orderBy: { assignedAt: "desc" },
          include: {
            assignedBy: { select: { id: true, name: true } },
            reviewedBy: { select: { id: true, name: true } }
          }
        },
        program: {
          include: {
            meetings: { orderBy: { scheduledAt: "asc" } },
            certificate: true,
            recommendation: true,
            schoolCreditRequest: true
          }
        }
      }
    });
    if (!application) return res.status(404).json({ ok: false, message: "application not found" });
    const issues = await prisma.issueReport.findMany({
      where: { applicationId },
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    });
    return res.json({ ok: true, item: { ...application, issues } });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

app.get("/partner/applications/:id", authenticate, requireRoles([MemberRole.PARTNER]), async (req, res) => {
  const applicationId = typeof req.params.id === "string" ? req.params.id : "";
  if (!applicationId) return res.status(400).json({ ok: false, message: "invalid id" });
  try {
    const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
    if (!affiliation?.organization) {
      return sendAuthError(res, 403, "PARTNER_AFFILIATION_REQUIRED", "partner affiliation is required.");
    }
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidateUser: {
          select: { id: true, name: true, email: true, phoneNumber: true, nationality: true, affiliation: true, jobTitle: true, role: true, createdAt: true }
        },
        position: {
          select: {
            id: true,
            title: true,
            status: true,
            partnerOrganizationId: true,
            partnerOrganization: { select: { id: true, name: true } }
          }
        },
        statusHistories: {
          orderBy: { changedAt: "desc" },
          include: { changedBy: { select: { id: true, name: true, email: true, role: true } } }
        },
        interviewSlots: { orderBy: { startsAt: "asc" } },
        assignments: {
          orderBy: { assignedAt: "desc" },
          include: {
            assignedBy: { select: { id: true, name: true } },
            reviewedBy: { select: { id: true, name: true } }
          }
        },
        program: {
          include: {
            meetings: { orderBy: { scheduledAt: "asc" } },
            certificate: true,
            recommendation: true,
            schoolCreditRequest: true
          }
        }
      }
    });
    if (!application) return res.status(404).json({ ok: false, message: "application not found" });
    if (application.position.partnerOrganizationId !== affiliation.organization.id) {
      return res.status(403).json({ ok: false, message: "forbidden" });
    }
    const issues = await prisma.issueReport.findMany({
      where: { applicationId },
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, name: true, email: true, role: true } }
      }
    });
    return res.json({ ok: true, item: { ...application, issues } });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

app.get("/ops/users/:id", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const userId = typeof req.params.id === "string" ? req.params.id : "";
  if (!userId) return res.status(400).json({ ok: false, message: "invalid id" });
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        partnerOrganization: { select: { id: true, name: true, partnerType: true, industry: true } },
        candidateProfile: true
      }
    });
    if (!user) return res.status(404).json({ ok: false, message: "user not found" });

    const [applications, programs, reportedIssues, subjectIssues] = await Promise.all([
      prisma.application.findMany({
        where: { candidateUserId: userId },
        orderBy: { submittedAt: "desc" },
        include: {
          position: { select: { id: true, title: true, partnerOrganization: { select: { id: true, name: true } } } }
        }
      }),
      prisma.program.findMany({
        where: { application: { candidateUserId: userId } },
        orderBy: { createdAt: "desc" },
        include: { application: { include: { position: { select: { id: true, title: true } } } } }
      }),
      prisma.issueReport.findMany({
        where: { reporterUserId: userId },
        orderBy: { createdAt: "desc" },
        take: 50
      }),
      prisma.issueReport.findMany({
        where: { subjectUserId: userId },
        orderBy: { createdAt: "desc" },
        take: 50
      })
    ]);

    const { passwordHash: _ph, ...safeUser } = user as { passwordHash: string | null } & Record<string, unknown>;
    return res.json({
      ok: true,
      user: safeUser,
      applications: applications.map((a) => ({
        id: a.id,
        positionId: a.positionId,
        positionTitle: a.position.title,
        partnerOrganizationName: a.position.partnerOrganization?.name ?? null,
        status: a.status,
        memo: a.memo,
        submittedAt: a.submittedAt,
        updatedAt: a.updatedAt
      })),
      programs: programs.map((p) => ({
        id: p.id,
        applicationId: p.applicationId,
        status: p.status,
        startsAt: p.startsAt,
        endsAt: p.endsAt,
        positionTitle: p.application.position.title
      })),
      reportedIssues,
      subjectIssues
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

const updateInterviewSlotSchema = z.object({
  status: z.enum(["PROPOSED", "SELECTED", "CANCELLED"])
});

app.patch(
  "/interview-slots/:id/status",
  authenticate,
  requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]),
  async (req, res) => {
    const slotId = typeof req.params.id === "string" ? req.params.id : "";
    if (!slotId) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = updateInterviewSlotSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    try {
      const slot = await prisma.interviewSlot.findUnique({
        where: { id: slotId },
        include: { application: { include: { position: { select: { partnerOrganizationId: true } } } } }
      });
      if (!slot) return res.status(404).json({ ok: false, message: "slot not found" });
      if (req.auth!.role === MemberRole.PARTNER) {
        const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
        if (
          !affiliation?.organization ||
          affiliation.organization.id !== slot.application.position.partnerOrganizationId
        ) {
          return res.status(403).json({ ok: false, message: "forbidden" });
        }
      }
      const data: Record<string, unknown> = { status: parsed.data.status };
      if (parsed.data.status === "CANCELLED") data.cancelledAt = new Date();
      if (parsed.data.status === "SELECTED" && !slot.selectedAt) data.selectedAt = new Date();
      const updated = await prisma.interviewSlot.update({ where: { id: slotId }, data });
      return res.json({ ok: true, item: updated });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

const issueReportTypeEnum = z.enum(["NO_SHOW", "BEHAVIOR", "DROPOUT", "ATTITUDE", "PAYMENT", "OTHER"]);
const issueReportStatusEnum = z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]);

const createIssueReportSchema = z.object({
  type: issueReportTypeEnum,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  subjectUserId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional()
});

const updateIssueReportSchema = z.object({
  status: issueReportStatusEnum.optional(),
  assignedToUserId: z.string().uuid().nullable().optional(),
  resolutionNote: z.string().trim().max(4000).nullable().optional()
});

app.post("/issues", authenticate, requireRoles([MemberRole.STUDENT, MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  const parsed = createIssueReportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }
  try {
    const created = await prisma.issueReport.create({
      data: {
        type: parsed.data.type,
        title: parsed.data.title,
        description: parsed.data.description,
        reporterUserId: req.auth!.userId,
        subjectUserId: parsed.data.subjectUserId ?? null,
        positionId: parsed.data.positionId ?? null,
        applicationId: parsed.data.applicationId ?? null
      }
    });
    void notifyOperators({
      type: "ISSUE_REPORTED",
      title: "새 이슈가 신고되었습니다",
      message: `${parsed.data.title}`,
      linkPath: "/dashboard/ops/operations/issues"
    });
    return res.status(201).json({ ok: true, item: created });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

app.get("/members/me/issues", authenticate, requireRoles([MemberRole.STUDENT, MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  try {
    const items = await prisma.issueReport.findMany({
      where: { reporterUserId: req.auth!.userId },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return res.json({ ok: true, items });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

const listIssuesQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().refine((v) => [20, 30, 40, 100].includes(v), "pageSize must be one of 20,30,40,100").optional()
});

app.get("/ops/issues", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = listIssuesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsed.error.flatten() });
  }
  const { search, status, page = 1, pageSize = 20 } = parsed.data;

  const where: Prisma.IssueReportWhereInput = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: search, mode: Prisma.QueryMode.insensitive } }
          ]
        }
      : {})
  };

  try {
    const [total, items] = await Promise.all([
      prisma.issueReport.count({ where }),
      prisma.issueReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          reporter: { select: { id: true, name: true, email: true, role: true } },
          subject: { select: { id: true, name: true, email: true, role: true } },
          assignedTo: { select: { id: true, name: true, email: true } }
        }
      })
    ]);
    return res.json({
      ok: true,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      items
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

app.patch("/ops/issues/:id", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const issueId = typeof req.params.id === "string" ? req.params.id : "";
  if (!issueId) return res.status(400).json({ ok: false, message: "invalid id" });
  const parsed = updateIssueReportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }
  try {
    const data: Record<string, unknown> = {};
    if (parsed.data.status !== undefined) {
      data.status = parsed.data.status;
      if (parsed.data.status === "RESOLVED" || parsed.data.status === "CLOSED") {
        data.resolvedAt = new Date();
      }
    }
    if (parsed.data.assignedToUserId !== undefined) data.assignedToUserId = parsed.data.assignedToUserId;
    if (parsed.data.resolutionNote !== undefined) data.resolutionNote = parsed.data.resolutionNote;
    const existing = await prisma.issueReport.findUnique({ where: { id: issueId } });
    if (!existing) return res.status(404).json({ ok: false, message: "issue not found" });
    const updated = await prisma.issueReport.update({ where: { id: issueId }, data });
    if (parsed.data.status !== undefined && parsed.data.status !== existing.status) {
      const statusKo: Record<string, string> = {
        OPEN: "신규",
        IN_PROGRESS: "처리 중",
        RESOLVED: "해결",
        CLOSED: "종료"
      };
      void createNotification({
        userId: existing.reporterUserId,
        type: "ISSUE_STATUS_CHANGED",
        title: `신고한 이슈가 '${statusKo[parsed.data.status] ?? parsed.data.status}' 상태로 변경되었습니다`,
        message: parsed.data.resolutionNote ?? existing.title,
        linkPath: existing.reporterUserId ? null : null
      });
    }
    return res.json({ ok: true, item: updated });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2025") {
      return res.status(404).json({ ok: false, message: "issue not found" });
    }
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

// Partner-allowed transitions (operator can move anywhere as override)
const PARTNER_STATUS_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["ACCEPTED", "REJECTED", "SUBMITTED"],
  ACCEPTED: [],
  REJECTED: ["SUBMITTED"],
  WITHDRAWN: []
};

app.patch("/applications/:id/status", authenticate, requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]), async (req, res) => {
  const parsed = applicationStatusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }
  const applicationId = typeof req.params.id === "string" ? req.params.id : "";
  if (!applicationId) {
    return res.status(400).json({ ok: false, message: "invalid id" });
  }
  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { position: { select: { partnerOrganizationId: true } } }
    });
    if (!application) return res.status(404).json({ ok: false, message: "application not found" });

    if (req.auth!.role === MemberRole.PARTNER) {
      const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
      if (!affiliation?.organization || affiliation.organization.id !== application.position.partnerOrganizationId) {
        return res.status(403).json({ ok: false, message: "forbidden" });
      }
      // Partners cannot set WITHDRAWN (student-only) and must follow transitions
      if (parsed.data.status === "WITHDRAWN") {
        return res.status(403).json({ ok: false, message: "WITHDRAWN 상태는 지원자만 설정할 수 있습니다." });
      }
      if (parsed.data.status !== application.status) {
        const allowed = PARTNER_STATUS_TRANSITIONS[application.status] ?? [];
        if (!allowed.includes(parsed.data.status)) {
          return res.status(400).json({
            ok: false,
            message: `'${application.status}' 상태에서 '${parsed.data.status}'로 변경할 수 없습니다.`
          });
        }
      }
    }

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: { status: parsed.data.status, memo: parsed.data.memo ?? application.memo }
    });
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: application.id,
        status: parsed.data.status,
        changedByUserId: req.auth!.userId,
        memo: parsed.data.memo ?? null
      }
    });

    if (parsed.data.status === "ACCEPTED") {
      await prisma.program.upsert({
        where: { applicationId: application.id },
        update: {},
        create: { applicationId: application.id }
      });
    }

    if (parsed.data.status !== application.status) {
      const statusKo: Record<string, string> = {
        SUBMITTED: "검토 중",
        INTERVIEW: "면접 예정",
        ACCEPTED: "합격",
        REJECTED: "불합격",
        WITHDRAWN: "철회"
      };
      void createNotification({
        userId: application.candidateUserId,
        type: "APPLICATION_STATUS_CHANGED",
        title: `지원 상태가 '${statusKo[parsed.data.status] ?? parsed.data.status}'(으)로 변경되었습니다`,
        message: parsed.data.memo ?? null,
        linkPath: "/profile?tab=applied"
      });
    }

    return res.json({ ok: true, item: { id: updated.id, status: updated.status, updatedAt: updated.updatedAt } });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

const interviewSlotItemSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  location: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional()
});

const proposeInterviewSlotsSchema = z.object({
  slots: z.array(interviewSlotItemSchema).min(1).max(5)
});

const createApplicationCommentSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  visibility: z.enum(["INTERNAL", "CANDIDATE"]).optional()
});

async function authorizeApplicationAccess(
  applicationId: string,
  auth: { userId: string; role: MemberRole }
): Promise<{ ok: true; candidateUserId: string; partnerOrganizationId: string | null } | { ok: false; status: number; message: string }> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { position: { select: { partnerOrganizationId: true } } }
  });
  if (!application) return { ok: false, status: 404, message: "application not found" };
  if (auth.role === MemberRole.STUDENT && application.candidateUserId !== auth.userId) {
    return { ok: false, status: 403, message: "forbidden" };
  }
  if (auth.role === MemberRole.PARTNER) {
    const affiliation = await resolvePartnerAffiliation(auth.userId);
    if (!affiliation?.organization || affiliation.organization.id !== application.position.partnerOrganizationId) {
      return { ok: false, status: 403, message: "forbidden" };
    }
  }
  return {
    ok: true,
    candidateUserId: application.candidateUserId,
    partnerOrganizationId: application.position.partnerOrganizationId
  };
}

app.get(
  "/applications/:id/comments",
  authenticate,
  requireRoles([MemberRole.STUDENT, MemberRole.PARTNER, MemberRole.OPERATOR]),
  async (req, res) => {
    const applicationId = typeof req.params.id === "string" ? req.params.id : "";
    if (!applicationId) return res.status(400).json({ ok: false, message: "invalid id" });
    const auth = await authorizeApplicationAccess(applicationId, req.auth!);
    if (!auth.ok) return res.status(auth.status).json({ ok: false, message: auth.message });
    try {
      const where = req.auth!.role === MemberRole.STUDENT
        ? { applicationId, visibility: ApplicationCommentVisibility.CANDIDATE }
        : { applicationId };
      const comments = await prisma.applicationComment.findMany({
        where,
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, email: true, role: true } } }
      });
      return res.json({ ok: true, items: comments });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.post(
  "/applications/:id/comments",
  authenticate,
  requireRoles([MemberRole.STUDENT, MemberRole.PARTNER, MemberRole.OPERATOR]),
  async (req, res) => {
    const applicationId = typeof req.params.id === "string" ? req.params.id : "";
    if (!applicationId) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = createApplicationCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    const auth = await authorizeApplicationAccess(applicationId, req.auth!);
    if (!auth.ok) return res.status(auth.status).json({ ok: false, message: auth.message });
    try {
      const isStudent = req.auth!.role === MemberRole.STUDENT;
      const visibility = isStudent
        ? "CANDIDATE"
        : parsed.data.visibility ?? "INTERNAL";
      const created = await prisma.applicationComment.create({
        data: {
          applicationId,
          authorUserId: req.auth!.userId,
          authorRole: req.auth!.role,
          content: parsed.data.content,
          visibility
        },
        include: { author: { select: { id: true, name: true, email: true, role: true } } }
      });
      if (visibility === "CANDIDATE") {
        if (isStudent) {
          const fullApp = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { position: { include: { partnerOrganization: { include: { users: { where: { role: MemberRole.PARTNER }, select: { id: true } } } } } } }
          });
          const partnerUserIds = fullApp?.position.partnerOrganization?.users.map((u) => u.id) ?? [];
          await Promise.all(partnerUserIds.map((uid) => createNotification({
            userId: uid,
            type: "APPLICATION_COMMENT_FROM_CANDIDATE",
            title: "지원자가 댓글을 남겼습니다",
            message: parsed.data.content.slice(0, 80),
            linkPath: `/dashboard/partner/applicants/${applicationId}`
          })));
        } else {
          void createNotification({
            userId: auth.candidateUserId,
            type: "APPLICATION_COMMENT_FROM_COMPANY",
            title: "회사가 댓글을 남겼습니다",
            message: parsed.data.content.slice(0, 80),
            linkPath: "/profile?tab=applied"
          });
        }
      }
      return res.status(201).json({ ok: true, item: created });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.delete(
  "/application-comments/:id",
  authenticate,
  requireRoles([MemberRole.STUDENT, MemberRole.PARTNER, MemberRole.OPERATOR]),
  async (req, res) => {
    const commentId = typeof req.params.id === "string" ? req.params.id : "";
    if (!commentId) return res.status(400).json({ ok: false, message: "invalid id" });
    try {
      const comment = await prisma.applicationComment.findUnique({ where: { id: commentId } });
      if (!comment) return res.status(404).json({ ok: false, message: "comment not found" });
      const isAuthor = comment.authorUserId === req.auth!.userId;
      const isOperator = req.auth!.role === MemberRole.OPERATOR;
      if (!isAuthor && !isOperator) {
        return res.status(403).json({ ok: false, message: "forbidden" });
      }
      await prisma.applicationComment.delete({ where: { id: commentId } });
      return res.json({ ok: true });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.post(
  "/members/me/applications/:id/withdraw",
  authenticate,
  requireRoles([MemberRole.STUDENT]),
  async (req, res) => {
    const applicationId = typeof req.params.id === "string" ? req.params.id : "";
    if (!applicationId) return res.status(400).json({ ok: false, message: "invalid id" });
    try {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { position: { include: { partnerOrganization: { include: { users: { where: { role: MemberRole.PARTNER }, select: { id: true } } } } } } }
      });
      if (!application) return res.status(404).json({ ok: false, message: "application not found" });
      if (application.candidateUserId !== req.auth!.userId) {
        return res.status(403).json({ ok: false, message: "forbidden" });
      }
      if (application.status === "WITHDRAWN") {
        return res.status(400).json({ ok: false, message: "already withdrawn" });
      }
      if (application.status === "ACCEPTED") {
        return res.status(400).json({ ok: false, message: "cannot withdraw an accepted application" });
      }
      const updated = await prisma.application.update({
        where: { id: applicationId },
        data: { status: "WITHDRAWN", withdrawnAt: new Date() }
      });
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId,
          status: "WITHDRAWN",
          changedByUserId: req.auth!.userId,
          memo: "지원자 본인 철회"
        }
      });
      const partnerUserIds = application.position.partnerOrganization?.users.map((u) => u.id) ?? [];
      await Promise.all(partnerUserIds.map((uid) => createNotification({
        userId: uid,
        type: "APPLICATION_WITHDRAWN",
        title: "지원자가 지원을 철회했습니다",
        message: application.position.title,
        linkPath: `/dashboard/partner/applicants/${applicationId}`
      })));
      return res.json({ ok: true, item: { id: updated.id, status: updated.status, withdrawnAt: updated.withdrawnAt } });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.post(
  "/applications/:id/interview-slots",
  authenticate,
  requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]),
  async (req, res) => {
    const applicationId = typeof req.params.id === "string" ? req.params.id : "";
    if (!applicationId) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = proposeInterviewSlotsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    try {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { position: { select: { partnerOrganizationId: true } } }
      });
      if (!application) return res.status(404).json({ ok: false, message: "application not found" });

      if (req.auth!.role === MemberRole.PARTNER) {
        const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
        if (!affiliation?.organization || affiliation.organization.id !== application.position.partnerOrganizationId) {
          return res.status(403).json({ ok: false, message: "forbidden" });
        }
      }

      if (application.status === "REJECTED" || application.status === "WITHDRAWN") {
        return res.status(400).json({ ok: false, message: "종료된 지원에는 면접 일정을 제안할 수 없습니다." });
      }

      for (const slot of parsed.data.slots) {
        if (new Date(slot.endsAt) <= new Date(slot.startsAt)) {
          return res.status(400).json({ ok: false, message: "endsAt must be after startsAt" });
        }
      }

      const created = await prisma.$transaction(async (tx) => {
        await tx.interviewSlot.updateMany({
          where: { applicationId, status: "PROPOSED" },
          data: { status: "CANCELLED", cancelledAt: new Date() }
        });
        const records = await Promise.all(
          parsed.data.slots.map((slot) =>
            tx.interviewSlot.create({
              data: {
                applicationId,
                startsAt: new Date(slot.startsAt),
                endsAt: new Date(slot.endsAt),
                location: slot.location ?? null,
                notes: slot.notes ?? null
              }
            })
          )
        );
        if (application.status === "SUBMITTED") {
          await tx.application.update({ where: { id: applicationId }, data: { status: "INTERVIEW" } });
          await tx.applicationStatusHistory.create({
            data: {
              applicationId,
              status: "INTERVIEW",
              changedByUserId: req.auth!.userId,
              memo: "면접 일정 제안"
            }
          });
        }
        return records;
      });

      void createNotification({
        userId: application.candidateUserId,
        type: "INTERVIEW_SLOTS_PROPOSED",
        title: "면접 일정이 제안되었습니다",
        message: `${created.length}개의 일정 중 선택해 주세요.`,
        linkPath: "/profile?tab=applied"
      });

      return res.status(201).json({ ok: true, items: created });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/applications/:id/interview-slots",
  authenticate,
  requireRoles([MemberRole.STUDENT, MemberRole.PARTNER, MemberRole.OPERATOR]),
  async (req, res) => {
    const applicationId = typeof req.params.id === "string" ? req.params.id : "";
    if (!applicationId) return res.status(400).json({ ok: false, message: "invalid id" });
    try {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { position: { select: { partnerOrganizationId: true } } }
      });
      if (!application) return res.status(404).json({ ok: false, message: "application not found" });

      if (req.auth!.role === MemberRole.STUDENT && application.candidateUserId !== req.auth!.userId) {
        return res.status(403).json({ ok: false, message: "forbidden" });
      }
      if (req.auth!.role === MemberRole.PARTNER) {
        const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
        if (!affiliation?.organization || affiliation.organization.id !== application.position.partnerOrganizationId) {
          return res.status(403).json({ ok: false, message: "forbidden" });
        }
      }

      const slots = await prisma.interviewSlot.findMany({
        where: { applicationId },
        orderBy: { startsAt: "asc" }
      });
      return res.json({ ok: true, items: slots });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/ops/interview-slots",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (_req, res) => {
    try {
      const slots = await prisma.interviewSlot.findMany({
        orderBy: [{ status: "asc" }, { startsAt: "asc" }],
        take: 300,
        include: {
          application: {
            include: {
              candidateUser: { select: { id: true, name: true, email: true } },
              position: { select: { id: true, title: true, partnerOrganization: { select: { id: true, name: true } } } }
            }
          }
        }
      });
      return res.json({
        ok: true,
        items: slots.map((s) => ({
          id: s.id,
          applicationId: s.applicationId,
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          location: s.location,
          notes: s.notes,
          status: s.status,
          proposedAt: s.proposedAt,
          selectedAt: s.selectedAt,
          cancelledAt: s.cancelledAt,
          candidateName: s.application.candidateUser.name,
          candidateEmail: s.application.candidateUser.email,
          positionTitle: s.application.position.title,
          partnerOrganizationName: s.application.position.partnerOrganization?.name ?? null
        }))
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.patch(
  "/interview-slots/:id/select",
  authenticate,
  requireRoles([MemberRole.STUDENT]),
  async (req, res) => {
    const slotId = typeof req.params.id === "string" ? req.params.id : "";
    if (!slotId) return res.status(400).json({ ok: false, message: "invalid id" });
    try {
      const slot = await prisma.interviewSlot.findUnique({
        where: { id: slotId },
        include: { application: { select: { id: true, candidateUserId: true } } }
      });
      if (!slot) return res.status(404).json({ ok: false, message: "slot not found" });
      if (slot.application.candidateUserId !== req.auth!.userId) {
        return res.status(403).json({ ok: false, message: "forbidden" });
      }
      if (slot.status !== "PROPOSED") {
        return res.status(400).json({ ok: false, message: "slot is not selectable" });
      }
      const updated = await prisma.$transaction(async (tx) => {
        await tx.interviewSlot.updateMany({
          where: { applicationId: slot.application.id, id: { not: slot.id }, status: "PROPOSED" },
          data: { status: "CANCELLED", cancelledAt: new Date() }
        });
        return tx.interviewSlot.update({
          where: { id: slot.id },
          data: { status: "SELECTED", selectedAt: new Date() }
        });
      });

      const fullApp = await prisma.application.findUnique({
        where: { id: slot.application.id },
        include: { position: { include: { partnerOrganization: { include: { users: { where: { role: MemberRole.PARTNER }, select: { id: true } } } } } } }
      });
      const partnerUserIds = fullApp?.position.partnerOrganization?.users.map((u) => u.id) ?? [];
      const slotTime = new Date(updated.startsAt).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
      await Promise.all(partnerUserIds.map((uid) => createNotification({
        userId: uid,
        type: "INTERVIEW_SLOT_SELECTED",
        title: "지원자가 면접 일정을 선택했습니다",
        message: slotTime,
        linkPath: "/dashboard/partner/applicants"
      })));

      return res.json({ ok: true, item: updated });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

const createAssignmentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(8000),
  dueAt: z.string().datetime().optional()
});

const submitAssignmentSchema = z.object({
  submissionContent: z.string().trim().min(1).max(20000),
  submissionLinks: z.array(z.string().url().max(2000)).max(10).optional()
});

const reviewAssignmentSchema = z.object({
  feedbackContent: z.string().trim().min(1).max(8000),
  feedbackRating: z.number().int().min(1).max(5).optional()
});

app.post(
  "/applications/:id/assignments",
  authenticate,
  requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]),
  async (req, res) => {
    const applicationId = typeof req.params.id === "string" ? req.params.id : "";
    if (!applicationId) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = createAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    try {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { position: { select: { partnerOrganizationId: true } } }
      });
      if (!application) return res.status(404).json({ ok: false, message: "application not found" });

      if (req.auth!.role === MemberRole.PARTNER) {
        const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
        if (!affiliation?.organization || affiliation.organization.id !== application.position.partnerOrganizationId) {
          return res.status(403).json({ ok: false, message: "forbidden" });
        }
      }

      const created = await prisma.assignment.create({
        data: {
          applicationId,
          title: parsed.data.title,
          description: parsed.data.description,
          dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
          assignedByUserId: req.auth!.userId
        }
      });
      void createNotification({
        userId: application.candidateUserId,
        type: "ASSIGNMENT_CREATED",
        title: "새 과제가 부여되었습니다",
        message: parsed.data.title,
        linkPath: "/profile/assignments"
      });
      return res.status(201).json({ ok: true, item: created });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/applications/:id/assignments",
  authenticate,
  requireRoles([MemberRole.STUDENT, MemberRole.PARTNER, MemberRole.OPERATOR]),
  async (req, res) => {
    const applicationId = typeof req.params.id === "string" ? req.params.id : "";
    if (!applicationId) return res.status(400).json({ ok: false, message: "invalid id" });
    try {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { position: { select: { partnerOrganizationId: true } } }
      });
      if (!application) return res.status(404).json({ ok: false, message: "application not found" });

      if (req.auth!.role === MemberRole.STUDENT && application.candidateUserId !== req.auth!.userId) {
        return res.status(403).json({ ok: false, message: "forbidden" });
      }
      if (req.auth!.role === MemberRole.PARTNER) {
        const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
        if (!affiliation?.organization || affiliation.organization.id !== application.position.partnerOrganizationId) {
          return res.status(403).json({ ok: false, message: "forbidden" });
        }
      }

      const assignments = await prisma.assignment.findMany({
        where: { applicationId },
        orderBy: { assignedAt: "desc" },
        include: {
          assignedBy: { select: { id: true, name: true } },
          reviewedBy: { select: { id: true, name: true } }
        }
      });
      return res.json({ ok: true, items: assignments });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/members/me/assignments",
  authenticate,
  requireRoles([MemberRole.STUDENT]),
  async (req, res) => {
    try {
      const assignments = await prisma.assignment.findMany({
        where: { application: { candidateUserId: req.auth!.userId } },
        orderBy: { assignedAt: "desc" },
        include: {
          application: {
            include: {
              position: { select: { id: true, title: true, partnerOrganization: { select: { id: true, name: true } } } }
            }
          },
          assignedBy: { select: { id: true, name: true } }
        }
      });
      return res.json({
        ok: true,
        items: assignments.map((a) => ({
          id: a.id,
          applicationId: a.applicationId,
          title: a.title,
          description: a.description,
          dueAt: a.dueAt,
          status: a.status,
          assignedAt: a.assignedAt,
          submittedAt: a.submittedAt,
          submissionContent: a.submissionContent,
          submissionLinks: a.submissionLinks,
          feedbackContent: a.feedbackContent,
          feedbackRating: a.feedbackRating,
          reviewedAt: a.reviewedAt,
          positionId: a.application.position.id,
          positionTitle: a.application.position.title,
          partnerOrganizationName: a.application.position.partnerOrganization?.name ?? null,
          assignedByName: a.assignedBy?.name ?? null
        }))
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.patch(
  "/assignments/:id/submit",
  authenticate,
  requireRoles([MemberRole.STUDENT]),
  async (req, res) => {
    const assignmentId = typeof req.params.id === "string" ? req.params.id : "";
    if (!assignmentId) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = submitAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    try {
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          application: {
            include: {
              position: {
                include: {
                  partnerOrganization: {
                    include: { users: { where: { role: MemberRole.PARTNER }, select: { id: true } } }
                  }
                }
              }
            }
          }
        }
      });
      if (!assignment) return res.status(404).json({ ok: false, message: "assignment not found" });
      if (assignment.application.candidateUserId !== req.auth!.userId) {
        return res.status(403).json({ ok: false, message: "forbidden" });
      }
      if (assignment.status === "CANCELLED") {
        return res.status(400).json({ ok: false, message: "assignment is cancelled" });
      }
      const updated = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          submissionContent: parsed.data.submissionContent,
          submissionLinks: parsed.data.submissionLinks ?? [],
          submittedAt: new Date(),
          status: "SUBMITTED"
        }
      });
      const partnerUserIds = assignment.application.position.partnerOrganization?.users.map((u) => u.id) ?? [];
      await Promise.all(partnerUserIds.map((uid) => createNotification({
        userId: uid,
        type: "ASSIGNMENT_SUBMITTED",
        title: "지원자가 과제를 제출했습니다",
        message: assignment.title,
        linkPath: `/dashboard/partner/applicants/${assignment.applicationId}`
      })));
      return res.json({ ok: true, item: updated });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.patch(
  "/assignments/:id/review",
  authenticate,
  requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]),
  async (req, res) => {
    const assignmentId = typeof req.params.id === "string" ? req.params.id : "";
    if (!assignmentId) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = reviewAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    try {
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: { application: { include: { position: { select: { partnerOrganizationId: true } } } } }
      });
      if (!assignment) return res.status(404).json({ ok: false, message: "assignment not found" });
      if (req.auth!.role === MemberRole.PARTNER) {
        const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
        if (
          !affiliation?.organization ||
          affiliation.organization.id !== assignment.application.position.partnerOrganizationId
        ) {
          return res.status(403).json({ ok: false, message: "forbidden" });
        }
      }
      if (assignment.status === "ASSIGNED") {
        return res.status(400).json({ ok: false, message: "assignment has not been submitted yet" });
      }
      const updated = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          feedbackContent: parsed.data.feedbackContent,
          feedbackRating: parsed.data.feedbackRating ?? null,
          reviewedAt: new Date(),
          reviewedByUserId: req.auth!.userId,
          status: "REVIEWED"
        }
      });
      const application = await prisma.application.findUnique({
        where: { id: assignment.applicationId },
        select: { candidateUserId: true }
      });
      if (application) {
        void createNotification({
          userId: application.candidateUserId,
          type: "ASSIGNMENT_REVIEWED",
          title: "과제에 피드백이 등록되었습니다",
          message: assignment.title,
          linkPath: "/profile/assignments"
        });
      }
      return res.json({ ok: true, item: updated });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/ops/assignments",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (_req, res) => {
    try {
      const items = await prisma.assignment.findMany({
        orderBy: { assignedAt: "desc" },
        take: 300,
        include: {
          application: {
            include: {
              candidateUser: { select: { id: true, name: true, email: true } },
              position: { select: { id: true, title: true, partnerOrganization: { select: { id: true, name: true } } } }
            }
          }
        }
      });
      return res.json({
        ok: true,
        items: items.map((a) => ({
          id: a.id,
          applicationId: a.applicationId,
          title: a.title,
          status: a.status,
          dueAt: a.dueAt,
          assignedAt: a.assignedAt,
          submittedAt: a.submittedAt,
          reviewedAt: a.reviewedAt,
          feedbackRating: a.feedbackRating,
          candidateName: a.application.candidateUser.name,
          candidateEmail: a.application.candidateUser.email,
          positionTitle: a.application.position.title,
          partnerOrganizationName: a.application.position.partnerOrganization?.name ?? null
        }))
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

const programStatusEnum = z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]);
const updateProgramSchema = z.object({
  status: programStatusEnum.optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  notes: z.string().max(8000).nullable().optional()
});
const createProgramMeetingSchema = z.object({
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(5).max(600).optional(),
  agenda: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(500).optional()
});
const updateProgramMeetingSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(5).max(600).optional(),
  agenda: z.string().trim().max(2000).nullable().optional(),
  location: z.string().trim().max(500).nullable().optional(),
  notes: z.string().trim().max(8000).nullable().optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional()
});
const createProgramFeedbackSchema = z.object({
  content: z.string().trim().min(1).max(8000),
  rating: z.number().int().min(1).max(5).optional()
});
const issueCertificateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(8000)
});
const issueRecommendationSchema = z.object({
  content: z.string().trim().min(1).max(8000),
  signerName: z.string().trim().min(1).max(200),
  signerTitle: z.string().trim().max(200).optional()
});
const createSchoolCreditSchema = z.object({
  schoolName: z.string().trim().min(1).max(200),
  courseCode: z.string().trim().max(100).optional(),
  credits: z.number().int().min(0).max(20).optional()
});
const reviewSchoolCreditSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().trim().max(4000).optional()
});

async function authorizeProgramAccess(
  programId: string,
  auth: { userId: string; role: MemberRole }
): Promise<{ ok: true; program: { id: string; applicationId: string; candidateUserId: string; partnerOrganizationId: string | null } } | { ok: false; status: number; message: string }> {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      application: {
        include: { position: { select: { partnerOrganizationId: true } } }
      }
    }
  });
  if (!program) return { ok: false, status: 404, message: "program not found" };
  if (auth.role === MemberRole.STUDENT && program.application.candidateUserId !== auth.userId) {
    return { ok: false, status: 403, message: "forbidden" };
  }
  if (auth.role === MemberRole.PARTNER) {
    const affiliation = await resolvePartnerAffiliation(auth.userId);
    if (!affiliation?.organization || affiliation.organization.id !== program.application.position.partnerOrganizationId) {
      return { ok: false, status: 403, message: "forbidden" };
    }
  }
  return {
    ok: true,
    program: {
      id: program.id,
      applicationId: program.applicationId,
      candidateUserId: program.application.candidateUserId,
      partnerOrganizationId: program.application.position.partnerOrganizationId
    }
  };
}

app.get(
  "/members/me/programs",
  authenticate,
  requireRoles([MemberRole.STUDENT]),
  async (req, res) => {
    try {
      const programs = await prisma.program.findMany({
        where: { application: { candidateUserId: req.auth!.userId } },
        orderBy: { createdAt: "desc" },
        include: {
          application: {
            include: {
              position: { select: { id: true, title: true, partnerOrganization: { select: { id: true, name: true } } } }
            }
          },
          meetings: { orderBy: { scheduledAt: "asc" } },
          feedbacks: { orderBy: { createdAt: "desc" }, include: { author: { select: { id: true, name: true, role: true } } } },
          certificate: true,
          recommendation: true,
          schoolCreditRequest: true
        }
      });
      return res.json({ ok: true, items: programs });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/partner/programs",
  authenticate,
  requireRoles([MemberRole.PARTNER]),
  async (req, res) => {
    try {
      const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
      if (!affiliation?.organization) {
        return sendAuthError(res, 403, "PARTNER_AFFILIATION_REQUIRED", "partner affiliation is required.");
      }
      const programs = await prisma.program.findMany({
        where: { application: { position: { partnerOrganizationId: affiliation.organization.id } } },
        orderBy: { createdAt: "desc" },
        include: {
          application: {
            include: {
              candidateUser: { select: { id: true, name: true, email: true } },
              position: { select: { id: true, title: true } }
            }
          },
          meetings: { orderBy: { scheduledAt: "asc" } },
          feedbacks: { orderBy: { createdAt: "desc" }, include: { author: { select: { id: true, name: true, role: true } } } },
          certificate: true,
          recommendation: true,
          schoolCreditRequest: true
        }
      });
      return res.json({ ok: true, items: programs });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/partner/interviews",
  authenticate,
  requireRoles([MemberRole.PARTNER]),
  async (req, res) => {
    try {
      const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
      if (!affiliation?.organization) {
        return sendAuthError(res, 403, "PARTNER_AFFILIATION_REQUIRED", "partner affiliation is required.");
      }
      const slots = await prisma.interviewSlot.findMany({
        where: { application: { position: { partnerOrganizationId: affiliation.organization.id } } },
        orderBy: [{ status: "asc" }, { startsAt: "asc" }],
        take: 300,
        include: {
          application: {
            include: {
              candidateUser: { select: { id: true, name: true, email: true } },
              position: { select: { id: true, title: true } }
            }
          }
        }
      });
      return res.json({
        ok: true,
        items: slots.map((s) => ({
          id: s.id,
          applicationId: s.applicationId,
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          location: s.location,
          notes: s.notes,
          status: s.status,
          proposedAt: s.proposedAt,
          selectedAt: s.selectedAt,
          cancelledAt: s.cancelledAt,
          candidateName: s.application.candidateUser.name,
          candidateEmail: s.application.candidateUser.email,
          positionTitle: s.application.position.title
        }))
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/partner/assignments",
  authenticate,
  requireRoles([MemberRole.PARTNER]),
  async (req, res) => {
    try {
      const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
      if (!affiliation?.organization) {
        return sendAuthError(res, 403, "PARTNER_AFFILIATION_REQUIRED", "partner affiliation is required.");
      }
      const items = await prisma.assignment.findMany({
        where: { application: { position: { partnerOrganizationId: affiliation.organization.id } } },
        orderBy: { assignedAt: "desc" },
        take: 300,
        include: {
          application: {
            include: {
              candidateUser: { select: { id: true, name: true, email: true } },
              position: { select: { id: true, title: true } }
            }
          }
        }
      });
      return res.json({
        ok: true,
        items: items.map((a) => ({
          id: a.id,
          applicationId: a.applicationId,
          title: a.title,
          status: a.status,
          dueAt: a.dueAt,
          assignedAt: a.assignedAt,
          submittedAt: a.submittedAt,
          reviewedAt: a.reviewedAt,
          feedbackRating: a.feedbackRating,
          candidateName: a.application.candidateUser.name,
          candidateEmail: a.application.candidateUser.email,
          positionTitle: a.application.position.title
        }))
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/partner/issues",
  authenticate,
  requireRoles([MemberRole.PARTNER]),
  async (req, res) => {
    try {
      const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
      if (!affiliation?.organization) {
        return sendAuthError(res, 403, "PARTNER_AFFILIATION_REQUIRED", "partner affiliation is required.");
      }
      const partnerUserIds = await prisma.user.findMany({
        where: { partnerOrganizationId: affiliation.organization.id },
        select: { id: true }
      });
      const userIds = partnerUserIds.map((u) => u.id);
      const partnerApplications = await prisma.application.findMany({
        where: { position: { partnerOrganizationId: affiliation.organization.id } },
        select: { id: true }
      });
      const applicationIds = partnerApplications.map((a) => a.id);
      const items = await prisma.issueReport.findMany({
        where: {
          OR: [
            { reporterUserId: { in: userIds } },
            { applicationId: { in: applicationIds } }
          ]
        },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          reporter: { select: { id: true, name: true, email: true, role: true } },
          subject: { select: { id: true, name: true, email: true, role: true } },
          assignedTo: { select: { id: true, name: true, email: true } }
        }
      });
      return res.json({ ok: true, items });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/partner/team",
  authenticate,
  requireRoles([MemberRole.PARTNER]),
  async (req, res) => {
    try {
      const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
      if (!affiliation?.organization) {
        return sendAuthError(res, 403, "PARTNER_AFFILIATION_REQUIRED", "partner affiliation is required.");
      }
      const members = await prisma.user.findMany({
        where: { partnerOrganizationId: affiliation.organization.id },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          jobTitle: true,
          partnerOrgRole: true,
          emailVerified: true,
          createdAt: true
        }
      });
      return res.json({
        ok: true,
        items: members,
        organizationId: affiliation.organization.id,
        myUserId: req.auth!.userId,
        myOrgRole: affiliation.user.partnerOrgRole
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

const updateTeamMemberRoleSchema = z.object({
  partnerOrgRole: z.enum(["OWNER", "ADMIN", "MEMBER"])
});

app.patch(
  "/partner/team/:id/role",
  authenticate,
  requireRoles([MemberRole.PARTNER]),
  async (req, res) => {
    const memberUserId = typeof req.params.id === "string" ? req.params.id : "";
    if (!memberUserId) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = updateTeamMemberRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    try {
      const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
      if (!affiliation?.organization) {
        return sendAuthError(res, 403, "PARTNER_AFFILIATION_REQUIRED", "partner affiliation is required.");
      }
      if (affiliation.user.partnerOrgRole !== "OWNER" && affiliation.user.partnerOrgRole !== "ADMIN") {
        return res.status(403).json({ ok: false, message: "only OWNER or ADMIN can change roles" });
      }
      const target = await prisma.user.findUnique({
        where: { id: memberUserId },
        select: { id: true, partnerOrganizationId: true, partnerOrgRole: true }
      });
      if (!target || target.partnerOrganizationId !== affiliation.organization.id) {
        return res.status(404).json({ ok: false, message: "member not found in this organization" });
      }
      if (target.id === req.auth!.userId && parsed.data.partnerOrgRole !== "OWNER") {
        return res.status(400).json({ ok: false, message: "you cannot demote yourself" });
      }
      const updated = await prisma.user.update({
        where: { id: memberUserId },
        data: { partnerOrgRole: parsed.data.partnerOrgRole },
        select: { id: true, name: true, email: true, partnerOrgRole: true }
      });
      return res.json({ ok: true, item: updated });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.delete(
  "/partner/team/:id",
  authenticate,
  requireRoles([MemberRole.PARTNER]),
  async (req, res) => {
    const memberUserId = typeof req.params.id === "string" ? req.params.id : "";
    if (!memberUserId) return res.status(400).json({ ok: false, message: "invalid id" });
    try {
      const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
      if (!affiliation?.organization) {
        return sendAuthError(res, 403, "PARTNER_AFFILIATION_REQUIRED", "partner affiliation is required.");
      }
      if (affiliation.user.partnerOrgRole !== "OWNER" && affiliation.user.partnerOrgRole !== "ADMIN") {
        return res.status(403).json({ ok: false, message: "only OWNER or ADMIN can remove members" });
      }
      if (memberUserId === req.auth!.userId) {
        return res.status(400).json({ ok: false, message: "you cannot remove yourself" });
      }
      const target = await prisma.user.findUnique({
        where: { id: memberUserId },
        select: { id: true, partnerOrganizationId: true, partnerOrgRole: true }
      });
      if (!target || target.partnerOrganizationId !== affiliation.organization.id) {
        return res.status(404).json({ ok: false, message: "member not found in this organization" });
      }
      const updated = await prisma.user.update({
        where: { id: memberUserId },
        data: { partnerOrganizationId: null, partnerOrgRole: null }
      });
      return res.json({ ok: true, item: { id: updated.id } });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/partner/reports",
  authenticate,
  requireRoles([MemberRole.PARTNER]),
  async (req, res) => {
    try {
      const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
      if (!affiliation?.organization) {
        return sendAuthError(res, 403, "PARTNER_AFFILIATION_REQUIRED", "partner affiliation is required.");
      }
      const orgId = affiliation.organization.id;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [
        positionRows,
        positionsLast7,
        applicationRows,
        applicationsLast7,
        programRows,
        certificatesCount,
        recommendationsCount
      ] = await Promise.all([
        prisma.position.groupBy({
          by: ["status"],
          where: { partnerOrganizationId: orgId },
          _count: { _all: true }
        }),
        prisma.position.count({ where: { partnerOrganizationId: orgId, createdAt: { gte: sevenDaysAgo } } }),
        prisma.application.groupBy({
          by: ["status"],
          where: { position: { partnerOrganizationId: orgId } },
          _count: { _all: true }
        }),
        prisma.application.count({
          where: { position: { partnerOrganizationId: orgId }, submittedAt: { gte: sevenDaysAgo } }
        }),
        prisma.program.groupBy({
          by: ["status"],
          where: { application: { position: { partnerOrganizationId: orgId } } },
          _count: { _all: true }
        }),
        prisma.certificate.count({
          where: { program: { application: { position: { partnerOrganizationId: orgId } } } }
        }),
        prisma.recommendation.count({
          where: { program: { application: { position: { partnerOrganizationId: orgId } } } }
        })
      ]);

      function tally(rows: Array<Record<string, unknown>>, key: string, keys: string[]) {
        const acc: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));
        for (const row of rows) {
          const k = String(row[key]);
          const c = (row as { _count?: { _all?: number } })._count?._all ?? 0;
          if (k in acc) acc[k] = c;
        }
        return acc;
      }

      return res.json({
        ok: true,
        stats: {
          positions: {
            byStatus: tally(
              positionRows as unknown as Array<Record<string, unknown>>,
              "status",
              ["DRAFT", "PENDING_REVIEW", "OPEN", "PAUSED", "CLOSED", "REJECTED"]
            ),
            last7Days: positionsLast7
          },
          applications: {
            byStatus: tally(
              applicationRows as unknown as Array<Record<string, unknown>>,
              "status",
              ["SUBMITTED", "INTERVIEW", "ACCEPTED", "REJECTED"]
            ),
            last7Days: applicationsLast7
          },
          programs: {
            byStatus: tally(
              programRows as unknown as Array<Record<string, unknown>>,
              "status",
              ["ACTIVE", "COMPLETED", "CANCELLED"]
            )
          },
          artifacts: {
            certificates: certificatesCount,
            recommendations: recommendationsCount
          }
        }
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/partner/reports/positions",
  authenticate,
  requireRoles([MemberRole.PARTNER]),
  async (req, res) => {
    try {
      const affiliation = await resolvePartnerAffiliation(req.auth!.userId);
      if (!affiliation?.organization) {
        return sendAuthError(res, 403, "PARTNER_AFFILIATION_REQUIRED", "partner affiliation is required.");
      }
      const orgId = affiliation.organization.id;
      const positions = await prisma.position.findMany({
        where: { partnerOrganizationId: orgId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          _count: { select: { applications: true } }
        }
      });
      const positionIds = positions.map((p) => p.id);
      const appCounts = await prisma.application.groupBy({
        by: ["positionId", "status"],
        where: { positionId: { in: positionIds } },
        _count: { _all: true }
      });
      const byPosition: Record<string, { SUBMITTED: number; INTERVIEW: number; ACCEPTED: number; REJECTED: number; WITHDRAWN: number }> = {};
      for (const row of appCounts) {
        if (!byPosition[row.positionId]) {
          byPosition[row.positionId] = { SUBMITTED: 0, INTERVIEW: 0, ACCEPTED: 0, REJECTED: 0, WITHDRAWN: 0 };
        }
        byPosition[row.positionId][row.status] = row._count._all;
      }
      return res.json({
        ok: true,
        items: positions.map((p) => {
          const counts = byPosition[p.id] ?? { SUBMITTED: 0, INTERVIEW: 0, ACCEPTED: 0, REJECTED: 0, WITHDRAWN: 0 };
          const total = counts.SUBMITTED + counts.INTERVIEW + counts.ACCEPTED + counts.REJECTED;
          const conversionRate = total > 0 ? Math.round((counts.ACCEPTED / total) * 1000) / 10 : 0;
          return {
            id: p.id,
            title: p.title,
            status: p.status,
            createdAt: p.createdAt,
            applicationsTotal: total,
            byStatus: counts,
            acceptanceRate: conversionRate
          };
        })
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/ops/programs",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (_req, res) => {
    try {
      const programs = await prisma.program.findMany({
        orderBy: { createdAt: "desc" },
        take: 300,
        include: {
          application: {
            include: {
              candidateUser: { select: { id: true, name: true, email: true } },
              position: { select: { id: true, title: true, partnerOrganization: { select: { id: true, name: true } } } }
            }
          },
          certificate: true,
          recommendation: true,
          schoolCreditRequest: true
        }
      });
      return res.json({
        ok: true,
        items: programs.map((p) => ({
          id: p.id,
          applicationId: p.applicationId,
          status: p.status,
          startsAt: p.startsAt,
          endsAt: p.endsAt,
          candidateName: p.application.candidateUser.name,
          candidateEmail: p.application.candidateUser.email,
          positionTitle: p.application.position.title,
          partnerOrganizationName: p.application.position.partnerOrganization?.name ?? null,
          hasCertificate: Boolean(p.certificate),
          hasRecommendation: Boolean(p.recommendation),
          schoolCreditStatus: p.schoolCreditRequest?.status ?? null
        }))
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/programs/:id",
  authenticate,
  requireRoles([MemberRole.STUDENT, MemberRole.PARTNER, MemberRole.OPERATOR]),
  async (req, res) => {
    const programId = typeof req.params.id === "string" ? req.params.id : "";
    if (!programId) return res.status(400).json({ ok: false, message: "invalid id" });
    const auth = await authorizeProgramAccess(programId, req.auth!);
    if (!auth.ok) return res.status(auth.status).json({ ok: false, message: auth.message });
    try {
      const program = await prisma.program.findUnique({
        where: { id: programId },
        include: {
          application: {
            include: {
              candidateUser: { select: { id: true, name: true, email: true } },
              position: { select: { id: true, title: true, partnerOrganization: { select: { id: true, name: true } } } }
            }
          },
          meetings: { orderBy: { scheduledAt: "asc" } },
          feedbacks: { orderBy: { createdAt: "desc" }, include: { author: { select: { id: true, name: true, role: true } } } },
          certificate: true,
          recommendation: true,
          schoolCreditRequest: true
        }
      });
      return res.json({ ok: true, item: program });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.patch(
  "/programs/:id",
  authenticate,
  requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]),
  async (req, res) => {
    const programId = typeof req.params.id === "string" ? req.params.id : "";
    if (!programId) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = updateProgramSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    const auth = await authorizeProgramAccess(programId, req.auth!);
    if (!auth.ok) return res.status(auth.status).json({ ok: false, message: auth.message });
    try {
      const data: Record<string, unknown> = {};
      if (parsed.data.status !== undefined) data.status = parsed.data.status;
      if (parsed.data.startsAt !== undefined) data.startsAt = new Date(parsed.data.startsAt);
      if (parsed.data.endsAt !== undefined) data.endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null;
      if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
      const updated = await prisma.program.update({ where: { id: programId }, data });
      return res.json({ ok: true, item: updated });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.post(
  "/programs/:id/meetings",
  authenticate,
  requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]),
  async (req, res) => {
    const programId = typeof req.params.id === "string" ? req.params.id : "";
    if (!programId) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = createProgramMeetingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    const auth = await authorizeProgramAccess(programId, req.auth!);
    if (!auth.ok) return res.status(auth.status).json({ ok: false, message: auth.message });
    try {
      const created = await prisma.programMeeting.create({
        data: {
          programId,
          scheduledAt: new Date(parsed.data.scheduledAt),
          durationMinutes: parsed.data.durationMinutes ?? 30,
          agenda: parsed.data.agenda ?? null,
          location: parsed.data.location ?? null
        }
      });
      return res.status(201).json({ ok: true, item: created });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.patch(
  "/program-meetings/:id",
  authenticate,
  requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]),
  async (req, res) => {
    const meetingId = typeof req.params.id === "string" ? req.params.id : "";
    if (!meetingId) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = updateProgramMeetingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    try {
      const meeting = await prisma.programMeeting.findUnique({ where: { id: meetingId } });
      if (!meeting) return res.status(404).json({ ok: false, message: "meeting not found" });
      const auth = await authorizeProgramAccess(meeting.programId, req.auth!);
      if (!auth.ok) return res.status(auth.status).json({ ok: false, message: auth.message });
      const data: Record<string, unknown> = {};
      if (parsed.data.scheduledAt !== undefined) data.scheduledAt = new Date(parsed.data.scheduledAt);
      if (parsed.data.durationMinutes !== undefined) data.durationMinutes = parsed.data.durationMinutes;
      if (parsed.data.agenda !== undefined) data.agenda = parsed.data.agenda;
      if (parsed.data.location !== undefined) data.location = parsed.data.location;
      if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
      if (parsed.data.status !== undefined) data.status = parsed.data.status;
      const updated = await prisma.programMeeting.update({ where: { id: meetingId }, data });
      return res.json({ ok: true, item: updated });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.post(
  "/programs/:id/feedbacks",
  authenticate,
  requireRoles([MemberRole.STUDENT, MemberRole.PARTNER, MemberRole.OPERATOR]),
  async (req, res) => {
    const programId = typeof req.params.id === "string" ? req.params.id : "";
    if (!programId) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = createProgramFeedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    const auth = await authorizeProgramAccess(programId, req.auth!);
    if (!auth.ok) return res.status(auth.status).json({ ok: false, message: auth.message });
    try {
      const created = await prisma.programFeedback.create({
        data: {
          programId,
          authorUserId: req.auth!.userId,
          authorRole: req.auth!.role,
          content: parsed.data.content,
          rating: parsed.data.rating ?? null
        }
      });
      return res.status(201).json({ ok: true, item: created });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.put(
  "/programs/:id/certificate",
  authenticate,
  requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]),
  async (req, res) => {
    const programId = typeof req.params.id === "string" ? req.params.id : "";
    if (!programId) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = issueCertificateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    const auth = await authorizeProgramAccess(programId, req.auth!);
    if (!auth.ok) return res.status(auth.status).json({ ok: false, message: auth.message });
    try {
      const cert = await prisma.certificate.upsert({
        where: { programId },
        update: { title: parsed.data.title, content: parsed.data.content, issuedByUserId: req.auth!.userId, issuedAt: new Date() },
        create: { programId, title: parsed.data.title, content: parsed.data.content, issuedByUserId: req.auth!.userId }
      });
      const programInfo = await prisma.program.findUnique({
        where: { id: programId },
        select: { application: { select: { candidateUserId: true } } }
      });
      if (programInfo) {
        void createNotification({
          userId: programInfo.application.candidateUserId,
          type: "CERTIFICATE_ISSUED",
          title: "수료증이 발급되었습니다",
          message: parsed.data.title,
          linkPath: `/profile/programs/${programId}`
        });
      }
      return res.json({ ok: true, item: cert });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.put(
  "/programs/:id/recommendation",
  authenticate,
  requireRoles([MemberRole.PARTNER, MemberRole.OPERATOR]),
  async (req, res) => {
    const programId = typeof req.params.id === "string" ? req.params.id : "";
    if (!programId) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = issueRecommendationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    const auth = await authorizeProgramAccess(programId, req.auth!);
    if (!auth.ok) return res.status(auth.status).json({ ok: false, message: auth.message });
    try {
      const rec = await prisma.recommendation.upsert({
        where: { programId },
        update: {
          content: parsed.data.content,
          signerName: parsed.data.signerName,
          signerTitle: parsed.data.signerTitle ?? null,
          issuedByUserId: req.auth!.userId,
          issuedAt: new Date()
        },
        create: {
          programId,
          content: parsed.data.content,
          signerName: parsed.data.signerName,
          signerTitle: parsed.data.signerTitle ?? null,
          issuedByUserId: req.auth!.userId
        }
      });
      const programInfo = await prisma.program.findUnique({
        where: { id: programId },
        select: { application: { select: { candidateUserId: true } } }
      });
      if (programInfo) {
        void createNotification({
          userId: programInfo.application.candidateUserId,
          type: "RECOMMENDATION_ISSUED",
          title: "추천서가 발급되었습니다",
          message: `${parsed.data.signerName}님이 추천서를 작성했어요.`,
          linkPath: `/profile/programs/${programId}`
        });
      }
      return res.json({ ok: true, item: rec });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.post(
  "/programs/:id/school-credit",
  authenticate,
  requireRoles([MemberRole.STUDENT]),
  async (req, res) => {
    const programId = typeof req.params.id === "string" ? req.params.id : "";
    if (!programId) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = createSchoolCreditSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    const auth = await authorizeProgramAccess(programId, req.auth!);
    if (!auth.ok) return res.status(auth.status).json({ ok: false, message: auth.message });
    try {
      const result = await prisma.schoolCreditRequest.upsert({
        where: { programId },
        update: {
          schoolName: parsed.data.schoolName,
          courseCode: parsed.data.courseCode ?? null,
          credits: parsed.data.credits ?? 0,
          status: "REQUESTED",
          requestedAt: new Date(),
          reviewedAt: null,
          reviewedByUserId: null,
          reviewNote: null
        },
        create: {
          programId,
          schoolName: parsed.data.schoolName,
          courseCode: parsed.data.courseCode ?? null,
          credits: parsed.data.credits ?? 0
        }
      });
      void notifyOperators({
        type: "SCHOOL_CREDIT_REQUESTED",
        title: "학점 인정 요청이 접수되었습니다",
        message: `${parsed.data.schoolName} · ${parsed.data.credits ?? 0}학점`,
        linkPath: "/dashboard/ops/operations/school-credit"
      });
      return res.json({ ok: true, item: result });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/ops/school-credit-requests",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (_req, res) => {
    try {
      const items = await prisma.schoolCreditRequest.findMany({
        orderBy: { requestedAt: "desc" },
        take: 300,
        include: {
          program: {
            include: {
              application: {
                include: {
                  candidateUser: { select: { id: true, name: true, email: true, affiliation: true } },
                  position: { select: { id: true, title: true, partnerOrganization: { select: { id: true, name: true } } } }
                }
              }
            }
          },
          reviewedBy: { select: { id: true, name: true } }
        }
      });
      return res.json({
        ok: true,
        items: items.map((r) => ({
          id: r.id,
          programId: r.programId,
          schoolName: r.schoolName,
          courseCode: r.courseCode,
          credits: r.credits,
          status: r.status,
          requestedAt: r.requestedAt,
          reviewedAt: r.reviewedAt,
          reviewNote: r.reviewNote,
          reviewedByName: r.reviewedBy?.name ?? null,
          candidateName: r.program.application.candidateUser.name,
          candidateEmail: r.program.application.candidateUser.email,
          candidateAffiliation: r.program.application.candidateUser.affiliation,
          positionTitle: r.program.application.position.title,
          partnerOrganizationName: r.program.application.position.partnerOrganization?.name ?? null
        }))
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.patch(
  "/ops/school-credit-requests/:id",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (req, res) => {
    const requestId = typeof req.params.id === "string" ? req.params.id : "";
    if (!requestId) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = reviewSchoolCreditSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    try {
      const updated = await prisma.schoolCreditRequest.update({
        where: { id: requestId },
        data: {
          status: parsed.data.status,
          reviewNote: parsed.data.reviewNote ?? null,
          reviewedAt: new Date(),
          reviewedByUserId: req.auth!.userId
        }
      });
      const programInfo = await prisma.program.findUnique({
        where: { id: updated.programId },
        select: { id: true, application: { select: { candidateUserId: true } } }
      });
      if (programInfo) {
        void createNotification({
          userId: programInfo.application.candidateUserId,
          type: "SCHOOL_CREDIT_REVIEWED",
          title: `학점 인정 요청이 ${parsed.data.status === "APPROVED" ? "승인" : "반려"}되었습니다`,
          message: parsed.data.reviewNote ?? null,
          linkPath: `/profile/programs/${programInfo.id}`
        });
      }
      return res.json({ ok: true, item: updated });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2025") {
        return res.status(404).json({ ok: false, message: "request not found" });
      }
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/ops/matching-stats",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (_req, res) => {
    try {
      const [applicationCounts, programCount, completedProgramCount, openSchoolCreditCount, recentApplications] = await Promise.all([
        prisma.application.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.program.count({ where: { status: "ACTIVE" } }),
        prisma.program.count({ where: { status: "COMPLETED" } }),
        prisma.schoolCreditRequest.count({ where: { status: "REQUESTED" } }),
        prisma.application.count({ where: { submittedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } })
      ]);
      const byStatus: Record<string, number> = { SUBMITTED: 0, INTERVIEW: 0, ACCEPTED: 0, REJECTED: 0 };
      for (const row of applicationCounts) {
        byStatus[row.status] = row._count._all;
      }
      return res.json({
        ok: true,
        stats: {
          applications: byStatus,
          activePrograms: programCount,
          completedPrograms: completedProgramCount,
          openSchoolCreditRequests: openSchoolCreditCount,
          applicationsLast7Days: recentApplications
        }
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

// Stale-unverified housekeeping — list + wipe for accounts that signed up
// >7 days ago and never verified their email. These are the spam/bot signups
// the team's been seeing in the Discord webhook; they can never log in (the
// /auth/login path enforces emailVerified) so deleting them is safe.

const STALE_UNVERIFIED_AGE_MS = 7 * 24 * 60 * 60 * 1000;

app.get(
  "/ops/stale-unverified",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (_req, res) => {
    const threshold = new Date(Date.now() - STALE_UNVERIFIED_AGE_MS);
    const where: Prisma.UserWhereInput = {
      emailVerified: false,
      createdAt: { lt: threshold }
    };
    try {
      const [count, sample] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          take: 20,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            email: true,
            name: true,
            authProvider: true,
            createdAt: true,
            signupIp: true,
            signupUserAgent: true,
            signupReferer: true
          }
        })
      ]);
      return res.json({
        ok: true,
        count,
        thresholdDays: 7,
        sample
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

const wipeStaleUnverifiedSchema = z.object({
  confirm: z.literal("DELETE")
});

app.post(
  "/ops/stale-unverified/wipe",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (req, res) => {
    const parsed = wipeStaleUnverifiedSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: 'confirm: "DELETE" required' });
    }
    const threshold = new Date(Date.now() - STALE_UNVERIFIED_AGE_MS);
    try {
      const result = await prisma.user.deleteMany({
        where: {
          emailVerified: false,
          createdAt: { lt: threshold }
        }
      });
      void writeAuditLog(req, {
        action: "OPS_STALE_UNVERIFIED_WIPE",
        resource: "user",
        resourceId: null,
        metadata: {
          deletedCount: result.count,
          thresholdDays: 7,
          callerId: req.auth!.userId
        }
      });
      return res.json({ ok: true, deletedCount: result.count });
    } catch (error) {
      console.error("[ops/stale-unverified/wipe] failed", error);
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

const updateUserRoleSchema = z.object({
  role: z.enum(["STUDENT", "PARTNER", "OPERATOR"])
});

app.patch(
  "/ops/users/:id/role",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (req, res) => {
    const userId = typeof req.params.id === "string" ? req.params.id : "";
    if (!userId) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = updateUserRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    if (userId === req.auth!.userId && parsed.data.role !== MemberRole.OPERATOR) {
      return res.status(400).json({ ok: false, message: "operator cannot demote themselves" });
    }
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: parsed.data.role },
        select: { id: true, email: true, name: true, role: true }
      });
      void writeAuditLog(req, {
        action: "USER_ROLE_CHANGED",
        resource: "user",
        resourceId: userId,
        metadata: { newRole: parsed.data.role }
      });
      return res.json({ ok: true, item: updated });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2025") {
        return res.status(404).json({ ok: false, message: "user not found" });
      }
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.delete(
  "/members/me/account",
  authenticate,
  async (req, res) => {
    const userId = req.auth!.userId;
    const reauthToken = typeof req.headers["x-reauth-token"] === "string"
      ? req.headers["x-reauth-token"]
      : Array.isArray(req.headers["x-reauth-token"])
        ? req.headers["x-reauth-token"][0]
        : "";
    if (!reauthToken || !verifyReauthToken(reauthToken, userId, "delete_account")) {
      return res.status(401).json({ ok: false, code: "REAUTH_REQUIRED", message: "reauthentication required" });
    }
    try {
      // Self-delete cascades to all related data via onDelete: Cascade in schema
      await prisma.user.delete({ where: { id: userId } });
      clearRefreshTokenCookie(res);
      void writeAuditLog(req, {
        action: "USER_SELF_DELETED",
        resource: "user",
        resourceId: userId
      });
      return res.json({ ok: true });
    } catch (error) {
      console.error("[account-delete] failed", error);
      return res.status(500).json({ ok: false, message: "탈퇴 처리 중 오류가 발생했습니다." });
    }
  }
);

app.post(
  "/ops/notifications/cleanup",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (req, res) => {
    try {
      const daysParsed = Number.parseInt(typeof req.body?.olderThanDays === "number" ? String(req.body.olderThanDays) : "90", 10);
      const days = Number.isFinite(daysParsed) && daysParsed >= 7 ? daysParsed : 90;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const result = await prisma.notification.deleteMany({
        where: { readAt: { not: null, lt: cutoff } }
      });
      void writeAuditLog(req, {
        action: "NOTIFICATIONS_CLEANED",
        resource: "notification",
        metadata: { days, deleted: result.count }
      });
      return res.json({ ok: true, deleted: result.count, days });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/ops/audit-logs",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (req, res) => {
    try {
      const action = typeof req.query.action === "string" ? req.query.action : undefined;
      const resource = typeof req.query.resource === "string" ? req.query.resource : undefined;
      const limit = Math.min(
        500,
        Math.max(10, Number.parseInt(typeof req.query.limit === "string" ? req.query.limit : "100", 10) || 100)
      );
      const items = await prisma.auditLog.findMany({
        where: {
          ...(action ? { action } : {}),
          ...(resource ? { resource } : {})
        },
        orderBy: { createdAt: "desc" },
        take: limit
      });
      const actorIds = Array.from(new Set(items.map((it) => it.actorUserId).filter((id): id is string => Boolean(id))));
      const actors = actorIds.length
        ? await prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: { id: true, name: true, email: true, role: true }
          })
        : [];
      const actorById = new Map(actors.map((u) => [u.id, u]));
      return res.json({
        ok: true,
        items: items.map((it) => ({
          id: it.id,
          action: it.action,
          resource: it.resource,
          resourceId: it.resourceId,
          metadata: it.metadata,
          ipAddress: it.ipAddress,
          createdAt: it.createdAt,
          actor: it.actorUserId ? actorById.get(it.actorUserId) ?? null : null,
          actorRole: it.actorRole
        }))
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

const suspendUserSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().trim().max(500).optional()
});

app.patch(
  "/ops/users/:id/suspend",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (req, res) => {
    const userId = typeof req.params.id === "string" ? req.params.id : "";
    if (!userId) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = suspendUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    if (userId === req.auth!.userId) {
      return res.status(400).json({ ok: false, message: "you cannot suspend yourself" });
    }
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: parsed.data.isActive
          ? { isActive: true, suspendedAt: null, suspendedReason: null }
          : { isActive: false, suspendedAt: new Date(), suspendedReason: parsed.data.reason ?? null },
        select: { id: true, email: true, name: true, isActive: true, suspendedAt: true, suspendedReason: true }
      });
      if (!parsed.data.isActive) {
        // Invalidate refresh tokens so user is forced out
        await prisma.refreshToken.deleteMany({ where: { userId } });
      }
      void writeAuditLog(req, {
        action: parsed.data.isActive ? "USER_REACTIVATED" : "USER_SUSPENDED",
        resource: "user",
        resourceId: userId,
        metadata: { reason: parsed.data.reason ?? null }
      });
      return res.json({ ok: true, item: updated });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2025") {
        return res.status(404).json({ ok: false, message: "user not found" });
      }
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/ops/reports/overview",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (_req, res) => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [
        userCounts,
        usersLast7,
        usersLast30,
        positionCounts,
        positionsLast7,
        applicationCounts,
        applicationsLast7,
        programCounts,
        certificatesCount,
        recommendationsCount,
        issueCounts
      ] = await Promise.all([
        prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
        prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.position.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.position.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.application.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.application.count({ where: { submittedAt: { gte: sevenDaysAgo } } }),
        prisma.program.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.certificate.count(),
        prisma.recommendation.count(),
        prisma.issueReport.groupBy({ by: ["status"], _count: { _all: true } })
      ]);

      function tally(rows: Array<Record<string, unknown>>, key: string, keys: string[]) {
        const acc: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));
        for (const row of rows) {
          const k = String(row[key]);
          const c = (row as { _count?: { _all?: number } })._count?._all ?? 0;
          if (k in acc) acc[k] = c;
        }
        return acc;
      }

      return res.json({
        ok: true,
        stats: {
          users: {
            byRole: tally(userCounts as unknown as Array<Record<string, unknown>>, "role", ["STUDENT", "PARTNER", "OPERATOR"]),
            last7Days: usersLast7,
            last30Days: usersLast30
          },
          positions: {
            byStatus: tally(positionCounts as unknown as Array<Record<string, unknown>>, "status", ["DRAFT", "PENDING_REVIEW", "OPEN", "PAUSED", "CLOSED", "REJECTED"]),
            last7Days: positionsLast7
          },
          applications: {
            byStatus: tally(applicationCounts as unknown as Array<Record<string, unknown>>, "status", ["SUBMITTED", "INTERVIEW", "ACCEPTED", "REJECTED"]),
            last7Days: applicationsLast7
          },
          programs: {
            byStatus: tally(programCounts as unknown as Array<Record<string, unknown>>, "status", ["ACTIVE", "COMPLETED", "CANCELLED"])
          },
          artifacts: {
            certificates: certificatesCount,
            recommendations: recommendationsCount
          },
          issues: {
            byStatus: tally(issueCounts as unknown as Array<Record<string, unknown>>, "status", ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"])
          }
        }
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/ops/reports/inflow",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (_req, res) => {
    try {
      const [providerRows, topAffiliations, weeklyRowsRaw, monthlyRowsRaw] = await Promise.all([
        prisma.user.groupBy({
          by: ["authProvider", "role"],
          _count: { _all: true }
        }),
        prisma.user.groupBy({
          by: ["affiliation"],
          where: { role: "STUDENT", affiliation: { not: null } },
          _count: { _all: true },
          orderBy: { _count: { affiliation: "desc" } },
          take: 20
        }),
        // Signup trend — weekly (last 12 weeks) and monthly (last 12 months).
        // Returning only raw rows; the frontend pads to 12 buckets so the
        // chart always renders a consistent bar count.
        prisma.$queryRawUnsafe<Array<{ week: Date; role: string; count: bigint }>>(
          `SELECT date_trunc('week', "createdAt")::date AS "week", "role", COUNT(*)::bigint AS "count"
           FROM "User"
           WHERE "createdAt" >= NOW() - INTERVAL '12 weeks'
           GROUP BY 1, 2
           ORDER BY 1 ASC`
        ),
        prisma.$queryRawUnsafe<Array<{ month: Date; role: string; count: bigint }>>(
          `SELECT date_trunc('month', "createdAt")::date AS "month", "role", COUNT(*)::bigint AS "count"
           FROM "User"
           WHERE "createdAt" >= NOW() - INTERVAL '12 months'
           GROUP BY 1, 2
           ORDER BY 1 ASC`
        )
      ]);

      const byProvider: Record<string, Record<string, number>> = {};
      for (const r of providerRows) {
        const p = r.authProvider;
        if (!byProvider[p]) byProvider[p] = { STUDENT: 0, PARTNER: 0, OPERATOR: 0 };
        byProvider[p][r.role] = r._count._all;
      }

      const weeklyMap = new Map<string, { week: string; STUDENT: number; PARTNER: number; OPERATOR: number }>();
      for (const row of weeklyRowsRaw) {
        const wk = row.week instanceof Date ? row.week.toISOString().slice(0, 10) : String(row.week).slice(0, 10);
        if (!weeklyMap.has(wk)) weeklyMap.set(wk, { week: wk, STUDENT: 0, PARTNER: 0, OPERATOR: 0 });
        const entry = weeklyMap.get(wk)!;
        entry[row.role as "STUDENT" | "PARTNER" | "OPERATOR"] = Number(row.count);
      }

      const monthlyMap = new Map<string, { month: string; STUDENT: number; PARTNER: number; OPERATOR: number }>();
      for (const row of monthlyRowsRaw) {
        const mo = row.month instanceof Date ? row.month.toISOString().slice(0, 7) : String(row.month).slice(0, 7);
        if (!monthlyMap.has(mo)) monthlyMap.set(mo, { month: mo, STUDENT: 0, PARTNER: 0, OPERATOR: 0 });
        const entry = monthlyMap.get(mo)!;
        entry[row.role as "STUDENT" | "PARTNER" | "OPERATOR"] = Number(row.count);
      }

      return res.json({
        ok: true,
        byProvider,
        topAffiliations: topAffiliations.map((a) => ({ affiliation: a.affiliation, count: a._count._all })),
        weekly: Array.from(weeklyMap.values()),
        monthly: Array.from(monthlyMap.values())
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/ops/matching-logs",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (req, res) => {
    const mode = typeof req.query.mode === "string" ? req.query.mode : undefined;
    const limitNum = Number.parseInt(typeof req.query.limit === "string" ? req.query.limit : "", 10);
    const take = Number.isFinite(limitNum) && limitNum > 0 && limitNum <= 500 ? limitNum : 100;
    try {
      const items = await prisma.matchingRunHistory.findMany({
        where: mode ? { mode } : undefined,
        orderBy: { ranAt: "desc" },
        take,
        select: {
          id: true,
          mode: true,
          source: true,
          positionId: true,
          candidateId: true,
          positionTitle: true,
          candidateLabel: true,
          resultCount: true,
          ranAt: true,
          createdAt: true
        }
      });
      const modes = await prisma.matchingRunHistory.groupBy({
        by: ["mode"],
        _count: { _all: true }
      });
      return res.json({
        ok: true,
        items,
        modeStats: modes.map((m) => ({ mode: m.mode, count: m._count._all }))
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/ops/matching-logs/:id",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (req, res) => {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) return res.status(400).json({ ok: false, message: "invalid id" });
    try {
      const item = await prisma.matchingRunHistory.findUnique({ where: { id } });
      if (!item) return res.status(404).json({ ok: false, message: "not found" });
      return res.json({ ok: true, item });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/ops/email-stats",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (_req, res) => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [
        totalUsers,
        verifiedUsers,
        verifyTokensLast7,
        verifyTokensLast30,
        preverifyTokensLast7,
        recentTokens
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { emailVerified: true } }),
        prisma.emailVerificationToken.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.emailVerificationToken.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.emailPreverificationToken.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.emailVerificationToken.findMany({
          orderBy: { createdAt: "desc" },
          take: 30,
          include: { user: { select: { id: true, email: true, name: true, role: true } } }
        })
      ]);
      return res.json({
        ok: true,
        stats: {
          totalUsers,
          verifiedUsers,
          verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 1000) / 10 : 0,
          verifyTokensLast7,
          verifyTokensLast30,
          preverifyTokensLast7
        },
        recentTokens: recentTokens.map((t) => ({
          id: t.id,
          createdAt: t.createdAt,
          expiresAt: t.expiresAt,
          usedAt: t.usedAt,
          email: t.user?.email ?? null,
          name: t.user?.name ?? null,
          role: t.user?.role ?? null
        }))
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

const appSettingUpsertSchema = z.object({
  key: z.string().trim().min(1).max(120),
  value: z.string().max(8000),
  description: z.string().trim().max(500).optional()
});

const announcementSeverityEnum = z.enum(["INFO", "SUCCESS", "WARNING", "CRITICAL"]);
const announcementAudienceEnum = z.enum(["ALL", "STUDENT", "PARTNER", "OPERATOR"]);
const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(4000),
  severity: announcementSeverityEnum.optional(),
  audience: announcementAudienceEnum.optional(),
  linkPath: z.string().trim().max(500).optional(),
  active: z.boolean().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().nullable().optional()
});
const updateAnnouncementSchema = createAnnouncementSchema.partial();

app.get(
  "/members/me/announcements",
  authenticate,
  async (req, res) => {
    try {
      const now = new Date();
      const role = req.auth!.role;
      const audiences: ("ALL" | "STUDENT" | "PARTNER" | "OPERATOR")[] = ["ALL"];
      if (role === "STUDENT") audiences.push("STUDENT");
      if (role === "PARTNER") audiences.push("PARTNER");
      if (role === "OPERATOR") audiences.push("OPERATOR");
      const items = await prisma.announcement.findMany({
        where: {
          active: true,
          audience: { in: audiences },
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gt: now } }]
        },
        orderBy: [{ severity: "desc" }, { startsAt: "desc" }],
        take: 5
      });
      return res.json({ ok: true, items });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/ops/announcements",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (_req, res) => {
    try {
      const items = await prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        take: 100
      });
      return res.json({ ok: true, items });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.post(
  "/ops/announcements",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (req, res) => {
    const parsed = createAnnouncementSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    try {
      const created = await prisma.announcement.create({
        data: {
          title: parsed.data.title,
          body: parsed.data.body,
          severity: parsed.data.severity ?? "INFO",
          audience: parsed.data.audience ?? "ALL",
          linkPath: parsed.data.linkPath ?? null,
          active: parsed.data.active ?? true,
          startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : new Date(),
          endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
          createdByUserId: req.auth!.userId
        }
      });
      return res.status(201).json({ ok: true, item: created });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.patch(
  "/ops/announcements/:id",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (req, res) => {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) return res.status(400).json({ ok: false, message: "invalid id" });
    const parsed = updateAnnouncementSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    try {
      const data: Record<string, unknown> = {};
      if (parsed.data.title !== undefined) data.title = parsed.data.title;
      if (parsed.data.body !== undefined) data.body = parsed.data.body;
      if (parsed.data.severity !== undefined) data.severity = parsed.data.severity;
      if (parsed.data.audience !== undefined) data.audience = parsed.data.audience;
      if (parsed.data.linkPath !== undefined) data.linkPath = parsed.data.linkPath ?? null;
      if (parsed.data.active !== undefined) data.active = parsed.data.active;
      if (parsed.data.startsAt !== undefined) data.startsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : new Date();
      if (parsed.data.endsAt !== undefined) data.endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null;
      const updated = await prisma.announcement.update({ where: { id }, data });
      return res.json({ ok: true, item: updated });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2025") {
        return res.status(404).json({ ok: false, message: "announcement not found" });
      }
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.delete(
  "/ops/announcements/:id",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (req, res) => {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) return res.status(400).json({ ok: false, message: "invalid id" });
    try {
      await prisma.announcement.delete({ where: { id } });
      return res.json({ ok: true });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2025") {
        return res.status(404).json({ ok: false, message: "announcement not found" });
      }
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

const profileCompletionEndpoint = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      candidateProfile: {
        include: {
          careers: { select: { id: true } },
          educations: { select: { id: true } },
          languageSkills: { select: { id: true } }
        }
      }
    }
  });
  if (!user) return null;
  const candidate = user.candidateProfile;
  const items = [
    { key: "name", label: "이름", filled: Boolean(user.name?.trim()) },
    { key: "phoneNumber", label: "전화번호", filled: Boolean(user.phoneNumber?.trim()) },
    { key: "nationality", label: "국적", filled: Boolean(user.nationality?.trim()) },
    { key: "affiliation", label: "소속", filled: Boolean(user.affiliation?.trim()) },
    { key: "birthDate", label: "생년월일", filled: Boolean(user.birthDate) },
    { key: "gender", label: "성별", filled: Boolean(user.gender?.trim()) },
    { key: "jobTitle", label: "희망 직무", filled: Boolean(user.jobTitle?.trim()) },
    { key: "profileImage", label: "프로필 사진", filled: Boolean(user.profileImageUrl?.trim()) },
    { key: "emailVerified", label: "이메일 인증", filled: user.emailVerified },
    { key: "selfIntroduction", label: "자기소개", filled: Boolean(candidate?.selfIntroduction?.trim()) },
    { key: "career", label: "경력", filled: (candidate?.careers.length ?? 0) > 0 },
    { key: "education", label: "학력", filled: (candidate?.educations.length ?? 0) > 0 },
    { key: "languageSkill", label: "어학 능력", filled: (candidate?.languageSkills.length ?? 0) > 0 }
  ];
  const filledCount = items.filter((i) => i.filled).length;
  const total = items.length;
  return {
    total,
    filledCount,
    percent: Math.round((filledCount / total) * 100),
    items
  };
};

app.get(
  "/members/me/profile-completion",
  authenticate,
  requireRoles([MemberRole.STUDENT]),
  async (req, res) => {
    try {
      const data = await profileCompletionEndpoint(req.auth!.userId);
      if (!data) return res.status(404).json({ ok: false, message: "user not found" });
      return res.json({ ok: true, ...data });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/ops/app-settings",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (_req, res) => {
    try {
      const items = await prisma.appSetting.findMany({ orderBy: { key: "asc" } });
      return res.json({ ok: true, items });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.put(
  "/ops/app-settings",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (req, res) => {
    const parsed = appSettingUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
    }
    try {
      const item = await prisma.appSetting.upsert({
        where: { key: parsed.data.key },
        update: { value: parsed.data.value, description: parsed.data.description ?? null },
        create: { key: parsed.data.key, value: parsed.data.value, description: parsed.data.description ?? null }
      });
      return res.json({ ok: true, item });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.delete(
  "/ops/app-settings/:id",
  authenticate,
  requireRoles([MemberRole.OPERATOR]),
  async (req, res) => {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) return res.status(400).json({ ok: false, message: "invalid id" });
    try {
      await prisma.appSetting.delete({ where: { id } });
      return res.json({ ok: true });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2025") {
        return res.status(404).json({ ok: false, message: "setting not found" });
      }
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/search",
  authenticate,
  searchRateLimit,
  async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < 2) {
      return res.json({ ok: true, items: { positions: [], applicants: [], partners: [], issues: [] } });
    }
    try {
      const role = req.auth!.role;
      const userId = req.auth!.userId;

      // Positions: students see OPEN positions; partners see their own; operators see all
      let positionWhere: Prisma.PositionWhereInput = {
        OR: [
          { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { preferredJobRole: { contains: q, mode: Prisma.QueryMode.insensitive } }
        ]
      };
      if (role === MemberRole.STUDENT) {
        positionWhere = { AND: [positionWhere, { status: "OPEN" }] };
      } else if (role === MemberRole.PARTNER) {
        const affiliation = await resolvePartnerAffiliation(userId);
        if (affiliation?.organization) {
          positionWhere = { AND: [positionWhere, { partnerOrganizationId: affiliation.organization.id }] };
        } else {
          positionWhere = { AND: [positionWhere, { id: "__none__" }] };
        }
      }

      const positions = await prisma.position.findMany({
        where: positionWhere,
        select: {
          id: true,
          title: true,
          status: true,
          partnerOrganization: { select: { id: true, name: true } }
        },
        orderBy: { updatedAt: "desc" },
        take: 6
      });

      let applicants: Array<{ id: string; applicationId: string; name: string | null; email: string; positionTitle: string }> = [];
      let issues: Array<{ id: string; title: string; status: string }> = [];
      let partners: Array<{ id: string; name: string }> = [];

      if (role === MemberRole.OPERATOR || role === MemberRole.PARTNER) {
        let appWhere: Prisma.ApplicationWhereInput = {
          OR: [
            { candidateUser: { name: { contains: q, mode: Prisma.QueryMode.insensitive } } },
            { candidateUser: { email: { contains: q, mode: Prisma.QueryMode.insensitive } } }
          ]
        };
        if (role === MemberRole.PARTNER) {
          const affiliation = await resolvePartnerAffiliation(userId);
          if (affiliation?.organization) {
            appWhere = { AND: [appWhere, { position: { partnerOrganizationId: affiliation.organization.id } }] };
          } else {
            appWhere = { AND: [appWhere, { id: "__none__" }] };
          }
        }
        const apps = await prisma.application.findMany({
          where: appWhere,
          orderBy: { submittedAt: "desc" },
          take: 6,
          include: {
            candidateUser: { select: { id: true, name: true, email: true } },
            position: { select: { title: true } }
          }
        });
        applicants = apps.map((a) => ({
          id: a.candidateUser.id,
          applicationId: a.id,
          name: a.candidateUser.name,
          email: a.candidateUser.email,
          positionTitle: a.position.title
        }));
      }

      if (role === MemberRole.OPERATOR) {
        const issueRows = await prisma.issueReport.findMany({
          where: {
            OR: [
              { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
              { description: { contains: q, mode: Prisma.QueryMode.insensitive } }
            ]
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, title: true, status: true }
        });
        issues = issueRows;

        const partnerRows = await prisma.partnerOrganization.findMany({
          where: { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, name: true }
        });
        partners = partnerRows;
      }

      return res.json({
        ok: true,
        items: {
          positions: positions.map((p) => ({
            id: p.id,
            title: p.title,
            status: p.status,
            partnerOrganizationName: p.partnerOrganization?.name ?? null
          })),
          applicants,
          partners,
          issues
        }
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get(
  "/members/me/notifications",
  authenticate,
  async (req, res) => {
    try {
      const limitNum = Number.parseInt(typeof req.query.limit === "string" ? req.query.limit : "", 10);
      const take = Number.isFinite(limitNum) && limitNum > 0 && limitNum <= 100 ? limitNum : 30;
      const unreadOnly = req.query.unread === "true";
      const items = await prisma.notification.findMany({
        where: {
          userId: req.auth!.userId,
          ...(unreadOnly ? { readAt: null } : {})
        },
        orderBy: { createdAt: "desc" },
        take
      });
      const unreadCount = await prisma.notification.count({
        where: { userId: req.auth!.userId, readAt: null }
      });
      return res.json({ ok: true, items, unreadCount });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.patch(
  "/members/me/notifications/:id/read",
  authenticate,
  async (req, res) => {
    const notificationId = typeof req.params.id === "string" ? req.params.id : "";
    if (!notificationId) return res.status(400).json({ ok: false, message: "invalid id" });
    try {
      const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
      if (!notification) return res.status(404).json({ ok: false, message: "not found" });
      if (notification.userId !== req.auth!.userId) {
        return res.status(403).json({ ok: false, message: "forbidden" });
      }
      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() }
      });
      return res.json({ ok: true, item: updated });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.patch(
  "/members/me/notifications/read-all",
  authenticate,
  async (req, res) => {
    try {
      const result = await prisma.notification.updateMany({
        where: { userId: req.auth!.userId, readAt: null },
        data: { readAt: new Date() }
      });
      return res.json({ ok: true, count: result.count });
    } catch (error) {
      return res.status(500).json({ ok: false, message: getErrorMessage(error) });
    }
  }
);

app.get("/partner/applicants/:id", authenticate, requireRoles([MemberRole.PARTNER]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ ok: false, message: "invalid applicant id" });

  try {
    const result = await listPartnerApplicantsForUser(req.auth!.userId);
    if (!result.affiliation?.organization) {
      return sendAuthError(
        res,
        403,
        "PARTNER_AFFILIATION_REQUIRED",
        "partner affiliation is required. request organization assignment."
      );
    }

    const found = result.items.find((item) => item.id === id);
    if (!found) return res.status(404).json({ ok: false, message: "applicant not found" });

    return res.json({
      ok: true,
      item: {
        id: found.id,
        name: found.name,
        nationality: found.nationality,
        email: found.email,
        positionId: found.positionId,
        positionTitle: found.positionTitle,
        languages: found.languages,
        school: found.school,
        major: found.major,
        residence: found.residence,
        appliedAt: found.appliedAt,
        recommendation: found.recommendation,
        status: found.status,
        summary: found.summary,
        motivation: found.motivation,
        portfolioUrl: found.portfolioUrl,
        availableStartDate: found.availableStartDate,
        memo: found.memo
      }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

app.patch("/partner/applicants/:id", authenticate, requireRoles([MemberRole.PARTNER]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ ok: false, message: "invalid applicant id" });

  const parsedBody = z
    .object({
      status: partnerApplicantStatusEnum.optional(),
      memo: z.string().trim().max(2000).nullable().optional()
    })
    .safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsedBody.error.flatten() });
  }

  if (!parsePartnerApplicantCompositeId(id)) return res.status(400).json({ ok: false, message: "invalid applicant id" });

  try {
    const result = await listPartnerApplicantsForUser(req.auth!.userId);
    if (!result.affiliation?.organization) {
      return sendAuthError(
        res,
        403,
        "PARTNER_AFFILIATION_REQUIRED",
        "partner affiliation is required. request organization assignment."
      );
    }

    const found = result.items.find((item) => item.id === id);
    if (!found) return res.status(404).json({ ok: false, message: "applicant not found" });

    const parsedId = parsePartnerApplicantCompositeId(id);
    if (!parsedId) return res.status(400).json({ ok: false, message: "invalid applicant id" });

    const existing = await prisma.partnerApplicantWorkflow.findUnique({
      where: {
        partnerUserId_candidateUserId_positionId: {
          partnerUserId: req.auth!.userId,
          candidateUserId: parsedId.candidateUserId,
          positionId: parsedId.positionId
        }
      },
      select: { status: true, memo: true }
    });

    const nextStatus = parsedBody.data.status ?? (existing?.status as PartnerApplicantWorkflowStatus | undefined) ?? found.status;
    const nextMemo = parsedBody.data.memo !== undefined ? parsedBody.data.memo : existing?.memo ?? found.memo ?? null;

    await prisma.partnerApplicantWorkflow.upsert({
      where: {
        partnerUserId_candidateUserId_positionId: {
          partnerUserId: req.auth!.userId,
          candidateUserId: parsedId.candidateUserId,
          positionId: parsedId.positionId
        }
      },
      create: {
        partnerUserId: req.auth!.userId,
        candidateUserId: parsedId.candidateUserId,
        positionId: parsedId.positionId,
        status: nextStatus,
        memo: nextMemo
      },
      update: {
        status: nextStatus,
        memo: nextMemo
      }
    });

    return res.json({
      ok: true,
      item: {
        ...found,
        status: nextStatus,
        memo: nextMemo
      }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

app.get("/ops/dashboard", authenticate, requireRoles([MemberRole.OPERATOR]), async (_req, res) => {
  try {
    const [totalUsers, students, partners, operators, totalPartnerOrgs, verifiedPartnerOrgs, totalPositions, openPositions, recentSignups] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: MemberRole.STUDENT } }),
      prisma.user.count({ where: { role: MemberRole.PARTNER } }),
      prisma.user.count({ where: { role: MemberRole.OPERATOR } }),
      prisma.partnerOrganization.count(),
      prisma.partnerOrganization.count({ where: { verificationApproved: true } }),
      prisma.position.count(),
      prisma.position.count({ where: { status: "OPEN" } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, email: true, name: true, role: true, createdAt: true, authProvider: true }
      })
    ]);

    return res.json({
      ok: true,
      stats: {
        users: { total: totalUsers, students, partners, operators },
        partnerOrgs: { total: totalPartnerOrgs, verified: verifiedPartnerOrgs },
        positions: { total: totalPositions, open: openPositions }
      },
      recentSignups
    });
  } catch (error) {
    console.error("[ops/dashboard] failed", error);
    return res.status(500).json({ ok: false, message: "failed to load ops dashboard" });
  }
});

app.get("/ops/partners", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = listPartnerOrganizationsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsed.error.flatten() });
  }

  const { search, partnerType, companySize, industry, verificationApproved, sortBy = "createdAt", sortOrder = "desc", page = 1, pageSize = 20 } = parsed.data;
  const orderByMap = {
    name: { name: sortOrder },
    createdAt: { createdAt: sortOrder }
  } as const;
  const orderBy = orderByMap[sortBy];

  const where: Prisma.PartnerOrganizationWhereInput = {
    ...(partnerType ? { partnerType: partnerType as PartnerType } : {}),
    ...(companySize ? { companySize: companySize as PartnerCompanySize } : {}),
    ...(industry ? { industry: industry as PartnerIndustry } : {}),
    ...(typeof verificationApproved === "boolean" ? { verificationApproved } : {}),
    ...(search
      ? {
          OR: [{ name: { contains: search, mode: Prisma.QueryMode.insensitive } }]
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
          partnerOrganizationId: item.id
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
      partnerOrganizationId: item.id
    }
  });

  return res.json({
    ok: true,
    item: toPartnerOrganization({ ...item, memberCount }, { includeVerificationAssets: true })
  });
});

app.get("/ops/partner-users", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = listPartnerUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsed.error.flatten() });
  }

  const { search, partnerOrganizationId, emailVerified, authProvider, partnerOrgRole, sortBy = "createdAt", sortOrder = "desc", page = 1, pageSize = 20 } = parsed.data;
  const orderByMap = {
    email: { email: sortOrder },
    name: { name: sortOrder },
    createdAt: { createdAt: sortOrder }
  } as const;
  const orderBy = orderByMap[sortBy];

  const where: Prisma.UserWhereInput = {
    role: MemberRole.PARTNER,
    ...( { partnerType: PartnerType.COMPANY }),
    ...(partnerOrganizationId ? { partnerOrganizationId } : {}),
    ...(typeof emailVerified === "boolean" ? { emailVerified } : {}),
    ...(authProvider ? { authProvider: authProvider as AuthProvider } : {}),
    ...(partnerOrgRole ? { partnerOrgRole: partnerOrgRole as PartnerOrgUserRole } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } }
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
        authProvider: true,
        partnerType: true,
        partnerOrgRole: true,
        partnerOrganizationId: true,
        createdAt: true
      }
    })
  ]);

  const partnerIds = Array.from(
    new Set(users.map((user) => user.partnerOrganizationId).filter((id): id is string => Boolean(id)))
  );
  const partners = partnerIds.length
    ? await prisma.partnerOrganization.findMany({
        where: { id: { in: partnerIds } }
      })
    : [];
  const partnerById = new Map(partners.map((item) => [item.id, item]));

  return res.json({
    ok: true,
    items: users.map((user) => {
      const partner = user.partnerOrganizationId ? partnerById.get(user.partnerOrganizationId) : null;
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        phoneNumber: user.phoneNumber,
        jobTitle: user.jobTitle,
        adminMemo: user.adminMemo,
        role: user.role,
        authProvider: user.authProvider,
        partnerType: user.partnerType,
        partnerOrgRole: user.partnerOrgRole,
        createdAt: user.createdAt,
        partnerName: partner?.name ?? "-"
        ,
        partner: partner
          ? {
              id: partner.id,
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

app.get("/ops/users", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = listPartnerUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsed.error.flatten() });
  }

  const { search, partnerOrganizationId, emailVerified, role, authProvider, sortBy = "createdAt", sortOrder = "desc", page = 1, pageSize = 20 } = parsed.data;
  const orderByMap = {
    email: { email: sortOrder },
    name: { name: sortOrder },
    createdAt: { createdAt: sortOrder }
  } as const;
  const orderBy = orderByMap[sortBy];

  const where: Prisma.UserWhereInput = {
    ...(partnerOrganizationId ? { partnerOrganizationId } : {}),
    ...(typeof emailVerified === "boolean" ? { emailVerified } : {}),
    ...(role ? { role: role as MemberRole } : {}),
    ...(authProvider ? { authProvider: authProvider as AuthProvider } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } }
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
        authProvider: true,
        partnerType: true,
        partnerOrgRole: true,
        partnerOrganizationId: true,
        createdAt: true
      }
    })
  ]);

  const partnerIds = Array.from(
    new Set(users.map((user) => user.partnerOrganizationId).filter((id): id is string => Boolean(id)))
  );
  const partners = partnerIds.length
    ? await prisma.partnerOrganization.findMany({
        where: { id: { in: partnerIds } }
      })
    : [];
  const partnerById = new Map(partners.map((item) => [item.id, item]));

  return res.json({
    ok: true,
    items: users.map((user) => {
      const partner = user.partnerOrganizationId ? partnerById.get(user.partnerOrganizationId) : null;
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        phoneNumber: user.phoneNumber,
        jobTitle: user.jobTitle,
        adminMemo: user.adminMemo,
        role: user.role,
        authProvider: user.authProvider,
        partnerType: user.partnerType,
        partnerOrgRole: user.partnerOrgRole,
        createdAt: user.createdAt,
        partnerName: partner?.name ?? "-",
        partner: partner
          ? {
              id: partner.id,
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

// ---------------------------------------------------------------------------
// Compute a 0–100 completion rate for a resume `content` JSON. Same scoring
// rubric for the list and the detail endpoints so the ops view stays
// consistent. Returns an integer percent.
// ---------------------------------------------------------------------------
// Resume translation cache.
//
// 외국인 학생이 자기소개·경력·활동 description 같은 긴 텍스트를 모국어/영어로
// 작성해도, 결과로 보이는 이력서(미리보기·공유 링크·코치)에는 항상 한국어가
// 쌍으로 따라붙도록 저장 시 한국어 번역을 미리 만들어 캐시한다. 길지 않은
// 필드(이름·이메일·회사명) 는 번역해도 의미가 없어 대상에서 제외.
// ---------------------------------------------------------------------------

type ResumeKoTranslations = {
  // 한국어 비중이 충분치 않은 본문만 채워짐. 모두 옵셔널.
  summary?: string;
  selfIntroduction?: string;
  careers?: Array<{ description?: string }>;
  activities?: Array<{ description?: string }>;
};

type ResumeTranslations = {
  ko?: ResumeKoTranslations;
};

// 한국어(한글) 문자 비율을 반환. 0~1. 공백·기호는 무시하고 의미있는 글자만
// 분모로 침. 50% 이상이면 이미 충분히 한국어로 본다.
function koreanRatio(text: string): number {
  if (!text || typeof text !== "string") return 0;
  let total = 0;
  let korean = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    // 공백·구두점·숫자는 분모에서 제외 — 짧은 영문 이름 옆 긴 한글 본문 같은
    // 경우를 정확히 잡아내려면 의미있는 글자만 비교해야 함.
    if (/\s|[0-9\p{P}]/u.test(ch)) continue;
    total += 1;
    if (code >= 0xac00 && code <= 0xd7a3) korean += 1; // Hangul Syllables
    else if (code >= 0x1100 && code <= 0x11ff) korean += 1; // Jamo
    else if (code >= 0x3130 && code <= 0x318f) korean += 1; // compat Jamo
  }
  return total === 0 ? 0 : korean / total;
}

// 너무 짧거나 이미 한국어가 충분한 텍스트는 번역 생략. 10자 미만 또는
// 한국어 비중 50%+ 면 skip.
function needsKoreanTranslation(text: string | null | undefined): boolean {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (trimmed.length < 10) return false;
  return koreanRatio(trimmed) < 0.5;
}

// content 안의 4가지 긴 필드(summary / selfIntroduction / careers[].description
// / activities[].description) 를 훑어 번역이 필요한 단위만 골라낸 리스트를
// 만든다. 각 단위는 path 정보가 있어 응답을 카운터파트에 다시 끼워 넣을 때
// 위치를 잃지 않음.
type TranslationUnit =
  | { path: "summary"; text: string }
  | { path: "selfIntroduction"; text: string }
  | { path: "careers"; index: number; text: string }
  | { path: "activities"; index: number; text: string };

function collectTranslationUnits(content: unknown): TranslationUnit[] {
  const units: TranslationUnit[] = [];
  if (!content || typeof content !== "object") return units;
  const c = content as Record<string, unknown>;
  const trimStr = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

  const summary = trimStr(c.summary);
  if (needsKoreanTranslation(summary)) units.push({ path: "summary", text: summary });

  const selfIntro = trimStr(c.selfIntroduction);
  if (needsKoreanTranslation(selfIntro)) units.push({ path: "selfIntroduction", text: selfIntro });

  if (Array.isArray(c.careers)) {
    c.careers.forEach((cr, idx) => {
      if (typeof cr !== "object" || cr === null) return;
      const desc = trimStr((cr as Record<string, unknown>).description);
      if (needsKoreanTranslation(desc)) units.push({ path: "careers", index: idx, text: desc });
    });
  }
  if (Array.isArray(c.activities)) {
    c.activities.forEach((a, idx) => {
      if (typeof a !== "object" || a === null) return;
      const desc = trimStr((a as Record<string, unknown>).description);
      if (needsKoreanTranslation(desc)) units.push({ path: "activities", index: idx, text: desc });
    });
  }
  return units;
}

// 기존 translations.ko 와 비교해서 텍스트가 바뀐 단위만 재번역. 변경 없는
// 단위는 기존 한국어를 그대로 들고 옴 — 매 저장마다 LLM 비용이 폭발하지
// 않게 핵심.
async function buildKoreanTranslations(
  content: unknown,
  previous: ResumeTranslations | null | undefined
): Promise<ResumeTranslations | null> {
  const units = collectTranslationUnits(content);
  if (units.length === 0) return previous?.ko ? { ko: previous.ko } : null;
  if (!openai) return previous?.ko ? { ko: previous.ko } : null;

  const prevKo = previous?.ko ?? {};
  const prevContent = content as Record<string, unknown>;

  // 원문 사본 + 기존 번역 사본 — 변경된 단위만 새로 번역.
  const result: ResumeKoTranslations = {
    summary: prevKo.summary,
    selfIntroduction: prevKo.selfIntroduction,
    careers: Array.isArray(prevContent.careers)
      ? (prevContent.careers as unknown[]).map((_, idx) => ({
          description: prevKo.careers?.[idx]?.description
        }))
      : undefined,
    activities: Array.isArray(prevContent.activities)
      ? (prevContent.activities as unknown[]).map((_, idx) => ({
          description: prevKo.activities?.[idx]?.description
        }))
      : undefined
  };

  // 변경 감지를 위해 원문과 함께 메타 저장이 필요한데 단순화를 위해 매 저장
  // 시 한국어 번역이 비어 있거나 원문이 한국어가 아닌 모든 단위를 다시 번역.
  // 비용 통제는 needsKoreanTranslation 의 길이/비율 컷오프로 제한.
  const promises = units.map(async (unit) => {
    try {
      const completion = await openai!.chat.completions.create({
        model: openaiTranslationModel,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "당신은 이력서 번역가입니다. 외국인 지원자의 이력서 텍스트를 한국 기업이 읽기 좋은 자연스러운 한국어로 번역하세요. " +
              "원문에 있는 사실만 사용하고, 새 사실/수치/회사명/날짜를 추가하지 마세요. 의미를 부풀리지 마세요. " +
              "회사명·학교명·자격증명 같은 고유명사는 영문 그대로 두거나 (한국어 표기) 형태로 자연스럽게 표기. " +
              "JSON 한 개의 객체만 응답: { \"ko\": string }"
          },
          { role: "user", content: unit.text }
        ]
      });
      const raw = completion.choices?.[0]?.message?.content ?? "";
      let parsedJson: { ko?: unknown } = {};
      try { parsedJson = JSON.parse(raw); } catch { /* skip */ }
      const ko = typeof parsedJson.ko === "string" ? parsedJson.ko.trim() : "";
      return ko ? { unit, ko } : null;
    } catch {
      return null;
    }
  });
  const results = await Promise.all(promises);
  for (const r of results) {
    if (!r) continue;
    const { unit, ko } = r;
    if (unit.path === "summary") result.summary = ko;
    else if (unit.path === "selfIntroduction") result.selfIntroduction = ko;
    else if (unit.path === "careers") {
      if (!result.careers) result.careers = [];
      result.careers[unit.index] = { description: ko };
    } else if (unit.path === "activities") {
      if (!result.activities) result.activities = [];
      result.activities[unit.index] = { description: ko };
    }
  }
  return { ko: result };
}

function calcResumeCompletion(content: unknown): number {
  if (!content || typeof content !== "object") return 0;
  const c = content as Record<string, unknown>;
  const trimStr = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
  const isArr = (v: unknown): v is unknown[] => Array.isArray(v);

  // 가중치는 "이 항목이 비어 있으면 이력서가 얼마나 빈약해 보이나" 기준.
  // Career/About 등 본문 영역에 더 큰 가중치.
  const checks: Array<{ ok: boolean; weight: number }> = [
    { ok: Boolean(trimStr(c.basicName)), weight: 1 },
    { ok: Boolean(trimStr(c.basicEmail)), weight: 1 },
    { ok: Boolean(trimStr(c.basicPhone)), weight: 1 },
    { ok: Boolean(trimStr(c.basicResidence)), weight: 1 },
    { ok: Boolean(trimStr(c.basicPhotoUrl)), weight: 1 },
    { ok: Boolean(trimStr(c.summary) || trimStr(c.selfIntroduction)), weight: 2 },
    {
      ok: isArr(c.educations) && c.educations.some((e) => typeof e === "object" && e !== null && trimStr((e as Record<string, unknown>).schoolName)),
      weight: 2
    },
    {
      ok: isArr(c.careers) && c.careers.some((cr) => {
        if (typeof cr !== "object" || cr === null) return false;
        const obj = cr as Record<string, unknown>;
        return Boolean(trimStr(obj.companyName) && trimStr(obj.position));
      }),
      weight: 2
    },
    {
      ok: isArr(c.activities) && c.activities.some((a) => typeof a === "object" && a !== null && trimStr((a as Record<string, unknown>).title)),
      weight: 1
    },
    { ok: isArr(c.skills) && c.skills.length > 0, weight: 1 },
    {
      ok: isArr(c.languages) && c.languages.some((l) => typeof l === "object" && l !== null && trimStr((l as Record<string, unknown>).language)),
      weight: 1
    },
    {
      ok: isArr(c.certifications) && c.certifications.some((ct) => typeof ct === "object" && ct !== null && trimStr((ct as Record<string, unknown>).name)),
      weight: 1
    },
    {
      ok: isArr(c.links) && c.links.some((l) => typeof l === "object" && l !== null && trimStr((l as Record<string, unknown>).url)),
      weight: 1
    }
  ];

  const total = checks.reduce((sum, c2) => sum + c2.weight, 0);
  const done = checks.reduce((sum, c2) => sum + (c2.ok ? c2.weight : 0), 0);
  return Math.round((done / total) * 100);
}

// ---------------------------------------------------------------------------
// Resume Coach scoring — split into TWO orthogonal scores:
//
//   Quality   (4 dims) — how well-written the resume is
//   Readiness (5 dims) — whether the resume is submittable to companies
//
// 외국인 채용에서는 "잘 쓴 이력서" 와 "지원 가능한 이력서" 가 다르다. 비자
// 정보가 없으면 점수만 높아도 검토 자체가 불가능한 경우가 많아서, 두 점수를
// 분리해서 보여주는 게 사용자에게 훨씬 정직하다. 그리고 readiness 가 임계점에
// 도달했는지를 기준으로 "제출 가능 / 보완 후 제출 가능 / 제출 불가" 배지를
// 노출. 이 배지가 Career Passport 의 코어 시그널이 된다.
//
// 두 점수 모두 pure rule-based — LLM 호출 0회.
// ---------------------------------------------------------------------------
type ResumeReadinessLevel = "submittable" | "needs_polish" | "not_submittable";

type ResumeQualityDimensions = {
  contentQuality: number;  // 자기소개 + 경력·활동 설명 깊이
  impact: number;          // 본문 수치화 (성과 중심 표현)
  uniqueness: number;      // 스킬·활동·자격증·링크 다양성
  visual: number;          // 사진, 길이 적정성, 가독성
};

type ResumeReadinessDimensions = {
  contact: number;         // 이름·이메일·전화·거주지
  education: number;       // 학력 1개 이상
  visa: number;            // 비자 정보
  koreaFit: number;        // 한국 취업 적합도 — 한국어 능력 + 다중언어
  portfolio: number;       // 포트폴리오·활동·자격증 중 최소 1
};

type ResumeScoresResult = {
  quality: { total: number; dimensions: ResumeQualityDimensions };
  readiness: { total: number; dimensions: ResumeReadinessDimensions };
  level: ResumeReadinessLevel;
};

type ResumeCoachActionCategory = "required" | "recommended" | "optional";

type ResumeCoachAction = {
  id: string;
  category: ResumeCoachActionCategory;  // 필수 / 추천 / 선택
  title: string;
  description: string;
  impactPoints: number;
  targetSection: string;
  targetItemIndex?: number;
  // llmEligible actions can be augmented by POST /coach/suggest.
  llmEligible?: boolean;
};

type ResumeCoachPositionMatch = {
  positionId: string;
  title: string;
  organizationName: string | null;
  matchScore: number;
  status: "applied" | "open";
  applicationStatus: string | null;
  thumbnailUrl: string | null;
  workLocation: string | null;
};

const RESUME_QUALITY_WEIGHTS: Record<keyof ResumeQualityDimensions, number> = {
  contentQuality: 0.30,
  impact: 0.25,
  uniqueness: 0.25,
  visual: 0.20
};

// Aply 는 비자가 필요 없는 인턴 체험 프로그램(CIP)도 함께 운영한다. 비자
// 정보가 비어 있어도 readiness 가 submittable 까지 도달할 수 있도록 visa
// 비중을 낮게 잡고, 기본 정보(contact·education) 와 한국 적합도, 포트폴리오에
// 비중을 더 실어둠. 비자는 정규직 매칭 정확도를 끌어올리는 보조 신호로 작동.
const RESUME_READINESS_WEIGHTS: Record<keyof ResumeReadinessDimensions, number> = {
  contact: 0.30,
  education: 0.25,
  visa: 0.10,
  koreaFit: 0.20,
  portfolio: 0.15
};

// Readiness 임계점 — "기업이 진짜로 검토 가능한지" 가 기준. 비자/연락처
// 같은 필수 항목이 빠지면 readiness 가 80 을 못 넘게 가중치를 설계함.
function resumeReadinessLevel(quality: number, readiness: number): ResumeReadinessLevel {
  if (readiness >= 80 && quality >= 60) return "submittable";
  if (readiness >= 55) return "needs_polish";
  return "not_submittable";
}

function calcResumeScores(content: unknown): ResumeScoresResult {
  const empty: ResumeScoresResult = {
    quality: { total: 0, dimensions: { contentQuality: 0, impact: 0, uniqueness: 0, visual: 0 } },
    readiness: { total: 0, dimensions: { contact: 0, education: 0, visa: 0, koreaFit: 0, portfolio: 0 } },
    level: "not_submittable"
  };
  if (!content || typeof content !== "object") return empty;
  const c = content as Record<string, unknown>;
  const trimStr = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
  const isArr = (v: unknown): v is unknown[] => Array.isArray(v);

  // ===== Quality 4 dimensions =============================================

  // contentQuality — 자기소개 + 경력·활동 설명 깊이
  const introText = trimStr(c.selfIntroduction) || trimStr(c.summary);
  let qChecks = 0;
  let qScore = 0;
  qChecks += 1;
  if (introText.length >= 400) qScore += 1;
  else if (introText.length >= 200) qScore += 0.7;
  else if (introText.length >= 100) qScore += 0.4;
  else if (introText.length > 0) qScore += 0.15;
  if (isArr(c.careers) && c.careers.length > 0) {
    const rich = c.careers.filter((cr) => {
      if (typeof cr !== "object" || cr === null) return false;
      return trimStr((cr as Record<string, unknown>).description).length >= 50;
    });
    qChecks += 1;
    qScore += Math.min(1, rich.length / c.careers.length);
  }
  if (isArr(c.activities) && c.activities.length > 0) {
    const rich = c.activities.filter((a) => {
      if (typeof a !== "object" || a === null) return false;
      return trimStr((a as Record<string, unknown>).description).length >= 30;
    });
    qChecks += 1;
    qScore += Math.min(1, rich.length / c.activities.length);
  }
  const contentQuality = qChecks === 0 ? 0 : Math.round((qScore / qChecks) * 100);

  // impact — 본문에 수치/단위가 들어가 있는지 (성과 중심 표현)
  const bodyTexts: string[] = [introText];
  if (isArr(c.careers)) {
    for (const cr of c.careers) {
      if (typeof cr === "object" && cr !== null) {
        bodyTexts.push(trimStr((cr as Record<string, unknown>).description));
      }
    }
  }
  if (isArr(c.activities)) {
    for (const a of c.activities) {
      if (typeof a === "object" && a !== null) {
        bodyTexts.push(trimStr((a as Record<string, unknown>).description));
      }
    }
  }
  const filledTexts = bodyTexts.filter((t) => t.length > 0);
  const numericPattern = /\d+(?:[.,]\d+)?\s*(?:%|명|원|회|개|배|건|만|천|일|개월|년|시간|위|점|쪽|페이지)|\b\d+(?:[.,]\d+)?\s*(?:%|years?|months?|people|times|projects?|teams?)\b/i;
  const withNumbers = filledTexts.filter((t) => numericPattern.test(t));
  const impact = filledTexts.length === 0 ? 0 : Math.round((withNumbers.length / filledTexts.length) * 100);

  // uniqueness — 활동·자격증·링크·스킬 다양성
  let uChecks = 0;
  let uScore = 0;
  uChecks += 1;
  if (isArr(c.activities) && c.activities.length >= 2) uScore += 1;
  else if (isArr(c.activities) && c.activities.length >= 1) uScore += 0.5;
  uChecks += 1;
  if (isArr(c.certifications) && c.certifications.length >= 2) uScore += 1;
  else if (isArr(c.certifications) && c.certifications.length >= 1) uScore += 0.5;
  uChecks += 1;
  if (isArr(c.links) && c.links.length >= 1) uScore += 1;
  uChecks += 1;
  if (isArr(c.skills)) {
    if (c.skills.length >= 5) uScore += 1;
    else if (c.skills.length >= 3) uScore += 0.6;
    else if (c.skills.length >= 1) uScore += 0.3;
  }
  const uniqueness = Math.round((uScore / uChecks) * 100);

  // visual — 사진, 본문 길이 적정성, 제목 가독성
  let vChecks = 0;
  let vScore = 0;
  vChecks += 1;
  if (trimStr(c.basicPhotoUrl)) vScore += 1;
  vChecks += 1;
  if (introText.length === 0) vScore += 0;
  else if (introText.length <= 1500) vScore += 1;
  else if (introText.length <= 2500) vScore += 0.5;
  else vScore += 0.2;
  vChecks += 1;
  // 짧고 깔끔한 제목인지
  const title = trimStr((c as Record<string, unknown>).basicName);
  if (title.length > 0 && title.length <= 30) vScore += 1;
  else if (title.length > 0) vScore += 0.5;
  const visual = Math.round((vScore / vChecks) * 100);

  const qualityDims: ResumeQualityDimensions = { contentQuality, impact, uniqueness, visual };
  const qualityTotal = Math.round(
    (Object.keys(qualityDims) as Array<keyof ResumeQualityDimensions>).reduce(
      (sum, key) => sum + qualityDims[key] * RESUME_QUALITY_WEIGHTS[key],
      0
    )
  );

  // ===== Readiness 5 dimensions ===========================================

  // contact — 이름·이메일·전화·거주지 4 필드 평균
  const contactFields = [c.basicName, c.basicEmail, c.basicPhone, c.basicResidence];
  const contactFilled = contactFields.filter((v) => trimStr(v).length > 0).length;
  const contact = Math.round((contactFilled / contactFields.length) * 100);

  // education — 학력 1개 이상이면 100, 없으면 0 (이력서의 기본 신뢰 신호)
  const hasEducation =
    isArr(c.educations) &&
    c.educations.some((e) => typeof e === "object" && e !== null && trimStr((e as Record<string, unknown>).schoolName));
  const education = hasEducation ? 100 : 0;

  // visa — 비자 정보 채워졌는지. 외국인 채용의 절대 필수
  const visa = trimStr(c.basicVisa).length > 0 ? 100 : 0;

  // koreaFit — 한국 취업 적합도. 한국어 명시 + 다중 언어 + 한국 경험
  let kChecks = 0;
  let kScore = 0;
  kChecks += 1;
  const hasKoreanLang = isArr(c.languages) && c.languages.some((l) => {
    if (typeof l !== "object" || l === null) return false;
    const lang = trimStr((l as Record<string, unknown>).language).toLowerCase();
    const level = trimStr((l as Record<string, unknown>).level);
    return (lang.includes("kor") || lang.includes("한국") || lang === "ko") && level.length > 0;
  });
  if (hasKoreanLang) kScore += 1;
  kChecks += 1;
  if (isArr(c.languages) && c.languages.length >= 2) kScore += 1;
  else if (isArr(c.languages) && c.languages.length >= 1) kScore += 0.5;
  kChecks += 1;
  // 한국 거주 또는 한국어 자격증 같은 "한국 경험" 시그널 — 간단히 거주지가
  // 한국 표기인지로 근사.
  const residence = trimStr(c.basicResidence);
  if (residence && /한국|Korea|韩国|서울|Seoul|부산|Busan/i.test(residence)) kScore += 1;
  const koreaFit = Math.round((kScore / kChecks) * 100);

  // portfolio — 활동·자격증·링크 중 최소 1개라도 있으면 의미 있는 신호
  const hasActivity = isArr(c.activities) && c.activities.length >= 1;
  const hasCert = isArr(c.certifications) && c.certifications.length >= 1;
  const hasLink = isArr(c.links) && c.links.length >= 1;
  let pScore = 0;
  if (hasActivity) pScore += 0.5;
  if (hasCert) pScore += 0.25;
  if (hasLink) pScore += 0.25;
  const portfolio = Math.round(Math.min(1, pScore) * 100);

  const readinessDims: ResumeReadinessDimensions = { contact, education, visa, koreaFit, portfolio };
  const readinessTotal = Math.round(
    (Object.keys(readinessDims) as Array<keyof ResumeReadinessDimensions>).reduce(
      (sum, key) => sum + readinessDims[key] * RESUME_READINESS_WEIGHTS[key],
      0
    )
  );

  return {
    quality: { total: qualityTotal, dimensions: qualityDims },
    readiness: { total: readinessTotal, dimensions: readinessDims },
    level: resumeReadinessLevel(qualityTotal, readinessTotal)
  };
}

// Action generator — surfaces gaps by category:
//   required    기업이 검토할 수 없는 결정적 누락 (비자, 학력, 이름/이메일)
//   recommended 채워두면 매칭률·인상이 크게 좋아지는 항목
//   optional    있으면 좋고 없어도 무방한 디테일
//
// 5 개로 잘라내지 않고 모든 gap 을 반환 — UI 가 카테고리별로 그룹화해서
// 보여주므로 길어도 시각적으로 정리됨.
function generateResumeCoachActions(content: unknown): ResumeCoachAction[] {
  const actions: ResumeCoachAction[] = [];
  if (!content || typeof content !== "object") return actions;
  const c = content as Record<string, unknown>;
  const trimStr = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
  const isArr = (v: unknown): v is unknown[] => Array.isArray(v);

  // ===== Required — readiness 결정타 ======================================
  if (!trimStr(c.basicName)) {
    actions.push({ id: "fill-name", category: "required", title: "이름을 입력하세요", description: "이력서의 가장 기본 정보입니다.", impactPoints: 5, targetSection: "basics" });
  }
  if (!trimStr(c.basicEmail)) {
    actions.push({ id: "fill-email", category: "required", title: "이메일 주소를 입력하세요", description: "기업이 연락할 수 있어야 합니다.", impactPoints: 6, targetSection: "basics" });
  }
  // 비자 정보는 정규직 매칭 정확도를 끌어올리지만, Aply 의 인턴 체험(CIP)
  // 같은 비자 무관 포지션도 있으므로 "필수" 가 아닌 "추천" 으로 분류한다.
  if (!trimStr(c.basicVisa)) {
    actions.push({
      id: "add-visa",
      category: "recommended",
      title: "비자 정보를 입력하세요",
      description: "정규직 포지션 매칭 정확도가 올라가요. (인턴 체험은 비자 무관)",
      impactPoints: 6,
      targetSection: "basics"
    });
  }
  if (!isArr(c.educations) || c.educations.length === 0 || !c.educations.some((e) => typeof e === "object" && e !== null && trimStr((e as Record<string, unknown>).schoolName))) {
    actions.push({ id: "add-education", category: "required", title: "학력을 추가하세요", description: "학교명·전공·재학 상태를 입력해주세요.", impactPoints: 12, targetSection: "educations" });
  }
  const introText = trimStr(c.selfIntroduction) || trimStr(c.summary);
  if (introText.length === 0) {
    actions.push({
      id: "improve-self-introduction",
      category: "required",
      title: "자기소개를 작성하세요",
      description: "본인의 강점과 동기가 드러나도록 작성해보세요.",
      impactPoints: 10,
      targetSection: "selfIntroduction"
    });
  }

  // ===== Recommended — 채우면 매칭·인상이 크게 좋아지는 항목 ===============
  if (!trimStr(c.basicPhone)) {
    actions.push({ id: "fill-phone", category: "recommended", title: "전화번호를 입력하세요", description: "다급한 연락 채널이 필요할 수 있어요.", impactPoints: 4, targetSection: "basics" });
  }
  if (!trimStr(c.basicResidence)) {
    actions.push({ id: "fill-residence", category: "recommended", title: "거주지를 입력하세요", description: "출퇴근 가능 지역 판단에 사용됩니다.", impactPoints: 4, targetSection: "basics" });
  }
  if (introText.length > 0 && introText.length < 100) {
    actions.push({
      id: "improve-self-introduction-short",
      category: "recommended",
      title: "자기소개를 더 풍부하게 다듬어주세요",
      description: "100자 이상으로 구체적 사례를 더해보세요.",
      impactPoints: 7,
      targetSection: "selfIntroduction",
      llmEligible: true
    });
  } else if (introText.length >= 100 && introText.length < 400) {
    actions.push({
      id: "expand-self-introduction",
      category: "recommended",
      title: "자기소개에 구체적 사례를 더해보세요",
      description: "성과·프로젝트 경험을 1–2개 추가하면 인상이 달라집니다.",
      impactPoints: 5,
      targetSection: "selfIntroduction",
      llmEligible: true
    });
  }
  if (isArr(c.careers)) {
    c.careers.forEach((cr, idx) => {
      if (typeof cr !== "object" || cr === null) return;
      const obj = cr as Record<string, unknown>;
      const desc = trimStr(obj.description);
      const company = trimStr(obj.companyName) || "경력";
      if (desc.length > 0 && desc.length < 50) {
        actions.push({
          id: `improve-career-${idx}`,
          category: "recommended",
          title: `${company} 설명을 보강하세요`,
          description: "구체적 업무·성과·수치를 더해보세요.",
          impactPoints: 6,
          targetSection: "careers",
          targetItemIndex: idx,
          llmEligible: true
        });
      } else if (desc.length >= 50 && !/\d/.test(desc)) {
        actions.push({
          id: `add-metrics-career-${idx}`,
          category: "recommended",
          title: `${company} 성과를 수치로 표현하세요`,
          description: "예: '월 활성 사용자 30% 증가', '5인 팀 리드'.",
          impactPoints: 7,
          targetSection: "careers",
          targetItemIndex: idx,
          llmEligible: true
        });
      }
    });
  }
  const hasKorean = isArr(c.languages) && c.languages.some((l) => {
    if (typeof l !== "object" || l === null) return false;
    const lang = trimStr((l as Record<string, unknown>).language).toLowerCase();
    return lang.includes("kor") || lang.includes("한국") || lang === "ko";
  });
  if (!hasKorean) {
    actions.push({
      id: "add-korean-language",
      category: "recommended",
      title: "한국어 능력을 추가하세요",
      description: "TOPIK 등급이나 회화 수준을 표시해주세요.",
      impactPoints: 8,
      targetSection: "languages"
    });
  }
  if (!isArr(c.links) || c.links.length === 0) {
    actions.push({
      id: "add-link",
      category: "recommended",
      title: "포트폴리오·GitHub 링크를 추가하세요",
      description: "온라인 작업물이 있으면 더 설득력이 커집니다.",
      impactPoints: 5,
      targetSection: "links"
    });
  }
  if (!isArr(c.activities) || c.activities.length === 0) {
    actions.push({
      id: "add-activity",
      category: "recommended",
      title: "활동·프로젝트를 추가하세요",
      description: "동아리, 사이드 프로젝트, 봉사 등 1개라도 의미 있어요.",
      impactPoints: 5,
      targetSection: "activities"
    });
  }

  // ===== Optional — 디테일 정리 ==========================================
  if (!isArr(c.skills) || c.skills.length < 3) {
    actions.push({
      id: "add-skills",
      category: "optional",
      title: "기술 스택을 더 추가하세요",
      description: "3개 이상의 스킬을 적으면 검색·매칭에 유리합니다.",
      impactPoints: 3,
      targetSection: "skills"
    });
  }
  if (!isArr(c.certifications) || c.certifications.length === 0) {
    actions.push({
      id: "add-certification",
      category: "optional",
      title: "자격증을 추가하세요",
      description: "1개라도 있으면 차별화에 도움됩니다.",
      impactPoints: 3,
      targetSection: "certifications"
    });
  }
  if (!trimStr(c.basicPhotoUrl)) {
    actions.push({
      id: "add-photo",
      category: "optional",
      title: "프로필 사진을 등록하세요",
      description: "한국 기업은 사진을 본인 확인 신호로 받아들이는 경우가 많습니다.",
      impactPoints: 2,
      targetSection: "basics"
    });
  }

  // 같은 카테고리 안에서는 impact 점수 큰 순으로 정렬. 카테고리 순서는
  // required → recommended → optional (UI 에서 그룹별로 사용).
  const order: Record<ResumeCoachActionCategory, number> = { required: 0, recommended: 1, optional: 2 };
  actions.sort((a, b) => {
    if (a.category !== b.category) return order[a.category] - order[b.category];
    return b.impactPoints - a.impactPoints;
  });
  return actions;
}

// Position matcher — surfaces up to 3 positions. Prefers ones the user has
// already applied to (with application status). Pads with OPEN positions
// the user hasn't applied to yet, scored by simple visa/language/location
// overlap. Replace with embedding-based matching in a later iteration.
async function fetchResumeCoachPositionMatches(
  userId: string,
  content: unknown
): Promise<ResumeCoachPositionMatch[]> {
  if (!content || typeof content !== "object") return [];
  const c = content as Record<string, unknown>;
  const trimStr = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
  const isArr = (v: unknown): v is unknown[] => Array.isArray(v);

  // 코치 패널에 "가능한 포지션" 미니 리스트를 보여주려고 좀 더 넓게 잡음
  // (3 → 6). 카드가 컴팩트해서 늘려도 시각적 부담은 없고, 사용자에게 선택지
  // 가 많아 보일수록 행동을 유도하기 좋음. UI 가 필요에 따라 자체적으로
  // 슬라이스 가능.
  const TARGET = 6;
  const applied = await prisma.application.findMany({
    where: { candidateUserId: userId },
    orderBy: { submittedAt: "desc" },
    take: TARGET,
    select: {
      status: true,
      position: {
        select: {
          id: true,
          title: true,
          thumbnailImages: true,
          eligibleVisas: true,
          communicationLanguages: true,
          workLocation: true,
          partnerOrganization: { select: { name: true } }
        }
      }
    }
  });

  const userVisa = trimStr(c.basicVisa).toLowerCase();
  const userResidence = trimStr(c.basicResidence);
  const userSkills = isArr(c.skills) ? c.skills.map((s) => trimStr(s).toLowerCase()).filter(Boolean) : [];
  const hasKorean = isArr(c.languages) && c.languages.some((l) => {
    if (typeof l !== "object" || l === null) return false;
    const lang = trimStr((l as Record<string, unknown>).language).toLowerCase();
    return lang.includes("kor") || lang.includes("한국") || lang === "ko";
  });

  const scoreFor = (pos: {
    eligibleVisas?: string[];
    communicationLanguages?: string[];
    workLocation?: string | null;
  }): number => {
    let s = 50;
    const visas = (pos.eligibleVisas ?? []).map((v) => v.toLowerCase());
    if (userVisa && visas.length > 0 && visas.some((v) => v.includes(userVisa) || userVisa.includes(v))) s += 10;
    if (userResidence && pos.workLocation && pos.workLocation.includes(userResidence)) s += 10;
    const langs = (pos.communicationLanguages ?? []).map((l) => l.toLowerCase());
    if (hasKorean && langs.some((l) => l.includes("kor") || l.includes("한국") || l === "ko")) s += 15;
    if (userSkills.length > 0) s += 5;
    return Math.min(100, s);
  };

  const appliedItems: ResumeCoachPositionMatch[] = applied
    .filter((a) => a.position)
    .map((a) => ({
      positionId: a.position!.id,
      title: a.position!.title,
      organizationName: a.position!.partnerOrganization?.name ?? null,
      matchScore: scoreFor(a.position!),
      status: "applied",
      applicationStatus: a.status,
      thumbnailUrl: (a.position!.thumbnailImages ?? [])[0] ?? null,
      workLocation: a.position!.workLocation ?? null
    }));

  if (appliedItems.length >= TARGET) return appliedItems;

  const padCount = TARGET - appliedItems.length;
  const open = await prisma.position.findMany({
    where: {
      status: "OPEN",
      NOT: { applications: { some: { candidateUserId: userId } } }
    },
    orderBy: { updatedAt: "desc" },
    take: padCount * 4,
    select: {
      id: true,
      title: true,
      thumbnailImages: true,
      eligibleVisas: true,
      communicationLanguages: true,
      workLocation: true,
      partnerOrganization: { select: { name: true } }
    }
  });
  const openItems: ResumeCoachPositionMatch[] = open
    .map((pos) => ({
      positionId: pos.id,
      title: pos.title,
      organizationName: pos.partnerOrganization?.name ?? null,
      matchScore: scoreFor(pos),
      status: "open" as const,
      applicationStatus: null,
      thumbnailUrl: (pos.thumbnailImages ?? [])[0] ?? null,
      workLocation: pos.workLocation ?? null
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, padCount);

  return [...appliedItems, ...openItems];
}

// GET /ops/resumes — operator-facing list of every Resume in the system.
// Matches the /ops/users shape (items + page + pageSize + total + totalPages)
// so the frontend can reuse the same list+pagination pattern. Search hits
// resume title, owner name, owner email. Owner is joined and surfaced so
// the table can show "이름 · 이메일" without an N+1.
// ---------------------------------------------------------------------------
const listResumesQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  isPrimary: z
    .union([z.boolean(), z.enum(["true", "false", "1", "0"]).transform((v) => v === "true" || v === "1")])
    .optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "title"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().refine((v) => [20, 30, 40, 100].includes(v), "pageSize must be one of 20,30,40,100").optional()
});

app.get("/ops/resumes", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const parsed = listResumesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid query", errors: parsed.error.flatten() });
  }

  const { search, isPrimary, sortBy = "createdAt", sortOrder = "desc", page = 1, pageSize = 20 } = parsed.data;
  const orderByMap = {
    createdAt: { createdAt: sortOrder },
    updatedAt: { updatedAt: sortOrder },
    title: { title: sortOrder }
  } as const;
  const orderBy = orderByMap[sortBy];

  const where: Prisma.ResumeWhereInput = {
    ...(typeof isPrimary === "boolean" ? { isPrimary } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { user: { email: { contains: search, mode: Prisma.QueryMode.insensitive } } },
            { user: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } }
          ]
        }
      : {})
  };

  const [total, resumes] = await Promise.all([
    prisma.resume.count({ where }),
    prisma.resume.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        userId: true,
        title: true,
        isPrimary: true,
        shareSlug: true,
        content: true, // completion 계산용 — 응답에는 빼고 내부에서만 사용
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phoneNumber: true,
            authProvider: true,
            createdAt: true
          }
        }
      }
    })
  ]);

  return res.json({
    ok: true,
    items: resumes.map((r) => ({
      id: r.id,
      title: r.title,
      isPrimary: r.isPrimary,
      shareSlug: r.shareSlug,
      completionRate: calcResumeCompletion(r.content),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: r.user
        ? {
            id: r.user.id,
            email: r.user.email,
            name: r.user.name,
            role: r.user.role,
            phoneNumber: r.user.phoneNumber,
            authProvider: r.user.authProvider,
            createdAt: r.user.createdAt
          }
        : null
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  });
});

// Detail view — full `content` JSON included so the ops modal can render
// the structured resume body.
app.get("/ops/resumes/:id", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ ok: false, message: "invalid resume id" });

  const resume = await prisma.resume.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phoneNumber: true,
          authProvider: true,
          adminMemo: true,
          createdAt: true
        }
      }
    }
  });
  if (!resume) return res.status(404).json({ ok: false, message: "not found" });

  return res.json({
    ok: true,
    resume: {
      id: resume.id,
      title: resume.title,
      content: resume.content,
      isPrimary: resume.isPrimary,
      completionRate: calcResumeCompletion(resume.content),
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
      user: resume.user
    }
  });
});

app.patch("/ops/users/:id/admin-memo", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
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

// Hard-delete a user from the database. Restricted to a single super-admin
// email so a normal operator can't wipe production users by accident. The
// allow-listed admin can be overridden with OPS_HARD_DELETE_ALLOWED_EMAILS
// (comma-separated). User cascades remove related rows via Prisma schema.
const opsHardDeleteAllowedEmails = (process.env.OPS_HARD_DELETE_ALLOWED_EMAILS ?? "test@test.com")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

app.delete("/ops/users/:id", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid user id" });
  }

  const callerId = req.auth!.userId;
  const caller = await prisma.user.findUnique({ where: { id: callerId }, select: { email: true } });
  const callerEmail = caller?.email?.trim().toLowerCase() ?? "";
  if (!callerEmail || !opsHardDeleteAllowedEmails.includes(callerEmail)) {
    return res.status(403).json({ ok: false, message: "forbidden" });
  }

  if (id === callerId) {
    return res.status(400).json({ ok: false, message: "cannot delete self" });
  }

  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
    if (!target) {
      return res.status(404).json({ ok: false, message: "user not found" });
    }

    await prisma.user.delete({ where: { id } });

    void writeAuditLog(req, {
      action: "OPS_USER_HARD_DELETED",
      resource: "user",
      resourceId: id,
      metadata: { targetEmail: target.email, callerEmail }
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("[ops/users/delete] failed", error);
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2025") {
      return res.status(404).json({ ok: false, message: "user not found" });
    }
    return res.status(500).json({ ok: false, message: getErrorMessage(error) });
  }
});

app.patch("/ops/partners/:id/verification-approval", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid partner id" });
  }

  const parsed = updatePartnerVerificationApprovalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  try {
    const updated = await prisma.partnerOrganization.update({
      where: { id },
      data: {
        verificationApproved: parsed.data.approved,
        verificationApprovedAt: parsed.data.approved ? new Date() : null
      }
    });

    return res.json({ ok: true, item: toPartnerOrganization(updated) });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2025") {
      return res.status(404).json({ ok: false, message: "partner not found" });
    }
    return res.status(500).json({ ok: false, message: "failed to update partner verification approval" });
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
    select: { id: true, partnerType: true, name: true }
  });
  if (!partner) {
    return res.status(404).json({ ok: false, message: "partner not found" });
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
        partnerOrganizationId: partner.id,
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

app.post("/ops/partners/:id/join-codes", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    return res.status(400).json({ ok: false, message: "invalid partner id" });
  }

  const parsed = createPartnerJoinCodeSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "invalid request", errors: parsed.error.flatten() });
  }

  const partner = await prisma.partnerOrganization.findUnique({
    where: { id },
    select: { id: true }
  });
  if (!partner) {
    return res.status(404).json({ ok: false, message: "partner not found" });
  }

  const expiresInMinutes = parsed.data.expiresInMinutes ?? partnerJoinCodeTtlMinutesDefault;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);
  const code = generatePartnerJoinCode();

  await prisma.partnerOrganizationJoinCode.create({
    data: {
      partnerOrganizationId: partner.id,
      createdByUserId: req.auth!.userId,
      codeHash: hashToken(code),
      expiresAt
    }
  });

  return res.status(201).json({
    ok: true,
    item: {
      code,
      expiresAt
    }
  });
});

app.delete("/ops/partners/:id/members/:memberId", authenticate, requireRoles([MemberRole.OPERATOR]), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const memberId = Array.isArray(req.params.memberId) ? req.params.memberId[0] : req.params.memberId;
  if (!id || !memberId) {
    return res.status(400).json({ ok: false, message: "invalid request" });
  }

  const partner = await prisma.partnerOrganization.findUnique({ where: { id }, select: { id: true } });
  if (!partner) {
    return res.status(404).json({ ok: false, message: "partner not found" });
  }

  const member = await prisma.user.findFirst({
        where: {
          id: memberId,
          role: MemberRole.PARTNER,
          partnerOrganizationId: id
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
    const companyLogoImageData = parsed.data.companyLogoImageData?.trim()
      ? await uploadDataUrlImageIfNeeded(parsed.data.companyLogoImageData.trim(), "partner/company-logo")
      : parsed.data.companyLogoImageData;
    const officePhotoImageData = parsed.data.officePhotoImageData?.trim()
      ? await uploadDataUrlImageIfNeeded(parsed.data.officePhotoImageData.trim(), "partner/office-photo")
      : parsed.data.officePhotoImageData;

    const created = await prisma.partnerOrganization.create({
      data: {
        partnerType: parsed.data.partnerType,
        name: parsed.data.name,
        slug: await generateUniquePartnerOrganizationSlug(parsed.data.name, prisma),
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
        companyLogoImageData,
        officePhotoImageData,
        verificationApproved: false,
        verificationApprovedAt: null
      }
    });

    return res.status(201).json({ ok: true, item: toPartnerOrganization(created) });
  } catch (error) {
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
    const companyLogoImageData =
      parsed.data.companyLogoImageData === undefined
        ? undefined
        : (parsed.data.companyLogoImageData?.trim()
          ? await uploadDataUrlImageIfNeeded(parsed.data.companyLogoImageData.trim(), "partner/company-logo")
          : null);
    const officePhotoImageData =
      parsed.data.officePhotoImageData === undefined
        ? undefined
        : (parsed.data.officePhotoImageData?.trim()
          ? await uploadDataUrlImageIfNeeded(parsed.data.officePhotoImageData.trim(), "partner/office-photo")
          : null);
    const shouldResetVerificationApproval =
      parsed.data.businessRegistrationDocumentData !== undefined
      || parsed.data.fourInsuranceSubscriberListData !== undefined;

    const updated = await prisma.partnerOrganization.update({
      where: { id },
      data: {
        partnerType: parsed.data.partnerType,
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
        ...(companyLogoImageData !== undefined ? { companyLogoImageData } : {}),
        ...(officePhotoImageData !== undefined ? { officePhotoImageData } : {}),
        ...(shouldResetVerificationApproval ? { verificationApproved: false, verificationApprovedAt: null } : {})
      }
    });

    return res.json({ ok: true, item: toPartnerOrganization(updated) });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2025") {
      return res.status(404).json({ ok: false, message: "partner not found" });
    }

    return res.status(500).json({ ok: false, message: "failed to update partner organization" });
  }
});

// Express global error handler — catches errors thrown inside any route and
// forwards them to Discord via ERROR_DISCORD_WEBHOOK_URL.
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const error = err instanceof Error ? err : new Error(typeof err === "string" ? err : "unknown error");
  console.error("[express-error]", error);
  // Skip noise patterns from Discord. CORS rejections are already logged
  // server-side with the offending origin in [cors] warn lines.
  const noisePatterns = [/Not allowed by CORS/i];
  const shouldForward = !noisePatterns.some((re) => re.test(error.message ?? ""));
  if (shouldForward) {
    void postErrorToDiscord({
      title: error.message || "Unknown error",
      source: "api",
      path: req.path,
      method: req.method,
      stack: error.stack
    });
  }
  if (res.headersSent) return next(err);
  res.status(500).json({ ok: false, message: "Internal server error" });
});

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
  void postErrorToDiscord({
    title: `uncaughtException: ${err.message}`,
    source: "api",
    stack: err.stack
  });
});

process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  console.error("[unhandledRejection]", err);
  void postErrorToDiscord({
    title: `unhandledRejection: ${err.message}`,
    source: "api",
    stack: err.stack
  });
});

if (process.env.VERCEL !== "1") {
  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
    console.info("[runtime-config]", {
      dbTarget: getDatabaseTargetMeta(),
      crawlerScheduler: {
        enabled: crawlSchedulerEnabled,
        hourKst: crawlSchedulerHourKst,
        minuteKst: crawlSchedulerMinuteKst,
        runOnBoot: crawlSchedulerRunOnBoot
      }
    });
    startCrawlerScheduler();
  });
}

export default app;
