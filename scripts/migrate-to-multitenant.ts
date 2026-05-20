/**
 * Idempotent data migration: default tenant + property + memberships.
 * Run after: npx prisma migrate deploy (or db push)
 */
import { PrismaClient } from "@prisma/client";
import { applyPlanLimitsToTenant } from "../lib/tenant/plans";

const prisma = new PrismaClient();

const DEFAULT_TENANT_SLUG = "default";
const DEFAULT_PROPERTY_CODE = "principal";

async function main() {
  let tenant = await prisma.tenant.findUnique({
    where: { slug: DEFAULT_TENANT_SLUG },
  });

  if (!tenant) {
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 14);
    tenant = await prisma.tenant.create({
      data: {
        name: "Residencial Principal",
        slug: DEFAULT_TENANT_SLUG,
        plan: "BASIC",
        status: "ACTIVE",
        trialEndsAt: trialEnds,
        ...applyPlanLimitsToTenant("BASIC"),
      },
    });
    console.log("Created default tenant:", tenant.id);
  }

  let property = await prisma.property.findFirst({
    where: { tenantId: tenant.id, code: DEFAULT_PROPERTY_CODE },
  });

  if (!property) {
    property = await prisma.property.create({
      data: {
        tenantId: tenant.id,
        name: "Propiedad Principal",
        code: DEFAULT_PROPERTY_CODE,
        propertyType: "condominium",
        address: "Dirección principal",
      },
    });
    console.log("Created default property:", property.id);
  }

  const profiles = await prisma.profile.findMany();
  for (const profile of profiles) {
    const role =
      profile.role === "admin"
        ? "tenant_admin"
        : profile.role === "manager"
          ? "manager"
          : profile.role === "technician"
            ? "technician"
            : "user";

    await prisma.tenantMembership.upsert({
      where: {
        tenantId_profileId: { tenantId: tenant.id, profileId: profile.id },
      },
      create: {
        tenantId: tenant.id,
        profileId: profile.id,
        role,
        status: "active",
      },
      update: { role, status: "active" },
    });
  }
  console.log(`Synced ${profiles.length} memberships`);

  const updates: Array<() => Promise<unknown>> = [
    () =>
      prisma.resident.updateMany({
        where: { tenantId: { not: tenant.id } },
        data: { tenantId: tenant.id },
      }),
    () =>
      prisma.token.updateMany({
        where: { tenantId: { not: tenant.id } },
        data: { tenantId: tenant.id },
      }),
    () =>
      prisma.payment.updateMany({
        where: { tenantId: { not: tenant.id } },
        data: { tenantId: tenant.id },
      }),
    () =>
      prisma.notification.updateMany({
        where: { tenantId: { not: tenant.id } },
        data: { tenantId: tenant.id },
      }),
    () =>
      prisma.maintenanceTicket.updateMany({
        where: { tenantId: { not: tenant.id } },
        data: { tenantId: tenant.id, propertyId: property!.id },
      }),
    () =>
      prisma.parkingSpot.updateMany({
        where: { tenantId: { not: tenant.id } },
        data: { tenantId: tenant.id, propertyId: property!.id },
      }),
    () =>
      prisma.vehicle.updateMany({
        where: { tenantId: { not: tenant.id } },
        data: { tenantId: tenant.id },
      }),
    () =>
      prisma.parkingFine.updateMany({
        where: { tenantId: { not: tenant.id } },
        data: { tenantId: tenant.id },
      }),
    () =>
      prisma.maintenanceSlaRule.updateMany({
        where: { tenantId: { not: tenant.id } },
        data: { tenantId: tenant.id },
      }),
  ];

  for (const fn of updates) {
    const result = await fn();
    if (result && typeof result === "object" && "count" in result) {
      console.log("Updated rows:", (result as { count: number }).count);
    }
  }

  const company = await prisma.companyInfo.findFirst();
  if (company && !company.tenantId) {
    await prisma.companyInfo.updateMany({
      data: { tenantId: tenant.id },
    });
  }

  const fiscal = await prisma.fiscalConfig.findFirst();
  if (fiscal) {
    await prisma.fiscalConfig.updateMany({ data: { tenantId: tenant.id } });
  }

  const invoice = await prisma.invoiceConfig.findFirst();
  if (invoice) {
    await prisma.invoiceConfig.updateMany({ data: { tenantId: tenant.id } });
  }

  console.log("Migration complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
