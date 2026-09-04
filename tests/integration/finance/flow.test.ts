import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { createFee, generateChargesForFee, getUnitBalance } from "@/lib/finance/fees";
import { registerPayment, voidPayment } from "@/lib/finance/payments";
import { moneyToNumber } from "@/lib/finance/money";
import { slugifyTenantName } from "@/lib/tenant/plans";

const hasDb = Boolean(process.env.DATABASE_URL);
const PREFIX = `fin-test-${Date.now()}`;

describe.skipIf(!hasDb)("finance flow integration", () => {
  let tenantId = "";
  let organizationId = "";
  let unitA = "";
  let unitB = "";
  let profileId = "";

  beforeAll(async () => {
    profileId = crypto.randomUUID();
    await prisma.profile.create({
      data: {
        id: profileId,
        username: `${PREFIX}-u`,
        email: `${PREFIX}@test.local`,
        role: "admin",
      },
    });

    const slug = slugifyTenantName(PREFIX);
    const tenant = await prisma.tenant.create({
      data: { name: PREFIX, slug, status: "ACTIVE" },
    });
    tenantId = tenant.id;

    const org = await prisma.organization.create({
      data: {
        tenantId,
        name: `${PREFIX} Org`,
        slug,
        status: "ACTIVE",
      },
    });
    organizationId = org.id;

    await prisma.tenantMembership.create({
      data: {
        tenantId,
        profileId,
        role: "tenant_admin",
        status: "active",
      },
    });
    await prisma.organizationMembership.create({
      data: {
        organizationId,
        profileId,
        role: "tenant_admin",
        status: "active",
      },
    });

    const property = await prisma.property.create({
      data: {
        tenantId,
        organizationId,
        name: "Prop",
        code: `${PREFIX}-P`,
      },
    });

    const u1 = await prisma.unit.create({
      data: { propertyId: property.id, code: "A-101", status: "occupied" },
    });
    const u2 = await prisma.unit.create({
      data: { propertyId: property.id, code: "A-102", status: "occupied" },
    });
    unitA = u1.id;
    unitB = u2.id;
  }, 60000);

  afterAll(async () => {
    if (tenantId) {
      await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => null);
    }
    if (profileId) {
      await prisma.profile.delete({ where: { id: profileId } }).catch(() => null);
    }
  });

  it("creates fee and generates charges without duplicates", async () => {
    const fee = await createFee({
      tenantId,
      organizationId,
      name: `Mant ${PREFIX}`,
      concept: "Mantenimiento",
      amount: 3500,
      dueDate: new Date(Date.now() + 86400000 * 15),
      createdById: profileId,
    });

    const first = await generateChargesForFee({
      feeId: fee.id,
      tenantId,
      organizationId,
      userId: profileId,
    });
    expect(first.created).toBe(2);

    const second = await generateChargesForFee({
      feeId: fee.id,
      tenantId,
      organizationId,
      userId: profileId,
    });
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(2);
  });

  it("full payment zeros balance and issues receipt", async () => {
    const unit = await prisma.unit.create({
      data: {
        propertyId: (await prisma.property.findFirst({
          where: { tenantId },
        }))!.id,
        code: "FULL-1",
        status: "occupied",
      },
    });

    const fee = await createFee({
      tenantId,
      organizationId,
      name: `Full ${PREFIX}`,
      concept: "Cargo full",
      amount: 3500,
      dueDate: new Date(Date.now() + 86400000 * 5),
      createdById: profileId,
    });
    await generateChargesForFee({
      feeId: fee.id,
      tenantId,
      organizationId,
      unitIds: [unit.id],
    });

    const result = await registerPayment({
      tenantId,
      organizationId,
      unitId: unit.id,
      amount: 3500,
      paymentMethod: "transfer",
      reference: "T-FULL",
      registeredByUserId: profileId,
    });

    expect(result.receipt.number).toMatch(/^REC-\d{4}-\d{6}$/);
    expect(result.balance.balance).toBe(0);
    expect(result.creditCreated).toBe(0);

    const charge = await prisma.charge.findFirst({
      where: { feeId: fee.id, unitId: unit.id },
    });
    expect(charge?.status).toBe("PAID");
    expect(moneyToNumber(charge!.outstandingAmount)).toBe(0);
  });

  it("partial payment leaves PARTIAL outstanding", async () => {
    const unit = await prisma.unit.create({
      data: {
        propertyId: (await prisma.property.findFirst({
          where: { tenantId },
        }))!.id,
        code: "PART-1",
        status: "occupied",
      },
    });

    const fee = await createFee({
      tenantId,
      organizationId,
      name: `Partial ${PREFIX}`,
      concept: "Cargo parcial",
      amount: 3500,
      dueDate: new Date(Date.now() + 86400000 * 5),
      createdById: profileId,
    });
    await generateChargesForFee({
      feeId: fee.id,
      tenantId,
      organizationId,
      unitIds: [unit.id],
    });

    await registerPayment({
      tenantId,
      organizationId,
      unitId: unit.id,
      amount: 2000,
      registeredByUserId: profileId,
    });

    const charge = await prisma.charge.findFirst({
      where: { feeId: fee.id, unitId: unit.id },
    });
    expect(charge?.status).toBe("PARTIAL");
    expect(moneyToNumber(charge!.outstandingAmount)).toBe(1500);

    const bal = await getUnitBalance(tenantId, organizationId, unit.id);
    expect(bal.totalOutstanding).toBe(1500);
  });

  it("applies payment across multiple charges oldest first", async () => {
    const unit = await prisma.unit.create({
      data: {
        propertyId: (await prisma.property.findFirst({
          where: { tenantId },
        }))!.id,
        code: "A-201",
        status: "occupied",
      },
    });

    const fee1 = await createFee({
      tenantId,
      organizationId,
      name: `Jan ${PREFIX}`,
      concept: "Enero",
      amount: 1000,
      dueDate: new Date(Date.now() - 86400000 * 40),
      createdById: profileId,
    });
    const fee2 = await createFee({
      tenantId,
      organizationId,
      name: `Feb ${PREFIX}`,
      concept: "Febrero",
      amount: 1000,
      dueDate: new Date(Date.now() - 86400000 * 10),
      createdById: profileId,
    });

    await generateChargesForFee({
      feeId: fee1.id,
      tenantId,
      organizationId,
      unitIds: [unit.id],
    });
    await generateChargesForFee({
      feeId: fee2.id,
      tenantId,
      organizationId,
      unitIds: [unit.id],
    });

    await registerPayment({
      tenantId,
      organizationId,
      unitId: unit.id,
      amount: 1500,
      registeredByUserId: profileId,
    });

    const c1 = await prisma.charge.findFirst({
      where: { feeId: fee1.id, unitId: unit.id },
    });
    const c2 = await prisma.charge.findFirst({
      where: { feeId: fee2.id, unitId: unit.id },
    });
    expect(c1?.status).toBe("PAID");
    expect(moneyToNumber(c2!.outstandingAmount)).toBe(500);
  });

  it("void restores debt and voids receipt", async () => {
    const unit = await prisma.unit.create({
      data: {
        propertyId: (await prisma.property.findFirst({
          where: { tenantId },
        }))!.id,
        code: "A-301",
        status: "occupied",
      },
    });

    const fee = await createFee({
      tenantId,
      organizationId,
      name: `Void ${PREFIX}`,
      concept: "Para anular",
      amount: 3500,
      dueDate: new Date(Date.now() + 86400000),
      createdById: profileId,
    });
    await generateChargesForFee({
      feeId: fee.id,
      tenantId,
      organizationId,
      unitIds: [unit.id],
    });

    const paid = await registerPayment({
      tenantId,
      organizationId,
      unitId: unit.id,
      amount: 3500,
      registeredByUserId: profileId,
    });

    await voidPayment({
      paymentId: paid.payment.id,
      tenantId,
      organizationId,
      userId: profileId,
      reason: "Error de captura",
    });

    const charge = await prisma.charge.findFirst({
      where: { feeId: fee.id, unitId: unit.id },
    });
    expect(moneyToNumber(charge!.outstandingAmount)).toBe(3500);

    const payment = await prisma.payment.findUnique({
      where: { id: paid.payment.id },
    });
    expect(payment?.status).toBe("VOID");

    const receipt = await prisma.receipt.findFirst({
      where: { paymentId: paid.payment.id },
    });
    expect(receipt?.status).toBe("VOID");
  });

  it("overpayment creates unit credit", async () => {
    const unit = await prisma.unit.create({
      data: {
        propertyId: (await prisma.property.findFirst({
          where: { tenantId },
        }))!.id,
        code: "A-401",
        status: "occupied",
      },
    });

    const fee = await createFee({
      tenantId,
      organizationId,
      name: `Credit ${PREFIX}`,
      concept: "Anticipo test",
      amount: 3500,
      dueDate: new Date(Date.now() + 86400000),
      createdById: profileId,
    });
    await generateChargesForFee({
      feeId: fee.id,
      tenantId,
      organizationId,
      unitIds: [unit.id],
    });

    const result = await registerPayment({
      tenantId,
      organizationId,
      unitId: unit.id,
      amount: 5000,
      registeredByUserId: profileId,
    });

    expect(result.creditCreated).toBe(1500);
    const bal = await getUnitBalance(tenantId, organizationId, unit.id);
    expect(bal.creditAvailable).toBe(1500);
    expect(bal.balance).toBe(0);
  });
});
