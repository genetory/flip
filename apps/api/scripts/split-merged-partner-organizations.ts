import { MemberRole, PartnerType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "partner";
}

async function uniqueSlug(baseName: string) {
  const base = slugify(baseName);
  let candidate = base;
  let seq = 2;
  while (true) {
    const exists = await prisma.partnerOrganization.findUnique({
      where: { slug: candidate },
      select: { id: true }
    });
    if (!exists) return candidate;
    candidate = `${base}-${seq}`;
    seq += 1;
  }
}

async function main() {
  const orgs = await prisma.partnerOrganization.findMany({
    where: {
      partnerType: PartnerType.COMPANY,
      adminMemo: { contains: "Auto-created from partner registration." }
    },
    select: {
      id: true,
      name: true,
      slug: true,
      partnerType: true,
      industry: true,
      companySize: true,
      officeAddress: true,
      website: true,
      socialMedia: true,
      description: true,
      strengths: true,
      createdAt: true,
      users: {
        where: { role: MemberRole.PARTNER },
        select: { id: true, email: true, createdAt: true, partnerOrgRole: true },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }]
      },
      positions: {
        select: { id: true },
        take: 1
      }
    }
  });

  let movedUsers = 0;
  let splitOrgs = 0;

  for (const org of orgs) {
    if (org.users.length <= 1) continue;

    // Keep the earliest account in the original org and split the rest.
    const [, ...usersToMove] = org.users;
    if (usersToMove.length === 0) continue;

    for (const user of usersToMove) {
      const newSlug = await uniqueSlug(`${org.slug || org.name}-${user.id.slice(0, 6)}`);
      const created = await prisma.partnerOrganization.create({
        data: {
          partnerType: org.partnerType,
          name: org.name,
          slug: newSlug,
          industry: org.industry,
          companySize: org.companySize,
          officeAddress: org.officeAddress,
          website: org.website,
          socialMedia: org.socialMedia,
          description: org.description,
          strengths: org.strengths,
          adminMemo: `Auto-split from merged org ${org.id} on ${new Date().toISOString()}`,
          verificationApproved: false,
          verificationApprovedAt: null,
          businessRegistrationDocumentData: null,
          fourInsuranceSubscriberListData: null,
          companyLogoImageData: null,
          officePhotoImageData: null
        },
        select: { id: true, slug: true }
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          partnerOrganizationId: created.id
        }
      });

      movedUsers += 1;
      console.log(`moved user ${user.email} -> org ${created.id} (${created.slug})`);
    }

    splitOrgs += 1;
  }

  console.log(JSON.stringify({ scanned: orgs.length, splitOrgs, movedUsers }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
