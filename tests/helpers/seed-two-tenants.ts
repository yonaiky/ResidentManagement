import { prisma } from "@/lib/prisma";
import { slugifyTenantName } from "@/lib/tenant/plans";

export type TwoTenantSeed = {
  tenantA: { id: string };
  tenantB: { id: string };
  orgA: { id: string };
  orgB: { id: string };
  residentA: { id: number };
  residentB: { id: number };
  unitA: { id: string };
  unitB: { id: string };
  paymentA: { id: number };
  paymentB: { id: number };
  tokenA: { id: number };
  tokenB: { id: number };
  profileA: { id: string };
  profileB: { id: string };
};

const PREFIX = `test-isolation-${Date.now()}`;

export async function seedTwoTenants(): Promise<TwoTenantSeed> {
  const slugA = slugifyTenantName(`${PREFIX}-a`);
  const slugB = slugifyTenantName(`${PREFIX}-b`);

  const profileA = await prisma.profile.create({
    data: {
      id: crypto.randomUUID(),
      username: `${PREFIX}-user-a`,
      email: `${PREFIX}-a@test.local`,
      role: "admin",
    },
  });

  const profileB = await prisma.profile.create({
    data: {
      id: crypto.randomUUID(),
      username: `${PREFIX}-user-b`,
      email: `${PREFIX}-b@test.local`,
      role: "admin",
    },
  });

  const tenantA = await prisma.tenant.create({
    data: {
      name: `${PREFIX} Tenant A`,
      slug: slugA,
      status: "ACTIVE",
    },
  });

  const tenantB = await prisma.tenant.create({
    data: {
      name: `${PREFIX} Tenant B`,
      slug: slugB,
      status: "ACTIVE",
    },
  });

  const orgA = await prisma.organization.create({
    data: {
      tenantId: tenantA.id,
      name: `${PREFIX} Org A`,
      slug: slugA,
      status: "ACTIVE",
    },
  });

  const orgB = await prisma.organization.create({
    data: {
      tenantId: tenantB.id,
      name: `${PREFIX} Org B`,
      slug: slugB,
      status: "ACTIVE",
    },
  });

  await prisma.tenantMembership.createMany({
    data: [
      {
        tenantId: tenantA.id,
        profileId: profileA.id,
        role: "tenant_admin",
        status: "active",
      },
      {
        tenantId: tenantB.id,
        profileId: profileB.id,
        role: "tenant_admin",
        status: "active",
      },
    ],
  });

  await prisma.organizationMembership.createMany({
    data: [
      {
        organizationId: orgA.id,
        profileId: profileA.id,
        role: "tenant_admin",
        status: "active",
      },
      {
        organizationId: orgB.id,
        profileId: profileB.id,
        role: "tenant_admin",
        status: "active",
      },
    ],
  });

  const propertyA = await prisma.property.create({
    data: {
      tenantId: tenantA.id,
      organizationId: orgA.id,
      name: "Prop A",
      code: `${PREFIX}-PA`,
    },
  });

  const propertyB = await prisma.property.create({
    data: {
      tenantId: tenantB.id,
      organizationId: orgB.id,
      name: "Prop B",
      code: `${PREFIX}-PB`,
    },
  });

  const unitA = await prisma.unit.create({
    data: { propertyId: propertyA.id, code: "A-101" },
  });

  const unitB = await prisma.unit.create({
    data: { propertyId: propertyB.id, code: "B-101" },
  });

  const residentA = await prisma.resident.create({
    data: {
      tenantId: tenantA.id,
      name: "Juan",
      lastName: "Pérez",
      cedula: `${PREFIX}-ced-a`,
      phone: "8090000001",
      address: "Calle A",
    },
  });

  const residentB = await prisma.resident.create({
    data: {
      tenantId: tenantB.id,
      name: "Carlos",
      lastName: "Díaz",
      cedula: `${PREFIX}-ced-b`,
      phone: "8090000002",
      address: "Calle B",
    },
  });

  const paymentA = await prisma.payment.create({
    data: {
      tenantId: tenantA.id,
      residentId: residentA.id,
      amount: 700,
      dueDate: new Date(),
      month: 1,
      year: 2026,
      status: "completed",
    },
  });

  const paymentB = await prisma.payment.create({
    data: {
      tenantId: tenantB.id,
      residentId: residentB.id,
      amount: 800,
      dueDate: new Date(),
      month: 1,
      year: 2026,
      status: "completed",
    },
  });

  const tokenA = await prisma.token.create({
    data: {
      tenantId: tenantA.id,
      residentId: residentA.id,
      name: "Token A",
    },
  });

  const tokenB = await prisma.token.create({
    data: {
      tenantId: tenantB.id,
      residentId: residentB.id,
      name: "Token B",
    },
  });

  return {
    tenantA,
    tenantB,
    orgA,
    orgB,
    residentA,
    residentB,
    unitA,
    unitB,
    paymentA,
    paymentB,
    tokenA,
    tokenB,
    profileA,
    profileB,
  };
}

export async function cleanupTwoTenants(seed?: TwoTenantSeed): Promise<void> {
  if (!seed) return;
  await prisma.tenant.deleteMany({
    where: { id: { in: [seed.tenantA.id, seed.tenantB.id] } },
  });
  await prisma.profile.deleteMany({
    where: { id: { in: [seed.profileA.id, seed.profileB.id] } },
  });
}

export function mockAuthContext(
  tenantId: string,
  userId: string,
  organizationId: string | null = null
) {
  return {
    userId,
    username: "test",
    email: "test@test.local",
    profileRole: "admin",
    ctx: {
      tenantId,
      organizationId,
      propertyId: null,
      membershipRole: "tenant_admin",
      organizationRole: "tenant_admin",
      userId,
      isPlatformAdmin: false,
    },
  };
}
