import "dotenv/config";
import bcrypt from "bcryptjs";
import { MemberRole, PartnerOrgUserRole, PartnerType, PrismaClient } from "@prisma/client";

type RawUser = Record<string, unknown>;

type PageResult = {
  users: RawUser[];
  totalPages?: number;
};

const prisma = new PrismaClient();

const API_BASE =
  process.env.COMPANY_USERS_API_URL ??
  "https://admin-staging.flip-ers.com/api/users/company-users";
const TOKEN = process.env.COMPANY_USERS_TOKEN ?? "";
const PAGE_SIZE = Number(process.env.COMPANY_USERS_PAGE_SIZE ?? 20);
const MAX_PAGES = Number(process.env.COMPANY_USERS_MAX_PAGES ?? 0);
const DEFAULT_PASSWORD = process.env.COMPANY_USERS_DEFAULT_PASSWORD ?? "Temp!ChangeMe123";

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function pickEmail(raw: RawUser): string | null {
  return (
    asString(raw.email) ??
    asString(raw.userEmail) ??
    asString(raw.loginEmail) ??
    asString(raw.username) ??
    null
  );
}

function pickName(raw: RawUser): string | null {
  return (
    asString(raw.name) ??
    asString(raw.fullName) ??
    asString(raw.userName) ??
    asString(raw.contactName) ??
    null
  );
}

function pickDomain(raw: RawUser, email: string): string | null {
  const company = (raw.company ?? raw.partner ?? null) as Record<string, unknown> | null;
  const domainFromPayload =
    asString(raw.domain) ??
    asString(raw.companyDomain) ??
    asString(company?.domain) ??
    null;

  if (domainFromPayload) return domainFromPayload.toLowerCase();

  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

function pickEmailVerified(raw: RawUser): boolean {
  const value = raw.emailVerified;
  if (typeof value === "boolean") return value;
  return false;
}

function pickPartnerOrgRole(raw: RawUser): PartnerOrgUserRole {
  const member = raw.organizationMember as Record<string, unknown> | undefined;
  const roleRaw = asString(raw.partnerOrgRole) ?? asString(member?.role) ?? "";
  const normalized = roleRaw.toUpperCase();
  if (normalized === "OWNER") return PartnerOrgUserRole.OWNER;
  if (normalized === "ADMIN" || normalized === "MANAGER") return PartnerOrgUserRole.ADMIN;
  return PartnerOrgUserRole.MEMBER;
}

function parsePagePayload(payload: unknown): PageResult {
  if (Array.isArray(payload)) {
    return { users: payload as RawUser[] };
  }

  if (!payload || typeof payload !== "object") {
    return { users: [] };
  }

  const p = payload as Record<string, unknown>;
  if (Array.isArray(p.data)) {
    return { users: p.data as RawUser[] };
  }
  const container =
    (p.data as Record<string, unknown> | undefined) ??
    (p.result as Record<string, unknown> | undefined) ??
    p;

  const users =
    (Array.isArray(container.items) ? container.items : null) ??
    (Array.isArray(container.users) ? container.users : null) ??
    (Array.isArray(container.results) ? container.results : null) ??
    (Array.isArray(container.list) ? container.list : null) ??
    [];

  const totalPagesRaw =
    (container.totalPages as number | undefined) ??
    (container.lastPage as number | undefined) ??
    (container.pageCount as number | undefined) ??
    ((container.pagination as Record<string, unknown> | undefined)?.totalPages as number | undefined);

  return {
    users: users as RawUser[],
    totalPages: typeof totalPagesRaw === "number" && Number.isFinite(totalPagesRaw) ? totalPagesRaw : undefined
  };
}

async function fetchPage(page: number): Promise<PageResult> {
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

  const payload = (await response.json()) as unknown;
  return parsePagePayload(payload);
}

async function run() {
  if (!TOKEN) {
    throw new Error("COMPANY_USERS_TOKEN is required");
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const partnerDomainSet = new Set(
    (
      await prisma.partnerOrganization.findMany({
        where: { partnerType: PartnerType.COMPANY },
        select: { domain: true }
      })
    ).map((item) => item.domain.toLowerCase())
  );

  let page = 1;
  let fetched = 0;
  let imported = 0;
  let skippedNoEmail = 0;
  let skippedNoPartner = 0;
  let updated = 0;

  while (true) {
    if (MAX_PAGES > 0 && page > MAX_PAGES) break;

    const { users, totalPages } = await fetchPage(page);
    if (users.length === 0) break;

    for (const raw of users) {
      fetched += 1;
      const emailRaw = pickEmail(raw);
      if (!emailRaw) {
        skippedNoEmail += 1;
        continue;
      }

      const email = emailRaw.toLowerCase();
      const name = pickName(raw);
      const emailVerified = pickEmailVerified(raw);
      const partnerOrgRole = pickPartnerOrgRole(raw);
      const domain = pickDomain(raw, email);
      if (!domain || !partnerDomainSet.has(domain)) {
        skippedNoPartner += 1;
        continue;
      }

      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      });

      await prisma.user.upsert({
        where: { email },
        create: {
          email,
          emailVerified,
          name,
          passwordHash,
          role: MemberRole.PARTNER,
          partnerType: PartnerType.COMPANY,
          partnerOrgRole
        },
        update: {
          emailVerified,
          name,
          role: MemberRole.PARTNER,
          partnerType: PartnerType.COMPANY,
          partnerOrgRole
        }
      });

      if (existing) updated += 1;
      else imported += 1;
    }

    if (totalPages && page >= totalPages) break;
    if (users.length < PAGE_SIZE) break;
    page += 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        pageSize: PAGE_SIZE,
        pagesProcessed: page,
        fetched,
        imported,
        updated,
        skippedNoEmail,
        skippedNoPartner
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
