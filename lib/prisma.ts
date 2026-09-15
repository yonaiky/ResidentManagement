import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Cached on globalThis in every environment: Next.js bundles each route handler
// separately, so without this each one would open its own connection pool and
// exhaust the database's connection limit.
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

globalForPrisma.prisma = prisma;
