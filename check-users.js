const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.profile.count();
    console.log(`Total profiles: ${count}`);

    if (count > 0) {
      const profiles = await prisma.profile.findMany({
        select: { id: true, username: true, email: true, role: true, isActive: true },
      });
      console.table(profiles);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
