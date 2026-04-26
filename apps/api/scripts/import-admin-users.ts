import "dotenv/config";
import bcrypt from "bcryptjs";
import { MemberRole, PartnerOrgUserRole, PartnerType, PrismaClient } from "@prisma/client";

type RawUser = Record<string, unknown>;

const prisma = new PrismaClient();

const API_BASE = process.env.ADMIN_USERS_API_URL ?? "https://admin.flip-ers.com/api/users";
const TOKEN = process.env.ADMIN_USERS_TOKEN ?? "";
const PAGE_SIZE = Number(process.env.ADMIN_USERS_PAGE_SIZE ?? 100);
const MAX_PAGES = Number(process.env.ADMIN_USERS_MAX_PAGES ?? 0);
const DEFAULT_PASSWORD = process.env.ADMIN_USERS_DEFAULT_PASSWORD ?? "Temp!ChangeMe123";

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function asDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function parsePagePayload(payload: unknown): { users: RawUser[]; total?: number } {
  if (!payload || typeof payload !== "object") return { users: [] };
  const p = payload as Record<string, unknown>;
  const users = Array.isArray(p.data) ? (p.data as RawUser[]) : [];
  const total = typeof p.total === "number" ? p.total : undefined;
  return { users, total };
}

function normalizeEmail(raw: RawUser): string | null {
  const email = asString(raw.email);
  return email ? email.toLowerCase() : null;
}

function mapRole(rawRole: string | null) {
  const normalized = (rawRole ?? "").toUpperCase();
  if (normalized === "COMPANY") {
    return {
      role: MemberRole.PARTNER,
      partnerType: PartnerType.COMPANY,
      partnerOrgRole: PartnerOrgUserRole.MEMBER
    };
  }
  if (normalized === "ADMIN") {
    return {
      role: MemberRole.OPERATOR,
      partnerType: null,
      partnerOrgRole: null
    };
  }
  return {
    role: MemberRole.STUDENT,
    partnerType: null,
    partnerOrgRole: null
  };
}

async function fetchPage(page: number) {
  const url = new URL(API_BASE);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(PAGE_SIZE));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TOKEN}`
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`fetch failed (page=${page}, status=${response.status}): ${text.slice(0, 300)}`);
  }

  return parsePagePayload((await response.json()) as unknown);
}

async function run() {
  if (!TOKEN) throw new Error("ADMIN_USERS_TOKEN is required");

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  let page = 1;
  let total: number | undefined;

  let fetched = 0;
  let imported = 0;
  let updated = 0;
  let skippedNoEmail = 0;
  let participants = 0;
  let companies = 0;
  let admins = 0;

  while (true) {
    if (MAX_PAGES > 0 && page > MAX_PAGES) break;

    const { users, total: responseTotal } = await fetchPage(page);
    if (typeof responseTotal === "number") total = responseTotal;
    if (users.length === 0) break;

    for (const raw of users) {
      fetched += 1;
      const email = normalizeEmail(raw);
      if (!email) {
        skippedNoEmail += 1;
        continue;
      }

      const name = asString(raw.name);
      const emailVerified = asBoolean(raw.emailVerified);
      const roleRaw = asString(raw.role);
      const createdAt = asDate(raw.createdAt);
      const mapped = mapRole(roleRaw);

      if (mapped.role === MemberRole.STUDENT) participants += 1;
      if (mapped.role === MemberRole.PARTNER) companies += 1;
      if (mapped.role === MemberRole.OPERATOR) admins += 1;

      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      });

      await prisma.user.upsert({
        where: { email },
        create: {
          email,
          passwordHash,
          name,
          emailVerified,
          role: mapped.role,
          partnerType: mapped.partnerType,
          partnerOrgRole: mapped.partnerOrgRole,
          ...(createdAt ? { createdAt } : {})
        },
        update: {
          name,
          emailVerified,
          role: mapped.role,
          partnerType: mapped.partnerType,
          partnerOrgRole: mapped.partnerOrgRole
        }
      });

      if (existing) updated += 1;
      else imported += 1;
    }

    if (users.length < PAGE_SIZE) break;
    if (total !== undefined && fetched >= total) break;
    page += 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        apiBase: API_BASE,
        pageSize: PAGE_SIZE,
        pagesProcessed: page,
        totalFromApi: total ?? null,
        fetched,
        imported,
        updated,
        skippedNoEmail,
        participants,
        companies,
        admins
      },
      null,
      2
    )
  );
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

