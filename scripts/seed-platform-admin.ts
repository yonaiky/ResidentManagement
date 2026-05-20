/**
 * PLATFORM_ADMIN_EMAIL=you@example.com npx tsx scripts/seed-platform-admin.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.PLATFORM_ADMIN_EMAIL;
  if (!email) {
    console.error("Set PLATFORM_ADMIN_EMAIL");
    process.exit(1);
  }

  const profile = await prisma.profile.findUnique({ where: { email } });
  if (!profile) {
    console.error("Profile not found for", email);
    process.exit(1);
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: { role: "platform_admin" },
  });

  console.log("Updated", email, "to platform_admin");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
