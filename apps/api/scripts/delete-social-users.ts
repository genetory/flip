import { PrismaClient, AuthProvider } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const grouped = await prisma.user.groupBy({
    by: ["authProvider"],
    where: { authProvider: { not: AuthProvider.EMAIL } },
    _count: { _all: true }
  });

  if (grouped.length === 0) {
    console.log("No social users found.");
    return;
  }

  console.log("Before delete:");
  for (const row of grouped) {
    console.log(`  ${row.authProvider}: ${row._count._all}`);
  }

  const result = await prisma.user.deleteMany({
    where: { authProvider: { not: AuthProvider.EMAIL } }
  });

  console.log(`\nDeleted ${result.count} social users (cascades to RefreshToken, CandidateProfile, etc.)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
